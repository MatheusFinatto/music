package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.os.SystemClock
import android.provider.Settings
import android.view.View
import br.musica.marmotatuner.treino.centsDe
import br.musica.marmotatuner.treino.dobrar
import br.musica.marmotatuner.treino.nomeNota
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/** One reading of the voice: seconds since the attempt began and the pitch (fractional MIDI), or null in silence. */
class AmostraVoz(val t: Double, val midi: Double?)

/** A requested note: since when it is the current one, until when (null = still is) and whether it was held to the end. */
class PassoVoz(val alvo: Int, val ini: Double, var fim: Double? = null, var ok: Boolean = false)

/** What the graph draws on each frame. */
class EstadoGrafico(
    val agora: Double,
    val amostras: List<AmostraVoz>,
    val passos: List<PassoVoz>,
    /** The notes still to come, in order. */
    val proximos: List<Int>,
    val segurarS: Double,
    /** How much of the current note has been held (0 to 1). */
    val progresso: Double,
    /** The drone note, drawn as a dashed line. */
    val tonica: Int?,
    /** Range test: the lowest and highest notes so far (no target). */
    val alcance: Pair<Int?, Int?>?,
    val tolerancia: Int,
    val qualquerOitava: Boolean,
    val mensagem: String?,
)

/** Whether the person asked the system to remove animations (Settings > Accessibility). */
fun Context.calmo(): Boolean = Settings.Global.getFloat(contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f

/**
 * The voice graph, the way singing apps show it (the site's grafico.ts; changed one, change the other): the "now" line on the left
 * and the notes coming from the right. The current note is an orange capsule consumed while the voice holds it; when done it turns
 * green and lets out a ring and sparks. [obter] is read every frame while [rolando]; stopped, the last frame stays (and the effects
 * in the air finish).
 */
@SuppressLint("ViewConstructor")
class GraficoVozView(ctx: Context, private val obter: () -> EstadoGrafico) : View(ctx) {
    private val d = resources.displayMetrics.density
    private val palco = Palco(d)
    private var fx = Palco.Efeitos()
    private val tracejado = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND; pathEffect = DashPathEffect(floatArrayOf(2 * d, 7 * d), 0f) }
    private val linhaP = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val faixa = Paint()
    var rolando = false
        set(v) { field = v; invalidate() }

    init { importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES }

    /** A new attempt: drops the effects (sparks, notes already celebrated). */
    fun reiniciar() { fx = Palco.Efeitos(); invalidate() }

    override fun onMeasure(wSpec: Int, hSpec: Int) {
        val w = MeasureSpec.getSize(wSpec)
        setMeasuredDimension(w, (if (w / d < 480) 260 * d else 330 * d).toInt())
    }

    override fun onDraw(c: Canvas) {
        val relogio = SystemClock.uptimeMillis() / 1000.0
        desenhar(c, obter(), relogio, context.calmo())
        if (rolando || fx.ativo(relogio)) postInvalidateOnAnimation()
    }

    private fun desenhar(c: Canvas, e: EstadoGrafico, relogio: Double, calmo: Boolean) {
        val w = width.toFloat()
        val h = height.toFloat()
        val cabeca = max(84 * d, (w * 0.27f).roundToInt().toFloat())
        val pps = (w - cabeca) / FUTURO_S
        fun x(t: Double) = (cabeca - (e.agora - t) * pps).toFloat()
        val passadoS = cabeca / pps
        val desde = e.agora - passadoS - 0.3
        palco.fundo(c, w, h)

        // ---------------------------------------------------------------- the pitch range on screen
        val atual = e.passos.firstOrNull { it.fim == null }
        fun referencia(t: Double): Int? = e.passos.firstOrNull { t >= it.ini && (it.fim == null || t < it.fim!!) }?.alvo ?: atual?.alvo ?: e.proximos.firstOrNull()
        fun dobrada(s: AmostraVoz): Double? {
            val m = s.midi ?: return null
            val r = if (e.alcance != null) null else referencia(s.t)
            return if (r != null && e.qualquerOitava) dobrar(m, r.toDouble()) else m
        }
        val visiveis = e.amostras.filter { it.t >= desde && it.midi != null }
        val interesse = ArrayList<Double>()
        e.passos.filter { it.fim == null || x(it.fim!!) > 0 }.forEach { interesse += it.alvo.toDouble() }
        e.proximos.forEach { interesse += it.toDouble() }
        e.tonica?.let { interesse += it.toDouble() }
        e.alcance?.let { (lo, hi) -> lo?.let { interesse += it.toDouble() }; hi?.let { interesse += it.toDouble() } }
        if (interesse.isEmpty() || e.alcance != null) visiveis.forEach { interesse += it.midi!! }
        if (interesse.isEmpty()) { interesse += 57.0; interesse += 64.0 }
        val lo = interesse.min()
        val hi = interesse.max()
        val meia = max(4.0, (hi - lo) / 2 + 2)
        val centro = (lo + hi) / 2
        val topo = 46 * d
        val base = h - 22 * d
        val linhaH = (base - topo) / (2 * meia).toFloat()
        fun y(m: Double) = (topo + ((centro + meia - m) / (2 * meia)) * (base - topo)).toFloat()
        val esp = max(16 * d, min(linhaH * 1.1f, (2 * e.tolerancia / 100f) * linhaH))

        // Faint bands at the requested pitches: where the eye has to go.
        for (m in (listOfNotNull(atual?.alvo) + e.proximos).toSet()) {
            faixa.shader = LinearGradient(0f, 0f, w, 0f, intArrayOf(Palco.alfa(C.laranja, 0f), Palco.alfa(C.laranja, 0.07f), Palco.alfa(C.laranja, 0.04f)), floatArrayOf(0f, 0.2f, 1f), Shader.TileMode.CLAMP)
            c.drawRect(0f, y(m.toDouble()) - esp * 0.9f, w, y(m.toDouble()) + esp * 0.9f, faixa)
        }

        val texto = palco.texto
        // The drone: a faint dashed line at the tonic, with its name.
        e.tonica?.let { t ->
            tracejado.color = Palco.alfa(C.tinta, 0.4f)
            tracejado.strokeWidth = 2 * d
            c.drawLine(14 * d, y(t.toDouble()), w - 14 * d, y(t.toDouble()), tracejado)
            texto.textSize = 12 * d
            texto.textAlign = Paint.Align.LEFT
            texto.color = Palco.alfa(C.tinta, 0.6f)
            c.drawText(nomeNota(t), 14 * d, y(t.toDouble()) - 6 * d, texto)
        }

        // Range test: the lowest and highest become orange rules with the name in big type.
        e.alcance?.let { (min0, max0) ->
            for ((m, emCima) in listOf(max0 to true, min0 to false)) {
                if (m == null) continue
                linhaP.color = Palco.alfa(C.laranja, 0.75f)
                linhaP.strokeWidth = 2 * d
                c.drawLine(14 * d, y(m.toDouble()), w - 14 * d, y(m.toDouble()), linhaP)
                texto.textSize = 20 * d
                texto.textAlign = Paint.Align.RIGHT
                texto.color = C.laranja
                c.drawText(nomeNota(m), w - 16 * d, if (emCima) y(m.toDouble()) - 6 * d else y(m.toDouble()) + 6 * d - texto.ascent(), texto)
            }
        }

        // ---------------------------------------------------------------- notes
        fun dentroDe(s: AmostraVoz, alvo: Int) = s.midi != null && abs(centsDe(s.midi, alvo.toDouble(), e.qualquerOitava)) <= e.tolerancia
        /** Paints green the stretches of [x0, x1] where the voice was on the note. */
        fun acertos(p: PassoVoz, x0: Float, x1: Float) {
            c.save()
            c.clipPath(palco.capsula(x0, x1, y(p.alvo.toDouble()), esp))
            val a = e.amostras
            for (i in a.indices) {
                val s = a[i]
                if (s.t < p.ini || (p.fim != null && s.t > p.fim!!) || s.t < desde || !dentroDe(s, p.alvo)) continue
                val prox = min(a.getOrNull(i + 1)?.t ?: e.agora, s.t + 0.15)
                palco.tinta.color = C.verde
                c.drawRect(x(s.t), y(p.alvo.toDouble()) - esp / 2, x(prox) + 0.8f, y(p.alvo.toDouble()) + esp / 2, palco.tinta)
            }
            c.restore()
        }

        // Past ones: green and lit if held (ring and sparks the first time), nearly gone if not.
        for (p in e.passos) {
            val fim = p.fim ?: continue
            val x0 = x(p.ini)
            val x1 = x(fim)
            if (x1 < -20 * d) continue
            val yc = y(p.alvo.toDouble())
            if (p.ok) {
                palco.brilho(c, x0, x1, yc, esp, C.verde, 16 * d, calmo)
                palco.encher(c, palco.capsula(x0, x1, yc, esp), C.verde)
                palco.comemorar(fx, p.ini, x1 - esp / 2, yc, esp, relogio, calmo)
            } else {
                palco.encher(c, palco.capsula(x0, x1, yc, esp), Palco.alfa(C.tinta, 0.1f))
                acertos(p, x0, x1)
            }
        }

        // The current one: the stretch already past shows where the voice hit; what is left to hold sits ahead and shrinks.
        var xFim = cabeca
        if (atual != null) {
            val alvoFim = cabeca + max(esp * 0.6f, ((1 - e.progresso) * e.segurarS * pps).toFloat())
            val anterior = fx.fimSuave
            fx.fimSuave = if (anterior == null || calmo) alvoFim else anterior + (alvoFim - anterior) * 0.25f
            xFim = fx.fimSuave!!
            val yc = y(atual.alvo.toDouble())
            val x0 = min(x(atual.ini), cabeca - esp)
            palco.encher(c, palco.capsula(x0, cabeca, yc, esp), Palco.alfa(C.laranja, 0.28f))
            acertos(atual, x0, cabeca)
            // What is left: full orange, breathing while it waits for the voice.
            val respira = if (calmo) 0.5f else (0.5 + 0.5 * sin(relogio * 5.2)).toFloat()
            palco.brilho(c, cabeca - esp / 2, xFim, yc, esp, C.laranja, (10 + respira * 10) * d, calmo)
            palco.encher(c, palco.capsula(cabeca - esp / 2, xFim, yc, esp), C.laranja)
        } else fx.fimSuave = null

        // The coming ones: on the time scale, after the current one.
        var xf = (if (atual != null) xFim else cabeca) + VAO * d
        for (m in e.proximos) {
            if (xf > w) break
            val larg = max(MIN_NOTA * d, (e.segurarS * pps).toFloat())
            val p = palco.capsula(xf, xf + larg, y(m.toDouble()), esp)
            palco.encher(c, p, Palco.alfa(C.laranja, 0.22f))
            palco.contornar(c, p, Palco.alfa(C.laranja, 0.85f), 1.5f * d)
            xf += larg + VAO * d
        }

        // The current note's name, big, above it (read from a meter away).
        val nomeAlvo = atual?.alvo ?: e.proximos.firstOrNull()
        if (nomeAlvo != null && e.alcance == null) {
            texto.textSize = 26 * d
            texto.textAlign = Paint.Align.LEFT
            texto.color = C.laranja
            c.drawText(nomeNota(nomeAlvo), min(w - 60 * d, cabeca + 14 * d), max(30 * d, y(nomeAlvo.toDouble()) - esp / 2 - 8 * d), texto)
        }

        palco.linhaDoAgora(c, cabeca, h)

        // ---------------------------------------------------------------- the voice
        val trechos = palco.trechosDaVoz(e.amostras.filter { it.t >= desde }, { it.t }) { s ->
            val m = dobrada(s) ?: return@trechosDaVoz null
            if (y(m) < 4 * d || y(m) > h - 4 * d) return@trechosDaVoz null
            val r = if (e.alcance != null) null else referencia(s.t)
            Palco.Ponto(x(s.t), y(m), s.t, r != null && dentroDe(s, r))
        }
        palco.fita(c, trechos, e.agora, passadoS.toDouble(), calmo)
        val ultima = e.amostras.lastOrNull()
        val mu = if (ultima != null && e.agora - ultima.t < 0.3) dobrada(ultima) else null
        if (ultima?.midi != null && mu != null) {
            val r = if (e.alcance != null) null else referencia(ultima.t)
            val dentro = r != null && dentroDe(ultima, r)
            val seta = if (r == null || dentro) 0 else if (centsDe(ultima.midi, r.toDouble(), e.qualquerOitava) < 0) -1 else 1
            palco.cabecaDaVoz(c, cabeca, y(mu).coerceIn(10 * d, h - 10 * d), dentro, seta)
        }

        palco.efeitos(c, fx, relogio)
        palco.bordas(c, w, h)
        palco.mensagemDoFim(c, fx, e.mensagem, w, h, relogio, calmo)
    }

    companion object {
        private const val FUTURO_S = 4.5f
        private const val MIN_NOTA = 30f
        private const val VAO = 14f
    }
}

