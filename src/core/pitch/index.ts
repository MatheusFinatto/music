// Afinador: a lógica é a mesma do app Android. Ela mora em Kotlin (marmota-tuner/core) e é compilada
// para generated/. Não edite generated/ à mão: mude o Kotlin e rode `./gradlew :core:exportToSite` em marmota-tuner/.
// Este arquivo só dá nomes de TypeScript ao que o Kotlin exporta (um `object` do Kotlin vira getInstance(); um companion vira Classe.Companion).
import { NoteMapper, NoteReading, PitchPipeline, TunerGeometry, type Box } from "./generated/tuner-core.mjs";

export {
  Box, NeedleAnimator, PitchPipeline, PitchSmoother, TunerScene,
  type NoteReading, type PitchSample, type TunerGeometry,
} from "./generated/tuner-core.mjs";

/** Amostras por bloco do microfone; o app usa o mesmo tamanho. */
export const CHUNK_SAMPLES: number = PitchPipeline.Companion.CHUNK_SAMPLES;

/** Só sustenidos, na ordem C C# D … B (índice = classe de altura). */
export const NOTE_NAMES: readonly string[] = [...NoteReading.Companion.NOTE_NAMES.asJsReadonlyArrayView()];

/** Faixa em que a nota conta como afinada (±5 cents). */
export const IN_TUNE_CENTS: number = NoteReading.Companion.IN_TUNE_CENTS;

/** Ex.: readingFromMidi(58.8) → B3, −20 cents. */
export const readingFromMidi = (midi: number): NoteReading => NoteMapper.getInstance().readingFromMidi(midi);

export const midiFromFrequency = (hz: number): number => NoteMapper.getInstance().midiFromFrequency(hz);

/** Onde cada parte da tela fica, a partir da área útil em pixels e da densidade (pixels por dp). */
export const computeGeometry = (box: Box, dp: number): TunerGeometry => TunerGeometry.Companion.compute(box, dp);
