// Chapter — marcador de capítulo (cenas 04 e 07 do reel padrão).
// Visual gêmeo da cena 01: imagem do site Cropware + Ken Burns lento + glass
// pane (backdrop-blur + tint slate) + ícone animado central + título + subtítulo.
// Conteúdo fixo por número de capítulo via CHAPTER_CONFIGS — storyboard só
// passa chapterNumber (2 ou 3).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, FadeSlide, AccentBar, LottieAsset, StaticMotionIcon, GlassCard, IconInOut, EASE } from '../helpers.jsx';

// Configs hardcoded por capítulo — adiciona entradas conforme padronizamos
// slides. Tudo da identidade Cropware fica aqui.
const CHAPTER_CONFIGS = {
  2: {
    image: 'conheca-produto-bg.webp',
    lottie: 'lottie/leaf-growing.json',
    lottiePosition: 'top',
    lottieTint: 'var(--mr-greenBright)',
    title: 'No campo',
    subtitle: 'onde toda\ndecisão começa.',
    combinedPhrase: true,
  },
  3: {
    image: 'conheca-whatsapp-bg.webp',
    // R28h: ícone Phosphor fixo no topo (substituiu o wifi-signal Lottie), com
    // entrada/saída via IconInOut. broadcast = transmissão/tempo real.
    topIcon: 'ph:broadcast-fill',
    lottiePosition: 'top',
    lottieTint: 'var(--mr-greenBright)',
    lottieSize: 260,
    lottieMarginBottom: -20,
    title: 'Em tempo real',
    subtitle: 'toda informação\nque o agro precisa.',
    combinedPhrase: true,
    glassPhrase: true, // slide 07: título Space Mono dentro de um glass plate
  },
};

const SLATE_TINT = 'linear-gradient(180deg, rgba(26,27,26,0.40) 0%, rgba(26,27,26,0.58) 55%, rgba(10,10,10,0.78) 100%)';