/**
 * The voice meter (the site's Afinometro.tsx): the note coming out, big, and a cents rule around the target (or the nearest note,
 * with no target). The green band is the hit margin; the bar below fills while the note is held.
 */
class AfinometroView(ctx: Context) : View(ctx) {
    private val d = resources.displayMetrics.density
    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private val t = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }
    var midi: Double? = null
    var centsAlvo: Double? = null
    var tolerancia = 30
    var progresso = 0.0

    fun mostrar(midi: Double?, centsAlvo: Double?, tolerancia: Int, progresso: Double) {
        this.midi = midi; this.centsAlvo = centsAlvo; this.tolerancia = tolerancia; this.progresso = progresso
        contentDescription = midi?.let { nomeNota(it.roundToInt()) } ?: T("voz.sem")
        invalidate()
    }

    override fun onMeasure(wSpec: Int, hSpec: Int) = setMeasuredDimension(MeasureSpec.getSize(wSpec), (190 * d).toInt())

    override fun onDraw(c: Canvas) {
        val w = width.toFloat()
        val m = midi
        // The note: what is read from a meter away.
        t.typeface = android.graphics.Typeface.DEFAULT_BOLD
        t.textSize = 64 * d
        t.color = if (m == null) C.apagado else C.tinta
        c.drawText(m?.let { nomeNota(it.roundToInt()) } ?: "—", w / 2, 72 * d, t)

        val cents = centsAlvo ?: m?.let { (it - it.roundToInt()) * 100 }
        val limite = max(tolerancia, 50) * 1.2
        val margem = 8 * d
        val larg = w - 2 * margem
        fun pos(cc: Double) = (margem + (0.5 + cc.coerceIn(-limite, limite) / limite / 2) * larg).toFloat()
        val yR = 112 * d
        p.color = C.superficie
        c.drawRoundRect(margem, yR - 6 * d, w - margem, yR + 6 * d, 6 * d, 6 * d, p)
        p.color = Palco.alfa(C.verde, 0.3f)
        c.drawRoundRect(pos(-tolerancia.toDouble()), yR - 6 * d, pos(tolerancia.toDouble()), yR + 6 * d, 6 * d, 6 * d, p)
        p.color = C.apagado
        c.drawRect(w / 2 - d, yR - 12 * d, w / 2 + d, yR + 12 * d, p)
        if (cents != null) {
            val dentro = abs(cents) <= tolerancia
            p.color = if (dentro) C.verde else C.azul
            c.drawCircle(pos(cents), yR, 11 * d, p)
        }
        t.typeface = android.graphics.Typeface.DEFAULT
        t.textSize = 13 * d
        t.color = C.apagado
        t.textAlign = Paint.Align.LEFT
        c.drawText(T("voz.baixo"), margem, yR + 34 * d, t)
        t.textAlign = Paint.Align.RIGHT
        c.drawText(T("voz.alto"), w - margem, yR + 34 * d, t)
        t.textAlign = Paint.Align.CENTER
        // How long the note has been held.
        val yS = 170 * d
        p.color = C.superficie
        c.drawRoundRect(margem, yS - 3 * d, w - margem, yS + 3 * d, 3 * d, 3 * d, p)
        if (progresso > 0) {
            p.color = C.verde
            c.drawRoundRect(margem, yS - 3 * d, margem + (larg * progresso.coerceIn(0.0, 1.0)).toFloat(), yS + 3 * d, 3 * d, 3 * d, p)
        }
    }
}
