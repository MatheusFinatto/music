# O projeto original (Laboratório)

> **Escopo:** o treino de improviso que deu origem ao site. A visão atual está em `docs/PROJETO.md`.

## O problema
Ao compor solos, o dono cai em dois extremos: seguindo a teoria, o solo fica "quadrado e mecânico"; seguindo o feeling, fica simples demais (muitas vezes a tônica uma oitava acima por um compasso inteiro). Falta **vocabulário**: frases que combinem técnica e beleza.

## A abordagem
1. **Notas-alvo**: o feeling dele já sabe para onde ir; falta o caminho. Mirar a 3ª (e a 5ª, 9ª) do acorde em tempos fortes.
2. **Motivos**: repetir uma ideia com variação em vez de inventar notas o tempo todo.
3. **Vocabulário roubado**: uma frase de um solo que ele ama por semana (tirar, tocar em 3 tons, variar).
4. **Ritmo e espaço**: começar fora do tempo 1, silêncio como parte da frase.
5. **Tempero Gilmour**: pentatônica + 9ª e 6ª, bends lentos e afinados, vibrato largo, espaço.

## Páginas
- **Início** (`/laboratorio`): links, barra da base, backup (exportar/importar).
- **Diário do Solo** (`/laboratorio/diario`): plano de 57 dias (dia 0 + 8 semanas). Cada dia: micro-meta, passos, braço da guitarra com os alvos do dia (acompanha a base), timer de 30 min em 4 blocos (cantar/vocabulário/foco/livre), contador de acertos (micro-evolução, com "última vez você fez X, tente X+1"), anotação, "dia feito". Dias de gravação (0, 7, 14…, 56) têm ficha de 1 a 5. Gráfico de acerto e tabela comparando as fichas.
- **Piano de Ideias** (`/laboratorio/piano`): piano no navegador (mouse, toque ou teclado do computador), por cima da base. Grava 4 compassos, mostra partitura + tab, salva ideias (★, "Testei na guitarra", "Copiar para o Claude", baixar HTML). Aba de **Missões** por semana, com exemplos tocáveis.
- **Montar base** (janela em todas as páginas): tom (± meio tom), 4 acordes do campo harmônico maior, andamento, estilo (Balada, Rock, Pop, Só acordes), mixagem, metrônomo. A base vale para o site todo.

## As 8 semanas
1. Notas-alvo · 2. Bends para o alvo · 3. Ritmo e espaço · 4. Motivos · 5. Pergunta e resposta · 6. Cor (9ª e 6ª) · 7. O arco do solo · 8. Juntar tudo.
Conteúdo dos dias: `src/lib/plan.js`. Missões e exemplos do piano: `src/lib/missions.js`.

## Histórico
Começou como artefatos dentro do Claude (claude.ai). Virou site para usar microfone/MIDI no futuro, abrir no celular e no Linux (Nobara) sem o Claude Desktop, e poder ser desenvolvido por qualquer conta do Claude Code.
