// AppCard — janela mockup de aplicativo Cropware ilustrando o tema da cena.
// Chrome estilo macOS minimal (3 dots + barra título), conteúdo configurável
// via `appType` (weather/satellite/dashboard/alert) + `data`.
//
// Padrão visual: a janela "voa" de baixo + scale 0.94→1, conteúdo interno
// faz stagger fade-in. No final, leve float ±6px pra dar vida.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS, resolveColor } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { EASE, SceneBackdrop, FadeSlide, SceneTextureBackdrop, IconifyIcon, AccentBar } from '../helpers.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide['app-card'];

const alphaHex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');

export const AppCard = ({
  bg, fg,
  kicker = '',
  caption = '',
  appType = 'dashboard',
  data = {},
  background,
  bgImage,
  bgImageBlur,
  bgOverlayOpacity,
  overlayColor,
  bgTexture,
  bgTextureOpacity,
  bgTextureInvert,
  theme,
  start, end,
}) => {
  // bg/fg do storyboard têm prioridade (compat com reels antigos); senão cai
  // pro theme atual (per-slide-type). EXCEÇÃO: temas flat são auto-contidos —
  // ignoram bg/fg do storyboard pra garantir paleta consistente (branco no
  // flatClaro, verde-quase-preto no flatEscuro).
  const T = theme || FALLBACK;
  const bgColor = T.flat ? T.bg : (bg ? resolveColor(bg) : T.bg);
  const fgColor = T.flat ? T.fg : (fg ? resolveColor(fg) : T.fg);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = (end || 0) - (start || 0);
  const durFrames = Math.max(1, durSec * fps);

  // Ken Burns pra foto de fundo (6s típico).
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.18], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const kbTy = interpolate(frame, [0, durFrames], [0, -22], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bgIn = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const resolvedBgImage = bgImage || T.bgImage;
  const resolvedBgTexture = bgTexture || T.bgTexture;

  // Janela: spring entrada + leve float depois.
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90, mass: 1.1 },
  });
  const floatPhase = Math.sin((frame - 1.2 * fps) / fps * Math.PI * 0.6) * 6;
  const offsetY = (1 - enterSpring) * 240 + (frame > 1.2 * fps ? floatPhase : 0);
  const scale = 0.94 + 0.06 * enterSpring;
  const windows = normalizeAppWindows(appType, data);

  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '140px 80px', gap: 52, fontFamily: MR_FONTS.display,
    }}>
      {!T.flat ? <>
      {/* Camada 0: foto de fundo com Ken Burns + overlay de tonalização */}
      {resolvedBgImage ? (
        <>
          <AbsoluteFill style={{
            backgroundImage: `url('${staticFile(resolvedBgImage)}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${kbScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
            transformOrigin: 'center',
            filter: `blur(${bgImageBlur != null ? bgImageBlur : 6}px) saturate(0.78) brightness(0.72)`,
            opacity: bgIn,
          }} />
          <AbsoluteFill style={{
            background: overlayColor
              ? `${overlayColor}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.55)}`
              : (T.bgImageOverlay || `${T.bg}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.55)}`),
            opacity: bgIn,
            pointerEvents: 'none',
          }} />
        </>
      ) : null}
      {/* SceneBackdrop = textura legacy (dots/lines/noise) que vinha de
          storyboards antigos com `background: { type: 'texture' }`. Renderiza
          AbsoluteFill com cor sólida → cobre a bgImage do pool. Por isso só
          renderiza quando NÃO há bgImage (mantém compat com reels antigos sem
          pool, mas não invalida o pool atual). */}
      {!resolvedBgImage ? <SceneBackdrop background={background} durSec={durSec} /> : null}
      {resolvedBgTexture ? (
        <SceneTextureBackdrop
          src={resolvedBgTexture}
          durSec={durSec}
          opacity={bgTextureOpacity != null ? bgTextureOpacity : 0.08}
          invert={bgTextureInvert !== false}
        />
      ) : null}
      </> : null}
      {kicker ? (
        <StableKickerReveal
          text={kicker}
          delay={0}
          dur={0.5}
          style={{ fontFamily: MR_FONTS.caps, fontSize: 72, fontWeight: 400, color: T.kickerColor || T.accent, textTransform: 'uppercase', lineHeight: 1.15, textAlign: 'center', maxWidth: 880, letterSpacing: '0.04em', ...(T.flat ? { textShadow: 'none' } : {}) }}
          allowWrap
        />
      ) : null}
      {caption ? (
        <FadeSlide delay={0.2} dur={0.4} ty={20}>
          <div style={{
            fontFamily: MR_FONTS.grotesk, fontSize: 56, fontWeight: 500,
            lineHeight: 1.15, letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 720,
            textWrap: 'balance',
            color: T.captionColor || fgColor,
            textShadow: T.captionShadow || 'none',
          }}>{caption}</div>
        </FadeSlide>
      ) : null}
      {/* Linha accent acima das janelas — eco do AccentBar do cap 3 (slide 7).
          Cor: T.barColor → T.accent (verde do tema). Em temas com bg escuro
          (greenAbyss/slateAbyss), white pega melhor → branca se T.fg for white. */}
      <AccentBar
        delay={0.4}
        dur={0.55}
        origin="center"
        color={T.barColor || T.accent || MR_COLORS.greenAccent}
        width={420}
        height={4}
        style={{
          borderRadius: 2,
          boxShadow: T.flat ? 'none' : `0 0 24px ${T.accent || MR_COLORS.greenAccent}aa`,
          marginTop: 12,
          marginBottom: 12,
        }}
      />
      {/* Janela mockup — wrapper com transformação animada */}
      <div style={{
        width: 820,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        transform: `translateY(${offsetY.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        opacity: enterSpring,
        color: MR_COLORS.slateAbyss,
      }}>
        {windows.map((item, i) => (
          <FeatureWindow
            key={`${item.title}-${i}`}
            item={item}
            index={i}
            frame={frame}
            fps={fps}
            flat={T.flat}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const StableKickerReveal = ({ text, delay = 0, dur = 0.5, style, allowWrap = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayF = delay * fps;
  const durF = dur * fps;
  const p = interpolate(frame, [delayF, delayF + durF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  const hiddenRight = (1 - p) * 100;
  const blur = (1 - p) * 4;
  const y = (1 - p) * 8;
  return (
    <div style={{
      letterSpacing: '0.12em',
      clipPath: `inset(0 ${hiddenRight.toFixed(2)}% 0 0)`,
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `translateY(${y.toFixed(2)}px)`,
      textShadow: '0 2px 12px rgba(0,0,0,0.34)',
      whiteSpace: allowWrap ? 'normal' : 'nowrap',
      // text-wrap: balance distribui as palavras pra deixar as linhas com
      // largura próxima — evita "gestao na palma da / mao" e produz
      // "gestao na / palma da mao". Chromium suporta nativo (Remotion roda
      // em Chrome headless no render).
      textWrap: allowWrap ? 'balance' : undefined,
      ...style,
    }}>{text}</div>
  );
};

// (TopographicTextureBackdrop foi removido — substituído por SceneTextureBackdrop
// importado de helpers.jsx, que usa o pool aleatório de texturas.)

// Mantém os 3 cards na paleta verde mesmo se o storyboard pedir azure/amber.
// Mapeia tonalidades não-verdes pra verdes próximos em brilho — assim cada
// card ainda tem um accent distinto, mas todos dentro da família Cropware.
function forceGreenAccent(color) {
  if (!color) return MR_COLORS.greenDeep;
  const c = String(color).toLowerCase();
  if (c.includes('0b84f3') || c.includes('azure')) return MR_COLORS.greenDeep;
  if (c.includes('f4b860') || c.includes('amber')) return MR_COLORS.greenBright;
  if (c.includes('d7642a') || c.includes('e8b43b')) return MR_COLORS.greenForest;
  return color;
}

function defaultTitle(t) {
  if (t === 'weather')   return 'CROPWARE - TEMPO';
  if (t === 'satellite') return 'CROPWARE - NDVI';
  if (t === 'alert')     return 'CROPWARE - ALERTAS';
  return 'CROPWARE';
}

function normalizeAppWindows(appType, data = {}) {
  const source = Array.isArray(data.windows)
    ? data.windows
    : Array.isArray(data.features)
      ? data.features
      : null;
  const fallback = fallbackWindows(appType, data);
  const merged = (source && source.length ? source : fallback).slice(0, 3).map((item, i) => {
    const fb = fallback[i] || fallback[0];
    return {
      type: item.type || item.appType || fb.type,
      title: item.title || item.windowTitle || item.label || fb.title,
      label: item.label || item.kicker || fb.label,
      value: item.value == null ? fb.value : item.value,
      unit: item.unit == null ? fb.unit : item.unit,
      description: item.description || item.message || item.text || fb.description,
      accent: forceGreenAccent(resolveColor(item.accent || fb.accent)),
      status: item.status || fb.status,
    };
  });
  while (merged.length < 3) merged.push(fallback[merged.length] || fallback[0]);
  const visualTypes = ['weather', 'satellite', 'alert', 'dashboard'];
  const usedTypes = new Set();
  merged.forEach((item) => {
    const current = visualTypes.includes(item.type) ? item.type : 'dashboard';
    const nextType = usedTypes.has(current)
      ? (visualTypes.find(type => !usedTypes.has(type)) || current)
      : current;
    item.type = nextType;
    usedTypes.add(nextType);
  });
  return merged;
}

function fallbackWindows(appType, data = {}) {
  if (appType === 'weather') {
    return [
      { type: 'weather', title: data.windowTitle || 'Previsao', label: data.city || 'Sorriso - MT', value: data.temp == null ? 32 : Math.round(data.temp), unit: 'graus', description: data.condition || 'Janela de clima para orientar a visita de campo.', accent: MR_COLORS.greenAccent, status: 'janela 48h' },
      { type: 'alert', title: 'Alerta climatico', label: 'Risco operacional', value: '36h', unit: '', description: 'Mudanca prevista antes da equipe sair para a proxima rota.', accent: MR_COLORS.greenBright, status: 'prioridade' },
      { type: 'dashboard', title: 'Agenda tecnica', label: 'Proxima acao', value: '3', unit: 'visitas', description: 'Rotas ajustadas conforme condicao de campo e urgencia regional.', accent: MR_COLORS.greenDeep, status: 'planejado' },
    ];
  }
  if (appType === 'satellite') {
    return [
      { type: 'satellite', title: 'Mapa NDVI', label: data.lot || 'Talhao 12', value: data.ndvi == null ? '0.78' : Number(data.ndvi).toFixed(2), unit: '', description: 'Vigor da area demonstrativa visto antes da visita.', accent: MR_COLORS.greenAccent, status: 'monitorado' },
      { type: 'alert', title: 'Queda de vigor', label: 'Zona critica', value: '7', unit: 'ha', description: 'Recorte automatico do ponto que merece checagem.', accent: MR_COLORS.greenForest, status: 'atencao' },
      { type: 'dashboard', title: 'Comparativo', label: 'Antes x depois', value: '+12', unit: '%', description: 'Evidencia pronta para alinhar tecnico e comercial.', accent: MR_COLORS.greenDeep, status: 'comparativo' },
    ];
  }
  if (appType === 'alert') {
    return [
      { type: 'alert', title: data.title || 'Alerta ativo', label: (data.severity || 'alta').toUpperCase(), value: '!', unit: '', description: data.message || 'Evento importante detectado para a equipe agir rapido.', accent: MR_COLORS.greenForest, status: 'prioridade' },
      { type: 'dashboard', title: 'Responsavel', label: 'Acao em campo', value: '1', unit: 'time', description: 'Tarefa distribuida para quem esta mais perto da area.', accent: MR_COLORS.greenDeep, status: 'encaminhado' },
      { type: 'satellite', title: 'Evidencia', label: 'Area afetada', value: 'mapa', unit: '', description: 'Imagem e historico reunidos para decidir sem ruido.', accent: MR_COLORS.greenAccent, status: 'validado' },
    ];
  }
  const metrics = Array.isArray(data.metrics) && data.metrics.length ? data.metrics : [
    { label: 'Area monitorada', value: 1240, unit: 'ha', trend: 'up' },
    { label: 'Alertas hoje', value: 3, unit: '', trend: 'down' },
    { label: 'NDVI medio', value: 0.78, unit: '', trend: 'up' },
  ];
  return metrics.slice(0, 3).map((metric, i) => ({
    type: i === 1 ? 'alert' : i === 2 ? 'satellite' : 'dashboard',
    title: metric.title || metric.label || `Funcao ${i + 1}`,
    label: metric.trend === 'down' ? 'pede atencao' : 'em alta',
    value: metric.value,
    unit: metric.unit || '',
    description: metric.description || 'Indicador separado em uma janela propria para leitura rapida.',
    accent: metric.trend === 'down' ? MR_COLORS.greenForest : (i === 2 ? MR_COLORS.greenAccent : MR_COLORS.greenDeep),
    status: metric.status || 'tendência',
  }));
}

const FeatureWindow = ({ item, index, frame, fps, flat }) => {
  const T = { flat }; // proxy local pro `T.flat` usado abaixo
  const p = spring({
    frame: frame - (0.52 + index * 0.18) * fps,
    fps,
    config: { damping: 16, stiffness: 115, mass: 0.9 },
  });
  const opacity = Math.min(1, p * 1.2);
  // Direção horizontal de entrada alterna por índice — cada card desliza
  // de um lado diferente pra dar charme, mas todos pousam centralizados.
  const enterDir = [-1, 1, -1][index] || 0;
  const enterX = (1 - p) * 140 * enterDir;
  const tilt = [-1.2, 1.1, -0.45][index] || 0;
  const valueText = item.value == null ? '' : String(item.value);
  // Split inteligente: separa o número líder da unidade textual embutida no
  // value. Exemplos: "+5 sacas/ha" → ["+5", "sacas/ha"]; "85%" → ["85%", ""];
  // "100L/ha" → ["100", "L/ha"]; "32" → ["32", ""]. Quando o value já carrega
  // a unidade, ignora item.unit (evita duplicação tipo "+5 sacas/ha/ha").
  const valueParts = (() => {
    const m = valueText.match(/^([+\-]?\d+(?:[.,]\d+)?%?)\s*(.*)$/);
    if (m && m[1]) {
      const lead = m[1];
      const tail = (m[2] || '').trim();
      return { lead, tail: tail || item.unit || '' };
    }
    return { lead: valueText, tail: item.unit || '' };
  })();

  return (
    <div style={{
      width: 760,
      alignSelf: 'center',
      background: MR_COLORS.white,
      borderRadius: 24,
      boxShadow: T.flat ? '0 0 0 1px rgba(15,23,42,0.10)' : '0 28px 64px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      opacity,
      transform: `translate(${enterX.toFixed(2)}px, ${((1 - p) * 38).toFixed(2)}px) rotate(${(tilt * (1 - p)).toFixed(3)}deg)`,
      transformOrigin: 'center',
    }}>
      <AppChrome title={item.title} compact />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 38,
        alignItems: 'center',
        padding: '34px 44px',
        minHeight: 190,
        background: `linear-gradient(135deg, ${MR_COLORS.white} 0%, ${MR_COLORS.fog} 100%)`,
      }}>
        <MiniAppVisual type={item.type} accent={item.accent} frame={frame} fps={fps} index={index} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Linha superior: eyebrow (label) à esquerda, status pill à direita. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{
              fontFamily: MR_FONTS.mono,
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: item.accent,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: '1 1 auto',
              minWidth: 0,
            }}>{item.label}</div>
            {item.status ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: 8,
                background: `${item.accent}14`,
                fontFamily: MR_FONTS.mono,
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: '0.06em',
                color: item.accent,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.accent }} />
                {item.status}
              </div>
            ) : null}
          </div>
          {/* Número grande + sufixo (unidade) — único foco visual abaixo. */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontFamily: MR_FONTS.display,
              fontSize: 70,
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-0.035em',
              color: MR_COLORS.slateAbyss,
            }}>{valueParts.lead}</span>
            {valueParts.tail ? (
              <span style={{
                fontFamily: MR_FONTS.display,
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: MR_COLORS.slateMid,
              }}>{valueParts.tail}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mapeia o tipo da janela pra um ícone Phosphor inerente ao tema. Mantém
// linguagem visual unificada (todos em um card cinza) — só o glifo muda.
// Variantes `-fill` do Phosphor (silhuetas sólidas) garantem peso visual
// idêntico entre os glifos — `ph:` regular tem strokes de espessura variável.
// Cor única (slateDark) também unifica visualmente; o accent verde fica só no
// eyebrow label.
const APP_WINDOW_ICONS = {
  weather:   'ph:cloud-sun-fill',
  satellite: 'ph:map-trifold-fill',
  alert:     'ph:bell-fill',
  dashboard: 'ph:chart-bar-fill',
};

const MiniAppVisual = ({ type, frame = 0, fps = 30, index = 0 }) => {
  const icon = APP_WINDOW_ICONS[type] || APP_WINDOW_ICONS.dashboard;
  // Entrada: spring atrasada por janela (cada uma "acende" depois que a janela
  // pousa). Stagger de 0.18s ecoa o stagger da própria janela.
  const enter = spring({
    frame: frame - (0.85 + index * 0.18) * fps,
    fps,
    config: { damping: 12, stiffness: 130, mass: 0.7 },
  });
  const enterOpacity = Math.min(1, enter * 1.4);
  const enterScale = 0.5 + 0.5 * enter;
  // Breath contínuo — escala ±3% pra dar vida sem distrair. Cada ícone tem
  // fase deslocada pelo index → não sincronizam (mais natural).
  const tSec = frame / fps;
  const breath = 1 + Math.sin(tSec * Math.PI * 0.6 + index * 0.9) * 0.03;
  const iconScale = enterScale * breath;
  // Glow pulsando atrás do ícone — sutil, intensidade 8-22% modulada por seno.
  const glowAlpha = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(tSec * Math.PI * 0.5 + index * 1.1));
  const glowScale = 0.9 + 0.1 * (0.5 + 0.5 * Math.sin(tSec * Math.PI * 0.5 + index * 1.1));
  return (
    <div style={{
      width: 168,
      height: 148,
      borderRadius: 22,
      background: MR_COLORS.fog,
      boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      // Verde único pra todos os ícones — a variação cromática fica no eyebrow
      // e na pill, não no glifo principal (que precisa parecer "do mesmo set").
      color: MR_COLORS.greenAccent,
    }}>
      {/* Halo verde pulsando atrás do ícone — dá sensação de "live signal". */}
      <div style={{
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${MR_COLORS.greenAccent}${Math.round(glowAlpha * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
        transform: `scale(${glowScale.toFixed(3)})`,
        opacity: enterOpacity,
        pointerEvents: 'none',
      }} />
      <div style={{
        transform: `scale(${iconScale.toFixed(3)})`,
        opacity: enterOpacity,
        transformOrigin: 'center',
        display: 'flex',
      }}>
        <IconifyIcon icon={icon} size={88} />
      </div>
    </div>
  );
};

// Chrome de janela: 3 dots à esquerda + título centralizado.
// Sem borderBottom — a separação chrome/body fica só pela troca de cor de fundo.
const AppChrome = ({ title, compact = false }) => (
  <div style={{
    height: compact ? 56 : 68,
    background: MR_COLORS.fog,
    display: 'flex',
    alignItems: 'center',
    padding: compact ? '0 22px' : '0 26px',
    position: 'relative',
  }}>
    <div style={{ display: 'flex', gap: compact ? 12 : 13 }}>
      <span style={{ width: compact ? 19 : 21, height: compact ? 19 : 21, borderRadius: '50%', background: '#FF5F57' }} />
      <span style={{ width: compact ? 19 : 21, height: compact ? 19 : 21, borderRadius: '50%', background: '#FEBC2E' }} />
      <span style={{ width: compact ? 19 : 21, height: compact ? 19 : 21, borderRadius: '50%', background: '#28C840' }} />
    </div>
    <div style={{
      position: 'absolute', left: 0, right: 0, textAlign: 'center',
      fontFamily: MR_FONTS.mono, fontSize: compact ? 23 : 28, fontWeight: 500,
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
