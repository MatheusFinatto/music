package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import android.widget.HorizontalScrollView
import br.musica.marmotatuner.treino.ABERTAS
import br.musica.marmotatuner.treino.CASAS
import br.musica.marmotatuner.treino.faixaDoTeclado
import br.musica.marmotatuner.treino.melhorPosicao
import br.musica.marmotatuner.treino.nomeNota

/** What a key or a spot on the neck is showing. Colors keep Marmota's meaning: orange target, green selected, blue sounding now. */
enum class Marca(val cor: Int) {
    ALVO(C.laranja), DADA(C.laranja), SEL(C.verde), ERRADA(C.vermelho), TOCA(C.azul)
}

/** A spot already chosen on the neck (a chord shape, an arpeggio shape), with its mark. */
class Extra(val corda: Int, val casa: Int, val midi: Int, val marca: Marca)

/** The keyboard or the guitar neck: same interface, marks by MIDI note and a tap per note. */
interface Instrumento {
    var aoTocar: (Int) -> Unit
    fun mostrar(janela: List<Int>, marcas: Map<Int, Marca>, extras: List<Extra> = emptyList())
    val vista: View
}

private val PRETAS = setOf(1, 3, 6, 8, 10)

/**
 * Piano keyboard, always on screen: each key plays its note. The window covers the question's notes (two octaves at least, from
 * the C of the lowest note, by :core's faixaDoTeclado); marked keys get their color and the note name underneath.
 * TalkBack sees one node per key ("C4"), double tap plays it.
 */
@SuppressLint("ViewConstructor")
class TecladoView(ctx: Context, private val rotulo: String) : View(ctx), Instrumento {
    override var aoTocar: (Int) -> Unit = {}
    override val vista: View get() = this
    private var lo = 48
    private var hi = 71
    private var marcas: Map<Int, Marca> = emptyMap()
    private val teclas = ArrayList<Pair<Int, RectF>>() // midi, bounds (black keys last so they win hit tests reversed)
    private val pinta = Paint(Paint.ANTI_ALIAS_FLAG)
    private val nome = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER; textSize = 12f * resources.displayMetrics.scaledDensity; typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL) }
    private val alturaTecla = dp(132)
    private val faixaNome = dp(24)

    init {
        contentDescription = rotulo
        isFocusable = true
    }

    override fun mostrar(janela: List<Int>, marcas: Map<Int, Marca>, extras: List<Extra>) {
        val f = faixaDoTeclado(janela.ifEmpty { listOf(48, 71) }.toTypedArray())
        if (f[0] != lo || f[1] != hi) { lo = f[0]; hi = f[1]; requestLayout() }
        this.marcas = marcas
        invalidate()
        sendAccessibilityEvent(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED)
    }

    override fun onMeasure(w: Int, h: Int) {
        setMeasuredDimension(MeasureSpec.getSize(w), alturaTecla + faixaNome)
    }

    private fun montar() {
        teclas.clear()
        val brancas = (lo..hi).filter { it % 12 !in PRETAS }
        val larg = width.toFloat() / brancas.size
        val x = HashMap<Int, Float>()
        brancas.forEachIndexed { i, m -> x[m] = i * larg; teclas += m to RectF(i * larg + 1, 0f, (i + 1) * larg - 1, alturaTecla.toFloat()) }
        val lp = larg * 0.62f
        for (m in lo..hi) if (m % 12 in PRETAS) {
            val esq = (x[m - 1] ?: continue) + larg - lp / 2
            teclas += m to RectF(esq, 0f, esq + lp, alturaTecla * 0.6f)
        }
    }

    override fun onDraw(c: Canvas) {
        montar()
        val r = dp(4).toFloat()
        for ((m, rect) in teclas) {
            val preta = m % 12 in PRETAS
            val marca = marcas[m]
            pinta.style = Paint.Style.FILL
            pinta.color = when {
                marca != null && marca != Marca.DADA -> marca.cor
                preta -> C.teclaPreta
                else -> C.teclaBranca
            }
            c.drawRoundRect(rect, r, r, pinta)
            if (!preta) {
                pinta.style = Paint.Style.STROKE; pinta.strokeWidth = 1f; pinta.color = C.teclaPreta
                c.drawRoundRect(rect, r, r, pinta)
            }
            if (marca == Marca.DADA) {
                pinta.style = Paint.Style.STROKE; pinta.strokeWidth = dp(3).toFloat(); pinta.color = C.laranja
                val i = dp(2).toFloat()
                c.drawRoundRect(RectF(rect.left + i, rect.top + i, rect.right - i, rect.bottom - i), r, r, pinta)
            }
        }
        for ((m, marca) in marcas) {
            if (marca == Marca.TOCA) continue
            val rect = teclas.firstOrNull { it.first == m }?.second ?: continue
            nome.color = marca.cor
            c.drawText(nomeNota(m), rect.centerX(), alturaTecla + faixaNome * 0.72f, nome)
        }
    }

    private fun teclaEm(x: Float, y: Float): Int? = teclas.lastOrNull { it.second.contains(x, y) }?.first
        ?: teclas.firstOrNull { x >= it.second.left && x <= it.second.right && y > alturaTecla }?.first

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(e: MotionEvent): Boolean {
        if (e.actionMasked == MotionEvent.ACTION_DOWN) {
            teclaEm(e.x, e.y)?.let { aoTocar(it); performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP) }
            return true
        }
        return super.onTouchEvent(e)
    }

    // One accessibility node per key.
    override fun getAccessibilityNodeProvider(): AccessibilityNodeProvider = object : AccessibilityNodeProvider() {
        override fun createAccessibilityNodeInfo(id: Int): AccessibilityNodeInfo {
            if (id == HOST_VIEW_ID) {
                val info = AccessibilityNodeInfo.obtain(this@TecladoView)
                onInitializeAccessibilityNodeInfo(info)
                if (teclas.isEmpty() && width > 0) montar()
                teclas.sortedBy { it.second.left }.forEach { info.addChild(this@TecladoView, it.first) }
                info.contentDescription = rotulo
                return info
            }
            val info = AccessibilityNodeInfo.obtain(this@TecladoView, id)
            val rect = teclas.firstOrNull { it.first == id }?.second ?: RectF()
            val b = Rect(); rect.round(b)
            info.setBoundsInParent(b)
            val loc = IntArray(2); getLocationOnScreen(loc)
            b.offset(loc[0], loc[1]); info.setBoundsInScreen(b)
            info.setParent(this@TecladoView)
            info.packageName = context.packageName
            info.className = "android.widget.Button"
            val marca = marcas[id]
            info.contentDescription = nomeNota(id) + (marca?.let { ", " + T("app.marca.${it.name.lowercase()}") } ?: "")
            info.isClickable = true
            info.isEnabled = true
            info.isVisibleToUser = true
            info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_CLICK)
            return info
        }

        override fun performAction(id: Int, action: Int, args: Bundle?): Boolean {
            if (id == HOST_VIEW_ID) return performAccessibilityAction(action, args)
            if (action == AccessibilityNodeInfo.ACTION_CLICK) { aoTocar(id); return true }
            return false
        }
    }
}

