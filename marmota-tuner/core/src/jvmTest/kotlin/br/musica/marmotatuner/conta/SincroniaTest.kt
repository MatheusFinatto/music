package br.musica.marmotatuner.conta

import br.musica.marmotatuner.treino.Dia
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SincroniaTest {
    @Test fun `the most recent side wins`() {
        assertEquals(EMPURRAR, decidir(true, 200.0, 100.0))
        assertEquals(PUXAR, decidir(true, 100.0, 200.0))
        assertEquals(NADA, decidir(true, 100.0, 100.0))
    }

    @Test fun `one side empty`() {
        assertEquals(EMPURRAR, decidir(true, null, null))
        assertEquals(NADA, decidir(false, null, null))
        assertEquals(PUXAR, decidir(false, null, 5.0))
    }

    @Test fun `data from before the account loses to the cloud`() {
        assertEquals(PUXAR, decidir(true, null, 1.0))
    }

    @Test fun `the log goes to the cloud per device`() {
        assertEquals("treino-diario~abc", chaveRemota(CHAVE_DIARIO, "abc"))
        assertEquals("treino-de-ouvido", chaveRemota("treino-de-ouvido", "abc"))
        assertTrue(ehDiarioDeOutro("treino-diario~xyz", "abc"))
        assertFalse(ehDiarioDeOutro("treino-diario~abc", "abc"))
        assertFalse(ehDiarioDeOutro("treino-de-ouvido", "abc"))
    }

    @Test fun `the current tempo does not travel`() {
        assertFalse(CHAVES_SINCRONIZADAS.contains("metronomo"))
        assertTrue(CHAVES_SINCRONIZADAS.contains("metronomo-favoritos"))
    }

    private fun fav(bpm: Int, nome: String = "") = Favorito(bpm, 4, 1, intArrayOf(2, 1, 1, 1), nome)

    @Test fun `first sync joins favorites, the cloud first`() {
        val r = juntarFavoritos(arrayOf(fav(90), fav(120, "rock")), arrayOf(fav(120, "rock"), fav(60), fav(90, "lento")))
        assertEquals(listOf(90 to "", 120 to "rock", 60 to "", 90 to "lento"), r.map { it.bpm to it.nome })
    }

    @Test fun `joined favorites keep the limit`() {
        val r = juntarFavoritos(Array(25) { fav(60 + it) }, Array(10) { fav(200 + it) })
        assertEquals(MAX_FAVORITOS, r.size)
        assertEquals(60, r[0].bpm)
    }

    @Test fun `logs of several devices add up per day and section`() {
        val a = arrayOf(Dia("2026-11-26", "ouvido", 10, 8, 300.0), Dia("2026-11-25", "voz", 3, 2, 60.0))
        val b = arrayOf(Dia("2026-11-26", "ouvido", 5, 5, 100.0), Dia("2026-11-26", "voz", 1, 1, 20.0))
        val s = somarDiarios(arrayOf(a, b))
        assertArrayEquals(
            arrayOf("2026-11-25|voz|3|2|60.0", "2026-11-26|ouvido|15|13|400.0", "2026-11-26|voz|1|1|20.0"),
            s.map { "${it.data}|${it.secao}|${it.respostas}|${it.acertos}|${it.segundos}" }.toTypedArray(),
        )
    }
}
