# Motion Reel — Estado Final (R11)

Gerador de Reels 9:16 (1080×1920) integrado ao Cropware Studio. **Stack:**
Remotion 4 + React 19 (cenas + animações) · Gemini (IA gera storyboard) ·
ElevenLabs (voiceover TTS) · `@remotion/sfx` (SFX hospedados) · `@iconify/react`
(ícones coloridos) · Vite middleware (endpoint local pra render MP4).

## Como usar (fluxo final)

```bash
# Único setup (uma vez):
cp .env.example .env             # preencha ELEVENLABS_API_KEY
npm install                       # já feito

# Dev:
npm run dev                       # Vite + endpoint /api/render-reel
# Abra http://localhost:5173 → dropdown "Motion — Reel"

# Gerar reel com IA:
# Ações → "Gerar Reel" → digita tema → IA monta storyboard 60s
# com voiceover.text por cena automaticamente.

# Baixar MP4 (1 clique):
# Ações → "Baixar MP4" → endpoint chama ElevenLabs (gera MP3s)
# + Remotion render → MP4 baixa direto pelo browser (~70s).

# Render CLI manual:
npm run reel:render               # default storyboard → out/reel.mp4
npm run reel:studio               # Remotion Studio (timeline + props editor)
npm run reel:voiceover -- ./sb.json my-reel   # só gera os MP3s
```

## Arquitetura final

```
cropware-studio/
├── index.html                    Vanilla JS app + #motionReelStage div
├── vite.config.mjs               Vite + React + endpoint /api/render-reel
├── remotion.config.mjs           CLI config (codec, publicDir)
├── package.json                  Deps + scripts reel:*
├── .env / .env.example           ELEVENLABS_API_KEY
├── public/
│   ├── logo-cropware-pb-final.svg   staticFile() dos componentes
│   ├── icon-cropware.svg
│   └── voiceover/<reelId>/*.mp3     gerados via ElevenLabs (gitignored)
├── motion-reel/                  Módulo Remotion isolado (ESM)
│   ├── package.json              "type": "module" (escopo só dessa pasta)
│   ├── mount.jsx                 entry bundled pelo Vite — monta <Player>
│   ├── MotionReel.jsx            Composition raiz <TransitionSeries>
│   ├── Root.jsx + index.js       entry pro CLI render
│   ├── theme.js                  14 cores MR_COLORS (verdes/slates/neutros/accents)
│   ├── fonts.js                  Inter Tight + Familjen Grotesk + Space Mono
│   ├── transitions.js            Mapping nome → presentation
│   ├── custom-transitions.jsx    Flash · ZoomBlur · MaskCircle · CinematicBlur · RingTunnel · Glitch · SlideRadial
│   ├── overlays.jsx              7 overlays decorativos
│   ├── helpers.jsx               CharReveal / KickerReveal / FadeSlide /
│   │                             AccentBar / NumberTicker / ScaleBounceText /
│   │                             TypewriterText / GlitchText / SceneBackdrop /
│   │                             IconifyIcon
│   ├── sfx.js                    Mapping de nomes → URLs remotion.media/*.wav
│   ├── voiceover-core.mjs        TTS ElevenLabs reusável (CLI + middleware)
│   ├── default-storyboard.js     Storyboard demo 60s (11 cenas)
│   └── scenes/                   11 tipos:
│       ├── BrandIntro.jsx
│       ├── Keyword.jsx
│       ├── StatCard.jsx
│       ├── Quote.jsx
│       ├── FeatureList.jsx       items: { text, icon } com Iconify
│       ├── EndCard.jsx
│       ├── Cta.jsx
│       ├── Chapter.jsx           Marker numerado + título
│       ├── LowerThird.jsx        Overlay-style faixa rodapé
│       ├── DataChart.jsx         SVG bar+line com spring/stroke-dashoffset
│       └── AppCard.jsx           Janela mockup (weather/satellite/dashboard/alert)
└── scripts/
    └── generate-voiceover.mjs    CLI wrapper de voiceover-core.mjs
```

## Capacidades por cena

| Tipo | Visual | Quando usar |
|---|---|---|
| brand-intro | Kicker + pre-headline + brand name (char-reveal) + accent bar | Abertura |
| keyword | 1-4 palavras gigantes letter-by-letter + underline | Puxar atenção |
| stat-card | Kicker mono + número grande (NumberTicker) + suffix + label | Mostrar dado quantitativo |
| quote | Aspas verdes + frase (clip-path horizontal) + autor mono | Depoimentos |
| feature-list | Kicker + título + 3-4 items com **ícones Iconify coloridos** | Enumerar features |
| end-card | Logo horizontal + accent bar + tagline + handle | Fechamento padrão |
| cta | Logo + headline + sublabel + handle | Fechamento com call-to-action grande |
| chapter | "CAPÍTULO 02" mono + título grande + subtitle | Pausa visual / divisor |
| lower-third | Faixa branca rodapé com nome + handle + CTA | Menção de cliente/parceiro |
| data-chart | Bars (spring stagger) + line (stroke-dashoffset glow) + dot pulsante | Série temporal real |
| app-card | Janela mockup macOS (weather/satellite/dashboard/alert) | Ilustrar feature |

