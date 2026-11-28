import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BEATS } from "@/core/rhythm";
import { MAX_TIMER, NONE, addFavorite, clock, favoriteOf, moveFavorite, removeFavorite, savedFrom, timerFrom, updateFavorite, type Favorites } from "./store";

const accents = Array.from({ length: MAX_BEATS }, (_, i) => (i === 0 ? ACCENT : BEAT));
const at = (bpm: number) => ({ bpm, beatsPerBar: 4, subdivision: 1, accents: [...accents] });
const empty: Favorites = { version: 1, items: [], active: NONE };
const add = (f: Favorites, bpm: number, name: string) => addFavorite(f, favoriteOf(at(bpm), name));
const names = (f: Favorites) => f.items.map((x) => x.name);

describe("favoritos", () => {
  it("salvar cria um novo, no topo; nome e padrão podem repetir; nunca fica ativo", () => {
    const f = add(add(add(empty, 80, "A"), 90, "B"), 80, "A");
    expect(f.items.map((x) => [x.name, x.bpm])).toEqual([["A", 80], ["B", 90], ["A", 80]]);
    expect(f.active).toBe(NONE);
  });

  it("o nome é aparado e vai até 40 letras; o andamento fora da faixa é ajustado", () => {
    expect(favoriteOf(at(80), "  Estudo  ").name).toBe("Estudo");
    expect(favoriteOf(at(80), "x".repeat(50)).name).toHaveLength(40);
    expect(favoriteOf(at(9999), "").bpm).toBeLessThan(9999);
  });

  it("editar troca só aquele favorito", () => {
    const f = add(add(empty, 80, "A"), 90, "B"); // B, A
    const g = updateFavorite(f, 1, favoriteOf({ ...at(120), beatsPerBar: 3, subdivision: 2 }, "Valsa"));
    expect(g.items.map((x) => [x.name, x.bpm, x.beatsPerBar, x.subdivision])).toEqual([["B", 90, 4, 1], ["Valsa", 120, 3, 2]]);
  });

  it("excluir tira só aquele", () => {
    const f = add(add(add(empty, 80, "A"), 90, "B"), 100, "C"); // C, B, A
    expect(names(removeFavorite(f, 1))).toEqual(["C", "A"]);
  });

  it("reordenar leva um favorito para outra posição; fora da lista não muda nada", () => {
    const f = add(add(add(empty, 80, "A"), 90, "B"), 100, "C"); // C, B, A
    expect(names(moveFavorite(f, 0, 2))).toEqual(["B", "A", "C"]);
    expect(names(moveFavorite(f, 2, 0))).toEqual(["A", "C", "B"]);
    expect(moveFavorite(f, 0, 3)).toBe(f);
    expect(moveFavorite(f, 1, 1)).toBe(f);
  });
});

describe("timer", () => {
  it("minutos e segundos digitados: segundos até 59, minutos até 99, vazio conta 0", () => {
    expect(timerFrom("1", "30")).toBe(90);
    expect(timerFrom("99", "99")).toBe(MAX_TIMER);
    expect(timerFrom("", "45")).toBe(45);
    expect(timerFrom("7", "")).toBe(420);
    expect(timerFrom("", "")).toBe(0);
  });

  it("o relógio mostra m:ss até 99:59", () => {
    expect(clock(MAX_TIMER * 1000)).toBe("99:59");
    expect(clock(1)).toBe("0:01");
  });

  it("o timer antigo, em minutos, vira segundos; fora da lista ou do limite, sem timer", () => {
    const load = (v: object) => savedFrom(v)!;
    expect(load({ version: 2, minutes: 5 }).seconds).toBe(300);
    expect(load({ version: 2, minutes: 7 }).seconds).toBe(0);
    expect(load({ version: 2, seconds: 95 }).seconds).toBe(95);
    expect(load({ version: 2, seconds: MAX_TIMER + 1 }).seconds).toBe(0);
  });
});
