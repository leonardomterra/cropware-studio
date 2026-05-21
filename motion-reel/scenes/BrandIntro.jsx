import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { TypewriterText, EASE } from '../helpers.jsx';

// Cena 01 — IDENTIDADE CROPWARE (locked).
// Visual: imagem do site (homem no campo ao entardecer, hero da /conheca)
// com Ken Burns lento + overlay verde escuro + textos e logo em branco.
// Storyboard NÃO controla nada aqui — tudo hardcoded pra garantir consistência
// da identidade visual em todo reel. Props ignoradas (start/end pra duração).

const BG_IMAGE = 'conheca-hero-bg.webp';
const KICKER = 'CONHEÇA';
const LOGO = 'logo-cropware-pb-final.svg';
const TAGLINE_LINES = ['Gestão de', 'Desenvolvimento', 'de Mercado'];

export const BrandIntro = ({ start, end, theme = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;
  const T = theme || {};
  const fg = T.fg || MR_COLORS.white;
  const accent = T.accent || MR_COLORS.greenBright;
  const textShadow = T.textShadow || '0 2px 18px rgba(0,0,0,0.45)';

  // Entrada cinematográfica (0 → 0.8s): fade + blur out + extra-zoom drift.
  // Depois disso entra o Ken Burns clássico (scale lento ao longo da cena).
  const enterP = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: EASE.outQuint,
  });

  // Ken Burns base: 1.05 → 1.18 ao longo da cena toda + drift -28px.
  // Entrada adiciona +0.12 no início pra dar sensação de "se aproximando".
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.18], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const entranceBoost = (1 - enterP) * 0.12;
  const imgScale = kbScale + entranceBoost;
  const kbTy = interpolate(frame, [0, durFrames], [0, -28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgBlur = (1 - enterP) * 22;
  const imgOpacity = enterP;

  // Overlay glass: fade in mais rápido. O blur do backdrop-filter sobe de 0
  // pra 32px na entrada (efeito de "vidro se formando" sobre a imagem).
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 32], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: T.bg || MR_COLORS.slateAbyss, overflow: 'hidden' }}>
      {/* Camada 1: imagem — entra com fade + blur out + extra-zoom, segue em Ken Burns.
          Visível por trás do vidro durante toda a cena. */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(T.bgImage || BG_IMAGE)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: GLASS PANE — backdrop-blur + saturate (espelha o liquid
          glass do .moldura-glass do studio) com tint verde translúcido.
          Mantém opacidade baixa pra imagem vazar pelo vidro. */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(170%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(170%)`,
        background: T.glassTint || 'linear-gradient(180deg, rgba(20,63,44,0.32) 0%, rgba(20,63,44,0.50) 55%, rgba(10,42,28,0.72) 100%)',
        opacity: overlayP,
      }} />

      {/* Camada 3: TOP SHEEN — gradiente branco fino no topo simulando o brilho
          da luz batendo na superfície do vidro. */}
      <AbsoluteFill style={{
        background: T.topSheen || 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 12%, rgba(255,255,255,0) 28%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: BOTTOM DEPTH — sombra interna na base pra dar peso/3D ao vidro. */}
      <AbsoluteFill style={{
        background: T.bottomDepth || 'linear-gradient(0deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0) 38%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta sutil pra focar atenção no centro */}
      <AbsoluteFill style={{
        background: T.vignette || 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.40) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: CONTEÚDO — position relative + zIndex pra ficar acima das ABS positioned acima */}
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
        color: fg,
        fontFamily: MR_FONTS.display,
      }}>
        <KickerBlock kicker={KICKER} delay={0.25} color={fg} accent={accent} textShadow={textShadow} />
        <LogoReveal src={LOGO} delay={1.3} color={T.logoColor || fg} />
        <TaglineBlock lines={TAGLINE_LINES} delay={2.6} color={fg} accent={accent} textShadow={textShadow} />
      </div>
    </AbsoluteFill>
  );
};

// ─────────────── Kicker bloco ───────────────
// Typewriter "CONHEÇA" branco + underline verde desenhando + leve breath
// no letter-spacing depois que termina de digitar.
const KickerBlock = ({ kicker, delay = 0.25, color = MR_COLORS.white, accent = MR_COLORS.greenBright, textShadow = '0 2px 18px rgba(0,0,0,0.45)' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const charDur = 0.09;
  const totalType = (kicker.length * charDur) + 0.2;
  const underlineStart = delay + totalType + 0.1;
  const underlineP = interpolate(frame, [underlineStart * fps, (underlineStart + 0.6) * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outBack,
  });
  const breathPhase = Math.max(0, frame / fps - (underlineStart + 0.6));
  const breathSin = Math.sin(breathPhase * Math.PI / 1.4);
  const letterSpacing = 0.14 + breathSin * 0.02;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 26,
      // transform pra criar stacking context, garantindo que os chars do
      // TypewriterText (que são spans inline sem position/transform) fiquem
      // por cima de qualquer camada absoluta de fundo.
      transform: 'translateZ(0)',
    }}>
      <div style={{
        fontFamily: MR_FONTS.mono,
        fontSize: 64,
        fontWeight: 400,
        color,
        letterSpacing: `${letterSpacing.toFixed(3)}em`,
        textTransform: 'uppercase',
        lineHeight: 1,
        textShadow,
      }}>
        <TypewriterText
          text={kicker}
          delay={delay}
          charDur={charDur}
          showCursor={false}
        />
      </div>
      {/* Underline verde brilhante — desenha da esquerda pra direita */}
      <div style={{
        width: 180,
        height: 5,
        background: accent,
        transformOrigin: 'left center',
        transform: `scaleX(${underlineP.toFixed(3)})`,
        borderRadius: 2,
        boxShadow: `0 0 24px ${accent}99`,
      }} />
    </div>
  );
};

// ─────────────── Logo bloco ───────────────
// Logo Cropware em BRANCO via CSS mask (SVG vira máscara, background = white).
// Entrada: blur 16→0 + scale 1.10→1 + drift + opacity 0→1 + settle spring.
const LogoReveal = ({ src, delay = 1.3, color = MR_COLORS.white }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterP = interpolate(frame, [delay * fps, (delay + 0.8) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuint,
  });
  const settle = spring({
    frame: frame - (delay + 0.8) * fps,
    fps,
    config: { damping: 11, stiffness: 130, mass: 0.8 },
  });
  const baseScale = 1.10 - 0.10 * enterP;
  const settleScale = 1.00 + (1 - settle) * 0.03 * (settle > 0.05 ? 1 : 0);
  const scale = baseScale * settleScale;
  const blurPx = (1 - enterP) * 16;
  const translateY = (1 - enterP) * 24;
  return (
    <div style={{
      width: 760,
      height: 220,
      WebkitMaskImage: `url('${staticFile(src)}')`,
      maskImage: `url('${staticFile(src)}')`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      background: color,
      transform: `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(2)}px)`,
      transformOrigin: 'center',
      filter: `blur(${blurPx.toFixed(2)}px) drop-shadow(0 12px 48px rgba(0,0,0,0.45))`,
      opacity: enterP,
    }} />
  );
};

// ─────────────── Tagline bloco ───────────────
// 3 linhas Space Mono uppercase em branco com char-reveal staggered.
const TaglineBlock = ({ lines, delay = 2.6, color = MR_COLORS.white, accent = MR_COLORS.greenBright, textShadow = '0 2px 16px rgba(0,0,0,0.45)' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      marginTop: 14,
      // Stacking context defensivo, mesma razão do KickerBlock.
      transform: 'translateZ(0)',
    }}>
      {lines.map((line, i) => {
        const isMid = i === Math.floor(lines.length / 2);
        const lineDelay = delay + i * 0.35;
        return (
          <TaglineLine
            key={i}
            text={line}
            delay={lineDelay}
            emphasized={isMid}
            color={color}
            accent={accent}
            textShadow={textShadow}
          />
        );
      })}
    </div>
  );
};

const TaglineLine = ({ text, delay, emphasized, color = MR_COLORS.white, accent = MR_COLORS.greenBright, textShadow = '0 2px 16px rgba(0,0,0,0.45)' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = [...(text || '').toUpperCase()];
  const stagger = 0.022;
  const charDur = 0.32;
  return (
    <div style={{
      fontFamily: MR_FONTS.mono,
      fontSize: emphasized ? 56 : 48,
      fontWeight: 400,
      color: emphasized ? accent : color,
      letterSpacing: emphasized ? '0.13em' : '0.16em',
      textTransform: 'uppercase',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      opacity: emphasized ? 1 : 0.9,
      textShadow: emphasized
        ? `${textShadow}, 0 0 28px ${accent}55`
        : textShadow,
    }}>
      {chars.map((ch, i) => {
        const start = delay + i * stagger;
        const p = interpolate(frame, [start * fps, (start + charDur) * fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASE.outQuart,
        });
        const isSpace = ch === ' ';
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: p,
            filter: `blur(${((1 - p) * 7).toFixed(2)}px)`,
            transform: `translateY(${(1 - p) * 18}px) scale(${(0.96 + p * 0.04).toFixed(3)})`,
            // inline-block + letter-spacing colapsa o glifo de espaço em alguns
            // navegadores; forçamos largura explícita em em (escala com fontSize).
            width: isSpace ? '0.5em' : undefined,
          }}>{isSpace ? '' : ch}</span>
        );
      })}
    </div>
  );
};
