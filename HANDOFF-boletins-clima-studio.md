# Handoff técnico — Módulo de Boletins de Clima (CDM → Cropware Studio)

> **Objetivo deste documento:** transferir a funcionalidade de "boletins de clima" do Cropware CDM para o **Cropware Studio**, de forma que o Codador IA do Studio consiga reimplementá-la **sem acesso ao repositório do CDM**.
>
> Tudo aqui é extraído do código real do CDM em julho/2026. URLs de API, parâmetros, fórmulas de cálculo, shapes de dados e trechos de código são **literais** — copie-os fielmente.

---

## 0. Escopo desta transferência

**Entra no Studio (4 blocos):**
1. **Boletim visual de 16 dias** — cidade → previsão Open-Meteo → HTML/PDF com branding, gráfico e tabela. É o núcleo para virar post/material de MKT.
2. **Geração em lote (grupos + slots de cidades)** — organizar várias cidades e gerar N boletins de uma vez.
3. **Mapa climático interativo** — Leaflet + camadas OpenWeatherMap + badges de cidades próximas.
4. **Relatório climático histórico** — análise de período (safra/safrinha), balanço hídrico, eventos severos.

**NÃO entra (fica no CDM):**
- Alertas proativos via WhatsApp (cron + Meta Cloud API).
- NDVI / análise satelital (Google Earth Engine + NASA GIBS).
- Integração com "laudos" técnicos e casos periciais.

**Decisão de backend:** o Studio terá **Supabase próprio** (tabelas novas, descritas na seção 7). Não reaproveitar o backend do CDM.

---

## 1. Visão geral da arquitetura

```
┌──────────────────────────── Cropware Studio (novo) ────────────────────────────┐
│                                                                                 │
│  UI React/TS                        Lógica pura (portável)      Persistência    │
│  ├─ BoletinsTab (lote)   ──────►    radar-briefing-report.ts   ─►  Supabase     │
│  ├─ ClimaticMapTab (mapa) ─────►    climateAnalysis.ts             (Studio)     │
│  ├─ ClimateReportGenerator ───►     climateCharts.ts                            │
│  └─ CityPicker                      exportFile (HTML→aba/arquivo)               │
│                                                                                 │
│  Dados externos (sem backend próprio p/ maioria):                              │
│  ├─ Open-Meteo Forecast  (previsão 16d)     — sem API key                       │
│  ├─ Open-Meteo Archive   (histórico)        — sem API key                       │
│  ├─ Open-Meteo Geocoding (busca cidade)     — sem API key                       │
│  └─ OpenWeatherMap tiles (camadas do mapa)  — precisa VITE_OWM_API_KEY          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Ponto-chave de arquitetura:** a maior parte da lógica de clima é **pura e client-side**. O CDM usava uma edge function do Supabase para o histórico apenas para injetar `Authorization`; como o Open-Meteo é público, **o Studio pode chamar Open-Meteo direto do cliente**, eliminando a necessidade de backend para os dados. O Supabase do Studio serve só para **persistir** grupos, slots e boletins gerados.

**Stack esperada no Studio:** React 18 + TypeScript + Vite + Tailwind. Se o Studio usar outra stack, a lógica pura (cálculos, geração de HTML/SVG, chamadas de API) é framework-agnóstica; só a camada de UI/hooks precisa ser readaptada.

---

## 2. APIs externas (contrato completo)

### 2.1 Open-Meteo Forecast — previsão do boletim (16 dias)
- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Auth:** nenhuma.
- **Params:**
  ```
  latitude=<lat>
  longitude=<lng>
  daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,wind_gusts_10m_max,et0_fao_evapotranspiration,sunrise,sunset,uv_index_max,relative_humidity_2m_max,relative_humidity_2m_min
  current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation
  timezone=America/Sao_Paulo
  forecast_days=16
  ```
- **Resposta:** arrays paralelos em `data.daily.*` (índice `i` = dia). `daily.time[]` são strings `"YYYY-MM-DD"`; `sunrise/sunset` são ISO completos (`"2026-06-15T05:30"`).

### 2.2 Open-Meteo Archive — histórico do relatório climático
- **URL:** `https://archive-api.open-meteo.com/v1/archive`
- **Auth:** nenhuma. (No CDM havia um proxy em edge function só para auth; **no Studio, chame direto**.)
- **Params:**
  ```
  latitude=<lat>
  longitude=<lng>
  start_date=<YYYY-MM-DD>
  end_date=<YYYY-MM-DD>
  daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration
  timezone=America/Sao_Paulo
  ```
- **Modelo:** ERA5 reanálise (~10km). Latência típica < 2s. **Aviso:** são estimativas de reanálise, podem divergir de medição local — manter o disclaimer no rodapé do PDF.

