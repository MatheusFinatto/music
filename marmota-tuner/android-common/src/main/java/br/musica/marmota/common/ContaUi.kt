package br.musica.marmota.common

import android.app.Activity
import android.app.Dialog
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.content.res.ColorStateList
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlin.math.min

/**
 * The account's button for the bottom bar of both apps, and its dialog (the website's Conta.tsx): signed out, a person in thin line;
 * signed in, the same person filled (the Google "G" only on the sign-in button). The dialog is one card: the action on the first line, for whoever only wants to sign in; below,
 * for whoever wants to read, the text and what is kept. Same look as the apps' sheets (dark rounded card, × in thin line).
 */
object ContaUi {
    // The apps' palette (Paleta.kt).
    private val BAR = Paleta.soft
    private val INK = Paleta.ink
    private val MUTED = Paleta.muted
    private val LINE = Paleta.line
    private val BG = Paleta.ground
    private val BAD = Paleta.bad

    /** The bar's button, 44 dp wide. [aoPuxar]: something came from the cloud right after signing in (the screen reloads). */
    fun botao(act: Activity, aoPuxar: () -> Unit): ImageView = ImageView(act).apply {
        scaleType = ImageView.ScaleType.CENTER
        isClickable = true
        isFocusable = true
        val r = dp(act, 22).toFloat()
        background = RippleDrawable(ColorStateList.valueOf(Color.argb(40, 255, 255, 255)), null, GradientDrawable().apply { cornerRadius = r; setColor(Color.WHITE) })
        fun pintar() {
            val dentro = Conta.dentro(act)
            setImageResource(if (dentro) R.drawable.conta_icone else R.drawable.conta_fora)
            contentDescription = act.getString(if (dentro) R.string.conta_contaLabel else R.string.conta_entrarLabel)
        }
        pintar()
        setOnClickListener { abrir(act, ::pintar, aoPuxar) }
    }

