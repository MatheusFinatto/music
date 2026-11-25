// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.floor
import kotlin.math.max

// Ear training: drawing the questions and checking the answers. Pure (no audio, no screen). The notes come out as PianoNote
// for the piano to play. Every call to rng() happens in the same order as in the website's former engine.ts, so a seeded
// generator gives the same questions on both sides (TreinoParidadeTest checks it).

val EXERCICIOS: Array<String> = arrayOf("intervalos", "acordes", "afinacao", "achar", "campo", "cadencias", "progressoes")
/** The harmony exercises: chords inside a major key. */
val HARMONIA: Array<String> = arrayOf("campo", "cadencias", "progressoes")
/** Tuning margin, in cents: from obvious to fine. */
val MARGENS: Array<Int> = arrayOf(50, 30, 20, 10)
/** The tuning answers: the second note is flat, in tune or sharp. */
val RESPOSTAS_AFINACAO: Array<String> = arrayOf("baixo", "afinado", "alto")
val DIRECOES: Array<String> = arrayOf("asc", "desc", "harm", "misto")

/**
 * A classic-mode setup. [itens] are the chosen items of [exercicio] only (interval, chord, degree, cadence or progression ids).
 * [direcao]: asc, desc, harm or misto. [margem]: tuning margin in cents. [tonica]: "do" (C4) or "sorteada" (drawn).
 */
class ConfigClassica(val exercicio: String, val itens: Array<String>, val direcao: String, val margem: Int, val tonica: String)

class ConfigFuncional(val tonica: String, val graus: Array<String>)

/**
 * A classic-mode question: what to play and the right answer. Optional fields: [cents] (tuning: how far the second note was
 * moved, 0 = in tune), [tonica] and [acordes] (harmony: the key and the degrees asked, without the tonic chord that sets the key),
 * [reveal] (notes to light up after answering), [dada] and [alvo] ("achar": the given note and the one to find), [intervalo]
 * (tuning: the interval played, which the person names too, besides flat, in tune or sharp).
 */
class PerguntaClassica(
    val chave: String,
    val resposta: String,
    val notas: Array<PianoNote>,
    val cents: Int? = null,
    val tonica: Int? = null,
    val acordes: Array<String>? = null,
    val reveal: Array<Int>? = null,
    val dada: Int? = null,
    val alvo: Int? = null,
    val intervalo: String? = null,
)

/** A functional-mode question: the cadence that sets the key and the note, apart or together. */
class PerguntaFuncional(
    val chave: String,
    val resposta: String,
    val tonica: Int,
    val cadencia: Array<PianoNote>,
    val nota: Array<PianoNote>,
    val tudo: Array<PianoNote>,
)

/** History of one item (kept on the device): how many right answers out of how many. */
class HistoricoItem(val chave: String, val certo: Int, val total: Int)

/** The history with one more answer for [chave]. Keeps the order; a new key goes at the end. */
fun registrar(h: Array<HistoricoItem>, chave: String, certo: Boolean): Array<HistoricoItem> {
    val i = h.indexOfFirst { it.chave == chave }
    val antes = if (i >= 0) h[i] else HistoricoItem(chave, 0, 0)
    val novo = HistoricoItem(chave, antes.certo + (if (certo) 1 else 0), antes.total + 1)
    return if (i >= 0) h.copyOf().also { it[i] = novo } else h + novo
}

/**
 * How often an item should come up: one not seen enough weighs 2 (to get to know it), and from then on 1 (always right) to 5
 * (always wrong). Training goes back to what the person misses, without forgetting the rest.
 */
fun peso(h: Array<HistoricoItem>, chave: String): Double = pesoDe(h.firstOrNull { it.chave == chave })

private fun pesoDe(x: HistoricoItem?): Double =
    if (x == null || x.total < 2) 2.0 else 1 + 4 * (1 - x.certo.toDouble() / x.total)

