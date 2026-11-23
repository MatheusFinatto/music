"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  estimarSegundos, FOCOS, medianaDe, MINUTOS, minutosParaMostrar, planejar, SOBRA_S, type BlocoPlano, type Duracoes, type Ex, type Foco, type Minutos, type Secao,
} from "./programas";
import { lembrarFoco, lembrarPrograma, ritmo } from "./ritmo";

/** O que um bloco do programa recebe: qual exercício fazer, quantas perguntas faltam e como avisar. */
export type ProgramaProp = {
  exercicio: Ex;
  /** Perguntas que faltam neste bloco (0 = a última já foi respondida). */
  restante: number;
  /** Texto do botão que fecha o bloco ("Próximo bloco: Acordes" ou "Terminar programa"). */
  rotuloFim: string;
  aoResponder: (certo: boolean) => void;
  aoAvancar: () => void;
};

type Resultado = { exercicio: Ex; acertos: number; total: number; pulado: boolean };
type Rodando = { foco: Foco; minutos: Minutos; plano: BlocoPlano[]; i: number; feitas: number; acertos: number; resultados: Resultado[]; inicio: number; previsto: number };
type Fim = { foco: Foco; minutos: Minutos; resultados: Resultado[]; realS: number; previsto: number };

const segundosRestantes = (r: Rodando, d: Duracoes) => {
  const custo = (x: BlocoPlano, n: number) => n * (medianaDe(x.exercicio, d) + SOBRA_S);
  return r.plano.reduce((s, x, k) => (k < r.i ? s : k === r.i ? s + custo(x, Math.max(0, x.perguntas - r.feitas)) : s + custo(x, x.perguntas)), 0);
};

/**
 * Programas por tempo de uma seção: o seletor (5 a 30 min) antes do treino livre; durante o programa, a barra de andamento e o bloco
 * da vez no lugar do treino livre; no fim, o resumo. `bloco` desenha o exercício da vez e `livre`, o treino de sempre.
 */
