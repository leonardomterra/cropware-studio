// DataChart — bar / line / bar-line combo. Bars escalam com spring stagger,
// line desenha-se via stroke-dashoffset, dot pulsante no fim da line.
// Schema:
//   chartType: 'bar' | 'line' | 'bar-line'
//   data: { labels: [...], series: [{ name, values, kind?, color? }] }
//     - series[].kind: 'bar' (default se chartType=bar/bar-line e index=0) | 'line'
//     - se chartType='bar-line', series[0]=bars, series[1]=line.
//   unit?: string (sufixo no eixo Y / no tooltip)
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { MR_COLORS, MR_FONTS, resolveColor } from '../theme.js';
import { EASE, SceneBackdrop, KickerReveal, FadeSlide } from '../helpers.jsx';

const CHART_WIDTH = 920;       // SVG viewBox width
const CHART_HEIGHT = 540;
const CHART_PAD_LEFT = 90;
const CHART_PAD_RIGHT = 30;
const CHART_PAD_TOP = 40;
const CHART_PAD_BOTTOM = 100;

export const DataChart = ({
  bg, fg,
  kicker = 'EM NÚMEROS',
  title = '',
  chartType = 'bar-line',
  data,
  unit = '',
  background,
  start, end,
}) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = (end || 0) - (start || 0);

  // Fallback de dados se a IA falhar.
  const labels = (data && data.labels) || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  let series = (data && data.series) || [
    { name: 'Receita', values: [8, 12, 15, 11, 18, 22], kind: 'bar', color: MR_COLORS.greenAccent },
    { name: 'Conversão', values: [2.1, 2.8, 3.2, 2.9, 3.8, 4.2], kind: 'line', color: MR_COLORS.azure },
  ];
  // Normalize series.kind based on chartType.
  if (chartType === 'bar')    series = series.map(s => ({ ...s, kind: 'bar' }));
  if (chartType === 'line')   series = series.map(s => ({ ...s, kind: 'line' }));
  if (chartType === 'bar-line') series = series.map((s, i) => ({ ...s, kind: s.kind || (i === 0 ? 'bar' : 'line') }));

  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
      padding: '0 80px', gap: 36, fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={durSec} />
      <KickerReveal
        text={kicker}
        delay={0}
        dur={0.5}
        fromEm={0.18}
        toEm={0.4}
        style={{ fontFamily: MR_FONTS.mono, fontSize: 32, fontWeight: 400, color: MR_COLORS.greenAccent, textTransform: 'uppercase' }}
      />
      {title ? (
        <FadeSlide delay={0.25} dur={0.4} ty={30}>
          <div style={{
            fontFamily: MR_FONTS.display, fontSize: 108, fontWeight: 700,
            lineHeight: 0.95, letterSpacing: '-0.04em', maxWidth: 920,
          }}>{title}</div>
        </FadeSlide>
      ) : null}
      <FadeSlide delay={0.55} dur={0.5} ty={40} style={{ width: '100%' }}>
        <ChartSvg
          labels={labels}
          series={series}
          unit={unit}
          frame={frame}
          fps={fps}
          durSec={durSec}
          fgColor={fgColor}
        />
      </FadeSlide>
    </AbsoluteFill>
  );
};

