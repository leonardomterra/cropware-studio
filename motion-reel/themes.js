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
