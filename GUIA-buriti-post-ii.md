# Guia — Buriti Post II

> Modelo de post do Instagram da Agrotécnica Buriti em que a **imagem é a
> protagonista**: véu verde sobre a foto inteira, uma janela geométrica revelando
> a foto em cor natural, e o assunto recortado avançando para fora da janela.
>
> Complementa [NOTAS-recorte-do-sujeito-buriti.md](NOTAS-recorte-do-sujeito-buriti.md),
> que documenta a investigação técnica do recorte.

---

## 1. Estrutura de camadas

A ordem é o que produz o efeito. Alterar a ordem quebra a peça.

| z | Camada | Papel |
|---|---|---|
| 0 | `.bg` | a foto completa |
| 2 | `.b2-veil` (×2) | véu verde integral em `multiply` + gradiente de topo que sustenta o texto |
| 3 | `.b2-window` | a MESMA foto, recortada pela forma → cor natural dentro da janela |
| 4 | `.b2-outline` | contorno da forma + linha "fantasma" deslocada |
| 5 | `.b2-subject` | o assunto recortado, **sem clip** — a parte dele que passa da janela avança sobre o verde |
| 7 | `.b2-content` / `.b2-logo` / `.b2-foot` | texto e assinatura |

**Por que o sujeito é desenhado inteiro e não só a parte de fora:** dentro da
janela ele coincide pixel a pixel com `.b2-window`, então é invisível ali. Fora,
aparece. Isso dispensa qualquer cálculo de interseção entre o assunto e a forma.

**Encaixe:** `.b2-window` e `.b2-subject` usam `background-size:cover` e
`background-position:center` **idênticos aos da `.bg`**. Nunca trocar por `<img>`
— o alinhamento deixa de ser garantido e o assunto desencaixa alguns pixels.

---

## 2. Regra de ouro: tema e imagem são acoplados

Esta peça **só funciona com foto de foco isolável**. Um tema que não rende um
assunto único e recortável não pode entrar no Buriti II.

Por isso cada pilar em `BURITI_TEMAS` declara `sujeitos: [...]` — a lista de
focos fotografáveis e recortáveis daquele pilar.

> **Ao criar um tema novo, é obrigatório declarar os `sujeitos`.**
> Sem isso o tema até gera texto, mas a imagem sai sem foco definido e o recorte
> falha (ou recorta a lavoura inteira, que é o mesmo que não recortar).

### O que é um bom sujeito

| Bom | Ruim | Por quê |
|---|---|---|
| "uma plântula de milho recém-emergida" | "uma lavoura de milho" | lavoura não tem silhueta |
| "duas mãos em concha com solo" | "o solo da área" | sem contorno definido |
| "um agrônomo agachado segurando terra" | "a equipe técnica" | mais de um foco |
| "uma espiga madura na mão" | "a colheita" | abstrato demais |

Regra prática: **se você não consegue desenhar o contorno com um traço só, não é
um sujeito válido.**

---

## 3. O prompt da imagem

O acerto do recorte depende mais do prompt da foto do que do modelo de
segmentação. `buildBuritiIISystemPrompt` exige:

- **um único** assunto em primeiro plano, nítido, centralizado e **inteiro** no
  enquadramento — nunca cortado pela borda;
- profundidade de campo rasa, com o fundo nitidamente desfocado;
- **contraste de silhueta** entre assunto e fundo (o assunto não pode se
  confundir com a folhagem atrás);
- metade superior mais limpa, porque é onde entra o texto.

---

## 4. Geometria da janela

Quatro formas, definidas em `BURITI_II_FORMAS` no espaço 1080×1350:

| Forma | Quando usar |
|---|---|
| `quadro` | quadrilátero inclinado — serve para quase tudo |
| `pentagono` | topo quebrado — bom para cena com horizonte |
| `triangulo` | aponta para cima — bom para foco vertical (planta, pessoa em pé) |
| `losango` | central — bom para objeto/detalhe (mão, espiga, raiz) |

Detalhes de implementação:

- **Todas extravasam as bordas** laterais e a base. A janela precisa ler como um
  plano recortado, não como um adesivo flutuando no meio da arte.
- **Cantos arredondados** via `b2RoundedPolyPath`, que substitui cada vértice por
  uma curva quadrática. Sem isso a forma fica com bico duro.
