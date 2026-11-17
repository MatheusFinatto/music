// Conteúdo de "Como fazer solos" em português. Fase 1: O mapa do braço, Respirar e Ritmo.
// Fundamentação e fontes: docs/solos/PESQUISA.md.
import type { LeadNote } from "@/core/audio";
import { STANDARD_TUNING, type FretPos } from "@/core/theory";
import type { Base, Curriculum, EchoExercise, Phrase } from "./types";

/** Base padrão: Am F C G, balada lenta. */
const BASE: Base = { key: 0, prog: [5, 3, 0, 4], bpm: 72, style: "balada" };
/** Um acorde só, para treinar ritmo e desenho sem pensar em troca. */
const VAMP: Base = { key: 0, prog: [5], bpm: 72, style: "balada" };
/** Dois acordes, para as frases de ouvido. */
const AM_F: Base = { key: 0, prog: [5, 3], bpm: 72, style: "balada" };

// ---------- ajudantes para escrever frases ----------

/** [corda (1 = Mi agudo … 6 = Mi grave), casa, tempo de início, duração em tempos] */
type Tab = [string: number, fret: number, beat: number, dur: number];

function phrase(id: string, name: string, bars: number, tab: Tab[]): Phrase {
  const frets: FretPos[] = tab.map(([s, fret]) => ({ string: s - 1, fret }));
  const notes: LeadNote[] = tab.map(([s, fret, beat, dur]) => ({
    midi: STANDARD_TUNING[s - 1]! + fret,
    beat,
    dur,
  }));
  return { id, name, bars, notes, frets };
}

/** Ritmo de um compasso numa nota só (A4). 16 caracteres: "x" toca, "." não. */
function rhythm(id: string, name: string, steps: string): Phrase {
  const on = [...steps].flatMap((ch, i) => (ch === "x" ? [i] : []));
  const notes: LeadNote[] = on.map((s, i) => ({
    midi: 69,
    beat: s / 4,
    dur: Math.min(1.5, ((on[i + 1] ?? 16) - s) / 4) * 0.9,
  }));
  return { id, name, bars: 1, notes };
}

const ear = (id: string, p: Phrase): EchoExercise => ({
  id,
  kind: "echo",
  title: `Frase: ${p.name}`,
  goal: "Tire esta frase de ouvido, sem ver onde ela fica no braço.",
  steps: [
    "Ouça duas ou três vezes sem tocar.",
    "Cante junto. Se não consegue cantar, ainda não ouviu direito.",
    "Agora procure no braço, no desenho 1 em Lá menor. O site toca, você responde.",
    "Só então abra o braço para conferir.",
  ],
  check: "Tocou a frase inteira antes de conferir no braço?",
  base: AM_F,
  reveal: "tab",
  phrases: [p],
});

// ---------- conteúdo ----------

