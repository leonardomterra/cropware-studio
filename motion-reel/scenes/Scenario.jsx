// Cena 06 — SCENARIO (custom, tema-driven).
// Substitui o antigo data-chart (que dependia de números fictícios).
// Visual: imagem + Ken Burns + glass tint + parágrafo narrativo.
// IA preenche kicker + scenario (3-4 linhas curtas).
// R16: bg/fg/accent/bgImage/glassTint vêm do theme prop.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { FadeSlide, KickerReveal, SceneTextureBackdrop, EASE } from '../helpers.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide.scenario;

export const Scenario = ({ kicker, scenario, theme, bgImage, bgImageBlur, bgOverlayOpacity, bgTexture, bgTextureOpacity, bgTextureInvert, start, end }) => {
  const T = theme || FALLBACK;
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
  const imgBlur = (bgImageBlur != null ? bgImageBlur : 6) + (1 - enterP) * 14;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: T.bg, overflow: 'hidden' }}>
      {!T.flat ? <>
      {/* Camada 1: imagem com Ken Burns */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(bgImage || T.bgImage || 'conheca-campo-bg.webp')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: glass tint (slate/forest/cream conforme tema) */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        background: T.glassTint || FALLBACK.glassTint,
        opacity: overlayP * (bgOverlayOpacity != null ? bgOverlayOpacity : 1),
      }} />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: T.topSheen || 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 30%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: T.bottomDepth || 'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0) 42%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: T.vignette || 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.42) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5.5: textura overlay do pool (opcional, scene.bgTexture) */}
      <SceneTextureBackdrop
        src={bgTexture || T.bgTexture}
        durSec={durSec}
        opacity={bgTextureOpacity != null ? bgTextureOpacity : 0.08}
        invert={bgTextureInvert !== false}
      />
      </> : null}

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
        color: T.fg,
        fontFamily: MR_FONTS.display,
      }}>
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0.3}
            dur={0.5}
            fromEm={T.kickerLetterSpacingFrom ?? 0.02}
            toEm={T.kickerLetterSpacingTo ?? 0.06}
            style={{
              fontFamily: MR_FONTS.caps,
              fontSize: T.kickerFontSize || 72,
              fontWeight: 400,
              lineHeight: 1.18,
              maxWidth: T.kickerMaxWidth || 920,
              color: T.kickerColor || T.accent,
              textTransform: 'uppercase',
              textShadow: T.flat ? 'none' : (T.kickerTextShadow || '0 2px 14px rgba(0,0,0,0.45)'),
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
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
            color: T.fg,
            textShadow: T.flat ? 'none' : (T.textShadow || '0 4px 24px rgba(0,0,0,0.55)'),
            whiteSpace: 'pre-line', // permite \n no scenario
            transform: 'translateZ(0)',
          }}>{scenario || ''}</div>
        </FadeSlide>
      </div>
    </AbsoluteFill>
  );
};
