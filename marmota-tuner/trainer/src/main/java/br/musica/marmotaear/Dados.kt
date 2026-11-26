package br.musica.marmotaear

import android.content.Context
import android.content.SharedPreferences
import br.musica.marmotatuner.treino.AMOSTRAS_MAX
import br.musica.marmotatuner.treino.DIRECOES
import br.musica.marmotatuner.treino.Duracao
import br.musica.marmotatuner.treino.EXERCICIOS
import br.musica.marmotatuner.treino.EXERCICIOS_DE_PROGRAMA
import br.musica.marmotatuner.treino.FAIXA_PADRAO
import br.musica.marmotatuner.treino.Faixa
import br.musica.marmotatuner.treino.PADROES
import br.musica.marmotatuner.treino.TOLERANCIAS
import br.musica.marmotatuner.treino.VOZES
import br.musica.marmotatuner.treino.HistoricoItem
import br.musica.marmotatuner.treino.MARGENS
import br.musica.marmotatuner.treino.MINUTOS
import br.musica.marmotatuner.treino.MINUTOS_PADRAO
import br.musica.marmotatuner.treino.TETO_S
import br.musica.marmotatuner.treino.focosDe
import br.musica.marmotatuner.treino.registrarDuracao
import br.musica.marmotatuner.treino.Dia
import br.musica.marmotatuner.treino.JANELA
import br.musica.marmotatuner.treino.registrarDia
import org.json.JSONArray
import org.json.JSONObject

/** The ids each ear exercise can draw from (interval, chord, degree, cadence or progression ids), from :core's tables. */
object Ids {
    val intervalos = br.musica.marmotatuner.treino.INTERVALOS.map { it.id }
    val acordes = br.musica.marmotatuner.treino.ACORDES.map { it.id }
    val graus = br.musica.marmotatuner.treino.GRAUS.map { it.id }
    val campo = br.musica.marmotatuner.treino.CAMPO.map { it.id }
    val cadencias = br.musica.marmotatuner.treino.CADENCIAS.map { it.id }
    val progressoes = br.musica.marmotatuner.treino.PROGRESSOES.map { it.id }

    fun de(exercicio: String): List<String> = when (exercicio) {
        "acordes" -> acordes
        "campo" -> campo
        "cadencias" -> cadencias
        "progressoes" -> progressoes
        "eco" -> br.musica.marmotatuner.treino.TAMANHOS_ECO.toList()
        "ritmo" -> br.musica.marmotatuner.treino.RITMOS.map { it.id }
        else -> intervalos // intervalos, afinacao and achar all pick intervals
    }
}

/**
 * What is kept on the phone, in SharedPreferences, as JSON in the same shape as the website's localStorage
 * (musica:treino-de-ouvido, musica:treino-de-ouvido-ritmo…), validated on load like the site does.
 */
class Dados(ctx: Context) {
    private val prefs: SharedPreferences = ctx.getSharedPreferences("musica", Context.MODE_PRIVATE)

    // ---------------------------------------------------------------- ear training (musica:treino-de-ouvido)
    class Ouvido(
        var exercicio: String = "intervalos",
        val itens: MutableMap<String, List<String>> = INICIAIS.toMutableMap(),
        var direcao: String = "asc",
        var margem: Int = 30,
        var tonica: String = "do",
        var historico: Array<HistoricoItem> = emptyArray(),
        var reforco: Boolean = true,
    ) {
        companion object {
            val INICIAIS = mapOf(
                "intervalos" to listOf("3m", "3M", "4J", "5J", "8J"), "acordes" to listOf("maior", "menor"),
                "afinacao" to listOf("3M", "5J", "8J"), "achar" to listOf("3m", "3M", "5J"), "eco" to listOf("3", "4"), "ritmo" to listOf("s4", "c3", "c1", "m"),
                "campo" to listOf("I", "IV", "V", "vi"), "cadencias" to listOf("autentica", "plagal", "deceptiva", "meia"),
                "progressoes" to listOf("I-IV-V-I", "I-V-vi-IV", "vi-IV-I-V"),
            )
        }
    }

    fun ouvido(): Ouvido {
        val s = ler("treino-de-ouvido") ?: return Ouvido()
        val c = s.optJSONObject("classica") ?: JSONObject()
        val itensJ = c.optJSONObject("itens") ?: JSONObject()
        val itens = Ouvido.INICIAIS.mapValues { (ex, padrao) ->
            val ok = strings(itensJ.optJSONArray(ex)).filter { it in Ids.de(ex) }
            ok.ifEmpty { padrao }
        }.toMutableMap()
        val h = s.optJSONObject("historico") ?: JSONObject()
        val hist = h.keys().asSequence().mapNotNull { k ->
            val x = h.optJSONObject(k) ?: return@mapNotNull null
            HistoricoItem(k, x.optInt("certo"), x.optInt("total"), x.optString("r", "").filter { it == '0' || it == '1' }.takeLast(JANELA))
        }.toList().toTypedArray()
        return Ouvido(
            exercicio = c.optString("exercicio").takeIf { it in EXERCICIOS } ?: "intervalos",
            itens = itens,
            direcao = c.optString("direcao").takeIf { it in DIRECOES } ?: "asc",
            margem = c.optInt("margem", 30).takeIf { it in MARGENS } ?: 30,
            tonica = if (c.optString("tonica") == "sorteada") "sorteada" else "do",
            historico = hist,
            reforco = s.optBoolean("reforco", true),
        )
    }

