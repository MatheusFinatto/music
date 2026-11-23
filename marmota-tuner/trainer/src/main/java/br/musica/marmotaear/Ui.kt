package br.musica.marmotaear

import android.app.Dialog
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Switch
import android.widget.TextView

/**
 * The app's visual kit: the website's "stage at night" palette (src/app/globals.css) mapped onto Material 3 roles and components,
 * built with plain Views. Meaning of color, as everywhere in Marmota: orange = target note, blue = sounding now, green = selected.
 */
object C {
    val fundo = Color.parseColor("#120E0B") // background
    val superficie = Color.parseColor("#1D1713") // surface (cards, sheets)
    val superficieAlta = Color.parseColor("#2A211B") // surface-container-high (chips, tonal buttons)
    val tinta = Color.parseColor("#F5ECDC") // on-surface; also the primary action (ivory)
    val apagado = Color.parseColor("#B7A896") // on-surface-variant
    val linha = Color.parseColor("#3D3027") // outline
    val azul = Color.parseColor("#8CC0EE") // sounding now
    val azulTinta = Color.parseColor("#0B1520")
    val laranja = Color.parseColor("#F0A634") // target
    val laranjaSuave = Color.parseColor("#3B2A0F")
    val verde = Color.parseColor("#7BD3A0") // selected / right
    val vermelho = Color.parseColor("#EF8F7C") // wrong / error
    val sobreClaro = Color.parseColor("#1A1208") // text on any bright fill
    val teclaBranca = Color.parseColor("#EFE5D2")
    val teclaPreta = Color.parseColor("#231C16")
    val madeira = Color.parseColor("#4A2C21")
    val traste = Color.parseColor("#E6E1D6")
    val aco = Color.parseColor("#DFE2E6")
    val bronze = Color.parseColor("#C9A66B")
    val incrustacao = Color.parseColor("#EFE7D6")
}

fun Context.dp(v: Number): Int = (v.toFloat() * resources.displayMetrics.density + 0.5f).toInt()
fun View.dp(v: Number): Int = context.dp(v)

/** Material 3 type roles, in sp so they follow the system font size. One family (the system sans); weight and size make the steps. */
enum class Papel(val sp: Float, val peso: Int, val entre: Float = 0f) {
    HEADLINE(28f, Typeface.BOLD, -0.02f),
    TITLE_LARGE(22f, Typeface.BOLD, -0.01f),
    TITLE(17f, 600),
    BODY(16f, Typeface.NORMAL),
    BODY_SMALL(14f, Typeface.NORMAL),
    LABEL(14f, 600),
    LABEL_SMALL(12f, 600, 0.02f),
}

private val MEDIO: Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)

fun TextView.papel(p: Papel, cor: Int = C.tinta): TextView {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, p.sp)
    typeface = when (p.peso) { Typeface.BOLD -> Typeface.DEFAULT_BOLD; 600 -> MEDIO; else -> Typeface.DEFAULT }
    letterSpacing = p.entre
    setTextColor(cor)
    setLineSpacing(0f, if (p == Papel.BODY || p == Papel.BODY_SMALL) 1.25f else 1.1f)
    return this
}

fun Context.texto(s: CharSequence, p: Papel = Papel.BODY, cor: Int = C.tinta): TextView =
    TextView(this).apply { text = s; papel(p, cor) }

fun forma(cor: Int, raio: Float, borda: Int = 0, corBorda: Int = Color.TRANSPARENT): GradientDrawable =
    GradientDrawable().apply { setColor(cor); cornerRadius = raio; if (borda > 0) setStroke(borda, corBorda) }

/** Ripple over a shape, the Android press feedback. */
fun Context.toque(fundo: Drawable, raio: Float, cor: Int = C.tinta): RippleDrawable =
    RippleDrawable(ColorStateList.valueOf((cor and 0x00FFFFFF) or 0x33000000), fundo, forma(Color.WHITE, raio))

