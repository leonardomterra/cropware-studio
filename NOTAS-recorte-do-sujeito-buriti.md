# Recorte do sujeito acima do overlay — Buriti

> Ideia levantada em 04/08/2026 para o piloto da Agrotécnica Buriti. **Ainda não
> implementada.** Este arquivo guarda o diagnóstico e as opções para não perder o
> contexto entre sessões.

---

## 1. O efeito que queremos reproduzir

Nos posts reais do Instagram da Buriti, o assunto principal (o homem na lavoura,
a planta de milho) aparece **por cima** do overlay verde, enquanto o resto da
mesma foto fica **por baixo**. Dá a sensação de que o elemento "sai" da peça.

**Diagnóstico:** não são duas imagens nem recorte manual elaborado. É **uma única
foto usada duas vezes**:

```
1. foto completa            (fundo)
2. overlay verde            (por cima da foto)
3. a MESMA foto, mascarada  (só o sujeito, acima do overlay)
```

Por isso o sujeito continua perfeitamente encaixado na cena — ele nunca saiu
dela. Só é preciso **uma máscara alfa** do assunto.

---

## 2. A camada de render (a parte fácil)

No `renderBuritiStyle` entra uma camada entre `.bur-shape` e `.bur-content`:

```
.bg  ->  textura  ->  .bur-grade  ->  .bur-shape  ->  [.bur-subject]  ->  .bur-content
```

**Cuidado que quebra o efeito:** a camada do sujeito precisa ter *exatamente* o
mesmo enquadramento do fundo. Poucos pixels de diferença e ele "desencaixa" —
o olho percebe na hora.

**Solução:** não usar `<img>`. Usar outra `div` com `background-image` e as
mesmas propriedades de `background-size` / `background-position` da `.bg`. O
alinhamento passa a ser garantido por construção.

O `html-to-image` (usado no download) exporta PNG com alfa sem problema.

Persistência: guardar as duas imagens no post (`bgImage` + `bgSubject`), ambas
indo para o R2 pelo caminho que já existe em `_cloneWithR2Images`.

---

## 3. Opções para gerar a máscara

| Caminho | Como | Custo | Ponto fraco |
|---|---|---|---|
| **Gemini** | pedir o assunto com fundo transparente | já pago | **incerto** — pode não devolver alfa de verdade |
| **Modelo no navegador** (transformers.js + BiRefNet / RMBG) | client-side, WebGPU | zero por imagem | baixa 40–200MB de modelo na 1ª vez; conferir licença (BiRefNet permissiva; RMBG-1.4 é não-comercial) |
| **API hospedada** (remove.bg, fal.ai, Replicate, Photoroom) | edge function, igual ao proxy do Gemini | ~US$ 0,02–0,20 por imagem | custo recorrente + mais uma dependência |
| **Mapa de profundidade** (Depth Anything) | profundidade vira máscara | zero, client-side | não é recorte: vira efeito de névoa — combina com a linguagem orgânica |
| **MediaPipe** | segmentação de pessoa | zero, leve, rápido | só resolve gente, não planta |

---

## 4. Ordem de ataque

1. **Gemini primeiro** — não por ser a melhor opção, mas porque o encanamento já
   existe (`/functions/v1/gemini`, modelo `gemini-3.1-flash-image-preview`). É
   barato de descobrir. → **ver seção 6 para o resultado do teste**
2. Se falhar, **BiRefNet no navegador**: sem custo por imagem, sem chave nova,
   boa qualidade em assunto único com fundo desfocado.
3. API hospedada só se a qualidade das duas acima não servir.

---

## 5. O que mais aumenta a taxa de acerto

Não é o modelo de segmentação — é **o prompt da imagem**. Como nós já geramos a
foto, dá para pedir composições que se separam bem:

- um assunto único e claro;
- profundidade de campo rasa;
- contraste entre sujeito e fundo;
- sem folhagem se confundindo com a lavoura atrás.

Isso muda mais o resultado do que trocar de modelo.

**Falha esperada em ~1 de cada 4–5 imagens**, principalmente em:
- estruturas finas (folha de milho contra outras folhas, aba de chapéu, cabelo);
- assunto encostando na borda do recorte orgânico.

→ Prever um **toggle de "recorte do sujeito" por post**. Desligar é mais rápido
que consertar.

---

## 6. Resultado do teste com o Gemini — **FUNCIONA** (testado em 04/08/2026)

Testado direto contra `/functions/v1/gemini`, modelo
`gemini-3.1-flash-image-preview`, com o mesmo encanamento do app.

