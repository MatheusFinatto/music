package br.musica.marmotatuner

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SampleWindowTest {
    @Test
    fun keepsMostRecentSamplesInOrder() {
        val window = SampleWindow(4)
        window.append(floatArrayOf(1f, 2f, 3f), 3)
        assertFalse(window.isFull)
        window.append(floatArrayOf(4f, 5f, 99f), 2)
        assertTrue(window.isFull)
        assertArrayEquals(floatArrayOf(2f, 3f, 4f, 5f), window.samples(), 0f)
    }

    @Test
    fun chunkLargerThanWindowKeepsItsTail() {
        val window = SampleWindow(2)
        window.append(floatArrayOf(1f, 2f, 3f), 3)
        assertArrayEquals(floatArrayOf(2f, 3f), window.samples(), 0f)
    }

    @Test
    fun clearEmptiesIt() {
        val window = SampleWindow(2)
        window.append(floatArrayOf(1f, 2f), 2)
        window.clear()
        assertFalse(window.isFull)
    }
}

class PitchPipelineTest {
    /** Feeds a long signal in mic-sized chunks, like AudioCapture does; returns the last sample. */
    private fun feed(pipeline: PitchPipeline, signal: FloatArray): PitchSample {
        var last = PitchSample(null, 0f)
        for (start in signal.indices step PitchPipeline.CHUNK_SAMPLES) {
            val chunk = signal.copyOfRange(start, minOf(signal.size, start + PitchPipeline.CHUNK_SAMPLES))
            last = pipeline.process(chunk, chunk.size)
        }
        return last
    }

    @Test
    fun aStringA2IsMidi45() {
        val sample = feed(PitchPipeline(TestSignals.RATE), TestSignals.sine(110.0, 8192))
        assertEquals(45.0, sample.midi!!, 0.02)
        assertTrue(sample.level > 0.5f)
    }

    @Test
    fun noPitchUntilWindowIsFull() {
        val sample = PitchPipeline(TestSignals.RATE).process(TestSignals.sine(110.0, 1024), 1024)
        assertNull(sample.midi)
    }

    @Test
    fun quietRoomNoiseIsIgnored() {
        val sample = feed(PitchPipeline(TestSignals.RATE), TestSignals.sine(110.0, 8192, amplitude = 0.001))
        assertNull(sample.midi)
    }

    @Test
    fun levelMapsDecibelsToZeroOne() {
        assertEquals(0f, PitchPipeline.levelFromRms(0.0), 0f)
        assertEquals(0f, PitchPipeline.levelFromRms(0.0005), 0f)
        assertEquals(0.5f, PitchPipeline.levelFromRms(0.031623), 0.01f)
        assertEquals(1f, PitchPipeline.levelFromRms(1.0), 0f)
    }
}
