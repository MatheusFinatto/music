---
version: 1
slug: "src-app-locale-page-tsx"
primary_target: "src/app/[locale]/page.tsx"
related_targets: ["src/app/globals.css","src/components/Header.tsx"]
---

# Hub (homepage) e casca do site

Scope: `src/app/[locale]/page.tsx`, the site shell (header, footer, tool head) and the shared tokens the tools read. Mode: Operate (entry panel). Audience: any musician, first the owner and friends, guitar in hand or at work with headphones. Job: pick a tool and enter in one click. Content: tools from `src/tools/registry.ts` with honest status. Rebranding of 2026-11-25: the pixel-art marmot (`arte-52x42.png`) is the brand; owner pinned pixel art in brand + details only (tool text stays smooth), ground taken from the marmot, the marmot animated playing an instrument with pixel notes, and "music must not disappear". The playing-marmot art is pending (owner generates in Gemini); until then the current bust stands in.

## Direction contract

THESIS: The marmot sits on a five-line staff that plays the opening of Beethoven's "Marmotte" (op. 52 no. 7, the song of a boy travelling with his marmot), in pixel notation; the live tools sit right under the staff. It refuses the centred title over a rounded-card grid.

OWN-WORLD: Ground #111715 (the marmot's green-black outline, darkened), surfaces #1b2220, rules #3a403d (line) and #252d2b (soft), ivory ink #dbdcd6, muted #9c958e, the marmot's taupe #6b625a and grey #51524c. Square corners; cards carry a 4px marmot-grey top rule that turns ivory on hover. Pixel art (marmot, notes, 16-grid tool icons) only at integer scales, pixelated. Silkscreen only for status badges; Inter for everything read. Primary action is an ivory square plate with dark text. Orange/blue/green keep their meaning. All motion steps, never eases.

STORY: The visitor sees the marmot sitting on a staff whose notes light up as if played, reads "Marmota Music", finds the tool under its note, opens it. No lead line, no card descriptions: icon and name are enough; any needed explanation lives behind an "i" (owner, 2026-11-25).

FIRST VIEWPORT: 56px header, marmot head and name left, tool links right, 2px rule. Stage: marmot at 6x bottom-left, title 64px beside it; the marmot sits on the top line of a five-line staff that runs across the whole column width, one live tool per column, with the tool cards in a grid right under it (the title sits beside the marmot). Cards: pixel icon, name, one line, ivory "Abrir" plate with stepped corners; no kicker (craft floor bans it). Planned tools after, as a quiet list. Phone: marmot, title, the staff with the pickup and first bar only, then cards stacked.

FORM: caderno pautado, my #1 grounded candidate, chosen by the owner as IMPECCABLE'S PICK; seed:56147e8c28eae52b. Signature interaction: the staff plays the melody in tempo (eighth = 0.22s), each note lighting blue (playing now) with a 4px hop on its beat. The marmot blinks and sniffs (nose, mouth corner and whiskers move together, stepped frames). Nothing flies out of the marmot (owner rejected it). Reduced motion: still.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
