// Fixtures do treino: perguntas, notas e respostas com sementes fixas, em todas as combinações de exercício. O mesmo arquivo é lido
// pelo teste do Kotlin (TreinoParidadeTest, em marmota-tuner/core), que roda na JVM; aqui ele roda contra o JS compilado. Nasceu da
// versão antiga em TypeScript, então também garante que a troca para o Kotlin não mudou nenhum sorteio.
// Mudou uma regra de propósito (no Kotlin)? Rode `./gradlew :core:exportToSite` em marmota-tuner/, regrave com
// `ATUALIZAR_FIXTURES=1 npx vitest run paridade` e confira no diff que só mudou o que devia.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { PianoNote } from "@/core/audio";
import {
  CLASSICA_INICIAL, FUNCIONAL_INICIAL, IDS, compararAfinacao, mulberry32, nomeAcorde, nomeNota, nomeTom, peso, perguntaClassica,
  perguntaFuncional, registrar, somar, PLACAR_ZERO, CAMPO, ACORDES, PADROES,
  type ConfigClassica, type Direcao, type Exercicio, type Historico, type PerguntaClassica, type PerguntaFuncional, type Placar,
} from "./engine";
import {
  ALCANCE_ZERO, SEGURANDO_ZERO, VOZES, atualizar, centsDe, extensao, faixaConfortavel, inicioDaRodada, medirAlcance, notasDoPadrao,
  sortearAlvoDeVoz, sortearClasseDeVoz, vozMaisProxima, type Faixa,
} from "./voz";
import {
  FOCOS, MINUTOS, estimarSegundos, mediana, minutosParaMostrar, planejar, registrarDuracao, type Duracoes, type Ex, type Secao,
} from "./programas";
import { acertoDaNota, dobrar, janelas, resumir, tonicaParaCaber, type Amostra } from "./cantar";
import { MUSICAS } from "./musicas";
import { acordeNoBraco, formaDoArpejo, posicoesDe } from "./violao";
import { faixaDoTeclado } from "./Teclado";

const ARQUIVO = fileURLToPath(new URL("../../../marmota-tuner/core/src/jvmTest/resources/treino-fixtures.json", import.meta.url));

const nota = (n: PianoNote) => [n.midi, n.at, n.dur, n.cents ?? 0];
const classica = (p: PerguntaClassica) => [
  p.chave, p.resposta, p.notas.map(nota), p.cents ?? null, p.tonica ?? null, p.acordes ?? null, p.reveal ?? null, p.dada ?? null, p.alvo ?? null,
];
const funcional = (p: PerguntaFuncional) => [p.chave, p.resposta, p.tonica, p.cadencia.map(nota), p.nota.map(nota), p.tudo.map(nota)];
const placar = (p: Placar) => [p.acertos, p.total, p.sequencia, p.melhor];
const faixa = (f: Faixa) => [f.min, f.max];

/** Um histórico com pesos variados, para o sorteio com peso sair do caminho trivial. */
function historicoDeTeste(): Historico {
  const r = mulberry32(99);
  const h: Historico = {};
  for (const [ex, ids] of Object.entries(IDS)) for (const id of ids) {
    const total = Math.floor(r() * 8);
    h[`${ex}:${id}`] = { certo: Math.floor(r() * (total + 1)), total };
  }
  return h;
}

const SEMENTES = Array.from({ length: 200 }, (_, i) => i + 1);
/** Nas primeiras sementes guarda a pergunta inteira; nas 200, um resumo (para o arquivo não passar de 1 MB). */
const COMPLETAS = 8;
const POR_SEMENTE = 2;
const resumoClassica = (p: PerguntaClassica) => [p.resposta, p.notas[0]!.midi, p.notas.at(-1)!.midi, p.cents ?? p.tonica ?? p.dada ?? null];
/** Entradas simuladas com 3 casas: o arquivo fica menor e a conta é a mesma dos dois lados. */
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const resumoFuncional = (p: PerguntaFuncional) => [p.resposta, p.tonica, p.nota[0]!.midi];

