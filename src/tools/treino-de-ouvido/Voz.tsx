"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { MicError, openMic, type Mic, type MicProblem, type PianoNote } from "@/core/audio";
import { CHUNK_SAMPLES, PitchPipeline, PitchSmoother } from "@/core/pitch";
import { createStore } from "@/core/storage";
import { Afinometro } from "./Afinometro";
import { CLASSICA_INICIAL, IDS, nomeNota, perguntaClassica } from "./engine";
import { Instrumento } from "./Instrumento";
import { useInstrumento } from "./instrumento";
import type { Marca } from "./Teclado";
import { usePiano } from "./usePiano";
import { ALCANCE_ZERO, atualizar, extensao, medirAlcance, SEGURANDO_ZERO, SEGURAR_MS, sortearAlvoDeVoz, TOLERANCIAS, type Alcance } from "./voz";

type Exercicio = "igualar" | "intervalo" | "alcance";
const EXERCICIOS: readonly Exercicio[] = ["igualar", "intervalo", "alcance"];
type Saved = { version: 1; exercicio: Exercicio; tolerancia: number; qualquerOitava: boolean; intervalos: string[] };
const DEFAULTS: Saved = { version: 1, exercicio: "igualar", tolerancia: 30, qualquerOitava: true, intervalos: ["3m", "3M", "4J", "5J"] };
const store = createStore<Saved>("treino-de-ouvido-voz", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  if (!s || typeof s !== "object") return null;
  const ok = Array.isArray(s.intervalos) ? s.intervalos.filter((x): x is string => typeof x === "string" && IDS.intervalos.includes(x)) : [];
  return {
    version: 1,
    exercicio: EXERCICIOS.includes(s.exercicio as Exercicio) ? (s.exercicio as Exercicio) : "igualar",
    tolerancia: (TOLERANCIAS as readonly unknown[]).includes(s.tolerancia) ? (s.tolerancia as number) : 30,
    qualquerOitava: typeof s.qualquerOitava === "boolean" ? s.qualquerOitava : true,
    intervalos: ok.length ? ok : DEFAULTS.intervalos,
  };
});

/** Quanto tempo a pessoa tem para firmar a nota antes de a tentativa acabar. */
const LIMITE_MS = 15000;
type Fase = "parado" | "piano" | "cantando" | "feito";
type Alvo = { midi: number; notas: PianoNote[] };

