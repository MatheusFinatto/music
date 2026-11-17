# Preferências e combinados com o dono (Laboratório)

> **Escopo:** valem para o Diário do Solo e o Piano de Ideias (`legacy/`). Não são regras do site novo; para ele, veja `docs/` na raiz.

Estas regras saíram de feedback direto do dono durante o desenvolvimento. Quando algo aqui conflitar com um "bom padrão" genérico, **vale o que está aqui**.

## Jeito de trabalhar
- Ele quer **pragmatismo**: coisas para fazer com a mão na massa, não explicação teórica longa.
- **Micro-evoluções**: cada dia/missão tem uma meta pequena e mensurável.
- Quando ele pede para "avaliar uma ideia", a resposta é: tabela compasso a compasso (notas no formato C4, a função de cada uma), o que está bom, o que melhorar (no máximo 2–3 pontos concretos), e uma nota simples da regra da missão (ex.: "3 de 4"). Ele usa o botão **"Copiar para o Claude"** do Piano para mandar a ideia.
- Erros de execução dele (tempo adiantado, nota esbarrada) são comuns: aponte o padrão (ex.: "a nota depois de uma nota longa sai uma semicolcheia antes") e dê um remédio prático.

## Notação e textos
- Nomes de notas: **letra + oitava** (C4, A4, E5, Bb3, F#4). C4 = Dó central. **Nunca** "Dó · Ré · Mi" na interface.
- Nada de listas de notas soltas poluindo os cards (ele chamou de "poluição").
- Nas missões, **não** listar nomes de acordes/notas no texto ("ele sabe quais são os acordes"). As notas-alvo aparecem na **cifra rápida** (quadradinhos acorde/nota), que só aparece quando ele clica em "Ver partitura e tab".
- Os exemplos das missões são **exemplos da regra**, não para decorar. Nome sempre "Exemplo: …" (nunca "frase pronta"). O objetivo final é improvisar.
- Desafios e tarefas precisam ser **mastigados**: dizer exatamente o que fazer em 5–10 min. Ele é guitarrista: o piano é só para despertar ideias; todo desafio termina com "depois, na guitarra".

## Interface
- **Laranja (`--target`) = nota-alvo** (normalmente a 3ª do acorde; em alguns exemplos a 9ª). Fica fixo na partitura, tab, cifra e teclado.
- **Azul (`--accent`) = o que está tocando agora** (destaque durante a reprodução). Nunca usar laranja para isso.
- **Verde (`--ok`) = nota selecionada no editor** de ideias.
- Partitura, tab, cifra e listas longas (ex.: todos os desafios): **sob demanda** (botão). Nada aberto por padrão.
- A partitura mostra, embaixo de cada nota, a **função no acorde** (T, 3, 5, 7, 9…) e ao passar o mouse/tocar mostra o **nome (C4)**. Ele não lê partitura bem.
- Nada de scroll lateral: partitura e tab quebram em linhas conforme a largura.
- "Parar" numa frase para **a frase e a base juntas**.
- Montador de base: dentro de uma **janela (modal)**, não página separada. Base padrão: **Am F C G, 72 bpm**. Botões de subir/descer meio tom.
- Celular: tela cheia no piano (deitado mostra tudo; em pé, uma oitava com botão de oitava).

## Pedagogia
- **Não prender em 3ªs.** Ele sentiu o programa "preso em terças, truncado": tudo virou "3ª no tempo 1 + escala por grau", que soa mecânico (o problema original dele). O que mais incomoda são **as notas** (soam como escala), mais do que o ritmo.
  - O alvo é **uma opção entre várias** (T, 3ª, 5ª, 9ª, todas). O piano tem seletor de alvo; o laranja segue o alvo escolhido.
  - Variar: saltos (e voltar na direção contrária), sequências, antecipação, atraso da resolução (apojatura), nota segurada através da troca de acorde, ponto mais alto, poucas notas.
  - Vocabulário real (frases do Gilmour) entra em todo treino.
  - Preferir **rodízio de focos** a semanas inteiras de um tema só.

## Pedagogia (o que funcionou)
- Notas-alvo (3ª do acorde no tempo 1), notas de passagem **andando em direção** à próxima 3ª, bends para o alvo, ritmo/espaço, motivos, pergunta e resposta, cor (9ª e 6ª), arco do solo.
- Treino de ouvido: as missões de "Ouvir" do Laboratório apontam para o **Functional Ear Trainer** (celular). *Revogado para o site novo em 2026-11-17: treino de ouvido passa a ser uma ferramenta própria (ver `docs/ROADMAP.md`).*
- Gravações do Diário sempre na **base padrão** para comparar a evolução (dia 0, 28, 56).
