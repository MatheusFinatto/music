// Shared with the website: compiled to JS (see core/build.gradle.kts) and exported to TypeScript.
@file:OptIn(kotlin.js.ExperimentalJsExport::class)
@file:kotlin.js.JsExport

package br.musica.marmotatuner

/** What the screen shows right now. Owned by the screen (TunerView on Android, the canvas on the site); mutated in place to avoid allocating per frame. */
class TunerScene {
    /** Last note heard. Kept (dimmed) after the string stops ringing. */
    var reading: NoteReading? = null
    var active: Boolean = false
    var level: Float = 0f
    var message: String? = null
    var needleCents: Float = 0f
}
