// Janelas-mockup do Cropware pro slide KEYWORD (cena 03).
// Reusa a linguagem visual do slide 08 (AppCard): janela branca com chrome
// estilo macOS (3 dots + título), corpo conforme `type`. Diferença: aqui é
// UMA janela grande (hero), e a frase-chave aparece embaixo.
//
// Tipos disponíveis (variam conforme o tema via themes.js → keyword.keywordWindow,
// ou forçados por scene.uiDemo): graph · dashboard · map · weather · tasks · alert.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, EASE, IconifyIcon, balanceTwoLines } from '../helpers.jsx';

const WIN_W = 780;

const KEYWORD_WINDOW_TITLES = {
  graph:      'PRODUTIVIDADE',
  dashboard:  'PAINEL',
  map:        'TALHÕES',
  weather:    'PREVISÃO',
  tasks:      'TAREFAS',
  alert:      'ALERTAS',
  trials:     'ENSAIOS',
  calculator: 'CALCULADORA',
  calendar:   'CALENDÁRIO',
  planting:   'PLANTIOS',
  reports:    'RELATÓRIOS',
};

// Copy pré-estabelecida por tipo de janela — explica brevemente a funcionalidade
// apresentada (regra: 1 frase, ~40-50 chars, técnico-comercial, foco no benefício).
// É o texto que aparece embaixo da janela. Pode ser sobrescrito via prop `text`.
const KEYWORD_WINDOW_COPY = {
  graph:      'Acompanhe sua produtividade evoluir a cada safra.',
  dashboard:  'Todos os números da fazenda num só painel.',
  map:        'Cada talhão mapeado e monitorado por satélite.',
  weather:    'Previsão de campo pra planejar cada operação.',
  tasks:      'A rotina da equipe organizada e sob controle.',
  alert:      'Alertas automáticos antes do problema chegar.',
  trials:     'Ensaios que comprovam o resultado no campo.',
  calculator: 'Dezenas de calculadoras agronômicas na palma.',
  calendar:   'Toda a agenda da operação num só calendário.',
  planting:   'Cada plantio acompanhado do plantio à colheita.',
  reports:    'Relatórios prontos pra apresentar ao produtor.',
};

export const KEYWORD_WINDOW_TYPES = Object.keys(KEYWORD_WINDOW_TITLES);

// ─── Primitivos skeleton ─────────────────────────────────────────────
// "skeleton em todas": no lugar de números/textos reais, barras cinzas que
// simulam conteúdo. O hero de cada janela (linha, grade, progresso, círculo)
// fica em accent pra manter identidade + brand; o restante é cinza.
const SKEL = '#CBD3CC';       // barra cinza padrão (contrasta sobre branco E sobre fog)
const SKEL_SOFT = '#DCE2DD';  // cinza mais claro (estado "dimmed" / células de fundo)