    fun salvar(o: Ouvido) {
        val itens = JSONObject()
        o.itens.forEach { (k, v) -> itens.put(k, JSONArray(v)) }
        val h = JSONObject()
        o.historico.forEach { h.put(it.chave, JSONObject().put("certo", it.certo).put("total", it.total).apply { if (it.recentes.isNotEmpty()) put("r", it.recentes) }) }
        gravar("treino-de-ouvido", JSONObject()
            .put("version", 1).put("modo", "classico")
            .put("classica", JSONObject().put("exercicio", o.exercicio).put("itens", itens).put("direcao", o.direcao).put("margem", o.margem).put("tonica", o.tonica))
            .put("funcional", JSONObject().put("tonica", "do").put("graus", JSONArray(listOf("1", "3", "5"))))
            .put("historico", h)
            .put("reforco", o.reforco))
    }

    // ---------------------------------------------------------------- voice training (musica:treino-de-ouvido-voz)
    /**
     * The site's Voz.tsx store. [faixaTipo]: "padrao", a voice type id or "medida" (the one the range test suggested).
     * [musica] and [melhores] belong to the songs (Cantar); kept as they came.
     */
    class Voz(
        var exercicio: String = "igualar",
        var tolerancia: Int = 30,
        var qualquerOitava: Boolean = true,
        var intervalos: List<String> = INTERVALOS_VOZ,
        var padrao: String = "arpejoMaior",
        /** Pitch class of the start (0 = C), or -1 = random each round. */
        var inicio: Int = 0,
        var subir: Boolean = true,
        /** An interval id or "sortear". */
        var grau: String = "3M",
        var ajuda: String = "guia",
        var vista: String = "grafico",
        var faixaTipo: String = "padrao",
        var faixa: Faixa = FAIXA_PADRAO,
        var musica: JSONObject = JSONObject(),
        var melhores: JSONObject = JSONObject(),
    ) {
        /** A program runs with the default settings (the person's saved ones don't change): it is a ready-made sequence. */
        fun deProgramaCom(exercicio: String) = Voz(exercicio = exercicio, faixaTipo = faixaTipo, faixa = faixa, vista = vista, musica = musica, melhores = melhores)

        companion object {
            val EXERCICIOS = listOf("igualar", "longa", "sequencia", "tonica", "intervalo", "musica", "alcance")
            val INTERVALOS_VOZ = listOf("3m", "3M", "4J", "5J")
        }
    }

    fun voz(): Voz {
        val s = ler("treino-de-ouvido-voz") ?: return Voz()
        val ints = strings(s.optJSONArray("intervalos")).filter { it in Ids.intervalos }
        val f = s.optJSONObject("faixa")
        val tipo = f?.optString("tipo")
        val tipoOk = tipo == "padrao" || tipo == "medida" || VOZES.any { it.id == tipo }
        val fmin = f?.opt("min") as? Int
        val fmax = f?.opt("max") as? Int
        val faixaOk = tipoOk && fmin != null && fmax != null && fmin >= 36 && fmax <= 96 && fmax - fmin >= 7
        val inicio = s.opt("inicio") as? Int
        val grau = s.optString("grau")
        return Voz(
            exercicio = s.optString("exercicio").takeIf { it in Voz.EXERCICIOS } ?: "igualar",
            tolerancia = (s.opt("tolerancia") as? Int)?.takeIf { it in TOLERANCIAS } ?: 30,
            qualquerOitava = s.optBoolean("qualquerOitava", true),
            intervalos = ints.ifEmpty { Voz.INTERVALOS_VOZ },
            padrao = s.optString("padrao").takeIf { id -> PADROES.any { it.id == id } } ?: "arpejoMaior",
            inicio = inicio?.takeIf { it in -1..11 } ?: 0,
            subir = s.optBoolean("subir", true),
            grau = grau.takeIf { it == "sortear" || it in Ids.intervalos } ?: "3M",
            ajuda = if (s.optString("ajuda") == "so") "so" else "guia",
            vista = if (s.optString("vista") == "afinador") "afinador" else "grafico",
            faixaTipo = if (faixaOk) tipo!! else "padrao",
            faixa = if (faixaOk) Faixa(fmin!!, fmax!!) else FAIXA_PADRAO,
            musica = s.optJSONObject("musica") ?: JSONObject(),
            melhores = s.optJSONObject("melhores") ?: JSONObject(),
        )
    }

