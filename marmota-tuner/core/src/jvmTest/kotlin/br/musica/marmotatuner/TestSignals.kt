package br.musica.marmotatuner

import kotlin.math.PI
import kotlin.math.sin

/** Synthetic audio standing in for the microphone in tests. */
object TestSignals {
    const val RATE = 44100

    fun sine(hz: Double, samples: Int, amplitude: Double = 0.5, phase: Double = 0.0): FloatArray =
        FloatArray(samples) { i -> (amplitude * sin(2 * PI * hz * i / RATE + phase)).toFloat() }

    /**
     * Roughly a plucked low string: the 2nd and 3rd harmonics are louder than the fundamental,
     * which is exactly what fools FFT-peak tuners into reading an octave too high.
     */
    fun guitarLike(hz: Double, samples: Int): FloatArray {
        val weights = listOf(0.25, 0.45, 0.35, 0.15, 0.08)
        return FloatArray(samples) { i ->
            weights.withIndex().sumOf { (k, w) -> w * sin(2 * PI * hz * (k + 1) * i / RATE) }.toFloat() * 0.5f
        }
    }
}
