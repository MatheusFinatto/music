"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getAudio, loadPiano, PIANO_SAMPLES, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { createStore } from "@/core/storage";
import {
  CLASSICA_INICIAL, DIRECOES, EXERCICIOS, FUNCIONAL_INICIAL, IDS, PLACAR_ZERO, perguntaClassica, perguntaFuncional, registrar, somar,
  type ConfigClassica, type ConfigFuncional, type Direcao, type Exercicio, type Historico, type PerguntaClassica, type PerguntaFuncional,
} from "./engine";
import "./treino.css";

type Modo = "classico" | "funcional";
const MODOS: readonly Modo[] = ["classico", "funcional"];
type Saved = { version: 1; modo: Modo; classica: ConfigClassica; funcional: ConfigFuncional; historico: Historico };
const DEFAULTS: Saved = { version: 1, modo: "classico", classica: CLASSICA_INICIAL, funcional: FUNCIONAL_INICIAL, historico: {} };

/** Só ids que existem; lista vazia volta ao padrão. */
const ids = (v: unknown, validos: readonly string[], padrao: string[]): string[] => {
  const ok = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && validos.includes(x)) : [];
  return ok.length ? ok : padrao;
};
const store = createStore<Saved>("treino-de-ouvido", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  if (!s || typeof s !== "object") return null;
  const c = (s.classica ?? {}) as Partial<ConfigClassica>, f = (s.funcional ?? {}) as Partial<ConfigFuncional>;
  const h = s.historico && typeof s.historico === "object" ? s.historico : {};
  return {
    version: 1,
    modo: MODOS.includes(s.modo as Modo) ? (s.modo as Modo) : "classico",
    classica: {
      exercicio: EXERCICIOS.includes(c.exercicio as Exercicio) ? (c.exercicio as Exercicio) : "intervalos",
      itens: {
        intervalos: ids(c.itens?.intervalos, IDS.intervalos, CLASSICA_INICIAL.itens.intervalos),
        acordes: ids(c.itens?.acordes, IDS.acordes, CLASSICA_INICIAL.itens.acordes),
      },
      direcao: DIRECOES.includes(c.direcao as Direcao) ? (c.direcao as Direcao) : "asc",
    },
    funcional: { tonica: f.tonica === "sorteada" ? "sorteada" : "do", graus: ids(f.graus, IDS.graus, FUNCIONAL_INICIAL.graus) },
    historico: h as Historico,
  };
});

type Pergunta = { modo: "classico"; p: PerguntaClassica } | { modo: "funcional"; p: PerguntaFuncional };