### 2.3 Open-Meteo Geocoding — busca de cidade
- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Auth:** nenhuma.
- **Params:** `name=<query>&count=10&language=pt&format=json` (query trimada, mín. 2 chars).
- **Resposta:** `data.results[]` com `{ name, admin1, admin2, country, latitude, longitude }`. UI usa os 8 primeiros.

### 2.4 OpenWeatherMap tiles — camadas do mapa
- **URL template:** `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={API_KEY}`
- **Auth:** `VITE_OWM_API_KEY` (chave só de tile — baixo risco em client). Se ausente, o mapa funciona só com as camadas Open-Meteo (badges); mostrar aviso amigável.
- **Layer ids usados:** `precipitation_new`, `temp_new`, `clouds_new`, `wind_new`, `pressure_new`.

### 2.5 Open-Meteo (current) — mapa: badges e click-to-query
- **URL:** `https://api.open-meteo.com/v1/forecast`
- Badges (batch de N cidades): `latitude=lat1,lat2,...&longitude=lng1,lng2,...&current=temperature_2m,apparent_temperature,precipitation,relative_humidity_2m,surface_pressure,uv_index,wind_speed_10m,cloud_cover&timezone=America/Sao_Paulo`
- Grid de acumulado (15×15=225 pontos): `latitude=<225 lats>&longitude=<225 lngs>&hourly=precipitation&timezone=America/Sao_Paulo&forecast_days=7`
- Open-Meteo aceita múltiplas coords numa chamada; retorna **array** de objetos (um por coord). Normalizar com `Array.isArray(data) ? data : [data]`.

---

## 3. Bloco 1 — Boletim visual de 16 dias

### 3.1 Fluxo de geração (de ponta a ponta)
```
Cidade (lat/lng) selecionada
  └─ fetch Open-Meteo Forecast (§2.1)  → WeatherData
       └─ buildBriefingPayloadFromSnapshot()  → RadarBriefingPayload  (cálculos §3.3)
            ├─ [opcional] resumo IA (summaryPanorama)   — ver §8
            ├─ saveBriefing(payload)  → Supabase (quick_reports do Studio)
            └─ generateRadarBriefingHTML(payload)  → string HTML
                 └─ openHtmlReport(html)  → nova aba (web) / share nativo (mobile)
```

### 3.2 Shape do payload (`RadarBriefingPayload`) — copiar literal
```typescript
interface RadarBriefingPayload {
  kind: 'boletim_cropware_radar';
  title: string;                    // "Boletim Cropware Radar - Rio Verde, Goiás - 01/07/2026"
  locationName: string;             // "Rio Verde"
  municipality?: string | null;     // "Rio Verde, Goiás"
  latitude: number;
  longitude: number;
  farmName?: string | null;         // opcional (contexto de fazenda; pode omitir no Studio)
  producerName?: string | null;     // opcional
  generatedAt: string;              // ISO
  periodStart: string;              // "YYYY-MM-DD" (1º dia)
  periodEnd: string;                // "YYYY-MM-DD" (último dia)
  summaryPanorama?: string | null;  // resumo IA em markdown; fallback "Resumo indisponível"
  metrics: {
    precipitationTotal: number;     // mm, 1 casa
    et0Total: number;               // mm, 1 casa
    gdd10Total: number;             // inteiro
    balanceTotal: number;           // mm, 1 casa (= balance do último dia)
    highestTemp: number;            // °C
    lowestTemp: number;             // °C
  };
  dailyRows: Array<{
    date: string;                   // "YYYY-MM-DD"
    label: string;                  // "01/07"
    precipitation: number;          // mm, 1 casa
    tempMax: number;                // °C, 1 casa
    tempMin: number;                // °C, 1 casa
    et0: number;                    // mm, 1 casa
    gdd10: number;                  // 1 casa
    balance: number;                // mm cumulativo, 1 casa
    sunrise: string;                // ISO datetime
    sunset: string;                 // ISO datetime
    weatherCode?: number | null;    // WMO code
  }>;
  shareLog?: RadarBriefingShareEntry[];
  sourceForecastId?: string | null;
  batchId?: string | null;          // UUID do lote (ver Bloco 2)
  batchSize?: number;
  generationIndex?: number;         // 1-based
  slotIndex?: number | null;        // 0-based
}

interface RadarBriefingShareEntry {
  id: string; channel: string; destination: string;
  notes?: string; sharedAt: string; sharedByEmail?: string | null;
}
```

