"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { MicError, openMic, type Mic, type MicProblem, type PianoNote } from "@/core/audio";
import { CHUNK_SAMPLES, NOTE_NAMES, PitchPipeline, PitchSmoother } from "@/core/pitch";
import { createStore } from "@/core/storage";
import { Afinometro } from "./Afinometro";
import { Cantar, VELOCIDADES, type ConfigMusica } from "./Cantar";
import { MUSICAS } from "./musicas";
import { CLASSICA_INICIAL, IDS, INTERVALOS, nomeNota, PADROES, perguntaClassica } from "./engine";
import { Instrumento } from "./Instrumento";
import { useInstrumento } from "./instrumento";
import type { Marca } from "./Teclado";
import type { ProgramaProp } from "./Programas";
import { anotarDuracao } from "./ritmo";
import { usePiano } from "./usePiano";
import { formaDoArpejo } from "./violao";
import {
  ALCANCE_ZERO, atualizar, extensao, inicioDaRodada, medirAlcance, notasDoPadrao, SEGURANDO_ZERO, SEGURAR_LONGA_MS, SEGURAR_MS, SEGURAR_PASSO_MS,
  faixaConfortavel, FAIXA_PADRAO, sortearAlvoDeVoz, sortearClasseDeVoz, TOLERANCIAS, VOZES, vozMaisProxima, type Alcance, type Faixa,
} from "./voz";

type Exercicio = "igualar" | "longa" | "sequencia" | "tonica" | "intervalo" | "musica" | "alcance";
const EXERCICIOS: readonly Exercicio[] = ["igualar", "longa", "sequencia", "tonica", "intervalo", "musica", "alcance"];
/** Os exercícios do seletor (o Alcance abre por Minha voz). */
const NA_LISTA = EXERCICIOS.filter((e) => e !== "alcance");
/** `tipo`: "padrao", um tipo de voz ou "medida" (a que o Alcance sugeriu). */
type FaixaSalva = Faixa & { tipo: "padrao" | "medida" | (typeof VOZES)[number]["id"] };
type Saved = { version: 1; exercicio: Exercicio; tolerancia: number; qualquerOitava: boolean; intervalos: string[]; padrao: string; inicio: number; subir: boolean; grau: string; ajuda: "guia" | "so"; faixa: FaixaSalva; musica: ConfigMusica; melhores: Record<string, number> };
const DEFAULTS: Saved = { version: 1, exercicio: "igualar", tolerancia: 30, qualquerOitava: true, intervalos: ["3m", "3M", "4J", "5J"], padrao: "arpejoMaior", inicio: 0, subir: true, grau: "3M", ajuda: "guia", faixa: { tipo: "padrao", ...FAIXA_PADRAO }, musica: { musica: MUSICAS[0]!.id, trecho: 0, velocidade: 0.6, guia: true }, melhores: {} };
const faixaValida = (f: unknown): FaixaSalva => {
  const x = f as Partial<FaixaSalva> | null | undefined;
  const tipoOk = x?.tipo === "padrao" || x?.tipo === "medida" || VOZES.some((v) => v.id === x?.tipo);
  const ints = Number.isInteger(x?.min) && Number.isInteger(x?.max) && x!.min! >= 36 && x!.max! <= 96 && x!.max! - x!.min! >= 7;
  return tipoOk && ints ? { tipo: x!.tipo!, min: x!.min!, max: x!.max! } : DEFAULTS.faixa;
};
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
    padrao: PADROES.some((p) => p.id === s.padrao) ? (s.padrao as string) : DEFAULTS.padrao,
    // -1 = aleatória: a nota inicial muda a cada rodada.
    inicio: typeof s.inicio === "number" && Number.isInteger(s.inicio) && s.inicio >= -1 && s.inicio < 12 ? s.inicio : 0,
    subir: typeof s.subir === "boolean" ? s.subir : true,
    grau: s.grau === "sortear" || IDS.intervalos.includes(s.grau as string) ? (s.grau as string) : DEFAULTS.grau,
    ajuda: s.ajuda === "so" ? "so" : "guia",
    faixa: faixaValida(s.faixa),
    musica: {
      musica: MUSICAS.some((m) => m.id === s.musica?.musica) ? s.musica!.musica : DEFAULTS.musica.musica,
      trecho: typeof s.musica?.trecho === "number" && Number.isInteger(s.musica.trecho) && s.musica.trecho >= 0 ? s.musica.trecho : 0,
      velocidade: (VELOCIDADES as readonly unknown[]).includes(s.musica?.velocidade) ? s.musica!.velocidade : 0.6,
      guia: typeof s.musica?.guia === "boolean" ? s.musica.guia : true,
    },
    melhores: s.melhores && typeof s.melhores === "object" ? Object.fromEntries(Object.entries(s.melhores).filter(([, v]) => typeof v === "number" && v >= 0 && v <= 1)) : {},
  };
});

