// Treino de voz: a conta que decide se a pessoa cantou a nota. Puro (sem microfone nem tela): a tela alimenta `atualizar`
// com a altura ouvida (MIDI fracionário, ou null no silêncio) e o relógio em milissegundos.

/** Quanto a altura cantada está acima (+) ou abaixo (-) do alvo, em cents. Em `qualquerOitava`, 12 semitons de diferença não contam. */
export function centsDe(midi: number, alvo: number, qualquerOitava: boolean): number {
  let d = midi - alvo;
  if (qualquerOitava) d = ((((d + 6) % 12) + 12) % 12) - 6;
  return d * 100;
}

/** Uma nota inicial qualquer (classe de altura, 0 = Dó): a opção "aleatória" da nota da tônica e do início dos padrões. */
export const sortearClasseDeVoz = (rng: () => number = Math.random): number => Math.floor(rng() * 12);

/** A faixa de notas (MIDI) em que a pessoa canta com conforto: os exercícios sorteiam e escolhem o tom dentro dela. */
export type Faixa = { min: number; max: number };
/** Sem escolha, de C3 a C5: o piano toca bem e cabe na voz de quase todo mundo em alguma oitava. */
export const FAIXA_PADRAO: Faixa = { min: 48, max: 72 };
/** Faixas confortáveis por tipo de voz (menores que a extensão total: o canto de treino fica longe dos extremos). */
export const VOZES = [
  { id: "baixo", min: 40, max: 60 }, // E2 a C4
  { id: "baritono", min: 45, max: 65 }, // A2 a F4
  { id: "tenor", min: 48, max: 69 }, // C3 a A4
  { id: "contralto", min: 53, max: 72 }, // F3 a C5
  { id: "mezzo", min: 57, max: 76 }, // A3 a E5
  { id: "soprano", min: 60, max: 81 }, // C4 a A5
] as const;
export type VozId = (typeof VOZES)[number]["id"];

/** Uma nota-alvo para a voz, dentro da faixa. */
export const sortearAlvoDeVoz = (rng: () => number = Math.random, faixa: Faixa = FAIXA_PADRAO): number => faixa.min + Math.floor(rng() * (faixa.max - faixa.min + 1));

/** Da extensão medida à faixa confortável: os extremos cansam, então tira 2 semitons do grave e 3 do agudo (se a extensão for estreita, fica inteira). */
export function faixaConfortavel(min: number, max: number): Faixa {
  return max - min >= 12 ? { min: min + 2, max: max - 3 } : { min, max };
}
/** O tipo de voz cuja faixa tem o centro mais perto do da faixa dada. */
export function vozMaisProxima(f: Faixa): VozId {
  const c = (f.min + f.max) / 2;
  return VOZES.reduce((m, v) => (Math.abs((v.min + v.max) / 2 - c) < Math.abs((m.min + m.max) / 2 - c) ? v : m)).id;
}

/** Margens de acerto, em cents: da folgada à fina. */
export const TOLERANCIAS = [50, 30, 20, 10] as const;
/** Quanto tempo a nota tem que ficar dentro da margem, em milissegundos. */
export const SEGURAR_MS = 900;
/** Silêncio ou falha de detecção até esse tempo não derruba a nota segurada. */
const FOLGA_MS = 200;

export type Segurando = {
  /** Desde quando a nota está dentro da margem; null se não está. */
  desde: number | null;
  /** Última vez que houve altura dentro da margem (para perdoar falhas curtas). */
  visto: number;
  soma: number;
  soma2: number;
  n: number;
};
export const SEGURANDO_ZERO: Segurando = { desde: null, visto: 0, soma: 0, soma2: 0, n: 0 };

/** `media`: desvio médio em cents (com sinal); `oscilacao`: quanto a altura balançou em torno da média (desvio-padrão, em cents). */
export type Passo = { estado: Segurando; cents: number | null; ok: boolean; media: number; oscilacao: number };