/** Draws from the list; with a history, the items with more mistakes come up more. */
private fun <T> sortearComPeso(lista: List<T>, chave: (T) -> String, h: Array<HistoricoItem>?, rng: Rng): T {
    if (h == null) return sortear(lista, rng)
    val porChave = h.associateBy { it.chave }
    val pesos = lista.map { pesoDe(porChave[chave(it)]) }
    var r = rng() * pesos.sum()
    for (i in lista.indices) {
        r -= pesos[i]
        if (r < 0) return lista[i]
    }
    return lista.last()
}

internal fun inteiro(rng: Rng, min: Int, max: Int): Int = min + floor(rng() * (max - min + 1)).toInt()
internal fun <T> sortear(lista: List<T>, rng: Rng): T = lista[floor(rng() * lista.size).toInt()]

/** Only the chosen items that exist; if none is left, all of them (the screen won't let it go empty, but saved data may be old). */
private fun <T> piscina(todos: Array<T>, escolhidos: Array<String>, id: (T) -> String): List<T> {
    val ok = todos.filter { id(it) in escolhidos }
    return ok.ifEmpty { todos.toList() }
}

/**
 * Tuning: the interval plays with the second note flat, in tune or sharp (a third each, on average), in equal temperament. The
 * person names both: which interval it is ([PerguntaClassica.intervalo]) and how the second note sounds ([PerguntaClassica.resposta]).
 */
fun perguntaAfinacao(cfg: ConfigClassica, rng: Rng, historico: Array<HistoricoItem>? = null): PerguntaClassica {
    // The key is the interval (not the margin): Pontos fracos then says which interval goes out of tune, and reinforcement weighs it.
    val i = sortearComPeso(piscina(INTERVALOS, cfg.itens) { it.id }, { "afinacao:${it.id}" }, historico, rng)
    val direcao = if (cfg.direcao == "misto") sortear(listOf("asc", "desc", "harm"), rng) else cfg.direcao
    val base = inteiro(rng, 48, 64)
    val a = if (direcao == "desc") base + i.semitons else base
    val b = if (direcao == "desc") base else base + i.semitons
    val cents = sortear(listOf(-cfg.margem, 0, cfg.margem), rng)
    val resposta = if (cents < 0) "baixo" else if (cents > 0) "alto" else "afinado"
    val notas = if (direcao == "harm") {
        arrayOf(PianoNote(a, 0.0, 2.2), PianoNote(b, 0.0, 2.2, cents.toDouble()))
    } else {
        arrayOf(PianoNote(a, 0.0, 1.0), PianoNote(b, 1.1, 1.4, cents.toDouble()))
    }
    return PerguntaClassica("afinacao:${i.id}", resposta, notas, cents = cents, intervalo = i.id)
}

private val NOMES_SUSTENIDO = arrayOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
private val NOMES_BEMOL = arrayOf("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B")
private val TONS_COM_BEMOL = setOf(1, 3, 5, 8, 10)

/** Name of the tonic as a letter: flats in the keys that use flats (Db, Eb, F, Ab, Bb), sharps in the others. */
fun nomeTom(tonica: Int): String {
    val pc = mod(tonica, 12)
    return (if (pc in TONS_COM_BEMOL) NOMES_BEMOL else NOMES_SUSTENIDO)[pc]
}

/** Chord symbol of a field degree in the key: I in C is C, vi is Am, viio is Bdim. */
fun nomeAcorde(tonica: Int, grau: String): String {
    val c = CAMPO.first { it.id == grau }
    val pc = mod(tonica + c.raiz, 12)
    val letra = (if (mod(tonica, 12) in TONS_COM_BEMOL) NOMES_BEMOL else NOMES_SUSTENIDO)[pc]
    return letra + when (grau) {
        "ii", "iii", "vi" -> "m"
        "viio" -> "dim"
        else -> ""
    }
}