### 6.1 O que NÃO funciona

**Pedir recorte com fundo transparente não funciona.** O Gemini devolveu
`image/jpeg` nas três tentativas — JPEG não tem canal alfa, então não existe
transparência a recuperar. Pedir "PNG with a real alpha channel" não muda isso.

### 6.2 O que funciona: pedir a MÁSCARA, não o recorte

Em vez do recorte, pedimos um **stencil preto e branco** e usamos ele como canal
alfa da foto original. O alfa passa a ser construído por nós — o Gemini só
precisa acertar a silhueta.

Prompt que funcionou (manter literal):

```
Produce a binary segmentation matte of this photograph, at the same resolution and framing.
Every pixel belonging to <ASSUNTO> must be PURE WHITE (#FFFFFF).
Every other pixel must be PURE BLACK (#000000). No grey, no anti-aliasing, no texture, no shading. A pure black-and-white stencil.
```

Enviado como `[{inlineData: <foto base>}, {text: <prompt acima>}]`.

### 6.3 Medições

- Máscara **99,7% binária** (77,1% preto / 22,6% branco / 0,3% cinza).
- **Resolução e enquadramento preservados** (928×1152 igual à base) nos dois
  testes — é o ponto mais crítico e ele se sustentou.
- **Pessoa:** acompanhou boné, rabo de cabelo, braços, mãos, a folha na mão e
  até o vão entre os braços.
- **Planta (o caso difícil):** acompanhou cada folha da plântula contra a
  lavoura desfocada ao fundo.

> Amostra de 2 casos, não é taxa de acerto. Serve para dizer que a abordagem é
> viável, não que é infalível.

### 6.4 Pipeline a implementar

```
1. gera a foto (já existe)
2. 2ª chamada: foto + prompt do stencil  -> matte JPEG
3. threshold(128) no matte
4. matte vira o canal alfa da foto  -> PNG com transparência
5. guarda em postData.bgSubject (vai para o R2 junto com bgImage)
6. render: nova camada entre .bur-shape e .bur-content
```

**Custo:** 2 chamadas de imagem por post em vez de 1.

### 6.5 Ajustes que já sabemos que serão necessários

- **Suavizar o alfa em 1–2px.** A máscara vem dura, sem anti-aliasing; sem isso
  a borda do recorte fica "carimbada" sobre o overlay.
- **Toggle por post** (seção 5) — continua valendo.
- O assunto do stencil precisa ser **descrito** ("the single young corn
  seedling in the foreground", "the woman including her cap and the leaf she
  holds"). Vale derivar essa descrição do mesmo JSON que gera o `imagePrompt`.

### 6.6 Conclusão

Não precisamos de BiRefNet, remove.bg nem infra nova. As opções da seção 3
ficam como plano B se a consistência cair em produção.

---

## 7. Descoberta ao testar no post real (importante)

O recorte foi montado dentro do `renderBuritiStyle` de verdade, com a camada
`.bur-subject` entre `.bur-shape` e `.bur-content`. Dois aprendizados:

### 7.1 O alinhamento funcionou

A camada como `div` com `background-size:cover` + `background-position:center`
idênticos aos da `.bg` encaixou perfeitamente, sem deslocamento. Confirma a
decisão da seção 2 — **não usar `<img>`**.

### 7.2 Nenhum dos 5 recortes atuais produz o efeito

Testado primeiro com `wave-top`: **diferença zero**. Depois com `veil`:
praticamente zero também.

O motivo é estrutural: o efeito só existe onde o assunto **cruza** o overlay.
- `wave-top` / `wave-bottom` / `diagonal` / `claro`: o painel cobre só uma
  faixa, e o assunto fica justamente na área livre.
- `veil`: pior ainda — a máscara radial deixa o **centro** transparente, que é
  exatamente onde o assunto está.

**Consequência:** para usar o recorte é preciso um **6º recorte, "integral"** —
verde profundo sobre a imagem inteira em `multiply` (o Modelo B do manual, que
hoje não temos de fato). É sobre ele que o sujeito emerge. Foi assim que o teste
final funcionou, e é assim que os posts reais da Buriti são montados.

> Ou seja: o recorte do sujeito **não é um ajuste do que existe** — ele vem
> acompanhado de um novo layout. Considerar isso no escopo.

### 7.3 Suavização do alfa

Aplicado blur de 1.5px no canal alfa antes de compor. Sem isso a borda fica
carimbada. Com isso, encosta bem no overlay.
