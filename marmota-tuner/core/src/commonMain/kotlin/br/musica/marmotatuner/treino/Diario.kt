@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.floor
import kotlin.math.roundToInt

// The practice log: one entry per day and section (ouvido, voz) with answers, right answers and seconds practiced. It feeds the
// "Hoje" card (today, the last 7 days and the streak of days in a row). Kept on the device; the website and the app share it.
// Dates are local calendar days as "YYYY-MM-DD" (the caller knows the time zone).

/** One day of one section. */
class Dia(val data: String, val secao: String, val respostas: Int, val acertos: Int, val segundos: Double)

/** How many days the log keeps. */
const val DIAS_GUARDADOS = 120

/** Seconds above this for one answer count as this (the person left the screen open). */
const val TETO_RESPOSTA_S = 90.0

/** The log with one more answer (or one voice attempt) of [secao] on [data]. Drops days older than [DIAS_GUARDADOS]. */
fun registrarDia(dias: Array<Dia>, data: String, secao: String, certo: Boolean, segundos: Double): Array<Dia> {
    val s = segundos.coerceIn(0.0, TETO_RESPOSTA_S)
    val i = dias.indexOfFirst { it.data == data && it.secao == secao }
    val antes = if (i >= 0) dias[i] else Dia(data, secao, 0, 0, 0.0)
    val novo = Dia(data, secao, antes.respostas + 1, antes.acertos + (if (certo) 1 else 0), antes.segundos + s)
    val junto = if (i >= 0) dias.copyOf().also { it[i] = novo } else dias + novo
    val limite = numeroDoDia(data) - DIAS_GUARDADOS
    return junto.filter { numeroDoDia(it.data) > limite }.toTypedArray()
}

/** What the "Hoje" card shows for [secao]: today, the minutes of the last 7 days (oldest first, today last) and the streak. */
class ResumoDiario(val respostasHoje: Int, val acertosHoje: Int, val minutosHoje: Int, val semana: IntArray, val sequencia: Int)

fun resumoDiario(dias: Array<Dia>, hoje: String, secao: String): ResumoDiario {
    val meus = dias.filter { it.secao == secao }.associateBy { numeroDoDia(it.data) }
    val n = numeroDoDia(hoje)
    val d = meus[n]
    val minutos = { x: Dia? -> if (x == null) 0 else (x.segundos / 60).roundToInt().coerceAtLeast(if (x.respostas > 0) 1 else 0) }
    val semana = IntArray(7) { k -> minutos(meus[n - 6 + k]) }
    // Days in a row with practice, ending today (or yesterday: today may not have started yet).
    var k = if (d != null) n else n - 1
    var seq = 0
    while (meus[k] != null) { seq++; k-- }
    return ResumoDiario(d?.respostas ?: 0, d?.acertos ?: 0, minutos(d), semana, seq)
}

/** Days since 1970-01-01 for a "YYYY-MM-DD" date (proleptic Gregorian); a malformed date gives 0. */
fun numeroDoDia(data: String): Int {
    val p = data.split("-")
    val y0 = p.getOrNull(0)?.toIntOrNull() ?: return 0
    val m = p.getOrNull(1)?.toIntOrNull() ?: return 0
    val d = p.getOrNull(2)?.toIntOrNull() ?: return 0
    // Howard Hinnant's days_from_civil.
    val y = if (m <= 2) y0 - 1 else y0
    val era = floor(y / 400.0).toInt()
    val yoe = y - era * 400
    val mp = (m + 9) % 12
    val doy = (153 * mp + 2) / 5 + d - 1
    val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
    return era * 146097 + doe - 719468
}
