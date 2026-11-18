package br.musica.marmotatuner

import kotlin.math.log10
import kotlin.math.sqrt

/** One analysis result: the pitch as a fractional MIDI note (null = nothing clear) and the mic level 0..1. */
data class PitchSample(val midi: Double?, val level: Float)

/**
 * Keeps the most recent [size] samples in order, so each small chunk from the mic
 * can be analysed together with what came before it (overlapping windows).
 */
class SampleWindow(val size: Int) {
    private val buffer = FloatArray(size)
    private var filled = 0

    val isFull: Boolean get() = filled >= size

    /** Example: window.append(chunk, count); if (window.isFull) detector.detect(window.samples()) */
    fun append(chunk: FloatArray, count: Int) {
        require(count in 0..chunk.size) { "count must be within 0..${chunk.size}, got $count" }
        val incoming = minOf(count, size)
        System.arraycopy(buffer, incoming, buffer, 0, size - incoming)
        System.arraycopy(chunk, count - incoming, buffer, size - incoming, incoming)
        filled = minOf(size, filled + count)
    }

    fun samples(): FloatArray = buffer

    fun clear() {
        filled = 0
    }
}

/**
 * Mic chunks in, [PitchSample]s out. Runs on the audio thread.
 *
 * Example: `val sample = PitchPipeline(44100).process(chunk, count)`
 */
class PitchPipeline(sampleRate: Int) {
    private val detector = YinPitchDetector(sampleRate)
    private val window = SampleWindow(detector.requiredSamples)

    fun process(chunk: FloatArray, count: Int): PitchSample {
        window.append(chunk, count)
        val rms = rootMeanSquare(chunk, count)
        val level = levelFromRms(rms)
        if (!window.isFull || rms < SILENCE_RMS) return PitchSample(null, level)
        val hz = detector.detect(window.samples()) ?: return PitchSample(null, level)
        return PitchSample(NoteMapper.midiFromFrequency(hz), level)
    }

    fun reset() = window.clear()

    companion object {
        /** About −50 dBFS: below this it's room noise, and YIN would chase hum or hiss. */
        const val SILENCE_RMS = 0.003

        fun rootMeanSquare(chunk: FloatArray, count: Int): Double {
            if (count <= 0) return 0.0
            var sum = 0.0
            for (i in 0 until count) sum += chunk[i].toDouble() * chunk[i]
            return sqrt(sum / count)
        }

        /** Maps −60..0 dBFS to 0..1 for the little level meter. */
        fun levelFromRms(rms: Double): Float {
            if (rms <= 0.0) return 0f
            val dbfs = 20 * log10(rms)
            return ((dbfs + 60) / 60).toFloat().coerceIn(0f, 1f)
        }
    }
}
