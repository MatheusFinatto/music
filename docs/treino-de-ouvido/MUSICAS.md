# Músicas simples para cantar (próximo passo, ainda sem código)

Pedido do dono (2026-11-23): trechos de músicas ultra famosas e simples; o piano toca o trecho e a pessoa o reproduz cantando. Só melodias **tradicionais ou de domínio público** (regra do projeto contra catálogo de música comercial). Vai na página **Treino de voz**, como um exercício novo ("Músicas"); depois pode entrar nos programas de voz.

## Lista (9, depois de tirar "Peixe vivo", que o dono não conhece)
1. Brilha, brilha, estrelinha · 2. Atirei o pau no gato · 3. Parabéns pra você · 4. Ciranda, cirandinha · 5. Cai, cai, balão · 6. Marcha soldado · 7. Sapo cururu · 8. Se essa rua fosse minha · 9. Ode à alegria (Beethoven).
Reservas: Escravos de Jó, Frère Jacques, Meu limão meu limoeiro, Boi da cara preta, Capelinha de melão, O cravo brigou com a rosa, A canoa virou, Jingle Bells, Noite feliz.

## Decisões do dono
- **Notas repetidas** (Dó-Dó-Sol-Sol…): **sem detector de início de nota** (o dono voltou atrás, 2026-11-23: "algo meio Yousician"). No modelo atual (a nota avança quando a pessoa segura a altura certa) a segunda nota igual passaria sozinha. Por isso o exercício de músicas deve ser **guiado por relógio**, como o Yousician: as notas correm numa pista de altura com uma linha de leitura, cada nota tem a sua janela de tempo, e a nota vale se a altura certa foi cantada durante a janela. Duas notas iguais viram duas janelas seguidas; não há o que detectar.
- **Ritmo**: não é conferido com rigor, mas o relógio já impõe um andamento (lento por padrão, com escolha) e uma folga generosa de tempo em cada janela. Cobrar o tempo exato fica para depois.
- **Letra**: mostrar a sílaba embaixo de cada nota. A instrução deve dizer que a pessoa pode cantar **só as notas ou a letra**, e que vale treinar os dois.

## Como será
- Cada música vira 2 a 4 frases de 4 a 8 notas, guardadas como graus da escala e transpostas para um tom que caiba na voz (fixo, aleatório ou escolhido, como a tônica).
- Tela estilo Yousician: pista de altura com as notas como barras, linha de leitura que anda no andamento escolhido, o afinômetro/ponto da voz ao vivo, e a sílaba da letra sobre cada barra. Reaproveita a detecção (`PitchPipeline`, `atualizar`) e o piano; a conferência por janela é lógica nova (pura, testável com as vozes simuladas).
- Riscos: latência do microfone (compensar), andamento rápido demais para iniciantes (começar lento e deixar escolher), e a primeira nota depois de uma contagem para a pessoa se preparar.
- As melodias serão transcritas e conferidas contra partituras de domínio público (Mutopia, IMSLP, cancioneiros tradicionais) **antes** de usar; o dono vê as notas de cada uma antes da implementação. O ouvido dele é o teste final (item no roteiro de teste em casa).
