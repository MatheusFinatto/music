package br.musica.marmotaear

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import br.musica.marmota.common.AudioCapture
import br.musica.marmotatuner.PitchPipeline
import br.musica.marmotatuner.PitchSmoother
import br.musica.marmotatuner.treino.ALCANCE_ZERO
import br.musica.marmotatuner.treino.Alcance
import br.musica.marmotatuner.treino.ConfigClassica
import br.musica.marmotatuner.treino.FAIXA_PADRAO
import br.musica.marmotatuner.treino.Faixa
import br.musica.marmotatuner.treino.INTERVALOS
import br.musica.marmotatuner.treino.PADROES
import br.musica.marmotatuner.treino.PianoNote
import br.musica.marmotatuner.treino.SEGURANDO_ZERO
import br.musica.marmotatuner.treino.SEGURAR_LONGA_MS
import br.musica.marmotatuner.treino.SEGURAR_MS
import br.musica.marmotatuner.treino.SEGURAR_PASSO_MS
import br.musica.marmotatuner.treino.TOLERANCIAS
import br.musica.marmotatuner.treino.VOZES
import br.musica.marmotatuner.treino.atualizar
import br.musica.marmotatuner.treino.extensao
import br.musica.marmotatuner.treino.faixaConfortavel
import br.musica.marmotatuner.treino.inicioDaRodada
import br.musica.marmotatuner.treino.medirAlcance
import br.musica.marmotatuner.treino.nomeNota
import br.musica.marmotatuner.treino.notasDoPadrao
import br.musica.marmotatuner.treino.perguntaClassica
import br.musica.marmotatuner.treino.sortearAlvoDeVoz
import br.musica.marmotatuner.treino.sortearClasseDeVoz
import br.musica.marmotatuner.treino.vozMaisProxima
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * Voice training: the piano plays and the person sings; the microphone checks the pitch with the tuner's own detection
 * (PitchPipeline, PitchSmoother) and :core decides (atualizar, medirAlcance). The same flow as the site's Voz.tsx:
 * stopped → piano → singing → done. With [bloco] it runs one block of a program with the default settings.
 */
@SuppressLint("ViewConstructor")
class VozView(ctx: Context, private val dados: Dados, private val bloco: Bloco? = null) : LinearLayout(ctx) {
    private enum class Fase { PARADO, PIANO, CANTANDO, FEITO }
    /** What to sing: one note or a sequence, what the piano plays first and the drone, if any. */
    private class Tarefa(val alvos: List<Int>, val demo: Array<PianoNote>?, val bordao: Int?, val segurarMs: Double, val tonica: Int?, val grau: String?)
    private class Resultado(val ok: Boolean, val media: Double, val oscilacao: Double, val passos: Int, val alvo: Int?, val ouvi: Double?)

    private var salvo = dados.voz()
    /** In a program the default settings apply (the saved ones don't change). */
    private val s get() = if (bloco != null) salvo.deProgramaCom(bloco.exercicio) else salvo
    private val ex get() = bloco?.exercicio ?: salvo.exercicio

    private var fase = Fase.PARADO
    private var tarefa: Tarefa? = null
    private var passo = 0
    private var leitura: Double? = null
    private var vivoCents: Double? = null
    private var progresso = 0.0
    private var resultado: Resultado? = null
    private var placarA = 0
    private var placarT = 0
    private var alcance: Alcance = ALCANCE_ZERO
    /** "negado", "bloqueado" or "failed" (the microphone couldn't open). */
    private var erroMic: String? = null
    private var erroPiano = false
    private var rodada = 0
    /** The attempt stopped because a setting changed what to sing. */
    private var aviso = false

    private val main = Handler(Looper.getMainLooper())
    private var captura: AudioCapture? = null
    private val suavizador = PitchSmoother()
    private var segurando = SEGURANDO_ZERO
    private val medias = ArrayList<Double>()
    private var oscilacao = 0.0
    /** Each microphone opening and each cleanup changes the number: whoever wakes up later and finds another number gives up. */
    private var geracaoMic = 0
    private var limite: Runnable? = null
    private var espera: Runnable? = null
    private var ultimoCents: Double? = null
    private var ultimoMidi: Double? = null
    private var inicioTentativa = 0.0
    // The graph: the voice and the requested notes, in seconds since the attempt began; stopped, it stays at the moment it stopped.
    private var relogio0 = 0.0
    private var congelado: Double? = 0.0
    private val amostras = ArrayList<AmostraVoz>()
    private val passos = ArrayList<PassoVoz>()

    private fun agoraMs() = SystemClock.elapsedRealtime().toDouble()
    private fun tempo() = (agoraMs() - relogio0) / 1000
    private fun zerarGrafico() { relogio0 = agoraMs(); congelado = null; amostras.clear(); passos.clear(); grafico.reiniciar() }
    private fun congelar() { if (congelado == null) congelado = tempo() }

