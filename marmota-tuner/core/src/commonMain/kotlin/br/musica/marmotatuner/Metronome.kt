// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner

import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.round
import kotlin.math.sin

/** One click: when it sounds (seconds on the caller's clock), which beat of the bar, which subdivision, and its [kind]. */
class Tick(val time: Double, val beat: Int, val sub: Int, val kind: Int) {
    companion object {
        /** First beat of the bar. */
        const val ACCENT = 0
        const val BEAT = 1
        /** A subdivision between beats (eighths, triplets, sixteenths). */
        const val SUB = 2
    }
}

/**
 * The metronome clock. The platform asks for the next click ahead of time and schedules it on its
 * own audio clock: the site with Web Audio, the app by writing samples to an AudioTrack.
 * Changing [bpm], [beatsPerBar] or [subdivision] takes effect from the next click, without a jump.
 *
 * Example: `m.reset(now + 0.1); while (m.nextTime < now + lookahead) schedule(m.next())`
 */
class Metronome(bpm: Double = 90.0, beatsPerBar: Int = 4, subdivision: Int = 1) {
    var bpm: Double = clampBpm(bpm)
        set(value) { field = clampBpm(value) }
    var beatsPerBar: Int = beatsPerBar.coerceIn(1, MAX_BEATS)
        set(value) { field = value.coerceIn(1, MAX_BEATS) }
    /** Clicks per beat: 1 (beats only), 2 (eighths), 3 (triplets) or 4 (sixteenths). */
    var subdivision: Int = subdivision.coerceIn(1, 4)
        set(value) { field = value.coerceIn(1, 4) }
    var accentFirst: Boolean = true

    /** When the next click sounds. */
    var nextTime: Double = 0.0
        private set
    private var index = 0

    /** Starts over at the top of the bar, with the first click at [start]. */
    fun reset(start: Double) {
        nextTime = start
        index = 0
    }

    /** The next click, advancing the clock. */
    fun next(): Tick {
        val perBar = beatsPerBar * subdivision
        val i = index % perBar
        val beat = i / subdivision
        val sub = i % subdivision
        val kind = when {
            sub != 0 -> Tick.SUB
            beat == 0 && accentFirst && beatsPerBar > 1 -> Tick.ACCENT
            else -> Tick.BEAT
        }
        val tick = Tick(nextTime, beat, sub, kind)
        nextTime += 60.0 / bpm / subdivision
        index = (i + 1) % perBar
        return tick
    }

    companion object {
        const val MIN_BPM = 30.0
        const val MAX_BPM = 250.0
        const val MAX_BEATS = 12
        fun clampBpm(bpm: Double): Double = if (bpm.isNaN()) 90.0 else bpm.coerceIn(MIN_BPM, MAX_BPM)
    }
}

/** The click sound, synthesized the same way on both platforms: a short sine with a fast decay. */
object ClickSound {
    const val DURATION = 0.04

    fun frequency(kind: Int): Double = when (kind) {
        Tick.ACCENT -> 1760.0
        Tick.BEAT -> 1320.0
        else -> 880.0
    }

    fun gain(kind: Int): Double = when (kind) {
        Tick.ACCENT -> 1.0
        Tick.BEAT -> 0.7
        else -> 0.4
    }

    /** The click's samples at [sampleRate], ready for an AudioBuffer (site) or an AudioTrack (app). */
    fun render(kind: Int, sampleRate: Double): DoubleArray {
        val n = (DURATION * sampleRate).toInt()
        val f = frequency(kind)
        val g = gain(kind)
        return DoubleArray(n) { i ->
            val t = i / sampleRate
            val attack = min(1.0, t / 0.001)
            sin(2 * PI * f * t) * exp(-t * 110.0) * attack * g
        }
    }
}

/** Tap tempo: the median of the last intervals, so one late tap doesn't throw the tempo off. */
class TapTempo(private val maxGap: Double = 2.0) {
    private val taps = ArrayList<Double>()

    /** Registers a tap at [time] seconds. Returns the tempo in whole bpm, or null until there are two taps. */
    fun tap(time: Double): Double? {
        if (taps.isNotEmpty() && (time - taps.last() > maxGap || time <= taps.last())) taps.clear()
        taps.add(time)
        if (taps.size > 6) taps.removeAt(0)
        if (taps.size < 2) return null
        val gaps = taps.zipWithNext { a, b -> b - a }.sorted()
        val median = if (gaps.size % 2 == 1) gaps[gaps.size / 2] else (gaps[gaps.size / 2 - 1] + gaps[gaps.size / 2]) / 2
        return Metronome.clampBpm(round(60.0 / median))
    }

    fun reset() = taps.clear()
}