### 3.3 Cálculos derivados (fórmulas puras — reproduzir exatamente)
```typescript
// Por dia (mapeando cada índice i do daily):
gdd10 = Math.round(Math.max(0, ((tempMax + tempMin) / 2) - 10) * 10) / 10;   // GDD base 10°C
et0  = Math.round(day.et0 * 10) / 10;                                        // vem da API (et0_fao_evapotranspiration)

// Balanço hídrico ACUMULADO (running sum):
let cumulativeBalance = 0;
dailyRows = weather.daily.map(day => {
  cumulativeBalance += day.precipitation - day.et0;
  return { /* ... */ balance: Math.round(cumulativeBalance * 10) / 10 };
});

// Agregados (metrics):
precipitationTotal = Math.round(sum(day.precipitation) * 10) / 10;
et0Total           = Math.round(sum(day.et0) * 10) / 10;
gdd10Total         = Math.round(sum(max(0, (tMax+tMin)/2 - 10)));    // inteiro
balanceTotal       = dailyRows[last].balance;
highestTemp        = max(tempMax);   lowestTemp = min(tempMin);

// "Dias com chuva" (usado nos highlights): precipitation > 0.5 mm
rainyDays = dailyRows.filter(d => d.precipitation > 0.5).length;

// Sunrise/sunset para exibição:
formatHour = v => v ? new Date(v).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--:--';
```

### 3.4 Geração de HTML (`generateRadarBriefingHTML` / `generateMultiCityBriefingHTML`)
- **Entrada:** um `RadarBriefingPayload` (single) ou array (multi-cidade, uma seção `.briefing-city-section` por cidade com `page-break-after: always`).
- **Seções por cidade (em ordem):**
  1. Header branded (gradiente verde `linear-gradient(135deg, #10b981 0%, #2f7f5b 100%)`) com logo SVG + "Emitido em DD/MM/AAAA".
  2. Barra CTA verde (`#2f7f5b`) com título "Boletim Cropware Radar" + pill "cropware.com.br ↗".
  3. Hero: localização (cidade + estado) + kicker "Previsão para os próximos 16 dias".
  4. Highlights (grid 3 colunas): Precipitação acum. (mm) | Máx/Mín do período (°) | Dias com chuva.
  5. Resumo IA (card branco "Panorama dos próximos 16 dias"); fallback quando `summaryPanorama` vazio.
  6. Gráfico SVG (§3.5).
  7. Tabela: colunas **Dia** (ícone WMO + "DD/MM - Ddd") | **Chuva** (mm) | **Tmax/Tmin** (°) | **Sol** (nascer-pôr).
  8. Rodapé: período + coordenadas + CTA de contato.
- **Fontes:** `DM Sans` (Google Fonts). **Print:** exigir `print-color-adjust: exact` e `page-break-inside: avoid` nos blocos.
- **Paleta:** verde bright `#10b981` → dark `#2f7f5b`; texto `#10241b`; secundário `#737373`; bordas `#e5e5e5`.

### 3.5 Gráfico SVG (`generateChartSVG`)
- **Canvas:** viewBox 720×180. Padding: top 26, right 48, bottom 32, left 44.
- **Eixo Y esquerdo:** precipitação (labels azul `#60a5fa`). **Y direito:** temperatura (labels cinza `#a3a3a3`). **X:** datas alternadas (a cada 2 dias).
- **Séries:** barras azuis `#93c5fd` (precip, largura 55% do slot); linha vermelha `#f87171` + dots (Tmax); linha azul tracejada `#7dd3fc` + dots (Tmin). Grid horizontal de referência.
- **Escalas:**
  ```typescript
  maxPrecip = Math.max(Math.ceil(max(precip) / 10) * 10, 20);   // mínimo 20mm
  minTemp   = Math.floor((min(allTemps) - 2) / 5) * 5;
  maxTemp   = Math.ceil((max(allTemps) + 2) / 5) * 5;
  ```
- **Legenda:** canto superior esquerdo (Chuva mm, Tmax, Tmin).

### 3.6 Ícones de tempo (WMO → SVG) — função literal
```typescript
function wmoToWeatherIcon(code?: number | null): string {
  const base = 'https://cdn.jsdelivr.net/gh/basmilius/weather-icons@v2.0.0/production/fill/all';
  const url = (name: string) => `${base}/${name}.svg`;
  if (code == null) return url('clear-day');
  if (code === 0) return url('clear-day');
  if (code === 1) return url('partly-cloudy-day');
  if (code === 2) return url('partly-cloudy-day');
  if (code === 3) return url('overcast-day');
  if (code === 45 || code === 48) return url('fog-day');
  if (code === 51 || code === 53 || code === 55) return url('drizzle');
  if (code === 56 || code === 57) return url('sleet');
  if (code === 61) return url('partly-cloudy-day-rain');
  if (code === 63) return url('rain');
  if (code === 65) return url('rain');
  if (code === 66 || code === 67) return url('sleet');
  if (code === 71 || code === 73 || code === 75 || code === 77) return url('snow');
  if (code === 80 || code === 81) return url('partly-cloudy-day-rain');
  if (code === 82) return url('rain');
  if (code === 85 || code === 86) return url('snow');
  if (code === 95) return url('thunderstorms');
  if (code === 96 || code === 99) return url('thunderstorms-rain');
  return url('clear-day');
}
```

