# Roadmap

Sem datas. A ordem é a recomendada; cada ferramenta só é lançada quando estiver excelente.

## Feito
- **Fundação e hub** (novembro de 2026): Next na raiz, registro de ferramentas, homepage, site antigo movido para o Laboratório.

## Ordem recomendada
1. **Tirar de ouvido** — o diferencial do site. Núcleo: carregar um áudio, marcar trecho A–B em loop, desacelerar sem mudar o tom, e o método de treino por cima disso.
2. **Afinador** — rápido de fazer, e é quem inaugura microfone e detecção de altura no núcleo, que o treinador e o treino de ouvido reaproveitam. Pode andar em paralelo com o item 1, por outro dev. Hoje o hub entrega o app Android Marmota Tuner (`marmota-tuner/`) no lugar; ele não alimenta o núcleo, então este item continua aberto e obrigatório: as ferramentas que ouvem a guitarra dependem dessas bases.
3. **Treino de ouvido** — intervalos, acordes, graus funcionais.
4. **Improvisação** — redesenho do Laboratório (Diário e Piano) como ferramenta do site novo.
5. **Player de tab e MIDI** — abre arquivo do próprio usuário (Guitar Pro, MIDI) e toca junto. A base técnica provável é a biblioteca alphaTab. **Sem catálogo de tablaturas**: música comercial é protegida por direito autoral.

## Contrato do núcleo (`src/core/`)
Criado sob demanda pela primeira ferramenta que precisar. Quem chegar primeiro define a interface; quem vier depois reaproveita e, se precisar mudar, muda num PR separado.

| Módulo | O que oferece | Quem inaugura | Ponto de partida |
|---|---|---|---|
| `core/audio/context` | Um único `AudioContext` do site, criado no primeiro gesto do usuário | Afinador | `legacy/src/lib/audio.js` |
| `core/audio/mic` | Pedir o microfone, entregar o sinal, tratar permissão negada e ausência de microfone | Afinador | — |
| `core/pitch` | Detecção de altura: recebe amostras, devolve `{ hz, clareza }`. Função pura, sem depender do navegador | Afinador | — |
| `core/theory` | Notas e conversões (Hz ↔ MIDI ↔ nome `C4` ↔ cents), escalas, campo harmônico | Afinador (o mínimo); Treino de ouvido amplia | `legacy/src/lib/theory.js` |
| `core/transport` | Relógio musical: andamento, compassos, eventos de tempo | Improvisação ou Player | `legacy/src/lib/audio.js` |
| `core/storage` | Leitura e escrita em `localStorage` com prefixo `musica:`, versão e backup | Primeira ferramenta que salvar algo | `legacy/src/lib/store.js` |

Regras: sem interface dentro de `core/`; nomes de nota sempre `C4`, `Bb3`; lá de referência configurável (padrão 440 Hz).

### Notas para o afinador
- A detecção de altura tem que servir também ao treinador de bends e ao treino de ouvido cantado: devolva a frequência e a clareza cruas; o arredondamento para nota é de quem usa.
- Guitarra e baixo vão de ~41 Hz (E1) para cima: teste a corda mais grave do baixo.
- Mostre o desvio em cents. Afinações alternativas e outros instrumentos são dados, não código.
- Microfone exige HTTPS (ou `localhost`) e um gesto do usuário.

## Ideias, por custo e benefício
- **Baratas, reaproveitam o núcleo**: metrônomo avançado (treinador de velocidade, compassos mudos, polirritmia); gerador de base como ferramenta própria (hoje é o "Montar base" do Laboratório); tap tempo.
- **Braço da guitarra**: explorador de escalas, acordes e CAGED; treinador de notas do braço; identificador de acorde a partir das notas.
- **Com microfone, pouco visto por aí**: treinador de afinação de bends em cents; treinador de ritmo que mede a precisão da palhetada.
- **Apoio**: detector de tom e de andamento de um áudio; registro de prática com sequência de dias.
- **Não recomendadas**: separar instrumentos de uma gravação no navegador (modelo pesado, ruim no celular); qualquer catálogo de tablaturas.

## Em aberto
- Nome e domínio.
- Contas (login e sincronização): depois. Até lá, tudo em `localStorage`.
