---
name: Marmota Music
description: Ferramentas de prática para quem toca, num caderno pautado em pixel art onde a marmota toca e cada ferramenta é uma nota.
colors:
  ground: "#111715"
  surface: "#1b2220"
  soft: "#252d2b"
  line: "#3a403d"
  ink: "#dbdcd6"
  muted: "#9c958e"
  fur: "#6b625a"
  fur-grey: "#51524c"
  plate-hover: "#f2f1ec"
  now: "#8cc0ee"
  now-ink: "#0b1520"
  now-soft: "#1c2a37"
  target: "#f0a634"
  target-soft: "#3b2a0f"
  on-target: "#1a1208"
  selected: "#7bd3a0"
  bad: "#ef8f7c"
  wood: "#4a2c21"
  wood-2: "#5e3a2b"
  wood-3: "#3a2119"
  fret: "#e6e1d6"
  fret-shade: "#8d877b"
  steel: "#dfe2e6"
  bronze: "#c9a66b"
  inlay: "#efe7d6"
  pearl: "#ffffff"
  target-bright: "#f0a634"
  gesture-bright: "#ff7a2a"
  now-bright: "#7fb2e2"
  selected-bright: "#6fd39a"
  bad-bright: "#ef7f6c"
  on-bright: "#1a1208"
  app-ground: "#1e1e1e"
  app-bar: "#2e2e2e"
  app-ink: "#ededed"
  app-muted: "#9a9a9a"
  app-line: "#4a4a4a"
  app-now: "#4aa3ff"
  app-target: "#ff7a1a"
  app-selected: "#3ddc84"
typography:
  display:
    fontFamily: "Silkscreen, Inter, monospace"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.45rem, 2.6vw, 1.9rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  title-quiet:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Silkscreen, Inter, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
  stage:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.4rem, 9vw, 4.25rem)"
  tempo:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(4rem, 14vw, 6.5rem)"
  count:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.7rem, 9.3vw, 4.35rem)"
rounded:
  none: "0px"
  sm: "2px"
  base: "4px"
  md: "4px"
  pill: "4px"
spacing:
  px: "4px"
  gutter: "20px"
  header: "56px"
  container: "1120px"
  staff-gap: "12px"
  card-pad: "22px 26px 26px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "9px 16px 9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.plate-hover}"
    textColor: "{colors.ground}"
  button-tool:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-tool-hover:
    backgroundColor: "{colors.soft}"
  chip-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.on-bright}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  card-tool:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.card-pad}"
  card-tool-hover:
    backgroundColor: "{colors.soft}"
  badge:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 10px 7px"
  badge-next:
    backgroundColor: "{colors.target-soft}"
    textColor: "{colors.target}"
    typography: "{typography.label}"
    padding: "6px 10px 7px"
  nav-link:
    textColor: "{colors.muted}"
    padding: "8px 12px"
  nav-link-current:
    textColor: "{colors.ink}"
  header:
    backgroundColor: "{colors.ground}"
    height: "{spacing.header}"
---

# Design System: Marmota Music

## Overview

**Creative North Star: "O Caderno Pautado"**

O site é um caderno de música escuro onde mora uma marmota em pixel art. Tudo nasce dela: o fundo é o contorno grafite-esverdeado do desenho, as superfícies e linhas são o cinza e o taupe do pelo, o texto é o marfim do focinho. A pauta de cinco linhas é o elemento que organiza a página inicial: a marmota senta na linha de cima, a pauta toca, e as ferramentas ficam logo embaixo dela, numa fileira. A música não some da página.

O pixel é a matéria da marca e dos detalhes (marmota, notas, ícones, selos, cantos da placa "Abrir"), sempre em escala inteira e sem suavização. O que se lê continua liso, em Inter. A grade do mundo é de 4px: um pixel da arte vale 4px na tela. Cantos são vivos ou quase vivos, superfícies são planas, e todo movimento da casca da marca anda em degraus, como um sprite, nunca deslizando.

