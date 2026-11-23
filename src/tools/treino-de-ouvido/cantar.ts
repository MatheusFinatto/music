// Cantar músicas no padrão Yousician: as notas de um trecho correm numa pista de altura, cada uma tem a sua janela de tempo, e a
// nota vale se a altura certa foi cantada durante parte da janela. Puro (sem tela nem microfone): a tela alimenta `acertoDaNota`
// com as leituras (altura ouvida, ou null no silêncio) carimbadas com o tempo.
import { centsDe } from "./voz";

/** Uma nota da melodia: `st` = semitons acima da tônica (null = pausa), `dur` em tempos de semínima, `sil` = a sílaba cantada. */
export type NotaMusica = { st: number | null; dur: number; sil: string };
export type Trecho = { nome: string; notas: NotaMusica[] };
export type Musica = { id: string; nome: string; compasso: string; bpm: number; trechos: Trecho[] };

/** A nota no tempo: segundos a partir da primeira nota do trecho. `midi` null = pausa. */
export type Janela = { ini: number; fim: number; midi: number | null; sil: string };

export function janelas(notas: readonly NotaMusica[], bpm: number, tonicaMidi: number): Janela[] {
  const seg = 60 / bpm;
  let tempo = 0;
  return notas.map((n) => {
    const j = { ini: tempo * seg, fim: (tempo + n.dur) * seg, midi: n.st === null ? null : tonicaMidi + n.st, sil: n.sil };
    tempo += n.dur;
    return j;
  });
}
export const duracaoDe = (js: readonly Janela[]): number => js.reduce((m, j) => Math.max(m, j.fim), 0);

/** A faixa de notas (MIDI) em que o piano toca bem e a voz de quase todo mundo chega em alguma oitava. */
const CENTRO_MIDI = 60;
const PIANO_MIN = 45, PIANO_MAX = 84;

/**
 * A tônica (MIDI) de uma classe de altura (0 = Dó) numa oitava em que a melodia fica em volta do Dó central e dentro do alcance
 * do piano de amostras. Se a melodia for mais larga que isso, vale a mais próxima do centro.
 */
export function tonicaParaCaber(classe: number, notas: readonly NotaMusica[]): number {
  const sts = notas.map((n) => n.st).filter((x): x is number => x !== null);
  const lo = Math.min(...sts), hi = Math.max(...sts), meio = (lo + hi) / 2;
  let melhor = classe + 12 * 4, custo = Infinity;
  for (let k = 2; k <= 6; k++) {
    const t = classe + 12 * k;
    if (t + lo < PIANO_MIN || t + hi > PIANO_MAX) continue;
    const c = Math.abs(t + meio - CENTRO_MIDI);
    if (c < custo) { custo = c; melhor = t; }
  }
  return melhor;
}

/** Leva `midi` para a oitava mais perto de `centro`: com "qualquer oitava", a voz aparece dentro da pista, onde quer que cante. */
export const dobrar = (midi: number, centro: number): number => midi - 12 * Math.round((midi - centro) / 12);

export type Amostra = { t: number; midi: number | null };

/** O começo de cada nota é perdoado (a pessoa leva um instante para entrar, e o microfone e a suavização atrasam). */
export const GRACA_S = 0.35;
export const GRACA_MAX = 0.45; // nunca mais que 45% da nota
/** Quanto da janela (depois da folga) a voz precisa estar na altura certa. */
export const LIMIAR = 0.45;
/** Compensação do atraso do microfone e da suavização. */
export const LATENCIA_S = 0.15;
/** Uma leitura vale por no máximo isto (buracos entre leituras não contam como acerto). */
const DT_MAX = 0.15;

export type Acerto = { fracao: number; ok: boolean; ouvido: number | null };

/** O quanto da janela (até `ate`, para a leitura ao vivo) a voz esteve dentro da margem em torno da nota. */
export function acertoDaNota(amostras: readonly Amostra[], j: Janela, tolerancia: number, qualquerOitava: boolean, ate = j.fim): Acerto {
  if (j.midi === null) return { fracao: 1, ok: true, ouvido: null };
  const a = j.ini + Math.min(GRACA_S, GRACA_MAX * (j.fim - j.ini));
  const b = Math.min(j.fim, ate);
  if (b <= a) return { fracao: 0, ok: false, ouvido: null };
  let dentro = 0;
  const ouvidos: number[] = [];
  for (let i = 0; i < amostras.length; i++) {
    const s = amostras[i]!;
    const t0 = s.t - LATENCIA_S;
    const dt = Math.min(DT_MAX, i + 1 < amostras.length ? amostras[i + 1]!.t - s.t : DT_MAX);
    const sobra = Math.min(b, t0 + dt) - Math.max(a, t0);
    if (sobra <= 0 || s.midi === null) continue;
    ouvidos.push(s.midi);
    if (Math.abs(centsDe(s.midi, j.midi, qualquerOitava)) <= tolerancia) dentro += sobra;
  }
  ouvidos.sort((x, y) => x - y);
  const fracao = Math.min(1, dentro / (b - a));
  return { fracao, ok: fracao >= LIMIAR, ouvido: ouvidos.length ? ouvidos[ouvidos.length >> 1]! : null };
}

export type Resumo = { acertadas: number; total: number; ok: boolean };
/** Quantas notas (sem contar pausas) foram cantadas, e se o trecho passa: 80% ou mais. */
export function resumir(js: readonly Janela[], acertos: readonly Acerto[]): Resumo {
  let acertadas = 0, total = 0;
  js.forEach((j, i) => { if (j.midi !== null) { total++; if (acertos[i]?.ok) acertadas++; } });
  return { acertadas, total, ok: total > 0 && acertadas / total >= 0.8 };
}
