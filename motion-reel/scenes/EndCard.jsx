// Cena 12 — END CARD (locked, hardcoded).
// Fundo branco, logo Cropware tintada em greenAccent (via CSS mask), tagline
// em slateAbyss, Instagram CTA card animado (perfil à esquerda, botão à direita).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { HorizontalClipReveal, LottieAsset } from '../helpers.jsx';

const LOGO_URL = 'logo-cropware-pb-final.svg';
const TAGLINE = 'O agro é Cropware.';
const HANDLE = '@cropware.app';

export const EndCard = ({ start, end, theme = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = theme || {};

  // Logo: scale 0.92→1 + fade em 450ms.
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
  // Frase: ease-out (press), spring-out (release).
  const pressIn = interpolate(frame, [1.9 * fps, 2.05 * fps], [1, 0.92], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const release = spring({
    frame: frame - 2.05 * fps,
    fps,
    config: { damping: 8, stiffness: 180, mass: 0.7 },
  });
  // Combina: durante o press (até 2.05s) usa pressIn; depois usa scale spring 0.92→1 com overshoot.
  const buttonScale = frame < 2.05 * fps
    ? pressIn
    : 0.92 + 0.08 * release;
  // Após 2.1s o texto muda de "Seguir" → "Seguindo ✓".
  const isFollowing = frame >= 2.05 * fps;
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

      <HorizontalClipReveal delay={0.55} dur={0.5} style={{ marginTop: -32 }}>
        <div style={{
          fontFamily: MR_FONTS.grotesk, fontSize: 56, fontWeight: 500,
          lineHeight: 1.15, letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 820,
          color: T.fg || MR_COLORS.slateAbyss,
        }}>{TAGLINE}</div>
      </HorizontalClipReveal>

      {/* Instagram-style CTA card — row layout: perfil à esquerda, botão à direita.
          Slide-up + bounce na entrada, botão "Seguir" com press-in animation. */}
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
        boxShadow: T.cardShadow || '0 32px 64px rgba(0,0,0,0.45)',
        opacity: ctaSpring,
        transform: `translateY(${(1 - ctaSpring) * 80}px) scale(${0.94 + 0.06 * ctaSpring})`,
        marginTop: 12,
      }}>
        {/* ESQUERDA: avatar + handle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          {/* Avatar circular — circulo branco com a Lottie do Instagram animada (cores nativas, loop). */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: T.avatarBg || MR_COLORS.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${T.avatarBg || MR_COLORS.white}`,
            boxShadow: `0 0 0 2px ${T.logoColor || MR_COLORS.greenAccent}`,
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
            fontFamily: MR_FONTS.display, fontSize: 36, fontWeight: 700,
            letterSpacing: '-0.02em', color: T.handleColor || T.fg || MR_COLORS.slateAbyss, lineHeight: 1,
          }}>{HANDLE}</div>
        </div>
        {/* DIREITA: botão Seguir / Seguindo */}
        <div style={{
          background: isFollowing ? (T.followingBg || MR_COLORS.fog) : (T.buttonBg || MR_COLORS.greenAccent),
          color: isFollowing ? (T.followingFg || MR_COLORS.slateAbyss) : (T.buttonFg || MR_COLORS.white),
          padding: '16px 44px',
          borderRadius: 14,
          fontFamily: MR_FONTS.display, fontWeight: 600, fontSize: 30,
          letterSpacing: '-0.005em',
          display: 'flex', alignItems: 'center', gap: 10,
          transform: `scale(${buttonScale})`,
          transformOrigin: 'center',
          boxShadow: isFollowing
            ? `inset 0 0 0 2px ${(T.followingBorder || MR_COLORS.slateLight)}55`
            : `0 8px 20px ${(T.buttonBg || MR_COLORS.greenAccent)}55`,
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
    </AbsoluteFill>
  );
};