A densidade é baixa: um painel de entrada, não uma página de venda. Não há texto de instrução na interface; o que precisar de explicação vai no "?" (`src/components/Info.tsx`: botão quadrado de 44px com o ? em pixel; no computador, o mouse parado em cima "carrega" o ? de baixo para cima por 0,5s e só então abre o balão; levar o mouse ao balão enche a barra do topo e, em 1s, ele trava aberto (sair antes zera a barra; travado, fecha com Esc ou clique fora, e a barra cheia diz isso no hover). O balão é igual em todo estado: só a barra muda, e texto longo rola por dentro; clicar trava na hora e o foco pelo teclado abre na hora; no celular, o toque abre um modal; lista curta, ou parágrafos quando é uma história). Créditos, atalhos, avisos e a explicação de cada exercício moram nele.

**Key Characteristics:**
- Um tema só, escuro, com a paleta tirada da marmota.
- Pauta de cinco linhas como palco do hub, com as ferramentas logo embaixo.
- Pixel art só em múltiplo inteiro, `image-rendering: pixelated`, grade de 4px.
- Inter para tudo que se lê; Silkscreen nos selos de situação e no nome "Marmota Music" (logotipo).
- Cantos vivos (4px no máximo), superfícies planas, sem sombra fora de diálogo.
- Movimento em degraus (`steps()`), nunca com easing, na casca da marca.
- Laranja, azul e verde só com significado musical.

## Colors

Escuro, esverdeado e quente ao mesmo tempo: a marmota dá o neutro, e três cores de sinal dão o significado.

### Primary
- **Marfim do Focinho** (ink): a cor do texto e da ação principal. A placa "Abrir" é um bloco marfim com texto no tom do fundo; o traço do card e o traço sob o link atual acendem em marfim. No hover a placa clareia para **Marfim Aceso** (plate-hover).

### Secondary
- **Azul Tocando Agora** (now): o que está soando neste instante. No hub, a nota da pauta acende azul quando é a vez dela de tocar. Também é o anel de foco (3px) e a cor dos links do rodapé. **Azul Profundo** (now-ink) é o texto sobre ele; **Azul Sombra** (now-soft) é o fundo suave.

### Tertiary
- **Laranja Nota-Alvo** (target): a nota que se busca. No hub só aparece no selo "Próxima" (fundo **Laranja Sombra**, target-soft) e no ícone da ferramenta que vem a seguir.
- **Verde Selecionado** (selected): o que a pessoa escolheu (chips, segmentos, passos feitos).
- **Coral Erro** (bad): resposta errada nas ferramentas.

### Neutral
- **Grafite da Marmota** (ground): o fundo de tudo, inclusive do cabeçalho.
- **Superfície** (surface): cards e campos.
- **Sombra Suave** (soft): selos, linhas de separação de 2px, hover de card, cabeçalho.
- **Linha** (line): as cinco linhas da pauta e os contornos de 1px.
- **Cinza Quente** (muted): texto secundário, link de navegação em repouso.
- **Taupe do Pelo** (fur): ícones da lista de planejadas.
- **Cinza do Pelo** (fur-grey): o traço de 4px no topo do card em repouso.

### Braço da guitarra
- **Jacarandá, alpaca, osso, aço, bronze, madrepérola** (wood, wood-2, wood-3, fret, fret-shade, steel, bronze, inlay, pearl) e as versões claras dos sinais sobre a madeira (target-bright, gesture-bright, now-bright, selected-bright, bad-bright, com on-bright por cima). Existem só para desenhar o braço da guitarra. Nunca viram superfície de interface.

### Tela de app (celular)
- **Paleta do app Android** (app-ground, app-bar, app-ink, app-muted, app-line, app-now, app-target, app-selected): no celular, o afinador e o metrônomo copiam o Marmota Tuner, e estas cores (as do `colors.xml` do app) substituem o mundo da marmota naquelas telas. O desenho do afinador (canvas) espelha `TunerPainter.kt` na forma, mas lê as cores do CSS (`readTunerColors` em `painter.ts`): no computador sai na paleta da marmota (marfim, laranja, azul e verde do site), solto no fundo da página, sem caixa; no celular, a tela de app troca as variáveis e ele fica com as cores do app (dono, 2026-11-26).

### Named Rules
**A Regra das Três Cores.** Laranja é nota-alvo, azul é tocando agora, verde é selecionado. Nenhuma das três é usada para outra coisa, nem como enfeite, em nenhuma ferramenta nem no hub.

**A Regra da Marmota.** Todo neutro novo sai da arte da marmota. Não se inventa cinza, bege ou marrom fora dela; a madeira é do braço da guitarra e só dele.

## Typography

