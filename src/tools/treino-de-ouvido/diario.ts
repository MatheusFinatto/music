// O registro diário do treino (ouvido e voz): por dia, quantas respostas, quantos acertos e quanto tempo. Alimenta o cartão
// "Hoje" (Hoje.tsx). Fica no navegador (`musica:treino-diario`); a lógica é a do app (Diario.kt, em src/core/treino).
import { createStore } from "@/core/storage";
import { hojeLocal, registrarDia, type Dia } from "@/core/treino";
import type { Secao } from "./programas";

export type Diario = { version: 1; dias: Dia[] };
const INICIAL: Diario = { version: 1, dias: [] };

const dia = (v: unknown): Dia | null => {
  const x = v as Partial<Dia> | null;
  if (!x || typeof x.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x.data) || (x.secao !== "ouvido" && x.secao !== "voz")) return null;
  const n = (k: unknown) => (typeof k === "number" && Number.isFinite(k) && k >= 0 ? k : 0);
  return { data: x.data, secao: x.secao, respostas: n(x.respostas), acertos: n(x.acertos), segundos: n(x.segundos) };
};

export const diario = createStore<Diario>("treino-diario", INICIAL, (saved) => {
  const s = saved as Partial<Diario> | null;
  if (!s || !Array.isArray(s.dias)) return null;
  return { version: 1, dias: s.dias.map(dia).filter((x): x is Dia => x !== null) };
});

/** Uma resposta (ouvido) ou uma tentativa (voz) a mais hoje, com quanto ela levou em ms. */
export const anotarDia = (secao: Secao, certo: boolean, ms: number) =>
  diario.set((d) => ({ ...d, dias: registrarDia(d.dias, hojeLocal(), secao, certo, ms / 1000) }));
