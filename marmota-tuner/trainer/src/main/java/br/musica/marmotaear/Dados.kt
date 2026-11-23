package br.musica.marmotaear

import android.content.Context
import android.content.SharedPreferences
import br.musica.marmotatuner.treino.AMOSTRAS_MAX
import br.musica.marmotatuner.treino.DIRECOES
import br.musica.marmotatuner.treino.Duracao
import br.musica.marmotatuner.treino.EXERCICIOS
import br.musica.marmotatuner.treino.EXERCICIOS_DE_PROGRAMA
import br.musica.marmotatuner.treino.HistoricoItem
import br.musica.marmotatuner.treino.MARGENS
import br.musica.marmotatuner.treino.MINUTOS
import br.musica.marmotatuner.treino.MINUTOS_PADRAO
import br.musica.marmotatuner.treino.TETO_S
import br.musica.marmotatuner.treino.focosDe
import br.musica.marmotatuner.treino.registrarDuracao
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
                "afinacao" to listOf("3M", "5J", "8J"), "achar" to listOf("3m", "3M", "5J"),
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
            HistoricoItem(k, x.optInt("certo"), x.optInt("total"))
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
        o.historico.forEach { h.put(it.chave, JSONObject().put("certo", it.certo).put("total", it.total)) }
        gravar("treino-de-ouvido", JSONObject()
            .put("version", 1).put("modo", "classico")
            .put("classica", JSONObject().put("exercicio", o.exercicio).put("itens", itens).put("direcao", o.direcao).put("margem", o.margem).put("tonica", o.tonica))
            .put("funcional", JSONObject().put("tonica", "do").put("graus", JSONArray(listOf("1", "3", "5"))))
            .put("historico", h)
            .put("reforco", o.reforco))
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

    // ---------------------------------------------------------------- helpers
    fun ler(chave: String): JSONObject? = prefs.getString("musica:$chave", null)?.let { runCatching { JSONObject(it) }.getOrNull() }
    fun gravar(chave: String, v: JSONObject) = prefs.edit().putString("musica:$chave", v.toString()).apply()

    companion object {
        fun strings(a: JSONArray?): List<String> = if (a == null) emptyList() else (0 until a.length()).mapNotNull { a.opt(it) as? String }
    }
}
