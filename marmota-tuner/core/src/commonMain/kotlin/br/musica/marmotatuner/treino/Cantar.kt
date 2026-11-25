// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// Singing songs: the notes of a phrase scroll on a pitch lane, each has its time window, and the note counts if the right pitch was
// sung during part of the window. Pure (no screen, no microphone): the screen feeds [acertoDaNota] with time-stamped readings.

/** The note in time: seconds from the first note of the phrase. [midi] null = rest. */
class Janela(val ini: Double, val fim: Double, val midi: Int?, val sil: String)

/** A note shorter than this (seconds) is a passing note: nobody settles the pitch that fast, so it isn't scored. */
const val CURTA_S: Double = 0.28

fun ehCurta(j: Janela): Boolean = j.fim - j.ini < CURTA_S

/** [bpm] may be fractional: the slow speed is 0.6 × the song's tempo. */
fun janelas(notas: Array<NotaMusica>, bpm: Double, tonicaMidi: Int): Array<Janela> {
    val seg = 60.0 / bpm
    var tempo = 0.0
    return notas.map { n ->
        val j = Janela(tempo * seg, (tempo + n.dur) * seg, n.st?.let { tonicaMidi + it }, n.sil)
        tempo += n.dur
        j
    }.toTypedArray()
}

fun duracaoDe(js: Array<Janela>): Double = js.fold(0.0) { m, j -> max(m, j.fim) }

private const val CENTRO_MIDI = 60
/** The range (MIDI) where the sampled piano sounds good and almost everyone's voice reaches in some octave. */
private const val PIANO_MIN = 45
private const val PIANO_MAX = 84

/**
 * The tonic (MIDI) of a pitch class (0 = C) in an octave where the melody sits around middle C and inside the sampled piano.
 * With the person's [faixa], the key where the melody leaves it least, then the most centered.
 */
fun tonicaParaCaber(classe: Int, notas: Array<NotaMusica>, faixa: Faixa?): Int {
    val sts = notas.mapNotNull { it.st }
    val lo = sts.min()
    val hi = sts.max()
    val meio = (lo + hi) / 2.0
    var melhor = classe + 12 * 4
    var custo = Double.POSITIVE_INFINITY
    for (k in 2..6) {
        val t = classe + 12 * k
        if (t + lo < PIANO_MIN || t + hi > PIANO_MAX) continue
        val c = if (faixa != null) {
            (max(0, faixa.min - (t + lo)) + max(0, t + hi - faixa.max)) * 100 + abs(t + meio - (faixa.min + faixa.max) / 2.0)
        } else {
            abs(t + meio - CENTRO_MIDI)
        }
        if (c < custo) {
            custo = c
            melhor = t
        }
    }
    return melhor
}

/** Moves [midi] to the octave nearest [centro]: with "any octave", the voice shows inside the lane wherever it sings. */
fun dobrar(midi: Double, centro: Double): Double = midi - 12 * jsRound((midi - centro) / 12)

class Amostra(val t: Double, val midi: Double?)

/** The start of each note is forgiven (the person takes a moment to come in, and the microphone and smoothing lag). */
const val GRACA_S: Double = 0.35
/** Never more than 45% of the note. */
const val GRACA_MAX: Double = 0.45
/** How much of the window (after the grace) the voice must be on pitch. */
const val LIMIAR: Double = 0.45
/** Compensation for the microphone and smoothing delay. */
const val LATENCIA_S: Double = 0.15
/** A reading counts for at most this long (gaps between readings don't count as hits). */
private const val DT_MAX = 0.15

class Acerto(val fracao: Double, val ok: Boolean, val ouvido: Double?)

/** How much of the window (up to [ate], for the live reading) the voice stayed inside the margin around the note. */
fun acertoDaNota(amostras: Array<Amostra>, j: Janela, tolerancia: Double, qualquerOitava: Boolean, ate: Double): Acerto {
    val alvo = j.midi
    if (alvo == null || ehCurta(j)) return Acerto(1.0, true, null)
    val a = j.ini + min(GRACA_S, GRACA_MAX * (j.fim - j.ini))
    val b = min(j.fim, ate)
    if (b <= a) return Acerto(0.0, false, null)
    var dentro = 0.0
    val ouvidos = mutableListOf<Double>()
    for (i in amostras.indices) {
        val s = amostras[i]
        val t0 = s.t - LATENCIA_S
        val dt = min(DT_MAX, if (i + 1 < amostras.size) amostras[i + 1].t - s.t else DT_MAX)
        val sobra = min(b, t0 + dt) - max(a, t0)
        val midi = s.midi
        if (sobra <= 0 || midi == null) continue
        ouvidos.add(midi)
        if (abs(centsDe(midi, alvo.toDouble(), qualquerOitava)) <= tolerancia) dentro += sobra
    }
    ouvidos.sort()
    val fracao = min(1.0, dentro / (b - a))
    return Acerto(fracao, fracao >= LIMIAR, if (ouvidos.isEmpty()) null else ouvidos[ouvidos.size shr 1])
}

class Resumo(val acertadas: Int, val total: Int, val ok: Boolean)

/** How many notes (not counting rests or passing notes) were sung, and whether the phrase passes: 80% or more. */
fun resumir(js: Array<Janela>, acertos: Array<Acerto>): Resumo {
    var acertadas = 0
    var total = 0
    js.forEachIndexed { i, j ->
        if (j.midi != null && !ehCurta(j)) {
            total++
            if (acertos.getOrNull(i)?.ok == true) acertadas++
        }
    }
    return Resumo(acertadas, total, total > 0 && acertadas.toDouble() / total >= 0.8)
}

/** The song with this id, or the first one. */
fun musicaDe(id: String): Musica = MUSICAS.firstOrNull { it.id == id } ?: MUSICAS[0]