    // ---------------------------------------------------------------- views
    private var dicaPendente: String? = null
    private val trocarDica = Runnable { dicaVivo.text = dicaPendente ?: "" }
    private val escolhas = context.coluna()
    private val oQue = Fluxo(context, v = 0)
    private val sorteando = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val titulo = context.texto("", Papel.TITLE_LARGE).cabecalho()
    private val dica = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val passosVista = Fluxo(context, v = dp(8))
    private val vista = Segmentado(context, listOf(T("voz.vistas.grafico"), T("voz.vistas.afinador")), if (salvo.vista == "afinador") 1 else 0, compacto = true) { i ->
        salvo.vista = if (i == 1) "afinador" else "grafico"
        dados.salvar(salvo)
        render()
    }
    private val grafico = GraficoVozView(context) { estadoGrafico() }
    private val afinometro = AfinometroView(context)
    private val dicaVivo = context.texto("", Papel.TITLE).apply { gravity = Gravity.CENTER; accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_POLITE }
    private val alcanceVista = context.coluna(12)
    private val ouvirNota = context.coluna()
    private val resultadoTexto = context.texto("", Papel.TITLE).apply { accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_ASSERTIVE }
    private val erroVista = context.coluna(10)
    private val acoes = context.coluna(10)
    private val rodape = context.texto("", Papel.BODY_SMALL, C.apagado)
    private val palco = context.cartao()
    /** Songs (Cantar) take the stage's place when that exercise is chosen. */
    private var cantar: CantarView? = null

    init {
        orientation = VERTICAL
        if (bloco == null) {
            addView(escolhas, lp().margens(b = dp(8)))
            addView(oQue, lp().margens(b = dp(4)))
            addView(sorteando, lp().margens(b = dp(8)))
        }
        palco.addView(titulo, lp())
        palco.addView(dica, lp().margens(t = dp(4)))
        palco.addView(passosVista, lp().margens(t = dp(12)))
        palco.addView(vista, lp().margens(t = dp(16), b = dp(12)))
        palco.addView(grafico, lp())
        palco.addView(afinometro, lp())
        palco.addView(dicaVivo, lp().margens(t = dp(10)))
        palco.addView(alcanceVista, lp().margens(t = dp(16)))
        palco.addView(ouvirNota, lp().margens(t = dp(12)))
        palco.addView(resultadoTexto, lp().margens(t = dp(16)))
        palco.addView(erroVista, lp().margens(t = dp(12)))
        palco.addView(acoes, lp().margens(t = dp(20)))
        palco.addView(rodape, lp().margens(t = dp(12)))
        addView(palco, lp())
        render()
        Piano.carregar(context) { ok -> if (!ok) { erroPiano = true; render() } }
        // A program block starts by itself: the tap on "Começar" or "Próximo bloco" already happened.
        if (bloco != null && ex != "musica") post { comecar() }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (fase == Fase.PIANO || fase == Fase.CANTANDO) parar()
    }

    /** System Back during an attempt stops it (instead of leaving the app). Returns true if it handled Back. */
    fun voltar(): Boolean {
        if (cantar?.voltar() == true) return true
        if (fase != Fase.PIANO && fase != Fase.CANTANDO) return false
        parar()
        return true
    }

    /** The app went to the background (or the section changed) mid-attempt: cancel without counting a miss. */
    fun pausar() {
        cantar?.pausar()
        if (fase == Fase.PIANO || fase == Fase.CANTANDO) parar()
    }

    // ---------------------------------------------------------------- microphone
    private fun limparTempos() {
        limite?.let { main.removeCallbacks(it) }
        espera?.let { main.removeCallbacks(it) }
        limite = null
        espera = null
    }

    private fun depois(ms: Double, f: () -> Unit): Runnable = Runnable { f() }.also { main.postDelayed(it, ms.toLong()) }

    private fun fecharMic() {
        geracaoMic++
        if (!MainActivity.simular) captura?.stop()
        captura = null
        suavizador.reset()
        leitura = null
    }

    /** Opens the microphone (asking for the permission first); [pronto] gets false if it couldn't or the attempt was cancelled meanwhile. */
    private fun abrir(pronto: (Boolean) -> Unit) {
        if (captura != null) return pronto(true)
        val g = ++geracaoMic
        (context as MainActivity).pedirMic { r ->
            if (g != geracaoMic) return@pedirMic
            if (r != MainActivity.Mic.OK) {
                erroMic = if (r == MainActivity.Mic.BLOQUEADO) "bloqueado" else "negado"
                return@pedirMic pronto(false)
            }
            if (MainActivity.simular) return@pedirMic simularVoz(g, pronto)
            val pipe = PitchPipeline(AudioCapture.SAMPLE_RATE)
            val cap = AudioCapture(
                onChunk = { chunk, n -> val midi = pipe.process(chunk, n).midi; main.post { if (g == geracaoMic) aoOuvir(midi) } },
                onFailure = { main.post { if (g == geracaoMic) { erroMic = "failed"; fecharMic(); Piano.pararBordao(); fase = Fase.PARADO; render() } } },
            )
            captura = cap
            cap.start()
            erroMic = null
            pronto(true)
        }
    }

    /**
     * Debug builds only (`am start … --ez simular true`): a fake voice that slides into the current target and wavers a little, so
     * the graph and the hit flow can be checked on an emulator without a microphone.
     */
    private fun simularVoz(g: Int, pronto: (Boolean) -> Unit) {
        var k = 0
        val passo = object : Runnable {
            override fun run() {
                if (g != geracaoMic) return
                k++
                val alvo = tarefa?.alvos?.getOrNull(passo)?.toDouble() ?: (57.0 + k / 20 % 12)
                val midi = if (k % 60 < 8) null else alvo - 1.2 * Math.exp(-(k % 60 - 8) / 10.0) + 0.08 * Math.sin(k / 3.0)
                aoOuvir(midi)
                main.postDelayed(this, 23)
            }
        }
        captura = AudioCapture({ _, _ -> }, {})
        main.post(passo)
        erroMic = null
        pronto(true)
    }

