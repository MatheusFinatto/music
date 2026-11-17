package br.musica.afinador

import kotlin.math.ceil
import kotlin.math.floor

/**
 * Monophonic pitch detection with the YIN algorithm (de Cheveigné & Kawahara, 2002).
 *
 * YIN is used instead of an FFT peak because a guitar's 2nd/3rd harmonics are often louder
 * than the fundamental (especially on the low E), and an FFT peak picker then reports the
 * wrong octave. YIN looks for the signal's period instead, which is immune to that.
 *
 * Example:
 * ```
 * val yin = YinPitchDetector(sampleRate = 44100)
 * val hz: Double? = yin.detect(samples) // samples.size >= yin.requiredSamples
 * ```
 */
class YinPitchDetector(
    private val sampleRate: Int,
    private val windowSize: Int = 2048,
    minFrequencyHz: Double = 60.0,
    maxFrequencyHz: Double = 1400.0,
    private val threshold: Double = 0.15,
) {
    private val tauMin = floor(sampleRate / maxFrequencyHz).toInt().coerceAtLeast(2)
    private val tauMax = ceil(sampleRate / minFrequencyHz).toInt()
    private val difference = DoubleArray(tauMax + 2)

    /** Samples [detect] needs: one analysis window plus the longest period searched. */
    val requiredSamples: Int = windowSize + tauMax + 2

    /** Returns the fundamental frequency in Hz, or null when no clear period is found. */
    fun detect(samples: FloatArray): Double? {
        require(samples.size >= requiredSamples) {
            "need at least $requiredSamples samples, got ${samples.size}"
        }
        computeDifference(samples)
        normalizeCumulativeMean()
        val tau = firstDipBelowThreshold() ?: return null
        return sampleRate / refineByParabola(tau)
    }

    /** Step 2: d(τ) = Σ (x[j] − x[j+τ])². Small d(τ) means the signal repeats every τ samples. */
    private fun computeDifference(x: FloatArray) {
        for (tau in 1..tauMax + 1) {
            var sum = 0.0
            for (j in 0 until windowSize) {
                val delta = (x[j] - x[j + tau]).toDouble()
                sum += delta * delta
            }
            difference[tau] = sum
        }
    }

    /** Step 3: divide by the running mean so the threshold works regardless of loudness. */
    private fun normalizeCumulativeMean() {
        difference[0] = 1.0
        var runningSum = 0.0
        for (tau in 1..tauMax + 1) {
            runningSum += difference[tau]
            difference[tau] = if (runningSum == 0.0) 1.0 else difference[tau] * tau / runningSum
        }
    }

    /** Step 4: the first τ under the threshold, slid down to the bottom of its dip. */
    private fun firstDipBelowThreshold(): Int? {
        var tau = tauMin
        while (tau <= tauMax && difference[tau] >= threshold) tau++
        if (tau > tauMax) return null
        while (tau < tauMax && difference[tau + 1] < difference[tau]) tau++
        return tau
    }

    /** Step 5: sub-sample precision. Without it, at 44.1 kHz a high E would jump in ~4 cent steps. */
    private fun refineByParabola(tau: Int): Double {
        val before = difference[tau - 1]
        val at = difference[tau]
        val after = difference[tau + 1]
        val denominator = 2 * (2 * at - after - before)
        if (denominator == 0.0) return tau.toDouble()
        return tau + (after - before) / denominator
    }
}
