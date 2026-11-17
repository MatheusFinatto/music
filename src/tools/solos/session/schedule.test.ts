import { describe, expect, it } from "vitest";
import type { Curriculum, Exercise, Lesson } from "../curriculum/types";
import { EMPTY, addDays, buildSession, daysThisWeek, learnLesson, rate, rateCold, toggleLesson, unitStatuses } from "./schedule";
import { curriculum as real } from "../curriculum/pt-BR";
import { chordsOf, degreeIn, minorPentatonic, mod12, pentatonicShape } from "@/core/theory";
import { gestureOf } from "../engines/tech";

const ex = (id: string): Exercise => ({ id, kind: "take", title: id, goal: "", steps: [], check: "", bars: 4 });
const lesson = (id: string): Lesson => ({ id, title: id, intro: "", exercises: [ex(id + ".a"), ex(id + ".b")], key: id + ".a" });
const c: Curriculum = {
  units: [
    { id: "u0", title: "", skill: "", lessons: [lesson("l1"), lesson("l2")] },
    { id: "u1", title: "", skill: "", lessons: [lesson("l3")] },
  ],
  sections: [{ id: "s1", title: "", goal: "", units: ["u0", "u1"] }],
  phrases: [{ ...ex("f1"), kind: "echo", phrases: [], reveal: "tab" } as Exercise as never],
  take: ex("take") as never,
};
const D1 = "2026-11-17", D2 = "2026-11-18";