export const Chapter = ({ chapterNumber = 2, start, end, theme = {}, bgImage, bgImageBlur, bgOverlayOpacity, bgTexture, bgTextureOpacity, bgTextureInvert }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  const cfg = CHAPTER_CONFIGS[chapterNumber] || CHAPTER_CONFIGS[2];
  const T = theme || {};
  const fg = T.fg || MR_COLORS.white;
  const accent = T.accent || MR_COLORS.greenBright;
  const subtitleColor = T.subtitleColor || fg;
  const textShadow = T.flat ? 'none' : (T.textShadow || '0 4px 28px rgba(0,0,0,0.55)');
  const subtitleShadow = T.flat ? 'none' : (T.subtitleShadow || '0 2px 16px rgba(0,0,0,0.45)');
  const iconShadow = T.flat ? 'none' : (T.iconShadow || '0 8px 18px rgba(0,0,0,0.55)');
  const lottieShadow = T.flat ? 'none' : 'drop-shadow(0 18px 48px rgba(0,0,0,0.55))';
  const accentGlow = T.flat ? 'none' : `0 0 24px ${accent}99`;
  const accentGlowWide = T.flat ? 'none' : `0 0 28px ${accent}99`;

  // ──── Entrada cinematográfica (mesma da BrandIntro) ────
  const enterP = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.18], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgScale = kbScale + (1 - enterP) * 0.12;
  const kbTy = interpolate(frame, [0, durFrames], [0, -28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgBlur = (bgImageBlur != null ? bgImageBlur : 6) + (1 - enterP) * 22;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 32], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: T.bg || MR_COLORS.slateAbyss, overflow: 'hidden' }}>
      {!T.flat ? <>
      {/* Camada 1: imagem do site Cropware com Ken Burns */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(bgImage || T.bgImage || cfg.image)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        filter: `blur(${imgBlur.toFixed(2)}px)`,
        opacity: imgOpacity,
      }} />

      {/* Camada 2: glass pane slate */}
      <AbsoluteFill style={{
        backdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${glassBlur.toFixed(2)}px) saturate(140%)`,
        background: T.glassTint || SLATE_TINT,
        opacity: overlayP * (bgOverlayOpacity != null ? bgOverlayOpacity : 1),
      }} />

      {/* Camada 2.5: ondas em movimento — acima do glass pra escapar do
          backdrop-blur, ainda abaixo do sheen/depth/vinheta pra ser tonalizada. */}
      <WavyLinesOverlay
        src={bgTexture || T.bgTexture}
        frame={frame} fps={fps} durFrames={durFrames}
        invert={bgTextureInvert !== false}
        opacity={overlayP * (bgTextureOpacity != null ? bgTextureOpacity : 0.08)}
      />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: T.topSheen || 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 30%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: T.bottomDepth || 'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 20%, rgba(0,0,0,0) 42%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: T.vignette || 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />
      </> : null}

      {/* Camada 6: conteúdo centralizado.
          - Top layout (cap04): Lottie → AccentBar → Title → Subtitle
          - Icons row (cap07):  Title → Subtitle → IconsRow staggered */}
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
        gap: 56,
        color: fg,
        fontFamily: MR_FONTS.display,
        textAlign: 'center',
      }}>
        {cfg.lottiePosition === 'top' && cfg.topIcon ? (
          <IconInOut
            durFrames={durFrames}
            inDelay={0.15}
            style={{
              marginBottom: cfg.lottieMarginBottom != null ? cfg.lottieMarginBottom : -80,
              color: T.iconColor || cfg.lottieTint || accent,
              filter: lottieShadow === 'none' ? 'none' : lottieShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <StaticMotionIcon icon={cfg.topIcon} size={cfg.lottieSize || 260} color="currentColor" />
          </IconInOut>
        ) : cfg.lottiePosition === 'top' && cfg.lottie ? (
          <LottieAsset
            src={cfg.lottie}
            size={cfg.lottieSize || 460}
            delay={0.1}
            playbackRate={1.0}
            loop={false}
            tint={T.iconColor || cfg.lottieTint}
            style={{
              filter: lottieShadow === 'none' ? 'none' : lottieShadow,
              marginBottom: cfg.lottieMarginBottom != null ? cfg.lottieMarginBottom : -80,
            }}
          />
        ) : null}
        {cfg.lottiePosition === 'top' ? (
          <AccentBar
            delay={0.85}
            dur={0.45}
            origin="center"
            color={accent}
            width={120}
            height={4}
            style={{ boxShadow: accentGlow, borderRadius: 2 }}
          />
        ) : null}
        {cfg.combinedPhrase ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            maxWidth: 920,
            color: fg,
            textShadow,
            transform: 'translateZ(0)',
          }}>
            {(() => {
              const titleEl = (
                <div style={{
                  fontFamily: MR_FONTS.caps,
                  fontSize: 88,
                  fontWeight: 400,
                  lineHeight: 0.92,
                  letterSpacing: '-0.05em',
                  textTransform: 'uppercase',
                  color: fg,
                }}>
                  <CharReveal
                    text={cfg.title}
                    delay={1.0}
                    dur={0.4}
                    stagger={0.03}
                    ty={24}
                  />
                </div>
              );
              // R28h: no slide 07 o título Space Mono ganha um glass plate slate
              // (plate aparece um pouco antes do CharReveal pra "receber" o texto).
              return cfg.glassPhrase ? (
                <GlassCard
                  delay={0.85}
                  dur={0.5}
                  padding="18px 46px"
                  borderRadius={24}
                  tint={SLATE_TINT}
                  style={{ alignSelf: 'center', width: 'fit-content', maxWidth: 940 }}
                >
                  {titleEl}
                </GlassCard>
              ) : titleEl;
            })()}
            <div style={{
              fontFamily: MR_FONTS.grotesk,
              fontSize: 72,
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              maxWidth: 700,
              color: subtitleColor,
              opacity: 0.92,
              whiteSpace: 'pre-line',
            }}>
              <CharReveal
                text={cfg.subtitle}
                delay={1.24}
                dur={0.35}
                stagger={0.02}
                ty={18}
              />
            </div>
          </div>
        ) : (
          <div style={{
            fontFamily: MR_FONTS.display,
            fontSize: 110,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            maxWidth: 920,
            color: fg,
            textShadow,
            transform: 'translateZ(0)',
          }}>
            <CharReveal
              text={cfg.title}
              delay={cfg.lottiePosition === 'top' ? 1.0 : 0.3}
              dur={0.4}
              stagger={0.03}
              ty={24}
            />
          </div>
        )}
        {cfg.subtitle && !cfg.combinedPhrase ? (
          <FadeSlide
            delay={cfg.lottiePosition === 'top' ? 1.6 : 0.9}
            dur={0.4}
            ty={20}
          >
            <div style={{
              fontFamily: MR_FONTS.grotesk,
              fontSize: 72,
              fontWeight: 400,
              lineHeight: 1.18,
              letterSpacing: '-0.018em',
              maxWidth: 880,
              color: subtitleColor,
              opacity: 0.92,
              textShadow: subtitleShadow,
              whiteSpace: 'pre-line',
            }}>{cfg.subtitle}</div>
          </FadeSlide>
        ) : null}
        {Array.isArray(cfg.icons) && cfg.icons.length ? (
          <>
            <AccentBar
              delay={1.25}
              dur={0.55}
              origin="center"
              color={accent}
              width={520}
              height={4}
              style={{ boxShadow: accentGlowWide, borderRadius: 2 }}
            />
            <GlassCard delay={1.45} padding="46px 68px">
              <IconsRow icons={cfg.icons} delayStart={1.6} stagger={0.22} color={T.iconColor || fg} shadow={iconShadow} />
            </GlassCard>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────── IconsRow ───────────────
// Fila horizontal de ícones Iconify (line-md tem animações próprias) com
// entrada staggered: spring (scale + translateY) + fade pra cada um.
const IconsRow = ({ icons, delayStart = 0, stagger = 0.2, size = 120, gap = 56, color, shadow }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap,
      marginTop: 16,
      transform: 'translateZ(0)', // stacking context defensivo
    }}>
      {icons.map((icon, i) => (
        <StaggeredIcon
          key={icon + '-' + i}
          icon={icon}
          delay={delayStart + i * stagger}
          size={size}
          color={color || MR_COLORS.white}
          shadow={shadow}
        />
      ))}
    </div>
  );
};

const StaggeredIcon = ({ icon, delay, size, color, shadow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.8 },
  });
  const scale = 0.55 + 0.45 * s;
  const opacity = Math.min(1, s * 1.4);
  const translateY = (1 - Math.min(1, s)) * 26;
  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(2)}px)`,
      transformOrigin: 'center',
      opacity,
      filter: shadow === 'none' ? 'none' : `drop-shadow(${shadow || '0 8px 18px rgba(0,0,0,0.55)'})`,
    }}>
      <StaticMotionIcon icon={icon} size={size} color={color} />
    </div>
  );
};

// Overlay de linhas onduladas em movimento (cap03). Imagem original é fundo
// branco + linhas pretas. Por default invertemos pra ficar branco sobre dark
// e compomos com 'screen' (só linhas claras passam). Para temas claros,
// `invert=true` mantém a imagem original e usa 'multiply'.
const WAVY_LINES_DEFAULT = 'motion-reel/texture-pool/texture-pool-009.webp';

const WavyLinesOverlay = ({ src, frame, fps, durFrames, invert, opacity = 1 }) => {
  const textureSrc = src || WAVY_LINES_DEFAULT;
  // R28h: textura ESTÁTICA — sem pan/rotação/breath (padronização).
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
        transform: 'scale(1.3)',
        transformOrigin: 'center',
        // Imagem original é branca/preta. Sem invert: invertemos pra que as
        // linhas pretas virem brancas (e 'screen' deixe só elas visíveis).
        filter: invert ? 'contrast(1.1)' : 'invert(1) contrast(1.15)',
      }} />
    </AbsoluteFill>
  );
};