**Display Font:** Silkscreen no nome do site (logotipo); Inter nos demais títulos
**Body Font:** Inter (com system-ui)
**Label/Mono Font:** Silkscreen (com Inter, monospace), nos selos e no nome do site

**Character:** Inter firme e apertada nos títulos, neutra no texto corrido; Silkscreen é o único eco tipográfico do pixel: o nome do site (feito da mesma matéria da marmota) e os selos, e nada mais.

### Hierarchy
- **Display** (Silkscreen 400, 48px a 6× / 40px a 5× / 32px no celular, 1): só o título do hub, com o pixel da letra igual ao da marmota ao lado. No cabeçalho, o mesmo nome a 16px.
- **Headline** (650, clamp até 1.9rem, 1.15, -0.025em): título de seção e título de ferramenta.
- **Title** (700, 1.25rem, 1.15): nome da ferramenta no card (1.15rem no celular, onde o card vira linha).
- **Body** (400, 17px, 1.5): texto corrido, até 60ch. O hub não tem frase nem descrição nos cards: ícone e nome bastam.
- **Label** (Silkscreen 400, 16px, maiúsculas): selos de situação. 16px é 2× a grade de 8px da fonte; outro tamanho borra.

### Escala para ferramentas
As ferramentas usam só os degraus de `globals.css`: `--text-xs` (0.82rem), `--text-sm` (0.92rem), `--text-md` (1rem), `--text-lg` (1.15rem), `--text-xl` (1.45rem), `--text-2xl`, `--text-3xl`, `--text-stage` (o que se lê tocando), `--text-tempo` (o andamento do metrônomo, lido a um metro) e `--text-count` (contagem do timer, 2/3 do andamento).

### Named Rules
**A Regra do Palco.** O que se lê tocando, com o instrumento na mão e a tela a um metro (o que fazer agora, o acorde, a contagem, a casa), usa `--text-stage` ou `--text-xl` e cor cheia. Texto secundário é sempre menor que isso.

**A Regra do Selo.** Silkscreen só em selos de situação (16px), nos números da fórmula de compasso da pauta (24px) e no nome "Marmota Music" (logotipo: título da home e cabeçalho; dono, 2026-11-26), sempre em múltiplo de 8px. Nada que se lê em frase usa fonte pixel.

## Layout

Coluna de até 1120px com respiro lateral de 20px (ou a área segura do aparelho). Cabeçalho de 56px, fixo no topo.

**O palco do hub.** A marmota (52×42 a 6×, ou 5× em tela baixa, embaixo à esquerda) e, ao lado dela, só o título. A marmota senta na linha de cima de uma pauta de cinco linhas (12px entre linhas, linha de 2px) que corre pela largura inteira da coluna e traz, em pixel, o começo de "Marmotte" de Beethoven: fórmula 6/8 em Silkscreen, cabeças 5×4 a 3× (a escala dos ícones), hastes de 3px, bandeirolas e a barra das colcheias ligadas (`src/components/Pauta.tsx`). No celular a melodia inteira cabe com a pauta a 2× (cabeças 10×8). Embaixo da pauta, à direita e quase apagado, o rodapé da partitura: "Marmotte · Beethoven", o ▶ (toca o trecho no piano do site e reinicia a animação junto) e o "?" com a história; 32px no mouse, 44px no toque. Depois, numa fileira só, todas as ferramentas: as no ar como card-link, as que ainda não existem como card quieto (ver Lista quieta) no fim. A composição fica centrada na altura livre, um pouco acima do meio, para a sobra de uma tela alta não virar um vão em cima do rodapé; na home o cabeçalho inteiro some (os cards já são o menu e a marmota com o nome já é a marca). O hub cabe sem rolar no desktop, de 1366×681 para cima; no celular rola, e os cards viram linhas (ícone, nome, ação).

**Responsivo.**
- Desktop (≥961px): uma coluna por ferramenta.
- Tablet (≤960px): os cards em duas colunas, embaixo da mesma pauta inteira.
- Celular (≤720px): o título vem primeiro, e a marmota a 4× senta na linha de cima da pauta, como no desktop; uma pauta só com todas as notas (a 2× até 560px); cards empilhados em linhas, sem a placa "Abrir" (a linha inteira é o link).
- Celular (≤640px) no afinador e no metrônomo: a tela vira a do app Android (ver Components).