function SkelBar({ w = 80, h = 16, r, color = SKEL, delay = 0, frame, fps, style }) {
  const p = interpolate(frame, [delay * fps, (delay + 0.4) * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  return <div style={{ width: w, height: h, borderRadius: r == null ? h / 2 : r, background: color, opacity: p.toFixed(2), ...style }} />;
}

// ─── Chrome (header macOS) ───────────────────────────────────────────
const MacChrome = ({ title, accent }) => (
  <div style={{
    height: 64,
    background: MR_COLORS.fog,
    display: 'flex',
    alignItems: 'center',
    padding: '0 26px',
    position: 'relative',
  }}>
    <div style={{ display: 'flex', gap: 13 }}>
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#FF5F57' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#FEBC2E' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#28C840' }} />
    </div>
    <div style={{
      position: 'absolute', left: 0, right: 0, textAlign: 'center',
      fontFamily: MR_FONTS.mono, fontSize: 26, fontWeight: 500,
      color: MR_COLORS.slateDark, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{title}</div>
  </div>
);

// ─── Componente principal ────────────────────────────────────────────
export function KeywordWindow({ type, text, accent, fg, flat }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const acc = accent || MR_COLORS.greenForest;
  const winType = KEYWORD_WINDOW_TYPES.includes(type) ? type : 'graph';

  // Entrada: janela "voa" de baixo + scale (eco do AppCard).
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 95, mass: 1.0 } });
  const offsetY = (1 - enter) * 200;
  const scale = 0.93 + 0.07 * enter;
  // Float sutil contínuo depois de pousar.
  const floatPhase = frame > 1.2 * fps ? Math.sin((frame - 1.2 * fps) / fps * Math.PI * 0.6) * 6 : 0;

  const Body = BODY_BY_TYPE[winType] || GraphWindowBody;
  // Texto explicando a funcionalidade: copy pré-estabelecida por tipo, ou
  // override via prop `text`.
  const copy = (text && String(text).trim()) ? String(text).trim() : (KEYWORD_WINDOW_COPY[winType] || '');
  const textDelay = 2.5;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64 }}>

        {/* Janela */}
        <div style={{
          width: WIN_W,
          background: MR_COLORS.white,
          borderRadius: 26,
          overflow: 'hidden',
          opacity: enter,
          transform: `translateY(${(offsetY + floatPhase).toFixed(2)}px) scale(${scale.toFixed(4)})`,
          transformOrigin: 'center',
          boxShadow: flat
            ? '0 0 0 1px rgba(15,23,42,0.10)'
            : '0 32px 72px rgba(0,0,0,0.34), 0 0 0 1px rgba(0,0,0,0.05)',
        }}>
          <MacChrome title={KEYWORD_WINDOW_TITLES[winType]} accent={acc} />
          <div style={{ background: MR_COLORS.white }}>
            <Body accent={acc} frame={frame} fps={fps} />
          </div>
        </div>

        {/* Texto explicando a funcionalidade — Inter Tight sentence case, mesmo
            tratamento do slide 6 (Scenario): grotesk 500, lineHeight 1.18,
            letterSpacing -0.025em. 2 linhas balanceadas. */}
        <div style={{
          fontFamily: MR_FONTS.grotesk,
          fontSize: 60, fontWeight: 500, lineHeight: 1.18,
          letterSpacing: '-0.025em', textAlign: 'center',
          color: fg || MR_COLORS.white,
          textShadow: flat ? 'none' : '0 4px 24px rgba(0,0,0,0.5)',
          whiteSpace: 'pre-line', maxWidth: 820,
        }}>
          <CharReveal text={balanceTwoLines(copy)} delay={textDelay} dur={0.4} stagger={0.018} ty={22} />
        </div>

      </div>
    </AbsoluteFill>
  );
}

