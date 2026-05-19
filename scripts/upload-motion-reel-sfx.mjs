#!/usr/bin/env node
// scripts/upload-motion-reel-sfx.mjs
//
// Sobe MP3s de SFX pro R2 via Cloudflare Worker do studio.
// Path R2: images/studio/_motion-reel/sfx/{filename}.mp3
// (sem userId — SFX são assets compartilhados do studio inteiro).
//
// Uso:
//   node scripts/upload-motion-reel-sfx.mjs <dir-ou-arquivo> [<dir-ou-arquivo>...]
//   node scripts/upload-motion-reel-sfx.mjs ~/sfx-pixabay/        # batch dir
//   node scripts/upload-motion-reel-sfx.mjs whoosh-soft.mp3       # arquivo único
//
// Imprime as URLs R2 finais — copie pra motion-reel/sfx.js (SFX_MAP).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from '../motion-reel/voiceover-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function collectMp3s(arg) {
  const stat = await fs.stat(arg).catch(() => null);
  if (!stat) {
    console.error(`  ⚠️  caminho não existe: ${arg}`);
    return [];
  }
  if (stat.isDirectory()) {
    const entries = await fs.readdir(arg);
    return entries
      .filter(f => /\.mp3$/i.test(f))
      .map(f => path.join(arg, f));
  }
  if (/\.mp3$/i.test(arg)) return [arg];
  return [];
}

async function main() {
  const env = await loadDotEnv(PROJECT_ROOT);
  if (!env.R2_WORKER_URL) {
    console.error('⚠️  R2_WORKER_URL ausente no .env. Veja .env.example.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node scripts/upload-motion-reel-sfx.mjs <dir-ou-arquivo>...');
    console.error('Ex:  node scripts/upload-motion-reel-sfx.mjs ~/sfx-pixabay/');
    process.exit(1);
  }

  const files = [];
  for (const a of args) {
    const ms = await collectMp3s(path.resolve(a));
    files.push(...ms);
  }
  if (!files.length) {
    console.error('Nenhum MP3 encontrado nos caminhos passados.');
    process.exit(1);
  }

  console.log(`📤 Subindo ${files.length} SFX pra R2 via ${env.R2_WORKER_URL}\n`);
  const results = [];

  for (const local of files) {
    const filename = path.basename(local);
    const buf = await fs.readFile(local);
    const key = `images/studio/_motion-reel/sfx/${filename}`;
    const url = `${env.R2_WORKER_URL.replace(/\/$/, '')}/${key}`;
    process.stdout.write(`  ${filename} (${(buf.length / 1024).toFixed(1)} KB) → `);
    try {
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/mpeg' },
        body: buf,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
      console.log('✓');
      results.push({ filename, url });
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }

  if (results.length) {
    console.log('\n─── Pra colar em motion-reel/sfx.js (SFX_MAP) ───');
    console.log(`const R2_SFX = '${env.R2_WORKER_URL.replace(/\/$/, '')}/images/studio/_motion-reel/sfx';`);
    results.forEach(({ filename }) => {
      const slug = filename.replace(/\.mp3$/i, '');
      console.log(`  '${slug}': \`\${R2_SFX}/${filename}\`,`);
    });
    console.log('');
  }
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