    /** One pitch reading (on the main thread, ~43 per second). */
    private fun aoOuvir(bruto: Double?) {
        val midi = suavizador.push(bruto)
        val agora = agoraMs()
        leitura = midi
        if (midi != null) ultimoMidi = midi
        if (congelado == null) {
            amostras += AmostraVoz((agora - relogio0) / 1000, midi)
            if (amostras.size > 1200) amostras.subList(0, amostras.size - 900).clear()
        }
        val t0 = tarefa
        if (ex == "alcance") {
            alcance = medirAlcance(alcance, midi, agora)
        } else if (fase == Fase.CANTANDO && t0 != null) {
            val p = atualizar(segurando, midi, agora, t0.alvos[passo].toDouble(), s.tolerancia.toDouble(), s.qualquerOitava, t0.segurarMs)
            segurando = p.estado
            ultimoCents = p.cents
            vivoCents = p.cents
            progresso = p.estado.desde?.let { min(1.0, (agora - it) / t0.segurarMs) } ?: 0.0
            if (p.ok) {
                medias += p.media
                oscilacao = p.oscilacao
                if (passo + 1 < t0.alvos.size) {
                    passo++
                    val ta = (agora - relogio0) / 1000
                    passos.lastOrNull()?.let { it.fim = ta; it.ok = true }
                    passos += PassoVoz(t0.alvos[passo], ta)
                    segurando = SEGURANDO_ZERO
                    vivoCents = null
                    progresso = 0.0
                    performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    renderPassos()
                } else return concluir(true)
            }
        }
        atualizarVivo()
    }

    // ---------------------------------------------------------------- flow
    private fun concluir(ok: Boolean, porTempo: Boolean = false) {
        if (congelado == null) congelado = tempo()
        val ultimo = passos.lastOrNull()
        if (ok && ultimo != null && ultimo.fim == null) { ultimo.fim = congelado; ultimo.ok = true }
        limparTempos()
        fecharMic()
        Piano.pararBordao()
        val n = medias.size
        val media = if (n > 0) medias.average() else (ultimoCents ?: 0.0)
        val absMedia = if (n > 0) medias.sumOf { abs(it) } / n else abs(media)
        fase = Fase.FEITO
        resultado = Resultado(ok, if (n > 1) absMedia else media, oscilacao, n, tarefa?.alvos?.getOrNull(passo), ultimoMidi)
        placarT++
        if (ok) placarA++
        if (!porTempo && ex != "alcance" && ex != "musica") dados.anotarDuracao(ex, agoraMs() - inicioTentativa)
        bloco?.aoResponder?.invoke(ok)
        performHapticFeedback(if (ok) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.REJECT)
        render()
        rolarAteAcoes()
    }

    /** The result and the next button sit under the stage: bring them into view, above the floating bar. */
    private fun rolarAteAcoes() {
        acoes.post { acoes.requestRectangleOnScreen(android.graphics.Rect(0, -resultadoTexto.height - dp(24), acoes.width, acoes.height + dp(FOLGA_BARRA_DP)), false) }
    }

    private fun escutar(t0: Tarefa) {
        abrir { ok ->
            if (!ok) { fase = Fase.PARADO; Piano.pararBordao(); render(); return@abrir }
            segurando = SEGURANDO_ZERO
            ultimoCents = null
            ultimoMidi = null
            vivoCents = null
            progresso = 0.0
            if (passos.isEmpty() || passos.last().fim != null) passos += PassoVoz(t0.alvos[passo], tempo())
            fase = Fase.CANTANDO
            limite = depois(LIMITE_MS + t0.alvos.size * 4000 + t0.segurarMs) { concluir(false, porTempo = true) }
            render()
        }
    }

    /** Waits for the piano samples (the first time) and then runs [f]; false if they can't load. */
    private fun comPiano(f: () -> Unit) {
        if (Piano.carregado) return f()
        Piano.carregar(context) { ok -> if (ok) f() else { erroPiano = true; fase = Fase.PARADO; render() } }
    }

    /** Plays what the task asks for (or starts the drone) and, when it ends, opens the microphone. */
    private fun prepararEOuvir(t0: Tarefa, recomecar: Boolean) {
        limparTempos()
        fecharMic()
        fase = Fase.PIANO
        resultado = null
        if (recomecar) { passo = 0; medias.clear(); oscilacao = 0.0; zerarGrafico() }
        render()
        // Bring the stage into view, from the view switch down to the buttons: it is what to look at while singing.
        acoes.post {
            val palco = vista.height + grafico.height.coerceAtLeast(afinometro.height) + dicaVivo.height + dp(48)
            acoes.requestRectangleOnScreen(android.graphics.Rect(0, -palco, acoes.width, acoes.height + dp(16)), false)
        }
        comPiano {
            val raiz = t0.bordao
            if (raiz != null) {
                val ligar = {
                    if (!Piano.iniciarBordao(raiz)) { fase = Fase.PARADO; render() } else espera = depois(1200.0) { escutar(t0) }
                }
                val demo = t0.demo
                if (demo != null) {
                    val dur = Piano.tocar(demo)
                    if (dur == null) { fase = Fase.PARADO; render() } else espera = depois(dur * 1000 + 150) { ligar() }
                } else ligar()
                return@comPiano
            }
            val dur = Piano.tocar(t0.demo ?: emptyArray())
            if (dur == null) { fase = Fase.PARADO; render(); return@comPiano }
            espera = depois(dur * 1000 + 300) { escutar(t0) }
        }
    }