## Transições (13)

**Built-in (`@remotion/transitions`)**: cut · fade · wipe-up · wipe-down · push-up · push-left · mask-circle

**Custom (`custom-transitions.jsx`)**: flash · zoom-blur · cinematic-blur · ring-tunnel · glitch · slide-radial

**Overlay (`@remotion/light-leaks` via TransitionSeries.Overlay)**: light-leak

## Overlays decorativos (7)

rotating-rings · pulse-circle · particle-drift · line-draw · curve-trace · light-streak · vignette-breath

## Áudio

- **SFX** via `transitionIn.sfx`: whoosh · click · ding · vine-boom · impact · riser · pop · notification · whip · page-turn · switch · shutter · etc. (11 nativos do @remotion/sfx + aliases semânticos)
- **Música** via `audio.music` global: upload manual em `public/audio/X.mp3`, com fade in/out
- **Voiceover** via `scene.voiceover.text`: IA gera o texto → ElevenLabs gera MP3 → mixado no render. Vozes PT-BR documentadas em `.env.example`.

## Sistema de background (substitui bgImage)

```json
"background": {
  "type": "solid" | "gradient" | "texture",
  "gradient": { "kind": "linear|radial|breathing-radial", "colors": [...], "angle": 135, "breathScale": 1.05 },
  "texture":  { "kind": "noise|grain|dots|lines|topo", "color": "var(--mr-greenAbyss)", "intensity": 0.4 }
}
```

## Paleta MR_COLORS v2 (14 cores)

**Verdes**: greenBright (#82CCA5) · greenAccent (#6AC58F) · greenDeep (#42AA7B) · greenForest (#2A7B5A) · greenAbyss (#143F2C)
**Slates**: slateLight (#80847F) · slateMid (#5C605D) · slateDark (#3D3F3D) · slateAbyss (#1A1B1A)
**Neutros**: white · cream (#F5F1EA) · fog (#EEEFEE)
**Accents**: amber (#F4B860) · azure (#0B84F3)

## Pipeline de render

```
[Browser]                       [Vite dev server]
   │                                    │
   │  POST /api/render-reel             │
   │  { storyboard, reelId,             │
   │    skipVoiceover? }                │
   ├───────────────────────────────────▶│
   │                                    │  1. ElevenLabs TTS por cena (~10s)
   │                                    │  2. Escreve out/.tmp/X.props.json
   │                                    │  3. spawn `remotion render --props=... --gl=angle`
   │                                    │  4. Lê out/{id}.mp4
   │  ← 200 video/mp4                   │
   │◀───────────────────────────────────┤
   │  Browser baixa MP4                 │
```

Tempo típico de render no Mac M-series: **~70-90s** pra reel de 60s (1623 frames @ 30fps) com `--gl=angle` (hardware GPU). Com `--gl=swangle` (SwiftShader software WebGL) leva ~9 min.

## Histórico (R1 → R11)

| Round | Data | Mudança |
|---|---|---|
| R1+R2 | 2026-05-14 | Engine vanilla JS com setFrame puro, 4 tipos de cena |
| R3 | 2026-05-15 | Geração de storyboard por IA Gemini |
| R4 | 2026-05-15 | **Migração pra Remotion 4 + React 19** (substitui setFrame) |
| R5 | 2026-05-15 | Light leaks (@remotion/light-leaks via Overlay) + presentations custom |
| R6 | 2026-05-15 | bgImage com Ken Burns (descontinuado em R7) |
| R7 | 2026-05-15 | Paleta MR_COLORS v2 + 60s default + SceneBackdrop (solid/gradient/texture) |
| R8 | 2026-05-15 | 4 cenas novas (Chapter · LowerThird · DataChart · AppCard) |
| R9 | 2026-05-15 | 4 transições novas + 7 overlays decorativos + char effects |
| R10 | 2026-05-15 | **Áudio**: SFX + música + voiceover ElevenLabs + CLI script |
| R11 | 2026-05-15 | Iconify + license ack + IA prompt com exemplo + cleanup 800 linhas dead code + endpoint `/api/render-reel` + botão "Baixar MP4" no app |

## Pendências (não escopadas no R7-R11)

- Polimentos visuais finais (alinhamentos, escolha de cores em casos específicos)
- UI in-app pra upload de música de fundo (hoje só via edição manual de JSON)
- UI in-app pra editar storyboard JSON visualmente (hoje só via IA + console)
- Render Lambda em vez de local (pra escala)
- Mais skins de paleta (light mode, monocromático, etc.)
