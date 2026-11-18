package br.musica.marmotatuner

import kotlin.math.abs

/**
 * Steadies raw pitch readings so the needle doesn't jitter. Runs on the main thread.
 *
 * - A median of the last 3 readings drops one-off glitches (pick attack, octave slips).
 * - Small changes are eased in (exponential smoothing); a jump of about a semitone or more
 *   means a new note was played, so it is taken at once instead of sliding across the dial.
 * - After [silenceFrames] missing readings in a row the note counts as over.
 *
 * Example: `val midi: Double? = smoother.push(sample.midi)`
 */
class PitchSmoother(
    private val easing: Double = 0.3,
    private val newNoteSemitones: Double = 0.8,
    private val silenceFrames: Int = 15,
) {
    private val recent = ArrayDeque<Double>()
    private var smoothed: Double? = null
    private var missedFrames = 0

    /** Feeds one reading (null = nothing detected) and returns the pitch to display, or null when silent. */
    fun push(midi: Double?): Double? {
        if (midi == null) return onMissing()
        missedFrames = 0
        recent.addLast(midi)
        if (recent.size > MEDIAN_SPAN) recent.removeFirst()
        smoothed = blend(smoothed, median(recent))
        return smoothed
    }

    fun reset() {
        recent.clear()
        smoothed = null
        missedFrames = 0
    }

    private fun onMissing(): Double? {
        missedFrames++
        if (missedFrames >= silenceFrames) reset()
        return smoothed
    }

    private fun blend(previous: Double?, target: Double): Double {
        if (previous == null || abs(target - previous) >= newNoteSemitones) return target
        return previous + easing * (target - previous)
    }

    private fun median(values: Collection<Double>): Double {
        val sorted = values.sorted()
        val mid = sorted.size / 2
        return if (sorted.size % 2 == 1) sorted[mid] else (sorted[mid - 1] + sorted[mid]) / 2
    }

    private companion object {
        const val MEDIAN_SPAN = 3
    }
}
