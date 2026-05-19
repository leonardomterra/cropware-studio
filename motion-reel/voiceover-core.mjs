// Núcleo reusável da geração de voiceover via ElevenLabs.
// Usado tanto pelo CLI (scripts/generate-voiceover.mjs) quanto pelo Vite
// middleware (/api/render-reel) — ambos chamam generateVoiceoverForStoryboard.
//
// Requer plano Starter ou superior pra usar library voices via API
// (Free tier só libera premade voices, que não soam pt-BR nativo).
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Estimativa rápida de duração da fala a partir do texto.
// PT-BR a ritmo natural ≈ 15 chars/s (~180 wpm × ~5 chars/palavra).
// Aproximação suficiente pra avisar overflow em janela de cena —
// independe de bitrate/encoding do provider.
export function estimateTtsDurationSec(text, speakingRate = 1.0) {
  if (!text) return 0;
  const rate = Math.max(0.25, Math.min(4.0, Number(speakingRate) || 1.0));
  return (text.length / 15) / rate;
}

// Quanto silêncio queremos no fim da cena antes de cortar pra próxima —
// evita TTS vazar na transição.
const VO_TAIL_SAFETY_SEC = 0.4;

// Hash do conteúdo que determina unicidade de um MP3 gerado. Se mudar
// voice_settings no callElevenLabsTts (hoje hardcoded), incluir aqui também
// ou flushar o cache manualmente em public/voiceover/_cache/.
function ttsCacheKey({ text, voiceId, modelId }) {
  const h = crypto.createHash('sha256');
  h.update([voiceId, modelId, text].join('\n'));
  return h.digest('hex').slice(0, 24);
}

// Chama a API da ElevenLabs e retorna o MP3 como Buffer.
export async function callElevenLabsTts({ text, voiceId, modelId, apiKey, voiceSettings }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: voiceSettings || { stability: 0.5, similarity_boost: 0.7, style: 0.2 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`ElevenLabs ${resp.status}: ${err.slice(0, 300)}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

// Gera todos os MP3s de um storyboard, salva em public/voiceover/{reelId}/
// e devolve uma cópia do storyboard com scene.voiceover.url preenchido.
//
// opts:
//   reelId       — slug pra subpasta (ex 'demo' ou 'meu-reel-ndvi')
//   projectRoot  — caminho absoluto da raiz do projeto Cropware
//   env          — { ELEVENLABS_API_KEY, ELEVENLABS_DEFAULT_VOICE_ID, ELEVENLABS_MODEL_ID }
//   onProgress?  — fn(progress) chamado a cada cena (pra logs/SSE futuro)
export async function generateVoiceoverForStoryboard(storyboard, opts) {
  const { reelId, projectRoot, env, onProgress } = opts;
  if (!env || !env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY ausente — não dá pra gerar voiceover.');
  }
  const apiKey = env.ELEVENLABS_API_KEY;
  const defaultVoiceId = env.ELEVENLABS_DEFAULT_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
  const modelId = env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

  const outDir = path.join(projectRoot, 'public', 'voiceover', reelId);
  const cacheDir = path.join(projectRoot, 'public', 'voiceover', '_cache');
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(cacheDir, { recursive: true });

  const scenes = (storyboard.scenes || []).map(s => ({ ...s }));
  const overflows = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneId = scene.id || `scene-${i}`;
    if (!scene.voiceover || !scene.voiceover.text) {
      onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'skipped' });
      continue;
    }
    const voiceId = scene.voiceover.voiceId || defaultVoiceId;
    const speakingRate = scene.voiceover.speakingRate || 1.0;
    const filename = `${sceneId}.mp3`;
    const outPath = path.join(outDir, filename);
    const cachePath = path.join(cacheDir, `${ttsCacheKey({ text: scene.voiceover.text, voiceId, modelId })}.mp3`);
    onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'generating', text: scene.voiceover.text });
    try {
      let mp3, fromCache = false;
      try {
        mp3 = await fs.readFile(cachePath);
        fromCache = true;
      } catch {
        mp3 = await callElevenLabsTts({
          text: scene.voiceover.text,
          voiceId, modelId, apiKey,
        });
        await fs.writeFile(cachePath, mp3);
      }
      await fs.writeFile(outPath, mp3);
      const staticPath = `voiceover/${reelId}/${filename}`;
      const durationSec = estimateTtsDurationSec(scene.voiceover.text, speakingRate);
      const sceneDur = Math.max(0, Number(scene.end || 0) - Number(scene.start || 0));
      const safeMaxDur = Math.max(0, sceneDur - VO_TAIL_SAFETY_SEC);
      const overlapSec = Math.max(0, durationSec - safeMaxDur);
      const overflow = overlapSec > 0;
      scene.voiceover = {
        ...scene.voiceover,
        url: staticPath,
        durationSec: Number(durationSec.toFixed(2)),
        ...(overflow ? { overflow: true, overlapSec: Number(overlapSec.toFixed(2)) } : {}),
      };
      if (overflow) overflows.push({ sceneId, sceneDur, durationSec, overlapSec });
      onProgress && onProgress({
        index: i, total: scenes.length, sceneId, status: 'done',
        bytes: mp3.length, fromCache,
        durationSec, sceneDur, overflow, overlapSec,
      });
    } catch (err) {
      onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'failed', error: err.message });
      // Continua nas demais cenas pra não derrubar o reel todo.
    }
  }

  if (overflows.length && onProgress) {
    onProgress({ status: 'summary', overflows });
  }

  return { ...storyboard, scenes };
}

// Helper: carrega .env manualmente (sem dep extra).
// Prioridade: process.env > .env.
export async function loadDotEnv(projectRoot) {
  const env = {};
  try {
    const txt = await fs.readFile(path.join(projectRoot, '.env'), 'utf-8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      env[k] = v.trim().replace(/^"(.*)"$/, '$1');
    }
  } catch { /* sem .env */ }
  // process.env tem prioridade
  for (const k of Object.keys(env)) {
    if (process.env[k]) env[k] = process.env[k];
  }
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('ELEVENLABS_') && !env[k]) env[k] = process.env[k];
  }
  return env;
}