/**
 * Guitar neck (open strings plus 12 frets), always on screen: each spot plays its note. Pitch marks show on the spot nearest the
 * nut, except the notes in `extras`, which come with their chosen spot (one note per string for a chord, several for an arpeggio);
 * the tapped spot shows the choice and the sound. It scrolls sideways on a phone and moves to the marked notes by itself.
 */
@SuppressLint("ViewConstructor")
class BracoView(ctx: Context, private val rotulo: String) : HorizontalScrollView(ctx), Instrumento {
    override var aoTocar: (Int) -> Unit = {}
    override val vista: View get() = this
    private val braco = Desenho()
    private var marcas: Map<Int, Marca> = emptyMap()
    private var extras: List<Extra> = emptyList()
    private var tocada: Pair<Int, Int>? = null

    private val larg = dp(52).toFloat()
    private val alt = dp(40).toFloat()
    private val margem = dp(40).toFloat()
    private val topo = dp(20).toFloat()

    init {
        isHorizontalScrollBarEnabled = false
        addView(braco)
        contentDescription = rotulo
    }

    private fun cx(casa: Int) = if (casa == 0) margem / 2 else margem + (casa - 0.5f) * larg
    private fun cy(corda: Int) = topo + corda * alt

    override fun mostrar(janela: List<Int>, marcas: Map<Int, Marca>, extras: List<Extra>) {
        this.marcas = marcas
        this.extras = extras
        braco.invalidate()
        braco.sendAccessibilityEvent(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED)
        // Scroll so the marked spots are in view.
        val xs = bolas().map { cx(it.casa) }
        if (xs.isNotEmpty()) post { smoothScrollTo(((xs.min() + xs.max()) / 2 - width / 2f).toInt().coerceAtLeast(0), 0) }
    }

    private class Bola(val corda: Int, val casa: Int, val midi: Int, val marca: Marca)

