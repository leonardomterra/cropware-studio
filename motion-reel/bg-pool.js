// Registry do pool de backgrounds (auto-gerado pelo script convert-bg-pool.mjs).
// Pra adicionar mais: jogue imagens novas em motion-reel/textures/ e rode
//   `node scripts/convert-bg-pool.mjs`
// Depois atualize o número em POOL_SIZE abaixo (ou rebuild este array).
//
// Caminhos relativos a `public/` — usar com staticFile() do Remotion.

export const BG_POOL_SIZE = 39;

export const BG_POOL = Array.from({ length: BG_POOL_SIZE }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return `motion-reel/bg-pool/bg-pool-${n}.webp`;
});

// Imagens "âncora" do site Cropware (mantidas no pool junto com as novas
// pra preservar variedade da identidade original).
export const BG_ANCHORS = [
  'conheca-hero-bg.webp',
  'conheca-campo-bg.webp',
  'conheca-produto-bg.webp',
  'conheca-solucao-bg.webp',
  'conheca-gd-bg.webp',
  'conheca-whatsapp-bg.webp',
];

// Pool completo (âncoras + bg-pool sequencial).
export const BG_POOL_FULL = [...BG_ANCHORS, ...BG_POOL];

// Escolhe uma imagem aleatória do pool completo. Aceita opcional `exclude`
// (string com path) pra evitar repetir a atual quando o user clica "trocar".
export function pickRandomBg(exclude) {
  const candidates = exclude
    ? BG_POOL_FULL.filter(p => p !== exclude)
    : BG_POOL_FULL;
  if (candidates.length === 0) return BG_POOL_FULL[0];
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

// Escolhe N imagens distintas do pool (sem repetição). Útil pra gerar um reel
// inteiro com bgs únicos por cena. Se N > pool size, repete depois de esgotar.
export function pickRandomBgs(n, exclude = []) {
  const excludeSet = new Set(exclude);
  const candidates = BG_POOL_FULL.filter(p => !excludeSet.has(p));
  const out = [];
  const used = new Set();
  while (out.length < n) {
    const pool = candidates.filter(p => !used.has(p));
    if (pool.length === 0) {
      // Esgotou — reseta o "used" pra permitir repetir
      used.clear();
      continue;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    out.push(pick);
    used.add(pick);
  }
  return out;
}
