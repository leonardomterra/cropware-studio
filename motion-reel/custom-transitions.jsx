// Presentations customizadas para o TransitionSeries do Remotion.
// O contrato: cada presentation é um objeto { component, props } onde
// o `component` recebe { children, presentationProgress (0..1),
// presentationDirection ('entering'|'exiting'), passedProps }.
//
// Os 3 efeitos abaixo cobrem buracos do @remotion/transitions v4.0.462:
//   - flash: pulso de cor (default branco) no boundary
//   - zoomBlur: zoom + blur progressivo, simulando motion blur
//   - maskCircle: clip-path circular expandindo (alternativa ao iris bugado)

import { AbsoluteFill } from 'remotion';

// ─── FLASH ───────────────────────────────────────────────────────────
// Pulso branco em sino: opacidade do overlay 0 → 1 → 0 ao longo da
// transição. Conteúdo de cada cena fica invisível no pico (progress=0.5)
// porque a opacidade da cena cai pra zero antes do overlay desaparecer.
const FlashPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const color = (passedProps && passedProps.color) || '#FFFFFF';
  // Sino: pico em 1.0 quando progress=0.5.
  const overlayOpacity = 1 - Math.pow(2 * presentationProgress - 1, 2);
  // Cenas: exit some no primeiro meio, enter aparece no segundo meio.
  const sceneOpacity = presentationDirection === 'entering'
    ? Math.max(0, presentationProgress * 2 - 1)
    : Math.max(0, 1 - presentationProgress * 2);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {children}
      <AbsoluteFill style={{
        background: color,
        opacity: overlayOpacity,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
export const flash = (props = {}) => ({
  component: FlashPresentation,
  props,
});

// ─── ZOOM-BLUR ───────────────────────────────────────────────────────
// Combo de scale + motion blur via CSS filter:blur. A cena que sai dá
// zoom-out (scale 1→1.15) e fica borrada; a que entra vem de scale 0.85
// e desblura conforme se aproxima de progress=1. Visualmente é um
// "punch zoom" cinematográfico.
const ZoomBlurPresentation = ({ children, presentationProgress, presentationDirection }) => {
  // Blur em sino, pico em progress=0.5 (8px). Suficiente pra dar sensação
  // de motion sem comer detalhes irrecuperáveis.
  const blurAmount = Math.sin(presentationProgress * Math.PI) * 8;
  if (presentationDirection === 'entering') {
    const scale = 0.85 + 0.15 * presentationProgress;
    return (
      <AbsoluteFill style={{
        opacity: presentationProgress,
        transform: `scale(${scale})`,
        filter: `blur(${blurAmount}px)`,
      }}>
        {children}
      </AbsoluteFill>
    );
  }
  const scale = 1 + 0.15 * presentationProgress;
  return (
    <AbsoluteFill style={{
      opacity: 1 - presentationProgress,
      transform: `scale(${scale})`,
      filter: `blur(${blurAmount}px)`,
    }}>
      {children}
    </AbsoluteFill>
  );
};
export const zoomBlur = () => ({ component: ZoomBlurPresentation, props: {} });

// ─── MASK-CIRCLE (substitui iris bugado) ─────────────────────────────
// Cena que entra é revelada por círculo expandindo do centro. Cena que
// sai fica parada por baixo. Tudo via CSS clip-path: circle().
//
// Origem do bug do iris() do @remotion/transitions: gera SVG path
// malformado em alguns frames. Esta implementação não usa SVG.
const MaskCirclePresentation = ({ children, presentationProgress, presentationDirection }) => {
  if (presentationDirection === 'entering') {
    // 0 → 110% (covers diagonal completamente)
    const radius = presentationProgress * 110;
    return (
      <AbsoluteFill style={{ clipPath: `circle(${radius}% at 50% 50%)` }}>
        {children}
      </AbsoluteFill>
    );
  }
  // Exit fica visível por baixo até ser totalmente coberta.
  return <AbsoluteFill>{children}</AbsoluteFill>;
};
export const maskCircle = () => ({ component: MaskCirclePresentation, props: {} });

// ─── CINEMATIC-BLUR ──────────────────────────────────────────────────
// Versão "premium" do zoom-blur: blur mais agressivo (até 24px no peak),
// scale mais visceral (1.18 na saída, 0.82 na entrada), curva ease-in-out
// pra dar peso. Mais lento que zoom-blur (esperar 0.6s+).
const CinematicBlurPresentation = ({ children, presentationProgress, presentationDirection }) => {
  const blurAmount = Math.sin(presentationProgress * Math.PI) * 24;
  if (presentationDirection === 'entering') {
    const scale = 0.82 + 0.18 * presentationProgress;
    return (
      <AbsoluteFill style={{
        opacity: presentationProgress,
        transform: `scale(${scale})`,
        filter: `blur(${blurAmount}px)`,
        transformOrigin: 'center',
      }}>
        {children}
      </AbsoluteFill>
    );
  }
  const scale = 1 + 0.18 * presentationProgress;
  return (
    <AbsoluteFill style={{
      opacity: 1 - presentationProgress,
      transform: `scale(${scale})`,
      filter: `blur(${blurAmount}px)`,
      transformOrigin: 'center',
    }}>
      {children}
    </AbsoluteFill>
  );
};
export const cinematicBlur = () => ({ component: CinematicBlurPresentation, props: {} });

// ─── RING-TUNNEL ─────────────────────────────────────────────────────
// Anel grosso escalando do centro: revela a cena nova POR DENTRO do anel.
// A cena que sai fica parada e desaparece quando o anel passa por ela.
// Inspirado no "Ring Tunnel" do Kinetic Marketing template.
const RingTunnelPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const ringColor = (passedProps && passedProps.color) || '#6AC58F';
  if (presentationDirection === 'entering') {
    // Entrada: scale 0.7 → 1 + opacity 0 → 1 (revelada por dentro do anel)
    const scale = 0.7 + 0.3 * presentationProgress;
    return (
      <AbsoluteFill style={{
        opacity: Math.max(0, presentationProgress * 1.4 - 0.4),
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}>
        {children}
      </AbsoluteFill>
    );
  }
  // Saída: cena fica, anel verde grosso passa por cima e some.
  // O anel é renderizado como um border-radius circular gigante via box-shadow inset.
  // raio do anel cresce de 0 → 200% da diagonal; espessura inicial grossa, afina conforme expande.
  const ringRadiusPct = presentationProgress * 200;
  const ringThickness = Math.max(0, 80 - presentationProgress * 80); // afina de 80px → 0
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        opacity: 1 - presentationProgress * 0.6,
        transform: `scale(${1 - presentationProgress * 0.2})`,
        transformOrigin: 'center',
      }}>
        {children}
      </AbsoluteFill>
      {/* O anel: círculo border-only no centro */}
      <AbsoluteFill style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: `${ringRadiusPct}%`,
          aspectRatio: '1',
          borderRadius: '50%',
          border: `${ringThickness}px solid ${ringColor}`,
          boxShadow: `0 0 60px ${ringColor}99, inset 0 0 60px ${ringColor}66`,
          opacity: Math.max(0, 1 - presentationProgress * 1.1),
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const ringTunnel = (props = {}) => ({ component: RingTunnelPresentation, props });

// ─── GLITCH ──────────────────────────────────────────────────────────
// 3 sub-frames de "fritura": cena rasgada em strips horizontais com
// deslocamento horizontal pseudo-aleatório (seeded por strip-index) +
// RGB split (3 copies em red/blue offset). Curto e brutal.
// Determinístico: mesmo frame produz mesma fritura.
const GlitchPresentation = ({ children, presentationProgress, presentationDirection }) => {
  // Intensidade em sino: pico em progress=0.5.
  const intensity = Math.sin(presentationProgress * Math.PI);
  // Visibilidade dura — exit some no meio, enter aparece no meio.
  const visible = presentationDirection === 'entering'
    ? Math.max(0, presentationProgress * 2 - 1)
    : Math.max(0, 1 - presentationProgress * 2);
  // RGB split offset em px (até ±16px no peak)
  const rgbOffset = intensity * 16;
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      {/* 3 cópias do mesmo content com filter hue-rotate + offset horizontal */}
      <AbsoluteFill style={{
        transform: `translateX(${-rgbOffset.toFixed(2)}px)`,
        filter: 'hue-rotate(0deg) saturate(2)',
        mixBlendMode: 'screen',
        opacity: 0.7,
        clipPath: 'inset(0)',
      }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{
        transform: `translateX(${rgbOffset.toFixed(2)}px)`,
        filter: 'hue-rotate(180deg) saturate(2)',
        mixBlendMode: 'screen',
        opacity: 0.7,
        clipPath: 'inset(0)',
      }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
export const glitch = () => ({ component: GlitchPresentation, props: {} });

// ─── SLIDE-RADIAL ────────────────────────────────────────────────────
// Wedge expandindo de um canto: a cena nova é revelada por um setor de
// pizza crescendo. Default: canto inferior-esquerdo.
// Cena que sai não muda (fica por baixo).
const SlideRadialPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const origin = (passedProps && passedProps.origin) || 'bottom-left';
  if (presentationDirection !== 'entering') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // Mapeia origem → posição do centro do círculo (em %) e ângulo inicial.
  const originMap = {
    'top-left':     [0, 0],
    'top-right':    [100, 0],
    'bottom-left':  [0, 100],
    'bottom-right': [100, 100],
    'center':       [50, 50],
  };
  const [cx, cy] = originMap[origin] || originMap['bottom-left'];
  // Raio precisa cobrir a diagonal — ~141% da menor dimensão garante.
  const radius = presentationProgress * 150;
  return (
    <AbsoluteFill style={{
      clipPath: `circle(${radius}% at ${cx}% ${cy}%)`,
    }}>
      {children}
    </AbsoluteFill>
  );
};
export const slideRadial = (props = {}) => ({ component: SlideRadialPresentation, props });

// ─── GLASS-FROST ─────────────────────────────────────────────────────
// A tela vira um vidro fosco/blur por um instante, depois clarea revelando
// a nova cena. Combina com a estética glass dos slides fixos.
const GlassFrostPresentation = ({ children, presentationProgress, presentationDirection }) => {
  if (presentationDirection === 'entering') {
    // Cena entra desfocada → foca + opacity 0 → 1 + scale 1.04 → 1
    const blur = (1 - presentationProgress) * 40;
    const scale = 1.04 - 0.04 * presentationProgress;
    const opacity = Math.min(1, presentationProgress * 1.4);
    return (
      <AbsoluteFill style={{
        filter: `blur(${blur.toFixed(2)}px)`,
        transform: `scale(${scale.toFixed(4)})`,
        opacity,
      }}>{children}</AbsoluteFill>
    );
  }
  // Saída: desfoca + scale up + fade out
  const blur = presentationProgress * 40;
  const scale = 1 + presentationProgress * 0.04;
  const opacity = Math.max(0, 1 - presentationProgress * 1.4);
  return (
    <AbsoluteFill style={{
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `scale(${scale.toFixed(4)})`,
      opacity,
    }}>{children}</AbsoluteFill>
  );
};
export const glassFrost = () => ({ component: GlassFrostPresentation, props: {} });

// ─── IRIS-SQUARE ─────────────────────────────────────────────────────
// Abertura/fechamento de "câmera antiga" em forma de quadrado arredondado.
// Variante do mask-circle com forma diferente (vibe Wes Anderson).
const IrisSquarePresentation = ({ children, presentationProgress, presentationDirection }) => {
  // Entrando: inset 50→0 (do centro pra fora)
  // Saindo: inset 0→50 (do todo pra um quadrado central)
  const inset = presentationDirection === 'entering'
    ? (1 - presentationProgress) * 50
    : presentationProgress * 50;
  return (
    <AbsoluteFill style={{
      clipPath: `inset(${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% round 4%)`,
    }}>
      {children}
    </AbsoluteFill>
  );
};
export const irisSquare = () => ({ component: IrisSquarePresentation, props: {} });

// ─── DRIFT-FADE ──────────────────────────────────────────────────────
// Crossfade lento com leve drift horizontal. Sutil, contemplativo,
// bom entre cenas de texto.
const DriftFadePresentation = ({ children, presentationProgress, presentationDirection }) => {
  if (presentationDirection === 'entering') {
    const opacity = presentationProgress;
    const tx = (1 - presentationProgress) * -20; // entra deslocada -20px e converge
    return (
      <AbsoluteFill style={{
        opacity,
        transform: `translateX(${tx.toFixed(2)}px)`,
      }}>{children}</AbsoluteFill>
    );
  }
  const opacity = 1 - presentationProgress;
  const tx = presentationProgress * 20;
  return (
    <AbsoluteFill style={{
      opacity,
      transform: `translateX(${tx.toFixed(2)}px)`,
    }}>{children}</AbsoluteFill>
  );
};
export const driftFade = () => ({ component: DriftFadePresentation, props: {} });

// ─── WHIP-PAN ────────────────────────────────────────────────────────
// "Chicote" lateral: a cena que sai desliza rápido pra fora com motion blur
// horizontal crescente; a nova entra do lado oposto e assenta desfocando.
// Energia de reels modernos. passedProps.direction: 'left' (default) | 'right'.
// 'left' = conteúdo sai pra esquerda, novo entra pela direita.
const WhipPanPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const dir = (passedProps && passedProps.direction) || 'left';
  const sign = dir === 'right' ? 1 : -1;
  // Motion blur horizontal via SVG (stdDeviation só no eixo X). Pico no meio.
  const blurX = Math.sin(p * Math.PI) * 34;
  const filterId = `whip-blur-${presentationDirection}`;

  const svgFilter = (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} />
        </filter>
      </defs>
    </svg>
  );

  if (presentationDirection === 'entering') {
    // Entra do lado oposto: de +120% (ou -120%) → 0, ease-out.
    const ease = 1 - Math.pow(1 - p, 2.2);
    const tx = -sign * (1 - ease) * 120;
    return (
      <AbsoluteFill style={{ transform: `translateX(${tx.toFixed(2)}%)`, filter: `url(#${filterId})` }}>
        {svgFilter}
        {children}
      </AbsoluteFill>
    );
  }
  // Sai pro lado: 0 → 120% na direção, ease-in (acelera).
  const ease = Math.pow(p, 2);
  const tx = sign * ease * 120;
  return (
    <AbsoluteFill style={{ transform: `translateX(${tx.toFixed(2)}%)`, filter: `url(#${filterId})` }}>
      {svgFilter}
      {children}
    </AbsoluteFill>
  );
};
export const whipPan = (props = {}) => ({ component: WhipPanPresentation, props });

