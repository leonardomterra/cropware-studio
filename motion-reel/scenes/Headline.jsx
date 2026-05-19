// Cena 02 — HEADLINE (custom, tema-driven).
// Substitui o antigo stat-card (que dependia de números fictícios).
// Visual hardcoded: imagem `conheca-solucao-bg.webp` (homem com tablet em milho)
// + Ken Burns + glass slate + kicker mono + frase editorial grande + accent bar.
// Conteúdo (kicker, headline) vem do storyboard — IA preenche por tema.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, AccentBar, KickerReveal, EASE } from '../helpers.jsx';

const BG_IMAGE = 'conheca-solucao-bg.webp';

// Glass slate (mesma receita dos fixos cap04/07).
const SLATE_TINT = 'linear-gradient(180deg, rgba(26,27,26,0.42) 0%, rgba(26,27,26,0.60) 55%, rgba(10,10,10,0.78) 100%)';

export const Headline = ({
  kicker,
  headline,
  start, end,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  // ──── Entrada cinematográfica (mesma family das locked) ────
  const enterP = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.20], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgScale = kbScale + (1 - enterP) * 0.12;
  const kbTy = interpolate(frame, [0, durFrames], [0, -34], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgBlur = 8 + (1 - enterP) * 14;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: MR_COLORS.slateAbyss, overflow: 'hidden' }}>
      {/* Camada 1: imagem com Ken Burns */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(BG_IMAGE)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: glass slate */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        background: SLATE_TINT,
        opacity: overlayP,
      }} />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 30%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0) 42%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.42) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 6: conteúdo — kicker mono + headline editorial gigante + accent bar */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        gap: 36,
        color: MR_COLORS.white,
        fontFamily: MR_FONTS.display,
        textAlign: 'center',
      }}>
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0.4}
            dur={0.5}
            fromEm={0.18}
            toEm={0.32}
            style={{
              fontFamily: MR_FONTS.mono,
              fontSize: 32,
              fontWeight: 400,
              color: MR_COLORS.greenBright,
              textTransform: 'uppercase',
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
              transform: 'translateZ(0)',
            }}
          />
        ) : null}

        <div style={{
          fontFamily: MR_FONTS.display,
          fontSize: 124,
          fontWeight: 700,
          lineHeight: 0.96,
          letterSpacing: '-0.04em',
          maxWidth: 920,
          color: MR_COLORS.white,
          textShadow: '0 4px 28px rgba(0,0,0,0.55)',
          transform: 'translateZ(0)',
        }}>
          <CharReveal
            text={headline || ''}
            delay={0.65}
            dur={0.45}
            stagger={0.028}
            ty={26}
          />
        </div>

        <AccentBar
          delay={1.25}
          dur={0.5}
          origin="center"
          color={MR_COLORS.greenBright}
          width={160}
          height={4}
          style={{
            boxShadow: `0 0 24px ${MR_COLORS.greenBright}99`,
            borderRadius: 2,
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
