# Publicação (Vercel)

- Repositório: `MatheusFinatto/music` (GitHub), branch `main`.
- Projeto na Vercel: **musica-matheus-finatto** → `https://musica-matheus-finatto.vercel.app`.
- A Vercel detecta Vite sozinha: build `npm run build`, saída `dist/`. `vercel.json` liga URLs limpas (`/diario`, `/piano`).

## Primeira vez (feito pelo dono, uma vez só)
1. Em vercel.com → **Add New… → Project** → importar `MatheusFinatto/music`.
2. **Project Name**: `musica-matheus-finatto` (é isso que define o endereço).
3. Framework: Vite (detectado). Deploy.

Depois disso, **cada push na `main` publica sozinho**. Branches e PRs ganham URL de prévia.

## Antes de publicar
```bash
npm run check && npm run build
```