// ─── Body: GRAPH (linha de produtividade ascendente) ─────────────────
function GraphWindowBody({ accent, frame, fps }) {
  const GW = 660, GH = 300;
  const drawP = interpolate(frame, [0.7 * fps, 2.0 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOutCubic });
  const areaP = interpolate(frame, [1.4 * fps, 2.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  const pts = [[30, 262], [150, 210], [270, 226], [390, 150], [510, 120], [630, 46]];
  const linePath = 'M ' + pts.map(p => `${p[0]},${p[1]}`).join(' L ');
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${GH} L ${pts[0][0]},${GH} Z`;
  return (
    <div style={{ padding: '32px 44px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
        <SkelBar w={180} h={18} delay={0.3} frame={frame} fps={fps} />
        <SkelBar w={92} h={34} r={10} color={`${accent}26`} delay={1.8} frame={frame} fps={fps} />
      </div>
      <svg width="100%" height={GH} viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke={`${MR_COLORS.slateLight}40`} strokeWidth="1.5">
          <line x1="0" y1="80" x2={GW} y2="80" />
          <line x1="0" y1="170" x2={GW} y2="170" />
          <line x1="0" y1="260" x2={GW} y2="260" />
        </g>
        <path d={areaPath} fill={`${accent}22`} opacity={areaP.toFixed(3)} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"
          pathLength="1" strokeDasharray="1" strokeDashoffset={(1 - drawP).toFixed(4)} />
        {pts.map((p, i) => {
          const appear = i / (pts.length - 1);
          const o = drawP >= appear ? Math.min(1, (drawP - appear) * 6) : 0;
          return <circle key={i} cx={p[0]} cy={p[1]} r="8" fill={MR_COLORS.white} stroke={accent} strokeWidth="4" opacity={o.toFixed(2)} />;
        })}
      </svg>
    </div>
  );
}

// ─── Body: DASHBOARD (KPIs — skeleton) ───────────────────────────────
function DashboardWindowBody({ accent, frame, fps }) {
  const tiles = [0, 1, 2, 3];
  return (
    <div style={{ padding: '34px 40px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {tiles.map((i) => {
          const t0 = 0.7 + i * 0.12;
          const enter = spring({ frame: frame - t0 * fps, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
          const down = i === 3;
          const c = down ? '#D7642A' : accent;
          return (
            <div key={i} style={{
              background: MR_COLORS.fog, borderRadius: 18, padding: '24px 24px',
              opacity: Math.min(1, enter * 1.3),
              transform: `translateY(${((1 - enter) * 24).toFixed(1)}px)`,
            }}>
              <SkelBar w={86} h={14} delay={t0} frame={frame} fps={fps} />
              <SkelBar w={132} h={32} r={9} delay={t0 + 0.12} frame={frame} fps={fps} style={{ marginTop: 16 }} />
              <SkelBar w={88} h={26} r={8} color={`${c}29`} delay={t0 + 0.26} frame={frame} fps={fps} style={{ marginTop: 18 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Body: MAP (mapa NDVI de talhões) ────────────────────────────────
function MapWindowBody({ accent, frame, fps }) {
  const cols = 10, rows = 7;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const noise = Math.sin(r * 1.3 + c * 0.7) * 0.5 + Math.cos(r * 0.5 - c * 0.9) * 0.3;
      const v = Math.max(0.2, Math.min(0.95, 0.7 + noise * 0.25));
      cells.push({ r, c, v });
    }
  }
  // Rampa monocromática de verdes (menta claro → floresta) — on-brand, sem
  // os laranjas/amarelos da paleta NDVI clássica. Mais vigor = verde mais escuro.
  const ndviColor = (v) => v < 0.45 ? '#CDEBD6' : v < 0.6 ? '#93D2AC' : v < 0.75 ? '#56AE7E' : '#2A7B5A';
  // Pin pulse no centro do mapa
  const pinSpring = spring({ frame: frame - 1.5 * fps, fps, config: { damping: 10, stiffness: 130, mass: 0.7 } });
  const pulseP = interpolate(frame, [2.0 * fps, 2.7 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  return (
    <div style={{ padding: '32px 40px 36px' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '10 / 7', borderRadius: 16, overflow: 'hidden', border: `1px solid ${MR_COLORS.slateLight}33` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none" shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }}>
          {cells.map((cell, i) => {
            const delay = (cell.r * cols + cell.c) * 1.1;
            const op = interpolate(frame, [0.6 * fps + delay * 0.6, 1.3 * fps + delay * 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
            // rects com leve overlap (1.02) + crispEdges → sem costuras brancas no reescalonamento
            return <rect key={i} x={cell.c} y={cell.r} width={1.02} height={1.02} fill={ndviColor(cell.v)} opacity={op.toFixed(2)} />;
          })}
        </svg>
        {/* Pin no talhão de destaque */}
        <div style={{ position: 'absolute', left: '54%', top: '44%', transform: `translate(-50%, -100%) scale(${pinSpring.toFixed(3)})`, opacity: Math.min(1, pinSpring * 2) }}>
          <IconifyIcon icon="ph:map-pin-fill" size={64} color={MR_COLORS.white} />
        </div>
        {pulseP > 0 && pulseP < 1 ? (
          <div style={{ position: 'absolute', left: '54%', top: '44%', width: 24, height: 24, marginLeft: -12, marginTop: -12, borderRadius: '50%', border: '3px solid #FFFFFF', transform: `scale(${(1 + pulseP * 5).toFixed(2)})`, opacity: (1 - pulseP).toFixed(2) }} />
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
        <SkelBar w={150} h={16} delay={1.6} frame={frame} fps={fps} />
        <SkelBar w={84} h={28} r={8} color={`${accent}29`} delay={1.8} frame={frame} fps={fps} />
      </div>
    </div>
  );
}

// ─── Body: WEATHER (previsão — skeleton) ─────────────────────────────
function WeatherWindowBody({ accent, frame, fps }) {
  const reveal = interpolate(frame, [0.5 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  const iconSp = spring({ frame: frame - 0.6 * fps, fps, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  const days = ['ph:sun-fill', 'ph:cloud-sun-fill', 'ph:cloud-rain-fill']; // hoje + 2 = 3
  return (
    <div style={{ padding: '32px 44px 36px', opacity: reveal }}>
      {/* localização */}
      <SkelBar w={180} h={16} delay={0.5} frame={frame} fps={fps} style={{ marginBottom: 28 }} />
      {/* "agora": card com ícone grande (esq) + skeletons (dir) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 32 }}>
        <div style={{
          width: 156, height: 156, borderRadius: 24, flex: '0 0 auto',
          background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: Math.min(1, iconSp * 1.4), transform: `scale(${(0.72 + 0.28 * iconSp).toFixed(3)})`,
        }}>
          <IconifyIcon icon="ph:cloud-sun-fill" size={100} color={accent} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkelBar w={'80%'} h={54} r={14} color={`${accent}26`} delay={0.8} frame={frame} fps={fps} />
          <SkelBar w={'58%'} h={20} delay={1.0} frame={frame} fps={fps} />
          <SkelBar w={'70%'} h={20} delay={1.15} frame={frame} fps={fps} />
        </div>
      </div>
      {/* mini previsões: 3 datas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 28, borderTop: `1px solid ${MR_COLORS.slateLight}33` }}>
        {days.map((icon, i) => {
          const sp = spring({ frame: frame - (1.2 + i * 0.14) * fps, fps, config: { damping: 10, stiffness: 150, mass: 0.7 } });
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: Math.min(1, sp * 1.6), transform: `translateY(${((1 - sp) * 20).toFixed(1)}px) scale(${(0.55 + 0.45 * sp).toFixed(3)})` }}>
              <SkelBar w={38} h={12} delay={1.3 + i * 0.14} frame={frame} fps={fps} />
              <IconifyIcon icon={icon} size={64} color={accent} />
              <SkelBar w={52} h={14} delay={1.5 + i * 0.14} frame={frame} fps={fps} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Body: TASKS (checklist — skeleton) ──────────────────────────────
function TasksWindowBody({ accent, frame, fps }) {
  const rows = [
    { l1: 300, l2: 180 },
    { l1: 240, l2: 150 },
    { l1: 280, l2: 200 },
    { l1: 260, l2: 160 },
  ];
  return (
    <div style={{ padding: '26px 40px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((r, i) => {
        const t0 = (0.7 + i * 0.32) * fps;
        const rowEnter = interpolate(frame, [t0 - 0.3 * fps, t0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
        const check = spring({ frame: frame - t0, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        const checked = check > 0.05;
        const barColor = checked ? SKEL_SOFT : SKEL;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 22,
            padding: '18px 22px', borderRadius: 16, background: MR_COLORS.fog,
            opacity: rowEnter.toFixed(2),
            transform: `translateX(${((1 - rowEnter) * -20).toFixed(1)}px)`,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flex: '0 0 auto',
              background: checked ? accent : 'transparent',
              border: checked ? `2px solid ${accent}` : `2px solid ${MR_COLORS.slateLight}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ transform: `scale(${Math.min(1, check).toFixed(3)})`, display: 'flex' }}>
                <IconifyIcon icon="ph:check-bold" size={28} color={MR_COLORS.white} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: r.l1, maxWidth: '100%', height: 16, borderRadius: 8, background: barColor }} />
              <div style={{ width: r.l2, maxWidth: '100%', height: 12, borderRadius: 6, background: barColor }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Body: ALERT (alerta — skeleton) ─────────────────────────────────
function AlertWindowBody({ accent, frame, fps }) {
  const reveal = interpolate(frame, [0.5 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  const circIn = spring({ frame: frame - 0.4 * fps, fps, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  const pulse = 1 + 0.08 * Math.sin(frame / fps * Math.PI * 1.4);
  const sev = '#D7642A';
  return (
    <div style={{ padding: '44px', opacity: reveal }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', background: sev, flex: '0 0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: Math.min(1, circIn * 1.5),
          transform: `scale(${(Math.max(0, circIn) * pulse).toFixed(3)})`,
        }}>
          <IconifyIcon icon="ph:warning-fill" size={50} color={MR_COLORS.white} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 6, transform: `translateX(${((1 - reveal) * 24).toFixed(1)}px)` }}>
          <SkelBar w={140} h={16} r={8} color={`${sev}33`} delay={0.6} frame={frame} fps={fps} />
          <SkelBar w={'78%'} h={30} r={9} delay={0.85} frame={frame} fps={fps} style={{ marginTop: 18 }} />
          <SkelBar w={'100%'} h={16} delay={1.05} frame={frame} fps={fps} style={{ marginTop: 18 }} />
          <SkelBar w={'88%'} h={16} delay={1.2} frame={frame} fps={fps} style={{ marginTop: 12 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Body: TRIALS (ensaios / análise de desenvolvimento — GD) ────────
function TrialsWindowBody({ accent, frame, fps }) {
  const bars = [
    { value: 58, color: SKEL },
    { value: 72, color: accent },
  ];
  const maxV = 80, CH = 200;
  const grow = (i) => interpolate(frame, [(0.7 + i * 0.2) * fps, (1.6 + i * 0.2) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  return (
    <div style={{ padding: '30px 44px 34px' }}>
      {/* cabeçalho: 2 linhas de texto */}
      <div style={{ marginBottom: 24 }}>
        <SkelBar w={210} h={18} delay={0.3} frame={frame} fps={fps} />
        <SkelBar w={140} h={14} delay={0.45} frame={frame} fps={fps} style={{ marginTop: 12 }} />
      </div>
      {/* barras de comparação — par próximo e centralizado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 30, height: CH + 50, marginBottom: 24 }}>
        {bars.map((b, i) => {
          const g = grow(i);
          const h = Math.max(4, (b.value / maxV) * CH * g);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ width: 138, height: h, background: b.color, borderRadius: '14px 14px 0 0' }} />
              <SkelBar w={100} h={16} delay={1.7 + i * 0.1} frame={frame} fps={fps} style={{ marginTop: 18 }} />
            </div>
          );
        })}
      </div>
      {/* mais simuladores de texto (legenda) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkelBar w={'92%'} h={14} delay={2.0} frame={frame} fps={fps} />
        <SkelBar w={'76%'} h={14} delay={2.15} frame={frame} fps={fps} />
      </div>
    </div>
  );
}

// ─── Body: CALCULATOR (Cropware Calc — skeleton) ─────────────────────
function CalculatorWindowBody({ accent, frame, fps }) {
  const rows = ['ph:ruler-fill', 'ph:drop-fill'];
  const resultP = interpolate(frame, [1.4 * fps, 2.0 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  return (
    <div style={{ padding: '30px 40px 34px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((icon, i) => {
        const e = interpolate(frame, [(0.7 + i * 0.16) * fps, (1.1 + i * 0.16) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 18,
            padding: '20px 24px', borderRadius: 14, background: MR_COLORS.fog,
            opacity: e.toFixed(2), transform: `translateY(${((1 - e) * 16).toFixed(1)}px)`,
          }}>
            <span style={{ width: 46, height: 46, borderRadius: 12, flex: '0 0 auto', background: `${accent}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconifyIcon icon={icon} size={28} color={accent} />
            </span>
            <div style={{ width: 120, height: 18, borderRadius: 9, background: SKEL }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 90, height: 18, borderRadius: 9, background: SKEL }} />
          </div>
        );
      })}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18,
        marginTop: 6, padding: '22px 24px', borderRadius: 16,
        background: `${accent}14`, border: `1px solid ${accent}33`,
        opacity: Math.min(1, resultP * 1.3).toFixed(2),
        transform: `translateY(${((1 - resultP) * 16).toFixed(1)}px)`,
      }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, flex: '0 0 auto', background: `${accent}29`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconifyIcon icon="ph:equals-bold" size={26} color={accent} />
        </span>
        <div style={{ width: 150, height: 18, borderRadius: 9, background: `${accent}3d` }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 112, height: 38, borderRadius: 11, background: accent, opacity: 0.92 }} />
      </div>
    </div>
  );
}

// ─── Body: CALENDAR (agenda — skeleton) ──────────────────────────────
function CalendarWindowBody({ accent, frame, fps }) {
  const firstOffset = 3, daysInMonth = 31;
  // Dias destacados ganham tons de verde (mais claros → hoje cheio) e
  // colorizam UM DE CADA VEZ (stagger por `order`).
  const greenDays = [
    { day: 6,  shade: `${accent}40` },
    { day: 13, shade: `${accent}59` },
    { day: 18, shade: accent },        // hoje — verde cheio
    { day: 24, shade: `${accent}4d` },
  ];
  const greenMap = {};
  greenDays.forEach((g, idx) => { greenMap[g.day] = { shade: g.shade, order: idx }; });
  const cells = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const reveal = interpolate(frame, [0.4 * fps, 0.9 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  return (
    <div style={{ padding: '26px 34px 32px', opacity: reveal }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 14 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 10, borderRadius: 5, background: SKEL }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const g = greenMap[d];
          const colorP = g
            ? interpolate(frame, [(1.0 + g.order * 0.28) * fps, (1.4 + g.order * 0.28) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart })
            : 0;
          return (
            <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: 10, position: 'relative', background: SKEL_SOFT, overflow: 'hidden' }}>
              {g ? <div style={{ position: 'absolute', inset: 0, background: g.shade, opacity: colorP.toFixed(2) }} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Body: PLANTING (plantios — skeleton) ────────────────────────────
function PlantingWindowBody({ accent, frame, fps }) {
  // Tons de verde por estádio (claro → escuro): vegetativo, floração, colheita.
  const rows = [
    { label: 200, stage: 90, pct: 62, shade: '#86CFA4' },
    { label: 168, stage: 70, pct: 45, shade: '#4DA577' },
    { label: 220, stage: 82, pct: 88, shade: '#2A7B5A' },
  ];
  return (
    <div style={{ padding: '28px 40px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {rows.map((p, i) => {
        const t0 = (0.7 + i * 0.2) * fps;
        const e = interpolate(frame, [t0 - 0.3 * fps, t0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
        const fill = interpolate(frame, [t0, t0 + 0.7 * fps], [0, p.pct], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px',
            borderRadius: 16, background: MR_COLORS.fog,
            opacity: e.toFixed(2), transform: `translateX(${((1 - e) * -18).toFixed(1)}px)`,
          }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, flex: '0 0 auto', background: `${p.shade}29`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconifyIcon icon="ph:leaf-fill" size={32} color={p.shade} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ width: p.label, height: 16, borderRadius: 8, background: SKEL }} />
                <div style={{ width: p.stage, height: 14, borderRadius: 7, background: SKEL }} />
              </div>
              <div style={{ height: 10, borderRadius: 5, background: `${MR_COLORS.slateLight}33`, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fill.toFixed(1)}%`, background: p.shade, borderRadius: 5 }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Body: REPORTS (relatórios) ──────────────────────────────────────
function ReportsWindowBody({ accent, frame, fps }) {
  const enter = spring({ frame: frame - 0.6 * fps, fps, config: { damping: 16, stiffness: 120, mass: 0.85 } });
  const bars = [42, 66, 54, 82, 70];
  const linesP = interpolate(frame, [1.6 * fps, 2.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
  const CH = 130;
  return (
    <div style={{ padding: '30px 40px 36px' }}>
      <div style={{
        background: MR_COLORS.white, border: `1px solid ${MR_COLORS.slateLight}33`, borderRadius: 18,
        padding: '28px 30px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        opacity: Math.min(1, enter * 1.3), transform: `scale(${(0.96 + 0.04 * enter).toFixed(4)})`, transformOrigin: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
          <SkelBar w={230} h={22} delay={0.7} frame={frame} fps={fps} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: CH, marginBottom: 26 }}>
          {bars.map((h, i) => {
            const g = interpolate(frame, [(1.0 + i * 0.1) * fps, (1.6 + i * 0.1) * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart });
            return <div key={i} style={{ flex: 1, height: Math.max(4, (h / 100) * CH * g), background: i === 3 ? accent : `${accent}59`, borderRadius: '8px 8px 0 0' }} />;
          })}
        </div>
        {[100, 84, 68].map((w, i) => (
          <div key={i} style={{ height: 14, borderRadius: 7, background: `${MR_COLORS.slateLight}33`, width: `${w}%`, marginBottom: 12, opacity: linesP.toFixed(2) }} />
        ))}
      </div>
    </div>
  );
}

const BODY_BY_TYPE = {
  graph: GraphWindowBody,
  dashboard: DashboardWindowBody,
  map: MapWindowBody,
  weather: WeatherWindowBody,
  tasks: TasksWindowBody,
  alert: AlertWindowBody,
  trials: TrialsWindowBody,
  calculator: CalculatorWindowBody,
  calendar: CalendarWindowBody,
  planting: PlantingWindowBody,
  reports: ReportsWindowBody,
};