    private fun comecar() {
        aviso = false
        inicioTentativa = agoraMs()
        val e = ex
        if (e == "alcance") return medir()
        if (e == "musica") return
        val rng = { Random.nextDouble() }
        val t0 = when (e) {
            "igualar", "longa" -> {
                val midi = sortearAlvoDeVoz(rng, s.faixa)
                Tarefa(listOf(midi), arrayOf(PianoNote(midi, 0.0, 2.0)), null, if (e == "longa") SEGURAR_LONGA_MS else SEGURAR_MS, null, null)
            }
            "sequencia" -> {
                val padrao = PADROES.firstOrNull { it.id == s.padrao } ?: PADROES[0]
                val classe = if (s.inicio < 0) sortearClasseDeVoz(rng) else s.inicio
                val alvos = notasDoPadrao(inicioDaRodada(classe, rodada, s.subir && s.inicio >= 0, s.faixa, padrao.semitons.max()), padrao.semitons).toList()
                Tarefa(alvos, alvos.mapIndexed { i, m -> PianoNote(m, i * 0.7, 0.65) }.toTypedArray(), null, SEGURAR_PASSO_MS, null, null)
            }
            "tonica" -> {
                val classe = if (s.inicio < 0) sortearClasseDeVoz(rng) else s.inicio
                val raiz = inicioDaRodada(classe, rodada, s.subir && s.inicio >= 0, s.faixa, 12)
                val grau = if (s.grau == "sortear") s.intervalos[Random.nextInt(s.intervalos.size)] else s.grau
                val alvo = raiz + INTERVALOS.first { it.id == grau }.semitons
                // With help, the piano plays the tonic and the note together and then leaves the tonic sounding; without, just the tonic.
                val demo = if (s.ajuda == "guia") arrayOf(PianoNote(raiz, 0.0, 2.2), PianoNote(alvo, 0.0, 2.2)) else null
                Tarefa(listOf(alvo), demo, raiz, SEGURAR_MS, raiz, grau)
            }
            else -> {
                val p = perguntaClassica(ConfigClassica("achar", s.intervalos.toTypedArray(), "misto", 30, "do"), rng, null)
                Tarefa(listOf(p.alvo!!), p.notas, null, SEGURAR_MS, null, null)
            }
        }
        rodada++
        tarefa = t0
        prepararEOuvir(t0, true)
    }

    /** Plays one note of the task again over the drone; while singing, the microphone pauses and then listens again. */
    private fun tocarNota(t0: Tarefa, midi: Int) {
        if (fase == Fase.FEITO) { Piano.tocar(arrayOf(PianoNote(midi, 0.0, 1.6))); return }
        limparTempos()
        fecharMic()
        fase = Fase.PIANO
        render()
        val dur = Piano.tocar(arrayOf(PianoNote(midi, 0.0, 1.6)), manter = true)
        if (dur == null) { fase = Fase.PARADO; render(); return }
        espera = depois(dur * 1000 + 300) { escutar(t0) }
    }

    private fun parar() {
        congelar()
        limparTempos()
        fecharMic()
        Piano.calar()
        fase = Fase.PARADO
        render()
    }

    private fun medir() {
        limparTempos()
        alcance = ALCANCE_ZERO
        resultado = null
        zerarGrafico()
        abrir { ok ->
            if (ok) fase = Fase.CANTANDO
            render()
        }
    }

    private fun terminarAlcance() {
        congelar()
        fecharMic()
        fase = Fase.FEITO
        render()
        alcanceVista.post { alcanceVista.requestRectangleOnScreen(android.graphics.Rect(0, 0, alcanceVista.width, alcanceVista.height + acoes.height + dp(FOLGA_BARRA_DP + 40)), false) }
    }

    /** Changing what is sung (exercise, pattern, note, voice) starts over; if an attempt was running, say why instead of stopping silently. */
    private fun mudar(f: (Dados.Voz) -> Unit) {
        aviso = fase == Fase.PIANO || fase == Fase.CANTANDO
        f(salvo)
        dados.salvar(salvo)
        parar()
        tarefa = null
        resultado = null
        alcance = ALCANCE_ZERO
        rodada = 0
        aoMudarAjustes()
        render()
        cantar?.ajustesMudaram()
    }

    /** Margin, octave and rising don't change the requested note: they apply at once (read on every chunk), without stopping. */
    private fun ajustar(f: (Dados.Voz) -> Unit) {
        f(salvo)
        dados.salvar(salvo)
        render()
        cantar?.ajustesMudaram()
    }

    /** Told when the exercise changes, so the app bar can update (the settings icon follows the exercise). */
    var aoMudarAjustes: () -> Unit = {}
    /** Told when an attempt starts or ends: while singing, the section bar steps aside so the stage and its buttons fit. */
    var aoEmCurso: (Boolean) -> Unit = {}
    private var avisadoEmCurso = false

    // ---------------------------------------------------------------- render
    private fun estadoGrafico(): EstadoGrafico {
        val t0 = tarefa
        val rolando = fase == Fase.PIANO || fase == Fase.CANTANDO
        val proximos = if (t0 != null && ex != "alcance") t0.alvos.drop(if (passos.isNotEmpty()) passo + 1 else passo) else emptyList()
        return EstadoGrafico(
            agora = congelado ?: tempo(),
            amostras = amostras,
            passos = passos,
            proximos = proximos,
            segurarS = (t0?.segurarMs ?: SEGURAR_MS) / 1000,
            progresso = if (ex == "alcance" || fase != Fase.CANTANDO) 0.0 else progresso,
            tonica = if (ex == "tonica") t0?.bordao else null,
            alcance = if (ex == "alcance") alcance.min to alcance.max else null,
            tolerancia = s.tolerancia,
            qualquerOitava = ex != "alcance" && s.qualquerOitava,
            mensagem = if (fase == Fase.FEITO && resultado?.ok == true && ex != "alcance") T("voz.afinou") else null,
        ).also { grafico.rolando = rolando }
    }

