# Roadmap

Sem datas. A ordem é a recomendada; cada ferramenta só é lançada quando estiver excelente.

## Feito
- **Fundação e hub** (novembro de 2026): Next na raiz, registro de ferramentas, homepage, site antigo movido para o Laboratório.

## Em andamento
- **Como solar no violão e na guitarra** (`/solos`): no ar no hub desde a fase 1; substitui o Diário do Solo e a "Improvisação" planejada. Diário e Piano saíram do hub e seguem em `/laboratorio`. Fase 1 feita: O mapa do braço, Respirar e Ritmo com poucas notas, frases de ouvido e sessão sugerida com teste a frio. A trilha é aberta (decisão do dono, 2026-11-17): nada é travado, o site só recomenda a próxima lição, e qualquer lição pode ser marcada como feita à mão. Fases 2 e 3 feitas, e o curso reorganizado (decisão do dono, 2026-11-17): **só pentatônica**, com a meta de improvisar um solo que alguém pagaria couvert para ouvir; notas de fora (7ª, 9ª, blue note), tom maior e blues ficam para depois. Cinco seções, cada uma fechando com um arco (tomada com dois solos de exemplo, tocados por botão próprio, num bloco separado do da base): Primeiros passos (mapa, respirar, ritmo), A harmonia (ouvir a troca, ligar, tensão e resolução), O braço (uma corda só, os cinco desenhos, outro tom), Velocidade (semicolcheias, sequências, licks repetidos) e O solo (motivo, vocabulário, intensidade, arco final de 16 compassos). Cada parte de um arco tem nome e explicação que se ouvem no exemplo (conferido por teste). As tomadas oferecem outras bases além da padrão. São 41 frases de ouvido, agrupadas por seção. O alvo na troca só sorteia notas da pentatônica. Bend e vibrato não têm unidade própria (técnica básica demais para o público). Cada lição e exercício tem endereço próprio (`?licao=`, `?exercicio=`); a frase mostra braço com gestos e tablatura. Falta: fase 4 (troca no hub). Pesquisa e decisões em `docs/solos/`.
- **Depois dos solos: Criador de ideias**, o redesenho do Piano de Ideias, refeito do zero como ferramenta do site novo.

## Ordem recomendada
1. **Tirar de ouvido** — o diferencial do site. Núcleo: carregar um áudio, marcar trecho A–B em loop, desacelerar sem mudar o tom, e o método de treino por cima disso.
2. **Afinador** — rápido de fazer, e é quem inaugura microfone e detecção de altura no núcleo, que o treinador e o treino de ouvido reaproveitam. Pode andar em paralelo com o item 1, por outro dev. **Feito**: `/afinador` afina no navegador e entrega o app Android Marmota Tuner (`marmota-tuner/`). Os dois rodam a mesma lógica, escrita em Kotlin (`marmota-tuner/core`) e compilada para JS em `src/core/pitch`. Faltam as pendências em "Notas para o afinador", que as ferramentas que ouvem a guitarra vão cobrar.
3. **Treino de ouvido** — intervalos, acordes, graus funcionais.
4. **Improvisação** — redesenho do Laboratório (Diário e Piano) como ferramenta do site novo.
5. **Player de tab e MIDI** — abre arquivo do próprio usuário (Guitar Pro, MIDI) e toca junto. A base técnica provável é a biblioteca alphaTab. **Sem catálogo de tablaturas**: música comercial é protegida por direito autoral.

## Contrato do núcleo (`src/core/`)
Criado sob demanda pela primeira ferramenta que precisar. Quem chegar primeiro define a interface; quem vier depois reaproveita e, se precisar mudar, muda num PR separado.

| Módulo | O que oferece | Quem inaugura | Ponto de partida |
|---|---|---|---|
| `core/audio/context` | Um único `AudioContext` do site, criado no primeiro gesto do usuário | **Feito** (solos) | — |
| `core/audio/mic` | Pedir o microfone, entregar o sinal em blocos, tratar permissão negada e ausência de microfone | **Feito** (afinador) | — |
| `core/pitch` | Detecção de altura (YIN), Hz → nota + cents, suavização e o desenho do mostrador. Compilado do Kotlin do app (`marmota-tuner/core`). Hoje devolve só `hz`, sem a clareza | **Feito** (afinador) | — |
| `core/theory` | Notas e conversões (Hz ↔ MIDI ↔ nome `C4`), campo harmônico, pentatônica, braço | **Feito** (solos). Hz → nota + cents ficou em `core/pitch` | — |
| `core/audio/transport` | Relógio musical, base sintetizada e eventos de tempo | **Feito** (solos) | — |
| `core/audio/lead` | Voz solista com bend, vibrato e slide. Toca violão gravado, uma nota por semitom (`samples.ts`, amostras em `public/sons/`, CC BY 3.0); a voz sintetizada fica como opção e como reserva enquanto as amostras baixam | **Feito** (solos) | — |
| `core/audio/sound` | Som escolhido pela pessoa (violão ou sintetizador, com tom e volume), guardado em `musica:som` e válido para o site todo | **Feito** (solos) | — |
| `core/storage` | `createStore`: `localStorage` com prefixo `musica:`, versão, assinável | **Feito** (solos). Backup ainda não | — |

Regras: sem interface dentro de `core/`; nomes de nota sempre `C4`, `Bb3`; lá de referência configurável (padrão 440 Hz).

### Notas para o afinador
- A detecção de altura tem que servir também ao treinador de bends e ao treino de ouvido cantado: devolva a frequência e a clareza cruas; o arredondamento para nota é de quem usa.
- Guitarra e baixo vão de ~41 Hz (E1) para cima: teste a corda mais grave do baixo.
- Mostre o desvio em cents. Afinações alternativas e outros instrumentos são dados, não código.
- Microfone exige HTTPS (ou `localhost`) e um gesto do usuário.
- **Pendente** (mudança no Kotlin de `marmota-tuner/core`, que vale para o app e o site juntos): devolver a clareza junto com a frequência; descer o piso de 60 Hz para ~40 Hz (baixo); lá de referência configurável (hoje fixo em 440 Hz).

## Ideias, por custo e benefício
- **Baratas, reaproveitam o núcleo**: metrônomo avançado (treinador de velocidade, compassos mudos, polirritmia); gerador de base como ferramenta própria (hoje é o "Montar base" do Laboratório); tap tempo.
- **Braço da guitarra**: explorador de escalas, acordes e CAGED; treinador de notas do braço; identificador de acorde a partir das notas.
- **Com microfone, pouco visto por aí**: treinador de afinação de bends em cents; treinador de ritmo que mede a precisão da palhetada.
- **Apoio**: detector de tom e de andamento de um áudio; registro de prática com sequência de dias.
- **Não recomendadas**: separar instrumentos de uma gravação no navegador (modelo pesado, ruim no celular); qualquer catálogo de tablaturas.

## Em aberto
- Nome e domínio.
- Contas (login e sincronização): depois. Até lá, tudo em `localStorage`.
