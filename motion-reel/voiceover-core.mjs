// Núcleo reusável da geração de voiceover via ElevenLabs.
// Usado tanto pelo CLI (scripts/generate-voiceover.mjs) quanto pelo Vite
// middleware (/api/render-reel) — ambos chamam generateVoiceoverForStoryboard.
import fs from 'node:fs/promises';
import path from 'node:path';

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
  await fs.mkdir(outDir, { recursive: true });

  // Clona pra não mutar o input.
  const scenes = (storyboard.scenes || []).map(s => ({ ...s }));

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneId = scene.id || `scene-${i}`;
    if (!scene.voiceover || !scene.voiceover.text) {
      onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'skipped' });
      continue;
    }
    const voiceId = scene.voiceover.voiceId || defaultVoiceId;
    const filename = `${sceneId}.mp3`;
    const outPath = path.join(outDir, filename);
    onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'generating', text: scene.voiceover.text });
    try {
      const mp3 = await callElevenLabsTts({
        text: scene.voiceover.text,
        voiceId, modelId, apiKey,
      });
      await fs.writeFile(outPath, mp3);
      const staticPath = `voiceover/${reelId}/${filename}`;
      scene.voiceover = { ...scene.voiceover, url: staticPath };
      onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'done', bytes: mp3.length });
    } catch (err) {
      onProgress && onProgress({ index: i, total: scenes.length, sceneId, status: 'failed', error: err.message });
      // Continua nas demais cenas pra não derrubar o reel todo.
    }
  }

  return { ...storyboard, scenes };
}

// Helper: carrega .env manualmente (sem dep extra).
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
  // process.env tem prioridade sobre .env
  for (const k of Object.keys(env)) {
    if (process.env[k]) env[k] = process.env[k];
  }
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('ELEVENLABS_') && !env[k]) env[k] = process.env[k];
  }
  return env;
}
