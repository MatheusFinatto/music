// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.max
import kotlin.math.min

// Timed programs: ready sequences of exercises for 5, 10, 15, 20 or 30 minutes. Pure (no screen).
// The time is approximate: each exercise has a typical length per question, which becomes the median of what the person took in
// the last answers. The number of questions of each block is the time slice divided by that length.

/** Sections: "ouvido" (ear) and "voz" (voice). */
val MINUTOS: Array<Int> = arrayOf(5, 10, 15, 20, 30)
const val MINUTOS_PADRAO: Int = 10

/** What the program stresses, per section. "geral" is the balanced mix. */
fun focosDe(secao: String): Array<String> =
    if (secao == "voz") arrayOf("geral", "afinacao", "segundaVoz", "musicas") else arrayOf("geral", "notas", "afinacao", "harmonia")

class Bloco(val exercicio: String, val segundos: Int)
class BlocoPlano(val exercicio: String, val perguntas: Int)

private typealias Linha = Pair<String, List<Int>>

/** A 5 to 30 min table from each exercise's seconds, in order: (exercise, [s5, s10, s15, s20, s30]), 0 = left out. */
private fun tabela(vararg linhas: Linha): Map<Int, List<Bloco>> =
    MINUTOS.withIndex().associate { (k, m) -> m to linhas.filter { it.second[k] > 0 }.map { Bloco(it.first, it.second[k]) } }

private fun l(ex: String, vararg s: Int): Linha = ex to s.toList()

/** Each program adds up to exactly minutes × 60 seconds. The range test isn't here: measuring the voice isn't an exercise. */
private val PROGRAMAS: Map<String, Map<String, Map<Int, List<Bloco>>>> = mapOf(
    "ouvido" to mapOf(
        "geral" to tabela(
            l("intervalos", 150, 150, 150, 200, 300), l("acordes", 150, 150, 150, 150, 200), l("afinacao", 0, 150, 150, 200, 250),
            l("achar", 0, 0, 150, 200, 300), l("campo", 0, 150, 150, 150, 250), l("cadencias", 0, 0, 150, 150, 250),
            l("progressoes", 0, 0, 0, 150, 250),
        ),
        "notas" to tabela(l("intervalos", 150, 250, 350, 450, 700), l("acordes", 150, 200, 300, 400, 600), l("achar", 0, 150, 250, 350, 500)),
        "afinacao" to tabela(l("intervalos", 100, 150, 200, 300, 400), l("afinacao", 200, 450, 700, 900, 1400)),
        "harmonia" to tabela(l("campo", 150, 200, 300, 400, 600), l("cadencias", 150, 200, 300, 400, 600), l("progressoes", 0, 200, 300, 400, 600)),
    ),
    "voz" to mapOf(
        "geral" to tabela(
            l("igualar", 150, 130, 120, 150, 220), l("longa", 0, 0, 120, 150, 180), l("sequencia", 150, 170, 200, 250, 330),
            l("tonica", 0, 200, 150, 250, 350), l("intervalo", 0, 0, 130, 150, 320), l("musica", 0, 100, 180, 250, 400),
        ),
        "afinacao" to tabela(l("igualar", 150, 250, 350, 450, 650), l("longa", 150, 200, 300, 350, 500), l("intervalo", 0, 150, 250, 400, 650)),
        "musicas" to tabela(l("igualar", 60, 100, 120, 150, 200), l("musica", 240, 500, 780, 1050, 1600)),
        "segundaVoz" to tabela(l("igualar", 0, 100, 150, 200, 300), l("tonica", 150, 300, 450, 600, 900), l("intervalo", 150, 200, 300, 400, 600)),
    ),
)

fun programaDe(secao: String, foco: String, minutos: Int): Array<Bloco> {
    val s = PROGRAMAS.getValue(secao)
    return (s[foco] ?: s.getValue("geral")).getValue(minutos).toTypedArray()
}

