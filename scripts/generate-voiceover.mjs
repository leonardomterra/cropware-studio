#!/usr/bin/env node
// scripts/generate-voiceover.mjs
//
// Wrapper CLI ao redor de motion-reel/voiceover-core.mjs.
// Usado pelo `npm run reel:voiceover -- <storyboard.json> [reelId]`.
//
// Para o uso "one-click" (via app), o Vite middleware chama o core
// diretamente — esse script aqui continua útil pra fluxo manual.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateVoiceoverForStoryboard, loadDotEnv } from '../motion-reel/voiceover-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function main() {
  const env = await loadDotEnv(PROJECT_ROOT);
  if (!env.ELEVENLABS_API_KEY) {
    console.error('⚠️  ELEVENLABS_API_KEY não definida. Copie .env.example → .env e preencha.');
    process.exit(1);
  }

  const inputPath = process.argv[2];
  const reelId = process.argv[3] || 'default';
  if (!inputPath) {
    console.error('Uso: node scripts/generate-voiceover.mjs <storyboard.json> [reelId]');
    process.exit(1);
  }
  const raw = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
  const storyboard = raw.storyboard || raw;
  if (!storyboard.scenes) {
    console.error('JSON inválido — esperava `scenes` array.');
    process.exit(1);
  }

  console.log(`🎙️  Gerando voiceover pra reel "${reelId}" (${storyboard.scenes.length} cenas)\n`);

  const updated = await generateVoiceoverForStoryboard(storyboard, {
    reelId,
    projectRoot: PROJECT_ROOT,
    env,
    onProgress: (p) => {
      const tag = `[${p.index + 1}/${p.total}] ${p.sceneId}`;
      if (p.status === 'skipped')    console.log(`  ${tag}: sem voiceover.text — pulando`);
      if (p.status === 'generating') process.stdout.write(`  ${tag}: gerando "${p.text.slice(0, 50)}${p.text.length > 50 ? '...' : ''}" ... `);
      if (p.status === 'done')       console.log(`✓ ${(p.bytes / 1024).toFixed(0)} KB`);
      if (p.status === 'failed')     console.log(`✗ FALHOU: ${p.error}`);
    },
  });

  const outJsonPath = inputPath.replace(/\.json$/, '.with-vo.json');
  const outPayload = raw.storyboard ? { ...raw, storyboard: updated } : updated;
  await fs.writeFile(outJsonPath, JSON.stringify(outPayload, null, 2));
  console.log(`\n✅ Pronto. Storyboard com URLs em: ${outJsonPath}`);
  console.log(`📁 MP3s em: public/voiceover/${reelId}/`);
  console.log(`\nPara renderizar com voiceover:`);
  console.log(`  npx remotion render motion-reel/index.js MotionReel out/${reelId}.mp4 \\`);
  console.log(`    --props=${outJsonPath} --gl=swangle\n`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
