// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner

import kotlin.math.abs
import kotlin.math.exp

/**
 * Glides the needle toward [target] (in cents) at a speed independent of the screen's frame rate,
 * so it moves the same on 60 Hz and 120 Hz phones.
 *
 * Example:
 * ```
 * needle.target = reading.cents
 * val stillMoving = needle.step(SystemClock.uptimeMillis().toDouble()) // site: performance.now()
 * ```
 */
class NeedleAnimator(private val timeConstantMs: Double = 90.0) {
    var target: Float = 0f
    var position: Float = 0f
        private set

    private var lastStepMs = NOT_ANIMATING

    /** Advances to [nowMs]; returns true while the needle still needs more frames. */
    fun step(nowMs: Double): Boolean {
        val elapsedMs = if (lastStepMs == NOT_ANIMATING) FIRST_FRAME_MS else (nowMs - lastStepMs).coerceIn(0.0, MAX_STEP_MS)
        lastStepMs = nowMs
        position += ((target - position) * (1 - exp(-elapsedMs / timeConstantMs))).toFloat()
        if (abs(target - position) >= SETTLED_CENTS) return true
        position = target
        lastStepMs = NOT_ANIMATING // a long idle gap must not count as one huge step later
        return false
    }

    private companion object {
        const val NOT_ANIMATING = -1.0
        const val FIRST_FRAME_MS = 16.0
        const val MAX_STEP_MS = 100.0
        const val SETTLED_CENTS = 0.05f
    }
}
