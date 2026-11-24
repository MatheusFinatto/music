package br.musica.marmotatuner

import android.app.Activity
import android.app.Dialog
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.InsetDrawable
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Metronome screen. The click timing and the click sound come from core (Metronome, ClickSound), the same
 * code the website runs. Here the clicks are mixed into an AudioTrack sample by sample, so they land exactly
 * on time no matter how busy the main thread is. Plain views, no AndroidX, like the tuner.
 *
 * One simple screen: the figure, beats and favorites on top, the beats as dots (tap one: normal → strong →
 * muted), the tempo wheel in the middle, Tap and Timer, and Play.
 */
class MetronomeActivity : Activity() {
    private val metronome = Metronome()
    private val tapTempo = TapTempo()
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var playing = false
    private var audioThread: Thread? = null

    /** Timer length in minutes (0 = no limit) and, while playing with a limit, when it ends (elapsedRealtime). */
    private var minutes = 0
    private var deadline = 0L
    private var timerDone = false

    private lateinit var wheel: BpmWheel
    private lateinit var playButton: Button
    private lateinit var timerButton: Button
    private lateinit var figureButton: FrameLayout
    private lateinit var beatsButton: Button
    private lateinit var dotsRow: LinearLayout
    private lateinit var dotsHint: TextView
    private val dots = ArrayList<View>()
    private var lit = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val prefs = getPreferences(MODE_PRIVATE)
        metronome.bpm = prefs.getInt("bpm", 90).toDouble()
        metronome.beatsPerBar = prefs.getInt("beats", 4)
        metronome.subdivision = prefs.getInt("sub", 1)
        val accents = prefs.getString("accents", null)
        if (accents != null) metronome.restoreAccents(parseAccents(accents))
        else if (!prefs.getBoolean("accent", true)) metronome.setAccent(0, Tick.BEAT) // 1.3 had "accent the first beat"
        minutes = prefs.getInt("minutes", 0).takeIf { it in TIMER_MINUTES } ?: 0
        setContentView(withBottomNav(buildLayout(), Screen.METRONOME))
    }

    override fun onPause() {
        stop()
        getPreferences(MODE_PRIVATE).edit()
            .putInt("bpm", metronome.bpm.roundToInt())
            .putInt("beats", metronome.beatsPerBar)
            .putInt("sub", metronome.subdivision)
            .putString("accents", metronome.accentList().joinToString("."))
            .putInt("minutes", minutes)
            .apply()
        super.onPause()
    }

    private fun parseAccents(s: String) = s.split(".").mapNotNull { it.toIntOrNull() }.toIntArray()

    private fun color(id: Int) = getColor(id)
    private fun dp(v: Int) = (v * resources.displayMetrics.density).roundToInt()
    private fun dpf(v: Float) = v * resources.displayMetrics.density

    /** The system's touch ripple, for plain views that act as buttons. */
    private fun ripple(): Drawable? {
        val tv = android.util.TypedValue()
        theme.resolveAttribute(android.R.attr.selectableItemBackground, tv, true)
        return getDrawable(tv.resourceId)
    }

    /** A drawn × (close, delete): 48dp touch target, 2dp stroke like the star. */
    private fun closeButton(description: String, onClick: () -> Unit) = ImageView(this).apply {
        setImageDrawable(CrossDrawable(color(R.color.tuner_muted), dpf(1.8f), dpf(14f)))
        scaleType = ImageView.ScaleType.CENTER
        contentDescription = description
        background = ripple()
        isClickable = true
        setOnClickListener { onClick() }
    }

    private fun pillBackground(filled: Boolean) = GradientDrawable().apply {
        cornerRadius = dpf(28f)
        setColor(if (filled) color(R.color.tuner_ink) else Color.TRANSPARENT)
        setStroke(dp(1), if (filled) color(R.color.tuner_ink) else color(R.color.tuner_line))
    }

    private fun pill(text: String, filled: Boolean = false) = Button(this).apply {
        this.text = text
        isAllCaps = false
        textSize = 17f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        setTextColor(if (filled) color(R.color.tuner_background) else color(R.color.tuner_ink))
        background = pillBackground(filled)
        stateListAnimator = null
        minHeight = dp(52)
        minimumHeight = dp(52)
        setPadding(dp(18), 0, dp(18), 0)
    }

    private fun buildLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(20), dp(16), dp(20), dp(12))
        }

        // Top: the figure (opens the subdivision picker), the beats per bar, and favorites.
        val top = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        figureButton = FrameLayout(this).apply {
            background = pillBackground(false)
            foreground = ripple()
            isClickable = true
            setOnClickListener { pickSubdivision() }
        }
        top.addView(figureButton, LinearLayout.LayoutParams(dp(84), dp(52)))
        beatsButton = pill("").apply { setOnClickListener { pickBeats() } }
        top.addView(beatsButton, LinearLayout.LayoutParams(-2, dp(52)).apply { marginStart = dp(8) })
        top.addView(View(this), LinearLayout.LayoutParams(0, 1, 1f))
        top.addView(ImageView(this).apply {
            setImageDrawable(StarDrawable(color(R.color.tuner_ink), dpf(1.8f)))
            scaleType = ImageView.ScaleType.CENTER
            background = pillBackground(false)
            foreground = ripple()
            contentDescription = getString(R.string.favorites)
            setOnClickListener { showFavorites() }
        }, LinearLayout.LayoutParams(dp(52), dp(52)))
        root.addView(top, LinearLayout.LayoutParams(-1, -2))

        dotsRow = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(0, dp(20), 0, 0) }
        root.addView(dotsRow, LinearLayout.LayoutParams(-1, -2))
        // Shown until the first time someone taps a dot: nothing else on the screen says they can.
        dotsHint = TextView(this).apply {
            text = getString(R.string.dots_hint)
            textSize = 14f
            setTextColor(color(R.color.tuner_muted))
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, 0)
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
            visibility = if (getPreferences(MODE_PRIVATE).getBoolean("dotsHintSeen", false)) View.GONE else View.VISIBLE
        }
        root.addView(dotsHint, LinearLayout.LayoutParams(-1, -2))

        wheel = BpmWheel(this, Metronome.MIN_BPM.toInt(), Metronome.MAX_BPM.toInt()).apply {
            onChange = { metronome.bpm = it.toDouble() }
        }
        root.addView(wheel, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(TextView(this).apply {
            text = getString(R.string.bpm)
            textSize = 15f
            setTextColor(color(R.color.tuner_muted))
            gravity = Gravity.CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        })

        val row = LinearLayout(this).apply { setPadding(0, dp(16), 0, dp(12)) }
        row.addView(pill(getString(R.string.tap)).apply {
            setOnClickListener { tapTempo.tap(SystemClock.elapsedRealtime() / 1000.0)?.let { setBpm(it.toInt()) } }
        }, LinearLayout.LayoutParams(0, dp(56), 1f).apply { marginEnd = dp(10) })
        timerButton = pill("").apply { setOnClickListener { pickTimer() } }
        row.addView(timerButton, LinearLayout.LayoutParams(0, dp(56), 1f))
        root.addView(row, LinearLayout.LayoutParams(-1, -2))

        playButton = pill(getString(R.string.play), filled = true).apply {
            textSize = 20f
            setOnClickListener { if (playing) stop() else start() }
        }
        root.addView(playButton, LinearLayout.LayoutParams(-1, dp(64)))

        setBpm(metronome.bpm.roundToInt())
        refreshBeats()
        refreshFigure()
        refreshTimer()
        return root
    }

    private fun setBpm(v: Int) {
        metronome.bpm = v.toDouble()
        wheel.set(metronome.bpm.roundToInt())
    }

    // ---- Beats: the dots, one per beat; tapping one cycles its accent.

    private fun refreshBeats() {
        beatsButton.text = resources.getQuantityString(R.plurals.beats_short, metronome.beatsPerBar, metronome.beatsPerBar)
        beatsButton.contentDescription = resources.getQuantityString(R.plurals.beats_per_bar, metronome.beatsPerBar, metronome.beatsPerBar)
        dotsRow.removeAllViews()
        dots.clear()
        // More than 6 beats go on two lines, so each dot keeps a touch target close to 48dp.
        val beats = metronome.beatsPerBar
        val perRow = if (beats <= 6) beats else (beats + 1) / 2
        val avail = resources.displayMetrics.widthPixels - dp(40)
        val size = min(dp(48), avail / perRow)
        var line: LinearLayout? = null
        repeat(beats) { i ->
            if (i % perRow == 0) line = LinearLayout(this).apply { gravity = Gravity.CENTER }.also { dotsRow.addView(it, LinearLayout.LayoutParams(-1, -2)) }
            val v = View(this).apply {
                isClickable = true
                setOnClickListener {
                    metronome.cycleAccent(i)
                    paintDot(i)
                    if (dotsHint.visibility == View.VISIBLE) {
                        dotsHint.visibility = View.GONE
                        getPreferences(MODE_PRIVATE).edit().putBoolean("dotsHintSeen", true).apply()
                    }
                }
            }
            dots.add(v)
            line!!.addView(v, LinearLayout.LayoutParams(size, size))
            paintDot(i)
        }
    }

    private fun paintDot(i: Int) {
        val v = dots.getOrNull(i) ?: return
        val accent = metronome.accent(i)
        val on = i == lit
        val inner = when (accent) { Tick.ACCENT -> 34; Tick.MUTE -> 20; else -> 26 }
        val shape = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            val now = color(R.color.tuner_now)
            when {
                accent == Tick.MUTE -> {
                    setColor(Color.TRANSPARENT)
                    setStroke(dp(2), if (on) now else color(R.color.tuner_muted), dpf(3f), dpf(3f))
                }
                on -> { setColor(now); setStroke(dp(2), now) }
                accent == Tick.ACCENT -> { setColor(color(R.color.tuner_ink)); setStroke(dp(2), color(R.color.tuner_ink)) }
                else -> { setColor(color(R.color.tuner_bar)); setStroke(dp(2), color(R.color.tuner_muted)) }
            }
        }
        val pad = ((v.layoutParams?.width ?: dp(48)) - dp(inner)) / 2
        v.background = InsetDrawable(shape, pad.coerceAtLeast(0))
        val state = getString(when (accent) { Tick.ACCENT -> R.string.accent_strong; Tick.MUTE -> R.string.accent_mute; else -> R.string.accent_normal })
        v.contentDescription = getString(R.string.beat_desc, i + 1, state)
    }

    private fun light(beat: Int) {
        val was = lit
        lit = beat
        if (was >= 0) paintDot(was)
        if (beat >= 0) paintDot(beat)
    }

    private fun pickBeats() {
        val count = TextView(this).apply {
            textSize = 56f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(color(R.color.tuner_ink))
            gravity = Gravity.CENTER
            text = metronome.beatsPerBar.toString()
        }
        val body = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        body.addView(count)
        val buttons = LinearLayout(this).apply { setPadding(0, dp(12), 0, 0) }
        fun change(d: Int) {
            metronome.beatsPerBar += d
            count.text = metronome.beatsPerBar.toString()
            refreshBeats()
        }
        buttons.addView(pill("−").apply { textSize = 24f; contentDescription = getString(R.string.fewer_beats); setOnClickListener { change(-1) } },
            LinearLayout.LayoutParams(0, dp(56), 1f).apply { marginEnd = dp(10) })
        buttons.addView(pill("+").apply { textSize = 24f; contentDescription = getString(R.string.more_beats); setOnClickListener { change(1) } },
            LinearLayout.LayoutParams(0, dp(56), 1f))
        body.addView(buttons)
        sheet(getString(R.string.beats_title), body)
    }

    // ---- Subdivision: a grid of rhythm figures.

    private fun refreshFigure() {
        val sub = Subdivisions.byId(metronome.subdivision)
        figureButton.removeAllViews()
        figureButton.addView(ImageView(this).apply {
            setImageDrawable(FigureDrawable(sub, color(R.color.tuner_ink), dpf(0.85f)))
            scaleType = ImageView.ScaleType.CENTER
        }, FrameLayout.LayoutParams(-1, -1))
        figureButton.contentDescription = getString(R.string.subdivision_desc, subdivisionName(sub.id))
    }

    private fun subdivisionName(id: Int): String {
        val names = resources.getStringArray(R.array.subdivision_names)
        return names.getOrElse(Subdivisions.all.indexOfFirst { it.id == id }) { names[0] }
    }

    private fun pickSubdivision() {
        val grid = GridLayout(this).apply { columnCount = 3 }
        lateinit var dialog: Dialog
        for (sub in Subdivisions.all) {
            val selected = sub.id == metronome.subdivision
            val tint = if (selected) color(R.color.tuner_in_tune) else color(R.color.tuner_ink)
            val cell = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(dp(4), dp(10), dp(4), dp(10))
                background = GradientDrawable().apply {
                    cornerRadius = dpf(14f)
                    setColor(Color.TRANSPARENT)
                    setStroke(dp(if (selected) 2 else 1), if (selected) color(R.color.tuner_in_tune) else color(R.color.tuner_line))
                }
                foreground = ripple()
                isClickable = true
                isSelected = selected
                contentDescription = subdivisionName(sub.id)
                setOnClickListener {
                    metronome.subdivision = sub.id
                    refreshFigure()
                    dialog.dismiss()
                }
            }
            cell.addView(ImageView(this).apply { setImageDrawable(FigureDrawable(sub, tint, dpf(1f))) }, LinearLayout.LayoutParams(-2, dp(44)))
            cell.addView(TextView(this).apply {
                text = subdivisionName(sub.id)
                textSize = 12f
                setTextColor(tint)
                gravity = Gravity.CENTER
                importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
            }, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(4) })
            grid.addView(cell, GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(GridLayout.UNDEFINED, 1f)).apply {
                width = 0
                height = dp(96)
                setMargins(dp(4), dp(4), dp(4), dp(4))
            })
        }
        dialog = sheet(getString(R.string.subdivision_title), ScrollView(this).apply { addView(grid) })
    }

    // ---- Timer: stops the metronome by itself, with a chime.

    private val timerTick = object : Runnable {
        override fun run() {
            if (!playing || deadline == 0L) return
            val rest = deadline - SystemClock.elapsedRealtime()
            if (rest <= 0) {
                stop()
                timerDone = true
                playChime()
                refreshTimer()
                main.postDelayed({ timerDone = false; refreshTimer() }, 5000)
                return
            }
            refreshTimer()
            main.postDelayed(this, 250)
        }
    }

    private fun refreshTimer() {
        timerButton.text = when {
            playing && deadline > 0 -> {
                val s = ((deadline - SystemClock.elapsedRealtime() + 999) / 1000).coerceAtLeast(0)
                "%d:%02d".format(s / 60, s % 60)
            }
            timerDone -> getString(R.string.timer_done)
            minutes > 0 -> getString(R.string.timer_minutes, minutes)
            else -> getString(R.string.timer)
        }
        timerButton.contentDescription = if (minutes > 0) getString(R.string.timer_desc, minutes) else getString(R.string.timer_off_desc)
    }

    private fun pickTimer() {
        val grid = GridLayout(this).apply { columnCount = 3 }
        lateinit var dialog: Dialog
        for (m in TIMER_MINUTES) {
            val selected = m == minutes
            val b = pill(if (m == 0) getString(R.string.timer_off) else getString(R.string.minutes, m)).apply {
                textSize = 15f
                setPadding(dp(6), 0, dp(6), 0)
                if (selected) {
                    setTextColor(color(R.color.tuner_in_tune))
                    background = GradientDrawable().apply { cornerRadius = dpf(28f); setStroke(dp(2), color(R.color.tuner_in_tune)) }
                }
                isSelected = selected
                setOnClickListener {
                    minutes = m
                    deadline = if (playing && m > 0) SystemClock.elapsedRealtime() + m * 60_000L else 0L
                    main.removeCallbacks(timerTick)
                    if (deadline > 0) main.post(timerTick)
                    refreshTimer()
                    dialog.dismiss()
                }
            }
            grid.addView(b, GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(GridLayout.UNDEFINED, 1f)).apply {
                width = 0
                height = dp(52)
                setMargins(dp(4), dp(4), dp(4), dp(4))
            })
        }
        dialog = sheet(getString(R.string.timer), grid)
    }

    private fun playChime() = Thread {
        val rate = 48000
        val samples = ClickSound.renderChime(rate.toDouble())
        val data = FloatArray(samples.size) { samples[it].toFloat() }
        val track = AudioTrack.Builder()
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            .setAudioFormat(AudioFormat.Builder().setSampleRate(rate).setEncoding(AudioFormat.ENCODING_PCM_FLOAT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
            .setBufferSizeInBytes(data.size * 4)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()
        track.write(data, 0, data.size, AudioTrack.WRITE_BLOCKING)
        track.play()
        Thread.sleep((data.size * 1000L / rate) + 100)
        track.release()
    }.start()

    // ---- Favorites: tempo, beats, figure and accents, saved on the phone.

    private class Favorite(val bpm: Int, val beats: Int, val sub: Int, val accents: IntArray) {
        fun encode() = "$bpm,$beats,$sub,${accents.joinToString(".")}"
        companion object {
            fun decode(s: String): Favorite? {
                val p = s.split(",")
                if (p.size != 4) return null
                return Favorite(p[0].toIntOrNull() ?: return null, p[1].toIntOrNull() ?: return null, p[2].toIntOrNull() ?: return null,
                    p[3].split(".").mapNotNull { it.toIntOrNull() }.toIntArray())
            }
        }
    }

    private fun loadFavorites(): MutableList<Favorite> =
        getPreferences(MODE_PRIVATE).getString("favorites", "")!!.split(";").filter { it.isNotBlank() }.mapNotNull { Favorite.decode(it) }.toMutableList()

    private fun saveFavorites(list: List<Favorite>) =
        getPreferences(MODE_PRIVATE).edit().putString("favorites", list.joinToString(";") { it.encode() }).apply()

    private fun describe(f: Favorite) = getString(
        R.string.favorite_desc, f.bpm,
        resources.getQuantityString(R.plurals.beats_short, f.beats, f.beats),
        subdivisionName(f.sub),
    )

    private fun showFavorites() {
        val body = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        lateinit var dialog: Dialog
        fun fill() {
            body.removeAllViews()
            val list = loadFavorites()
            val rows = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            if (list.isEmpty()) rows.addView(TextView(this).apply {
                text = getString(R.string.favorites_empty)
                textSize = 15f
                setTextColor(color(R.color.tuner_muted))
                setPadding(0, dp(4), 0, dp(12))
            })
            list.forEachIndexed { i, f ->
                val row = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
                row.addView(TextView(this).apply {
                    text = describe(f)
                    textSize = 16f
                    setTextColor(color(R.color.tuner_ink))
                    minHeight = dp(52)
                    gravity = Gravity.CENTER_VERTICAL
                    background = ripple()
                    isClickable = true
                    setOnClickListener {
                        metronome.beatsPerBar = f.beats
                        metronome.subdivision = f.sub
                        metronome.restoreAccents(f.accents)
                        setBpm(f.bpm)
                        refreshBeats(); refreshFigure()
                        dialog.dismiss()
                    }
                }, LinearLayout.LayoutParams(0, -2, 1f))
                row.addView(closeButton(getString(R.string.delete_favorite, describe(f))) { saveFavorites(list.also { it.removeAt(i) }); fill() },
                    LinearLayout.LayoutParams(dp(48), dp(48)))
                rows.addView(row)
            }
            body.addView(ScrollView(this).apply { addView(rows) }, LinearLayout.LayoutParams(-1, -2, 1f))
            body.addView(pill(getString(R.string.save_current)).apply {
                setOnClickListener {
                    val now = Favorite(metronome.bpm.roundToInt(), metronome.beatsPerBar, metronome.subdivision, metronome.accentList())
                    val list2 = loadFavorites()
                    if (list2.none { it.encode() == now.encode() }) { list2.add(0, now); saveFavorites(list2.take(MAX_FAVORITES)) }
                    fill()
                }
            }, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(8) })
        }
        fill()
        dialog = sheet(getString(R.string.favorites), body)
    }

    // ---- A dialog in the app's look: dark rounded card, title, content, close.

    private fun sheet(title: String, content: View): Dialog {
        val d = Dialog(this)
        d.requestWindowFeature(Window.FEATURE_NO_TITLE)
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(16))
            background = GradientDrawable().apply { cornerRadius = dpf(22f); setColor(color(R.color.tuner_bar)) }
        }
        val head = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        head.addView(TextView(this).apply {
            text = title
            textSize = 19f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(color(R.color.tuner_ink))
            isFocusable = true
        }, LinearLayout.LayoutParams(0, -2, 1f))
        head.addView(closeButton(getString(R.string.close)) { d.dismiss() }, LinearLayout.LayoutParams(dp(48), dp(48)))
        box.addView(head)
        box.addView(content, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })
        d.setContentView(box)
        d.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            setLayout(min(resources.displayMetrics.widthPixels - dp(32), dp(440)), ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        d.show()
        return d
    }

    // ---- Playing.

    private fun start() {
        if (playing) return
        playing = true
        timerDone = false
        playButton.text = getString(R.string.stop)
        deadline = if (minutes > 0) SystemClock.elapsedRealtime() + minutes * 60_000L else 0L
        if (deadline > 0) main.post(timerTick)
        refreshTimer()
        audioThread = Thread(::audioLoop, "metronome").apply { priority = Thread.MAX_PRIORITY; start() }
    }

    private fun stop() {
        playing = false
        audioThread?.join(500)
        audioThread = null
        deadline = 0L
        main.removeCallbacksAndMessages(null)
        if (::playButton.isInitialized) {
            playButton.text = getString(R.string.play)
            refreshTimer()
        }
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
                sounds[tick.kind]?.let { active.add(at to it) } // a muted beat has no sound
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

    private companion object {
        val TIMER_MINUTES = listOf(0, 1, 2, 3, 5, 10, 15, 20, 30)
        const val MAX_FAVORITES = 30
    }
}

/** A five-point star outline, for the favorites button. */
private class StarDrawable(color: Int, strokePx: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeJoin = Paint.Join.ROUND
    }
    private val size = strokePx * 12

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        val cx = bounds.exactCenterX()
        val cy = bounds.exactCenterY() + size * 0.04f
        val outer = size / 2
        val inner = outer * 0.45f
        val path = Path()
        for (i in 0 until 10) {
            val r = if (i % 2 == 0) outer else inner
            val a = Math.toRadians(-90.0 + i * 36.0)
            val x = cx + (r * Math.cos(a)).toFloat()
            val y = cy + (r * Math.sin(a)).toFloat()
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        path.close()
        canvas.drawPath(path, paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/** A drawn ×, for close and delete. */
private class CrossDrawable(color: Int, strokePx: Float, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeCap = Paint.Cap.ROUND
    }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        val h = size / 2
        val cx = bounds.exactCenterX()
        val cy = bounds.exactCenterY()
        canvas.drawLine(cx - h, cy - h, cx + h, cy + h, paint)
        canvas.drawLine(cx + h, cy - h, cx - h, cy + h, paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}
