import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateVoiceoverForStoryboard, loadDotEnv } from './motion-reel/voiceover-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = __dirname;

// Lê o body inteiro de uma request HTTP (POST JSON).
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Plugin que adiciona o endpoint POST /api/render-reel ao Vite dev server.
// Recebe { storyboard, reelId? } e responde com o MP4 binário.
const motionReelApi = {
  name: 'motion-reel-api',
  configureServer(server) {
    server.middlewares.use('/api/render-reel', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }
      try {
        const rawBody = await readBody(req);
        const { storyboard, reelId: rawReelId, skipVoiceover } = JSON.parse(rawBody || '{}');
        if (!storyboard || !Array.isArray(storyboard.scenes)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'storyboard.scenes ausente ou inválido.' }));
          return;
        }
        const reelId = (rawReelId || `reel-${Date.now()}`)
          .toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);

        console.log(`[render-reel] start id=${reelId} scenes=${storyboard.scenes.length}`);

        // 1. Voiceover — só se houver scene.voiceover.text e não estiver skipped.
        const env = await loadDotEnv(PROJECT_ROOT);
        const hasVoiceover = storyboard.scenes.some(s => s && s.voiceover && s.voiceover.text);
        let finalStoryboard = storyboard;
        if (hasVoiceover && !skipVoiceover) {
          if (!env.ELEVENLABS_API_KEY) {
            console.warn('[render-reel] voiceover pedido mas ELEVENLABS_API_KEY não configurada — pulando');
          } else {
            console.log(`[render-reel] gerando voiceover (ElevenLabs)...`);
            finalStoryboard = await generateVoiceoverForStoryboard(storyboard, {
              reelId, projectRoot: PROJECT_ROOT, env,
              onProgress: (p) => {
                const tag = `  [vo ${p.index + 1}/${p.total}] ${p.sceneId}`;
                if (p.status === 'done') console.log(`${tag}: ✓ ${(p.bytes / 1024).toFixed(0)} KB`);
                if (p.status === 'failed') console.log(`${tag}: ✗ ${p.error}`);
              },
            });
          }
        }

        // 2. Escreve storyboard temporário em disco — Remotion CLI precisa de --props=<file>.
        const tmpDir = path.join(PROJECT_ROOT, 'out', '.tmp');
        await fs.mkdir(tmpDir, { recursive: true });
        const propsPath = path.join(tmpDir, `${reelId}.props.json`);
        await fs.writeFile(propsPath, JSON.stringify({ storyboard: finalStoryboard }, null, 2));

        // 3. Render via Remotion CLI.
        const outDir = path.join(PROJECT_ROOT, 'out');
        await fs.mkdir(outDir, { recursive: true });
        const outPath = path.join(outDir, `${reelId}.mp4`);
        console.log(`[render-reel] iniciando Remotion render → ${outPath}`);

        const remotionBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'remotion');
        const args = ['render', 'motion-reel/index.js', 'MotionReel', outPath, `--props=${propsPath}`, '--gl=angle'];
        const child = spawn(remotionBin, args, { cwd: PROJECT_ROOT });

        let stderrBuf = '';
        child.stderr.on('data', d => { stderrBuf += d.toString(); });
        child.stdout.on('data', d => {
          const s = d.toString();
          // Sinaliza só linhas relevantes pro log do servidor (sem spam de Rendered N/total).
          const lastLine = s.split('\n').filter(l => l.trim()).pop();
          if (lastLine && !/Rendered \d/.test(lastLine)) console.log(`  [remotion] ${lastLine}`);
        });

        const exitCode = await new Promise(resolve => child.on('close', resolve));
        if (exitCode !== 0) {
          console.error(`[render-reel] Remotion falhou (exit ${exitCode}):`, stderrBuf.slice(0, 500));
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Remotion render falhou', details: stderrBuf.slice(0, 1000), exitCode }));
          return;
        }

        // 4. Streama o MP4 de volta como download.
        const stat = await fs.stat(outPath);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${reelId}.mp4"`);
        res.setHeader('Content-Length', stat.size);
        const buf = await fs.readFile(outPath);
        res.end(buf);

        console.log(`[render-reel] done id=${reelId} size=${(stat.size / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        console.error('[render-reel] erro:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), motionReelApi],
  server: { port: 5173 },
});
