package br.musica.marmotatuner

import kotlin.math.abs
import kotlin.math.log2
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * A pitch expressed as the nearest equal-tempered note (A4 = 440 Hz).
 * Octaves follow scientific pitch notation: C4 is middle C, the guitar's low E is E2.
 */
data class NoteReading(
    val pitchClass: Int,
    val octave: Int,
    val cents: Float,
    val frequencyHz: Float,
) {
    val name: String get() = NOTE_NAMES[pitchClass]

    val isInTune: Boolean get() = abs(cents) <= IN_TUNE_CENTS

    companion object {
        /** Sharps only, matching the note strip on screen (A A# B C …). */
        val NOTE_NAMES = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

        /** ±5 cents is below what most ears notice on a sustained guitar note. */
        const val IN_TUNE_CENTS = 5f
    }
}

/** Converts between frequency (Hz), fractional MIDI note numbers and [NoteReading]. */
object NoteMapper {
    const val A4_HZ = 440.0
    private const val A4_MIDI = 69

    /** Example: midiFromFrequency(440.0) == 69.0; 82.41 Hz (low E) ≈ 40.0. */
    fun midiFromFrequency(hz: Double): Double {
        require(hz > 0 && hz.isFinite()) { "frequency must be a positive finite number of Hz, got $hz" }
        return A4_MIDI + 12 * log2(hz / A4_HZ)
    }

    fun frequencyFromMidi(midi: Double): Double = A4_HZ * 2.0.pow((midi - A4_MIDI) / 12)

    /** Example: readingFromMidi(59.8) → B3, −20 cents. */
    fun readingFromMidi(midi: Double): NoteReading {
        val nearest = midi.roundToInt()
        return NoteReading(
            pitchClass = Math.floorMod(nearest, 12),
            octave = Math.floorDiv(nearest, 12) - 1,
            cents = ((midi - nearest) * 100).toFloat(),
            frequencyHz = frequencyFromMidi(midi).toFloat(),
        )
    }
}
