// Helpers compartilhados pelos componentes de cena — todos lendo o
// useCurrentFrame() local da própria Sequence (graças ao TransitionSeries,
// cada cena começa em frame 0).
import { Fragment, useEffect, useState } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, AbsoluteFill, spring, delayRender, continueRender, staticFile } from 'remotion';
import { Icon as RawIconifyIcon, loadIcons, iconLoaded } from '@iconify/react';
import { Lottie } from '@remotion/lottie';
import { resolveColor } from './theme.js';

// Remotion's Easing só tem linear/ease/quad/cubic/bezier/bounce/elastic/back.
// Easing.quart e Easing.quint NÃO existem — definimos via bezier equivalente
// (mesmas curvas do easings.net que usávamos no motor antigo).
export const EASE = {
  outQuart:    Easing.bezier(0.25, 1, 0.5, 1),
  outQuint:    Easing.bezier(0.22, 1, 0.36, 1),
  outExpo:     Easing.bezier(0.16, 1, 0.3, 1),
  inOutQuart:  Easing.bezier(0.76, 0, 0.24, 1),
  inOutCubic:  Easing.bezier(0.65, 0, 0.35, 1),
  inOutExpo:   Easing.bezier(0.87, 0, 0.13, 1),
  outBack:     Easing.bezier(0.34, 1.56, 0.64, 1),
};

// Resolve easing por nome (mesmo vocabulário do storyboard JSON).
// Aceita string ('in-out-cubic'), função (passa direto), ou nada (default).
export function resolveEasingName(name) {
  if (typeof name === 'function') return name;
  switch (name) {
    case 'linear':       return Easing.linear;
    case 'in-out-quart': return EASE.inOutQuart;
    case 'out-quint':    return EASE.outQuint;
    case 'out-quart':    return EASE.outQuart;
    case 'in-out-cubic': return EASE.inOutCubic;
    case 'out-expo':     return EASE.outExpo;
    case 'in-out-expo':  return EASE.inOutExpo;
    case 'out-back':     return EASE.outBack;
    default:             return EASE.inOutCubic;
  }
}

// CharReveal: quebra `text` em spans e revela cada char com stagger.
// IMPORTANTE: agrupa chars por palavra dentro de wrappers `white-space: nowrap`
// pra evitar que o browser quebre linha NO MEIO de palavras (cada char é
// inline-block, e browsers permitem break entre inline-blocks por padrão).
// Espaços ficam como texto normal entre palavras — esses sim podem quebrar.
// Quebra o texto em 2 linhas de tamanho similar: acha o ponto entre palavras
// que minimiza a diferença de comprimento entre as metades. Garante 2 linhas
// equilibradas independente do comprimento. 1 palavra → retorna sem quebra.
export function balanceTwoLines(text) {
  const t = String(text || '').trim();
  const words = t.split(/\s+/);
  if (words.length < 2) return t;
  let bestIdx = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ').length;
    const right = words.slice(i).join(' ').length;
    const diff = Math.abs(left - right);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  }
  return words.slice(0, bestIdx).join(' ') + '\n' + words.slice(bestIdx).join(' ');
}

export const CharReveal = ({ text, delay = 0, dur = 0.35, stagger = 0.035, ty = 24, charStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const durF = dur * fps;
  const staggerF = stagger * fps;
  const text2 = text || '';
  // Splits mantendo espaços como segmentos próprios.
  const segments = text2.split(/(\s+)/);
  let cursor = 0;
  return (
    <Fragment>
      {segments.map((seg, si) => {
        if (seg === '') return null;
        // Whitespace puro — render como texto plain, browser permite quebra aqui.
        // Se contém \n (quebra explícita, ex: headline balanceado), força <br>.
        if (/^\s+$/.test(seg)) {
          cursor += seg.length;
          if (seg.includes('\n')) return <br key={si} />;
          return <Fragment key={si}>{seg}</Fragment>;
        }
        // Palavra — agrupa chars em wrapper nowrap pra não quebrar internamente
        const startIdx = cursor;
        cursor += seg.length;
        return (
          <span key={si} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...seg].map((ch, ci) => {
              const myIdx = startIdx + ci;
              const start = delayF + myIdx * staggerF;
              const p = interpolate(frame, [start, start + durF], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: EASE.outQuart,
              });
              return (
                <span key={ci} style={{
                  display: 'inline-block',
                  opacity: p,
                  transform: `translateY(${(1 - p) * ty}px)`,
                  ...(charStyle || {}),
                }}>{ch}</span>
              );
            })}
          </span>
        );
      })}
    </Fragment>
  );
};

