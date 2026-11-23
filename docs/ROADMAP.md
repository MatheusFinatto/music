# Roadmap

Sem datas. A ordem é a recomendada; cada ferramenta só é lançada quando estiver excelente.

## Feito
- **Fundação e hub** (novembro de 2026): Next na raiz, registro de ferramentas, homepage, site antigo movido para o Laboratório.

## Em andamento
- **Treino de ouvido** (`/treino-de-ouvido`): no ar (2026-11-23). O dono ficou com o **clássico** (intervalos e acordes: ouvir, escolher e ver no teclado o que foi tocado; uso pessoal); o **funcional** (cadência I-IV-V-I que fixa o tom e uma nota: dizer o grau) segue no código, escondido (`VISIVEIS` em `TreinoDeOuvido.tsx`), para voltar se ele sentir falta. Som de piano de amostras (`core/audio/piano`). Modelos: Perfect Ear, MyEarTraining e OpenEar (MIT) no clássico; Toned Ear e o Functional Ear Trainer no funcional. O app Android (`marmota-ear/`) não é prioridade: o uso é pessoal e o site no celular serve.
- **Curso "Como solar com a pentatônica" (`/solos`): removido em 2026-11-23** (decisão do dono: não deu certo). Fica no histórico do git. O site mantém só as utilidades; o Diário e o Piano seguem em `/laboratorio`.
- **Criador de ideias**, o redesenho do Piano de Ideias, refeito do zero como ferramenta do site novo (antes planejado "depois dos solos").

## Ordem recomendada
1. **Tirar de ouvido** — o diferencial do site. Núcleo: carregar um áudio, marcar trecho A–B em loop, desacelerar sem mudar o tom, e o método de treino por cima disso.
2. **Afinador** — rápido de fazer, e é quem inaugura microfone e detecção de altura no núcleo, que o treinador e o treino de ouvido reaproveitam. Pode andar em paralelo com o item 1, por outro dev. **Feito**: `/afinador` afina no navegador e entrega o app Android Marmota Tuner (`marmota-tuner/`). Os dois rodam a mesma lógica, escrita em Kotlin (`marmota-tuner/core`) e compilada para JS em `src/core/pitch`. Faltam as pendências em "Notas para o afinador", que as ferramentas que ouvem a guitarra vão cobrar.
3. **Treino de ouvido** — intervalos, acordes, graus funcionais.
4. **Improvisação** — redesenho do Laboratório (Diário e Piano) como ferramenta do site novo.
5. **Metrônomo** — **Feito no site** (`/metronomo`) e no código do app (`MetronomeActivity`), no mesmo esquema do afinador: a lógica em Kotlin (`Metronome.kt`), compilada para JS em `src/core/rhythm`. Falta publicar o APK 1.1, assinado com a chave do dono. O Player de tab e MIDI saiu do plano (decisão do dono, 2026-11-18).

## Contrato do núcleo (`src/core/`)
Criado sob demanda pela primeira ferramenta que precisar. Quem chegar primeiro define a interface; quem vier depois reaproveita e, se precisar mudar, muda num PR separado.

| Módulo | O que oferece | Quem inaugura | Ponto de partida |
|---|---|---|---|
| `core/audio/context` | Um único `AudioContext` do site, criado no primeiro gesto do usuário | **Feito** | — |
| `core/audio/mic` | Pedir o microfone, entregar o sinal em blocos, tratar permissão negada e ausência de microfone | **Feito** (afinador) | — |
| `core/pitch` | Detecção de altura (YIN), Hz → nota + cents, suavização e o desenho do mostrador. Compilado do Kotlin do app (`marmota-tuner/core`). Hoje devolve só `hz`, sem a clareza | **Feito** (afinador) | — |
| `core/storage` | `createStore`: `localStorage` com prefixo `musica:`, versão, assinável | **Feito**. Backup ainda não | — |

| `core/audio/piano` | Piano de amostras (Salamander, CC BY 3.0): `loadPiano`, `playPiano`, `stopPiano`; uma amostra a cada terça menor, o resto por velocidade de leitura | **Feito** (treino de ouvido) | — |

Saíram em 2026-11-23, com o curso `/solos`, por não terem mais uso: `core/theory` (notas, acordes, pentatônica, braço), `core/audio/transport`, `backing`, `lead`, `samples`, `sound`, `eq` e as amostras de violão (`public/sons/`). Estão no histórico do git (até o PR #74); a próxima ferramenta que precisar de um deles os recupera de lá.

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
