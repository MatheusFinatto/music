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
import android.text.InputFilter
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.math.min
import kotlin.math.roundToInt
import br.musica.marmota.common.Paleta

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

    /** Timer length in seconds (0 = no limit, up to 99:59) and, while playing with a limit, when it ends (elapsedRealtime). */
    private var seconds = 0
    private var deadline = 0L
    private var timerDone = false
    /** With a timer, the play button pauses: what was left (ms) waits here until it plays again. 0 = not paused. */
    private var pausedLeft = 0L

    private lateinit var wheel: BpmWheel
    private lateinit var playButton: ImageView
    private lateinit var stopButton: ImageView
    private lateinit var timerButton: Button
    private lateinit var timerBox: LinearLayout
    private lateinit var timerText: TextView
    private lateinit var timerNote: TextView
    private lateinit var figureButton: FrameLayout
    private lateinit var beatsButton: Button
    private lateinit var dotsRow: LinearLayout
    private lateinit var dotsHint: TextView
    private val dots = ArrayList<View>()
    private var lit = -1
    private lateinit var starButton: ImageView

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
        // Up to 1.12 the timer kept minutes ("minutes"), only the presets.
        seconds = if (prefs.contains("seconds")) prefs.getInt("seconds", 0).takeIf { it in 0..MAX_TIMER } ?: 0
            else (prefs.getInt("minutes", 0).takeIf { it in TIMER_MINUTES } ?: 0) * 60
        setContentView(withBottomNav(buildLayout(), Screen.METRONOME))
    }

    override fun onResume() {
        super.onResume()
        // Signed in: favorites changed on the website or in another phone come in; the screen reloads with them.
        br.musica.marmota.common.Conta.aoVoltar(this) { recreate() }
    }

    override fun onPause() {
        br.musica.marmota.common.Conta.aoSair(this)
        stop()
        getPreferences(MODE_PRIVATE).edit()
            .putInt("bpm", metronome.bpm.roundToInt())
            .putInt("beats", metronome.beatsPerBar)
            .putInt("sub", metronome.subdivision)
            .putString("accents", metronome.accentList().joinToString("."))
            .putInt("seconds", seconds)
            .remove("minutes")
            .apply()
        super.onPause()
    }

    private fun parseAccents(s: String) = s.split(".").mapNotNull { it.toIntOrNull() }.toIntArray()

    /** [a] moved [t] of the way toward [b]. */
    private fun blend(a: Int, b: Int, t: Float) = Color.rgb(
        (Color.red(a) + (Color.red(b) - Color.red(a)) * t).roundToInt(),
        (Color.green(a) + (Color.green(b) - Color.green(a)) * t).roundToInt(),
        (Color.blue(a) + (Color.blue(b) - Color.blue(a)) * t).roundToInt(),
    )
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
        setImageDrawable(CrossDrawable(Paleta.muted, dpf(1.8f), dpf(14f)))
        scaleType = ImageView.ScaleType.CENTER
        contentDescription = description
        background = ripple()
        isClickable = true
        setOnClickListener { onClick() }
    }

    private fun pillBackground(filled: Boolean) = GradientDrawable().apply {
        cornerRadius = dpf(28f)
        setColor(if (filled) Paleta.ink else Color.TRANSPARENT)
        setStroke(dp(1), if (filled) Paleta.ink else Paleta.line)
    }

    private fun pill(text: String, filled: Boolean = false) = Button(this).apply {
        this.text = text
        isAllCaps = false
        textSize = 17f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        setTextColor(if (filled) Paleta.ground else Paleta.ink)
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
        starButton = ImageView(this).apply {
            scaleType = ImageView.ScaleType.CENTER
            background = pillBackground(false)
            foreground = ripple()
            setImageDrawable(StarDrawable(Paleta.ink, dpf(1.8f)))
            contentDescription = getString(R.string.favorites)
            setOnClickListener { showFavorites() }
        }
        top.addView(starButton, LinearLayout.LayoutParams(dp(52), dp(52)))
        root.addView(top, LinearLayout.LayoutParams(-1, -2))

        dotsRow = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(0, dp(20), 0, 0) }
        root.addView(dotsRow, LinearLayout.LayoutParams(-1, -2))
        // Shown until the first time someone taps a dot: nothing else on the screen says they can.
        dotsHint = TextView(this).apply {
            text = getString(R.string.dots_hint)
            textSize = 14f
            setTextColor(Paleta.muted)
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
            setTextColor(Paleta.muted)
            gravity = Gravity.CENTER
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        })

        // The timer shows as soon as it is set, at 2/3 of the tempo's size.
        timerBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(dp(16), dp(8), dp(16), 0) }
        timerText = TextView(this).apply {
            textSize = 58f
            // Semibold where Android has weights (9+); bold before that.
            typeface = if (android.os.Build.VERSION.SDK_INT >= 28) Typeface.create(Typeface.DEFAULT, 600, false) else Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            fontFeatureSettings = "tnum"
        }
        timerNote = TextView(this).apply { textSize = 14f; gravity = Gravity.CENTER; setTextColor(Paleta.muted) }
        // Tapping the countdown opens the timer sheet too, at any moment.
        timerBox.isClickable = true
        timerBox.isFocusable = true
        timerBox.background = ripple()
        timerBox.setOnClickListener { pickTimer() }
        timerBox.addView(timerText)
        timerBox.addView(timerNote)
        root.addView(timerBox, LinearLayout.LayoutParams(-2, -2).apply { gravity = Gravity.CENTER_HORIZONTAL })

        val row = LinearLayout(this).apply { setPadding(0, dp(16), 0, dp(12)) }
        row.addView(pill(getString(R.string.tap)).apply {
            setOnClickListener { tapTempo.tap(SystemClock.elapsedRealtime() / 1000.0)?.let { setBpm(it.toInt()) } }
        }, LinearLayout.LayoutParams(0, dp(56), 1f).apply { marginEnd = dp(10) })
        timerButton = pill("").apply { setOnClickListener { pickTimer() } }
        row.addView(timerButton, LinearLayout.LayoutParams(0, dp(56), 1f))
        root.addView(row, LinearLayout.LayoutParams(-1, -2))

        // Universal icons: ▶ play or resume, ❚❚ pause (with a timer), ■ stop.
        val actions = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        playButton = ImageView(this).apply {
            scaleType = ImageView.ScaleType.CENTER
            background = pillBackground(true)
            foreground = ripple()
            isClickable = true
            setOnClickListener { mainAction() }
        }
        actions.addView(playButton, LinearLayout.LayoutParams(0, dp(64), 1f))
        stopButton = ImageView(this).apply {
            setImageDrawable(TransportDrawable(TransportDrawable.STOP, Paleta.ink, dpf(22f)))
            scaleType = ImageView.ScaleType.CENTER
            background = pillBackground(false)
            foreground = ripple()
            contentDescription = getString(R.string.stop)
            isClickable = true
            visibility = View.GONE
            setOnClickListener { stop() }
        }
        actions.addView(stopButton, LinearLayout.LayoutParams(dp(64), dp(64)).apply { marginStart = dp(10) })
        root.addView(actions, LinearLayout.LayoutParams(-1, -2))

        setBpm(metronome.bpm.roundToInt())
        refreshBeats()
        refreshFigure()
        refreshTimer()
        refreshTransport()
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
            val now = Paleta.now
            when {
                accent == Tick.MUTE -> {
                    setColor(Color.TRANSPARENT)
                    setStroke(dp(2), if (on) now else Paleta.muted, dpf(3f), dpf(3f))
                }
                on -> { setColor(now); setStroke(dp(2), now) }
                accent == Tick.ACCENT -> { setColor(Paleta.ink); setStroke(dp(2), Paleta.ink) }
                else -> { setColor(Paleta.soft); setStroke(dp(2), Paleta.muted) }
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
            setTextColor(Paleta.ink)
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
            setImageDrawable(FigureDrawable(sub, Paleta.ink, dpf(0.85f)))
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
            val tint = if (selected) Paleta.selected else Paleta.ink
            val cell = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(dp(4), dp(10), dp(4), dp(10))
                background = GradientDrawable().apply {
                    cornerRadius = dpf(14f)
                    setColor(Color.TRANSPARENT)
                    setStroke(dp(if (selected) 2 else 1), if (selected) Paleta.selected else Paleta.line)
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
                refreshTransport()
                return
            }
            refreshTransport()
            main.postDelayed(this, 250)
        }
    }

    /** The timer pill only names the setting; the countdown is the big number above. */
    private fun refreshTimer() {
        timerButton.text = if (seconds > 0) getString(R.string.timer_now, duration(seconds)) else getString(R.string.timer)
        timerButton.contentDescription = if (seconds > 0) getString(R.string.timer_desc, duration(seconds)) else getString(R.string.timer_off_desc)
        timerBox.contentDescription = timerButton.contentDescription
    }

    /** Play/pause/stop icons, the stop button and the big countdown, from the current state. */
    private fun refreshTransport() {
        val timer = seconds > 0
        val kind = when { !playing -> TransportDrawable.PLAY; timer -> TransportDrawable.PAUSE; else -> TransportDrawable.STOP }
        playButton.setImageDrawable(TransportDrawable(kind, Paleta.ground, dpf(26f)))
        playButton.contentDescription = getString(when {
            playing -> if (timer) R.string.pause else R.string.stop
            pausedLeft > 0 -> R.string.resume
            else -> R.string.play
        })
        // With a timer, ■ keeps its place (dimmed while there is nothing to stop): nothing moves under the finger.
        stopButton.visibility = if (timer) View.VISIBLE else View.GONE
        val canStop = playing || pausedLeft > 0
        stopButton.isEnabled = canStop
        stopButton.alpha = if (canStop) 1f else 0.35f
        timerBox.visibility = if (timer) View.VISIBLE else View.GONE
        if (!timer) return
        val ms = when {
            playing && deadline > 0 -> deadline - SystemClock.elapsedRealtime()
            pausedLeft > 0 -> pausedLeft
            timerDone -> 0L
            else -> seconds * 1000L
        }
        val sec = ((ms + 999) / 1000).coerceAtLeast(0)
        timerText.text = "%d:%02d".format(sec / 60, sec % 60)
        // The tempo stays the brightest number; the timer lights up a little while it runs. Orange is only for targets.
        timerText.setTextColor(if (playing) blend(Paleta.ink, Paleta.muted, 0.22f) else Paleta.muted)
        timerNote.text = when { timerDone -> getString(R.string.timer_done); pausedLeft > 0 -> getString(R.string.paused); else -> "" }
        timerNote.visibility = if (timerNote.text.isEmpty()) View.INVISIBLE else View.VISIBLE // keeps its line: the wheel does not jump
    }

    /** "5 min" on a round minute, else "1:30" (the website's duration). */
    private fun duration(sec: Int) = if (sec % 60 == 0) getString(R.string.minutes, sec / 60) else "%d:%02d".format(sec / 60, sec % 60)

    /** Sets the timer; while playing, it starts over from the new length. */
    private fun setTimer(sec: Int) {
        seconds = sec.coerceIn(0, MAX_TIMER)
        timerDone = false
        pausedLeft = 0L
        deadline = if (playing && seconds > 0) SystemClock.elapsedRealtime() + seconds * 1000L else 0L
        main.removeCallbacks(timerTick)
        if (deadline > 0) main.post(timerTick)
        refreshTimer()
        refreshTransport()
    }

    private fun pickTimer() {
        val body = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val grid = GridLayout(this).apply { columnCount = 3 }
        lateinit var dialog: Dialog
        val preset = seconds % 60 == 0 && seconds / 60 in TIMER_MINUTES
        for (m in TIMER_MINUTES) {
            val selected = preset && m * 60 == seconds
            val b = pill(if (m == 0) getString(R.string.timer_off) else getString(R.string.minutes, m)).apply {
                textSize = 15f
                setPadding(dp(6), 0, dp(6), 0)
                if (selected) {
                    setTextColor(Paleta.selected)
                    background = GradientDrawable().apply { cornerRadius = dpf(28f); setStroke(dp(2), Paleta.selected) }
                }
                isSelected = selected
                setOnClickListener { setTimer(m * 60); dialog.dismiss() }
            }
            grid.addView(b, GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(GridLayout.UNDEFINED, 1f)).apply {
                width = 0
                height = dp(52)
                setMargins(dp(4), dp(4), dp(4), dp(4))
            })
        }
        body.addView(grid)

        // Off the presets: two drums like the tempo's, minutes (0 to 99) and seconds (0 to 59). ✓ uses it.
        // Turning them does not touch the running timer: only ✓ does (it starts the countdown over).
        val custom = !preset && seconds > 0
        // The drums in the middle and ✓ at the end; the box is green when the current timer is this one.
        val row = FrameLayout(this).apply {
            setPadding(dp(8), dp(4), dp(8), dp(4))
            background = GradientDrawable().apply { cornerRadius = dpf(22f); setStroke(dp(if (custom) 2 else 1), if (custom) Paleta.selected else Paleta.line) }
        }
        val wheels = LinearLayout(this).apply { gravity = Gravity.CENTER }
        val minWheel = BpmWheel(this, 0, 99, 0.6f, true) { getString(R.string.timer_min_value, it) }.apply { set(seconds / 60) }
        val secWheel = BpmWheel(this, 0, 59, 0.6f, true) { getString(R.string.timer_sec_value, it) }.apply { set(seconds % 60) }
        wheels.addView(minWheel, LinearLayout.LayoutParams(dp(76), dp(132)))
        wheels.addView(TextView(this).apply {
            text = ":"
            textSize = 30f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Paleta.muted)
            setPadding(dp(2), 0, dp(2), dp(4))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        })
        wheels.addView(secWheel, LinearLayout.LayoutParams(dp(76), dp(132)))
        row.addView(wheels, FrameLayout.LayoutParams(-2, -2, Gravity.CENTER))
        // ✓ is outlined; filled ivory (the primary action) while the built time is not the timer yet.
        val set = ImageView(this).apply {
            scaleType = ImageView.ScaleType.CENTER
            contentDescription = getString(R.string.timer_set)
            isClickable = true
            setOnClickListener { setTimer(minWheel.value * 60 + secWheel.value); dialog.dismiss() }
        }
        fun refreshSet() {
            val dirty = minWheel.value * 60 + secWheel.value != seconds
            set.setImageDrawable(CheckDrawable(if (dirty) Paleta.ground else Paleta.ink, dpf(2.2f), dpf(22f)))
            set.background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                if (dirty) setColor(Paleta.ink) else setStroke(dp(1), Paleta.line)
            }
        }
        minWheel.onChange = { refreshSet() }
        secWheel.onChange = { refreshSet() }
        refreshSet()
        row.addView(set, FrameLayout.LayoutParams(dp(52), dp(52), Gravity.END or Gravity.CENTER_VERTICAL))
        body.addView(TextView(this).apply {
            text = getString(R.string.timer_custom)
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Paleta.muted)
            isFocusable = true
        }, LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(20); leftMargin = dp(8); bottomMargin = dp(8) })
        body.addView(row, LinearLayout.LayoutParams(-1, -2).apply { leftMargin = dp(4); rightMargin = dp(4) })
        dialog = sheet(getString(R.string.timer), body)
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

    /** [name] is optional ("" = shown as its settings). It is URL-encoded, so commas and semicolons in it are safe. */
    private class Favorite(val bpm: Int, val beats: Int, val sub: Int, val accents: IntArray, val name: String = "") {
        fun settings() = "$bpm,$beats,$sub,${accents.joinToString(".")}"
        fun encode() = if (name.isEmpty()) settings() else "${settings()},${java.net.URLEncoder.encode(name, "UTF-8")}"
        companion object {
            fun decode(s: String): Favorite? {
                val p = s.split(",")
                if (p.size != 4 && p.size != 5) return null // 1.4 saved 4 fields, without a name
                return Favorite(p[0].toIntOrNull() ?: return null, p[1].toIntOrNull() ?: return null, p[2].toIntOrNull() ?: return null,
                    p[3].split(".").mapNotNull { it.toIntOrNull() }.toIntArray(),
                    if (p.size == 5) java.net.URLDecoder.decode(p[4], "UTF-8") else "")
            }
        }
    }

    // Since 1.9 the favorites are kept as the website keeps them: "musica:metronomo-favoritos" in SharedPreferences("musica"),
    // { version, items: [{ bpm, beatsPerBar, subdivision, accents, name }], active }, so the optional account carries them
    // between the app and the site. Up to 1.8 they were a "a;b" string in this activity's preferences: converted once.
    private val musica by lazy { br.musica.marmota.common.Conta.prefs(this) }

    private fun readFavorites(): MutableList<Favorite> {
        val json = musica.getString(FAVORITES_KEY, null) ?: migrateFavorites() ?: return mutableListOf()
        return runCatching {
            val items = org.json.JSONObject(json).getJSONArray("items")
            (0 until items.length()).map { i ->
                val f = items.getJSONObject(i)
                val a = f.optJSONArray("accents") ?: org.json.JSONArray()
                Favorite(f.optInt("bpm", 90), f.optInt("beatsPerBar", 4), f.optInt("subdivision", 1), IntArray(a.length()) { a.getInt(it) }, f.optString("name"))
            }.toMutableList()
        }.getOrElse { mutableListOf() }
    }

    /** The 1.8 favorites, as JSON, written once without a time (data from before the account: the cloud wins if it has some). */
    private fun migrateFavorites(): String? {
        val old = getPreferences(MODE_PRIVATE)
        val list = old.getString("favorites", "")!!.split(";").filter { it.isNotBlank() }.mapNotNull { Favorite.decode(it) }
        if (list.isEmpty()) return null
        val json = favoritesJson(list)
        musica.edit().putString(FAVORITES_KEY, json).apply()
        return json
    }

    /** "active" stays -1: there is no "being in" a favorite any more (picking one only loads it). Kept for the readers of the format. */
    private fun favoritesJson(list: List<Favorite>): String {
        val items = org.json.JSONArray()
        list.forEach { f ->
            // The site keeps the 12 accents (MAX_BEATS) of every favorite.
            val acc = IntArray(Metronome.MAX_BEATS) { i -> f.accents.getOrElse(i) { if (i == 0) Tick.ACCENT else Tick.BEAT } }
            items.put(org.json.JSONObject().put("bpm", f.bpm).put("beatsPerBar", f.beats).put("subdivision", f.sub)
                .put("accents", org.json.JSONArray(acc.toList())).put("name", f.name))
        }
        return org.json.JSONObject().put("version", 1).put("items", items).put("active", -1).toString()
    }

    private fun saveFavorites(list: List<Favorite>) =
        br.musica.marmota.common.Conta.gravarLocal(musica, "metronomo-favoritos", favoritesJson(list.take(MAX_FAVORITES)))

    private fun current(name: String = "") =
        Favorite(metronome.bpm.roundToInt(), metronome.beatsPerBar, metronome.subdivision, metronome.accentList(), name)

    private fun describe(f: Favorite) = getString(
        R.string.favorite_desc, f.bpm,
        resources.getQuantityString(R.plurals.beats_short, f.beats, f.beats),
        subdivisionName(f.sub),
    )

    /** Loads favorite [f] into the metronome. Only that: changing the metronome afterwards doesn't change the favorite. */
    private fun loadFavorite(f: Favorite) {
        metronome.beatsPerBar = f.beats
        metronome.subdivision = f.sub
        metronome.restoreAccents(f.accents)
        setBpm(f.bpm)
        refreshBeats(); refreshFigure()
    }

    private fun iconButton(icon: Drawable, description: String, onClick: () -> Unit) = ImageView(this).apply {
        setImageDrawable(icon)
        scaleType = ImageView.ScaleType.CENTER
        contentDescription = description
        background = ripple()
        isClickable = true
        setOnClickListener { onClick() }
    }

    /**
     * The favorites list (the website's MetroFavorites): tapping one loads it; the pencil opens the editor, the bin deletes.
     * "Reordenar" on top swaps the pencil and the bin for a grip: drag the rows into any order. "Salvar o atual" at the end
     * opens the editor with what is playing now.
     */
    private fun showFavorites() {
        val body = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        var reordering = false
        val reorder = TextView(this).apply {
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dp(14), 0, dp(14), 0)
            foreground = ripple()
            isClickable = true
        }
        lateinit var dialog: Dialog
        fun fill() {
            body.removeAllViews()
            val list = readFavorites()
            reorder.visibility = if (list.size > 1) View.VISIBLE else View.GONE
            if (list.size < 2) reordering = false
            reorder.text = getString(if (reordering) R.string.reorder_done else R.string.reorder)
            reorder.setTextColor(if (reordering) Paleta.selected else Paleta.ink)
            reorder.background = GradientDrawable().apply { cornerRadius = dpf(18f); setStroke(dp(1), if (reordering) Paleta.selected else Paleta.line) }
            if (list.isEmpty()) body.addView(TextView(this).apply {
                text = getString(R.string.favorites_empty)
                textSize = 14f
                setTextColor(Paleta.muted)
                setPadding(dp(4), 0, dp(4), dp(8))
            })
            val rows = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            val scroll = ScrollView(this).apply { addView(rows) }
            list.forEachIndexed { i, f ->
                val label = f.name.ifEmpty { describe(f) }
                val row = LinearLayout(this).apply {
                    gravity = Gravity.CENTER_VERTICAL
                    background = GradientDrawable().apply { cornerRadius = dpf(14f); setColor(Paleta.soft) }
                }
                // With a name: the name, and the settings smaller below it. Without: the settings.
                val item = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER_VERTICAL
                    minimumHeight = dp(52)
                    setPadding(dp(12), dp(6), dp(12), dp(6))
                    contentDescription = if (f.name.isEmpty()) describe(f) else "${f.name}, ${describe(f)}"
                    if (!reordering) {
                        foreground = ripple()
                        isClickable = true
                        setOnClickListener { loadFavorite(f); dialog.dismiss() }
                    }
                }
                item.addView(TextView(this).apply {
                    text = label
                    textSize = 16f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(Paleta.ink)
                })
                if (f.name.isNotEmpty()) item.addView(TextView(this).apply {
                    text = describe(f)
                    textSize = 13f
                    setTextColor(Paleta.muted)
                })
                row.addView(item, LinearLayout.LayoutParams(0, -2, 1f))
                if (reordering) {
                    row.addView(ImageView(this).apply {
                        setImageDrawable(GripDrawable(Paleta.ink, dpf(1.8f), dpf(20f)))
                        scaleType = ImageView.ScaleType.CENTER
                        contentDescription = getString(R.string.drag_favorite, label)
                        setOnTouchListener(dragRows(rows, scroll) { a, b ->
                            saveFavorites(readFavorites().also { l -> l.add(b, l.removeAt(a)) })
                            fill()
                        })
                    }, LinearLayout.LayoutParams(dp(48), dp(48)))
                } else {
                    row.addView(iconButton(PencilDrawable(Paleta.muted, dpf(1.8f), dpf(18f)), getString(R.string.edit_favorite, label)) {
                        showFavoriteEditor(i) { fill() }
                    }, LinearLayout.LayoutParams(dp(48), dp(48)))
                    row.addView(iconButton(TrashDrawable(Paleta.muted, dpf(1.8f), dpf(18f)), getString(R.string.delete_favorite, label)) {
                        saveFavorites(readFavorites().also { it.removeAt(i) })
                        fill()
                    }, LinearLayout.LayoutParams(dp(48), dp(48)))
                }
                rows.addView(row, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(4) })
            }
            body.addView(scroll, LinearLayout.LayoutParams(-1, -2, 1f))
            if (!reordering) body.addView(pill(getString(R.string.save_current)).apply { setOnClickListener { showFavoriteEditor(null) { fill() } } },
                LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(8) })
        }
        reorder.setOnClickListener { reordering = !reordering; fill() }
        fill()
        dialog = sheet(getString(R.string.favorites), body, reorder)
    }

    /**
     * Dragging a row by its grip: the row follows the finger and the rows it passes slide one place the other way. On
     * release, [moved] gets where it started and where it landed. The views stay where they are while the finger is down
     * (taking the touched row out of the layout would cancel the gesture).
     */
    private fun dragRows(rows: LinearLayout, scroll: ScrollView, moved: (Int, Int) -> Unit) = object : View.OnTouchListener {
        var downY = 0f
        var from = 0
        var to = 0
        override fun onTouch(v: View, e: android.view.MotionEvent): Boolean {
            val row = v.parent as View
            val step = row.height + dp(4)
            when (e.actionMasked) {
                android.view.MotionEvent.ACTION_DOWN -> {
                    scroll.requestDisallowInterceptTouchEvent(true)
                    downY = e.rawY
                    from = rows.indexOfChild(row); to = from
                    row.elevation = dpf(6f)
                    v.performHapticFeedback(android.view.HapticFeedbackConstants.LONG_PRESS)
                }
                android.view.MotionEvent.ACTION_MOVE -> {
                    val dy = e.rawY - downY
                    row.translationY = dy
                    val now = (from + (dy / step).roundToInt()).coerceIn(0, rows.childCount - 1)
                    if (now != to) { to = now; v.performHapticFeedback(android.view.HapticFeedbackConstants.CLOCK_TICK) }
                    for (k in 0 until rows.childCount) {
                        val other = rows.getChildAt(k)
                        if (other === row) continue
                        other.translationY = when {
                            k in (from + 1)..to -> -step.toFloat()
                            k in to until from -> step.toFloat()
                            else -> 0f
                        }
                    }
                }
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL -> {
                    for (k in 0 until rows.childCount) rows.getChildAt(k).translationY = 0f
                    row.elevation = 0f
                    // After this touch is done: [moved] rebuilds the list.
                    if (to != from) { val a = from; val b = to; rows.post { moved(a, b) } }
                }
            }
            return true
        }
    }

    /**
     * Editing (or creating, [index] null: from what is playing now) a favorite: the name first, then the beats, the tempo
     * and the figure as drums, and Cancelar / Salvar at the end. The accents are kept. [done] runs after saving.
     */
    private fun showFavoriteEditor(index: Int?, done: () -> Unit) {
        val f = index?.let { readFavorites().getOrNull(it) } ?: current()
        val body = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val name = EditText(this).apply {
            setText(if (index == null) "" else f.name)
            hint = getString(R.string.favorite_name_hint)
            setHintTextColor(Paleta.muted)
            setTextColor(Paleta.ink)
            textSize = 16f
            isSingleLine = true
            imeOptions = EditorInfo.IME_ACTION_DONE
            filters = arrayOf(InputFilter.LengthFilter(40))
            background = GradientDrawable().apply { cornerRadius = dpf(14f); setStroke(dp(1), Paleta.line) }
            setPadding(dp(16), 0, dp(16), 0)
        }
        body.addView(name, LinearLayout.LayoutParams(-1, dp(52)))
        val subs = Subdivisions.all
        val beats = BpmWheel(this, 1, Metronome.MAX_BEATS, 0.6f) { resources.getQuantityString(R.plurals.beats_short, it, it) }.apply { set(f.beats) }
        val bpm = BpmWheel(this, Metronome.MIN_BPM.toInt(), Metronome.MAX_BPM.toInt(), 0.6f).apply { set(f.bpm) }
        val sub = BpmWheel(this, 0, subs.size - 1, 0.5f, format = { subdivisionName(subs[it].id) }) { subdivisionName(subs[it].id) }
            .apply { set(subs.indexOfFirst { it.id == f.sub }.coerceAtLeast(0)) }
        val wheels = LinearLayout(this).apply { setPadding(0, dp(16), 0, 0) }
        fun column(title: String, wheel: View, width: Int, weight: Float) {
            val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
            col.addView(TextView(this).apply {
                text = title
                textSize = 14f
                gravity = Gravity.CENTER
                setTextColor(Paleta.muted)
                importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
            }, LinearLayout.LayoutParams(-1, -2))
            col.addView(wheel, LinearLayout.LayoutParams(-1, dp(170)))
            wheels.addView(col, LinearLayout.LayoutParams(width, -2, weight).apply { marginEnd = dp(8) })
        }
        column(getString(R.string.fav_beats), beats, dp(64), 0f)
        column(getString(R.string.bpm), bpm, dp(92), 0f)
        column(getString(R.string.fav_subdivision), sub, 0, 1f)
        body.addView(wheels, LinearLayout.LayoutParams(-1, -2))
        lateinit var dialog: Dialog
        val actions = LinearLayout(this).apply { setPadding(0, dp(16), 0, 0) }
        actions.addView(pill(getString(R.string.cancel)).apply { setOnClickListener { dialog.dismiss() } },
            LinearLayout.LayoutParams(0, dp(52), 1f).apply { marginEnd = dp(8) })
        actions.addView(pill(getString(R.string.save), filled = true).apply {
            setOnClickListener {
                val fav = Favorite(bpm.value, beats.value, subs[sub.value].id, f.accents, name.text.toString().trim().take(40))
                val list = readFavorites()
                if (index == null) list.add(0, fav) else if (index in list.indices) list[index] = fav
                saveFavorites(list)
                done()
                dialog.dismiss()
            }
        }, LinearLayout.LayoutParams(0, dp(52), 1f))
        body.addView(actions, LinearLayout.LayoutParams(-1, -2))
        dialog = sheet(getString(if (index == null) R.string.favorite_new else R.string.favorite_edit), body)
    }

    // ---- A dialog in the app's look: dark rounded card, title, content, close.

    /** [action]: an optional control in the header, before the close (the favorites' "Reordenar"). */
    private fun sheet(title: String, content: View, action: View? = null): Dialog {
        val d = Dialog(this)
        d.requestWindowFeature(Window.FEATURE_NO_TITLE)
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(16))
            background = GradientDrawable().apply { cornerRadius = dpf(22f); setColor(Paleta.soft) }
        }
        val head = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        head.addView(TextView(this).apply {
            text = title
            textSize = 19f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Paleta.ink)
            isFocusable = true
        }, LinearLayout.LayoutParams(0, -2, 1f))
        action?.let { head.addView(it, LinearLayout.LayoutParams(-2, dp(36)).apply { marginEnd = dp(4) }) }
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

    /** The big button: plays (or resumes); while playing, pauses with a timer, stops without. */
    private fun mainAction() {
        when {
            !playing -> start()
            seconds > 0 -> pause()
            else -> stop()
        }
    }

    private fun start() {
        if (playing) return
        playing = true
        timerDone = false
        val ms = if (seconds > 0) (if (pausedLeft > 0) pausedLeft else seconds * 1000L) else 0L
        pausedLeft = 0L
        deadline = if (ms > 0) SystemClock.elapsedRealtime() + ms else 0L
        if (deadline > 0) main.post(timerTick)
        refreshTransport()
        audioThread = Thread(::audioLoop, "metronome").apply { priority = Thread.MAX_PRIORITY; start() }
    }

    /** Stops the sound but keeps what is left of the timer. */
    private fun pause() {
        if (!playing) return
        val left = (deadline - SystemClock.elapsedRealtime()).coerceAtLeast(1)
        silence()
        pausedLeft = if (seconds > 0) left else 0L
        refreshTransport()
    }

    /** Stops and resets the timer. */
    private fun stop() {
        silence()
        pausedLeft = 0L
        if (::playButton.isInitialized) refreshTransport()
    }

    private fun silence() {
        playing = false
        audioThread?.join(500)
        audioThread = null
        deadline = 0L
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
        const val MAX_TIMER = 99 * 60 + 59
        const val MAX_FAVORITES = 30
        const val FAVORITES_KEY = "musica:metronomo-favoritos"
    }
}

