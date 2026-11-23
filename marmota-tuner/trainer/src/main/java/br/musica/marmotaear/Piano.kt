package br.musica.marmotaear

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.os.Handler
import android.os.Looper
import br.musica.marmotatuner.treino.PIANO_ATTACK_S
import br.musica.marmotatuner.treino.PIANO_PEAK
import br.musica.marmotatuner.treino.PIANO_RELEASE_S
import br.musica.marmotatuner.treino.PIANO_SAMPLES
import br.musica.marmotatuner.treino.PianoNote
import br.musica.marmotatuner.treino.nearestSample
import br.musica.marmotatuner.treino.rateFor
import java.nio.ByteOrder
import kotlin.math.pow

/**
 * The sampled piano, the same as the website's: 14 Salamander samples (assets/piano, copied from the site at build time), the note
 * picked and pitched by :core (nearestSample, rateFor) and the same envelope (PIANO_*). Decoding happens once on a background
 * thread; a mixer thread writes everything that sounds into one AudioTrack, so timing follows the audio clock.
 *
 * Example: `Piano.carregar(ctx) { ok -> }` then `Piano.tocar(notas)` (returns the length in seconds, or null if not loaded).
 */
object Piano {
    private const val RATE = 48000
    private const val BLOCK = 256
    /** A short gap before the first note, so a note asked for "now" is never cut at the start. */
    private const val FOLGA_S = 0.06
    private const val CORTE_S = 0.05

    private class Amostra(val dados: FloatArray, val taxa: Int)
    private class Voz(val amostra: Amostra, val passo: Double, val inicio: Long, val fim: Long, var pos: Double = 0.0, var corte: Long = Long.MAX_VALUE)

    private val amostras = HashMap<Int, Amostra>()
    private val vozes = ArrayList<Voz>()
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var relogio = 0L
    @Volatile private var rodando = false
    @Volatile var carregado = false
        private set
    private var carregando = false
    private val esperando = ArrayList<(Boolean) -> Unit>()
    private var thread: Thread? = null
    private var bordao: Runnable? = null

    /** Decodes the samples once; [pronto] runs on the main thread with true when the piano can play. */
    fun carregar(ctx: Context, pronto: (Boolean) -> Unit) {
        if (carregado) return pronto(true)
        esperando.add(pronto)
        if (carregando) return
        carregando = true
        val app = ctx.applicationContext
        Thread({
            val ok = runCatching {
                for (m in PIANO_SAMPLES) amostras[m] = decodificar(app, "piano/$m.mp3")
            }.isSuccess
            main.post {
                carregando = false
                carregado = ok
                val cbs = esperando.toList()
                esperando.clear()
                cbs.forEach { it(ok) }
            }
        }, "marmota-piano-load").start()
    }

    /** Starts the mixer (call from onResume). The AudioTrack lives only while the screen is visible. */
    fun ligar() {
        if (rodando) return
        rodando = true
        thread = Thread(::misturar, "marmota-piano").apply { priority = Thread.MAX_PRIORITY; start() }
    }

    /** Stops the mixer and silences everything (call from onPause). */
    fun desligar() {
        pararBordao()
        rodando = false
        thread?.join(500)
        thread = null
        synchronized(vozes) { vozes.clear() }
    }

    /**
     * Plays the notes from now. Returns the total length in seconds (to the end of the last release), or null if the samples
     * aren't loaded. Without [manter], what was still sounding is cut first.
     */
    fun tocar(notas: Array<PianoNote>, manter: Boolean = false): Double? {
        if (!carregado) return null
        if (!manter) calar()
        val t0 = relogio + (FOLGA_S * RATE).toLong()
        var fim = 0.0
        synchronized(vozes) {
            for (n in notas) {
                val s = nearestSample(n.midi)
                val a = amostras.getValue(s)
                val passo = rateFor(n.midi, s, n.cents ?: 0.0) * a.taxa / RATE
                val inicio = t0 + (n.at * RATE).toLong()
                vozes.add(Voz(a, passo, inicio, inicio + (n.dur * RATE).toLong()))
                fim = maxOf(fim, n.at + n.dur + PIANO_RELEASE_S + 0.05)
            }
        }
        return fim
    }

    /** Fades out whatever is sounding (50 ms) and stops the drone. */
    fun calar() {
        pararBordao()
        val corte = relogio + (CORTE_S * RATE).toLong()
        synchronized(vozes) { for (v in vozes) v.corte = minOf(v.corte, corte) }
    }

    /** A note that doesn't stop: replayed over itself every 2.4 s until [calar] or [pararBordao]. */
    fun iniciarBordao(midi: Int): Boolean {
        val nota = arrayOf(PianoNote(midi, 0.0, 3.0))
        if (tocar(nota) == null) return false
        val r = object : Runnable {
            override fun run() {
                tocar(nota, manter = true)
                main.postDelayed(this, BORDAO_MS)
            }
        }
        bordao = r
        main.postDelayed(r, BORDAO_MS)
        return true
    }

