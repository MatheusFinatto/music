package br.musica.afinador

import android.app.Activity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import kotlin.math.PI
import kotlin.math.sin

/**
 * DEBUG BUILDS ONLY (src/debug): the emulator has no real mic, so this screen feeds a synthetic
 * tone through the real PitchPipeline + PitchSmoother to check the screen and detection end to end.
 *
 * Example: adb shell am start -n br.musica.afinador/.DemoToneActivity --ef hz 241.9
 */
class DemoToneActivity : Activity() {
    private lateinit var tunerView: TunerView
    private val handler = Handler(Looper.getMainLooper())
    private val pipeline = PitchPipeline(AudioCapture.SAMPLE_RATE)
    private val smoother = PitchSmoother()
    private val chunk = FloatArray(AudioCapture.CHUNK_SAMPLES)
    private var phase = 0.0
    private var hz = DEFAULT_HZ

    private val feedNextChunk = object : Runnable {
        override fun run() {
            fillSine()
            val sample = pipeline.process(chunk, chunk.size)
            tunerView.show(smoother.push(sample.midi)?.let(NoteMapper::readingFromMidi), sample.level)
            handler.postDelayed(this, CHUNK_MS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hz = intent.getFloatExtra("hz", DEFAULT_HZ.toFloat()).toDouble()
        tunerView = TunerView(this)
        setContentView(tunerView)
    }

    override fun onResume() {
        super.onResume()
        handler.post(feedNextChunk)
    }

    override fun onPause() {
        handler.removeCallbacks(feedNextChunk)
        super.onPause()
    }

    private fun fillSine() {
        val step = 2 * PI * hz / AudioCapture.SAMPLE_RATE
        for (i in chunk.indices) {
            chunk[i] = (0.3 * sin(phase)).toFloat()
            phase = (phase + step) % (2 * PI)
        }
    }

    private companion object {
        const val DEFAULT_HZ = 241.9
        const val CHUNK_MS = 23L
    }
}
