// Overlays decorativos opt-in por cena. Cada cena pode declarar:
//   "overlays": [ { type: "rotating-rings", ...props }, ... ]
// e o MotionReel renderiza essa lista POR CIMA do conteúdo da cena.
// Cada overlay é deterministicamente animado via useCurrentFrame() relativo
// à Sequence local — não usa CSS keyframes.
//
// Todos são feitos pra serem SUTIS e DECORATIVOS — nunca dominam o frame.
// Use opacity baixa, pointer-events: none, e composição leve.

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MR_COLORS, resolveColor } from './theme.js';
import { EASE } from './helpers.jsx';

// Lookup central pra renderizar overlay por tipo.
export const Overlay = ({ overlay, durSec }) => {
  if (!overlay || !overlay.type) return null;
  switch (overlay.type) {
    case 'rotating-rings':  return <RotatingRings {...overlay} />;
    case 'pulse-circle':    return <PulseCircle {...overlay} />;
    case 'particle-drift':  return <ParticleDrift {...overlay} durSec={durSec} />;
    case 'line-draw':       return <LineDraw {...overlay} durSec={durSec} />;
    case 'curve-trace':     return <CurveTrace {...overlay} durSec={durSec} />;
    case 'light-streak':    return null;
    case 'vignette-breath': return <VignetteBreath {...overlay} />;
    default:                return null;
  }
};

