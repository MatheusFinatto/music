// Desafios do Piano de Ideias. Foco: variar a ESCOLHA DAS NOTAS (o dono sentiu que tudo virou "3ª no tempo 1 + escala").
// Cada desafio: id, cat (categoria), title, text, target (alvo do teclado: "T" | "3" | "5" | "9" | "all"), demo (opcional).
// Exemplos na base padrão Am F C G (tom de Dó); o site transpõe. m = MIDI (60 = C4), b = início em tempos, d = duração.

export const CATS = {
  alvos: "Alvos",
  desenho: "Saltos e desenho",
  tensao: "Tensão e resolução",
  cor: "Cor",
  vocab: "Vocabulário",
};

export const CHALLENGES = [
  { id: "a-quinta", cat: "alvos", target: "5", title: "Termine na 5ª",
    text: "Toda frase termina na 5ª do acorde. Ela soa mais aberta e menos \"resolvida\" que a 3ª." },
  { id: "s-salto", cat: "desenho", target: "all", title: "Um salto e volta", demo: "salto",
    text: "Em cada compasso, dê um salto de 4ª ou mais e depois volte andando na direção contrária. É o que deixa uma melodia cantada." },
  { id: "t-atraso", cat: "tensao", target: "3", title: "Atrase a resolução", demo: "atraso",
    text: "No tempo 1, toque a nota logo acima do alvo e só resolva no alvo no tempo 2. Cria tensão e alívio." },
  { id: "c-nona", cat: "cor", target: "9", title: "9ª longa",
    text: "Ligue \"Notas de cor\". Segure a 9ª de um acorde por 2 tempos e depois resolva na 3ª ou na tônica." },
  { id: "v-roubada", cat: "vocab", target: "all", title: "Comece com a frase roubada",
    text: "Comece a ideia com 2 ou 3 notas da frase do Gilmour que você está tirando no Diário e continue do seu jeito." },
  { id: "a-misto", cat: "alvos", target: "all", title: "Um alvo diferente por acorde",
    text: "Mire a 3ª no 1º compasso, a 5ª no 2º, a tônica no 3º e a 9ª no 4º." },
  { id: "s-tres", cat: "desenho", target: "all", title: "Só 3 notas",
    text: "A ideia inteira usa só 3 notas diferentes. Escolha bem quais e varie a ordem e o ritmo." },
  { id: "t-antes", cat: "tensao", target: "3", title: "Chegue antes", demo: "antes",
    text: "A nota-alvo do próximo acorde entra no \"e\" do 4, antes da troca, e fica soando por cima dela." },
  { id: "c-sexta", cat: "cor", target: "all", title: "6ª no acorde menor",
    text: "Ligue \"Notas de cor\". Sobre o acorde menor, segure a 6ª (a bolinha tracejada). É o som dórico, bem Gilmour." },
  { id: "s-seq", cat: "desenho", target: "all", title: "Sequência", demo: "seq",
    text: "Invente um desenho de 3 ou 4 notas e repita começando uma nota abaixo a cada vez." },
  { id: "t-segura", cat: "tensao", target: "all", title: "Segure através da troca", demo: "segura",
    text: "Segure uma nota de um compasso para o outro quando ela serve nos dois acordes. O acorde muda por baixo e a nota ganha outro sentido." },
  { id: "a-tonica-salto", cat: "alvos", target: "T", title: "Tônica, chegando por salto",
    text: "Toda frase termina na tônica, mas chega nela por um salto (nunca pela nota vizinha)." },
  { id: "s-topo", cat: "desenho", target: "all", title: "Um ponto mais alto",
    text: "A ideia tem uma nota mais aguda que todas as outras, uma vez só, no 3º compasso. O resto prepara e depois desce." },
  { id: "v-responda", cat: "vocab", target: "all", title: "Responda o Gilmour",
    text: "Toque 2 compassos de uma frase dele (ou de outro solo que você ama) e use os 2 seguintes para responder com notas suas." },
  { id: "a-meio", cat: "alvos", target: "3", title: "Alvo no tempo 3",
    text: "A nota-alvo cai no tempo 3 de cada compasso, não no 1. O tempo 1 fica com outra nota ou em silêncio." },
];

export const DEMOS = {
  salto: { name: "Exemplo: salto e volta", bpm: 72, notes: [
    { m: 64, b: 0, d: 1 }, { m: 69, b: 1, d: 1.5 }, { m: 67, b: 2.5, d: 0.5 }, { m: 64, b: 3, d: 1 },
    { m: 72, b: 4, d: 2 }, { m: 69, b: 6, d: 1 }, { m: 67, b: 7, d: 1 },
    { m: 64, b: 8, d: 1 }, { m: 72, b: 9, d: 1.5 }, { m: 71, b: 10.5, d: 0.5 }, { m: 67, b: 11, d: 1 },
    { m: 74, b: 12, d: 2 }, { m: 71, b: 14, d: 2 }] },
  atraso: { name: "Exemplo: atrasando a resolução", bpm: 72, notes: [
    { m: 62, b: 0, d: 1 }, { m: 60, b: 1, d: 3 },
    { m: 67, b: 4, d: 1 }, { m: 69, b: 5, d: 3 },
    { m: 65, b: 8, d: 1 }, { m: 64, b: 9, d: 3 },
    { m: 60, b: 12, d: 1 }, { m: 59, b: 13, d: 3 }] },
  antes: { name: "Exemplo: chegando antes", bpm: 72, notes: [
    { m: 72, b: 0, d: 2 }, { m: 71, b: 2, d: 1 }, { m: 69, b: 3.5, d: 2.5 },
    { m: 67, b: 6, d: 1 }, { m: 64, b: 7.5, d: 2.5 },
    { m: 62, b: 10, d: 1 }, { m: 59, b: 11.5, d: 2.5 },
    { m: 62, b: 14, d: 1.5 }, { m: 60, b: 15.5, d: 0.5 }] },
  seq: { name: "Exemplo: sequência descendo", bpm: 72, notes: [
    { m: 72, b: 0, d: 1 }, { m: 69, b: 1, d: 1 }, { m: 71, b: 2, d: 1 }, { m: 67, b: 3, d: 1 },
    { m: 69, b: 4, d: 1 }, { m: 65, b: 5, d: 1 }, { m: 67, b: 6, d: 1 }, { m: 64, b: 7, d: 1 },
    { m: 65, b: 8, d: 1 }, { m: 62, b: 9, d: 1 }, { m: 64, b: 10, d: 1 }, { m: 60, b: 11, d: 1 },
    { m: 62, b: 12, d: 1 }, { m: 59, b: 13, d: 1 }, { m: 60, b: 14, d: 2 }] },
  segura: { name: "Exemplo: segurando através da troca", bpm: 72, notes: [
    { m: 69, b: 0, d: 1 }, { m: 71, b: 1, d: 1 }, { m: 72, b: 2, d: 4 },
    { m: 69, b: 6, d: 1 }, { m: 65, b: 7, d: 1 },
    { m: 64, b: 8, d: 1 }, { m: 67, b: 9, d: 5 },
    { m: 71, b: 14, d: 2 }] },
};

// Desafio do dia: muda à meia-noite e percorre a lista (que já alterna as categorias).
export function challengeOfDay(date = new Date()) {
  const day = Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
  return ((day % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
}

export const TARGETS = [["T", "T"], ["3", "3ª"], ["5", "5ª"], ["9", "9ª"], ["all", "Todas"]];
export const targetLabel = (t) => ({ T: "tônica", 3: "3ª", 5: "5ª", 9: "9ª", all: "notas do acorde" }[t] || "3ª");
