package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import br.musica.marmota.common.AudioCapture
import br.musica.marmotatuner.PitchPipeline
import br.musica.marmotatuner.PitchSmoother
import br.musica.marmotatuner.treino.Acerto
import br.musica.marmotatuner.treino.Amostra
import br.musica.marmotatuner.treino.Faixa
import br.musica.marmotatuner.treino.Janela
import br.musica.marmotatuner.treino.LATENCIA_S
import br.musica.marmotatuner.treino.LIMIAR
import br.musica.marmotatuner.treino.MUSICAS
import br.musica.marmotatuner.treino.PianoNote
import br.musica.marmotatuner.treino.Resumo
import br.musica.marmotatuner.treino.Trecho
import br.musica.marmotatuner.treino.acertoDaNota
import br.musica.marmotatuner.treino.centsDe
import br.musica.marmotatuner.treino.dobrar
import br.musica.marmotatuner.treino.duracaoDe
import br.musica.marmotatuner.treino.ehCurta
import br.musica.marmotatuner.treino.janelas
import br.musica.marmotatuner.treino.musicaDe
import br.musica.marmotatuner.treino.nomeNota
import br.musica.marmotatuner.treino.resumir
import br.musica.marmotatuner.treino.sortearClasseDeVoz
import br.musica.marmotatuner.treino.tonicaParaCaber
import org.json.JSONObject
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.random.Random

/**
 * Singing songs (the site's Cantar.tsx): the piano gives the key, the notes scroll to the reading line and the person sings each one
 * as it arrives; a note counts if the right pitch was sung during its window (:core's acertoDaNota). With [bloco] it runs inside a
 * program: each attempt is a random checked phrase, it starts by itself and the last button moves the block on.
 */