/** Treino de voz: o piano toca e a pessoa canta; o microfone confere a altura com a mesma detecção do afinador. */
export function Voz() {
  const t = useTranslations("treino-de-ouvido");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const piano = usePiano();
  const [instrumento, setInstrumento] = useInstrumento();
  const [fase, setFase] = useState<Fase>("parado");
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [leitura, setLeitura] = useState<number | null>(null);
  const [passo, setPasso] = useState<{ cents: number | null; progresso: number }>({ cents: null, progresso: 0 });
  const [resultado, setResultado] = useState<{ ok: boolean; media: number } | null>(null);
  const [placar, setPlacar] = useState({ a: 0, t: 0 });
  const [alcance, setAlcance] = useState<Alcance>(ALCANCE_ZERO);
  const [erroMic, setErroMic] = useState<MicProblem | null>(null);

  const mic = useRef<Mic | null>(null);
  const pipeline = useRef<PitchPipeline | null>(null);
  const suavizador = useRef(new PitchSmoother());
  const segurando = useRef(SEGURANDO_ZERO);
  const alcanceRef = useRef(ALCANCE_ZERO);
  const limite = useRef<ReturnType<typeof setTimeout> | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  // O que o microfone precisa saber a cada bloco, sem refazer a captura.
  const vivo = useRef({ fase: "parado" as Fase, alvo: null as Alvo | null, s, exercicio: s.exercicio });
  useEffect(() => { vivo.current = { fase, alvo, s, exercicio: s.exercicio }; });
  const ultimoCents = useRef<number | null>(null);

  const limparTempos = () => { if (limite.current) clearTimeout(limite.current); if (espera.current) clearTimeout(espera.current); limite.current = espera.current = null; };
  const fecharMic = useCallback(() => {
    mic.current?.stop();
    mic.current = null;
    pipeline.current = null;
    suavizador.current.reset();
    setLeitura(null);
  }, []);
  useEffect(() => () => { limparTempos(); mic.current?.stop(); }, []);

  const concluir = useCallback((ok: boolean, media: number) => {
    limparTempos();
    fecharMic();
    setFase("feito");
    setResultado({ ok, media });
    setPlacar((p) => ({ a: p.a + (ok ? 1 : 0), t: p.t + 1 }));
  }, [fecharMic]);

  const abrir = async () => {
    if (mic.current) return;
    const m = await openMic(CHUNK_SAMPLES, (chunk) => {
      const pipe = pipeline.current;
      if (!pipe) return;
      const amostra = pipe.process(chunk, chunk.length);
      const midi = suavizador.current.push(amostra.midi ?? null) ?? null;
      const agora = performance.now();
      setLeitura(midi);
      const v = vivo.current;
      if (v.exercicio === "alcance") {
        alcanceRef.current = medirAlcance(alcanceRef.current, midi, agora);
        setAlcance(alcanceRef.current);
      } else if (v.fase === "cantando" && v.alvo) {
        const p = atualizar(segurando.current, midi, agora, v.alvo.midi, v.s.tolerancia, v.s.qualquerOitava);
        segurando.current = p.estado;
        ultimoCents.current = p.cents;
        setPasso({ cents: p.cents, progresso: p.estado.desde === null ? 0 : Math.min(1, (agora - p.estado.desde) / SEGURAR_MS) });
        if (p.ok) concluir(true, p.media);
      }
    });
    pipeline.current = new PitchPipeline(m.sampleRate);
    mic.current = m;
  };

  const escutar = async () => {
    try { await abrir(); setErroMic(null); } catch (e) { setErroMic(e instanceof MicError ? e.problem : "failed"); setFase("parado"); return; }
    segurando.current = SEGURANDO_ZERO;
    ultimoCents.current = null;
    setPasso({ cents: null, progresso: 0 });
    setFase("cantando");
    limite.current = setTimeout(() => concluir(false, ultimoCents.current ?? 0), LIMITE_MS);
  };

  /** Toca o alvo e, quando o piano acaba, abre o microfone. */
  const tocarEOuvir = async (a: Alvo) => {
    limparTempos();
    fecharMic();
    setFase("piano");
    setResultado(null);
    const dur = await piano.tocar(a.notas);
    if (dur === null) { setFase("parado"); return; }
    espera.current = setTimeout(() => void escutar(), dur * 1000 + 300);
  };
  const comecar = () => {
    if (s.exercicio === "alcance") { void medir(); return; }
    let a: Alvo;
    if (s.exercicio === "igualar") {
      const midi = sortearAlvoDeVoz();
      a = { midi, notas: [{ midi, at: 0, dur: 2.0 }] };
    } else {
      const p = perguntaClassica({ ...CLASSICA_INICIAL, exercicio: "achar", direcao: "misto", itens: { ...CLASSICA_INICIAL.itens, achar: s.intervalos } });
      a = { midi: p.alvo!, notas: p.notas };
    }
    setAlvo(a);
    void tocarEOuvir(a);
  };
  const parar = () => { limparTempos(); fecharMic(); piano.calar(); setFase("parado"); };
  const medir = async () => {
    limparTempos();
    alcanceRef.current = ALCANCE_ZERO;
    setAlcance(ALCANCE_ZERO);
    setResultado(null);
    try { await abrir(); setErroMic(null); } catch (e) { setErroMic(e instanceof MicError ? e.problem : "failed"); return; }
    setFase("cantando");
  };
  const terminarAlcance = () => { fecharMic(); setFase("feito"); };
  /** Mudar exercício ou ajuste interrompe o que está em andamento. */
  const mudar = (next: Saved) => { store.set(next); parar(); setAlvo(null); setResultado(null); setAlcance(ALCANCE_ZERO); };

  const ex = s.exercicio;
  const cantando = fase === "cantando";
  const dicaVivo = !cantando ? (fase === "piano" ? t("voz.ouvindo") : t(`voz.dica.${ex}`))
    : ex === "alcance" ? (leitura === null ? t("voz.silencio") : t("voz.alcanceDica"))
    : passo.cents === null ? t("voz.silencio")
    : Math.abs(passo.cents) <= s.tolerancia ? t("voz.segure")
    : passo.cents > 0 ? t("voz.maisBaixo") : t("voz.maisAlto");
  const marcas = new Map<number, Marca>();
  if (ex === "alcance" && alcance.min !== null && alcance.max !== null) { marcas.set(alcance.min, "alvo"); marcas.set(alcance.max, "alvo"); }
  const media = resultado?.media ?? 0;
  const ext = alcance.min !== null && alcance.max !== null ? extensao(alcance.max - alcance.min) : null;

  return (
    <div className="treino voz">
      <div className="treino-topo">
        <div className="treino-escolhas">
          <div className="treino-seg amplo" role="radiogroup" aria-label={t("exercicio")} onKeyDown={onRadioKeyDown}>
            {EXERCICIOS.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={ex === e} tabIndex={ex === e ? 0 : -1} onClick={() => mudar({ ...s, exercicio: e })}>{t(`voz.exercicios.${e}`)}</button>
            ))}
          </div>
        </div>
        {ex !== "alcance" && (
          <dl className="treino-placar" aria-label={t("placarTitulo")}>
            <div><dd>{t("placar", { acertos: placar.a, total: placar.t })}</dd><dt>{t("acertos")}</dt></div>
          </dl>
        )}
      </div>

      <section className="treino-palco" aria-label={t("voz.titulo")}>
        <div className="treino-pergunta">
          <h2>{ex === "alcance" ? t("voz.exercicios.alcance") : alvo && fase !== "parado" ? t("voz.cante") : t("voz.titulo")}</h2>
          <p>{t(`voz.dica.${ex}`)}</p>
        </div>

        <Afinometro
          midi={leitura}
          centsAlvo={ex === "alcance" || !cantando ? null : passo.cents}
          tolerancia={s.tolerancia}
          progresso={ex === "alcance" ? 0 : passo.progresso}
          rotulos={{ sem: t("voz.sem"), baixo: t("voz.baixo"), alto: t("voz.alto") }}
          dica={dicaVivo}
        />

        {ex === "alcance" && (alcance.min !== null || fase === "feito") && (
          <div className="treino-revela">
            {ext && alcance.min !== null && alcance.max !== null ? (
              <>
                <p className="treino-resultado certa">{t("voz.alcanceResultado", { grave: nomeNota(alcance.min), agudo: nomeNota(alcance.max) })}</p>
                <Instrumento tipo={instrumento} janela={[alcance.min, alcance.max]} marcas={marcas} onTocar={() => {}} label={t(instrumento === "violao" ? "braco" : "teclado")} />
                <p className="treino-detalhe">{t("voz.extensao", { oitavas: ext.oitavas, semitons: ext.semitons })}</p>
              </>
            ) : <p className="treino-vazio">{t("voz.alcanceVazio")}</p>}
          </div>
        )}

        {resultado && (
          <p className={`treino-resultado ${resultado.ok ? "certa" : "errada"}`} role="status">
            {resultado.ok ? `${t("voz.afinou")} ${Math.abs(media) < 1 ? t("voz.mediaCentro") : t(media > 0 ? "voz.mediaAcima" : "voz.mediaAbaixo", { n: Math.round(Math.abs(media)) })}` : t("voz.nao")}
          </p>
        )}
        {erroMic && <p className="treino-estado" role="alert">{t(`voz.erroMic.${erroMic}`)}</p>}
        {piano.erro && <p className="treino-estado" role="alert">{piano.erro === "audio" ? t("erroAudio") : t("erroPiano")}</p>}

        <div className="treino-acoes">
          {(fase === "parado" || fase === "feito") && (
            <button type="button" className="go treino-proxima" onClick={comecar} disabled={piano.carregando}>
              {ex === "alcance" ? t("voz.medir") : fase === "feito" ? t("voz.proxima") : t("voz.comecar")}
            </button>
          )}
          {fase === "piano" && <button type="button" className="go treino-proxima" disabled>{t("voz.ouvindo")}</button>}
          {cantando && ex !== "alcance" && (
            <>
              <button type="button" className="treino-btn" onClick={() => alvo && void tocarEOuvir(alvo)}>{t("voz.ouvirDeNovo")}</button>
              <button type="button" className="treino-btn" onClick={parar}>{t("voz.parar")}</button>
            </>
          )}
          {cantando && ex === "alcance" && <button type="button" className="go treino-proxima" onClick={terminarAlcance}>{t("voz.terminar")}</button>}
        </div>
        <p className="treino-estado">{t("voz.fone")}</p>
      </section>

      <details className="treino-ajustes">
        <summary>{t("ajustes")}</summary>
        <div className="treino-ajustes-corpo">
          <div className="treino-field" role="group" aria-label={t("instrumento")}>
            <span>{t("instrumento")}</span>
            <div className="treino-chips">
              <button type="button" className="treino-chip" aria-pressed={instrumento === "teclado"} onClick={() => setInstrumento("teclado")}>{t("instrumentos.teclado")}</button>
              <button type="button" className="treino-chip" aria-pressed={instrumento === "violao"} onClick={() => setInstrumento("violao")}>{t("instrumentos.violao")}</button>
            </div>
          </div>
          {ex !== "alcance" && (
            <div className="treino-field" role="group" aria-label={t("margem")}>
              <span>{t("margem")}</span>
              <div className="treino-chips">
                {TOLERANCIAS.map((m) => <button key={m} type="button" className="treino-chip" aria-pressed={s.tolerancia === m} onClick={() => mudar({ ...s, tolerancia: m })}>{t("margemCents", { n: m })}</button>)}
              </div>
            </div>
          )}
          {ex !== "alcance" && (
            <div className="treino-field" role="group" aria-label={t("voz.oitava")}>
              <span>{t("voz.oitava")}</span>
              <div className="treino-chips">
                <button type="button" className="treino-chip" aria-pressed={s.qualquerOitava} onClick={() => mudar({ ...s, qualquerOitava: true })}>{t("voz.qualquerOitava")}</button>
                <button type="button" className="treino-chip" aria-pressed={!s.qualquerOitava} onClick={() => mudar({ ...s, qualquerOitava: false })}>{t("voz.mesmaOitava")}</button>
              </div>
            </div>
          )}
          {ex === "intervalo" && (
            <div className="treino-field treino-itens" role="group" aria-label={t("itens")}>
              <span>{t("itens")}</span>
              <div className="treino-chips">
                {IDS.intervalos.map((id) => {
                  const on = s.intervalos.includes(id);
                  return <button key={id} type="button" className="treino-chip" aria-pressed={on} onClick={() => { if (on && s.intervalos.length === 1) return; mudar({ ...s, intervalos: on ? s.intervalos.filter((x) => x !== id) : IDS.intervalos.filter((x) => x === id || s.intervalos.includes(x)) }); }}>{t(`nomes.intervalos.${id}` as "nomes.intervalos.3m")}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      </details>
      <p className="treino-creditos">{t("voz.privado")}</p>
    </div>
  );
}
