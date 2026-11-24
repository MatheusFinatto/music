---
name: Marmota Music
description: Ferramentas de prática para quem toca. Painel de entrada calmo e generoso, no padrão da categoria.
colors:
  ground: "#f5f5f7"
  surface: "#ffffff"
  ink: "#1d1d1f"
  muted: "#5f5f66"
  line: "#d9d9de"
  soft: "#ececf0"
  action-blue: "#27598a"
  action-blue-soft: "#e4edf6"
  target-orange: "#c27400"
  target-orange-soft: "#f8ead2"
  selected-green: "#2e7a4d"
  error-red: "#b3412f"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 6.2vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2.6vw, 1.9rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 600
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 400
  lead:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
  tool-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 4.5vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  stage:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 9vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
rounded:
  card: "22px"
  icon: "14px"
  small: "10px"
  pill: "999px"
spacing:
  gutter: "20px"
  card: "26px"
  grid: "18px"
  section: "clamp(40px, 6vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "9px 16px 9px 18px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "26px"
  badge:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
---

# Design System: Marmota Music

## Overview

**Creative North Star: "O padrão, bem feito"**

O dono escolheu de propósito o padrão da categoria, depois de recusar direções mais autorais. A referência de acabamento são as páginas de app da Apple: muito respiro, cards grandes e arredondados sobre um fundo cinza suave, uma família tipográfica só, animações suaves. A convenção é o compromisso; nada de ironia nem de enfeite contrabandeado.

O hub é um painel de entrada. O que dá para abrir hoje é a maior coisa da página; o que ainda não existe aparece menor e mais quieto, com a situação dita com honestidade.

A fonte de verdade dos tokens é `src/app/globals.css`. **Um tema só, escuro (decisão do dono, 2026-11-19): o "palco à noite" vale para o site inteiro** (hub, afinador, metrônomo). Os valores de cor abaixo marcados "escuro" são os que valem; os claros são o histórico da primeira direção e não existem mais no código.

**Key Characteristics:**
- Fundo cinza suave, superfícies brancas, um só azul para ação.
- Cards de raio 22px com sombra macia de um degrau.
- Tamanho e peso do card dizem a situação da ferramenta.
- Uma pauta animada no topo é o único elemento decorativo.

## Colors

Neutros frios e um azul de marca; o laranja e o verde têm significado musical e não são decoração.

