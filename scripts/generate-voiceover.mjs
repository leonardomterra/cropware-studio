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
  const userId = process.argv[4] || 'cli';
  if (!inputPath) {
    console.error('Uso: node scripts/generate-voiceover.mjs <storyboard.json> [reelId] [userId]');
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
    userId,
    projectRoot: PROJECT_ROOT,
    env,
    onProgress: (p) => {
      if (p.status === 'summary') {
        console.log(`\n⚠️  ${p.overflows.length} cena(s) com voiceover ESTOURANDO a janela (text mais longo que dur):`);
        p.overflows.forEach(o => {
          console.log(`     • ${o.sceneId}: ${o.durationSec.toFixed(2)}s falados > ${o.sceneDur.toFixed(2)}s de cena (+${o.overlapSec.toFixed(2)}s vazando)`);
        });
        console.log(`     → encurte o voiceover.text dessas cenas no JSON (ou alongue a cena)\n`);
        return;
      }
      const tag = `[${p.index + 1}/${p.total}] ${p.sceneId}`;
      if (p.status === 'skipped')    console.log(`  ${tag}: sem voiceover.text — pulando`);
      if (p.status === 'generating') process.stdout.write(`  ${tag}: gerando "${p.text.slice(0, 50)}${p.text.length > 50 ? '...' : ''}" ... `);
      if (p.status === 'done') {
        const sizeKb = (p.bytes / 1024).toFixed(0);
        const dur = `${p.durationSec.toFixed(2)}s/${p.sceneDur.toFixed(1)}s`;
        const flag = p.overflow ? ` ⚠️  +${p.overlapSec.toFixed(2)}s estourando` : '';
        const cache = p.fromCache ? ' (cache)' : '';
        const r2 = p.r2Url ? ' (R2)' : (p.r2Error ? ` ⚠️  R2:${p.r2Error.slice(0, 40)}` : '');
        console.log(`✓ ${sizeKb} KB · ${dur}${flag}${cache}${r2}`);
      }
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
