// Converte texturas B&W (linhas, dots, halftone, wavy) em motion-reel/textures/
// pro pool de texturas overlay do motion reel. Resize pra max 1920x1920,
// converte pra webp quality 85, salva sequencialmente em
// public/motion-reel/texture-pool/.
//
// Uso:  node scripts/convert-texture-pool.mjs
//   ou: npm run reel:texture-pool

import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'motion-reel', 'textures');
const PROCESSED_DIR = path.join(SRC_DIR, '_processed');
const OUT_DIR = path.join(ROOT, 'public', 'motion-reel', 'texture-pool');

const MAX_DIM = 1920;
const WEBP_QUALITY = 85;
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

async function getNextIndex() {
  try {
    const files = await fs.readdir(OUT_DIR);
    let max = 0;
    for (const f of files) {
      const m = f.match(/^texture-pool-(\d{3})\.webp$/);
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
    console.log('Nenhuma textura nova em motion-reel/textures/. Nada a fazer.');
    return;
  }

  let idx = await getNextIndex();
  const results = [];

  for (const name of inputs) {
    const srcPath = path.join(SRC_DIR, name);
    const outName = `texture-pool-${pad3(idx)}.webp`;
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

  console.log(`\n✓ ${results.length} texturas convertidas pra public/motion-reel/texture-pool/`);
  console.log(`  Originais movidos pra motion-reel/textures/_processed/`);

  const allOut = (await fs.readdir(OUT_DIR))
    .filter(n => /^texture-pool-\d{3}\.webp$/.test(n))
    .sort();
  console.log(`  Total no pool: ${allOut.length} texturas`);

  await updatePoolSize(allOut.length);
}

async function updatePoolSize(size) {
  const targets = [
    {
      path: path.join(ROOT, 'index.html'),
      pattern: /const TEXTURE_POOL_SIZE = \d+;/,
      replacement: `const TEXTURE_POOL_SIZE = ${size};`,
    },
  ];
  for (const t of targets) {
    try {
      const content = await fs.readFile(t.path, 'utf8');
      if (t.pattern.test(content)) {
        await fs.writeFile(t.path, content.replace(t.pattern, t.replacement));
        console.log(`  ✓ Atualizado TEXTURE_POOL_SIZE=${size} em ${path.basename(t.path)}`);
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