### 3.7 Export do HTML (`openHtmlReport`)
```typescript
// Web: abre nova aba e (opcional) dispara print após 250ms.
// Mobile (Capacitor): escreve arquivo .html via Filesystem + Share nativo.
export async function openHtmlReport(html: string, filename = 'relatorio',
  opts?: { autoPrint?: boolean }): Promise<boolean> {
  const safeName = filename.toLowerCase().endsWith('.html') ? filename : `${filename}.html`;
  if (isNativeCapacitorApp()) { /* saveDataFile + Share */ return true; }
  const win = window.open('', '_blank'); if (!win) return false;
  win.document.write(html); win.document.close();
  if (opts?.autoPrint !== false) setTimeout(() => win.print(), 250);
  return true;
}
```
> Se o Studio for **só web**, corte a parte Capacitor e as deps `@capacitor/*`. O "PDF" é gerado pelo diálogo de impressão do navegador (Salvar como PDF) a partir do HTML — não usa jsPDF neste bloco.

---

## 4. Bloco 2 — Geração em lote (grupos + slots)

### 4.1 Modelo de dados
```typescript
interface RadarGroup { id: string; name: string; slotCount: number; sortOrder: number; }

interface RadarSlot {
  id: string; slotIndex: number; nickname?: string | null;
  location: RadarSlotLocation | null;
  lastBriefingId?: string | null; lastBatchId?: string | null;
  lastGeneratedAt?: string | null;
  status: 'vazio' | 'pronto' | 'gerando' | 'gerado' | 'erro';
  errorMessage?: string | null;
}

interface RadarSlotLocation { name: string; municipality?: string | null; lat: number; lng: number; farmId?: string | null; }

interface GeoSearchResult { name: string; admin1?: string; admin2?: string; country: string; latitude: number; longitude: number; source?: 'ibge' | 'api'; }

// Constantes:
const MAX_GROUPS = 5, MIN_SLOTS_PER_GROUP = 1, MAX_SLOTS_PER_GROUP = 15, DEFAULT_SLOTS_PER_GROUP = 5;
```

### 4.2 Contrato de componente (props do `BoletinsTab`)
```typescript
interface BoletinsTabProps {
  searchCityAsync: (input: string) => Promise<GeoSearchResult[]>;
  generateBriefingForLocation: (
    location: RadarSlotLocation,
    ctx: { batchId: string; generationIndex: number; batchSize: number; slotIndex: number },
  ) => Promise<{ payload: RadarBriefingPayload; briefingId: string } | null>;
}
```
> `generateBriefingForLocation` é o "wire" entre a UI e o Bloco 1: ele faz o fetch da previsão, monta o payload, salva e devolve. É onde a lógica do §3.1 vive.

### 4.3 Orquestração do lote (`handleRunBatch`) — comportamento exato
- Alvo = slots selecionados **com `location`**, ordenados por `slotIndex`.
- `batchId = crypto.randomUUID()` (mesmo para todo o lote).
- **Loop SERIAL** (`for`, não `Promise.all`) — evita estourar cota e mantém ordem. Cancelável via `canceledRef`.
- Por slot: `markSlotGenerating` → `await generateBriefingForLocation(loc, {batchId, generationIndex: i+1, batchSize, slotIndex})` → sucesso `markSlotGenerated` / falha `markSlotError`. Atualiza `progress {current, total, city}`.
- Ao final: toast de resumo; monta HTML (`generateRadarBriefingHTML` se 1, `generateMultiCityBriefingHTML` se N) e abre; limpa seleção.
- **Histórico** agrupado por `batchId` (boletins antigos sem batch viram `single-<id>`), ordenado por `generationIndex` dentro do lote e data desc entre lotes.

### 4.4 Estados React principais
`activeGroupId`, `selectedSlots: Set<number>`, `running`, `progress`, `canceledRef`, `expandedBatches`.

### 4.5 Busca de cidade (`searchCity`)
Debounce 300ms, mín. 2 chars, chama Open-Meteo Geocoding (§2.3), mapeia para `GeoSearchResult` com `source:'api'`, corta em 8. Ao selecionar:
```typescript
const loc: RadarSlotLocation = {
  name: r.name,
  municipality: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
  lat: r.latitude, lng: r.longitude,
};
```

---

## 5. Bloco 3 — Mapa climático interativo

### 5.1 Base
- **Leaflet.** Init: `L.map(el, { center:[lat,lng], zoom:9, zoomControl:true, attributionControl:true })`.
- **Tile base (CartoDB Positron):** `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` (`subdomains:'abcd'`, `maxZoom:19`, atribuição OSM + CARTO).

