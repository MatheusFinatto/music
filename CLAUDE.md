# Música: treino de improviso

Site pessoal de treino de guitarra (improviso/solo), em português do Brasil. Publicado na Vercel em `music-finatto.vercel.app`.
O dono (Matheus) é guitarrista, se considera "muito teórico" e quer prática: frases que combinem técnica e beleza, com micro-evoluções diárias. Referência estética: David Gilmour.

**Antes de mudar qualquer coisa, leia:**
- `docs/PREFERENCIAS.md` — combinados com o dono sobre interface, notação e pedagogia. **Seguir à risca.**
- `docs/ARQUITETURA.md` — como o código está organizado e o modelo de dados.
- `docs/PROJETO.md` — objetivo, plano de 8 semanas e páginas.
- `docs/BACKLOG.md` — o que já foi pedido e ainda não foi feito, e ideias combinadas.
- `docs/PROGRESSO.md` — onde o aluno está, ideias já avaliadas e padrões observados. **Atualize ao avaliar ideias.**

## Comandos
```bash
npm install
npm run dev        # servidor local
npm run check      # valida plano (57 dias) e missões
npm run build      # build de produção (dist/)
```
Teste no navegador (precisa de Playwright): `npm run build && npx vite preview --port 4173 &` e depois `node scripts/smoke.mjs`.

## Regras rápidas
- Todo texto visível ao usuário em **português do Brasil**, direto, sem jargão de sistema.
- Notas sempre no formato **C4, A4, Bb3** (C4 = Dó central). Nunca "Dó, Ré, Mi" na interface.
- **Laranja = nota-alvo**, **azul = o que está tocando agora**. Não misturar.
- Informação extra (partitura, tab, cifra) aparece **sob demanda** (botão), não por padrão.
- Dados só no navegador (`localStorage`, prefixo `musica:`). Não adicionar backend sem o dono pedir.
- Antes de commitar: `npm run check` e `npm run build` precisam passar.
- Deploy: push na branch `main` publica automaticamente na Vercel (ver `docs/DEPLOY.md`).
