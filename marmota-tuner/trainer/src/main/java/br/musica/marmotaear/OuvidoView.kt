package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import br.musica.marmotatuner.treino.ConfigClassica
import br.musica.marmotatuner.treino.DIRECOES
import br.musica.marmotatuner.treino.HARMONIA
import br.musica.marmotatuner.treino.INTERVALOS
import br.musica.marmotatuner.treino.MARGENS
import br.musica.marmotatuner.treino.PLACAR_ZERO
import br.musica.marmotatuner.treino.PerguntaClassica
import br.musica.marmotatuner.treino.PianoNote
import br.musica.marmotatuner.treino.RESPOSTAS_AFINACAO
import br.musica.marmotatuner.treino.acordeNoBraco
import br.musica.marmotatuner.treino.compararAfinacao
import br.musica.marmotatuner.treino.nomeAcorde
import br.musica.marmotatuner.treino.nomeNota
import br.musica.marmotatuner.treino.nomeTom
import br.musica.marmotatuner.treino.perguntaClassica
import br.musica.marmotatuner.treino.registrar
import br.musica.marmotatuner.treino.somar
import kotlin.math.abs
import kotlin.random.Random

/** What a program block hands the exercise: which one, how many questions are left, and how to report back. */
class Bloco(
    val exercicio: String,
    /** Questions left in this block (0 = the last one was answered). */
    val restante: () -> Int,
    /** Text of the button that closes the block ("Próximo bloco: Acordes" or "Terminar programa"). */
    val rotuloFim: String,
    val aoResponder: (Boolean) -> Unit,
    val aoAvancar: () -> Unit,
)

/** Exercises grouped as on the site: notes, then harmony. */
private val GRUPOS = listOf("notas" to listOf("intervalos", "acordes", "afinacao", "achar"), "harmonia" to listOf("campo", "cadencias", "progressoes"))

/**
 * Ear training: listen, pick the answer and see on the keyboard (or neck) what was played. The same flow as the site's
 * TreinoDeOuvido.tsx, on :core's question drawing. With [bloco] it runs one block of a timed program (default settings, no chooser).
 */
@SuppressLint("ViewConstructor")
class OuvidoView(ctx: Context, private val dados: Dados, private val bloco: Bloco? = null) : LinearLayout(ctx) {
    private var s = dados.ouvido()
    private var q: PerguntaClassica? = null
    private var escolha: String? = null
    /** Tuning: the interval the person named, waiting for the other half (flat, in tune or sharp). */
    private var intervaloDito: String? = null
    private var selecionada: Int? = null
    private var teclaTocando: Int? = null
    private var placar = PLACAR_ZERO
    private var tocando = false
    private var carregando = false
    private var erro: String? = null
    private var inicioPergunta = 0L
    private var geracaoSom = 0
    private val main = Handler(Looper.getMainLooper())

    private val exercicio get() = bloco?.exercicio ?: s.exercicio
    private val afinacao get() = exercicio == "afinacao"
    private val harmonia get() = exercicio in HARMONIA
    private val achar get() = exercicio == "achar"
    private val respondida get() = q != null && escolha != null

    // Persistent pieces (the instrument keeps its scroll; the rest is refilled on every change).
    private val escolhas = context.coluna(4)
    private val placarTexto = context.texto("", Papel.LABEL, C.apagado)
    private val ouvir = BotaoOuvir(context) { aoOuvir() }
    private val titulo = context.texto("", Papel.TITLE_LARGE).cabecalho()
    private val dica = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val respostas = Grade(context)
    private val rotuloIntervalo = context.rotulo(T("afinacaoIntervalo"))
    private val intervalos = Grade(context)
    private val rotuloSegunda = context.rotulo(T("afinacaoSegunda"))
    private val caixaInstrumento = FrameLayout(context)
    private var instrumento: Instrumento = criarInstrumento()
    private val responderAchar = context.botao(T("responder"), Estilo.CHEIO, alto = true) { confirmar() }
    private val revela = context.coluna(14)
    private val estado = context.texto("", Papel.BODY_SMALL, C.apagado).apply { accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE }

    init {
        orientation = VERTICAL
        if (bloco == null) {
            addView(escolhas, lp().margens(b = dp(12)))
        }
        val palco = context.cartao()
        palco.addView(placarTexto, lp().margens(b = dp(8)))
        palco.addView(context.linha(16).apply {
            gravity = Gravity.CENTER_VERTICAL
            addView(ouvir, LayoutParams(dp(72), dp(72)))
            addView(context.coluna(4).apply { addView(titulo); addView(dica) }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        }, lp().margens(b = dp(20)))
        palco.addView(rotuloIntervalo, lp())
        palco.addView(intervalos, lp().margens(t = dp(4), b = dp(12)))
        palco.addView(rotuloSegunda, lp())
        palco.addView(respostas, lp().margens(t = dp(4), b = dp(20)))
        palco.addView(caixaInstrumento, lp())
        palco.addView(responderAchar, lp().margens(t = dp(16)))
        palco.addView(revela, lp().margens(t = dp(20)))
        palco.addView(estado, lp().margens(t = dp(8)))
        addView(palco, lp())
        caixaInstrumento.addView(instrumento.vista)
        render()
        if (bloco != null) post { nova() } // a program block starts by itself: the tap on "Começar" already happened
        Piano.carregar(context) { ok -> if (!ok) { erro = "erroPiano"; render() } }
    }

    private fun criarInstrumento(): Instrumento =
        (if (dados.instrumento == "violao") BracoView(context, T("braco")) else TecladoView(context, T("teclado"))).also { it.aoTocar = ::tocarTecla }

    /** Called from the settings sheet when the instrument changes. */
    fun trocarInstrumento() {
        caixaInstrumento.removeAllViews()
        instrumento = criarInstrumento()
        caixaInstrumento.addView(instrumento.vista)
        render()
    }

    // ---------------------------------------------------------------- sound
    private fun tocar(notas: Array<PianoNote>, botao: Boolean = true) {
        if (!Piano.carregado) {
            carregando = true
            render()
            Piano.carregar(context) { ok ->
                carregando = false
                if (ok) tocar(notas, botao) else { erro = "erroPiano"; render() }
            }
            return
        }
        erro = null
        val dur = Piano.tocar(notas) ?: return
        if (!botao) return
        val id = ++geracaoSom
        tocando = true
        ouvir.tocando = true
        main.postDelayed({ if (id == geracaoSom) { tocando = false; ouvir.tocando = false } }, (dur * 1000).toLong())
    }

    fun calar() {
        Piano.calar()
        geracaoSom++
        tocando = false
        ouvir.tocando = false
    }

    private fun notasDaPergunta() = q?.notas ?: emptyArray()

    private fun aoOuvir() {
        if (q == null) nova() else tocar(notasDaPergunta())
    }

    // ---------------------------------------------------------------- flow
    private fun config(): ConfigClassica {
        val base = if (bloco != null) Dados.Ouvido() else s
        val ex = exercicio
        return ConfigClassica(ex, (base.itens[ex] ?: Ids.de(ex)).toTypedArray(), base.direcao, base.margem, base.tonica)
    }

    fun nova() {
        val h = if (s.reforco) s.historico else null
        val p = perguntaClassica(config(), { Random.nextDouble() }, h)
        q = p
        escolha = null
        intervaloDito = null
        selecionada = null
        inicioPergunta = SystemClock.elapsedRealtime()
        tocar(p.notas)
        render()
        titulo.sendAccessibilityEvent(android.view.accessibility.AccessibilityEvent.TYPE_VIEW_FOCUSED)
    }

    private fun finalizar(id: String, certo: Boolean) {
        val p = q ?: return
        escolha = id
        dados.anotarDuracao(exercicio, (SystemClock.elapsedRealtime() - inicioPergunta).toDouble())
        bloco?.aoResponder?.invoke(certo)
        placar = somar(placar, certo)
        s.historico = registrar(s.historico, p.chave, certo)
        dados.salvar(s)
        performHapticFeedback(if (certo) android.view.HapticFeedbackConstants.CONFIRM else android.view.HapticFeedbackConstants.REJECT)
        render()
        // O resultado e o "Próxima" ficam abaixo do instrumento: rola até eles, sem o dedo ir buscar.
        revela.post { revela.requestRectangleOnScreen(android.graphics.Rect(0, 0, revela.width, revela.height + dp(FOLGA_BARRA_DP)), false) }
    }

    private fun responder(id: String) {
        val p = q ?: return
        if (escolha != null) return
        // Tuning has two halves, the interval and how the second note sounds: right only with both.
        val intervalo = p.intervalo
        if (intervalo != null) {
            val dito = intervaloDito ?: return
            finalizar(id, id == p.resposta && dito == intervalo)
            return
        }
        finalizar(id, id == p.resposta)
    }

    private fun dizerIntervalo(id: String) {
        if (q == null || escolha != null) return
        intervaloDito = id
        render()
    }

    /** "Achar": checks the chosen key against the second note. */
    private fun confirmar() {
        val p = q ?: return
        val sel = selecionada ?: return
        if (escolha != null) return
        val certo = sel == p.alvo
        teclaTocando = null
        finalizar(if (certo) p.resposta else "errado", certo)
    }

    private fun tocarTecla(midi: Int) {
        tocar(arrayOf(PianoNote(midi, 0.0, 1.2)), botao = false)
        teclaTocando = midi
        main.postDelayed({ if (teclaTocando == midi) { teclaTocando = null; render() } }, 1300)
        if (achar && q != null && escolha == null) selecionada = midi
        render()
    }

    private fun avancar() {
        val b = bloco
        if (b != null && b.restante() == 0) b.aoAvancar() else nova()
    }

    /** Changing the exercise drops the question in progress, silences the piano and resets the score. */
    private fun mudarExercicio(ex: String) {
        s.exercicio = ex
        dados.salvar(s)
        calar()
        q = null
        escolha = null
        intervaloDito = null
        selecionada = null
        placar = PLACAR_ZERO
        render()
    }

    /** Settings changed in the sheet: reload and drop the question (the score stays). */
    fun ajustesMudaram() {
        s = dados.ouvido()
        calar()
        q = null
        escolha = null
        intervaloDito = null
        selecionada = null
        render()
    }

    // ---------------------------------------------------------------- texts
    private fun nome(grupo: String, id: String) = T("nomes.$grupo.$id")
    private fun dicaDe(grupo: String, id: String) = if (T.tem("dicas.$grupo.$id")) T("dicas.$grupo.$id") else null
    private fun nomeCompleto(grupo: String, id: String) = dicaDe(grupo, id)?.let { "${nome(grupo, id)} ($it)" } ?: nome(grupo, id)

    private fun textoPergunta() = when {
        q == null -> T("perguntaInicial")
        harmonia || achar -> T("pergunta_$exercicio")
        exercicio == "acordes" -> T("perguntaAcordes")
        afinacao -> T("perguntaAfinacao")
        else -> T("perguntaIntervalos")
    }

    private fun textoDica() = when {
        afinacao -> T("dicaAfinacao", "margem" to config().margem)
        harmonia || achar -> T("dica_$exercicio")
        exercicio == "acordes" -> T("dicaAcordes")
        else -> T("dicaIntervalos")
    }

    private fun detalhe(p: PerguntaClassica): String {
        val tocadas = p.notas.map { it.midi }
        val harmonico = p.notas.size == 2 && p.notas[0].at == p.notas[1].at
        val juntar = if (harmonico) " + " else " → "
        val tonica = p.tonica
        val acordes = p.acordes
        val cents = p.cents
        return when {
            tonica != null && acordes != null ->
                "${T("tomMaior", "nota" to nomeTom(tonica))}: ${acordes.joinToString(" – ") { nome("campo", it) }} (${acordes.joinToString(" – ") { nomeAcorde(tonica, it) }})"
            cents != null -> {
                val intervalo = INTERVALOS.firstOrNull { it.semitons == abs(tocadas[0] - tocadas[1]) }
                val c = if (cents == 0) T("exatamenteAfinado") else T(if (cents > 0) "centsAcima" else "centsAbaixo", "n" to abs(cents))
                "$c · ${intervalo?.let { nome("intervalos", it.id) } ?: ""} · ${tocadas.joinToString(juntar) { nomeNota(it) }}"
            }
            p.chave.startsWith("intervalos") || p.chave.startsWith("achar") ->
                "${T("semitons", "n" to abs(tocadas[0] - tocadas[1]))} · ${tocadas.joinToString(juntar) { nomeNota(it) }}"
            else -> tocadas.joinToString(" · ") { nomeNota(it) }
        }
    }

    // ---------------------------------------------------------------- render
    fun render() {
        val p = q
        // Exercise chooser (free training only).
        if (bloco == null) {
            // One line per group that scrolls sideways (as Material chip rows do): the stage stays near the top of the screen.
            val rolagens = (0 until escolhas.childCount).map { (escolhas.getChildAt(it) as android.widget.HorizontalScrollView).scrollX }
            escolhas.removeAllViews()
            GRUPOS.forEachIndexed { k, (grupo, lista) ->
                val l = context.linha(8)
                l.addView(context.texto(T("grupoExercicios.$grupo"), Papel.LABEL, C.apagado).apply { minWidth = dp(72) })
                var marcadoChip: View? = null
                for (e in lista) l.addView(Chip(context, T("exercicios.$e"), radio = true) { mudarExercicio(e) }.apply { marcado = e == exercicio; if (marcado) marcadoChip = this })
                val r = context.rolagemHorizontal(l)
                r.post {
                    val x = rolagens.getOrNull(k) ?: 0
                    val c = marcadoChip
                    // Keep the chosen exercise in view: scroll only if it would be cut at either edge.
                    val alvo = if (c == null) x else when {
                        c.right - x > r.width -> c.right - r.width + dp(16)
                        c.left - x < 0 -> maxOf(0, c.left - dp(16))
                        else -> x
                    }
                    r.scrollTo(alvo, 0)
                }
                escolhas.addView(r)
            }
        }
        placarTexto.visibility = if (placar.total > 0 && bloco == null) VISIBLE else GONE
        placarTexto.text = "${T("placar", "acertos" to placar.acertos, "total" to placar.total)} ${T("acertos")} · ${T("sequenciaRotulo")} ${placar.sequencia}"

        ouvir.contentDescription = T(if (p == null) "ouvirPrimeira" else "ouvir")
        ouvir.ativo(!carregando)
        titulo.text = textoPergunta()
        // A frase do exercício só aparece parada, antes de tocar a primeira pergunta: durante as perguntas o palco fica enxuto.
        dica.text = textoDica()
        dica.visibility = if (p == null) VISIBLE else GONE

        // Answers: tuning answers flat/in tune/sharp; "achar" answers on the instrument.
        val grupoChips = exercicio
        val lista: List<String> = when {
            achar -> emptyList()
            afinacao -> RESPOSTAS_AFINACAO.toList()
            else -> config().itens.toList()
        }
        respostas.visibility = if (lista.isEmpty()) GONE else VISIBLE
        val intervaloCerto = p?.intervalo
        listOf(rotuloIntervalo, intervalos, rotuloSegunda).forEach { it.visibility = if (afinacao) VISIBLE else GONE }
        if (afinacao) intervalos.itens(config().itens.map { id ->
            val st = when {
                p == null -> null
                escolha != null -> if (id == intervaloCerto) true else if (id == intervaloDito) false else null
                else -> null
            }
            BotaoResposta(context, nome("intervalos", id), null, st, escolhida = escolha == null && id == intervaloDito) { dizerIntervalo(id) }.apply {
                ativo(p != null && escolha == null || st != null)
                isEnabled = p != null && escolha == null
            }
        })
        respostas.itens(cols = if (afinacao) 3 else 2, views = lista.map { id ->
            val estadoResp = if (escolha == null || p == null) null else if (id == p.resposta) true else if (id == escolha) false else null
            BotaoResposta(context, nome(grupoChips, id), dicaDe(grupoChips, id), estadoResp) { responder(id) }.apply {
                val espera = afinacao && intervaloDito == null
                ativo(p != null && escolha == null && !espera || estadoResp != null)
                isEnabled = p != null && escolha == null && !espera
            }
        })

        // Instrument marks: before the answer only what is given; after, the notes played (target).
        val marcas = LinkedHashMap<Int, Marca>()
        if (p != null && !respondida && achar) p.dada?.let { marcas[it] = Marca.DADA }
        if (achar && !respondida) selecionada?.let { marcas[it] = Marca.SEL }
        val acertou = respondida && escolha == p?.resposta && (p?.intervalo == null || intervaloDito == p.intervalo)
        if (respondida && p != null) {
            val revelar = p.reveal?.toList() ?: if (harmonia) emptyList() else p.notas.map { it.midi }
            revelar.forEach { marcas[it] = Marca.ALVO }
            if (achar && !acertou) selecionada?.let { marcas[it] = Marca.ERRADA }
        }
        teclaTocando?.let { marcas[it] = Marca.TOCA }
        val acordeAlvo = if (respondida && p != null && (exercicio == "acordes" || exercicio == "campo")) (p.reveal ?: p.notas.map { it.midi }.toTypedArray()) else null
        val extras = if (instrumento is BracoView && acordeAlvo != null) (acordeNoBraco(acordeAlvo)?.map { Extra(it.corda, it.casa, it.midi, Marca.ALVO) } ?: emptyList()) else emptyList()
        instrumento.mostrar(p?.notas?.map { it.midi } ?: listOf(48, 71), marcas, extras)

        responderAchar.visibility = if (achar && p != null && !respondida) VISIBLE else GONE
        responderAchar.ativo(selecionada != null && !carregando)

        // Reveal.
        revela.removeAllViews()
        revela.visibility = if (respondida) VISIBLE else GONE
        if (respondida && p != null) {
            val resultado = when {
                acertou -> T("certo")
                achar -> T("errado", "resposta" to nomeNota(p.alvo!!))
                p.intervalo != null -> T("afinacaoErrado", "intervalo" to nome("intervalos", p.intervalo!!), "sentido" to nome("afinacao", p.resposta).lowercase())
                else -> T("errado", "resposta" to nomeCompleto(grupoChips, p.resposta))
            }
            revela.addView(View(context).apply { setBackgroundColor(C.linha) }, LayoutParams(LayoutParams.MATCH_PARENT, 1))
            val res = context.texto(resultado, Papel.TITLE_LARGE, if (acertou) C.verde else C.vermelho).apply {
                accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_ASSERTIVE
            }
            revela.addView(res)
            p.cents?.let { cents ->
                revela.addView(ReguaView(context, cents, config().margem), lp())
                if (cents != 0) {
                    val f = Fluxo(context)
                    f.addView(context.botao(T("ouvirComoEstava"), Estilo.TONAL) { tocar(p.notas) })
                    f.addView(context.botao(T("ouvirAfinado"), Estilo.TONAL) { tocar(p.notas.map { it.copy(cents = 0.0) }.toTypedArray()) })
                    f.addView(context.botao(T("compararDois"), Estilo.TONAL) { tocar(compararAfinacao(p.notas)) })
                    revela.addView(f)
                }
            }
            revela.addView(context.texto(detalhe(p), Papel.BODY_SMALL, C.apagado))
            val fim = bloco?.takeIf { it.restante() == 0 }?.rotuloFim ?: T("proxima")
            revela.addView(context.botao(fim, Estilo.CHEIO, alto = true) { avancar() }, lp())
        }
        estado.text = when {
            carregando -> T("app.carregandoPiano")
            erro != null -> T(erro!!)
            else -> ""
        }
        estado.visibility = if (estado.text.isEmpty()) GONE else VISIBLE
    }

    // ---------------------------------------------------------------- sheets
    /** The settings sheet body for the current exercise (Tonalidade, Direção, Margem, Instrumento, Reforço, O que treinar). */
    fun corpoAjustes(aoMudarInstrumento: () -> Unit): View {
        val c = context.coluna(16)
        fun grupo(titulo: String, opcoes: List<Pair<String, String>>, atual: String, aoEscolher: (String) -> Unit) {
            c.addView(context.coluna(2).apply {
                addView(context.rotulo(titulo))
                val f = Fluxo(context)
                val chips = ArrayList<Chip>()
                opcoes.forEach { (id, r) -> chips += Chip(context, r, radio = true) { ch -> chips.forEach { it.marcado = it === ch }; aoEscolher(id) }.apply { marcado = id == atual } }
                chips.forEach { f.addView(it) }
                addView(f)
            })
        }
        if (harmonia) grupo(T("tonalidade"), listOf("do" to T("tonicas.do"), "sorteada" to T("tonicas.sorteada")), s.tonica) { s.tonica = it; dados.salvar(s); ajustesMudaram() }
        if (exercicio == "intervalos" || afinacao) grupo(T("direcao"), DIRECOES.map { it to T("direcoes.$it") }, s.direcao) { s.direcao = it; dados.salvar(s); ajustesMudaram() }
        if (afinacao) grupo(T("margem"), MARGENS.map { "$it" to T("margemCents", "n" to it) }, "${s.margem}") { s.margem = it.toInt(); dados.salvar(s); ajustesMudaram() }
        grupo(T("instrumento"), listOf("teclado" to T("instrumentos.teclado"), "violao" to T("instrumentos.violao")), dados.instrumento) { dados.instrumento = it; aoMudarInstrumento() }
        c.addView(context.interruptor(T("reforco"), s.reforco) { s.reforco = it; dados.salvar(s) })
        // Items: always at least one stays on.
        val ex = exercicio
        c.addView(context.coluna(2).apply {
            addView(context.rotulo(T("itens")))
            val f = Fluxo(context)
            val nomeChips = if (afinacao || achar) "intervalos" else ex
            Ids.de(ex).forEach { id ->
                f.addView(Chip(context, nomeCompleto(nomeChips, id)) { ch ->
                    val atual = s.itens[ex] ?: emptyList()
                    val tem = id in atual
                    if (tem && atual.size == 1) return@Chip
                    s.itens[ex] = if (tem) atual - id else Ids.de(ex).filter { it == id || it in atual }
                    ch.marcado = !tem
                    dados.salvar(s)
                    ajustesMudaram()
                }.apply { marcado = id in (s.itens[ex] ?: emptyList()) })
            }
            addView(f)
        })
        return c
    }

    /** The weak spots sheet: the items with the lowest hit rate (at least two answers), worst first. */
    fun corpoFracos(): View {
        val c = context.coluna(12)
        val fracos = s.historico.filter { it.total >= 2 }.map { h ->
            val (grupo, id) = h.chave.split(":").let { (it.getOrNull(0) ?: "") to (it.getOrNull(1) ?: "") }
            val rotulo = if (grupo == "afinacao") T("margemCents", "n" to (id.toIntOrNull() ?: 0)) else nome(if (grupo == "achar") "intervalos" else grupo, id)
            Triple(h, "${T("grupos.$grupo")} · $rotulo", h.certo.toDouble() / h.total)
        }.sortedWith(compareBy<Triple<br.musica.marmotatuner.treino.HistoricoItem, String, Double>> { it.third }.thenByDescending { it.first.total }).take(6)
        if (fracos.isEmpty()) {
            c.addView(context.texto(T("fracosVazio"), Papel.BODY, C.apagado))
            return c
        }
        for ((h, rot, taxa) in fracos) {
            c.addView(context.coluna(6).apply {
                addView(context.linha().apply {
                    addView(context.texto(rot, Papel.BODY), LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
                    addView(context.texto(T("acertoDe", "certo" to h.certo, "total" to h.total), Papel.LABEL, C.apagado))
                })
                addView(Barra(context, taxa), LayoutParams(LayoutParams.MATCH_PARENT, dp(6)))
                contentDescription = "$rot, ${T("acertoDe", "certo" to h.certo, "total" to h.total)}"
            })
        }
        c.addView(context.botao(T("apagar"), Estilo.CONTORNO) {
            s.historico = emptyArray()
            dados.salvar(s)
            c.removeAllViews()
            c.addView(context.texto(T("fracosVazio"), Papel.BODY, C.apagado))
        }, lp(LayoutParams.WRAP_CONTENT).margens(t = dp(8)))
        return c
    }
}

/** The big round play button: ivory, blue while the question sounds (blue = sounding now), with a ring that pulses. */
@SuppressLint("ViewConstructor")
class BotaoOuvir(ctx: Context, aoTocar: () -> Unit) : FrameLayout(ctx) {
    private val icone = android.widget.ImageView(ctx)
    var tocando = false
        set(v) { field = v; desenhar() }

    init {
        isClickable = true
        isFocusable = true
        setOnClickListener { aoTocar() }
        addView(icone, FrameLayout.LayoutParams(dp(32), dp(32), Gravity.CENTER))
        desenhar()
    }

    private fun desenhar() {
        val cor = if (tocando) C.azul else C.tinta
        val tinta = if (tocando) C.azulTinta else C.fundo
        background = context.toque(android.graphics.drawable.GradientDrawable().apply { shape = android.graphics.drawable.GradientDrawable.OVAL; setColor(cor) }, dp(36).toFloat(), tinta)
        icone.setImageDrawable(Icone(context, Icone.Tipo.PLAY, tinta, 32))
        animate().cancel()
        if (tocando) animate().scaleX(1.06f).scaleY(1.06f).setDuration(180).start() else animate().scaleX(1f).scaleY(1f).setDuration(180).start()
    }
}

/** An answer: a 56 dp pill like the Tuner's, outlined; green when it was the right one, red when it was the wrong pick. */
@SuppressLint("ViewConstructor")
class BotaoResposta(ctx: Context, rotulo: String, sub: String?, certa: Boolean?, escolhida: Boolean = false, aoTocar: () -> Unit) : LinearLayout(ctx) {
    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER_VERTICAL
        minimumHeight = dp(56)
        setPadding(dp(22), dp(8), dp(18), dp(8))
        isClickable = true
        isFocusable = true
        setOnClickListener { aoTocar() }
        val raio = dp(28).toFloat()
        val (fundo, tinta) = when (certa) {
            true -> forma(C.verde, raio) to C.sobreClaro
            false -> forma(C.vermelho, raio) to C.sobreClaro
            null -> if (escolhida) forma(Color.TRANSPARENT, raio, dp(2), C.verde) to C.verde else forma(Color.TRANSPARENT, raio, dp(1), C.linha) to C.tinta
        }
        isSelected = escolhida
        background = ctx.toque(fundo, raio, tinta)
        addView(ctx.texto(rotulo, Papel.LABEL, tinta).apply { setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 16f) })
        if (sub != null) addView(ctx.texto(sub, Papel.LABEL_SMALL, tinta).apply { alpha = 0.75f })
        contentDescription = listOfNotNull(rotulo, sub, when (certa) { true -> T("certo"); false -> T("app.marca.errada"); null -> null }).joinToString(", ")
    }
}

