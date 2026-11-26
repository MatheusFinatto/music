package br.musica.marmota.common

/**
 * The one palette of both apps: the website's (DESIGN.md, src/app/globals.css :root), taken from the marmot's pixel art.
 * Greenish graphite ground, the grays and taupe of the fur, ivory ink; and three colors that carry meaning everywhere in
 * Marmota: orange = target note, blue = sounding now, green = selected / in tune. Never as decoration.
 *
 * The website's test src/core/paleta.test.ts reads this file and fails if a value drifts from globals.css.
 * The window background (themes.xml) comes from res/values/paleta.xml, kept equal to [ground] by the same test.
 */
object Paleta {
    val ground = 0xFF111715.toInt() // --bg: the background of everything
    val surface = 0xFF1B2220.toInt() // --surface
    val soft = 0xFF252D2B.toInt() // --soft: the floating bar, sheets, tonal buttons, idle dots
    val line = 0xFF3A403D.toInt() // --line: outlines of pills and dots
    val ink = 0xFFDBDCD6.toInt() // --ink: text and the primary action
    val muted = 0xFF9C958E.toInt() // --muted: secondary text and icons
    val now = 0xFF8CC0EE.toInt() // --accent: sounding now
    val nowInk = 0xFF0B1520.toInt() // --accent-ink: text on blue
    val nowSoft = 0xFF1C2A37.toInt() // --accent-soft
    val target = 0xFFF0A634.toInt() // --target: target note
    val targetSoft = 0xFF3B2A0F.toInt() // --target-soft
    val selected = 0xFF7BD3A0.toInt() // --ok: selected, right, in tune
    val bad = 0xFFEF8F7C.toInt() // --bad: wrong, error

    // The guitar neck, and only the neck.
    val wood = 0xFF4A2C21.toInt() // --wood
    val fret = 0xFFE6E1D6.toInt() // --fret
    val steel = 0xFFDFE2E6.toInt() // --steel
    val bronze = 0xFFC9A66B.toInt() // --bronze
    val inlay = 0xFFEFE7D6.toInt() // --inlay
}