// KickerReveal: opacity + letter-spacing expanding. Pra textos em mono
// uppercase que "respiram" entrando.
export const KickerReveal = ({ text, delay = 0, dur = 0.5, fromEm = 0.15, toEm = 0.4, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const durF = dur * fps;
  const p = interpolate(frame, [delayF, delayF + durF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{
      opacity: p,
      letterSpacing: `${fromEm + (toEm - fromEm) * p}em`,
      // text-wrap: balance distribui as palavras pra deixar linhas com largura
      // próxima quando o texto quebra (kickers longos como "GESTAO NA PALMA
      // DA MAO"). No-op em textos sem quebra.
      textWrap: 'balance',
      ...style,
    }}>{text}</div>
  );
};

// FadeSlide: opacity + translateY combo. Para pré-headlines / labels.
export const FadeSlide = ({ children, delay = 0, dur = 0.4, ty = 30, easing, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const durF = dur * fps;
  const p = interpolate(frame, [delayF, delayF + durF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easing || EASE.outQuint,
  });
  return (
    <div style={{
      opacity: p,
      transform: `translateY(${(1 - p) * ty}px)`,
      ...style,
    }}>{children}</div>
  );
};

// HorizontalClipReveal: revela conteúdo via clip-path inset(0 X% 0 0).
// Boa pra frases longas que deslizam da esquerda pra direita.
export const HorizontalClipReveal = ({ children, delay = 0, dur = 0.75, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const durF = dur * fps;
  const p = interpolate(frame, [delayF, delayF + durF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.76, 0, 0.24, 1),
  });
  return (
    <div style={{
      clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
      ...style,
    }}>{children}</div>
  );
};

// AccentBar: scaleX 0→1 com origem configurável.
export const AccentBar = ({ delay = 0, dur = 0.45, origin = 'left center', color = '#47B482', width = 52, height = 4, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  return (
    <div style={{
      width, height,
      background: color,
      transformOrigin: origin,
      transform: `scaleX(${p})`,
      ...style,
    }} />
  );
};

// GlassCard: wrapper com efeito vidro (backdrop-blur + tint translúcido +
// borda fina + shadow composto). Entra com fade + scale 0.94 → 1 a partir
// de `delay`. Padding/borderRadius/tint customizáveis.
export const GlassCard = ({
  delay = 0,
  dur = 0.55,
  children,
  padding = '36px 60px',
  borderRadius = 28,
  tint,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const scale = 0.94 + 0.06 * p;
  return (
    <div style={{
      transform: `translateZ(0) scale(${scale.toFixed(4)})`,
      opacity: p,
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      background: tint || 'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 50%, rgba(20,63,44,0.18) 100%)',
      border: '1px solid rgba(255,255,255,0.22)',
      borderRadius,
      padding,
      boxShadow: '0 18px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.18)',
      ...style,
    }}>
      {children}
    </div>
  );
};

// IconInOut — wrapper pra um ícone/elemento FIXO com entrada (pop-in: fade +
// scale com leve overshoot) e saída (fade + leve shrink) cronometrada pro fim
// da cena. Recebe `durFrames` (duração total da Sequence) pra saber quando sair.
export const IconInOut = ({
  children,
  durFrames,
  inDelay = 0.15,
  inDur = 0.5,
  outDur = 0.5,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = interpolate(frame, [inDelay * fps, (inDelay + inDur) * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outBack,
  });
  const outStart = Math.max((inDelay + inDur) * fps + 1, (durFrames || 0) - outDur * fps);
  const outP = durFrames
    ? interpolate(frame, [outStart, durFrames], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOutCubic,
      })
    : 0;
  const opacity = inP * (1 - outP);
  const scale = (0.82 + 0.18 * inP) * (1 - 0.12 * outP);
  return (
    <div style={{
      opacity,
      transform: `scale(${scale.toFixed(4)})`,
      transformOrigin: 'center',
      ...style,
    }}>
      {children}
    </div>
  );
};

// SceneTextureBackdrop — overlay genérico de textura B&W com drift lento.
// Recebe `src` (path da textura, geralmente do pool aleatório) e anima com
// pan diagonal + respiração de escala. Discreto por default (opacity 0.18).
// Reutilizado por várias cenas pra dar atmosfera sem competir com o conteúdo.
export const SceneTextureBackdrop = ({ src, durSec, blend = 'screen', opacity = 0.22, invert = true, zIndex, zoomRange, driftRange }) => {
  if (!src) return null;
  // R28h: textura ESTÁTICA — sem Ken Burns/drift (padronização). Mantemos um leve
  // scale 1.06 só pra garantir cover (sem bordas) e centralizada. zoomRange/driftRange
  // ficam aceitos por compat, mas ignorados.
  const style = { pointerEvents: 'none', overflow: 'hidden' };
  if (zIndex != null) style.zIndex = zIndex;
  return (
    <AbsoluteFill style={style}>
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(src)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: 'scale(1.06)',
        transformOrigin: 'center',
        mixBlendMode: blend,
        opacity,
        filter: invert ? 'invert(1) contrast(1.1)' : 'contrast(1.1)',
      }} />
    </AbsoluteFill>
  );
};

// NumberTicker: interpola from→to e formata via fn.
export const NumberTicker = ({ from = 0, to = 100, delay = 0.3, dur = 0.9, format, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const v = from + (to - from) * p;
  const fmt = typeof format === 'function' ? format : Math.round;
  return <span style={style}>{fmt(v)}</span>;
};

// Faz o número formatter por nome (mesmo vocabulário do motor antigo).
export function numberFormatter(name) {
  if (name === 'decimal') return v => v.toFixed(1).replace('.', ',');
  if (name === 'comma')   return v => Math.round(v).toLocaleString('pt-BR');
  return Math.round;
}

// ── Char effects extras (R9) ───────────────────────────────────────
// ScaleBounceText: chars entram com spring físico, scale 0 → 1.15 → 1.
// Mais dramático que CharReveal (que só faz translateY + opacity).
// Agrupa por palavra com nowrap pra evitar quebra no meio de palavras.
export const ScaleBounceText = ({ text, delay = 0, stagger = 0.04, charStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const staggerF = stagger * fps;
  const text2 = text || '';
  const segments = text2.split(/(\s+)/);
  let cursor = 0;
  return (
    <Fragment>
      {segments.map((seg, si) => {
        if (seg === '') return null;
        if (/^\s+$/.test(seg)) {
          cursor += seg.length;
          return <Fragment key={si}>{seg}</Fragment>;
        }
        const startIdx = cursor;
        cursor += seg.length;
        return (
          <span key={si} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...seg].map((ch, ci) => {
              const myIdx = startIdx + ci;
              const s = spring({
                frame: frame - delayF - myIdx * staggerF,
                fps,
                config: { damping: 9, stiffness: 130, mass: 0.6 },
              });
              return (
                <span key={ci} style={{
                  display: 'inline-block',
                  opacity: Math.min(1, s * 1.5),
                  transform: `scale(${s})`,
                  transformOrigin: 'center bottom',
                  ...(charStyle || {}),
                }}>{ch}</span>
              );
            })}
          </span>
        );
      })}
    </Fragment>
  );
};

// TypewriterText: char-by-char tipo máquina de escrever, com cursor piscando.
// Cursor é um pipe `|` que segue o último char visível.
// IMPORTANTE: agrupa chars por palavra com white-space: nowrap pra evitar
// que o browser quebre linha no meio de palavras durante o reveal.
export const TypewriterText = ({ text, delay = 0, charDur = 0.05, showCursor = true, cursorColor = '#FFFFFF', charStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text2 = text || '';
  const totalChars = [...text2].length;
  const delayF = delay * fps;
  const charF = charDur * fps;
  const visible = Math.max(0, Math.min(totalChars, Math.floor((frame - delayF) / charF)));
  // Cursor pisca 2x por segundo (período 0.5s)
  const cursorOn = showCursor && (frame - delayF) >= 0
    ? Math.floor((frame / fps) * 2) % 2 === 0
    : false;
  // Cursor desaparece assim que termina de digitar (sem espaço fantasma).
  // Pequeno fade-out de 0.3s depois do último char pra suavizar.
  const doneFrame = delayF + totalChars * charF;
  const cursorFadeOutP = interpolate(frame, [doneFrame, doneFrame + 0.3 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Segments por palavra (chars de uma palavra ficam juntos via nowrap).
  const segments = text2.split(/(\s+)/);
  let cursorIdx = 0;
  return (
    <Fragment>
      {segments.map((seg, si) => {
        if (seg === '') return null;
        if (/^\s+$/.test(seg)) {
          const before = cursorIdx;
          cursorIdx += seg.length;
          // Só mostra o whitespace depois que o "typing" passou por ele
          if (visible > before) {
            return <Fragment key={si}>{seg.slice(0, Math.min(seg.length, visible - before))}</Fragment>;
          }
          return null;
        }
        const wordChars = [...seg];
        const startIdx = cursorIdx;
        cursorIdx += wordChars.length;
        return (
          <span key={si} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {wordChars.map((ch, ci) => {
              const absIdx = startIdx + ci;
              if (absIdx >= visible) return null;
              return (
                <span key={ci} style={{ display: 'inline-block', ...(charStyle || {}) }}>{ch}</span>
              );
            })}
          </span>
        );
      })}
      {showCursor && cursorFadeOutP > 0.01 ? (
        <span style={{
          display: 'inline-block',
          color: cursorColor,
          opacity: (cursorOn ? 1 : 0.1) * cursorFadeOutP,
          marginLeft: 2,
          ...(charStyle || {}),
        }}>|</span>
      ) : null}
    </Fragment>
  );
};

// ── IconifyIcon (R11) ───────────────────────────────────────────────
// Wrapper de <Icon> do @iconify/react que cuida do delayRender. Sem isso,
// no CLI render o ícone fica vazio em frames antes do fetch da API terminar.
// `icon` é o nome no formato "set:name", ex: "twemoji:ear-of-corn",
// "ph:rocket-duotone", "noto:satellite", "material-symbols:warning".
// Packs populares: twemoji (multi-color emoji), noto (Google multi-color),
// ph (Phosphor), material-symbols, lucide, fluent-emoji-flat.
export const IconifyIcon = ({ icon, size = 64, color, style }) => {
  const [handle] = useState(() => delayRender(`iconify-${icon}`, { timeoutInMilliseconds: 8000 }));
  const [ready, setReady] = useState(() => iconLoaded(icon));

  useEffect(() => {
    if (iconLoaded(icon)) {
      setReady(true);
      continueRender(handle);
      return;
    }
    loadIcons([icon], () => {
      setReady(true);
      continueRender(handle);
    });
    // Fallback: continua o render depois de 5s mesmo sem o ícone, evita travar render.
    const fallback = setTimeout(() => {
      try { continueRender(handle); } catch { /* já chamado */ }
    }, 5000);
    return () => clearTimeout(fallback);
  }, [icon, handle]);

  if (!ready) return null;
  return (
    <RawIconifyIcon
      icon={icon}
      width={size}
      height={size}
      color={color}
      style={{ display: 'block', ...(style || {}) }}
    />
  );
};

const safeIconKind = (icon = '') => {
  const name = String(icon).toLowerCase();
  if (/cloud|weather/.test(name)) return 'cloud';
  if (/plant|seed|sustain|crop|leaf|corn|soja|lavoura|campo|safra|colheita/.test(name)) return 'leaf';
  if (/speed|watch|tempo/.test(name)) return 'speed';
  if (/bell|alert|warning/.test(name)) return 'bell';
  if (/document|report|bar-chart|dados|histor/.test(name)) return 'document';
  if (/phone|mobile|whatsapp/.test(name)) return 'phone';
  if (/map|location|gps|pin|satellite/.test(name)) return 'target';
  if (/lightbulb|intelig/.test(name)) return 'bulb';
  if (/arrow-up|upload|rocket|prosper/.test(name)) return 'arrow';
  if (/cog|gear/.test(name)) return 'cog';
  if (/star/.test(name)) return 'star';
  if (/sun|thermometer|clear-day/.test(name)) return 'sun';
  if (/rain|drop|humidity|water/.test(name)) return 'drop';
  if (/wind/.test(name)) return 'wind';
  return 'check';
};

const SAFE_ICON_PATHS = {
  check: ['M20 50 L42 72 L82 30'],
  leaf: ['M28 84 C38 40 78 24 104 24 C104 70 78 100 42 100', 'M42 100 C52 76 70 56 94 36'],
  cloud: ['M28 66 H76 C86 66 94 58 94 48 C94 38 86 30 76 30 C70 18 56 12 43 18 C32 22 25 32 25 44 C15 46 8 54 8 64 C8 76 18 84 32 84 H78'],
  speed: ['M20 72 C20 45 42 24 64 24 C86 24 108 45 108 72', 'M64 72 L86 48', 'M32 72 H96'],
  bell: ['M36 78 H92', 'M44 78 V50 C44 38 52 28 64 28 C76 28 84 38 84 50 V78', 'M56 86 C58 92 70 92 72 86'],
  document: ['M36 18 H72 L92 38 V110 H36 Z', 'M72 18 V38 H92', 'M48 58 H80', 'M48 74 H80', 'M48 90 H70'],
  phone: ['M48 16 H80 C86 16 90 20 90 26 V102 C90 108 86 112 80 112 H48 C42 112 38 108 38 102 V26 C38 20 42 16 48 16 Z', 'M56 96 H72'],
  target: ['M64 22 V38', 'M64 90 V106', 'M22 64 H38', 'M90 64 H106', 'M64 38 C78 38 90 50 90 64 C90 78 78 90 64 90 C50 90 38 78 38 64 C38 50 50 38 64 38 Z', 'M64 54 C70 54 74 58 74 64 C74 70 70 74 64 74 C58 74 54 70 54 64 C54 58 58 54 64 54 Z'],
  bulb: ['M48 92 H80', 'M52 106 H76', 'M64 18 C48 18 36 30 36 46 C36 58 43 66 50 74 C54 78 54 84 54 88 H74 C74 84 74 78 78 74 C85 66 92 58 92 46 C92 30 80 18 64 18 Z'],
  arrow: ['M64 100 V28', 'M36 56 L64 28 L92 56'],
  cog: ['M64 44 C75 44 84 53 84 64 C84 75 75 84 64 84 C53 84 44 75 44 64 C44 53 53 44 64 44 Z', 'M64 20 V34', 'M64 94 V108', 'M20 64 H34', 'M94 64 H108', 'M33 33 L43 43', 'M85 85 L95 95', 'M95 33 L85 43', 'M43 85 L33 95'],
  star: ['M64 20 L76 50 L108 52 L83 72 L91 104 L64 86 L37 104 L45 72 L20 52 L52 50 Z'],
  sun: ['M64 40 C77 40 88 51 88 64 C88 77 77 88 64 88 C51 88 40 77 40 64 C40 51 51 40 64 40 Z', 'M64 16 V28', 'M64 100 V112', 'M16 64 H28', 'M100 64 H112', 'M30 30 L39 39', 'M89 89 L98 98', 'M98 30 L89 39', 'M39 89 L30 98'],
  drop: ['M64 18 C64 18 88 50 88 72 C88 88 78 102 64 102 C50 102 40 88 40 72 C40 50 64 18 64 18 Z'],
  wind: ['M24 48 H78 C88 48 88 34 78 34 C73 34 70 37 68 40', 'M20 66 H92 C104 66 104 50 92 50', 'M28 84 H72 C82 84 82 98 72 98 C67 98 64 95 62 92'],
};

const STATIC_MOTION_ICON_BY_KIND = {
  check: 'ph:check-circle',
  leaf: 'ph:plant',
  cloud: 'ph:cloud-sun',
  speed: 'ph:gauge',
  bell: 'ph:bell-ringing',
  document: 'ph:chart-bar',
  phone: 'ph:device-mobile-camera',
  target: 'ph:crosshair',
  bulb: 'ph:lightbulb-filament',
  arrow: 'ph:arrow-circle-up-right',
  cog: 'ph:gear-six',
  star: 'ph:star-four',
  sun: 'ph:sun-horizon',
  drop: 'ph:drop',
  wind: 'ph:wind',
};

export const resolveStaticMotionIcon = (icon = '') => {
  const name = String(icon || '').trim().toLowerCase();
  if (name.startsWith('ph:')) return name;
  if (name.startsWith('lucide:')) return name;
  if (name.startsWith('material-symbols:')) return name;
  return STATIC_MOTION_ICON_BY_KIND[safeIconKind(name)] || STATIC_MOTION_ICON_BY_KIND.check;
};

export const StaticMotionIcon = ({ icon, size = 64, color = 'currentColor', style }) => (
  <IconifyIcon
    icon={resolveStaticMotionIcon(icon)}
    size={size}
    color={color}
    style={{
      display: 'block',
      overflow: 'visible',
      ...(style || {}),
    }}
  />
);

export const RemotionLineIcon = ({ icon, size = 64, color = 'currentColor', style, delay = 0, drawDur = 0.85 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [delay * fps, (delay + drawDur) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  const paths = SAFE_ICON_PATHS[safeIconKind(icon)] || SAFE_ICON_PATHS.check;
  const dash = 180;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', overflow: 'visible', ...(style || {}) }}>
      {paths.map((d, i) => {
        const local = Math.max(0, Math.min(1, progress * 1.18 - i * 0.08));
        return <path key={i} d={d} pathLength={dash} strokeDasharray={dash} strokeDashoffset={(dash * (1 - local)).toFixed(2)} opacity={0.45 + local * 0.55} />;
      })}
    </svg>
  );
};

// ── LottieAsset ───────────────────────────────────────────────────
// Carrega um .json Lottie de public/ via delayRender + fetch, e o renderiza
// com entrada (spring scale + fade) e loop contínuo. A animação interna do
// Lottie roda no playbackRate dado.
// Props: src ('lottie/plant.json'), size (220), delay (0), playbackRate (1),
//   tint (cor — se setado, recolore a animação via SVG filter),
//   fillOpacity (0-1 — opcional, útil pra transformar Lotties em outline).
export const LottieAsset = ({ src, size = 220, delay = 0, playbackRate = 1, loop = true, tint, fillOpacity = null, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [data, setData] = useState(null);
  const [handle] = useState(() => delayRender(`lottie-${src}`, { timeoutInMilliseconds: 10000 }));

  useEffect(() => {
    let cancelled = false;
    fetch(staticFile(src))
      .then(r => r.json())
      .then(d => {
        const nextData = fillOpacity == null ? d : withLottieFillOpacity(d, fillOpacity);
        if (!cancelled) setData(nextData);
        continueRender(handle);
      })
      .catch(err => {
        console.warn(`[Lottie] falha ao carregar ${src}:`, err);
        continueRender(handle);
      });
    return () => { cancelled = true; };
  }, [src, fillOpacity, handle]);

  // ──── Entrada "sprout" ────
  // Spring com leve overshoot pro pop + rise from below + blur out + fade in.
  const entrance = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 10, stiffness: 95, mass: 0.85 },
  });
  const scale = entrance; // spring já dá 0 → 1.x → 1 (overshoot)
  const opacity = Math.min(1, entrance * 1.4);
  const translateY = (1 - Math.min(1, entrance)) * 50;
  const blurPx = (1 - Math.min(1, entrance)) * 10;

  const resolvedTint = tint ? resolveColor(tint) : null;
  const tintRgb = resolvedTint ? hexToRgb01(resolvedTint) : null;
  // ID único por src pra não colidir filtros entre múltiplas instâncias.
  const filterId = `lottie-tint-${src.replace(/[^a-zA-Z0-9]/g, '_')}`;

  if (!data) return null;
  // Compõe o filter do entrance (blur) com qualquer filter passado em style
  // (ex: drop-shadow externo) sem que um sobrescreva o outro.
  const { filter: userFilter, ...restStyle } = style || {};
  const composedFilter = userFilter
    ? `blur(${blurPx.toFixed(2)}px) ${userFilter}`
    : `blur(${blurPx.toFixed(2)}px)`;

  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transform: `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(2)}px)`,
      transformOrigin: 'center',
      opacity,
      ...restStyle,
      filter: composedFilter,
    }}>
      {tintRgb ? (
        // SVG filter feColorMatrix: substitui R/G/B dos pixels opacos pela
        // cor alvo, mantém alpha. Resultado: a silhueta animada do Lottie
        // pintada toda na cor — transparência ao redor preservada.
        <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={[
                `0 0 0 0 ${tintRgb[0]}`,
                `0 0 0 0 ${tintRgb[1]}`,
                `0 0 0 0 ${tintRgb[2]}`,
                `0 0 0 1 0`,
              ].join(' ')} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{
        width: '100%',
        height: '100%',
        filter: tintRgb ? `url(#${filterId})` : undefined,
      }}>
        <Lottie
          animationData={data}
          playbackRate={playbackRate}
          loop={loop}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

function withLottieFillOpacity(data, fillOpacity) {
  const opacity = Math.max(0, Math.min(1, Number(fillOpacity)));
  const clone = JSON.parse(JSON.stringify(data));
  const apply = value => {
    if (Array.isArray(value)) {
      value.forEach(apply);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (value.ty === 'fl') {
      value.o = { ...(value.o || {}), a: 0, k: opacity * 100 };
    }
    Object.values(value).forEach(apply);
  };
  apply(clone);
  return clone;
}

// Converte string hex (#RRGGBB) para [r, g, b] em 0-1 pra feColorMatrix.
function hexToRgb01(hex) {
  const m = String(hex).match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}

// GlitchText: texto com RGB split + jitter horizontal. Animação contínua
// durante a vida da cena (não staggered como CharReveal). Determinístico
// via sin(frame) — não usa Math.random.
export const GlitchText = ({ text, intensity = 0.6, charStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Jitter horizontal por frame (até ±4px no peak)
  const t = frame / fps;
  const jx = Math.sin(t * 31.7) * intensity * 4;
  // RGB split offset
  const rgbOffset = intensity * 6;
  return (
    <span style={{
      display: 'inline-block',
      position: 'relative',
      transform: `translateX(${jx.toFixed(2)}px)`,
      ...(charStyle || {}),
    }}>
      {/* Camada cyan deslocada */}
      <span style={{
        position: 'absolute',
        left: -rgbOffset,
        top: 0,
        color: '#00F0FF',
        opacity: 0.55,
        mixBlendMode: 'screen',
      }}>{text}</span>
      {/* Camada magenta deslocada */}
      <span style={{
        position: 'absolute',
        left: rgbOffset,
        top: 0,
        color: '#FF00C8',
        opacity: 0.55,
        mixBlendMode: 'screen',
      }}>{text}</span>
      <span>{text}</span>
    </span>
  );
};

// ── SceneBackdrop ───────────────────────────────────────────────────
// Camada de fundo da cena. Substitui a antiga SceneBackground (bgImage +
// Ken Burns) pelo sistema novo: 3 tipos selecionáveis.
//
// Schema:
//   background: {
//     type: 'solid' | 'gradient' | 'texture',
//     gradient: { kind, colors, angle?, stops?, breathScale? },
//     texture:  { kind, color?, intensity? }
//   }
//
// 'solid' não renderiza nada (a cena usa scene.bg direto na AbsoluteFill).
// 'gradient' renderiza GradientBackdrop. 'texture' renderiza TextureBackdrop.
export const SceneBackdrop = ({ background, durSec }) => {
  if (!background) return null;
  if (background.type === 'gradient' && background.gradient) {
    return <GradientBackdrop {...background.gradient} durSec={durSec} />;
  }
  if (background.type === 'texture' && background.texture) {
    return <TextureBackdrop {...background.texture} />;
  }
  return null;
};

// ── GradientBackdrop ────────────────────────────────────────────────
// 3 sub-tipos: linear, radial, breathing-radial. O último anima a posição
// do centro do radial ao longo da cena pra dar respiração "Aurora".
const GradientBackdrop = ({ kind = 'linear', colors = ['#143F2C', '#1A1B1A'], angle = 135, stops, breathScale = 1.0, durSec }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const resolved = (colors || []).map(resolveColor);
  // Stops em % opcional; se omitido, distribuído uniformemente.
  const stopList = stops && stops.length === resolved.length
    ? stops
    : resolved.map((_, i, arr) => (arr.length === 1 ? 0 : (i / (arr.length - 1)) * 100));
  const stopsStr = resolved.map((c, i) => `${c} ${stopList[i]}%`).join(', ');

  if (kind === 'linear') {
    return (
      <AbsoluteFill style={{
        background: `linear-gradient(${angle}deg, ${stopsStr})`,
      }} />
    );
  }

  // Radial (fixo) e breathing-radial (animado)
  const durFrames = durSec != null ? Math.max(1, durSec * fps) : (durationInFrames || fps);
  const t = interpolate(frame, [0, durFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.inOutCubic,
  });
  // Breathing: o centro do radial deriva entre 2 pontos diagonais, scale leve.
  const cx = kind === 'breathing-radial' ? 40 + 20 * Math.sin(t * Math.PI * 0.8) : 50;
  const cy = kind === 'breathing-radial' ? 45 + 15 * Math.cos(t * Math.PI * 0.6) : 50;
  const scale = kind === 'breathing-radial' ? 1 + (breathScale - 1) * Math.sin(t * Math.PI) : 1;
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, ${stopsStr})`,
      transform: `scale(${scale.toFixed(4)})`,
      transformOrigin: 'center',
    }} />
  );
};

// ── TextureBackdrop ─────────────────────────────────────────────────
// SVG patterns inline pra texturas decorativas. Sem fetch/asset externo.
// `kind`: noise | grain | dots | lines | topo.
const TextureBackdrop = ({ kind = 'noise', color = '#143F2C', intensity = 0.4 }) => {
  const resolvedColor = resolveColor(color);
  const op = Math.max(0, Math.min(1, intensity));
  switch (kind) {
    case 'noise':
      return (
        <AbsoluteFill style={{ background: resolvedColor }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: op }}>
            <filter id="mr-tx-noise"><feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.45 0" /></filter>
            <rect width="100%" height="100%" filter="url(#mr-tx-noise)" />
          </svg>
        </AbsoluteFill>
      );
    case 'grain':
      return (
        <AbsoluteFill style={{ background: resolvedColor }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: op * 0.55, mixBlendMode: 'overlay' }}>
            <filter id="mr-tx-grain"><feTurbulence type="fractalNoise" baseFrequency="3.5" numOctaves="1" seed="7" /><feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 1 0" /></filter>
            <rect width="100%" height="100%" filter="url(#mr-tx-grain)" />
          </svg>
        </AbsoluteFill>
      );
    case 'dots':
      return (
        <AbsoluteFill style={{ background: resolvedColor }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: op }}>
            <defs>
              <pattern id="mr-tx-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.6" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mr-tx-dots)" />
          </svg>
        </AbsoluteFill>
      );
    case 'lines':
      return (
        <AbsoluteFill style={{ background: resolvedColor }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: op }}>
            <defs>
              <pattern id="mr-tx-lines" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="24" stroke="#ffffff" strokeWidth="1.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mr-tx-lines)" />
          </svg>
        </AbsoluteFill>
      );
    case 'topo':
      // "Curvas de nível" — círculos concêntricos escalonados, estilo mapa.
      return (
        <AbsoluteFill style={{ background: resolvedColor }}>
          <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, opacity: op * 0.55 }}>
            <g fill="none" stroke="#ffffff" strokeWidth="1.5">
              {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200].map(r => (
                <circle key={r} cx="540" cy="960" r={r} />
              ))}
            </g>
          </svg>
        </AbsoluteFill>
      );
    default:
      return <AbsoluteFill style={{ background: resolvedColor }} />;
  }
};