/** A field chord: bass an octave below the root and the triad above. */
private fun acorde(tonica: Int, grau: String, at: Double, dur: Double): List<PianoNote> {
    val c = CAMPO.first { it.id == grau }
    return listOf(PianoNote(tonica + c.raiz - 12, at, dur)) + c.semitons.map { PianoNote(tonica + it, at, dur) }
}

/** Harmony: the tonic sets the key, then come one chord (field degrees), two (cadences) or four (progressions). */
fun perguntaHarmonia(cfg: ConfigClassica, rng: Rng, historico: Array<HistoricoItem>?): PerguntaClassica {
    val tonica = if (cfg.tonica == "do") 60 else inteiro(rng, 55, 62)
    when (cfg.exercicio) {
        "campo" -> {
            val g = sortearComPeso(piscina(CAMPO, cfg.itens) { it.id }, { "campo:${it.id}" }, historico, rng)
            val notas = cadencia(tonica).toList() + acorde(tonica, g.id, INICIO_DA_NOTA, 2.0)
            return PerguntaClassica(
                "campo:${g.id}", g.id, notas.toTypedArray(),
                tonica = tonica, acordes = arrayOf(g.id), reveal = g.semitons.map { tonica + it }.toTypedArray(),
            )
        }
        "cadencias" -> {
            val c = sortearComPeso(piscina(CADENCIAS, cfg.itens) { it.id }, { "cadencias:${it.id}" }, historico, rng)
            val par = sortear(c.variantes.toList(), rng)
            val notas = acorde(tonica, "I", 0.0, 1.0) + acorde(tonica, par[0], 1.2, 1.0) + acorde(tonica, par[1], 2.4, 1.8)
            return PerguntaClassica("cadencias:${c.id}", c.id, notas.toTypedArray(), tonica = tonica, acordes = par.copyOf())
        }
    }
    val p = sortearComPeso(piscina(PROGRESSOES, cfg.itens) { it.id }, { "progressoes:${it.id}" }, historico, rng)
    val ultimo = p.acordes.size - 1
    val notas = acorde(tonica, "I", 0.0, 1.0) +
        p.acordes.withIndex().flatMap { (k, g) -> acorde(tonica, g, 1.6 + k * 1.1, if (k == ultimo) 1.8 else 1.0) }
    return PerguntaClassica("progressoes:${p.id}", p.id, notas.toTypedArray(), tonica = tonica, acordes = p.acordes.copyOf())
}

/** To compare: the notes as they were and then the same notes in tune, a pause later. */
fun compararAfinacao(notas: Array<PianoNote>): Array<PianoNote> {
    val fim = notas.maxOf { it.at + it.dur }
    return notas + notas.map { it.copy(cents = 0.0, at = it.at + fim + 0.6) }
}

/** Find it on the keyboard: two notes in a row; the first is marked and the person looks for the second by ear. */
fun perguntaAchar(cfg: ConfigClassica, rng: Rng, historico: Array<HistoricoItem>?): PerguntaClassica {
    val i = sortearComPeso(piscina(INTERVALOS, cfg.itens) { it.id }, { "achar:${it.id}" }, historico, rng)
    // The notes sound one after the other here (together, the second can't be found); "misto" draws between up and down.
    val direcao = when (cfg.direcao) {
        "desc" -> "desc"
        "misto" -> sortear(listOf("asc", "desc"), rng)
        else -> "asc"
    }
    val base = if (direcao == "desc") inteiro(rng, 60, 72) else inteiro(rng, 48, 64)
    val alvo = if (direcao == "desc") base - i.semitons else base + i.semitons
    val notas = arrayOf(PianoNote(base, 0.0, 1.0), PianoNote(alvo, 1.1, 1.4))
    return PerguntaClassica("achar:${i.id}", i.id, notas, dada = base, alvo = alvo)
}

