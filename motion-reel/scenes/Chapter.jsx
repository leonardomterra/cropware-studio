// Chapter — marcador de capítulo (cenas 04 e 07 do reel padrão).
// Visual gêmeo da cena 01: imagem do site Cropware + Ken Burns lento + glass
// pane (backdrop-blur + tint slate) + ícone animado central + título + subtítulo.
// Conteúdo fixo por número de capítulo via CHAPTER_CONFIGS — storyboard só
// passa chapterNumber (2 ou 3).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, FadeSlide, AccentBar, LottieAsset, IconifyIcon, EASE } from '../helpers.jsx';

// Configs hardcoded por capítulo — adiciona entradas conforme padronizamos
// slides. Tudo da identidade Cropware fica aqui.
const CHAPTER_CONFIGS = {
  2: {
    image: 'conheca-produto-bg.webp',
    lottie: 'lottie/leaf-growing.json',
    lottiePosition: 'top',
    lottieTint: 'var(--mr-greenBright)',
    title: 'No campo.',
    subtitle: 'Onde toda decisão começa.',
  },
  3: {
    image: 'conheca-whatsapp-bg.webp',
    // Icons row em vez de Lottie — line-md (Iconify) com entrada staggered.
    // 5 ícones que ilustram funções core do app, neutros pra qualquer tema.
    icons: [
      'line-md:cloud-alt-loop',     // clima
      'line-md:speed-loop',         // tempo real / velocidade
      'line-md:bell-loop',          // alertas
      'line-md:document-report',    // relatórios / dados
      'line-md:phone-call-loop',    // mobile / app
    ],
    title: 'Em tempo real.',
    subtitle: 'Toda informação que o agro precisa.',
  },
};

const SLATE_TINT = 'linear-gradient(180deg, rgba(26,27,26,0.40) 0%, rgba(26,27,26,0.58) 55%, rgba(10,10,10,0.78) 100%)';

export const Chapter = ({ chapterNumber = 2, start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  const cfg = CHAPTER_CONFIGS[chapterNumber] || CHAPTER_CONFIGS[2];

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
  const imgBlur = (1 - enterP) * 22;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 32], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{ background: MR_COLORS.slateAbyss, overflow: 'hidden' }}>
      {/* Camada 1: imagem do site Cropware com Ken Burns */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(cfg.image)}')`,
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
        background: SLATE_TINT,
        opacity: overlayP,
      }} />

      {/* Camada 3: top sheen */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 30%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 4: bottom depth */}
      <AbsoluteFill style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 20%, rgba(0,0,0,0) 42%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

      {/* Camada 5: vinheta */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />

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
        gap: 38,
        color: MR_COLORS.white,
        fontFamily: MR_FONTS.display,
        textAlign: 'center',
      }}>
        {cfg.lottiePosition === 'top' && cfg.lottie ? (
          <LottieAsset
            src={cfg.lottie}
            size={460}
            delay={0.1}
            playbackRate={1.0}
            loop
            tint={cfg.lottieTint}
            style={{
              filter: 'drop-shadow(0 18px 48px rgba(0,0,0,0.55))',
              marginBottom: -80,
            }}
          />
        ) : null}
        {cfg.lottiePosition === 'top' ? (
          <AccentBar
            delay={0.85}
            dur={0.45}
            origin="center"
            color={MR_COLORS.greenBright}
            width={120}
            height={4}
            style={{ boxShadow: `0 0 24px ${MR_COLORS.greenBright}99`, borderRadius: 2 }}
          />
        ) : null}
        <div style={{
          fontFamily: MR_FONTS.display,
          fontSize: 128,
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          maxWidth: 920,
          color: MR_COLORS.white,
          textShadow: '0 4px 28px rgba(0,0,0,0.55)',
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
        {cfg.subtitle ? (
          <FadeSlide
            delay={cfg.lottiePosition === 'top' ? 1.6 : 0.9}
            dur={0.4}
            ty={20}
          >
            <div style={{
              fontFamily: MR_FONTS.grotesk,
              fontSize: 46,
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              maxWidth: 820,
              color: MR_COLORS.white,
              opacity: 0.9,
              textShadow: '0 2px 16px rgba(0,0,0,0.45)',
            }}>{cfg.subtitle}</div>
          </FadeSlide>
        ) : null}
        {Array.isArray(cfg.icons) && cfg.icons.length ? (
          <>
            <AccentBar
              delay={1.25}
              dur={0.55}
              origin="center"
              color={MR_COLORS.greenBright}
              width={520}
              height={4}
              style={{ boxShadow: `0 0 28px ${MR_COLORS.greenBright}99`, borderRadius: 2 }}
            />
            <IconsRow icons={cfg.icons} delayStart={1.6} stagger={0.22} />
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────── IconsRow ───────────────
// Fila horizontal de ícones Iconify (line-md tem animações próprias) com
// entrada staggered: spring (scale + translateY) + fade pra cada um.
const IconsRow = ({ icons, delayStart = 0, stagger = 0.2, size = 120, gap = 44, color }) => {
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
        />
      ))}
    </div>
  );
};

const StaggeredIcon = ({ icon, delay, size, color }) => {
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
      filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))',
    }}>
      <IconifyIcon icon={icon} size={size} color={color} />
    </div>
  );
};

