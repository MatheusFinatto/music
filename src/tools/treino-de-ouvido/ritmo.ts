// O ritmo da pessoa: quanto ela leva, em segundos, por pergunta de cada exercício, e o último programa que escolheu.
// Fica no navegador (`musica:treino-de-ouvido-ritmo`). O treino livre também alimenta, para a estimativa melhorar sem esforço.
import { createStore } from "@/core/storage";
import { FOCOS, MINUTOS, MINUTOS_PADRAO, MEDIANAS_INICIAIS, AMOSTRAS_MAX, TETO_S, registrarDuracao, type Duracoes, type Ex, type Foco, type Minutos, type Secao } from "./programas";

export type Ritmo = { version: 1; d: Duracoes; ultimo: Record<Secao, Minutos>; foco: Record<Secao, Foco> };
const INICIAL: Ritmo = { version: 1, d: {}, ultimo: { ouvido: MINUTOS_PADRAO, voz: MINUTOS_PADRAO }, foco: { ouvido: "geral", voz: "geral" } };

const focoDe = (secao: Secao, v: unknown): Foco => ((FOCOS[secao] as readonly unknown[]).includes(v) ? (v as Foco) : "geral");
const minutos = (v: unknown): Minutos => ((MINUTOS as readonly unknown[]).includes(v) ? (v as Minutos) : MINUTOS_PADRAO);

export const ritmo = createStore<Ritmo>("treino-de-ouvido-ritmo", INICIAL, (saved) => {
  const s = saved as Partial<Ritmo> | null;
  if (!s || typeof s !== "object") return null;
  const d: Duracoes = {};
  for (const ex of Object.keys(MEDIANAS_INICIAIS) as Ex[]) {
    const v = (s.d as Record<string, unknown> | undefined)?.[ex];
    if (Array.isArray(v)) d[ex] = v.filter((x): x is number => typeof x === "number" && x > 0 && x <= TETO_S).slice(-AMOSTRAS_MAX);
  }
  return { version: 1, d, ultimo: { ouvido: minutos(s.ultimo?.ouvido), voz: minutos(s.ultimo?.voz) }, foco: { ouvido: focoDe("ouvido", s.foco?.ouvido), voz: focoDe("voz", s.foco?.voz) } };
});

/** Anota quanto uma pergunta levou (em ms). */
export const anotarDuracao = (exercicio: Ex, ms: number) => ritmo.set((r) => ({ ...r, d: registrarDuracao(r.d, exercicio, ms) }));
export const lembrarPrograma = (secao: Secao, m: Minutos) => ritmo.set((r) => ({ ...r, ultimo: { ...r.ultimo, [secao]: m } }));
export const lembrarFoco = (secao: Secao, f: Foco) => ritmo.set((r) => ({ ...r, foco: { ...r.foco, [secao]: f } }));
