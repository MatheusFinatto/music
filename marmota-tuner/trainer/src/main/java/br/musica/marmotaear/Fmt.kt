package br.musica.marmotaear

import kotlin.math.abs
import kotlin.math.floor

/**
 * The interface texts. Most come from the website (TEXTOS, generated from messages/pt-BR.json), so the app says exactly what the
 * site says; [APP] holds the few that only exist here (Android permission, the About screen). Missing keys show the key itself,
 * which a screenshot catches.
 */
object T {
    operator fun invoke(chave: String, vararg args: Pair<String, Any>): String {
        val modelo = APP[chave] ?: TEXTOS[chave] ?: return chave
        return formatar(modelo, args.toMap())
    }

    fun tem(chave: String): Boolean = chave in APP || chave in TEXTOS

    /**
     * The ICU subset the site's messages use: `{x}`, and `{x, plural, =0 {…} one {…} other {…}}` with `#` for the number.
     * Portuguese plural rule as in Intl.PluralRules("pt-BR"): "one" for 0 and 1 (integer part), "other" for the rest.
     */
    fun formatar(modelo: String, args: Map<String, Any>): String {
        val sb = StringBuilder()
        var i = 0
        while (i < modelo.length) {
            val c = modelo[i]
            if (c != '{') { sb.append(c); i++; continue }
            val fim = fecha(modelo, i)
            val dentro = modelo.substring(i + 1, fim)
            val partes = dentro.split(',', limit = 3).map { it.trim() }
            val valor = args[partes[0]]
            if (partes.size >= 3 && partes[1] == "plural") {
                val n = (valor as? Number)?.toDouble() ?: 0.0
                val casos = casos(dentro.substring(dentro.indexOf(',', dentro.indexOf(',') + 1) + 1))
                val escolhido = casos["=${numero(n)}"] ?: casos[if (floor(abs(n)) <= 1.0 && n == floor(n)) "one" else "other"] ?: casos["other"] ?: ""
                sb.append(formatar(escolhido.replace("#", numero(n)), args))
            } else {
                sb.append(valor?.let { if (it is Number) numero(it.toDouble()) else it.toString() } ?: "{${partes[0]}}")
            }
            i = fim + 1
        }
        return sb.toString()
    }

    private fun numero(n: Double): String = if (n == floor(n)) n.toLong().toString() else n.toString().replace('.', ',')

    /** Index of the `}` that closes the `{` at [abre]. */
    private fun fecha(s: String, abre: Int): Int {
        var nivel = 0
        for (k in abre until s.length) {
            if (s[k] == '{') nivel++ else if (s[k] == '}') { nivel--; if (nivel == 0) return k }
        }
        return s.length - 1
    }

    /** "=0 {a} one {b} other {c}" → {=0: a, one: b, other: c}. */
    private fun casos(s: String): Map<String, String> {
        val out = HashMap<String, String>()
        var i = 0
        while (i < s.length) {
            while (i < s.length && s[i].isWhitespace()) i++
            val abre = s.indexOf('{', i)
            if (abre < 0) break
            val nome = s.substring(i, abre).trim()
            val fim = fecha(s, abre)
            out[nome] = s.substring(abre + 1, fim)
            i = fim + 1
        }
        return out
    }

    /** Texts only the app has. Same voice as the site: direct, no sales talk. */
    private val APP = mapOf(
        "app.nome" to "Ear & Voice",
        "app.ouvido" to "Ouvido",
        "app.voz" to "Voz",
        "app.ajustes" to "Ajustes",
        "app.fracos" to "Pontos fracos",
        "app.sobre" to "Sobre",
        "app.fechar" to "Fechar",
        "app.sobreTexto" to "Treino de ouvido e de voz do Marmota Music, gratuito e sem anúncios. A lógica é a mesma do site (marmota-music.vercel.app): um treino feito aqui vale igual ao de lá.",
        "app.versao" to "Versão {v}",
        "app.micPermissao" to "Para conferir o que você canta, o app precisa ouvir o microfone. Nada é gravado nem sai do celular.",
        "app.micLiberar" to "Liberar o microfone",
        "app.micConfig" to "O microfone está bloqueado. Libere em Configurações > Apps > Marmota Ear & Voice > Permissões.",
        "app.abrirConfig" to "Abrir configurações",
        "app.creditos" to "Piano: Salamander Grand Piano, de Alexander Holm (CC BY 3.0).",
        "app.carregandoPiano" to "Carregando o piano…",
        "app.marca.alvo" to "tocada",
        "app.marca.dada" to "nota dada",
        "app.marca.sel" to "escolhida",
        "app.marca.errada" to "errada",
        "app.marca.toca" to "soando",
        "app.posicao" to "{nota}, corda {corda}, {casa, plural, =0 {solta} other {casa #}}",
    )
}
