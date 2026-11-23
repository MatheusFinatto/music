package br.musica.marmotaear

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.window.OnBackInvokedDispatcher

/**
 * Marmota Ear & Voice: one activity, a top app bar, the two sections as Material tabs (Ouvido, Voz) and a scrolling body.
 * Edge to edge with the system bar insets; Back stops a running program before it leaves the app.
 */
class MainActivity : Activity() {
    private lateinit var dados: Dados
    private val secoes = LinkedHashMap<String, SecaoView>()
    private lateinit var corpo: FrameLayout
    private lateinit var rolagem: ScrollView
    private lateinit var abas: Abas
    private lateinit var acaoAjustes: View
    private lateinit var acaoFracos: View
    private var atual = "ouvido"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dados = Dados(this)
        atual = savedInstanceState?.getString("secao") ?: "ouvido"

        val raiz = coluna().apply { setBackgroundColor(C.fundo) }
        // Top app bar: the app's name and the actions that fit the moment.
        acaoFracos = botaoIcone(Icone.Tipo.FRACOS, T("app.fracos")) { abrirFracos() }
        acaoAjustes = botaoIcone(Icone.Tipo.AJUSTES, T("app.ajustes")) { abrirAjustes() }
        val barra = linha().apply {
            minimumHeight = dp(64)
            setPadding(dp(16), 0, dp(4), 0)
            addView(texto(T("app.nome"), Papel.TITLE_LARGE).umaLinha().cabecalho(), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            addView(acaoFracos)
            addView(acaoAjustes)
            addView(botaoIcone(Icone.Tipo.INFO, T("app.sobre")) { abrirSobre() })
        }
        raiz.addView(barra, lp())
        abas = Abas(this, listOf("ouvido" to T("app.ouvido"), "voz" to T("app.voz")).filter { it.first in SECOES }, atual) { trocar(it) }
        raiz.addView(abas, lp())
        corpo = FrameLayout(this).apply { setPadding(dp(16), dp(20), dp(16), dp(32)); clipToPadding = false }
        rolagem = ScrollView(this).apply { isFillViewport = true; addView(corpo) }
        raiz.addView(rolagem, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(raiz)
        pintarBarrasDoSistema(raiz)
        trocar(atual)

        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { voltar() }
        }
    }

    private fun secao(id: String): SecaoView = secoes.getOrPut(id) {
        when (id) {
            "ouvido" -> SecaoView(this, "ouvido", dados, livre = { OuvidoView(this, dados) }, blocoDe = { b -> OuvidoView(this, dados, b) })
            else -> SecaoView(this, id, dados, livre = { View(this) }, blocoDe = { View(this) })
        }.also { it.aoMudar = ::atualizarAcoes }
    }

    private fun trocar(id: String) {
        (secoes[atual]?.vistaLivre as? OuvidoView)?.calar()
        Piano.calar()
        atual = id
        corpo.removeAllViews()
        corpo.addView(secao(id))
        rolagem.scrollTo(0, 0)
        atualizarAcoes()
    }

    private fun atualizarAcoes() {
        val s = secoes[atual] ?: return
        acaoAjustes.visibility = if (s.livreAberto) View.VISIBLE else View.GONE
        acaoFracos.visibility = if (atual == "ouvido") View.VISIBLE else View.GONE
    }

    private fun ouvidoLivre(): OuvidoView? = secoes["ouvido"]?.vistaLivre as? OuvidoView

    private fun abrirAjustes() {
        val o = ouvidoLivre() ?: return
        folha(T("ajustes"), o.corpoAjustes { o.trocarInstrumento() }).show()
    }

    private fun abrirFracos() {
        val o = ouvidoLivre() ?: OuvidoView(this, dados)
        folha(T("fracos"), o.corpoFracos()).apply { setOnDismissListener { ouvidoLivre()?.ajustesMudaram() } }.show()
    }

    private fun abrirSobre() {
        val versao = runCatching { packageManager.getPackageInfo(packageName, 0).versionName }.getOrNull() ?: ""
        val c = coluna(12).apply {
            addView(texto(T("app.sobreTexto"), Papel.BODY))
            addView(texto(T("app.creditos"), Papel.BODY_SMALL, C.apagado))
            addView(texto(T("app.versao", "v" to versao), Papel.BODY_SMALL, C.apagado))
        }
        folha(T("app.sobre"), c).show()
    }

    private fun voltar() {
        if (secoes[atual]?.voltar() == true) return
        finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() = voltar()

    override fun onResume() {
        super.onResume()
        Piano.ligar()
    }

    override fun onPause() {
        Piano.desligar()
        super.onPause()
    }

    override fun onSaveInstanceState(out: Bundle) {
        super.onSaveInstanceState(out)
        out.putString("secao", atual)
    }

    /** Android 15+ always draws edge to edge; 11–14 are switched to match. The content stays inside the system bars. */
    @Suppress("DEPRECATION")
    private fun pintarBarrasDoSistema(v: View) {
        window.statusBarColor = C.fundo
        window.navigationBarColor = C.fundo
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
        window.setDecorFitsSystemWindows(false)
        v.setOnApplyWindowInsetsListener { view, insets ->
            val b = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            view.setPadding(b.left, b.top, b.right, b.bottom)
            WindowInsets.CONSUMED
        }
    }

    companion object {
        /** Sections that ship in this build (Voz joins in the next phase). */
        val SECOES = setOf("ouvido")
    }
}

/** Material 3 primary tabs: equal width, label, a 3 dp indicator under the chosen one. Hidden when there is only one section. */
class Abas(ctx: android.content.Context, itens: List<Pair<String, String>>, inicial: String, aoTrocar: (String) -> Unit) : LinearLayout(ctx) {
    private val vistas = ArrayList<Pair<String, TextView>>()

    init {
        orientation = HORIZONTAL
        visibility = if (itens.size < 2) GONE else VISIBLE
        background = android.graphics.drawable.LayerDrawable(arrayOf(android.graphics.drawable.ColorDrawable(C.fundo))).apply { }
        itens.forEach { (id, r) ->
            val tv = TextView(ctx).apply {
                text = r
                papel(Papel.TITLE)
                gravity = Gravity.CENTER
                minHeight = dp(48)
                isClickable = true
                isFocusable = true
                setOnClickListener { escolher(id); aoTrocar(id) }
            }
            vistas += id to tv
            addView(tv, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        }
        escolher(inicial)
    }

    fun escolher(id: String) {
        vistas.forEach { (k, tv) ->
            val on = k == id
            tv.setTextColor(if (on) C.tinta else C.apagado)
            tv.isSelected = on
            tv.background = context.toque(Indicador(on, context.dp(3)), 0f)
        }
    }

    private class Indicador(private val on: Boolean, private val h: Int) : android.graphics.drawable.ColorDrawable(Color.TRANSPARENT) {
        private val p = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
        override fun draw(c: android.graphics.Canvas) {
            p.color = C.linha
            c.drawRect(bounds.left.toFloat(), bounds.bottom - 1f, bounds.right.toFloat(), bounds.bottom.toFloat(), p)
            if (!on) return
            p.color = C.tinta
            val w = bounds.width() * 0.4f
            val cx = bounds.exactCenterX()
            c.drawRoundRect(cx - w / 2, bounds.bottom - h.toFloat(), cx + w / 2, bounds.bottom.toFloat(), h.toFloat(), h.toFloat(), p)
        }
    }
}