Alvos de toque: 44px no celular, 24px no desktop. Seções separadas por 32–56px.

### Named Rules
**A Regra da Grade de 4px.** Um pixel da arte vale 4px (`--px`). Traços, degraus de canto, deslocamentos de animação e o marcador do link atual são múltiplos dele.

## Elevation & Depth

Plano. A profundidade vem de tom (fundo, superfície, sombra suave) e de linhas, não de sombra.

### Shadow Vocabulary
- **Contorno** (`box-shadow: 0 0 0 1px var(--line)`, `--shadow`): o "contorno de 1px" de superfícies que precisam se separar do fundo nas ferramentas.
- **Flutuante** (`box-shadow: 0 0 0 1px var(--fur-2), 0 16px 40px rgb(0 0 0 / 0.55)`, `--shadow-up`): só diálogos que flutuam sobre a página.

### Named Rules
**A Regra do Chão.** Card e cabeçalho não têm sombra nem desfoque. Só o que flutua (diálogo, a barra do app no celular) ganha sombra.

## Shapes

Cantos vivos. O raio padrão é 4px (`--radius`, `--radius-md`), o pequeno é 2px, e os botões e chips das ferramentas usam `--radius-pill`, que também vale 4px neste mundo. Cards do hub, selos e o cabeçalho têm canto zero.

A placa "Abrir" tem cantos em degrau: falta um quadrado de 4px em cada canto (`clip-path`), como um botão de pixel art. É a única forma recortada.

Pixel art (marmota 52×42, cabeça 32×32, ícones 16×16, colcheia 6×9) aparece só em escala inteira, com `image-rendering: pixelated` nos rasters e `shape-rendering: crispEdges` nos SVGs.

### Named Rules
**A Regra da Escala Inteira.** Pixel art é mostrada a 1×, 2×, 3×, 4× ou 6×, nunca em escala fracionária. Ícone a 3× no card (48px) e 32px na linha do celular; colcheia a 4× (24×36); marmota a 6× no hub e 4× no celular; cabeça a 1× (32px) no cabeçalho.

## Components

### Buttons
- **Primária, a placa "Abrir":** bloco marfim com texto no tom do fundo, 600 a 0.95rem, cantos em degrau de 4px, sem seta. No hover do card a placa clareia.
- **Botões das ferramentas:** superfície com contorno de 1px na cor de linha, `--radius-pill` (4px), 44px de altura mínima. Hover troca o fundo para sombra suave e o contorno para cinza quente.
- **"Baixar app":** botão fantasma com contorno de 2px, `--radius-pill`, ícone de traço e texto 600.
- **Foco:** anel azul de 3px, afastado 3px, sempre visível.

### Chips
- **Repouso:** superfície e contorno de 1px, `--radius-pill`.
- **Selecionado:** verde cheio com texto escuro (Regra das Três Cores). O marfim fica para a ação principal e para o alternador de modo.

### Cards / Containers
- **Corner Style:** canto zero.
- **Background:** superfície plana; no hover, mistura com a sombra suave.
- **Shadow Strategy:** nenhuma (Regra do Chão).
- **Border:** só um traço de 4px no topo, cinza do pelo em repouso, marfim no hover.
- **Internal Padding:** 22px 26px 26px; ícone, nome, uma linha, e no pé a placa "Abrir" e o selo.

### Selos de situação
Silkscreen 16px em maiúsculas sobre sombra suave, texto cinza quente, canto zero. "Próxima" usa laranja sobre laranja sombra, com um quadrado de 4px antes do texto.

### Lista quieta
Ferramentas que ainda não estão no ar entram no fim da fileira como card quieto, sem link: sem superfície nem caixa, como um compasso ainda não escrito. O traço de 4px do topo vira pontilhado (um pixel aceso, um apagado, em cinza do pelo), o ícone fica em taupe (laranja na próxima), o nome em cinza quente e a situação é só texto em Silkscreen, sem fundo, para nada ali parecer a placa "Abrir". No celular a situação vai embaixo do nome.

