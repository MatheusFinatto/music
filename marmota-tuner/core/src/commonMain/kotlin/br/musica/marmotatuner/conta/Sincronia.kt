@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner.conta

import br.musica.marmotatuner.treino.Dia

// The optional account (Google sign-in) syncs the person's data between the website and the two apps. The data stays on each
// device (localStorage on the site, SharedPreferences in the apps, same keys and same JSON) and the cloud keeps a copy per key.
// This file holds the decisions both sides must take the same way; the transport (Firebase) and the JSON live on each platform.
// See .specs/001-conta-e-sincronizacao.md.

/** The keys that travel ("musica:<key>" on the device). The current metronome tempo stays on each device on purpose. */
val CHAVES_SINCRONIZADAS: Array<String> = arrayOf(
    "metronomo-favoritos",
    "treino-de-ouvido",
    "treino-de-ouvido-voz",
    "treino-de-ouvido-ritmo",
    "treino-de-ouvido-instrumento",
    CHAVE_DIARIO,
)

/** The practice log is per device in the cloud (each device only writes its own), and the "Hoje" card adds them up. */
const val CHAVE_DIARIO = "treino-diario"

/** Separates the log key from the device id in the cloud: "treino-diario~<device>". */
const val SEPARADOR_DISPOSITIVO = "~"

/** The cloud document for [chave] written by [dispositivo]. */
fun chaveRemota(chave: String, dispositivo: String): String =
    if (chave == CHAVE_DIARIO) "$CHAVE_DIARIO$SEPARADOR_DISPOSITIVO$dispositivo" else chave

/** Whether a cloud document is another device's log (to be added up, never written here). */
fun ehDiarioDeOutro(remota: String, dispositivo: String): Boolean =
    remota.startsWith("$CHAVE_DIARIO$SEPARADOR_DISPOSITIVO") && remota != chaveRemota(CHAVE_DIARIO, dispositivo)

const val NADA = 0
const val EMPURRAR = 1
const val PUXAR = 2

/**
 * What to do with one key. [localEm] and [remotoEm] are the times (ms) of the last change on each side; null when that side has
 * nothing. A local value written before the account existed has no time: it counts as 0, so on a device's first sync whatever is
 * already in the cloud wins (favorites are joined before that, see [juntarFavoritos]).
 */
fun decidir(temLocal: Boolean, localEm: Double?, remotoEm: Double?): Int {
    if (remotoEm == null) return if (temLocal) EMPURRAR else NADA
    if (!temLocal) return PUXAR
    val l = localEm ?: 0.0
    return when {
        l > remotoEm -> EMPURRAR
        l < remotoEm -> PUXAR
        else -> NADA
    }
}

/** One favorite of the metronome, as in "musica:metronomo-favoritos" (the platform reads and writes the JSON). */
class Favorito(val bpm: Int, val tempos: Int, val divisao: Int, val acentos: IntArray, val nome: String) {
    fun mesmasConfiguracoes(o: Favorito): Boolean =
        bpm == o.bpm && tempos == o.tempos && divisao == o.divisao && acentos.contentEquals(o.acentos)
}

/** How many favorites the list keeps (the site's MAX_FAVORITES). */
const val MAX_FAVORITOS = 30

/**
 * A device's first sync: its favorites join the cloud's instead of one list replacing the other. The cloud's come first, in
 * their order; then the device's that the cloud doesn't have (same settings and same name = the same favorite).
 */
fun juntarFavoritos(nuvem: Array<Favorito>, local: Array<Favorito>): Array<Favorito> {
    val novos = local.filter { l -> nuvem.none { it.mesmasConfiguracoes(l) && it.nome == l.nome } }
    return (nuvem.toList() + novos).take(MAX_FAVORITOS).toTypedArray()
}

/** The "Hoje" card of every device together: same day and section add up answers, right answers and seconds. */
fun somarDiarios(listas: Array<Array<Dia>>): Array<Dia> {
    val soma = LinkedHashMap<String, Dia>()
    for (lista in listas) for (d in lista) {
        val k = "${d.data}|${d.secao}"
        val a = soma[k]
        soma[k] = if (a == null) d else Dia(d.data, d.secao, a.respostas + d.respostas, a.acertos + d.acertos, a.segundos + d.segundos)
    }
    return soma.values.sortedWith(compareBy({ it.data }, { it.secao })).toTypedArray()
}
