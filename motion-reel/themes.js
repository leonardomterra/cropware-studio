// Catálogo de temas visuais do Motion Reel (R26 — simplificado).
//
// Após o refactor R26, o sistema tem 4 modos visuais:
//   • claro       — bg claro (cream/white), texto e ícones em tons escuros (greenForest/black)
//   • escuro      — bg escuro (slate/greenAbyss), texto e ícones em white + greenBright
//   • flatClaro   — flat (sem imagem/overlay/textura), bg branco, texto preto
//   • flatEscuro  — flat (sem imagem/overlay/textura), bg verde quase preto, texto branco
//
// A COR DO OVERLAY (glassTint) saiu do tema e virou propriedade por cena:
// `scene.overlayColor` (hex). resolveTheme injeta um gradient depth a partir
// dessa cor se setado. O tema só fornece um glassTint default caso o usuário
// não escolha cor.
//
// Reels antigos com temas `editorial/vibrante/floresta/granito/mineral/carbono`
// são mapeados via MR_LEGACY_THEME_MAP no momento do load.

import { MR_COLORS } from './theme.js';

// Glass tints default — usados quando o usuário não escolheu overlayColor.
const GLASS = {
  slate:  'linear-gradient(180deg, rgba(26,27,26,0.45) 0%, rgba(26,27,26,0.62) 55%, rgba(10,10,10,0.80) 100%)',
  cream:  'linear-gradient(180deg, rgba(245,241,234,0.55) 0%, rgba(245,241,234,0.72) 55%, rgba(230,222,205,0.88) 100%)',
};

// Converte hex (#aabbcc) em rgb (r,g,b). Aceita "#aabbcc" ou "aabbcc".
function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '').trim();
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

// Constrói um gradient de profundidade a partir de uma cor hex.
// Top mais translúcido, bottom mais opaco — preserva o efeito "glass com peso".
export function buildOverlayGradient(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { r, g, b } = rgb;
  return `linear-gradient(180deg, rgba(${r},${g},${b},0.45) 0%, rgba(${r},${g},${b},0.62) 55%, rgba(${r},${g},${b},0.80) 100%)`;
}

