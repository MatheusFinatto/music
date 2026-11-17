# Como fazer solos: microfone (recurso futuro)

Decisão do dono (2026-11-17): o microfone vai acontecer, mas não na primeira versão. Este documento guarda tudo o que já se sabe para quem for construir.

## Por que importa
Sem microfone, o retorno da ferramenta é autoavaliação. A pesquisa de concorrentes mostrou que retorno sobre a **qualidade musical** de um improviso só existe hoje com professor humano (Pickup Music, Guitargate), devagar e pago. Os aplicativos que ouvem (Yousician, Rocksmith+) só dizem nota certa ou errada, e são criticados por isso.

## Dependências
- `core/audio/mic` e `core/pitch`, que nascem com o afinador (ver `docs/ROADMAP.md`).
- A detecção de altura precisa entregar frequência e clareza cruas, com resolução de poucos cents, de E2 (82 Hz) para cima.
- Microfone exige HTTPS e um gesto do usuário.

## Ordem de construção

### 1. Gravar e comparar tomadas (sem análise)
O primeiro passo, e o mais barato: `MediaRecorder` + IndexedDB.
- Gravar a tomada livre do fim de cada sessão.
- Guardar a primeira tomada de cada unidade como referência.
- Tela de comparação: a mesma base, semana 1 contra hoje.
- Nenhum concorrente pesquisado oferece isso.
- Cuidado: ouvir a própria gravação **sem roteiro** não melhora nada (Nusseck et al. 2025). Sempre junto com um modelo e uma pergunta específica.

### 2. Bends (unidade 3)
- Medida: erro em cents na parte sustentada do bend, contra um **alvo declarado** pelo exercício.
- Tolerância inicial sugerida: ±15 cents. É um chute, não um número da literatura: ajustar com uso real.
- Mostrador de altura **só neste tipo de exercício isolado**, com veredito claro (afinado ou não), e depois rodadas com o mostrador escondido. Com o mostrador sempre ligado a pessoa passa a depender dele (Blanco et al. 2021; Pardue & McPherson 2019).
- Bend de blues que fica de propósito entre duas notas não é erro: por isso o alvo tem que ser declarado.

### 3. Respirar e ritmo (unidades 1 e 2)
- Notas tocadas em compasso de silêncio: contagem direta.
- Proporção de silêncio e duração das frases: mostrar, e valorizar a **variedade**, não um número-alvo (alternar 2 e 2 mecanicamente daria nota máxima).
- Ritmos diferentes por compasso: contar padrões distintos.
- Atraso ou adiantamento em relação ao tempo: **informar, não dar nota**. Tocar atrás do tempo é estilo.

### 4. Notas do acorde (unidades 5 e 6)
- Chegada no alvo com tolerância de uma colcheia para cada lado do tempo.
- Distribuição dos graus em que a pessoa pousa (T, 3, 5). Aviso de monotonia quando um grau passa de 50%.
- Nunca premiar um grau só: foi isso que prendeu a versão antiga nas 3ªs.

### 5. Vibrato (unidade 4)
- Mostrar velocidade (Hz) e largura (cents) ao lado de referências nomeadas (lento e largo, rápido e raso).
- Não existe valor correto: descrever, não pontuar.

## O que não fazer
- **Nota única de "musicalidade".** Não existe métrica validada (ver `PESQUISA.md`), e uma nota dessas repete o defeito do Yousician: premia quem obedece à regra, não quem faz música.
- Mostrador de afinação ligado durante improviso.
- Distinguir slide de bend automaticamente: a detecção é pouco confiável (F em torno de 0,36 para slide no estudo TENT).
- Medir dinâmica: compressão e distorção achatam o sinal.
- Julgar se um motivo foi bem desenvolvido, timbre, intenção ou gosto. Isso fica como autoavaliação, com um modelo para comparar.

## Privacidade
Áudio processado e guardado só no navegador. Nada sobe para servidor.
