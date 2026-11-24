package br.musica.marmotatuner

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PitchSmootherTest {
    @Test
    fun firstReadingIsShownAsIs() {
        assertEquals(64.2, PitchSmoother().push(64.2)!!, 1e-9)
    }

    @Test
    fun singleOctaveGlitchIsIgnored() {
        val s = PitchSmoother()
        s.push(40.0)
        s.push(40.0)
        assertEquals(40.0, s.push(52.0)!!, 1e-9) // median of 40, 40, 52
    }

    @Test
    fun newNoteJumpsInsteadOfSliding() {
        val s = PitchSmoother()
        repeat(3) { s.push(40.0) }
        s.push(45.0)
        assertEquals(45.0, s.push(45.0)!!, 1e-9)
    }

    @Test
    fun smallDriftIsEased() {
        val s = PitchSmoother(easing = 0.5)
        repeat(3) { s.push(40.0) }
        val eased = s.push(40.2)!! // median is still 40.0
        assertEquals(40.0, eased, 1e-9)
        assertEquals(40.1, s.push(40.2)!!, 1e-9) // median 40.2, half way from 40.0
    }

    @Test
    fun holdsThroughShortGapsThenGoesSilent() {
        val s = PitchSmoother(silenceFrames = 3)
        s.push(40.0)
        assertEquals(40.0, s.push(null)!!, 1e-9)
        assertEquals(40.0, s.push(null)!!, 1e-9)
        assertNull(s.push(null))
    }
}

class NeedleAnimatorTest {
    @Test
    fun movesTowardTargetAndSettles() {
        val needle = NeedleAnimator(timeConstantMs = 50.0)
        needle.target = 20f
        var t = 0.0
        assertTrue(needle.step(t))
        assertTrue(needle.position > 0f && needle.position < 20f)
        while (needle.step(t)) t += 16.0
        assertEquals(20f, needle.position, 0f)
    }

    @Test
    fun settledNeedleReportsNoMoreFrames() {
        val needle = NeedleAnimator()
        assertFalse(needle.step(0.0))
    }

    @Test
    fun longPauseCountsAsOneCappedStep() {
        val needle = NeedleAnimator(timeConstantMs = 1000.0)
        needle.target = 10f
        needle.step(0.0)
        needle.step(60_000.0) // e.g. app was in the background; capped to 100 ms
        assertTrue(needle.position < 2f)
    }
}

class TunerGeometryTest {
    private val phone = TunerGeometry.compute(Box(0f, 80f, 1080f, 2300f), dp = 2.75f)

    @Test
    fun dialAndLabelsFitTheWidth() {
        val reach = phone.radius * kotlin.math.sin(Math.toRadians(phone.maxAngleDegrees.toDouble())).toFloat()
        assertTrue(phone.centerX - reach >= 40 * phone.dp - 0.5f)
        assertTrue(phone.maxAngleDegrees in 10f..60f)
    }

    @Test
    fun layoutIsTopToBottom() {
        assertTrue(phone.noteBaseline < phone.frequencyBaseline)
        assertTrue(phone.frequencyBaseline < phone.pivotY - phone.radius)
        assertTrue(phone.pivotY + 30 * phone.dp < 2300f)
    }

    @Test
    fun centsMapToAngles() {
        assertEquals(0f, phone.angleForCents(0f), 0f)
        assertEquals(phone.maxAngleDegrees, phone.angleForCents(50f), 1e-4f)
        assertEquals(-phone.maxAngleDegrees * 1.08f, phone.angleForCents(-400f), 1e-4f)
    }
}