export function Programa({ secao, livre, bloco }: { secao: Secao; livre: ReactNode; bloco: (p: ProgramaProp, chave: string) => ReactNode }) {
  const t = useTranslations("treino-de-ouvido");
  const r = useSyncExternalStore(ritmo.subscribe, ritmo.get, ritmo.getInitial);
  const [rodando, setRodando] = useState<Rodando | null>(null);
  const [fim, setFim] = useState<Fim | null>(null);
  const minutos = r.ultimo[secao];
  const foco = r.foco[secao];

  const nomeDe = (ex: Ex) => t(secao === "voz" ? (`voz.exercicios.${ex}` as "voz.exercicios.igualar") : (`exercicios.${ex}` as "exercicios.intervalos"));
  const comecar = (f: Foco, m: Minutos) => {
    const plano = planejar(secao, f, m, r.d);
    setFim(null);
    setRodando({ foco: f, minutos: m, plano, i: 0, feitas: 0, acertos: 0, resultados: [], inicio: Date.now(), previsto: estimarSegundos(plano, r.d) });
  };
  /** Fecha o bloco da vez (respondido ou pulado) e passa ao próximo, ou ao resumo. */
  const fechar = (x: Rodando, pulado: boolean) => {
    const resultados = [...x.resultados, { exercicio: x.plano[x.i]!.exercicio, acertos: x.acertos, total: x.feitas, pulado }];
    if (x.i + 1 < x.plano.length) setRodando({ ...x, i: x.i + 1, feitas: 0, acertos: 0, resultados });
    else { setRodando(null); setFim({ foco: x.foco, minutos: x.minutos, resultados, realS: (Date.now() - x.inicio) / 1000, previsto: x.previsto }); }
  };

  if (rodando) {
    const x = rodando, atual = x.plano[x.i]!;
    const restante = Math.max(0, atual.perguntas - x.feitas);
    const proximo = x.plano[x.i + 1];
    const total = x.plano.reduce((s, b) => s + b.perguntas, 0);
    const feitasTodas = x.plano.reduce((s, b, k) => s + (k < x.i ? b.perguntas : k === x.i ? Math.min(x.feitas, b.perguntas) : 0), 0);
    const falta = minutosParaMostrar(segundosRestantes(x, r.d));
    return (
      <>
        <section className="treino treino-andamento" aria-label={t("programas.andamento")}>
          <div className="treino-andamento-topo">
            <p className="treino-andamento-nome"><strong>{t("programas.programaDe", { n: x.minutos })}</strong> · {t(`programas.focos.${x.foco}` as "programas.focos.geral")} · {t("programas.bloco", { i: x.i + 1, n: x.plano.length })} · {nomeDe(atual.exercicio)}</p>
            <p className="treino-andamento-n">{t("programas.respondidas", { i: Math.min(x.feitas, atual.perguntas), n: atual.perguntas })} · {t("programas.restantes", { n: falta })}</p>
          </div>
          <div className="treino-prog-barra" role="progressbar" aria-label={t("programas.andamento")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitasTodas}><i style={{ width: `${(feitasTodas / total) * 100}%` }} /></div>
          <div className="treino-acoes">
            <button type="button" className="treino-btn" onClick={() => fechar(x, true)}>{t("programas.pular")}</button>
            <button type="button" className="treino-btn" onClick={() => setRodando(null)}>{t("programas.parar")}</button>
          </div>
        </section>
        {bloco({
          exercicio: atual.exercicio,
          restante,
          rotuloFim: proximo ? t("programas.proximoBloco", { nome: nomeDe(proximo.exercicio) }) : t("programas.terminar"),
          aoResponder: (certo) => setRodando((y) => (y ? { ...y, feitas: y.feitas + 1, acertos: y.acertos + (certo ? 1 : 0) } : y)),
          aoAvancar: () => fechar(x, false),
        }, `${x.inicio}-${x.i}`)}
      </>
    );
  }

  const plano = planejar(secao, foco, minutos, r.d);
  const previsto = minutosParaMostrar(estimarSegundos(plano, r.d));
  return (
    <>
      {fim && (
        <section className="treino treino-resumo" aria-label={t("programas.resumoTitulo")}>
          <h2>{t("programas.resumoTitulo")}</h2>
          <p role="status">{t("programas.resumoAcertos", { acertos: fim.resultados.reduce((s, y) => s + y.acertos, 0), total: fim.resultados.reduce((s, y) => s + y.total, 0) })} · {t("programas.resumoTempo", { real: minutosParaMostrar(fim.realS), previsto: minutosParaMostrar(fim.previsto) })}</p>
          <ul className="treino-prog-lista">
            {fim.resultados.map((y, k) => (
              <li key={k}><span>{nomeDe(y.exercicio)}</span><span className="treino-fraco-n">{y.pulado ? t("programas.resumoPulado") : t("programas.resumoBloco", { acertos: y.acertos, total: y.total })}</span></li>
            ))}
          </ul>
          <div className="treino-acoes">
            <button type="button" className="go treino-proxima" onClick={() => comecar(fim.foco, fim.minutos)}>{t("programas.refazer")}</button>
            <button type="button" className="treino-btn" onClick={() => setFim(null)}>{t("programas.voltar")}</button>
          </div>
        </section>
      )}
      {!fim && (
        <section className="treino treino-programas" aria-label={t("programas.titulo")}>
          <div className="treino-programas-topo">
            <h2>{t("programas.titulo")}</h2>
            <p>{t("programas.dica")}</p>
          </div>
          <div className="treino-exs" role="radiogroup" aria-label={t("programas.foco")} onKeyDown={onRadioKeyDown}>
            <div className="treino-exs-linha" role="presentation">
              <span className="treino-exs-nome" aria-hidden="true">{t("programas.foco")}</span>
              {FOCOS[secao].map((f) => (
                <button key={f} type="button" role="radio" aria-checked={foco === f} tabIndex={foco === f ? 0 : -1} onClick={() => lembrarFoco(secao, f)}>{t(`programas.focos.${f}` as "programas.focos.geral")}</button>
              ))}
            </div>
          </div>
          <div className="treino-exs" role="radiogroup" aria-label={t("programas.rotulo")} onKeyDown={onRadioKeyDown}>
            <div className="treino-exs-linha" role="presentation">
              <span className="treino-exs-nome" aria-hidden="true">{t("programas.tempo")}</span>
              {MINUTOS.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={minutos === m} tabIndex={minutos === m ? 0 : -1} onClick={() => lembrarPrograma(secao, m)}>{t("programas.minutos", { n: m })}</button>
              ))}
            </div>
          </div>
          <ul className="treino-prog-lista" aria-label={t("programas.aprox", { n: previsto })}>
            {plano.map((x, k) => (
              <li key={k}><span>{nomeDe(x.exercicio)}</span><span className="treino-fraco-n">{t("programas.perguntas", { n: x.perguntas })}</span></li>
            ))}
          </ul>
          {previsto !== minutos && <p className="treino-prog-aprox">{t("programas.aprox", { n: previsto })}</p>}
          <button type="button" className="go treino-proxima" onClick={() => comecar(foco, minutos)}>{t("programas.comecar", { n: minutos })}</button>
        </section>
      )}
      {livre}
    </>
  );
}
