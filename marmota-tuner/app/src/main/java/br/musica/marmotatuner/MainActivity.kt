package br.musica.marmotatuner

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Wires mic → pitch pipeline (audio thread) → smoother → [TunerView] (main thread).
 * Plain Activity on purpose: no AndroidX, so the APK stays tiny.
 */
class MainActivity : Activity() {
    private lateinit var tunerView: TunerView
    private val mainHandler = Handler(Looper.getMainLooper())
    private val pipeline = PitchPipeline(AudioCapture.SAMPLE_RATE)
    private val smoother = PitchSmoother()
    private val capture = AudioCapture(onChunk = ::analyzeOnAudioThread, onFailure = ::reportMicFailure)
    private var micBlockedForGood = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        tunerView = TunerView(this)
        tunerView.setOnClickListener { onTunerTapped() }
        // O metrônomo é a outra tela do app: um botão discreto no canto do afinador.
        val toMetronome = TextView(this).apply {
            text = getString(R.string.metronome)
            setTextColor(getColor(R.color.tuner_muted))
            textSize = 15f
            val pad = (12 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
            setOnClickListener { startActivity(Intent(this@MainActivity, MetronomeActivity::class.java)) }
        }
        val root = FrameLayout(this)
        root.addView(tunerView)
        root.addView(toMetronome, FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.END))
        setContentView(root)
        fitInsideSystemBars(root)
        if (!hasMicPermission()) requestMicPermission()
    }

    override fun onResume() {
        super.onResume()
        if (hasMicPermission()) startListening()
    }

    override fun onPause() {
        capture.stop()
        smoother.reset()
        tunerView.show(null, 0f)
        super.onPause()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != MIC_REQUEST) return
        // Granted: onResume runs right after this callback and starts listening.
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) return
        // After a second "deny", Android stops showing the dialog: only Settings can grant it.
        micBlockedForGood = !shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)
        tunerView.showMessage(getString(if (micBlockedForGood) R.string.mic_in_settings else R.string.mic_needed))
    }

    private fun startListening() {
        pipeline.reset()
        tunerView.showMessage(getString(R.string.play_a_string))
        capture.start()
    }

    private fun analyzeOnAudioThread(chunk: FloatArray, count: Int) {
        val sample = pipeline.process(chunk, count)
        mainHandler.post { showSample(sample) }
    }

    private fun showSample(sample: PitchSample) {
        val midi = smoother.push(sample.midi)
        tunerView.show(midi?.let(NoteMapper::readingFromMidi), sample.level)
    }

    private fun reportMicFailure() {
        mainHandler.post { tunerView.showMessage(getString(R.string.mic_failed)) }
    }

    private fun onTunerTapped() {
        if (hasMicPermission()) return
        if (micBlockedForGood) openAppSettings() else requestMicPermission()
    }

    private fun hasMicPermission(): Boolean =
        checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun requestMicPermission() = requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), MIC_REQUEST)

    private fun openAppSettings() {
        startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
    }

    /**
     * Android 15+ always draws apps edge to edge; 11–14 are switched to match so the layout is the same.
     * Older versions keep the theme's dark system bars and need no padding.
     */
    @Suppress("DEPRECATION") // setDecorFitsSystemWindows is a no-op on 15+, still needed on 11–14
    private fun fitInsideSystemBars(view: View) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
        window.setDecorFitsSystemWindows(false)
        view.setOnApplyWindowInsetsListener { v, insets ->
            val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsets.CONSUMED
        }
    }

    private companion object {
        const val MIC_REQUEST = 1
    }
}