### Navigation
- **Cabeçalho:** 56px, fundo sólido no tom do chão, traço de 2px embaixo. À esquerda a cabeça da marmota (32px) e o nome em Silkscreen; à direita os links das ferramentas. Some na home (desktop e celular) e em todo o celular.
- **Link:** cinza quente, 500, 0.94rem. Hover: marfim, com uma barra de 4px de linha embaixo. Atual: marfim, 600, barra de 4px em marfim embaixo. Sem pílula.
- **Celular:** o nome some e fica só a cabeça; o menu rola dentro dele mesmo.
- **Rodapé:** traço de 2px em cima e só dois links em azul, à direita: "Relatar um problema" e "Backup de dados" (abre um modal com uma frase e os botões Baixar backup e Restaurar de um arquivo; `src/components/BackupDados.tsx`, formato em `src/core/storage/backup.ts`, compatível com o do Laboratório).

### A Marmota e a Pauta (assinatura)
A marmota em 52×42 tem dois quadros por cima da base, trocados em degraus (`steps(1)`): pisca (olho fechado, a cada 7s) e fareja a cada 4s (o focinho inteiro, nariz, canto da boca e bigodes, sobe um pixel duas vezes seguidas, ~0,12s por quadro). A música fica na pauta: ela toca o começo de "Marmotte", de Beethoven (op. 52 nº 7, poema de Goethe; anacruse e dois compassos, lá menor, 6/8), no andamento (colcheia de 0,22s), e a nota da vez acende azul e pula 4px. Sozinha, a pauta toca duas voltas e para (azul é "tocando agora"; não finge tocar para sempre sem som). O ▶ toca o trecho no piano, e aí quem acende as notas é o relógio do áudio (o que sai no alto-falante, descontado o atraso da saída), não a animação. Nada sai voando da marmota (o dono recusou). Com `prefers-reduced-motion`, nada anda sozinho; tocando, as notas só mudam de cor.

### Ícones de ferramenta
Desenhos 16×16 escritos como grade de texto ("#" aceso, "+" sombra) e renderizados pelo `PixelArt` num SVG de um path por cor, na cor do texto. Ferramenta nova sem desenho usa o genérico até ganhar o seu.

### Tela de app (celular)
No celular (≤640px), afinador e metrônomo marcam `.app-screen`: some cabeçalho, rodapé e título; a paleta vira a do app, os raios voltam a ser de app (22px, 14px, 10px e pílula de verdade) e aparece a barra flutuante de 56px com a aba atual cheia. É uma cópia deliberada do Marmota Tuner, não uma exceção a corrigir. O site espelha os apps: os treinos de ouvido e de voz têm a mesma barra com as abas do Marmota Trainer (Ouvido, Voz), a casinha do início e o download do APK daquele app (`AppNav.tsx`), mas mantêm o mundo da marmota. Em todo o celular o cabeçalho do site some, e a volta ao início é só a casinha da barra; não há seta de voltar.

## Do's and Don'ts

### Do:
- **Do** tirar todo neutro da marmota: fundo #111715, superfície #1b2220, texto marfim, cinza quente, taupe e cinza do pelo.
- **Do** mostrar pixel art só em escala inteira, com `image-rendering: pixelated` ou `shape-rendering: crispEdges`, na grade de 4px.
- **Do** desenhar ícone novo como grade 16×16 no `PixelArt`, a 3× em card e 2× em lista.
- **Do** animar a casca da marca só com `steps()`, e só com `prefers-reduced-motion: no-preference`.
- **Do** usar `--radius-pill` nos botões e chips das ferramentas, para que a tela de app possa devolver a pílula.
- **Do** manter a Regra das Três Cores, a Regra do Palco e a escala `--text-*` em toda ferramenta.
- **Do** deixar o mínimo de explicação num "?", nunca em frase de ajuda na tela.

### Don't:
- **Don't** usar laranja, azul ou verde como enfeite.
- **Don't** colocar um segundo elemento decorativo animado no hub; a cena da marmota é o único.
- **Don't** usar easing (`cubic-bezier`, `ease-out`) no movimento da casca da marca; pixel não desliza.
- **Don't** usar Silkscreen em texto corrido, título (exceto o nome do site) ou botão, nem em tamanho fora de múltiplo de 8px.
- **Don't** arredondar cards ou botões acima de 4px fora da tela de app, nem pôr sombra em card.
- **Don't** usar as cores de madeira fora do desenho do braço da guitarra.
- **Don't** escalar pixel art em fração, nem passar a marmota pelo otimizador do `next/image`.
- **Don't** pôr texto de instrução na interface.