export const MR_THEMES = {
  // ── claro ─────────────────────────────────────────────────────────
  // Bg claro (cream/white). Texto e ícones em tons escuros (slateAbyss
  // pra texto, greenForest/greenDeep pra accents). Glass tint default
  // claro (sobrescrito por scene.overlayColor).
  claro: {
    label: 'Texto Escuro',
    description: 'Fundo claro · texto e ícones escuros',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, logoColor: MR_COLORS.slateAbyss,
        bgImage: 'conheca-hero-bg.webp',
        bgTexture: 'motion-reel/texture-pool/texture-pool-001.webp',
        bgTextureOpacity: 0.08,
        bgTextureBlend: 'multiply',
        glassTint: GLASS.cream,
        textShadow: '0 1px 4px rgba(255,255,255,0.4)',
      },
      chapter: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        subtitleColor: MR_COLORS.slateDark,
        accent: MR_COLORS.greenForest, iconColor: MR_COLORS.greenForest,
        glassTint: GLASS.cream,
        textShadow: 'none',
      },
      'lower-third': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        bgImage: 'sobre-equipe.webp',
        glassTint: GLASS.cream,
        cardBg: MR_COLORS.white,
        titleColor: MR_COLORS.slateAbyss,
        subtitleColor: MR_COLORS.slateDark,
      },
      'end-card': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        logoColor: MR_COLORS.greenForest,
        cardBg: MR_COLORS.white,
        buttonBg: MR_COLORS.greenForest, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.fog, followingFg: MR_COLORS.slateAbyss,
      },
      headline: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        kickerColor: MR_COLORS.greenForest,
        bgImage: 'conheca-solucao-bg.webp', glassTint: GLASS.cream,
        textShadow: 'none',
      },
      keyword: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        wordColor: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenForest,
        accent: MR_COLORS.greenForest, textureMode: 'multiply',
      },
      quote: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenForest,
        highlightColor: MR_COLORS.greenForest,
        bgImage: 'og-bg.webp', glassTint: GLASS.cream,
        textShadow: 'none',
      },
      'feature-list': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        cardBg: MR_COLORS.white,
        kickerColor: MR_COLORS.greenForest,
      },
      scenario: {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        kickerColor: MR_COLORS.greenForest,
        bgImage: 'conheca-campo-bg.webp', glassTint: GLASS.cream,
        textShadow: 'none',
      },
      'app-card': {
        bg: MR_COLORS.cream, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
        kickerColor: MR_COLORS.greenForest,
        captionColor: MR_COLORS.slateAbyss,
        captionShadow: 'none',
      },
      'whatsapp-chat': {
        bgImage: 'wpp-bg-pattern.png',
        bgTint: 'rgba(245,241,234,0.78)',
      },
    },
  },

  // ── escuro ─────────────────────────────────────────────────────────
  // Bg escuro (slateAbyss/greenAbyss). Texto em branco, accent em
  // greenBright (verde claro). Padrão "premium escuro".
  escuro: {
    label: 'Texto Claro',
    description: 'Fundo escuro · texto branco · verde claro',
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
        accent: MR_COLORS.greenBright, logoColor: MR_COLORS.white,
        bgImage: 'conheca-hero-bg.webp',
        bgTexture: 'motion-reel/texture-pool/texture-pool-001.webp',
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
        bg: MR_COLORS.slateAbyss, fg: MR_COLORS.white,
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
      },
      'whatsapp-chat': {
        bgImage: 'wpp-bg-pattern.png',
        bgTint: 'rgba(26,27,26,0.78)',
      },
    },
  },

  // ── flatClaro ─────────────────────────────────────────────────────
  // Sem imagens, overlays ou texturas. Fundo branco, texto preto,
  // accent greenForest. UI-style minimalista.
  flatClaro: {
    label: 'Flat Claro',
    description: 'Flat · branco · texto preto',
    flat: true,
    perSlide: {
      'brand-intro': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, logoColor: MR_COLORS.slateAbyss,
      },
      chapter: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        subtitleColor: MR_COLORS.slateDark,
        accent: MR_COLORS.greenForest, iconColor: MR_COLORS.greenForest,
      },
      'lower-third': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
      },
      'end-card': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        logoColor: MR_COLORS.greenForest,
        cardBg: MR_COLORS.white,
        handleColor: MR_COLORS.slateAbyss,
        buttonBg: MR_COLORS.greenForest, buttonFg: MR_COLORS.white,
        followingBg: MR_COLORS.fog, followingFg: MR_COLORS.slateAbyss,
      },
      headline: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        kickerColor: MR_COLORS.greenForest,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenAbyss,
      },
      keyword: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        wordColor: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenForest,
        accent: MR_COLORS.greenForest,
      },
      quote: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        iconColor: MR_COLORS.greenForest,
        highlightColor: MR_COLORS.greenForest,
      },
      'feature-list': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenForest,
      },
      scenario: {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenForest,
        kickerColor: MR_COLORS.greenForest,
        kickerFontSize: 48, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.06, kickerLetterSpacingTo: 0.12,
      },
      'app-card': {
        bg: MR_COLORS.white, fg: MR_COLORS.slateAbyss,
        accent: MR_COLORS.greenForest, accentDeep: MR_COLORS.greenForest,
        kickerColor: MR_COLORS.greenForest,
        captionColor: MR_COLORS.slateAbyss,
      },
      'whatsapp-chat': {
        bgTint: 'transparent',
      },
    },
  },

  // ── flatEscuro ────────────────────────────────────────────────────
  // Sem imagens, overlays ou texturas. Fundo verde quase preto, texto
  // branco, accent greenBright. UI-style minimalista escuro.
  flatEscuro: {
    label: 'Flat Escuro',
    description: 'Flat · verde quase preto · texto branco',
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
        kickerFontSize: 48, kickerMaxWidth: 820,
        kickerLetterSpacingFrom: 0.06, kickerLetterSpacingTo: 0.12,
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
export const MR_DEFAULT_THEME = 'escuro';

// R26 — Mapper de retrocompat. Temas antigos (8) caem nos 4 novos:
// vibrante/floresta tinham fundo verde escuro com texto branco → escuro
// editorial/granito/mineral/carbono também eram dark → escuro
// flatClaro/flatEscuro permanecem.
export const MR_LEGACY_THEME_MAP = {
  editorial: 'escuro',
  vibrante:  'escuro',
  floresta:  'escuro',
  granito:   'escuro',
  mineral:   'escuro',
  carbono:   'escuro',
  flatClaro: 'flatClaro',
  flatEscuro: 'flatEscuro',
};

// Normaliza qualquer nome de tema (incluindo legacy) pra um nome válido atual.
export function normalizeThemeName(name) {
  if (!name) return MR_DEFAULT_THEME;
  if (MR_THEMES[name]) return name;
  if (MR_LEGACY_THEME_MAP[name]) return MR_LEGACY_THEME_MAP[name];
  return MR_DEFAULT_THEME;
}

// Resolve o tema efetivo de uma cena.
// scene.theme override → storyboard.theme → 'escuro' (default).
// Legacy themes (editorial, vibrante, etc) mapeados via normalizeThemeName.
// scene.overlayColor (hex) injeta um gradient de profundidade sobre o
// glassTint default do tema — permite ao usuário escolher cor do overlay
// por cena sem precisar de tema próprio.
export function resolveTheme(storyboard, scene) {
  const rawName = (scene && scene.theme) || (storyboard && storyboard.theme) || MR_DEFAULT_THEME;
  const name = normalizeThemeName(rawName);
  const themeDef = MR_THEMES[name] || MR_THEMES[MR_DEFAULT_THEME];
  const perSlide = themeDef.perSlide || {};
  const sliceData = perSlide[scene && scene.type] || perSlide.headline || MR_THEMES[MR_DEFAULT_THEME].perSlide.headline;
  // Propaga o flag `flat` do tema raiz pra cada slice.
  let result = themeDef.flat ? { ...sliceData, flat: true } : { ...sliceData };
  // Injeta overlay color como gradient se setado no scene.
  if (scene && scene.overlayColor && !themeDef.flat) {
    const grad = buildOverlayGradient(scene.overlayColor);
    if (grad) result.glassTint = grad;
  }
  return result;
}
