# Programas por tempo (próximo passo)

Pedido do dono (2026-11-23): no início da página, **antes dos exercícios separados**, programas prontos por tempo, para o **ouvido** e para a **voz**: **5, 10, 15, 20 e 30 minutos**. O tempo é uma aproximação, porque depende de quanto a pessoa demora para cantar ou para adivinhar a nota; usar **médias** para estimar.

Ainda **não implementado**. Esboço para a conversa:

## O que a pessoa vê
- Acima dos exercícios, uma seção "Programas" com cinco botões de tempo (5, 10, 15, 20, 30 min), uma para Ouvido e outra para Voz (cada seção já tem o seu espaço na página).
- Cada botão mostra o que vem dentro, em uma linha: "6 intervalos, 4 acordes, 4 cadências…" e o tempo estimado ("≈ 10 min").
- Durante o programa: o exercício de sempre, mais uma barra de progresso (blocos feitos e tempo) e "Pular bloco" / "Parar". No fim: resumo (acertos por bloco, tempo real contra o previsto, pontos fracos).
- O treino livre (os exercícios separados de hoje) continua logo abaixo.

## Como estimar o tempo
- Cada exercício tem uma **duração mediana por pergunta**, em segundos. Começa com um palpite e passa a usar a mediana das últimas ~30 perguntas **da própria pessoa**, guardadas no navegador (como o placar). Mediana, e não média, para uma pergunta em que ela saiu para tomar água não estragar a conta.
- Palpites iniciais (a conferir com o uso): intervalos 10 s, acordes 10 s, afinação 14 s, achar 25 s, graus do campo 15 s, cadências 16 s, progressões 20 s; voz: igualar a nota 14 s, nota longa 14 s, arpejos e escalas 25 s por rodada, com a tônica 20 s, cantar o intervalo 18 s.
- Um bloco recebe uma fatia do tempo do programa e vira "N perguntas" = fatia ÷ mediana. O programa de 10 minutos tem o mesmo desenho do de 30, só com blocos menores.
- Depois de cada programa, as medianas se atualizam e o próximo já estima melhor.

## O que entra em cada programa (proposta, a decidir)
- **Voz**: aquecimento (arpejo maior e escala de cinco notas, subindo meio tom), depois nota longa, depois o núcleo (igualar a nota, cantar sobre a tônica, cantar o intervalo), e nos programas de 20 e 30 min a escala maior e o alcance no começo.
- **Ouvido**: mistura de intervalos, acordes e afinação, mais harmonia (graus do campo, cadências, progressões) nos de 15 min em diante, e o **Achar** nos de 20 e 30. As perguntas favorecem os pontos fracos (o reforço que já existe).
- Os programas usam os **itens que a pessoa escolheu** nos Ajustes (quais intervalos, margem, instrumento), para não recomeçar do zero.

## Perguntas em aberto
- O programa é fixo por tempo ou adapta (sobe a dificuldade quando acerta muito)? Sugestão: fixo na primeira versão.
- Um programa "completo" que mistura ouvido e voz? Sugestão: não agora.
- Guardar o histórico de programas feitos (dia, tempo, acertos) para ver a evolução? Sugestão: sim, só no navegador, depois.
