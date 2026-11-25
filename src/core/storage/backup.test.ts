import { describe, expect, it } from "vitest";
import { exportar, restaurar } from "./backup";

function memoria(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    m,
  };
}

describe("backup", () => {
  it("exporta só as chaves do site, sem os carimbos internos", () => {
    const s = memoria({ "musica:metronomo": '{"version":1,"bpm":90}', "musica:_stamps": "{}", "outro:x": "1", "musica:diario": '{"dias":[]}' });
    const b = exportar(s, new Date("2026-11-25T12:00:00Z"));
    expect(b).toEqual({ app: "musica", version: 1, exportedAt: "2026-11-25T12:00:00.000Z", metronomo: { version: 1, bpm: 90 }, diario: { dias: [] } });
  });

  it("restaura o que exportou, e aceita o backup antigo do Laboratório", () => {
    const origem = memoria({ "musica:metronomo": '{"version":1,"bpm":120}' });
    const destino = memoria();
    expect(restaurar(exportar(origem), destino)).toBe(1);
    expect(destino.getItem("musica:metronomo")).toBe('{"version":1,"bpm":120}');

    const antigo = { app: "musica", version: 1, exportedAt: "2025-01-01T00:00:00.000Z", base: { tom: "A" }, piano: {} };
    expect(restaurar(antigo, destino)).toBe(2);
    expect(destino.getItem("musica:base")).toBe('{"tom":"A"}');
  });

  it("recusa arquivo que não é backup deste site", () => {
    expect(() => restaurar({ foo: 1 }, memoria())).toThrow();
    expect(() => restaurar(null, memoria())).toThrow();
  });
});
