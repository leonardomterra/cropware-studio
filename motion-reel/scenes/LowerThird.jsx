// Cena 11 — WHATSAPP CTA (locked, v3 com imagem + glass + Lottie).
// Imagem `sobre-equipe.webp` (5 pessoas no campo) + Ken Burns + glass verde
// claro + WhatsApp Lottie animada FORA do card + título + subtítulo.
// Storyboard NÃO controla nada — tudo hardcoded.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { EASE, LottieAsset } from '../helpers.jsx';

const BG_IMAGE = 'sobre-equipe.webp';
const TITLE = 'Fala com a gente.';
const SUBTITLE = 'Tire suas dúvidas no WhatsApp.';

// Glass verde mais claro (greenAccent → greenForest → greenAbyss).
const GREEN_TINT_LIGHT = 'linear-gradient(180deg, rgba(106,197,143,0.55) 0%, rgba(42,123,90,0.75) 55%, rgba(20,63,44,0.90) 100%)';

export const LowerThird = ({ start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  // ── Entrada cinematográfica (mesma family das outras locked) ──
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
  // Blur permanente 8px + 14px adicionais na entrada — não depende de
  // backdrop-filter da glass layer (defensivo pra Thumbnail).
  const imgBlur = 8 + (1 - enterP) * 14;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 26], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  // Card: slide-up entrada / slide-down saída.
  const cardIn = interpolate(frame, [0.3 * fps, 0.85 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const exitStart = Math.max(0, durSec - 0.4) * fps;
  const cardOut = interpolate(frame, [exitStart, exitStart + 0.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const cardOffset = (1 - cardIn) * 120 + cardOut * 120;

  // Lottie WhatsApp: fade in + scale-up
  const lottieIn = interpolate(frame, [0.2 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const lottieScale = 0.85 + 0.15 * lottieIn;

  return (
    <AbsoluteFill style={{ background: MR_COLORS.greenAbyss, overflow: 'hidden' }}>
      {/* Camada 1: imagem (equipe no campo) com Ken Burns + blur defensivo */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(BG_IMAGE)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: glass pane verde claro */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(150%)`,
        background: GREEN_TINT_LIGHT,
        opacity: overlayP,
      }} />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 14%, rgba(255,255,255,0) 30%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0) 42%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.40) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 6: conteúdo centralizado — Lottie ACIMA do card, ambos no centro */}
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
        gap: 44,
      }}>
        {/* WhatsApp Lottie animada FORA do card */}
        <div style={{
          width: 420,
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: lottieIn,
          transform: `scale(${lottieScale.toFixed(4)})`,
          transformOrigin: 'center',
          filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.6))',
        }}>
          <LottieAsset
            src="lottie/whatsapp-v2.json"
            size={420}
            delay={0}
            playbackRate={1.0}
            loop
            tint={null}
          />
        </div>

        {/* Card branco — só título + subtítulo (sem botão) */}
        <div style={{
          width: 820,
          background: MR_COLORS.white,
          color: MR_COLORS.slateAbyss,
          borderRadius: 36,
          padding: '52px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          textAlign: 'center',
          boxShadow: '0 32px 64px rgba(0,0,0,0.40)',
          opacity: cardIn,
          transform: `translateY(${cardOffset.toFixed(2)}px)`,
          willChange: 'transform',
        }}>
          <div style={{
            fontFamily: MR_FONTS.display,
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            color: MR_COLORS.slateAbyss,
            opacity: interpolate(frame, [0.65 * fps, 1.05 * fps], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
            }),
          }}>{TITLE}</div>
          <div style={{
            fontFamily: MR_FONTS.grotesk,
            fontSize: 40,
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            color: MR_COLORS.slateMid,
            opacity: interpolate(frame, [0.85 * fps, 1.25 * fps], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
            }),
          }}>{SUBTITLE}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
