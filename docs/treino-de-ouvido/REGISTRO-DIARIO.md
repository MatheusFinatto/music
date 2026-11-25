# Registro diário, cartão "Hoje" e janela móvel

Item 1 da análise crítica de 2026-11-23. A lógica fica no Kotlin compartilhado (`marmota-tuner/core/.../treino/Diario.kt` e
`Engine.kt`), usada pelo app e, compilada, pelo site (`src/core/treino`). O formato salvo é o mesmo nos dois.

## Registro diário
- Uma entrada por dia (calendário local, `AAAA-MM-DD`) e seção (`ouvido`, `voz`): respostas, acertos e segundos.
- Conta: cada resposta do ouvido; cada tentativa da voz (menos o Alcance, que mede e não acerta) e cada música cantada.
- O tempo é o da pergunta ou tentativa, com teto de 90 s (tela esquecida aberta não vira prática).
- Guarda 120 dias. Site: `musica:treino-diario`; app: a mesma chave nas preferências.

## Cartão "Hoje"
- No topo do Programa, nas duas seções. Só números, sem frase de incentivo nem texto de instrução.
- Mostra: minutos e "acertos de respostas" de hoje; os últimos 7 dias como 7 colunas de pixel (hoje à direita, em marfim; a
  altura anda em 8 degraus relativos ao maior dia); "N dias seguidos" a partir de 2 (hoje ou, se hoje ainda não teve treino, até ontem).
- Sem treino nenhum na seção, o cartão não aparece.

## Janela móvel
- Cada item do histórico guarda as últimas 20 respostas (`r`: "1" certo, "0" errado), além dos totais de sempre.
- Pontos fracos e o reforço usam a janela (com 2 ou mais respostas); dado antigo, sem janela, usa os totais.
- Efeito: quem aprendeu um item para de ser cobrado pelos erros antigos.

## Fora do escopo
- Metas diárias, lembretes, gráficos longos e conta/sincronização (os dados continuam só no aparelho).
- Pontos fracos próprios da voz.