    /** What changes on every microphone reading: the live hint, the meter, the graph and the range so far. */
    private fun atualizarVivo() {
        val cantando = fase == Fase.CANTANDO
        val nova = when {
            !cantando -> "" // while the piano plays, the disabled main button already says so
            ex == "alcance" -> if (leitura == null) T("voz.silencio") else T("voz.alcanceDica")
            vivoCents == null -> T("voz.silencio")
            abs(vivoCents!!) <= s.tolerancia -> T(if (ex == "longa") "voz.sustente" else "voz.segure")
            vivoCents!! > 0 -> T("voz.maisBaixo")
            else -> T("voz.maisAlto")
        }
        // The hint only changes after holding still for a moment: the real voice wavers, and TalkBack needn't read every waver.
        if (nova != dicaPendente) {
            dicaPendente = nova
            main.removeCallbacks(trocarDica)
            if (nova.isEmpty()) trocarDica.run() else main.postDelayed(trocarDica, 450)
        }
        afinometro.mostrar(leitura, if (ex == "alcance" || !cantando) null else vivoCents, s.tolerancia, if (ex == "alcance") 0.0 else progresso)
        if (s.vista != "afinador") grafico.invalidate()
        if (ex == "alcance" && alcanceVista.visibility == VISIBLE && cantando) renderAlcance()
    }

    private fun renderPassos() {
        val t0 = tarefa
        passosVista.removeAllViews()
        passosVista.visibility = if (ex == "sequencia" && t0 != null && fase != Fase.PARADO) VISIBLE else GONE
        if (passosVista.visibility != VISIBLE || t0 == null) return
        passosVista.contentDescription = T("voz.passos")
        t0.alvos.forEachIndexed { i, m ->
            val feito = i < passo || (fase == Fase.FEITO && resultado?.ok == true)
            val atual = i == passo && fase == Fase.CANTANDO
            val cor = when { feito -> C.verde; atual -> C.laranja; else -> C.apagado }
            passosVista.addView(context.texto(nomeNota(m), Papel.LABEL, cor).apply {
                gravity = Gravity.CENTER
                minWidth = dp(52)
                minHeight = dp(36)
                setPadding(dp(12), 0, dp(12), 0)
                val raio = dp(18).toFloat()
                background = when {
                    feito -> forma(Palco.alfa(C.verde, 0.15f), raio)
                    atual -> forma(Palco.alfa(C.laranja, 0.15f), raio, dp(2), C.laranja)
                    else -> forma(android.graphics.Color.TRANSPARENT, raio, dp(1), C.linha)
                }
            })
        }
    }

    private fun renderAlcance() {
        alcanceVista.removeAllViews()
        val mostrar = ex == "alcance" && (alcance.min != null || fase == Fase.FEITO)
        alcanceVista.visibility = if (mostrar) VISIBLE else GONE
        if (!mostrar) return
        val lo = alcance.min
        val hi = alcance.max
        if (lo == null || hi == null) {
            alcanceVista.addView(context.texto(T("voz.alcanceVazio"), Papel.BODY, C.apagado))
            return
        }
        alcanceVista.addView(context.texto(T("voz.alcanceResultado", "grave" to nomeNota(lo), "agudo" to nomeNota(hi)), Papel.TITLE_LARGE, C.verde))
        val ext = extensao(hi - lo)
        alcanceVista.addView(context.texto(T("voz.extensao", "oitavas" to ext.oitavas, "semitons" to ext.semitons), Papel.BODY_SMALL, C.apagado))
        if (fase != Fase.FEITO) return
        val inst: Instrumento = if (dados.instrumento == "violao") BracoView(context, T("braco")) else TecladoView(context, T("teclado"))
        inst.mostrar(listOf(lo, hi), mapOf(lo to Marca.ALVO, hi to Marca.ALVO))
        alcanceVista.addView(inst.vista, lp())
        val sug = faixaConfortavel(lo, hi)
        alcanceVista.addView(context.texto(T("voz.minhaVoz.sugestao", "de" to nomeNota(sug.min), "ate" to nomeNota(sug.max), "voz" to T("voz.minhaVoz.tipos.${vozMaisProxima(sug)}")), Papel.BODY))
        val salva = salvo.faixaTipo == "medida" && salvo.faixa.min == sug.min && salvo.faixa.max == sug.max
        if (salva) alcanceVista.addView(context.texto(T("voz.minhaVoz.salva"), Papel.BODY_SMALL, C.verde).apply { accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_POLITE })
        else alcanceVista.addView(context.botao(T("voz.minhaVoz.usar"), Estilo.TONAL) { ajustar { it.faixaTipo = "medida"; it.faixa = Faixa(sug.min, sug.max) }; renderAlcance() }, lp(LayoutParams.WRAP_CONTENT))
    }