    private fun bolas(): List<Bola> {
        val out = ArrayList<Bola>()
        val cobertas = extras.map { it.midi }.toSet()
        extras.forEach { out += Bola(it.corda, it.casa, it.midi, it.marca) }
        for ((midi, marca) in marcas) {
            if (marca == Marca.SEL || marca == Marca.TOCA || midi in cobertas) continue
            melhorPosicao(midi)?.let { out += Bola(it.corda, it.casa, midi, marca) }
        }
        tocada?.let { (corda, casa) ->
            val midi = ABERTAS[corda] + casa
            val m = marcas[midi]
            if (m == Marca.SEL || m == Marca.TOCA) out += Bola(corda, casa, midi, m)
        }
        return out
    }

    private inner class Desenho : View(context) {
        private val p = Paint(Paint.ANTI_ALIAS_FLAG)
        private val txt = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textAlign = Paint.Align.CENTER
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        }

        override fun onMeasure(w: Int, h: Int) {
            setMeasuredDimension((margem + CASAS * larg + dp(12)).toInt(), (topo * 2 + 5 * alt + dp(20)).toInt())
        }

        override fun onDraw(c: Canvas) {
            val baixo = topo + 5 * alt
            p.style = Paint.Style.FILL; p.color = C.madeira
            c.drawRoundRect(RectF(margem, topo - dp(12), margem + CASAS * larg, baixo + dp(12)), dp(4).toFloat(), dp(4).toFloat(), p)
            p.color = C.incrustacao
            for (casa in listOf(3, 5, 7, 9)) c.drawCircle(cx(casa), topo + 2.5f * alt, dp(5).toFloat(), p)
            c.drawCircle(cx(12) - dp(9), topo + 1.5f * alt, dp(5).toFloat(), p)
            c.drawCircle(cx(12) - dp(9), topo + 3.5f * alt, dp(5).toFloat(), p)
            p.style = Paint.Style.STROKE
            for (casa in 0..CASAS) {
                p.color = if (casa == 0) C.teclaBranca else C.traste
                p.strokeWidth = if (casa == 0) dp(5).toFloat() else dp(2).toFloat()
                val x = margem + casa * larg
                c.drawLine(x, topo - dp(12), x, baixo + dp(12), p)
            }
            for (corda in 0..5) {
                p.color = if (corda >= 3) C.bronze else C.aco
                p.strokeWidth = dp(1 + corda * 0.45f).toFloat()
                c.drawLine(margem, cy(corda), margem + CASAS * larg, cy(corda), p)
            }
            txt.textSize = 12f * resources.displayMetrics.scaledDensity
            txt.color = C.apagado
            for (casa in 1..CASAS) c.drawText("$casa", cx(casa), height - dp(4).toFloat(), txt)
            p.style = Paint.Style.FILL
            txt.textSize = 12f * resources.displayMetrics.scaledDensity
            for (b in bolas()) {
                p.color = b.marca.cor
                c.drawCircle(cx(b.casa), cy(b.corda), dp(14).toFloat(), p)
                txt.color = C.sobreClaro
                c.drawText(nomeNota(b.midi).filter { !it.isDigit() && it != '-' }, cx(b.casa), cy(b.corda) + dp(4), txt)
            }
        }

        private fun spot(x: Float, y: Float): Pair<Int, Int>? {
            val corda = ((y - topo + alt / 2) / alt).toInt()
            if (corda !in 0..5) return null
            val casa = if (x < margem) 0 else ((x - margem) / larg).toInt() + 1
            return if (casa in 0..CASAS) corda to casa else null
        }

