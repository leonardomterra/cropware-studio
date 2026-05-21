// Catálogo de temas visuais do Motion Reel.
//
// Cada tema tem entrada por slide-type. Isso evita conflitos visuais (ex:
// tema vibrante em Keyword precisa de bg diferente do tema vibrante em
// Headline pra não ficar "verde sobre verde").
//
// Storyboard.theme define o tema default; scene.theme pode override por cena.
// Reels antigos sem `theme` → 'editorial' (fallback em resolveTheme).
import { MR_COLORS } from './theme.js';

// Gradientes de "glass" pra tints sobre imagem (usado em Headline, Scenario).
// Mais escuro embaixo pra dar peso ao texto sobre as fotos.
const GLASS = {
  slate:  'linear-gradient(180deg, rgba(26,27,26,0.45) 0%, rgba(26,27,26,0.62) 55%, rgba(10,10,10,0.80) 100%)',
  forest: 'linear-gradient(180deg, rgba(20,63,44,0.48) 0%, rgba(20,63,44,0.66) 55%, rgba(10,30,20,0.82) 100%)',
  cream:  'linear-gradient(180deg, rgba(245,241,234,0.55) 0%, rgba(245,241,234,0.72) 55%, rgba(230,222,205,0.88) 100%)',
  white:  'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.84) 55%, rgba(238,239,238,0.92) 100%)',
};

