package br.musica.marmotaear

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * The singing stage, as on the site (palco.ts; changed one, change the other): what the voice graph and the song track draw the
 * same way. Dark ground with a warm light from above, notes as capsules, the voice as a glowing blue ribbon that turns green on
 * the note, the voice head with an arrow saying where to go, and a ring with sparks when a note is held. Sizes in dp ([d] = px per dp).
 */
class Palco(private val d: Float) {
    val tinta = Paint(Paint.ANTI_ALIAS_FLAG)
    private val traco = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND }
    private val caminho = Path()
    private val ret = RectF()

    fun fundo(c: Canvas, w: Float, h: Float) {
        c.drawColor(C.fundo)
        val r = max(w, h) * 0.95f
        tinta.shader = RadialGradient(w * 0.45f, -h * 0.25f, r, intArrayOf(alfa(C.laranja, 0.14f), alfa(C.laranja, 0.03f), alfa(C.laranja, 0f)), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, tinta)
        tinta.shader = null
    }

    /** The edges darken: what comes in and goes out fades into the dark. */
    fun bordas(c: Canvas, w: Float, h: Float) {
        tinta.shader = LinearGradient(0f, 0f, w, 0f, intArrayOf(alfa(C.fundo, 0.85f), alfa(C.fundo, 0f), alfa(C.fundo, 0f), alfa(C.fundo, 0.7f)), floatArrayOf(0f, 0.1f, 0.92f, 1f), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, tinta)
        tinta.shader = null
    }

    fun linhaDoAgora(c: Canvas, x: Float, h: Float, forca: Float = 0.35f) {
        tinta.shader = LinearGradient(0f, 0f, 0f, h, intArrayOf(alfa(C.tinta, 0f), alfa(C.tinta, forca), alfa(C.tinta, forca), alfa(C.tinta, 0f)), floatArrayOf(0f, 0.22f, 0.78f, 1f), Shader.TileMode.CLAMP)
        c.drawRect(x - d, 0f, x + d, h, tinta)
        tinta.shader = null
    }

    /** A horizontal capsule centered on [yc]: the shape of every note. */
    fun capsula(x0: Float, x1: Float, yc: Float, esp: Float): Path {
        caminho.reset()
        ret.set(x0, yc - esp / 2, x0 + max(x1 - x0, esp), yc + esp / 2)
        caminho.addRoundRect(ret, esp / 2, esp / 2, Path.Direction.CW)
        return caminho
    }

    fun encher(c: Canvas, p: Path, cor: Int) { tinta.color = cor; c.drawPath(p, tinta) }
    fun contornar(c: Canvas, p: Path, cor: Int, larg: Float) { traco.color = cor; traco.strokeWidth = larg; c.drawPath(p, traco) }

    /**
     * A soft glow around a capsule (the site's canvas shadowBlur). Layered translucent capsules: hardware canvases don't blur shapes.
     */
    fun brilho(c: Canvas, x0: Float, x1: Float, yc: Float, esp: Float, cor: Int, raio: Float, calmo: Boolean) {
        if (calmo) return
        for (k in 3 downTo 1) {
            val e = raio * k / 3f
            encher(c, capsula(x0 - e, x1 + e, yc, esp + 2 * e), alfa(cor, 0.07f))
        }
    }

    // ---------------------------------------------------------------- the voice
    class Ponto(val x: Float, val y: Float, val t: Double, val ok: Boolean)

    /**
     * The voice ribbon: each continuous stretch is smoothed (5-point moving average: the real voice trembles, the ribbon needn't),
     * with a wide faint glow under it; blue off the note, green on it, fainter the older it is.
     */
    fun fita(c: Canvas, trechos: List<List<Ponto>>, agora: Double, vidaS: Double, calmo: Boolean) {
        val lisos = trechos.map { tr ->
            tr.mapIndexed { i, p ->
                var sy = 0f
                var n = 0
                for (k in max(0, i - 2)..min(tr.size - 1, i + 2)) { sy += tr[k].y; n++ }
                Ponto(p.x, sy / n, p.t, p.ok)
            }
        }
        for (camada in 0..1) {
            if (camada == 0 && calmo) continue
            traco.strokeWidth = (if (camada == 0) 12f else 3.5f) * d
            for (tr in lisos) for (i in 1 until tr.size) {
                val a = tr[i - 1]
                val b = tr[i]
                val idade = ((agora - b.t) / vidaS).coerceIn(0.0, 1.0).toFloat()
                traco.color = alfa(if (b.ok) C.verde else C.azul, (if (camada == 0) 0.16f else 1f) * (1 - idade * 0.85f))
                caminho.reset()
                val ant = tr.getOrNull(i - 2)
                if (ant != null) caminho.moveTo((ant.x + a.x) / 2, (ant.y + a.y) / 2) else caminho.moveTo(a.x, a.y)
                caminho.quadTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2)
                c.drawPath(caminho, traco)
            }
        }
    }

    /** Groups samples into continuous stretches (a gap over 0.25 s or a pitch off the screen cuts the ribbon). */
    fun <T> trechosDaVoz(amostras: List<T>, tempo: (T) -> Double, ponto: (T) -> Ponto?): List<List<Ponto>> {
        val out = ArrayList<List<Ponto>>()
        var tr = ArrayList<Ponto>()
        for (s in amostras) {
            val p = ponto(s)
            if (p == null || (tr.isNotEmpty() && tempo(s) - tr.last().t > 0.25)) {
                if (tr.size > 1) out += tr
                tr = ArrayList()
                if (p == null) continue
            }
            tr += p
        }
        if (tr.size > 1) out += tr
        return out
    }

    /** The voice head on the now line: green and bigger on the note; off it, an arrow says to go up (-1) or down (1). */
    fun cabecaDaVoz(c: Canvas, x: Float, y: Float, dentro: Boolean, seta: Int) {
        val cor = if (dentro) C.verde else C.azul
        val raio = (if (dentro) 30f else 22f) * d
        tinta.shader = RadialGradient(x, y, raio, alfa(cor, 0.55f), alfa(cor, 0f), Shader.TileMode.CLAMP)
        c.drawCircle(x, y, raio, tinta)
        tinta.shader = null
        tinta.color = cor
        c.drawCircle(x, y, (if (dentro) 9f else 7.5f) * d, tinta)
        tinta.color = C.tinta
        c.drawCircle(x, y, 3f * d, tinta)
        if (seta == 0) return
        val yy = y + seta * 34 * d
        for ((cor2, lw) in listOf(C.fundo to 7f, C.azul to 3.5f)) {
            traco.color = cor2
            traco.strokeWidth = lw * d
            caminho.reset()
            caminho.moveTo(x - 8 * d, yy - seta * 5 * d)
            caminho.lineTo(x, yy + seta * 3 * d)
            caminho.lineTo(x + 8 * d, yy - seta * 5 * d)
            c.drawPath(caminho, traco)
        }
    }

    // ---------------------------------------------------------------- celebration
    private class Faisca(val x: Float, val y: Float, val vx: Float, val vy: Float, val nasce: Double, val vida: Double, val r: Float)
    private class Anel(val x: Float, val y: Float, val nasce: Double, val larg: Float)

    /** What survives between frames: sparks, rings, what was already celebrated and the closing word. */
    class Efeitos {
        internal val faiscas = ArrayList<Any>()
        internal val aneis = ArrayList<Any>()
        val comemorados = HashSet<Double>()
        var fimSuave: Float? = null
        var mensagemDesde: Double? = null
        var ultimaMensagem: String? = null
        fun ativo(relogio: Double) = aneis.isNotEmpty() || faiscas.isNotEmpty() || (mensagemDesde?.let { relogio - it < 0.7 } ?: false)
    }

    /** A held note: a ring and sparks fly out of it, once per [chave]. */
    fun comemorar(fx: Efeitos, chave: Double, x: Float, y: Float, esp: Float, relogio: Double, calmo: Boolean) {
        if (!fx.comemorados.add(chave) || calmo) return
        fx.aneis += Anel(x, y, relogio, esp)
        repeat(18) {
            val ang = PI * (0.55 + Random.nextDouble() * 0.9)
            val vel = (60 + Random.nextDouble() * 150) * d
            fx.faiscas += Faisca(x, y, (cos(ang) * vel - 40 * d).toFloat(), (-sin(ang) * vel * (if (Random.nextBoolean()) 1.0 else -0.6)).toFloat(), relogio, 0.6 + Random.nextDouble() * 0.5, ((1.5 + Random.nextDouble() * 2) * d).toFloat())
        }
    }

    fun efeitos(c: Canvas, fx: Efeitos, relogio: Double) {
        fx.aneis.removeAll { relogio - (it as Anel).nasce >= 0.55 }
        for (o in fx.aneis) {
            val a = o as Anel
            val k = ((relogio - a.nasce) / 0.55).toFloat()
            val s = 1 + k * 1.4f
            traco.color = alfa(C.verde, 0.7f * (1 - k))
            traco.strokeWidth = (2.5f * (1 - k) + 0.5f) * d
            ret.set(a.x - a.larg * s, a.y - a.larg * s * 0.8f, a.x + a.larg * s, a.y + a.larg * s * 0.8f)
            c.drawOval(ret, traco)
        }
        fx.faiscas.removeAll { relogio - (it as Faisca).nasce >= it.vida }
        for (o in fx.faiscas) {
            val f = o as Faisca
            val t = (relogio - f.nasce).toFloat()
            val k = (t / f.vida).toFloat()
            tinta.color = alfa(C.verde, 0.9f * (1 - k))
            c.drawCircle(f.x + f.vx * t, f.y + f.vy * t + 90 * d * t * t, f.r * (1 - k * 0.5f), tinta)
        }
    }

    /** The closing word, big, easing in at the middle of the stage. */
    fun mensagemDoFim(c: Canvas, fx: Efeitos, msg: String?, w: Float, h: Float, relogio: Double, calmo: Boolean) {
        if (msg != fx.ultimaMensagem) { fx.ultimaMensagem = msg; fx.mensagemDesde = if (msg != null) relogio else null }
        val desde = fx.mensagemDesde ?: return
        if (msg == null) return
        val k = if (calmo) 1.0 else min(1.0, (relogio - desde) / 0.6)
        val ease = (1 - (1 - k).pow(4)).toFloat()
        c.save()
        c.translate(w / 2, h / 2)
        val esc = 0.88f + 0.12f * ease
        c.scale(esc, esc)
        texto.textSize = min(56 * d, w / 9)
        texto.textAlign = Paint.Align.CENTER
        val meio = -(texto.ascent() + texto.descent()) / 2
        if (!calmo) { texto.color = alfa(C.verde, 0.25f * ease); texto.setShadowLayer(24 * d, 0f, 0f, alfa(C.verde, ease)) }
        texto.color = alfa(C.verde, ease)
        c.drawText(msg, 0f, meio, texto)
        texto.clearShadowLayer()
        c.restore()
    }

    val texto = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = android.graphics.Typeface.DEFAULT_BOLD }

    companion object {
        fun alfa(cor: Int, a: Float): Int = Color.argb((a.coerceIn(0f, 1f) * 255).toInt(), Color.red(cor), Color.green(cor), Color.blue(cor))
    }
}
