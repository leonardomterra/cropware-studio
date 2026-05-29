// Storyboard padrão de 60s — 12 cenas em grade 4×3 (R12).
//
// Estrutura: 5 cenas FIXAS (locked) + 7 CUSTOMIZÁVEIS por tema.
// - locked: true   → identidade Cropware (mesmas em todo reel — não devem
//                    ser editadas pela IA nem pelo editor de prompt).
// - locked: false  → tema-específicas (IA gera, usuário edita por prompt).
//
//   #   Time         Tipo            Lock     Função
//   01  00.0  →  6.0  brand-intro    FIXA   Conheça o Cropware
//   02  05.0  → 10.0  headline       custom Headline editorial (R12 substituiu stat-card)
//   03  10.0  → 14.0  keyword        custom Palavra-chave + ícone Iconify
//   04  14.0  → 20.0  feature-list   custom 3 features tema-específicas (R24 swap c/ chapter)
//   05  20.0  → 24.0  chapter        FIXA   Cap. 02 · No campo (buffer silencioso entre voz)
//   06  24.0  → 30.0  scenario       custom Mini-cenário narrativo
//   07  30.0  → 34.0  chapter        FIXA   Cap. 03 · Resultados
//   08  34.0  → 40.0  app-card       custom Mock app ilustrando feature
//   09  40.0  → 44.0  whatsapp-chat  custom Conversa user × Cropware AI
//   10  44.0  → 50.0  quote          custom 5 palavras tema-específicas
//   11  50.0  → 55.0  lower-third    FIXA   WhatsApp Lottie + "Fala com a gente"
//   12  55.0  → 60.0  end-card       FIXA   Logo + tagline + "Seguir"
export const MOTION_REEL_DEFAULT = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 60.0,
  brand: 'Cropware',
  logoUrl: 'logo-cropware-pb-final.svg',
  // R16: tema visual default. 'editorial' = baseline atual (slate escuro +
  // verde profundo). Override por reel via storyboard.theme ou por cena via
  // scene.theme. Catálogo completo em motion-reel/themes.js.
  theme: 'editorial',
  // Música de fundo global — fade in/out + ducking automático sob voz
  // (configurável via duck/duckRamp). Engine em MotionReel.jsx faz o mix.
  // R15: trilha hospedada em R2 via Cloudflare Worker do studio. Trocar =
  // subir nova MP3 com `npm run reel:upload-music <file>` e usar a URL retornada.
  audio: {
    music: 'https://cropware-r2-worker.leonardoterra-comercial.workers.dev/images/studio/_motion-reel/audio/viacheslavstarostin-country-western-texas-background-music-361672.mp3',
    volume: 0.14,
    fadeIn: 1.5,
    fadeOut: 2.5,
    duck: 0.24,
    duckRamp: 0.3,
  },
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
    // ─────────────── 02 HEADLINE (custom) ───────────────
    // Headline editorial pós-intro. Visual fixo em Headline.jsx (imagem
    // `conheca-solucao-bg.webp` + Ken Burns + glass slate). IA preenche
    // kicker + headline por tema.
    {
      id: 'headline-1', start: 5.0, end: 10.0, type: 'headline',
      kicker: 'VISÃO COMPLETA',
      headline: 'Veja sua lavoura como nunca antes.',
      transitionIn: { type: 'wipe-up', dur: 0.55, easing: 'in-out-quart' },
    },
    // ─────────────── 03 KW-1 (custom) ───────────────
    // Visual fixo em Keyword.jsx (textura + Iconify animado + keyword).
    // IA preenche `word` e opcionalmente `icon` dentro da lista animada.
    {
      id: 'kw-fast', start: 10.0, end: 14.0, type: 'keyword',
      word: 'Rápido',
      icon: 'line-md:speed-loop',
      // Era flash branco rápido — quebrava a estética calma. Cinematic-blur
      // é uma transição suave de blur/zoom, fica em harmonia com o resto.
      transitionIn: { type: 'cinematic-blur', dur: 0.55, easing: 'in-out-cubic', sfx: 'impact-snap-dry', sfxOffset: 0.08, sfxVolume: 0.08 },
    },
    // ─────────────── 04 FEATURE-LIST (custom) ───────────────
    // R24: swap com chapter-1. Agora feature-list (narrado, 6s) vem ANTES do
    // chapter (silencioso, 4s), criando buffer silencioso antes do scenario
    // (também narrado). Evita encavalamento de voiceover entre 05→06.
    // Visual fixo em FeatureList.jsx (light theme, fundo branco/fog + cards
    // brancos com ícone + texto). IA preenche kicker, title, items.
    {
      id: 'features-1', start: 14.0, end: 20.0, type: 'feature-list',
      kicker: 'TUDO EM UM',
      title: 'Tudo na palma.',
      items: [
        { text: 'Monitoramento por satélite',  icon: 'twemoji:satellite' },
        { text: 'Diagnóstico direto em campo', icon: 'twemoji:seedling' },
        { text: 'Histórico completo de safra', icon: 'twemoji:bar-chart' },
      ],
      transitionIn: { type: 'push-up', dur: 0.5, easing: 'in-out-cubic' },
    },
    // ─────────────── 05 CHAPTER-1 (FIXA — buffer silencioso) ───────────────
    // Cena hardcoded em Chapter.jsx: imagem `conheca-produto-bg.webp`
    // (drone aéreo de talhões) + Ken Burns + glass pane slate +
    // "Capítulo 02 · No campo · Onde toda decisão começa.".
    {
      id: 'chapter-1', start: 20.0, end: 24.0, type: 'chapter',
      locked: true,
      chapterNumber: 2,
      // light-leak é mantido como alias legado, mas renderiza como
      // drift-fade discreto na engine pra nunca cair em magenta.
      transitionIn: { type: 'light-leak', dur: 1.0 },
    },
    // ─────────────── 06 SCENARIO (custom) ───────────────
    // Mini-cenário narrativo (ex: "É manhã. Você abre o Cropware..."). Visual
    // fixo em Scenario.jsx (imagem `conheca-campo-bg.webp` + glass slate).
    // IA preenche kicker + scenario por tema.
    {
      id: 'scenario-1', start: 24.0, end: 30.0, type: 'scenario',
      kicker: 'UMA MANHÃ QUALQUER',
      scenario: 'É manhã. Você abre o Cropware.\nEm segundos sabe o que precisa fazer hoje.',
      transitionIn: { type: 'mask-circle', dur: 0.6, easing: 'in-out-expo' },
    },
    // ─────────────── 07 CHAPTER-2 (FIXA) ───────────────
    // Cena hardcoded em Chapter.jsx via CHAPTER_CONFIGS[3].
    {
      id: 'chapter-2', start: 30.0, end: 34.0, type: 'chapter',
      locked: true,
      chapterNumber: 3,
      transitionIn: { type: 'cinematic-blur', dur: 0.6, easing: 'in-out-cubic' },
    },
    // ─────────────── 08 APP-CARD (custom) ───────────────
    {
      id: 'app-1', start: 34.0, end: 40.0, type: 'app-card',
      kicker: 'NO SEU BOLSO',
      caption: 'Previsão de campo em tempo real.',
      appType: 'weather',
      data: {
        windows: [
          {
            type: 'weather',
            title: 'Previsao',
            label: 'Sorriso - MT',
            value: 32,
            unit: 'graus',
            description: 'Clima de campo antes da equipe sair para a rota.',
            status: 'janela 48h',
            accent: 'var(--mr-greenAccent)',
          },
          {
            type: 'alert',
            title: 'Alerta',
            label: 'Risco operacional',
            value: '36h',
            description: 'Mudanca prevista vira prioridade na agenda tecnica.',
            status: 'prioridade',
            accent: 'var(--mr-greenBright)',
          },
          {
            type: 'dashboard',
            title: 'Agenda',
            label: 'Proxima acao',
            value: 3,
            unit: 'visitas',
            description: 'Rotas ajustadas por urgencia, regiao e oportunidade.',
            status: 'planejado',
            accent: 'var(--mr-greenDeep)',
          },
        ],
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
      transitionIn: { type: 'push-up', dur: 0.5, easing: 'in-out-cubic' },
    },
    // ─────────────── 09 KW-DIRECT (custom) ───────────────
    {
      // Cena 09 — WhatsApp chat mockup. Visual fixo em WhatsAppChat.jsx.
      // IA preenche `messages` com troca de 3-4 msgs entre user e Cropware AI.
      id: 'whatsapp-chat-1', start: 40.0, end: 44.0, type: 'whatsapp-chat',
      messages: [
        { from: 'user', text: 'Como está minha lavoura hoje?' },
        { from: 'ai',   text: 'Talhão 12 com NDVI 0.78 — saudável. Talhão 7 caiu pra 0.42, sugiro inspeção.' },
        { from: 'user', text: 'O que pode estar acontecendo?' },
        { from: 'ai',   text: 'Padrão sugere falta de nitrogênio. Quer abrir um plano de adubação?' },
      ],
      transitionIn: { type: 'zoom-blur', dur: 0.45, easing: 'out-quart', sfx: 'ui-confirm-modern', sfxOffset: 0.06, sfxVolume: 0.07 },
    },
    // ─────────────── 10 QUOTE (custom) ───────────────
    // Visual fixo em Quote.jsx: imagem `og-bg.webp` (close folha com orvalho)
    // + Ken Burns + glass slate leve. IA preenche `words` com 5 palavras do tema.
    {
      id: 'quote', start: 44.0, end: 50.0, type: 'quote',
      words: ['Mapear', 'Monitorar', 'Prever', 'Decidir', 'Provar'],
      transitionIn: { type: 'zoom-blur', dur: 0.5, easing: 'out-quart', sfx: 'whoosh-fast-cinematic', sfxOffset: 0.02, sfxVolume: 0.08 },
    },
    // ─────────────── 11 LOWER-THIRD CTA (FIXA) ───────────────
    // Cena hardcoded em LowerThird.jsx: WhatsApp Lottie + "Fala com a gente" +
    // "Tire suas dúvidas e conheça" + botão verde "Iniciar conversa".
    {
      id: 'lower-third-cta', start: 50.0, end: 55.0, type: 'lower-third',
      locked: true,
      transitionIn: { type: 'glass-frost', dur: 0.58, easing: 'out-quart', sfx: 'ui-confirm-modern', sfxOffset: 0.02, sfxVolume: 0.07 },
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
      transitionIn: { type: 'fade', dur: 0.6, easing: 'in-out-cubic', sfx: 'impact-thud', sfxVolume: 0.09 },
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
