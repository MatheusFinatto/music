// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.treino

import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

// Voice training: deciding whether the person sang the note. Pure (no microphone, no screen): the screen feeds [atualizar]
// with the pitch heard (fractional MIDI, or null in silence) and the clock in milliseconds.

/** How far the sung pitch is above (+) or below (-) the target, in cents. With [qualquerOitava], 12 semitones apart don't count. */
fun centsDe(midi: Double, alvo: Double, qualquerOitava: Boolean): Double {
    var d = midi - alvo
    if (qualquerOitava) d = (((d + 6) % 12) + 12) % 12 - 6
    return d * 100
}

/** Any starting note (pitch class, 0 = C): the "random" option for the tonic and for the start of the patterns. */
fun sortearClasseDeVoz(rng: Rng): Int = floor(rng() * 12).toInt()

/** The range of notes (MIDI) the person sings comfortably: exercises draw and pick the key inside it. */
class Faixa(val min: Int, val max: Int)

/** Without a choice, the tenor's range (C3 to A4) under another name: the piano sounds good there and it fits almost
 *  everyone's voice in some octave (qualquerOitava). */
val FAIXA_PADRAO: Faixa = Faixa(48, 69)

class TipoDeVoz(val id: String, val min: Int, val max: Int)

/** Comfortable ranges by voice type (narrower than the full range: practice singing stays away from the extremes). */
val VOZES: Array<TipoDeVoz> = arrayOf(
    TipoDeVoz("baixo", 40, 60), // E2 to C4
    TipoDeVoz("baritono", 45, 65), // A2 to F4
    TipoDeVoz("tenor", 48, 69), // C3 to A4
    TipoDeVoz("contralto", 53, 72), // F3 to C5
    TipoDeVoz("mezzo", 57, 76), // A3 to E5
    TipoDeVoz("soprano", 60, 81), // C4 to A5
)

/** A target note for the voice, inside the range. */
fun sortearAlvoDeVoz(rng: Rng, faixa: Faixa): Int = faixa.min + floor(rng() * (faixa.max - faixa.min + 1)).toInt()

/** From the measured range to the comfortable one: the extremes tire, so drop 2 semitones at the bottom and 3 at the top (a narrow range stays whole). */
fun faixaConfortavel(min: Int, max: Int): Faixa = if (max - min >= 12) Faixa(min + 2, max - 3) else Faixa(min, max)

/** The voice type whose range has its center closest to the given range's. */
fun vozMaisProxima(f: Faixa): String {
    val c = (f.min + f.max) / 2.0
    return VOZES.reduce { m, v -> if (abs((v.min + v.max) / 2.0 - c) < abs((m.min + m.max) / 2.0 - c)) v else m }.id
}

/** Hit margins, in cents: from loose to fine. */
val TOLERANCIAS: Array<Int> = arrayOf(50, 30, 20, 10)
/** How long the note must stay inside the margin, in milliseconds. */
const val SEGURAR_MS: Double = 900.0
/** Silence or a detection gap up to this long doesn't drop the held note. */
private const val FOLGA_MS = 200.0

/** [desde]: since when the note is inside the margin (null if not). [visto]: last time a pitch was inside (to forgive short gaps). */
class Segurando(val desde: Double?, val visto: Double, val soma: Double, val soma2: Double, val n: Int)

val SEGURANDO_ZERO: Segurando = Segurando(null, 0.0, 0.0, 0.0, 0)

/** [media]: mean deviation in cents (signed); [oscilacao]: how much the pitch wavered around the mean (standard deviation, cents). */
class Passo(val estado: Segurando, val cents: Double?, val ok: Boolean, val media: Double, val oscilacao: Double)

