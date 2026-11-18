# Marmota Music

Site de música generalista, gratuito e não comercial, com foco em guitarra. Um **hub** (a homepage) leva a **ferramentas de prática independentes**; cada uma tem que ser excelente sozinha. Em português do Brasil. Publicado na Vercel em `marmota-music.vercel.app`.

Vários devs contribuem, cada um numa ferramenta. **Leia antes de mudar qualquer coisa:**
- `docs/ARQUITETURA.md` — estrutura, regra de isolamento e **como adicionar uma ferramenta**.
- `docs/ROADMAP.md` — o que vem, em que ordem, e o contrato do núcleo compartilhado.
- `docs/PROJETO.md` — visão e decisões já tomadas.
- `PRODUCT.md` e `DESIGN.md` — verdade de produto e sistema visual.
- `docs/solos/` — pesquisa e especificações de "Como solar com a pentatônica".
- `legacy/CLAUDE.md` — só se for mexer no Laboratório (site antigo).

## Comandos
```bash
npm install
npm run dev         # Next (hub e ferramentas novas). O Laboratório aparece se já foi gerado.
npm run build       # gera o Laboratório e depois o Next
npm run lint && npm run typecheck && npm run check && npm test
npm run start       # serve o build
npm run smoke       # teste de fumaça no navegador (Playwright), com o start rodando
```

## Regras
- **Isolamento**: uma ferramenta (`src/tools/<slug>/`) nunca importa de outra. O que for comum vai para `src/core/`. O lint barra.
- **Registro**: toda ferramenta entra em `src/tools/registry.ts`. O hub lê de lá; não escreva lista de ferramentas em outro lugar.
- **Textos**: nada de texto de interface fixo no código. Tudo em `messages/pt-BR.json` (next-intl). Exceção: conteúdo didático longo (lições, exercícios) é dado tipado por idioma dentro da ferramenta (ver `docs/ARQUITETURA.md`, "Conteúdo longo"). Português do Brasil, direto, sem linguagem de venda.
- **Status honesto**: `pronta`, `laboratorio`, `proxima` ou `planejada`. Sem datas prometidas.
- **Notas** no formato letra + oitava (**C4, Bb3**; C4 = Dó central).
- **Cores com significado** nas ferramentas: laranja = nota-alvo, azul = tocando agora, verde = selecionado.
- **Dados** só no navegador (`localStorage`, prefixo `musica:`). Sem backend nem contas até o dono pedir.
- **Tablatura de música comercial só dentro de lição de análise.** Proibido: catálogo de músicas (tab inteira para tocar a música). Permitido: lick ou solo de uma gravação dentro de uma lição que analisa a técnica (shape, tom, nota de fora), com crédito e o vídeo oficial incorporado, como uso de trecho para estudo (Lei 9.610/98, art. 46, VIII). O solo entra inteiro, em partes numeradas que começam e terminam numa frase (nunca no meio dela), com a base daqueles compassos (`songBars`), e uma lição final com o solo completo; a fonte da tab vai creditada com link (`source` da lição). Exercício de eco com `transcribed: true` e base com `song`.
- `legacy/` está congelado: só correção.
- **Next 16** mudou convenções (ex.: `src/proxy.ts` no lugar de `middleware.ts`). Antes de usar uma API do Next, confira em `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- TypeScript fica na versão 6: o lint ainda não aceita a 7.

## Git
- Push na `main` publica na hora. Trabalhe em branch e abra PR; o merge é do dono.
- Antes de pedir revisão: `npm run lint`, `npm run typecheck`, `npm run check`, `npm test` e `npm run build` passando.

## Marmota Tuner (app Android)
`marmota-tuner/` é o **Marmota Tuner**, um app Android (afinador cromático em Kotlin), fora do build do site (`.vercelignore`). A página `/afinador` (`src/tools/afinador/`) afina no navegador e entrega o APK publicado num Release do GitHub; a pessoa escolhe. O app também tem um metrônomo, com a mesma lógica do `/metronomo` do site (`marmota-tuner/core/.../Metronome.kt`, exposta em `src/core/rhythm`).

**Uma lógica, dois afinadores.** Detecção (YIN), Hz → nota e cents, suavização, agulha e geometria da tela ficam em Kotlin em `marmota-tuner/core`. O app usa direto; o site usa o JS compilado em `src/core/pitch/generated/`, commitado (a Vercel não tem JDK). Mudou algo em `marmota-tuner/core/src/commonMain`? Rode `./gradlew :core:exportToSite` em `marmota-tuner/` e commite o JS junto. A CI (`.github/workflows/ci.yml`) falha se esquecer. O desenho da tela é de cada plataforma: `TunerPainter.kt` no app, `src/tools/afinador/painter.ts` no site; mudou um, mude o outro. Ver `marmota-tuner/README.md`.
