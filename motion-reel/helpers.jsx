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
        // Whitespace puro — render como texto plain, browser permite quebra aqui
        if (/^\s+$/.test(seg)) {
          cursor += seg.length;
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

// ── LottieAsset ───────────────────────────────────────────────────
// Carrega um .json Lottie de public/ via delayRender + fetch, e o renderiza
// com entrada (spring scale + fade) e loop contínuo. A animação interna do
// Lottie roda no playbackRate dado.
// Props: src ('lottie/plant.json'), size (220), delay (0), playbackRate (1),
//   tint (cor — se setado, recolore a animação via mix-blend-mode: color,
//   preservando a luminância original).
export const LottieAsset = ({ src, size = 220, delay = 0, playbackRate = 1, loop = true, tint, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [data, setData] = useState(null);
  const [handle] = useState(() => delayRender(`lottie-${src}`, { timeoutInMilliseconds: 10000 }));

  useEffect(() => {
    let cancelled = false;
    fetch(staticFile(src))
      .then(r => r.json())
      .then(d => {
        if (!cancelled) setData(d);
        continueRender(handle);
      })
      .catch(err => {
        console.warn(`[Lottie] falha ao carregar ${src}:`, err);
        continueRender(handle);
      });
    return () => { cancelled = true; };
  }, [src, handle]);

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
