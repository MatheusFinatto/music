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

## Desenho confirmado: padrão Yousician (2026-11-23)
O dono confirmou o modelo guiado por relógio ("faz bastante sentido e a UX é muito boa"). O que isso quer dizer na tela:
- **Pista de altura** na horizontal: cada nota é uma barra (altura = nota, comprimento = duração), com a sílaba da letra por cima. Uma **linha de leitura** fixa; as notas correm até ela.
- **Sua voz ao vivo** como um ponto/linha na pista, na altura que o microfone ouve. Quando o ponto está sobre a barra da vez, a barra se enche (verde = acertando), como no resto do site.
- **Contagem de entrada** (3, 2, 1) e o piano tocando o trecho antes (ou junto, num modo "com guia"), para a pessoa ouvir antes de cantar.
- **Andamento** lento por padrão (escolhível). **Janela de acerto**: a nota vale se a altura certa foi cantada por uma parte do tempo dela (a definir, de 50% a 60%), com a folga de tempo generosa do início de cada nota. Sem pontuação de ritmo por ora.
- **Resultado do trecho**: quantas notas acertou, quais falhou (marcadas na pista), e "Tentar de novo" / "Próximo trecho". Tom transposto para a voz da pessoa (escolhível).
- Reaproveita `PitchPipeline`/`PitchSmoother`/`atualizar` e o piano; a lógica nova (janelas de tempo, acerto por nota) é pura e testável com as vozes simuladas.


## Estado (2026-11-23): 24 músicas ligadas
O dono marcou 24 músicas no checklist. As melodias foram transcritas e conferidas contra partituras e cifras por agentes (duas fontes ou mais quando existiam); os dados estão em `src/tools/treino-de-ouvido/musicas.json` (semitons acima da tônica, durações em tempos, sílaba por nota) e o campo `confianca` diz o quanto cada uma foi conferida:
- **alta** (9): Brilha estrelinha, Atirei o pau no gato, Parabéns, Ciranda, Cai cai balão, Ode à alegria, Escravos de Jó, A barata diz que tem, Noite feliz.
- **média** (8): Marcha soldado, Boi da cara preta, O cravo brigou com a rosa, A canoa virou, Pirulito que bate bate, Terezinha de Jesus, Bate o sino, Amazing Grace.
- **baixa** (7): Sapo cururu, Se essa rua fosse minha, A dona aranha, O sapo não lava o pé, Borboletinha, Alecrim dourado, Nana neném (fonte única ou só cifras, ritmo estimado). As de baixa confiança **ficam de fora dos programas** (só no treino livre) e mostram o aviso "pode diferir da versão que você conhece".
- Média e baixa mostram um aviso na tela; o ouvido do dono é o teste final (item no roteiro de teste em casa). Para corrigir uma melodia basta editar o JSON.
- **Letra:** "Parabéns pra você" fica **sem letra** (a letra em português, de Bertha Celeste, 1942, provavelmente ainda tem direito autoral); a melodia é livre. "Ode à alegria" não tem letra. "Boi da cara preta" só tem a letra da primeira frase (as outras não alinharam). As demais usam a letra tradicional.
- Notas com menos de 0,28 s (pontuadas curtas) são "de passagem": não entram na conta. O andamento "lento" é 60% do sugerido; "normal", 100%.
- Músicas do checklist que não entraram: nenhuma; "Peixe vivo" saiu a pedido do dono.
