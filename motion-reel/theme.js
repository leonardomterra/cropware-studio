// Tokens visuais do Motion Reel — single source of truth para os componentes
// React. Paleta v2 (R7): 14 cores curadas inspiradas no CROPWARE_PALETTE do
// app principal, com papéis semânticos claros.

export const MR_COLORS = {
  // ── Verdes (5 derivações ao redor do verde Cropware oficial) ──
  greenBright:  '#82CCA5', // verde claro vibrante (highlight)
  greenAccent:  '#6AC58F', // verde Cropware oficial (primary)
  greenDeep:    '#42AA7B', // verde médio (mid green)
  greenForest:  '#2A7B5A', // verde escuro (forest)
  greenAbyss:   '#143F2C', // verde quase preto (deep bg)

  // ── Slates (4 derivações de preto-cinza com pegada Cropware) ──
  slateLight:   '#80847F',
  slateMid:     '#5C605D',
  slateDark:    '#3D3F3D',
  slateAbyss:   '#1A1B1A', // preto quase total — bg escuro padrão

  // ── Neutros ──
  white:        '#FFFFFF',
  cream:        '#F5F1EA', // creme caloroso (preservado da v1)
  fog:          '#EEEFEE', // off-white

  // ── Accents complementares ──
  amber:        '#F4B860', // dourado pra flares / alertas / destaque quente
  azure:        '#0B84F3', // azul brilhante (data viz, sky tone)
};

// Aliases legacy — mantém compat com storyboards/strings antigas
// (ex: 'var(--mr-green)' → greenAccent, 'var(--mr-dark)' → slateAbyss).
const MR_COLOR_ALIASES = {
  green:   'greenAccent',
  dark:    'slateAbyss',
  black:   'slateAbyss',
  // 'white' e 'cream' já existem com os mesmos nomes
};

// Aceita "var(--mr-greenAccent)", "var(--mr-green)" (legacy), "#6AC58F", "greenAccent".
// Fallback: cream.
export function resolveColor(s) {
  if (!s) return MR_COLORS.cream;
  const v = String(s).trim();
  const m = v.match(/var\(--mr-([\w-]+)\)/);
  if (m) {
    const key = m[1];
    if (MR_COLORS[key]) return MR_COLORS[key];
    if (MR_COLOR_ALIASES[key]) return MR_COLORS[MR_COLOR_ALIASES[key]];
  }
  if (MR_COLORS[v]) return MR_COLORS[v];
  if (MR_COLOR_ALIASES[v]) return MR_COLORS[MR_COLOR_ALIASES[v]];
  return v; // já é hex/rgb/etc literal
}

export const MR_FONTS = {
  display: '"Inter Tight", system-ui, sans-serif',
  grotesk: '"Familjen Grotesk", "Inter Tight", system-ui, sans-serif',
  mono:    '"Space Mono", ui-monospace, monospace',
  // R27: condensed editorial sans pra kickers uppercase, taglines e palavras
  // gigantes (Keyword, Quote verbs, BrandIntro). Space Mono ainda é usada em
  // labels/data dentro dos mockups do AppCard (representam UI técnica real).
  alumni:  '"Alumni Sans", "Inter Tight", system-ui, sans-serif',
};

// Dimensões fixas do palco — Reels Instagram 9:16.
export const MR_STAGE = {
  width: 1080,
  height: 1920,
  fps: 30,
  gutter: 80,
};
