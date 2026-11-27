package br.musica.marmotatuner

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.OverScroller
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.roundToInt
import br.musica.marmota.common.Paleta

/**
 * The tempo as a vertical drum of numbers: drag or fling it, and it settles on a whole bpm. The numbers grow
 * downward, so dragging up speeds up. Tapping the number above or below moves one step. Each new number
 * ticks the phone's haptics, like a real wheel. Screen readers get scroll actions (one bpm each).
 * The timer's minutes and seconds use the same drum, smaller ([scale]) and with two digits ([pad]).
 */
class BpmWheel(
    context: Context,
    private val min: Int,
    private val max: Int,
    private val scale: Float = 1f,
    private val pad: Boolean = false,
    private val describe: ((Int) -> String)? = null,
) : View(context) {
    /** Called with each new whole bpm, while it moves. */
    var onChange: ((Int) -> Unit)? = null

    private val density = resources.displayMetrics.density
    private val itemHeight = 76 * density * scale
    private val scroller = OverScroller(context)
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private val minFling = ViewConfiguration.get(context).scaledMinimumFlingVelocity
    private var velocity: VelocityTracker? = null
    private var downY = 0f
    private var lastY = 0f
    private var dragging = false

    /** Position in pixels: value × itemHeight. */
    private var offset = 90 * itemHeight
    private var shown = 90

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        color = Paleta.ink
    }

    init {
        isFocusable = true
        isHapticFeedbackEnabled = true
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
        updateDescription()
    }

    val value: Int get() = shown

    /** Jumps to [bpm] without animation and without calling [onChange]. */
    fun set(bpm: Int) {
        scroller.forceFinished(true)
        offset = bpm.coerceIn(min, max) * itemHeight
        shown = bpm.coerceIn(min, max)
        updateDescription()
        invalidate()
    }

    private fun moveTo(px: Float) {
        offset = px.coerceIn(min * itemHeight, max * itemHeight)
        val v = (offset / itemHeight).roundToInt()
        if (v != shown) {
            shown = v
            performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
            updateDescription()
            onChange?.invoke(v)
        }
        invalidate()
    }

    private fun settle(to: Int) {
        scroller.forceFinished(true)
        scroller.startScroll(0, offset.roundToInt(), 0, (to.coerceIn(min, max) * itemHeight - offset).roundToInt(), 220)
        postInvalidateOnAnimation()
    }

    override fun computeScroll() {
        if (!scroller.computeScrollOffset()) return
        moveTo(scroller.currY.toFloat())
        if (scroller.isFinished) {
            // A fling ends wherever it ends; snap to the nearest whole number.
            val snapped = (offset / itemHeight).roundToInt() * itemHeight
            if (abs(snapped - offset) > 0.5f) settle((offset / itemHeight).roundToInt())
        } else postInvalidateOnAnimation()
    }

    override fun onTouchEvent(e: MotionEvent): Boolean {
        if (velocity == null) velocity = VelocityTracker.obtain()
        velocity!!.addMovement(e)
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                scroller.forceFinished(true)
                parent?.requestDisallowInterceptTouchEvent(true)
                downY = e.y; lastY = e.y; dragging = false
            }
            MotionEvent.ACTION_MOVE -> {
                if (!dragging && abs(e.y - downY) > touchSlop) dragging = true
                if (dragging) moveTo(offset - (e.y - lastY))
                lastY = e.y
            }
            MotionEvent.ACTION_UP -> {
                if (dragging) {
                    moveTo(offset - (e.y - lastY))
                    velocity!!.computeCurrentVelocity(1000)
                    val vy = velocity!!.yVelocity
                    if (abs(vy) > minFling) {
                        scroller.fling(0, offset.roundToInt(), 0, -vy.roundToInt(), 0, 0, (min * itemHeight).toInt(), (max * itemHeight).toInt())
                        postInvalidateOnAnimation()
                    } else settle((offset / itemHeight).roundToInt())
                } else {
                    // A tap: above the middle number goes one down, below goes one up.
                    val d = e.y - height / 2f
                    if (abs(d) > itemHeight / 2) settle(shown + if (d > 0) 1 else -1) else performClick()
                }
                velocity?.recycle(); velocity = null
            }
            MotionEvent.ACTION_CANCEL -> {
                settle((offset / itemHeight).roundToInt())
                velocity?.recycle(); velocity = null
            }
        }
        return true
    }

    override fun performClick(): Boolean = super.performClick()

    override fun onDraw(canvas: Canvas) {
        val pos = offset / itemHeight
        val cy = height / 2f
        val base = floor(pos).toInt()
        val reach = (height / 2f / itemHeight).toInt() + 2
        for (n in (base - reach)..(base + reach)) {
            if (n < min || n > max) continue
            val d = n - pos
            val ad = abs(d)
            val y = cy + d * itemHeight
            // The middle number is big and solid; the others shrink and fade toward the edges.
            val size = (88f - 34f * ad.coerceAtMost(1f) - 6f * (ad - 1f).coerceIn(0f, 2f)) * density * scale
            paint.textSize = size
            // Near the top and bottom edges the numbers fade out instead of being cut.
            val edge = (minOf(y, height - y) / (itemHeight * 0.9f)).coerceIn(0f, 1f)
            paint.alpha = (255 * edge * (1f - 0.62f * ad.coerceAtMost(1f) - 0.2f * (ad - 1f).coerceIn(0f, 1.5f))).toInt().coerceIn(0, 255)
            canvas.drawText(if (pad) "%02d".format(n) else n.toString(), width / 2f, y - (paint.ascent() + paint.descent()) / 2, paint)
        }
    }

    private fun updateDescription() {
        contentDescription = describe?.invoke(shown) ?: context.getString(R.string.bpm_value, shown)
    }

    override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
        super.onInitializeAccessibilityNodeInfo(info)
        info.isScrollable = true
        if (shown < max) info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SCROLL_FORWARD)
        if (shown > min) info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SCROLL_BACKWARD)
    }

    override fun performAccessibilityAction(action: Int, arguments: Bundle?): Boolean {
        val step = when (action) {
            AccessibilityNodeInfo.ACTION_SCROLL_FORWARD -> 1
            AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD -> -1
            else -> return super.performAccessibilityAction(action, arguments)
        }
        set(shown + step)
        onChange?.invoke(shown)
        return true
    }
}
