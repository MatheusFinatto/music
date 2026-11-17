// Violão gravado nota a nota, de D2 a D5. Acima disso, a nota mais alta é esticada (bend até E5).
// Amostras: tonejs-instruments (github.com/nbrosowsky/tonejs-instruments), CC BY 3.0;
// gravações da Universidade de Iowa (Electronic Music Studios).

export type SampledInstrument = "violao";

const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Cs4" → 61 (s = sustenido, como nos nomes dos arquivos). */
export function fileMidi(name: string): number {
  const m = /^([A-G])(s?)(\d)$/.exec(name);
  if (!m) throw new Error(`nome de amostra inválido: ${name}`);
  return 12 * (Number(m[3]) + 1) + LETTERS[m[1]!]! + (m[2] ? 1 : 0);
}

const NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
/** Nome do arquivo de uma nota: 61 → "Cs4". */
export const fileName = (midi: number) => NAMES[midi % 12]! + (Math.floor(midi / 12) - 1);

/** Uma gravação por semitom, de D2 (38) a D5 (74). */
export const BANKS: Record<SampledInstrument, string[]> = {
  violao: Array.from({ length: 74 - 38 + 1 }, (_, i) => fileName(38 + i)),
};

/**
 * Desafinação de cada gravação, em cents, medida por autocorrelação na parte sustentada (0,5 a 1,2 s;
 * renderização offline no Chromium) e corrigida na hora de tocar. O ataque não entra na conta: corda de
 * verdade começa um pouco aguda (até +12 cents) e assenta, e isso é parte do timbre.
 * Arquivo ausente: afinado (abaixo de 3 cents).
 */
export const TUNING: Partial<Record<SampledInstrument, Record<string, number>>> = {
  violao: { Fs2: -3.2, G2: -3.7 },
};

/** A amostra mais próxima da nota: a que precisa ser menos esticada. */
export function nearest(midis: readonly number[], midi: number): number {
  return midis.reduce((best, m) => (Math.abs(m - midi) < Math.abs(best - midi) ? m : best));
}

/** A gravação e quantos cents ela soa acima do nome. */
type Bank = Map<number, { buffer: AudioBuffer; cents: number }>;
const banks = new WeakMap<BaseAudioContext, Partial<Record<SampledInstrument, Bank>>>();
const pending = new WeakMap<BaseAudioContext, Partial<Record<SampledInstrument, Promise<void>>>>();

/** Baixa e decodifica as amostras de um instrumento (uma vez por contexto). Falha em silêncio: fica a voz sintetizada. */
export function loadBank(ctx: BaseAudioContext, inst: SampledInstrument, base = "/sons"): Promise<void> {
  const known = pending.get(ctx)?.[inst];
  if (known) return known;
  const p = Promise.all(
    BANKS[inst].map(async (name) => {
      const res = await fetch(`${base}/${inst}/${name}.mp3`);
      if (!res.ok) throw new Error(`${res.status} ${name}`);
      const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
      return [fileMidi(name), { buffer, cents: TUNING[inst]?.[name] ?? 0 }] as const;
    }),
  )
    .then((entries) => { banks.set(ctx, { ...banks.get(ctx), [inst]: new Map(entries) }); })
    .catch((e: unknown) => { console.warn(`Amostras de ${inst} indisponíveis; a voz sintetizada continua.`, e); });
  pending.set(ctx, { ...pending.get(ctx), [inst]: p });
  return p;
}

export const bankOf = (ctx: BaseAudioContext, inst: SampledInstrument): Bank | undefined => banks.get(ctx)?.[inst];

/**
 * Uma nota gravada de `start` a `end`, começando na altura `midi`. Devolve o `detune` (cents) para
 * agendar bend, slide e vibrato, e a fonte, para o registro de quem está soando.
 */
export function sampleVoice(ctx: BaseAudioContext, bank: Bank, dest: AudioNode, midi: number, start: number, end: number, gain: number) {
  const root = nearest([...bank.keys()], midi);
  const { buffer, cents } = bank.get(root)!;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = 2 ** ((midi - root) / 12 - cents / 1200);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  // No fim da nota o dedo abafa a corda: some em poucos centésimos, sem estalo.
  g.gain.setTargetAtTime(0, end, 0.02);
  src.connect(g).connect(dest);
  src.start(start);
  src.stop(end + 0.15);
  return { src, detune: src.detune };
}