// ─── SPLIT-SLIDE ─────────────────────────────────────────────────────
// A cena nova chega em DUAS METADES que entram de fora e se fecham no meio
// (cima+baixo ou esquerda+direita), cobrindo a cena anterior. Geométrico e
// elegante. O split é feito na cena que ENTRA porque ela fica por cima no
// empilhamento do TransitionSeries. passedProps.direction: 'horizontal'
// (default, metades vêm de cima/baixo) | 'vertical' (metades vêm dos lados).
const SplitSlidePresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const dir = (passedProps && passedProps.direction) || 'horizontal';

  if (presentationDirection !== 'entering') {
    // Cena que sai fica parada por baixo, leve scale pra dar profundidade.
    const scale = 1 - 0.04 * p;
    return (
      <AbsoluteFill style={{ transform: `scale(${scale.toFixed(4)})` }}>
        {children}
      </AbsoluteFill>
    );
  }
  // Entrada: duas metades vêm de fora (±110%) → 0, ease-out, fechando no meio.
  const ease = 1 - Math.pow(1 - p, 2.4);
  const off = (1 - ease) * 110;

  if (dir === 'vertical') {
    // Metades esquerda/direita entram dos lados.
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ clipPath: 'inset(0 50% 0 0)', transform: `translateX(${-off.toFixed(2)}%)` }}>
          {children}
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: 'inset(0 0 0 50%)', transform: `translateX(${off.toFixed(2)}%)` }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // Horizontal: metade de cima desce, metade de baixo sobe — encontram no meio.
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: 'inset(0 0 50% 0)', transform: `translateY(${-off.toFixed(2)}%)` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: 'inset(50% 0 0 0)', transform: `translateY(${off.toFixed(2)}%)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const splitSlide = (props = {}) => ({ component: SplitSlidePresentation, props });

// ─── GLOW-BLOOM ──────────────────────────────────────────────────────
// "Estouro de luz" fotográfico: a cena que sai superexpõe (brightness sobe,
// satura, ganha um glow radial) até estourar de luz; a nova EMERGE de dentro
// do brilho, voltando da superexposição ao normal. Mais orgânico que o flash.
// passedProps.tint: cor do glow (default branco). passedProps.intensity (0.5-2).
const GlowBloomPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const tint = (passedProps && passedProps.tint) || '#FFFFFF';
  const k = (passedProps && passedProps.intensity) || 1;
  // Glow em sino (0→1→0), pico em p=0.5.
  const bell = 1 - Math.pow(2 * p - 1, 2);

  if (presentationDirection === 'entering') {
    // Emerge da luz: brightness alto → 1, blur leve → 0, opacity sobe.
    const ep = Math.max(0, (p - 0.4) / 0.6);
    const bright = 1 + (1 - ep) * 2.2 * k;
    const blur = (1 - ep) * 10;
    const opacity = Math.min(1, p * 2);
    return (
      <AbsoluteFill style={{
        opacity,
        filter: `brightness(${bright.toFixed(3)}) saturate(${(1 + (1 - ep) * 0.5).toFixed(3)}) blur(${blur.toFixed(2)}px)`,
      }}>
        {children}
        <AbsoluteFill style={{
          background: `radial-gradient(circle at 50% 50%, ${tint} 0%, transparent 70%)`,
          opacity: (bell * 0.85).toFixed(3),
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />
      </AbsoluteFill>
    );
  }
  // Saída: estoura de luz — brightness sobe, satura, glow cresce, some no fim.
  const ep = Math.min(1, p / 0.6);
  const bright = 1 + ep * 2.4 * k;
  const opacity = p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.45);
  return (
    <AbsoluteFill style={{
      opacity,
      filter: `brightness(${bright.toFixed(3)}) saturate(${(1 + ep * 0.5).toFixed(3)})`,
    }}>
      {children}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 50%, ${tint} 0%, transparent 70%)`,
        opacity: (bell * 0.85).toFixed(3),
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
export const glowBloom = (props = {}) => ({ component: GlowBloomPresentation, props });

