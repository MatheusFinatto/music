package br.musica.marmotatuner

import android.content.Context
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.util.TypedValue
import java.util.Locale
import kotlin.math.cos
import kotlin.math.sin

/** What the screen shows right now. Owned by [TunerView]; mutated in place to avoid allocating per frame. */
class TunerScene {
    /** Last note heard. Kept (dimmed) after the string stops ringing. */
    var reading: NoteReading? = null
    var active: Boolean = false
    var level: Float = 0f
    var message: String? = null
    var needleCents: Float = 0f
}

/**
 * Draws the tuner: note + octave, frequency, dial with ♭/♯ ends, needle, pivot, note strip, mic level.
 *
 * Colors follow the site's rule (docs/PREFERENCIAS.md): orange = the target (the note to tune to and
 * the dial's center), blue = what is sounding now (the needle and the mic level). The needle turns green in tune.
 */
class TunerPainter(context: Context) {
    private val metrics = context.resources.displayMetrics
    private val ink = context.getColor(R.color.tuner_ink)
    private val muted = context.getColor(R.color.tuner_muted)
    private val target = context.getColor(R.color.tuner_target)
    private val now = context.getColor(R.color.tuner_now)
    private val inTune = context.getColor(R.color.tuner_in_tune)

    private val notePaint = textPaint(target, Paint.Align.CENTER, Typeface.create("sans-serif-light", Typeface.NORMAL))
    private val octavePaint = textPaint(target, Paint.Align.LEFT, Typeface.create("sans-serif", Typeface.NORMAL))
    private val frequencyPaint = textPaint(ink, Paint.Align.CENTER, Typeface.DEFAULT).apply { textSize = sp(15f) }
    private val symbolPaint = textPaint(muted, Paint.Align.CENTER, Typeface.DEFAULT).apply { textSize = sp(22f) }
    private val stripPaint = textPaint(muted, Paint.Align.CENTER, Typeface.DEFAULT).apply { textSize = sp(15f) }
    private val stripActivePaint = textPaint(ink, Paint.Align.CENTER, Typeface.DEFAULT_BOLD).apply { textSize = sp(15f) }
    private val tickPaint = strokePaint(muted, 2f)
    private val targetTickPaint = strokePaint(target, 2.5f)
    private val tolerancePaint = strokePaint(inTune, 3f).apply { alpha = 70; strokeCap = Paint.Cap.BUTT }
    private val needlePaint = strokePaint(now, 3f)
    private val pivotRingPaint = strokePaint(muted, 1.5f).apply { alpha = 150 }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    private var geometry: TunerGeometry? = null
    private var needleShaders: Map<Int, Shader> = emptyMap()
    private val toleranceOval = RectF()
    private val scratchRect = RectF()
    private var flatX = 0f
    private var sharpX = 0f
    private var symbolY = 0f

    fun onLayout(g: TunerGeometry) {
        geometry = g
        notePaint.textSize = g.noteTextSize
        octavePaint.textSize = g.noteTextSize * 0.28f
        needleShaders = listOf(now, inTune, muted).associateWith { fadingNeedle(g, it) }
        val ringRadius = g.radius + 10 * g.dp
        toleranceOval.set(g.centerX - ringRadius, g.pivotY - ringRadius, g.centerX + ringRadius, g.pivotY + ringRadius)
        placeSymbols(g)
    }

    fun draw(canvas: Canvas, scene: TunerScene) {
        val g = geometry ?: return
        drawNoteName(canvas, g, scene)
        drawFrequency(canvas, g, scene)
        drawDial(canvas, g)
        drawNeedle(canvas, g, scene)
        drawStrip(canvas, g, scene)
        drawMeter(canvas, g, scene)
    }

    private fun drawNoteName(canvas: Canvas, g: TunerGeometry, scene: TunerScene) {
        val reading = scene.reading ?: return
        val alpha = if (scene.active) OPAQUE else IDLE_ALPHA
        notePaint.alpha = alpha
        octavePaint.alpha = alpha
        val name = reading.name
        canvas.drawText(name, g.centerX, g.noteBaseline, notePaint)
        val octaveX = g.centerX + notePaint.measureText(name) / 2 + 3 * g.dp
        canvas.drawText(reading.octave.toString(), octaveX, g.noteBaseline + g.noteTextSize * 0.06f, octavePaint)
    }

    private fun drawFrequency(canvas: Canvas, g: TunerGeometry, scene: TunerScene) {
        val reading = scene.reading
        val text = scene.message ?: reading?.let { String.format(PT_BR, "%.1f Hz", it.frequencyHz) } ?: return
        frequencyPaint.alpha = if (scene.active || scene.message != null) OPAQUE else IDLE_ALPHA
        canvas.drawText(text, g.centerX, g.frequencyBaseline, frequencyPaint)
    }

    private fun drawDial(canvas: Canvas, g: TunerGeometry) {
        val toleranceDegrees = g.angleForCents(NoteReading.IN_TUNE_CENTS)
        canvas.drawArc(toleranceOval, -90f - toleranceDegrees, 2 * toleranceDegrees, false, tolerancePaint)
        for (cents in -50..50 step 10) drawTick(canvas, g, cents)
        canvas.drawText(FLAT, flatX, symbolY, symbolPaint)
        canvas.drawText(SHARP, sharpX, symbolY, symbolPaint)
    }

