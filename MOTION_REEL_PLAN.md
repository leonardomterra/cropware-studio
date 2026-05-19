# Motion Reel — Estado Final (R13)

Gerador de Reels 9:16 (1080×1920) integrado ao Cropware Studio. **Stack:**
Remotion 4 + React 19 (cenas + animações) · Gemini (IA gera storyboard) ·
ElevenLabs (voiceover TTS pt-BR, plano Starter+) · `@remotion/sfx` (SFX hospedados) ·
`@iconify/react` (ícones coloridos) · Vite middleware (endpoint local pra render MP4).

## Como usar (fluxo final)

```bash
# Único setup (uma vez):
cp .env.example .env             # preencha ELEVENLABS_API_KEY (plano Starter+)
npm install                       # já feito

# Dev:
npm run dev                       # Vite + endpoint /api/render-reel
# Abra http://localhost:5173 → dropdown "Motion — Reel"

# Gerar reel com IA:
# Ações → "Gerar Reel" → digita tema → IA monta storyboard 60s
# com voiceover.text por cena automaticamente.

# Baixar MP4 (1 clique):
# Ações → "Baixar MP4" → endpoint chama ElevenLabs (gera MP3s pt-BR)
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
├── .env / .env.example           ELEVENLABS_API_KEY + voice ID + model
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
│   ├── custom-transitions.jsx    Flash · ZoomBlur · MaskCircle · CinematicBlur · RingTunnel ·
│   │                             Glitch · SlideRadial · GlassFrost · IrisSquare · DriftFade · LightStreak
│   ├── overlays.jsx              7 overlays decorativos
│   ├── helpers.jsx               CharReveal / KickerReveal / FadeSlide /
│   │                             AccentBar / NumberTicker / ScaleBounceText /
│   │                             TypewriterText / GlitchText / SceneBackdrop /
│   │                             IconifyIcon · LottieAsset
│   ├── sfx.js                    Mapping de nomes → URLs remotion.media/*.wav
│   ├── voiceover-core.mjs        TTS ElevenLabs reusável (CLI + middleware)
│   ├── default-storyboard.js     Storyboard demo 60s (12 cenas)
│   ├── mount.jsx                 Player + Grid view (12 thumbs 4×3) + Preview modal
│   └── scenes/                   12 tipos:
│       ├── BrandIntro.jsx        FIXA — cap01 "Conheça"
│       ├── Headline.jsx          custom — cap02 kicker + headline editorial
│       ├── Keyword.jsx           custom — texture verde + ícone + word
│       ├── Quote.jsx             FIXA — cap10 depoimento genérico
│       ├── FeatureList.jsx       custom — light theme, items com Iconify
│       ├── Scenario.jsx          custom — cap06 paragrafo narrativo
│       ├── WhatsAppChat.jsx      custom — cap09 iPhone mockup conversa
│       ├── EndCard.jsx           FIXA — cap12 logo + tagline + handle
│       ├── Cta.jsx               legado (não usado no default 60s)
│       ├── Chapter.jsx           FIXA — cap04, cap07 marker "Capítulo NN"
│       ├── LowerThird.jsx        FIXA — cap11 WhatsApp CTA "Fala com a gente"
│       └── AppCard.jsx           custom — cap08 mockup weather/satellite/etc
├── scripts/
│   ├── generate-voiceover.mjs        CLI wrapper de voiceover-core.mjs
│   ├── render-locked-thumbs.mjs      R12 — gera PNGs das 6 cenas locked em public/thumbs/
│   └── upload-motion-reel-music.mjs  R15 — sobe MP3s de public/audio/ pro R2 via Worker
└── public/
    └── thumbs/                   PNGs pré-renderizadas das locked scenes
                                  (01-intro, 04-chapter-1, 07-chapter-2, 10-quote,
                                  11-lower-third, 12-end-card)
```

## Capacidades por cena

### Storyboard default 60s — 12 cenas em grade 4×3 (R12)