fun lp(w: Int = ViewGroup.LayoutParams.MATCH_PARENT, h: Int = ViewGroup.LayoutParams.WRAP_CONTENT) = LinearLayout.LayoutParams(w, h)
fun LinearLayout.LayoutParams.margens(t: Int = 0, b: Int = 0, s: Int = 0, e: Int = 0) = apply { topMargin = t; bottomMargin = b; leftMargin = s; rightMargin = e }

fun Context.coluna(espaco: Int = 0): LinearLayout = LinearLayout(this).apply {
    orientation = LinearLayout.VERTICAL
    if (espaco > 0) { showDividers = LinearLayout.SHOW_DIVIDER_MIDDLE; dividerDrawable = Espaco(dp(espaco)) }
}

fun Context.linha(espaco: Int = 0): LinearLayout = LinearLayout(this).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    if (espaco > 0) { showDividers = LinearLayout.SHOW_DIVIDER_MIDDLE; dividerDrawable = Espaco(dp(espaco)) }
}

/** An invisible divider: gap between children of a LinearLayout. */
class Espaco(private val n: Int) : ColorDrawable(Color.TRANSPARENT) {
    override fun getIntrinsicWidth() = n
    override fun getIntrinsicHeight() = n
}

enum class Estilo { CHEIO, TONAL, CONTORNO }

/** Material 3 buttons: filled (ivory, the one primary action), tonal and outlined. Pill shape, 48 dp minimum. */
fun Context.botao(rotulo: String, estilo: Estilo = Estilo.CHEIO, alto: Boolean = false, aoTocar: () -> Unit): TextView =
    TextView(this).apply {
        text = rotulo
        papel(Papel.LABEL, if (estilo == Estilo.CHEIO) C.fundo else C.tinta)
        if (alto) setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
        gravity = Gravity.CENTER
        minHeight = dp(if (alto) 56 else 48)
        setPadding(dp(20), dp(8), dp(20), dp(8))
        isClickable = true
        isFocusable = true
        val raio = dp(28).toFloat()
        val base = when (estilo) {
            Estilo.CHEIO -> forma(C.tinta, raio)
            Estilo.TONAL -> forma(C.superficieAlta, raio)
            Estilo.CONTORNO -> forma(Color.TRANSPARENT, raio, dp(1), C.linha)
        }
        background = toque(base, raio, if (estilo == Estilo.CHEIO) C.fundo else C.tinta)
        setOnClickListener { aoTocar() }
    }

/** Disabled look for any control built here: Material's 38% content. */
fun View.ativo(sim: Boolean) {
    isEnabled = sim
    alpha = if (sim) 1f else 0.38f
}

/**
 * Material 3 filter chip: outlined when off, green (selected) when on, with a check mark. 32 dp tall, 48 dp touch target.
 * [radio] marks it for TalkBack as one choice of a group instead of an on/off toggle.
 */
class Chip(ctx: Context, rotulo: CharSequence, private val radio: Boolean = false, aoTocar: (Chip) -> Unit) : TextView(ctx) {
    var marcado = false
        set(v) { field = v; desenhar() }

    init {
        text = rotulo
        papel(Papel.LABEL)
        gravity = Gravity.CENTER_VERTICAL
        minHeight = dp(48)
        setPadding(dp(16), 0, dp(16), 0)
        isClickable = true
        isFocusable = true
        setOnClickListener { aoTocar(this) }
        desenhar()
    }

    private fun desenhar() {
        val raio = dp(8).toFloat()
        val inset = dp(8)
        val base = if (marcado) forma(C.verde, raio) else forma(Color.TRANSPARENT, raio, dp(1), C.linha)
        background = android.graphics.drawable.InsetDrawable(context.toque(base, raio, if (marcado) C.sobreClaro else C.tinta), 0, inset, 0, inset)
        setTextColor(if (marcado) C.sobreClaro else C.tinta)
        val check = if (marcado) Icone(context, Icone.Tipo.CHECK, C.sobreClaro, 18) else null
        setCompoundDrawablesRelativeWithIntrinsicBounds(check, null, null, null)
        compoundDrawablePadding = dp(6)
        setPadding(if (marcado) dp(10) else dp(16), 0, dp(16), 0)
    }

