// Converte fotos brutas em motion-reel/textures/ pro pool de backgrounds do
// motion reel. Resize pra max 1920x1920 (vertical 9:16 ou landscape mantém ratio),
// converte pra webp quality 82, salva sequencialmente em public/motion-reel/bg-pool/.
//
// Uso:  node scripts/convert-bg-pool.mjs
//
// Comportamento: pega tudo de motion-reel/textures/ que seja jpg/jpeg/png,
// processa, e MOVE os originais pra motion-reel/textures/_processed/ pra evitar
// reprocessar acidentalmente. Output: imprime lista final e contagem.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'motion-reel', 'textures');
const PROCESSED_DIR = path.join(SRC_DIR, '_processed');
const OUT_DIR = path.join(ROOT, 'public', 'motion-reel', 'bg-pool');

const MAX_DIM = 1920;
const WEBP_QUALITY = 82;
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png']);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

async function getNextIndex() {
  // Procura o maior bg-pool-NNN.webp existente pra continuar a numeração.
  try {
    const files = await fs.readdir(OUT_DIR);
    let max = 0;
    for (const f of files) {
      const m = f.match(/^bg-pool-(\d{3})\.webp$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return max + 1;
  } catch {
    return 1;
  }
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(PROCESSED_DIR);

  const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
  const inputs = entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(n => VALID_EXT.has(path.extname(n).toLowerCase()))
    .sort();

  if (inputs.length === 0) {
    console.log('Nenhuma imagem nova em motion-reel/textures/. Nada a fazer.');
    return;
  }

  let idx = await getNextIndex();
  const results = [];

  for (const name of inputs) {
    const srcPath = path.join(SRC_DIR, name);
    const outName = `bg-pool-${pad3(idx)}.webp`;
    const outPath = path.join(OUT_DIR, outName);
    const processedPath = path.join(PROCESSED_DIR, name);

    try {
      await sharp(srcPath)
        .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);

      await fs.rename(srcPath, processedPath);
      const stat = await fs.stat(outPath);
      results.push({ name, outName, kb: Math.round(stat.size / 1024) });
      console.log(`  ${name}  →  ${outName}  (${Math.round(stat.size / 1024)} KB)`);
      idx += 1;
    } catch (err) {
      console.error(`✗ Falhou em ${name}:`, err.message);
    }
  }

  console.log(`\n✓ ${results.length} imagens convertidas pra public/motion-reel/bg-pool/`);
  console.log(`  Originais movidos pra motion-reel/textures/_processed/`);

  // Lista total no pool depois do processamento
  const allOut = (await fs.readdir(OUT_DIR))
    .filter(n => /^bg-pool-\d{3}\.webp$/.test(n))
    .sort();
  console.log(`  Total no pool: ${allOut.length} imagens`);

  // Auto-atualiza BG_POOL_SIZE em motion-reel/bg-pool.js e index.html.
  await updatePoolSize(allOut.length);
}

async function updatePoolSize(size) {
  const targets = [
    {
      path: path.join(ROOT, 'motion-reel', 'bg-pool.js'),
      pattern: /export const BG_POOL_SIZE = \d+;/,
      replacement: `export const BG_POOL_SIZE = ${size};`,
    },
    {
      path: path.join(ROOT, 'index.html'),
      pattern: /const BG_POOL_SIZE = \d+;/,
      replacement: `const BG_POOL_SIZE = ${size};`,
    },
  ];
  for (const t of targets) {
    try {
      const content = await fs.readFile(t.path, 'utf8');
      if (t.pattern.test(content)) {
        await fs.writeFile(t.path, content.replace(t.pattern, t.replacement));
        console.log(`  ✓ Atualizado BG_POOL_SIZE=${size} em ${path.basename(t.path)}`);
      }
    } catch (err) {
      console.warn(`  ! Não consegui atualizar ${t.path}: ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
