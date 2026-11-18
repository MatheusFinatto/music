package br.musica.marmotatuner

import android.content.Context
import android.graphics.Canvas
import android.os.SystemClock
import android.view.View

/**
 * The single tuner screen. Call [show] with every smoothed reading; the needle animates on its own.
 *
 * Example: `tunerView.show(NoteMapper.readingFromMidi(midi), level = 0.6f)`
 */
class TunerView(context: Context) : View(context) {
    private val painter = TunerPainter(context)
    private val needle = NeedleAnimator()
    private val scene = TunerScene().apply { message = context.getString(R.string.play_a_string) }

    init {
        setBackgroundColor(context.getColor(R.color.tuner_background))
    }

    /** [reading] null means silence: the last note stays dimmed and the needle rests at the center. */
    fun show(reading: NoteReading?, level: Float) {
        scene.active = reading != null
        scene.level = level
        if (reading != null) {
            scene.reading = reading
            scene.message = null
        }
        needle.target = reading?.cents ?: 0f
        postInvalidateOnAnimation()
    }

    /** Replaces the frequency line with a notice, e.g. when the mic isn't allowed. */
    fun showMessage(text: String) {
        scene.message = text
        scene.active = false
        scene.level = 0f
        needle.target = 0f
        postInvalidateOnAnimation()
    }

    // Recomputed on every layout pass (not just onSizeChanged) because system-bar insets
    // arrive as padding, and a padding change doesn't change the view's size.
    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        val box = Box(
            paddingLeft.toFloat(), paddingTop.toFloat(),
            (width - paddingRight).toFloat(), (height - paddingBottom).toFloat(),
        )
        painter.onLayout(TunerGeometry.compute(box, resources.displayMetrics.density))
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val stillMoving = needle.step(SystemClock.uptimeMillis())
        scene.needleCents = needle.position
        painter.draw(canvas, scene)
        if (stillMoving) postInvalidateOnAnimation()
    }
}
