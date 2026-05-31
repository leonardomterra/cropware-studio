// Carregamento das 3 famílias via @remotion/google-fonts. Funciona em
// AMBOS os contextos (Player no browser + CLI render no Node) — é por
// isso que não dependemos do <link> do index.html aqui.
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';
import { loadFont as loadAlumniSans } from '@remotion/google-fonts/AlumniSans';

let _loaded = false;
export function loadMotionReelFonts() {
  if (_loaded) return;
  loadInterTight('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });
  loadSpaceMono('normal', { weights: ['400', '700'], subsets: ['latin'] });
  // R28f: Alumni Sans no token `caps` — display condensada (substituiu Unica
  // One). Régua de pesos ampla pra dar flexibilidade nas palavras gigantes,
  // kickers e taglines. Histórico: Alumni Sans (R27) → ... → Unica One (R28e)
  // → Alumni Sans (R28f).
  loadAlumniSans('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });
  _loaded = true;
}