    fun salvar(v: Voz) {
        gravar("treino-de-ouvido-voz", JSONObject()
            .put("version", 1).put("exercicio", v.exercicio).put("tolerancia", v.tolerancia).put("qualquerOitava", v.qualquerOitava)
            .put("intervalos", JSONArray(v.intervalos)).put("padrao", v.padrao).put("inicio", v.inicio).put("subir", v.subir)
            .put("grau", v.grau).put("ajuda", v.ajuda).put("vista", v.vista)
            .put("faixa", JSONObject().put("tipo", v.faixaTipo).put("min", v.faixa.min).put("max", v.faixa.max))
            .put("musica", v.musica).put("melhores", v.melhores))
    }

    // ---------------------------------------------------------------- keyboard or guitar neck (musica:treino-de-ouvido-instrumento)
    var instrumento: String
        get() = if (ler("treino-de-ouvido-instrumento")?.optString("tipo") == "violao") "violao" else "teclado"
        set(v) = gravar("treino-de-ouvido-instrumento", JSONObject().put("version", 1).put("tipo", v))

    // ---------------------------------------------------------------- pace and last program (musica:treino-de-ouvido-ritmo)
    class Ritmo(var d: Array<Duracao>, val ultimo: MutableMap<String, Int>, val foco: MutableMap<String, String>)

    fun ritmo(): Ritmo {
        val s = ler("treino-de-ouvido-ritmo")
        val dj = s?.optJSONObject("d") ?: JSONObject()
        val d = EXERCICIOS_DE_PROGRAMA.mapNotNull { ex ->
            val a = dj.optJSONArray(ex) ?: return@mapNotNull null
            val v = (0 until a.length()).map { a.optDouble(it) }.filter { it > 0 && it <= TETO_S }.takeLast(AMOSTRAS_MAX)
            Duracao(ex, v.toTypedArray())
        }.toTypedArray()
        fun min(secao: String) = s?.optJSONObject("ultimo")?.optInt(secao)?.takeIf { it in MINUTOS } ?: MINUTOS_PADRAO
        fun foco(secao: String) = s?.optJSONObject("foco")?.optString(secao)?.takeIf { it in focosDe(secao) } ?: "geral"
        return Ritmo(d, mutableMapOf("ouvido" to min("ouvido"), "voz" to min("voz")), mutableMapOf("ouvido" to foco("ouvido"), "voz" to foco("voz")))
    }

    fun salvar(r: Ritmo) {
        val d = JSONObject()
        r.d.forEach { d.put(it.exercicio, JSONArray(it.valores.toList())) }
        gravar("treino-de-ouvido-ritmo", JSONObject().put("version", 1).put("d", d)
            .put("ultimo", JSONObject(r.ultimo as Map<*, *>)).put("foco", JSONObject(r.foco as Map<*, *>)))
    }

    /** Notes how long a question took (ms): the pace that sizes the programs. */
    fun anotarDuracao(exercicio: String, ms: Double) {
        val r = ritmo()
        r.d = registrarDuracao(r.d, exercicio, ms)
        salvar(r)
    }

    // ---------------------------------------------------------------- practice log (musica:treino-diario)
    /** The days logged (Diario.kt): answers, right answers and seconds per day and section, as the website keeps them. */
    fun dias(): Array<Dia> {
        val a = ler("treino-diario")?.optJSONArray("dias") ?: return emptyArray()
        return (0 until a.length()).mapNotNull { i ->
            val x = a.optJSONObject(i) ?: return@mapNotNull null
            val data = x.optString("data"); val secao = x.optString("secao")
            if (!Regex("""\d{4}-\d{2}-\d{2}""").matches(data) || secao !in listOf("ouvido", "voz")) return@mapNotNull null
            Dia(data, secao, x.optInt("respostas").coerceAtLeast(0), x.optInt("acertos").coerceAtLeast(0), x.optDouble("segundos", 0.0).takeIf { it.isFinite() && it >= 0 } ?: 0.0)
        }.toTypedArray()
    }

    /** One more answer (ear) or attempt (voice) today, with how long it took. */
    fun anotarDia(secao: String, certo: Boolean, ms: Double) {
        val dias = registrarDia(dias(), hoje(), secao, certo, ms / 1000)
        val a = JSONArray()
        dias.forEach { a.put(JSONObject().put("data", it.data).put("secao", it.secao).put("respostas", it.respostas).put("acertos", it.acertos).put("segundos", it.segundos)) }
        gravar("treino-diario", JSONObject().put("version", 1).put("dias", a))
    }

    /** Today in the local calendar, "YYYY-MM-DD". */
    fun hoje(): String = java.time.LocalDate.now().toString()

    // ---------------------------------------------------------------- helpers
    fun ler(chave: String): JSONObject? = prefs.getString("musica:$chave", null)?.let { runCatching { JSONObject(it) }.getOrNull() }
    /** Writes and notes when (the optional account syncs by these times; see br.musica.marmota.common.Conta). */
    fun gravar(chave: String, v: JSONObject) = br.musica.marmota.common.Conta.gravarLocal(prefs, chave, v.toString())

    companion object {
        fun strings(a: JSONArray?): List<String> = if (a == null) emptyList() else (0 until a.length()).mapNotNull { a.opt(it) as? String }
    }
}
