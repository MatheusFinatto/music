# Programas por tempo (implementado no experimento 9)

Pedido do dono (2026-11-23): no início da página, **antes dos exercícios separados**, programas prontos por tempo, para o **ouvido** e para a **voz**: **5, 10, 15, 20 e 30 minutos**. O tempo é aproximado, porque depende de quanto a pessoa demora para cantar ou para adivinhar; a estimativa usa **medianas**.

## Como funciona
- Em cada seção (Ouvido, Voz) o cartão **Programas** vem antes do treino livre: escolhe-se a duração (lembra a última), vê-se o que vem dentro e quantas perguntas, e "Começar programa de N min".
- Durante o programa: barra com bloco, perguntas respondidas e minutos restantes; o bloco começa sozinho; "Pular bloco" e "Parar programa". O seletor Ouvido/Voz, o seletor de exercícios, o placar, Ajustes e Pontos fracos somem até acabar. Na última pergunta de um bloco o botão vira "Próximo bloco: …" (ou "Terminar programa"). Na Voz, "Tentar de novo" some e a falha conta como erro.
- No fim, o resumo: acertos por bloco, tempo real × previsto, "Fazer de novo".
- Os programas usam os itens e ajustes que a pessoa escolheu (intervalos, margem, instrumento, tônica…).

## Como o tempo é estimado
- Cada bloco tem uma fatia de tempo; perguntas = fatia ÷ (mediana por pergunta + 2 s). Mínimo de 2 perguntas por bloco; o alcance é uma medição só.
- A mediana é das últimas 30 respostas **da própria pessoa** (treino livre também conta), guardadas em `musica:treino-de-ouvido-ritmo`. Com menos de 5 respostas vale o palpite (`MEDIANAS_INICIAIS` em `programas.ts`); piso de 3 s e teto de 60 s por resposta.
- Palpites iniciais (s): intervalos 10, acordes 10, afinação 14, achar 25, graus 15, cadências 16, progressões 20; voz: igualar 14, nota longa 14, arpejos 25, tônica 20, cantar o intervalo 18.

## Programas
- **Ouvido** — 5: intervalos, acordes · 10: + afinação, graus do campo · 15: + cadências, achar · 20 e 30: os sete exercícios, com mais tempo em intervalos, afinação e achar.
- **Voz** — 5: igualar a nota, arpejos · 10: igualar, arpejos, com a tônica · 15: + nota longa, cantar o intervalo · 20 e 30: começam pelo alcance e dão mais tempo à tônica e ao intervalo.

## Decisões
Programa fixo (não adapta dificuldade); sem programa misto ouvido+voz; sem histórico de programas; o andamento não sobrevive a recarregar a página.

## Ideias para depois
Histórico dos programas (dia, tempo, acertos) só no navegador; adaptar a dificuldade; programa que junta ouvido e voz; escolher os blocos.