    private fun abrir(act: Activity, aoFechar: () -> Unit, aoPuxar: () -> Unit) {
        val d = Dialog(act)
        d.requestWindowFeature(Window.FEATURE_NO_TITLE)
        val corpo = LinearLayout(act).apply { orientation = LinearLayout.VERTICAL }
        val card = LinearLayout(act).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(act, 20), dp(act, 12), dp(act, 20), dp(act, 20))
            background = GradientDrawable().apply { cornerRadius = dp(act, 22).toFloat(); setColor(BAR) }
        }
        val titulo = TextView(act).apply { textSize = 19f; typeface = Typeface.DEFAULT_BOLD; setTextColor(INK) }
        val head = LinearLayout(act).apply { gravity = Gravity.CENTER_VERTICAL }
        head.addView(titulo, LinearLayout.LayoutParams(0, -2, 1f))
        head.addView(ImageView(act).apply {
            setImageDrawable(Cruz(MUTED, dp(act, 1).toFloat() * 1.8f, dp(act, 14).toFloat()))
            scaleType = ImageView.ScaleType.CENTER
            contentDescription = act.getString(R.string.conta_fechar)
            isClickable = true
            setOnClickListener { d.dismiss() }
        }, LinearLayout.LayoutParams(dp(act, 48), dp(act, 48)))
        card.addView(head)
        card.addView(corpo)
        d.setContentView(ScrollView(act).apply { addView(card) })
        d.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            setLayout(min(act.resources.displayMetrics.widthPixels - dp(act, 32), dp(act, 440)), ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        d.setOnDismissListener { aoFechar() }

        var confirmando = false
        var ocupado = false
        var erro: Int? = null
        lateinit var montar: () -> Unit

        fun entrar() {
            ocupado = true; erro = null; montar()
            Conta.entrar(act) { ok, falhou ->
                ocupado = false
                if (ok) { Conta.sincronizar(act, aoPuxar); d.dismiss() } else { erro = if (falhou) R.string.conta_erroEntrar else null; montar() }
            }
        }

        montar = {
            corpo.removeAllViews()
            val dentro = Conta.dentro(act)
            titulo.text = act.getString(if (dentro) R.string.conta_dentro else R.string.conta_titulo)
            // First line: the action.
            if (!dentro) {
                corpo.addView(linhaDeBotoes(act, pilula(act, act.getString(R.string.conta_entrar), cheio = true, icone = R.drawable.conta_g, ativo = !ocupado) { entrar() }))
                corpo.addView(texto(act, act.getString(R.string.conta_texto)))
            } else {
                Conta.email(act)?.let { corpo.addView(TextView(act).apply { text = it; textSize = 15f; typeface = Typeface.DEFAULT_BOLD; setTextColor(INK); setPadding(0, dp(act, 4), 0, 0) }) }
                if (confirmando) {
                    corpo.addView(texto(act, act.getString(R.string.conta_apagarConfirma)))
                    corpo.addView(linhaDeBotoes(act,
                        pilula(act, act.getString(R.string.conta_apagarSim), perigo = true, ativo = !ocupado) {
                            ocupado = true; erro = null; montar()
                            fun apagar() {
                                Conta.apagar(act) { r ->
                                    when (r) {
                                        "ok" -> d.dismiss()
                                        // Google wants a recent sign-in to delete the account: sign in again, then delete.
                                        "relogar" -> Conta.entrar(act) { ok, _ -> if (ok) apagar() else { ocupado = false; erro = R.string.conta_erroApagar; montar() } }
                                        else -> { ocupado = false; erro = R.string.conta_erroApagar; montar() }
                                    }
                                }
                            }
                            apagar()
                        },
                        pilula(act, act.getString(R.string.conta_cancelar)) { confirmando = false; montar() }))
                } else {
                    corpo.addView(linhaDeBotoes(act,
                        pilula(act, act.getString(R.string.conta_sair), ativo = !ocupado) { ocupado = true; montar(); Conta.sair(act) { d.dismiss() } },
                        TextView(act).apply {
                            text = act.getString(R.string.conta_apagar); textSize = 15f; setTextColor(MUTED)
                            setPadding(dp(act, 12), dp(act, 12), dp(act, 12), dp(act, 12))
                            isClickable = !ocupado
                            setOnClickListener { confirmando = true; montar() }
                        }))
                }
                corpo.addView(texto(act, act.getString(R.string.conta_dentroTexto)))
            }
            erro?.let { corpo.addView(texto(act, act.getString(it), BAD)) }
            // Below, for whoever wants to read: what is kept.
            corpo.addView(View(act).apply { setBackgroundColor(LINE) }, LinearLayout.LayoutParams(-1, dp(act, 1)).apply { topMargin = dp(act, 18); bottomMargin = dp(act, 14) })
            corpo.addView(TextView(act).apply { text = act.getString(R.string.conta_guardado); textSize = 14f; typeface = Typeface.DEFAULT_BOLD; setTextColor(INK) })
            act.resources.getStringArray(R.array.conta_itens).forEach { corpo.addView(texto(act, "•  $it")) }
        }
        montar()
        d.show()
    }

    private fun texto(act: Activity, s: String, cor: Int = MUTED) = TextView(act).apply {
        text = s; textSize = 14f; setTextColor(cor); setLineSpacing(0f, 1.25f); setPadding(0, dp(act, 8), 0, 0)
    }

    private fun linhaDeBotoes(act: Activity, vararg vs: View) = LinearLayout(act).apply {
        gravity = Gravity.CENTER_VERTICAL
        setPadding(0, dp(act, 8), 0, dp(act, 8))
        vs.forEachIndexed { i, v -> addView(v, LinearLayout.LayoutParams(-2, -2).apply { if (i > 0) leftMargin = dp(act, 10) }) }
    }

    /** A pill like the apps' (28 dp radius, 1 dp outline, bold): filled in ink for the main action, in red-ish to delete. */
    private fun pilula(act: Activity, s: String, cheio: Boolean = false, perigo: Boolean = false, icone: Int? = null, ativo: Boolean = true, aoTocar: () -> Unit) =
        TextView(act).apply {
            text = s
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            minHeight = dp(act, 48)
            setPadding(dp(act, 20), 0, dp(act, 20), 0)
            setTextColor(if (cheio || perigo) BG else INK)
            val fundo = GradientDrawable().apply {
                cornerRadius = dp(act, 28).toFloat()
                setColor(if (cheio) INK else if (perigo) BAD else Color.TRANSPARENT)
                if (!cheio && !perigo) setStroke(dp(act, 1), LINE)
            }
            background = RippleDrawable(ColorStateList.valueOf(Color.argb(40, 128, 128, 128)), fundo, null)
            icone?.let { setCompoundDrawablesWithIntrinsicBounds(it, 0, 0, 0); compoundDrawablePadding = dp(act, 10) }
            alpha = if (ativo) 1f else 0.5f
            isEnabled = ativo
            ellipsize = TextUtils.TruncateAt.END
            setOnClickListener { aoTocar() }
        }

    private fun dp(act: Activity, v: Int) = (v * act.resources.displayMetrics.density).toInt()

    /** The apps' ×: two thin lines with round ends. */
    private class Cruz(cor: Int, traco: Float, private val lado: Float) : Drawable() {
        private val p = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = cor; style = Paint.Style.STROKE; strokeWidth = traco; strokeCap = Paint.Cap.ROUND }
        override fun getIntrinsicWidth() = lado.toInt()
        override fun getIntrinsicHeight() = lado.toInt()
        override fun draw(c: Canvas) {
            val h = lado / 2; val x = bounds.exactCenterX(); val y = bounds.exactCenterY()
            c.drawLine(x - h, y - h, x + h, y + h, p); c.drawLine(x + h, y - h, x - h, y + h, p)
        }
        override fun setAlpha(a: Int) { p.alpha = a }
        override fun setColorFilter(f: ColorFilter?) { p.colorFilter = f }
        @Deprecated("Deprecated in Java") override fun getOpacity() = PixelFormat.TRANSLUCENT
    }
}
