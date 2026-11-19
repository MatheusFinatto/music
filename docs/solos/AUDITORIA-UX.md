# Auditoria visual do /solos (2026-11-19)

Escopo: as 173 lições (`/solos?licao=<id>`), em celular (390x844, com toque) e desktop (1280x800), todos os exercícios de cada lição, até "Sessão feita". Feita por 8 agentes só de leitura, com Playwright e o detector do impeccable. Relatórios completos por lote ficaram fora do repositório (scratchpad da sessão). As demais telas (trilha, sessão sugerida, calendário, exercício avulso, link inválido, treino cronometrado aberto e "Sessão feita") foram medidas depois, no mesmo script: sem rolagem horizontal, sem aviso no console, sem alvo abaixo de 44 px (fora os `plan-link`, falso positivo por causa do `::after`).

Resultado: **0 P0, 0 P1** nas 173 lições. O detector só apontou a fonte Inter (falso positivo: está no `DESIGN.md`). Sem erro de console, sem rolagem horizontal de página, sem imagem sem `alt`.

Limites: o vídeo incorporado do YouTube aparece preto no navegador sem tela, então a reprodução não foi avaliada; o áudio quase não foi tocado; contraste foi medido só em parte das lições e extrapolado para as que usam o mesmo painel; o servidor de desenvolvimento estava sob carga durante a auditoria (hidratação lenta).

## Corrigido nesta rodada
| Achado (sistêmico) | Correção | Onde |
|---|---|---|
| Sem h1 do 2º exercício em diante (só h2) | O título do exercício vira h1 quando a teoria da lição não aparece | `ExerciseFrame.tsx` |
| Último "Próximo" encerra a lição sem dizer | Último passo (ou o único) diz "Concluir" | `ExerciseFrame.tsx`, `messages/pt-BR.json` (`frame.finish`) |
| Campo de bpm com 36 a 42 px de altura (barra da base e treino) | 44 px; o treino ganhou estilo próprio | `solos.css` |
| Link "Calendário" com 22 px | Alvo de 44 px por padding e margem negativa, sem mexer na linha | `solos.css` |
| Tablatura ASCII e braço rolam na horizontal sem foco por teclado | `useScrollable`: só quando rola, recebem `tabIndex` e nome | `components/useScrollable.ts`, `PhraseViews.tsx`, `Fretboard.tsx` |
| Abas de solo sem nome distinto ("parte 1" ×3) | Nome acessível "Solo N: parte M" | `EchoEngine.tsx` |
| Link da fonte da tablatura sem cara de link | Sublinhado | `solos.css` |
| Link direto `?licao=` mostrava a trilha por ~1,3 s antes da lição | O HTML do servidor fica escondido quando o endereço já aponta para outra tela; a trilha sem link e o link inválido seguem visíveis | `app/[locale]/solos/page.tsx`, `Solos.tsx`, `solos.css` |
| Ordem do Tab diferente da ordem visual (Tocar base e bpm depois das abas) | A barra da base (e o modo de tocar, no eco; a tomada, na tomada) passou para o começo do DOM em todos os motores, igual à ordem visual. O "Voltar para a trilha" continua no fim do DOM de propósito | `MapEngine`, `LineEngine`, `PlayRestEngine`, `TargetEngine`, `EchoEngine`, `TakeEngine` |
| "Ver no braço" pintava o lick de laranja | Notas do lick são bolinhas de escala (madrepérola, com o nome); laranja só no alvo, azul no que soa | `PhraseViews.tsx` |
| Quiz "marque todas as tônicas" sem progresso | Contador "achadas/total" ao lado da pergunta | `FindEngine.tsx` |
| Botão "Próxima" parecido com "Próximo"; foco caía no `body` depois dele | "Próxima pergunta"; o foco vai para a pergunta nova | `FindEngine.tsx`, `messages/pt-BR.json` |
| Aviso de hidratação por causa da marca do link direto, e aviso de `allowfullscreen` redundante no vídeo | `suppressHydrationWarning` no `<html>`; `allowFullScreen` removido (o `allow` já tem `fullscreen`) | `layout.tsx`, `ExerciseFrame.tsx` |
| Botões de mês e links das lições do dia no calendário com 36 px de largura e 26 px de altura | 44 px | `solos.css` |

Verificado no navegador: h1 no passo 2 (`u15.l1`, `u7.l1`), "Concluir" no último passo, braço rolável com foco (`u7.l1`), nome das abas e sublinhado da fonte (`u49.l1`), link direto sem página errada visível, trilha sem link e link inválido visíveis, volta à trilha.

## Decisões do dono (2026-11-19, depois da auditoria)
O dono abriu mão das duas decisões adiadas e pediu a posição do impeccable:
- **Vídeo, créditos e teoria passam para antes do palco** (`ExerciseFrame.tsx`: sem o modo `late`). No celular, o vídeo de `u56.l1` caiu de ~1900 px para ~600 px do topo. O título da lição é sempre o h1; o do exercício é h2 quando há teoria.
- **"Ouvir exemplo" passa para antes de "Sua vez"**: no quadro (`DemoPlayer`) e na tomada (`TakeEngine`, `.example` com `order: 1`). Em `u10.l3` o botão foi de ~1655 px para ~866 px; em `a5.l1`, de ~1520 px para ~776 px. A ordem da tela e a do Tab voltam a coincidir.
- **Banner parado de ~165 px: aceito.** Mede 0 px de salto ao tocar, que foi o pedido anterior do dono; reservar só nas tomadas exigiria medir cada motor.

## Não corrigido
- **Rótulos "Lick N" com a mesma descrição da técnica** na mesma lição (`u49.l2`, `u62.l2`, `u54.l2`, `u63.l2`, `u58.l2`, `u56.l2`, `u43.l2`, `u42.l2`, `u64.l2`, `u68.l2`, `u40.l2`). O número já distingue as abas. Distinguir pela descrição exigiria nota ou posição na etiqueta (mais longa, e as abas já quebram em 2 linhas no celular) ou ouvir cada lick.
- **Células e pontos do braço no quiz de toque com 33 a 39 px de altura.** Passam o WCAG 2.5.8 (24 px); ampliar sobrepõe as cordas vizinhas.

## P3 sem ação
Seletor de modo e abas quebram em 2 a 3 linhas no 390 (sem corte); cartão de introdução de 150 a 190 px antes do exercício; troca de aba muda a altura em ±48 px (`u66.l1`) e a linha de abas desloca 13 px (`u48.l1`); título duplicado em `a12.l1`; card dentro de card em `u10.l3`, `u10.l4`, `a12.l1`; lista numerada com um item só; "Lick 1" e "Lick 4" de `u54.l2` com rótulo igual.
