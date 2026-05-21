# Motion Reel — Estado Atual (R17)

Gerador de Reels 9:16 (1080×1920) integrado ao Cropware Studio. **Stack:**
Remotion 4 + React 19 (cenas + animações) · Gemini (IA gera storyboard) ·
ElevenLabs (voiceover TTS pt-BR, plano Starter+) · `@remotion/sfx` + SFX R2 ·
`@iconify/react` + Lottie/AnimatedIcons · Vite middleware com progresso NDJSON
para render MP4.

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
# Ações → "Baixar MP4" → dialog mostra andamento (voiceover/cache,
# render frames, upload/baixar) → MP4 baixa direto pelo browser.

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
│   ├── sfx.js                    Mapping de nomes → URLs + volumes default por SFX
│   ├── themes.js                 R16 — catálogo de temas per-slide-type (editorial/vibrante/claro)
│   ├── keyword-icons.js          Curadoria de ícones animados keyword + Lottie local
│   ├── voiceover-core.mjs        TTS ElevenLabs reusável (CLI + middleware)
│   ├── default-storyboard.js     Storyboard demo 60s (12 cenas)
│   ├── mount.jsx                 Player + Grid view (12 thumbs 4×3) + Preview modal
│   └── scenes/                   12 tipos:
│       ├── BrandIntro.jsx        FIXA — cap01 "Conheça"
│       ├── Headline.jsx          custom — cap02 kicker + headline editorial
│       ├── Keyword.jsx           custom — texture verde + ícone + word
│       ├── Quote.jsx             custom — cap10 lista de 5 palavras por tema
│       ├── FeatureList.jsx       custom — cards + textura real de papel
│       ├── Scenario.jsx          custom — cap06 paragrafo narrativo
│       ├── WhatsAppChat.jsx      custom — cap09 iPhone mockup conversa
│       ├── EndCard.jsx           FIXA — cap12 logo + tagline + handle
│       ├── Cta.jsx               legado (não usado no default 60s)
│       ├── Chapter.jsx           FIXA — cap04, cap07 marker "Capítulo NN"
│       ├── LowerThird.jsx        FIXA — cap11 WhatsApp CTA "Fala com a gente"
│       └── AppCard.jsx           custom — cap08 mockup weather/satellite/etc
├── scripts/
│   ├── generate-voiceover.mjs        CLI wrapper de voiceover-core.mjs
│   ├── render-locked-thumbs.mjs      R12 — gera PNGs das cenas locked em public/thumbs/
│   ├── upload-motion-reel-music.mjs  R15 — sobe MP3s de public/audio/ pro R2 via Worker
│   └── upload-motion-reel-sfx.mjs    R16 — sobe SFX pro R2 (batch dir ou arquivo)
└── public/
    └── thumbs/                   PNGs pré-renderizadas das locked scenes
                                  (01-intro, 04-chapter-1, 07-chapter-2,
                                  11-lower-third, 12-end-card)
