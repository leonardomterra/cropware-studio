export const KEYWORD_ANIMATED_ICON_FALLBACK = 'line-md:speed-loop';

export const KEYWORD_LOTTIE_ICONS = {
  'animatedicons:sustainability': 'motion-reel/icons/animatedicons-sustainability.json',
};

export const KEYWORD_ANIMATED_ICONS = new Set([
  ...Object.keys(KEYWORD_LOTTIE_ICONS),
  'line-md:speed-loop',
  'line-md:speedometer-loop',
  'line-md:confirm',
  'line-md:confirm-circle',
  'line-md:check-all',
  'line-md:arrow-up-circle',
  'line-md:lightbulb',
  'line-md:map-marker-loop',
  'line-md:map-marker-multiple-loop',
  'line-md:my-location-loop',
  'line-md:compass-loop',
  'line-md:cloud-alt-loop',
  'line-md:bell-loop',
  'line-md:bell-alert-loop',
  'line-md:alert-loop',
  'line-md:document-report',
  'line-md:phone-call-loop',
  'line-md:cog-loop',
  'line-md:loading-twotone-loop',
  'line-md:sunny-filled-loop',
  'line-md:sun-rising-filled-loop',
  'line-md:weather-cloudy-loop',
  'line-md:watch-loop',
  'line-md:download-loop',
  'line-md:upload-loop',
  'line-md:star-pulsating-loop',
  'meteocons:pollen-grass-fill',
  'meteocons:pollen-tree-fill',
  'meteocons:clear-day-fill',
  'meteocons:partly-cloudy-day-fill',
  'meteocons:raindrops-fill',
  'meteocons:thermometer-sun-fill',
  'meteocons:wind-fill',
  'meteocons:barometer-fill',
  'meteocons:humidity-fill',
]);

const STATIC_ICON_MAP = {
  'twemoji:ear-of-corn': 'animatedicons:sustainability',
  'twemoji:seedling': 'animatedicons:sustainability',
  'twemoji:sheaf-of-rice': 'animatedicons:sustainability',
  'twemoji:deciduous-tree': 'meteocons:pollen-tree-fill',
  'twemoji:sun': 'meteocons:clear-day-fill',
  'twemoji:sun-behind-cloud': 'meteocons:partly-cloudy-day-fill',
  'twemoji:cloud': 'line-md:weather-cloudy-loop',
  'twemoji:droplet': 'meteocons:raindrops-fill',
  'twemoji:satellite': 'line-md:my-location-loop',
  'twemoji:tractor': 'line-md:speedometer-loop',
  'twemoji:bar-chart': 'line-md:document-report',
  'twemoji:gear': 'line-md:cog-loop',
  'twemoji:mobile-phone': 'line-md:phone-call-loop',
  'twemoji:rocket': 'line-md:arrow-up-circle',
  'twemoji:warning': 'line-md:alert-loop',
  'twemoji:check-mark-button': 'line-md:confirm',
  'noto:ear-of-corn': 'animatedicons:sustainability',
  'noto:seedling': 'animatedicons:sustainability',
  'noto:sun': 'meteocons:clear-day-fill',
  'noto:droplet': 'meteocons:raindrops-fill',
  'noto:satellite': 'line-md:my-location-loop',
  'noto:bar-chart': 'line-md:document-report',
};

const WORD_ICON_RULES = [
  [['milho', 'safrinha', 'safra', 'colheita', 'plantio', 'semente', 'semeadura', 'soja', 'lavoura', 'campo', 'talhao', 'grao', 'produtiv', 'fertil', 'solo'], 'animatedicons:sustainability'],
  [['chuva', 'agua', 'irrig', 'umidade', 'hidric'], 'meteocons:raindrops-fill'],
  [['clima', 'previsao', 'nuvem'], 'meteocons:partly-cloudy-day-fill'],
  [['sol', 'calor', 'temperatura', 'verao'], 'meteocons:thermometer-sun-fill'],
  [['vento', 'pulveriz', 'deriva'], 'meteocons:wind-fill'],
  [['mapa', 'gps', 'local', 'satellite', 'satelite', 'ndvi', 'monitor', 'talhoes'], 'line-md:my-location-loop'],
  [['alerta', 'risco', 'praga', 'doenca', 'atencao'], 'line-md:bell-alert-loop'],
  [['rapido', 'veloz', 'agil', 'tempo', 'instant'], 'line-md:speed-loop'],
  [['preciso', 'precisao', 'exato', 'confiavel', 'seguro'], 'line-md:confirm'],
  [['inteligente', 'inteligencia', 'artificial', 'ai', 'analise', 'diagnost'], 'line-md:lightbulb'],
  [['historico', 'relatorio', 'dados', 'registro'], 'line-md:document-report'],
  [['app', 'celular', 'mobile', 'whatsapp'], 'line-md:phone-call-loop'],
  [['prosperar', 'resultado', 'ganho', 'lucro', 'evoluir'], 'line-md:star-pulsating-loop'],
];

function normalizeKeywordIconText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function resolveKeywordAnimatedIcon({ icon, word, theme } = {}) {
  const rawIcon = typeof icon === 'string' ? icon.trim().toLowerCase() : '';
  if (KEYWORD_ANIMATED_ICONS.has(rawIcon)) return rawIcon;
  if (STATIC_ICON_MAP[rawIcon]) return STATIC_ICON_MAP[rawIcon];

  const haystack = normalizeKeywordIconText([word, icon, theme].filter(Boolean).join(' '));
  for (const [needles, resolvedIcon] of WORD_ICON_RULES) {
    if (needles.some(needle => haystack.includes(needle))) return resolvedIcon;
  }
  return KEYWORD_ANIMATED_ICON_FALLBACK;
}

export function resolveKeywordLottieSrc(icon) {
  return KEYWORD_LOTTIE_ICONS[icon] || null;
}
