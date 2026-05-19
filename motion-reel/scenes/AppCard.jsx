// AppCard — janela mockup de aplicativo Cropware ilustrando o tema da cena.
// Chrome estilo macOS minimal (3 dots + barra título), conteúdo configurável
// via `appType` (weather/satellite/dashboard/alert) + `data`.
//
// Padrão visual: a janela "voa" de baixo + scale 0.94→1, conteúdo interno
// faz stagger fade-in. No final, leve float ±6px pra dar vida.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { MR_COLORS, MR_FONTS, resolveColor } from '../theme.js';
import { EASE, SceneBackdrop, KickerReveal, FadeSlide } from '../helpers.jsx';

export const AppCard = ({
  bg, fg,
  kicker = '',
  caption = '',
  appType = 'dashboard',
  data = {},
  background,
  start, end,
}) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = (end || 0) - (start || 0);

  // Janela: spring entrada + leve float depois.
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90, mass: 1.1 },
  });
  const floatPhase = Math.sin((frame - 1.2 * fps) / fps * Math.PI * 0.6) * 6;
  const offsetY = (1 - enterSpring) * 240 + (frame > 1.2 * fps ? floatPhase : 0);
  const scale = 0.94 + 0.06 * enterSpring;

  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '120px 80px', gap: 36, fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={durSec} />
      {kicker ? (
        <KickerReveal
          text={kicker}
          delay={0}
          dur={0.5}
          fromEm={0.18}
          toEm={0.4}
          style={{ fontFamily: MR_FONTS.mono, fontSize: 32, fontWeight: 400, color: MR_COLORS.greenAccent, textTransform: 'uppercase' }}
        />
      ) : null}
      {caption ? (
        <FadeSlide delay={0.2} dur={0.4} ty={20}>
          <div style={{
            fontFamily: MR_FONTS.grotesk, fontSize: 56, fontWeight: 500,
            lineHeight: 1.15, letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 880,
          }}>{caption}</div>
        </FadeSlide>
      ) : null}
      {/* Janela mockup — wrapper com transformação animada */}
      <div style={{
        width: 820,
        background: MR_COLORS.white,
        borderRadius: 28,
        boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transform: `translateY(${offsetY.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        opacity: enterSpring,
        color: MR_COLORS.slateAbyss,
      }}>
        <AppChrome title={data.windowTitle || defaultTitle(appType)} />
        <AppBody appType={appType} data={data} frame={frame} fps={fps} />
      </div>
    </AbsoluteFill>
  );
};

function defaultTitle(t) {
  if (t === 'weather')   return 'CROPWARE - TEMPO';
  if (t === 'satellite') return 'CROPWARE - NDVI';
  if (t === 'alert')     return 'CROPWARE - ALERTAS';
  return 'CROPWARE';
}

// Chrome de janela: 3 dots à esquerda + título centralizado.
// Sem borderBottom — a separação chrome/body fica só pela troca de cor de fundo.
const AppChrome = ({ title }) => (
  <div style={{
    height: 56,
    background: MR_COLORS.fog,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    position: 'relative',
  }}>
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#FF5F57' }} />
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#FEBC2E' }} />
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#28C840' }} />
    </div>
    <div style={{
      position: 'absolute', left: 0, right: 0, textAlign: 'center',
      fontFamily: MR_FONTS.mono, fontSize: 22, fontWeight: 500,
      color: MR_COLORS.slateDark, letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>{title}</div>
  </div>
);

// Body delega por tipo.
const AppBody = ({ appType, data, frame, fps }) => {
  if (appType === 'weather')   return <WeatherBody data={data} frame={frame} fps={fps} />;
  if (appType === 'satellite') return <SatelliteBody data={data} frame={frame} fps={fps} />;
  if (appType === 'alert')     return <AlertBody data={data} frame={frame} fps={fps} />;
  return <DashboardBody data={data} frame={frame} fps={fps} />;
};

// ── Weather ──────────────────────────────────────────────────────
// data: { city, temp, condition, forecast: [{ day, temp, icon? }] }
const WeatherBody = ({ data, frame, fps }) => {
  const city = data.city || 'Sorriso · MT';
  const temp = data.temp == null ? 32 : data.temp;
  const condition = data.condition || 'Ensolarado';
  const forecast = data.forecast || [
    { day: 'TER', temp: 31 },
    { day: 'QUA', temp: 29 },
    { day: 'QUI', temp: 30 },
    { day: 'SEX', temp: 27 },
  ];
  const reveal = interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  return (
    <div style={{ padding: '32px 48px 40px', background: MR_COLORS.white, opacity: reveal }}>
      <div style={{
        fontFamily: MR_FONTS.mono, fontSize: 22, color: MR_COLORS.slateMid,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14,
      }}>{city}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 18 }}>
        <div style={{
          fontFamily: MR_FONTS.display, fontSize: 180, fontWeight: 700,
          lineHeight: 0.9, letterSpacing: '-0.05em', color: MR_COLORS.greenForest,
        }}>{Math.round(temp)}°</div>
        <div style={{
          fontFamily: MR_FONTS.grotesk, fontSize: 48, fontWeight: 500,
          color: MR_COLORS.slateDark,
        }}>{condition}</div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${forecast.length}, 1fr)`,
        gap: 12,
        paddingTop: 24,
        borderTop: `1px solid ${MR_COLORS.slateLight}33`,
      }}>
        {forecast.slice(0, 5).map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: MR_FONTS.mono, fontSize: 18, color: MR_COLORS.slateMid, letterSpacing: '0.12em' }}>{d.day}</div>
            <div style={{ fontFamily: MR_FONTS.display, fontSize: 42, fontWeight: 600, color: MR_COLORS.slateAbyss, marginTop: 8 }}>{Math.round(d.temp)}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Satellite (NDVI map) ────────────────────────────────────────
