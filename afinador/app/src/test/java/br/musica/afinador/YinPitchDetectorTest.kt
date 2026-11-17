package br.musica.afinador

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import kotlin.math.abs
import kotlin.math.log2

class YinPitchDetectorTest {
    private val yin = YinPitchDetector(TestSignals.RATE)

    private fun centsOff(detected: Double, expected: Double) = abs(1200 * log2(detected / expected))

    @Test
    fun detectsEveryOpenStringWithinOneCent() {
        for (hz in listOf(82.41, 110.0, 146.83, 196.0, 246.94, 329.63)) {
            val detected = yin.detect(TestSignals.sine(hz, yin.requiredSamples))
            assertNotNull("$hz Hz not detected", detected)
            assertEquals("$hz Hz off by cents", 0.0, centsOff(detected!!, hz), 1.0)
        }
    }

    @Test
    fun lowEWithStrongHarmonicsIsNotReadAnOctaveUp() {
        val detected = yin.detect(TestSignals.guitarLike(82.41, yin.requiredSamples))
        assertNotNull(detected)
        assertEquals(0.0, centsOff(detected!!, 82.41), 2.0)
    }

    @Test
    fun detectsSlightlyFlatString() {
        val detected = yin.detect(TestSignals.sine(241.9, yin.requiredSamples))
        assertEquals(0.0, centsOff(detected!!, 241.9), 1.0)
    }

    @Test
    fun silenceHasNoPitch() {
        assertNull(yin.detect(FloatArray(yin.requiredSamples)))
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsTooFewSamples() {
        yin.detect(FloatArray(yin.requiredSamples - 1))
    }
}
