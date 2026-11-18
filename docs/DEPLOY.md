# Publicação (Vercel)

- Repositório: `MatheusFinatto/music` (GitHub), branch `main`.
- Projeto na Vercel: **marmota-music** → `https://marmota-music.vercel.app`.
- Framework: **Next.js**. Build: `npm run build` (gera o Laboratório em `public/laboratorio/` e depois o Next). URLs limpas e redirecionamentos estão em `next.config.ts`.

**Cada push na `main` publica sozinho.** Branches e PRs ganham URL de prévia: confira a prévia antes do merge.

## Framework
O projeto foi criado na Vercel como Vite. O `vercel.json` na raiz diz `"framework": "nextjs"`, o que vale por cima da configuração do painel; não é preciso mexer lá.

Se mesmo assim um deploy falhar reclamando da pasta `dist`, é porque alguém fixou a pasta de saída à mão no painel: vercel.com → projeto `marmota-music` → Settings → Build and Deployment → desligue o "Override" de **Output Directory**.

## Antes de publicar
```bash
npm run lint && npm run typecheck && npm run check && npm run build
```
