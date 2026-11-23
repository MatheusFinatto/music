# Programas por foco e tempo (experimentos 9 e 10)

Pedido do dono (2026-11-23): no início da página, **antes dos exercícios separados**, programas prontos por tempo, para o **ouvido** e para a **voz**: **5, 10, 15, 20 e 30 minutos**. O tempo é aproximado, porque depende de quanto a pessoa demora para cantar ou para adivinhar; a estimativa usa **medianas**.

## Como funciona
- Em cada seção (Ouvido, Voz) o cartão **Programas** vem antes do treino livre: escolhe-se o **foco** e depois a **duração** (lembra os últimos), vê-se o que vem dentro e quantas perguntas, e "Começar programa de N min".
- Durante o programa: barra com bloco, perguntas respondidas e minutos restantes; o bloco começa sozinho; "Pular bloco" e "Parar programa". O seletor Ouvido/Voz, o seletor de exercícios, o placar, Ajustes e Pontos fracos somem até acabar. Na última pergunta de um bloco o botão vira "Próximo bloco: …" (ou "Terminar programa"). Na Voz, "Tentar de novo" some e a falha conta como erro.
- No fim, o resumo: acertos por bloco, tempo real × previsto, "Fazer de novo".
- Os programas usam os itens e ajustes que a pessoa escolheu (intervalos, margem, instrumento, tônica…).

## Como o tempo é estimado
- Cada bloco tem uma fatia de tempo; perguntas = fatia ÷ (mediana por pergunta + 2 s). Mínimo de 2 perguntas por bloco; o alcance é uma medição só.
- A mediana é das últimas 30 respostas **da própria pessoa** (treino livre também conta), guardadas em `musica:treino-de-ouvido-ritmo`. Com menos de 5 respostas vale o palpite (`MEDIANAS_INICIAIS` em `programas.ts`); piso de 3 s e teto de 60 s por resposta.
- Palpites iniciais (s): intervalos 10, acordes 10, afinação 14, achar 25, graus 15, cadências 16, progressões 20; voz: igualar 14, nota longa 14, arpejos 25, tônica 20, cantar o intervalo 18.

## Focos e programas
O foco decide quais exercícios entram; o tempo decide quantos blocos e quantas perguntas (os curtos pegam o básico do foco). As tabelas estão em `programas.ts`.
- **Ouvido** — Geral (mix: de intervalos e acordes até as sete) · Intervalos e acordes (intervalos, acordes, achar) · Afinação (intervalos de aquecimento, depois afinação, com a maior parte do tempo) · Harmonia (graus do campo, cadências, progressões).
- **Voz** — Geral (igualar, nota longa, arpejos, com a tônica, cantar o intervalo) · Afinação (igualar, nota longa, cantar o intervalo) · Segunda voz (igualar de aquecimento, com a tônica soando, cantar o intervalo).
- **O alcance não entra em programa nenhum** (decisão do dono): é uma medição, não um exercício; continua como aba do treino livre da Voz.

## Decisões
Programa fixo (não adapta dificuldade); sem foco em range por ora (precisaria de um exercício novo, por exemplo notas nas bordas do alcance medido); sem programa misto ouvido+voz; sem histórico de programas; o andamento não sobrevive a recarregar a página.

## Ideias para depois
Histórico dos programas (dia, tempo, acertos) só no navegador; adaptar a dificuldade; programa que junta ouvido e voz; escolher os blocos.
