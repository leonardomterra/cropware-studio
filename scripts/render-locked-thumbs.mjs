// Renderiza as 6 cenas locked do reel padrão como PNGs estáticos pra usar
// no grid de thumbnails do studio. As cenas locked são idênticas em todo
// reel (default e gerado), então renderiza só uma vez. Cenas custom continuam
// usando <Thumbnail> dinâmico (variam de tema pra tema).
//
// Por que isso existe: o <Thumbnail> do @remotion/player tem um quirk de
// renderização (algumas cenas com composição complexa mostram artifacts
// fantasma — ex: bolinha verde na cap11). PNGs via CLI usam a mesma pipeline
// do render final (npm run reel:render), que renderiza limpo.
//
// Como rodar: `npm run reel:thumbs`. Saída: public/thumbs/{XX-id}.png

import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'thumbs');

// Replica do cálculo em mount.jsx — pega o frame "seguro" (~40% da cena,
// com margem das transições in/out) pra cada cena locked do default.
// Os números abaixo derivam de default-storyboard.js com fps=30.
//
// Scene durations (em frames @ 30fps):
//   01 intro            0-6s    = 180f
//   02 stat-1           5-10s   = 150f
//   03 kw-fast         10-14s   = 120f
//   04 chapter-1       14-18s   = 120f
//   05 features-1      18-24s   = 180f
//   06 data-1          24-30s   = 180f
//   07 chapter-2       30-34s   = 120f
//   08 app-1           34-40s   = 180f
//   09 kw-direct       40-44s   = 120f
//   10 quote           44-50s   = 180f
//   11 lower-third-cta 50-55s   = 150f
//   12 end             55-60s   = 150f
// Transitions (transitionIn dur em frames):
//   [1] 17, [2] 11, [3] 30, [4] 15, [5] 18, [6] 18,
//   [7] 15, [8] 14, [9] 15, [10] 14, [11] 18 (fade 0.6)

const FPS = 30;
const DURS = [180, 150, 120, 120, 180, 180, 120, 180, 120, 180, 150, 150];
const TRANS = [0, 17, 11, 30, 15, 18, 18, 15, 14, 15, 14, 18];

// LOCKED_SCENES: array de { index, id, label } pras 6 cenas locked do default.
const LOCKED_SCENES = [
  { index: 0,  id: 'intro',           label: '01-intro' },
  { index: 3,  id: 'chapter-1',       label: '04-chapter-1' },
  { index: 6,  id: 'chapter-2',       label: '07-chapter-2' },
  { index: 9,  id: 'quote',           label: '10-quote' },
  { index: 10, id: 'lower-third-cta', label: '11-lower-third' },
  { index: 11, id: 'end',             label: '12-end-card' },
];

// Calcula cursor (frame absoluto do início da cena na composição) + safeMid.
function calcSafeFrame(sceneIndex) {
  let cursor = 0;
  for (let j = 0; j <= sceneIndex; j++) {
    if (j > 0) cursor -= TRANS[j];
    if (j < sceneIndex) cursor += DURS[j];
  }
  const sceneDur = DURS[sceneIndex];
  const transIn = TRANS[sceneIndex];
  const transOut = sceneIndex + 1 < TRANS.length ? TRANS[sceneIndex + 1] : 0;
  const safeStart = transIn + 6;
  const safeEnd = Math.max(safeStart + 1, sceneDur - transOut - 6);
  // 90% pra capturar a cena com TODAS as animações já assentadas (alinhado
  // com mount.jsx).
  const safeMid = Math.max(safeStart, Math.min(safeEnd, Math.round(sceneDur * 0.9)));
  return cursor + safeMid;
}

// Executa `npx remotion still` pra uma cena específica.
function renderStill({ frame, outputPath }) {
  return new Promise((resolve, reject) => {
    const args = [
      'remotion', 'still',
      'motion-reel/index.js',
      'MotionReel',
      outputPath,
      `--frame=${frame}`,
      '--gl=angle',
    ];
    console.log(`  → npx ${args.join(' ')}`);
    const proc = spawn('npx', args, {
      cwd: ROOT,
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`remotion still exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Renderizando ${LOCKED_SCENES.length} thumbs locked em ${OUT_DIR}`);
  for (const scene of LOCKED_SCENES) {
    const frame = calcSafeFrame(scene.index);
    const outputPath = path.join(OUT_DIR, `${scene.label}.png`);
    console.log(`\n[${scene.label}] cena #${scene.index + 1} (id=${scene.id}), frame ${frame}`);
    try {
      await renderStill({ frame, outputPath });
      console.log(`  ✓ salvo em ${outputPath}`);
    } catch (err) {
      console.error(`  ✗ falha: ${err.message}`);
      process.exit(1);
    }
  }
  console.log('\nTodos os thumbs locked renderizados com sucesso.');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
