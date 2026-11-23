import { describe, expect, it } from "vitest";
import { ACORDES, cadencia, CAMPO, compararAfinacao, MARGENS, nomeAcorde, nomeNota, nomeTom, peso, CLASSICA_INICIAL, FUNCIONAL_INICIAL, GRAUS, INTERVALOS, mulberry32, perguntaClassica, perguntaFuncional, PLACAR_ZERO, registrar, somar, type ConfigClassica } from "./engine";

const itens = (p: Partial<ConfigClassica["itens"]>) => ({ ...CLASSICA_INICIAL.itens, ...p });
const MIN = 45, MAX = 86; // o piano tem amostras de 45 a 84; um pouco além só desloca a velocidade
const todos = (c: Partial<ConfigClassica>): ConfigClassica => ({ ...CLASSICA_INICIAL, ...c });

describe("modo clássico", () => {
  it("o mesmo sorteio com a mesma semente dá a mesma pergunta", () => {
    expect(perguntaClassica(CLASSICA_INICIAL, mulberry32(7))).toEqual(perguntaClassica(CLASSICA_INICIAL, mulberry32(7)));
  });
  it("o intervalo tocado tem os semitons da resposta, em qualquer direção, e cabe no piano", () => {
    const rng = mulberry32(1);
    for (const direcao of ["asc", "desc", "harm", "misto"] as const)
      for (let k = 0; k < 200; k++) {
        const q = perguntaClassica(todos({ direcao, itens: itens({ intervalos: INTERVALOS.map((i) => i.id), acordes: [] }) }), rng);
        const semitons = INTERVALOS.find((i) => i.id === q.resposta)!.semitons;
        const [a, b] = q.notas;
        expect(Math.abs(a!.midi - b!.midi)).toBe(semitons);
        for (const n of q.notas) { expect(n.midi).toBeGreaterThanOrEqual(MIN); expect(n.midi).toBeLessThanOrEqual(MAX); }
        if (direcao === "asc") expect(b!.midi).toBeGreaterThan(a!.midi);
        if (direcao === "desc") expect(b!.midi).toBeLessThan(a!.midi);
        if (direcao === "harm") expect(b!.at).toBe(a!.at);
      }
  });
  it("o acorde tocado tem os semitons do tipo da resposta, todos juntos", () => {
    const rng = mulberry32(2);
    for (let k = 0; k < 200; k++) {
      const q = perguntaClassica(todos({ exercicio: "acordes", itens: itens({ intervalos: [], acordes: ACORDES.map((a) => a.id) }) }), rng);
      const tipo = ACORDES.find((a) => a.id === q.resposta)!;
      const raiz = Math.min(...q.notas.map((n) => n.midi));
      expect(q.notas.map((n) => n.midi - raiz).sort((x, y) => x - y)).toEqual(tipo.semitons);
      expect(new Set(q.notas.map((n) => n.at)).size).toBe(1);
      expect(Math.max(...q.notas.map((n) => n.midi))).toBeLessThanOrEqual(MAX);
    }
  });
  it("só sorteia os itens escolhidos; sem nenhum, usa todos", () => {
    const rng = mulberry32(3);
    const vistos = new Set(Array.from({ length: 100 }, () => perguntaClassica(todos({ itens: itens({ intervalos: ["2m", "5J"], acordes: [] }) }), rng).resposta));
    expect([...vistos].sort()).toEqual(["2m", "5J"]);
    const vazios = new Set(Array.from({ length: 300 }, () => perguntaClassica(todos({ itens: itens({ intervalos: [], acordes: [] }) }), rng).resposta));
    expect(vazios.size).toBe(INTERVALOS.length);
  });
});

describe("modo funcional", () => {
  it("a cadência são quatro acordes (I IV V I), cada um com baixo e tríade, e a nota vem depois", () => {
    const c = cadencia(60);
    expect(c).toHaveLength(16);
    expect(c.filter((n) => n.at === 0).map((n) => n.midi).sort((a, b) => a - b)).toEqual([48, 60, 64, 67]);
    const q = perguntaFuncional(FUNCIONAL_INICIAL, mulberry32(4));
    expect(q.tudo).toHaveLength(17);
    expect(q.tudo.at(-1)!.at).toBeGreaterThan(Math.max(...q.cadencia.map((n) => n.at + n.dur)));
  });
  it("a nota tem o grau da resposta em relação à tônica, em qualquer oitava", () => {
    const rng = mulberry32(5);
    for (let k = 0; k < 300; k++) {
      const q = perguntaFuncional({ tonica: "sorteada", graus: GRAUS.map((g) => g.id) }, rng);
      const grau = GRAUS.find((g) => g.id === q.resposta)!;
      expect((((q.nota[0]!.midi - q.tonica) % 12) + 12) % 12).toBe(grau.semitons);
      expect(q.tonica).toBeGreaterThanOrEqual(55);
      expect(q.tonica).toBeLessThanOrEqual(62);
      expect(q.nota[0]!.midi).toBeLessThanOrEqual(MAX);
    }
  });
  it("tônica fixa em Dó é o Dó central; só sorteia os graus escolhidos", () => {
    const rng = mulberry32(6);
    const qs = Array.from({ length: 100 }, () => perguntaFuncional({ tonica: "do", graus: ["1", "5"] }, rng));
    expect(new Set(qs.map((q) => q.tonica))).toEqual(new Set([60]));
    expect(new Set(qs.map((q) => q.resposta))).toEqual(new Set(["1", "5"]));
  });
});