/** Um passo: com a altura ouvida agora, a nota está sendo segurada no alvo? `ok` quando passou de `SEGURAR_MS` dentro da margem. */
export function atualizar(s: Segurando, midi: number | null, t: number, alvo: number, tolerancia: number, qualquerOitava: boolean, segurarMs = SEGURAR_MS): Passo {
  const cents = midi === null ? null : centsDe(midi, alvo, qualquerOitava);
  const dentro = cents !== null && Math.abs(cents) <= tolerancia;
  let estado: Segurando;
  if (dentro) {
    estado = s.desde === null ? { desde: t, visto: t, soma: cents, soma2: cents * cents, n: 1 } : { desde: s.desde, visto: t, soma: s.soma + cents, soma2: s.soma2 + cents * cents, n: s.n + 1 };
  } else if (midi === null && s.desde !== null && t - s.visto <= FOLGA_MS) {
    estado = s; // sem altura por pouco tempo: segura o que já tinha (uma altura fora da margem, não: zera)
  } else {
    estado = SEGURANDO_ZERO;
  }
  const media = estado.n ? estado.soma / estado.n : 0;
  const oscilacao = estado.n ? Math.sqrt(Math.max(0, estado.soma2 / estado.n - media * media)) : 0;
  return { estado, cents, ok: estado.desde !== null && t - estado.desde >= segurarMs, media, oscilacao };
}

/** Alcance: as notas em que a voz ficou parada por um tempo, e a mais grave e a mais aguda entre elas. */
export type Alcance = { min: number | null; max: number | null; candidato: number | null; desde: number; visto: number };
export const ALCANCE_ZERO: Alcance = { min: null, max: null, candidato: null, desde: 0, visto: 0 };
/** Tempo parado numa nota para ela contar no alcance, em ms, e a oscilação aceita, em cents. */
export const PARADO_MS = 500;
const OSCILACAO_CENTS = 40;

export function medirAlcance(s: Alcance, midi: number | null, t: number): Alcance {
  if (midi === null) return t - s.visto > FOLGA_MS ? { ...s, candidato: null } : s;
  const perto = s.candidato !== null && Math.abs(midi - s.candidato) * 100 <= OSCILACAO_CENTS;
  const base = perto ? s : { ...s, candidato: midi, desde: t };
  const alvo = Math.round(base.candidato!);
  const parado = t - base.desde >= PARADO_MS;
  return {
    ...base,
    visto: t,
    min: parado ? (s.min === null ? alvo : Math.min(s.min, alvo)) : s.min,
    max: parado ? (s.max === null ? alvo : Math.max(s.max, alvo)) : s.max,
  };
}

/** "1 oitava e 7 semitons" para uma extensão em semitons. */
export function extensao(semitons: number): { oitavas: number; semitons: number } {
  return { oitavas: Math.floor(semitons / 12), semitons: semitons % 12 };
}

/** Quanto tempo a nota de cada passo de um arpejo ou escala precisa ficar firme, e na nota longa. */
export const SEGURAR_PASSO_MS = 500;
export const SEGURAR_LONGA_MS = 5000;

/** Notas (MIDI) de um padrão a partir da nota inicial. */
export const notasDoPadrao = (inicio: number, semitons: readonly number[]): number[] => semitons.map((s) => inicio + s);

/**
 * A nota inicial de cada rodada: a escolhida (classe de altura, 0 = Dó) na região do Dó central; no aquecimento que sobe, cada
 * rodada vem meio tom acima da anterior, até 6 semitons, e então recomeça.
 */
export function inicioDaRodada(classe: number, rodada: number, subir: boolean, faixa?: Faixa, largura = 12): number {
  let base = 55 + ((((classe - 55) % 12) + 12) % 12); // de G3 a F#4: confortável para a maioria das vozes
  if (faixa) {
    // Com a faixa da pessoa: a oitava em que o padrão inteiro (e, subindo, os 6 semitons do aquecimento) cabe, ou a que menos sai dela.
    const topo = largura + (subir ? 6 : 0), centro = (faixa.min + faixa.max) / 2;
    let custo = Infinity;
    for (let k = 1; k <= 8; k++) {
      const c = ((classe % 12) + 12) % 12 + 12 * k;
      const sai = Math.max(0, faixa.min - c) + Math.max(0, c + topo - faixa.max);
      const dist = Math.abs(c + topo / 2 - centro);
      if (sai * 100 + dist < custo) { custo = sai * 100 + dist; base = c; }
    }
  }
  return base + (subir ? rodada % 7 : 0);
}
