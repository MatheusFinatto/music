// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.abs
import kotlin.math.pow

// The sampled piano: one sample every minor third (A2 to C6); the notes in between only change the playback rate. Salamander
// Grand Piano V3 by Alexander Holm (CC BY 3.0), files named by MIDI number (60.mp3 = C4) in the website's public/sons/piano.

/** MIDI notes with a sample: A2 (45) to C6 (84), every 3. */
val PIANO_SAMPLES: Array<Int> = Array(14) { 45 + it * 3 }

/** The sample nearest a note (the lower one when it sits in the middle). */
fun nearestSample(midi: Int): Int = PIANO_SAMPLES.reduce { best, s -> if (abs(s - midi) < abs(best - midi)) s else best }

/** Playback rate to play [midi] (plus [cents]) from [sample]. */
fun rateFor(midi: Int, sample: Int, cents: Double): Double = 2.0.pow((midi - sample) / 12.0 + cents / 1200.0)

/** Envelope: attack to [PIANO_PEAK] in [PIANO_ATTACK_S], hold until the note ends, then an exponential release. */
const val PIANO_PEAK: Double = 0.9
const val PIANO_ATTACK_S: Double = 0.008
const val PIANO_RELEASE_S: Double = 0.35