        @SuppressLint("ClickableViewAccessibility")
        override fun onTouchEvent(e: MotionEvent): Boolean {
            // Tap only (a drag scrolls the neck): play on UP if the finger barely moved.
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> { inicio = e.x to e.y; return true }
                MotionEvent.ACTION_UP -> {
                    val (x0, y0) = inicio ?: return true
                    if (kotlin.math.abs(e.x - x0) < dp(10) && kotlin.math.abs(e.y - y0) < dp(10)) {
                        spot(e.x, e.y)?.let { (corda, casa) -> tocar(corda, casa) }
                    }
                    inicio = null
                    return true
                }
            }
            return true
        }
        private var inicio: Pair<Float, Float>? = null

        fun tocar(corda: Int, casa: Int) {
            tocada = corda to casa
            aoTocar(ABERTAS[corda] + casa)
            performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP)
        }

        override fun getAccessibilityNodeProvider(): AccessibilityNodeProvider = object : AccessibilityNodeProvider() {
            override fun createAccessibilityNodeInfo(id: Int): AccessibilityNodeInfo {
                if (id == HOST_VIEW_ID) {
                    val info = AccessibilityNodeInfo.obtain(this@Desenho)
                    onInitializeAccessibilityNodeInfo(info)
                    for (corda in 0..5) for (casa in 0..CASAS) info.addChild(this@Desenho, corda * 100 + casa)
                    info.contentDescription = rotulo
                    return info
                }
                val corda = id / 100
                val casa = id % 100
                val info = AccessibilityNodeInfo.obtain(this@Desenho, id)
                val esq = if (casa == 0) 0f else margem + (casa - 1) * larg
                val b = Rect(); RectF(esq, cy(corda) - alt / 2, esq + (if (casa == 0) margem else larg), cy(corda) + alt / 2).round(b)
                info.setBoundsInParent(b)
                val loc = IntArray(2); getLocationOnScreen(loc)
                b.offset(loc[0], loc[1]); info.setBoundsInScreen(b)
                info.setParent(this@Desenho)
                info.packageName = context.packageName
                info.className = "android.widget.Button"
                info.contentDescription = T("app.posicao", "nota" to nomeNota(ABERTAS[corda] + casa), "corda" to corda + 1, "casa" to casa)
                info.isClickable = true
                info.isEnabled = true
                info.isVisibleToUser = true
                info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_CLICK)
                return info
            }

            override fun performAction(id: Int, action: Int, args: Bundle?): Boolean {
                if (id == HOST_VIEW_ID) return performAccessibilityAction(action, args)
                if (action == AccessibilityNodeInfo.ACTION_CLICK) { tocar(id / 100, id % 100); return true }
                return false
            }
        }
    }
}

/**
 * Ruler of the second note's deviation (tuning exercise): center in tune, left flat, right sharp; the colored stretch goes from the
 * center to the dot and the number says how many cents. Same geometry as the site's Regua.
 */
@SuppressLint("ViewConstructor")
class ReguaView(ctx: Context, private val cents: Int, private val margem: Int) : View(ctx) {
    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private val txt = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER; typeface = android.graphics.Typeface.DEFAULT_BOLD }

    init {
        contentDescription = T("regua") + ": " + (if (cents > 0) "+" else "") + cents
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    override fun onMeasure(w: Int, h: Int) = setMeasuredDimension(MeasureSpec.getSize(w), dp(76))

    override fun onDraw(c: Canvas) {
        val limite = maxOf(margem, 50) * 1.2f
        val w = width.toFloat()
        fun x(v: Float) = w / 2 + (v / limite) * (w / 2)
        val y = dp(36).toFloat()
        p.color = C.linha; p.strokeWidth = dp(4).toFloat(); p.strokeCap = Paint.Cap.ROUND
        c.drawLine(0f + dp(4), y, w - dp(4), y, p)
        p.strokeWidth = dp(2).toFloat(); p.color = C.apagado
        for (m in listOf(-margem, margem)) c.drawLine(x(m.toFloat()), y - dp(8), x(m.toFloat()), y + dp(8), p)
        p.color = C.tinta
        c.drawLine(w / 2, y - dp(11), w / 2, y + dp(11), p)
        val cor = if (cents == 0) C.verde else C.laranja
        if (cents != 0) { p.color = cor; p.strokeWidth = dp(4).toFloat(); c.drawLine(w / 2, y, x(cents.toFloat()), y, p) }
        p.color = cor; p.style = Paint.Style.FILL
        c.drawCircle(x(cents.toFloat()), y, dp(7).toFloat(), p)
        txt.color = cor; txt.textSize = 14f * resources.displayMetrics.scaledDensity
        c.drawText(if (cents == 0) "0" else (if (cents > 0) "+" else "−") + kotlin.math.abs(cents), x(cents.toFloat()), y - dp(16), txt)
        txt.color = C.apagado; txt.typeface = android.graphics.Typeface.DEFAULT; txt.textSize = 12f * resources.displayMetrics.scaledDensity
        txt.textAlign = Paint.Align.LEFT; c.drawText(T("nomes.afinacao.baixo"), 0f, height.toFloat() - dp(4), txt)
        txt.textAlign = Paint.Align.RIGHT; c.drawText(T("nomes.afinacao.alto"), w, height.toFloat() - dp(4), txt)
        txt.textAlign = Paint.Align.CENTER; txt.typeface = android.graphics.Typeface.DEFAULT_BOLD
    }
}