/** O relógio, fora do componente (a regra de pureza do React não aceita chamá-lo direto nele). */
const agoraMs = () => performance.now();

/** Quanto tempo a pessoa tem para a tentativa inteira antes de ela acabar (mais, nas notas longas e nas sequências). */
const LIMITE_MS = 15000;
const limiteDe = (n: number, segurarMs: number) => LIMITE_MS + n * 4000 + segurarMs;
type Fase = "parado" | "piano" | "cantando" | "feito";
/** O que a pessoa tem que cantar: uma nota ou uma sequência, o que o piano toca antes e o bordão, se houver. */
type Tarefa = { alvos: number[]; demo: PianoNote[] | null; bordao: number | null; segurarMs: number; tonica: number | null; grau: string | null };
type Resultado = { ok: boolean; media: number; oscilacao: number; passos: number; alvo: number | null; ouvi: number | null };
const classe = (midi: number) => nomeNota(midi).replace(/-?\d+$/, "");

/** Treino de voz: o piano toca e a pessoa canta; o microfone confere a altura com a mesma detecção do afinador. */
export function Voz({ programa }: { programa?: ProgramaProp }) {
  const t = useTranslations("treino-de-ouvido");
  const salvo = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  // Num programa valem os ajustes padrão (a config salva da pessoa não muda): ele é uma sequência pronta.
  const emPrograma = programa !== undefined;
  const s = useMemo<Saved>(() => (emPrograma ? { ...salvo, tolerancia: DEFAULTS.tolerancia, qualquerOitava: DEFAULTS.qualquerOitava, intervalos: DEFAULTS.intervalos, padrao: DEFAULTS.padrao, inicio: DEFAULTS.inicio, subir: DEFAULTS.subir, grau: DEFAULTS.grau, ajuda: DEFAULTS.ajuda, musica: { ...salvo.musica, velocidade: DEFAULTS.musica.velocidade, guia: DEFAULTS.musica.guia } } : salvo), [salvo, emPrograma]);
  // Num programa, o exercício vem do bloco.
  const exercicioDaVez = (programa?.exercicio as Exercicio | undefined) ?? s.exercicio;
  const piano = usePiano();
  const [instrumento, setInstrumento] = useInstrumento();
  const [fase, setFase] = useState<Fase>("parado");
  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [passo, setPasso] = useState(0);
  const [leitura, setLeitura] = useState<number | null>(null);
  const [vivo, setVivo] = useState<{ cents: number | null; progresso: number }>({ cents: null, progresso: 0 });
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [placar, setPlacar] = useState({ a: 0, t: 0 });
  const [alcance, setAlcance] = useState<Alcance>(ALCANCE_ZERO);
  const [erroMic, setErroMic] = useState<MicProblem | null>(null);
  const [rodada, setRodada] = useState(0);

  const mic = useRef<Mic | null>(null);
  const pipeline = useRef<PitchPipeline | null>(null);
  const suavizador = useRef(new PitchSmoother());
  const segurando = useRef(SEGURANDO_ZERO);
  const alcanceRef = useRef(ALCANCE_ZERO);
  const passoRef = useRef(0);
  const medias = useRef<number[]>([]);
  const oscilacao = useRef(0);
  /** Cada abertura do microfone e cada limpeza muda o número: quem acorda depois do pedido de permissão e acha outro número fecha o que abriu. */
  const geracaoMic = useRef(0);
  const limite = useRef<ReturnType<typeof setTimeout> | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoCents = useRef<number | null>(null);
  const ultimoMidi = useRef<number | null>(null);
  /** Quando a tentativa começou: a duração entra no ritmo da pessoa, que calibra o tempo dos programas. */
  const inicioTentativa = useRef(0);
  // O que o microfone precisa saber a cada bloco, sem refazer a captura.
  const atual = useRef({ fase: "parado" as Fase, tarefa: null as Tarefa | null, s, exercicio: exercicioDaVez, programa });
  useEffect(() => { atual.current = { fase, tarefa, s, exercicio: exercicioDaVez, programa }; });

  const limparTempos = () => { if (limite.current) clearTimeout(limite.current); if (espera.current) clearTimeout(espera.current); limite.current = espera.current = null; };
  const fecharMic = useCallback(() => {
    geracaoMic.current++;
    mic.current?.stop();
    mic.current = null;
    pipeline.current = null;
    suavizador.current.reset();
    setLeitura(null);
  }, []);
  useEffect(() => () => { geracaoMic.current++; limparTempos(); mic.current?.stop(); }, []);

  const concluir = useCallback((ok: boolean, porTempo = false) => {
    limparTempos();
    fecharMic();
    piano.pararBordao();
    const m = medias.current;
    const n = m.length;
    const media = n ? m.reduce((a, b) => a + b, 0) / n : (ultimoCents.current ?? 0);
    const abs = n ? m.reduce((a, b) => a + Math.abs(b), 0) / n : Math.abs(media);
    setFase("feito");
    const alvoFinal = atual.current.tarefa?.alvos[passoRef.current] ?? null;
    setResultado({ ok, media: n > 1 ? abs : media, oscilacao: oscilacao.current, passos: n, alvo: alvoFinal, ouvi: ultimoMidi.current });
    setPlacar((p) => ({ a: p.a + (ok ? 1 : 0), t: p.t + 1 }));
    if (!porTempo && atual.current.exercicio !== "alcance" && atual.current.exercicio !== "musica") anotarDuracao(atual.current.exercicio, agoraMs() - inicioTentativa.current);
    atual.current.programa?.aoResponder(ok);
  }, [fecharMic, piano]);

  /** Abre o microfone; devolve false se a tentativa foi cancelada enquanto o navegador pedia a permissão (o microfone aberto é fechado). */
  const abrir = async (): Promise<boolean> => {
    if (mic.current) return true;
    const g = ++geracaoMic.current;
    const m = await openMic(CHUNK_SAMPLES, (chunk) => {
      const pipe = pipeline.current;
      if (!pipe) return;
      const amostra = pipe.process(chunk, chunk.length);
      const midi = suavizador.current.push(amostra.midi ?? null) ?? null;
      const agora = agoraMs();
      setLeitura(midi);
      if (midi !== null) ultimoMidi.current = midi;
      const v = atual.current;
      if (v.exercicio === "alcance") {
        alcanceRef.current = medirAlcance(alcanceRef.current, midi, agora);
        setAlcance(alcanceRef.current);
      } else if (v.fase === "cantando" && v.tarefa) {
        const alvo = v.tarefa.alvos[passoRef.current]!;
        const p = atualizar(segurando.current, midi, agora, alvo, v.s.tolerancia, v.s.qualquerOitava, v.tarefa.segurarMs);
        segurando.current = p.estado;
        ultimoCents.current = p.cents;
        setVivo({ cents: p.cents, progresso: p.estado.desde === null ? 0 : Math.min(1, (agora - p.estado.desde) / v.tarefa.segurarMs) });
        if (p.ok) {
          medias.current.push(p.media);
          oscilacao.current = p.oscilacao;
          if (passoRef.current + 1 < v.tarefa.alvos.length) {
            passoRef.current += 1;
            setPasso(passoRef.current);
            segurando.current = SEGURANDO_ZERO;
            setVivo({ cents: null, progresso: 0 });
          } else concluir(true);
        }
      }
    });
    if (g !== geracaoMic.current) { m.stop(); return false; }
    pipeline.current = new PitchPipeline(m.sampleRate);
    mic.current = m;
    return true;
  };

  const escutar = async (t0: Tarefa) => {
    try { if (!(await abrir())) return; setErroMic(null); } catch (e) { setErroMic(e instanceof MicError ? e.problem : "failed"); setFase("parado"); piano.pararBordao(); return; }
    segurando.current = SEGURANDO_ZERO;
    ultimoCents.current = null;
    ultimoMidi.current = null;
    setVivo({ cents: null, progresso: 0 });
    setFase("cantando");
    limite.current = setTimeout(() => concluir(false, true), limiteDe(t0.alvos.length, t0.segurarMs));
  };

  /** Toca o que a tarefa pede (ou liga o bordão) e, quando acaba, abre o microfone. */
  const prepararEOuvir = async (t0: Tarefa, recomecar: boolean) => {
    limparTempos();
    fecharMic();
    setFase("piano");
    setResultado(null);
    if (recomecar) { passoRef.current = 0; medias.current = []; oscilacao.current = 0; setPasso(0); }
    if (t0.bordao !== null) {
      const raiz = t0.bordao;
      const ligar = async () => { if (!(await piano.iniciarBordao(raiz))) { setFase("parado"); return; } espera.current = setTimeout(() => void escutar(t0), 1200); };
      if (t0.demo) {
        const dur = await piano.tocar(t0.demo);
        if (dur === null) { setFase("parado"); return; }
        espera.current = setTimeout(() => void ligar(), dur * 1000 + 150);
      } else await ligar();
      return;
    }
    const dur = await piano.tocar(t0.demo ?? []);
    if (dur === null) { setFase("parado"); return; }
    espera.current = setTimeout(() => void escutar(t0), dur * 1000 + 300);
  };
  const comecar = () => {
    const e = exercicioDaVez;
    inicioTentativa.current = agoraMs();
    if (e === "alcance") { void medir(); return; }
    let t0: Tarefa;
    if (e === "igualar" || e === "longa") {
      const midi = sortearAlvoDeVoz(Math.random, s.faixa);
      t0 = { alvos: [midi], demo: [{ midi, at: 0, dur: 2.0 }], bordao: null, segurarMs: e === "longa" ? SEGURAR_LONGA_MS : SEGURAR_MS, tonica: null, grau: null };
    } else if (e === "sequencia") {
      const padrao = PADROES.find((p) => p.id === s.padrao) ?? PADROES[0]!;
      const alvos = notasDoPadrao(inicioDaRodada(s.inicio < 0 ? sortearClasseDeVoz() : s.inicio, rodada, s.subir && s.inicio >= 0, s.faixa, Math.max(...padrao.semitons)), padrao.semitons);
      t0 = { alvos, demo: alvos.map((midi, i) => ({ midi, at: i * 0.7, dur: 0.65 })), bordao: null, segurarMs: SEGURAR_PASSO_MS, tonica: null, grau: null };
    } else if (e === "tonica") {
      const raiz = inicioDaRodada(s.inicio < 0 ? sortearClasseDeVoz() : s.inicio, rodada, s.subir && s.inicio >= 0, s.faixa, 12);
      const sorteado = s.grau === "sortear" ? sortearIntervalo(s.intervalos) : s.grau;
      const alvo = raiz + INTERVALOS.find((i) => i.id === sorteado)!.semitons;
      // Com ajuda, o piano toca a tônica e a nota juntas e só depois deixa a tônica soando; sem ajuda, só a tônica.
      const demo = s.ajuda === "guia" ? [{ midi: raiz, at: 0, dur: 2.2 }, { midi: alvo, at: 0, dur: 2.2 }] : null;
      t0 = { alvos: [alvo], demo, bordao: raiz, segurarMs: SEGURAR_MS, tonica: raiz, grau: sorteado };
    } else {
      const p = perguntaClassica({ ...CLASSICA_INICIAL, exercicio: "achar", direcao: "misto", itens: { ...CLASSICA_INICIAL.itens, achar: s.intervalos } });
      t0 = { alvos: [p.alvo!], demo: p.notas, bordao: null, segurarMs: SEGURAR_MS, tonica: null, grau: null };
    }
    setRodada((r) => r + 1);
    setTarefa(t0);
    void prepararEOuvir(t0, true);
  };
  /** Sem ajuda: toca só a nota pedida por cima da tônica, para quem travou; depois volta a ouvir. */
  const espiar = async (t0: Tarefa) => {
    limparTempos();
    fecharMic();
    setFase("piano");
    const dur = await piano.tocar([{ midi: t0.alvos[0]!, at: 0, dur: 1.6 }], true);
    if (dur === null) { setFase("parado"); return; }
    espera.current = setTimeout(() => void escutar(t0), dur * 1000 + 300);
  };
  const parar = () => { limparTempos(); fecharMic(); piano.calar(); setFase("parado"); };
  // Aba escondida no meio da tentativa: cancela sem contar erro (os relógios seguem correndo e o áudio pode suspender).
  const pararRef = useRef(parar);
  useEffect(() => { pararRef.current = parar; });
  useEffect(() => {
    const aoMudar = () => { const f = atual.current.fase; if (document.hidden && (f === "piano" || f === "cantando")) pararRef.current(); };
    document.addEventListener("visibilitychange", aoMudar);
    return () => document.removeEventListener("visibilitychange", aoMudar);
  }, []);
  const medir = async () => {
    limparTempos();
    alcanceRef.current = ALCANCE_ZERO;
    setAlcance(ALCANCE_ZERO);
    setResultado(null);
    try { if (!(await abrir())) return; setErroMic(null); } catch (e) { setErroMic(e instanceof MicError ? e.problem : "failed"); return; }
    setFase("cantando");
  };
  const terminarAlcance = () => { fecharMic(); setFase("feito"); };
  /** Mudar exercício ou ajuste interrompe o que está em andamento. */
  const mudar = (next: Saved) => { store.set(next); parar(); setTarefa(null); setResultado(null); setAlcance(ALCANCE_ZERO); setRodada(0); };

  // Dentro de um programa o bloco começa sozinho: o toque em "Começar" ou "Próximo bloco" já liberou o áudio.
  useEffect(() => {
    if (!programa || exercicioDaVez === "musica") return;
    const id = setTimeout(() => comecar(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ex = exercicioDaVez;
  const cantando = fase === "cantando";
  const alvoAtual = tarefa ? tarefa.alvos[passo]! : null;
  const dicaBase = ex === "tonica" ? t(s.ajuda === "guia" ? "voz.dicaTonicaGuia" : "voz.dicaTonicaSo") : t(`voz.dica.${ex}` as "voz.dica.igualar");
  const dica = !cantando ? (fase === "piano" ? t(tarefa?.bordao != null ? "voz.ligandoBordao" : "voz.ouvindo") : "")
    : ex === "alcance" ? (leitura === null ? t("voz.silencio") : t("voz.alcanceDica"))
    : vivo.cents === null ? t("voz.silencio")
    : Math.abs(vivo.cents) <= s.tolerancia ? t(ex === "longa" ? "voz.sustente" : "voz.segure")
    : vivo.cents > 0 ? t("voz.maisBaixo") : t("voz.maisAlto");
  const marcas = new Map<number, Marca>();
  if (ex === "alcance" && alcance.min !== null && alcance.max !== null) { marcas.set(alcance.min, "alvo"); marcas.set(alcance.max, "alvo"); }
  // Arpejo no instrumento: no violão, a forma do arpejo (várias notas por corda); no teclado, as teclas do padrão. A nota da vez ganha um anel.
  const mostraPadrao = ex === "sequencia" && tarefa !== null && fase !== "parado";
  const forma = mostraPadrao && instrumento === "violao" ? formaDoArpejo(tarefa.alvos) : null;
  const classeAtual = alvoAtual === null ? -1 : ((alvoAtual % 12) + 12) % 12;
  const extrasPadrao = forma ? forma.posicoes.map((p) => ({ corda: p.corda, casa: p.casa, midi: p.midi, marca: (cantando && p.midi % 12 === classeAtual ? "dada" : "alvo") as Marca })) : [];
  if (mostraPadrao && tarefa) { tarefa.alvos.forEach((m) => marcas.set(m, "alvo")); if (cantando && alvoAtual !== null) marcas.set(alvoAtual, "dada"); }
  const ext = alcance.min !== null && alcance.max !== null ? extensao(alcance.max - alcance.min) : null;
  const sinal = (n: number) => (Math.abs(n) < 1 ? t("voz.mediaCentro") : t(n > 0 ? "voz.mediaAcima" : "voz.mediaAbaixo", { n: Math.round(Math.abs(n)) }));
  const textoResultado = !resultado ? "" : !resultado.ok ? (resultado.ouvi === null || resultado.alvo === null ? t(programa ? "voz.naoOuviSegue" : "voz.naoOuvi") : t(programa ? "voz.naoFoiSegue" : "voz.naoFoi", { alvo: classe(resultado.alvo), ouvi: nomeNota(Math.round(resultado.ouvi)) }))
    : ex === "longa" ? t("voz.longaFeito", { n: Math.round(resultado.oscilacao) })
    : ex === "sequencia" ? t("voz.sequenciaFeito", { passos: resultado.passos, n: Math.round(resultado.media) })
    : `${t("voz.afinou")} ${sinal(resultado.media)}`;

  return (
    <div className="treino voz">
      {!programa && <div className="treino-topo">
        <div className="treino-escolhas">
          <div className="treino-exs" role="radiogroup" aria-label={t("exercicio")} onKeyDown={onRadioKeyDown}>
            <div className="treino-exs-linha treino-exs-grade" role="presentation">
            {/* O Alcance não entra aqui: ele mede a voz e fica em Minha voz, nos ajustes. Sem nenhum marcado (no Alcance), o primeiro recebe o foco do Tab. */}
            {NA_LISTA.map((e, i) => (
              <button key={e} type="button" role="radio" aria-checked={ex === e} tabIndex={ex === e || (ex === "alcance" && i === 0) ? 0 : -1} onClick={() => { mudar({ ...s, exercicio: e }); setPlacar({ a: 0, t: 0 }); }}>{t(`voz.exercicios.${e}`)}</button>
            ))}
            </div>
          </div>
        </div>
        {ex !== "alcance" && placar.t > 0 && (
          <dl className="treino-placar" aria-label={t("placarTitulo")}>
            <div><dd>{t("placar", { acertos: placar.a, total: placar.t })}</dd><dt>{t("acertos")}</dt></div>
          </dl>
        )}
      </div>}

      {/* O que cantar fica à vista, junto do palco; nos ajustes só o que vale para todos os exercícios. */}
      {!programa && (ex === "sequencia" || ex === "tonica" || ex === "musica") && (
        <div className="treino-oque">
          {ex === "sequencia" && (
            <label className="treino-field">
              <span>{t("voz.padrao")}</span>
              <select value={s.padrao} onChange={(e) => mudar({ ...s, padrao: e.target.value })}>
                {PADROES.map((p) => <option key={p.id} value={p.id}>{t(`voz.padroes.${p.id}` as "voz.padroes.arpejoMaior")}</option>)}
              </select>
            </label>
          )}
          {ex === "tonica" && (
            <label className="treino-field">
              <span>{t("voz.cantarA")}</span>
              <select value={s.grau} onChange={(e) => mudar({ ...s, grau: e.target.value })}>
                {IDS.intervalos.map((id) => <option key={id} value={id}>{t(`nomes.intervalos.${id}` as "nomes.intervalos.3m")}</option>)}
                <option value="sortear">{t("voz.sortear")}</option>
              </select>
            </label>
          )}
          <label className="treino-field">
            <span>{ex === "sequencia" ? t("voz.inicio") : t("voz.tonica")}</span>
            <select value={s.inicio} onChange={(e) => mudar({ ...s, inicio: Number(e.target.value) })}>
              <option value={-1}>{t("voz.aleatoria")}</option>
              {NOTE_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
            </select>
          </label>
        </div>
      )}
      {!programa && (ex === "intervalo" || (ex === "tonica" && s.grau === "sortear")) && (
        <p className="treino-detalhe">{t("voz.sorteando", { lista: s.intervalos.map((id) => t(`nomes.intervalos.${id}` as "nomes.intervalos.3m")).join(", ") })}</p>
      )}

      {ex === "musica" && (
        <section className="treino-palco" aria-label={t("voz.exercicios.musica")}>
          <Cantar
            cfg={s.musica}
            onCfg={(p) => store.set((x) => ({ ...x, musica: { ...x.musica, ...p } }))}
            tonica={s.inicio}
            tolerancia={s.tolerancia}
            qualquerOitava={s.qualquerOitava}
            faixa={s.faixa}
            programa={programa}
            melhores={s.melhores}
            onResultado={(chave, r) => {
              setPlacar((p) => ({ a: p.a + (r.ok ? 1 : 0), t: p.t + 1 }));
              store.set((x) => ({ ...x, melhores: { ...x.melhores, [chave]: Math.max(x.melhores[chave] ?? 0, r.total ? r.acertadas / r.total : 0) } }));
            }}
          />
        </section>
      )}
      {ex !== "musica" && <section className="treino-palco" aria-label={t("voz.titulo")}>
        <div className="treino-pergunta">
          {/* Parado, o seletor já diz qual é o exercício: o título só aparece no Alcance (fora do seletor) e na hora de cantar. */}
          {(ex === "alcance" || programa || (tarefa && (fase === "piano" || fase === "cantando"))) && (
            <h2>{ex === "alcance" ? t("voz.exercicios.alcance") : tarefa && (fase === "piano" || fase === "cantando") ? t("voz.cante") : t(`voz.exercicios.${ex}`)}</h2>
          )}
          <p>{ex === "tonica" && tarefa && tarefa.tonica !== null && tarefa.grau !== null && fase !== "parado"
            ? t("voz.tonicaDica", { tonica: classe(tarefa.tonica), grau: t(`nomes.intervalos.${tarefa.grau}` as "nomes.intervalos.3m"), nota: classe(tarefa.alvos[0]!) })
            : dicaBase}</p>
        </div>

        {ex === "sequencia" && tarefa && fase !== "parado" && (
          <ol className="treino-passos" aria-label={t("voz.passos")}>
            {tarefa.alvos.map((m, i) => (
              <li key={i} className={i < passo || (fase === "feito" && resultado?.ok) ? "feito" : i === passo && cantando ? "atual" : ""} aria-current={i === passo && cantando ? "step" : undefined}>{classe(m)}</li>
            ))}
          </ol>
        )}

        {mostraPadrao && tarefa && (
          <Instrumento tipo={instrumento} janela={tarefa.alvos} marcas={marcas} extras={extrasPadrao} onTocar={() => {}} label={t(instrumento === "violao" ? "braco" : "teclado")} />
        )}

        <Afinometro
          midi={leitura}
          centsAlvo={ex === "alcance" || !cantando ? null : vivo.cents}
          tolerancia={s.tolerancia}
          progresso={ex === "alcance" ? 0 : vivo.progresso}
          rotulos={{ sem: t("voz.sem"), baixo: t("voz.baixo"), alto: t("voz.alto") }}
          dica={dica}
        />

        {ex === "alcance" && (alcance.min !== null || fase === "feito") && (
          <div className="treino-revela">
            {ext && alcance.min !== null && alcance.max !== null ? (
              <>
                <p className="treino-resultado certa">{t("voz.alcanceResultado", { grave: nomeNota(alcance.min), agudo: nomeNota(alcance.max) })}</p>
                <Instrumento tipo={instrumento} janela={[alcance.min, alcance.max]} marcas={marcas} onTocar={() => {}} label={t(instrumento === "violao" ? "braco" : "teclado")} />
                <p className="treino-detalhe">{t("voz.extensao", { oitavas: ext.oitavas, semitons: ext.semitons })}</p>
                {(() => {
                  const sug = faixaConfortavel(alcance.min, alcance.max);
                  const salva = s.faixa.tipo === "medida" && s.faixa.min === sug.min && s.faixa.max === sug.max;
                  return (
                    <div className="treino-sugestao">
                      <p>{t("voz.minhaVoz.sugestao", { de: nomeNota(sug.min), ate: nomeNota(sug.max), voz: t(`voz.minhaVoz.tipos.${vozMaisProxima(sug)}` as "voz.minhaVoz.tipos.tenor") })}</p>
                      {salva ? <p role="status">{t("voz.minhaVoz.salva")}</p> : <button type="button" className="treino-btn" onClick={() => store.set((x) => ({ ...x, faixa: { tipo: "medida", ...sug } }))}>{t("voz.minhaVoz.usar")}</button>}
                    </div>
                  );
                })()}
              </>
            ) : <p className="treino-vazio">{t("voz.alcanceVazio")}</p>}
          </div>
        )}

        {resultado && <p className={`treino-resultado ${resultado.ok ? "certa" : "errada"}`} role="status">{textoResultado}</p>}
        {erroMic && <p className="treino-estado" role="alert">{t(`voz.erroMic.${erroMic}`)}</p>}
        {piano.erro && <p className="treino-estado" role="alert">{piano.erro === "audio" ? t("erroAudio") : t("erroPiano")}</p>}

        <div className="treino-acoes">
          {fase === "feito" && resultado && !resultado.ok && ex !== "alcance" && tarefa && !programa && (
            <button type="button" className="go treino-proxima" onClick={() => { inicioTentativa.current = agoraMs(); void prepararEOuvir(tarefa, true); }} disabled={piano.carregando}>{t("voz.tentarDeNovo")}</button>
          )}
          {(fase === "parado" || fase === "feito") && (() => {
            // Na última tentativa de um bloco do programa, o botão leva ao próximo bloco.
            const fechaBloco = programa !== undefined && fase === "feito" && programa.restante === 0;
            return (
              <button type="button" className={!fechaBloco && fase === "feito" && resultado && !resultado.ok && ex !== "alcance" && !programa ? "treino-btn" : "go treino-proxima"} onClick={fechaBloco ? programa.aoAvancar : comecar} disabled={piano.carregando}>
                {fechaBloco ? programa.rotuloFim : ex === "alcance" ? t("voz.medir") : fase === "feito" ? t("voz.proxima") : t("voz.comecar")}
              </button>
            );
          })()}
          {fase === "piano" && <button type="button" className="go treino-proxima" disabled>{t(tarefa?.bordao != null ? "voz.ligandoBordao" : "voz.ouvindo")}</button>}
          {cantando && ex !== "alcance" && tarefa && (
            <>
              <button type="button" className="treino-btn" onClick={() => (ex === "tonica" && s.ajuda === "so" ? void espiar(tarefa) : void prepararEOuvir(tarefa, ex !== "sequencia"))}>{t(ex === "tonica" ? (s.ajuda === "so" ? "voz.espiar" : "voz.ouvirAlvo") : "voz.ouvirDeNovo")}</button>
              <button type="button" className="treino-btn" onClick={parar}>{t("voz.parar")}</button>
            </>
          )}
          {cantando && ex === "alcance" && <button type="button" className="go treino-proxima" onClick={terminarAlcance}>{t("voz.terminar")}</button>}
        </div>
        {alvoAtual !== null && ex === "tonica" && cantando && <p className="treino-estado">{t("voz.bordaoNota")}</p>}
        {fase === "parado" && <p className="treino-estado">{t("voz.fone")}</p>}
      </section>}

      {!programa && <details className="treino-ajustes">
        <summary>
          {t("ajustes")}
          {/* Fechado, o resumo mostra a voz e a margem em uso, sem precisar abrir. */}
          <span className="treino-ajustes-resumo">{t("voz.ajustesResumo", { voz: s.faixa.tipo === "padrao" ? t("voz.minhaVoz.padrao") : s.faixa.tipo === "medida" ? t("voz.minhaVoz.medidaCurta") : t(`voz.minhaVoz.tipos.${s.faixa.tipo}` as "voz.minhaVoz.tipos.tenor"), de: nomeNota(s.faixa.min), ate: nomeNota(s.faixa.max), n: s.tolerancia })}</span>
        </summary>
        <div className="treino-ajustes-corpo">
          {ex !== "musica" && <div className="treino-field" role="group" aria-label={t("instrumento")}>
            <span>{t("instrumento")}</span>
            <div className="treino-chips">
              <button type="button" className="treino-chip" aria-pressed={instrumento === "teclado"} onClick={() => setInstrumento("teclado")}>{t("instrumentos.teclado")}</button>
              <button type="button" className="treino-chip" aria-pressed={instrumento === "violao"} onClick={() => setInstrumento("violao")}>{t("instrumentos.violao")}</button>
            </div>
          </div>}
          {ex === "musica" && (
            <div className="treino-field" role="group" aria-label={t("voz.musica.guia")}>
              <span>{t("voz.musica.guia")}</span>
              <div className="treino-chips">
                <button type="button" className="treino-chip" aria-pressed={s.musica.guia} onClick={() => store.set((x) => ({ ...x, musica: { ...x.musica, guia: !x.musica.guia } }))}>{t(s.musica.guia ? "ligado" : "desligado")}</button>
              </div>
            </div>
          )}
          <div className="treino-field" role="group" aria-label={t("voz.minhaVoz.titulo")}>
            <span>{t("voz.minhaVoz.titulo")}</span>
            <div className="treino-chips">
              <button type="button" className="treino-chip" aria-pressed={s.faixa.tipo === "padrao"} onClick={() => mudar({ ...s, faixa: { tipo: "padrao", ...FAIXA_PADRAO } })}>{t("voz.minhaVoz.padrao")}</button>
              {VOZES.map((v) => <button key={v.id} type="button" className="treino-chip" aria-pressed={s.faixa.tipo === v.id} onClick={() => mudar({ ...s, faixa: { tipo: v.id, min: v.min, max: v.max } })}>{t(`voz.minhaVoz.tipos.${v.id}` as "voz.minhaVoz.tipos.tenor")}</button>)}
              {s.faixa.tipo === "medida" && <button type="button" className="treino-chip" aria-pressed>{t("voz.minhaVoz.medida")}</button>}
            </div>
            <p className="treino-detalhe">{t("voz.minhaVoz.atual", { de: nomeNota(s.faixa.min), ate: nomeNota(s.faixa.max) })} {t("voz.minhaVoz.dica")}</p>
            {ex !== "alcance" && <button type="button" className="treino-btn treino-medir" onClick={() => mudar({ ...s, exercicio: "alcance" })}>{t("voz.minhaVoz.medir")}</button>}
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
          {(ex === "sequencia" || ex === "tonica") && s.inicio >= 0 && (
            <div className="treino-field" role="group" aria-label={t("voz.subir")}>
              <span>{t("voz.subir")}</span>
              <div className="treino-chips">
                <button type="button" className="treino-chip" aria-pressed={s.subir} onClick={() => mudar({ ...s, subir: !s.subir })}>{t(s.subir ? "ligado" : "desligado")}</button>
              </div>
            </div>
          )}
          {ex === "tonica" && (
            <div className="treino-field" role="group" aria-label={t("voz.ajuda")}>
              <span>{t("voz.ajuda")}</span>
              <div className="treino-chips">
                <button type="button" className="treino-chip" aria-pressed={s.ajuda === "guia"} onClick={() => mudar({ ...s, ajuda: "guia" })}>{t("voz.ajudas.guia")}</button>
                <button type="button" className="treino-chip" aria-pressed={s.ajuda === "so"} onClick={() => mudar({ ...s, ajuda: "so" })}>{t("voz.ajudas.so")}</button>
              </div>
            </div>
          )}
          {(ex === "intervalo" || (ex === "tonica" && s.grau === "sortear")) && (
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
      </details>}
      <p className="treino-creditos">{t("creditos")} {t("voz.privado")}</p>
    </div>
  );
}

/** Sorteio entre os intervalos escolhidos (fora do render, para não chamar `Math.random` nele). */
function sortearIntervalo(ids: readonly string[]): string {
  return ids[Math.floor(Math.random() * ids.length)]!;
}
