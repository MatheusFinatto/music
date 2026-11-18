// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner

import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.min

/** Drawable area inside the system bars, in pixels. */
data class Box(val left: Float, val top: Float, val right: Float, val bottom: Float) {
    val width: Float get() = right - left
    val height: Float get() = bottom - top
    val centerX: Float get() = (left + right) / 2
}

/**
 * Where everything sits on the screen, computed once per layout (top to bottom:
 * note name, frequency, dial, pivot, note strip). Pure math so it can be unit tested.
 *
 * Example: `val geometry = TunerGeometry.compute(Box(0f, 0f, 1080f, 2200f), dp = 3f)`
 */
data class TunerGeometry(
    val dp: Float,
    val centerX: Float,
    val noteTextSize: Float,
    val noteBaseline: Float,
    val frequencyBaseline: Float,
    val pivotY: Float,
    val radius: Float,
    val maxAngleDegrees: Float,
    val stripLeft: Float,
    val stripCellWidth: Float,
    val stripBaseline: Float,
    val meterRight: Float,
    val meterTop: Float,
) {
    /** −50 cents → full left, +50 → full right; slightly beyond the ends so far-off notes pin the needle. */
    fun angleForCents(cents: Float): Float =
        (cents / MAX_CENTS).coerceIn(-OVERSHOOT, OVERSHOOT) * maxAngleDegrees

    companion object {
        const val MAX_CENTS = 50f
        private const val OVERSHOOT = 1.08f
        private const val MAX_SWING_DEGREES = 40f

        fun compute(box: Box, dp: Float): TunerGeometry {
            val noteTextSize = min(box.width * 0.30f, box.height * 0.13f)
            val noteBaseline = box.top + 28 * dp + noteTextSize * 0.85f
            val frequencyBaseline = noteBaseline + 34 * dp
            val stripBaseline = box.bottom - 28 * dp
            val pivotY = stripBaseline - 96 * dp
            val radius = pivotY - (frequencyBaseline + 64 * dp)
            return TunerGeometry(
                dp = dp, centerX = box.centerX, noteTextSize = noteTextSize, noteBaseline = noteBaseline,
                frequencyBaseline = frequencyBaseline, pivotY = pivotY, radius = radius,
                maxAngleDegrees = swingThatFits(box.width / 2 - 40 * dp, radius),
                stripLeft = box.left, stripCellWidth = box.width / 12, stripBaseline = stripBaseline,
                meterRight = box.right - 20 * dp, meterTop = box.top + 20 * dp,
            )
        }

        /** Widest swing whose dial ends still leave room for the ♭/♯ labels at the screen edges. */
        private fun swingThatFits(halfWidth: Float, radius: Float): Float {
            if (radius <= 0f) return MAX_SWING_DEGREES
            val fits = (asin(min(1f, halfWidth / radius).toDouble()) * 180 / PI).toFloat()
            return min(MAX_SWING_DEGREES, fits)
        }
    }
}
