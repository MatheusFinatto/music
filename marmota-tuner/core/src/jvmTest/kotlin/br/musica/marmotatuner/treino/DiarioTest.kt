package br.musica.marmotatuner.treino

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DiarioTest {
    @Test fun numeroDoDia() {
        assertEquals(0, numeroDoDia("1970-01-01"))
        assertEquals(20417, numeroDoDia("2025-11-25"))
        assertEquals(numeroDoDia("2024-03-01") - 1, numeroDoDia("2024-02-29"))
    }

    @Test fun registraESomaPorDiaESecao() {
        var d = emptyArray<Dia>()
        d = registrarDia(d, "2026-11-25", "ouvido", true, 10.0)
        d = registrarDia(d, "2026-11-25", "ouvido", false, 500.0) // capped at 90 s
        d = registrarDia(d, "2026-11-25", "voz", true, 30.0)
        assertEquals(2, d.size)
        val o = d.first { it.secao == "ouvido" }
        assertEquals(2, o.respostas); assertEquals(1, o.acertos); assertEquals(100.0, o.segundos, 1e-9)
    }

    @Test fun esqueceDiasVelhos() {
        var d = registrarDia(emptyArray(), "2026-01-01", "ouvido", true, 5.0)
        d = registrarDia(d, "2026-11-25", "ouvido", true, 5.0)
        assertEquals(listOf("2026-11-25"), d.map { it.data })
    }

    @Test fun resumoComSemanaESequencia() {
        var d = emptyArray<Dia>()
        for (dia in listOf("2026-11-21", "2026-11-23", "2026-11-24", "2026-11-25")) d = registrarDia(d, dia, "ouvido", true, 90.0)
        d = registrarDia(d, "2026-11-25", "ouvido", false, 90.0)
        val r = resumoDiario(d, "2026-11-25", "ouvido")
        assertEquals(2, r.respostasHoje); assertEquals(1, r.acertosHoje); assertEquals(3, r.minutosHoje)
        assertArrayEquals(intArrayOf(0, 0, 2, 0, 2, 2, 3), r.semana)
        assertEquals(3, r.sequencia)
        // Today without practice yet: the streak up to yesterday still counts.
        assertEquals(3, resumoDiario(d, "2026-11-26", "ouvido").sequencia)
        assertEquals(0, resumoDiario(d, "2026-11-27", "ouvido").sequencia)
    }

    @Test fun janelaMovelPesaOQueEstaErrandoAgora() {
        var h = emptyArray<HistoricoItem>()
        repeat(30) { h = registrar(h, "intervalos:3m", false) } // used to miss it a lot
        repeat(JANELA) { h = registrar(h, "intervalos:3m", true) } // now always right
        val x = h.single()
        assertEquals(JANELA, x.recentes.length)
        assertEquals(1.0, taxaAtual(x)!!, 1e-9)
        assertEquals(1.0, peso(h, "intervalos:3m"), 1e-9)
        assertNull(taxaAtual(HistoricoItem("a", 1, 1)))
        assertEquals(0.5, taxaAtual(HistoricoItem("a", 1, 2))!!, 1e-9) // old data without the window: the totals
    }
}