/** Two-column grid of answers, rows of equal height. */
class Grade(ctx: Context) : LinearLayout(ctx) {
    init { orientation = VERTICAL }

    /** Two columns by default; [cols] = 3 for short labels (flat, in tune, sharp fit one line). */
    fun itens(views: List<View>, cols: Int = 2) {
        removeAllViews()
        views.chunked(cols).forEachIndexed { k, par ->
            val l = context.linha()
            l.isBaselineAligned = false
            par.forEachIndexed { j, v -> l.addView(v, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f).margens(s = if (j > 0) dp(10) else 0)) }
            repeat(cols - par.size) { l.addView(View(context), LayoutParams(0, 0, 1f).margens(s = dp(10))) }
            addView(l, lp().margens(t = if (k > 0) dp(10) else 0))
        }
    }
}

/** A thin progress bar (hit rate, program progress). */
@SuppressLint("ViewConstructor")
class Barra(ctx: Context, var fracao: Double, private val cor: Int = C.verde) : View(ctx) {
    private val p = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
    override fun onDraw(c: android.graphics.Canvas) {
        val r = height / 2f
        p.color = C.superficieAlta
        c.drawRoundRect(0f, 0f, width.toFloat(), height.toFloat(), r, r, p)
        p.color = cor
        c.drawRoundRect(0f, 0f, (width * fracao.coerceIn(0.0, 1.0)).toFloat(), height.toFloat(), r, r, p)
    }
}

