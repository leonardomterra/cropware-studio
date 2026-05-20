// Cena 03 — KEYWORD (custom, tema-driven).
// Visual: textura `keyword-texture.webp` tintada conforme tema (mix-blend
// multiply ou screen) + 1 ícone Iconify animado no topo + palavra em Space
// Mono uppercase + underline. IA preenche word + (opcional) icon.
// R16: bg/fg/accent vêm do theme prop (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, IconifyIcon, LottieAsset, EASE } from '../helpers.jsx';
import { resolveKeywordAnimatedIcon, resolveKeywordLottieSrc } from '../keyword-icons.js';

const FALLBACK = MR_THEMES.editorial.perSlide.keyword;

export const Keyword = ({
  word,
  icon = 'line-md:speed-loop',
  underline = true,
  theme,
  start, end,
}) => {
  const T = theme || FALLBACK;
  const resolvedIcon = resolveKeywordAnimatedIcon({ icon, word });
  const lottieSrc = resolveKeywordLottieSrc(resolvedIcon);
  const iconColor = T.iconColor || T.fg;
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
      background: T.bg,
      color: T.fg,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 56,
      fontFamily: MR_FONTS.mono,
      overflow: 'hidden',
    }}>
      {/* Camada 1: textura sobre o bg (blend-mode definido pelo tema:
          multiply tinta de verde escuro; screen ilumina) */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile('keyword-texture.webp')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: T.textureMode || 'multiply',
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

      {/* Camada 4: ícone animado — Lottie curado ou Iconify animado */}
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
        filter: T.iconFilter || 'drop-shadow(0 10px 28px rgba(0,0,0,0.45))',
        color: iconColor,
      }}>
        {lottieSrc ? (
          <LottieAsset src={lottieSrc} size={190} playbackRate={0.9} tint={iconColor} fillOpacity={0} />
        ) : (
          <IconifyIcon icon={resolvedIcon} size={180} color={iconColor} />
        )}
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
          color: T.wordColor || T.fg,
          textShadow: T.wordTextShadow || '0 6px 32px rgba(0,0,0,0.45)',
        }}>
          <CharReveal text={word || ''} delay={0.55} dur={0.4} stagger={0.032} ty={28} />
        </div>

        {underline ? (
          <div style={{
            width: 180,
            height: 7,
            background: T.accent,
            opacity: 1,
            borderRadius: 3,
            transformOrigin: 'left center',
            transform: `scaleX(${underlineP.toFixed(3)})`,
            boxShadow: `0 0 28px ${T.accent}aa`,
          }} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
