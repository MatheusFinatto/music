package br.musica.afinador

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NoteMapperTest {
    private fun read(hz: Double) = NoteMapper.readingFromMidi(NoteMapper.midiFromFrequency(hz))

    @Test
    fun a440IsA4InTune() {
        val r = read(440.0)
        assertEquals("A", r.name)
        assertEquals(4, r.octave)
        assertEquals(0f, r.cents, 0.01f)
        assertTrue(r.isInTune)
    }

    @Test
    fun standardGuitarStrings() {
        val expected = listOf(82.41 to "E2", 110.0 to "A2", 146.83 to "D3", 196.0 to "G3", 246.94 to "B3", 329.63 to "E4")
        for ((hz, label) in expected) {
            val r = read(hz)
            assertEquals("$hz Hz", label, "${r.name}${r.octave}")
            assertEquals("$hz Hz cents", 0f, r.cents, 1f)
        }
    }

    /** The reference screenshot: 241.9 Hz is a flat B3. */
    @Test
    fun flatB3FromScreenshot() {
        val r = read(241.9)
        assertEquals("B", r.name)
        assertEquals(3, r.octave)
        assertEquals(-35.7f, r.cents, 0.2f)
        assertFalse(r.isInTune)
    }

    @Test
    fun middleCIsC4AndOctaveBoundaryIsAtC() {
        assertEquals("C4", read(261.63).let { "${it.name}${it.octave}" })
        assertEquals("B3", NoteMapper.readingFromMidi(59.0).let { "${it.name}${it.octave}" })
    }

    @Test
    fun sharpReadingRoundsToNearestNote() {
        val r = NoteMapper.readingFromMidi(69.3)
        assertEquals("A", r.name)
        assertEquals(30f, r.cents, 0.01f)
    }

    @Test
    fun inTuneLimitIsFiveCents() {
        assertTrue(NoteMapper.readingFromMidi(69.05).isInTune)
        assertFalse(NoteMapper.readingFromMidi(69.06).isInTune)
    }

    @Test
    fun frequencyRoundTrips() {
        assertEquals(329.63, NoteMapper.frequencyFromMidi(NoteMapper.midiFromFrequency(329.63)), 1e-9)
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsZeroFrequency() {
        NoteMapper.midiFromFrequency(0.0)
    }
}
