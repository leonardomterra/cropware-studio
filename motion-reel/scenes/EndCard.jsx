// Cena 12 — END CARD (locked, hardcoded).
// Fundo branco, logo Cropware tintada em greenAccent (via CSS mask), tagline
// em slateAbyss, Instagram badge animado (pill expand + handle text).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { LottieAsset, EASE } from '../helpers.jsx';

const LOGO_URL = 'logo-cropware-pb-final.svg';
const APP_STORE_BADGE_URL = 'app-store-badge-motion.webp';
const TAGLINE_LINES = ['Inteligência para', 'quem constrói mercado.'];
const HANDLE = '@cropware.app';

export const EndCard = ({ start, end, theme = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = theme || {};

  // Logo: scale 0.92->1 + fade em 450ms.
  const logoP = interpolate(frame, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  // App Store badge shine
  const badgeSpring = spring({
    frame: frame - 2.45 * fps,
    fps,
    config: { damping: 13, stiffness: 105, mass: 0.85 },
  });
  const badgeOpacity = Math.min(1, badgeSpring * 1.35);
  const shineP = interpolate(frame, [3.15 * fps, 4.25 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shineOpacity = shineP > 0 && shineP < 1 ? Math.sin(shineP * Math.PI) * 0.95 : 0;

  return (
    <AbsoluteFill style={{
      background: T.bg || MR_COLORS.white,
      color: T.fg || MR_COLORS.slateAbyss,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 80px', gap: 44, fontFamily: MR_FONTS.display,
    }}>
      {/* Logo Cropware tintada em greenAccent */}
      <div style={{
        width: 560, height: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: logoP,
        transform: `scale(${0.92 + 0.08 * logoP})`,
      }}>
        <div style={{
          width: '100%', height: '100%',
          WebkitMaskImage: `url('${staticFile(LOGO_URL)}')`,
          maskImage: `url('${staticFile(LOGO_URL)}')`,
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskPosition: 'center', maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          background: T.logoColor || MR_COLORS.greenAccent,
        }} />
      </div>

      <TaglineReveal
        lines={TAGLINE_LINES}
        delay={0.55}
        color={T.fg || MR_COLORS.slateAbyss}
      />

      {/* Instagram badge: pill animado com ícone + handle */}
      <InstagramHandleBadge
        delay={1.25}
        handle={HANDLE}
        theme={T}
      />

      {/* App Store badge */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: 170,
        width: 392,
        height: 120,
        borderRadius: 22,
        overflow: 'hidden',
        opacity: badgeOpacity,
        transform: `translateX(-50%) translateY(${((1 - Math.min(1, badgeSpring)) * 70).toFixed(2)}px) scale(${(0.96 + 0.04 * badgeSpring).toFixed(4)})`,
        transformOrigin: 'center',
        filter: T.flat ? 'none' : 'drop-shadow(0 18px 34px rgba(0,0,0,0.18))',
      }}>
        <img
          src={staticFile(APP_STORE_BADGE_URL)}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        <div style={{
          position: 'absolute', top: '-60%', left: '-80%',
          width: '70%', height: '220%',
          background: 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 100%)',
          mixBlendMode: 'screen', opacity: shineOpacity,
          transform: `translateX(${(shineP * 360).toFixed(2)}%) rotate(8deg)`,
          pointerEvents: 'none',
        }} />
      </div>
    </AbsoluteFill>
  );
};

// Badge pill animado: ícone Instagram (círculo) expande para pill com handle.
// Sequência: 1) círculo sobe com spring → 2) pill expande → 3) texto aparece.
const InstagramHandleBadge = ({ delay = 1.25, handle, theme = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = theme || {};

  const CIRCLE = 118;
  const PILL_FULL = 590;

  // 1. Entrada do círculo
  const circleSpring = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 13, stiffness: 115, mass: 0.85 },
  });

  // 2. Expansão do pill (começa 0.3s após o círculo)
  const expandDelay = delay + 0.3;
  const expandP = interpolate(
    frame,
    [expandDelay * fps, (expandDelay + 0.48) * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 1, 0.35, 1) }
  );

  // 3. Texto aparece (começa quando pill está em ~60%)
  const textDelay = expandDelay + 0.28;
  const textP = interpolate(
    frame,
    [textDelay * fps, (textDelay + 0.32) * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1) }
  );

  const pillWidth = CIRCLE + expandP * (PILL_FULL - CIRCLE);
  const opacity = Math.min(1, circleSpring * 1.4);
  const scale = 0.72 + 0.28 * circleSpring;

  return (
    <div style={{
      opacity,
      transform: `scale(${scale.toFixed(4)}) translateY(${((1 - circleSpring) * 40).toFixed(2)}px)`,
      transformOrigin: 'center',
      marginTop: 8,
    }}>
      <div style={{
        background: T.cardBg || MR_COLORS.white,
        borderRadius: 999,
        width: pillWidth,
        height: CIRCLE,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: T.flat
          ? '0 0 0 1px rgba(15,23,42,0.10)'
          : '0 2px 12px rgba(0,0,0,0.07), 0 0 0 1px rgba(15,23,42,0.06)',
        position: 'relative',
      }}>
        {/* Ícone Instagram — absoluto à esquerda */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: CIRCLE,
          height: CIRCLE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <LottieAsset
            src="lottie/instagram.json"
            size={94}
            delay={delay + 0.05}
            playbackRate={0.9}
            loop
            tint={null}
          />
        </div>

        {/* Handle text — levemente deslocado à direita do centro */}
        <div style={{
          fontFamily: MR_FONTS.display,
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: '-0.018em',
          color: T.handleColor || '#111111',
          whiteSpace: 'nowrap',
          opacity: textP,
          transform: `translateX(${((1 - textP) * 14 + 30).toFixed(2)}px)`,
          lineHeight: 1,
        }}>{handle}</div>
      </div>
    </div>
  );
};

// Tagline 2-linhas com entrada elegante e stagger entre linhas.
const TaglineReveal = ({ lines, delay = 0, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 2, marginTop: -28, maxWidth: 880,
    }}>
      {lines.map((line, i) => {
        const lineDelay = delay + i * 0.18;
        const dur = 0.7;
        const p = interpolate(frame, [lineDelay * fps, (lineDelay + dur) * fps], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
        });
        const blur = (1 - p) * 8;
        const ty = (1 - p) * 18;
        return (
          <div key={i} style={{
            fontFamily: '"Inter Tight", system-ui, sans-serif',
            fontSize: 64, fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '-0.02em', textAlign: 'center',
            whiteSpace: 'nowrap', color,
            opacity: p,
            filter: `blur(${blur.toFixed(2)}px)`,
            transform: `translateY(${ty.toFixed(2)}px) translateZ(0)`,
          }}>{line}</div>
        );
      })}
    </div>
  );
};