@SuppressLint("ViewConstructor")
class CantarView(
    ctx: Context,
    private val dados: Dados,
    private val bloco: Bloco?,
    /** The voice settings in use (key, margin, octave, range); read on every attempt. */
    private val voz: () -> Dados.Voz,
    /** Saves a change to the song settings (song, phrase, speed, piano along) in the voice store. */
    private val salvarCfg: (JSONObject) -> Unit,
    /** Each finished attempt, for the score and the best mark. */
    private val aoResultado: (chave: String, Resumo) -> Unit,
    /** True while the phrase rolls (the section bar steps aside). */
    private val aoEmCurso: (Boolean) -> Unit,
    /** Changes the key (pitch class, -1 = random): a voice setting, shared with the other exercises. */
    private val escolherTonica: (Int) -> Unit,
) : LinearLayout(ctx) {
    private enum class Fase { PARADO, OUVINDO, CONTAGEM, CANTANDO, FEITO }

    private val main = Handler(Looper.getMainLooper())
    private var fase = Fase.PARADO
    private var sorteado: Pair<String, Int>? = if (bloco != null) sortearTrecho(null) else null
    private var tonicaMidi = 60
    private var js: Array<Janela> = emptyArray()
    private var inicio = 0.0 // uptime ms of the first beat of the first note (in the future during the count-in)
    private val amostras = ArrayList<Amostra>()
    private var vozAgora: Double? = null
    private var final: Pair<Array<Acerto>, Resumo>? = null
    private var contagem = 0
    private var atual = -1
    private var erroMic: String? = null
    private var geracao = 0
    private var captura: AudioCapture? = null
    private val suavizador = PitchSmoother()
    private val tempos = ArrayList<Runnable>()
    private var inicioTentativa = 0.0

    // ---------------------------------------------------------------- the song in use
    private fun cfg(): JSONObject = voz().musica
    private val musicaId get() = sorteado?.first ?: cfg().optString("musica").takeIf { id -> MUSICAS.any { it.id == id } } ?: MUSICAS[0].id
    private val musica get() = musicaDe(musicaId)
    private val trechoCfg get() = sorteado?.second ?: cfg().optInt("trecho", 0)
    /** The whole song: the phrases in sequence (they are consecutive phrases of the same melody). */
    private val inteira get() = trechoCfg == INTEIRA && musica.trechos.size > 1
    private val idx get() = if (inteira) INTEIRA else trechoCfg.coerceIn(0, musica.trechos.size - 1)
    private val trecho: Trecho get() = if (inteira) Trecho(musica.nome, musica.trechos.flatMap { it.notas.toList() }.toTypedArray()) else musica.trechos[idx]
    private val chave get() = "${musica.id}:${if (inteira) "inteira" else idx}"
    private val velocidade get() = if (bloco != null) 0.6 else cfg().optDouble("velocidade", 0.6).takeIf { it == 0.6 || it == 1.0 } ?: 0.6
    private val guia get() = if (bloco != null) true else cfg().optBoolean("guia", true)
    private val bpm get() = musica.bpm * velocidade
    private fun faixa(): Faixa = voz().faixa
    private fun tonicaClasse() = voz().inicio

    // ---------------------------------------------------------------- views
    private val escolhas = context.coluna(12)
    private val conferir = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val pista = PistaView(context)
    private val numero = context.texto("", Papel.HEADLINE).apply { gravity = Gravity.CENTER; setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 64f); importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO }
    private val letra = context.texto("", Papel.BODY).apply { contentDescription = T("voz.musica.letra") }
    private val estado = context.texto("", Papel.TITLE).apply { gravity = Gravity.CENTER; accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_POLITE }
    private val resultado = context.texto("", Papel.TITLE).apply { accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_ASSERTIVE }
    private val melhor = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val erro = context.coluna(10)
    private val acoes = context.coluna(10)
    private val rodape = context.texto(T("voz.fone"), Papel.BODY_SMALL, C.apagado)

    init {
        orientation = VERTICAL
        if (bloco == null) addView(escolhas, lp().margens(b = dp(12)))
        addView(conferir, lp().margens(b = dp(10)))
        addView(FrameLayout(context).apply {
            addView(pista, FrameLayout.LayoutParams(-1, -2))
            addView(numero, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))
        }, lp())
        addView(letra, lp().margens(t = dp(12)))
        addView(estado, lp().margens(t = dp(10)))
        addView(resultado, lp().margens(t = dp(14)))
        addView(melhor, lp().margens(t = dp(4)))
        addView(erro, lp().margens(t = dp(10)))
        addView(acoes, lp().margens(t = dp(18)))
        addView(rodape, lp().margens(t = dp(12)))
        tonicaMidi = tonicaParaCaber(max(0, tonicaClasse()), trecho.notas, faixa())
        js = janelas(trecho.notas, bpm, tonicaMidi)
        render()
        // In a program the attempt starts by itself (the tap on "Começar programa" or "Próximo bloco" already happened).
        if (bloco != null) post { cantar() }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (rodando()) parar()
    }

    private fun rodando() = fase == Fase.OUVINDO || fase == Fase.CONTAGEM || fase == Fase.CANTANDO
    fun pausar() { if (rodando()) parar() }
    fun voltar(): Boolean { if (!rodando()) return false; parar(); return true }

    /** The key or the range changed outside (settings): the melody moves, without interrupting anything rolling. */
    fun ajustesMudaram() {
        if (rodando()) return
        tonicaMidi = tonicaParaCaber(max(0, tonicaClasse()), trecho.notas, faixa())
        js = janelas(trecho.notas, bpm, tonicaMidi)
        render()
    }

    // ---------------------------------------------------------------- timers, microphone
    private fun depois(ms: Double, f: () -> Unit) { val r = Runnable { f() }; tempos += r; main.postDelayed(r, ms.toLong()) }

    private fun limpar() {
        geracao++
        tempos.forEach { main.removeCallbacks(it) }
        tempos.clear()
        if (!MainActivity.simular) captura?.stop()
        captura = null
        suavizador.reset()
        vozAgora = null
        Piano.calar()
    }

    private fun agora() = SystemClock.uptimeMillis().toDouble()

    private fun aoOuvir(bruto: Double?) {
        val midi = suavizador.push(bruto)
        vozAgora = midi
        if (fase == Fase.CANTANDO || fase == Fase.CONTAGEM) amostras += Amostra((agora() - inicio) / 1000, midi)
    }

    private fun abrirMic(g: Int, pronto: () -> Unit) {
        (context as MainActivity).pedirMic { r ->
            if (g != geracao) return@pedirMic
            if (r != MainActivity.Mic.OK) {
                erroMic = if (r == MainActivity.Mic.BLOQUEADO) "bloqueado" else "negado"
                fase = Fase.PARADO
                render()
                return@pedirMic
            }
            if (MainActivity.simular) {
                // Debug builds: a fake voice that follows the melody with a little delay and waver.
                val passo = object : Runnable {
                    override fun run() {
                        if (g != geracao) return
                        val t = (agora() - inicio) / 1000 - 0.2
                        val j = js.firstOrNull { it.midi != null && t >= it.ini && t < it.fim }
                        aoOuvir(j?.midi?.let { it + 0.1 * sin(t * 7) + (if (Random.nextInt(9) == 0) 1.0 else 0.0) })
                        main.postDelayed(this, 23)
                    }
                }
                captura = AudioCapture({ _, _ -> }, {})
                main.post(passo)
                return@pedirMic pronto()
            }
            val pipe = PitchPipeline(AudioCapture.SAMPLE_RATE)
            val cap = AudioCapture(
                onChunk = { chunk, n -> val m = pipe.process(chunk, n).midi; main.post { if (g == geracao) aoOuvir(m) } },
                onFailure = { main.post { if (g == geracao) { erroMic = "failed"; limpar(); fase = Fase.PARADO; render() } } },
            )
            captura = cap
            cap.start()
            erroMic = null
            pronto()
        }
    }

    private fun notasDoPiano(lista: Array<Janela>, depois: Double): Array<PianoNote> =
        lista.filter { it.midi != null }.map { PianoNote(it.midi!!, depois + it.ini, max(0.15, (it.fim - it.ini) * 0.92)) }.toTypedArray()

    // ---------------------------------------------------------------- flow
    private fun mudaFase(f: Fase) {
        val antes = rodando()
        fase = f
        if (rodando() != antes) aoEmCurso(rodando())
        pista.invalidate()
    }

    private fun comPiano(f: () -> Unit) {
        if (Piano.carregado) return f()
        Piano.carregar(context) { ok -> if (ok) f() else { fase = Fase.PARADO; erroMic = null; render() } }
    }

    private fun ouvir() {
        limpar()
        final = null
        amostras.clear()
        atual = -1
        val g = geracao
        comPiano {
            if (g != geracao) return@comPiano
            val dur = Piano.tocar(notasDoPiano(js, 0.3)) ?: return@comPiano
            inicio = agora() + 300 + 60
            mudaFase(Fase.OUVINDO)
            render()
            depois((duracaoDe(js) + 0.7) * 1000) { limpar(); mudaFase(Fase.PARADO); atual = -1; render() }
            if (dur <= 0) return@comPiano
        }
    }

    private fun cantar() {
        limpar()
        final = null
        erroMic = null
        amostras.clear()
        atual = -1
        pista.reiniciar()
        inicioTentativa = agora()
        // Each attempt with a "random" tonic changes key; the melody is the same.
        val classe = tonicaClasse()
        val tom = tonicaParaCaber(if (classe < 0) sortearClasseDeVoz { Random.nextDouble() } else classe, trecho.notas, faixa())
        tonicaMidi = tom
        val lista = janelas(trecho.notas, bpm, tom)
        js = lista
        val g = geracao
        // Load the samples first: then the clock and the microphone start together.
        comPiano {
            if (g != geracao) return@comPiano
            abrirMic(g) {
                val seg = 60 / bpm
                val espera = CONTAGEM * seg
                // The tonic sounds in the count-in (the person hears the key) and, with the piano along, the notes follow the lane.
                val notas = arrayOf(PianoNote(tom, 0.0, seg * 1.8)) + (if (guia) notasDoPiano(lista, espera) else emptyArray())
                if (Piano.tocar(notas) == null) { limpar(); mudaFase(Fase.PARADO); render(); return@abrirMic }
                inicio = agora() + espera * 1000 + 60
                mudaFase(Fase.CONTAGEM)
                contagem = CONTAGEM
                render()
                for (k in 1 until CONTAGEM) depois(k * seg * 1000) { contagem = CONTAGEM - k; render() }
                depois(CONTAGEM * seg * 1000) { contagem = 0; if (fase == Fase.CONTAGEM) mudaFase(Fase.CANTANDO); render() }
                depois((espera + duracaoDe(lista) + 0.45) * 1000) { finalizar() }
            }
        }
        render()
        rolarAte(pista)
    }

    private fun finalizar() {
        val arr = amostras.toTypedArray()
        val v = voz()
        val acertos = js.map { acertoDaNota(arr, it, v.tolerancia.toDouble(), v.qualquerOitava, it.fim) }.toTypedArray()
        val resumo = resumir(js, acertos)
        limpar()
        final = acertos to resumo
        mudaFase(Fase.FEITO)
        aoResultado(chave, resumo)
        dados.anotarDuracao("musica", agora() - inicioTentativa)
        bloco?.aoResponder?.invoke(resumo.ok)
        performHapticFeedback(if (resumo.ok) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.REJECT)
        render()
        acoes.post { acoes.requestRectangleOnScreen(android.graphics.Rect(0, -resultado.height - melhor.height - dp(32), acoes.width, acoes.height + dp(FOLGA_BARRA_DP)), false) }
    }

    private fun parar() {
        limpar()
        mudaFase(Fase.PARADO)
        contagem = 0
        atual = -1
        render()
    }

    private fun proximaDoPrograma() {
        val b = bloco ?: return
        if (b.restante() == 0) return b.aoAvancar()
        sorteado = sortearTrecho(chave)
        cantar()
    }

    private fun rolarAte(v: View) {
        acoes.post {
            val acima = v.height + dp(40)
            acoes.requestRectangleOnScreen(android.graphics.Rect(0, -(acima + letra.height + estado.height + dp(30)), acoes.width, acoes.height + dp(16)), false)
        }
    }

    // ---------------------------------------------------------------- render
    private fun mudarCfg(f: (JSONObject) -> Unit) {
        val c = JSONObject(cfg().toString())
        f(c)
        salvarCfg(c)
        limpar()
        mudaFase(Fase.PARADO)
        final = null
        contagem = 0
        atual = -1
        tonicaMidi = tonicaParaCaber(max(0, tonicaClasse()), trecho.notas, faixa())
        js = janelas(trecho.notas, bpm, tonicaMidi)
        render()
    }

    fun render() {
        val roda = rodando()
        if (bloco == null) renderEscolhas(roda)
        escolhas.visibility = if (bloco == null && !roda) VISIBLE else GONE
        conferir.visibility = if (musica.confianca != "alta" && !roda) VISIBLE else GONE
        conferir.text = T(if (musica.confianca == "baixa") "voz.musica.conferirBaixa" else "voz.musica.conferirMedia")
        numero.text = if (contagem > 0) "$contagem" else ""
        numero.visibility = if (contagem > 0) VISIBLE else GONE

        // Stopped, the lane already shows the syllables; the running lyrics show while singing (the current one) and in the result.
        val temLetra = js.any { it.sil.isNotEmpty() }
        letra.visibility = if (temLetra && (roda || final != null)) VISIBLE else GONE
        renderLetra()

        estado.text = when (fase) {
            Fase.CONTAGEM -> T("voz.musica.contagem", "n" to max(1, contagem))
            Fase.CANTANDO -> T("voz.musica.cantando")
            Fase.OUVINDO -> T("voz.musica.ouvindo")
            else -> "" // stopped, the key is on its pill
        }
        estado.visibility = if (estado.text.isEmpty()) GONE else VISIBLE

        val f = final
        resultado.visibility = if (f != null) VISIBLE else GONE
        melhor.visibility = GONE
        if (f != null) {
            resultado.text = T("voz.musica.resultado", "acertadas" to f.second.acertadas, "total" to f.second.total)
            resultado.setTextColor(if (f.second.ok) C.verde else C.vermelho)
            val m = voz().melhores.optDouble(chave, Double.NaN)
            if (!m.isNaN()) {
                melhor.visibility = VISIBLE
                melhor.text = T("voz.musica.melhor", "acertadas" to (m * f.second.total).roundToInt(), "total" to f.second.total)
            }
        }

        erro.removeAllViews()
        erroMic?.let { em ->
            erro.addView(context.texto(T(when (em) { "bloqueado" -> "app.micConfig"; "negado" -> "app.micPermissao"; else -> "voz.erroMic.failed" }), Papel.BODY, C.vermelho))
            if (em == "bloqueado") erro.addView(context.botao(T("app.abrirConfig"), Estilo.TONAL) { (context as MainActivity).abrirConfiguracoes() }, lp(LayoutParams.WRAP_CONTENT))
        }
        erro.visibility = if (erro.childCount > 0) VISIBLE else GONE

        renderAcoes(roda)
        rodape.visibility = if (!roda && final == null) VISIBLE else GONE
        pista.invalidate()
    }

    private fun renderLetra() {
        val f = final
        val sb = SpannableStringBuilder()
        js.forEachIndexed { i, j ->
            if (j.midi == null) return@forEachIndexed
            val ini = sb.length
            sb.append(j.sil.ifEmpty { "–" }).append(' ')
            val cor = when {
                i == atual -> C.tinta
                f != null -> if (f.first.getOrNull(i)?.ok == true) C.verde else C.vermelho
                else -> C.apagado
            }
            sb.setSpan(ForegroundColorSpan(cor), ini, sb.length - 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            if (i == atual) sb.setSpan(StyleSpan(android.graphics.Typeface.BOLD), ini, sb.length - 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        letra.text = sb
    }

    private fun renderAcoes(roda: Boolean) {
        acoes.removeAllViews()
        val f = final
        if (roda) {
            acoes.addView(context.botao(T("voz.parar"), Estilo.TONAL) { parar() }, lp())
            return
        }
        val b = bloco
        if (b != null) {
            if (f != null) acoes.addView(context.botao(if (b.restante() == 0) b.rotuloFim else T("voz.musica.proximaMusica"), Estilo.CHEIO, alto = true) { proximaDoPrograma() }, lp())
            else acoes.addView(context.botao(T("voz.musica.cantar"), Estilo.CHEIO, alto = true) { cantar() }, lp())
            return
        }
        acoes.addView(context.botao(T(if (f != null) "voz.musica.cantarDeNovo" else "voz.musica.cantar"), Estilo.CHEIO, alto = true) { cantar() }, lp())
        val linha = context.linha(10)
        // After a phrase, the next one; after the last, the whole song.
        if (f != null && !inteira && idx + 1 < musica.trechos.size) linha.addView(context.botao(T("voz.musica.proximoTrecho"), Estilo.TONAL) { mudarCfg { it.put("trecho", idx + 1) } }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        if (f != null && !inteira && musica.trechos.size > 1 && idx + 1 == musica.trechos.size) linha.addView(context.botao(T("voz.musica.cantarInteira"), Estilo.TONAL) { mudarCfg { it.put("trecho", INTEIRA) } }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        linha.addView(context.botao(T(if (inteira) "voz.musica.ouvirInteira" else "voz.musica.ouvir"), Estilo.TONAL) { ouvir() }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        acoes.addView(linha, lp())
    }

    private fun renderEscolhas(roda: Boolean) {
        if (roda) return
        escolhas.removeAllViews()
        val m = musica
        // Song, phrase and key as pills that open a sheet; "Lento" is one pill that toggles the slow speed.
        val f = Fluxo(context, v = 0)
        f.addView(seletor(T("voz.musica.musica"), m.nome, MUSICAS.map { it.id to it.nome }, m.id, rotuloInteiro = true) { id -> mudarCfg { it.put("musica", id).put("trecho", 0) } })
        f.addView(Chip(context, T("voz.musica.lento")) { mudarCfg { it.put("velocidade", if (velocidade < 1) 1.0 else 0.6) } }.apply { marcado = velocidade < 1 })
        if (m.trechos.size > 1) {
            val opcoes = m.trechos.mapIndexed { i, x -> "$i" to x.nome } + ("$INTEIRA" to T("voz.musica.inteira"))
            f.addView(seletor(T("voz.musica.trecho"), opcoes.first { it.first == "$idx" }.second, opcoes, "$idx") { v -> mudarCfg { it.put("trecho", v.toInt()) } })
        }
        val c = tonicaClasse()
        val tons = listOf("-1" to T("voz.aleatoria")) + (0..11).map { "$it" to nomeNota(60 + it).dropLast(1) }
        f.addView(seletor(T("voz.tonica"), T("voz.musica.tom", "nota" to (tons.first { it.first == "$c" }.second)), tons, "$c", rotuloInteiro = true) { v -> escolherTonica(v.toInt()) })
        escolhas.addView(f)
    }

    /** A pill showing a choice that opens a sheet with the options ([rotuloInteiro]: the pill text is [valor] alone). */
    private fun seletor(titulo: String, valor: String, opcoes: List<Pair<String, String>>, atual: String, rotuloInteiro: Boolean = false, aoEscolher: (String) -> Unit): View =
        Chip(context, if (rotuloInteiro) valor else "$titulo: $valor") {
            lateinit var dlg: android.app.Dialog
            val longa = opcoes.size > 13
            val lista: android.view.ViewGroup = if (longa) context.coluna(4) else Fluxo(context)
            opcoes.forEach { (id, r) ->
                val ch = Chip(context, r, radio = true) { dlg.dismiss(); if (id != atual) aoEscolher(id) }.apply {
                    marcado = id == atual
                    if (longa) gravity = Gravity.CENTER_VERTICAL or Gravity.START
                }
                if (longa) lista.addView(ch, lp()) else lista.addView(ch)
            }
            dlg = context.folha(titulo, lista)
            dlg.show()
        }.apply {
            setCompoundDrawablesRelativeWithIntrinsicBounds(null, null, Icone(context, Icone.Tipo.ABAIXO, C.apagado, 18), null)
            compoundDrawablePadding = dp(6)
            umaLinha()
            contentDescription = if (rotuloInteiro) valor else "$titulo: $valor"
        }

    // ---------------------------------------------------------------- the lane
    /**
     * The song lane (the site's pista.ts; changed one, change the other). Rolling, the notes run to the now line; stopped, the
     * whole phrase sits still to look at before and after.
     */
    private inner class PistaView(ctx: Context) : View(ctx) {
        private val d = resources.displayMetrics.density
        private val palco = Palco(d)
        private var fx = Palco.Efeitos()
        private val faixaP = Paint()

        init {
            importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = T("voz.musica.pista")
        }

        fun reiniciar() { fx = Palco.Efeitos() }

        override fun onMeasure(wSpec: Int, hSpec: Int) {
            val w = MeasureSpec.getSize(wSpec)
            setMeasuredDimension(w, (if (w / d < 480) 260 * d else 330 * d).toInt())
        }

        override fun onDraw(c: Canvas) {
            val relogio = SystemClock.uptimeMillis() / 1000.0
            val roda = rodando()
            val t = if (roda) (agora() - inicio) / 1000 else 0.0
            if (roda) {
                val i = js.indexOfFirst { it.midi != null && t >= it.ini && t < it.fim }
                if (i != atual) { atual = i; renderLetra() }
            }
            desenhar(c, t, roda, relogio, context.calmo())
            if (roda || fx.ativo(relogio)) postInvalidateOnAnimation()
        }

        private fun desenhar(c: Canvas, tAgora: Double, rolando: Boolean, relogio: Double, calmo: Boolean) {
            val w = width.toFloat()
            val h = height.toFloat()
            palco.fundo(c, w, h)
            val notas = js.filter { it.midi != null }
            if (notas.isEmpty()) return
            val v = voz()
            val tol = v.tolerancia.toDouble()
            val qo = v.qualquerOitava
            val avaliar = fase == Fase.CANTANDO || fase == Fase.FEITO
            val arr = amostras.toTypedArray()
            val lo = notas.minOf { it.midi!! }
            val hi = notas.maxOf { it.midi!! }
            val centro = (lo + hi) / 2.0
            val meia = max(4.0, (hi - lo) / 2.0 + 1.6)
            val topo = 44 * d
            val base = h - 20 * d
            fun y(m: Double) = (topo + ((centro + meia - m) / (2 * meia)) * (base - topo)).toFloat()
            val total = js.maxOf { it.fim }
            val xLinha = if (rolando) max(84 * d, (w * 0.27f).roundToInt().toFloat()) else 46 * d
            val pps = if (rolando) (w - xLinha) / FUTURO_S else (w - xLinha - 14 * d) / max(total, 0.1).toFloat()
            // Stopped with many notes (the whole song), each note is narrow: the capsule thins and syllables show only if they fit.
            val larguras = notas.map { ((it.fim - it.ini) * pps).toFloat() }.sorted()
            val larguraTipica = larguras[larguras.size shr 1]
            val esp = max(if (rolando) 14 * d else 6 * d, min(min(24 * d, ((base - topo) / (2 * meia)).toFloat() * 0.9f), if (rolando) 24 * d else larguraTipica * 0.85f))
            val comSilabas = rolando || larguraTipica >= 30 * d
            fun x(s: Double) = (if (rolando) xLinha + (s - tAgora) * pps else xLinha + s * pps).toFloat()
            val daVez = if (rolando) notas.firstOrNull { tAgora >= it.ini && tAgora < it.fim } else null
            fun dentro(midi: Double, alvo: Int) = abs(centsDe(midi, alvo.toDouble(), qo)) <= tol
            val texto = palco.texto

            if (!rolando) {
                // Stopped: the pitch names of the melody on the left (no staff).
                texto.textSize = 11 * d
                texto.textAlign = Paint.Align.LEFT
                texto.color = Palco.alfa(C.tinta, 0.55f)
                var ultimoY = Float.NEGATIVE_INFINITY
                for (m in notas.map { it.midi!! }.toSet().sortedDescending()) {
                    val ym = y(m.toDouble())
                    if (ym - ultimoY < 13 * d) continue
                    c.drawText(nomeNota(m), 8 * d, ym - (texto.ascent() + texto.descent()) / 2, texto)
                    ultimoY = ym
                }
            } else if (daVez != null) {
                faixaP.shader = LinearGradient(0f, 0f, w, 0f, intArrayOf(Palco.alfa(C.laranja, 0f), Palco.alfa(C.laranja, 0.07f), Palco.alfa(C.laranja, 0.03f)), floatArrayOf(0f, 0.2f, 1f), Shader.TileMode.CLAMP)
                val ym = y(daVez.midi!!.toDouble())
                c.drawRect(0f, ym - esp * 0.9f, w, ym + esp * 0.9f, faixaP)
            }

            /** Paints green the stretches of the note where the voice was on it (up to [ate]). */
            fun acertos(j: Janela, x0: Float, x1: Float, ate: Double) {
                val ym = y(j.midi!!.toDouble())
                c.save()
                c.clipPath(palco.capsula(x0, x1, ym, esp))
                palco.tinta.color = C.verde
                for (i in arr.indices) {
                    val s = arr[i]
                    val m = s.midi ?: continue
                    val ts = s.t - LATENCIA_S
                    val dt = min(0.15, if (i + 1 < arr.size) arr[i + 1].t - s.t else 0.15)
                    if (ts + dt < j.ini || ts > min(j.fim, ate) || !dentro(m, j.midi!!)) continue
                    val xa = x(max(ts, j.ini))
                    val xb = x(min(ts + dt, j.fim))
                    c.drawRect(xa, ym - esp / 2, xb + 0.8f, ym + esp / 2, palco.tinta)
                }
                c.restore()
            }

            // ---------------------------------------------------------------- notes and syllables
            val rotulos = ArrayList<FloatArray>()
            for (j in notas) {
                val x0 = x(j.ini)
                val x1 = x(j.fim) - 3 * d
                if (x1 < -20 * d || x0 > w) continue
                val ym = y(j.midi!!.toDouble())
                val passou = if (rolando) tAgora >= j.fim else avaliar
                val agoraN = j === daVez
                val curta = ehCurta(j)
                val acerto = avaliar && passou && !curta && acertoDaNota(arr, j, tol, qo, j.fim).fracao >= LIMIAR
                when {
                    agoraN && avaliar -> {
                        // The current one: what already passed the line shows the hit; what is left glows orange, breathing.
                        val xm = max(x0, min(xLinha, x1))
                        palco.encher(c, palco.capsula(x0, x1, ym, esp), Palco.alfa(C.laranja, 0.28f))
                        acertos(j, x0, x1, tAgora)
                        val respira = if (calmo) 0.5f else (0.5 + 0.5 * sin(relogio * 5.2)).toFloat()
                        palco.brilho(c, xm - esp / 2, x1, ym, esp, C.laranja, (10 + respira * 10) * d, calmo)
                        palco.encher(c, palco.capsula(xm - esp / 2, x1, ym, esp), C.laranja)
                    }
                    agoraN -> {
                        palco.brilho(c, x0, x1, ym, esp, C.laranja, 18 * d, calmo)
                        palco.encher(c, palco.capsula(x0, x1, ym, esp), C.laranja)
                    }
                    passou && avaliar && !curta -> if (acerto) {
                        palco.brilho(c, x0, x1, ym, esp, C.verde, 14 * d, calmo)
                        palco.encher(c, palco.capsula(x0, x1, ym, esp), C.verde)
                        if (rolando) palco.comemorar(fx, j.ini, x1 - esp / 2, ym, esp, relogio, calmo)
                    } else {
                        palco.encher(c, palco.capsula(x0, x1, ym, esp), Palco.alfa(C.tinta, 0.1f))
                        acertos(j, x0, x1, j.fim)
                        palco.contornar(c, palco.capsula(x0, x1, ym, esp), Palco.alfa(C.tinta, 0.28f), 1.2f * d)
                    }
                    // Listening, or a passing note (not scored): fades slowly.
                    passou -> palco.encher(c, palco.capsula(x0, x1, ym, esp), Palco.alfa(C.tinta, if (rolando) 0.14f else 0.22f))
                    rolando -> {
                        val p = palco.capsula(x0, x1, ym, esp)
                        palco.encher(c, p, Palco.alfa(C.laranja, 0.3f))
                        palco.contornar(c, p, Palco.alfa(C.laranja, 0.9f), 1.5f * d)
                    }
                    // Stopped, before singing: the whole phrase in orange.
                    else -> palco.encher(c, palco.capsula(x0, x1, ym, esp), Palco.alfa(C.laranja, 0.85f))
                }

                // The syllable above the note (those that would collide stay out: the running lyrics are under the lane).
                if (j.sil.isNotEmpty() && comSilabas) {
                    val grande = agoraN && rolando
                    texto.textSize = (if (grande) 17 else 13) * d
                    texto.textAlign = Paint.Align.LEFT
                    val xs = max(x0 + 2 * d, if (rolando) 8 * d else xLinha)
                    val ys = ym - esp / 2 - 7 * d
                    val larg = min(texto.measureText(j.sil), max(x1 - x0, 40 * d))
                    val bate = rotulos.any { abs(it[2] - ys) < 16 * d && xs < it[1] + 4 * d && xs + larg > it[0] }
                    if (!bate || grande) {
                        rotulos += floatArrayOf(xs, xs + larg, ys)
                        texto.color = if (grande) C.tinta else Palco.alfa(C.tinta, if (passou && rolando) 0.35f else 0.75f)
                        c.drawText(j.sil, xs, ys, texto)
                    }
                }
            }

            if (!rolando) return
            palco.linhaDoAgora(c, xLinha, h, 0.45f)

            // ---------------------------------------------------------------- the voice
            if (avaliar) {
                fun naHora(t: Double) = notas.firstOrNull { t - LATENCIA_S >= it.ini && t - LATENCIA_S < it.fim }
                val vidaS = xLinha / pps
                val trechos = palco.trechosDaVoz(arr.filter { it.t >= tAgora - vidaS - 0.3 }, { it.t }) { s ->
                    val sm = s.midi ?: return@trechosDaVoz null
                    val j = naHora(s.t)
                    val m = if (qo) dobrar(sm, j?.midi?.toDouble() ?: centro) else sm
                    if (y(m) < 4 * d || y(m) > h - 4 * d) return@trechosDaVoz null
                    Palco.Ponto((xLinha - (tAgora - s.t) * pps).toFloat(), y(m), s.t, j != null && dentro(sm, j.midi!!))
                }
                palco.fita(c, trechos, tAgora, vidaS.toDouble(), calmo)
                vozAgora?.let { vz ->
                    val j = naHora(tAgora)
                    val ok = j != null && dentro(vz, j.midi!!)
                    val seta = if (j == null || ok) 0 else if (centsDe(vz, j.midi!!.toDouble(), qo) < 0) -1 else 1
                    val m = if (qo) dobrar(vz, j?.midi?.toDouble() ?: centro) else vz
                    palco.cabecaDaVoz(c, xLinha, y(m).coerceIn(10 * d, h - 10 * d), ok, seta)
                }
            }
            palco.efeitos(c, fx, relogio)
            palco.bordas(c, w, h)
        }
    }

    companion object {
        /** The whole song (the phrases in sequence) instead of one phrase. */
        const val INTEIRA = -1
        /** Beats of count-in before the first note. */
        private const val CONTAGEM = 4
        private const val FUTURO_S = 4.2f

        /** In a program, each attempt is a random checked phrase (never the same twice in a row). */
        fun sortearTrecho(excluir: String?): Pair<String, Int> {
            val todos = MUSICAS.filter { it.confianca != "baixa" }.flatMap { m -> m.trechos.indices.map { m.id to it } }.filter { "${it.first}:${it.second}" != excluir }
            return todos[Random.nextInt(todos.size)]
        }
    }
}

