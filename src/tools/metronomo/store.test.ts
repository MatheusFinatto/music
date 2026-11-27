import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BEATS } from "@/core/rhythm";
import { NONE, addFavorite, inFavorite, removeFavorite, renameFavorite, type Favorites } from "./store";

const accents = Array.from({ length: MAX_BEATS }, (_, i) => (i === 0 ? ACCENT : BEAT));
const at = (bpm: number) => ({ bpm, beatsPerBar: 4, subdivision: 1, accents: [...accents] });
const empty: Favorites = { version: 1, items: [], active: NONE };

describe("favoritos", () => {
  it("salvar com nome novo cria outro, no topo, e ele vira o ativo", () => {
    const f = addFavorite(addFavorite(empty, at(80), "A"), at(100), "B");
    expect(f.items.map((x) => x.name)).toEqual(["B", "A"]);
    expect(f.active).toBe(0);
  });

  it("o mesmo padrão com nomes diferentes fica em favoritos diferentes", () => {
    let f = empty;
    for (let i = 1; i <= 15; i++) f = addFavorite(f, at(90), `Treino ${i}`);
    expect(f.items).toHaveLength(15);
    expect(f.items.every((x) => x.bpm === 90)).toBe(true);
  });

  it("nome repetido também cria um novo, sem mexer no que já existe", () => {
    const f = addFavorite(addFavorite(addFavorite(empty, at(80), "A"), at(90), "B"), at(120), "A");
    expect(f.items.map((x) => [x.name, x.bpm])).toEqual([["A", 120], ["B", 90], ["A", 80]]);
    expect(f.active).toBe(0);
  });

  it("mexer no metrônomo não muda o favorito: a estrela só acende enquanto está igual ao ativo", () => {
    const f = addFavorite(empty, at(80), "A");
    expect(inFavorite(f, at(80))).toBe(0);
    expect(inFavorite(f, at(84))).toBe(NONE);
    expect(f.items[0]!.bpm).toBe(80);
  });

  it("apagar o ativo deixa sem ativo; apagar um de cima acompanha o índice", () => {
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
