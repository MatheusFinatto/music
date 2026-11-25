// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.floor

// The shapes of the ear and voice training tables. The values live in the website's JSON (dados.json, musicas.json) and are
// turned into Kotlin by :core:generateTreinoData (TreinoDados.kt, in build/generated/treino).

class Intervalo(val id: String, val semitons: Int)
class Acorde(val id: String, val semitons: Array<Int>)
class Grau(val id: String, val semitons: Int)
/** One chord of the I-IV-V-I cadence that sets the key: [grau] is the root (semitones above the tonic), [semitons] the triad. */
class AcordeDaCadencia(val grau: Int, val semitons: Array<Int>)
/** A chord of the major key's harmonic field: I, ii, iii, IV, V, vi, viio. */
class GrauDoCampo(val id: String, val raiz: Int, val semitons: Array<Int>)
class Cadencia(val id: String, val variantes: Array<Array<String>>)
class Progressao(val id: String, val acordes: Array<String>)
/** Voice warm-up pattern: distances in semitones from the starting note, in singing order. */
class Padrao(val id: String, val semitons: Array<Int>)

/** A note of a melody: [st] = semitones above the tonic (null = rest), [dur] in quarter-note beats, [sil] = the sung syllable. */
class NotaMusica(val st: Int?, val dur: Double, val sil: String)
class Trecho(val nome: String, val notas: Array<NotaMusica>)
/** [confianca]: how well the transcription was checked against scores ("alta", "media", "baixa"). */
class Musica(val id: String, val nome: String, val compasso: String, val bpm: Int, val confianca: String, val trechos: Array<Trecho>)

/** A note for the piano: MIDI number, start and length in seconds, and detuning in cents. */
data class PianoNote(val midi: Int, val at: Double, val dur: Double, val cents: Double = 0.0)

/** A random source returning numbers in [0, 1): Math.random on the site, [mulberry32] in tests. */
typealias Rng = () -> Double

/** Seeded generator, bit for bit the same as the website's mulberry32 (Int overflow plays the part of Math.imul and `| 0`). */
fun mulberry32(seed: Int): Rng {
    var s = seed
    return {
        s += 0x6d2b79f5
        var t = (s xor (s ushr 15)) * (1 or s)
        t = (t + (t xor (t ushr 7)) * (61 or t)) xor t
        (t xor (t ushr 14)).toLong().and(0xffffffffL).toDouble() / 4294967296.0
    }
}

/** JavaScript's Math.round (halves go up, also for negatives). Kotlin's round() goes to even, which would break parity with the site. */
internal fun jsRound(x: Double): Double = floor(x + 0.5)

/** Remainder that is always 0..n-1, also for negative numbers. */
internal fun mod(a: Int, n: Int): Int = ((a % n) + n) % n