// Renderiza o SVG do gráfico — bars + line + axis.
const ChartSvg = ({ labels, series, unit, frame, fps, durSec, fgColor }) => {
  // Espaço útil pra plotar
  const innerW = CHART_WIDTH - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  // Max global pra escala — usa todos os values.
  const allVals = series.flatMap(s => s.values || []);
  const maxVal = Math.max(...allVals, 1) * 1.08;
  const minVal = 0;
  const xStep = innerW / Math.max(1, labels.length - 1);
  const barCount = series.filter(s => s.kind === 'bar').length;
  const barGroupW = Math.min(72, (innerW / labels.length) * 0.62);
  const barW = barCount > 0 ? barGroupW / barCount : 0;

  // Animação:
  //   - axes fade in 0.5-1.0s
  //   - bars stagger (spring) 1.0-2.5s, 100ms entre cada
  //   - line draw 2.5-4.0s
  //   - dot pulse depois de 4.0s
  const axisP = interpolate(frame, [0.6 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" preserveAspectRatio="xMidYMid meet">
      {/* Eixos (linhas leves) */}
      <g opacity={axisP} stroke={fgColor} strokeWidth="1" opacity-base="0.25">
        <line x1={CHART_PAD_LEFT} y1={CHART_PAD_TOP} x2={CHART_PAD_LEFT} y2={CHART_HEIGHT - CHART_PAD_BOTTOM} opacity="0.25" />
        <line x1={CHART_PAD_LEFT} y1={CHART_HEIGHT - CHART_PAD_BOTTOM} x2={CHART_WIDTH - CHART_PAD_RIGHT} y2={CHART_HEIGHT - CHART_PAD_BOTTOM} opacity="0.25" />
        {/* Gridlines horizontais — 4 níveis */}
        {[0.25, 0.5, 0.75, 1.0].map((p, i) => (
          <line key={i}
            x1={CHART_PAD_LEFT}
            x2={CHART_WIDTH - CHART_PAD_RIGHT}
            y1={(CHART_HEIGHT - CHART_PAD_BOTTOM) - innerH * p}
            y2={(CHART_HEIGHT - CHART_PAD_BOTTOM) - innerH * p}
            opacity="0.08"
            strokeDasharray="4 6"
          />
        ))}
      </g>

      {/* Labels do eixo X */}
      <g opacity={axisP} fill={fgColor}>
        {labels.map((lbl, i) => (
          <text key={i}
            x={CHART_PAD_LEFT + i * xStep}
            y={CHART_HEIGHT - CHART_PAD_BOTTOM + 36}
            textAnchor="middle"
            fontFamily={MR_FONTS.mono}
            fontSize="22"
            fontWeight="400"
            opacity="0.7"
            style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >{lbl}</text>
        ))}
      </g>

      {/* BARS */}
      {series.map((s, sIdx) => {
        if (s.kind !== 'bar') return null;
        const barIdx = series.slice(0, sIdx).filter(x => x.kind === 'bar').length;
        const color = s.color || MR_COLORS.greenAccent;
        return (
          <g key={`bar-${sIdx}`}>
            {(s.values || []).map((v, i) => {
              const cx = CHART_PAD_LEFT + i * xStep;
              const bx = cx - barGroupW / 2 + barIdx * barW;
              const fullH = (v - minVal) / (maxVal - minVal) * innerH;
              // Spring stagger por bar: 100ms entre cada, depois de 1s
              const p = spring({
                frame: frame - (1.0 * fps + i * 0.1 * fps),
                fps,
                config: { damping: 14, stiffness: 110, mass: 0.9 },
              });
              const h = fullH * p;
              const y = (CHART_HEIGHT - CHART_PAD_BOTTOM) - h;
              return (
                <rect key={i}
                  x={bx} y={y}
                  width={barW * 0.78}
                  height={h}
                  fill={color}
                  rx={6}
                />
              );
            })}
          </g>
        );
      })}

      {/* LINE */}
      {series.map((s, sIdx) => {
        if (s.kind !== 'line') return null;
        const color = s.color || MR_COLORS.azure;
        const values = s.values || [];
        // Constrói path SVG
        const points = values.map((v, i) => {
          const x = CHART_PAD_LEFT + i * xStep;
          const y = (CHART_HEIGHT - CHART_PAD_BOTTOM) - ((v - minVal) / (maxVal - minVal)) * innerH;
          return { x, y };
        });
        const d = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
        // Approximate path length for stroke-dashoffset reveal.
        // Soma linhas retas (suficiente pra dashoffset linear).
        let len = 0;
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i - 1].x;
          const dy = points[i].y - points[i - 1].y;
          len += Math.sqrt(dx * dx + dy * dy);
        }
        // Anima dashoffset entre 2.5s e 4.0s
        const lineP = interpolate(frame, [2.5 * fps, 4.0 * fps], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
        });
        // Dot pulsante no último ponto após line completar.
        const last = points[points.length - 1];
        const dotPulse = lineP < 1 ? 0 : (1 + 0.3 * Math.sin((frame - 4 * fps) / fps * Math.PI * 2));
        return (
          <g key={`line-${sIdx}`}>
            <path d={d}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - lineP)}
              style={{ filter: `drop-shadow(0 0 12px ${color}55)` }}
            />
            {lineP > 0.95 && last ? (
              <circle cx={last.x} cy={last.y} r={12 * dotPulse} fill={color} opacity="0.95" />
            ) : null}
            {lineP > 0.95 && last ? (
              <circle cx={last.x} cy={last.y} r={28 * dotPulse} fill={color} opacity={Math.max(0, 0.4 - 0.3 * dotPulse)} />
            ) : null}
          </g>
        );
      })}

      {/* Unit suffix no canto superior direito */}
      {unit ? (
        <text
          x={CHART_WIDTH - CHART_PAD_RIGHT}
          y={CHART_PAD_TOP + 4}
          textAnchor="end"
          fill={fgColor}
          opacity={axisP * 0.55}
          fontFamily={MR_FONTS.mono}
          fontSize="22"
          style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >{unit}</text>
      ) : null}
    </svg>
  );
};
