package br.musica.marmotatuner

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import kotlin.math.roundToInt

/**
 * Metronome screen. The click timing and the click sound come from core (Metronome, ClickSound), the same
 * code the website runs. Here the clicks are mixed into an AudioTrack sample by sample, so they land exactly
 * on time no matter how busy the main thread is. Plain views, no AndroidX, like the tuner.
 */
class MetronomeActivity : Activity() {
    private val metronome = Metronome()
    private val tapTempo = TapTempo()
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var playing = false
    private var audioThread: Thread? = null

    private lateinit var bpmText: TextView
    private lateinit var bpmBar: SeekBar
    private lateinit var playButton: Button
    private lateinit var beatsText: TextView
    private val dots = ArrayList<View>()
    private lateinit var dotsRow: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val prefs = getPreferences(MODE_PRIVATE)
        metronome.bpm = prefs.getInt("bpm", 90).toDouble()
        metronome.beatsPerBar = prefs.getInt("beats", 4)
        metronome.subdivision = prefs.getInt("sub", 1)
        metronome.accentFirst = prefs.getBoolean("accent", true)
        setContentView(buildLayout())
    }

    override fun onPause() {
        stop()
        getPreferences(MODE_PRIVATE).edit()
            .putInt("bpm", metronome.bpm.roundToInt())
            .putInt("beats", metronome.beatsPerBar)
            .putInt("sub", metronome.subdivision)
            .putBoolean("accent", metronome.accentFirst)
            .apply()
        super.onPause()
    }

    private fun color(id: Int) = getColor(id)
    private fun dp(v: Int) = (v * resources.displayMetrics.density).roundToInt()

    private fun pill(text: String, filled: Boolean = false) = Button(this).apply {
        this.text = text
        isAllCaps = false
        textSize = 17f
        setTextColor(if (filled) color(R.color.tuner_background) else color(R.color.tuner_ink))
        background = GradientDrawable().apply {
            cornerRadius = dp(28).toFloat()
            setColor(if (filled) color(R.color.tuner_now) else Color.TRANSPARENT)
            setStroke(dp(1), if (filled) color(R.color.tuner_now) else color(R.color.tuner_muted))
        }
        minHeight = dp(52)
        setPadding(dp(22), 0, dp(22), 0)
    }

    private fun buildLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(24), dp(24), dp(24))
        }
        val title = TextView(this).apply {
            text = getString(R.string.metronome)
            textSize = 22f
            setTextColor(color(R.color.tuner_ink))
            typeface = Typeface.DEFAULT_BOLD
        }
        root.addView(title, LinearLayout.LayoutParams(-1, -2))

        dotsRow = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, dp(32), 0, dp(16)) }
        root.addView(dotsRow, LinearLayout.LayoutParams(-1, -2))
        rebuildDots()

        val tempoRow = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL or Gravity.CENTER_HORIZONTAL }
        val minus = pill("−").apply { setOnClickListener { setBpm(metronome.bpm - 1) } }
        val plus = pill("+").apply { setOnClickListener { setBpm(metronome.bpm + 1) } }
        bpmText = TextView(this).apply {
            textSize = 64f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(color(R.color.tuner_ink))
            gravity = Gravity.CENTER
            minWidth = dp(150)
        }
        tempoRow.addView(minus)
        tempoRow.addView(bpmText)
        tempoRow.addView(plus)
        root.addView(tempoRow)
        root.addView(TextView(this).apply {
            text = getString(R.string.bpm)
            setTextColor(color(R.color.tuner_muted))
            gravity = Gravity.CENTER
        })

        bpmBar = SeekBar(this).apply {
            max = (Metronome.MAX_BPM - Metronome.MIN_BPM).toInt()
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar, p: Int, fromUser: Boolean) { if (fromUser) setBpm(Metronome.MIN_BPM + p) }
                override fun onStartTrackingTouch(s: SeekBar) {}
                override fun onStopTrackingTouch(s: SeekBar) {}
            })
        }
        root.addView(bpmBar, LinearLayout.LayoutParams(-1, dp(48)).apply { topMargin = dp(16) })

        val actions = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, dp(16), 0, dp(16)) }
        playButton = pill(getString(R.string.play), filled = true).apply { setOnClickListener { if (playing) stop() else start() } }
        val tap = pill(getString(R.string.tap)).apply {
            setOnClickListener { tapTempo.tap(SystemClock.elapsedRealtime() / 1000.0)?.let { setBpm(it) } }
        }
        actions.addView(playButton, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = dp(12) })
        actions.addView(tap)
        root.addView(actions)

        val beatsRow = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL or Gravity.CENTER_HORIZONTAL }
        beatsText = TextView(this).apply { setTextColor(color(R.color.tuner_ink)); textSize = 16f; setPadding(dp(12), 0, dp(12), 0) }
        beatsRow.addView(pill("−").apply { setOnClickListener { setBeats(metronome.beatsPerBar - 1) } })
        beatsRow.addView(beatsText)
        beatsRow.addView(pill("+").apply { setOnClickListener { setBeats(metronome.beatsPerBar + 1) } })
        root.addView(beatsRow)

        val subs = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, dp(16), 0, 0) }
        val subNames = resources.getStringArray(R.array.subdivisions)
        val subButtons = ArrayList<Button>()
        for (n in 1..4) {
            val b = pill(subNames[n - 1]).apply { textSize = 14f; setPadding(dp(10), 0, dp(10), 0) }
            b.setOnClickListener {
                metronome.subdivision = n
                subButtons.forEachIndexed { i, x -> x.alpha = if (i + 1 == n) 1f else 0.55f }
            }
            b.alpha = if (n == metronome.subdivision) 1f else 0.55f
            subButtons.add(b)
            subs.addView(b, LinearLayout.LayoutParams(0, -2, 1f).apply { marginEnd = if (n < 4) dp(6) else 0 })
        }
        root.addView(subs, LinearLayout.LayoutParams(-1, -2))

        root.addView(CheckBox(this).apply {
            text = getString(R.string.accent_first)
            setTextColor(color(R.color.tuner_ink))
            isChecked = metronome.accentFirst
            setOnCheckedChangeListener { _, on -> metronome.accentFirst = on; rebuildDots() }
        }, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(16) })

        setBpm(metronome.bpm)
        setBeats(metronome.beatsPerBar)
        fitInsideSystemBars(root)
        return root
    }

    private fun setBpm(v: Double) {
        metronome.bpm = v
        bpmText.text = metronome.bpm.roundToInt().toString()
        bpmBar.progress = (metronome.bpm - Metronome.MIN_BPM).roundToInt()
    }

    private fun setBeats(n: Int) {
        metronome.beatsPerBar = n
        beatsText.text = resources.getQuantityString(R.plurals.beats_per_bar, metronome.beatsPerBar, metronome.beatsPerBar)
        rebuildDots()
    }

    private fun rebuildDots() {
        dotsRow.removeAllViews()
        dots.clear()
        repeat(metronome.beatsPerBar) { i ->
            val big = i == 0 && metronome.accentFirst && metronome.beatsPerBar > 1
            val size = dp(if (big) 30 else 22)
            val v = View(this).apply { background = dotShape(false) }
            dots.add(v)
            dotsRow.addView(v, LinearLayout.LayoutParams(size, size).apply { marginStart = dp(6); marginEnd = dp(6) })
        }
    }

    private fun dotShape(on: Boolean) = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(if (on) color(R.color.tuner_now) else Color.TRANSPARENT)
        setStroke(dp(2), if (on) color(R.color.tuner_now) else color(R.color.tuner_muted))
    }

    private fun light(beat: Int) {
        dots.forEachIndexed { i, v -> v.background = dotShape(i == beat) }
    }

    private fun start() {
        if (playing) return
        playing = true
        playButton.text = getString(R.string.stop)
        audioThread = Thread(::audioLoop, "metronome").apply { priority = Thread.MAX_PRIORITY; start() }
    }

    private fun stop() {
        playing = false
        audioThread?.join(500)
        audioThread = null
        if (::playButton.isInitialized) playButton.text = getString(R.string.play)
        main.removeCallbacksAndMessages(null)
        if (dots.isNotEmpty()) light(-1)
    }

    /** Mixes the clicks into the audio stream. The sample clock is the metronome clock. */
    private fun audioLoop() {
        val rate = 48000
        val minBuf = AudioTrack.getMinBufferSize(rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT)
        val track = AudioTrack.Builder()
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            .setAudioFormat(AudioFormat.Builder().setSampleRate(rate).setEncoding(AudioFormat.ENCODING_PCM_FLOAT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
            .setBufferSizeInBytes(minBuf * 2)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
        val sounds = mapOf(
            Tick.ACCENT to ClickSound.render(Tick.ACCENT, rate.toDouble()),
            Tick.BEAT to ClickSound.render(Tick.BEAT, rate.toDouble()),
            Tick.SUB to ClickSound.render(Tick.SUB, rate.toDouble()),
        )
        val block = FloatArray(256)
        val active = ArrayList<Pair<Long, DoubleArray>>() // start sample, samples
        var written = 0L
        metronome.reset(0.05)
        track.play()
        while (playing) {
            val end = written + block.size
            while ((metronome.nextTime * rate).toLong() < end) {
                val tick = metronome.next()
                val at = (tick.time * rate).toLong()
                active.add(at to sounds.getValue(tick.kind))
                // Light the dot when this click is heard: what is still queued in the track plays first.
                val delayMs = ((at - track.playbackHeadPosition.toLong()) * 1000 / rate).coerceAtLeast(0)
                if (tick.sub == 0) main.postDelayed({ if (playing) light(tick.beat) }, delayMs)
            }
            block.fill(0f)
            val it = active.iterator()
            while (it.hasNext()) {
                val (start, samples) = it.next()
                for (i in block.indices) {
                    val k = written + i - start
                    if (k in samples.indices) block[i] += (samples[k.toInt()] * 0.9).toFloat()
                }
                if (start + samples.size <= end) it.remove()
            }
            track.write(block, 0, block.size, AudioTrack.WRITE_BLOCKING)
            written = end
        }
        track.stop()
        track.release()
    }

    @Suppress("DEPRECATION")
    private fun fitInsideSystemBars(view: View) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
        window.setDecorFitsSystemWindows(false)
        view.setOnApplyWindowInsetsListener { v, insets ->
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            v.setPadding(bars.left + dp(24), bars.top + dp(24), bars.right + dp(24), bars.bottom + dp(24))
            WindowInsets.CONSUMED
        }
    }
}
