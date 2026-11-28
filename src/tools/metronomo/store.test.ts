import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BEATS } from "@/core/rhythm";
import { MAX_TIMER, NONE, addFavorite, clock, followActive, inFavorite, removeFavorite, renameFavorite, savedFrom, timerFrom, type Favorites } from "./store";

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

  it("mexer no metrônomo dentro de um favorito grava nele e a estrela continua acesa", () => {
    const f = addFavorite(addFavorite(empty, at(80), "A"), at(100), "B"); // B, A
    const g = followActive({ ...f, active: 1 }, at(80), at(84));
    expect(g.items.map((x) => [x.name, x.bpm])).toEqual([["B", 100], ["A", 84]]);
    expect(inFavorite(g, at(84))).toBe(1);
  });

  it("fora de um favorito (sem ativo, ou já diferente dele), ou sem mudança, nada é gravado", () => {
    const f = addFavorite(empty, at(80), "A");
    const out = { ...f, active: NONE };
    expect(followActive(out, at(80), at(84))).toBe(out);
    expect(followActive(f, at(90), at(84))).toBe(f);
    expect(followActive(f, at(80), at(80))).toBe(f);
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