function gerar() {
  const hist = historicoDeTeste();
  const out: Record<string, unknown> = {};
  out.rng = [1, 2, 3, 1000, 123456789].map((s) => { const r = mulberry32(s); return [s, Array.from({ length: 20 }, () => r())]; });
  out.historico = Object.entries(hist).map(([k, v]) => [k, v.certo, v.total]);

  // Modo clássico: as combinações que mudam o sorteio, sementes 1 a 200.
  const configs: { exercicio: Exercicio; itens: string[]; direcao: Direcao; margem: number; tonica: "do" | "sorteada"; hist: boolean }[] = [];
  const todos = (ex: Exercicio) => [...IDS[ex]];
  for (const ex of ["intervalos", "afinacao", "achar"] as const) {
    for (const direcao of ["asc", "desc", "harm", "misto"] as const) {
      for (const itens of [CLASSICA_INICIAL.itens[ex], todos(ex)]) {
        for (const h of [false, true]) {
          const margem = ex === "afinacao" ? [50, 30, 20, 10][configs.length % 4]! : 30;
          configs.push({ exercicio: ex, itens, direcao, margem, tonica: "do", hist: h });
        }
      }
    }
  }
  for (const ex of ["acordes", "campo", "cadencias", "progressoes"] as const) {
    for (const tonica of ["do", "sorteada"] as const) {
      for (const itens of [CLASSICA_INICIAL.itens[ex], todos(ex)]) {
        for (const h of [false, true]) configs.push({ exercicio: ex, itens, direcao: "asc", margem: 30, tonica, hist: h });
      }
    }
  }
  // Uma escolha velha (item que não existe mais) cai em todos os itens.
  configs.push({ exercicio: "intervalos", itens: ["nao-existe"], direcao: "asc", margem: 30, tonica: "do", hist: false });
  out.classica = configs.map((c) => {
    const cfg: ConfigClassica = { ...CLASSICA_INICIAL, exercicio: c.exercicio, itens: { ...CLASSICA_INICIAL.itens, [c.exercicio]: c.itens }, direcao: c.direcao, margem: c.margem, tonica: c.tonica };
    const sementes = SEMENTES.map((s) => {
      const r = mulberry32(s);
      if (s > COMPLETAS) return [resumoClassica(perguntaClassica(cfg, r, c.hist ? hist : undefined))];
      return Array.from({ length: POR_SEMENTE }, () => classica(perguntaClassica(cfg, r, c.hist ? hist : undefined)));
    });
    return { exercicio: c.exercicio, itens: c.itens, direcao: c.direcao, margem: c.margem, tonica: c.tonica, hist: c.hist, sementes };
  });

  out.funcional = (["do", "sorteada"] as const).flatMap((tonica) => [FUNCIONAL_INICIAL.graus, [...IDS.graus]].flatMap((graus) => [false, true].map((h) => ({
    tonica, graus, hist: h,
    sementes: SEMENTES.map((s) => {
      const r = mulberry32(s);
      if (s > COMPLETAS) return [resumoFuncional(perguntaFuncional({ tonica, graus }, r, h ? hist : undefined))];
      return Array.from({ length: POR_SEMENTE }, () => funcional(perguntaFuncional({ tonica, graus }, r, h ? hist : undefined)));
    }),
  }))));

  out.comparar = [1, 2, 3, 4].map((s) => {
    const p = perguntaClassica({ ...CLASSICA_INICIAL, exercicio: "afinacao", direcao: s % 2 ? "harm" : "asc" }, mulberry32(s));
    return [p.notas.map(nota), compararAfinacao(p.notas).map(nota)];
  });

  const nomes: unknown[] = [];
  for (let m = -14; m <= 130; m++) nomes.push([m, nomeTom(m), nomeNota(m)]);
  out.nomes = nomes;
  out.acordesNomes = Array.from({ length: 14 }, (_, k) => 53 + k).map((t) => [t, CAMPO.map((c) => nomeAcorde(t, c.id))]);

  // Registrar, peso e placar: uma sequência de respostas.
  {
    const r = mulberry32(5);
    let h: Historico = {};
    let p = PLACAR_ZERO;
    const passos: unknown[] = [];
    for (let i = 0; i < 80; i++) {
      const chave = `intervalos:${IDS.intervalos[Math.floor(r() * 5)]}`;
      const certo = r() < 0.6;
      h = registrar(h, chave, certo);
      p = somar(p, certo);
      passos.push([chave, certo, peso(h, chave), placar(p)]);
    }
    out.registrar = { passos, final: Object.entries(h).map(([k, v]) => [k, v.certo, v.total]) };
  }

  {
    const r = mulberry32(17);
    out.teclado = Array.from({ length: 60 }, () => {
      const janela = Array.from({ length: 1 + Math.floor(r() * 5) }, () => 36 + Math.floor(r() * 50));
      return [janela, faixaDoTeclado(janela)];
    });
  }

  // Voz.
  out.cents = [];
  for (const midi of [47.3, 59.9, 60, 60.49, 61.2, 66, 72.1, 54, 48.02]) for (const alvo of [48, 60, 66]) for (const q of [false, true]) {
    (out.cents as unknown[]).push([midi, alvo, q, centsDe(midi, alvo, q)]);
  }
  out.segurar = [];
  for (let s = 1; s <= 12; s++) {
    const r = mulberry32(1000 + s);
    const alvo = 48 + Math.floor(r() * 24), tol = [50, 30, 20, 10][s % 4]!, q = s % 3 === 0, segurar = s % 2 ? 900 : 500;
    let st = SEGURANDO_ZERO, t = 0;
    const entradas: (number | null)[][] = [], saidas: unknown[] = [];
    for (let i = 0; i < 150; i++) {
      t += 20 + Math.floor(r() * 40);
      const x = r();
      const midi = x < 0.12 ? null : r3(alvo + (q && x > 0.85 ? 12 : 0) + (r() - 0.5) * (x < 0.3 ? 2 : 0.5));
      const p = atualizar(st, midi, t, alvo, tol, q, segurar);
      st = p.estado;
      entradas.push([midi, t]);
      saidas.push([p.estado.desde, p.estado.visto, p.estado.n, p.cents, p.ok, p.media, p.oscilacao]);
    }
    (out.segurar as unknown[]).push({ alvo, tol, q, segurar, entradas, saidas });
  }
  out.alcance = [];
  for (let s = 1; s <= 8; s++) {
    const r = mulberry32(2000 + s);
    let a = ALCANCE_ZERO, t = 0, centro = 45 + r() * 25;
    const entradas: (number | null)[][] = [], saidas: unknown[] = [];
    for (let i = 0; i < 250; i++) {
      t += 15 + Math.floor(r() * 50);
      if (r() < 0.03) centro += (r() - 0.5) * 14;
      const midi = r() < 0.1 ? null : r3(centro + (r() - 0.5) * 0.6);
      a = medirAlcance(a, midi, t);
      entradas.push([midi, t]);
      saidas.push([a.min, a.max, a.candidato, a.desde, a.visto]);
    }
    (out.alcance as unknown[]).push({ entradas, saidas });
  }
  const faixas: (Faixa | null)[] = [null, ...VOZES.map((v) => ({ min: v.min, max: v.max })), { min: 50, max: 55 }, { min: 30, max: 90 }];
  out.rodada = [];
  for (const f of faixas) for (let classe = 0; classe < 12; classe++) for (const subir of [false, true]) for (const largura of [12, 7]) {
    (out.rodada as unknown[]).push([f && faixa(f), classe, subir, largura, Array.from({ length: 9 }, (_, rodada) => inicioDaRodada(classe, rodada, subir, f ?? undefined, largura))]);
  }
  out.faixas = [];
  for (let lo = 36; lo <= 66; lo += 3) for (let hi = lo; hi <= lo + 30; hi += 4) {
    const f = faixaConfortavel(lo, hi);
    (out.faixas as unknown[]).push([lo, hi, faixa(f), vozMaisProxima(f), vozMaisProxima({ min: lo, max: hi })]);
  }
  out.sorteiosVoz = SEMENTES.slice(0, 40).map((s) => {
    const r = mulberry32(s);
    return [s, sortearClasseDeVoz(r), sortearAlvoDeVoz(r), sortearAlvoDeVoz(r, { min: 40, max: 52 })];
  });
  out.extensao = Array.from({ length: 41 }, (_, s) => [s, extensao(s).oitavas, extensao(s).semitons]);
  out.padroes = PADROES.map((p) => [p.id, notasDoPadrao(57, p.semitons)]);

  // Programas.
  const rp = mulberry32(31);
  const exs: Ex[] = ["intervalos", "acordes", "afinacao", "achar", "campo", "cadencias", "progressoes", "igualar", "longa", "sequencia", "tonica", "intervalo", "musica"];
  let d: Duracoes = {};
  const registros: unknown[] = [];
  for (let i = 0; i < 300; i++) {
    const ex = exs[Math.floor(rp() * exs.length)]!;
    const x = rp();
    const ms = x < 0.03 ? -5 : x < 0.06 ? 0 : x < 0.08 ? Infinity : x < 0.12 ? 90000 + rp() * 1000 : 1500 + rp() * 30000;
    d = registrarDuracao(d, ex, ms);
    registros.push([ex, ms === Infinity ? "Infinity" : ms]);
  }
  const duracoesFinal = Object.entries(d).map(([k, v]) => [k, v]);
  const planos: unknown[] = [];
  for (const secao of ["ouvido", "voz"] as Secao[]) for (const foco of [...FOCOS[secao], "inexistente"]) for (const m of MINUTOS) for (const comDur of [false, true]) {
    const dur = comDur ? d : {};
    const plano = planejar(secao, foco as never, m, dur);
    const seg = estimarSegundos(plano, dur);
    planos.push([secao, foco, m, comDur, plano.map((b) => [b.exercicio, b.perguntas]), seg, minutosParaMostrar(seg)]);
  }
  out.programas = { registros, duracoes: duracoesFinal, planos, medianas: [[], [3], [5, 1], [4, 2, 9], [1, 1, 2, 2, 8, 0.5]].map((v) => [v, mediana(v)]) };

  // Cantar.
  const cantar: unknown[] = [];
  let sm = 0;
  for (const m of MUSICAS) for (const [it, t] of m.trechos.entries()) {
    sm++;
    const tonicas = faixas.map((f) => [0, 5, 11].map((classe) => tonicaParaCaber(classe, t.notas, f ?? undefined)));
    const tonica = tonicas[0]![0]!;
    const js = janelas(t.notas, m.bpm, tonica);
    const r = mulberry32(3000 + sm);
    const amostras: Amostra[] = [];
    const fim = js.reduce((x, j) => Math.max(x, j.fim), 0);
    // Leituras simuladas só no primeiro trecho de cada música (o arquivo fica menor); nos outros, só as janelas e as tônicas.
    for (let tt = 0; it === 0 && tt < fim + 0.3; tt = r3(tt + 0.02 + r() * 0.05)) {
      const j = js.find((x) => tt - 0.15 >= x.ini && tt - 0.15 < x.fim);
      const certo = r() < 0.7;
      amostras.push({ t: tt, midi: r() < 0.08 || !j || j.midi === null ? null : r3(j.midi + (certo ? (r() - 0.5) * 0.4 : (r() - 0.5) * 3) + (r() < 0.1 ? 12 : 0)) });
    }
    const q = sm % 2 === 0, tol = [50, 30][sm % 2]!;
    const acertos = js.map((j) => acertoDaNota(amostras, j, tol, q));
    const aoVivo = js.map((j) => acertoDaNota(amostras, j, tol, q, (j.ini + j.fim) / 2));
    const res = resumir(js, acertos);
    cantar.push({
      musica: m.id, trecho: t.nome, tonicas, tol, q,
      janelas: js.map((j) => [j.ini, j.fim, j.midi, j.sil]),
      amostras: amostras.map((a) => [a.t, a.midi]),
      acertos: acertos.map((a) => [a.fracao, a.ok, a.ouvido]),
      aoVivo: aoVivo.map((a) => [a.fracao, a.ok, a.ouvido]),
      resumo: [res.acertadas, res.total, res.ok],
    });
  }
  out.cantar = cantar;
  out.dobrar = [];
  for (const midi of [30.2, 47.5, 54, 59.5, 60, 66, 71.9, 84.4, 96]) for (const centro of [48, 60, 66.5]) (out.dobrar as unknown[]).push([midi, centro, dobrar(midi, centro)]);

  // Violão.
  out.posicoes = Array.from({ length: 50 }, (_, k) => 35 + k).map((m) => [m, posicoesDe(m).map((p) => [p.corda, p.casa, p.midi])]);
  const acordesViolao: unknown[] = [];
  for (let raiz = 40; raiz <= 72; raiz += 1) for (const a of ACORDES) {
    const midis = a.semitons.map((s) => raiz + s);
    const f = acordeNoBraco(midis);
    acordesViolao.push([midis, f && f.map((p) => [p.corda, p.casa, p.midi])]);
  }
  out.acordesViolao = acordesViolao;
  const arpejos: unknown[] = [[[], null]];
  for (let raiz = 40; raiz <= 64; raiz += 1) for (const a of [...ACORDES, ...PADROES]) {
    const midis = a.semitons.map((s) => raiz + s);
    const f = formaDoArpejo(midis);
    arpejos.push([midis, f && [f.de, f.ate, f.posicoes.map((p) => [p.corda, p.casa, p.midi, p.raiz])]]);
  }
  out.arpejos = arpejos;
  return JSON.parse(JSON.stringify(out));
}

describe("paridade com o Kotlin (treino-fixtures.json)", () => {
  it("as fixtures batem com o TypeScript", () => {
    const atual = gerar();
    if (process.env.ATUALIZAR_FIXTURES) writeFileSync(ARQUIVO, JSON.stringify(atual) + "\n");
    expect(atual).toEqual(JSON.parse(readFileSync(ARQUIVO, "utf8")));
  });
});