### 5.2 Camadas (`LAYERS`) — copiar literal
```typescript
const LAYERS = [
  { id: 'overview',      label: 'Geral',      owmLayer: null,               opacity: 0 },
  { id: 'accumulated',   label: 'Acumulado',  owmLayer: null,               opacity: 0 },
  { id: 'precipitation', label: 'Chuva',      owmLayer: 'precipitation_new', opacity: 0.75 },
  { id: 'temperature',   label: 'Temperatura',owmLayer: 'temp_new',          opacity: 0.85 },
  { id: 'apparent',      label: 'Sensação',   owmLayer: null,               opacity: 0 },
  { id: 'humidity',      label: 'Umidade',    owmLayer: null,               opacity: 0 },
  { id: 'uv',            label: 'UV',         owmLayer: null,               opacity: 0 },
  { id: 'clouds',        label: 'Nuvens',     owmLayer: 'clouds_new',        opacity: 0.85 },
  { id: 'wind',          label: 'Vento',      owmLayer: 'wind_new',          opacity: 0.85 },
  { id: 'pressure',      label: 'Pressão',    owmLayer: 'pressure_new',      opacity: 0.5 },
];
// Overlay OWM: L.tileLayer(`https://tile.openweathermap.org/map/${owmLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`, { opacity, maxZoom:18 })
```

### 5.3 Cidades próximas (haversine + spread) — copiar literal
```typescript
const TARGET_COUNT = 15, MIN_SPREAD_KM = 30, POOL_SIZE = 200;
const toRad = d => d*Math.PI/180;
const dist = (a,b) => { const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 6371*2*Math.asin(Math.sqrt(s)); };
const candidates = BRAZILIAN_CITIES.map(([name,uf,lat,lng]) => ({name,uf,lat,lng,_d:dist(city,{lat,lng})}))
  .sort((a,b)=>a._d-b._d).slice(0, POOL_SIZE);
const selected = [];
for (const c of candidates) { if (selected.length>=TARGET_COUNT) break;
  if (!selected.some(s => dist(s,c) < MIN_SPREAD_KM)) selected.push(c); }
```
> **Dataset `BRAZILIAN_CITIES`:** tuplas `[name, uf, lat, lng]` — 5.571 municípios (fonte: `kelvins/Municipios-Brasileiros`, MIT). Levar o arquivo `src/data/brazilian-cities.ts` junto, ou regenerar da mesma fonte.

### 5.4 Badges (current) e grid de acumulado
- **Badges:** fetch batch das 15 cidades (§2.5), refresh a cada **10 min** (`setInterval 600000`). 8 variáveis: temperatura, sensação, precip, umidade, pressão, UV, vento, nuvens.
- **Acumulado:** grid 15×15 (±2° ≈ 450km), `hourly=precipitation` 7 dias; soma até horizonte (6/24/48/72/168h); pinta `L.rectangle` por célula com escala de cor:
  ```typescript
  const colorFor = mm =>
    mm<0.5 ? {fill:'transparent',opacity:0} : mm<5 ? {fill:'#3b82f6',opacity:0.35} :
    mm<15 ? {fill:'#06b6d4',opacity:0.45} : mm<30 ? {fill:'#10b981',opacity:0.55} :
    mm<60 ? {fill:'#eab308',opacity:0.6}  : mm<100? {fill:'#f97316',opacity:0.65} :
            {fill:'#dc2626',opacity:0.7};
  ```
- **Click-to-query:** ao clicar no mapa, fetch `current` do ponto (§2.5, coord única), pin laranja `#f59e0b` + popup com os 8 valores.

---

## 6. Bloco 4 — Relatório climático histórico

### 6.1 Tipos — copiar literal
```typescript
interface ClimateDay { date: string; tempMax: number; tempMin: number; precipitation: number; et0: number; }

interface PeriodAnalysis {
  label: string; startDate: string; endDate: string; days: ClimateDay[];
  totalDays: number; precipTotal: number; precipAvgDaily: number; et0Total: number; balanceTotal: number;
  tempMaxAvg: number; tempMinAvg: number; tempMaxAbsolute: number; tempMinAbsolute: number;
  rainyDays: number; dryDays: number; maxConsecutiveDryDays: number;
  severeEvents: SevereEvent[]; monthlyPrecip: { month: string; total: number }[];
}

interface SevereEvent { date: string; type: 'heavy_rain'|'frost'|'extreme_heat'|'long_dry_spell'; description: string; value: number; }
```

