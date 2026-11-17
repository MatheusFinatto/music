# Arquitetura do Laboratório

> **Escopo:** o site antigo, congelado em `legacy/` e servido em `/laboratorio`. Caminhos abaixo são relativos a `legacy/`. A arquitetura do site novo está em `docs/ARQUITETURA.md`.

Site estático multi-página com **Vite** e JavaScript puro (sem framework). Única dependência: `abcjs` (partitura).

```
index.html, diario.html, piano.html   páginas (entradas no vite.config.js)
src/styles.css                         tokens de cor/tipo (claro e escuro) e componentes comuns
src/pages/*.js|.css                    código de cada página
src/lib/theory.js                      campo harmônico, nomes (C4), funções (T,3,5…), posição na guitarra
src/lib/base.js                        a base: tom, progressão (graus), bpm, estilo, mixagem; presets e estilos
src/lib/audio.js                       Web Audio: voz do piano, pad, baixo, bateria sintetizada, metrônomo e o TRANSPORTE
src/lib/basebar.js                     barra da base + janela "Montar base" (usada em todas as páginas)
src/lib/score.js                       partitura (ABC → abcjs), tab em texto, cifra rápida, destaque, exportar HTML
src/lib/edit.js                        editor de ideias: ajustar ao tempo, mover, encurtar/alongar, ±½ tom, apagar (funções puras)
src/lib/store.js                       localStorage (prefixo musica:), backup exportar/importar
src/lib/plan.js                        conteúdo dos 57 dias do Diário
src/lib/missions.js                    missões semanais do Piano e os exemplos
scripts/check.mjs                      validação dos dados (Node)
scripts/smoke.mjs                      teste de fumaça no navegador (Playwright)
```

## Base e teoria
- A base guarda o **tom** como `key` = tônica do tom maior (0 = Dó; Am é o relativo). A progressão é uma lista de **graus** 0..6 (`[5,3,0,4]` = vi IV I V = Am F C G).
- `makeChord(grau, key)` devolve `{ n (nome), r (fundamental), t (tríade), third, ninth, bass, pad, roman, deg }`.
- Nomes com bemol nos tons de F, Bb, Eb, Ab, Db, Gb; sustenido nos outros.
- `shiftOf(base)` = deslocamento em semitons do tom padrão (usado para transpor exemplos e a região do braço).

## Transporte (audio.js)
- Conta em semicolcheias; o ciclo é de **4 compassos** (16 tempos). Contagem de 1 compasso opcional (tempos negativos).
- Eventos: `transport.on("beat", (beat, time, info) => …)`, `"start"`, `"stop"`. `time` é o relógio do Web Audio; para mexer na tela, agende com `setTimeout((time - now()) * 1000)`.
- `transport.curBeat()` dá o tempo atual (fracionado), usado na gravação.
- Trocar a base (`setBase`) atualiza o transporte sem parar.

## Ideias (piano)
Formato salvo:
```js
{ name, created, bpm, star, tried,
  base: { key, prog: [graus] },          // base em que foi gravada
  notes: [ { m: 60, b: 0, d: 2 } ] }     // m = MIDI (60 = C4), b = tempo de início 0..15.75, d = duração em tempos
```
Ideias antigas (vindas do artefato) podem ter `prog: ["Am","F","C","G"]` no lugar de `base`; `legacyToDegrees` converte.
A gravação quantiza em semicolcheias. Ao editar, a primeira versão fica em `original` (botão "Voltar ao original"); o "Desfazer" é só da sessão.

## Dados no navegador
Chaves: `musica:base`, `musica:piano` (`{meta:{color,week}, ideas:{id:ideia}, missions:{w1:[bool…]}}`), `musica:diario` (`{meta:{phrases:{semana:texto}}, days:{n:{done,count,note,scores,video,ts}}}`).
Backup: `exportAll()` / `importAll()` em `store.js` (formato `{app:"musica", version:1, base, piano, diario}`).
**Missões**: salve sempre a lista completa de booleanos da semana (sem buracos).

## Partitura
- ABC gerado em `toAbc`, sempre `K:C` com acidentes explícitos (funciona em qualquer tom).
- Cada nota recebe `data-ni` (índice na ideia) para destacar na reprodução; a tab usa `<span class="tn" data-ni>`.
- Notas com cabeça vazada (mínimas) ganham um retângulo invisível para o hover funcionar.
- Layout se adapta à largura (4, 2 ou 1 compasso por linha) com `ResizeObserver`.

## Como adicionar
- **Missão**: em `src/lib/missions.js`, `MISS[semana-1]` recebe `["piano"|"ouvir"|"guitarra", "texto", "chaveDoExemplo?"]`. Adicione no **fim** da semana para não deslocar as caixas já marcadas.
- **Exemplo**: `DEMOS[chave] = { name: "Exemplo: …", prog, bpm, targets?: ["3"], notes: [...] }` no tom de Dó; o site transpõe.
- **Estilo de base**: `STYLES` em `base.js` (padrões de 16 semicolcheias para bumbo, caixa, chimbal e baixo).
- Rode `npm run check` depois.
