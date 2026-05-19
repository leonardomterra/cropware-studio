#!/usr/bin/env node
// scripts/upload-motion-reel-music.mjs
//
// Sobe MP3s de public/audio/ pro R2 via Cloudflare Worker do studio.
// Path R2: images/studio/_motion-reel/audio/{filename}.mp3 (sem userId —
// música é asset compartilhado do studio inteiro).
//
// Uso:
//   node scripts/upload-motion-reel-music.mjs                   # sobe todos
//   node scripts/upload-motion-reel-music.mjs viacheslav.mp3    # sobe um

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from '../motion-reel/voiceover-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function main() {
  const env = await loadDotEnv(PROJECT_ROOT);
  if (!env.R2_WORKER_URL) {
    console.error('⚠️  R2_WORKER_URL ausente no .env. Veja .env.example.');
    process.exit(1);
  }

  const audioDir = path.join(PROJECT_ROOT, 'public', 'audio');
  let files = await fs.readdir(audioDir).catch(() => []);
  if (process.argv[2]) files = files.filter(f => f.includes(process.argv[2]));
  files = files.filter(f => /\.mp3$/i.test(f));
  if (!files.length) {
    console.error(`Nenhum MP3 encontrado em ${audioDir}${process.argv[2] ? ` que case com "${process.argv[2]}"` : ''}.`);
    process.exit(1);
  }

  console.log(`📤 Subindo ${files.length} faixa(s) pra R2 via ${env.R2_WORKER_URL}\n`);

  for (const file of files) {
    const local = path.join(audioDir, file);
    const buf = await fs.readFile(local);
    const key = `images/studio/_motion-reel/audio/${file}`;
    const url = `${env.R2_WORKER_URL.replace(/\/$/, '')}/${key}`;
    process.stdout.write(`  ${file} (${(buf.length / 1024 / 1024).toFixed(2)} MB) → `);
    try {
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/mpeg' },
        body: buf,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
      console.log(`✓\n    ${url}`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }
  console.log('\nPronto. Use a URL completa no audio.music do storyboard.');
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
