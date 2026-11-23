// Programas por tempo: sequências prontas de exercícios para 5, 10, 15, 20 ou 30 minutos. Puro (sem tela).
// O tempo é aproximado: cada exercício tem uma duração típica por pergunta, que passa a ser a mediana do que a própria
// pessoa levou nas últimas respostas. O número de perguntas de cada bloco sai da fatia de tempo dividida por essa duração.
import type { Exercicio as ExOuvido } from "./engine";

export type Secao = "ouvido" | "voz";
/** O alcance não entra nos programas: é uma medição, não um exercício. */
export type ExVoz = "igualar" | "longa" | "sequencia" | "tonica" | "intervalo" | "musica";
export type Ex = ExOuvido | ExVoz;
export const MINUTOS = [5, 10, 15, 20, 30] as const;
export type Minutos = (typeof MINUTOS)[number];
export const MINUTOS_PADRAO: Minutos = 10;

/** O que o programa enfatiza. "geral" é o mix equilibrado; os outros concentram o tempo no que importa para aquele foco. */
export type Foco = "geral" | "notas" | "afinacao" | "harmonia" | "segundaVoz" | "musicas";
export const FOCOS: Record<Secao, readonly Foco[]> = { ouvido: ["geral", "notas", "afinacao", "harmonia"], voz: ["geral", "afinacao", "segundaVoz", "musicas"] };

export type Bloco = { exercicio: Ex; segundos: number };
export type BlocoPlano = { exercicio: Ex; perguntas: number };

const b = (exercicio: Ex, segundos: number): Bloco => ({ exercicio, segundos });

type Tabela = Record<Minutos, readonly Bloco[]>;
/** Monta uma tabela de 5 a 30 min a partir dos segundos de cada exercício, na ordem em que aparecem: `[exercicio, seg5, seg10, seg15, seg20, seg30]`, com 0 para não entrar. */
const tabela = (linhas: readonly (readonly [Ex, number, number, number, number, number])[]): Tabela => {
  const por = (k: 1 | 2 | 3 | 4 | 5) => linhas.filter((l) => l[k] > 0).map((l) => b(l[0], l[k]));
  return { 5: por(1), 10: por(2), 15: por(3), 20: por(4), 30: por(5) };
};

/**
 * Cada programa soma exatamente `minutos × 60` segundos. Os mais curtos pegam o básico do foco; os longos acrescentam mais exercícios.
 * (O alcance não está aqui: medir a extensão da voz não é um exercício.)
 */
export const PROGRAMAS: Record<Secao, Partial<Record<Foco, Tabela>>> = {
  ouvido: {
    geral: tabela([["intervalos", 150, 150, 150, 200, 300], ["acordes", 150, 150, 150, 150, 200], ["afinacao", 0, 150, 150, 200, 250], ["achar", 0, 0, 150, 200, 300], ["campo", 0, 150, 150, 150, 250], ["cadencias", 0, 0, 150, 150, 250], ["progressoes", 0, 0, 0, 150, 250]]),
    notas: tabela([["intervalos", 150, 250, 350, 450, 700], ["acordes", 150, 200, 300, 400, 600], ["achar", 0, 150, 250, 350, 500]]),
    afinacao: tabela([["intervalos", 100, 150, 200, 300, 400], ["afinacao", 200, 450, 700, 900, 1400]]),
    harmonia: tabela([["campo", 150, 200, 300, 400, 600], ["cadencias", 150, 200, 300, 400, 600], ["progressoes", 0, 200, 300, 400, 600]]),
  },
  voz: {
    geral: tabela([["igualar", 150, 130, 120, 150, 220], ["longa", 0, 0, 120, 150, 180], ["sequencia", 150, 170, 200, 250, 330], ["tonica", 0, 200, 150, 250, 350], ["intervalo", 0, 0, 130, 150, 320], ["musica", 0, 100, 180, 250, 400]]),
    afinacao: tabela([["igualar", 150, 250, 350, 450, 650], ["longa", 150, 200, 300, 350, 500], ["intervalo", 0, 150, 250, 400, 650]]),
    musicas: tabela([["igualar", 60, 100, 120, 150, 200], ["musica", 240, 500, 780, 1050, 1600]]),
    segundaVoz: tabela([["igualar", 0, 100, 150, 200, 300], ["tonica", 150, 300, 450, 600, 900], ["intervalo", 150, 200, 300, 400, 600]]),
  },
};
export const programaDe = (secao: Secao, foco: Foco, minutos: Minutos): readonly Bloco[] => (PROGRAMAS[secao][foco] ?? PROGRAMAS[secao].geral!)[minutos];

/** Segundos por pergunta, enquanto a pessoa ainda não tem respostas suficientes: palpites a conferir com o uso. */
export const MEDIANAS_INICIAIS: Record<Ex, number> = {
  intervalos: 10, acordes: 10, afinacao: 14, achar: 25, campo: 15, cadencias: 16, progressoes: 20,
  igualar: 14, longa: 14, sequencia: 25, tonica: 20, intervalo: 18, musica: 22,
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

/** O programa com o número de perguntas de cada bloco (ao menos duas). */
export function planejar(secao: Secao, foco: Foco, minutos: Minutos, duracoes: Duracoes): BlocoPlano[] {
  return programaDe(secao, foco, minutos).map(({ exercicio, segundos }) => ({
    exercicio,
    perguntas: Math.max(2, Math.round(segundos / (medianaDe(exercicio, duracoes) + SOBRA_S))),
  }));
}

/** Quanto o plano deve levar, em segundos, com o ritmo atual da pessoa. */
export function estimarSegundos(plano: readonly BlocoPlano[], duracoes: Duracoes): number {
  return plano.reduce((s, x) => s + x.perguntas * (medianaDe(x.exercicio, duracoes) + SOBRA_S), 0);
}

/** Minutos inteiros para mostrar: o mais perto, nunca zero. */
export const minutosParaMostrar = (segundos: number): number => Math.max(1, Math.round(segundos / 60));

/** Guarda uma duração (em ms) no fim da lista do exercício: limitada ao teto e às últimas `AMOSTRAS_MAX`. */
export function registrarDuracao(duracoes: Duracoes, exercicio: Ex, ms: number): Duracoes {
  if (!Number.isFinite(ms) || ms <= 0) return duracoes;
  const s = Math.min(TETO_S, Math.round((ms / 1000) * 10) / 10);
  return { ...duracoes, [exercicio]: [...(duracoes[exercicio] ?? []), s].slice(-AMOSTRAS_MAX) };
}