    fun pararBordao() {
        bordao?.let { main.removeCallbacks(it) }
        bordao = null
    }

    private const val BORDAO_MS = 2400L

    private fun misturar() {
        val minBuf = AudioTrack.getMinBufferSize(RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT)
        val track = AudioTrack.Builder()
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            .setAudioFormat(AudioFormat.Builder().setSampleRate(RATE).setEncoding(AudioFormat.ENCODING_PCM_FLOAT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
            .setBufferSizeInBytes(maxOf(minBuf, BLOCK * 4 * 4))
            .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
        val bloco = FloatArray(BLOCK)
        val ataque = PIANO_ATTACK_S * RATE
        val soltura = PIANO_RELEASE_S * RATE
        val corteN = CORTE_S * RATE
        // Exponential release to 0.001 of the peak, like Web Audio's exponentialRampToValueAtTime.
        val queda = (0.001 / PIANO_PEAK)
        track.play()
        while (rodando) {
            bloco.fill(0f)
            val t0 = relogio
            synchronized(vozes) {
                val it = vozes.iterator()
                while (it.hasNext()) {
                    val v = it.next()
                    val dados = v.amostra.dados
                    var morta = false
                    for (i in 0 until BLOCK) {
                        val t = t0 + i
                        if (t < v.inicio) continue
                        val idx = v.pos.toInt()
                        if (idx + 1 >= dados.size) { morta = true; break }
                        val desde = (t - v.inicio).toDouble()
                        var g = if (desde < ataque) PIANO_PEAK * desde / ataque else PIANO_PEAK
                        if (t >= v.fim) {
                            val r = (t - v.fim) / soltura
                            if (r >= 1.0) { morta = true; break }
                            g = PIANO_PEAK * queda.pow(r)
                        }
                        if (t >= v.corte) {
                            val c = (t - v.corte) / corteN
                            if (c >= 1.0) { morta = true; break }
                            g *= 1.0 - c
                        }
                        val f = v.pos - idx
                        val s = dados[idx] * (1 - f) + dados[idx + 1] * f
                        bloco[i] += (s * g).toFloat()
                        v.pos += v.passo
                    }
                    if (morta) it.remove()
                }
            }
            for (i in bloco.indices) bloco[i] = bloco[i].coerceIn(-1f, 1f)
            track.write(bloco, 0, BLOCK, AudioTrack.WRITE_BLOCKING)
            relogio = t0 + BLOCK
        }
        track.stop()
        track.release()
    }

    /** Decodes an mp3 asset to mono float PCM with MediaExtractor and MediaCodec. */
    private fun decodificar(ctx: Context, caminho: String): Amostra {
        val ex = MediaExtractor()
        ctx.assets.openFd(caminho).use { fd -> ex.setDataSource(fd.fileDescriptor, fd.startOffset, fd.length) }
        val formato = ex.getTrackFormat(0)
        ex.selectTrack(0)
        val codec = MediaCodec.createDecoderByType(formato.getString(MediaFormat.KEY_MIME)!!)
        codec.configure(formato, null, null, 0)
        codec.start()
        var taxa = formato.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        var canais = formato.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
        var saida = ShortArray(1 shl 18)
        var n = 0
        val info = MediaCodec.BufferInfo()
        var fimEntrada = false
        while (true) {
            if (!fimEntrada) {
                val i = codec.dequeueInputBuffer(10_000)
                if (i >= 0) {
                    val lidos = ex.readSampleData(codec.getInputBuffer(i)!!, 0)
                    if (lidos < 0) {
                        codec.queueInputBuffer(i, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                        fimEntrada = true
                    } else {
                        codec.queueInputBuffer(i, 0, lidos, ex.sampleTime, 0)
                        ex.advance()
                    }
                }
            }
            val o = codec.dequeueOutputBuffer(info, 10_000)
            if (o == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                taxa = codec.outputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                canais = codec.outputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            } else if (o >= 0) {
                val buf = codec.getOutputBuffer(o)!!.order(ByteOrder.nativeOrder()).asShortBuffer()
                val r = buf.remaining()
                if (n + r > saida.size) saida = saida.copyOf(maxOf(saida.size * 2, n + r))
                buf.get(saida, n, r)
                n += r
                codec.releaseOutputBuffer(o, false)
                if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) break
            }
        }
        codec.stop()
        codec.release()
        ex.release()
        val frames = n / canais
        val mono = FloatArray(frames) { f ->
            var s = 0f
            for (c in 0 until canais) s += saida[f * canais + c]
            s / canais / 32768f
        }
        return Amostra(mono, taxa)
    }
}
