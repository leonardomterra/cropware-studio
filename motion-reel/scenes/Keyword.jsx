// Cena 03 — KEYWORD (custom, tema-driven).
// Visual: textura `keyword-texture.webp` tintada conforme tema (mix-blend
// multiply ou screen) + 1 ícone Iconify animado no topo + palavra em Space
// Mono uppercase + underline. IA preenche word + (opcional) icon.
// R16: bg/fg/accent vêm do theme prop (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, StaticMotionIcon, EASE, balanceTwoLines } from '../helpers.jsx';
import { resolveKeywordAnimatedIcon } from '../keyword-icons.js';
import { KeywordWindow, KEYWORD_WINDOW_TYPES } from './keyword-windows.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide.keyword;

const alphaHex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');

export const Keyword = ({
  word,
  icon = 'line-md:speed-loop',
  underline = true,
  uiDemo,
  theme,
  bgImage,
  bgImageBlur,
  bgOverlayOpacity,
  overlayColor,
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

  // R28: Card breathing glow — depois da entrada, oscila intensidade e tamanho
  // do halo accent. Cria sensação de "card energético/respirando" sutilmente.
  const tSec = frame / fps;
  const breathPhase = (Math.sin((tSec - underlineDelay - 0.5) * Math.PI * 0.7) + 1) / 2; // 0→1 oscilando
  const cardEntered = underlineP >= 0.99;
  const glowAlpha = cardEntered ? 0.30 + 0.25 * breathPhase : 0.30;
  const glowSize = cardEntered ? 40 + 28 * breathPhase : 40;
  const glowHex = Math.round(glowAlpha * 255).toString(16).padStart(2, '0');
  // Light streak — passa diagonalmente uma vez após a entrada (one-shot).
  const streakP = interpolate(
    frame,
    [(underlineDelay + 0.6) * fps, (underlineDelay + 1.4) * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOutCubic }
  );
  const streakActive = streakP > 0 && streakP < 1;

  // Keyword agora aceita palavra única OU frase curta. Conta palavras pra
  // escalar a fonte; 2+ palavras quebram em 2 linhas balanceadas.
  const _kwRaw = String(word || '').trim();
  const _kwWordCount = _kwRaw ? _kwRaw.split(/\s+/).length : 1;
  const _kwText = _kwWordCount >= 2 ? balanceTwoLines(_kwRaw) : _kwRaw;

  return (
    <AbsoluteFill style={{
      background: T.reelSharedBg ? 'transparent' : T.bg,
      color: T.fg,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 56,
      fontFamily: MR_FONTS.caps,
      overflow: 'hidden',
    }}>
      {(!T.flat && !T.reelSharedBg) ? <>
      {/* Camada 0: foto de fundo com Ken Burns — escurecida/dessaturada
          pra a palavra/ícone respirarem. Só renderiza quando há bgImage. */}
      {resolvedBgImage ? (
        <AbsoluteFill style={{
          backgroundImage: `url('${staticFile(resolvedBgImage)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(${kbScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
          transformOrigin: 'center',
          filter: `blur(${bgImageBlur != null ? bgImageBlur : 6}px) brightness(0.62) saturate(0.85)`,
          opacity: bgIn,
        }} />
      ) : null}

      {/* Camada 0.5: tonalização da foto — usa scene.overlayColor quando setado
          (R26: padronização cross-scene), senão T.bg (cor do tema). */}
      {resolvedBgImage ? (
        <AbsoluteFill style={{
          background: `${overlayColor || T.bg}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.55)}`,
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
        // R28h: textura ESTÁTICA (sem Ken Burns) — padronização.
        transform: 'scale(1.12)',
        transformOrigin: 'center',
        mixBlendMode: T.textureMode || 'multiply',
        filter: (bgTextureInvert !== false)
          ? `invert(1) contrast(1.1) ${T.textureFilter || ''}`
          : (T.textureFilter || 'none'),
        // keyword é a camada principal — escala 0.08 (slider default) → textura sutil
        // pra manter a intensidade visual histórica. Multiplica o slider por ~3.
        opacity: bgIn * (resolvedBgImage ? 0.45 : 0.7) * (bgTextureOpacity != null ? (bgTextureOpacity / 0.22) : (0.08 / 0.22)),
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

      {/* Slide 03 renderiza a janela-mockup por PADRÃO (modelo do slide 08), em
          qualquer reel — gerado ou manual. uiDemo escolhe o tipo: um tipo válido
          ('graph'|'dashboard'|'map'|'weather'|'tasks'|'alert') força aquela janela;
          ausente/true/legado → janela default do tema (T.keywordWindow);
          uiDemo:'card' é o escape-hatch que volta pro card de texto antigo. */}
      {uiDemo !== 'card' ? (
        <KeywordWindow
          type={KEYWORD_WINDOW_TYPES.includes(uiDemo) ? uiDemo : (T.keywordWindow || 'graph')}
          accent={T.accent}
          fg={T.wordColor || T.fg}
          flat={T.flat}
        />
      ) : (
      <>
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

      {/* Camada 5: palavra envolta em card outlined accent (R28). */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'relative',
          padding: '36px 56px',
          border: `3px solid ${T.accent}`,
          borderRadius: 16,
          background: T.flat ? 'transparent' : 'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 55%, rgba(20,63,44,0.14) 100%)',
          backdropFilter: T.flat ? 'none' : 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: T.flat ? 'none' : 'blur(18px) saturate(150%)',
          boxShadow: T.flat
            ? 'none'
            : `0 0 ${glowSize.toFixed(1)}px ${T.accent}${glowHex}, inset 0 1px 0 rgba(255,255,255,0.10)`,
          opacity: underlineP,
          transform: `scale(${(0.94 + 0.06 * underlineP).toFixed(4)})`,
          transformOrigin: 'center',
          overflow: 'hidden',
        }}>
          {/* R28: light streak — passa diagonalmente uma vez após entrada */}
          {!T.flat && streakActive ? (
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${(-100 + streakP * 200).toFixed(2)}%`,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0) 100%)',
              transform: 'skewX(-12deg)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }} />
          ) : null}
          <div style={{
            fontFamily: MR_FONTS.caps,
            // Tamanho adaptável ao nº de palavras: 1 palavra fica gigante (160);
            // frases curtas reduzem pra caber e quebram em 2 linhas balanceadas.
            fontSize: _kwWordCount >= 4 ? 70 : _kwWordCount === 3 ? 86 : _kwWordCount === 2 ? 108 : 144,
            fontWeight: 400,
            lineHeight: _kwWordCount >= 2 ? 1.02 : 0.92,
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
            maxWidth: 920,
            color: T.wordColor || T.fg,
            textShadow: T.flat ? 'none' : (T.wordTextShadow || '0 6px 32px rgba(0,0,0,0.45)'),
          }}>
            <CharReveal text={_kwText} delay={0.55} dur={0.4} stagger={0.032} ty={28} />
          </div>
        </div>
      </div>
      </>
      )}
    </AbsoluteFill>
  );
};
