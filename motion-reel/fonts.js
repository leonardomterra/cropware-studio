// Carregamento das 3 famílias via @remotion/google-fonts. Funciona em
// AMBOS os contextos (Player no browser + CLI render no Node) — é por
// isso que não dependemos do <link> do index.html aqui.
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';

let _loaded = false;
export function loadMotionReelFonts() {
  if (_loaded) return;
  loadInterTight('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });
  // R28g: Space Mono cobre os tokens `mono` E `caps` (uppercase display) —
  // Alumni Sans foi removida. Os usos de `caps` são todos fontWeight 400.
  loadSpaceMono('normal', { weights: ['400', '700'], subsets: ['latin'] });
  _loaded = true;
}
