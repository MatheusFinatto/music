import { describe, expect, it } from "vitest";
import type { Curriculum, Exercise, Lesson, Phrase } from "../curriculum/types";
import { skipLesson, EMPTY, addDays, cleanProgress, buildSession, daysThisWeek, learnLesson, rate, rateCold, toggleLesson, unitStatuses, nextLesson } from "./schedule";
import { curriculum as real } from "../curriculum/pt-BR";
import { chordsOf, degreeIn, minorPentatonic, mod12, pentatonicShape, pentatonicShapes } from "@/core/theory";
import { gestureOf } from "../engines/tech";

const ex = (id: string): Exercise => ({ id, kind: "take", title: id, goal: "", steps: [], check: "", bars: 4 });
const lesson = (id: string): Lesson => ({ id, title: id, intro: "", exercises: [ex(id + ".a"), ex(id + ".b")], key: id + ".a" });
const c: Curriculum = {
  units: [
    { id: "u0", title: "", skill: "", lessons: [lesson("l1"), lesson("l2")] },
    { id: "u1", title: "", skill: "", lessons: [lesson("l3")] },
  ],
  sections: [{ id: "s1", title: "", goal: "", units: ["u0", "u1"] }],
  chapters: [{ id: "c1", title: "", goal: "", sections: ["s1"] }],
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
  const box = new Set(pentatonicShape(0, 1).map((x) => `${x.string}-${x.fret}`));
  const inBox = (f: { string: number; fret: number }) => box.has(`${f.string}-${f.fret}`);
  const ofSection = (id: string) => real.phrases.filter((e) => e.section === id).flatMap((e) => e.phrases);
  const gestured = (p: Phrase) => p.notes.some((n) => n.from !== undefined || n.vibrato);

  it("são cerca de 40, todas com seção, na ordem das seções da trilha", () => {
    expect(real.phrases.length).toBeGreaterThanOrEqual(38);
    const order = real.sections.map((s) => s.id);
    const seq = real.phrases.map((e) => order.indexOf(e.section!));
    expect(seq).not.toContain(-1);
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
    // A seção de velocidade não tem frases de ouvido: frase rápida se aprende lenta e vendo, não de ouvido.
    for (const id of ["s1", "s2", "s3", "s4"]) expect(ofSection(id).length, id).toBeGreaterThanOrEqual(8);
  });
  it("nas seções 1 e 2, usam só notas do desenho 1, nas posições do desenho", () => {
    for (const p of [...ofSection("s1"), ...ofSection("s2")]) p.frets!.forEach((f) => expect(inBox(f), p.id).toBe(true));
  });
  it("na seção 1 não há bend, slide nem vibrato: os gestos chegam na seção 2", () => {
    for (const p of ofSection("s1")) expect(gestured(p), p.id).toBe(false);
    expect(ofSection("s2").some(gestured)).toBe(true);
  });
  it("na seção 3, toda frase sai do desenho 1", () => {
    for (const p of ofSection("s3")) expect(p.frets!.some((f) => !inBox(f)), p.id).toBe(true);
  });
  it("cada frase tem um nome só dela", () => {
    const names = all.map(({ p }) => p.name);
    expect(new Set(names).size).toBe(names.length);
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
    expect(buildSession(real, EMPTY, D1).lesson?.id).toBe("u0.l0");
    let p = EMPTY;
    for (const l of [...real.units[0]!.lessons, ...real.units[1]!.lessons]) p = toggleLesson(p, l.id, D1);
    expect(buildSession(real, p, D1).lesson?.id).toBe("u1.l3");
    expect(buildSession(real, p, D2).cold).toBeUndefined();
  });
  it("o mesmo vídeo abre e fecha o curso: na primeira lição e na última", () => {
    const main = real.chapters.flatMap((c) => c.sections);
    const lessons = main.map((id) => real.sections.find((s) => s.id === id)!).flatMap((sec) => sec.units).map((id) => real.units.find((u) => u.id === id)!).flatMap((u) => u.lessons);
    const [first, last] = [lessons[0]!, lessons.at(-1)!];
    expect(first.videos?.[0]?.youtube).toBeTruthy();
    expect(last.videos?.[0]?.youtube).toBe(first.videos![0]!.youtube);
    // Depois dele, na última lição, o próximo passo: a pentatônica que muda com o acorde.
    expect(last.videos!.at(-1)!.author).toBe("Paul Davids");
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
  // Solos tirados de vídeo valem como foram tocados: as regras de conteúdo são para o que o curso escreve.
  const exercises = real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)).filter((e) => !(e.kind === "echo" && e.transcribed));
  const echoes = [...exercises, ...real.phrases].flatMap((e) => (e.kind === "echo" ? [e] : []));
  // Frases do eco e solos de exemplo dos arcos seguem as mesmas regras.
  const examples = exercises.flatMap((e) => (e.kind === "take" ? (e.examples ?? []).map((p) => ({ e, p })) : []));
  const notes = [...echoes.flatMap((e) => e.phrases.filter((p) => p.frets).map((p) => ({ e, p }))), ...examples];
  const chordAt = (base: { prog: number[]; key: number }, beat: number) => chordsOf(base.prog, base.key)[Math.floor(beat / 4) % base.prog.length]!;

  it("todo exercício tem base", () => {
    for (const e of exercises) if (e.kind !== "watch") expect(e.base, e.id).toBeDefined();
  });
  it("no eco, a resposta cai sobre os mesmos acordes da chamada", () => {
    for (const e of echoes) for (const p of e.phrases) expect(p.bars % (p.base ?? e.base!).prog.length, `${e.id}/${p.id}`).toBe(0);
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
  it("todo arco tem dois exemplos diferentes, do tamanho da tomada, menos o de compor", () => {
    for (const u of real.units.filter((x) => x.arc))
      for (const e of u.lessons.flatMap((l) => l.exercises)) {
        if (e.kind !== "take" || !e.arc || e.id === "u10.l2.compose") continue;
        expect(e.examples, e.id).toHaveLength(2);
        for (const p of e.examples!) expect(p.bars, `${e.id}/${p.id}`).toBe(e.bars);
        const [a, b] = e.examples!.map((p) => p.notes.map((n) => `${n.beat}:${n.midi}`).join(" "));
        expect(a, e.id).not.toBe(b);
      }
  });
  // O nome de cada parte do arco tem que ser audível no exemplo: parte com nome e som iguais aos da vizinha não ensina.
  const take = (id: string) => exercises.flatMap((e) => (e.kind === "take" && e.id === id ? [e] : []))[0]!;
  const part = (p: Phrase, i: number, size = 8) => p.notes.filter((n) => n.beat >= i * size && n.beat < (i + 1) * size);
  it("as partes de um arco têm nomes diferentes", () => {
    for (const e of exercises) if (e.kind === "take" && e.arc) expect(new Set(e.arc.map((a) => a.name)).size, e.id).toBe(e.arc.length);
  });
  it("todo arco com exemplo explica cada parte, numa frase curta que continua na tela enquanto toca", () => {
    for (const e of exercises) {
      if (e.kind !== "take" || !e.arc || !e.examples) continue;
      for (const a of e.arc) {
        expect(a.how, `${e.id}: ${a.name}`).toBeTruthy();
        expect(a.how!.length, `${e.id}: ${a.name}`).toBeLessThanOrEqual(60);
      }
    }
  });
  it("no arco 1, cada parte do exemplo faz o que o nome diz", () => {
    for (const p of take("a1.take").examples!) {
      expect(part(p, 0).every((n) => n.beat + n.dur <= 4), `${p.id}: cala um compasso inteiro`).toBe(true);
      expect(new Set(part(p, 1).map((n) => n.midi)).size, `${p.id}: uma nota só`).toBe(1);
      expect(part(p, 1).length, `${p.id}: ritmo`).toBeGreaterThanOrEqual(5);
      expect(new Set(part(p, 2).map((n) => n.midi)).size, `${p.id}: três notas`).toBe(3);
      expect(p.notes.at(-1)!.dur, `${p.id}: nota longa no fim`).toBeGreaterThanOrEqual(3);
      expect(Math.max(...p.notes.slice(0, -1).map((n) => n.dur)), `${p.id}: só a última é longa`).toBeLessThan(3);
    }
  });
  it("no arco 2, cada parte do exemplo faz o que o nome diz", () => {
    const base = take("a2.take").base!;
    for (const p of take("a2.take").examples!) {
      // Uma nota por acorde: duas notas longas, cada uma entrando com o acorde.
      expect(part(p, 0).map((n) => n.beat), p.id).toEqual([0, 4]);
      // Chega pela vizinha: nota curta fora do tempo, e a nota do acorde em cima do tempo.
      const near = part(p, 1);
      expect(near.map((n) => n.dur >= 1.5), p.id).toEqual([false, true, false, true]);
      // Incomoda e resolve: no tempo 1, nota de fora do acorde por um tempo inteiro (dá para ouvir); depois, a do acorde.
      for (const bar of [16, 20]) {
        const [out, home] = p.notes.filter((n) => n.beat >= bar && n.beat < bar + 4);
        expect([out!.beat, out!.dur], p.id).toEqual([bar, 1]);
        expect(degreeIn(out!.midi, chordAt(base, bar)), `${p.id}@${bar}`).toBeNull();
        expect(home!.beat, p.id).toBe(bar + 1);
        expect(degreeIn(home!.midi, chordAt(base, bar)), `${p.id}@${bar}`).not.toBeNull();
      }
      // Chega com bend ou slide: só notas com gesto, um de cada tipo, e nenhum gesto antes desta parte.
      const kinds = part(p, 3).map((n) => gestureOf(n, p.frets![p.notes.indexOf(n)]!)?.kind);
      expect([...kinds].sort(), p.id).toEqual(["bend", "slide"]);
      expect(p.notes.filter((n) => n.beat < 24).some((n) => n.from !== undefined), p.id).toBe(false);
    }
  });
  it("no arco 3, cada parte do exemplo fica nas cordas que a explicação diz, e o pico tem a nota mais alta", () => {
    const strings = [[6, 5], [4, 3], [2, 1], [2, 1]];
    for (const p of take("a3.take").examples!) {
      strings.forEach((allowed, i) => {
        const used = part(p, i).map((n) => p.frets![p.notes.indexOf(n)]!.string + 1);
        for (const st of used) expect(allowed, `${p.id}, parte ${i + 1}: ${st}ª corda`).toContain(st);
      });
      const top = (ns: typeof p.notes) => Math.max(...ns.map((n) => n.midi));
      expect(top(part(p, 3)), p.id).toBeGreaterThan(top(p.notes.filter((n) => n.beat < 24)));
    }
  });
  it("no solo inteiro (desenho 1 e braço todo), o motivo do começo volta igual na última parte, e a nota mais alta fica no pico", () => {
    const shape = (ns: Phrase["notes"], from: number) => ns.map((n) => `${n.beat - from}:${n.dur}:${n.midi}`).join(" ");
    for (const p of [...take("a6.take").examples!, ...take("u10.l3.full").examples!]) {
      // O motivo é o que soa no primeiro compasso. Ele reaparece nota por nota, no mesmo ritmo, abrindo a parte "Fecha".
      const motif = p.notes.filter((n) => n.beat < 4);
      expect(motif.length, p.id).toBeGreaterThanOrEqual(3);
      expect(shape(p.notes.filter((n) => n.beat >= 48 && n.beat < 52), 48), p.id).toBe(shape(motif, 0));
      const top = (ns: Phrase["notes"]) => Math.max(...ns.map((n) => n.midi));
      expect(top(part(p, 2, 16)), p.id).toBeGreaterThan(top(p.notes.filter((n) => n.beat < 32 || n.beat >= 48)));
    }
  });
  it("no arco 4, o exemplo acelera: notas longas, quatro notas e uma longa, lick repetido, sequência com nota final", () => {
    for (const p of take("a4.take").examples!) {
      const fast = (i: number) => part(p, i).filter((n) => n.dur === 0.25);
      expect(part(p, 0).every((n) => n.dur >= 2), `${p.id}: devagar`).toBe(true);
      // Rajada e pouso: em cada compasso, quatro semicolcheias e uma nota longa.
      for (const bar of [8, 12]) {
        const ns = p.notes.filter((n) => n.beat >= bar && n.beat < bar + 4);
        expect(ns.map((n) => n.dur), `${p.id}@${bar}`).toEqual([0.25, 0.25, 0.25, 0.25, 2]);
      }
      // O lick que gira: muitas notas rápidas, poucas alturas, e o mesmo desenho se repetindo.
      expect(fast(2).length, `${p.id}: gira`).toBeGreaterThanOrEqual(16);
      const lick = new Set(fast(2).map((n) => n.midi)).size;
      expect(lick, `${p.id}: gira`).toBeLessThanOrEqual(3);
      // Corrida e fim: a parte com mais alturas diferentes, e a nota mais longa do solo no fim.
      expect(new Set(fast(3).map((n) => n.midi)).size, `${p.id}: corrida`).toBeGreaterThan(lick + 1);
      expect(p.notes.at(-1)!.dur, p.id).toBe(Math.max(...p.notes.map((n) => n.dur)));
    }
  });
  it("na Parte 1, a seção de vocabulário e o solo inteiro ficam nas posições do desenho 1", () => {
    const box = new Set(pentatonicShape(0, 1).map((x) => `${x.string}-${x.fret}`));
    const units = [...real.sections.find((s) => s.id === "s6")!.units, "a6"];
    const phrases = real.units
      .filter((u) => units.includes(u.id) && !u.optional) // as músicas opcionais seguem a gravação, não o desenho 1
      .flatMap((u) => u.lessons.flatMap((l) => l.exercises))
      .flatMap((e) => (e.kind === "echo" ? e.phrases : e.kind === "take" ? (e.examples ?? []) : []));
    expect(phrases.length).toBeGreaterThanOrEqual(12);
    for (const p of phrases) p.frets!.forEach((f, i) => expect(box.has(`${f.string}-${f.fret}`), `${p.id}, nota ${i + 1}`).toBe(true));
  });
  it("no arco 3, o exemplo abre com um lick da seção, pergunta no ar, responde igual e pousa, e fecha com bend", () => {
    const base = take("a5.take").base!;
    const licks = exercises
      .filter((e) => e.id.startsWith("u17."))
      .flatMap((e) => (e.kind === "echo" ? e.phrases.map((p) => p.notes.map((n) => n.midi).join(" ")) : []));
    for (const p of take("a5.take").examples!) {
      expect(licks, `${p.id}: um lick da seção`).toContain(part(p, 0).map((n) => n.midi).join(" "));
      const [ask, answer] = [part(p, 1), part(p, 2)];
      const askEnd = ask.at(-1)!;
      expect(degreeIn(askEnd.midi, chordAt(base, askEnd.beat)), `${p.id}: a pergunta fica no ar`).toBeNull();
      expect(answer.slice(0, 5).map((n) => n.midi), `${p.id}: a resposta começa igual`).toEqual(ask.slice(0, 5).map((n) => n.midi));
      const home = answer.at(-1)!;
      expect(degreeIn(home.midi, chordAt(base, home.beat)), `${p.id}: a resposta pousa`).not.toBeNull();
      expect(home.dur, `${p.id}: a resposta pousa`).toBeGreaterThanOrEqual(2);
      expect(part(p, 3).some((n) => n.from !== undefined && n.midi > n.from), `${p.id}: bend`).toBe(true);
      expect(p.notes.at(-1)!.dur, `${p.id}: nota longa no fim`).toBeGreaterThanOrEqual(3);
    }
  });
  // Parte 2: um desenho novo por seção; a junção acumula todos os anteriores (1+2, 1 a 3, 1 a 4, 1 a 5).
  const PARTE2 = [
    { shape: 2, vocab: "u21", join: "u22", arc: "a7.take" },
    { shape: 3, vocab: "u24", join: "u25", arc: "a8.take" },
    { shape: 4, vocab: "u27", join: "u28", arc: "a9.take" },
    { shape: 5, vocab: "u30", join: "u31", arc: "a10.take" },
  ];
  const boxOf = (shapes: number[]) => new Set(pentatonicShapes(0, shapes).map((x) => `${x.string}-${x.fret}`));
  const before = (n: number) => Array.from({ length: n - 1 }, (_, i) => i + 1);
  const placesOf = (p: Phrase) => p.frets!.map((f) => `${f.string}-${f.fret}`);
  const phrasesOf = (unit: string) =>
    real.units.find((u) => u.id === unit)!.lessons.flatMap((l) => l.exercises).flatMap((e) => (e.kind === "echo" ? e.phrases : []));
  it("no vocabulário de cada desenho novo, toda frase fica nele e usa notas que só ele tem", () => {
    for (const { shape, vocab } of PARTE2) {
      const [box, old] = [boxOf([shape]), boxOf(before(shape))];
      expect(phrasesOf(vocab).length, vocab).toBeGreaterThanOrEqual(4);
      for (const p of phrasesOf(vocab)) {
        for (const at of placesOf(p)) expect(box.has(at), `${p.id}: ${at}`).toBe(true);
        expect(placesOf(p).some((at) => !old.has(at)), p.id).toBe(true);
      }
    }
  });
  it("na junção, toda frase fica nos desenhos juntos e passa do desenho novo para um anterior", () => {
    for (const { shape, join } of PARTE2) {
      const all = boxOf([...before(shape), shape]);
      const [only, old] = [boxOf([shape]), boxOf(before(shape))];
      expect(phrasesOf(join).length, join).toBeGreaterThanOrEqual(3);
      for (const p of phrasesOf(join)) {
        for (const at of placesOf(p)) expect(all.has(at), `${p.id}: ${at}`).toBe(true);
        expect(placesOf(p).some((at) => only.has(at) && !old.has(at)), `${p.id}: toca o desenho ${shape}`).toBe(true);
        expect(placesOf(p).some((at) => old.has(at) && !only.has(at)), `${p.id}: toca um anterior`).toBe(true);
      }
    }
  });
  it("no arco de cada junção: começa nos desenhos de antes, vai ao novo, atravessa e pousa; mais desenhos, mais compassos", () => {
    for (const { shape, arc } of PARTE2) {
      const e = take(arc);
      expect(e.bars, arc).toBe(4 + 4 * shape);
      const all = boxOf([...before(shape), shape]);
      const [only, old] = [boxOf([shape]), boxOf(before(shape))];
      const size = (e.bars * 4) / e.arc!.length;
      for (const p of e.examples!) {
        const at = (ns: Phrase["notes"]) => ns.map((n) => `${p.frets![p.notes.indexOf(n)]!.string}-${p.frets![p.notes.indexOf(n)]!.fret}`);
        at(p.notes).forEach((x) => expect(all.has(x), `${p.id}: ${x}`).toBe(true));
        at(part(p, 0, size)).forEach((x) => expect(old.has(x), `${p.id}, começo: ${x}`).toBe(true));
        at(part(p, 1, size)).forEach((x) => expect(only.has(x), `${p.id}, desenho ${shape}: ${x}`).toBe(true));
        expect(at(part(p, 1, size)).some((x) => !old.has(x)), `${p.id}: o desenho novo soa`).toBe(true);
        const cross = at(part(p, 2, size));
        expect(cross.some((x) => only.has(x) && !old.has(x)) && cross.some((x) => old.has(x) && !only.has(x)), `${p.id}: atravessa`).toBe(true);
        at(part(p, 3, size)).forEach((x) => expect(old.has(x), `${p.id}, pouso: ${x}`).toBe(true));
        expect(p.notes.at(-1)!.dur, `${p.id}: nota longa no fim`).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it("o mesmo lick nos cinco desenhos: mesmas notas e mesmo ritmo, cada versão dentro do seu desenho", () => {
    const versions = phrasesOf("u37").filter((p) => /^m[1-5]$/.test(p.id));
    expect(versions.map((p) => p.id)).toEqual(["m1", "m2", "m3", "m4", "m5"]);
    const shapeOf = (p: Phrase) => p.notes.map((n) => `${n.beat}:${n.dur}:${mod12(n.midi)}`).join(" ");
    versions.forEach((p, i) => {
      expect(shapeOf(p), p.id).toBe(shapeOf(versions[0]!));
      for (const at of placesOf(p)) expect(boxOf([i + 1]).has(at), `${p.id}: ${at}`).toBe(true);
    });
  });
  it("na seção do mesmo lick, cada lick sai igual nos cinco shapes, cada versão dentro do seu shape", () => {
    const sig = (p: Phrase) => p.notes.map((n) => `${n.beat}:${n.dur}:${mod12(n.midi)}`).join(" ");
    for (const lick of ["z1s", "z2s", "z3s"]) {
      const versions = phrasesOf("u37").filter((p) => p.id.startsWith(lick));
      expect(versions.map((p) => p.id)).toEqual([1, 2, 3, 4, 5].map((n) => lick + n));
      versions.forEach((p, i) => {
        expect(sig(p), p.id).toBe(sig(versions[0]!));
        for (const at of placesOf(p)) expect(boxOf([i + 1]).has(at), `${p.id}: ${at}`).toBe(true);
      });
    }
  });
  it("cada desenho novo tem tônicas para achar e um exercício de voltar à tônica", () => {
    for (const unit of ["u20", "u23", "u26", "u29"]) {
      const ex = real.units.find((u) => u.id === unit)!.lessons[0]!.exercises;
      expect(ex.some((e) => e.kind === "find" && e.ask.length === 1 && e.ask[0] === "T"), unit).toBe(true);
      expect(ex.some((e) => e.kind === "play-rest" && e.id.endsWith(".home")), unit).toBe(true);
    }
  });
  it("as outras bases da tomada fecham o ciclo dentro dela, só com acordes que têm nota na pentatônica", () => {
    const takes = [...exercises, real.take].flatMap((e) => (e.kind === "take" && e.bases ? [e] : []));
    expect(takes.map((e) => e.id)).toContain(real.take.id);
    for (const e of takes)
      for (const b of e.bases!) {
        expect(e.bars % b.prog.length, `${e.id}: ${b.prog}`).toBe(0);
        if (e.arc) expect((e.bars / e.arc.length) % 1, e.id).toBe(0);
        expect(b.bpm, e.id).toBeGreaterThanOrEqual(60);
        expect(b.bpm, e.id).toBeLessThanOrEqual(110);
        const penta = new Set(minorPentatonic(b.key));
        // Sem nota do acorde na pentatônica, não haveria onde pousar: o curso é só de penta.
        for (const c of chordsOf(b.prog, b.key)) expect(c.tones.filter((t) => penta.has(t)).length, `${e.id}: ${c.name}`).toBeGreaterThanOrEqual(2);
        expect(b, e.id).not.toEqual(e.base);
      }
  });
  it("os desenhos 4 e 5 têm alvo na troca", () => {
    const shapes = new Set(exercises.flatMap((e) => (e.kind === "target" && !e.line ? [e.shape].flat() : [])));
    expect([...shapes].sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it("todo alvo na troca reveza pelo menos dois graus", () => {
    for (const e of exercises) if (e.kind === "target") expect(new Set(e.degrees).size, e.id).toBeGreaterThanOrEqual(2);
  });
});

describe("compasso com mais de um acorde", () => {
  const bases = [...real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)), ...real.phrases].flatMap((e) => (e.base ? [e.base, ...(e.kind === "take" ? e.bases ?? [] : [])] : []));
  it("divide em 2 ou 4 partes, começando pelo acorde de prog", () => {
    for (const b of bases)
      for (const [i, parts] of Object.entries(b.split ?? {})) {
        expect([2, 4], `${b.song}: compasso ${i}`).toContain(parts!.length);
        expect(parts![0], `${b.song}: compasso ${i}`).toBe(b.prog[Number(i)]);
      }
  });
});

describe("seções", () => {
  it("cobrem todas as unidades, uma vez, na ordem da trilha, e cada uma fecha com um arco", () => {
    expect(real.sections.flatMap((s) => s.units)).toEqual(real.units.map((u) => u.id));
    for (const s of real.sections) {
      // Seção que ainda não tem unidade só anuncia o que vem.
      if (s.units.length === 0) {
        expect(s.soon?.length, s.id).toBeGreaterThan(0);
        continue;
      }
      const last = real.units.find((u) => u.id === s.units.at(-1));
      expect(last?.arc, s.id).toBe(true);
      expect(s.units.slice(0, -1).every((id) => !real.units.find((u) => u.id === id)?.arc), s.id).toBe(true);
    }
  });
  it("os capítulos cobrem todas as seções, uma vez, na ordem, sem capítulo vazio", () => {
    expect(real.chapters.flatMap((c) => c.sections)).toEqual(real.sections.map((s) => s.id));
    for (const c of real.chapters) expect(c.sections.length, c.id).toBeGreaterThan(0);
  });
});

describe("progresso guardado", () => {
  it("o que estiver malformado é descartado, sem quebrar o resto", () => {
    expect(cleanProgress(null)).toBeNull();
    expect(cleanProgress({ version: 1 })).toEqual(EMPTY);
    const p = cleanProgress({
      version: 1,
      exercises: { a: { last: "ok", times: 1, interval: 1, due: "2026-11-19", day: "2026-11-18" }, b: "lixo", c: { last: "talvez" } },
      lessons: { "u0.l1": { learned: "2026-11-18", manual: true }, x: { learned: 3 } },
      days: ["2026-11-18", 5, "ontem"],
    })!;
    expect(Object.keys(p.exercises)).toEqual(["a"]);
    expect(p.lessons).toEqual({ "u0.l1": { learned: "2026-11-18", manual: true } });
    expect(p.days).toEqual(["2026-11-18"]);
  });
});

describe("pular lição", () => {
  it("conta como feita, sem teste a frio, e a próxima passa para a seguinte", () => {
    const c = real;
    const first = nextLesson(c, EMPTY)!;
    const p = skipLesson(EMPTY, first.id, D1);
    expect(p.lessons[first.id]).toEqual({ learned: D1, manual: true, skipped: true });
    expect(nextLesson(c, p)!.id).not.toBe(first.id);
    expect(buildSession(c, p, D2).cold).toBeUndefined();
    expect(cleanProgress(JSON.parse(JSON.stringify(p)))!.lessons[first.id]!.skipped).toBe(true);
  });
  it("pular uma lição já feita não muda nada", () => {
    const p = learnLesson(EMPTY, "x", D1);
    expect(skipLesson(p, "x", D2)).toBe(p);
  });
});
