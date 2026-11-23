# O projeto

## Visão
Um site de música **generalista**: várias demandas separadas, cada uma atendida por uma ferramenta especialista que seja excelente sozinha. Gratuito, livre e não comercial; feito primeiro para o dono e amigos músicos, aberto a qualquer um.

O hub (homepage) é um **painel de entrada**: mostra o que existe e leva à ferramenta em um clique. Não é página de venda.

## Para quem
Qualquer músico, do iniciante ao avançado. O foco são os instrumentos de corda (guitarra, violão, baixo); ferramentas neutras (afinador, ouvido) servem a qualquer instrumento.

## As ferramentas
| Ferramenta | Situação | O que é |
|---|---|---|
| Tirar de ouvido | próxima | Treinador para tirar músicas e solos de ouvido. É o diferencial: o dono nunca viu igual. |
| Afinador | pronta (app Android) | Afinação pelo microfone. O Marmota Tuner (`marmota-tuner/`) é entregue pela página `/afinador` e fica. O afinador dentro do site segue planejado e convive com ele. |
| Treino de ouvido | no ar (2 versões de teste) | Intervalos, acordes e graus, com piano. Falta o app Android. |
| Improvisação | planejada | Redesenho do que hoje é o Laboratório. |
| Player de tab e MIDI | planejada | Abre arquivos do usuário e toca junto. |
| Diário do Solo, Piano de Ideias | laboratório | Experimentos do site antigo, funcionando. |

A lista de verdade é `src/tools/registry.ts`. Ordem e detalhes: `docs/ROADMAP.md`.

## Decisões já tomadas
| Data | Decisão | Por quê |
|---|---|---|
| 2026-11-17 | Next.js (App Router) + TypeScript | Contas virão logo e o dono já conhece Next. Áudio roda todo no cliente, então a stack não muda nada na parte musical. |
| 2026-11-17 | PT-BR no lançamento, pronto para outros idiomas | Custo pequeno agora; evita reescrever depois. |
| 2026-11-17 | Site antigo congelado em `legacy/`, servido em `/laboratorio` | Vai ser redesenhado; portar para React seria trabalho jogado fora. |
| 2026-11-17 | Foco em guitarra, ferramentas neutras onde der | Dá identidade sem fechar a porta. |
| 2026-11-17 | Treino de ouvido entra no site | Revoga a decisão antiga de usar só app externo. |
| 2026-11-17 | Sem catálogo de tablaturas | Tablatura de música comercial é protegida por direito autoral. |
| 2026-11-18 | Licks de solos conhecidos dentro de lição de análise | Catálogo continua proibido. Lick ou solo de gravação entra só numa lição que analisa a técnica (shape, tom, nota de fora), com crédito e o vídeo oficial incorporado: uso de trecho para estudo (Lei 9.610/98, art. 46, VIII). O violão do site não substitui a gravação. |
| 2026-11-18 | O site passa a se chamar "Marmota Music"; o curso, "Como solar com a pentatônica" | O nome do site acompanha o endereço e o app (Marmota Tuner). O curso é só de pentatônica, e o nome agora diz isso. O endereço `/solos` não muda. |
| 2026-11-17 | O afinador entra como app Android (Marmota Tuner), ligado ao hub por `/afinador` | Contribuição de um amigo, aceita pelo dono mesmo fora da stack web. O valor dele é ser só um afinador: sem anúncio, sem assinatura, sem internet, menos de 1 MB. Os dois afinadores ficam: o app é o que se abre no celular para afinar; o do site existe porque microfone e detecção de altura em `src/core/` são a base das ferramentas que ouvem a guitarra. O app não segue os tokens do `DESIGN.md` nem alimenta o núcleo. |
| 2026-11-23 | O curso "Como solar com a pentatônica" (`/solos`) foi removido | Não deu certo. O site fica só com as utilidades (afinador, metrônomo) e o Laboratório. O código e o currículo continuam no histórico do git (PR #74 e anteriores). |
| 2026-11-23 | Treino de ouvido em duas versões de teste (clássico e funcional), piano de amostras, site e depois app Android | O dono quer ver na prática a diferença entre os dois estilos e copiar o que já funciona em apps conhecidos (Perfect Ear, MyEarTraining, OpenEar em MIT, Toned Ear), sem anúncio. A lógica é pequena (tabelas e sorteio), então não usa o `core` Kotlin compartilhado do afinador: `dados.json` é a fonte comum e cada lado escreve o sorteio. As amostras são do Salamander Grand Piano (Alexander Holm, CC BY 3.0). |
| 2026-11-23 | A lógica do treino de ouvido e voz vai para o Kotlin compartilhado (`marmota-tuner/core`, pacote `treino`), e o app Android do treino entra (`:trainer`) | Revoga o "cada lado escreve o sorteio" da linha acima. O dono quer o app com tudo o que o site tem, e duas cópias do sorteio, da regra de segurar a nota e da pontuação do canto iam divergir. O site usa o JS compilado (`src/core/treino`), como já faz no afinador. `dados.json` e `musicas.json` seguem sendo a fonte que se edita; o Gradle gera o Kotlin a partir deles. Um teste de paridade (`paridade.test.ts` e `TreinoParidadeTest`) confere os dois lados. |
| antes | Dados só no navegador, com backup | Sem backend até haver contas. |

## Em aberto
- Domínio próprio. O nome é "Marmota Music" (2026-11-18; antes, "Musical Tools") e fica só em `messages/pt-BR.json`.
- Contas: quando e com qual provedor.

## Histórico
Começou como artefatos no Claude, virou um site pessoal de treino de improviso (Vite + JS puro) e, em novembro de 2026, foi reestruturado como hub generalista. O site pessoal original vive em `legacy/`; a história dele está em `legacy/docs/PROJETO.md`.