    override fun onInitializeAccessibilityNodeInfo(info: android.view.accessibility.AccessibilityNodeInfo) {
        super.onInitializeAccessibilityNodeInfo(info)
        info.isCheckable = true
        info.isChecked = marcado
        info.className = if (radio) "android.widget.RadioButton" else "android.widget.CheckBox"
    }
}

/** A wrapping row of chips (FlowLayout): Android Views have none built in. */
class Fluxo(ctx: Context, private val h: Int = ctx.dp(8), private val v: Int = 0) : ViewGroup(ctx) {
    override fun onMeasure(wSpec: Int, hSpec: Int) {
        val largura = MeasureSpec.getSize(wSpec) - paddingLeft - paddingRight
        var x = 0
        var y = 0
        var alturaLinha = 0
        for (i in 0 until childCount) {
            val c = getChildAt(i)
            if (c.visibility == GONE) continue
            c.measure(MeasureSpec.makeMeasureSpec(largura, MeasureSpec.AT_MOST), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
            if (x > 0 && x + c.measuredWidth > largura) { x = 0; y += alturaLinha + v; alturaLinha = 0 }
            x += c.measuredWidth + h
            alturaLinha = maxOf(alturaLinha, c.measuredHeight)
        }
        setMeasuredDimension(MeasureSpec.getSize(wSpec), y + alturaLinha + paddingTop + paddingBottom)
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        val largura = r - l - paddingLeft - paddingRight
        var x = 0
        var y = 0
        var alturaLinha = 0
        for (i in 0 until childCount) {
            val c = getChildAt(i)
            if (c.visibility == GONE) continue
            if (x > 0 && x + c.measuredWidth > largura) { x = 0; y += alturaLinha + v; alturaLinha = 0 }
            c.layout(paddingLeft + x, paddingTop + y, paddingLeft + x + c.measuredWidth, paddingTop + y + c.measuredHeight)
            x += c.measuredWidth + h
            alturaLinha = maxOf(alturaLinha, c.measuredHeight)
        }
    }
}

/** A horizontally scrolling chip row (one line), for long single-choice lists on a phone. */
fun Context.rolagemHorizontal(conteudo: View): HorizontalScrollView = HorizontalScrollView(this).apply {
    isHorizontalScrollBarEnabled = false
    clipToPadding = false
    addView(conteudo)
}

/**
 * Material 3 segmented button: equal segments in one outlined pill; the chosen one is filled (ivory, as the site's switcher).
 * Calls [aoMudar] with the index.
 */
class Segmentado(ctx: Context, rotulos: List<String>, inicial: Int, private val aoMudar: (Int) -> Unit) : LinearLayout(ctx) {
    private val itens = ArrayList<TextView>()
    var escolhido = inicial
        private set

