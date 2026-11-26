import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BEATS } from "@/core/rhythm";
import { NONE, addFavorite, removeFavorite, renameFavorite, syncActive, type Favorites } from "./store";

const accents = Array.from({ length: MAX_BEATS }, (_, i) => (i === 0 ? ACCENT : BEAT));
const at = (bpm: number) => ({ bpm, beatsPerBar: 4, subdivision: 1, accents: [...accents] });
const empty: Favorites = { version: 1, items: [], active: NONE };

describe("favorito ativo", () => {
  it("salvar o atual entra no favorito novo, no topo", () => {
    const f = addFavorite(addFavorite(empty, at(80), "A"), at(100), "B");
    expect(f.items.map((x) => x.name)).toEqual(["B", "A"]);
    expect(f.active).toBe(0);
  });

  it("dentro de um favorito, mudar o metrônomo muda ele e mantém o nome", () => {
    const f = { ...addFavorite(addFavorite(empty, at(80), "A"), at(100), "B"), active: 1 };
    const g = syncActive(f, at(84));
    expect(g.items[1]).toMatchObject({ name: "A", bpm: 84 });
    expect(g.items[0]!.bpm).toBe(100);
  });

  it("fora de um favorito, ou sem mudança, nada muda (mesmo objeto)", () => {
    const f = addFavorite(empty, at(80), "A");
    expect(syncActive({ ...f, active: NONE }, at(90)).items[0]!.bpm).toBe(80);
    expect(syncActive(f, at(80))).toBe(f);
  });

  it("apagar o ativo sai para nenhum; apagar um de cima acompanha o índice", () => {
    const f = addFavorite(addFavorite(addFavorite(empty, at(80), "A"), at(90), "B"), at(100), "C"); // C, B, A
    expect(removeFavorite({ ...f, active: 1 }, 1).active).toBe(NONE);
    const g = removeFavorite({ ...f, active: 2 }, 0);
    expect(g.active).toBe(1);
    expect(g.items[g.active]!.name).toBe("A");
    expect(removeFavorite({ ...f, active: 0 }, 2).active).toBe(0);
  });

  it("renomear troca só o nome", () => {
    const f = renameFavorite(addFavorite(empty, at(80), "A"), 0, "  Estudo  ");
    expect(f.items[0]).toMatchObject({ name: "Estudo", bpm: 80 });
  });
});