describe("datas", () => {
  it("soma dias atravessando o mês", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("conta dias da semana começando na segunda", () => {
    const p = { ...EMPTY, days: ["2026-11-15", "2026-11-16", "2026-11-17"] }; // dom, seg, ter
    expect(daysThisWeek(p, "2026-11-17")).toBe(2);
  });
});

describe("agenda de revisão", () => {
  it("o intervalo cresce com 'consegui' e volta com 'ainda não'", () => {
    let p = rate(EMPTY, "x", "ok", D1);
    expect(p.exercises.x).toMatchObject({ interval: 1, due: D2 });
    p = rate(p, "x", "ok", D1);
    expect(p.exercises.x!.interval).toBe(1); // repetir no mesmo dia não empurra a revisão
    p = rate(p, "x", "ok", D2);
    expect(p.exercises.x!.interval).toBe(3);
    p = rate(p, "x", "quase", D2);
    expect(p.exercises.x!.interval).toBe(3);
    p = rate(p, "x", "nao", D2);
    expect(p.exercises.x!.interval).toBe(1);
  });
});

describe("sessão", () => {
  it("a primeira sessão traz a primeira lição e a primeira frase, sem teste a frio", () => {
    const s = buildSession(c, EMPTY, D1);
    expect(s.lesson?.id).toBe("l1");
    expect(s.phrase?.id).toBe("f1");
    expect(s.cold).toBeUndefined();
    expect(s.reviews).toEqual([]);
  });
  it("no dia seguinte começa pelo teste a frio da lição anterior", () => {
    const p = learnLesson(rate(EMPTY, "l1.a", "ok", D1), "l1", D1);
    expect(buildSession(c, p, D1).cold).toBeUndefined(); // no mesmo dia não é a frio
    const s = buildSession(c, p, D2);
    expect(s.cold?.id).toBe("l1");
    expect(s.lesson?.id).toBe("l2");
    expect(s.reviews.map((e) => e.id)).toEqual([]); // l1.a já é o teste a frio
  });
  it("nada é travado: a trilha só recomenda a próxima lição não feita", () => {
    let p = learnLesson(learnLesson(EMPTY, "l1", D1), "l2", D1);
    expect(unitStatuses(c, p)).toEqual(["feita", "atual"]);
    expect(buildSession(c, p, D2).lesson?.id).toBe("l3"); // sem esperar o teste a frio
    expect(buildSession(c, p, D2).cold?.id).toBe("l2"); // mas o teste a frio continua sendo proposto
    p = rateCold(p, c.units[0]!.lessons[1]!, "ok", D2);
    expect(p.lessons.l2!.cold).toBe(D2);
  });
  it("o teste a frio é o da lição feita mais recentemente, e não se repete no mesmo dia", () => {
    let p = learnLesson(EMPTY, "l3", D1); // feita fora de ordem, antes
    p = learnLesson(p, "l1", D2);
    const D3 = "2026-11-19";
    expect(buildSession(c, p, D3).cold?.id).toBe("l1");
    p = rateCold(p, c.units[0]!.lessons[0]!, "quase", D3);
    expect(buildSession(c, p, D3).cold?.id).toBe("l3"); // l1 já foi tentada hoje
  });
  it("a pessoa pode marcar e desmarcar uma lição por conta própria", () => {
    let p = toggleLesson(EMPTY, "l1", D1);
    expect(buildSession(c, p, D2).lesson?.id).toBe("l2");
    expect(buildSession(c, p, D2).cold).toBeUndefined(); // marcada à mão não vira teste a frio
    p = toggleLesson(p, "l3", D1);
    expect(unitStatuses(c, p)).toEqual(["atual", "feita"]);
    p = toggleLesson(p, "l1", D1);
    expect(buildSession(c, p, D2).lesson?.id).toBe("l1");
  });
  it("revisões vencidas vêm intercaladas, uma por lição", () => {
    let p = EMPTY;
    for (const id of ["l1.a", "l1.b", "l2.a", "l2.b"]) p = rate(p, id, "ok", D1);
    p = learnLesson(learnLesson(p, "l1", D1), "l2", D1);
    p = rateCold(p, c.units[0]!.lessons[1]!, "ok", D2);
    p = rateCold(p, c.units[0]!.lessons[0]!, "ok", D2);
    const s = buildSession(c, p, "2026-11-25");
    expect(s.reviews).toHaveLength(2);
    expect(new Set(s.reviews.map((e) => e.id.split(".")[0])).size).toBe(2);
  });
});

describe("frases de ouvido", () => {
  const all = real.phrases.flatMap((e) => (e.kind === "echo" ? e.phrases.map((p) => ({ p, base: e.base! })) : []));
  const chordAt = (base: { prog: number[]; key: number }, beat: number) => chordsOf(base.prog, base.key)[Math.floor(beat / 4) % base.prog.length]!;
  it("usam só notas do desenho 1, nas posições do desenho", () => {
    const box = new Set(pentatonicShape(0, 1).map((x) => `${x.string}-${x.fret}`));
    for (const { p } of all) p.frets!.forEach((f) => expect(box.has(`${f.string}-${f.fret}`), p.id).toBe(true));
  });
  it("toda nota longa (um tempo e meio ou mais) é nota do acorde que está soando", () => {
    for (const { p, base } of all) for (const n of p.notes) if (n.dur >= 1.5) expect(degreeIn(n.midi, chordAt(base, n.beat)), `${p.id}@${n.beat}`).not.toBeNull();
  });
  it("toda frase respira: pelo menos um tempo e meio de silêncio", () => {
    for (const { p } of all) expect(p.bars * 4 - p.notes.reduce((a, n) => a + n.dur, 0), p.id).toBeGreaterThanOrEqual(1.5);
  });
  it("as entradas variam: no máximo metade começa no tempo 1", () => {
    expect(all.filter(({ p }) => p.notes[0]!.beat === 0).length).toBeLessThanOrEqual(all.length / 2);
  });
  it("as notas finais alternam entre graus do acorde, sem um grau dominar", () => {
    const ends = all.map(({ p, base }) => { const n = p.notes.at(-1)!; return degreeIn(n.midi, chordAt(base, n.beat)); });
    expect(ends).not.toContain(null);
    for (const d of new Set(ends)) expect(ends.filter((x) => x === d).length / ends.length, String(d)).toBeLessThanOrEqual(0.6);
  });
});

describe("conteúdo real", () => {
  it("a trilha começa pelo mapa; quem já sabe marca como feito e a recomendação pula para Respirar", () => {
    expect(buildSession(real, EMPTY, D1).lesson?.id).toBe("u0.l1");
    let p = EMPTY;
    for (const l of real.units[0]!.lessons) p = toggleLesson(p, l.id, D1);
    expect(buildSession(real, p, D1).lesson?.id).toBe("u1.l1");
    expect(buildSession(real, p, D2).cold).toBeUndefined();
  });
  it("ids únicos e exercício-chave existente em toda lição", () => {
    const lessons = real.units.flatMap((u) => u.lessons);
    const ids = [...lessons.flatMap((l) => l.exercises.map((e) => e.id)), ...real.phrases.map((e) => e.id), real.take.id];
    expect(new Set(ids).size).toBe(ids.length);
    lessons.forEach((l) => expect(l.exercises.some((e) => e.id === l.key), l.id).toBe(true));
  });
  it("toda frase cabe nos compassos declarados e tem uma posição por nota", () => {
    const all = [...real.phrases, ...real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises))];
    for (const e of all) {
      if (e.kind !== "echo") continue;
      for (const ph of e.phrases) {
        ph.notes.forEach((n) => expect(n.beat + n.dur, ph.id).toBeLessThanOrEqual(ph.bars * 4));
        if (ph.frets) expect(ph.frets, ph.id).toHaveLength(ph.notes.length);
      }
    }
  });
});