fun perguntaClassica(cfg: ConfigClassica, rng: Rng, historico: Array<HistoricoItem>?): PerguntaClassica {
    if (cfg.exercicio == "afinacao") return perguntaAfinacao(cfg, rng, historico)
    if (cfg.exercicio == "achar") return perguntaAchar(cfg, rng, historico)
    if (cfg.exercicio in HARMONIA) return perguntaHarmonia(cfg, rng, historico)
    if (cfg.exercicio == "acordes") {
        val a = sortearComPeso(piscina(ACORDES, cfg.itens) { it.id }, { "acordes:${it.id}" }, historico, rng)
        val raiz = inteiro(rng, 48, 64)
        return PerguntaClassica("acordes:${a.id}", a.id, a.semitons.map { PianoNote(raiz + it, 0.0, 2.2) }.toTypedArray())
    }
    val i = sortearComPeso(piscina(INTERVALOS, cfg.itens) { it.id }, { "intervalos:${it.id}" }, historico, rng)
    val direcao = if (cfg.direcao == "misto") sortear(listOf("asc", "desc", "harm"), rng) else cfg.direcao
    val base = inteiro(rng, 48, 64)
    val a = if (direcao == "desc") base + i.semitons else base
    val b = if (direcao == "desc") base else base + i.semitons
    val notas = if (direcao == "harm") {
        arrayOf(PianoNote(a, 0.0, 2.2), PianoNote(b, 0.0, 2.2))
    } else {
        arrayOf(PianoNote(a, 0.0, 1.0), PianoNote(b, 1.1, 1.4))
    }
    return PerguntaClassica("intervalos:${i.id}", i.id, notas)
}

/** I-IV-V-I cadence with the bass an octave below each chord's root; 0.95 s per chord. */
fun cadencia(tonica: Int): Array<PianoNote> =
    CADENCIA.withIndex().flatMap { (k, c) ->
        listOf(PianoNote(tonica + c.grau - 12, k * 0.95, 0.85)) + c.semitons.map { PianoNote(tonica + it, k * 0.95, 0.85) }
    }.toTypedArray()

private const val INICIO_DA_NOTA = 4.5

fun perguntaFuncional(cfg: ConfigFuncional, rng: Rng, historico: Array<HistoricoItem>?): PerguntaFuncional {
    val g = sortearComPeso(piscina(GRAUS, cfg.graus) { it.id }, { "graus:${it.id}" }, historico, rng)
    val tonica = if (cfg.tonica == "do") 60 else inteiro(rng, 55, 62)
    val midi = tonica + g.semitons + (if (rng() < 0.5) 12 else 0)
    val cad = cadencia(tonica)
    return PerguntaFuncional(
        "graus:${g.id}", g.id, tonica, cad,
        arrayOf(PianoNote(midi, 0.0, 1.8)),
        cad + PianoNote(midi, INICIO_DA_NOTA, 1.8),
    )
}

/** Session score. */
class Placar(val acertos: Int, val total: Int, val sequencia: Int, val melhor: Int)

val PLACAR_ZERO: Placar = Placar(0, 0, 0, 0)

fun somar(p: Placar, certo: Boolean): Placar {
    val sequencia = if (certo) p.sequencia + 1 else 0
    return Placar(p.acertos + (if (certo) 1 else 0), p.total + 1, sequencia, max(p.melhor, sequencia))
}

/** Note name as letter and octave, like the rest of the site: 60 = C4 (middle C), 61 = C#4. */
fun nomeNota(midi: Int): String = NOMES_SUSTENIDO[mod(midi, 12)] + (floor(midi / 12.0).toInt() - 1)

/**
 * First and last key of the on-screen keyboard: from the C of the lowest note, two octaves (more only if the notes don't fit).
 * Returns [lo, hi].
 */
fun faixaDoTeclado(janela: Array<Int>): Array<Int> {
    val lo = floor(janela.min() / 12.0).toInt() * 12
    return arrayOf(lo, max(lo + 23, floor(janela.max() / 12.0).toInt() * 12 + 11))
}
