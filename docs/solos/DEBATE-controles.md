# Debate UI x UX: controles do painel de prática (2026-11-19)

Pergunta do dono: opção para desligar a barra da base "grudada" (sticky)? Onde? A tela está poluída: modais?

**UI** (medido em `u17.l1`, 15 controles): a barra sticky ocupa ~150px; o problema é hierarquia (pílula, select, checkbox e segmentado com o mesmo peso). Propôs: barra que recolhe ao rolar (Tocar, bpm, acorde atual, ~56px); o switch "Fixar a barra ao rolar" dentro de um painel "Ajustes"; modal só para o que se ajusta uma vez (Tom, Som, Contagem, Base, Compassos); chip de resumo "Am · 72 · Violão".

**UX** (medido: 19 controles em `u41.l1`; barra sticky = 18% da altura, ~25% com o cabeçalho; 1 clique em cada tarefa principal): o fluxo é bom, o peso visual é o problema. Propôs: fixar só a linha 1 (Tocar, andamento, tom, som, ~64px) e deixar a faixa de acordes rolar; se o dono quiser a opção, um botão "Fixar" no canto da própria barra, lembrado no navegador; controles secundários numa seção que abre e fecha **na própria tela**; **sem modal** (quem toca não abre e fecha diálogo no meio do exercício).

**Pontos em comum:** (1) nenhum modal para o que se usa durante a tentativa; (2) enxugar a barra antes de criar opção; (3) preferência lembrada no navegador, ligada por padrão.

**Divergência:** UI queria um diálogo "Ajustes"; UX, uma seção inline. UX ganha: o dono já reclamou de "2 cliques para fazer o trabalho de 1", e um diálogo esconde o andamento e o modo.

## Decisão
1. **Sem modais** para controles de uso contínuo. O `<dialog>` do "Som" fica (timbre se escolhe uma vez).
2. **Sticky enxuto:** só a linha de cima (Tocar, − bpm +, Tom, Som, Fixar) fica fixa; a faixa de acordes rola com a página.
3. **Botão "Fixar" na própria barra** (pressionado = grudada), padrão ligado, guardado em `musica:solos:fixar`. É a opção que o dono pediu, onde a pessoa vê.
4. **"Ajustes" inline** (`<details>` fechado): Contagem antes, Base e Compassos ficam recolhidos; Ver no braço e Ver tab continuam à vista (são conteúdo).
5. **Abas do `u41`:** mantidas em duas fileiras por solo; reavaliar se o dono achar ruído.
