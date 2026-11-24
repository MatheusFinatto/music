package br.musica.marmotatuner

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MetronomeTest {
    @Test
    fun clicksAreEvenlySpacedAndTheFirstBeatIsAccented() {
        val m = Metronome(bpm = 120.0, beatsPerBar = 3)
        m.reset(1.0)
        val ticks = List(4) { m.next() }
        assertEquals(listOf(1.0, 1.5, 2.0, 2.5), ticks.map { it.time })
        assertEquals(listOf(Tick.ACCENT, Tick.BEAT, Tick.BEAT, Tick.ACCENT), ticks.map { it.kind })
        assertEquals(listOf(0, 1, 2, 0), ticks.map { it.beat })
    }

    @Test
    fun subdivisionsSplitTheBeat() {
        val m = Metronome(bpm = 60.0, beatsPerBar = 2, subdivision = 3)
        m.reset(0.0)
        val ticks = List(6) { m.next() }
        assertEquals(1.0 / 3, ticks[1].time, 1e-9)
        assertEquals(listOf(Tick.ACCENT, Tick.SUB, Tick.SUB, Tick.BEAT, Tick.SUB, Tick.SUB), ticks.map { it.kind })
    }

    @Test
    fun tempoChangeAppliesFromTheNextClick() {
        val m = Metronome(bpm = 60.0)
        m.reset(0.0)
        m.next()
        m.bpm = 120.0
        assertEquals(1.0, m.next().time, 1e-9) // already scheduled at the old tempo
        assertEquals(1.5, m.next().time, 1e-9)
    }

    @Test
    fun unevenFiguresPlaceClicksInsideTheBeat() {
        val m = Metronome(bpm = 60.0, beatsPerBar = 2, subdivision = 8) // dotted eighth + sixteenth
        m.reset(0.0)
        assertEquals(listOf(0.0, 0.75, 1.0, 1.75, 2.0), List(5) { m.next().time })
        m.subdivision = 10 // shuffle: quarter + eighth under a triplet
        m.reset(0.0)
        val shuffle = List(3) { m.next().time }
        assertEquals(2.0 / 3, shuffle[1], 1e-9)
        assertEquals(1.0, shuffle[2], 1e-9)
    }

    @Test
    fun everyFigureStartsOnTheBeatAndMatchesItsNotation() {
        for (s in Subdivisions.all) {
            assertEquals(0.0, s.offsets[0], 0.0)
            assertEquals(s.offsets.size, s.notes.size)
        }
        assertEquals(1, Subdivisions.byId(99).id)
    }

    @Test
    fun clickingABeatCyclesNormalStrongMuted() {
        val m = Metronome(bpm = 60.0, beatsPerBar = 2, subdivision = 2)
        assertEquals(Tick.ACCENT, m.cycleAccent(1))
        assertEquals(Tick.MUTE, m.cycleAccent(0))
        m.reset(0.0)
        // A muted beat mutes its subdivisions too; the beat still advances.
        assertEquals(listOf(Tick.MUTE, Tick.MUTE, Tick.ACCENT, Tick.SUB), List(4) { m.next().kind })
        assertEquals(Tick.BEAT, m.cycleAccent(0))
    }

    @Test
    fun accentsSurviveFewerBeatsAndASavedCopy() {
        val m = Metronome(beatsPerBar = 4)
        m.cycleAccent(3)
        m.beatsPerBar = 2
        m.beatsPerBar = 4
        assertEquals(Tick.ACCENT, m.accent(3))
        val copy = Metronome()
        copy.restoreAccents(m.accentList())
        assertEquals(Tick.ACCENT, copy.accent(3))
    }

    @Test
    fun shrinkingTheFigureMidBeatMovesOnWithoutAJump() {
        val m = Metronome(bpm = 60.0, beatsPerBar = 2, subdivision = 4)
        m.reset(0.0)
        repeat(3) { m.next() } // third sixteenth played; next would be sub 3
        m.subdivision = 2
        val t = m.next()
        assertEquals(1, t.beat)
        assertEquals(0, t.sub)
        assertEquals(1.0, t.time, 1e-9)
    }

    @Test
    fun tempoIsClamped() {
        assertEquals(Metronome.MAX_BPM, Metronome(bpm = 999.0).bpm, 0.0)
        assertEquals(Metronome.MIN_BPM, Metronome(bpm = 1.0).bpm, 0.0)
    }

    @Test
    fun tapTempoUsesTheMedianInterval() {
        val tap = TapTempo()
        assertNull(tap.tap(0.0))
        tap.tap(0.5)
        tap.tap(1.0)
        tap.tap(1.9) // one late tap
        assertEquals(120.0, tap.tap(2.4)!!, 0.0)
    }

    @Test
    fun tapTempoStartsOverAfterAPause() {
        val tap = TapTempo()
        tap.tap(0.0)
        tap.tap(1.0)
        assertNull(tap.tap(10.0))
    }

    @Test
    fun clickLastsItsDurationAndStartsSilent() {
        val samples = ClickSound.render(Tick.ACCENT, 48000.0)
        assertEquals((ClickSound.DURATION * 48000).toInt(), samples.size)
        assertEquals(0.0, samples[0], 1e-9)
    }
}
