// SFX por nome — mapeia o vocabulário do nosso storyboard pros URLs
// hospedados pelo @remotion/sfx (https://remotion.media/*.wav).
//
// Uso no storyboard:
//   "transitionIn": { "type": "wipe-up", "dur": 0.5, "sfx": "whoosh" }
//
// Os nomes simples ("whoosh", "click", "ding"...) viraram aliases pros
// exports do @remotion/sfx. Pra adicionar SFX custom, basta hospedar o
// .wav/.mp3 em public/sfx/ e usar "sfx": "/sfx/meu-som.wav".
import {
  whip,
  whoosh,
  pageTurn,
  uiSwitch,
  mouseClick,
  shutterModern,
  shutterOld,
  ding,
  bruh,
  vineBoom,
  windowsXpError,
} from '@remotion/sfx';

const SFX_MAP = {
  whip,
  whoosh,
  'page-turn': pageTurn,
  switch:      uiSwitch,
  click:       mouseClick,
  shutter:     shutterModern,
  'shutter-old': shutterOld,
  ding,
  bruh,
  'vine-boom': vineBoom,
  'xp-error':  windowsXpError,
  // Aliases semânticos pros tipos de transição — escolhidos pra ficar
  // ELEGANTES, sem soar memes/comédia. (`vine-boom` é o tradicional som
  // de "explosão de meme" — só use se quiser estética cômica explícita.)
  impact:       shutterModern, // flash/glitch: clique seco de obturador, não boom
  riser:        whip,           // zoom-in/ring-tunnel: subida tonal curta
  pop:          uiSwitch,       // pop micro de UI
  notification: ding,           // ding suave (end-card)
  cut:          mouseClick,     // corte seco quase imperceptível
  reveal:       shutterModern,  // momento "ta-da"
};

// Resolve nome → URL. Aceita também URLs absolutas (passthrough) e paths
// relativos (/sfx/X) que o Vite/Remotion CLI servem do public/.
export function resolveSfxUrl(nameOrUrl) {
  if (!nameOrUrl) return null;
  const v = String(nameOrUrl).trim();
  if (/^(https?:|data:|\/)/.test(v)) return v;
  return SFX_MAP[v] || null;
}

// Lista pública pra IA conhecer o vocabulário.
export const SFX_NAMES = Object.keys(SFX_MAP);
