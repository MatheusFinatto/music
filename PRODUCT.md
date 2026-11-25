# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + next-intl, deploy na Vercel. Escolha do dono (2026-11-17): contas virão logo e ele já conhece Next. O site antigo (Vite + JS puro) segue congelado em `legacy/`, servido como estático em `/laboratorio`.

## Users

Qualquer músico, do iniciante ao avançado, com foco em instrumentos de corda (guitarra, violão, baixo). Na prática, o primeiro público são o dono e amigos músicos. Usam em casa com o instrumento na mão, ou no trabalho com fone e sem instrumento; no computador e no celular.

## Product Purpose

Um site de música generalista, gratuito e não comercial: um hub que leva a ferramentas de prática independentes (afinador, metrônomo e treino de ouvido no ar; treinador de tirar músicas e solos de ouvido planejado). Sucesso é cada ferramenta ser excelente por si só; o hub só precisa levar a pessoa à ferramenta em um clique.

## Positioning

O treinador de tirar músicas e solos de ouvido é a peça que o dono nunca viu igual. As demais ferramentas já têm concorrentes gratuitos bons; elas existem para o site ser completo, não para competir em novidade.

## Operating Context

- A homepage é um painel de entrada, não uma página de venda.
- Ferramentas usam áudio do navegador (Web Audio, microfone, depois MIDI).
- Vários devs vão contribuir, cada um numa ferramenta, usando Claude Code.
- Hoje só existem dois experimentos funcionando (Diário do Solo e Piano de Ideias), expostos como "Laboratório".

## Capabilities and Constraints

- Gratuito, sem conta por enquanto; dados só no navegador (`localStorage`, prefixo `musica:`). Contas virão depois.
- PT-BR no lançamento, estruturado para receber outros idiomas.
- Uma ferramenta nunca depende de outra; o que é comum fica em `src/core/`.
- Não há catálogo de tablaturas de músicas comerciais (direito autoral).
- Status de cada ferramenta é mostrado com honestidade (pronta, laboratório, próxima, planejada). Sem datas prometidas.
- Em aberto: nome definitivo e domínio.

## Brand Commitments

- Nome: "Marmota Music" (o dono trocou em 2026-11-18; antes, "Musical Tools"). O endereço é `marmota-music.vercel.app`.
- Notas sempre no formato letra + oitava (C4, Bb3). C4 = Dó central.
- Semântica de cor nas ferramentas: laranja = nota-alvo, azul = o que está tocando agora, verde = selecionado. Não misturar.
- Não comercial: nada de linguagem de venda, plano pago ou "comece grátis".
- Direção visual (rebranding de 2026-11-25, escolhida pelo dono): a marca é a marmota em pixel art, e o mundo do site sai dela (fundo grafite-esverdeado, cinzas e taupe do pelo, marfim). Pixel art na marca e nos detalhes; o texto e os controles das ferramentas continuam lisos e legíveis. No hub, a marmota toca e as notas pousam numa pauta onde cada ferramenta é uma nota ("caderno pautado"): a música não sai do centro. Antes (2026-11-17 a 11-25) era o padrão da categoria, no estilo das páginas de app da Apple.

## Evidence on Hand

- Dois experimentos reais funcionando: `legacy/diario.html`, `legacy/piano.html`.
- Ícone atual: `legacy/public/icon.svg`.
- Não há depoimentos, números de uso nem ferramentas novas prontas. Não inventar.

## Product Principles

1. Cada peça especialista é excelente sozinha, ou não é lançada.
2. O hub sai do caminho: um clique até a ferramenta.
3. Honestidade sobre o que existe e o que ainda não existe.
4. Tudo gratuito e aberto; o dado é do usuário.
5. Prática com a mão na massa antes de explicação.