    init {
        orientation = HORIZONTAL
        val raio = dp(24).toFloat()
        background = forma(Color.TRANSPARENT, raio, dp(1), C.linha)
        setPadding(dp(4), dp(4), dp(4), dp(4))
        rotulos.forEachIndexed { i, r ->
            val tv = TextView(ctx).apply {
                text = r
                papel(Papel.LABEL)
                gravity = Gravity.CENTER
                minHeight = dp(40)
                isClickable = true
                isFocusable = true
                setOnClickListener { escolher(i, true) }
            }
            itens += tv
            addView(tv, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        }
        escolher(inicial, false)
    }

    fun escolher(i: Int, avisar: Boolean) {
        escolhido = i
        val raio = dp(20).toFloat()
        itens.forEachIndexed { k, tv ->
            val on = k == i
            tv.setTextColor(if (on) C.fundo else C.apagado)
            tv.background = context.toque(forma(if (on) C.tinta else Color.TRANSPARENT, raio), raio)
            tv.isSelected = on
            tv.accessibilityDelegate = object : AccessibilityDelegate() {
                override fun onInitializeAccessibilityNodeInfo(host: View, info: android.view.accessibility.AccessibilityNodeInfo) {
                    super.onInitializeAccessibilityNodeInfo(host, info)
                    info.className = "android.widget.RadioButton"
                    info.isCheckable = true
                    info.isChecked = on
                }
            }
        }
        if (avisar) aoMudar(i)
    }
}

/** Material switch row: label on the left, platform Switch tinted green (selected) on the right. The whole row toggles. */
fun Context.interruptor(rotulo: String, ligado: Boolean, aoMudar: (Boolean) -> Unit): View {
    val sw = Switch(this).apply {
        isChecked = ligado
        thumbTintList = ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(C.sobreClaro, C.apagado))
        trackTintList = ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(C.verde, C.linha))
        trackTintMode = android.graphics.PorterDuff.Mode.SRC
        setOnCheckedChangeListener { _, v -> aoMudar(v) }
        isFocusable = false
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    return linha().apply {
        minimumHeight = dp(56)
        isClickable = true
        isFocusable = true
        background = toque(ColorDrawable(Color.TRANSPARENT), dp(12).toFloat())
        addView(texto(rotulo, Papel.BODY), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        addView(sw)
        setOnClickListener { sw.toggle() }
        accessibilityDelegate = object : View.AccessibilityDelegate() {
            override fun onInitializeAccessibilityNodeInfo(host: View, info: android.view.accessibility.AccessibilityNodeInfo) {
                super.onInitializeAccessibilityNodeInfo(host, info)
                info.className = "android.widget.Switch"
                info.isCheckable = true
                info.isChecked = sw.isChecked
                info.text = rotulo
            }
        }
    }
}

/** A card: surface color, 22 dp corners (the site's card radius), padding 20 dp. */
fun Context.cartao(): LinearLayout = coluna().apply {
    background = forma(C.superficie, dp(22).toFloat(), dp(1), Color.argb(18, 255, 236, 210))
    setPadding(dp(20), dp(20), dp(20), dp(20))
}

/** A small section label above a group of controls (Material label role, muted). */
fun Context.rotulo(s: String): TextView = texto(s, Papel.LABEL, C.apagado).apply { setPadding(0, dp(4), 0, dp(4)) }

/** Material icon button: 48 dp target, 24 dp icon. */
fun Context.botaoIcone(tipo: Icone.Tipo, descricao: String, aoTocar: () -> Unit): ImageButton = ImageButton(this).apply {
    setImageDrawable(Icone(context, tipo, C.tinta, 24))
    contentDescription = descricao
    background = toque(ColorDrawable(Color.TRANSPARENT), dp(24).toFloat())
    minimumWidth = dp(48)
    minimumHeight = dp(48)
    setOnClickListener { aoTocar() }
}

/**
 * Material modal bottom sheet (a Dialog anchored at the bottom): rounded top, drag handle, scrolling body, closes with Back or a
 * tap outside. [titulo] is announced as its pane title.
 */
fun Context.folha(titulo: String, corpo: View): Dialog {
    val d = Dialog(this)
    d.requestWindowFeature(Window.FEATURE_NO_TITLE)
    val raiz = coluna().apply {
        background = GradientDrawable().apply {
            setColor(C.superficie)
            cornerRadii = floatArrayOf(dp(28).toFloat(), dp(28).toFloat(), dp(28).toFloat(), dp(28).toFloat(), 0f, 0f, 0f, 0f)
        }
        setPadding(dp(24), dp(12), dp(24), dp(24))
        accessibilityPaneTitle = titulo
        addView(View(context).apply { background = forma(C.apagado, dp(2).toFloat()) }, LinearLayout.LayoutParams(dp(32), dp(4)).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            bottomMargin = dp(16)
        })
        addView(texto(titulo, Papel.TITLE_LARGE).cabecalho(), lp().margens(b = dp(8)))
        addView(ScrollView(context).apply { addView(corpo); isVerticalScrollBarEnabled = false }, lp())
    }
    d.setContentView(raiz)
    d.window?.apply {
        setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT)
        setGravity(Gravity.BOTTOM)
        setDimAmount(0.6f)
        attributes = attributes.apply { windowAnimations = android.R.style.Animation_InputMethod }
        // Never taller than 85% of the screen: the scrim stays visible and tappable.
        decorView.post {
            val max = (context.resources.displayMetrics.heightPixels * 0.85f).toInt()
            if (raiz.height > max) setLayout(WindowManager.LayoutParams.MATCH_PARENT, max)
        }
    }
    d.setCanceledOnTouchOutside(true)
    return d
}