export const MR_THEMES = {
  // ── editorial: tema padrão (R12/R13/R14). Slate escuro + verde profundo.
  // Mood premium, calmo, cinematográfico.
  editorial: {
    label: 'Editorial',
    description: 'Slate escuro · verde profundo · mood premium',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, logoColor: MR_COLORS.white,
        bgImage: 'conheca-hero-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.08,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: 'linear-gradient(180deg, rgba(20,63,44,0.32) 0%, rgba(20,63,44,0.50) 55%, rgba(10,42,28,0.72) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 12%, rgba(255,255,255,0) 28%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0) 38%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.40) 100%)',
      },
      chapter: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, iconColor: MR_COLORS.greenBright,
        glassTint: GLASS.slate,
      },
      'lower-third': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        bgImage: 'sobre-equipe.webp',
        glassTint: 'linear-gradient(180deg, rgba(106,197,143,0.55) 0%, rgba(42,123,90,0.75) 55%, rgba(20,63,44,0.90) 100%)',
        cardBg: MR_COLORS.white,
        titleColor: MR_COLORS.slateAbyss,
        subtitleColor: MR_COLORS.slateMid,
      },
      'end-card': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        logoColor: MR_COLORS.greenAccent,
        cardBg: MR_COLORS.white,
        buttonBg: MR_COLORS.greenAccent, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.fog, followingFg: MR_COLORS.slateAbyss,
      },
      headline: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenForest,
        bgImage: 'conheca-solucao-bg.webp', glassTint: GLASS.slate,
      },
      keyword: {
        bg: MR_COLORS.greenAccent, fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenBright,
        iconFilter: `drop-shadow(0 0 28px ${MR_COLORS.greenBright}99)`,
        accent: MR_COLORS.greenBright, textureMode: 'multiply',
      },
      quote: {
        bg: MR_COLORS.slateAbyss,
        fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenBright,
        highlightColor: MR_COLORS.greenBright,
        bgImage: 'og-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.30) 0%, rgba(26,27,26,0.48) 55%, rgba(10,10,10,0.66) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 14%, rgba(255,255,255,0) 28%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 42%)',
        vignette: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.42) 100%)',
        textShadow: '0 2px 16px rgba(0,0,0,0.5)',
        iconFilter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
      },
      'feature-list': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenBright,
        paperTextureOpacity: 0.22,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.55) contrast(0.95)',
        cardBg: '#2A2B2A',
      },
      scenario: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenForest,
        bgImage: 'conheca-campo-bg.webp', glassTint: GLASS.slate,
      },
      'app-card': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenForest,
        kickerColor: MR_COLORS.greenBright,
        captionColor: MR_COLORS.white,
        captionShadow: '0 3px 18px rgba(0,0,0,0.46)',
        topographic: {
          paperOpacity: 0.28,
          lineOpacity: 0.22,
          tint: 'linear-gradient(145deg, rgba(20,63,44,0.72), rgba(26,27,26,0.86))',
          glow: 'radial-gradient(circle at 74% 18%, rgba(130,204,165,0.22), transparent 34%)',
          lineBlend: 'screen',
          paperBlend: 'overlay',
          filter: 'grayscale(1) contrast(1.08) brightness(0.9)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'wpp-bg-pattern.png',
        bgTint: 'rgba(26,27,26,0.78)',
      },
    },
  },

  // ── vibrante: greenBright/Accent dominante. Mood energético, expansivo.
  // Pra campanhas virais, lançamentos, momentos "uau".
  vibrante: {
    label: 'Vibrante',
    description: 'Verde brilhante · slate médio · mood energético',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, logoColor: MR_COLORS.white,
        bgImage: 'conheca-campo-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.10,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: GLASS.forest,
      },
      chapter: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, iconColor: MR_COLORS.white,
        glassTint: GLASS.forest,
      },
      'lower-third': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        bgImage: 'conheca-gd-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(130,204,165,0.48) 0%, rgba(42,123,90,0.76) 55%, rgba(6,30,18,0.92) 100%)',
        cardBg: MR_COLORS.greenForest,
        titleColor: MR_COLORS.white,
        subtitleColor: MR_COLORS.greenBright,
        cardShadow: '0 32px 64px rgba(6,30,18,0.44)',
      },
      'end-card': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        logoColor: MR_COLORS.greenBright,
        cardBg: MR_COLORS.white,
        handleColor: MR_COLORS.greenAbyss,
        buttonBg: MR_COLORS.greenForest, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.fog, followingFg: MR_COLORS.greenAbyss,
      },
      headline: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenAccent,
        bgImage: 'conheca-campo-bg.webp', glassTint: GLASS.forest,
      },
      keyword: {
        // Inverte hierarquia: bg escuro, fg verde claro (em vez de bg verde + fg branco).
        bg: MR_COLORS.greenForest, fg: MR_COLORS.greenBright,
        wordColor: MR_COLORS.white,
        iconColor: MR_COLORS.white,
        iconFilter: 'drop-shadow(0 0 28px rgba(255,255,255,0.55))',
        accent: MR_COLORS.white, textureMode: 'screen',
      },
      quote: {
        bg: MR_COLORS.greenAbyss,
        fg: MR_COLORS.white,
        iconColor: MR_COLORS.white,
        highlightColor: MR_COLORS.greenBright,
        bgImage: 'conheca-gd-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(20,63,44,0.34) 0%, rgba(20,63,44,0.56) 55%, rgba(6,30,18,0.78) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(130,204,165,0.22) 0%, rgba(130,204,165,0.06) 18%, rgba(130,204,165,0) 34%)',
        bottomDepth: 'linear-gradient(0deg, rgba(20,63,44,0.58) 0%, rgba(20,63,44,0.20) 28%, rgba(20,63,44,0) 48%)',
        vignette: 'radial-gradient(ellipse at center, transparent 32%, rgba(20,63,44,0.46) 100%)',
        textShadow: '0 3px 18px rgba(6,30,18,0.58)',
        iconFilter: 'drop-shadow(0 0 18px rgba(255,255,255,0.42))',
      },
      'feature-list': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenDeep,
        paperTextureOpacity: 0.22,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.6) contrast(0.95)',
        cardBg: '#1F5436', cardFg: MR_COLORS.white,
        cardIconBg: 'rgba(130,204,165,0.20)',
        cardIconColor: MR_COLORS.greenBright,
        cardShadow: '0 12px 34px rgba(0,0,0,0.30), 0 2px 4px rgba(0,0,0,0.20)',
      },
      scenario: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenAccent,
        bgImage: 'conheca-produto-bg.webp', glassTint: GLASS.forest,
      },
      'app-card': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenAccent,
        topographic: {
          paperOpacity: 0.34,
          lineOpacity: 0.28,
          tint: 'linear-gradient(140deg, rgba(20,63,44,0.62), rgba(42,123,90,0.78))',
          glow: 'radial-gradient(circle at 70% 20%, rgba(130,204,165,0.34), transparent 36%)',
          lineBlend: 'screen',
          paperBlend: 'overlay',
          filter: 'grayscale(1) contrast(1.14) brightness(0.92)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'conheca-gd-bg.webp',
        bgTint: 'rgba(20,63,44,0.65)',
      },
    },
  },

  // ── floresta: verde escuro médio dominante (greenForest) + accent verde
  // claro (greenBright). Mood imersivo, natureza viva, conexão com o campo.
  // Distinto do vibrante (que é greenAbyss + greenBright, mais escuro/saturado).
  floresta: {
    label: 'Floresta',
    description: 'Verde escuro médio · accent verde claro · mood imersivo',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, logoColor: MR_COLORS.white,
        bgImage: 'conheca-hero-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.10,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: 'linear-gradient(180deg, rgba(42,123,90,0.40) 0%, rgba(42,123,90,0.60) 55%, rgba(20,63,44,0.78) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        topSheen: 'linear-gradient(180deg, rgba(130,204,165,0.12) 0%, rgba(130,204,165,0.04) 14%, rgba(130,204,165,0) 28%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.46) 0%, rgba(20,63,44,0.20) 22%, rgba(0,0,0,0) 42%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.44) 100%)',
      },
      chapter: {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        subtitleColor: MR_COLORS.white,
        accent: MR_COLORS.greenBright, iconColor: MR_COLORS.greenBright,
        iconShadow: '0 6px 16px rgba(0,0,0,0.55)',
        glassTint: 'linear-gradient(180deg, rgba(42,123,90,0.45) 0%, rgba(42,123,90,0.64) 55%, rgba(20,63,44,0.82) 100%)',
        textShadow: '0 4px 28px rgba(0,0,0,0.6)',
        subtitleShadow: '0 2px 16px rgba(0,0,0,0.5)',
      },
      'lower-third': {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        bgImage: 'sobre-equipe.webp',
        glassTint: 'linear-gradient(180deg, rgba(106,197,143,0.55) 0%, rgba(42,123,90,0.74) 55%, rgba(20,63,44,0.90) 100%)',
        cardBg: '#36906A',
        titleColor: MR_COLORS.white,
        subtitleColor: '#C8E6D4',
        cardShadow: '0 26px 52px rgba(0,0,0,0.50)',
      },
      'end-card': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        logoColor: MR_COLORS.white,
        cardBg: '#36906A',
        handleColor: MR_COLORS.greenBright,
        buttonBg: MR_COLORS.greenBright, buttonFg: MR_COLORS.greenAbyss,
        followingBg: '#36906A', followingFg: MR_COLORS.white,
        followingBorder: MR_COLORS.greenBright,
        cardShadow: '0 28px 56px rgba(0,0,0,0.55)',
      },
      headline: {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenBright,
        textShadow: '0 3px 18px rgba(0,0,0,0.55)',
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenDeep,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(42,123,90,0.48) 0%, rgba(42,123,90,0.66) 55%, rgba(20,63,44,0.84) 100%)',
      },
      keyword: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        wordColor: MR_COLORS.white,
        wordTextShadow: `0 6px 24px ${MR_COLORS.greenBright}44`,
        iconColor: MR_COLORS.greenBright,
        iconFilter: `drop-shadow(0 0 32px ${MR_COLORS.greenBright}aa)`,
        accent: MR_COLORS.greenBright,
        textureMode: 'screen',
        textureFilter: 'contrast(1.08) brightness(0.95)',
      },
      quote: {
        bg: MR_COLORS.greenAbyss,
        fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenBright,
        highlightColor: MR_COLORS.greenBright,
        bgImage: 'og-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(42,123,90,0.42) 0%, rgba(42,123,90,0.60) 55%, rgba(20,63,44,0.78) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(130,204,165,0.14) 0%, rgba(130,204,165,0.04) 16%, rgba(130,204,165,0) 32%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.50) 0%, rgba(20,63,44,0.22) 24%, rgba(0,0,0,0) 46%)',
        vignette: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.46) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        iconFilter: `drop-shadow(0 2px 12px ${MR_COLORS.greenBright}55)`,
      },
      'feature-list': {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenAccent,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.22,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.6) contrast(0.95)',
        cardBg: '#36906A',
      },
      scenario: {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenBright,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
        bgImage: 'conheca-campo-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(42,123,90,0.48) 0%, rgba(42,123,90,0.66) 56%, rgba(20,63,44,0.84) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(130,204,165,0.14) 0%, rgba(130,204,165,0.04) 18%, rgba(130,204,165,0) 36%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.46) 0%, rgba(20,63,44,0.20) 24%, rgba(0,0,0,0) 44%)',
        vignette: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.42) 100%)',
        kickerTextShadow: `0 1px 8px ${MR_COLORS.greenBright}44`,
        textShadow: '0 2px 14px rgba(0,0,0,0.55)',
      },
      'app-card': {
        bg: MR_COLORS.greenForest, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenBright,
        captionColor: MR_COLORS.white,
        captionShadow: '0 2px 10px rgba(0,0,0,0.55)',
        topographic: {
          paperOpacity: 0.32, lineOpacity: 0.22,
          tint: 'linear-gradient(145deg, rgba(42,123,90,0.74), rgba(20,63,44,0.84))',
          glow: `radial-gradient(circle at 72% 16%, ${MR_COLORS.greenBright}33, transparent 34%)`,
          lineBlend: 'screen', paperBlend: 'soft-light',
          filter: 'grayscale(1) contrast(1.10) brightness(0.95)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'og-bg.webp',
        bgTint: 'rgba(20,63,44,0.62)',
      },
    },
  },

  // ── granito: slate médio escuro (slateDark) + verde Cropware oficial
  // (greenAccent). Mood sólido, corporativo equilibrado, mid-tone neutro
  // com identidade Cropware. Distinto do editorial (que é slateAbyss, ainda
  // mais escuro). Bom pra lançamentos de produto e reels técnicos.
  granito: {
    label: 'Granito',
    description: 'Slate médio · verde Cropware oficial · mood sólido',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, logoColor: MR_COLORS.white,
        bgImage: 'conheca-solucao-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.10,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.42) 0%, rgba(61,63,61,0.62) 55%, rgba(26,27,26,0.80) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        topSheen: `linear-gradient(180deg, rgba(106,197,143,0.10) 0%, rgba(106,197,143,0.03) 14%, rgba(106,197,143,0) 28%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.48) 0%, rgba(20,63,44,0.16) 22%, rgba(0,0,0,0) 42%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.46) 100%)',
      },
      chapter: {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        subtitleColor: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, iconColor: MR_COLORS.greenAccent,
        iconShadow: '0 6px 16px rgba(0,0,0,0.55)',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.45) 0%, rgba(61,63,61,0.64) 55%, rgba(26,27,26,0.84) 100%)',
        textShadow: '0 4px 28px rgba(0,0,0,0.6)',
        subtitleShadow: '0 2px 16px rgba(0,0,0,0.5)',
      },
      'lower-third': {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        bgImage: 'sobre-equipe.webp',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.55) 0%, rgba(42,123,90,0.65) 55%, rgba(20,63,44,0.86) 100%)',
        cardBg: '#4A4D4A',
        titleColor: MR_COLORS.white,
        subtitleColor: '#CFD3CF',
        cardShadow: '0 26px 52px rgba(0,0,0,0.55)',
      },
      'end-card': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        logoColor: MR_COLORS.white,
        cardBg: '#4A4D4A',
        handleColor: MR_COLORS.greenAccent,
        buttonBg: MR_COLORS.greenAccent, buttonFg: MR_COLORS.slateAbyss,
        followingBg: '#4A4D4A', followingFg: MR_COLORS.white,
        followingBorder: MR_COLORS.greenAccent,
        cardShadow: '0 28px 56px rgba(0,0,0,0.60)',
      },
      headline: {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenAccent,
        textShadow: '0 3px 18px rgba(0,0,0,0.55)',
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.48) 0%, rgba(61,63,61,0.66) 55%, rgba(26,27,26,0.84) 100%)',
      },
      keyword: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        wordColor: MR_COLORS.white,
        wordTextShadow: `0 6px 22px ${MR_COLORS.greenAccent}44`,
        iconColor: MR_COLORS.greenAccent,
        iconFilter: `drop-shadow(0 0 32px ${MR_COLORS.greenAccent}aa)`,
        accent: MR_COLORS.greenAccent,
        textureMode: 'screen',
        textureFilter: 'contrast(1.08) brightness(0.95)',
      },
      quote: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenAccent,
        highlightColor: MR_COLORS.greenAccent,
        bgImage: 'og-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.42) 0%, rgba(61,63,61,0.60) 55%, rgba(26,27,26,0.80) 100%)',
        topSheen: `linear-gradient(180deg, rgba(106,197,143,0.12) 0%, rgba(106,197,143,0.04) 16%, rgba(106,197,143,0) 32%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.20) 24%, rgba(0,0,0,0) 46%)',
        vignette: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.48) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        iconFilter: `drop-shadow(0 2px 12px ${MR_COLORS.greenAccent}55)`,
      },
      'feature-list': {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.22,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.55) contrast(0.95)',
        cardBg: '#4A4D4A',
      },
      scenario: {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenAccent,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
        bgImage: 'conheca-campo-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(61,63,61,0.48) 0%, rgba(61,63,61,0.66) 56%, rgba(26,27,26,0.84) 100%)',
        topSheen: `linear-gradient(180deg, rgba(106,197,143,0.12) 0%, rgba(106,197,143,0.04) 18%, rgba(106,197,143,0) 36%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0) 44%)',
        vignette: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.42) 100%)',
        kickerTextShadow: `0 1px 8px ${MR_COLORS.greenAccent}44`,
        textShadow: '0 2px 14px rgba(0,0,0,0.55)',
      },
      'app-card': {
        bg: MR_COLORS.slateDark, fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenAccent,
        captionColor: MR_COLORS.white,
        captionShadow: '0 2px 10px rgba(0,0,0,0.55)',
        topographic: {
          paperOpacity: 0.32, lineOpacity: 0.22,
          tint: 'linear-gradient(145deg, rgba(61,63,61,0.74), rgba(26,27,26,0.84))',
          glow: `radial-gradient(circle at 72% 16%, ${MR_COLORS.greenAccent}33, transparent 34%)`,
          lineBlend: 'screen', paperBlend: 'soft-light',
          filter: 'grayscale(1) contrast(1.10) brightness(0.95)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'og-bg.webp',
        bgTint: 'rgba(61,63,61,0.64)',
      },
    },
  },

  // ── mineral: slate cinza-verde mineral + verde Cropware + tipografia firme.
  // Mood lab/precisão, neutro com caráter, pra reels técnicos e demonstrativos.
  mineral: {
    label: 'Mineral',
    description: 'Slate cinza-verde · verde Cropware · mood lab/precisão',
    perSlide: {
      'brand-intro': {
        bg: '#5C605D', fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, logoColor: MR_COLORS.white,
        bgImage: 'conheca-produto-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.08,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.45) 0%, rgba(61,63,61,0.62) 55%, rgba(26,27,26,0.78) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.50)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 12%, rgba(255,255,255,0) 28%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0) 42%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.42) 100%)',
      },
      chapter: {
        bg: '#5C605D', fg: MR_COLORS.white,
        subtitleColor: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, iconColor: MR_COLORS.greenAccent,
        iconShadow: '0 6px 16px rgba(0,0,0,0.55)',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.48) 0%, rgba(61,63,61,0.66) 55%, rgba(26,27,26,0.82) 100%)',
        textShadow: '0 4px 28px rgba(0,0,0,0.55)',
        subtitleShadow: '0 2px 16px rgba(0,0,0,0.50)',
      },
      'lower-third': {
        bg: '#3D3F3D', fg: MR_COLORS.white,
        bgImage: 'sobre-equipe.webp',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.58) 0%, rgba(61,63,61,0.74) 55%, rgba(26,27,26,0.88) 100%)',
        cardBg: '#4A4D4A',
        titleColor: MR_COLORS.white,
        subtitleColor: '#C8CCC8',
        cardShadow: '0 26px 52px rgba(0,0,0,0.55)',
      },
      'end-card': {
        bg: '#3D3F3D', fg: MR_COLORS.white,
        logoColor: MR_COLORS.white,
        cardBg: '#4A4D4A',
        handleColor: MR_COLORS.greenAccent,
        buttonBg: MR_COLORS.greenAccent, buttonFg: '#1A1B1A',
        followingBg: '#4A4D4A', followingFg: MR_COLORS.white,
        followingBorder: MR_COLORS.greenAccent,
        cardShadow: '0 28px 56px rgba(0,0,0,0.55)',
      },
      headline: {
        bg: '#5C605D', fg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenAccent,
        textShadow: '0 3px 18px rgba(0,0,0,0.55)',
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        bgImage: 'conheca-produto-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.50) 0%, rgba(61,63,61,0.68) 55%, rgba(26,27,26,0.84) 100%)',
      },
      keyword: {
        bg: '#3D3F3D', fg: MR_COLORS.white,
        wordColor: MR_COLORS.white,
        wordTextShadow: `0 6px 22px ${MR_COLORS.greenAccent}33`,
        iconColor: MR_COLORS.greenAccent,
        iconFilter: `drop-shadow(0 0 32px ${MR_COLORS.greenAccent}aa)`,
        accent: MR_COLORS.greenAccent,
        textureMode: 'screen',
        textureFilter: 'contrast(1.08) brightness(0.95)',
      },
      quote: {
        bg: '#3D3F3D', fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenAccent,
        highlightColor: MR_COLORS.greenAccent,
        bgImage: 'og-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.42) 0%, rgba(61,63,61,0.60) 55%, rgba(26,27,26,0.78) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 16%, rgba(255,255,255,0) 32%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.20) 24%, rgba(0,0,0,0) 46%)',
        vignette: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.46) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        iconFilter: `drop-shadow(0 2px 12px ${MR_COLORS.greenAccent}55)`,
      },
      'feature-list': {
        bg: '#5C605D', fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.22,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.50) contrast(0.95)',
        cardBg: '#4A4D4A',
      },
      scenario: {
        bg: '#5C605D', fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenAccent,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
        bgImage: 'conheca-produto-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(92,96,93,0.48) 0%, rgba(61,63,61,0.66) 56%, rgba(26,27,26,0.82) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 36%)',
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0) 44%)',
        vignette: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.40) 100%)',
        kickerTextShadow: `0 1px 8px ${MR_COLORS.greenAccent}44`,
        textShadow: '0 2px 14px rgba(0,0,0,0.55)',
      },
      'app-card': {
        bg: '#5C605D', fg: MR_COLORS.white,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.greenAccent,
        captionColor: MR_COLORS.white,
        captionShadow: '0 2px 10px rgba(0,0,0,0.55)',
        topographic: {
          paperOpacity: 0.30, lineOpacity: 0.18,
          tint: 'linear-gradient(145deg, rgba(92,96,93,0.74), rgba(26,27,26,0.82))',
          glow: `radial-gradient(circle at 72% 16%, ${MR_COLORS.greenAccent}33, transparent 34%)`,
          lineBlend: 'screen', paperBlend: 'soft-light',
          filter: 'grayscale(1) contrast(1.08) brightness(0.95)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'og-bg.webp',
        bgTint: 'rgba(61,63,61,0.62)',
      },
    },
  },

  // ── carbono: slate quase preto (slateAbyss) + accent verde escuro
  // (greenForest, mais sóbrio que o greenBright do editorial). Mood premium
  // sombrio, alto contraste, autoridade. Distinto do editorial pelo accent
  // mais subdued — fica mais "consultoria sênior" que "agro tech bold".
  carbono: {
    label: 'Carbono',
    description: 'Slate quase preto · verde escuro sóbrio · mood premium',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenForest, logoColor: MR_COLORS.white,
        bgImage: 'conheca-hero-bg.webp',
        bgTexture: 'motion-reel/texture-pool/topographic-curves.webp',
        bgTextureOpacity: 0.08,
        bgTextureBlend: 'screen',
        bgTextureFilter: 'invert(1) contrast(1.1)',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.50) 0%, rgba(26,27,26,0.68) 55%, rgba(10,11,10,0.86) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.65)',
        topSheen: `linear-gradient(180deg, rgba(42,123,90,0.10) 0%, rgba(42,123,90,0.03) 14%, rgba(42,123,90,0) 28%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(20,63,44,0.16) 22%, rgba(0,0,0,0) 42%)',
        vignette: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,0.55) 100%)',
      },
      chapter: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        subtitleColor: MR_COLORS.white,
        accent: MR_COLORS.greenForest, iconColor: MR_COLORS.greenForest,
        iconShadow: '0 6px 16px rgba(0,0,0,0.65)',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.52) 0%, rgba(26,27,26,0.72) 55%, rgba(10,11,10,0.88) 100%)',
        textShadow: '0 4px 28px rgba(0,0,0,0.7)',
        subtitleShadow: '0 2px 16px rgba(0,0,0,0.6)',
      },
      'lower-third': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        bgImage: 'sobre-equipe.webp',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.62) 0%, rgba(20,63,44,0.72) 55%, rgba(10,11,10,0.92) 100%)',
        cardBg: '#262726',
        titleColor: MR_COLORS.white,
        subtitleColor: '#B9BCB9',
        cardShadow: '0 26px 52px rgba(0,0,0,0.65)',
      },
      'end-card': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        logoColor: MR_COLORS.white,
        cardBg: '#262726',
        handleColor: MR_COLORS.greenForest,
        buttonBg: MR_COLORS.greenForest, buttonFg: MR_COLORS.white,
        followingBg: '#262726', followingFg: MR_COLORS.white,
        followingBorder: MR_COLORS.greenForest,
        cardShadow: '0 28px 56px rgba(0,0,0,0.70)',
      },
      headline: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenForest,
        textShadow: '0 3px 18px rgba(0,0,0,0.65)',
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.54) 0%, rgba(26,27,26,0.74) 55%, rgba(10,11,10,0.90) 100%)',
      },
      keyword: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        wordColor: MR_COLORS.white,
        wordTextShadow: `0 6px 22px ${MR_COLORS.greenForest}44`,
        iconColor: MR_COLORS.greenForest,
        iconFilter: `drop-shadow(0 0 32px ${MR_COLORS.greenForest}aa)`,
        accent: MR_COLORS.greenForest,
        textureMode: 'screen',
        textureFilter: 'contrast(1.10) brightness(0.92)',
      },
      quote: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenForest,
        highlightColor: MR_COLORS.greenForest,
        bgImage: 'og-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.48) 0%, rgba(26,27,26,0.68) 55%, rgba(10,11,10,0.86) 100%)',
        topSheen: `linear-gradient(180deg, rgba(42,123,90,0.12) 0%, rgba(42,123,90,0.04) 16%, rgba(42,123,90,0) 32%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.22) 24%, rgba(0,0,0,0) 46%)',
        vignette: 'radial-gradient(ellipse at center, transparent 34%, rgba(0,0,0,0.55) 100%)',
        textShadow: '0 2px 18px rgba(0,0,0,0.65)',
        iconFilter: `drop-shadow(0 2px 12px ${MR_COLORS.greenForest}55)`,
      },
      'feature-list': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenBright,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.20,
        paperTextureBlend: 'soft-light',
        paperTextureFilter: 'saturate(0.50) contrast(0.92)',
        cardBg: '#262726',
      },
      scenario: {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        kickerColor: MR_COLORS.greenForest,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
        bgImage: 'conheca-campo-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(26,27,26,0.54) 0%, rgba(26,27,26,0.72) 56%, rgba(10,11,10,0.88) 100%)',
        topSheen: `linear-gradient(180deg, rgba(42,123,90,0.12) 0%, rgba(42,123,90,0.04) 18%, rgba(42,123,90,0) 36%)`,
        bottomDepth: 'linear-gradient(0deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.20) 24%, rgba(0,0,0,0) 44%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.50) 100%)',
        kickerTextShadow: `0 1px 8px ${MR_COLORS.greenForest}55`,
        textShadow: '0 2px 14px rgba(0,0,0,0.65)',
      },
      'app-card': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        kickerColor: MR_COLORS.greenForest,
        captionColor: MR_COLORS.white,
        captionShadow: '0 2px 10px rgba(0,0,0,0.65)',
        topographic: {
          paperOpacity: 0.30, lineOpacity: 0.20,
          tint: 'linear-gradient(145deg, rgba(26,27,26,0.78), rgba(10,11,10,0.86))',
          glow: `radial-gradient(circle at 72% 16%, ${MR_COLORS.greenForest}33, transparent 34%)`,
          lineBlend: 'screen', paperBlend: 'soft-light',
          filter: 'grayscale(1) contrast(1.12) brightness(0.90)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'og-bg.webp',
        bgTint: 'rgba(26,27,26,0.70)',
      },
    },
  },

  // ── flatClaro: fundo branco puro, texto preto Cropware, accent verde nos
  // detalhes/textos secundários. SEM textura, overlay ou imagem de fundo.
  // O flag `flat: true` faz os scene components pularem todas as camadas
  // decorativas (bg image, glass, sheen, vignette, texture overlay).
  flatClaro: {
    label: 'Flat Claro',
    description: 'Branco puro · texto preto · verde Cropware nos detalhes',
    flat: true,
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenAccent, logoColor: MR_COLORS.slateAbyss,
      },
      chapter: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        subtitleColor: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenAccent, iconColor: MR_COLORS.greenAccent,
      },
      'lower-third': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
      },
      'end-card': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        logoColor: MR_COLORS.slateAbyss,
        cardBg: MR_COLORS.white,
        handleColor: MR_COLORS.greenAccent,
        buttonBg: MR_COLORS.slateAbyss, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.white, followingFg: MR_COLORS.slateAbyss,
        followingBorder: MR_COLORS.greenAccent,
      },
      headline: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        kickerColor: MR_COLORS.greenAccent,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenAccent,
      },
      keyword: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        wordColor: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenAccent,
        accent: MR_COLORS.greenAccent,
      },
      quote: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenAccent,
        highlightColor: MR_COLORS.greenAccent,
      },
      'feature-list': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenAccent,
      },
      scenario: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenAccent,
        kickerColor: MR_COLORS.greenAccent,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
      },
      'app-card': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenAccent, accentDeep: MR_COLORS.greenAccent,
        kickerColor: MR_COLORS.greenAccent,
        captionColor: MR_COLORS.slateAbyss,
      },
      'whatsapp-chat': {
        bgTint: 'transparent',
      },
    },
  },

  // ── flatEscuro: fundo verde quase preto, texto branco, accent verde claro
  // nos detalhes. SEM textura, overlay ou imagem de fundo. Espelho escuro
  // do flatClaro.
  flatEscuro: {
    label: 'Flat Escuro',
    description: 'Verde quase preto · texto branco · verde claro nos detalhes',
    flat: true,
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, logoColor: MR_COLORS.white,
      },
      chapter: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        subtitleColor: MR_COLORS.white,
        accent: MR_COLORS.greenBright, iconColor: MR_COLORS.greenBright,
      },
      'lower-third': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
      },
      'end-card': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        logoColor: MR_COLORS.white,
        cardBg: MR_COLORS.greenAbyss,
        handleColor: MR_COLORS.greenBright,
        buttonBg: MR_COLORS.greenBright, buttonFg: MR_COLORS.greenAbyss,
        followingBg: MR_COLORS.greenAbyss, followingFg: MR_COLORS.white,
        followingBorder: MR_COLORS.greenBright,
      },
      headline: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenBright,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenBright,
      },
      keyword: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        wordColor: MR_COLORS.white,
        iconColor: MR_COLORS.greenBright,
        accent: MR_COLORS.greenBright,
      },
      quote: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        iconColor: MR_COLORS.greenBright,
        highlightColor: MR_COLORS.greenBright,
      },
      'feature-list': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenBright,
      },
      scenario: {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenBright,
        kickerColor: MR_COLORS.greenBright,
        kickerFontSize: 42, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.08, kickerLetterSpacingTo: 0.16,
      },
      'app-card': {
        bg: MR_COLORS.greenAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenBright,
        kickerColor: MR_COLORS.greenBright,
        captionColor: MR_COLORS.white,
      },
      'whatsapp-chat': {
        bgTint: 'transparent',
      },
    },
  },
};

export const MR_THEME_NAMES = Object.keys(MR_THEMES);
export const MR_DEFAULT_THEME = 'editorial';

// Resolve o tema efetivo de uma cena.
// scene.theme override → storyboard.theme → 'editorial'.
// Slide-type sem entrada no tema → cai pra headline (fallback razoável).
export function resolveTheme(storyboard, scene) {
  const name = (scene && scene.theme) || (storyboard && storyboard.theme) || MR_DEFAULT_THEME;
  const themeDef = MR_THEMES[name] || MR_THEMES[MR_DEFAULT_THEME];
  const perSlide = themeDef.perSlide || {};
  const sliceData = perSlide[scene && scene.type] || perSlide.headline || MR_THEMES[MR_DEFAULT_THEME].perSlide.headline;
  // Propaga o flag `flat` do tema raiz pra cada slice — scene components leem
  // `T.flat` pra pular camadas decorativas (imagem, glass, textura).
  return themeDef.flat ? { ...sliceData, flat: true } : sliceData;
}