/** Treino de ouvido no navegador, em dois estilos para comparar: clássico (intervalos e acordes) e funcional (graus numa tonalidade). */
export function TreinoDeOuvido() {
  const t = useTranslations("treino-de-ouvido");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const [q, setQ] = useState<Pergunta | null>(null);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [placar, setPlacar] = useState(PLACAR_ZERO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<"audio" | "piano" | null>(null);

  // Aquece o cache das amostras sem criar o áudio (que só nasce no primeiro toque).
  useEffect(() => { PIANO_SAMPLES.forEach((m) => { void fetch(`/sons/piano/${m}.mp3`).catch(() => {}); }); }, []);
  useEffect(() => () => { const g = getAudio(); if (g) stopPiano(g); }, []);

  const tocar = async (notas: readonly PianoNote[]) => {
    const g = resumeAudio();
    if (!g) { setErro("audio"); return; }
    try { setCarregando(true); await loadPiano(g); setErro(null); } catch { setErro("piano"); return; } finally { setCarregando(false); }
    playPiano(g, notas);
  };
  const nova = (modo: Modo = s.modo, cfg: Saved = s) => {
    const p: Pergunta = modo === "classico" ? { modo, p: perguntaClassica(cfg.classica) } : { modo, p: perguntaFuncional(cfg.funcional) };
    setQ(p);
    setEscolha(null);
    void tocar(p.modo === "classico" ? p.p.notas : p.p.tudo);
  };
  /** Mudar modo ou ajuste descarta a pergunta em andamento e cala o piano. */
  const mudar = (next: Saved, zerar = true) => {
    store.set(next);
    const g = getAudio();
    if (g) stopPiano(g);
    setQ(null);
    setEscolha(null);
    if (zerar) setPlacar(PLACAR_ZERO);
  };
  const responder = (id: string) => {
    if (!q || escolha !== null) return;
    const certo = id === q.p.resposta;
    setEscolha(id);
    setPlacar((p) => somar(p, certo));
    store.set((x) => ({ ...x, historico: registrar(x.historico, q.p.chave, certo) }));
  };

  const modo = s.modo;
  const exercicio = s.classica.exercicio;
  const grupoDeIds: readonly string[] = modo === "funcional" ? s.funcional.graus : s.classica.itens[exercicio];
  const nomeGrupo = modo === "funcional" ? "graus" : exercicio;
  const nome = (grupo: string, id: string) => t(`nomes.${grupo}.${id}` as "nomes.graus.1");
  const todos = modo === "funcional" ? IDS.graus : IDS[exercicio];
  const marcar = (id: string) => {
    const atual = grupoDeIds, tem = atual.includes(id);
    if (tem && atual.length === 1) return; // sempre sobra pelo menos um
    const nextIds = tem ? atual.filter((x) => x !== id) : todos.filter((x) => x === id || atual.includes(x));
    mudar(modo === "funcional" ? { ...s, funcional: { ...s.funcional, graus: nextIds } } : { ...s, classica: { ...s.classica, itens: { ...s.classica.itens, [exercicio]: nextIds } } }, false);
  };
  const resultado = q && escolha !== null ? (escolha === q.p.resposta ? t("certo") : t("errado", { resposta: nome(nomeGrupo, q.p.resposta) })) : "";

  return (
    <div className="treino">
      <div className="treino-seg" role="radiogroup" aria-label={t("modo")} onKeyDown={onRadioKeyDown}>
        {MODOS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={modo === m} tabIndex={modo === m ? 0 : -1} onClick={() => mudar({ ...s, modo: m })}>{t(`modos.${m}`)}</button>
        ))}
      </div>
      <p className="treino-lead">{t(`modoDesc.${modo}`)}</p>

      <details className="treino-ajustes">
        <summary>{t("ajustes")}</summary>
        <div className="treino-ajustes-corpo">
          {modo === "classico" ? (
            <>
              <div className="treino-field">
                <span id="treino-ex">{t("exercicio")}</span>
                <div className="treino-seg" role="radiogroup" aria-labelledby="treino-ex" onKeyDown={onRadioKeyDown}>
                  {EXERCICIOS.map((e) => (
                    <button key={e} type="button" role="radio" aria-checked={exercicio === e} tabIndex={exercicio === e ? 0 : -1} onClick={() => mudar({ ...s, classica: { ...s.classica, exercicio: e } }, false)}>{t(`exercicios.${e}`)}</button>
                  ))}
                </div>
              </div>
              {exercicio === "intervalos" && (
                <label className="treino-field">
                  <span>{t("direcao")}</span>
                  <select value={s.classica.direcao} onChange={(e) => mudar({ ...s, classica: { ...s.classica, direcao: e.target.value as Direcao } }, false)}>
                    {DIRECOES.map((d) => <option key={d} value={d}>{t(`direcoes.${d}`)}</option>)}
                  </select>
                </label>
              )}
            </>
          ) : (
            <label className="treino-field">
              <span>{t("tonalidade")}</span>
              <select value={s.funcional.tonica} onChange={(e) => mudar({ ...s, funcional: { ...s.funcional, tonica: e.target.value === "sorteada" ? "sorteada" : "do" } }, false)}>
                <option value="do">{t("tonicas.do")}</option>
                <option value="sorteada">{t("tonicas.sorteada")}</option>
              </select>
            </label>
          )}
          <fieldset className="treino-itens">
            <legend>{t(modo === "funcional" ? "graus" : "itens")}</legend>
            {todos.map((id) => (
              <label key={id} className="treino-check">
                <input type="checkbox" checked={grupoDeIds.includes(id)} onChange={() => marcar(id)} />
                <span>{nome(nomeGrupo, id)}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </details>

      <div className="treino-palco">
        {!q ? (
          <button type="button" className="go treino-play" onClick={() => nova()} disabled={carregando}>{t("comecar")}</button>
        ) : (
          <>
            <h2 className="treino-pergunta">{t(modo === "funcional" ? "perguntaFuncional" : exercicio === "acordes" ? "perguntaAcordes" : "perguntaIntervalos")}</h2>
            <div className="treino-ouvir">
              <button type="button" className="treino-btn" onClick={() => void tocar(q.modo === "classico" ? q.p.notas : q.p.tudo)} disabled={carregando}>{t("ouvir")}</button>
              {q.modo === "funcional" && <button type="button" className="treino-btn" onClick={() => void tocar(q.p.cadencia)} disabled={carregando}>{t("soCadencia")}</button>}
              {q.modo === "funcional" && <button type="button" className="treino-btn" onClick={() => void tocar(q.p.nota)} disabled={carregando}>{t("soNota")}</button>}
            </div>
            <div className="treino-respostas" role="group" aria-label={t("respostas")}>
              {grupoDeIds.map((id) => {
                const estado = escolha === null ? "" : id === q.p.resposta ? "certa" : id === escolha ? "errada" : "";
                return (
                  <button key={id} type="button" className={`treino-resp ${estado}`} onClick={() => responder(id)} disabled={escolha !== null && !estado}>
                    {nome(nomeGrupo, id)}
                  </button>
                );
              })}
            </div>
            <p className={`treino-resultado ${escolha !== null && escolha === q.p.resposta ? "certa" : "errada"}`} role="status">{resultado}</p>
            {escolha !== null && <button type="button" className="go treino-play" onClick={() => nova()} disabled={carregando}>{t("proxima")}</button>}
          </>
        )}
        <p className="treino-estado" role="status">
          {carregando ? t("carregando") : erro === "audio" ? t("erroAudio") : erro === "piano" ? t("erroPiano") : ""}
        </p>
      </div>

      <p className="treino-placar">
        {placar.total > 0 ? `${t("placar", { acertos: placar.acertos, total: placar.total })} · ${t("sequencia", { n: placar.sequencia })}${placar.melhor > placar.sequencia ? ` (${t("melhor", { n: placar.melhor })})` : ""}` : " "}
      </p>
      <p className="treino-creditos">{t("creditos")}</p>
    </div>
  );
}