/** One step: with the pitch heard now, is the note being held on target? [Passo.ok] once it stayed [segurarMs] inside the margin. */
fun atualizar(
    s: Segurando, midi: Double?, t: Double, alvo: Double, tolerancia: Double, qualquerOitava: Boolean, segurarMs: Double,
): Passo {
    val cents = if (midi == null) null else centsDe(midi, alvo, qualquerOitava)
    val estado = when {
        cents != null && abs(cents) <= tolerancia ->
            if (s.desde == null) Segurando(t, t, cents, cents * cents, 1)
            else Segurando(s.desde, t, s.soma + cents, s.soma2 + cents * cents, s.n + 1)
        // No pitch for a short while: keep what it had (a pitch outside the margin doesn't: it resets).
        midi == null && s.desde != null && t - s.visto <= FOLGA_MS -> s
        else -> SEGURANDO_ZERO
    }
    val media = if (estado.n != 0) estado.soma / estado.n else 0.0
    val oscilacao = if (estado.n != 0) sqrt(max(0.0, estado.soma2 / estado.n - media * media)) else 0.0
    val desde = estado.desde
    return Passo(estado, cents, desde != null && t - desde >= segurarMs, media, oscilacao)
}

/** Range: the notes where the voice stayed still for a while, and the lowest and highest of them. */
class Alcance(val min: Int?, val max: Int?, val candidato: Double?, val desde: Double, val visto: Double)

val ALCANCE_ZERO: Alcance = Alcance(null, null, null, 0.0, 0.0)
/** Time held on a note for it to count in the range, in ms. */
const val PARADO_MS: Double = 500.0
private const val OSCILACAO_CENTS = 40.0

fun medirAlcance(s: Alcance, midi: Double?, t: Double): Alcance {
    if (midi == null) return if (t - s.visto > FOLGA_MS) Alcance(s.min, s.max, null, s.desde, s.visto) else s
    val perto = s.candidato != null && abs(midi - s.candidato) * 100 <= OSCILACAO_CENTS
    val candidato = if (perto) s.candidato!! else midi
    val desde = if (perto) s.desde else t
    val alvo = jsRound(candidato).toInt()
    val parado = t - desde >= PARADO_MS
    return Alcance(
        if (parado) (if (s.min == null) alvo else min(s.min, alvo)) else s.min,
        if (parado) (if (s.max == null) alvo else max(s.max, alvo)) else s.max,
        candidato, desde, t,
    )
}

class Extensao(val oitavas: Int, val semitons: Int)

/** "1 octave and 7 semitones" for a span in semitones. */
fun extensao(semitons: Int): Extensao = Extensao(floor(semitons / 12.0).toInt(), semitons % 12)

/** How long the note of each step of an arpeggio or scale must stay steady, and on the long note. */
const val SEGURAR_PASSO_MS: Double = 500.0
const val SEGURAR_LONGA_MS: Double = 5000.0

/** Notes (MIDI) of a pattern from the starting note. */
fun notasDoPadrao(inicio: Int, semitons: Array<Int>): Array<Int> = semitons.map { inicio + it }.toTypedArray()

/**
 * The starting note of each round: the chosen one (pitch class, 0 = C) around middle C; in the warm-up that rises, each round
 * comes a semitone above the previous one, up to 6, and then starts over. With the person's [faixa], the octave where the whole
 * pattern (and, rising, the 6 warm-up semitones) fits, or the one that leaves it least.
 */
fun inicioDaRodada(classe: Int, rodada: Int, subir: Boolean, faixa: Faixa?, largura: Int): Int {
    var base = 55 + mod(classe - 55, 12) // G3 to F#4: comfortable for most voices
    if (faixa != null) {
        val topo = largura + (if (subir) 6 else 0)
        val centro = (faixa.min + faixa.max) / 2.0
        var custo = Double.POSITIVE_INFINITY
        for (k in 1..8) {
            val c = mod(classe, 12) + 12 * k
            val sai = max(0, faixa.min - c) + max(0, c + topo - faixa.max)
            val dist = abs(c + topo / 2.0 - centro)
            if (sai * 100 + dist < custo) {
                custo = sai * 100 + dist
                base = c
            }
        }
    }
    return base + (if (subir) rodada % 7 else 0)
}