### Primary
- **Azul de ação** (#27598a; escuro #7fb2e2): botões, links, foco, e "o que está tocando agora".

### Secondary
- **Laranja de nota-alvo** (#c27400; escuro #f0a634): a nota-alvo nas ferramentas; no hub, só a ferramenta em construção (a "próxima nota"). Texto sobre laranja usa `--on-target`; texto laranja sobre fundo suave usa `--target-ink`.

### Tertiary
- **Verde de selecionado** (#2e7a4d): item selecionado dentro das ferramentas. Não aparece no hub.

### Neutral
- **Fundo** (#f5f5f7; escuro #000000): o chão da página.
- **Superfície** (#ffffff; escuro #1c1c1e): cards.
- **Tinta** (#1d1d1f): texto principal. **Apagado** (#5f5f66): texto secundário, 6:1 sobre o fundo.
- **Linha** (#d9d9de) e **Suave** (#ececf0): divisórias, contorno dos cards planejados, selos.

### Named Rules
**A Regra das Três Cores.** Azul é ação e "tocando agora". Laranja é nota-alvo. Verde é selecionado. Nenhuma das três é usada para outra coisa, em nenhuma ferramenta.

## Typography

**Display Font:** Inter (com system-ui)
**Body Font:** Inter
**Mono (só dados):** `ui-monospace` (SF Mono, Menlo, Consolas), apenas na tablatura em texto, onde as colunas alinham notas e casas.

**Character:** Uma família só, servida pelo próprio site. Títulos pesados e apertados (até -0.035em), corpo em 17px com entrelinha folgada.

### Hierarchy
- **Display** (700, até 4.25rem, 1.04): só o título do hub. Máximo 20ch.
- **Headline** (650, até 1.9rem): título de seção.
- **Title** (650, 1.45rem): nome de ferramenta no card. 1.1rem no card planejado.
- **Body** (400, 17px, 1.5): descrições, até 38ch dentro de card.
- **Label** (600, 0.82rem): selos de situação.

### Escala para ferramentas
As ferramentas usam só os degraus definidos como variáveis em `globals.css`: `--text-xs` (0.82rem), `--text-sm` (0.92rem), `--text-md` (1rem), `--text-lg` (1.15rem), `--text-xl` (1.45rem), `--text-2xl`, `--text-3xl` (título de ferramenta) `--text-stage`, `--text-tempo` (o andamento do metrônomo, maior que o palco: é o número que se lê a um metro) e `--text-count` (contagem do timer, 2/3 do andamento).

**A Regra do Palco.** O que se lê tocando, com o instrumento na mão e a tela a um metro (o que fazer agora, o acorde, a contagem, a casa), usa `--text-stage` ou `--text-xl` e cor cheia. Texto de instrução é sempre menor que isso.

## Elevation

Um degrau só. Cards no ar têm `--shadow` (sombra macia, com deslocamento) e sobem para `--shadow-up` no hover. Cards planejados são planos, com contorno de 1px. No escuro a sombra vira um contorno claro de 1px. O cabeçalho é translúcido com desfoque, e é o único lugar com desfoque.

## Shapes

Raio 22px nos cards, 14px nos ícones, pílula nos botões e selos. Sem cantos vivos.

## Components

### Buttons
- **Primário:** pílula azul, texto branco 600, seta que desliza 4px no hover do card.

### Cards / Containers
- **No ar:** superfície branca, ícone 52px em azul suave, nome, descrição, botão "Abrir" e selo. O card inteiro é o link; sobe 4px no hover.
- **A seguir:** card largo, ícone 64px em laranja suave, selo "Em construção" com ponto. Não é clicável.
- **Planejada:** menor, sem sombra, contorno de 1px, ícone cinza. Não é clicável.

### Chips
- **Selo de situação:** pílula cinza; a variante `proxima` é laranja.

### Navigation
- Cabeçalho fixo de 56px: marca à esquerda (ícone + nome), links à direita em pílulas que acendem no hover.

### Ícones
- Linha, traço 1.8, pontas redondas, 24px de grade. Um por ferramenta em `src/components/ToolIcon.tsx`.

### O palco à noite
- O site inteiro é sempre escuro: fundo marrom quase preto com uma luz quente vinda de cima, superfícies de madeira escura, texto em marfim. Definido em `src/app/globals.css` (tokens em `:root`); `body` tem o fundo com a luz quente.
- Títulos em Bricolage Grotesque (`--font-display`); texto em Inter.
- Ação principal em marfim. O azul fica só para "tocando agora" e o laranja só para o alvo e para o que está em andamento.
- O hub, o afinador e o metrônomo usam o mesmo palco (decisão do dono, 2026-11-19). O curso "Como solar com a pentatônica", que deu origem a esse visual, foi removido em 2026-11-23.

### Pauta animada (assinatura)
- `src/components/Staff.tsx`: uma nota por ferramenta do registro. Cabeça cheia = no ar; vazada = ainda não. Um cursor azul atravessa a pauta em 8 s e cada nota acende quando ele passa; a ferramenta em construção acende em laranja.

## Motion

- Curva única: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Entrada: título, frase e cards no ar sobem 18px em sequência (70 ms entre eles). O conteúdo é visível por padrão.
- Tudo dentro de `prefers-reduced-motion: no-preference`; com redução pedida, a página é estática.

## Layout

Coluna de 1120px, margem lateral de 20px. Grades com `auto-fit`: cards no ar a partir de 300px, planejados a partir de 230px; no celular viram uma coluna. Seções separadas por 40 a 72px, com mais espaço acima do título do que abaixo.

## Do's and Don'ts

- Use os tokens de `globals.css`; ferramenta não cria paleta própria.
- Mantenha a Regra das Três Cores.
- Diga a situação da ferramenta com as palavras do registro; sem datas.
- Não use linguagem de venda ("comece grátis", "o melhor").
- Não acrescente um segundo elemento decorativo animado ao hub: a pauta é o único.