// ─── BLUR-DISSOLVE ───────────────────────────────────────────────────
// Crossfade contemplativo: ambas as cenas desfocam em direção ao pico e a
// nova refoca emergindo. Sonhador, suave — ótimo como respiro antes do fim.
// passedProps.blur: blur máximo no pico (default 26px).
const BlurDissolvePresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const maxBlur = (passedProps && passedProps.blur) || 26;

  if (presentationDirection === 'entering') {
    // Entra desfocada e foca; opacity sobe na segunda metade (crossfade).
    const blur = (1 - p) * maxBlur;
    const scale = 1.03 - 0.03 * p;
    const opacity = Math.max(0, p * 1.6 - 0.6); // começa a aparecer em ~37%
    return (
      <AbsoluteFill style={{
        opacity,
        transform: `scale(${scale.toFixed(4)})`,
        filter: `blur(${blur.toFixed(2)}px)`,
      }}>{children}</AbsoluteFill>
    );
  }
  // Saída: desfoca e some na primeira metade.
  const blur = p * maxBlur;
  const scale = 1 + 0.03 * p;
  const opacity = Math.max(0, 1 - p * 1.6); // some até ~62%
  return (
    <AbsoluteFill style={{
      opacity,
      transform: `scale(${scale.toFixed(4)})`,
      filter: `blur(${blur.toFixed(2)}px)`,
    }}>{children}</AbsoluteFill>
  );
};
export const blurDissolve = (props = {}) => ({ component: BlurDissolvePresentation, props });