/** A five-point star, for the favorites button: outlined, or filled while in a favorite. */
private class StarDrawable(color: Int, strokePx: Float, filled: Boolean = false) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = if (filled) Paint.Style.FILL_AND_STROKE else Paint.Style.STROKE; strokeWidth = strokePx; strokeJoin = Paint.Join.ROUND
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

/** A drawn pencil, for renaming a favorite (same shape as the site's). */
private class PencilDrawable(color: Int, strokePx: Float, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        // The site's 24-unit path: M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4, scaled into the bounds.
        val k = size / 24f
        val x0 = bounds.exactCenterX() - size / 2
        val y0 = bounds.exactCenterY() - size / 2
        fun x(v: Float) = x0 + v * k
        fun y(v: Float) = y0 + v * k
        val body = Path().apply {
            moveTo(x(4f), y(20f)); lineTo(x(8f), y(20f)); lineTo(x(19f), y(9f)); lineTo(x(15f), y(5f)); lineTo(x(4f), y(16f)); close()
        }
        canvas.drawPath(body, paint)
        canvas.drawLine(x(13.5f), y(6.5f), x(17.5f), y(10.5f), paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/** A bin, for deleting a favorite: the site's 24-unit path M4 7h16 M10 7V4.5h4V7 M6.5 7l1 12.5h9l1-12.5 M10 11v5 M14 11v5. */
private class TrashDrawable(color: Int, strokePx: Float, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        val k = size / 24f
        val x0 = bounds.exactCenterX() - size / 2
        val y0 = bounds.exactCenterY() - size / 2
        fun x(v: Float) = x0 + v * k
        fun y(v: Float) = y0 + v * k
        canvas.drawLine(x(4f), y(7f), x(20f), y(7f), paint)
        canvas.drawPath(Path().apply { moveTo(x(10f), y(7f)); lineTo(x(10f), y(4.5f)); lineTo(x(14f), y(4.5f)); lineTo(x(14f), y(7f)) }, paint)
        canvas.drawPath(Path().apply { moveTo(x(6.5f), y(7f)); lineTo(x(7.5f), y(19.5f)); lineTo(x(16.5f), y(19.5f)); lineTo(x(17.5f), y(7f)) }, paint)
        canvas.drawLine(x(10f), y(11f), x(10f), y(16f), paint)
        canvas.drawLine(x(14f), y(11f), x(14f), y(16f), paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/** Three lines, the grip for dragging a favorite while reordering (the site's M5 8h14M5 12h14M5 16h14). */
private class GripDrawable(color: Int, strokePx: Float, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeCap = Paint.Cap.ROUND }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        val k = size / 24f
        val x0 = bounds.exactCenterX() - size / 2
        val y0 = bounds.exactCenterY() - size / 2
        for (y in listOf(8f, 12f, 16f)) canvas.drawLine(x0 + 5 * k, y0 + y * k, x0 + 19 * k, y0 + y * k, paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/** A drawn ×, for close and delete. */
/** The check of the "save name" button: the site's 24-unit path M5 12.5l4.5 4.5L19 7.5, in the same thin line. */
private class CheckDrawable(color: Int, strokePx: Float, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = strokePx; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        val k = size / 24f
        val x0 = bounds.exactCenterX() - size / 2
        val y0 = bounds.exactCenterY() - size / 2
        canvas.drawPath(Path().apply {
            moveTo(x0 + 5f * k, y0 + 12.5f * k); lineTo(x0 + 9.5f * k, y0 + 17f * k); lineTo(x0 + 19f * k, y0 + 7.5f * k)
        }, paint)
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT
}

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

/** Filled transport icons, the same on every player: ▶ play, ❚❚ pause, ■ stop. */
private class TransportDrawable(private val kind: Int, color: Int, private val size: Float) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color; style = Paint.Style.FILL }

    override fun getIntrinsicWidth() = size.toInt()
    override fun getIntrinsicHeight() = size.toInt()

    override fun draw(canvas: Canvas) {
        // Drawn on a 24-unit grid, like the site's SVG.
        val u = size / 24f
        canvas.save()
        canvas.translate(bounds.exactCenterX() - size / 2, bounds.exactCenterY() - size / 2)
        canvas.scale(u, u)
        when (kind) {
            PLAY -> canvas.drawPath(Path().apply { moveTo(8f, 4.6f); lineTo(20f, 12f); lineTo(8f, 19.4f); close() }, paint)
            PAUSE -> {
                canvas.drawRoundRect(6.5f, 5f, 10.5f, 19f, 1f, 1f, paint)
                canvas.drawRoundRect(13.5f, 5f, 17.5f, 19f, 1f, 1f, paint)
            }
            else -> canvas.drawRoundRect(6f, 6f, 18f, 18f, 1.6f, 1.6f, paint)
        }
        canvas.restore()
    }

    override fun setAlpha(alpha: Int) { paint.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT

    companion object {
        const val PLAY = 0
        const val PAUSE = 1
        const val STOP = 2
    }
}