```

## Capacidades por cena

### Storyboard default 60s — 12 cenas em grade 4×3 (R12)

5 cenas **FIXAS** (locked: true — identidade Cropware, hardcoded nos componentes) +
7 cenas **CUSTOMIZÁVEIS** (locked: false — IA preenche conteúdo por tema).

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
| 10 | 44.0→50.0   | quote           | custom   | 5 palavras-chave aderentes ao tema |
| 11 | 50.0→55.0   | lower-third     | **FIXA** | WhatsApp Lottie + "Fala com a gente" |
| 12 | 55.0→60.0   | end-card        | **FIXA** | Logo + tagline + handle |

### Catálogo completo de tipos

| Tipo | Visual | Quando usar |
|---|---|---|
| brand-intro | Hero `conheca-hero-bg.webp` + Ken Burns + overlay verde + CONHEÇA typewriter + logo + tagline | Abertura |
| headline | Imagem `conheca-solucao-bg.webp` + Ken Burns + glass slate + kicker + headline + accent bar | Headline editorial |
| keyword | Textura verde tintada (multiply) + 1 ícone Iconify animado + word Space Mono + underline | Puxar atenção |
| quote | Imagem por tema (`og-bg.webp`, `conheca-gd-bg.webp`, `conheca-solucao-bg.webp`) + Ken Burns + overlay temático + 5 palavras com checks animados | Síntese temática |
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

**Compatibilidade**: `light-leak` legado agora cai em `drift-fade` para evitar o vazamento roxo/laranja fora da identidade Cropware.

**Notas IA**: evitar `flash` (jarring) — preferir `cinematic-blur` ou `fade` em substituição.

## Overlays decorativos (7)

rotating-rings · pulse-circle · particle-drift · line-draw · curve-trace · light-streak · vignette-breath

Nota: `feature-list` ignora overlays no renderer para evitar cantos/linhas herdados de storyboards antigos.

## Áudio

- **SFX** via `transitionIn.sfx`: whoosh · click · ding · vine-boom · impact · riser · pop · notification · whip · page-turn · switch · shutter · etc. Volumes default ficam em `sfx.js` e são clampados no renderer para não atropelar música/voz.
- **Música** via `audio.music` global: arquivo em `public/audio/X.mp3`, com fade in/out + ducking automático sob voz (configurável via `audio.duck` e `audio.duckRamp`). Default carrega trilha do `default-storyboard.js` em todo reel novo.
- **Voiceover** via `scene.voiceover.text`: IA gera o texto → ElevenLabs (`eleven_multilingual_v2`) gera MP3 pt-BR → mixado no render. O cache por texto/voz/modelo evita gastar créditos de novo ao baixar MP4 sem mudar a narração. Voz padrão `RVmX026jCrF5VqUvpCk0` (library voice — requer plano Starter+). Outras documentadas em `.env.example`. Por cena: `voiceover.voiceId` e `voiceover.speakingRate`.

## Visual R17

- **Reels salvos apenas**: modo Motion não mostra mais storyboard legado quando a lista de reels está vazia.
- **Gerador de Reel**: modal esconde chips de personagens/cenas e upload de imagem, porque o Motion Reel usa banco de imagens/assets e não geração de imagem por cena.
- **Keyword**: ícones estáticos de agro (`twemoji:noto:seedling/ear-of-corn`) são normalizados para Lottie `animatedicons:sustainability`, renderizado outline-only (`fillOpacity=0`) e tintado por tema.
- **FeatureList**: usa textura real `public/motion-reel/textures/crumpled-paper.jpg` nos três temas; tema vibrante usa fundo claro + cards verdes; `cardFg`, `cardIconBg`, `cardIconColor` e `cardShadow` são tokens por tema.
- **Tema claro**: headline/keyword ajustados para contraste melhor, menos sombra e acentos alinhados à identidade.

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
| R16 | 2026-05-19 | **Variantes estéticas + dialog redesign + SFX expandido + sincronia visual** (6 fases / 6 commits). _Fase 1_: slide 03 keyword sem ponto no default e regra dura no prompt Gemini (UMA palavra, sem pontuação) · SFX agora dispara no MEIO da transição por default (alinha com pico visual de cinematic-blur, ring-tunnel, light-streak em `progress=0.5`); override via `tIn.sfxOffset` (segundos, negativo antecipa, positivo atrasa) · `console.warn` quando `resolveSfxUrl` retorna null. _Fase 2_: novo `motion-reel/themes.js` com 3 temas (`editorial` baseline, `vibrante` greenBright dominante, `claro` cream/white) e estrutura **per-slide-type** pra evitar conflitos visuais (ex: tema vibrante em Keyword usa greenForest em vez de greenBright); `resolveTheme(storyboard, scene)` faz cascata scene.theme → storyboard.theme → 'editorial'; wiring em MotionReel.jsx propaga prop `theme` no `<Comp {...scene} theme={...} />`. _Fase 3_: 6 slides custom (Headline, Keyword, FeatureList, Scenario, AppCard, WhatsAppChat) refatorados pra consumir prop `theme` com fallback defensivo `T = theme \|\| FALLBACK`; validator aceita `parsed.theme` + `scene.theme` com sanitização; default-storyboard ganha `theme: 'editorial'` explícito; WhatsApp mockup interno fica canônico (verde #25D366), só varia bg externo + tint. _Fase 4_: redesign do `#mrSceneEditModal` seguindo padrão `.gen-modal` canônico — adiciona seção "Tema visual" com 3 cards clicáveis (preview gradient + nome + descrição, card ativo com border verde + box-shadow); botão "Desfazer" (`#mrSceneEditUndo`) replicando pattern `_undoStack` dos posts (stack por cena, cap 5, FIFO); modal não fecha mais automaticamente após Aplicar (fica aberto pra empilhar mais ajustes); 5 funções novas: `_pushMrSceneSnapshot`, `_syncMrUndoButton`, `_syncMrThemeCardSelection`, `applyMrSceneTheme`, `undoLastMrSceneEdit`. _Fase 5_: novo script `scripts/upload-motion-reel-sfx.mjs` (batch dir ou arquivo, output imprime entries prontas pra SFX_MAP); npm script `reel:upload-sfx`; 14 SFX curados no Pixabay subidos pro R2 em 5 categorias semânticas — WHOOSH (3: soft/fast-cinematic/deep), IMPACT (3: deep-cinematic/snap-dry/thud), AMBIENT (2: wind-soft/field-nature), ORGANIC (3: leaf-rustle/paper-turn/wood-crack-soft), TECH/UI (3: tap-soft/confirm-modern/digital-beep-clean); SFX_MAP atualizado em `motion-reel/sfx.js` mantendo legacy `@remotion/sfx` pra compat. _Fase 6_: prompt Gemini reescrito com catálogo SFX por categoria + pareamentos por tipo de cena (brand-intro=sem SFX, keyword=impact-snap-dry, scenario=ambient-wind-soft com sfxOffset -0.3, end-card=impact-thud) + bloco TEMA VISUAL (escolha global + override por cena, guidelines por mood) + regra dura keyword (UMA palavra, máx 12 chars, sem pontuação). |
| R17 | 2026-05-20 | **Polimento operacional + Motion Reel visual atual**. Remove fallback de reel legado quando não há reels salvos; gerador de Reel fica específico para Motion (sem chips de personagem/cena nem upload de imagem); endpoint `/api/render-reel` passa a emitir progresso NDJSON e o app mostra dialog com etapa, percentual e tempo decorrido. `voiceover-core.mjs` adiciona cache por texto/voz/modelo para evitar gastar ElevenLabs ao baixar novamente sem mudar narração. SFX recebe volumes default e clamp no renderer para ficar discreto frente a música/voz. `light-leak` legado passa a usar `drift-fade`, removendo transição roxa fora da marca. Slide 03 `keyword` ganha Lottie local do AnimatedIcons (`animatedicons:sustainability`) com outline-only e tint por tema; ícones estáticos agro são normalizados para esse asset. Temas claro/editorial/vibrante foram calibrados em `headline`, `keyword` e `feature-list`; o slide 05 ignora overlays para eliminar cantos/linhas herdados e usa textura real de papel amassado em `public/motion-reel/textures/crumpled-paper.jpg`. |