describe("placar e histórico", () => {
  it("acertar soma na sequência, errar zera e a melhor sequência fica", () => {
    let p = PLACAR_ZERO;
    for (const c of [true, true, true, false, true]) p = somar(p, c);
    expect(p).toEqual({ acertos: 4, total: 5, sequencia: 1, melhor: 3 });
  });
  it("o histórico soma por item sem mexer no anterior", () => {
    const a = registrar({}, "intervalos:3m", true);
    const b = registrar(a, "intervalos:3m", false);
    expect(a["intervalos:3m"]).toEqual({ certo: 1, total: 1 });
    expect(b["intervalos:3m"]).toEqual({ certo: 1, total: 2 });
  });
});

describe("nome da nota", () => {
  it("60 é C4 (Dó central), 61 é C#4, 69 é A4", () => {
    expect(nomeNota(60)).toBe("C4");
    expect(nomeNota(61)).toBe("C#4");
    expect(nomeNota(69)).toBe("A4");
    expect(nomeNota(47)).toBe("B2");
  });
});

describe("afinação", () => {
  const cfg = (margem: number, direcao: ConfigClassica["direcao"] = "asc"): ConfigClassica => ({ ...CLASSICA_INICIAL, exercicio: "afinacao", direcao, margem });
  it("a segunda nota sai baixa, afinada ou alta pela margem, e a resposta acompanha o sinal", () => {
    const rng = mulberry32(8);
    for (const margem of MARGENS) {
      const vistos = new Set<string>();
      for (let k = 0; k < 300; k++) {
        const q = perguntaClassica(cfg(margem), rng);
        expect([-margem, 0, margem]).toContain(q.cents);
        expect(q.resposta).toBe(q.cents! < 0 ? "baixo" : q.cents! > 0 ? "alto" : "afinado");
        expect(q.chave).toBe(`afinacao:${margem}`);
        expect(q.notas[0]!.cents).toBeUndefined();
        expect(q.notas[1]!.cents).toBe(q.cents);
        vistos.add(q.resposta);
      }
      expect(vistos.size).toBe(3);
    }
  });
  it("o intervalo em semitons continua certo, em qualquer direção", () => {
    const rng = mulberry32(9);
    for (const direcao of ["asc", "desc", "harm", "misto"] as const)
      for (let k = 0; k < 100; k++) {
        const q = perguntaClassica(cfg(20, direcao), rng);
        const st = Math.abs(q.notas[0]!.midi - q.notas[1]!.midi);
        expect(INTERVALOS.some((i) => i.semitons === st && CLASSICA_INICIAL.itens.afinacao.includes(i.id))).toBe(true);
      }
  });
});

describe("reforço do que se erra", () => {
  it("peso: item novo pesa 2; acertar sempre pesa 1; errar sempre pesa 5", () => {
    expect(peso({}, "intervalos:3m")).toBe(2);
    expect(peso({ "intervalos:3m": { certo: 1, total: 1 } }, "intervalos:3m")).toBe(2);
    expect(peso({ "intervalos:3m": { certo: 10, total: 10 } }, "intervalos:3m")).toBe(1);
    expect(peso({ "intervalos:3m": { certo: 0, total: 10 } }, "intervalos:3m")).toBe(5);
    expect(peso({ "intervalos:3m": { certo: 5, total: 10 } }, "intervalos:3m")).toBe(3);
  });
  it("o item que mais erra sai bem mais; sem histórico, o sorteio é igual para todos", () => {
    const cfg = { ...CLASSICA_INICIAL, itens: { ...CLASSICA_INICIAL.itens, intervalos: ["2m", "3m", "3M", "4J", "5J"] } };
    const contar = (h?: Record<string, { certo: number; total: number }>) => {
      const rng = mulberry32(11), n: Record<string, number> = {};
      for (let k = 0; k < 4000; k++) { const r = perguntaClassica(cfg, rng, h).resposta; n[r] = (n[r] ?? 0) + 1; }
      return n;
    };
    const h = { "intervalos:3m": { certo: 0, total: 8 }, "intervalos:2m": { certo: 8, total: 8 }, "intervalos:3M": { certo: 8, total: 8 }, "intervalos:4J": { certo: 8, total: 8 }, "intervalos:5J": { certo: 8, total: 8 } };
    const com = contar(h), sem = contar();
    expect(com["3m"]! / 4000).toBeGreaterThan(0.45); // 5 de 9 de peso
    for (const id of ["2m", "3M", "4J", "5J"]) expect(com[id]!).toBeGreaterThan(300); // os outros não somem
    for (const id of ["2m", "3m", "3M", "4J", "5J"]) expect(Math.abs(sem[id]! / 4000 - 0.2)).toBeLessThan(0.03);
  });
});

