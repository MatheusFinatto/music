package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import br.musica.marmotatuner.treino.BlocoPlano
import br.musica.marmotatuner.treino.MINUTOS
import br.musica.marmotatuner.treino.SOBRA_S
import br.musica.marmotatuner.treino.estimarSegundos
import br.musica.marmotatuner.treino.focosDe
import br.musica.marmotatuner.treino.medianaDe
import br.musica.marmotatuner.treino.minutosParaMostrar
import br.musica.marmotatuner.treino.planejar

/**
 * A section (ear or voice) with its two ways to train, one at a time: a ready program (the default) or a chosen exercise.
 * During a program, the progress card and the block of the moment take the place of the picker; at the end, the summary.
 * Same flow as the site's Programas.tsx; :core plans the blocks from the person's own pace.
 */
@SuppressLint("ViewConstructor")
class SecaoView(
    ctx: Context,
    private val secao: String,
    private val dados: Dados,
    private val livre: () -> View,
    private val blocoDe: (Bloco) -> View,
) : LinearLayout(ctx) {
    private class Resultado(val exercicio: String, val acertos: Int, val total: Int, val pulado: Boolean)
    private class Rodando(val foco: String, val minutos: Int, val plano: Array<BlocoPlano>, var i: Int = 0, var feitas: Int = 0, var acertos: Int = 0,
                          val resultados: MutableList<Resultado> = ArrayList(), val inicio: Long = System.currentTimeMillis(), val previsto: Double)
    private class Fim(val foco: String, val minutos: Int, val resultados: List<Resultado>, val realS: Double, val previsto: Double)

    private var modo = 0 // 0 = program, 1 = exercises
    private var rodando: Rodando? = null
    private var fim: Fim? = null
    private val seletor = Segmentado(ctx, listOf(T("comoTreinar.programa"), T("comoTreinar.livre")), 0) { modo = it; render() }
    /** Told after every change, so the app bar can show the actions that fit (settings only in free mode). */
    var aoMudar: () -> Unit = {}
    val livreAberto get() = rodando == null && modo == 1
    private val corpo = FrameLayout(ctx)
    /** The view the free mode shows (kept while switching, so a question in progress survives). */
    var vistaLivre: View? = null
        private set
    /** The exercise view of the running block, if any. */
    var vistaBloco: View? = null
        private set

    init {
        orientation = VERTICAL
        seletor.contentDescription = T("comoTreinar.rotulo")
        addView(seletor, lp().margens(b = dp(20)))
        addView(corpo, lp())
        render()
    }

    private fun nomeDe(ex: String) = T(if (secao == "voz") "voz.exercicios.$ex" else "exercicios.$ex")

    val emPrograma get() = rodando != null

    /** System Back during a program stops it (what was answered goes to the summary). Returns true if it handled Back. */
    fun voltar(): Boolean {
        if ((vistaLivre as? VozView)?.takeIf { rodando == null && modo == 1 }?.voltar() == true) return true
        val x = rodando ?: return false
        parar(x)
        return true
    }

    private fun comecar(foco: String, minutos: Int) {
        val r = dados.ritmo()
        val plano = planejar(secao, foco, minutos, r.d)
        fim = null
        rodando = Rodando(foco, minutos, plano, previsto = estimarSegundos(plano, r.d))
        render()
    }

    private fun fechar(x: Rodando, pulado: Boolean) {
        x.resultados += Resultado(x.plano[x.i].exercicio, x.acertos, x.feitas, pulado)
        if (x.i + 1 < x.plano.size) {
            x.i++; x.feitas = 0; x.acertos = 0
        } else {
            rodando = null
            fim = Fim(x.foco, x.minutos, x.resultados.toList(), (System.currentTimeMillis() - x.inicio) / 1000.0, x.previsto)
        }
        render()
    }

    private fun parar(x: Rodando) {
        if (x.feitas > 0) x.resultados += Resultado(x.plano[x.i].exercicio, x.acertos, x.feitas, false)
        rodando = null
        if (x.resultados.isNotEmpty()) fim = Fim(x.foco, x.minutos, x.resultados.toList(), (System.currentTimeMillis() - x.inicio) / 1000.0, x.previsto)
        render()
    }

    private fun segundosRestantes(x: Rodando): Double {
        val d = dados.ritmo().d
        return x.plano.withIndex().sumOf { (k, b) ->
            val custo = medianaDe(b.exercicio, d) + SOBRA_S
            when {
                k < x.i -> 0.0
                k == x.i -> maxOf(0, b.perguntas - x.feitas) * custo
                else -> b.perguntas * custo
            }
        }
    }

    // Progress card pieces, updated in place while a block runs (the block view is not rebuilt per answer).
    private var andamentoNome: android.widget.TextView? = null
    private var andamentoN: android.widget.TextView? = null
    private var barra: Barra? = null

    private fun atualizarAndamento() {
        val x = rodando ?: return
        val atual = x.plano[x.i]
        val total = x.plano.sumOf { it.perguntas }
        val feitas = x.plano.withIndex().sumOf { (k, b) -> if (k < x.i) b.perguntas else if (k == x.i) minOf(x.feitas, b.perguntas) else 0 }
        // O que importa agora é o exercício do bloco; o resto (bloco, respondidas, tempo) vai na linha de baixo, menor.
        andamentoNome?.text = nomeDe(atual.exercicio)
        andamentoN?.text = "${T("programas.bloco", "i" to x.i + 1, "n" to x.plano.size)} · ${T("programas.respondidas", "i" to minOf(x.feitas, atual.perguntas), "n" to atual.perguntas)} · ${T("programas.restantes", "n" to minutosParaMostrar(segundosRestantes(x)))}"
        barra?.apply { fracao = feitas.toDouble() / total; invalidate(); contentDescription = "${T("programas.andamento")}: $feitas / $total" }
    }

    fun render() {
        renderizar()
        aoMudar()
    }

    private fun renderizar() {
        corpo.removeAllViews()
        vistaBloco = null
        val x = rodando
        seletor.visibility = if (x == null) VISIBLE else GONE
        if (x != null) {
            val col = context.coluna(16)
            val card = context.cartao().apply {
                accessibilityPaneTitle = T("programas.andamento")
                andamentoNome = context.texto("", Papel.TITLE_LARGE).cabecalho()
                andamentoN = context.texto("", Papel.BODY_SMALL, C.apagado)
                barra = Barra(context, 0.0, C.azul)
                addView(andamentoNome)
                addView(andamentoN, lp().margens(t = dp(4)))
                addView(barra, LayoutParams(LayoutParams.MATCH_PARENT, dp(6)).margens(t = dp(14), b = dp(14)))
                addView(context.linha(10).apply {
                    addView(context.botao(T("programas.pular"), Estilo.TONAL) { fechar(x, true) })
                    addView(context.botao(T("programas.parar"), Estilo.TONAL) { parar(x) })
                })
            }
            col.addView(card)
            val atual = x.plano[x.i]
            val proximo = x.plano.getOrNull(x.i + 1)
            val v = blocoDe(Bloco(
                exercicio = atual.exercicio,
                restante = { maxOf(0, atual.perguntas - x.feitas) },
                rotuloFim = if (proximo != null) T("programas.proximoBloco", "nome" to nomeDe(proximo.exercicio)) else T("programas.terminar"),
                aoResponder = { certo -> x.feitas++; if (certo) x.acertos++; atualizarAndamento() },
                aoAvancar = { fechar(x, false) },
            ))
            vistaBloco = v
            col.addView(v)
            corpo.addView(col)
            atualizarAndamento()
            return
        }
        if (modo == 1) {
            val v = vistaLivre ?: livre().also { vistaLivre = it }
            (v.parent as? android.view.ViewGroup)?.removeView(v)
            corpo.addView(v)
            return
        }
        val f = fim
        if (f != null) {
            corpo.addView(context.cartao().apply {
                addView(context.texto(T("programas.resumoTitulo"), Papel.TITLE_LARGE).cabecalho())
                val acertos = f.resultados.sumOf { it.acertos }
                val total = f.resultados.sumOf { it.total }
                addView(context.texto("${T("programas.resumoAcertos", "acertos" to acertos, "total" to total)} · ${T("programas.resumoTempo", "real" to minutosParaMostrar(f.realS), "previsto" to minutosParaMostrar(f.previsto))}", Papel.BODY, C.apagado).apply {
                    accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
                }, lp().margens(t = dp(6), b = dp(12)))
                f.resultados.forEach { y ->
                    addView(context.linha().apply {
                        minimumHeight = dp(40)
                        addView(context.texto(nomeDe(y.exercicio), Papel.BODY), LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
                        addView(context.texto(if (y.pulado) T("programas.resumoPulado") else T("programas.resumoBloco", "acertos" to y.acertos, "total" to y.total), Papel.LABEL, C.apagado))
                    })
                }
                addView(context.botao(T("programas.refazer"), Estilo.CHEIO, alto = true) { comecar(f.foco, f.minutos) }, lp().margens(t = dp(16)))
                addView(context.botao(T("programas.voltar"), Estilo.TONAL) { fim = null; render() }, lp().margens(t = dp(10)))
            })
            return
        }
        val r = dados.ritmo()
        val minutos = r.ultimo.getValue(secao)
        val foco = r.foco.getValue(secao)
        val plano = planejar(secao, foco, minutos, r.d)
        val previsto = minutosParaMostrar(estimarSegundos(plano, r.d))
        corpo.addView(context.cartao().apply {
            addView(context.rotulo(T("programas.foco")))
            val focos = Fluxo(context)
            focosDe(secao).forEach { fo -> focos.addView(Chip(context, T("programas.focos.$fo"), radio = true) { r.foco[secao] = fo; dados.salvar(r); render() }.apply { marcado = fo == foco }) }
            addView(focos, lp().margens(b = dp(12)))
            addView(context.rotulo(T("programas.tempo")))
            val tempos = Fluxo(context)
            MINUTOS.forEach { m -> tempos.addView(Chip(context, T("programas.minutos", "n" to m), radio = true) { r.ultimo[secao] = m; dados.salvar(r); render() }.apply { marcado = m == minutos }) }
            addView(tempos, lp().margens(b = dp(12)))
            addView(context.texto(plano.joinToString(" · ") { nomeDe(it.exercicio) } + if (previsto != minutos) " · ${T("programas.aprox", "n" to previsto)}" else "", Papel.BODY_SMALL, C.apagado), lp().margens(b = dp(20)))
            addView(context.botao(T("programas.comecar", "n" to minutos), Estilo.CHEIO, alto = true) { comecar(foco, minutos) }, lp())
        })
    }
}
