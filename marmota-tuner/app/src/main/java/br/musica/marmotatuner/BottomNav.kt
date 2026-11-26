package br.musica.marmotatuner

import android.app.Activity
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import br.musica.marmota.common.Paleta

/** As duas telas do app. */
enum class Screen { TUNER, METRONOME }

/**
 * A tela com a barra flutuante embaixo: Afinador e Metrônomo, como nos apps de verdade. Também cuida das
 * barras do sistema (Android 11+ desenha de ponta a ponta): o conteúdo fica abaixo da barra de status e a
 * barra flutuante, acima da de navegação.
 *
 * Trocar de tela: do afinador abre o metrônomo; do metrônomo, fecha e volta ao afinador. A pilha nunca cresce,
 * e o "voltar" do Android sai do app a partir do afinador.
 */
fun Activity.withBottomNav(content: View, current: Screen): View {
    val dp = { v: Int -> (v * resources.displayMetrics.density).toInt() }
    val root = FrameLayout(this)
    root.setBackgroundColor(Paleta.ground)
    // Espaço embaixo do conteúdo para a barra não cobrir nada.
    root.addView(content, FrameLayout.LayoutParams(-1, -1).apply { bottomMargin = dp(BAR_HEIGHT + BAR_GAP * 2) })

    val bar = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        background = GradientDrawable().apply { cornerRadius = dp(BAR_HEIGHT / 2).toFloat(); setColor(Paleta.soft) }
        setPadding(dp(6), dp(6), dp(6), dp(6))
        elevation = dp(6).toFloat()
    }
    for ((screen, label) in listOf(Screen.TUNER to R.string.tuner, Screen.METRONOME to R.string.metronome)) {
        val on = screen == current
        bar.addView(TextView(this).apply {
            text = getString(label)
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(if (on) Paleta.ground else Paleta.ink)
            if (on) background = GradientDrawable().apply { cornerRadius = dp(BAR_HEIGHT / 2).toFloat(); setColor(Paleta.ink) }
            isSelected = on
            contentDescription = getString(label)
            setOnClickListener { if (!on) go(screen) }
        }, LinearLayout.LayoutParams(0, -1, 1f))
    }
    // A conta opcional (o "G"): leva os favoritos para o site e o outro app. Se algo vier da nuvem, a tela recarrega.
    bar.addView(br.musica.marmota.common.ContaUi.botao(this) { recreate() }, LinearLayout.LayoutParams(dp(44), -1))
    val barParams = FrameLayout.LayoutParams(-1, dp(BAR_HEIGHT), Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
        setMargins(dp(24), 0, dp(24), dp(BAR_GAP))
    }
    root.addView(bar, barParams)
    fitInsideSystemBars(root)
    return root
}

private fun Activity.go(screen: Screen) {
    when (screen) {
        Screen.METRONOME -> startActivity(android.content.Intent(this, MetronomeActivity::class.java))
        Screen.TUNER -> finish()
    }
    // Troca de aba, não de página: sem animação de transição.
    @Suppress("DEPRECATION")
    overridePendingTransition(0, 0)
}

/**
 * Android 15+ always draws apps edge to edge; 11–14 are switched to match so the layout is the same.
 * Older versions keep the theme's dark system bars and need no padding.
 */
@Suppress("DEPRECATION") // setDecorFitsSystemWindows is a no-op on 15+, still needed on 11–14
private fun Activity.fitInsideSystemBars(view: View) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
    window.setDecorFitsSystemWindows(false)
    view.setOnApplyWindowInsetsListener { v, insets ->
        val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
        v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
        WindowInsets.CONSUMED
    }
}

private const val BAR_HEIGHT = 56
private const val BAR_GAP = 16
