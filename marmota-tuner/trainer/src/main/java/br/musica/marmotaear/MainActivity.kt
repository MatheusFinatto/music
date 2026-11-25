package br.musica.marmotaear

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
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
 * Marmota Ear & Voice: one activity, a top bar, a scrolling body and, as in the Tuner, the sections (Ouvido, Voz) in a floating bar
 * at the bottom.
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
        simular = (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0 && intent.getBooleanExtra("simular", false)
        atual = savedInstanceState?.getString("secao") ?: "ouvido"

        val tela = FrameLayout(this).apply { setBackgroundColor(C.fundo) }
        val raiz = coluna()
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
        // Com a barra embaixo, o fim da rolagem fica acima dela (56 dp + 16 dp de folga em cima e embaixo).
        val folgaBarra = if (abas.visibility == View.VISIBLE) dp(56 + 32) else 0
        corpo = FrameLayout(this).apply { setPadding(dp(20), dp(12), dp(20), dp(32) + folgaBarra); clipToPadding = false }
        rolagem = ScrollView(this).apply { isFillViewport = true; addView(corpo) }
        raiz.addView(rolagem, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        tela.addView(raiz, FrameLayout.LayoutParams(-1, -1))
        tela.addView(abas, FrameLayout.LayoutParams(-1, dp(56), Gravity.BOTTOM).apply { setMargins(dp(24), 0, dp(24), dp(16)) })
        setContentView(tela)
        pintarBarrasDoSistema(tela)
        trocar(atual)

        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { voltar() }
        }
    }

    private fun secao(id: String): SecaoView = secoes.getOrPut(id) {
        when (id) {
            "ouvido" -> SecaoView(this, "ouvido", dados, livre = { OuvidoView(this, dados) }, blocoDe = { b -> OuvidoView(this, dados, b) })
            else -> SecaoView(this, "voz", dados, livre = { VozView(this, dados).also { v -> v.aoMudarAjustes = ::atualizarAcoes; v.aoEmCurso = ::focar } }, blocoDe = { b -> VozView(this, dados, b).also { v -> v.aoEmCurso = ::focar } })
        }.also { it.aoMudar = ::atualizarAcoes }
    }

    private fun trocar(id: String) {
        (secoes[atual]?.vistaLivre as? OuvidoView)?.calar()
        pausarVoz()
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
        (secoes["voz"]?.vistaLivre as? VozView)?.takeIf { atual == "voz" }?.let { v ->
            lateinit var d: android.app.Dialog
            d = folha(T("ajustes"), v.corpoAjustes { d.dismiss() })
            d.show()
            return
        }
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
        // The microphone permission dialog pauses the activity too: that is not leaving, so the attempt and the piano go on.
        if (aoMic != null) return super.onPause()
        pausarVoz()
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

    /** While singing, the section bar steps aside (switching sections mid-attempt makes no sense); it comes back when it ends. */
    private fun focar(sim: Boolean) {
        if (SECOES.size < 2) return
        abas.animate().cancel()
        if (sim) abas.animate().alpha(0f).translationY(dp(24).toFloat()).setDuration(160).withEndAction { abas.visibility = View.GONE }.start()
        else { abas.visibility = View.VISIBLE; abas.animate().alpha(1f).translationY(0f).setDuration(160).start() }
    }

    private fun pausarVoz() {
        secoes["voz"]?.let { (it.vistaLivre as? VozView)?.pausar(); (it.vistaBloco as? VozView)?.pausar() }
    }

    // ---------------------------------------------------------------- microphone permission
    enum class Mic { OK, NEGADO, BLOQUEADO }
    private var aoMic: ((Mic) -> Unit)? = null

    /** Asks for the microphone once; [cb] learns whether it may open, was denied, or is blocked ("don't ask again"). */
    fun pedirMic(cb: (Mic) -> Unit) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) return cb(Mic.OK)
        aoMic = cb
        requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), PEDIDO_MIC)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != PEDIDO_MIC) return
        val cb = aoMic ?: return
        aoMic = null
        cb(when {
            grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED -> Mic.OK
            grantResults.isNotEmpty() && !shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO) -> Mic.BLOQUEADO
            else -> Mic.NEGADO
        })
    }

    /** The app's page in the system settings, where a blocked permission is turned back on. */
    fun abrirConfiguracoes() {
        startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
    }

    companion object {
        /** Sections that ship in this build. */
        val SECOES = setOf("ouvido", "voz")
        private const val PEDIDO_MIC = 7
        /** Debug builds: a fake voice instead of the microphone (see VozView.simularVoz). */
        var simular = false
    }
}

/**
 * The sections as the Tuner's floating bar (BottomNav.kt): a 56 dp pill, the chosen section filled with ink. Hidden while there is
 * only one section.
 */
class Abas(ctx: android.content.Context, itens: List<Pair<String, String>>, inicial: String, aoTrocar: (String) -> Unit) : LinearLayout(ctx) {
    private val vistas = ArrayList<Pair<String, TextView>>()

    init {
        orientation = HORIZONTAL
        visibility = if (itens.size < 2) GONE else VISIBLE
        background = forma(C.superficie, dp(28).toFloat())
        setPadding(dp(6), dp(6), dp(6), dp(6))
        elevation = dp(6).toFloat()
        itens.forEach { (id, r) ->
            val tv = TextView(ctx).apply {
                text = r
                papel(Papel.BODY)
                textSize = 15f
                gravity = Gravity.CENTER
                isClickable = true
                isFocusable = true
                setOnClickListener { escolher(id); aoTrocar(id) }
            }
            vistas += id to tv
            addView(tv, LayoutParams(0, LayoutParams.MATCH_PARENT, 1f))
        }
        escolher(inicial)
    }

    fun escolher(id: String) {
        val raio = dp(22).toFloat()
        vistas.forEach { (k, tv) ->
            val on = k == id
            tv.setTextColor(if (on) C.fundo else C.tinta)
            tv.isSelected = on
            tv.background = context.toque(forma(if (on) C.tinta else Color.TRANSPARENT, raio), raio)
        }
    }
}
