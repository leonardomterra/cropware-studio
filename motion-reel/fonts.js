// Carregamento das 3 famílias via @remotion/google-fonts. Funciona em
// AMBOS os contextos (Player no browser + CLI render no Node) — é por
// isso que não dependemos do <link> do index.html aqui.
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadFamiljenGrotesk } from '@remotion/google-fonts/FamiljenGrotesk';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';
import { loadFont as loadUnicaOne } from '@remotion/google-fonts/UnicaOne';

let _loaded = false;
export function loadMotionReelFonts() {
  if (_loaded) return;
  loadInterTight('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });
  loadFamiljenGrotesk('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });
  loadSpaceMono('normal', { weights: ['400', '700'], subsets: ['latin'] });
  // R28e: Unica One substituiu JetBrains Mono no token `caps`. Display
  // geométrica all-caps oriented (peso único 400).
  loadUnicaOne('normal', { weights: ['400'], subsets: ['latin'] });
  _loaded = true;
}