- **Inclinação** vem de um PRNG semeado pelo `post.id` (±7°): a mesma peça é
  sempre igual, mas peças diferentes têm ângulos diferentes — o feed não fica
  repetitivo sem precisar de ajuste manual. `buritiIITilt` sobrescreve.
- **Contorno**: a linha da própria forma mais uma cópia deslocada
  (`buritiIIOutlineOffset`, padrão 16px) em opacidade menor. É o acabamento das
  peças de referência.

---

## 5. Pipeline de geração (3 passos)

```
1. Gemini texto  -> hook, complement, forma, subject (em inglês), legenda...
2. Gemini imagem -> a foto base
3. Gemini imagem -> STENCIL preto e branco do subject
                    -> threshold + blur 1.5px  -> canal alfa  -> PNG
                    -> postData.bgSubject
```

**O passo 3 falha de forma segura:** se a máscara não vier, a peça continua
válida — fica só a janela, sem o assunto avançando. O usuário vê um aviso.

**Persistência:** `bgSubject` é um data URI e sobe para o R2 automaticamente —
`replaceDataImagesWithR2Urls` percorre o objeto inteiro procurando data URIs.
Não precisa de tratamento especial.

**Custo:** 3 chamadas por post (1 texto + 2 imagem), contra 2 do Buriti I.

---

## 6. Texto reduzido — de propósito

O Buriti I tem kicker + título + subtítulo + card de apoio. O II tem **só hook +
complemento curto**, centralizados, com a logo no topo:

- hook: 4 a 9 palavras;
- complemento: **máximo 16 palavras**, uma frase.

Isso não é economia — é para a imagem trabalhar. Se o texto crescer, ele invade a
janela e o efeito se perde.

---

## 7. Limitações conhecidas

- **Estruturas finas** (folha de milho contra outras folhas, aba de chapéu,
  cabelo solto) são onde o recorte erra. Existe o toggle **"Foco recortado"** no
  painel: desligar é mais rápido que consertar.
- **Assunto encostando na borda** da arte fica com corte reto e denuncia o
  recorte.
- Se o hook vier longo demais, ele encosta na janela. O gradiente de topo dá
  alguma folga, mas o controle real é o limite de palavras no prompt.

---

## 8. Onde mexer no código

| O quê | Onde |
|---|---|
| Formas da janela | `BURITI_II_FORMAS` |
| Arredondamento / rotação | `b2RoundedPolyPath`, `b2Rotate`, `buritiIIWindowPath` |
| Render | `renderBuritiIIStyle` |
| Prompt do post | `buildBuritiIISystemPrompt` |
| Prompt do stencil | `buildBuritiMattePrompt` |
| Máscara → alfa | `callGeminiMatte`, `buildSubjectCutout` |
| Temas e sujeitos | `BURITI_TEMAS` (campo `sujeitos`) |
| Estilo (CSS) | bloco `BURITI II` |

---

## 8.1 Buriti Post III — a variante de divisa suave

O **Post III** é uma duplicata do II criada para experimentar a borda da janela
sem congelar o II. A única diferença conceitual:

| | Post II | Post III |
|---|---|---|
| Divisa da janela | `clip-path` — aresta dura | máscara SVG borrada — degradê |
| Controle | — | **Suavidade da Janela** (0–240px, padrão 90) |

Em `feather = 0` o III fica idêntico ao II. É a mesma ideia da "Suavidade da
Borda" do Buriti I, aplicada à janela geométrica.

**Implementação:** `mask-image` com um SVG data-URI que contém a forma passada
por `feGaussianBlur` (`buritiIIIMaskUri`). Não dá para usar `clip-path`, que é
binário por definição — por isso a troca para máscara.

### O que é compartilhado (cuidado ao editar)

II e III **compartilham**: geometria das formas (`BURITI_II_FORMAS`), prompt
(`buildBuritiIISystemPrompt`), tipografia e layout (seletores CSS agrupados),
controles de forma/véu/linha, e o pipeline de recorte do sujeito.

II e III **não compartilham**: a função de render (`renderBuritiIIStyle` x
`renderBuritiIIIStyle`) e a coleção de posts.

