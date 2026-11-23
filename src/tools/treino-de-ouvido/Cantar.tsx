"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MicError, openMic, type Mic, type MicProblem, type PianoNote } from "@/core/audio";
import { CHUNK_SAMPLES, PitchPipeline, PitchSmoother } from "@/core/pitch";
import { acertoDaNota, duracaoDe, janelas, resumir, tonicaParaCaber, type Acerto, type Amostra, type Janela, type Resumo } from "./cantar";
import { nomeNota } from "./engine";
import { MUSICAS, musicaDe } from "./musicas";
import type { ProgramaProp } from "./Programas";
import { anotarDuracao } from "./ritmo";
import { desenharPista, lerCores } from "./pista";
import { usePiano } from "./usePiano";
import { sortearClasseDeVoz } from "./voz";

export type ConfigMusica = { musica: string; trecho: number; velocidade: number; guia: boolean };
export const VELOCIDADES = [0.6, 1] as const;
type Fase = "parado" | "ouvindo" | "contagem" | "cantando" | "feito";
/** Tempos de contagem antes da primeira nota. */
const CONTAGEM = 4;
/** O relógio, fora do componente (a regra de pureza do React não aceita chamá-lo direto nele). */
const agoraMs = () => performance.now();
/** Num programa, cada tentativa é um trecho sorteado entre os conferidos (nunca o mesmo duas vezes seguidas). */
function sortearTrecho(excluir?: string): { musica: string; trecho: number } {
  const todos = MUSICAS.filter((m) => m.confianca !== "baixa").flatMap((m) => m.trechos.map((_, i) => ({ musica: m.id, trecho: i }))).filter((x) => `${x.musica}:${x.trecho}` !== excluir);
  return todos[Math.floor(Math.random() * todos.length)]!;
}

/**
 * Cantar músicas no padrão Yousician: o piano dá o tom, as notas correm até a linha de leitura e a pessoa canta cada uma quando
 * chega; a nota vale se a altura certa foi cantada durante a janela dela. Sem detector de início de nota: duas notas iguais
 * seguidas são duas janelas de tempo.
 */
