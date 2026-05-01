#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_SUPABASE_URL = 'https://tzsmxhwvtobwkqffgsxo.supabase.co';
const DEFAULT_R2_WORKER_URL = 'https://cropware-r2-worker.leonardoterra-comercial.workers.dev';
const DATA_IMAGE_URI_RE = /^data:(image\/[\w.+-]+);base64,(.+)$/i;

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const skipBackup = args.has('--skip-backup');

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_WORKER_URL = process.env.R2_WORKER_URL || DEFAULT_R2_WORKER_URL;

if (!SERVICE_ROLE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run as: SUPABASE_SERVICE_ROLE_KEY=... npm run migrate:r2 -- --apply');
  process.exit(1);
}

function restUrl(pathAndQuery) {
  return `${SUPABASE_URL}/rest/v1/${pathAndQuery}`;
}

function restHeaders(extra = {}) {
  return {
    apikey: SERVICE_ROLE,
    authorization: `Bearer ${SERVICE_ROLE}`,
    ...extra,
  };
}

function safeStoragePart(value, fallback = 'item') {
  const cleaned = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

function imageExtFromMime(mime) {
  if (/png/i.test(mime)) return 'png';
  if (/webp/i.test(mime)) return 'webp';
  if (/gif/i.test(mime)) return 'gif';
  return 'jpg';
}

function base64ToBytes(base64) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

async function fetchPosts() {
  const resp = await fetch(restUrl('cropware_posts?select=id,session_id,post_data&order=created_at.asc'), {
    headers: restHeaders(),
  });
  if (!resp.ok) {
    throw new Error(`Supabase select failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

async function backupPosts(posts) {
  if (skipBackup) return null;
  const backupDir = resolve('backups');
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = resolve(backupDir, `cropware_posts_${stamp}.json`);
  await writeFile(path, JSON.stringify(posts, null, 2));
  return path;
}

async function uploadImageToR2(dataUri, ctx, path) {
  const match = String(dataUri || '').match(DATA_IMAGE_URI_RE);
  if (!match) throw new Error(`Invalid data image at ${path.join('.')}`);

  const [, mime, base64] = match;
  const ext = imageExtFromMime(mime);
  const safeUser = safeStoragePart(ctx.userId, 'user');
  const safePost = safeStoragePart(ctx.postId, 'post');
  const safeField = safeStoragePart(path.join('-') || 'image', 'image');
  const suffix = `${Date.now()}-${String(ctx.counter.n).padStart(3, '0')}`;
  const key = `images/studio/posts/${safeUser}/${safePost}/${safeField}-${suffix}.${ext}`;

  const resp = await fetch(`${R2_WORKER_URL}/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: base64ToBytes(base64),
  });

  if (!resp.ok) {
    throw new Error(`R2 upload failed for ${key}: ${resp.status} ${await resp.text()}`);
  }

  return `${R2_WORKER_URL}/${key}`;
}

async function migrateValue(value, ctx, path = []) {
  if (typeof value === 'string') {
    if (!DATA_IMAGE_URI_RE.test(value)) return value;
    ctx.counter.n += 1;
    if (!apply) {
      console.log(`  would upload ${path.join('.') || 'image'}`);
      return value;
    }
    const url = await uploadImageToR2(value, ctx, path);
    console.log(`  uploaded ${path.join('.') || 'image'} -> ${url}`);
    return url;
  }

  if (Array.isArray(value)) {
    const out = [];
    for (let i = 0; i < value.length; i++) {
      out.push(await migrateValue(value[i], ctx, [...path, String(i)]));
    }
    return out;
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = await migrateValue(child, ctx, [...path, key]);
    }
    return out;
  }

  return value;
}

function stripTransientPostData(value) {
  if (Array.isArray(value)) {
    return value.map(stripTransientPostData);
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === '_undoStack') continue;
      out[key] = stripTransientPostData(child);
    }
    return out;
  }

  return value;
}

async function updatePost(id, postData) {
  const resp = await fetch(restUrl(`cropware_posts?id=eq.${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: restHeaders({
      'content-type': 'application/json',
      prefer: 'return=minimal',
    }),
    body: JSON.stringify({
      post_data: postData,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!resp.ok) {
    throw new Error(`Supabase update failed for ${id}: ${resp.status} ${await resp.text()}`);
  }
}

const posts = await fetchPosts();
console.log(`Found ${posts.length} posts.`);

const backupPath = await backupPosts(posts);
if (backupPath) console.log(`Backup written to ${backupPath}`);

let changedPosts = 0;
let changedImages = 0;

for (const post of posts) {
  const ctx = {
    userId: post.session_id,
    postId: post.id,
    counter: { n: 0 },
  };

  console.log(`\nPost ${post.id}`);
  const strippedPostData = stripTransientPostData(post.post_data);
  const hadTransientData = JSON.stringify(strippedPostData) !== JSON.stringify(post.post_data);
  const migrated = await migrateValue(strippedPostData, ctx);

  if (ctx.counter.n === 0 && !hadTransientData) {
    console.log('  no base64 images');
    continue;
  }

  changedPosts += 1;
  changedImages += ctx.counter.n;

  if (apply) {
    await updatePost(post.id, migrated);
    console.log(`  updated Supabase (${ctx.counter.n} images${hadTransientData ? ', transient data removed' : ''})`);
  } else {
    console.log(`  dry-run only (${ctx.counter.n} images${hadTransientData ? ', transient data would be removed' : ''}). Re-run with --apply to update Supabase.`);
  }
}

console.log('\nDone.');
console.log(`Posts with base64: ${changedPosts}`);
console.log(`Images moved: ${changedImages}`);

if (!apply && changedImages > 0) {
  console.log('\nNo database rows were updated because --apply was not passed.');
}

if (apply && changedImages > 0) {
  console.log('\nNext: apply the anti-base64 trigger if not applied yet, then run VACUUM FULL public.cropware_posts; in Supabase SQL Editor.');
}
