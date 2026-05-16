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