    fun render() {
        val e = ex
        val t0 = tarefa
        val cantando = fase == Fase.CANTANDO
        val emCurso = fase == Fase.PIANO || cantando
        if (bloco == null) renderEscolhas()
        if (emCurso != avisadoEmCurso) { avisadoEmCurso = emCurso; aoEmCurso(emCurso) }
        renderCantar()
        // During an attempt the choosers step aside: the stage and its buttons have to fit above the floating bar.
        listOf(escolhas, oQue, sorteando).forEach { if (emCurso) it.visibility = GONE else if (it === escolhas) it.visibility = VISIBLE }

        // Title: stopped, the chooser already names the exercise; it shows for the range test, in a program and while singing.
        titulo.visibility = if (e == "alcance" || bloco != null || (t0 != null && emCurso)) VISIBLE else GONE
        titulo.text = when {
            e == "alcance" -> T("voz.exercicios.alcance")
            t0 != null && emCurso -> T("voz.cante")
            else -> T("voz.exercicios.$e")
        }
        // The exercise's sentence only while stopped (the screen stays lean while singing); the tonic's target is information, so it stays.
        val tonicaInfo = e == "tonica" && t0?.tonica != null && t0.grau != null && fase != Fase.PARADO
        dica.text = if (tonicaInfo) T("voz.tonicaDica", "tonica" to nomeNota(t0!!.tonica!!), "grau" to T("nomes.intervalos.${t0.grau}"), "nota" to nomeNota(t0.alvos[0]))
            else if (e == "tonica") T(if (s.ajuda == "guia") "voz.dicaTonicaGuia" else "voz.dicaTonicaSo") else T("voz.dica.$e")
        dica.visibility = if (tonicaInfo || fase == Fase.PARADO) VISIBLE else GONE

        renderPassos()
        val ver = fase != Fase.PARADO
        vista.visibility = if (ver) VISIBLE else GONE
        grafico.visibility = if (ver && s.vista == "grafico") VISIBLE else GONE
        afinometro.visibility = if (ver && s.vista == "afinador") VISIBLE else GONE
        dicaVivo.visibility = if (ver && fase != Fase.FEITO) VISIBLE else GONE
        renderAlcance()

        // With the tonic sounding: the button plays the requested note again (orange, the target's color).
        ouvirNota.removeAllViews()
        ouvirNota.visibility = if (e == "tonica" && t0 != null && fase != Fase.PARADO) VISIBLE else GONE
        if (ouvirNota.visibility == VISIBLE) {
            val alvo = t0!!.alvos[0]
            val b = context.botao("${T("voz.ouvirNota")}  ${nomeNota(alvo)}", Estilo.CONTORNO) { tocarNota(t0, alvo) }.apply {
                setTextColor(C.laranja)
                background = context.toque(forma(android.graphics.Color.TRANSPARENT, dp(28).toFloat(), dp(2), C.laranja), dp(28).toFloat(), C.laranja)
                setCompoundDrawablesRelativeWithIntrinsicBounds(Icone(context, Icone.Tipo.SOM, C.laranja, 20), null, null, null)
                compoundDrawablePadding = dp(8)
                contentDescription = T("voz.ouvirNotaRotulo", "nota" to nomeNota(alvo))
                ativo(fase != Fase.PIANO && Piano.carregado)
            }
            ouvirNota.addView(b, lp(LayoutParams.WRAP_CONTENT))
        }

        val r = resultado
        resultadoTexto.visibility = if (r != null && e != "alcance") VISIBLE else GONE
        if (r != null) {
            resultadoTexto.setTextColor(if (r.ok) C.verde else C.vermelho)
            resultadoTexto.text = textoResultado(r)
        }

        erroVista.removeAllViews()
        val em = erroMic
        if (em != null) {
            val chave = when (em) { "bloqueado" -> "app.micConfig"; "negado" -> "app.micPermissao"; else -> "voz.erroMic.failed" }
            erroVista.addView(context.texto(T(chave), Papel.BODY, C.vermelho).apply { accessibilityLiveRegion = ACCESSIBILITY_LIVE_REGION_ASSERTIVE })
            if (em == "bloqueado") erroVista.addView(context.botao(T("app.abrirConfig"), Estilo.TONAL) { (context as MainActivity).abrirConfiguracoes() }, lp(LayoutParams.WRAP_CONTENT))
        }
        if (erroPiano) erroVista.addView(context.texto(T("erroPiano"), Papel.BODY, C.vermelho))
        erroVista.visibility = if (erroVista.childCount > 0) VISIBLE else GONE

        renderAcoes()

        rodape.text = when {
            fase == Fase.PARADO && aviso -> T("voz.ajusteMudou")
            fase == Fase.PARADO && placarT > 0 && bloco == null && e != "alcance" -> "${T("placar", "acertos" to placarA, "total" to placarT)} ${T("acertos")}"
            fase == Fase.PARADO && placarT == 0 -> T("voz.fone")
            else -> ""
        }
        rodape.visibility = if (rodape.text.isEmpty()) GONE else VISIBLE
        atualizarVivo()
    }

    /** Songs replace the stage: a CantarView while "musica" is the exercise, dropped when it isn't. */
    private fun renderCantar() {
        val musica = ex == "musica"
        palco.visibility = if (musica) GONE else VISIBLE
        if (!musica) {
            cantar?.let { it.pausar(); removeView(it) }
            cantar = null
            return
        }
        if (cantar != null) return
        cantar = CantarView(context, dados, bloco, voz = { s }, salvarCfg = { c -> salvo.musica = c; dados.salvar(salvo) },
            aoResultado = { chave, r ->
                placarT++
                if (r.ok) placarA++
                val f = if (r.total > 0) r.acertadas.toDouble() / r.total else 0.0
                salvo.melhores.put(chave, maxOf(salvo.melhores.optDouble(chave, 0.0), f))
                dados.salvar(salvo)
            },
            escolherTonica = { v -> mudar { it.inicio = v } },
            aoEmCurso = { sim ->
                listOf(escolhas, oQue, sorteando).forEach { it.visibility = if (sim) GONE else VISIBLE }
                if (!sim) renderEscolhas()
                aoEmCurso(sim)
            },
        ).also { addView(it, lp()) }
    }

