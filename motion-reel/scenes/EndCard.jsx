// Cena 12 — END CARD (locked, hardcoded).
// Fundo branco, logo Cropware tintada em greenAccent (via CSS mask), tagline
// em slateAbyss, Instagram CTA card animado (perfil à esquerda, botão à direita).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { LottieAsset, EASE } from '../helpers.jsx';

const LOGO_URL = 'logo-cropware-pb-final.svg';
const APP_STORE_BADGE_URL = 'app-store-badge-motion.webp';
const TAGLINE_LINES = ['Inteligência para', 'quem constrói mercado'];
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

  // CTA card: spring-up entrada (delay 1.2s, mola firme com bounce).
  const ctaSpring = spring({
    frame: frame - 1.2 * fps,
    fps,
    config: { damping: 12, stiffness: 110, mass: 0.9 },
  });
  // Botão "Seguir" press-in: fica pressionado entre 1.9-2.1s, depois bounce.
  const pressIn = interpolate(frame, [1.9 * fps, 2.05 * fps], [1, 0.92], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const release = spring({
    frame: frame - 2.05 * fps,
    fps,
    config: { damping: 8, stiffness: 180, mass: 0.7 },
  });
  const buttonScale = frame < 2.05 * fps
    ? pressIn
    : 0.92 + 0.08 * release;
  const isFollowing = frame >= 2.05 * fps;
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
      {/* Logo Cropware tintada em greenAccent (CSS mask + bg verde). */}
      <div style={{
        width: 560, height: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: logoP,
        transform: `scale(${0.92 + 0.08 * logoP})`,
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          WebkitMaskImage: `url('${staticFile(LOGO_URL)}')`,
          maskImage: `url('${staticFile(LOGO_URL)}')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          background: T.logoColor || MR_COLORS.greenAccent,
        }} />
      </div>

      <TaglineReveal
        lines={TAGLINE_LINES}
        delay={0.55}
        color={T.fg || MR_COLORS.slateAbyss}
      />

      {/* Instagram-style CTA card — row layout: perfil à esquerda, botão à direita. */}
      <div style={{
        background: T.cardBg || MR_COLORS.white,
        borderRadius: 32,
        padding: '28px 36px',
        width: 880,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        boxShadow: T.flat ? 'none' : (T.cardShadow || '0 32px 64px rgba(0,0,0,0.45)'),
        opacity: ctaSpring,
        transform: `translateY(${(1 - ctaSpring) * 80}px) scale(${0.94 + 0.06 * ctaSpring})`,
        marginTop: 12,
      }}>
        {/* ESQUERDA: avatar + handle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: T.avatarBg || MR_COLORS.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${T.avatarBg || MR_COLORS.white}`,
            boxShadow: `0 0 0 2px ${T.avatarRing || '#c9c9c9'}`,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <LottieAsset
              src="lottie/instagram.json"
              size={76}
              delay={0}
              playbackRate={1.0}
              loop
              tint={null}
            />
          </div>
          <div style={{
            fontFamily: MR_FONTS.display, fontSize: 42, fontWeight: 700,
            letterSpacing: '-0.02em', color: T.handleColor || '#111111', lineHeight: 1,
          }}>{HANDLE}</div>
        </div>
        {/* DIREITA: botão Seguir / Seguindo */}
        <div style={{
          background: isFollowing ? (T.followingBg || MR_COLORS.fog) : (T.buttonBg || MR_COLORS.greenAccent),
          color: isFollowing ? (T.followingFg || '#111111') : (T.buttonFg || MR_COLORS.white),
          padding: '16px 44px',
          borderRadius: 14,
          fontFamily: MR_FONTS.display, fontWeight: 600, fontSize: 30,
          letterSpacing: '-0.005em',
          display: 'flex', alignItems: 'center', gap: 10,
          transform: `scale(${buttonScale})`,
          transformOrigin: 'center',
          boxShadow: T.flat
            ? (isFollowing ? `inset 0 0 0 2px ${T.followingBorder || '#c9c9c9'}` : 'none')
            : (isFollowing
              ? `inset 0 0 0 2px ${T.followingBorder || '#c9c9c9'}`
              : `0 8px 20px ${(T.buttonBg || MR_COLORS.greenAccent)}55`),
          flexShrink: 0,
        }}>
          {isFollowing ? (
            <>
              <span style={{ fontSize: 26 }}>✓</span>
              <span>Seguindo</span>
            </>
          ) : (
            <span>Seguir</span>
          )}
        </div>
      </div>

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
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '-60%',
          left: '-80%',
          width: '70%',
          height: '220%',
          background: 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 100%)',
          mixBlendMode: 'screen',
          opacity: shineOpacity,
          transform: `translateX(${(shineP * 360).toFixed(2)}%) rotate(8deg)`,
          transformOrigin: 'center',
          pointerEvents: 'none',
        }} />
      </div>
    </AbsoluteFill>
  );
};

// Tagline 2-linhas com entrada elegante e stagger entre linhas.
// Cada linha: opacity 0→1 + translateY 18→0 + blur 8→0 + letter-spacing
// 0.10em→0.02em (efeito "settle in" — letras se acomodam). Stagger de 0.18s
// entre as linhas. Pós-entrada, breath sutil no letter-spacing pra dar vida.
const TaglineReveal = ({ lines, delay = 0, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tSec = frame / fps;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      marginTop: -28,
      maxWidth: 880,
    }}>
      {lines.map((line, i) => {
        const lineDelay = delay + i * 0.18;
        const dur = 0.7;
        const p = interpolate(frame, [lineDelay * fps, (lineDelay + dur) * fps], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
        });
        // Letter-spacing animado: começa solto (0.10em) e fecha pra 0.02em.
        // Depois da entrada, oscila ±0.004em em respiro sutil.
        const lsBase = interpolate(p, [0, 1], [0.10, 0.02]);
        const breathPhase = Math.max(0, tSec - (lineDelay + dur));
        const breath = Math.sin(breathPhase * 0.9 + i * 0.7) * 0.004;
        const letterSpacing = lsBase + (p >= 1 ? breath : 0);
        const blur = (1 - p) * 8;
        const ty = (1 - p) * 18;
        return (
          <div
            key={i}
            style={{
              fontFamily: MR_FONTS.alumni,
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: `${letterSpacing.toFixed(4)}em`,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              color,
              opacity: p,
              filter: `blur(${blur.toFixed(2)}px)`,
              transform: `translateY(${ty.toFixed(2)}px) translateZ(0)`,
            }}
          >{line}</div>
        );
      })}
    </div>
  );
};