private val MEDIANAS_INICIAIS = mapOf(
    "intervalos" to 10.0, "acordes" to 10.0, "afinacao" to 14.0, "achar" to 25.0, "campo" to 15.0, "cadencias" to 16.0,
    "progressoes" to 20.0, "igualar" to 14.0, "longa" to 14.0, "sequencia" to 25.0, "tonica" to 20.0, "intervalo" to 18.0,
    "musica" to 22.0, "eco" to 20.0,
)

/** Every exercise that can be in a program, ear and voice. */
val EXERCICIOS_DE_PROGRAMA: Array<String> = MEDIANAS_INICIAIS.keys.toTypedArray()

/** Seconds per question while the person still has too few answers: guesses to check with use. */
fun medianaInicial(exercicio: String): Double = MEDIANAS_INICIAIS.getValue(exercicio)

/** The tap on "Next" and the breath between questions, which the measurement (until the answer) doesn't catch. */
const val SOBRA_S: Double = 2.0
/** Answers kept per exercise, and how many are needed to trust the median. */
const val AMOSTRAS_MAX: Int = 30
const val AMOSTRAS_MIN: Int = 5
/** A question past this (the person went for water) counts as this. */
const val TETO_S: Double = 60.0
/** No question takes less than this (the sound alone lasts longer): guards the estimate against answering without listening. */
const val PISO_S: Double = 3.0

/** The answer times (seconds) of one exercise. A list of these replaces the site's former `Partial<Record<Ex, number[]>>`. */
class Duracao(val exercicio: String, val valores: Array<Double>)

fun mediana(valores: Array<Double>): Double {
    if (valores.isEmpty()) return 0.0
    val o = valores.sorted()
    val m = o.size shr 1
    return if (o.size % 2 != 0) o[m] else (o[m - 1] + o[m]) / 2
}

/** Seconds per question: the median of the person's last answers, or the guess while there are few. */
fun medianaDe(exercicio: String, duracoes: Array<Duracao>): Double {
    val v = duracoes.firstOrNull { it.exercicio == exercicio }?.valores ?: emptyArray()
    return if (v.size >= AMOSTRAS_MIN) max(PISO_S, mediana(v.takeLast(AMOSTRAS_MAX).toTypedArray())) else medianaInicial(exercicio)
}

/** The program with the number of questions of each block (at least two). */
fun planejar(secao: String, foco: String, minutos: Int, duracoes: Array<Duracao>): Array<BlocoPlano> =
    programaDe(secao, foco, minutos).map {
        BlocoPlano(it.exercicio, max(2, jsRound(it.segundos / (medianaDe(it.exercicio, duracoes) + SOBRA_S)).toInt()))
    }.toTypedArray()

/** How long the plan should take, in seconds, at the person's current pace. */
fun estimarSegundos(plano: Array<BlocoPlano>, duracoes: Array<Duracao>): Double =
    plano.fold(0.0) { s, x -> s + x.perguntas * (medianaDe(x.exercicio, duracoes) + SOBRA_S) }

/** Whole minutes to show: the nearest, never zero. */
fun minutosParaMostrar(segundos: Double): Int = max(1, jsRound(segundos / 60).toInt())

/** Stores one answer time (ms) at the end of the exercise's list: capped at the ceiling and to the last [AMOSTRAS_MAX]. */
fun registrarDuracao(duracoes: Array<Duracao>, exercicio: String, ms: Double): Array<Duracao> {
    if (!ms.isFinite() || ms <= 0) return duracoes
    val s = min(TETO_S, jsRound((ms / 1000) * 10) / 10)
    val i = duracoes.indexOfFirst { it.exercicio == exercicio }
    val antes = if (i >= 0) duracoes[i].valores else emptyArray()
    val nova = Duracao(exercicio, (antes + s).takeLast(AMOSTRAS_MAX).toTypedArray())
    return if (i >= 0) duracoes.copyOf().also { it[i] = nova } else duracoes + nova
}