const SatelliteBody = ({ data, frame, fps }) => {
  const lot = data.lot || 'Talhão 12 · 84 ha';
  const ndvi = data.ndvi == null ? 0.78 : data.ndvi;
  // Fake mapa NDVI: grid de cells coloridas por valor seeded.
  const cells = [];
  const cols = 14, rows = 9;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const noise = Math.sin(r * 1.3 + c * 0.7) * 0.5 + Math.cos(r * 0.5 - c * 0.9) * 0.3;
      const v = Math.max(0.2, Math.min(0.95, ndvi + noise * 0.25));
      cells.push({ r, c, v });
    }
  }
  function ndviColor(v) {
    // 0.2 (vermelho/amber) → 0.5 (amarelo) → 0.95 (verde escuro)
    if (v < 0.45) return '#D7642A';
    if (v < 0.6)  return '#E8B43B';
    if (v < 0.75) return '#8FCB6E';
    return '#3D9B5C';
  }
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const reveal = interpolate(frame, [0.5 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <div style={{ padding: 32, background: MR_COLORS.white, opacity: reveal }}>
      <div style={{
        fontFamily: MR_FONTS.mono, fontSize: 22, color: MR_COLORS.slateMid,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 18,
      }}>{lot}</div>
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '14 / 9',
        borderRadius: 16, overflow: 'hidden', border: `1px solid ${MR_COLORS.slateLight}33`,
      }}>
        {cells.map((cell, i) => {
          const delay = (cell.r * cols + cell.c) * 1.5;
          const op = interpolate(frame, [0.6 * fps + delay * 0.6, 1.4 * fps + delay * 0.6], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
          });
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${cell.c * cellW}%`,
              top: `${cell.r * cellH}%`,
              width: `${cellW}%`,
              height: `${cellH}%`,
              background: ndviColor(cell.v),
              opacity: op,
            }} />
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20, fontFamily: MR_FONTS.mono, fontSize: 20, color: MR_COLORS.slateMid,
      }}>
        <span>NDVI MÉDIO</span>
        <span style={{ fontFamily: MR_FONTS.display, fontSize: 32, fontWeight: 700, color: MR_COLORS.greenForest }}>{ndvi.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ── Alert ──────────────────────────────────────────────────────
const AlertBody = ({ data, frame, fps }) => {
  const title = data.title || 'Risco de geada — MT';
  const message = data.message || 'Temperatura mínima abaixo de 4°C nas próximas 36h.';
  const severity = data.severity || 'alta'; // baixa / media / alta
  const severityColor = severity === 'alta' ? '#D7642A' : severity === 'media' ? '#E8B43B' : MR_COLORS.greenDeep;
  const pulse = 1 + 0.08 * Math.sin(frame / fps * Math.PI * 1.4);
  const reveal = interpolate(frame, [0.5 * fps, 1.1 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  return (
    <div style={{ padding: 36, background: MR_COLORS.white, opacity: reveal }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: severityColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${pulse.toFixed(3)})`,
          flex: '0 0 auto',
        }}>
          <span style={{ color: '#FFF', fontSize: 44, fontWeight: 800, fontFamily: MR_FONTS.display }}>!</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: MR_FONTS.mono, fontSize: 18, color: severityColor,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10,
          }}>ALERTA · {severity.toUpperCase()}</div>
          <div style={{
            fontFamily: MR_FONTS.display, fontSize: 44, fontWeight: 700,
            lineHeight: 1.0, letterSpacing: '-0.02em', color: MR_COLORS.slateAbyss,
            marginBottom: 14,
          }}>{title}</div>
          <div style={{
            fontFamily: MR_FONTS.grotesk, fontSize: 28, fontWeight: 500,
            lineHeight: 1.3, letterSpacing: '-0.01em', color: MR_COLORS.slateDark,
          }}>{message}</div>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard genérico ────────────────────────────────────────
// data: { metrics: [{ label, value, unit?, trend? ('up'|'down') }] }
const DashboardBody = ({ data, frame, fps }) => {
  const metrics = data.metrics || [
    { label: 'Área monitorada', value: 1240, unit: 'ha', trend: 'up' },
    { label: 'Alertas hoje', value: 3, trend: 'down' },
    { label: 'NDVI médio', value: 0.78, unit: '', trend: 'up' },
  ];
  const reveal = interpolate(frame, [0.5 * fps, 1.1 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  return (
    <div style={{ padding: 36, background: MR_COLORS.white, opacity: reveal }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(3, metrics.length)}, 1fr)`,
        gap: 20,
      }}>
        {metrics.slice(0, 3).map((m, i) => (
          <div key={i} style={{
            background: MR_COLORS.fog,
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{
              fontFamily: MR_FONTS.mono, fontSize: 16, color: MR_COLORS.slateMid,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
            }}>{m.label}</div>
            <div style={{
              fontFamily: MR_FONTS.display, fontSize: 56, fontWeight: 700,
              lineHeight: 1, letterSpacing: '-0.03em', color: MR_COLORS.slateAbyss,
            }}>
              {m.value}{m.unit ? <span style={{ fontSize: 28, color: MR_COLORS.slateMid }}> {m.unit}</span> : null}
            </div>
            {m.trend ? (
              <div style={{
                fontFamily: MR_FONTS.mono, fontSize: 18,
                color: m.trend === 'up' ? MR_COLORS.greenDeep : '#D7642A',
                marginTop: 10,
              }}>
                {m.trend === 'up' ? '↑ subindo' : '↓ caindo'}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
