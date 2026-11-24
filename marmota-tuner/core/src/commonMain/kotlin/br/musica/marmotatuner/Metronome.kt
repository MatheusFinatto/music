// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner

import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.round
import kotlin.math.sin

/** One click: when it sounds (seconds on the caller's clock), which beat of the bar, which click inside the beat, and its [kind]. */
class Tick(val time: Double, val beat: Int, val sub: Int, val kind: Int) {
    companion object {
        /** A strong beat (by default the first of the bar). */
        const val ACCENT = 0
        const val BEAT = 1
        /** A click inside the beat (eighths, triplets, sixteenths…). */
        const val SUB = 2
        /** A muted beat: nothing sounds, but the screen still follows it. */
        const val MUTE = 3
    }
}

/** One note of a rhythm figure, for drawing it: 0 beams = quarter, 1 = eighth, 2 = sixteenth. */
class Note(val beams: Int, val dotted: Boolean = false)

/**
 * How one beat is split. [offsets] are where each click falls, as fractions of the beat (always starting at 0).
 * [notes] and [tuplet] (3, 6, or 0 for none) say how to draw it as notation. [id] is stable: it is what gets saved.
 */
class Subdivision(val id: Int, val offsets: DoubleArray, val notes: Array<Note>, val tuplet: Int = 0)

object Subdivisions {
    private val q = Note(0)
    private val e = Note(1)
    private val s = Note(2)
    private val de = Note(1, dotted = true)

    /** In the order the picker shows them. Ids 1–4 are the old plain subdivisions, so saved settings still load. */
    val all: Array<Subdivision> = arrayOf(
        Subdivision(1, doubleArrayOf(0.0), arrayOf(q)),
        Subdivision(2, doubleArrayOf(0.0, 0.5), arrayOf(e, e)),
        Subdivision(3, doubleArrayOf(0.0, 1.0 / 3, 2.0 / 3), arrayOf(e, e, e), tuplet = 3),
        Subdivision(4, doubleArrayOf(0.0, 0.25, 0.5, 0.75), arrayOf(s, s, s, s)),
        Subdivision(5, doubleArrayOf(0.0, 0.5, 0.75), arrayOf(e, s, s)),
        Subdivision(6, doubleArrayOf(0.0, 0.25, 0.5), arrayOf(s, s, e)),
        Subdivision(7, doubleArrayOf(0.0, 0.25, 0.75), arrayOf(s, e, s)),
        Subdivision(8, doubleArrayOf(0.0, 0.75), arrayOf(de, s)),
        Subdivision(9, doubleArrayOf(0.0, 0.25), arrayOf(s, de)),
        Subdivision(10, doubleArrayOf(0.0, 2.0 / 3), arrayOf(q, e), tuplet = 3),
        Subdivision(11, DoubleArray(6) { it / 6.0 }, Array(6) { s }, tuplet = 6),
    )

    /** The subdivision with this [id], or the plain beat if there is none. */
    fun byId(id: Int): Subdivision = all.firstOrNull { it.id == id } ?: all[0]
}

/**
 * The metronome clock. The platform asks for the next click ahead of time and schedules it on its
 * own audio clock: the site with Web Audio, the app by writing samples to an AudioTrack.
 * Changing [bpm], [beatsPerBar], [subdivision] or an accent takes effect from the next click, without a jump.
 *
 * Example: `m.reset(now + 0.1); while (m.nextTime < now + lookahead) schedule(m.next())`
 */
class Metronome(bpm: Double = 90.0, beatsPerBar: Int = 4, subdivision: Int = 1) {
    var bpm: Double = clampBpm(bpm)
        set(value) { field = clampBpm(value) }
    var beatsPerBar: Int = beatsPerBar.coerceIn(1, MAX_BEATS)
        set(value) { field = value.coerceIn(1, MAX_BEATS) }
    /** The [Subdivision] id. Unknown ids fall back to the plain beat. */
    var subdivision: Int = Subdivisions.byId(subdivision).id
        set(value) { field = Subdivisions.byId(value).id }

    /** Accent of each beat (ACCENT, BEAT or MUTE). Kept for all [MAX_BEATS], so fewer beats and back keeps them. */
    private val accents = IntArray(MAX_BEATS) { if (it == 0) Tick.ACCENT else Tick.BEAT }

    /** When the next click sounds. */
    var nextTime: Double = 0.0
        private set
    private var beat = 0
    private var sub = 0
    /** When the current beat started, so a figure that shrinks mid-beat still lands the next beat on time. */
    private var beatStart = 0.0

    fun accent(beat: Int): Int = accents[beat.coerceIn(0, MAX_BEATS - 1)]

    fun setAccent(beat: Int, kind: Int) {
        if (beat in 0 until MAX_BEATS && kind in Tick.ACCENT..Tick.MUTE && kind != Tick.SUB) accents[beat] = kind
    }

    /** Normal → strong → muted → normal. Returns the new accent. */
    fun cycleAccent(beat: Int): Int {
        val next = when (accent(beat)) {
            Tick.BEAT -> Tick.ACCENT
            Tick.ACCENT -> Tick.MUTE
            else -> Tick.BEAT
        }
        setAccent(beat, next)
        return next
    }

    /** All [MAX_BEATS] accents, for saving. */
    fun accentList(): IntArray = accents.copyOf()

    /** Restores accents saved with [accentList]; invalid entries are ignored. */
    fun restoreAccents(saved: IntArray) {
        saved.forEachIndexed { i, k -> setAccent(i, k) }
    }

    /** Starts over at the top of the bar, with the first click at [start]. */
    fun reset(start: Double) {
        nextTime = start
        beatStart = start
        beat = 0
        sub = 0
    }

    /** The next click, advancing the clock. */
    fun next(): Tick {
        val offsets = Subdivisions.byId(subdivision).offsets
        // The subdivision or the bar may have shrunk since the last click.
        if (sub >= offsets.size) { sub = 0; beat++; nextTime = beatStart + 60.0 / bpm }
        if (beat >= beatsPerBar) beat = 0
        if (sub == 0) beatStart = nextTime
        val accent = accents[beat]
        val kind = when {
            accent == Tick.MUTE -> Tick.MUTE
            sub != 0 -> Tick.SUB
            else -> accent
        }
        val tick = Tick(nextTime, beat, sub, kind)
        val to = if (sub + 1 < offsets.size) offsets[sub + 1] else 1.0
        nextTime += (to - offsets[sub]) * 60.0 / bpm
        sub++
        if (sub >= offsets.size) { sub = 0; beat = (beat + 1) % beatsPerBar }
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
        Tick.MUTE -> 0.0
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

    /** Two short soft tones (high A, then E) for "the timer is over"; they don't sound like a click. */
    fun renderChime(sampleRate: Double): DoubleArray {
        val n = (0.85 * sampleRate).toInt()
        val tones = arrayOf(880.0 to 0.0, 1318.5 to 0.18)
        return DoubleArray(n) { i ->
            val t = i / sampleRate
            var v = 0.0
            for ((hz, at) in tones) {
                val u = t - at
                if (u >= 0 && u < 0.65) v += sin(2 * PI * hz * u) * min(1.0, u / 0.01) * exp(-u * 11.5) * 0.3
            }
            v
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