describe("harmonia", () => {
  const cfg = (exercicio: ConfigClassica["exercicio"], tonica: ConfigClassica["tonica"] = "do"): ConfigClassica => ({ ...CLASSICA_INICIAL, exercicio, tonica });
  const grau = (id: string) => CAMPO.find((c) => c.id === id)!;
  it("graus do campo: depois da cadência vem o acorde do grau, com baixo e tríade, e a resposta é o grau", () => {
    const rng = mulberry32(21);
    for (let k = 0; k < 200; k++) {
      const q = perguntaClassica({ ...cfg("campo"), itens: itens({ campo: CAMPO.map((c) => c.id) }) }, rng);
      const g = grau(q.resposta);
      expect(q.tonica).toBe(60);
      const ultimo = q.notas.filter((n) => n.at === 4.5).map((n) => n.midi).sort((a, b) => a - b);
      expect(ultimo).toEqual([60 + g.raiz - 12, ...g.semitons.map((s) => 60 + s)].sort((a, b) => a - b));
      expect(q.reveal).toEqual(g.semitons.map((s) => 60 + s));
      expect(q.chave).toBe(`campo:${q.resposta}`);
    }
  });
  it("cadências: a tônica e dois acordes; a resposta é o tipo (autêntica V-I, plagal IV-I, de engano V-vi, meia termina no V)", () => {
    const rng = mulberry32(22);
    const vistos = new Set<string>();
    for (let k = 0; k < 300; k++) {
      const q = perguntaClassica(cfg("cadencias"), rng);
      const [b, c] = q.acordes!;
      expect(q.acordes).toHaveLength(2);
      const par = `${b}-${c}`;
      if (q.resposta === "autentica") expect(par).toBe("V-I");
      if (q.resposta === "plagal") expect(par).toBe("IV-I");
      if (q.resposta === "deceptiva") expect(par).toBe("V-vi");
      if (q.resposta === "meia") expect(c).toBe("V");
      vistos.add(q.resposta);
    }
    expect(vistos.size).toBe(4);
  });
  it("progressões: a tônica e quatro acordes na ordem do nome", () => {
    const rng = mulberry32(23);
    for (let k = 0; k < 100; k++) {
      const q = perguntaClassica({ ...cfg("progressoes"), itens: itens({ progressoes: ["I-V-vi-IV", "vi-IV-I-V"] }) }, rng);
      expect(["I-V-vi-IV", "vi-IV-I-V"]).toContain(q.resposta);
      expect(q.acordes).toEqual(q.resposta.split("-"));
      expect(Math.max(...q.notas.map((n) => n.midi))).toBeLessThanOrEqual(MAX);
    }
  });
  it("tonalidade sorteada fica entre G3 e D4; Dó é fixa em C4", () => {
    const rng = mulberry32(24);
    for (let k = 0; k < 100; k++) { const t = perguntaClassica(cfg("campo", "sorteada"), rng).tonica!; expect(t).toBeGreaterThanOrEqual(55); expect(t).toBeLessThanOrEqual(62); }
  });
  it("cifras: em Dó, I é C, ii é Dm, V é G, vi é Am e vii° é Bdim; em Réb usa bemóis", () => {
    expect(nomeTom(60)).toBe("C");
    expect(["I", "ii", "IV", "V", "vi", "viio"].map((g) => nomeAcorde(60, g))).toEqual(["C", "Dm", "F", "G", "Am", "Bdim"]);
    expect(nomeTom(61)).toBe("Db");
    expect(["I", "IV", "V"].map((g) => nomeAcorde(61, g))).toEqual(["Db", "Gb", "Ab"]);
  });
});

describe("comparar na afinação", () => {
  it("toca como estava e depois as mesmas notas afinadas, depois de uma pausa", () => {
    const notas = [{ midi: 60, at: 0, dur: 1 }, { midi: 67, at: 1.1, dur: 1.4, cents: -30 }];
    const r = compararAfinacao(notas);
    expect(r).toHaveLength(4);
    expect(r[1]!.cents).toBe(-30);
    expect(r[3]!.cents).toBe(0);
    expect(r[2]!.at).toBeGreaterThan(2.5);
  });
});
