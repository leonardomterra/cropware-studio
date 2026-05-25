// Cena 02 — HEADLINE (custom, tema-driven).
// Substitui o antigo stat-card (que dependia de números fictícios).
// Visual: imagem + Ken Burns + glass tint + kicker mono + frase editorial
// + accent bar. R16: bg/fg/accent/bgImage/glassTint vêm do theme prop
// (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, spring } from 'remotion';
import { MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, KickerReveal, EASE, LottieAsset } from '../helpers.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide.headline;

export const Headline = ({
  kicker,
  headline,
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
        backgroundImage: `url('${staticFile(bgImage || T.bgImage || 'conheca-solucao-bg.webp')}')`,
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

      {/* Camada 2.5: curvas abstratas como textura de fundo em movimento.
          Acima do glass (escapa do backdrop-blur), abaixo do sheen/depth/vinheta
          pra ainda ser tonalizada pelas camadas seguintes. */}
      <AbstractCurvesOverlay
        src={bgTexture || T.bgTexture}
        frame={frame} fps={fps} durFrames={durFrames}
        invert={bgTextureInvert !== false}
        opacity={overlayP * (bgTextureOpacity != null ? bgTextureOpacity : 0.22)}
      />

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
      </> : null}

      {/* Camada 6: conteúdo — wifi Lottie no topo + kicker + headline + dots */}
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
        color: T.fg,
        fontFamily: MR_FONTS.display,
        textAlign: 'center',
      }}>
        {/* R27: bar-chart-growth Lottie acima do kicker — eco visual de
            "crescimento / dado / mercado" coerente com o headline editorial. */}
        <LottieAsset
          src="lottie/bar-chart-growth.json"
          size={220}
          delay={0.1}
          playbackRate={1.0}
          loop={false}
          tint={T.accent || 'var(--mr-greenBright)'}
          style={{
            filter: T.flat ? 'none' : 'drop-shadow(0 10px 28px rgba(0,0,0,0.45))',
            marginBottom: -8,
          }}
        />
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0.4}
            dur={0.5}
            fromEm={0.02}
            toEm={0.06}
            style={{
              fontFamily: MR_FONTS.caps,
              fontSize: 56,
              fontWeight: 400,
              color: T.kickerColor || T.accent,
              textTransform: 'uppercase',
              textShadow: T.flat ? 'none' : '0 2px 14px rgba(0,0,0,0.45)',
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
          color: T.fg,
          textShadow: T.flat ? 'none' : (T.textShadow || '0 4px 28px rgba(0,0,0,0.55)'),
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

      </div>
    </AbsoluteFill>
  );
};

// Ornamento de 3 pontos centrais com entrada staggered (spring scale + fade).
// Substituiu a AccentBar — minimalista, mais editorial. O ponto central pulsa
// sutilmente depois da entrada pra dar vida discreta.
const DotsOrnament = ({ delayStart = 0, color = '#FFF', size = 10, gap = 22, flat = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tSec = frame / fps;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap,
      marginTop: 6,
    }}>
      {[0, 1, 2].map(i => {
        const s = spring({
          frame: frame - (delayStart + i * 0.12) * fps,
          fps,
          config: { damping: 14, stiffness: 130, mass: 0.7 },
        });
        const opacity = Math.min(1, s * 1.4);
        const scale = 0.4 + 0.6 * s;
        // Pulso só no ponto central, começa depois da entrada completa.
        const centerPulse = i === 1 ? 1 + 0.18 * Math.sin(tSec * 1.8) : 1;
        const finalScale = scale * centerPulse;
        return (
          <span key={i} style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            opacity,
            transform: `scale(${finalScale.toFixed(4)})`,
            boxShadow: flat ? 'none' : `0 0 12px ${color}77`,
          }} />
        );
      })}
    </div>
  );
};

// Overlay de textura topográfica verde em movimento (slide 02). Imagem já vem
// na paleta verde Cropware (fundo greenAbyss + linhas greenAccent suaves), então
// não precisa de invert. Blend 'screen' destaca as linhas claras como luz.
const HEADLINE_TEXTURE_DEFAULT = 'motion-reel/texture-pool/texture-pool-001.webp';

const AbstractCurvesOverlay = ({ src, frame, fps, durFrames, invert, opacity = 1 }) => {
  const textureSrc = src || HEADLINE_TEXTURE_DEFAULT;
  // Movimento estilo Ken Burns: zoom-in muito lento + drift sutil pra cima.
  // Sem rotação, sem oscilação senoidal — só uma "câmera" parada se aproximando.
  const t = interpolate(frame, [0, durFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOutCubic,
  });
  // Imagem original é landscape (~600x300). Rotaciona 91° pra ficar portrait
  // e encaixar melhor no viewport vertical 1080x1920. Scale maior compensa o
  // recorte da rotação. Zoom-out lento (começa maior, abre devagar).
  const scale = interpolate(t, [0, 1], [2.25, 1.95]);
  const ty = 0;

  return (
    <AbsoluteFill style={{
      opacity,
      pointerEvents: 'none',
      overflow: 'hidden',
      mixBlendMode: invert ? 'multiply' : 'screen',
    }}>
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(textureSrc)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `rotate(91deg) scale(${scale.toFixed(4)}) translateY(${ty.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: invert ? 'invert(1) hue-rotate(180deg) contrast(1.1) brightness(0.95)' : 'contrast(1.2) brightness(1.15)',
      }} />
    </AbsoluteFill>
  );
};