export function Cantar({ cfg: cfgSalva, onCfg, tonica, tolerancia, qualquerOitava, melhores, onResultado, programa }: {
  cfg: ConfigMusica; onCfg: (p: Partial<ConfigMusica>) => void;
  /** Dentro de um programa: o trecho é sorteado a cada tentativa, começa sozinho e o botão final avança o bloco. */
  programa?: ProgramaProp;
  /** Classe de altura da tônica (0 = Dó), ou -1 para uma diferente a cada tentativa. */
  tonica: number; tolerancia: number; qualquerOitava: boolean;
  melhores: Record<string, number>;
  onResultado: (chave: string, resumo: Resumo) => void;
}) {
  const t = useTranslations("treino-de-ouvido");
  const { tocar: tocarPiano, calar, carregando, erro: erroPiano } = usePiano();
  const [sorteado, setSorteado] = useState(() => (programa ? sortearTrecho() : null));
  const cfg = programa && sorteado ? { ...cfgSalva, ...sorteado } : cfgSalva;
  const musica = musicaDe(cfg.musica);
  const trecho = musica.trechos[Math.min(cfg.trecho, musica.trechos.length - 1)]!;
  const chave = `${musica.id}:${Math.min(cfg.trecho, musica.trechos.length - 1)}`;
  const bpm = musica.bpm * cfg.velocidade;

  const [fase, setFase] = useState<Fase>("parado");
  const [tonicaMidi, setTonicaMidi] = useState(() => tonicaParaCaber(tonica < 0 ? 0 : tonica, trecho.notas));
  const [contagem, setContagem] = useState(0);
  const [atual, setAtual] = useState(-1);
  const [erroMic, setErroMic] = useState<MicProblem | null>(null);
  const [final, setFinal] = useState<{ acertos: Acerto[]; resumo: Resumo } | null>(null);

  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const tamanho = useRef({ w: 320, h: 220 });
  const faseRef = useRef<Fase>("parado");
  const inicio = useRef(0); // performance.now() do primeiro tempo da primeira nota (pode estar no futuro, na contagem)
  const amostras = useRef<Amostra[]>([]);
  const voz = useRef<number | null>(null);
  const mic = useRef<Mic | null>(null);
  const pipeline = useRef<PitchPipeline | null>(null);
  const suavizador = useRef(new PitchSmoother());
  const fim = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quadro = useRef(0);
  const inicioTentativa = useRef(0);
  const trocouPorPrograma = useRef(false);
  const atualRef = useRef(-1);

  const js: Janela[] = janelas(trecho.notas, bpm, tonicaMidi);
  const jsRef = useRef(js);
  const cfgRef = useRef({ tolerancia, qualquerOitava, final });
  useEffect(() => { jsRef.current = js; cfgRef.current = { tolerancia, qualquerOitava, final }; });

  const desenhar = useCallback(() => {
    const c = tela.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const { w, h } = tamanho.current;
    const f = faseRef.current, k = cfgRef.current;
    const rolando = f === "ouvindo" || f === "contagem" || f === "cantando";
    desenharPista(ctx, {
      w, h, js: jsRef.current, modo: rolando ? "rolando" : "inteiro",
      t: rolando ? (performance.now() - inicio.current) / 1000 : 0,
      amostras: amostras.current, tolerancia: k.tolerancia, qualquerOitava: k.qualquerOitava,
      avaliar: f === "cantando" || f === "feito", voz: voz.current, nome: nomeNota, cores: lerCores(c),
    });
    if (rolando) {
      const ts = (performance.now() - inicio.current) / 1000;
      const i = jsRef.current.findIndex((j) => j.midi !== null && ts >= j.ini && ts < j.fim);
      if (i !== atualRef.current) { atualRef.current = i; setAtual(i); }
    }
  }, []);

  // O canvas acompanha a largura da caixa (e a densidade de pixels da tela).
  useEffect(() => {
    const el = caixa.current, c = tela.current; if (!el || !c) return;
    const ajusta = () => {
      const w = Math.max(240, Math.round(el.clientWidth)), h = w < 420 ? 232 : 264, d = window.devicePixelRatio || 1;
      tamanho.current = { w, h };
      c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.height = `${h}px`;
      c.getContext("2d")?.setTransform(d, 0, 0, d, 0, 0);
      desenhar();
    };
    ajusta();
    const o = new ResizeObserver(ajusta); o.observe(el);
    const tema = matchMedia("(prefers-color-scheme: dark)"); tema.addEventListener("change", ajusta);
    return () => { o.disconnect(); tema.removeEventListener("change", ajusta); };
  }, [desenhar]);

  // Parado ou terminado, desenha de novo quando algo muda (a música, o tom, o resultado).
  useEffect(() => { if (faseRef.current === "parado" || faseRef.current === "feito") desenhar(); });
  // Rolando, desenha a cada quadro.
  useEffect(() => {
    if (fase !== "ouvindo" && fase !== "contagem" && fase !== "cantando") return;
    const laco = () => { desenhar(); quadro.current = requestAnimationFrame(laco); };
    quadro.current = requestAnimationFrame(laco);
    return () => cancelAnimationFrame(quadro.current);
  }, [fase, desenhar]);

  const mudaFase = (f: Fase) => { faseRef.current = f; setFase(f); };
  const limpar = useCallback(() => {
    if (fim.current) clearTimeout(fim.current); fim.current = null;
    mic.current?.stop(); mic.current = null; pipeline.current = null; suavizador.current.reset(); voz.current = null;
    calar();
  }, [calar]);
  useEffect(() => () => { limpar(); }, [limpar]);
  // Trocar de música ou de trecho no meio do que está rolando para tudo.
  const chaveAnterior = useRef(chave);
  useEffect(() => {
    if (chaveAnterior.current === chave) return;
    chaveAnterior.current = chave;
    limpar(); mudaFase("parado"); setFinal(null); setContagem(0); atualRef.current = -1; setAtual(-1);
    setTonicaMidi(tonicaParaCaber(tonica < 0 ? 0 : tonica, trecho.notas));
  }, [chave, limpar, tonica, trecho.notas]);
  // Mudar a tônica também move a melodia (sem interromper nada que esteja cantando).
  useEffect(() => { if (faseRef.current === "parado" || faseRef.current === "feito") setTonicaMidi(tonicaParaCaber(tonica < 0 ? 0 : tonica, trecho.notas)); }, [tonica, trecho.notas]);

  const notasDoPiano = (lista: readonly Janela[], depois: number): PianoNote[] =>
    lista.filter((j) => j.midi !== null).map((j) => ({ midi: j.midi!, at: depois + j.ini, dur: Math.max(0.15, (j.fim - j.ini) * 0.92) }));

  const finalizar = useCallback(() => {
    const lista = jsRef.current;
    const acertos = lista.map((j) => acertoDaNota(amostras.current, j, cfgRef.current.tolerancia, cfgRef.current.qualquerOitava));
    const resumo = resumir(lista, acertos);
    limpar();
    setFinal({ acertos, resumo });
    mudaFase("feito");
    onResultado(chave, resumo);
    anotarDuracao("musica", agoraMs() - inicioTentativa.current);
    programa?.aoResponder(resumo.ok);
  }, [chave, limpar, onResultado, programa]);

  const ouvir = async () => {
    limpar(); setFinal(null); amostras.current = []; atualRef.current = -1;
    const dur = await tocarPiano(notasDoPiano(js, 0.3));
    if (dur === null) return;
    inicio.current = performance.now() + 300;
    mudaFase("ouvindo");
    fim.current = setTimeout(() => { limpar(); mudaFase("parado"); atualRef.current = -1; setAtual(-1); }, (duracaoDe(js) + 0.7) * 1000);
  };

  const cantar = async () => {
    limpar(); setFinal(null); setErroMic(null); amostras.current = []; atualRef.current = -1;
    inicioTentativa.current = agoraMs();
    // Cada tentativa com tônica "aleatória" muda de tom; a melodia é a mesma.
    const tom = tonica < 0 ? tonicaParaCaber(sortearClasseDeVoz(), trecho.notas) : tonicaParaCaber(tonica, trecho.notas);
    setTonicaMidi(tom);
    const lista = janelas(trecho.notas, bpm, tom);
    jsRef.current = lista;
    if ((await tocarPiano([])) === null) { mudaFase("parado"); return; } // carrega as amostras antes: assim o relógio e o microfone começam juntos
    try {
      const m = await openMic(CHUNK_SAMPLES, (chunk) => {
        const pipe = pipeline.current; if (!pipe) return;
        const midi = suavizador.current.push(pipe.process(chunk, chunk.length).midi ?? null) ?? null;
        voz.current = midi;
        if (faseRef.current === "cantando" || faseRef.current === "contagem") amostras.current.push({ t: (performance.now() - inicio.current) / 1000, midi });
      });
      pipeline.current = new PitchPipeline(m.sampleRate); mic.current = m;
    } catch (e) { setErroMic(e instanceof MicError ? e.problem : "failed"); mudaFase("parado"); return; }
    const seg = 60 / bpm, espera = CONTAGEM * seg;
    // A tônica soa na contagem (a pessoa ouve o tom) e, com o piano junto, as notas acompanham a pista.
    const notas: PianoNote[] = [{ midi: tom, at: 0, dur: seg * 1.8 }, ...(cfg.guia ? notasDoPiano(lista, espera) : [])];
    if ((await tocarPiano(notas)) === null) { limpar(); mudaFase("parado"); return; }
    inicio.current = performance.now() + espera * 1000;
    mudaFase("contagem");
    setContagem(CONTAGEM);
    let tempo = CONTAGEM;
    const pulso = setInterval(() => { tempo -= 1; if (tempo > 0) setContagem(tempo); else { clearInterval(pulso); setContagem(0); if (faseRef.current === "contagem") mudaFase("cantando"); } }, seg * 1000);
    fim.current = setTimeout(() => { clearInterval(pulso); finalizar(); }, (espera + duracaoDe(lista) + 0.45) * 1000);
  };
  // Num programa a tentativa começa sozinha (o toque em "Começar programa" ou "Próximo bloco" já liberou o áudio e o microfone).
  useEffect(() => {
    if (!programa) return;
    const id = setTimeout(() => void cantar(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Depois de trocar o trecho sorteado, a nova tentativa começa sozinha.
  useEffect(() => {
    if (!trocouPorPrograma.current) return;
    trocouPorPrograma.current = false;
    const id = setTimeout(() => void cantar(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const proximaDoPrograma = () => {
    if (!programa) return;
    if (programa.restante === 0) { programa.aoAvancar(); return; }
    trocouPorPrograma.current = true;
    setSorteado(sortearTrecho(chave));
  };
  const parar = () => { limpar(); mudaFase("parado"); setContagem(0); atualRef.current = -1; setAtual(-1); };

  const notasSemPausa = js.map((j, i) => ({ j, i })).filter((x) => x.j.midi !== null);
  const rodando = fase === "contagem" || fase === "cantando" || fase === "ouvindo";
  const melhor = melhores[chave];
  const temLetra = js.some((j) => j.sil);
  const total = notasSemPausa.length;

  return (
    <div className="cantar">
      {!programa && <div className="cantar-escolha">
        <div className="cantar-linha">
          <label className="treino-field cantar-musica">
            <span>{t("voz.musica.musica")}</span>
            <select value={musica.id} onChange={(e) => onCfg({ musica: e.target.value, trecho: 0 })} disabled={rodando}>
              {MUSICAS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          <div className="treino-field" role="group" aria-label={t("voz.musica.velocidade")}>
            <span>{t("voz.musica.velocidade")}</span>
            <div className="treino-chips">
              {VELOCIDADES.map((v) => (
                <button key={v} type="button" className="treino-chip" aria-pressed={cfg.velocidade === v} disabled={rodando} onClick={() => onCfg({ velocidade: v })}>{t(v < 1 ? "voz.musica.lento" : "voz.musica.normal")}</button>
              ))}
            </div>
          </div>
        </div>
        {musica.trechos.length > 1 && (
          <div className="treino-field" role="group" aria-label={t("voz.musica.trecho")}>
            <span>{t("voz.musica.trecho")}</span>
            <div className="treino-chips">
              {musica.trechos.map((x, i) => (
                <button key={i} type="button" className="treino-chip" aria-pressed={cfg.trecho === i} disabled={rodando} onClick={() => onCfg({ trecho: i })}>{x.nome}</button>
              ))}
            </div>
          </div>
        )}
      </div>}

      {musica.confianca !== "alta" && <p className="cantar-dica cantar-conferir">{t(musica.confianca === "baixa" ? "voz.musica.conferirBaixa" : "voz.musica.conferirMedia")}</p>}

      <div className="cantar-pista" ref={caixa} role="img" aria-label={t("voz.musica.pista")}>
        <canvas ref={tela} aria-hidden="true" />
        {contagem > 0 && <p className="cantar-contagem" aria-hidden="true" key={contagem}>{contagem}</p>}
      </div>

      {temLetra && <p className="cantar-letra" aria-label={t("voz.musica.letra")}>
        {js.map((j, i) => (j.midi === null ? null : (
          <span key={i} className={i === atual ? "atual" : final ? (final.acertos[i]?.ok ? "ok" : "falhou") : ""}>{j.sil || "–"} </span>
        )))}
      </p>}

      <p className="treino-estado" role="status">
        {fase === "contagem" ? t("voz.musica.contagem", { n: contagem || 1 }) : fase === "cantando" ? t("voz.musica.cantando") : fase === "ouvindo" ? t("voz.musica.ouvindo") : t("voz.musica.tom", { nota: nomeNota(tonicaMidi).replace(/-?\d+$/, "") })}
      </p>

      {final && (
        <div className="treino-revela">
          <p className={`treino-resultado ${final.resumo.ok ? "certa" : "errada"}`} role="status">{t("voz.musica.resultado", { acertadas: final.resumo.acertadas, total: final.resumo.total })}</p>
          {melhor !== undefined && <p className="treino-detalhe">{t("voz.musica.melhor", { acertadas: Math.round(melhor * total), total })}</p>}
        </div>
      )}
      {erroMic && <p className="treino-estado" role="alert">{t(`voz.erroMic.${erroMic}`)}</p>}
      {erroPiano && <p className="treino-estado" role="alert">{erroPiano === "audio" ? t("erroAudio") : t("erroPiano")}</p>}

      <div className="treino-acoes">
        {!rodando && programa && final && <button type="button" className="go treino-proxima" onClick={proximaDoPrograma}>{programa.restante === 0 ? programa.rotuloFim : t("voz.musica.proximaMusica")}</button>}
        {!rodando && programa && !final && <button type="button" className="go treino-proxima" onClick={() => void cantar()} disabled={carregando}>{t("voz.musica.cantar")}</button>}
        {!rodando && !programa && <button type="button" className="go treino-proxima" onClick={() => void cantar()} disabled={carregando}>{final ? t("voz.musica.cantarDeNovo") : t("voz.musica.cantar")}</button>}
        {!rodando && !programa && final && cfg.trecho + 1 < musica.trechos.length && <button type="button" className="treino-btn" onClick={() => onCfg({ trecho: cfg.trecho + 1 })}>{t("voz.musica.proximoTrecho")}</button>}
        {!rodando && !programa && <button type="button" className="treino-btn" onClick={() => void ouvir()} disabled={carregando}>{t("voz.musica.ouvir")}</button>}
        {rodando && <button type="button" className="go treino-proxima" onClick={parar}>{t("voz.parar")}</button>}
      </div>
      <p className="cantar-dica">{t("voz.musica.dica")}</p>
      <p className="treino-estado">{t("voz.fone")}</p>
    </div>
  );
}
