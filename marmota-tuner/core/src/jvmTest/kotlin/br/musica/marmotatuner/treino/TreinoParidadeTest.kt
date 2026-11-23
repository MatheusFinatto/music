package br.musica.marmotatuner.treino

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test
import kotlin.math.abs

/**
 * Parity with the website: treino-fixtures.json is written by src/tools/treino-de-ouvido/paridade.test.ts (seeded mulberry32,
 * every exercise setup) and this test checks that the Kotlin gives exactly the same questions, notes and answers.
 */
class TreinoParidadeTest {
    private val fx = JSONObject(javaClass.getResource("/treino-fixtures.json")!!.readText())

    // ---- encoders: the same shapes paridade.test.ts writes ----
    private fun nota(n: PianoNote) = listOf(n.midi, n.at, n.dur, n.cents)
    private fun classica(p: PerguntaClassica) = listOf(
        p.chave, p.resposta, p.notas.map(::nota), p.cents, p.tonica, p.acordes?.toList(), p.reveal?.toList(), p.dada, p.alvo,
    )
    private fun resumoClassica(p: PerguntaClassica) = listOf(p.resposta, p.notas.first().midi, p.notas.last().midi, p.cents ?: p.tonica ?: p.dada)
    private fun funcional(p: PerguntaFuncional) =
        listOf(p.chave, p.resposta, p.tonica, p.cadencia.map(::nota), p.nota.map(::nota), p.tudo.map(::nota))
    private fun resumoFuncional(p: PerguntaFuncional) = listOf(p.resposta, p.tonica, p.nota[0].midi)
    private fun faixa(f: Faixa) = listOf(f.min, f.max)

    // ---- JSON helpers ----
    private fun JSONArray.list(): List<Any?> = (0 until length()).map { get(it) }
    private fun JSONArray.strings(): Array<String> = Array(length()) { getString(it) }
    private fun JSONArray.ints(): Array<Int> = Array(length()) { getInt(it) }
    private fun Any?.dbl(): Double? = if (this == null || this == JSONObject.NULL) null else (this as Number).toDouble()
    private fun JSONObject.arr(k: String) = getJSONArray(k)

    /** Deep comparison: numbers as doubles (1e-9), lists in order, JSON null = Kotlin null. */
    private fun igual(esperado: Any?, atual: Any?, onde: String) {
        val e = if (esperado == JSONObject.NULL) null else esperado
        when {
            e == null -> if (atual != null) fail("$onde: esperado null, veio $atual")
            e is JSONArray -> {
                val a = when (atual) {
                    is List<*> -> atual
                    is Array<*> -> atual.toList()
                    else -> return fail("$onde: esperado lista $e, veio $atual")
                }
                if (e.length() != a.size) fail("$onde: tamanho ${e.length()} ≠ ${a.size} (esperado $e, veio $a)")
                for (i in a.indices) igual(e.get(i), a[i], "$onde[$i]")
            }
            e is Number -> {
                if (atual !is Number) fail("$onde: esperado $e, veio $atual")
                if (abs(e.toDouble() - (atual as Number).toDouble()) > 1e-9) fail("$onde: esperado $e, veio $atual")
            }
            else -> assertEquals(onde, e, atual)
        }
    }

    private fun historico(a: JSONArray) = Array(a.length()) {
        val x = a.getJSONArray(it)
        HistoricoItem(x.getString(0), x.getInt(1), x.getInt(2))
    }

    @Test fun mulberry32_igual_ao_do_site() {
        for (c in fx.arr("rng").list()) {
            c as JSONArray
            val r = mulberry32(c.getInt(0))
            igual(c.getJSONArray(1), List(20) { r() }, "rng ${c.getInt(0)}")
        }
    }

    @Test fun perguntas_classicas() {
        val hist = historico(fx.arr("historico"))
        for ((k, c) in fx.arr("classica").list().withIndex()) {
            c as JSONObject
            val cfg = ConfigClassica(c.getString("exercicio"), c.arr("itens").strings(), c.getString("direcao"), c.getInt("margem"), c.getString("tonica"))
            val h = if (c.getBoolean("hist")) hist else null
            val sementes = c.arr("sementes")
            for (s in 0 until sementes.length()) {
                val r = mulberry32(s + 1)
                val esperadas = sementes.getJSONArray(s)
                val atual = if (s + 1 <= COMPLETAS) {
                    List(esperadas.length()) { classica(perguntaClassica(cfg, r, h)) }
                } else {
                    listOf(resumoClassica(perguntaClassica(cfg, r, h)))
                }
                igual(esperadas, atual, "classica[$k] ${c.getString("exercicio")} ${c.getString("direcao")} semente ${s + 1}")
            }
        }
    }