## Pendências (não escopadas, próximos passos)

### Funcional
- **UI in-app pra upload de música de fundo** — hoje só via `npm run reel:upload-music`. Botão "Upload música" no menu Ações com file picker + endpoint Vite + atualiza `audio.music` automaticamente.
- **UI in-app pra editar storyboard JSON visualmente** — hoje só via IA (dialog) + console pra ajustes finos. Vale um editor de schema básico (campos por tipo, color pickers).
- **Render Lambda em vez de local** — quando escalar pra multi-user. Lambda exige R2 (já temos), só falta o trigger.
- **Mais skins de paleta** — explorar tema `mono` (preto+branco puros) ou `agro-warm` (terra/amber dominante) além dos 3 atuais (editorial/vibrante/claro).

### IA / Prompts
- **Validar manualmente o prompt** — gerar 2-3 reels com temas distintos (NDVI, clima, geração demanda) e auditar: (a) keyword sem ponto; (b) cenas silenciosas respeitadas; (c) theme aplicado coerentemente; (d) SFX do catálogo novo escolhidos por categoria semântica; (e) sfxOffset usado em ambient-*.
- **Considerar guardrails extras** se a IA continuar escapando das regras (truncar word automaticamente se vier com pontuação? rejeitar SFX fora do catálogo?).

### Visual / UX
- Polimentos visuais finais (alinhamentos, cores em casos específicos por tema).
- Eventualmente gerar **novas imagens de fundo** se os 3 temas mostrarem que alguma cena ficou visualmente fraca em alguma combinação (ex: `claro` precisar de bg mais limpo no Scenario).
- Re-render das locked thumbs se a paleta dos temas afetar visualmente (hoje não afetam — locked = editorial hardcoded).
