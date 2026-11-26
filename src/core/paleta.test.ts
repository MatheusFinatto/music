// Uma paleta, duas plataformas: os apps Android (marmota-tuner/android-common/.../Paleta.kt e res/values/paleta.xml)
// usam as mesmas cores que o site (src/app/globals.css, :root). Mudou uma cor? Mude dos dois lados.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = process.cwd();
const ler = (p: string) => readFileSync(join(raiz, p), "utf8");
const COMUM = "marmota-tuner/android-common/src/main";

const css = ler("src/app/globals.css");
const rootCss = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
const token = (nome: string) => {
  const m = rootCss.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`--${nome} não está no :root do globals.css`);
  return m[1]!.toLowerCase();
};

const kt = ler(`${COMUM}/java/br/musica/marmota/common/Paleta.kt`);
const paleta = Object.fromEntries(
  [...kt.matchAll(/val (\w+) = 0xFF([0-9A-Fa-f]{6})\.toInt\(\)/g)].map((m) => [m[1]!, `#${m[2]!.toLowerCase()}`]),
);
const xml = Object.fromEntries(
  [...ler(`${COMUM}/res/values/paleta.xml`).matchAll(/<color name="(\w+)">#FF([0-9A-Fa-f]{6})<\/color>/g)].map((m) => [m[1]!, `#${m[2]!.toLowerCase()}`]),
);

// Nome em Paleta.kt → variável do globals.css.
const PARES: Record<string, string> = {
  ground: "bg", surface: "surface", soft: "soft", line: "line", ink: "ink", muted: "muted",
  now: "accent", nowInk: "accent-ink", nowSoft: "accent-soft", target: "target", targetSoft: "target-soft",
  selected: "ok", bad: "bad", wood: "wood", fret: "fret", steel: "steel", bronze: "bronze", inlay: "inlay",
};

describe("paleta dos apps = paleta do site", () => {
  it("Paleta.kt tem todas as cores, e só elas", () => {
    expect(Object.keys(paleta).sort()).toEqual(Object.keys(PARES).sort());
  });
  for (const [kotlin, cssNome] of Object.entries(PARES)) {
    it(`${kotlin} = --${cssNome}`, () => expect(paleta[kotlin]).toBe(token(cssNome)));
  }
  it("paleta.xml (temas) igual a Paleta.kt", () => {
    expect(xml.marmota_ground).toBe(paleta.ground);
    expect(xml.marmota_now).toBe(paleta.now);
  });
});
