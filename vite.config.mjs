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
        const { storyboard, reelId: rawReelId, userId: rawUserId, skipVoiceover } = JSON.parse(rawBody || '{}');
        if (!storyboard || !Array.isArray(storyboard.scenes)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'storyboard.scenes ausente ou inválido.' }));
          return;
        }
        const reelId = (rawReelId || `reel-${Date.now()}`)
          .toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
        const userId = (rawUserId || 'anon').toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 80) || 'anon';

        console.log(`[render-reel] start id=${reelId} user=${userId} scenes=${storyboard.scenes.length}`);

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
              reelId, userId, projectRoot: PROJECT_ROOT, env,
              onProgress: (p) => {
                if (p.status === 'summary') {
                  console.warn(`[render-reel] ⚠️  ${p.overflows.length} cena(s) com voiceover estourando:`);
                  p.overflows.forEach(o => {
                    console.warn(`  • ${o.sceneId}: ${o.durationSec.toFixed(2)}s > ${o.sceneDur.toFixed(2)}s (+${o.overlapSec.toFixed(2)}s)`);
                  });
                  return;
                }
                const tag = `  [vo ${p.index + 1}/${p.total}] ${p.sceneId}`;
                if (p.status === 'done') {
                  const flag = p.overflow ? ` ⚠️ +${p.overlapSec.toFixed(2)}s` : '';
                  const cache = p.fromCache ? ' (cache)' : '';
                  const r2 = p.r2Url ? ' (R2)' : (p.r2Error ? ` ⚠️ R2:${p.r2Error.slice(0, 40)}` : '');
                  console.log(`${tag}: ✓ ${(p.bytes / 1024).toFixed(0)} KB · ${p.durationSec.toFixed(2)}s/${p.sceneDur.toFixed(1)}s${flag}${cache}${r2}`);
                }
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

        // 4. Upload do MP4 pro R2 via Worker, devolve URL pro client baixar.
        // Se R2 indisponível ou upload falhar, faz fallback pro streaming
        // do binário (backward compat com browser antigo / sem net).
        const stat = await fs.stat(outPath);
        const sizeMb = stat.size / 1024 / 1024;
        let r2Url = null, r2Error = null;
        if (env.R2_WORKER_URL) {
          try {
            const key = `images/studio/_motion-reel/reels/${userId}/${reelId}.mp4`;
            const url = `${env.R2_WORKER_URL.replace(/\/$/, '')}/${key}`;
            const buf = await fs.readFile(outPath);
            const resp = await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'video/mp4' },
              body: buf,
            });
            if (!resp.ok) throw new Error(`R2 PUT ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
            r2Url = url;
            console.log(`[render-reel] MP4 R2: ${url}`);
          } catch (err) {
            r2Error = err.message;
            console.warn(`[render-reel] R2 upload falhou: ${err.message} — fallback pra streaming binário.`);
          }
        }
        if (r2Url) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: r2Url, sizeMb: Number(sizeMb.toFixed(2)), reelId }));
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Disposition', `attachment; filename="${reelId}.mp4"`);
          res.setHeader('Content-Length', stat.size);
          if (r2Error) res.setHeader('X-R2-Error', r2Error.slice(0, 200));
          const buf = await fs.readFile(outPath);
          res.end(buf);
        }

        console.log(`[render-reel] done id=${reelId} size=${sizeMb.toFixed(2)} MB ${r2Url ? '(R2)' : '(stream)'}`);
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
