// Cena 10 — FEATURE LIST.
// Visual gêmeo dos cap01/04/07: imagem do site Cropware (close de folha com
// orvalho) + Ken Burns lento + glass pane slate + lista de 5 palavras-chave.
// Storyboard controla apenas as palavras; o visual continua hardcoded.
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { FadeSlide, IconifyIcon, EASE } from '../helpers.jsx';

const BG_IMAGE = 'og-bg.webp';
// Fallback quando um storyboard antigo não trouxer palavras customizadas.
const DEFAULT_WORDS = [
  'Mapear',
  'Monitorar',
  'Prever',
  'Decidir',
  'Provar',
];

// Glass mais leve que cap04/07 pra deixar o detalhe das folhas/orvalho
// respirarem mais (essa cena é poética, não dramática).
const SLATE_TINT_LIGHT = 'linear-gradient(180deg, rgba(26,27,26,0.30) 0%, rgba(26,27,26,0.48) 55%, rgba(10,10,10,0.66) 100%)';
const TOP_SHEEN = 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 14%, rgba(255,255,255,0) 28%)';
const BOTTOM_DEPTH = 'linear-gradient(0deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 42%)';
const VIGNETTE = 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.42) 100%)';

function normalizeWords(words, items, features) {
  const source = Array.isArray(words) ? words : (Array.isArray(items) ? items : features);
  const list = Array.isArray(source)
    ? source.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item.text === 'string') return item.text;
      return '';
    })
    : [];
  const cleaned = list
    .map(word => String(word || '').trim())
    .filter(Boolean)
    .slice(0, 5);
  return cleaned.length ? cleaned : DEFAULT_WORDS;
}

export const Quote = ({ start, end, words, items, features, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;
  const T = theme || {};
  const bgImage = T.bgImage || BG_IMAGE;
  const bgColor = T.bg || MR_COLORS.slateAbyss;
  const textColor = T.fg || MR_COLORS.white;
  const iconColor = T.iconColor || MR_COLORS.greenBright;
  const glassTint = T.glassTint || SLATE_TINT_LIGHT;
  const topSheen = T.topSheen || TOP_SHEEN;
  const bottomDepth = T.bottomDepth || BOTTOM_DEPTH;
  const vignette = T.vignette || VIGNETTE;
  const textShadow = T.textShadow || '0 2px 16px rgba(0,0,0,0.5)';
  const iconFilter = T.iconFilter || 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))';
  const highlightColor = T.highlightColor || iconColor;
  const listParallaxY = interpolate(frame, [0, durFrames], [10, -10], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // ── Entrada cinematográfica (mesma family das outras locked) ──
  const enterP = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  // Ken Burns mais marcante: zoom-in 1.06 → 1.34 (28% de crescimento ao longo
  // dos 6s) + drift vertical pra baixo cresce -55px. Sensação de "se aproximar
  // do detalhe das folhas" durante a leitura da lista.
  const kbScale = interpolate(frame, [0, durFrames], [1.06, 1.34], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgScale = kbScale + (1 - enterP) * 0.12;
  const kbTy = interpolate(frame, [0, durFrames], [0, -55], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgBlur = (1 - enterP) * 18;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 22], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: bgColor, overflow: 'hidden' }}>
      {/* Camada 1: imagem (close folhas com orvalho) com Ken Burns */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(bgImage)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: glass pane slate leve (detalhe da folha respira por trás) */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(135%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(135%)`,
        background: glassTint,
        opacity: overlayP,
      }} />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: topSheen,
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: bottomDepth,
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: vignette,
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 6: lista de verbos — alinhada à esquerda, Space Mono uppercase, com check (line-md) em cada item */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 100px',
        gap: 34,
        color: textColor,
        fontFamily: MR_FONTS.mono,
        textAlign: 'left',
        transform: `translateY(${listParallaxY.toFixed(2)}px)`,
      }}>
        {normalizeWords(words, items, features).map((feature, i) => {
          const itemDelay = 0.35 + i * 0.13;
          const startFrame = Math.round(itemDelay * fps);
          const itemFrame = frame - startFrame;
          const highlightP = interpolate(itemFrame, [0, 0.18 * fps, 0.55 * fps], [0, 1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
          });
          const glowOpacity = highlightP * 0.34;
          const glowScale = 1 + highlightP * 0.018;
          return (
            <FadeSlide
              key={feature}
              delay={itemDelay}
              dur={0.45}
              ty={26}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                transform: `scale(${glowScale.toFixed(4)})`,
                transformOrigin: 'left center',
              }}>
                {/* Sequence atrasa o mount do IconifyIcon — a animação CSS do
                    line-md (desenho do traço) começa só quando o item surge. */}
                <Sequence from={startFrame} layout="none">
                  <div style={{
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                    filter: iconFilter,
                  }}>
                    <IconifyIcon
                      icon="line-md:confirm"
                      size={72}
                      color={iconColor}
                    />
                  </div>
                </Sequence>
                <span style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontFamily: MR_FONTS.mono,
                  fontSize: 68,
                  fontWeight: 400,
                  letterSpacing: '0.06em',
                  lineHeight: 1.0,
                  color: textColor,
                  textShadow: `${textShadow}, 0 0 ${Math.round(18 + highlightP * 18)}px ${highlightColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`,
                  transform: 'translateZ(0)',
                }}>{feature.toUpperCase()}</span>
              </div>
            </FadeSlide>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