    @Test fun perguntas_funcionais() {
        val hist = historico(fx.arr("historico"))
        for ((k, c) in fx.arr("funcional").list().withIndex()) {
            c as JSONObject
            val cfg = ConfigFuncional(c.getString("tonica"), c.arr("graus").strings())
            val h = if (c.getBoolean("hist")) hist else null
            val sementes = c.arr("sementes")
            for (s in 0 until sementes.length()) {
                val r = mulberry32(s + 1)
                val esperadas = sementes.getJSONArray(s)
                val atual = if (s + 1 <= COMPLETAS) {
                    List(esperadas.length()) { funcional(perguntaFuncional(cfg, r, h)) }
                } else {
                    listOf(resumoFuncional(perguntaFuncional(cfg, r, h)))
                }
                igual(esperadas, atual, "funcional[$k] semente ${s + 1}")
            }
        }
    }

    @Test fun comparar_afinacao_nomes_e_teclado() {
        for (c in fx.arr("comparar").list()) {
            c as JSONArray
            val notas = c.getJSONArray(0).list().map { n ->
                n as JSONArray
                PianoNote(n.getInt(0), n.getDouble(1), n.getDouble(2), n.getDouble(3))
            }.toTypedArray()
            igual(c.getJSONArray(1), compararAfinacao(notas).map(::nota), "comparar")
        }
        for (c in fx.arr("nomes").list()) {
            c as JSONArray
            val m = c.getInt(0)
            igual(c, listOf(m, nomeTom(m), nomeNota(m)), "nomes $m")
        }
        for (c in fx.arr("acordesNomes").list()) {
            c as JSONArray
            val t = c.getInt(0)
            igual(c.getJSONArray(1), CAMPO.map { nomeAcorde(t, it.id) }, "acorde $t")
        }
        for (c in fx.arr("teclado").list()) {
            c as JSONArray
            igual(c.getJSONArray(1), faixaDoTeclado(c.getJSONArray(0).ints()), "teclado ${c.getJSONArray(0)}")
        }
    }

    @Test fun registrar_peso_e_placar() {
        val reg = fx.getJSONObject("registrar")
        var h = emptyArray<HistoricoItem>()
        var p = PLACAR_ZERO
        for ((i, x) in reg.arr("passos").list().withIndex()) {
            x as JSONArray
            val chave = x.getString(0)
            val certo = x.getBoolean(1)
            h = registrar(h, chave, certo)
            p = somar(p, certo)
            igual(x, listOf(chave, certo, peso(h, chave), listOf(p.acertos, p.total, p.sequencia, p.melhor)), "registrar[$i]")
        }
        igual(reg.arr("final"), h.map { listOf(it.chave, it.certo, it.total) }, "historico final")
    }

    @Test fun voz_segurar_a_nota() {
        for (c in fx.arr("cents").list()) {
            c as JSONArray
            igual(c.get(3), centsDe(c.getDouble(0), c.getDouble(1), c.getBoolean(2)), "cents $c")
        }
        for ((k, c) in fx.arr("segurar").list().withIndex()) {
            c as JSONObject
            var st = SEGURANDO_ZERO
            val entradas = c.arr("entradas")
            val saidas = c.arr("saidas")
            for (i in 0 until entradas.length()) {
                val e = entradas.getJSONArray(i)
                val p = atualizar(st, e.get(0).dbl(), e.getDouble(1), c.getDouble("alvo"), c.getDouble("tol"), c.getBoolean("q"), c.getDouble("segurar"))
                st = p.estado
                igual(saidas.get(i), listOf(p.estado.desde, p.estado.visto, p.estado.n, p.cents, p.ok, p.media, p.oscilacao), "segurar[$k] passo $i")
            }
        }
    }

    @Test fun voz_alcance() {
        for ((k, c) in fx.arr("alcance").list().withIndex()) {
            c as JSONObject
            var a = ALCANCE_ZERO
            val entradas = c.arr("entradas")
            val saidas = c.arr("saidas")
            for (i in 0 until entradas.length()) {
                val e = entradas.getJSONArray(i)
                a = medirAlcance(a, e.get(0).dbl(), e.getDouble(1))
                igual(saidas.get(i), listOf(a.min, a.max, a.candidato, a.desde, a.visto), "alcance[$k] passo $i")
            }
        }
    }

    @Test fun voz_faixas_rodadas_e_sorteios() {
        for (c in fx.arr("rodada").list()) {
            c as JSONArray
            val f = c.get(0).let { if (it == JSONObject.NULL) null else (it as JSONArray).let { x -> Faixa(x.getInt(0), x.getInt(1)) } }
            val classe = c.getInt(1)
            val subir = c.getBoolean(2)
            val largura = c.getInt(3)
            igual(c.getJSONArray(4), List(9) { inicioDaRodada(classe, it, subir, f, largura) }, "rodada $c")
        }
        for (c in fx.arr("faixas").list()) {
            c as JSONArray
            val lo = c.getInt(0)
            val hi = c.getInt(1)
            val f = faixaConfortavel(lo, hi)
            igual(c, listOf(lo, hi, faixa(f), vozMaisProxima(f), vozMaisProxima(Faixa(lo, hi))), "faixa $lo-$hi")
        }
        for (c in fx.arr("sorteiosVoz").list()) {
            c as JSONArray
            val r = mulberry32(c.getInt(0))
            igual(c, listOf(c.getInt(0), sortearClasseDeVoz(r), sortearAlvoDeVoz(r, FAIXA_PADRAO), sortearAlvoDeVoz(r, Faixa(40, 52))), "sorteio voz")
        }
        for (c in fx.arr("extensao").list()) {
            c as JSONArray
            val e = extensao(c.getInt(0))
            igual(c, listOf(c.getInt(0), e.oitavas, e.semitons), "extensao")
        }
        for (c in fx.arr("padroes").list()) {
            c as JSONArray
            igual(c.getJSONArray(1), notasDoPadrao(57, PADROES.first { it.id == c.getString(0) }.semitons), "padrao")
        }
    }