### 6.2 `analyzePeriod()` — função literal
```typescript
export function analyzePeriod(label, startDate, endDate, rawData): PeriodAnalysis {
  const times = rawData?.daily?.time || [];
  const tMax = rawData?.daily?.temperature_2m_max || [];
  const tMin = rawData?.daily?.temperature_2m_min || [];
  const prc  = rawData?.daily?.precipitation_sum || [];
  const et0A = rawData?.daily?.et0_fao_evapotranspiration || [];
  const days = times.map((date,i) => ({ date, tempMax:tMax[i]??0, tempMin:tMin[i]??0, precipitation:prc[i]??0, et0:et0A[i]??0 }));

  const totalDays = days.length;
  const precipTotal = days.reduce((s,d)=>s+d.precipitation,0);
  const et0Total    = days.reduce((s,d)=>s+d.et0,0);
  const balanceTotal = precipTotal - et0Total;
  const tempMaxAvg = totalDays? days.reduce((s,d)=>s+d.tempMax,0)/totalDays : 0;
  const tempMinAvg = totalDays? days.reduce((s,d)=>s+d.tempMin,0)/totalDays : 0;
  const tempMaxAbsolute = totalDays? Math.max(...days.map(d=>d.tempMax)) : 0;
  const tempMinAbsolute = totalDays? Math.min(...days.map(d=>d.tempMin)) : 0;
  const rainyDays = days.filter(d=>d.precipitation>=1).length;
  const dryDays   = days.filter(d=>d.precipitation<1).length;

  let maxConsecutiveDry=0, cur=0;
  for (const d of days) { if (d.precipitation<1){cur++;maxConsecutiveDry=Math.max(maxConsecutiveDry,cur);} else cur=0; }

  const severeEvents = [];
  for (const d of days) {
    if (d.precipitation>50) severeEvents.push({date:d.date,type:'heavy_rain',description:`Chuva intensa: ${d.precipitation.toFixed(1)} mm`,value:d.precipitation});
    if (d.tempMin<5)        severeEvents.push({date:d.date,type:'frost',description:`Risco de geada: ${d.tempMin.toFixed(1)}°C`,value:d.tempMin});
    if (d.tempMax>40)       severeEvents.push({date:d.date,type:'extreme_heat',description:`Calor extremo: ${d.tempMax.toFixed(1)}°C`,value:d.tempMax});
  }
  if (maxConsecutiveDry>=15) severeEvents.push({date:'',type:'long_dry_spell',description:`Veranico: ${maxConsecutiveDry} dias consecutivos sem chuva significativa`,value:maxConsecutiveDry});

  const monthMap = new Map();
  for (const d of days) { const m=d.date.slice(0,7); monthMap.set(m,(monthMap.get(m)||0)+d.precipitation); }
  const monthlyPrecip = Array.from(monthMap.entries()).map(([month,total])=>({month,total:Math.round(total*10)/10})).sort((a,b)=>a.month.localeCompare(b.month));

  return { label,startDate,endDate,days,totalDays,
    precipTotal:Math.round(precipTotal*10)/10,
    precipAvgDaily: totalDays? Math.round((precipTotal/totalDays)*100)/100 : 0,
    et0Total:Math.round(et0Total*10)/10, balanceTotal:Math.round(balanceTotal*10)/10,
    tempMaxAvg:Math.round(tempMaxAvg*10)/10, tempMinAvg:Math.round(tempMinAvg*10)/10,
    tempMaxAbsolute:Math.round(tempMaxAbsolute*10)/10, tempMinAbsolute:Math.round(tempMinAbsolute*10)/10,
    rainyDays, dryDays, maxConsecutiveDryDays:maxConsecutiveDry, severeEvents, monthlyPrecip };
}
```
**Thresholds (exatos):** heavy_rain `>50mm/dia`; frost `tempMin<5°C`; extreme_heat `tempMax>40°C`; veranico `>=15` dias consecutivos com `precip<1mm`. Dia chuvoso `>=1mm`, seco `<1mm`.

### 6.3 Presets de período
```typescript
function calcDates(preset, crop, yearOffset) {
  const baseYear = new Date().getFullYear() + yearOffset;
  if (crop === 'safrinha') return { start:`${baseYear}-01-01`, end:`${baseYear}-06-30` };
  if (crop === 'ano_todo') return { start:`${baseYear}-01-01`, end:`${baseYear}-12-31` };
  return { start:`${baseYear-1}-10-01`, end:`${baseYear}-03-31` }; // safra Out→Mar
}
// Presets: safra_atual (offset 0), safra_anterior (-1), ultimas_5 (offsets 0..-4, reverse), personalizado (datas manuais).
```

### 6.4 PDF e gráficos
- **`generateClimateReportContent(params)`** monta HTML com: Identificação → Tabela comparativa (destaque desvio <-10% vermelho / >+10% verde, balanço<0 vermelho) → Análise por período (gráfico + 6 métricas) → Balanço hídrico acumulado → Eventos severos (badges) → [IA opcional] → Fonte/disclaimer.
- **`generateClimatePeriodSVG(days, opts)`** (720×200): barras precip `#93c5fd`, linha Tmax `#f87171`, Tmin tracejada `#7dd3fc`; escala precip mín 20mm arred. 10; temp arred. 5°C; label X adaptativo (14d se n>90, 7d se n>30, senão 2d).
- **`generateWaterBalanceSVG(days, opts)`** (720×120): soma acumulada `precip - et0`, eixo simétrico centrado em 0, área verde (positivo) / vermelho (negativo).
- **Deps:** os SVGs são handcrafted (strings) — **não** precisam de recharts. `jspdf`/`jspdf-autotable` não são usados aqui (PDF via HTML→print). `html2canvas` só se quiser rasterizar SVG→PNG.