// ── 1. RotatingRings ───────────────────────────────────────────────
// 2-3 anéis SVG concêntricos com stroke-dasharray, cada um girando em
// sentido oposto. Adiciona "respiração técnica" tipo radar.
// Props: color, opacity (default 0.18), count (2|3), origin ('center'|'top-right'|...)
const RotatingRings = ({ color = 'var(--mr-greenAccent)', opacity = 0.18, count = 3, origin = 'top-right' }) => {
  const frame = useCurrentFrame();
  const stroke = resolveColor(color);
  const positions = {
    'center':       { left: '50%', top: '50%', tx: '-50%', ty: '-50%' },
    'top-right':    { right: '-15%', top: '-15%' },
    'top-left':     { left: '-15%', top: '-15%' },
    'bottom-right': { right: '-15%', bottom: '-15%' },
    'bottom-left':  { left: '-15%', bottom: '-15%' },
  };
  const pos = positions[origin] || positions['top-right'];
  // 3 anéis: 600px, 900px, 1200px de diâmetro.
  const sizes = count === 2 ? [700, 1000] : [600, 900, 1200];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', ...pos, transform: pos.tx ? `translate(${pos.tx}, ${pos.ty})` : undefined }}>
        {sizes.map((size, i) => {
          const rotate = (frame / 30) * (i % 2 === 0 ? 18 : -22); // deg/segundo
          // dasharray cria efeito "tracejado" no anel
          const dashPattern = i === 0 ? '24 16' : i === 1 ? '40 20' : '8 12';
          return (
            <svg key={i}
              width={size}
              height={size}
              style={{
                position: 'absolute',
                left: -size / 2,
                top: -size / 2,
                transform: `rotate(${rotate.toFixed(2)}deg)`,
              }}
            >
              <circle
                cx={size / 2} cy={size / 2}
                r={size / 2 - 8}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeDasharray={dashPattern}
                opacity={opacity * (1 - i * 0.18)}
              />
            </svg>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 2. PulseCircle ─────────────────────────────────────────────────
// 3 círculos concêntricos pulsando de scale 0 → 1, fade conforme expande.
// Cada um defasado em 1s. Loop infinito.
// Props: color, opacity (default 0.22), origin
const PulseCircle = ({ color = 'var(--mr-greenAccent)', opacity = 0.22, origin = 'center' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stroke = resolveColor(color);
  // 3 pulsos defasados em 1s. Cada pulso dura 2.5s.
  const PULSE_DUR = 2.5 * fps;
  const PULSE_SPACING = 1.0 * fps;
  const originPos = origin === 'center' ? { left: '50%', top: '50%' } : { left: '50%', top: '50%' };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', ...originPos, transform: 'translate(-50%, -50%)' }}>
        {[0, 1, 2].map(i => {
          const localFrame = (frame + i * PULSE_SPACING) % PULSE_DUR;
          const t = localFrame / PULSE_DUR;
          const size = 200 + t * 1200; // 200 → 1400 px
          const op = opacity * (1 - t);
          return (
            <div key={i} style={{
              position: 'absolute',
              left: -size / 2,
              top: -size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              border: `2px solid ${stroke}`,
              opacity: op,
            }} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 3. ParticleDrift ──────────────────────────────────────────────
// 30 partículas SVG seeded com drift lento + fade aleatório. Determinístico.
// Props: color, count (default 30), opacity (default 0.4)
const ParticleDrift = ({ color = 'var(--mr-white)', count = 30, opacity = 0.4, durSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = resolveColor(color);
  // Seeded pseudo-random — mesma semente sempre gera mesma sequência.
  // Mistura linear congruencial simples (good enough pra visual).
  const rand = (seed) => ((seed * 9301 + 49297) % 233280) / 233280;
  const totalFrames = durSec ? durSec * fps : 1800;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: count }, (_, i) => {
          const seed = i * 31 + 7;
          const x0 = rand(seed) * 1080;
          const y0 = rand(seed * 2) * 1920;
          // Drift lento — pcs deslocam ~80px ao longo da cena toda
          const dxAmp = 30 + rand(seed * 3) * 50;
          const dyAmp = -60 - rand(seed * 5) * 40;
          const phaseX = rand(seed * 7) * Math.PI * 2;
          const phaseY = rand(seed * 11) * Math.PI * 2;
          const t = frame / fps;
          const x = x0 + Math.sin(t * 0.4 + phaseX) * dxAmp;
          const y = y0 + (t / (totalFrames / fps)) * dyAmp;
          // Fade in/out ao longo da cena — cada partícula tem sua janela
          const lifeStart = rand(seed * 13) * 0.4 * totalFrames;
          const lifeEnd = lifeStart + (0.4 + rand(seed * 17) * 0.5) * totalFrames;
          const op = opacity * Math.max(0, Math.min(1,
            (frame - lifeStart) / (0.2 * fps)
          )) * Math.max(0, Math.min(1,
            (lifeEnd - frame) / (0.4 * fps)
          ));
          const r = 1.5 + rand(seed * 19) * 3.5;
          return (
            <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity={op.toFixed(3)} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ── 4. LineDraw ──────────────────────────────────────────────────
// SVG path desenhado via stroke-dashoffset. Aceita preset 'frame'|'underline-tr'|
// 'corner-l'|'corner-r' ou path custom.
// Props: color, preset, thickness, delay, dur
const LineDraw = ({ color = 'var(--mr-greenAccent)', preset = 'corner-r', thickness = 4, delay = 0.5, dur = 1.2, opacity = 0.85, durSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stroke = resolveColor(color);
  const PATHS = {
    'frame':        'M 60 60 L 1020 60 L 1020 1860 L 60 1860 L 60 60',
    'corner-r':     'M 1020 60 L 1020 360 M 1020 60 L 720 60',
    'corner-l':     'M 60 1860 L 60 1560 M 60 1860 L 360 1860',
    'underline-tr': 'M 600 1820 L 1020 1820',
    'underline-bl': 'M 60 100 L 480 100',
  };
  const d = PATHS[preset] || preset; // se preset não existe, usa string como path direto
  // Comprimento aproximado pra dashoffset
  const len = preset === 'frame' ? 4800 : 700;
  const p = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
        <path d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - p)}
          opacity={opacity}
          style={{ filter: `drop-shadow(0 0 12px ${stroke}55)` }}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ── 5. CurveTrace ────────────────────────────────────────────────
// Bezier curvilíneo desenhado. Útil pra acentos orgânicos.
// Props: color, path (Bezier preset), thickness, delay, dur
const CurveTrace = ({ color = 'var(--mr-greenAccent)', preset = 'sweep-right', thickness = 5, delay = 0.7, dur = 1.5, opacity = 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stroke = resolveColor(color);
  const PATHS = {
    'sweep-right': 'M 0 1100 Q 540 800 1080 1300',
    'sweep-left':  'M 1080 700 Q 540 1000 0 600',
    'wave-top':    'M 0 200 Q 270 80 540 200 T 1080 200',
    'wave-bottom': 'M 0 1700 Q 270 1580 540 1700 T 1080 1700',
    'arc-corner':  'M 0 1800 Q 0 600 1080 600',
  };
  const d = PATHS[preset] || preset;
  const len = 2200; // bezier aproximação
  const p = interpolate(frame, [delay * fps, (delay + dur) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuint,
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
        <path d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - p)}
          opacity={opacity}
          style={{ filter: `drop-shadow(0 0 16px ${stroke}77)` }}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ── 6. LightStreak ───────────────────────────────────────────────
// Faixa diagonal de gradient que atravessa a tela 1x ao longo da cena.
// Diferente do light-leak (transição): este é OVERLAY durante a cena toda.
// Props: color, angle, opacity, speed (multiplier)
const LightStreak = ({ color = 'var(--mr-white)', angle = -25, opacity = 0.18, speed = 1, durSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = resolveColor(color);
  const total = durSec ? durSec * fps : fps * 5;
  // Posição da faixa: -50% → 150% ao longo da cena (overshoot pra entrar/sair)
  const t = (frame * speed) / total;
  const pos = interpolate(Math.min(t, 1), [0, 1], [-50, 150]);
  // Faixa é um div rotacionado com gradient horizontal.
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        left: `${pos}%`,
        top: '-50%',
        width: '40%',
        height: '200%',
        background: `linear-gradient(90deg, transparent 0%, ${fill}00 20%, ${fill}cc 50%, ${fill}00 80%, transparent 100%)`,
        opacity,
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'center',
        mixBlendMode: 'screen',
      }} />
    </AbsoluteFill>
  );
};

// ── 7. VignetteBreath ────────────────────────────────────────────
// Vinheta radial que pulsa em opacidade. Adiciona profundidade.
// Props: color (escuro), intensity (0-1, default 0.45)
const VignetteBreath = ({ color = 'var(--mr-slateAbyss)', intensity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = resolveColor(color);
  // Respiração suave 0.85x ↔ 1.15x ao longo de ciclo de 6s.
  const phase = Math.sin((frame / fps) * Math.PI * 2 / 6);
  const op = intensity * (0.85 + 0.15 * phase);
  return (
    <AbsoluteFill style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${fill} 110%)`,
      opacity: op,
    }} />
  );
};
