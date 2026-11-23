// Programas por tempo: sequências prontas de exercícios para 5, 10, 15, 20 ou 30 minutos. Puro (sem tela).
// O tempo é aproximado: cada exercício tem uma duração típica por pergunta, que passa a ser a mediana do que a própria
// pessoa levou nas últimas respostas. O número de perguntas de cada bloco sai da fatia de tempo dividida por essa duração.
import type { Exercicio as ExOuvido } from "./engine";

export type Secao = "ouvido" | "voz";
export type ExVoz = "igualar" | "longa" | "sequencia" | "tonica" | "intervalo" | "alcance";
export type Ex = ExOuvido | ExVoz;
export const MINUTOS = [5, 10, 15, 20, 30] as const;
export type Minutos = (typeof MINUTOS)[number];
export const MINUTOS_PADRAO: Minutos = 10;

export type Bloco = { exercicio: Ex; segundos: number };
export type BlocoPlano = { exercicio: Ex; perguntas: number };

const b = (exercicio: Ex, segundos: number): Bloco => ({ exercicio, segundos });

/** Cada programa soma exatamente `minutos × 60` segundos. Os mais curtos pegam o básico; os longos acrescentam harmonia, achar a nota e o alcance. */
export const PROGRAMAS: Record<Secao, Record<Minutos, readonly Bloco[]>> = {
  ouvido: {
    5: [b("intervalos", 150), b("acordes", 150)],
    10: [b("intervalos", 150), b("acordes", 150), b("afinacao", 150), b("campo", 150)],
    15: [b("intervalos", 150), b("acordes", 150), b("afinacao", 150), b("campo", 150), b("cadencias", 150), b("achar", 150)],
    20: [b("intervalos", 200), b("acordes", 150), b("afinacao", 200), b("achar", 200), b("campo", 150), b("cadencias", 150), b("progressoes", 150)],
    30: [b("intervalos", 300), b("acordes", 200), b("afinacao", 250), b("achar", 300), b("campo", 250), b("cadencias", 250), b("progressoes", 250)],
  },
  voz: {
    5: [b("igualar", 150), b("sequencia", 150)],
    10: [b("igualar", 150), b("sequencia", 200), b("tonica", 250)],
    15: [b("igualar", 150), b("longa", 150), b("sequencia", 250), b("tonica", 200), b("intervalo", 150)],
    20: [b("alcance", 60), b("igualar", 150), b("longa", 150), b("sequencia", 300), b("tonica", 300), b("intervalo", 240)],
    30: [b("alcance", 60), b("igualar", 240), b("longa", 200), b("sequencia", 400), b("tonica", 450), b("intervalo", 450)],
  },
};

/** Segundos por pergunta, enquanto a pessoa ainda não tem respostas suficientes: palpites a conferir com o uso. */
export const MEDIANAS_INICIAIS: Record<Ex, number> = {
  intervalos: 10, acordes: 10, afinacao: 14, achar: 25, campo: 15, cadencias: 16, progressoes: 20,
  igualar: 14, longa: 14, sequencia: 25, tonica: 20, intervalo: 18, alcance: 60,
};
/** O toque em "Próxima" e a respiração entre uma pergunta e outra, que a medição (até a resposta) não pega. */
export const SOBRA_S = 2;
/** Respostas guardadas por exercício, e quantas é preciso ter para confiar na mediana. */
export const AMOSTRAS_MAX = 30;
export const AMOSTRAS_MIN = 5;
/** Uma pergunta que passou disso (a pessoa saiu para tomar água) conta como isto. */
export const TETO_S = 60;
/** Nenhuma pergunta leva menos que isto (só o som já dura mais): protege a estimativa de cliques sem ouvir. */
export const PISO_S = 3;

/** Respostas por exercício: `Partial` porque só existe o que a pessoa já fez. */
export type Duracoes = Partial<Record<Ex, readonly number[]>>;

export function mediana(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const o = [...valores].sort((x, y) => x - y);
  const m = o.length >> 1;
  return o.length % 2 ? o[m]! : (o[m - 1]! + o[m]!) / 2;
}

/** Segundos por pergunta: a mediana das últimas respostas da pessoa, ou o palpite se ainda são poucas. */
export function medianaDe(exercicio: Ex, duracoes: Duracoes): number {
  const v = duracoes[exercicio] ?? [];
  return v.length >= AMOSTRAS_MIN ? Math.max(PISO_S, mediana(v.slice(-AMOSTRAS_MAX))) : MEDIANAS_INICIAIS[exercicio];
}

/** O programa com o número de perguntas de cada bloco (ao menos duas; o alcance é uma medição só). */
export function planejar(secao: Secao, minutos: Minutos, duracoes: Duracoes): BlocoPlano[] {
  return PROGRAMAS[secao][minutos].map(({ exercicio, segundos }) => ({
    exercicio,
    perguntas: exercicio === "alcance" ? 1 : Math.max(2, Math.round(segundos / (medianaDe(exercicio, duracoes) + SOBRA_S))),
  }));
}

/** Quanto o plano deve levar, em segundos, com o ritmo atual da pessoa. */
export function estimarSegundos(plano: readonly BlocoPlano[], duracoes: Duracoes): number {
  return plano.reduce((s, x) => s + x.perguntas * (medianaDe(x.exercicio, duracoes) + (x.exercicio === "alcance" ? 0 : SOBRA_S)), 0);
}

/** Minutos inteiros para mostrar: o mais perto, nunca zero. */
export const minutosParaMostrar = (segundos: number): number => Math.max(1, Math.round(segundos / 60));

/** Guarda uma duração (em ms) no fim da lista do exercício: limitada ao teto e às últimas `AMOSTRAS_MAX`. */
export function registrarDuracao(duracoes: Duracoes, exercicio: Ex, ms: number): Duracoes {
  if (exercicio === "alcance" || !Number.isFinite(ms) || ms <= 0) return duracoes;
  const s = Math.min(TETO_S, Math.round((ms / 1000) * 10) / 10);
  return { ...duracoes, [exercicio]: [...(duracoes[exercicio] ?? []), s].slice(-AMOSTRAS_MAX) };
}
