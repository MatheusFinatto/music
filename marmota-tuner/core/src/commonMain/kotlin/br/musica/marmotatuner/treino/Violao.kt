// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

// Where the notes are on the guitar. Pure (no screen).

/** MIDI of the open strings, from the 1st (thinnest) to the 6th: e B G D A E. */
val ABERTAS: Array<Int> = arrayOf(64, 59, 55, 50, 45, 40)
const val CASAS: Int = 12

/** A spot on the neck. [raiz] only matters in arpeggio shapes: the note is the root. */
class Pos(val corda: Int, val casa: Int, val midi: Int, val raiz: Boolean = false)

/** Every spot of a note in the first frets, from the lowest fret up. */
fun posicoesDe(midi: Int): Array<Pos> =
    ABERTAS.withIndex()
        .mapNotNull { (corda, solta) -> (midi - solta).takeIf { it in 0..CASAS }?.let { Pos(corda, it, midi) } }
        .sortedBy { it.casa }
        .toTypedArray()

/** The spot nearest the nut (lowest fret), or null if the note isn't in the first 12 frets. */
fun melhorPosicao(midi: Int): Pos? = posicoesDe(midi).firstOrNull()

/**
 * A chord on the guitar: one note per string, the lower notes on the thicker strings, in a shape the hand can hold (fretted notes
 * within 4 frets) and as close to the nut as possible. If the chord doesn't fit in this octave, the same shape is looked for an
 * octave down (or up). Null if it fits in none.
 */
fun acordeNoBraco(midis: Array<Int>): Array<Pos>? {
    for (desloca in intArrayOf(0, -12, 12, -24)) {
        val f = formaDoAcorde(midis.map { it + desloca })
        if (f != null) return f.toTypedArray()
    }
    return null
}

private fun formaDoAcorde(midis: List<Int>): List<Pos>? {
    val notas = midis.distinct().sorted()
    val opcoes = notas.map { posicoesDe(it) }
    if (opcoes.any { it.isEmpty() }) return null
    var melhor: List<Pos>? = null
    var custoMelhor = Int.MAX_VALUE
    fun escolhe(i: Int, atual: List<Pos>) {
        if (i == notas.size) {
            val apertadas = atual.filter { it.casa > 0 }.map { it.casa }
            val vao = if (apertadas.isEmpty()) 0 else apertadas.max() - apertadas.min()
            val custo = (if (vao > 4) 100 else 0) + vao * 10 + atual.sumOf { it.casa }
            if (custo < custoMelhor) {
                custoMelhor = custo
                melhor = atual
            }
            return
        }
        // From the lowest note to the highest, the string can only get thinner (smaller index) and never repeat.
        for (p in opcoes[i]) if (i == 0 || p.corda < atual[i - 1].corda) escolhe(i + 1, atual + p)
    }
    escolhe(0, emptyList())
    return melhor
}

/** An arpeggio shape: every spot of its notes (any octave) inside a 5-fret window, from [de] to [ate]. */
class Forma(val posicoes: Array<Pos>, val de: Int, val ate: Int)

/** The arpeggio shape nearest the nut. The first note is the root. */
fun formaDoArpejo(midis: Array<Int>): Forma? {
    if (midis.isEmpty()) return null
    val classes = midis.map { mod(it, 12) }.toSet()
    val raiz = mod(midis[0], 12)
    for (de in 0..CASAS - 4) {
        val ate = de + 4
        val posicoes = mutableListOf<Pos>()
        ABERTAS.forEachIndexed { corda, solta ->
            for (casa in de..ate) {
                val midi = solta + casa
                val pc = midi % 12
                if (pc in classes) posicoes.add(Pos(corda, casa, midi, pc == raiz))
            }
        }
        if (classes.all { c -> posicoes.any { it.midi % 12 == c } }) return Forma(posicoes.toTypedArray(), de, ate)
    }
    return null
}
