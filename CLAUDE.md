# Musical Tools

Site de música generalista, gratuito e não comercial, guitarra primeiro. Um **hub** (a homepage) leva a **ferramentas de prática independentes**; cada uma tem que ser excelente sozinha. Em português do Brasil. Publicado na Vercel em `music-finatto.vercel.app`.

Vários devs contribuem, cada um numa ferramenta. **Leia antes de mudar qualquer coisa:**
- `docs/ARQUITETURA.md` — estrutura, regra de isolamento e **como adicionar uma ferramenta**.
- `docs/ROADMAP.md` — o que vem, em que ordem, e o contrato do núcleo compartilhado.
- `docs/PROJETO.md` — visão e decisões já tomadas.
- `PRODUCT.md` e `DESIGN.md` — verdade de produto e sistema visual.
- `legacy/CLAUDE.md` — só se for mexer no Laboratório (site antigo).

## Comandos
```bash
npm install
npm run dev         # Next (hub e ferramentas novas). O Laboratório aparece se já foi gerado.
npm run build       # gera o Laboratório e depois o Next
npm run lint && npm run typecheck && npm run check
npm run start       # serve o build
npm run smoke       # teste de fumaça no navegador (Playwright), com o start rodando
```

## Regras
- **Isolamento**: uma ferramenta (`src/tools/<slug>/`) nunca importa de outra. O que for comum vai para `src/core/`. O lint barra.
- **Registro**: toda ferramenta entra em `src/tools/registry.ts`. O hub lê de lá; não escreva lista de ferramentas em outro lugar.
- **Textos**: nada de texto visível fixo no código. Tudo em `messages/pt-BR.json` (next-intl). Português do Brasil, direto, sem linguagem de venda.
- **Status honesto**: `pronta`, `laboratorio`, `proxima` ou `planejada`. Sem datas prometidas.
- **Notas** no formato letra + oitava (**C4, Bb3**; C4 = Dó central).
- **Cores com significado** nas ferramentas: laranja = nota-alvo, azul = tocando agora, verde = selecionado.
- **Dados** só no navegador (`localStorage`, prefixo `musica:`). Sem backend nem contas até o dono pedir.
- **Sem catálogo de tablaturas** de músicas comerciais (direito autoral). O player abre arquivos do usuário.
- `legacy/` está congelado: só correção.
- **Next 16** mudou convenções (ex.: `src/proxy.ts` no lugar de `middleware.ts`). Antes de usar uma API do Next, confira em `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- TypeScript fica na versão 6: o lint ainda não aceita a 7.

## Git
- Push na `main` publica na hora. Trabalhe em branch e abra PR; o merge é do dono.
- Antes de pedir revisão: `npm run lint`, `npm run typecheck`, `npm run check` e `npm run build` passando.

## Marmota Tuner (app Android)
`marmota-tuner/` é o **Marmota Tuner**, um app Android separado (afinador cromático em Kotlin), fora do build do site (`.vercelignore`). Não faz parte do hub nem do `registry.ts` (o afinador web planejado lá é outra coisa). Ver `marmota-tuner/README.md`.
