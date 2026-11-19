---
name: music-course-humanized
description: Pipeline em série, em três etapas, para texto de curso de música em PT-BR. Escreve com music-course-writer, tira as marcas de IA com o humanizer e termina com um revisor frio que caça falsas traduções (ex.: tone virar "tom" em vez de "timbre"). Use quando o texto for roteiro de aula, material de apoio ou lição e precisar soar natural e tecnicamente correto em português.
---

# Music Course Humanized (em série, 3 etapas)

Três etapas, sempre nesta ordem. Cada uma trabalha sobre a saída da anterior. O texto final tem que estar em **português do Brasil correto**, sem marca de IA e sem termo musical traduzido errado.

## Etapa 1: escrever

Invoque a skill `music-course-writer` (via Skill) e produza ou reescreva o texto pedido, seguindo as regras dela e o formato pedido (roteiro de aula ou material de apoio). Guarde o rascunho.

* **Registro:** sem gíria. Roteiro de vídeo pode ter tom falado; texto que vai para o site (lições, interface) usa "para" e "está" (regra do `CLAUDE.md` do repo).
* Se o pedido partir de um texto em inglês (fonte, vídeo, transcrição), **não traduza frase a frase**: entenda a ideia e escreva em português. Guarde o trecho original para a etapa 3.

## Etapa 2: humanizar

Invoque a skill `humanizer` (via Skill) sobre o rascunho. Ela foi feita para inglês e não conhece este curso, então:

* **Preserve o registro da etapa 1** e os parágrafos curtos. Não "formalize".
* **Preserve o conteúdo musical:** notas (C4, Bb3), números de corda e casa, nomes de shape, termos técnicos e o que a lição ensina. Só muda a forma.
* Ataque os padrões **estruturais** (fecho de uma linha, tríades forçadas, contraste "não é X, é Y", inflação, travessão em excesso). Padrões de **palavra** do inglês só valem se existir equivalente real em português.
* **Não traduza nem "corrija" termo técnico por conta própria.** Se uma troca de palavra mudar o sentido musical, desfaça.
* Se o humanizer sugerir algo que quebre uma regra da etapa 1 ou do `CLAUDE.md`, mantenha a regra.

## Etapa 3: revisão de tradução e terminologia

Revisor **independente**, com contexto limpo: lance um agente (Agent, `general-purpose`) para que ele não herde a confiança de quem escreveu. Passe a ele, no prompt:

* o texto final da etapa 2;
* o trecho original em inglês, se houver;
* o caminho do glossário: `.claude/skills/music-course-humanized/glossario.md` (peça que ele leia);
* o caminho de `src/tools/solos/curriculum/pt-BR.ts`, para ver como o **site já nomeia** cada coisa (base, tomada, eco, shape/desenho, etc.). Termo do site tem prioridade sobre o glossário. Peça que confira por `grep`, sem ler o arquivo inteiro (tem mais de 21 mil linhas).

O que o revisor faz (e só isso: **não reescreve o estilo**):

1. **Falsos amigos e termo técnico errado.** Cada termo musical contra o glossário e contra o uso do site. Exemplo clássico: *tone* = **timbre** (qualidade do som), não "tom"; "tom" é tonalidade ou intervalo de dois semitons. Conferir também key, pitch, root, beat, bar, fret, hammer-on, lick, etc.
2. **Calques de sintaxe:** gerúndio de abertura ("Tocando a escala, você notará..."), possessivo repetido ("sua mão"), voz passiva de manual, preposição de inglês, "realizar/performar/endereçar/aplicar" onde caberia "fazer/tocar/usar". Padrões listados no fim do glossário.
3. **Ambiguidade:** palavra que, no contexto, pode ser lida de duas formas (ex.: "tom" sem dizer se é tonalidade ou timbre). Apontar e propor a forma sem ambiguidade.
4. **Fidelidade:** se há original, conferir que o sentido musical não mudou (um intervalo, uma corda, uma casa, uma direção de palhetada).
5. **Regras do projeto:** corda pelo número e altura por grave/agudo (nunca "de cima/de baixo"), notas em letra + oitava, sem gíria, sem linguagem de venda.

Formato da resposta do revisor: lista de achados, cada um com `trecho`, `problema`, `correção`, `confiança` (alta/média). Sem achado, ele diz "sem achados". Não inventar problema para ter o que listar.

### Depois do revisor

* Aplique as correções de confiança **alta** diretamente, mudando o mínimo de palavras. Releia as linhas alteradas: a correção não pode reintroduzir marca de IA nem quebrar o registro.
* Confiança **média** ou termo que não está no glossário nem no site: **pergunte ao usuário**, com a opção que você recomenda. Não decida sozinho em termo técnico.
* Termo novo e confirmado: acrescente ao `glossario.md` (uma linha, com o erro a evitar).
* **Uma única rodada.** Não reentre no humanizer depois do revisor; se a correção foi grande, diga isso em vez de iterar.

## Saída

Entregue só o texto final. No fim, em até três linhas: o que a etapa 2 mudou de relevante, quantos achados o revisor teve e quais ficaram pendentes de decisão do usuário. Não commite nada.
