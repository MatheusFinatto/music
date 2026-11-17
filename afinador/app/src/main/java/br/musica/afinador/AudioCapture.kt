package br.musica.afinador

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder

/**
 * Reads the microphone on a background thread and hands each chunk to [onChunk]
 * (called on that thread). The caller must hold RECORD_AUDIO before [start].
 *
 * Example:
 * ```
 * val capture = AudioCapture(onChunk = { chunk, count -> … }, onFailure = { … })
 * capture.start() // in onResume
 * capture.stop()  // in onPause
 * ```
 */
class AudioCapture(
    private val onChunk: (FloatArray, Int) -> Unit,
    private val onFailure: () -> Unit,
) {
    @Volatile private var running = false
    private var thread: Thread? = null

    fun start() {
        if (running) return
        running = true
        thread = Thread(::recordLoop, "afinador-audio").apply {
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    fun stop() {
        running = false
        thread?.join(JOIN_TIMEOUT_MS)
        thread = null
    }

    private fun recordLoop() {
        val record = openFirstAvailableSource()
        if (record == null) {
            running = false
            onFailure()
            return
        }
        try {
            readUntilStopped(record)
        } finally {
            record.stop()
            record.release()
        }
    }

    private fun readUntilStopped(record: AudioRecord) {
        val chunk = FloatArray(CHUNK_SAMPLES)
        record.startRecording()
        while (running) {
            val count = record.read(chunk, 0, CHUNK_SAMPLES, AudioRecord.READ_BLOCKING)
            if (count > 0) onChunk(chunk, count)
        }
    }

    private fun openFirstAvailableSource(): AudioRecord? =
        SOURCES.firstNotNullOfOrNull(::openSource)

    @SuppressLint("MissingPermission") // MainActivity only starts capture after the grant
    private fun openSource(source: Int): AudioRecord? {
        val minBytes = AudioRecord.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT)
        if (minBytes <= 0) return null
        val bufferBytes = maxOf(minBytes, CHUNK_SAMPLES * Float.SIZE_BYTES * 4)
        val record = runCatching {
            AudioRecord(source, SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_FLOAT, bufferBytes)
        }.getOrNull() ?: return null
        if (record.state == AudioRecord.STATE_INITIALIZED) return record
        record.release()
        return null
    }

    companion object {
        /** 44.1 kHz is the one rate every Android device must support. */
        const val SAMPLE_RATE = 44100

        /** ~23 ms per chunk → ~43 needle updates per second. */
        const val CHUNK_SAMPLES = 1024

        /**
         * VOICE_RECOGNITION is tried first because it usually skips automatic gain control and
         * noise suppression, which would otherwise squash a decaying string. MIC is the fallback.
         */
        private val SOURCES = listOf(MediaRecorder.AudioSource.VOICE_RECOGNITION, MediaRecorder.AudioSource.MIC)

        private const val JOIN_TIMEOUT_MS = 500L
    }
}