> Mexer no CSS agrupado ou nas formas afeta os DOIS. Se o III precisar divergir
> em tipografia ou geometria, separe os seletores antes de alterar.

---

## 8.2 Modelos comemorativos

Além dos posts editoriais (I, II, III), o piloto tem modelos **comemorativos**.
Ordem acordada: **aniversariantes → datas comemorativas → outras datas especiais**.

### Aniversariantes (RH) — pronto

Sem IA: texto padrão e neutro em gênero, o RH preenche nome e data e envia a foto.

- **Retrato circular**, não janela recortada. A primeira versão usava a silhueta
  do bolo como janela e ela **cortava o rosto** — retrato é vertical com o rosto
  no terço superior, bolo é largo e baixo, e o que sobra em cima são as velas.
- O bolo virou **marca-d'água atrás do retrato**, terminando antes do texto.
- Ícones 3D: **Microsoft Fluent Emoji** (MIT), empacotados em `assets/emoji-3d/`.
  Empacotados e não por URL porque o export usa html-to-image e imagem externa
  quebra por CORS.
- Nome em **Fraunces**; o resto em Poppins.

### Datas comemorativas — pronto

Com IA (título, complemento, imagem e recorte do sujeito). Herda a mecânica do
Post II, mas se diferencia **de propósito** em quatro eixos:

| | Post II / III | Datas comemorativas |
|---|---|---|
| Janela | recorte baixo, inclinado, sangrando nas laterais | **pórtico vertical** centralizado e contido |
| Texto | no topo | **no rodapé** |
| Acento | verde | **dourado** |
| Adornos | — | 6 ícones **Phosphor thin**, discretos |

Formas: `arco`, `oval`, `escudo`, `portal`.

> **A homenagem nunca é regional.** Vale para TODOS os modelos comemorativos,
> inclusive os que ainda vão ser feitos. O reconhecimento é a toda a categoria
> homenageada, em qualquer lugar — nada de "do Sudoeste Goiano", "da nossa
> região" ou "nossos clientes" no título/complemento. Quem é regional é a
> Buriti, que assina de onde é (o rodapé já traz as cidades); o homenageado não
> é delimitado. Homenagear só uma parte exclui o resto.
>
> Isso aconteceu de verdade: o **exemplo dentro do JSON do prompt** trazia "que
> faz o campo do Sudoeste Goiano acontecer", e o modelo copiou quase literal.
> Exemplo em prompt é imitado — cuidado redobrado com o que se escreve neles.

> **Datas oficiais não são geradas pela IA.** O seletor traz só o NOME da
> comemoração; a data é campo livre que o usuário escreve. O manual (§13) exige
> validar data oficial antes de publicar, e o prompt sempre devolve essa
> observação técnica.

### Outras datas especiais — pronto

Aniversário de cidade, de empresa parceira, da própria Buriti, de parceria, de
dirigente, dia de santo, feriado. **Estética de placa comemorativa** — o terceiro
vocabulário visual da família:

| | Aniversariantes | Datas comemorativas | Datas especiais |
|---|---|---|---|
| Enquadramento | retrato circular | pórtico vertical | **cartão horizontal** |
| Elemento herói | nome | foto + título | **número de anos** |
| Moldura | anéis do retrato | linha deslocada | **moldura dupla (certificado)** |

- **A IA escreve só a mensagem.** A foto é enviada pelo usuário: gerar imagem de
  uma cidade ou de um parceiro real levaria o modelo a inventar fachadas e
  marcos que não existem.
- O número de anos é opcional — dia de santo e feriado não têm número, e o
  layout se fecha sem ele.
- O prompt **proíbe dado histórico, ano de fundação e estatística**: a peça vai
  ao ar assinada pela empresa e não há como conferir o que o modelo afirmaria.
- Vale a mesma regra de abrangência da homenagem (acima).

---

## 9. Ideias para depois

- Mais formas (hexágono, forma orgânica livre).
- Deixar a IA escolher a forma a partir da **orientação** do assunto (vertical →
  triângulo; centrado → losango) em vez de só pelo tema.
- Sombra projetada suave sob o assunto recortado, para dar profundidade sobre o
  véu.
- Reaproveitar o recorte no Buriti I, no recorte "integral" que ainda não existe
  lá (ver seção 7.2 das NOTAS).
