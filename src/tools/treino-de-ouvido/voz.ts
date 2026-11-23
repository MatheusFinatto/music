// Treino de voz: a conta que decide se a pessoa cantou a nota. Puro (sem microfone nem tela): a tela alimenta `atualizar`
// com a altura ouvida (MIDI fracionário, ou null no silêncio) e o relógio em milissegundos.

/** Quanto a altura cantada está acima (+) ou abaixo (-) do alvo, em cents. Em `qualquerOitava`, 12 semitons de diferença não contam. */
export function centsDe(midi: number, alvo: number, qualquerOitava: boolean): number {
  let d = midi - alvo;
  if (qualquerOitava) d = ((((d + 6) % 12) + 12) % 12) - 6;
  return d * 100;
}

/** Uma nota-alvo para a voz: de C3 a C5, que o piano toca bem e cabe na voz de quase todo mundo em alguma oitava. */
export const sortearAlvoDeVoz = (rng: () => number = Math.random): number => 48 + Math.floor(rng() * 25);

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
  n: number;
};
export const SEGURANDO_ZERO: Segurando = { desde: null, visto: 0, soma: 0, n: 0 };

export type Passo = { estado: Segurando; cents: number | null; ok: boolean; media: number };

/** Um passo: com a altura ouvida agora, a nota está sendo segurada no alvo? `ok` quando passou de `SEGURAR_MS` dentro da margem. */
export function atualizar(s: Segurando, midi: number | null, t: number, alvo: number, tolerancia: number, qualquerOitava: boolean): Passo {
  const cents = midi === null ? null : centsDe(midi, alvo, qualquerOitava);
  const dentro = cents !== null && Math.abs(cents) <= tolerancia;
  let estado: Segurando;
  if (dentro) {
    estado = s.desde === null ? { desde: t, visto: t, soma: cents, n: 1 } : { desde: s.desde, visto: t, soma: s.soma + cents, n: s.n + 1 };
  } else if (midi === null && s.desde !== null && t - s.visto <= FOLGA_MS) {
    estado = s; // sem altura por pouco tempo: segura o que já tinha (uma altura fora da margem, não: zera)
  } else {
    estado = SEGURANDO_ZERO;
  }
  return { estado, cents, ok: estado.desde !== null && t - estado.desde >= SEGURAR_MS, media: estado.n ? estado.soma / estado.n : 0 };
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