/** Line icons drawn in code (24 dp grid, 2 dp round stroke), one consistent set instead of glyphs or emoji. */
class Icone(ctx: Context, private val tipo: Tipo, cor: Int, private val tamanhoDp: Int) : Drawable() {
    enum class Tipo { PLAY, AJUSTES, FRACOS, INFO, CHECK, FECHAR, MIC }

    private val escala = ctx.resources.displayMetrics.density * tamanhoDp / 24f
    private val tamanho = (tamanhoDp * ctx.resources.displayMetrics.density).toInt()
    private val traco = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        color = cor
    }
    private val cheio = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL; color = cor }

    override fun getIntrinsicWidth() = tamanho
    override fun getIntrinsicHeight() = tamanho

    override fun draw(c: Canvas) {
        c.save()
        c.translate(bounds.left.toFloat(), bounds.top.toFloat())
        c.scale(escala, escala)
        val p = Path()
        when (tipo) {
            Tipo.PLAY -> {
                p.moveTo(8f, 5.5f); p.lineTo(19f, 12f); p.lineTo(8f, 18.5f); p.close()
                traco.strokeWidth = 1.5f
                c.drawPath(p, cheio); c.drawPath(p, traco)
            }
            Tipo.AJUSTES -> {
                for ((y, x) in listOf(7f to 15f, 12f to 8f, 17f to 13f)) {
                    c.drawLine(4f, y, 20f, y, traco)
                    c.drawCircle(x, y, 2.2f, Paint(cheio).apply { color = C.superficie })
                    c.drawCircle(x, y, 2.2f, traco)
                }
            }
            Tipo.FRACOS -> {
                c.drawLine(4f, 20f, 20f, 20f, traco)
                c.drawLine(7f, 17f, 7f, 13f, traco)
                c.drawLine(12f, 17f, 12f, 6f, traco)
                c.drawLine(17f, 17f, 17f, 10f, traco)
            }
            Tipo.INFO -> {
                c.drawCircle(12f, 12f, 9f, traco)
                c.drawLine(12f, 11f, 12f, 16.5f, traco)
                c.drawCircle(12f, 7.8f, 1.1f, cheio)
            }
            Tipo.CHECK -> { p.moveTo(5f, 12.5f); p.lineTo(10f, 17f); p.lineTo(19f, 7.5f); c.drawPath(p, traco.apply { strokeWidth = 2.4f }) }
            Tipo.FECHAR -> { c.drawLine(6f, 6f, 18f, 18f, traco); c.drawLine(18f, 6f, 6f, 18f, traco) }
            Tipo.MIC -> {
                val r = android.graphics.RectF(9f, 3f, 15f, 15f)
                c.drawRoundRect(r, 3f, 3f, traco)
                p.moveTo(5.5f, 11f); p.cubicTo(5.5f, 19f, 18.5f, 19f, 18.5f, 11f)
                c.drawPath(p, traco)
                c.drawLine(12f, 17.5f, 12f, 21f, traco)
            }
        }
        c.restore()
    }

    override fun setAlpha(alpha: Int) { traco.alpha = alpha; cheio.alpha = alpha }
    override fun setColorFilter(colorFilter: ColorFilter?) { traco.colorFilter = colorFilter; cheio.colorFilter = colorFilter }
    @Deprecated("Deprecated in Java") override fun getOpacity() = PixelFormat.TRANSLUCENT
}

/** One-line text that ends with an ellipsis instead of wrapping (app bar title). */
fun TextView.umaLinha(): TextView = apply { maxLines = 1; ellipsize = TextUtils.TruncateAt.END }

/** Keeps layout params tidy when adding a fixed-size child to a FrameLayout. */
fun frame(w: Int, h: Int, g: Int) = FrameLayout.LayoutParams(w, h, g)


/** Marks a view as a heading for TalkBack (API 28+; older versions just read it as text). */
fun <V : View> V.cabecalho(): V = apply { if (android.os.Build.VERSION.SDK_INT >= 28) isAccessibilityHeading = true }