---

## 7. Backend do Studio (Supabase próprio)

Como não há dependência de backend para os dados (Open-Meteo é público), o Supabase serve **só para persistir**. DDL sugerido (adaptar RLS ao modelo de auth do Studio — abaixo assume `auth.uid()`):

```sql
-- Grupos de cidades
create table radar_briefing_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  slot_count int not null default 5,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Slots (cidades) por grupo
create table radar_briefing_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references radar_briefing_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  slot_index int not null,                      -- 0-based
  nickname text,
  location jsonb,                               -- { name, municipality, lat, lng }
  last_briefing_id uuid,
  last_batch_id uuid,
  last_generated_at timestamptz,
  last_status text,                             -- 'pronto'|'gerado'|'erro'|null
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (group_id, slot_index)
);

-- Boletins gerados (histórico). No CDM era a tabela genérica quick_reports com report_type='radar_briefing'.
-- No Studio, uma tabela dedicada é mais limpa:
create table radar_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  payload jsonb not null,                       -- RadarBriefingPayload completo
  location jsonb,                               -- { latitude, longitude, address }
  batch_id uuid,
  generation_index int,
  created_at timestamptz default now()
);

-- Relatórios climáticos históricos (Bloco 4)
create table climate_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  location_name text,
  coordinates text,                             -- "-17.79, -50.92"
  periods jsonb,                                -- [{ label, startDate, endDate }]
  data jsonb,                                   -- ClimateDay[] brutos
  analysis jsonb,                               -- ComparativeAnalysis
  created_at timestamptz default now()
);

-- RLS: habilitar e restringir por user_id em todas as tabelas.
alter table radar_briefing_groups enable row level security;
alter table radar_briefing_slots  enable row level security;
alter table radar_briefings       enable row level security;
alter table climate_reports       enable row level security;
-- Exemplo de policy (repetir por tabela, ajustando):
create policy "own rows" on radar_briefing_groups
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

**Operações dos hooks (mapa mental):**
- `useRadarGroups`: `select * where user_id order by sort_order`; insert/update(name|slot_count)/delete (manter ≥1 grupo).
- `useRadarSlots(groupId, slotCount)`: `select * where group_id order by slot_index`; lazy-insert dos slots faltantes; update de `location` (seta `last_status='pronto'`), `nickname`, `last_*` no gerado/erro; delete `slot_index >= n` ao reduzir.
- `useRadarBriefings`: `select where report_type/tabela dedicada order by created_at desc`; insert do payload; update `shareLog`; delete.

---

## 8. Análise de IA (opcional — `summaryPanorama`)

O CDM gera um resumo textual do boletim (e do relatório histórico) via cloud function que chama um LLM. **Contrato apenas** (implementação de provider fica a critério do Studio):

- **Boletim:** entrada = `WeatherData` (16 dias) + localização; saída = markdown curto ("Panorama dos próximos 16 dias") → vai em `payload.summaryPanorama`.
- **Histórico:** `generateClimateAnalysis({ locationName, coordinates, eventPeriod, climatePeriodsData, laudoContext })` → `{ analysis: string }`.

> Recomendação: no Studio (que é ferramenta de MKT com IA), use os modelos Claude mais recentes (Opus/Sonnet 4.x) via edge function própria. A IA é **opcional** — sem ela, o boletim mostra fallback "Resumo indisponível" e continua funcional. **Nunca** exponha chave de LLM no client; use edge function.

---

## 9. Variáveis de ambiente (Studio)

```env
# Frontend (Vite)
VITE_OWM_API_KEY=...            # OpenWeatherMap — só tiles do mapa (Bloco 3). Sem ela, mapa cai p/ camadas Open-Meteo.
VITE_SUPABASE_URL=...           # Supabase do Studio
VITE_SUPABASE_ANON_KEY=...

# Backend (edge function, só se usar IA)
LLM_API_KEY=...                 # chave do provedor de IA — NUNCA no client
```
Open-Meteo (forecast/archive/geocoding) **não** usa env var.

---

## 10. Dependências npm

**Essenciais:** `react`, `react-dom`, `leaflet` (mapa), `sonner` (toasts). Datas: `date-fns` (opcional).
**UI (se reusar shadcn/Radix):** `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `class-variance-authority`, `tailwind-merge`, `@phosphor-icons/react` ou `lucide-react`.
**Só se o Studio for mobile (Capacitor):** `@capacitor/core`, `@capacitor/filesystem`, `@capacitor/share`. **Web puro:** dispensar.
**NÃO precisa:** `recharts`, `jspdf`, `jspdf-autotable`, `@google/earthengine`, `@react-google-maps/api`, `canvas`, `@resvg/resvg-js` (eram de outros módulos / SVGs são strings).

