# O projeto

## Visão
Um site de música **generalista**: várias demandas separadas, cada uma atendida por uma ferramenta especialista que seja excelente sozinha. Gratuito, livre e não comercial; feito primeiro para o dono e amigos músicos, aberto a qualquer um.

O hub (homepage) é um **painel de entrada**: mostra o que existe e leva à ferramenta em um clique. Não é página de venda.

## Para quem
Qualquer músico, do iniciante ao avançado. Identidade de guitarra primeiro (guitarra, violão, baixo); ferramentas neutras (afinador, ouvido) servem a qualquer instrumento.

## As ferramentas
| Ferramenta | Situação | O que é |
|---|---|---|
| Tirar de ouvido | próxima | Treinador para tirar músicas e solos de ouvido. É o diferencial: o dono nunca viu igual. |
| Afinador | pronta (app Android) | Afinação pelo microfone. O Marmota Tuner (`marmota-tuner/`) é entregue pela página `/afinador` e fica. O afinador dentro do site segue planejado e convive com ele. |
| Treino de ouvido | planejada | Intervalos, acordes e graus. |
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
| 2026-11-17 | Guitarra primeiro, ferramentas neutras onde der | Dá identidade sem fechar a porta. |
| 2026-11-17 | Treino de ouvido entra no site | Revoga a decisão antiga de usar só app externo. |
| 2026-11-17 | Sem catálogo de tablaturas | Tablatura de música comercial é protegida por direito autoral. |
| 2026-11-17 | O afinador entra como app Android (Marmota Tuner), ligado ao hub por `/afinador` | Contribuição de um amigo, aceita pelo dono mesmo fora da stack web. O valor dele é ser só um afinador: sem anúncio, sem assinatura, sem internet, menos de 1 MB. Os dois afinadores ficam: o app é o que se abre no celular para afinar; o do site existe porque microfone e detecção de altura em `src/core/` são a base das ferramentas que ouvem a guitarra. O app não segue os tokens do `DESIGN.md` nem alimenta o núcleo. |
| antes | Dados só no navegador, com backup | Sem backend até haver contas. |

## Em aberto
- Domínio. O nome é "Musical Tools" (2026-11-17) e fica só em `messages/pt-BR.json`.
- Contas: quando e com qual provedor.

## Histórico
Começou como artefatos no Claude, virou um site pessoal de treino de improviso (Vite + JS puro) e, em novembro de 2026, foi reestruturado como hub generalista. O site pessoal original vive em `legacy/`; a história dele está em `legacy/docs/PROJETO.md`.