    /** Ticks every 10 cents; the center is a double orange line like the reference screenshot. */
    private fun drawTick(canvas: Canvas, g: TunerGeometry, cents: Int) {
        val top = g.pivotY - g.radius
        val isEnd = cents == -50 || cents == 50
        val length = (if (cents == 0 || isEnd) 30 else 22) * g.dp
        canvas.save()
        canvas.rotate(g.angleForCents(cents.toFloat()), g.centerX, g.pivotY)
        if (cents == 0) {
            val half = 3.5f * g.dp
            canvas.drawLine(g.centerX - half, top, g.centerX - half, top + length, targetTickPaint)
            canvas.drawLine(g.centerX + half, top, g.centerX + half, top + length, targetTickPaint)
        } else {
            canvas.drawLine(g.centerX, top, g.centerX, top + length, tickPaint)
        }
        canvas.restore()
    }

    private fun drawNeedle(canvas: Canvas, g: TunerGeometry, scene: TunerScene) {
        val color = needleColor(scene)
        needlePaint.shader = needleShaders[color]
        canvas.save()
        canvas.rotate(g.angleForCents(scene.needleCents), g.centerX, g.pivotY)
        canvas.drawLine(g.centerX, g.pivotY, g.centerX, g.pivotY - g.radius + 6 * g.dp, needlePaint)
        canvas.restore()
        canvas.drawCircle(g.centerX, g.pivotY, 30 * g.dp, pivotRingPaint)
        fillPaint.color = color
        canvas.drawCircle(g.centerX, g.pivotY, 5 * g.dp, fillPaint)
    }

    private fun needleColor(scene: TunerScene): Int = when {
        !scene.active -> muted
        scene.reading?.isInTune == true -> inTune
        else -> now
    }

    /** Notes A to G#, like the reference; the current note is bright with an orange mark under it. */
    private fun drawStrip(canvas: Canvas, g: TunerGeometry, scene: TunerScene) {
        val current = scene.reading?.pitchClass
        STRIP_ORDER.forEachIndexed { index, pitchClass ->
            val x = g.stripLeft + g.stripCellWidth * (index + 0.5f)
            val isCurrent = pitchClass == current
            canvas.drawText(NoteReading.NOTE_NAMES[pitchClass], x, g.stripBaseline, if (isCurrent) stripActivePaint else stripPaint)
            if (isCurrent) drawStripMark(canvas, g, x, scene.active)
        }
    }

    private fun drawStripMark(canvas: Canvas, g: TunerGeometry, x: Float, active: Boolean) {
        fillPaint.color = target
        fillPaint.alpha = if (active) OPAQUE else IDLE_ALPHA
        scratchRect.set(x - 1.5f * g.dp, g.stripBaseline + 9 * g.dp, x + 1.5f * g.dp, g.stripBaseline + 19 * g.dp)
        canvas.drawRoundRect(scratchRect, g.dp, g.dp, fillPaint)
    }

    /** Small mic outline plus a vertical bar filling from the bottom with the input level. */
    private fun drawMeter(canvas: Canvas, g: TunerGeometry, scene: TunerScene) {
        val barLeft = g.meterRight - 4 * g.dp
        val barBottom = g.meterTop + 24 * g.dp
        scratchRect.set(barLeft - 20 * g.dp, g.meterTop + 2 * g.dp, barLeft - 10 * g.dp, g.meterTop + 17 * g.dp)
        canvas.drawRoundRect(scratchRect, 5 * g.dp, 5 * g.dp, pivotRingPaint)
        canvas.drawLine(scratchRect.centerX(), scratchRect.bottom + 2 * g.dp, scratchRect.centerX(), barBottom, pivotRingPaint)
        fillPaint.color = muted
        fillPaint.alpha = 60
        scratchRect.set(barLeft, g.meterTop, g.meterRight, barBottom)
        canvas.drawRoundRect(scratchRect, 2 * g.dp, 2 * g.dp, fillPaint)
        fillPaint.color = now
        scratchRect.top = barBottom - (barBottom - g.meterTop) * scene.level
        canvas.drawRoundRect(scratchRect, 2 * g.dp, 2 * g.dp, fillPaint)
    }

    /** Solid near the pivot, fading toward the tip, like the reference screenshot. Coordinates are pre-rotation. */
    private fun fadingNeedle(g: TunerGeometry, color: Int): Shader {
        val faded = (color and 0x00FFFFFF) or (0x30 shl 24)
        return LinearGradient(0f, g.pivotY, 0f, g.pivotY - g.radius, color, faded, Shader.TileMode.CLAMP)
    }

    private fun placeSymbols(g: TunerGeometry) {
        val edge = Math.toRadians(g.maxAngleDegrees.toDouble())
        val reach = (g.radius * sin(edge)).toFloat() + 22 * g.dp
        flatX = g.centerX - reach
        sharpX = g.centerX + reach
        symbolY = g.pivotY - (g.radius * cos(edge)).toFloat() + 22 * g.dp
    }

    private fun textPaint(color: Int, align: Paint.Align, typeface: Typeface) =
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            textAlign = align
            this.typeface = typeface
        }

    private fun strokePaint(color: Int, widthDp: Float) =
        Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            style = Paint.Style.STROKE
            strokeWidth = widthDp * metrics.density
            strokeCap = Paint.Cap.ROUND
        }

    private fun sp(value: Float): Float = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, value, metrics)

    private companion object {
        val PT_BR: Locale = Locale.forLanguageTag("pt-BR")
        val STRIP_ORDER = listOf(9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8)
        const val FLAT = "♭"
        const val SHARP = "♯"
        const val OPAQUE = 255
        const val IDLE_ALPHA = 90
    }
}
