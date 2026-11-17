// O som da voz solista, escolhido pela pessoa e guardado no navegador (musica:som):
// violão gravado (samples.ts) ou o sintetizador, com tom e volume.
import { createStore } from "@/core/storage";

export type Instrument = "violao" | "sintetizador";

export type Sound = {
  version: 1;
  instrument: Instrument;
  /** 0 = escuro, 1 = brilhante. */
  tone: number;
  /** 0..1 */
  volume: number;
};

export const DEFAULT_SOUND: Sound = { version: 1, instrument: "violao", tone: 0.55, volume: 0.8 };

const clamp = (n: unknown, d: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d);

export const soundStore = createStore<Sound>("som", DEFAULT_SOUND, (saved) => {
  const s = saved as Partial<Sound> | null;
  if (!s || typeof s !== "object") return null;
  return {
    version: 1,
    instrument: s.instrument === "sintetizador" ? "sintetizador" : "violao",
    tone: clamp(s.tone, DEFAULT_SOUND.tone),
    volume: clamp(s.volume, DEFAULT_SOUND.volume),
  };
});

type Chain = { input: GainNode; apply: (s: Sound) => void };

/** A cadeia entre as vozes gravadas e a saída: tom (passa-baixa) e volume. A gravação já tem o corpo do violão. */
export function buildChain(ctx: BaseAudioContext, out: AudioNode): Chain {
  const input = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = 0.7;
  const level = ctx.createGain();
  input.connect(tone).connect(level).connect(out);
  const apply = (s: Sound) => {
    const now = ctx.currentTime;
    tone.frequency.setTargetAtTime(2500 + s.tone * 15000, now, 0.03);
    level.gain.setTargetAtTime(s.volume, now, 0.03);
  };
  return { input, apply };
}