    private fun textoResultado(r: Resultado): String {
        val e = ex
        val prog = bloco != null
        if (!r.ok) {
            val alvo = r.alvo
            val ouvi = r.ouvi
            return if (ouvi == null || alvo == null) T(if (prog) "voz.naoOuviSegue" else "voz.naoOuvi")
            else T(if (prog) "voz.naoFoiSegue" else "voz.naoFoi", "alvo" to nomeNota(alvo), "ouvi" to nomeNota(ouvi.roundToInt()))
        }
        return when (e) {
            "longa" -> T("voz.longaFeito", "n" to r.oscilacao.roundToInt())
            "sequencia" -> T("voz.sequenciaFeito", "passos" to r.passos, "n" to r.media.roundToInt())
            else -> {
                val m = r.media
                val sinal = if (abs(m) < 1) T("voz.mediaCentro") else T(if (m > 0) "voz.mediaAcima" else "voz.mediaAbaixo", "n" to abs(m).roundToInt())
                "${T("voz.afinou")} $sinal"
            }
        }
    }

    private fun renderAcoes() {
        acoes.removeAllViews()
        val e = ex
        val t0 = tarefa
        val r = resultado
        when (fase) {
            Fase.PARADO, Fase.FEITO -> {
                // On the last attempt of a program block, the button goes to the next block.
                val fechaBloco = bloco != null && fase == Fase.FEITO && bloco.restante() == 0
                val errou = fase == Fase.FEITO && r != null && !r.ok && e != "alcance" && bloco == null
                if (errou && t0 != null) acoes.addView(context.botao(T("voz.tentarDeNovo"), Estilo.CHEIO, alto = true) { inicioTentativa = agoraMs(); prepararEOuvir(t0, true) }, lp())
                val rotulo = when {
                    fechaBloco -> bloco!!.rotuloFim
                    e == "alcance" -> T("voz.medir")
                    fase == Fase.FEITO -> T("voz.proxima")
                    else -> T("voz.comecar")
                }
                acoes.addView(context.botao(rotulo, if (errou) Estilo.TONAL else Estilo.CHEIO, alto = !errou) { if (fechaBloco) bloco!!.aoAvancar() else comecar() }, lp())
            }
            Fase.PIANO -> acoes.addView(context.botao(T(if (t0?.bordao != null) "voz.ligandoBordao" else "voz.ouvindo"), Estilo.CHEIO, alto = true) {}.apply { ativo(false) }, lp())
            Fase.CANTANDO -> {
                if (e == "alcance") {
                    acoes.addView(context.botao(T("voz.terminar"), Estilo.CHEIO, alto = true) { terminarAlcance() }, lp())
                } else if (t0 != null) {
                    val linha = context.linha(10)
                    if (e != "tonica") linha.addView(context.botao(T("voz.ouvirDeNovo"), Estilo.TONAL) { prepararEOuvir(t0, e != "sequencia") }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
                    linha.addView(context.botao(T("voz.parar"), Estilo.TONAL) { parar() }, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
                    acoes.addView(linha, lp())
                }
            }
        }
    }

    // ---------------------------------------------------------------- choosers
    private fun renderEscolhas() {
        val rolX = (escolhas.getChildAt(0) as? android.widget.HorizontalScrollView)?.scrollX ?: 0
        escolhas.removeAllViews()
        val l = context.linha(8)
        var marcadoChip: View? = null
        for (e in NA_LISTA) l.addView(Chip(context, T("voz.exercicios.$e"), radio = true) {
            if (e != salvo.exercicio) { placarA = 0; placarT = 0; mudar { it.exercicio = e } }
        }.apply { marcado = e == ex; if (marcado) marcadoChip = this })
        val r = context.rolagemHorizontal(l)
        r.post {
            val c = marcadoChip
            val alvo = if (c == null) rolX else when {
                c.right - rolX > r.width -> c.right - r.width + dp(16)
                c.left - rolX < 0 -> maxOf(0, c.left - dp(16))
                else -> rolX
            }
            r.scrollTo(alvo, 0)
        }
        escolhas.addView(r)

        // What to sing stays in view, next to the stage; the settings sheet keeps only what applies to every exercise.
        oQue.removeAllViews()
        val e = ex
        if (e == "sequencia") oQue.addView(seletor(T("voz.padrao"), PADROES.map { it.id to T("voz.padroes.${it.id}") }, salvo.padrao) { v -> mudar { it.padrao = v } })
        if (e == "tonica") oQue.addView(seletor(T("voz.cantarA"), INTERVALOS.map { it.id to T("nomes.intervalos.${it.id}") } + ("sortear" to T("voz.sortear")), salvo.grau) { v -> mudar { it.grau = v } })
        if (e == "sequencia" || e == "tonica") {
            val notas = listOf("-1" to T("voz.aleatoria")) + (0..11).map { "$it" to nomeNota(60 + it).dropLast(1) }
            oQue.addView(seletor(if (e == "sequencia") T("voz.inicio") else T("voz.tonica"), notas, "${salvo.inicio}") { v -> mudar { it.inicio = v.toInt() } })
        }
        oQue.visibility = if (oQue.childCount > 0) VISIBLE else GONE
        val sorteia = e == "intervalo" || (e == "tonica" && salvo.grau == "sortear")
        // Only the list (the site's "open the settings to change" sentence is left out: the settings icon is right there).
        sorteando.text = T("voz.sorteando", "lista" to salvo.intervalos.joinToString(", ") { T("nomes.intervalos.$it") }).substringBefore(". ") + "."
        sorteando.visibility = if (sorteia) VISIBLE else GONE
    }

    /** A pill that shows a choice ("Padrão: Arpejo maior") and opens a sheet with the options. */
    private fun seletor(rotulo: String, opcoes: List<Pair<String, String>>, atual: String, aoEscolher: (String) -> Unit): View {
        val valor = opcoes.firstOrNull { it.first == atual }?.second ?: atual
        return Chip(context, "$rotulo: $valor", radio = false) {
            lateinit var dlg: android.app.Dialog
            val f = Fluxo(context)
            opcoes.forEach { (id, r) -> f.addView(Chip(context, r, radio = true) { dlg.dismiss(); if (id != atual) aoEscolher(id) }.apply { marcado = id == atual }) }
            dlg = context.folha(rotulo, f)
            dlg.show()
        }.apply {
            setCompoundDrawablesRelativeWithIntrinsicBounds(null, null, Icone(context, Icone.Tipo.ABAIXO, C.apagado, 18), null)
            compoundDrawablePadding = dp(6)
            contentDescription = "$rotulo: $valor"
        }
    }

    // ---------------------------------------------------------------- settings sheet
    /** The settings sheet: my voice, precision, octave and what fits the exercise. [fechar] closes the sheet. */
    fun corpoAjustes(fechar: () -> Unit): View {
        val c = context.coluna(16)
        fun grupo(titulo: String, opcoes: List<Pair<String, CharSequence>>, atual: String, aoEscolher: (String) -> Unit): LinearLayout {
            val g = context.coluna(2)
            g.addView(context.rotulo(titulo))
            val f = Fluxo(context)
            val chips = ArrayList<Chip>()
            opcoes.forEach { (id, r) -> chips += Chip(context, r, radio = true) { ch -> chips.forEach { it.marcado = it === ch }; aoEscolher(id) }.apply { marcado = id == atual } }
            chips.forEach { f.addView(it) }
            g.addView(f)
            c.addView(g)
            return g
        }
        val e = ex
        if (e == "musica") c.addView(context.interruptor(T("voz.musica.guia"), salvo.musica.optBoolean("guia", true)) { v ->
            salvo.musica = org.json.JSONObject(salvo.musica.toString()).put("guia", v)
            dados.salvar(salvo)
        })
        if (e == "alcance") grupo(T("instrumento"), listOf("teclado" to T("instrumentos.teclado"), "violao" to T("instrumentos.violao")), dados.instrumento) { dados.instrumento = it; renderAlcance() }

        val vozes = listOf("padrao" to T("voz.minhaVoz.padrao")) + VOZES.map { it.id to T("voz.minhaVoz.tipos.${it.id}") } +
            (if (salvo.faixaTipo == "medida") listOf("medida" to T("voz.minhaVoz.medida")) else emptyList())
        val atualTexto = context.texto("", Papel.BODY_SMALL, C.apagado)
        fun faixaTexto() { atualTexto.text = T("voz.minhaVoz.atual", "de" to nomeNota(salvo.faixa.min), "ate" to nomeNota(salvo.faixa.max)) }
        faixaTexto()
        val gVoz = grupo(T("voz.minhaVoz.titulo"), vozes, salvo.faixaTipo) { id ->
            if (id == "medida") return@grupo
            mudar { v ->
                v.faixaTipo = id
                v.faixa = if (id == "padrao") FAIXA_PADRAO else VOZES.first { it.id == id }.let { Faixa(it.min, it.max) }
            }
            faixaTexto()
        }
        gVoz.addView(atualTexto, lp().margens(t = dp(6)))
        if (e != "alcance") gVoz.addView(context.botao(T("voz.minhaVoz.medir"), Estilo.CONTORNO) { fechar(); placarA = 0; placarT = 0; mudar { it.exercicio = "alcance" } }, lp(LayoutParams.WRAP_CONTENT).margens(t = dp(10)))

        if (e != "alcance") {
            grupo(T("voz.precisao"), TOLERANCIAS.map { "$it" to "${T("voz.precisoes.$it")} ${T("voz.precisaoCents", "n" to it)}" }, "${salvo.tolerancia}") { v -> ajustar { it.tolerancia = v.toInt() } }
            grupo(T("voz.oitava"), listOf("qualquer" to T("voz.qualquerOitava"), "mesma" to T("voz.mesmaOitava")), if (salvo.qualquerOitava) "qualquer" else "mesma") { v -> ajustar { it.qualquerOitava = v == "qualquer" } }
        }
        if ((e == "sequencia" || e == "tonica") && salvo.inicio >= 0) c.addView(context.interruptor(T("voz.subir"), salvo.subir) { v -> ajustar { it.subir = v } })
        if (e == "tonica") grupo(T("voz.ajuda"), listOf("guia" to T("voz.ajudas.guia"), "so" to T("voz.ajudas.so")), salvo.ajuda) { v -> mudar { it.ajuda = v } }
        if (e == "intervalo" || (e == "tonica" && salvo.grau == "sortear")) {
            val g = context.coluna(2)
            g.addView(context.rotulo(T("itens")))
            val f = Fluxo(context)
            Ids.intervalos.forEach { id ->
                f.addView(Chip(context, T("nomes.intervalos.$id")) { ch ->
                    val tem = id in salvo.intervalos
                    if (tem && salvo.intervalos.size == 1) return@Chip
                    mudar { v -> v.intervalos = if (tem) v.intervalos - id else Ids.intervalos.filter { it == id || it in v.intervalos } }
                    ch.marcado = !tem
                }.apply { marcado = id in salvo.intervalos })
            }
            g.addView(f)
            c.addView(g)
        }
        return c
    }

    companion object {
        /** The exercises in the chooser (the range test opens from My voice, in the settings). */
        val NA_LISTA = listOf("igualar", "longa", "sequencia", "tonica", "intervalo", "musica")
        /** How long the whole attempt may take before it ends (more for long notes and sequences). */
        private const val LIMITE_MS = 15000.0
    }
}
