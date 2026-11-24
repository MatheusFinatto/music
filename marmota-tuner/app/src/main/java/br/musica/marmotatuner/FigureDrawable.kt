package br.musica.marmotatuner

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable

/**
 * The rhythm figure of one beat (quarter, eighths, triplet…), drawn from the notes core describes.
 * Same measurements as the site (src/tools/metronomo/Figure.tsx): change one, change the other.
 * Units are the site's SVG units; [unit] is how many pixels one of them takes.
 */
class FigureDrawable(private val subdivision: Subdivision, color: Int, private val unit: Float) : Drawable() {
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color; style = Paint.Style.FILL }
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; style = Paint.Style.STROKE; strokeWidth = 1.6f * unit; strokeCap = Paint.Cap.ROUND
    }
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color; textSize = 9f * unit; textAlign = Paint.Align.CENTER; isFakeBoldText = true
    }
    private val notes = subdivision.notes
    private val xs = FloatArray(notes.size).also { xs ->
        for (i in notes.indices) xs[i] = if (i == 0) PAD + 5 else xs[i - 1] + STEP + if (notes[i - 1].dotted) DOT_ROOM else 0f
    }
    private val widthUnits = xs.last() + 5 + PAD + (if (notes.last().dotted) DOT_ROOM else 0f) + 4

    override fun getIntrinsicWidth() = (widthUnits * unit).toInt()
    override fun getIntrinsicHeight() = (HEIGHT * unit).toInt()

    override fun draw(canvas: Canvas) {
        canvas.save()
        // Centered in the bounds, in SVG units from here on.
        canvas.translate(bounds.exactCenterX() - widthUnits * unit / 2, bounds.exactCenterY() - HEIGHT * unit / 2)
        canvas.scale(unit, unit)
        stroke.strokeWidth = 1.6f
        text.textSize = 9f
        val n = notes.size
        fun stem(i: Int) = xs[i] + 4.6f
        val beamed = n > 1 && notes.all { it.beams > 0 }
        if (subdivision.tuplet > 0) canvas.drawText(subdivision.tuplet.toString(), (stem(0) + stem(n - 1)) / 2, 8f, text)
        val oval = RectF()
        for (i in 0 until n) {
            val x = xs[i]
            canvas.save()
            canvas.rotate(-22f, x, HEAD_Y)
            oval.set(x - 5.2f, HEAD_Y - 3.8f, x + 5.2f, HEAD_Y + 3.8f)
            canvas.drawOval(oval, fill)
            canvas.restore()
            canvas.drawLine(stem(i), HEAD_Y - 1, stem(i), STEM_TOP, stroke)
            if (notes[i].dotted) canvas.drawCircle(x + 8.5f, HEAD_Y - 1, 1.6f, fill)
            if (!beamed && notes[i].beams > 0) {
                val flag = Path().apply { moveTo(stem(i), STEM_TOP); rCubicTo(0f, 6f, 7f, 6.5f, 5.5f, 14.5f) }
                canvas.drawPath(flag, stroke)
            }
        }
        if (beamed) {
            beam(canvas, stem(0), stem(n - 1), STEM_TOP)
            val y = STEM_TOP + BEAM_GAP
            for (i in 0 until n) {
                if (notes[i].beams < 2) continue
                if (i + 1 < n && notes[i + 1].beams == 2) beam(canvas, stem(i), stem(i + 1), y)
                else if (i == 0 || notes[i - 1].beams < 2) {
                    // A lone sixteenth: half a beam, pointing into the group.
                    if (i < n - 1) beam(canvas, stem(i), stem(i) + STUB, y) else beam(canvas, stem(i) - STUB, stem(i), y)
                }
            }
        }
        canvas.restore()
    }

    private fun beam(canvas: Canvas, x1: Float, x2: Float, y: Float) = canvas.drawRect(x1 - 0.8f, y, x2 + 0.8f, y + BEAM, fill)

    override fun setAlpha(alpha: Int) { fill.alpha = alpha; stroke.alpha = alpha; text.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { fill.colorFilter = colorFilter; stroke.colorFilter = colorFilter; text.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.TRANSLUCENT

    private companion object {
        const val STEP = 15f
        const val PAD = 8f
        const val HEAD_Y = 34f
        const val STEM_TOP = 12f
        const val BEAM = 3.6f
        const val BEAM_GAP = 5.5f
        const val STUB = 6f
        const val HEIGHT = 44f
        const val DOT_ROOM = 6f
    }
}
