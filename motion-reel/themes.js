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
        bg: MR_COLORS.fog, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenBright, accentDeep: MR_COLORS.greenForest,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.5,
        paperTextureBlend: 'multiply',
        paperTextureFilter: 'saturate(0.58) contrast(1.04)',
        cardBg: MR_COLORS.white,
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
        bg: MR_COLORS.fog, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenDeep, accentDeep: MR_COLORS.greenForest,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.46,
        paperTextureBlend: 'multiply',
        paperTextureFilter: 'saturate(0.58) contrast(1.04)',
        cardBg: MR_COLORS.greenForest, cardFg: MR_COLORS.white,
        cardIconBg: 'rgba(255,255,255,0.18)',
        cardIconColor: MR_COLORS.white,
        cardShadow: '0 12px 34px rgba(20,63,44,0.18), 0 2px 4px rgba(20,63,44,0.10)',
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

  // ── claro: cream/white/fog. Mood limpo, otimista, onboarding.
  // Pra reels institucionais leves, lançamentos diurnos, comunicação clara.
  claro: {
    label: 'Claro',
    description: 'Cream / branco · verde accent · mood limpo',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.fog, fg: MR_COLORS.greenAbyss,
        accent: MR_COLORS.greenDeep, logoColor: MR_COLORS.greenAbyss,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: GLASS.white,
        textShadow: '0 2px 14px rgba(255,255,255,0.72)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.20) 18%, rgba(255,255,255,0) 36%)',
        bottomDepth: 'linear-gradient(0deg, rgba(245,241,234,0.38) 0%, rgba(245,241,234,0.14) 24%, rgba(245,241,234,0) 44%)',
        vignette: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,63,44,0.16) 100%)',
      },
      chapter: {
        bg: MR_COLORS.cream, fg: MR_COLORS.greenAbyss,
        subtitleColor: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenDeep, iconColor: MR_COLORS.greenDeep,
        glassTint: GLASS.cream,
        textShadow: '0 3px 14px rgba(255,255,255,0.72)',
        subtitleShadow: '0 2px 10px rgba(255,255,255,0.68)',
      },
      'lower-third': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: GLASS.cream,
        cardBg: MR_COLORS.white,
        titleColor: MR_COLORS.greenAbyss,
        subtitleColor: MR_COLORS.slateMid,
        cardShadow: '0 26px 52px rgba(20,63,44,0.22)',
      },
      'end-card': {
        bg: MR_COLORS.fog, fg: MR_COLORS.greenAbyss,
        logoColor: MR_COLORS.greenDeep,
        cardBg: MR_COLORS.white,
        handleColor: MR_COLORS.greenAbyss,
        buttonBg: MR_COLORS.greenDeep, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.cream, followingFg: MR_COLORS.greenAbyss,
        followingBorder: MR_COLORS.greenDeep,
        cardShadow: '0 28px 56px rgba(20,63,44,0.20)',
      },
      headline: {
        bg: MR_COLORS.white, fg: MR_COLORS.greenDeep,
        kickerColor: MR_COLORS.slateAbyss,
        textShadow: '0 3px 14px rgba(20,63,44,0.24)',
        accent: MR_COLORS.slateAbyss, accentDeep: MR_COLORS.greenForest,
        bgImage: 'conheca-solucao-bg.webp', glassTint: GLASS.white,
      },
      keyword: {
        bg: MR_COLORS.fog, fg: MR_COLORS.greenForest,
        wordColor: MR_COLORS.white,
        iconColor: MR_COLORS.greenDeep,
        iconFilter: `drop-shadow(0 0 28px ${MR_COLORS.greenDeep}aa)`,
        accent: MR_COLORS.greenDeep, textureMode: 'multiply',
      },
      quote: {
        bg: MR_COLORS.cream,
        fg: MR_COLORS.greenAbyss,
        iconColor: MR_COLORS.greenDeep,
        highlightColor: MR_COLORS.greenDeep,
        bgImage: 'conheca-solucao-bg.webp',
        glassTint: 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(245,241,234,0.76) 55%, rgba(238,239,238,0.90) 100%)',
        topSheen: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 18%, rgba(255,255,255,0) 36%)',
        bottomDepth: 'linear-gradient(0deg, rgba(245,241,234,0.44) 0%, rgba(245,241,234,0.18) 26%, rgba(245,241,234,0) 46%)',
        vignette: 'radial-gradient(ellipse at center, transparent 38%, rgba(20,63,44,0.18) 100%)',
        textShadow: '0 2px 14px rgba(255,255,255,0.72)',
        iconFilter: 'drop-shadow(0 2px 8px rgba(20,63,44,0.20))',
      },
      'feature-list': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenDeep, accentDeep: MR_COLORS.greenForest,
        paperTexture: 'motion-reel/textures/crumpled-paper.jpg',
        paperTextureOpacity: 0.38,
        paperTextureBlend: 'multiply',
        paperTextureFilter: 'saturate(0.52) contrast(1.02)',
        cardBg: MR_COLORS.fog,
      },
      scenario: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenDeep, accentDeep: MR_COLORS.greenForest,
        bgImage: 'conheca-campo-bg.webp', glassTint: GLASS.cream,
      },
      'app-card': {
        bg: MR_COLORS.fog, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenDeep, accentDeep: MR_COLORS.greenForest,
        kickerColor: MR_COLORS.greenAbyss,
        captionColor: MR_COLORS.white,
        captionShadow: '0 2px 10px rgba(20,63,44,0.24)',
        topographic: {
          paperOpacity: 0.46,
          lineOpacity: 0.18,
          tint: 'linear-gradient(145deg, rgba(245,241,234,0.68), rgba(238,239,238,0.78))',
          glow: 'radial-gradient(circle at 72% 16%, rgba(106,197,143,0.22), transparent 34%)',
          lineBlend: 'multiply',
          paperBlend: 'multiply',
          filter: 'grayscale(1) contrast(1.04) brightness(1.08)',
        },
      },
      'whatsapp-chat': {
        bgImage: 'og-bg.webp',
        bgTint: 'rgba(245,241,234,0.55)',
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
  return perSlide[scene && scene.type] || perSlide.headline || MR_THEMES[MR_DEFAULT_THEME].perSlide.headline;
}