describe("frases das unidades", () => {
  const exercises = real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises));
  const echoes = [...exercises, ...real.phrases].flatMap((e) => (e.kind === "echo" ? [e] : []));
  // Frases do eco e solos de exemplo dos arcos seguem as mesmas regras.
  const examples = exercises.flatMap((e) => (e.kind === "take" && e.example ? [{ e, p: e.example }] : []));
  const notes = [...echoes.flatMap((e) => e.phrases.filter((p) => p.frets).map((p) => ({ e, p }))), ...examples];
  const chordAt = (base: { prog: number[]; key: number }, beat: number) => chordsOf(base.prog, base.key)[Math.floor(beat / 4) % base.prog.length]!;

  it("todo exercício tem base", () => {
    for (const e of exercises) expect(e.base, e.id).toBeDefined();
  });
  it("no eco, a resposta cai sobre os mesmos acordes da chamada", () => {
    for (const e of echoes) for (const p of e.phrases) expect(p.bars % e.base!.prog.length, `${e.id}/${p.id}`).toBe(0);
  });
  it("o arco divide a tomada em partes inteiras", () => {
    for (const e of exercises) if (e.kind === "take" && e.arc) expect(e.bars % e.arc.length, e.id).toBe(0);
  });
  it("só notas da pentatônica do tom, inclusive a origem de bend, soltura e slide", () => {
    for (const { e, p } of notes) {
      const penta = new Set(minorPentatonic(e.base!.key));
      for (const n of p.notes) {
        expect(penta.has(mod12(n.midi)), `${p.id}@${n.beat}`).toBe(true);
        if (n.from !== undefined) expect(penta.has(mod12(n.from)), `${p.id}@${n.beat} (origem)`).toBe(true);
      }
    }
  });
  it("toda nota longa é nota do acorde que está soando", () => {
    for (const { e, p } of notes)
      for (const n of p.notes) if (n.dur >= 1.5) expect(degreeIn(n.midi, chordAt(e.base!, n.beat)), `${p.id}@${n.beat}`).not.toBeNull();
  });
  it("toda frase respira e cabe nos compassos", () => {
    for (const { p } of notes) {
      expect(p.bars * 4 - p.notes.reduce((a, n) => a + n.dur, 0), p.id).toBeGreaterThanOrEqual(1.5);
      p.notes.slice(1).forEach((n, i) => expect(n.beat, `${p.id}: notas sobrepostas`).toBeGreaterThanOrEqual(p.notes[i]!.beat + p.notes[i]!.dur));
    }
  });
  it("os bends da fase 2 aparecem nas frases de ouvido, mas não dominam", () => {
    const withTech = real.phrases.filter((e) => e.kind === "echo" && e.phrases.some((p) => p.notes.some((n) => n.from !== undefined || n.vibrato)));
    expect(withTech.length).toBeGreaterThan(0);
    expect(withTech.length).toBeLessThanOrEqual(real.phrases.length / 2);
  });
  it("todo gesto do conteúdo é um que a tablatura sabe desenhar", () => {
    for (const { p } of notes)
      p.notes.forEach((n, i) => {
        if (n.from === undefined) return;
        const g = gestureOf(n, p.frets![i]!);
        expect(g, `${p.id}@${n.beat}`).not.toBeNull();
        if (g?.kind === "slide") expect(g.fromFret, `${p.id}@${n.beat}: slide fora do braço`).toBeGreaterThanOrEqual(1);
        else expect([1, 2], `${p.id}@${n.beat}: bend de ${g?.amount} semitons`).toContain(g?.amount);
      });
  });
  it("todo arco tem exemplo do tamanho da tomada, menos o de compor", () => {
    for (const u of real.units.filter((x) => x.arc))
      for (const e of u.lessons.flatMap((l) => l.exercises)) {
        if (e.kind !== "take" || e.id === "u10.l2.compose") continue;
        expect(e.example, e.id).toBeDefined();
        expect(e.example!.bars, e.id).toBe(e.bars);
      }
  });
  it("todo alvo na troca reveza pelo menos dois graus", () => {
    for (const e of exercises) if (e.kind === "target") expect(new Set(e.degrees).size, e.id).toBeGreaterThanOrEqual(2);
  });
});

describe("seções", () => {
  it("cobrem todas as unidades, uma vez, na ordem da trilha, e cada uma fecha com um arco", () => {
    expect(real.sections.flatMap((s) => s.units)).toEqual(real.units.map((u) => u.id));
    for (const s of real.sections) {
      const last = real.units.find((u) => u.id === s.units.at(-1));
      expect(last?.arc, s.id).toBe(true);
      expect(s.units.slice(0, -1).every((id) => !real.units.find((u) => u.id === id)?.arc), s.id).toBe(true);
    }
  });
});
