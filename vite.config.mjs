import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateVoiceoverForStoryboard, loadDotEnv } from './motion-reel/voiceover-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = __dirname;
let activeMotionReelRender = null;
let activeRenderChild = null;
let activeRenderCancelled = false;

function sendProgress(res, payload) {
  res.write(`${JSON.stringify({ ts: Date.now(), ...payload })}\n`);
}

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
    server.middlewares.use('/api/render-reel-output', async (req, res) => {
      if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed. Use GET.' }));
        return;
      }
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        const rawReelId = url.searchParams.get('reelId') || '';
        const reelId = rawReelId.toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
        if (!reelId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'reelId ausente.' }));
          return;
        }
        const outPath = path.join(PROJECT_ROOT, 'out', `${reelId}.mp4`);
        const stat = await fs.stat(outPath);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${reelId}.mp4"`);
        res.setHeader('Content-Length', stat.size);
        res.end(await fs.readFile(outPath));
      } catch (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
    });

    server.middlewares.use('/api/render-reel', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }
      let requestRenderKey = null;
      let progressMode = false;
      try {
        const rawBody = await readBody(req);
        const { storyboard, reelId: rawReelId, userId: rawUserId, skipVoiceover, progress } = JSON.parse(rawBody || '{}');
        progressMode = progress === true;
        if (!storyboard || !Array.isArray(storyboard.scenes)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'storyboard.scenes ausente ou inválido.' }));
          return;
        }
        const reelId = (rawReelId || `reel-${Date.now()}`)
          .toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);
        const userId = (rawUserId || 'anon').toString().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 80) || 'anon';
        const renderKey = `${userId}/${reelId}`;
        if (activeMotionReelRender) {
          res.statusCode = 409;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: `Render já em andamento (${activeMotionReelRender}). Aguarde terminar antes de iniciar outro.`,
          }));
          return;
        }
        requestRenderKey = renderKey;
        activeMotionReelRender = renderKey;

        console.log(`[render-reel] start id=${reelId} user=${userId} scenes=${storyboard.scenes.length}`);
        if (progressMode) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          sendProgress(res, { type: 'stage', stage: 'start', progress: 2, message: 'Preparando render do MP4...' });
        }

        // 1. Voiceover — só se houver scene.voiceover.text e não estiver skipped.
        const env = await loadDotEnv(PROJECT_ROOT);
        const hasVoiceover = storyboard.scenes.some(s => s && s.voiceover && s.voiceover.text);
        let finalStoryboard = storyboard;
        if (hasVoiceover && !skipVoiceover) {
          if (!env.ELEVENLABS_API_KEY) {
            const message = 'Voiceover solicitado, mas ELEVENLABS_API_KEY não está configurada.';
            const detail = 'Crie um arquivo .env na raiz do projeto com ELEVENLABS_API_KEY e reinicie o npm run dev.';
            console.warn(`[render-reel] ${message}`);
            if (progressMode) {
              sendProgress(res, { type: 'error', stage: 'voiceover', progress: 0, message, detail });
              res.end();
              return;
            }
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message, details: detail }));
            return;
          } else {
            console.log(`[render-reel] gerando voiceover (ElevenLabs)...`);
            if (progressMode) sendProgress(res, { type: 'stage', stage: 'voiceover', progress: 6, message: 'Gerando narração com ElevenLabs...' });
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
                  if (progressMode) {
                    sendProgress(res, {
                      type: 'voiceover',
                      stage: 'voiceover',
                      progress: Math.min(20, 6 + ((p.index + 1) / p.total) * 14),
                      message: `Narração ${p.index + 1}/${p.total}: ${p.sceneId}`,
                      detail: `${(p.bytes / 1024).toFixed(0)} KB${p.fromCache ? ' · cache' : ''}`,
                    });
                  }
                }
                if (p.status === 'failed') {
                  console.log(`${tag}: ✗ ${p.error}`);
                  if (progressMode) sendProgress(res, { type: 'warn', stage: 'voiceover', progress: 18, message: `Falha na narração de ${p.sceneId}`, detail: p.error });
                }
              },
            });
          }
        } else if (progressMode) {
          sendProgress(res, { type: 'stage', stage: 'voiceover-none', progress: 18, message: 'Sem narração para gerar. Preparando render...' });
        }

        // 2. Escreve storyboard temporário em disco — Remotion CLI precisa de --props=<file>.
        if (progressMode) sendProgress(res, { type: 'stage', stage: 'props', progress: 22, message: 'Preparando composição Remotion...' });
        const tmpDir = path.join(PROJECT_ROOT, 'out', '.tmp');
        await fs.mkdir(tmpDir, { recursive: true });
        const propsPath = path.join(tmpDir, `${reelId}.props.json`);
        await fs.writeFile(propsPath, JSON.stringify({ storyboard: finalStoryboard }, null, 2));

        // 3. Render via Remotion CLI.
        const outDir = path.join(PROJECT_ROOT, 'out');
        await fs.mkdir(outDir, { recursive: true });
        const outPath = path.join(outDir, `${reelId}.mp4`);
        console.log(`[render-reel] iniciando Remotion render → ${outPath}`);
        if (progressMode) sendProgress(res, { type: 'stage', stage: 'render', progress: 25, message: 'Iniciando Remotion...' });

        const remotionBin = path.join(
          PROJECT_ROOT,
          'node_modules',
          '.bin',
          process.platform === 'win32' ? 'remotion.cmd' : 'remotion'
        );
        const args = ['render', 'motion-reel/index.js', 'MotionReel', outPath, `--props=${propsPath}`, '--gl=angle'];
        const child = spawn(remotionBin, args, {
          cwd: PROJECT_ROOT,
          windowsHide: true,
          shell: process.platform === 'win32',
        });
        activeRenderChild = child;

        let stderrBuf = '';
        let lastRenderProgress = 25;
        let sawEncodingProgress = false;
        const renderStartedAt = Date.now();
        const heartbeat = progressMode ? setInterval(() => {
          if (sawEncodingProgress) return;
          const elapsedSec = Math.max(0, (Date.now() - renderStartedAt) / 1000);
          const estimate = Math.min(88, 36 + elapsedSec * 0.28);
          if (estimate > lastRenderProgress + 1) {
            lastRenderProgress = estimate;
            sendProgress(res, {
              type: 'render',
              stage: 'rendering',
              progress: estimate,
              message: 'Renderizando MP4...',
              detail: 'O Remotion ainda está trabalhando.\nEsta etapa pode ficar silenciosa por alguns minutos.',
            });
          }
        }, 5000) : null;
        child.stderr.on('data', d => { stderrBuf += d.toString(); });
        child.stdout.on('data', d => {
          const s = d.toString();
          const lines = s.split(/[\r\n]+/).filter(l => l.trim());
          lines.forEach(line => {
            // Sinaliza só linhas relevantes pro log do servidor (sem spam de Rendered N/total).
            if (!/Rendered \d/.test(line)) console.log(`  [remotion] ${line}`);
            if (!progressMode) return;
            const bundling = line.match(/Bundling\s+(\d+)%/i);
            if (bundling) {
              const pct = Number(bundling[1]) || 0;
              sendProgress(res, {
                type: 'render',
                stage: 'bundling',
                progress: Math.max(lastRenderProgress, Math.min(35, 25 + pct * 0.10)),
                message: `Empacotando composição (${pct}%)...`,
              });
              return;
            }
            const encoded = line.match(/Encoded\s+(\d+)\/(\d+)/i);
            if (encoded) {
              sawEncodingProgress = true;
              const done = Number(encoded[1]) || 0;
              const total = Number(encoded[2]) || 1;
              sendProgress(res, {
                type: 'render',
                stage: 'encoding',
                progress: Math.max(lastRenderProgress, Math.min(92, 35 + (done / total) * 57)),
                message: `Renderizando frames ${done}/${total}...`,
                framesDone: done,
                framesTotal: total,
              });
              return;
            }
            if (/Getting composition/i.test(line)) {
              sendProgress(res, { type: 'render', stage: 'composition', progress: 36, message: 'Carregando composição...' });
            }
          });
        });

        const exitCode = await new Promise((resolve) => {
          child.on('error', (err) => {
            stderrBuf += `\n${err.stack || err.message || String(err)}`;
            resolve(1);
          });
          child.on('close', resolve);
        });
        if (heartbeat) clearInterval(heartbeat);
        activeRenderChild = null;
        if (activeRenderCancelled) {
          console.log('[render-reel] cancelado pelo usuário.');
          if (progressMode) {
            sendProgress(res, { type: 'cancelled', stage: 'cancelled', progress: 0, message: 'Render cancelado.' });
            res.end();
            return;
          }
          res.statusCode = 499;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Render cancelado pelo usuário.' }));
          return;
        }
        if (exitCode !== 0) {
          console.error(`[render-reel] Remotion falhou (exit ${exitCode}):`, stderrBuf.slice(0, 500));
          if (progressMode) {
            sendProgress(res, { type: 'error', stage: 'render', progress: 0, message: 'Remotion render falhou.', detail: stderrBuf.slice(0, 1000), exitCode });
            res.end();
            return;
          }
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
            if (progressMode) sendProgress(res, { type: 'stage', stage: 'upload', progress: 94, message: 'Subindo MP4 para Cloudflare R2...' });
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
        if (progressMode) {
          const finalUrl = r2Url || `/api/render-reel-output?reelId=${encodeURIComponent(reelId)}`;
          sendProgress(res, {
            type: 'done',
            stage: 'done',
            progress: 100,
            message: 'MP4 pronto.',
            url: finalUrl,
            sizeMb: Number(sizeMb.toFixed(2)),
            reelId,
            r2: Boolean(r2Url),
            ...(r2Error ? { r2Error: r2Error.slice(0, 200) } : {}),
          });
          res.end();
          console.log(`[render-reel] done id=${reelId} size=${sizeMb.toFixed(2)} MB ${r2Url ? '(R2)' : '(local-url)'}`);
          return;
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
        if (progressMode && !res.writableEnded) {
          sendProgress(res, { type: 'error', stage: 'error', progress: 0, message: err.message || String(err) });
          res.end();
          return;
        }
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || String(err) }));
      } finally {
        if (activeMotionReelRender === requestRenderKey) {
          activeMotionReelRender = null;
          activeRenderChild = null;
          activeRenderCancelled = false;
        }
      }
    });

    server.middlewares.use('/api/render-reel-cancel', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
        return;
      }
      if (!activeRenderChild) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Nenhum render em andamento.' }));
        return;
      }
      activeRenderCancelled = true;
      try {
        if (process.platform === 'win32') {
          // No Windows, child foi via shell — usa taskkill no PID + filhos.
          spawn('taskkill', ['/PID', String(activeRenderChild.pid), '/T', '/F'], { windowsHide: true });
        } else {
          activeRenderChild.kill('SIGTERM');
        }
        console.log('[render-reel] cancel solicitado, matando processo.');
      } catch (err) {
        console.warn('[render-reel] erro ao matar processo:', err.message);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
  },
};

export default defineConfig({
  plugins: [react(), motionReelApi],
  server: { port: 5173 },
});
