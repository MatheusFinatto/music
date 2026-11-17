# Backlog e ideias combinadas

## Próximos passos sugeridos
- **Microfone (guitarra)**: gravar o som da guitarra no navegador e medir afinação dos bends (em cents), notas do acorde no tempo forte, % de silêncio, notas por compasso e vezes parado na tônica. Era o plano da skill "analisar-solo"; agora pode ser feito direto no site (Web Audio + detecção de pitch, ex.: YIN/autocorrelação).
- **Reorganizar o Diário em rodízio de focos** (vocabulário, alvos variados, saltos/desenho, tensão e resolução, ritmo e espaço, expressão), saindo das semanas temáticas. A semana 1 atual é toda de 3ªs e ele sentiu o plano "preso".
- Exemplos para os desafios que ainda não têm (5ª, alvo misto, tônica por salto, só 3 notas, ponto mais alto, 9ª longa, 6ª, alvo no tempo 3).
- **Sincronizar entre aparelhos**: proposto Vercel Storage (Upstash Redis) + código/link de sincronização, sem login. Ele não quis o Firebase (trabalhoso). Pendente: ele criar o banco no painel da Vercel. `store.js` já tem carimbo de tempo por seção e ganchos de salvamento.
- **Teclado MIDI** (Web MIDI) no piano.
- **PWA** (instalar no celular, funcionar offline).
- Bases de 8 compassos e 2 acordes por compasso.

## Feito
- Piano: missões semanais trocadas por **Desafios** (desafio do dia + lista), seletor de alvo (T, 3ª, 5ª, 9ª, todas), ideias guardam o desafio.
- Editor de ideias: "Ajustar todas ao tempo" (1, ½, ¼ de tempo) e edição nota a nota (clique na partitura ou na tab), com Desfazer e Voltar ao original.

## Decisões já tomadas
- Dados só no navegador, com backup (sem login).
- Treino de ouvido fica em app externo (Functional Ear Trainer), não no site.
- Montador de base é uma janela (modal), não uma página.
