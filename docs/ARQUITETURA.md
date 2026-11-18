# Arquitetura

Next.js (App Router) + TypeScript + Tailwind v4 + next-intl. Sem backend: tudo roda no navegador.

```
src/app/[locale]/layout.tsx    casca do site: cabeçalho, rodapé, fontes, tema
src/app/[locale]/page.tsx      o hub
src/app/[locale]/<slug>/       a rota de cada ferramenta
src/tools/registry.ts          lista de ferramentas (fonte única)
src/tools/<slug>/              o código de UMA ferramenta
src/core/theory                notas, acordes, pentatônica, posições no braço (puro, com testes)
src/core/audio                 AudioContext único, microfone, transporte, base sintetizada, voz solista
src/core/pitch                 afinador: detecção de altura, Hz → nota e cents, suavização (lógica em Kotlin, ver abaixo)
src/core/storage               localStorage com prefixo musica: e versão
src/components/                interface compartilhada (cabeçalho, rodapé, peças do hub)
src/i18n/                      configuração do next-intl
src/proxy.ts                   roteamento de idioma
messages/pt-BR.json            todos os textos visíveis
legacy/                        site antigo (Vite), vira public/laboratorio/ no build
```

## Regra de isolamento
1. **Uma ferramenta nunca importa de outra.** Nem código, nem estilo, nem tipo.
2. O que duas ferramentas precisam vai para `src/core/` (lógica, sem interface) ou `src/components/` (interface).
3. `src/core/` não importa de ferramentas, páginas nem componentes. É TypeScript puro, testável sem navegador sempre que possível. Exceção: `src/core/pitch/generated/` é JavaScript compilado do Kotlin de `marmota-tuner/core`, a mesma lógica que o app Android usa. Não se edita à mão: mude o Kotlin e rode `./gradlew :core:exportToSite` em `marmota-tuner/`. A CI falha se os dois divergirem.
4. Nada em `src/` importa de `legacy/`. Para reaproveitar algo de lá, **migre** para `src/core/` em TypeScript.

O lint (`eslint.config.mjs`) barra os imports por `@/tools/...`. Dentro da própria ferramenta, use import relativo.

O motivo: cada ferramenta tem um dono e evolui no seu ritmo. Mexer no afinador não pode quebrar o player.

## Como adicionar uma ferramenta
Exemplo com o afinador (`slug`: `afinador`).

1. **Registro**: em `src/tools/registry.ts`, a entrada já existe como `planejada`. Ao começar, mude para `proxima`; ao lançar, para `pronta` e acrescente `href: "/afinador"`.
2. **Textos**: em `messages/pt-BR.json`, `tools.afinador` já tem `name` e `summary` (usados no hub). Os textos da ferramenta em si vão num bloco próprio no topo do arquivo: `"afinador": { ... }`.
3. **Código**: crie `src/tools/afinador/`. Sugestão: `Afinador.tsx` (componente raiz, `"use client"`), `components/`, `lib/` (lógica pura), `afinador.css` se precisar.
4. **Rota**: `src/app/[locale]/afinador/page.tsx`, um componente de servidor fino que define `metadata` e renderiza `<Afinador />`. Para usar textos dentro de componente cliente, envolva a ferramenta em `<NextIntlClientProvider messages={pick(messages, "afinador")}>` na página: só o bloco dela vai para o navegador. Áudio só existe no navegador: nada de Web Audio fora de componente cliente, e crie o `AudioContext` em resposta a um gesto do usuário.
5. **Núcleo**: se precisar de algo que outra ferramenta também vai usar, coloque em `src/core/` seguindo o contrato de `docs/ROADMAP.md`. Se outra ferramenta já tem algo parecido dentro dela, mova para `src/core/` num PR separado, antes.
6. **Dados**: `localStorage` com chave `musica:<slug>`. Guarde um campo `version` para poder migrar depois.
7. **Conferir**: `npm run lint && npm run typecheck && npm run build`, e a ferramenta em 360 px de largura, em claro e escuro, navegável por teclado.

O hub se atualiza sozinho a partir do registro. Não edite `page.tsx` do hub para acrescentar ferramenta.

## Conteúdo longo
Texto de interface vai em `messages/`. Conteúdo didático extenso (lições, exercícios) é dado tipado dentro da ferramenta, um arquivo por idioma: veja `src/tools/solos/curriculum/pt-BR.ts`. Para outro idioma, crie `en.ts` com o mesmo formato.

## Testes
Só testes de unidade (Vitest) para lógica pura: `src/**/*.test.ts`. Rode com `npm test`. Sem testes de navegador.

## Idiomas
`src/i18n/routing.ts` tem um idioma (`pt-BR`), sem prefixo na URL. Para acrescentar inglês: inclua `"en"` em `locales` e crie `messages/en.json`. As rotas viram `/en/...` sozinhas. Por isso nenhum texto visível fica fixo no código, e links internos usam `Link` de `@/i18n/navigation`.

## Laboratório (`legacy/`)
O site antigo é um projeto Vite à parte. `npm run build:lab` gera `public/laboratorio/` (ignorado pelo git) e o Next serve como arquivo estático. `next.config.ts` cuida das URLs limpas (`/laboratorio/diario`) e redireciona os endereços antigos (`/diario`, `/piano`). O `src/proxy.ts` ignora `/laboratorio`.

Mesma origem do site novo, então o `localStorage` (`musica:base`, `musica:piano`, `musica:diario`) é compartilhado. **Ferramentas novas não leem nem escrevem nessas três chaves.**

Detalhes internos: `legacy/docs/ARQUITETURA.md`.

## Sistema visual
`DESIGN.md` na raiz descreve o sistema (cores, tipos, componentes). Os tokens ficam em `src/app/globals.css`. Ferramentas usam os tokens; não inventam paleta própria.
