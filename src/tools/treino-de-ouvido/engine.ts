// Treino de ouvido: o sorteio das perguntas e a correção. Puro (sem áudio nem tela); as notas saem como
// `PianoNote` (MIDI, início e duração em segundos) para o piano tocar. As tabelas vêm de `dados.json`, o mesmo
// arquivo que o app Android usa.
import type { PianoNote } from "@/core/audio";
import dados from "./dados.json";

export type Rng = () => number;
/** Gerador com semente (para testes). */
export const mulberry32 = (seed: number): Rng => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export type Exercicio = "intervalos" | "acordes";
export type Direcao = "asc" | "desc" | "harm" | "misto";
export const EXERCICIOS: readonly Exercicio[] = ["intervalos", "acordes"];
export const DIRECOES: readonly Direcao[] = ["asc", "desc", "harm", "misto"];

export const INTERVALOS = dados.intervalos;
export const ACORDES = dados.acordes;
export const GRAUS = dados.graus;
export const IDS: Record<Exercicio | "graus", readonly string[]> = {
  intervalos: INTERVALOS.map((i) => i.id),
  acordes: ACORDES.map((a) => a.id),
  graus: GRAUS.map((g) => g.id),
};

export type ConfigClassica = { exercicio: Exercicio; itens: Record<Exercicio, string[]>; direcao: Direcao };
export type ConfigFuncional = { tonica: "do" | "sorteada"; graus: string[] };

export const CLASSICA_INICIAL: ConfigClassica = {
  exercicio: "intervalos",
  itens: { intervalos: ["3m", "3M", "4J", "5J", "8J"], acordes: ["maior", "menor"] },
  direcao: "asc",
};
export const FUNCIONAL_INICIAL: ConfigFuncional = { tonica: "do", graus: ["1", "3", "5"] };

/** A pergunta do modo clássico: o que tocar e o que é a resposta certa. */
export type PerguntaClassica = { chave: string; resposta: string; notas: PianoNote[] };
/** A pergunta do modo funcional: a cadência que fixa o tom e a nota, juntas ou cada uma por si. */
export type PerguntaFuncional = { chave: string; resposta: string; tonica: number; cadencia: PianoNote[]; nota: PianoNote[]; tudo: PianoNote[] };

const inteiro = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const sortear = <T>(lista: readonly T[], rng: Rng): T => lista[Math.floor(rng() * lista.length)]!;
/** Só os itens escolhidos que existem; se não sobrar nenhum, todos (a tela impede esvaziar, mas dado salvo pode estar velho). */
const piscina = <T extends { id: string }>(todos: readonly T[], escolhidos: readonly string[]): T[] => {
  const ok = todos.filter((t) => escolhidos.includes(t.id));
  return ok.length ? ok : [...todos];
};

export function perguntaClassica(cfg: ConfigClassica, rng: Rng = Math.random): PerguntaClassica {
  if (cfg.exercicio === "acordes") {
    const a = sortear(piscina(ACORDES, cfg.itens.acordes), rng);
    const raiz = inteiro(rng, 48, 64);
    return { chave: `acordes:${a.id}`, resposta: a.id, notas: a.semitons.map((s) => ({ midi: raiz + s, at: 0, dur: 2.2 })) };
  }
  const i = sortear(piscina(INTERVALOS, cfg.itens.intervalos), rng);
  const direcao = cfg.direcao === "misto" ? sortear(["asc", "desc", "harm"] as const, rng) : cfg.direcao;
  const base = inteiro(rng, 48, 64);
  const [a, b] = direcao === "desc" ? [base + i.semitons, base] : [base, base + i.semitons];
  const notas: PianoNote[] = direcao === "harm"
    ? [{ midi: a, at: 0, dur: 2.2 }, { midi: b, at: 0, dur: 2.2 }]
    : [{ midi: a, at: 0, dur: 1.0 }, { midi: b, at: 1.1, dur: 1.4 }];
  return { chave: `intervalos:${i.id}`, resposta: i.id, notas };
}

/** Cadência I-IV-V-I com o baixo uma oitava abaixo da fundamental de cada acorde; 0,95 s por acorde. */
export function cadencia(tonica: number): PianoNote[] {
  return dados.cadencia.acordes.flatMap((c, k) => [
    { midi: tonica + c.grau - 12, at: k * 0.95, dur: 0.85 },
    ...c.semitons.map((s) => ({ midi: tonica + s, at: k * 0.95, dur: 0.85 })),
  ]);
}
const INICIO_DA_NOTA = 4.5;

export function perguntaFuncional(cfg: ConfigFuncional, rng: Rng = Math.random): PerguntaFuncional {
  const g = sortear(piscina(GRAUS, cfg.graus), rng);
  const tonica = cfg.tonica === "do" ? 60 : inteiro(rng, 55, 62);
  const midi = tonica + g.semitons + (rng() < 0.5 ? 12 : 0);
  const cad = cadencia(tonica);
  const nota = [{ midi, at: 0, dur: 1.8 }];
  return { chave: `graus:${g.id}`, resposta: g.id, tonica, cadencia: cad, nota, tudo: [...cad, { midi, at: INICIO_DA_NOTA, dur: 1.8 }] };
}

/** Placar da sessão. */
export type Placar = { acertos: number; total: number; sequencia: number; melhor: number };
export const PLACAR_ZERO: Placar = { acertos: 0, total: 0, sequencia: 0, melhor: 0 };
export function somar(p: Placar, certo: boolean): Placar {
  const sequencia = certo ? p.sequencia + 1 : 0;
  return { acertos: p.acertos + (certo ? 1 : 0), total: p.total + 1, sequencia, melhor: Math.max(p.melhor, sequencia) };
}

/** Histórico por item (guardado no navegador): quantas vezes acertou de quantas. */
export type Historico = Record<string, { certo: number; total: number }>;
export function registrar(h: Historico, chave: string, certo: boolean): Historico {
  const antes = h[chave] ?? { certo: 0, total: 0 };
  return { ...h, [chave]: { certo: antes.certo + (certo ? 1 : 0), total: antes.total + 1 } };
}

/** Nome da nota em letra e oitava, como no resto do site: 60 = C4 (Dó central), 61 = C#4. */
const NOMES_NOTA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const nomeNota = (midi: number): string => `${NOMES_NOTA[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
