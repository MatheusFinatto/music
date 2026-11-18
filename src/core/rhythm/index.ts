// Metrônomo: a lógica é a mesma do app Android. Ela mora em Kotlin (marmota-tuner/core, Metronome.kt) e é
// compilada junto com a do afinador para src/core/pitch/generated/. Mude o Kotlin, não o JS gerado.
import { ClickSound, Metronome, TapTempo, Tick } from "../pitch/generated/tuner-core.mjs";

export { Metronome, TapTempo, Tick };

export const MIN_BPM: number = Metronome.Companion.MIN_BPM;
export const MAX_BPM: number = Metronome.Companion.MAX_BPM;
export const MAX_BEATS: number = Metronome.Companion.MAX_BEATS;
export const clampBpm = (bpm: number): number => Metronome.Companion.clampBpm(bpm);

/** Tipos de clique: primeiro tempo do compasso, tempo, subdivisão. */
export const ACCENT: number = Tick.Companion.ACCENT;
export const BEAT: number = Tick.Companion.BEAT;
export const SUB: number = Tick.Companion.SUB;

/** As amostras do clique de cada tipo, na taxa do AudioContext. */
export const renderClick = (kind: number, sampleRate: number): Float64Array => ClickSound.getInstance().render(kind, sampleRate);