    @Test fun programas() {
        val p = fx.getJSONObject("programas")
        var d = emptyArray<Duracao>()
        for (x in p.arr("registros").list()) {
            x as JSONArray
            val ms = if (x.get(1) == "Infinity") Double.POSITIVE_INFINITY else x.getDouble(1)
            d = registrarDuracao(d, x.getString(0), ms)
        }
        igual(p.arr("duracoes"), d.map { listOf(it.exercicio, it.valores.toList()) }, "duracoes")
        for (x in p.arr("planos").list()) {
            x as JSONArray
            val dur = if (x.getBoolean(3)) d else emptyArray()
            val plano = planejar(x.getString(0), x.getString(1), x.getInt(2), dur)
            val seg = estimarSegundos(plano, dur)
            igual(x, listOf(x.getString(0), x.getString(1), x.getInt(2), x.getBoolean(3), plano.map { listOf(it.exercicio, it.perguntas) }, seg, minutosParaMostrar(seg)), "plano $x")
        }
        for (x in p.arr("medianas").list()) {
            x as JSONArray
            val v = x.getJSONArray(0).list().map { (it as Number).toDouble() }.toTypedArray()
            igual(x.get(1), mediana(v), "mediana $x")
        }
    }

    @Test fun cantar() {
        val faixas = listOf(null) + VOZES.map { Faixa(it.min, it.max) } + listOf(Faixa(50, 55), Faixa(30, 90))
        for (c in fx.arr("cantar").list()) {
            c as JSONObject
            val m = MUSICAS.first { it.id == c.getString("musica") }
            val t = m.trechos.first { it.nome == c.getString("trecho") }
            val onde = "${m.id} / ${t.nome}"
            igual(c.arr("tonicas"), faixas.map { f -> listOf(0, 5, 11).map { tonicaParaCaber(it, t.notas, f) } }, "$onde tônicas")
            val js = janelas(t.notas, m.bpm, tonicaParaCaber(0, t.notas, null))
            igual(c.arr("janelas"), js.map { listOf(it.ini, it.fim, it.midi, it.sil) }, "$onde janelas")
            val amostras = c.arr("amostras").list().map { a ->
                a as JSONArray
                Amostra(a.getDouble(0), a.get(1).dbl())
            }.toTypedArray()
            val tol = c.getDouble("tol")
            val q = c.getBoolean("q")
            val acertos = js.map { acertoDaNota(amostras, it, tol, q, it.fim) }.toTypedArray()
            igual(c.arr("acertos"), acertos.map { listOf(it.fracao, it.ok, it.ouvido) }, "$onde acertos")
            val aoVivo = js.map { acertoDaNota(amostras, it, tol, q, (it.ini + it.fim) / 2) }
            igual(c.arr("aoVivo"), aoVivo.map { listOf(it.fracao, it.ok, it.ouvido) }, "$onde ao vivo")
            val r = resumir(js, acertos)
            igual(c.arr("resumo"), listOf(r.acertadas, r.total, r.ok), "$onde resumo")
        }
        for (x in fx.arr("dobrar").list()) {
            x as JSONArray
            igual(x.get(2), dobrar(x.getDouble(0), x.getDouble(1)), "dobrar $x")
        }
    }

    @Test fun violao() {
        for (x in fx.arr("posicoes").list()) {
            x as JSONArray
            igual(x.getJSONArray(1), posicoesDe(x.getInt(0)).map { listOf(it.corda, it.casa, it.midi) }, "posicoes $x")
        }
        for (x in fx.arr("acordesViolao").list()) {
            x as JSONArray
            igual(x.get(1), acordeNoBraco(x.getJSONArray(0).ints())?.map { listOf(it.corda, it.casa, it.midi) }, "acorde ${x.get(0)}")
        }
        for (x in fx.arr("arpejos").list()) {
            x as JSONArray
            val f = formaDoArpejo(x.getJSONArray(0).ints())
            igual(x.get(1), f?.let { listOf(it.de, it.ate, it.posicoes.map { p -> listOf(p.corda, p.casa, p.midi, p.raiz) }) }, "arpejo ${x.get(0)}")
        }
    }

    private companion object {
        /** Same as COMPLETAS in paridade.test.ts: seeds with the full question; the others keep a summary. */
        const val COMPLETAS = 8
    }
}
