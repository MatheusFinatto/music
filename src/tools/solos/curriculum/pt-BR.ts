// Conteúdo de "Como solar no violão e na guitarra" em português.
// Fase 1: O mapa do braço, Respirar e Ritmo. Fase 2: Ouvir a troca e Ligar. Bend e vibrato não têm unidade
// própria (o público já sabe fazer): aparecem usados nas frases, como gesto até a nota do acorde.
// Fase 3: Uma corda só, Motivo, Vocabulário e O arco do solo. Depois: quatro seções, cada uma fechando
// com um arco (solo com exemplo). O curso é só de pentatônica: a meta é um solo que valha um couvert.
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
/** Os outros dois acordes da base: outras notas-alvo para o bend. */
const C_G: Base = { key: 0, prog: [0, 4], bpm: 72, style: "balada" };
/** A base padrão em rock, um pouco mais rápida: o arco do braço. */
const ROCK: Base = { ...BASE, bpm: 80, style: "rock" };
/** Mi menor: Em C G D, os mesmos papéis de Am F C G sete casas acima. */
const EM: Base = { key: 7, prog: [5, 3, 0, 4], bpm: 72, style: "balada" };
const EM_VAMP: Base = { ...EM, prog: [5] };
/** Ré menor: Dm Bb F C. */
const DM: Base = { key: 5, prog: [5, 3, 0, 4], bpm: 72, style: "balada" };
/** A base padrão mais lenta, para o primeiro contato com alvos que mudam. */
const BASE_SLOW: Base = { ...BASE, bpm: 60 };
/** Oito compassos, ordem menos previsível: para ouvir a troca em vez de contar. */
const LONG: Base = { key: 0, prog: [5, 3, 0, 4, 5, 0, 3, 4], bpm: 72, style: "balada" };

// ---------- ajudantes para escrever frases ----------

/** Técnica de uma nota. Bend e soltar em semitons (2 = um tom); slide = casa de onde a nota vem. */
type Tech = { bend?: number; release?: number; slide?: number; vib?: "lento" | "rapido"; vibDelay?: number; amp?: number };

/** [corda (1 = Mi agudo … 6 = Mi grave), casa, tempo de início, duração em tempos, técnica] */
type Tab = [string: number, fret: number, beat: number, dur: number, tech?: Tech];

/** Vibrato lento e largo (cantor de blues) ou rápido e estreito (violino). */
const VIBRATO = { lento: { rate: 4.5, cents: 50 }, rapido: { rate: 6.5, cents: 22 } } as const;

