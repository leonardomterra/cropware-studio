// SFX por nome — mapeia o vocabulário do nosso storyboard pros URLs.
//
// Catálogo combinado: SFX nativos do @remotion/sfx (remotion.media) +
// SFX curados do Pixabay hospedados no R2 do studio (R16). Tudo via
// path único `sfx` no transitionIn:
//
//   "transitionIn": { "type": "cinematic-blur", "dur": 0.5, "sfx": "impact-deep-cinematic" }
//
// Pra adicionar SFX custom: subir MP3 com `npm run reel:upload-sfx <file>`
// e adicionar entry no R2_SFX_MAP abaixo (script imprime as linhas prontas).
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

// R16 — SFX hospedados no R2 (Cloudflare Worker do studio). 14 sons curados
// no Pixabay em 5 categorias. Royalty-free, license Pixabay padrão.
const R2_SFX = 'https://cropware-r2-worker.leonardoterra-comercial.workers.dev/images/studio/_motion-reel/sfx';

const SFX_MAP = {
  // ── Legacy @remotion/sfx (mantidos pra compat com reels antigos) ──
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

  // ── Aliases semânticos legacy ──
  impact:       shutterModern, // flash/glitch: clique seco de obturador
  riser:        whip,           // zoom-in/ring-tunnel: subida tonal curta
  pop:          uiSwitch,       // pop micro de UI
  notification: ding,           // ding suave (end-card)
  cut:          mouseClick,     // corte seco quase imperceptível
  reveal:       shutterModern,  // momento "ta-da"

  // ── R16 SFX expandido (R2 Pixabay) ──
  // WHOOSH (3) — pra wipes, push, slide, drift
  'whoosh-soft':           `${R2_SFX}/whoosh-soft.mp3`,           // wipe-up/push-up calmo
  'whoosh-fast-cinematic': `${R2_SFX}/whoosh-fast-cinematic.mp3`, // cuts rápidos, light-streak
  'whoosh-deep':           `${R2_SFX}/whoosh-deep.mp3`,           // transição pesada, cinematic-blur

  // IMPACT (3) — pra cortes secos com peso, ring-tunnel, mask-circle
  'impact-deep-cinematic': `${R2_SFX}/impact-deep-cinematic.mp3`, // grande, ring-tunnel/zoom
  'impact-snap-dry':       `${R2_SFX}/impact-snap-dry.mp3`,       // seco, click no chapter
  'impact-thud':           `${R2_SFX}/impact-thud.mp3`,           // pesado mas curto, end-card

  // AMBIENT (2) — sons longos pra construir atmosfera (use sfxOffset negativo)
  'ambient-wind-soft':   `${R2_SFX}/ambient-wind-soft.mp3`,   // vento sutil pra scenario
  'ambient-field-nature': `${R2_SFX}/ambient-field-nature.mp3`, // som de campo (longo, 4MB)

  // ORGANIC (3) — texturas naturais, agro-friendly
  'leaf-rustle':     `${R2_SFX}/leaf-rustle.mp3`,     // folhagem, scenario/keyword orgânica
  'paper-turn':      `${R2_SFX}/paper-turn.mp3`,      // virar página, chapter/headline
  'wood-crack-soft': `${R2_SFX}/wood-crack-soft.mp3`, // estalo discreto, transição rústica

  // TECH/UI (3) — minimalistas, pra elementos de app/data
  'ui-tap-soft':       `${R2_SFX}/ui-tap-soft.mp3`,       // tap sutil, app-card
  'ui-confirm-modern': `${R2_SFX}/ui-confirm-modern.mp3`, // confirmação clean, whatsapp-chat
  'digital-beep-clean': `${R2_SFX}/digital-beep-clean.mp3`, // beep curto, notification moderna
};

// Resolve nome → URL. Aceita também URLs absolutas (passthrough) e paths
// relativos (/sfx/X) que o Vite/Remotion CLI servem do public/.
export function resolveSfxUrl(nameOrUrl) {
  if (!nameOrUrl) return null;
  const v = String(nameOrUrl).trim();
  if (/^(https?:|data:|\/)/.test(v)) return v;
  return SFX_MAP[v] || null;
}

// Volume default por família. Mantém SFX como textura discreta sob música e
// narração; scene.transitionIn.sfxVolume ainda pode sobrescrever pontualmente.
export function resolveSfxDefaultVolume(nameOrUrl) {
  if (!nameOrUrl) return 0.09;
  const v = String(nameOrUrl).trim();
  if (/ambient-/.test(v)) return 0.045;
  if (/^(leaf-rustle|paper-turn|wood-crack-soft)$/.test(v)) return 0.065;
  if (/^(ui-|digital-)/.test(v)) return 0.075;
  if (/^whoosh-/.test(v)) return 0.085;
  if (/^impact-/.test(v)) return 0.095;
  if (/^(ding|notification|pop|switch|click|cut)$/.test(v)) return 0.075;
  if (/^(impact|riser|whip|shutter|reveal|page-turn)$/.test(v)) return 0.09;
  if (/^(bruh|vine-boom|xp-error)$/.test(v)) return 0.065;
  return 0.09;
}

// Lista pública pra IA conhecer o vocabulário.
export const SFX_NAMES = Object.keys(SFX_MAP);
