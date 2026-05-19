// Cena 06 — SCENARIO (custom, tema-driven).
// Substitui o antigo data-chart (que dependia de números fictícios).
// Visual fixo: imagem `conheca-campo-bg.webp` (homem agachado checando celular)
// + Ken Burns + glass slate + parágrafo narrativo descrevendo um momento.
// IA preenche kicker + scenario (3-4 linhas curtas, contextualizando um momento).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { FadeSlide, KickerReveal, EASE } from '../helpers.jsx';

const BG_IMAGE = 'conheca-campo-bg.webp';

// Glass slate (mesma receita dos fixos cap04/07/10).
const SLATE_TINT = 'linear-gradient(180deg, rgba(26,27,26,0.45) 0%, rgba(26,27,26,0.62) 55%, rgba(10,10,10,0.80) 100%)';

export const Scenario = ({ kicker, scenario, start, end }) => {
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
  const kbTy = interpolate(frame, [0, durFrames], [0, -32], {
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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 30%)',
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

      {/* Camada 6: conteúdo — kicker mono + parágrafo narrativo */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 96px',
        gap: 32,
        color: MR_COLORS.white,
        fontFamily: MR_FONTS.display,
      }}>
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0.3}
            dur={0.5}
            fromEm={0.18}
            toEm={0.32}
            style={{
              fontFamily: MR_FONTS.mono,
              fontSize: 30,
              fontWeight: 400,
              color: MR_COLORS.greenBright,
              textTransform: 'uppercase',
              textShadow: '0 2px 14px rgba(0,0,0,0.45)',
              transform: 'translateZ(0)',
            }}
          />
        ) : null}

        <FadeSlide delay={0.55} dur={0.6} ty={32}>
          <div style={{
            fontFamily: MR_FONTS.grotesk,
            fontSize: 76,
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            maxWidth: 920,
            color: MR_COLORS.white,
            textShadow: '0 4px 24px rgba(0,0,0,0.55)',
            whiteSpace: 'pre-line', // permite \n no scenario
            transform: 'translateZ(0)',
          }}>{scenario || ''}</div>
        </FadeSlide>
      </div>
    </AbsoluteFill>
  );
};