---

## 11. Plano de migração seguro (passo a passo)

1. **Fase 0 — Isolar a lógica pura.** Portar primeiro os arquivos **framework-agnósticos**, que não dependem de auth/UI:
   - `radar-briefing-report.ts` (HTML + `generateChartSVG` + `wmoToWeatherIcon`)
   - `climateAnalysis.ts`, `climateCharts.ts`, `climateReportPdf.ts`
   - `searchCity.ts`, `exportFile.ts`, `data/brazilian-cities.ts`
   - Teste-os isoladamente (chamar Open-Meteo, gerar HTML, abrir no browser). **Nada de Supabase ainda.**
2. **Fase 1 — Boletim single (MVP).** UI mínima: 1 campo de cidade (geocoding) → botão "Gerar" → `openHtmlReport`. Valida ponta a ponta sem persistência. É o menor incremento que já produz material de MKT.
3. **Fase 2 — Supabase do Studio.** Criar as 4 tabelas (§7) + RLS. Ligar `saveBriefing`/histórico. Confirmar isolamento por usuário.
4. **Fase 3 — Lote (grupos/slots).** Portar `BoletinsTab` + hooks. Reusar o `generateBriefingForLocation` da Fase 1 como callback.
5. **Fase 4 — Mapa climático.** Portar `ClimaticMapTab` + `brazilian-cities`. Configurar `VITE_OWM_API_KEY` (com fallback gracioso se faltar).
6. **Fase 5 — Relatório histórico.** Portar `ClimateReportGenerator` + Archive API. Remover todo o acoplamento com "laudos"/casos (campos `laudoContext`, `caseId` etc. viram opcionais ou saem).
7. **Fase 6 — IA (opcional).** Edge function de resumo. Sempre com fallback.

**Ordem de valor:** Fases 1–3 entregam o boletim postável (o "core" para MKT). Mapa e histórico são incrementos.

---

## 12. Armadilhas / pontos de atenção (o que quebra se copiar cego)

- **`forecast_days=16`, não 7.** O boletim é de **16 dias**; textos e escalas do gráfico assumem isso.
- **Open-Meteo batch retorna array.** Sempre normalizar `Array.isArray(data) ? data : [data]`.
- **Balanço hídrico é acumulado (running sum),** não diário. `balanceTotal` = valor do último dia.
- **`et0` vem pronto da API** (`et0_fao_evapotranspiration`) — não recalcular.
- **Ícones WMO** dependem do CDN `jsdelivr basmilius@v2.0.0`. Para uso offline/mobile, baixar os SVGs e servir localmente (o CDN pode falhar no app nativo).
- **Print/PDF:** exigir `print-color-adjust: exact` senão as cores do header/branding somem no "Salvar como PDF".
- **Remover acoplamentos do CDM:** `useAuth().organizationId`, `farmId`/`producerName`, tudo de laudos/WhatsApp/satélite. Onde havia `organization_id` multi-tenant, o Studio decide se mantém ou simplifica para só `user_id`.
- **`VITE_OWM_API_KEY` no client** é aceitável (chave de tile, escopo baixo), mas configure restrição de domínio na OWM se possível.
- **Fontes/branding:** o header usa logo SVG e paleta do Cropware — trocar pela identidade visual que o Studio quiser nos posts.

---

## 13. Índice rápido dos arquivos-fonte no CDM (para consulta)

| Bloco | Arquivos-fonte (CDM) |
|---|---|
| Boletim visual | `src/lib/radar-briefing-report.ts`, `src/hooks/useRadarBriefings.ts`, `src/utils/exportFile.ts` |
| Lote (grupos/slots) | `src/components/radar/BoletinsTab.tsx`, `src/hooks/useRadarSlots.ts`, `src/hooks/useRadarGroups.ts`, `src/components/radar/CityPickerPanel.tsx`, `src/utils/searchCity.ts` |
| Mapa | `src/components/radar/ClimaticMapTab.tsx`, `src/data/brazilian-cities.ts`, `src/utils/leafletConfig.ts` |
| Histórico | `src/laudos/utils/climateAnalysis.ts`, `src/laudos/utils/climateReportPdf.ts`, `src/laudos/utils/climateCharts.ts`, `src/laudos/pages/ClimateReportGenerator.tsx`, `src/laudos/hooks/useClimateReports.ts` |

---

*Documento gerado a partir do estado do CDM em julho/2026. As fórmulas, thresholds e endpoints são literais do código; a camada de UI/auth deve ser readaptada ao Studio.*
