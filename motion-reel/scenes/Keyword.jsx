// Cena 03 — KEYWORD (custom, tema-driven).
// Visual fixo: textura `keyword-texture.webp` tintada em verde (mix-blend-mode
// multiply sobre greenAccent) + 1 ícone Iconify animado no topo + palavra em
// Space Mono uppercase + underline. IA preenche word + (opcional) icon.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, IconifyIcon, EASE } from '../helpers.jsx';

export const Keyword = ({
  word,
  icon = 'line-md:speed-loop', // default fits "Rápido." — IA pode trocar por tema
  underline = true,
  start, end,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in defensivo
  const bgIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  // Ícone spring entrance + breathing
  const iconSpring = spring({
    frame: frame - 0.25 * fps,
    fps,
    config: { damping: 11, stiffness: 110, mass: 0.8 },
  });
  const t = frame / fps;
  const iconBreath = 1 + Math.sin(t * Math.PI * 0.8) * 0.04;
  const iconScale = (0.6 + 0.4 * iconSpring) * iconBreath;
  const iconOpacity = Math.min(1, iconSpring * 1.4);

  // Underline delay baseado em qntdde de chars
  const charCount = (word || '').length;
  const underlineDelay = Math.max(0.6, charCount * 0.035 + 0.85);
  const underlineP = interpolate(
    frame,
    [underlineDelay * fps, (underlineDelay + 0.5) * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart }
  );

  return (
    <AbsoluteFill style={{
      background: MR_COLORS.greenAccent,
      color: MR_COLORS.white,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 56,
      fontFamily: MR_FONTS.mono,
      overflow: 'hidden',
    }}>
      {/* Camada 1: textura sobre greenAccent (multiply tinta tudo de verde
          preservando o detalhe do padrão) */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile('keyword-texture.webp')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: 'multiply',
        opacity: bgIn * 0.7,
      }} />

      {/* Camada 2: radial gradient pra dar volume/luz central */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(20,63,44,0.35) 100%)`,
        opacity: bgIn,
        pointerEvents: 'none',
      }} />

      {/* Camada 3: vinheta sutil */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.30) 100%)',
        opacity: bgIn,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: ícone Iconify single, animado */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 200,
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: iconOpacity,
        transform: `scale(${iconScale.toFixed(4)})`,
        transformOrigin: 'center',
        filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.45))',
        color: MR_COLORS.white,
      }}>
        <IconifyIcon icon={icon} size={180} color={MR_COLORS.white} />
      </div>

      {/* Camada 5: palavra Space Mono uppercase + underline (gap maior pra respiro) */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 56,
      }}>
        <div style={{
          fontFamily: MR_FONTS.mono,
          fontSize: 110,
          fontWeight: 400,
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          textAlign: 'center',
          maxWidth: 920,
          color: MR_COLORS.white,
          textShadow: '0 6px 32px rgba(0,0,0,0.45)',
        }}>
          <CharReveal text={word || ''} delay={0.55} dur={0.4} stagger={0.032} ty={28} />
        </div>

        {underline ? (
          <div style={{
            width: 180,
            height: 7,
            background: MR_COLORS.greenBright,
            opacity: 1,
            borderRadius: 3,
            transformOrigin: 'left center',
            transform: `scaleX(${underlineP.toFixed(3)})`,
            boxShadow: `0 0 28px ${MR_COLORS.greenBright}aa`,
          }} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
