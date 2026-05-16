// Storyboard padrão de 60s — 12 cenas em grade 4×3 (R12).
//
// Estrutura: 6 cenas FIXAS (locked) + 6 CUSTOMIZÁVEIS por tema.
// - locked: true   → identidade Cropware (mesmas em todo reel — não devem
//                    ser editadas pela IA nem pelo editor de prompt).
// - locked: false  → tema-específicas (IA gera, usuário edita por prompt).
//
//   #   Time         Tipo            Lock     Função
//   01  00.0  →  5.0  brand-intro    FIXA   Conheça o Cropware
//   02  05.0  → 10.0  stat-card      custom 1º dado de impacto
//   03  10.0  → 14.0  keyword        custom 1º keyword
//   04  14.0  → 18.0  chapter        FIXA   Cap. 02 · No campo
//   05  18.0  → 24.0  feature-list   custom 3 features tema-específicas
//   06  24.0  → 30.0  data-chart     custom Série de dados real
//   07  30.0  → 34.0  chapter        FIXA   Cap. 03 · Resultados
//   08  34.0  → 40.0  app-card       custom Mock app ilustrando feature
//   09  40.0  → 44.0  keyword        custom 2º keyword (fechamento)
//   10  44.0  → 50.0  quote          FIXA   Depoimento genérico de cliente
//   11  50.0  → 55.0  lower-third    FIXA   @cropware.app card CTA
//   12  55.0  → 60.0  end-card       FIXA   Logo + tagline + "Seguir"
export const MOTION_REEL_DEFAULT = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 60.0,
  brand: 'Cropware',
  logoUrl: 'logo-cropware-pb-final.svg',
  scenes: [
    // ─────────────── 01 INTRO (FIXA — identidade Cropware) ───────────────
    // Cena hardcoded em BrandIntro.jsx: bg `conheca-hero-bg.webp` (homem no
    // campo, hero da /conheca) + Ken Burns lento + overlay verde escuro +
    // CONHEÇA em mono branco com typewriter + underline verde +
    // logo Cropware em branco + tagline "Gestão de / Desenvolvimento / de Mercado".
    // Storyboard só define duração e transição — tudo o mais é hardcoded.
    {
      id: 'intro', start: 0.0, end: 6.0, type: 'brand-intro',
      locked: true,
      transitionIn: { type: 'fade', dur: 0.3, easing: 'out-expo' },
    },
    // ─────────────── 02 STAT-1 (custom) ───────────────
    {
      id: 'stat-1', start: 5.0, end: 10.0, type: 'stat-card',
      kicker: 'EM CAMPO',
      value: 3, suffix: 'x',
      label: 'mais rápido que sua planilha de safra',
      bg: 'var(--mr-greenAbyss)', fg: 'var(--mr-white)',
      background: {
        type: 'gradient',
        gradient: { kind: 'radial', colors: ['var(--mr-greenForest)', 'var(--mr-greenAbyss)'] },
      },
      transitionIn: { type: 'wipe-up', dur: 0.55, easing: 'in-out-quart', sfx: 'whoosh' },
    },
    // ─────────────── 03 KW-1 (custom) ───────────────
    {
      id: 'kw-fast', start: 10.0, end: 14.0, type: 'keyword',
      word: 'Rápido.',
      bg: 'var(--mr-slateAbyss)', fg: 'var(--mr-white)',
      background: {
        type: 'texture',
        texture: { kind: 'noise', color: 'var(--mr-slateAbyss)', intensity: 0.35 },
      },
      transitionIn: { type: 'flash', dur: 0.35, easing: 'in-out-cubic', color: '#FFFFFF', sfx: 'impact' },
    },
    // ─────────────── 04 CHAPTER-1 (FIXA) ───────────────
    // Cena hardcoded em Chapter.jsx: imagem `conheca-produto-bg.webp`
    // (drone aéreo de talhões) + Ken Burns + glass pane slate +
    // "Capítulo 02 · No campo · Onde toda decisão começa.".
    {
      id: 'chapter-1', start: 14.0, end: 18.0, type: 'chapter',
      locked: true,
      chapterNumber: 2,
      transitionIn: { type: 'light-leak', dur: 1.0, seed: 3, hueShift: 30, sfx: 'page-turn' },
    },
    // ─────────────── 05 FEATURE-LIST (custom) ───────────────
    {
      id: 'features-1', start: 18.0, end: 24.0, type: 'feature-list',
      kicker: 'TUDO EM UM',
      title: 'Tudo na palma.',
      items: [
        { text: 'Monitoramento por satélite',  icon: 'twemoji:satellite' },
        { text: 'Diagnóstico direto em campo', icon: 'twemoji:seedling' },
        { text: 'Histórico completo de safra', icon: 'twemoji:bar-chart' },
      ],
      bg: 'var(--mr-white)', fg: 'var(--mr-slateAbyss)',
      background: {
        type: 'gradient',
        gradient: { kind: 'linear', colors: ['var(--mr-white)', 'var(--mr-fog)'], angle: 0 },
      },
      transitionIn: { type: 'push-up', dur: 0.5, easing: 'in-out-cubic', sfx: 'whoosh' },
    },
    // ─────────────── 06 DATA-CHART (custom) ───────────────
    {
      id: 'data-1', start: 24.0, end: 30.0, type: 'data-chart',
      kicker: 'SAFRA 24/25 vs 23/24',
      title: 'Produtividade no talhão.',
      chartType: 'bar-line',
      unit: 'sc/ha',
      data: {
        labels: ['DEZ', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI'],
        series: [
          { name: 'Safra 24/25', kind: 'bar', values: [42, 51, 58, 64, 71, 76], color: '#6AC58F' },
          { name: 'Produtividade', kind: 'line', values: [38, 44, 49, 55, 62, 69], color: '#0B84F3' },
        ],
      },
      bg: 'var(--mr-slateAbyss)', fg: 'var(--mr-white)',
      background: {
        type: 'gradient',
        gradient: { kind: 'breathing-radial', colors: ['var(--mr-slateDark)', 'var(--mr-slateAbyss)'], breathScale: 1.03 },
      },
      overlays: [
        { type: 'line-draw', color: 'var(--mr-greenAccent)', preset: 'corner-r', thickness: 4, delay: 0.6, dur: 1.5, opacity: 0.7 },
      ],
      transitionIn: { type: 'mask-circle', dur: 0.6, easing: 'in-out-expo', sfx: 'reveal' },
    },
    // ─────────────── 07 CHAPTER-2 (FIXA) ───────────────
    // Cena hardcoded em Chapter.jsx via CHAPTER_CONFIGS[3].
    {
      id: 'chapter-2', start: 30.0, end: 34.0, type: 'chapter',
      locked: true,
      chapterNumber: 3,
      transitionIn: { type: 'cinematic-blur', dur: 0.6, easing: 'in-out-cubic', sfx: 'riser' },
    },
    // ─────────────── 08 APP-CARD (custom) ───────────────
    {
      id: 'app-1', start: 34.0, end: 40.0, type: 'app-card',
      kicker: 'NO SEU BOLSO',
      caption: 'Previsão de campo em tempo real.',
      appType: 'weather',
      data: {
        city: 'Sorriso · MT',
        temp: 32,
        condition: 'Ensolarado',
        forecast: [
          { day: 'TER', temp: 31 },
          { day: 'QUA', temp: 29 },
          { day: 'QUI', temp: 30 },
          { day: 'SEX', temp: 27 },
        ],
      },
      bg: 'var(--mr-slateAbyss)', fg: 'var(--mr-white)',
      background: {
        type: 'texture',
        texture: { kind: 'dots', color: 'var(--mr-slateDark)', intensity: 0.18 },
      },
      overlays: [
        { type: 'rotating-rings', color: 'var(--mr-greenBright)', opacity: 0.15, count: 3, origin: 'top-right' },
      ],
      transitionIn: { type: 'push-up', dur: 0.5, easing: 'in-out-cubic', sfx: 'whoosh' },
    },
    // ─────────────── 09 KW-DIRECT (custom) ───────────────
    {
      id: 'kw-direct', start: 40.0, end: 44.0, type: 'keyword',
      word: 'Direto ao ponto.',
      bg: 'var(--mr-greenAccent)', fg: 'var(--mr-white)',
      background: {
        type: 'gradient',
        gradient: { kind: 'breathing-radial', colors: ['var(--mr-greenBright)', 'var(--mr-greenDeep)'], breathScale: 1.06 },
      },
      transitionIn: { type: 'zoom-blur', dur: 0.45, easing: 'out-quart', sfx: 'whip' },
    },
    // ─────────────── 10 QUOTE (FIXA) ───────────────
    // Cena hardcoded em Quote.jsx: imagem `og-bg.webp` (close folha com orvalho)
    // + Ken Burns + glass slate leve + "A fazenda inteira, num só lugar." · Cropware.
    {
      id: 'quote', start: 44.0, end: 50.0, type: 'quote',
      locked: true,
      transitionIn: { type: 'wipe-down', dur: 0.5, easing: 'in-out-quart', sfx: 'switch' },
    },
    // ─────────────── 11 LOWER-THIRD CTA (FIXA) ───────────────
    // Cena hardcoded em LowerThird.jsx: WhatsApp Lottie + "Fala com a gente" +
    // "Tire suas dúvidas no WhatsApp" + botão verde "Iniciar conversa".
    {
      id: 'lower-third-cta', start: 50.0, end: 55.0, type: 'lower-third',
      locked: true,
      transitionIn: { type: 'push-up', dur: 0.45, easing: 'in-out-cubic', sfx: 'pop' },
    },
    // ─────────────── 12 END-CARD (FIXA) ───────────────
    {
      id: 'end', start: 55.0, end: 60.0, type: 'end-card',
      locked: true,
      logoUrl: 'logo-cropware-pb-final.svg',
      tagline: 'O agro é Cropware.',
      handle: '@cropware.app',
      bg: 'var(--mr-slateAbyss)', fg: 'var(--mr-white)',
      background: {
        type: 'gradient',
        gradient: { kind: 'breathing-radial', colors: ['var(--mr-greenAbyss)', 'var(--mr-slateAbyss)'], breathScale: 1.08 },
      },
      overlays: [
        { type: 'pulse-circle', color: 'var(--mr-greenAccent)', opacity: 0.18 },
      ],
      transitionIn: { type: 'fade', dur: 0.6, easing: 'in-out-cubic', sfx: 'notification' },
    },
  ],
};

// Calcula durationInFrames total considerando overlap das transições.
// Em TransitionSeries cada transition rouba `dur` da soma do par adjacente.
export function computeReelDurationInFrames(storyboard) {
  const fps = storyboard.fps || 30;
  const scenes = storyboard.scenes || [];
  let totalFrames = 0;
  scenes.forEach((s, i) => {
    const sceneDur = Math.max(1, Math.round(((s.end || 0) - (s.start || 0)) * fps));
    totalFrames += sceneDur;
    if (i > 0 && s.transitionIn) {
      const tDur = Math.max(2, Math.round((s.transitionIn.dur || 0.3) * fps));
      totalFrames -= tDur;
    }
  });
  return Math.max(1, totalFrames);
}

// Helpers pra trabalhar com locked/custom em outros lugares.
export function getLockedSceneIds(storyboard) {
  return (storyboard.scenes || []).filter(s => s.locked === true).map(s => s.id);
}
export function getCustomSceneIds(storyboard) {
  return (storyboard.scenes || []).filter(s => s.locked !== true).map(s => s.id);
}
