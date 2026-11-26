package br.musica.marmota.common

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import br.musica.marmotatuner.conta.CHAVES_SINCRONIZADAS
import br.musica.marmotatuner.conta.EMPURRAR
import br.musica.marmotatuner.conta.Favorito
import br.musica.marmotatuner.conta.PUXAR
import br.musica.marmotatuner.conta.chaveRemota
import br.musica.marmotatuner.conta.decidir
import br.musica.marmotatuner.conta.ehDiarioDeOutro
import br.musica.marmotatuner.conta.juntarFavoritos
import br.musica.marmotatuner.treino.Dia
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executor
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * The optional account (see .specs/001-conta-e-sincronizacao.md): Google sign-in, and the person's data copied to the cloud so
 * it goes along to the website and the other app. The data stays in SharedPreferences("musica"), as "musica:<key>" with the
 * website's JSON; that is the source. The cloud is Firestore, reached by its REST API (no Firebase SDK: it would start itself
 * when the app opens). The decisions (which side wins, the log per device, favorites joined) are :core's, the same as the site.
 *
 * Nothing here runs when the app opens: [aoVoltar] only reads one preference and, signed in, posts the sync to a background
 * thread; the Google sign-in classes load only when the person taps "Entrar com Google".
 */
object Conta {
    // Public by nature (they ship in the website too); the data is protected by the Firestore rules (firestore.rules).
    private const val API_KEY = "AIzaSyDJP0E55LWUKpRollngjJ9v96WmZO5QQE0"
    private const val WEB_CLIENT_ID = "363668945683-h7jgbkonuc7ah30alndvlej1c4gq1vg4.apps.googleusercontent.com"
    private const val PROJETO = "marmota-music-app"

    private const val P = "musica:"
    private const val SESSAO = P + "_conta" // { uid, email, idToken, refresh, expira }
    private const val CARIMBOS = P + "_em" // { key: ms of the last local change } (same as the site)
    private const val ENVIADO = P + "_enviado" // { key: ms of the version the cloud has }
    private const val DISPOSITIVO = P + "_dispositivo"
    private const val SINCRONIZADO = P + "_sincronizado"
    private const val OUTROS = P + "_diarios-outros"
    /** Back in the app, read the cloud again only if the last read is older than this. */
    private const val INTERVALO_LEITURA_MS = 60_000L

    private val exec: ExecutorService by lazy { Executors.newSingleThreadExecutor() }
    private val main by lazy { Handler(Looper.getMainLooper()) }
    @Volatile private var ultimaLeitura = 0L

    fun prefs(ctx: Context): SharedPreferences = ctx.applicationContext.getSharedPreferences("musica", Context.MODE_PRIVATE)

    // ---------------------------------------------------------------- local data, with the time of each change

    /** Writes a key and notes when (the sync compares these times). Every write of synced data goes through here. */
    fun gravarLocal(prefs: SharedPreferences, chave: String, json: String) {
        val em = carimbos(prefs).put(chave, System.currentTimeMillis())
        prefs.edit().putString(P + chave, json).putString(CARIMBOS, em.toString()).apply()
    }

    private fun carimbos(prefs: SharedPreferences) = runCatching { JSONObject(prefs.getString(CARIMBOS, "{}")!!) }.getOrElse { JSONObject() }
    private fun enviados(prefs: SharedPreferences) = runCatching { JSONObject(prefs.getString(ENVIADO, "{}")!!) }.getOrElse { JSONObject() }

    /** A key that came from the cloud: written with the cloud's time, so it doesn't go back up. */
    private fun gravarDeFora(prefs: SharedPreferences, chave: String, json: String, em: Long) {
        prefs.edit()
            .putString(P + chave, json)
            .putString(CARIMBOS, carimbos(prefs).put(chave, em).toString())
            .putString(ENVIADO, enviados(prefs).put(chave, em).toString())
            .commit()
    }

    private fun dispositivo(prefs: SharedPreferences): String =
        prefs.getString(DISPOSITIVO, null) ?: java.util.UUID.randomUUID().toString().take(18).also { prefs.edit().putString(DISPOSITIVO, it).apply() }

    // ---------------------------------------------------------------- session

    private class Sessao(val uid: String, val email: String, var idToken: String, var refresh: String, var expira: Long) {
        fun json(): String = JSONObject().put("uid", uid).put("email", email).put("idToken", idToken).put("refresh", refresh).put("expira", expira).toString()
    }

    private fun sessao(prefs: SharedPreferences): Sessao? = prefs.getString(SESSAO, null)?.let { s ->
        runCatching { JSONObject(s).run { Sessao(getString("uid"), optString("email"), getString("idToken"), getString("refresh"), getLong("expira")) } }.getOrNull()
    }