function phrase(id: string, name: string, bars: number, tab: Tab[]): Phrase {
  // A posição é a casa onde o dedo aperta. No bend, a nota soa mais alta que a casa.
  const frets: FretPos[] = tab.map(([s, fret]) => ({ string: s - 1, fret }));
  const notes: LeadNote[] = tab.map(([s, fret, beat, dur, tech = {}]) => {
    const open = STANDARD_TUNING[s - 1]!;
    const at = open + fret;
    const n: LeadNote = { midi: at, beat, dur };
    if (tech.bend) Object.assign(n, { from: at, midi: at + tech.bend, glide: 0.4 });
    else if (tech.release) Object.assign(n, { from: at + tech.release, hold: 0.4, glide: 0.4 });
    else if (tech.slide !== undefined) Object.assign(n, { from: open + tech.slide, glide: 0.15 });
    if (tech.vib) n.vibrato = { ...VIBRATO[tech.vib], delay: tech.vibDelay ?? (tech.bend ? 0.6 : 0) };
    if (tech.amp !== undefined) n.amp = tech.amp;
    return n;
  });
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
    "Agora procure no braço, no desenho 1 em Lá menor.",
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
        "Os desenhos da pentatônica e onde ficam as notas de cada acorde.",
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
                "A parte de cima de um desenho é a parte de baixo do seguinte.",
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
                "Algumas notas do acorde ficam fora da pentatônica. Neste curso, os solos usam só as de dentro.",
                "Toque uma nota longa de cada acorde, no tempo da troca.",
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
                "Use só o desenho 1 da pentatônica de Lá menor. Não importa o que você toca, importa parar.",
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
    {
      id: "a1",
      title: "Arco 1: o primeiro solo",
      skill: "Juntar poucas notas, silêncio e ritmo num solo de oito compassos",
      arc: true,
      takeCheck: "Seu solo teve frases com começo e fim, silêncio entre elas e ritmos variados?",
      lessons: [
        {
          id: "a1.l1",
          title: "Oito compassos",
          intro:
            "Hora de juntar a seção: poucas notas do desenho 1, silêncio de verdade e ritmo que nem sempre começa no tempo 1. O exemplo mostra um jeito de fazer. Ouça quantas vezes quiser, depois toque o seu: não o do exemplo.",
          key: "a1.take",
          exercises: [
            {
              id: "a1.take",
              kind: "take",
              title: "O primeiro solo",
              goal: "Oito compassos no desenho 1, com frases curtas e silêncio entre elas.",
              steps: ["Primeiras duas partes: poucas notas, bastante espaço.", "Últimas duas: o ritmo mais solto, e uma frase que fecha."],
              check: "Seu solo teve frases com começo e fim, silêncio entre elas e ritmos variados?",
              base: BASE,
              bars: 8,
              arc: ["Poucas notas", "Respira", "Ritmo", "Fecha"],
              example: phrase("x1", "Exemplo do arco 1", 8, [
                [1, 5, 0.5, 0.5],
                [1, 8, 1, 0.5],
                [1, 5, 1.5, 1.5],
                [2, 8, 6.5, 0.5],
                [1, 5, 7, 1],
                [2, 5, 8.5, 0.5],
                [2, 8, 9, 0.5],
                [2, 5, 9.5, 2],
                [3, 7, 15, 0.5],
                [2, 5, 16, 1.5],
                [3, 7, 17.5, 0.5],
                [3, 5, 18, 1.5],
                [1, 8, 24.5, 0.5],
                [1, 5, 25, 0.5],
                [2, 8, 25.5, 0.5],
                [2, 5, 26, 1.5],
                [2, 8, 28.5, 2.5],
              ]),
            },
          ],
        },
      ],
    },
    {
      id: "u5",
      title: "Ouvir a troca",
      skill: "Sentir a troca de acorde e chegar numa nota dele",
      takeCheck: "Você ouviu cada troca de acorde e chegou numa nota dele, sem cair sempre no mesmo grau?",
      lessons: [
        {
          id: "u5.l1",
          title: "Uma nota, quatro cores",
          intro:
            "Antes de perseguir notas, ouça o que a troca de acorde faz com uma nota parada. O Dó (C5) está em três dos quatro acordes da base: é a 3ª do Am, a 5ª do F e a tônica do C. Sobre o G ele fica tenso, pedindo para mudar.",
          key: "u5.l1.c",
          exercises: [
            {
              id: "u5.l1.c",
              kind: "play-rest",
              title: "Segure o Dó",
              goal: "Toque o C5 no começo de cada compasso e deixe soar. Só escute.",
              steps: [
                "C5: 1ª corda, casa 8.",
                "Em cada troca, diga em voz alta como a nota soou: em casa ou tensa.",
                "Depois de duas voltas, troque a nota pelo A4 (1ª corda, casa 5) e repita.",
              ],
              check: "Ouviu em qual acorde o Dó soa em casa e em qual soa tenso?",
              base: BASE,
              pattern: ["play", "play", "play", "play"],
              rule: "Uma nota só: C5",
            },
            {
              id: "u5.l1.pick",
              kind: "play-rest",
              title: "A nota que não muda",
              goal: "Uma nota longa por compasso, sempre do acorde da vez, mudando o mínimo possível de uma para a outra.",
              steps: [
                "Comece no C5 sobre o Am. No F, ele continua servindo; no C, também. No G, ande uma casa até o B ou o D.",
                "A ideia é ouvir que nem sempre é preciso pular: às vezes a nota certa está do lado.",
              ],
              check: "Achou uma nota do acorde em cada troca, andando pouco?",
              base: BASE,
              pattern: ["play", "play", "play", "play"],
              rule: "Uma nota longa por compasso",
            },
          ],
        },
        {
          id: "u5.l2",
          title: "Chegar na troca",
          intro:
            "Agora o alvo muda a cada acorde. Na segunda metade do compasso, o site mostra a nota do próximo acorde; você chega nela no tempo 1. Tônica, 3ª e 5ª se revezam, para nenhuma virar prisão.",
          key: "u5.l2.phrase",
          exercises: [
            {
              id: "u5.l2.slow",
              kind: "target",
              title: "Uma nota por acorde",
              goal: "Em cada compasso, toque só a nota-alvo, longa, entrando junto com o acorde.",
              steps: [
                "Quando a faixa avisar o próximo alvo, procure a nota no braço antes da troca.",
                "Escolha a posição mais perto de onde a mão está.",
              ],
              check: "Chegou em todos os alvos no tempo da troca?",
              base: BASE_SLOW,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Só a nota-alvo, uma por compasso",
            },
            {
              id: "u5.l2.phrase",
              kind: "target",
              title: "Frase que termina no alvo",
              goal: "Toque frases curtas que terminam na nota-alvo, bem na troca de acorde.",
              steps: [
                "Comece a frase depois do tempo 1 e termine no tempo 1 do compasso seguinte, no alvo.",
                "Deixe a nota-alvo soar um pouco antes da próxima frase.",
              ],
              check: "Suas frases terminaram nos alvos, e não perto deles?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Termine cada frase no alvo",
            },
          ],
        },
        {
          id: "u5.l3",
          title: "Sem olhar",
          intro:
            "Até aqui a tela dizia quando o acorde trocava. Na música de verdade, quem diz é o ouvido. Os nomes dos acordes somem e a ordem fica menos previsível: escute o baixo, que muda junto com o acorde.",
          key: "u5.l3.blind",
          exercises: [
            {
              id: "u5.l3.blind",
              kind: "target",
              title: "Ouça a troca e chegue",
              goal: "A faixa só diz o grau (tônica, 3ª ou 5ª). Descubra de ouvido qual acorde está soando e ache a nota.",
              steps: [
                "São oito compassos com Am, F, C e G, numa ordem que não se repete a cada quatro.",
                "Escute o baixo: ele toca a tônica de cada acorde.",
                "Se travar, abra o braço por uma volta e feche de novo.",
              ],
              check: "Achou os alvos sem abrir o braço?",
              base: LONG,
              shape: 1,
              degrees: ["T", "3", "5"],
              blind: true,
            },
          ],
        },
      ],
    },
    {
      id: "u6",
      title: "Ligar",
      skill: "A nota do acorde como fim de um gesto",
      takeCheck: "Suas chegadas nas notas do acorde vieram de um caminho, e nem todas no tempo 1?",
      lessons: [
        {
          id: "u6.l1",
          title: "Chegar por um passo",
          intro:
            "Uma nota do acorde soa mais forte quando se chega nela andando: a nota vizinha da escala, de cima ou de baixo, e então o alvo. É o que transforma uma nota certa numa frase.",
          key: "u6.l1.target",
          exercises: [
            {
              id: "u6.l1.echo",
              kind: "echo",
              title: "Pela vizinha",
              goal: "Repita as frases. Todas chegam no acorde novo vindo da nota vizinha.",
              steps: ["Repare de onde vem a última nota: de cima ou de baixo?"],
              check: "Repetiu as três sem olhar o braço?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("l1", "Por baixo até o Lá", 2, [
                  [2, 5, 1, 1],
                  [2, 8, 3, 1],
                  [1, 5, 4, 2.5],
                ]),
                phrase("l2", "Por cima até o Lá", 2, [
                  [2, 5, 0.5, 0.5],
                  [2, 8, 1, 0.5],
                  [1, 8, 2, 1.5],
                  [1, 5, 4, 2.5],
                ]),
                phrase("l3", "Por cima até o Dó", 2, [
                  [4, 7, 1, 1.5],
                  [3, 7, 3, 1],
                  [3, 5, 4, 2.5],
                ]),
              ],
            },
            {
              id: "u6.l1.target",
              kind: "target",
              title: "Alvo pela vizinha",
              goal: "Chegue em cada alvo vindo da nota vizinha da escala, de cima ou de baixo.",
              steps: ["A vizinha toca curta, logo antes da troca; o alvo entra com o acorde.", "Alterne: uma chegada por cima, a outra por baixo."],
              check: "Chegou nos alvos pela vizinha, sem pular de longe?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Chegue pela nota vizinha",
            },
          ],
        },
        {
          id: "u6.l2",
          title: "Antes e depois do tempo 1",
          intro:
            "Chegar no alvo sempre em cima do tempo 1 fica previsível de novo. Os solos que você gosta antecipam a troca, com o alvo entrando meio tempo antes do acorde, ou atrasam, com uma nota de passagem no tempo 1 e o alvo logo depois.",
          key: "u6.l2.target",
          exercises: [
            {
              id: "u6.l2.echo",
              kind: "echo",
              title: "Antecipar e atrasar",
              goal: "Repita as duas frases. Uma chega antes do acorde, a outra depois.",
              steps: ['Na antecipada, o Lá entra no "e" do tempo 4.', "Na atrasada, a nota do tempo 1 é de passagem; o alvo vem no tempo 2."],
              check: "Acertou o lugar da chegada nas duas?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("l4", "Antecipada", 2, [
                  [2, 5, 1, 1],
                  [2, 8, 2, 1],
                  [1, 5, 3.5, 3],
                ]),
                phrase("l5", "Atrasada", 2, [
                  [3, 7, 1.5, 0.5],
                  [2, 5, 2, 1.5],
                  [2, 8, 4, 1],
                  [1, 5, 5, 2],
                ]),
              ],
            },
            {
              id: "u6.l2.target",
              kind: "target",
              title: "Fora do tempo 1",
              goal: "Chegue em cada alvo meio tempo antes da troca ou um tempo depois, nunca em cima.",
              steps: ["Alterne: uma antecipada, uma atrasada.", "No atraso, toque uma nota de passagem no tempo 1."],
              check: "Nenhuma chegada caiu em cima do tempo 1?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Antes ou depois da troca, nunca em cima",
            },
          ],
        },
        {
          id: "u6.l3",
          title: "Chegar com bend e slide",
          intro:
            "Juntando tudo: o alvo como fim de um gesto. Um bend que chega na 3ª do acorde, um slide que escorrega até a tônica. É assim que a nota do acorde deixa de ser exercício e vira frase.",
          key: "u6.l3.target",
          exercises: [
            {
              id: "u6.l3.echo",
              kind: "echo",
              title: "Gestos até o alvo",
              goal: "Repita: uma chegada por bend, outra por slide.",
              steps: ["Na frase 1, o alvo chega por bend. Na frase 2, chega por slide: da casa 5 à 7 da 4ª corda."],
              check: "As chegadas soaram como o fim de um gesto, não como uma nota solta?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("l6", "Bend na troca", 2, [
                  [2, 5, 1, 1],
                  [3, 7, 2, 1],
                  [2, 8, 4, 2.5, { bend: 2 }],
                ]),
                phrase("l7", "Slide até a tônica", 2, [
                  [4, 7, 0.5, 2, { slide: 5 }],
                  [3, 5, 3, 0.5],
                  [3, 5, 4, 2.5],
                ]),
              ],
            },
            {
              id: "u6.l3.target",
              kind: "target",
              title: "Alvo com gesto",
              goal: "Chegue em cada alvo com um bend ou um slide.",
              steps: ["Nem todo alvo tem bend por perto: quando não tiver, use o slide.", "Termine com vibrato nos alvos longos."],
              check: "Chegou nos alvos com bend ou slide, afinado?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Chegue no alvo com bend ou slide",
            },
          ],
        },
      ],
    },
    {
      id: "u11",
      title: "Tensão e resolução",
      skill: "A nota da pentatônica que incomoda, e para onde ela quer ir",
      takeCheck: "Suas tensões resolveram numa nota do acorde, em vez de ficar penduradas?",
      lessons: [
        {
          id: "u11.l1",
          title: "A nota que pede para resolver",
          intro:
            "Nem toda nota da pentatônica é nota do acorde. Sobre o Am, o Ré e o Sol incomodam um pouco; sobre o F, também. Essa tensão é boa: ela pede a próxima nota. O que não pode é deixar pendurada: a tensão resolve numa nota do acorde, logo ao lado.",
          key: "u11.l1.echo",
          exercises: [
            {
              id: "u11.l1.echo",
              kind: "echo",
              title: "Incomoda e resolve",
              goal: "Repita. Em cada frase, uma nota incomoda e a seguinte resolve.",
              steps: ["Repare na nota que pede continuação.", "Abra o braço só para conferir."],
              check: "Ouviu qual nota incomodava antes de abrir o braço?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("t1", "Ré cai no Dó", 2, [
                  [2, 5, 0.5, 0.5],
                  [3, 7, 1, 1],
                  [3, 5, 2, 1.5],
                  [2, 8, 4, 1],
                  [1, 5, 5, 2],
                ]),
                phrase("t2", "Sol sobe para o Lá", 2, [
                  [2, 8, 0, 1],
                  [1, 5, 1, 2],
                  [3, 7, 4.5, 1],
                  [3, 5, 5.5, 2],
                ]),
              ],
            },
            {
              id: "u11.l1.pr",
              kind: "play-rest",
              title: "Uma tensão por frase",
              goal: "Toda frase passa por uma nota que incomoda e resolve numa nota do acorde.",
              steps: ["Segure a tensão um pouco: é ela que dá vontade de ouvir a próxima.", "A resolução fica a uma nota de distância na pentatônica."],
              check: "Suas tensões resolveram, em vez de ficar penduradas?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Uma tensão que resolve, por frase",
            },
          ],
        },
        {
          id: "u11.l2",
          title: "Tensão na troca",
          intro:
            "O lugar mais forte para uma tensão é em cima da troca: o acorde muda, a nota fica pendurada meio tempo e cai no alvo. É o que faz um solo simples soar como música.",
          key: "u11.l2.target",
          exercises: [
            {
              id: "u11.l2.echo",
              kind: "echo",
              title: "Pendura e cai",
              goal: "Repita. A nota do tempo 1 do F é uma tensão; o alvo vem meio tempo depois.",
              steps: [],
              check: "Sentiu a nota pendurada caindo no alvo?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("t3", "Pendura e cai", 2, [
                  [3, 5, 1, 1.5],
                  [3, 7, 4, 0.5],
                  [3, 5, 4.5, 2],
                ]),
              ],
            },
            {
              id: "u11.l2.target",
              kind: "target",
              title: "Alvo pela tensão",
              goal: "Chegue em cada alvo passando antes pela nota da pentatônica ao lado dele.",
              steps: ["A tensão pode cair em cima da troca; o alvo vem logo depois.", "Varie: às vezes chegue direto."],
              check: "Suas tensões caíram no alvo, sem ficar penduradas?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Chegue no alvo vindo de uma tensão",
            },
          ],
        },
      ],
    },
    {
      id: "a2",
      title: "Arco 2: o solo que segue os acordes",
      skill: "Um solo que chega nas notas do acorde, com tensão que resolve",
      arc: true,
      takeCheck: "Suas frases chegaram em notas do acorde na troca, com alguma tensão resolvida no caminho?",
      lessons: [
        {
          id: "a2.l1",
          title: "Oito compassos na harmonia",
          intro:
            "Agora o solo conversa com a base: cada troca de acorde é um lugar para chegar, de preferência vindo de perto, às vezes passando por uma nota que incomoda e resolve. O exemplo faz isso só com o desenho 1.",
          key: "a2.take",
          exercises: [
            {
              id: "a2.take",
              kind: "take",
              title: "O solo que segue os acordes",
              goal: "Oito compassos. Em cada troca, chegue numa nota do novo acorde.",
              steps: ["Vale antecipar ou atrasar a chegada.", "Pelo menos uma tensão por frase, resolvida logo depois."],
              check: "Suas frases chegaram em notas do acorde na troca, com alguma tensão resolvida no caminho?",
              base: BASE,
              bars: 8,
              arc: ["Chega na troca", "Tensão e volta", "Chega na troca", "Fecha no alvo"],
              example: phrase("x2", "Exemplo do arco 2", 8, [
                [1, 8, 0.5, 0.5],
                [1, 5, 1, 1],
                [2, 8, 2, 0.5],
                [2, 5, 2.5, 1],
                [1, 5, 3.5, 2.5],
                [2, 8, 6, 1],
                [1, 5, 7, 0.5],
                [1, 8, 8, 2],
                [3, 5, 12.5, 1],
                [3, 7, 13.5, 2],
                [3, 7, 16, 0.5],
                [3, 5, 16.5, 1.5],
                [4, 7, 19.5, 0.5],
                [3, 5, 20, 2],
                [2, 5, 24, 0.5],
                [2, 8, 24.5, 0.5],
                [1, 5, 25, 0.5],
                [2, 8, 25.5, 2],
                [3, 7, 28.5, 0.5],
                [2, 8, 29, 2.5],
              ]),
            },
          ],
        },
      ],
    },
    {
      id: "u7",
      title: "Uma corda só",
      skill: "Ouvir os saltos sem o apoio do desenho",
      takeCheck: "Você andou pelo braço na horizontal, e não só dentro do desenho 1?",
      lessons: [
        {
          id: "u7.l1",
          title: "A 2ª corda inteira",
          intro:
            "O desenho ajuda e prende: os dedos decoram caminhos e o ouvido descansa. Numa corda só não há caminho decorado. Cada nota é um salto que você precisa ouvir antes de tocar. É assim que o braço deixa de ser uma caixa.",
          key: "u7.l1.echo",
          exercises: [
            {
              id: "u7.l1.line",
              kind: "line",
              title: "A pentatônica numa corda",
              goal: "Suba e desça a 2ª corda só com as notas da pentatônica.",
              steps: [
                "Diga o nome de cada nota em voz alta enquanto toca.",
                "Com a base, pare nas notas do acorde e deixe soar.",
              ],
              check: "Andou pela corda inteira sabendo o nome de cada nota?",
              base: VAMP,
              string: 1,
              frets: [1, 15],
            },
            {
              id: "u7.l1.echo",
              kind: "echo",
              title: "Frases numa corda",
              goal: "Tire as frases de ouvido. Todas ficam na 2ª corda.",
              steps: [
                "Antes de tocar, cante e pergunte: a próxima nota sobe ou desce? Pouco ou muito?",
                "Procure na 2ª corda.",
              ],
              check: "Achou as frases na corda sem abrir o braço?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("c1", "Subindo a corda", 2, [
                  [2, 5, 0, 1],
                  [2, 8, 1, 1],
                  [2, 10, 2, 1.5],
                  [2, 13, 4, 2.5, { slide: 10 }],
                ]),
                phrase("c2", "Descendo a corda", 2, [
                  [2, 15, 0.5, 1],
                  [2, 13, 1.5, 1.5],
                  [2, 10, 3, 0.5],
                  [2, 8, 3.5, 0.5],
                  [2, 10, 4, 2.5],
                ]),
              ],
            },
          ],
        },
        {
          id: "u7.l2",
          title: "Improvisar numa corda",
          intro:
            "Com uma corda só, a melodia aparece sozinha: não dá para correr escala, só para cantar. Os alvos de antes continuam valendo, agora espalhados pelo braço.",
          key: "u7.l2.target",
          exercises: [
            {
              id: "u7.l2.pr",
              kind: "play-rest",
              title: "Só a 2ª corda",
              goal: "Improvise usando só a 2ª corda, do começo ao fim do braço.",
              steps: ["Use slides para mudar de região.", "Faça pelo menos um salto grande por frase."],
              check: "Ficou na corda e ainda assim fez frases, não escalas?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Só a 2ª corda",
            },
            {
              id: "u7.l2.target",
              kind: "target",
              title: "Alvos numa corda",
              goal: "Chegue em cada alvo na troca, sem sair da 2ª corda.",
              steps: ["Quase todo alvo aparece duas vezes na corda: escolha a mais perto.", "Escorregue até o alvo quando puder."],
              check: "Chegou nos alvos na troca sem sair da corda?",
              base: BASE,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Só a 2ª corda",
              line: { string: 1, frets: [1, 15] },
            },
          ],
        },
      ],
    },
    {
      id: "u12",
      title: "Outras regiões",
      skill: "Os desenhos 2 e 3 sobre a base, e mudar de região no meio da frase",
      takeCheck: "Você usou mais de uma região do braço?",
      lessons: [
        {
          id: "u12.l1",
          title: "Desenho 2",
          intro:
            "O desenho 1 é só uma janela. Acima dele, o desenho 2 tem as mesmas notas, com outro caminho para os dedos e outras notas do acorde à mão. Os alvos continuam os mesmos; muda onde eles estão.",
          key: "u12.l1.target",
          exercises: [
            {
              id: "u12.l1.map",
              kind: "map",
              title: "As notas do acorde no desenho 2",
              goal: "Para cada acorde, toque as notas dele dentro do desenho 2.",
              steps: ["Uma nota longa por acorde."],
              check: "Achou uma nota de cada acorde no desenho 2, no tempo da troca?",
              base: BASE,
              shapes: [2],
              layer: "chord",
            },
            {
              id: "u12.l1.target",
              kind: "target",
              title: "Alvos no desenho 2",
              goal: "Chegue em cada alvo na troca, sem sair do desenho 2.",
              steps: ["Se travar, olhe o braço por uma volta."],
              check: "Chegou nos alvos sem voltar para o desenho 1?",
              base: BASE,
              shape: 2,
              degrees: ["T", "3", "5"],
              rule: "Só o desenho 2",
            },
          ],
        },
        {
          id: "u12.l2",
          title: "Desenho 3",
          intro: "Mais acima, o desenho 3. Com três desenhos, a mesma nota do acorde aparece em vários lugares: a escolha passa a ser onde ela soa melhor, não onde ela está.",
          key: "u12.l2.target",
          exercises: [
            {
              id: "u12.l2.target",
              kind: "target",
              title: "Alvos no desenho 3",
              goal: "Chegue em cada alvo na troca, no desenho 3.",
              steps: ["Repare que algumas notas do acorde estão onde estavam no desenho 2: os desenhos se encaixam."],
              check: "Chegou nos alvos sem voltar para os desenhos de baixo?",
              base: BASE,
              shape: 3,
              degrees: ["T", "3", "5"],
              rule: "Só o desenho 3",
            },
          ],
        },
        {
          id: "u12.l3",
          title: "Trocar de região na frase",
          intro: "A região não precisa ser fixa. Um slide no meio da frase leva você para cima ou para baixo sem cortar a ideia, e o ouvinte sente o solo andar.",
          key: "u12.l3.pr",
          exercises: [
            {
              id: "u12.l3.echo",
              kind: "echo",
              title: "Subir e descer",
              goal: "Repita. As frases mudam de desenho pelo caminho.",
              steps: ["Ache no braço onde o slide leva a frase."],
              check: "Repetiu as duas sem olhar o braço?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("r1", "Sobe para o desenho 2", 2, [
                  [2, 5, 0.5, 0.5],
                  [2, 8, 1, 0.5],
                  [2, 10, 1.5, 1.5, { slide: 8 }],
                  [1, 10, 4, 0.5],
                  [1, 8, 4.5, 2],
                ]),
                phrase("r2", "Desce para o desenho 1", 2, [
                  [1, 10, 0.5, 1],
                  [1, 8, 1.5, 0.5],
                  [2, 10, 2, 1.5],
                  [2, 8, 4, 0.5],
                  [2, 5, 4.5, 0.5],
                  [3, 7, 5, 0.5],
                  [3, 5, 5.5, 2],
                ]),
              ],
            },
            {
              id: "u12.l3.pr",
              kind: "play-rest",
              title: "Começa num, termina no outro",
              goal: "Cada frase começa num desenho e termina em outro.",
              steps: ["Use slides para mudar de região.", "Termine numa nota do acorde."],
              check: "Suas frases mudaram de região sem perder a ideia?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Cada frase muda de desenho",
            },
          ],
        },
      ],
    },
    {
      id: "u13",
      title: "Outro tom",
      skill: "A mesma pentatônica em outra casa",
      takeCheck: "Achou as notas do acorde no tom novo sem voltar para o desenho de Lá?",
      lessons: [
        {
          id: "u13.l1",
          title: "Mi menor",
          intro:
            "Na pentatônica, mudar de tom é mudar de casa: o desenho 1 de Mi menor é o de Lá menor sete casas acima. O que não muda é o que você aprendeu: as notas do acorde ficam nos mesmos pontos do desenho.",
          key: "u13.l1.target",
          exercises: [
            {
              id: "u13.l1.map",
              kind: "map",
              title: "O desenho 1 em Mi menor",
              goal: "Toque o desenho 1 em Mi menor, achando as tônicas antes.",
              steps: ["Compare com o de Lá: é o mesmo desenho, em outra casa."],
              check: "Achou as tônicas e tocou o desenho no tempo?",
              base: EM_VAMP,
              shapes: [1],
              layer: "penta",
            },
            {
              id: "u13.l1.target",
              kind: "target",
              title: "Alvos em Mi menor",
              goal: "Chegue em cada alvo na troca, no desenho 1 de Mi menor.",
              steps: ["A base é Em C G D: os mesmos papéis de Am F C G, outra casa."],
              check: "Chegou nos alvos no tom novo?",
              base: EM,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Mi menor, desenho 1",
            },
          ],
        },
        {
          id: "u13.l2",
          title: "Ré menor",
          intro: "Mais um tom, agora abaixo. Na banda, quem escolhe o tom é a música, não o guitarrista: o desenho tem que ir aonde ela estiver.",
          key: "u13.l2.target",
          exercises: [
            {
              id: "u13.l2.target",
              kind: "target",
              title: "Alvos em Ré menor",
              goal: "Chegue em cada alvo na troca, no desenho 1 de Ré menor.",
              steps: ["A base é Dm Bb F C.", "Ache a tônica antes de ligar a base."],
              check: "Chegou nos alvos no tom novo?",
              base: DM,
              shape: 1,
              degrees: ["T", "3", "5"],
              rule: "Ré menor, desenho 1",
            },
          ],
        },
      ],
    },
    {
      id: "a3",
      title: "Arco 3: do grave ao agudo",
      skill: "Um solo que atravessa o braço e cresce até um ponto alto",
      arc: true,
      takeCheck: "Seu solo subiu de região aos poucos e chegou num ponto alto?",
      lessons: [
        {
          id: "a3.l1",
          title: "Atravessar o braço",
          intro:
            'Os solos que ficam na memória têm forma: começam calmos e graves, crescem e chegam a um ponto alto. O segundo solo de "Comfortably Numb" começa grave e termina agudo. Aqui a base é de rock, um pouco mais rápida, e a faixa diz em que parte do arco você está.',
          key: "a3.take",
          exercises: [
            {
              id: "a3.take",
              kind: "take",
              title: "Do grave ao agudo",
              goal: "Oito compassos em quatro partes, do grave ao agudo. Siga a faixa.",
              steps: [
                "Grave: cordas de baixo do desenho 1, poucas notas.",
                "Meio: cordas do meio, frases um pouco mais longas.",
                "Agudo: suba de desenho com um slide.",
                "Pico: a nota mais alta do solo, segurada.",
              ],
              check: "Seu solo subiu de região aos poucos e chegou num ponto alto?",
              base: ROCK,
              bars: 8,
              arc: ["Grave", "Meio", "Agudo", "Pico"],
              example: phrase("x3", "Exemplo do arco 3", 8, [
                [6, 5, 0.5, 1.5],
                [6, 8, 2.5, 0.5],
                [5, 5, 3, 0.5],
                [5, 7, 3.5, 1],
                [4, 7, 5, 1.5],
                [4, 5, 6.5, 0.5],
                [4, 7, 7, 0.5],
                [3, 5, 8.5, 0.5],
                [3, 7, 9, 0.5],
                [2, 5, 9.5, 2],
                [2, 8, 12.5, 0.5],
                [1, 10, 13, 2, { slide: 8 }],
                [1, 12, 16.5, 1.5, { slide: 10 }],
                [2, 13, 18, 0.5],
                [2, 10, 18.5, 1],
                [1, 15, 20, 0.5],
                [1, 17, 20.5, 2],
                [2, 15, 24, 2, { bend: 2 }],
                [1, 15, 26, 0.5],
                [1, 15, 28, 3, { vib: "lento", vibDelay: 1 }],
              ]),
            },
          ],
        },
      ],
    },
    {
      id: "u8",
      title: "Motivo",
      skill: "Repetir e variar uma ideia, em vez de juntar ideias soltas",
      takeCheck: "Alguma frase sua voltou, igual ou variada, mais adiante na tomada?",
      lessons: [
        {
          id: "u8.l1",
          title: "Repetir de propósito",
          intro:
            "De um solo, quem ouve guarda pouca coisa: uma ideia que volta. Repetir parece pobre para quem toca e soa como intenção para quem ouve. Improvisadores experientes retomam o que acabaram de tocar o tempo todo.",
          key: "u8.l1.echo",
          exercises: [
            {
              id: "u8.l1.echo",
              kind: "echo",
              title: "A mesma frase, outro acorde",
              goal: "Repita. Cada frase toca uma ideia curta e a repete sobre o acorde seguinte.",
              steps: ["Ouça como a mesma frase muda de cor quando o acorde troca."],
              check: "Repetiu a ideia igual, nos dois acordes?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("m1", "Lá, Dó, Lá", 2, [
                  [1, 5, 0.5, 0.5],
                  [1, 8, 1, 0.5],
                  [1, 5, 1.5, 1.5],
                  [1, 5, 4.5, 0.5],
                  [1, 8, 5, 0.5],
                  [1, 5, 5.5, 1.5],
                ]),
                phrase("m2", "Três notas descendo", 2, [
                  [2, 8, 1, 0.5],
                  [2, 5, 1.5, 0.5],
                  [3, 7, 2, 1],
                  [2, 8, 5, 0.5],
                  [2, 5, 5.5, 0.5],
                  [3, 5, 6, 1.5],
                ]),
              ],
            },
            {
              id: "u8.l1.pr",
              kind: "play-rest",
              title: "Diga duas vezes",
              goal: "Toque uma frase curta. No próximo compasso de tocar, repita igual.",
              steps: ["Frases de três a cinco notas: precisa caber na memória.", "Depois de repetir, invente outra e repita também."],
              check: "Conseguiu repetir suas frases iguais?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "A segunda frase repete a primeira",
            },
          ],
        },
        {
          id: "u8.l2",
          title: "Variar uma coisa só",
          intro:
            "Repetir igual três vezes cansa. O passo seguinte é repetir mudando uma coisa só: o ritmo, a nota final, a região ou a técnica. Quem ouve reconhece a ideia e se surpreende com o que mudou.",
          key: "u8.l2.end",
          exercises: [
            {
              id: "u8.l2.echo",
              kind: "echo",
              title: "O que mudou?",
              goal: "Repita cada frase e diga o que mudou na segunda metade: o ritmo ou o fim.",
              steps: ["Ouça duas vezes antes de tocar.", "Diga em voz alta o que mudou. Depois toque."],
              check: "Ouviu o que mudou antes de abrir o braço?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("m3", "Muda o fim", 2, [
                  [1, 5, 0, 0.5],
                  [1, 8, 0.5, 0.5],
                  [1, 5, 1, 1.5],
                  [1, 5, 4, 0.5],
                  [1, 5, 4.5, 0.5],
                  [1, 8, 5, 1.5],
                ]),
                phrase("m4", "Muda o ritmo", 2, [
                  [2, 5, 0, 1],
                  [2, 8, 1, 1],
                  [1, 5, 2, 1.5],
                  [2, 5, 4.5, 0.5],
                  [2, 8, 5, 0.5],
                  [1, 5, 5.5, 2],
                ]),
              ],
            },
            {
              id: "u8.l2.rhythm",
              kind: "play-rest",
              title: "Muda só o ritmo",
              goal: "Toque uma frase e repita com as mesmas notas, em outro ritmo.",
              steps: ["Mesmas notas, mesma ordem.", "Experimente começar mais tarde ou alongar a última nota."],
              check: "As notas ficaram iguais e só o ritmo mudou?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "Mesmas notas, outro ritmo",
            },
            {
              id: "u8.l2.end",
              kind: "play-rest",
              title: "Muda só o fim",
              goal: "Toque uma frase e repita igual, mudando só a última nota para uma nota do acorde novo.",
              steps: ["Ouça qual acorde vem antes de repetir.", "Se a nota final já servir, troque por outro grau do acorde."],
              check: "A frase repetida terminou numa nota do acorde novo?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "Mesma frase, outro fim",
            },
          ],
        },
        {
          id: "u8.l3",
          title: "Pergunta e resposta",
          intro:
            "Duas frases que conversam: a pergunta fica no ar, termina numa nota que pede continuação; a resposta começa parecida e pousa. É o motivo dando direção ao solo.",
          key: "u8.l3.pr",
          exercises: [
            {
              id: "u8.l3.echo",
              kind: "echo",
              title: "Uma pergunta, uma resposta",
              goal: "Repita. A primeira metade termina no ar; a segunda começa igual e pousa na tônica.",
              steps: ["Cante as duas metades.", "Repare: a resposta termina mais grave e mais longa."],
              check: "Sentiu a diferença entre terminar no ar e pousar?",
              base: VAMP,
              reveal: "tab",
              phrases: [
                phrase("m5", "Pergunta e resposta", 2, [
                  [1, 8, 0.5, 0.5],
                  [1, 5, 1, 0.5],
                  [2, 8, 1.5, 0.5],
                  [2, 5, 2, 1.5],
                  [1, 8, 4.5, 0.5],
                  [1, 5, 5, 0.5],
                  [2, 8, 5.5, 0.5],
                  [4, 7, 6, 1.5],
                ]),
              ],
            },
            {
              id: "u8.l3.pr",
              kind: "play-rest",
              title: "Conversa",
              goal: "Faça uma pergunta, cale, e responda com uma frase que começa igual e pousa numa nota do acorde.",
              steps: ["A pergunta termina fora da tônica.", "A resposta reaproveita o começo da pergunta."],
              check: "Suas respostas começaram como as perguntas e pousaram?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "Pergunta no ar, resposta pousa",
            },
          ],
        },
      ],
    },
    {
      id: "u9",
      title: "Vocabulário",
      skill: "Poucas frases guardadas que viram suas",
      takeCheck: "Você usou pelo menos uma frase guardada, e mudou alguma coisa nela?",
      lessons: [
        {
          id: "u9.l1",
          title: "Três frases para guardar",
          intro:
            "Todo improvisador toca coisas que já tocou antes. A diferença está em guardar poucas frases, bem guardadas, e saber mudar cada uma. Aqui são três frases curtas: uma com bend, uma com slide e uma de ritmo. Guarde até tocar sem pensar.",
          key: "u9.l1.echo",
          exercises: [
            {
              id: "u9.l1.echo",
              kind: "echo",
              title: "As três guardadas",
              goal: "Tire as três de ouvido e repita cada uma até sair sem pensar.",
              steps: ["Uma por vez. Só passe para a próxima quando acertar duas vezes seguidas.", "Amanhã, toque as três antes de abrir o site."],
              check: "Toca as três de memória, sem olhar?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("g1", "Guardada 1: o bend", 2, [
                  [3, 7, 0.5, 1, { bend: 2 }],
                  [2, 5, 1.5, 0.5],
                  [3, 7, 2, 0.5],
                  [3, 5, 2.5, 1.5],
                ]),
                phrase("g2", "Guardada 2: o slide", 2, [
                  [4, 7, 1, 1, { slide: 5 }],
                  [3, 5, 2, 0.5],
                  [3, 7, 2.5, 0.5],
                  [2, 5, 3, 0.5],
                  [3, 7, 3.5, 0.5],
                  [3, 5, 4, 2.5],
                ]),
                phrase("g3", "Guardada 3: o ritmo", 2, [
                  [1, 5, 0.75, 0.25],
                  [1, 5, 1, 0.5],
                  [1, 8, 1.5, 0.5],
                  [1, 5, 2.5, 0.5],
                  [1, 8, 3.5, 0.5],
                  [1, 5, 4, 2],
                ]),
              ],
            },
            {
              id: "u9.l1.pr",
              kind: "play-rest",
              title: "Uma guardada por vez",
              goal: "Nos compassos de tocar, use uma das três frases guardadas, inteira.",
              steps: ["Alterne as três.", "Entre elas, silêncio de verdade."],
              check: "As frases saíram inteiras, no tempo?",
              base: AM_F,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Só as frases guardadas",
            },
          ],
        },
        {
          id: "u9.l2",
          title: "Levar a frase para outro lugar",
          intro:
            "Uma frase guardada só vira vocabulário quando muda de lugar: sobre outro acorde, começando em outro tempo, terminando em outra nota. Aqui você pega as três da lição anterior e as transporta.",
          key: "u9.l2.chord",
          exercises: [
            {
              id: "u9.l2.time",
              kind: "play-rest",
              title: "Outro tempo",
              goal: "Toque uma frase guardada começando num tempo diferente do original.",
              steps: ["Atrase meio tempo, depois um tempo inteiro.", "As notas ficam iguais; só a entrada muda."],
              check: "A frase continuou reconhecível começando em outro tempo?",
              base: BASE,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Frase guardada, outra entrada",
            },
            {
              id: "u9.l2.chord",
              kind: "play-rest",
              title: "Outro acorde",
              goal: "Toque uma frase guardada sobre C ou G, ajustando a última nota para uma nota do acorde.",
              steps: ["Sobre C, termine em C, E ou G. Sobre G, em G, B ou D.", "Mude só o necessário: o resto da frase fica."],
              check: "A frase terminou numa nota do acorde novo?",
              base: C_G,
              pattern: ["play", "play", "rest", "rest"],
              rule: "Frase guardada, fim ajustado",
            },
          ],
        },
      ],
    },
    {
      id: "u14",
      title: "Intensidade",
      skill: "Pouco e muito, fraco e forte: o solo que cresce de propósito",
      takeCheck: "A intensidade mudou de propósito, em vez de ficar igual do começo ao fim?",
      lessons: [
        {
          id: "u14.l1",
          title: "Pouco e muito",
          intro: "A mesma ideia pode vir com duas notas ou com oito. Encher aos poucos é o jeito mais simples de fazer o solo crescer, e esvaziar é o jeito de acalmar.",
          key: "u14.l1.pr",
          exercises: [
            {
              id: "u14.l1.echo",
              kind: "echo",
              title: "A mesma ideia, mais cheia",
              goal: "Repita. A segunda metade diz a mesma coisa com mais notas.",
              steps: ["Cante as duas metades."],
              check: "Repetiu as duas versões sem olhar?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("i1", "Vazia e cheia", 2, [
                  [1, 5, 0, 1.5],
                  [1, 8, 2, 1.5],
                  [1, 5, 4, 0.5],
                  [1, 8, 4.5, 0.5],
                  [1, 5, 5, 0.5],
                  [2, 8, 6, 0.5],
                  [1, 5, 6.5, 1.5],
                ]),
              ],
            },
            {
              id: "u14.l1.pr",
              kind: "play-rest",
              title: "Responde com o dobro",
              goal: "A resposta repete a ideia da pergunta com o dobro de notas.",
              steps: ["Pergunta com duas ou três notas.", "Resposta com a mesma direção, mais cheia."],
              check: "Suas respostas encheram a ideia sem virar escala?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "Resposta com o dobro de notas",
            },
          ],
        },
        {
          id: "u14.l2",
          title: "Fraco e forte",
          intro: "Palhetar mais fraco ou mais forte muda tudo sem mudar uma nota. Um solo inteiro no mesmo volume cansa; uma frase fraca seguida de uma forte acorda quem está ouvindo.",
          key: "u14.l2.pr",
          exercises: [
            {
              id: "u14.l2.echo",
              kind: "echo",
              title: "Fraco, depois forte",
              goal: "Repita, com a mesma diferença de volume.",
              steps: ["A primeira metade quase sussurrada; a segunda, cheia."],
              check: "Sua repetição teve a mesma diferença de volume?",
              base: AM_F,
              reveal: "tab",
              phrases: [
                phrase("i2", "Fraco, depois forte", 2, [
                  [1, 8, 0.5, 0.5, { amp: 0.35 }],
                  [1, 5, 1, 0.5, { amp: 0.35 }],
                  [2, 8, 1.5, 0.5, { amp: 0.35 }],
                  [1, 5, 2, 1.5, { amp: 0.35 }],
                  [1, 8, 4.5, 0.5],
                  [1, 5, 5, 0.5],
                  [2, 8, 5.5, 0.5],
                  [1, 5, 6, 1.5],
                ]),
              ],
            },
            {
              id: "u14.l2.pr",
              kind: "play-rest",
              title: "Pergunta fraca, resposta forte",
              goal: "A pergunta fraca, a resposta forte. Depois, inverta.",
              steps: ["Exagere a diferença: no começo, ela sempre parece menor do que é."],
              check: "Dava para ouvir a diferença de volume entre as frases?",
              base: BASE,
              pattern: ["play", "rest", "play", "rest"],
              rule: "Fraco, depois forte",
            },
          ],
        },
        {
          id: "u14.l3",
          title: "Crescer em oito compassos",
          intro: "Juntando as duas: oito compassos que começam vazios e fracos e terminam cheios e fortes. É o motor de qualquer arco.",
          key: "u14.l3.take",
          exercises: [
            {
              id: "u14.l3.take",
              kind: "take",
              title: "Só cresce",
              goal: "Oito compassos que só crescem: mais notas e mais volume a cada parte.",
              steps: ["Comece com quase nada.", "Não chegue ao máximo antes da última parte."],
              check: "O solo cresceu aos poucos, sem chegar no máximo cedo demais?",
              base: BASE,
              bars: 8,
              arc: ["Pouco e fraco", "Mais notas", "Mais forte", "O máximo"],
            },
          ],
        },
      ],
    },
    {
      id: "u10",
      title: "Arco final: o solo inteiro",
      skill: "Dezesseis compassos só com a pentatônica, que alguém pagaria para ouvir",
      arc: true,
      takeCheck: "Seu solo teve começo, pico e fim, com uma ideia que voltou?",
      lessons: [
        {
          id: "u10.l2",
          title: "Compor o solo",
          intro:
            'O segundo solo de "Comfortably Numb" foi montado com as melhores partes de várias tomadas: o improviso virou composição. Sem gravador dá para fazer parecido: tocar, guardar o que funcionou e tocar de novo mantendo essa parte.',
          key: "u10.l2.compose",
          exercises: [
            {
              id: "u10.l2.compose",
              kind: "take",
              title: "Três tomadas",
              goal: "Toque os oito compassos três vezes. A cada vez, guarde uma frase que funcionou e mantenha no mesmo lugar.",
              steps: [
                "Primeira: livre.",
                "Segunda: mantenha a melhor frase da primeira, no mesmo compasso.",
                "Terceira: mantenha as duas melhores e improvise o resto.",
              ],
              check: "Na terceira tomada, as frases guardadas voltaram no mesmo lugar?",
              base: BASE,
              bars: 8,
              arc: ["Começo", "Pico"],
            },
          ],
        },
        {
          id: "u10.l3",
          title: "O solo inteiro",
          intro:
            "Tudo junto: respirar, ritmo, alvos na troca, tensão que resolve, o braço inteiro, um motivo que volta e intensidade que cresce. Não é para usar tudo em toda frase. É para ter tudo à mão e escolher. Só pentatônica: é o que basta.",
          key: "u10.l3.full",
          exercises: [
            {
              id: "u10.l3.full",
              kind: "take",
              title: "Dezesseis compassos",
              goal: "Um solo inteiro, com começo, desenvolvimento, pico e fim.",
              steps: [
                "Escolha um motivo para o começo e faça ele voltar, variado, perto do fim.",
                "Guarde o ponto mais alto para a terceira parte.",
              ],
              check: "Seu solo teve começo, pico e fim, com uma ideia que voltou?",
              base: BASE,
              bars: 16,
              arc: ["Começo", "Desenvolve", "Pico", "Fecha"],
              example: phrase("x4", "Exemplo do arco final", 16, [
                [1, 8, 0.5, 0.5],
                [1, 5, 1, 0.5],
                [2, 8, 1.5, 0.5],
                [1, 5, 2, 1.5],
                [2, 8, 7.5, 0.5],
                [1, 8, 8.5, 0.5],
                [1, 5, 9, 0.5],
                [2, 8, 9.5, 0.5],
                [2, 5, 10, 1.5],
                [3, 7, 12.5, 0.5],
                [2, 8, 13, 2],
                [2, 5, 16.5, 0.5],
                [2, 5, 17, 0.5],
                [2, 8, 17.5, 0.5],
                [1, 5, 18, 1.5],
                [1, 8, 20, 2, { vib: "lento", vibDelay: 1 }],
                [2, 8, 24.5, 1, { bend: 2 }],
                [2, 8, 25.5, 0.5, { release: 2 }],
                [2, 5, 26, 1.5],
                [1, 10, 32.5, 0.5],
                [1, 12, 33, 1.5, { slide: 10 }],
                [2, 13, 34.5, 0.5],
                [2, 10, 35, 1],
                [2, 13, 36, 2, { vib: "lento", vibDelay: 1 }],
                [1, 12, 40.5, 0.5],
                [1, 15, 41, 0.5],
                [1, 12, 41.5, 2],
                [1, 15, 44.5, 2],
                [1, 12, 46.5, 0.5],
                [2, 15, 48, 1.5, { bend: 2 }],
                [1, 15, 49.5, 0.5],
                [1, 17, 50, 2, { vib: "lento", vibDelay: 0.5 }],
                [1, 17, 52.5, 0.5],
                [1, 15, 53, 0.5],
                [1, 17, 53.5, 2.5],
                [1, 15, 56.5, 0.5],
                [1, 12, 57, 0.5],
                [2, 13, 57.5, 0.5],
                [2, 10, 58, 0.5],
                [2, 8, 58.5, 1.5],
                [1, 8, 60.5, 0.5],
                [1, 5, 61, 0.5],
                [2, 8, 61.5, 2.5, { vib: "lento", vibDelay: 1 }],
              ]),
            },
          ],
        },
      ],
    },
  ],

  sections: [
    { id: "s1", title: "Primeiros passos", goal: "Do mapa do braço ao primeiro solo: poucas notas, silêncio e ritmo.", units: ["u0", "u1", "u2", "a1"] },
    { id: "s2", title: "A harmonia", goal: "Ouvir a troca de acorde e chegar nas notas dele, com tensão que resolve.", units: ["u5", "u6", "u11", "a2"] },
    { id: "s3", title: "O braço", goal: "Sair do desenho 1: uma corda só, outros desenhos, outros tons.", units: ["u7", "u12", "u13", "a3"] },
    { id: "s4", title: "O solo", goal: "Motivo, vocabulário e intensidade, até um solo inteiro que alguém pagaria para ouvir.", units: ["u8", "u9", "u14", "u10"] },
  ],

  // Frases próprias, simples, no desenho 1, em ordem de dificuldade. As quatro últimas usam bend, vibrato e slide.
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
    ear(
      "f.07",
      phrase("p07", "Bend e resposta", 2, [
        [2, 8, 0.5, 1.5, { bend: 2 }],
        [2, 5, 2.5, 0.5],
        [3, 7, 3, 0.5],
        [3, 5, 4, 2.5],
      ]),
    ),
    ear(
      "f.08",
      phrase("p08", "Vibrato no fim", 2, [
        [1, 5, 1, 0.5],
        [1, 8, 1.5, 0.5],
        [1, 5, 2, 1],
        [2, 8, 3, 0.5],
        [1, 5, 4, 3, { vib: "lento", vibDelay: 1 }],
      ]),
    ),
    ear(
      "f.09",
      phrase("p09", "Solta e pousa", 2, [
        [1, 8, 0.5, 1, { bend: 2 }],
        [1, 8, 1.5, 1, { release: 2 }],
        [1, 5, 2.5, 1.5],
        [3, 5, 5, 2.5],
      ]),
    ),
    ear(
      "f.10",
      phrase("p10", "Slide, bend e vibrato", 2, [
        [4, 7, 0, 1, { slide: 5 }],
        [3, 5, 1, 0.5],
        [3, 7, 1.5, 1, { bend: 2 }],
        [2, 5, 3, 0.5],
        [2, 8, 4.5, 2.5, { bend: 2, vib: "lento", vibDelay: 1 }],
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