// ─── PUSH-3D ─────────────────────────────────────────────────────────
// Rotação em perspectiva: a cena que sai gira pra dentro (feito uma porta
// abrindo) escurecendo, a nova entra girando do lado oposto. Premium, sutil.
// passedProps.direction: 'left' (default) | 'right' — lado do eixo de rotação.
const Push3DPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const dir = (passedProps && passedProps.direction) || 'left';
  const sign = dir === 'right' ? -1 : 1;
  const PERSPECTIVE = 1600; // px — quanto menor, mais dramática a perspectiva
  const MAX_ROT = 42;       // graus de rotação no extremo

  if (presentationDirection === 'entering') {
    // Entra girando do lado oposto: rotateY de +MAX → 0, ease-out.
    const ease = 1 - Math.pow(1 - p, 2.6);
    const rot = -sign * (1 - ease) * MAX_ROT;
    const tx = -sign * (1 - ease) * 18; // leve deslize lateral acompanhando
    const shade = (1 - ease) * 0.5;     // sombra que clareia
    return (
      <AbsoluteFill style={{ perspective: `${PERSPECTIVE}px` }}>
        <AbsoluteFill style={{
          transform: `translateX(${tx.toFixed(2)}%) rotateY(${rot.toFixed(2)}deg)`,
          transformOrigin: dir === 'right' ? 'right center' : 'left center',
          backfaceVisibility: 'hidden',
        }}>
          {children}
          <AbsoluteFill style={{ background: '#000', opacity: shade.toFixed(3), pointerEvents: 'none' }} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // Saída: gira pra dentro (rotateY 0 → -MAX), escurece. Ease-in.
  const ease = Math.pow(p, 1.8);
  const rot = sign * ease * MAX_ROT;
  const tx = sign * ease * 18;
  const shade = ease * 0.5;
  return (
    <AbsoluteFill style={{ perspective: `${PERSPECTIVE}px` }}>
      <AbsoluteFill style={{
        transform: `translateX(${tx.toFixed(2)}%) rotateY(${rot.toFixed(2)}deg)`,
        transformOrigin: dir === 'right' ? 'left center' : 'right center',
        backfaceVisibility: 'hidden',
      }}>
        {children}
        <AbsoluteFill style={{ background: '#000', opacity: shade.toFixed(3), pointerEvents: 'none' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const push3D = (props = {}) => ({ component: Push3DPresentation, props });

// ─── DIP-TO-BRAND ────────────────────────────────────────────────────
// A tela mergulha numa cor sólida (verde Cropware default) no boundary e
// reemerge na próxima cena. Cada cena desfoca + escurece em direção à cor;
// no pico (progress=0.5) a tela é quase 100% a cor. Editorial, reforça marca.
// passedProps.color: cor do dip (default verde Cropware).
const DipToBrandPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const color = (passedProps && passedProps.color) || '#6AC58F';
  // Cobertura com PLATÔ: sobe 0→1 até 38%, fica 100% entre 38%-62% (a tela
  // fica totalmente na cor — corte presente), desce 1→0 de 62% a 100%.
  let cover;
  if (p < 0.38)      cover = p / 0.38;
  else if (p > 0.62) cover = Math.max(0, 1 - (p - 0.62) / 0.38);
  else               cover = 1;

  if (presentationDirection === 'entering') {
    // Reemerge: aparece no segundo meio. Leve scale-down + blur que assenta.
    const ep = Math.max(0, (p - 0.4) / 0.6);
    const scale = 1.06 - 0.06 * ep;
    const blur = (1 - ep) * 12;
    return (
      <AbsoluteFill style={{ transform: `scale(${scale.toFixed(4)})`, filter: `blur(${blur.toFixed(2)}px)` }}>
        {children}
        <AbsoluteFill style={{ background: color, opacity: cover.toFixed(3), pointerEvents: 'none' }} />
      </AbsoluteFill>
    );
  }
  // Saída: mergulha na cor. Leve scale-up + blur crescente em direção ao pico.
  const ep = Math.min(1, p / 0.6);
  const scale = 1 + 0.06 * ep;
  const blur = ep * 12;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale.toFixed(4)})`, filter: `blur(${blur.toFixed(2)}px)` }}>
      {children}
      <AbsoluteFill style={{ background: color, opacity: cover.toFixed(3), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
export const dipToBrand = (props = {}) => ({ component: DipToBrandPresentation, props });

// ─── ZOOM-PUNCH ──────────────────────────────────────────────────────
// "Mergulho" cinematográfico: a cena que sai acelera num zoom forte
// (scale 1 → ~3.8) com origem configurável (default center) — como se a
// câmera entrasse PRA DENTRO de um elemento. A cena nova emerge de scale
// ~1.5 desfocada e foca rápido, dando a ilusão de zoom contínuo através do
// plano. Os elementos da cena nova seguem suas próprias animações de entrada.
//
// passedProps.origin: 'center' | 'top-left' | ... | '50% 38%' (CSS string).
// passedProps.scale: scale máximo da saída (default 3.8).
const ZoomPunchPresentation = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const p = presentationProgress;
  const originRaw = (passedProps && passedProps.origin) || 'center';
  // Normaliza atalhos pra CSS transform-origin.
  const originMap = {
    'center': '50% 50%',
    'top-left': '0% 0%', 'top-right': '100% 0%',
    'bottom-left': '0% 100%', 'bottom-right': '100% 100%',
    'top': '50% 0%', 'bottom': '50% 100%',
  };
  const origin = originMap[originRaw] || originRaw;
  const exitScaleMax = (passedProps && passedProps.scale) || 2.8;

  if (presentationDirection === 'entering') {
    // Emerge bem gentil: scale 1.6 → 1 com ease-out macio e blur sutil.
    // Crossfade longo (aparece já a partir de 30%) pra dissolver suavemente.
    const ep = Math.max(0, (p - 0.3) / 0.7);
    const ease = 1 - Math.pow(1 - ep, 1.6);    // ease-out macio
    const scale = 1.6 - 0.6 * ease;
    const blur = (1 - ease) * 9;
    const opacity = Math.min(1, ep * 1.35);
    return (
      <AbsoluteFill style={{
        opacity,
        transform: `scale(${scale.toFixed(4)})`,
        transformOrigin: origin,
        filter: `blur(${blur.toFixed(2)}px)`,
      }}>{children}</AbsoluteFill>
    );
  }
  // Saída: mergulho leve e fluido. Ease-in muito suave (1.05 ≈ linear),
  // crossfade bem longo (45%→90%) pra dissolver sem corte perceptível.
  const easeIn = Math.pow(p, 1.05);
  const scale = 1 + (exitScaleMax - 1) * easeIn;
  const blur = easeIn * 9;
  const opacity = p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.45);
  return (
    <AbsoluteFill style={{
      opacity,
      transform: `scale(${scale.toFixed(4)})`,
      transformOrigin: origin,
      filter: `blur(${blur.toFixed(2)}px)`,
    }}>{children}</AbsoluteFill>
  );
};
export const zoomPunch = (props = {}) => ({ component: ZoomPunchPresentation, props });

// ─── LIGHT-STREAK ────────────────────────────────────────────────────
// Feixe diagonal de luz cruza a tela e "carrega" a nova cena. Renderiza
// o streak sobre a cena que sai pra não duplicar.
const LightStreakPresentation = ({ children, presentationProgress, presentationDirection }) => {
  if (presentationDirection === 'entering') {
    // Entrada: simples fade-in atrás do streak (que vem da cena exiting)
    const opacity = Math.max(0, presentationProgress * 1.4 - 0.4);
    return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
  }
  // Saída: scene fade-out + streak diagonal cruzando da esquerda pra direita
  const opacity = Math.max(0, 1 - presentationProgress * 1.3);
  const streakX = presentationProgress * 100; // 0% → 100% da largura
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
      {/* Streak: faixa diagonal brilhante posicionada ao longo da progressão */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        bottom: '-20%',
        left: `${streakX - 35}%`,
        width: '70%',
        background: 'linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.55) 49%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.55) 51%, transparent 62%)',
        filter: 'blur(3px)',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
export const lightStreak = () => ({ component: LightStreakPresentation, props: {} });
