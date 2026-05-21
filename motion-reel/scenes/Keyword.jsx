// Cena 03 — KEYWORD (custom, tema-driven).
// Visual: textura `keyword-texture.webp` tintada conforme tema (mix-blend
// multiply ou screen) + 1 ícone Iconify animado no topo + palavra em Space
// Mono uppercase + underline. IA preenche word + (opcional) icon.
// R16: bg/fg/accent vêm do theme prop (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, StaticMotionIcon, EASE } from '../helpers.jsx';
import { resolveKeywordAnimatedIcon } from '../keyword-icons.js';

const FALLBACK = MR_THEMES.editorial.perSlide.keyword;

const alphaHex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');

export const Keyword = ({
  word,
  icon = 'line-md:speed-loop',
  underline = true,
  theme,
  bgImage,
  bgImageBlur,
  bgOverlayOpacity,
  bgTexture,
  bgTextureOpacity,
  bgTextureInvert,
  start, end,
}) => {
  const T = theme || FALLBACK;
  const resolvedIcon = resolveKeywordAnimatedIcon({ icon, word });
  const iconColor = T.iconColor || T.fg;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  // Fade in defensivo
  const bgIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  // Ken Burns lento pra foto de fundo (4s típico): zoom 1.04 → 1.16 + drift.
  const kbScale = interpolate(frame, [0, durFrames], [1.04, 1.16], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const kbTy = interpolate(frame, [0, durFrames], [0, -20], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const resolvedBgImage = bgImage || T.bgImage;

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
      {!T.flat ? <>
      {/* Camada 0: foto de fundo com Ken Burns — escurecida/dessaturada
          pra a palavra/ícone respirarem. Só renderiza quando há bgImage. */}
      {resolvedBgImage ? (
        <AbsoluteFill style={{
          backgroundImage: `url('${staticFile(resolvedBgImage)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(${kbScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
          transformOrigin: 'center',
          filter: `blur(${bgImageBlur != null ? bgImageBlur : 0}px) brightness(0.62) saturate(0.85)`,
          opacity: bgIn,
        }} />
      ) : null}

      {/* Camada 0.5: tonalização da foto com a cor do tema. Pinta a foto na
          paleta do tema (greenAbyss, slateAbyss, greenForest, etc) e cria
          variação visível entre temas mesmo com a mesma foto/textura. */}
      {resolvedBgImage ? (
        <AbsoluteFill style={{
          background: `${T.bg}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.70)}`,
          opacity: bgIn,
          pointerEvents: 'none',
        }} />
      ) : null}

      {/* Camada 1: textura ÚNICA sobre o bg — pool (bgTexture) com fallback
          pra keyword-texture.webp. Blend-mode/filter + intensidade controláveis.
          Ken Burns lento na textura (zoom + drift sutil + leve rotação) pra dar
          vida à camada e evitar sensação estática. */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(bgTexture || T.bgTexture || 'keyword-texture.webp')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${interpolate(frame, [0, durFrames], [1.08, 1.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }).toFixed(4)}) translate(${interpolate(frame, [0, durFrames], [-12, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }).toFixed(2)}px, ${interpolate(frame, [0, durFrames], [10, -18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }).toFixed(2)}px) rotate(${interpolate(frame, [0, durFrames], [-1.2, 1.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }).toFixed(3)}deg)`,
        transformOrigin: 'center',
        mixBlendMode: T.textureMode || 'multiply',
        filter: (bgTextureInvert != null ? bgTextureInvert : false)
          ? `invert(1) contrast(1.1) ${T.textureFilter || ''}`
          : (T.textureFilter || 'none'),
        // keyword é a camada principal — escala 0.22 (slider default) → ~0.7
        // pra manter a intensidade visual histórica. Multiplica o slider por ~3.
        opacity: bgIn * (resolvedBgImage ? 0.45 : 0.7) * (bgTextureOpacity != null ? (bgTextureOpacity / 0.22) : 1),
      }} />

      {/* Camada 2: radial gradient theme-aware — luz do accent no centro,
          escuro do bg nas bordas. Cada tema cria sua "atmosfera". */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 45%, ${T.accent || '#82CCA5'}26 0%, transparent 50%, ${T.bg || '#143F2C'}59 100%)`,
        opacity: bgIn,
        pointerEvents: 'none',
      }} />

      {/* Camada 3: vinheta sutil */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.30) 100%)',
        opacity: bgIn,
        pointerEvents: 'none',
      }} />
      </> : null}

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
        filter: T.flat ? 'none' : (T.iconFilter || 'drop-shadow(0 10px 28px rgba(0,0,0,0.45))'),
        color: iconColor,
      }}>
        <StaticMotionIcon icon={resolvedIcon} size={180} color={iconColor} />
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
          fontWeight: 500,
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          textAlign: 'center',
          maxWidth: 920,
          color: T.wordColor || T.fg,
          textShadow: T.flat ? 'none' : (T.wordTextShadow || '0 6px 32px rgba(0,0,0,0.45)'),
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
            boxShadow: T.flat ? 'none' : `0 0 28px ${T.accent}aa`,
          }} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