6 cenas **FIXAS** (locked: true — identidade Cropware, hardcoded nos componentes) +
6 cenas **CUSTOMIZÁVEIS** (locked: false — IA preenche conteúdo por tema).

| #  | Tempo       | Tipo            | Lock     | Função |
|----|-------------|-----------------|----------|--------|
| 01 | 00.0→6.0    | brand-intro     | **FIXA** | "Conheça o Cropware" |
| 02 | 5.0→10.0    | headline        | custom   | Kicker + headline editorial (R12, substituiu stat-card) |
| 03 | 10.0→14.0   | keyword         | custom   | Palavra-chave + ícone Iconify (R12 polish) |
| 04 | 14.0→18.0   | chapter         | **FIXA** | "Capítulo 02 · No campo" |
| 05 | 18.0→24.0   | feature-list    | custom   | 3 features tema-específicas (R12 light theme) |
| 06 | 24.0→30.0   | scenario        | custom   | Mini-cenário narrativo (R12, substituiu data-chart) |
| 07 | 30.0→34.0   | chapter         | **FIXA** | "Capítulo 03 · Resultados" |
| 08 | 34.0→40.0   | app-card        | custom   | Mockup app (weather/satellite/etc) |
| 09 | 40.0→44.0   | whatsapp-chat   | custom   | iPhone mockup com conversa user↔AI (R12, substituiu kw-direct) |
| 10 | 44.0→50.0   | quote           | **FIXA** | "A fazenda inteira, num só lugar." |
| 11 | 50.0→55.0   | lower-third     | **FIXA** | WhatsApp Lottie + "Fala com a gente" |
| 12 | 55.0→60.0   | end-card        | **FIXA** | Logo + tagline + handle |

### Catálogo completo de tipos