    fun dentro(ctx: Context): Boolean = prefs(ctx).contains(SESSAO)
    fun email(ctx: Context): String? = sessao(prefs(ctx))?.email?.ifEmpty { null }

    /** A session with a token that still works (renewed with the refresh token when close to expiring). Background thread. */
    private fun sessaoValida(prefs: SharedPreferences): Sessao? {
        val s = sessao(prefs) ?: return null
        if (System.currentTimeMillis() < s.expira - 60_000) return s
        val r = post("https://securetoken.googleapis.com/v1/token?key=$API_KEY",
            "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(s.refresh, "UTF-8"), "application/x-www-form-urlencoded")
        s.idToken = r.getString("id_token")
        s.refresh = r.getString("refresh_token")
        s.expira = System.currentTimeMillis() + r.getString("expires_in").toLong() * 1000
        prefs.edit().putString(SESSAO, s.json()).apply()
        return s
    }

    // ---------------------------------------------------------------- sign in, out, delete (called from the account dialog)

    /** The Google account picker of Android, then Firebase. [fim]: true = signed in; false with null = cancelled. */
    fun entrar(act: Activity, fim: (ok: Boolean, erro: Boolean) -> Unit) {
        val cm = androidx.credentials.CredentialManager.create(act)
        val google = com.google.android.libraries.identity.googleid.GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(WEB_CLIENT_ID)
            .setAutoSelectEnabled(false)
            .build()
        val pedido = androidx.credentials.GetCredentialRequest.Builder().addCredentialOption(google).build()
        val noMain = Executor { main.post(it) }
        cm.getCredentialAsync(act, pedido, CancellationSignal(), noMain,
            object : androidx.credentials.CredentialManagerCallback<androidx.credentials.GetCredentialResponse, androidx.credentials.exceptions.GetCredentialException> {
                override fun onResult(result: androidx.credentials.GetCredentialResponse) {
                    val c = result.credential
                    val tipo = com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                    if (c !is androidx.credentials.CustomCredential || c.type != tipo) { fim(false, true); return }
                    val token = com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.createFrom(c.data).idToken
                    val prefs = prefs(act)
                    exec.execute {
                        val ok = runCatching {
                            val r = post("https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=$API_KEY", JSONObject()
                                .put("postBody", "id_token=$token&providerId=google.com")
                                .put("requestUri", "http://localhost")
                                .put("returnIdpCredential", true)
                                .put("returnSecureToken", true).toString())
                            val s = Sessao(r.getString("localId"), r.optString("email"), r.getString("idToken"), r.getString("refreshToken"),
                                System.currentTimeMillis() + r.getString("expiresIn").toLong() * 1000)
                            // A new sign-in on this device: its favorites are joined to the cloud's on the first sync.
                            prefs.edit().putString(SESSAO, s.json()).remove(SINCRONIZADO).remove(ENVIADO).commit()
                        }.isSuccess
                        main.post { fim(ok, !ok) }
                    }
                }

                override fun onError(e: androidx.credentials.exceptions.GetCredentialException) {
                    fim(false, e !is androidx.credentials.exceptions.GetCredentialCancellationException)
                }
            })
    }

    /** Sends what is left and stops syncing. What is on the phone stays. */
    fun sair(ctx: Context, fim: () -> Unit) {
        val prefs = prefs(ctx)
        exec.execute {
            runCatching { empurrar(prefs) }
            limpar(prefs)
            main.post(fim)
        }
    }

    /** Deletes the cloud copy and the account. What is on the phone stays. [fim]: "ok", "erro" or "relogar" (Google wants a recent sign-in). */
    fun apagar(ctx: Context, fim: (String) -> Unit) {
        val prefs = prefs(ctx)
        exec.execute {
            val r = runCatching {
                val s = sessaoValida(prefs) ?: return@runCatching "ok"
                for (id in listar(s).keys) req("DELETE", doc(s, id), s.idToken, null)
                val del = runCatching { post("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=$API_KEY", JSONObject().put("idToken", s.idToken).toString()) }
                if (del.isFailure && del.exceptionOrNull()?.message?.contains("CREDENTIAL_TOO_OLD") == true) return@runCatching "relogar"
                del.getOrThrow()
                limpar(prefs)
                "ok"
            }.getOrElse { "erro" }
            main.post { fim(r) }
        }
    }

    private fun limpar(prefs: SharedPreferences) {
        prefs.edit().remove(SESSAO).remove(SINCRONIZADO).remove(ENVIADO).remove(OUTROS).commit()
    }

    // ---------------------------------------------------------------- sync

    /**
     * Back in the app (onResume). Not signed in: nothing (one preference read). Signed in: reads the cloud in the background, at most
     * once a minute. [aoPuxar] runs on the main thread when something came from the cloud (the screen reloads it).
     */
    fun aoVoltar(ctx: Context, aoPuxar: () -> Unit) {
        val prefs = prefs(ctx)
        if (!prefs.contains(SESSAO) || System.currentTimeMillis() - ultimaLeitura < INTERVALO_LEITURA_MS) return
        ultimaLeitura = System.currentTimeMillis()
        sincronizar(ctx, aoPuxar)
    }

    /** Leaving the app (onPause): sends what changed here, without reading the cloud. */
    fun aoSair(ctx: Context) {
        val prefs = prefs(ctx)
        if (!prefs.contains(SESSAO)) return
        exec.execute { runCatching { empurrar(prefs) } }
    }

    /** Right after signing in, and on [aoVoltar]: reads the cloud, decides key by key, pulls or pushes. */
    fun sincronizar(ctx: Context, aoPuxar: () -> Unit) {
        val prefs = prefs(ctx)
        exec.execute {
            val puxou = runCatching { sincronizarAgora(prefs) }.getOrDefault(false)
            if (puxou) main.post(aoPuxar)
        }
    }

    private class Doc(val json: String, val em: Long)

    private fun sincronizarAgora(prefs: SharedPreferences): Boolean {
        val s = sessaoValida(prefs) ?: return false
        val remoto = listar(s)
        ultimaLeitura = System.currentTimeMillis()
        val disp = dispositivo(prefs)
        val primeira = !prefs.contains(SINCRONIZADO)
        var puxou = false
        for (chave in CHAVES_SINCRONIZADAS) {
            val id = chaveRemota(chave, disp)
            val r = remoto[id]
            var local = prefs.getString(P + chave, null)
            val em = carimbos(prefs)
            var localEm: Long? = if (em.has(chave)) em.getLong(chave) else null
            // First sync of this device: its favorites join the cloud's instead of one list replacing the other.
            if (primeira && chave == "metronomo-favoritos" && local != null && r != null) {
                local = juntarFavoritosJson(r.json, local)
                localEm = System.currentTimeMillis()
                gravarDeFora(prefs, chave, local, localEm)
                prefs.edit().putString(ENVIADO, enviados(prefs).put(chave, 0L).toString()).commit()
                puxou = true
            }
            when (decidir(local != null, localEm?.toDouble(), r?.em?.toDouble())) {
                EMPURRAR -> if (local != null) {
                    val quando = localEm ?: System.currentTimeMillis().also { gravarDeFora(prefs, chave, local, it) }
                    escrever(s, id, local, quando, disp)
                    prefs.edit().putString(ENVIADO, enviados(prefs).put(chave, quando).toString()).commit()
                }
                PUXAR -> if (r != null) { gravarDeFora(prefs, chave, r.json, r.em); puxou = true }
            }
        }
        // The other devices' practice logs, for the "Hoje" card.
        val outros = JSONArray()
        remoto.filterKeys { ehDiarioDeOutro(it, disp) }.values.forEach { d ->
            runCatching { JSONObject(d.json).getJSONArray("dias") }.getOrNull()?.let { outros.put(it) }
        }
        val antes = prefs.getString(OUTROS, null)
        val agora = if (outros.length() > 0) outros.toString() else null
        if (antes != agora) { prefs.edit().putString(OUTROS, agora).commit(); puxou = true }
        prefs.edit().putBoolean(SINCRONIZADO, true).apply()
        return puxou
    }

    /** Pushes the keys whose local version the cloud doesn't have yet (no read: the cheap path of everyday changes). */
    private fun empurrar(prefs: SharedPreferences) {
        val s = sessaoValida(prefs) ?: return
        val disp = dispositivo(prefs)
        val em = carimbos(prefs)
        val env = enviados(prefs)
        for (chave in CHAVES_SINCRONIZADAS) {
            if (!em.has(chave) || em.getLong(chave) == env.optLong(chave, -1)) continue
            val local = prefs.getString(P + chave, null) ?: continue
            escrever(s, chaveRemota(chave, disp), local, em.getLong(chave), disp)
            env.put(chave, em.getLong(chave))
        }
        prefs.edit().putString(ENVIADO, env.toString()).commit()
    }

    /** The other devices' practice logs (signed in), to add to this one's in the "Hoje" card. */
    fun diariosOutros(ctx: Context): Array<Array<Dia>> {
        val a = runCatching { JSONArray(prefs(ctx).getString(OUTROS, null) ?: return emptyArray()) }.getOrNull() ?: return emptyArray()
        return Array(a.length()) { i ->
            val dias = a.getJSONArray(i)
            (0 until dias.length()).mapNotNull { k ->
                val d = dias.optJSONObject(k) ?: return@mapNotNull null
                Dia(d.optString("data"), d.optString("secao"), d.optInt("respostas"), d.optInt("acertos"), d.optDouble("segundos", 0.0))
            }.toTypedArray()
        }
    }

    // ---------------------------------------------------------------- Firestore REST

    private fun base(s: Sessao) = "https://firestore.googleapis.com/v1/projects/$PROJETO/databases/(default)/documents/usuarios/${s.uid}/chaves"
    private fun doc(s: Sessao, id: String) = base(s) + "/" + URLEncoder.encode(id, "UTF-8")

    private fun listar(s: Sessao): Map<String, Doc> {
        val out = HashMap<String, Doc>()
        var pagina: String? = null
        do {
            val url = base(s) + "?pageSize=300" + (pagina?.let { "&pageToken=" + URLEncoder.encode(it, "UTF-8") } ?: "")
            val r = req("GET", url, s.idToken, null)
            val docs = r.optJSONArray("documents") ?: JSONArray()
            for (i in 0 until docs.length()) {
                val d = docs.getJSONObject(i)
                val f = d.getJSONObject("fields")
                val em = f.getJSONObject("em").let { if (it.has("integerValue")) it.getString("integerValue").toLong() else it.optDouble("doubleValue").toLong() }
                out[d.getString("name").substringAfterLast('/')] = Doc(f.getJSONObject("json").getString("stringValue"), em)
            }
            pagina = r.optString("nextPageToken").ifEmpty { null }
        } while (pagina != null)
        return out
    }

    private fun escrever(s: Sessao, id: String, json: String, em: Long, disp: String) {
        val corpo = JSONObject().put("fields", JSONObject()
            .put("json", JSONObject().put("stringValue", json))
            .put("em", JSONObject().put("integerValue", em.toString()))
            .put("dispositivo", JSONObject().put("stringValue", disp)))
        req("PATCH", doc(s, id), s.idToken, corpo.toString())
    }

    private fun post(url: String, corpo: String, tipo: String = "application/json"): JSONObject = req("POST", url, null, corpo, tipo)

    private fun req(metodo: String, url: String, token: String?, corpo: String?, tipo: String = "application/json"): JSONObject {
        val c = URL(url).openConnection() as HttpURLConnection
        try {
            c.connectTimeout = 10_000
            c.readTimeout = 15_000
            // HttpURLConnection has no PATCH: the override header does it (Google APIs accept it).
            if (metodo == "PATCH") { c.requestMethod = "POST"; c.setRequestProperty("X-HTTP-Method-Override", "PATCH") } else c.requestMethod = metodo
            token?.let { c.setRequestProperty("Authorization", "Bearer $it") }
            if (corpo != null) {
                c.doOutput = true
                c.setRequestProperty("Content-Type", "$tipo; charset=utf-8")
                c.outputStream.use { it.write(corpo.toByteArray()) }
            }
            val ok = c.responseCode in 200..299
            val texto = (if (ok) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
            if (!ok) throw IllegalStateException("$metodo ${c.responseCode}: $texto")
            return if (texto.isBlank()) JSONObject() else JSONObject(texto)
        } finally {
            c.disconnect()
        }
    }

    // ---------------------------------------------------------------- favorites (the website's JSON)

    private fun favoritos(json: String): List<Favorito> = runCatching {
        val items = JSONObject(json).getJSONArray("items")
        (0 until items.length()).map { i ->
            val f = items.getJSONObject(i)
            val a = f.optJSONArray("accents") ?: JSONArray()
            Favorito(f.optInt("bpm", 90), f.optInt("beatsPerBar", 4), f.optInt("subdivision", 1), IntArray(a.length()) { a.getInt(it) }, f.optString("name"))
        }
    }.getOrDefault(emptyList())

    private fun juntarFavoritosJson(nuvem: String, local: String): String {
        val items = JSONArray()
        juntarFavoritos(favoritos(nuvem).toTypedArray(), favoritos(local).toTypedArray()).forEach { f ->
            items.put(JSONObject().put("bpm", f.bpm).put("beatsPerBar", f.tempos).put("subdivision", f.divisao)
                .put("accents", JSONArray(f.acentos.toList())).put("name", f.nome))
        }
        return JSONObject().put("version", 1).put("items", items).put("active", -1).toString()
    }
}