export const curriculum: Curriculum = {
  units: [
    {
      id: "u0",
      title: "O mapa do braço",
      skill:
        "Os desenhos da pentatônica e onde ficam as notas de cada acorde. Já tem isso no dedo? Marque como feita e siga.",
      lessons: [
        {
          id: "u0.l1",
          title: "O desenho 1",
          intro:
            "Boa parte dos solos de rock e blues que você conhece passa por este desenho. Ele tem só cinco notas, repetidas em duas oitavas. O objetivo aqui não é correr por ele: é saber, de olhos fechados, onde está a tônica.",
          key: "u0.l1.find",
          exercises: [
            {
              id: "u0.l1.map",
              kind: "map",
              title: "Pentatônica de Lá menor, desenho 1",
              goal: 'Toque o desenho subindo e descendo, devagar, dizendo "tônica" toda vez que passar por um A.',
              steps: [
                "Duas notas por corda, da 6ª à 1ª e de volta.",
                "As bolinhas brancas são a tônica (A). São três neste desenho.",
                "Ligue a base e repita no tempo, uma nota por tempo.",
              ],
              check: "Subiu e desceu no tempo, sem olhar para a tela?",
              base: VAMP,
              shapes: [1],
              layer: "penta",
            },
            {
              id: "u0.l1.find",
              kind: "find",
              title: "Onde está a tônica?",
              goal: "Aponte no braço as três tônicas do desenho.",
              steps: [
                "Toque nelas na tela e depois na guitarra.",
                "Um toque errado conta: pense antes.",
              ],
              check: "",
              base: VAMP,
              shape: 1,
              ask: ["T"],
              rounds: 6,
            },
          ],
        },
        {
          id: "u0.l2",
          title: "Os cinco desenhos",
          intro:
            "O desenho 1 é uma janela do braço. As mesmas cinco notas continuam para cima e para baixo em mais quatro desenhos, e cada um encaixa no vizinho. Você não precisa dominar os cinco hoje: precisa saber que existem e como se ligam.",
          key: "u0.l2.link",
          exercises: [
            {
              id: "u0.l2.map",
              kind: "map",
              title: "Um desenho por vez",
              goal: "Toque cada um dos cinco desenhos uma vez, subindo e descendo.",
              steps: [
                "Troque de desenho pelos botões. Repare que a parte de cima de um é a parte de baixo do seguinte.",
                "Em cada um, ache as tônicas antes de tocar.",
              ],
              check: "Passou pelos cinco achando a tônica em cada um?",
              base: VAMP,
              shapes: [1, 2, 3, 4, 5],
              layer: "penta",
            },
            {
              id: "u0.l2.link",
              kind: "map",
              title: "Atravessar de um para o outro",
              goal: "Suba pelo desenho 1 e desça pelo desenho 2, sem parar.",
              steps: [
                "Na 1ª corda, escorregue da casa 8 para a 10 e você já está no desenho 2.",
                "Faça o mesmo entre o 2 e o 3.",
                "Com a base ligada, uma nota por tempo.",
              ],
              check: "Trocou de desenho sem interromper o tempo?",
              base: VAMP,
              shapes: [1, 2, 3],
              layer: "penta",
            },
          ],
        },
        {
          id: "u0.l3",
          title: "As notas de cada acorde",
          intro:
            'A pentatônica serve para a música inteira, mas cada acorde tem três notas que soam "em casa" enquanto ele toca: a tônica, a 3ª e a 5ª. Solo que parece escala ignora isso. Aqui você só aprende onde elas ficam; usar vem depois.',
          key: "u0.l3.find",
          exercises: [
            {
              id: "u0.l3.map",
              kind: "map",
              title: "Tônica, 3ª e 5ª de cada acorde",
              goal: "Para cada acorde, toque as três notas dele dentro do desenho 1.",
              steps: [
                "Escolha o acorde. As notas dele aparecem marcadas com T, 3 e 5.",
                "Algumas ficam fora da pentatônica (aparecem com contorno tracejado). Tudo bem: são notas do tom.",
                "Ligue a base: as marcas trocam junto com o acorde. Toque uma nota longa de cada acorde.",
              ],
              check:
                "Achou pelo menos uma nota de cada acorde no tempo da troca?",
              base: BASE,
              shapes: [1],
              layer: "chord",
            },
            {
              id: "u0.l3.find",
              kind: "find",
              title: "Ache a nota",
              goal: "O site pede uma nota de um acorde. Aponte no braço.",
              steps: ["Responda sem contar casas: tente lembrar do desenho."],
              check: "",
              base: BASE,
              shape: 1,
              ask: ["T", "3", "5"],
              rounds: 12,
            },
          ],
        },
      ],
    },
    {
      id: "u1",
      title: "Respirar",
      skill: "Frase tem começo e fim",
      takeCheck: "Suas frases tiveram começo e fim, com silêncio entre elas?",
      lessons: [
        {
          id: "u1.l1",
          title: "Dois compassos tocando, dois calado",
          intro:
            "O defeito mais comum de quem improvisa é não parar de tocar: os dedos correm mais que as ideias. Cantor respira; guitarrista esquece. Calar por obrigação parece artificial, e é. É um treino, não um jeito de tocar no palco.",
          key: "u1.l1.pr",
          exercises: [
            {
              id: "u1.l1.pr",
              kind: "play-rest",
              title: "Dois e dois",
              goal: "Toque nos compassos marcados e fique em silêncio total nos outros.",
              steps: [
                'Use só o desenho 1 da pentatônica de Lá menor (se não lembra dele, está em "O mapa do braço"). Não importa o que você toca, importa parar.',
                "No silêncio, abafe as cordas e ouça a base.",
                "Termine a frase antes do silêncio começar, sem deixar nota vazando.",
              ],
              check:
                "Ficou em silêncio de verdade em todos os compassos de pausa?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
            },
          ],
        },
        {
          id: "u1.l2",
          title: "Outras proporções",
          intro:
            "Frase curta com resposta curta soa como conversa. Frase longa com um respiro só no fim soa como discurso. As duas existem nos solos que você gosta.",
          key: "u1.l2.b",
          exercises: [
            {
              id: "u1.l2.a",
              kind: "play-rest",
              title: "Um e um",
              goal: "Um compasso tocando, um calado.",
              steps: [
                "A frase tem que caber em um compasso.",
                "Pense em pergunta e silêncio, pergunta e silêncio.",
              ],
              check: "Cada frase coube no compasso dela?",
              base: BASE,
              pattern: ["play", "rest"],
            },
            {
              id: "u1.l2.b",
              kind: "play-rest",
              title: "Três e um",
              goal: "Três compassos tocando, um calado.",
              steps: [
                "Uma frase longa só, não três frases curtas coladas.",
                "O compasso de silêncio é sagrado.",
              ],
              check:
                "Conseguiu sustentar uma ideia por três compassos e parar no quarto?",
              base: BASE,
              pattern: ["play", "play", "play", "rest"],
            },
          ],
        },
        {
          id: "u1.l3",
          title: "Mais silêncio que som",
          intro:
            "Gilmour é famoso pelo que não toca. Quando o silêncio é maior que a frase, cada nota pesa mais. É desconfortável no começo: a vontade é preencher.",
          key: "u1.l3.a",
          exercises: [
            {
              id: "u1.l3.a",
              kind: "play-rest",
              title: "Um e três",
              goal: "Um compasso tocando, três calado.",
              steps: [
                "Poucas notas. Deixe a última soar e morrer.",
                "Nos três compassos de pausa, cante por dentro o que vai tocar depois.",
              ],
              check: "Aguentou os três compassos sem preencher?",
              base: BASE,
              pattern: ["play", "rest", "rest", "rest"],
            },
            {
              id: "u1.l3.b",
              kind: "play-rest",
              title: "Proporção torta",
              goal: "Dois tocando, três calado. O ciclo não fecha com os acordes.",
              steps: [
                "A cada volta sua frase cai sobre acordes diferentes.",
                "Siga a marcação da tela, não o costume.",
              ],
              check: "Entrou no compasso certo todas as vezes?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest", "rest"],
            },
          ],
        },
      ],
    },
    {
      id: "u2",
      title: "Ritmo com poucas notas",
      skill: "Vocabulário rítmico",
      takeCheck:
        "Você variou o ritmo e entrou fora do tempo 1 pelo menos algumas vezes?",
      lessons: [
        {
          id: "u2.l1",
          title: "Uma nota, muitos ritmos",
          intro:
            "Com uma nota só não há escala onde se esconder: tudo o que sobra é ritmo. Quem resolve o ritmo com uma nota tem o que dizer com cinco.",
          key: "u2.l1.one",
          exercises: [
            {
              id: "u2.l1.echo",
              kind: "echo",
              title: "Eco de ritmo",
              goal: "O site toca um ritmo num compasso. Você repete no compasso seguinte, na mesma nota.",
              steps: [
                "A nota é A4: 2ª corda, casa 10.",
                "Antes de tocar, cante o ritmo (tá, tá-tá). Se não consegue cantar, ainda não ouviu.",
                "Não olhe a escrita antes de tentar.",
                "Quando acertar duas vezes seguidas, passe para o próximo.",
              ],
              check: "Repetiu os quatro ritmos sem olhar a escrita?",
              base: VAMP,
              reveal: "rhythm",
              phrases: [
                rhythm("r1", "Quatro tempos", "x...x...x...x..."),
                rhythm("r2", "Longa, três curtas", "x...x.x.x......."),
                rhythm("r3", "Longa e duas no fim", "x.....x.x......."),
                rhythm("r4", "Duas curtas e uma longa", "x.x.....x......."),
              ],
            },
            {
              id: "u2.l1.one",
              kind: "play-rest",
              title: "Nenhum compasso igual ao anterior",
              goal: "Improvise com uma nota só. O ritmo de cada compasso tem que ser diferente do compasso de antes.",
              steps: [
                "Mesma nota: A4, 2ª corda, casa 10.",
                "Vale nota longa, nota curta e silêncio no meio do compasso.",
              ],
              check: "Variou o ritmo em todos os compassos?",
              base: BASE,
              pattern: ["play", "play", "play", "rest"],
              rule: "Uma nota só",
            },
          ],
        },
        {
          id: "u2.l2",
          title: "Fora do tempo 1",
          intro:
            "Começar toda frase no primeiro tempo é o que deixa o solo quadrado. Entrar depois, ou antes, muda tudo sem mudar uma nota.",
          key: "u2.l2.off",
          exercises: [
            {
              id: "u2.l2.echo",
              kind: "echo",
              title: "Eco de ritmo: entradas atrasadas",
              goal: "Repita cada ritmo. Nenhum começa no tempo 1.",
              steps: [
                "Cante o ritmo antes de tocar.",
                'Conte "um" em silêncio antes de entrar.',
                "Mesma nota de antes.",
              ],
              check: "Entrou no lugar certo, sem adiantar?",
              base: VAMP,
              reveal: "rhythm",
              phrases: [
                rhythm("r5", "Depois do tempo 1", "..x.x...x......."),
                rhythm("r6", "Começa no tempo 2", "....x.x...x.x..."),
                rhythm("r7", "Começa no contratempo", "..x...x....x...."),
                rhythm("r8", "Tudo no fim", "......x.x..x..x."),
              ],
            },
            {
              id: "u2.l2.off",
              kind: "play-rest",
              title: "Nunca no tempo 1",
              goal: "Uma nota só. Nenhuma frase pode começar no primeiro tempo do compasso.",
              steps: [
                "Espere o tempo 1 passar e entre.",
                "Depois experimente entrar no fim do compasso anterior.",
              ],
              check: "Nenhuma frase começou no tempo 1?",
              base: BASE,
              pattern: ["play", "play", "play", "rest"],
              rule: "Uma nota só, entrando depois do tempo 1",
            },
          ],
        },
        {
          id: "u2.l3",
          title: "Duas notas, depois três",
          intro:
            "Agora o ritmo que você achou ganha altura. Duas notas já fazem melodia: sobe ou desce. Três já contam uma história.",
          key: "u2.l3.three",
          exercises: [
            {
              id: "u2.l3.two",
              kind: "play-rest",
              title: "Duas notas",
              goal: "Improvise só com A4 e C5 (1ª corda, casas 5 e 8).",
              steps: [
                "Mantenha o que aprendeu: ritmos diferentes, entrada fora do tempo 1.",
                "Experimente terminar a frase ora numa, ora na outra.",
              ],
              check: "Suas frases soaram diferentes umas das outras?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Só duas notas: A4 e C5",
            },
            {
              id: "u2.l3.three",
              kind: "play-rest",
              title: "Três notas",
              goal: "Acrescente G4 (2ª corda, casa 8). Só essas três.",
              steps: [
                "Faça uma frase, cale, e responda com uma frase parecida que termina em outra nota.",
                "Não acrescente a quarta nota, por mais vontade que dê.",
              ],
              check: "Fez pergunta e resposta usando só três notas?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Só três notas: G4, A4 e C5",
            },
          ],
        },
      ],
    },
  ],

  // Frases próprias, simples, no desenho 1, em ordem de dificuldade. Com bend e vibrato a partir da fase 2.
  // Regras (conferidas por teste): só notas do desenho 1; toda nota longa é nota do acorde que está soando;
  // toda frase deixa pelo menos um tempo e meio de silêncio; as entradas e as notas finais variam.
  phrases: [
    ear(
      "f.a1",
      phrase("pa1", "Duas notas", 2, [
        [1, 5, 0, 2],
        [1, 8, 2, 1.5],
        [1, 5, 4, 2.5],
      ]),
    ),
    ear(
      "f.a2",
      phrase("pa2", "Desce e volta", 2, [
        [1, 8, 1, 1],
        [1, 5, 2, 1],
        [2, 8, 3, 1],
        [1, 8, 4, 2.5],
      ]),
    ),
    ear(
      "f.01",
      phrase("p01", "Sobe e pousa", 2, [
        [2, 5, 0, 1],
        [2, 8, 1, 1],
        [1, 5, 2, 1.5],
        [1, 8, 4.5, 0.5],
        [1, 5, 5, 2],
      ]),
    ),
    ear(
      "f.02",
      phrase("p02", "Desce com calma", 2, [
        [1, 8, 1, 1],
        [1, 5, 2, 0.5],
        [2, 8, 2.5, 0.5],
        [2, 5, 3, 1],
        [3, 5, 4, 2.5],
      ]),
    ),
    ear(
      "f.03",
      phrase("p03", "Silêncio primeiro", 2, [
        [2, 5, 2, 0.5],
        [2, 8, 2.5, 0.5],
        [1, 5, 3, 1.5],
        [2, 8, 5.5, 0.5],
        [1, 8, 6, 2],
      ]),
    ),
    ear(
      "f.04",
      phrase("p04", "Pergunta", 2, [
        [1, 5, 0.5, 0.5],
        [1, 8, 1, 1],
        [1, 5, 2, 0.5],
        [2, 8, 2.5, 1],
        [2, 8, 5, 0.5],
        [1, 5, 5.5, 2],
      ]),
    ),
    ear(
      "f.05",
      phrase("p05", "Motivo repetido", 2, [
        [1, 5, 0, 0.5],
        [1, 8, 0.5, 0.5],
        [1, 5, 1, 1.5],
        [1, 5, 4, 0.5],
        [1, 8, 4.5, 0.5],
        [2, 8, 5, 1],
        [1, 5, 6.5, 1.5],
      ]),
    ),
    ear(
      "f.06",
      phrase("p06", "Do grave ao agudo", 2, [
        [4, 7, 0, 1],
        [3, 5, 1, 0.5],
        [3, 7, 1.5, 0.5],
        [2, 5, 2, 1.5],
        [2, 8, 4.5, 0.5],
        [1, 5, 5, 0.5],
        [1, 8, 5.5, 1.5],
      ]),
    ),
  ],

  take: {
    id: "take.livre",
    kind: "take",
    title: "Tomada livre",
    goal: "Oito compassos sem regra nenhuma. Toque como se fosse para valer.",
    steps: [
      "Esqueça os exercícios e toque.",
      "Quando a base parar, responda à pergunta com honestidade.",
    ],
    check:
      "Você tocou frases, com começo, fim e silêncio, ou notas soltas sem parar?",
    base: BASE,
    bars: 8,
  },
};