| Tipo | Visual | Quando usar |
|---|---|---|
| brand-intro | Hero `conheca-hero-bg.webp` + Ken Burns + overlay verde + CONHEÇA typewriter + logo + tagline | Abertura |
| headline | Imagem `conheca-solucao-bg.webp` + Ken Burns + glass slate + kicker + headline + accent bar | Headline editorial |
| keyword | Textura verde tintada (multiply) + 1 ícone Iconify animado + word Space Mono + underline | Puxar atenção |
| quote | Imagem `og-bg.webp` (folha+orvalho) + Ken Burns + glass slate + frase + atribuição "· Cropware" | Depoimentos |
| feature-list | Light theme (fundo branco/fog) + kicker + título + 3-4 cards com ícones Iconify verdes | Enumerar features |
| scenario | Imagem `conheca-campo-bg.webp` + Ken Burns + glass slate + kicker + paragrafo narrativo `\n`-separado | Cenário/storytelling |
| whatsapp-chat | iPhone mockup com iOS status bar + WhatsApp header (#075E54) + bolhas + input bar | Conversa user↔AI |
| end-card | Logo horizontal + accent bar + tagline + handle | Fechamento padrão |
| cta | Logo + headline + sublabel + handle | Fechamento com CTA grande (legado) |
| chapter | Imagem `conheca-produto-bg.webp` + glass slate + "Capítulo NN" mono + título | Pausa visual / divisor |
| lower-third | Imagem `sobre-equipe.webp` + glass verde claro + WhatsApp Lottie + card branco com título+subtítulo | CTA WhatsApp |
| app-card | Janela mockup com chrome "CROPWARE - TEMPO/NDVI/ALERTAS" (weather/satellite/dashboard/alert) | Ilustrar feature |

## Transições (18)

**Built-in (`@remotion/transitions`)**: cut · fade · wipe-up · wipe-down · push-up · push-left · mask-circle

**Custom cinematográficas (`custom-transitions.jsx`)**: flash · zoom-blur · cinematic-blur · ring-tunnel · glitch · slide-radial

**Custom R13 (calmas/elegantes)**: glass-frost · iris-square · drift-fade · light-streak

**Overlay (`@remotion/light-leaks` via TransitionSeries.Overlay)**: light-leak (usar `hueShift >= 100` pra tom verde, default laranja contrasta com paleta)

**Notas IA**: evitar `flash` (jarring) — preferir `cinematic-blur` ou `fade` em substituição.

## Overlays decorativos (7)

rotating-rings · pulse-circle · particle-drift · line-draw · curve-trace · light-streak · vignette-breath

## Áudio

- **SFX** via `transitionIn.sfx`: whoosh · click · ding · vine-boom · impact · riser · pop · notification · whip · page-turn · switch · shutter · etc. (11 nativos do @remotion/sfx + aliases semânticos)
- **Música** via `audio.music` global: arquivo em `public/audio/X.mp3`, com fade in/out + ducking automático sob voz (configurável via `audio.duck` e `audio.duckRamp`). Default carrega trilha do `default-storyboard.js` em todo reel novo.
- **Voiceover** via `scene.voiceover.text`: IA gera o texto → ElevenLabs (`eleven_multilingual_v2`) gera MP3 pt-BR → mixado no render. Voz padrão `RVmX026jCrF5VqUvpCk0` (library voice — requer plano Starter+). Outras documentadas em `.env.example`. Por cena: `voiceover.voiceId` e `voiceover.speakingRate`.

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
   │                                    │  1. ElevenLabs TTS por cena (~5-10s)
   │                                    │  2. Escreve out/.tmp/X.props.json
   │                                    │  3. spawn `remotion render --props=... --gl=angle`
   │                                    │  4. Lê out/{id}.mp4
   │  ← 200 video/mp4                   │
   │◀───────────────────────────────────┤
   │  Browser baixa MP4                 │
```

Tempo típico de render no Mac M-series: **~70-90s** pra reel de 60s (1623 frames @ 30fps) com `--gl=angle` (hardware GPU). Com `--gl=swangle` (SwiftShader software WebGL) leva ~9 min.

## Histórico (R1 → R13)

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
| R12 | 2026-05-16 | **Grid view 4×3** (12 thumbs com click → edit IA) + LockedThumbs PNG (resolve "bolinha fantasma" do Thumbnail) + identidade locked/custom (6+6) + LowerThird v3 (imagem+glass+Lottie) + Quote+Chapter+BrandIntro com imagens reais + light-leak overlay no chapter |
| R13 | 2026-05-18 | **Slides custom padronizados** (visual fixo + IA só preenche texto): Headline (cap02 substituiu stat-card) · Keyword polish (textura verde+ícone Iconify por tema) · FeatureList light theme · Scenario (cap06 substituiu data-chart) · WhatsAppChat (cap09 substituiu kw-direct) · 4 transições novas (glass-frost, iris-square, drift-fade, light-streak) · word-grouping em CharReveal/TypewriterText/ScaleBounceText (sem mid-word breaks) · cap04 light-leak hueShift 30→110 (verde) · cap03 flash→cinematic-blur · AppCard chrome titles UPPERCASE com hífen |
| R14 | 2026-05-19 | **Áudio completo — narração + música**. _Voz_: `RVmX026jCrF5VqUvpCk0` (library voice ElevenLabs, calma/editorial, requer Starter+ — Free tier bloqueia library voices via API) · prompt do Gemini reescrito com **diretrizes por tipo de cena** (orçamento de palavras: 4s→8 / 5s→10 / 6s→13) · 5 cenas SILENCIOSAS por design (keyword, ambos chapters, whatsapp-chat, quote) · `voiceover-core.mjs` estima duração por chars (~15 chars/s pt-BR, provider-agnóstico) e flagga overflow com `overlapSec` quando estoura janela − 0.4s · logs `Xs/Ys` por cena no CLI e Vite middleware. _Música de fundo_: campo `audio.music` no storyboard (path relativo a `public/`), com fade in/out + loop · default ativo em `default-storyboard.js` puxa de `public/audio/` (4 tracks country-western Pixabay disponíveis) · validator herda `audio` do default ao processar reel da IA · guardrail em `downloadMotionReelMP4` injeta `audio` se faltar (reels antigos em memória). _Ducking_: música cai automaticamente para `baseVol × duckLevel` (default 0.35) durante voz, com ramp de 150ms — configurável via `audio.duck` e `audio.duckRamp`. _Provider TTS validado_: testamos Google Cloud TTS (Neural2-C, free tier) como alternativa mas soou robótica demais — voltamos pra ElevenLabs por qualidade. |
| R15 | 2026-05-19 | **Storage R2 — música, voiceover e MP4s vão pra Cloudflare via Worker compartilhado do studio**. Descoberto que o studio já tinha infra completa: auth Supabase (email/senha) + R2 via Worker (`cropware-r2-worker.leonardoterra-comercial.workers.dev`) usado pelo upload de imagens dos posts. Aproveitamos esse Worker existente sem criar Edge Function nova. _Paths R2_: `images/studio/_motion-reel/audio/{filename}.mp3` (compartilhado), `.../voiceover/{userId}/{hash}.mp3` (per-user, cache reusável entre reels), `.../reels/{userId}/{reelId}.mp4` (per-user). _Voiceover_: `voiceover-core.mjs` faz PUT no Worker após cada geração/cache-hit, `scene.voiceover.url` recebe URL R2 absoluta (em vez de path local); fallback gracioso pro path local se R2 falhar. _MP4 outputs_: Vite middleware faz upload pós-render e devolve JSON `{ url, sizeMb }`; client baixa direto da CDN Cloudflare (em vez de stream binário pelo Vite); fallback pra streaming se R2 falhar. _Música default_: subida via `npm run reel:upload-music`, URL R2 absoluta no `default-storyboard.js`; `public/audio/` agora gitignored. _Cliente_ passa `userId` (`currentUser.id` do Supabase Auth) pro `/api/render-reel`. |

## Pendências (não escopadas, próximos passos)

### Visual / UX
- Polimentos visuais finais (alinhamentos, escolha de cores em casos específicos)
- Re-render das locked thumbs após cap04 mudar pra light-leak hueShift 110 (`npm run reel:thumbs`)

### Funcional
- UI in-app pra upload de música de fundo (hoje só via edição manual de JSON)
- UI in-app pra editar storyboard JSON visualmente (hoje só via IA + console)
- Render Lambda em vez de local (pra escala)
- Mais skins de paleta (light mode, monocromático, etc.)

### IA / Prompts
- Validar manualmente se o prompt da IA está respeitando as novas regras (preferir cinematic-blur, hueShift ≥100 pra light-leak). R14 já implementou: guardrails no validator migram stat-card→headline e data-chart→scenario silenciosamente, e normalizam flash→cinematic-blur automaticamente.

### Áudio / Narração — verificação pós-R14
- **Assinar ElevenLabs Starter ($5/mo)** pra destravar a library voice `RVmX026jCrF5VqUvpCk0` via API. Depois disso, rodar `npm run dev` → "Gerar Reel" → "Baixar MP4" e confirmar qualidade da voz.
- **Validar timing** clicando "Baixar MP4" no app: o log deve mostrar `Xs/Ys` por cena e zero overflow. Se a IA estourar alguma janela, considerar truncamento automático em `voiceover-core.mjs` (cortar texto na última pontuação que cabe) OU passar `speakingRate: 1.05` por cena que estourar.
- **Validar discurso por tipo de cena** — abrir 2-3 reels gerados pelo Gemini e checar se: (a) keyword/chapter/whatsapp-chat/quote estão SEM voiceover; (b) headline parafraseia em vez de ecoar literal; (c) scenario tem ritmo contemplativo; (d) end-card diz "arroba cropware ponto app" por extenso. Se a IA escapar das regras, reforçar com exemplos negativos no prompt.
