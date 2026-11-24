// Metrônomo: a lógica é a mesma do app Android. Ela mora em Kotlin (marmota-tuner/core, Metronome.kt) e é
// compilada junto com a do afinador para src/core/pitch/generated/. Mude o Kotlin, não o JS gerado.
import { ClickSound, Metronome, Subdivisions, TapTempo, Tick, type Note, type Subdivision } from "../pitch/generated/tuner-core.mjs";

export { Metronome, TapTempo, Tick, type Note, type Subdivision };

export const MIN_BPM: number = Metronome.Companion.MIN_BPM;
export const MAX_BPM: number = Metronome.Companion.MAX_BPM;
export const MAX_BEATS: number = Metronome.Companion.MAX_BEATS;
export const clampBpm = (bpm: number): number => Metronome.Companion.clampBpm(bpm);

/** Tipos de clique: tempo forte, tempo, subdivisão, tempo mudo. */
export const ACCENT: number = Tick.Companion.ACCENT;
export const BEAT: number = Tick.Companion.BEAT;
export const SUB: number = Tick.Companion.SUB;
export const MUTE: number = Tick.Companion.MUTE;

/** As divisões do tempo, na ordem do seletor. O id é o que se salva. */
export const SUBDIVISIONS: readonly Subdivision[] = Subdivisions.getInstance().all;
export const subdivisionById = (id: number): Subdivision => Subdivisions.getInstance().byId(id);

/** As amostras do clique de cada tipo, na taxa do AudioContext. */
export const renderClick = (kind: number, sampleRate: number): Float64Array => ClickSound.getInstance().render(kind, sampleRate);

/** Dois tons curtos para avisar que o timer acabou (os mesmos do app). */
export const renderChime = (sampleRate: number): Float64Array => ClickSound.getInstance().renderChime(sampleRate);
