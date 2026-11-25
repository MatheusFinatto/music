"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getAudio, loadPiano, PIANO_SAMPLES, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { createStore } from "@/core/storage";
import { Info } from "@/components/Info";
import {
  CLASSICA_INICIAL, compararAfinacao, DIRECOES, EXERCICIOS, HARMONIA, IDS, INTERVALOS, MARGENS, nomeAcorde, nomeNota, nomeTom, PLACAR_ZERO, RESPOSTAS_AFINACAO, perguntaClassica, registrar, somar,
  type ConfigClassica, type Direcao, type Exercicio, type Historico, type PerguntaClassica,
} from "./engine";
import { Programa, type ProgramaProp } from "./Programas";
import { anotarDuracao } from "./ritmo";
import { Regua } from "./Regua";
import { Instrumento } from "./Instrumento";
import { useInstrumento } from "./instrumento";
import type { Marca } from "./Teclado";
import { acordeNoBraco } from "./violao";
import { Interruptor } from "./Interruptor";
import "./treino.css";

/** O relógio, fora dos componentes (a regra de pureza do React não aceita chamá-lo direto neles). */
const agoraMs = () => performance.now();

// O estilo "funcional" (graus numa tonalidade) saiu da tela: o dono ficou com o clássico. A lógica segue no núcleo (src/core/treino).
type Saved = { version: 1; classica: ConfigClassica; historico: Historico; reforco: boolean };
const DEFAULTS: Saved = { version: 1, classica: CLASSICA_INICIAL, historico: {}, reforco: true };

/** Só ids que existem; lista vazia volta ao padrão. */
const ids = (v: unknown, validos: readonly string[], padrao: string[]): string[] => {
  const ok = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && validos.includes(x)) : [];
  return ok.length ? ok : padrao;
};
const store = createStore<Saved>("treino-de-ouvido", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  if (!s || typeof s !== "object") return null;
  const c = (s.classica ?? {}) as Partial<ConfigClassica>;
  const h = s.historico && typeof s.historico === "object" ? s.historico : {};
  return {
    version: 1,
    classica: {
      exercicio: EXERCICIOS.includes(c.exercicio as Exercicio) ? (c.exercicio as Exercicio) : "intervalos",
      itens: {
        intervalos: ids(c.itens?.intervalos, IDS.intervalos, CLASSICA_INICIAL.itens.intervalos),
        acordes: ids(c.itens?.acordes, IDS.acordes, CLASSICA_INICIAL.itens.acordes),
        afinacao: ids(c.itens?.afinacao, IDS.afinacao, CLASSICA_INICIAL.itens.afinacao),
        achar: ids(c.itens?.achar, IDS.achar, CLASSICA_INICIAL.itens.achar),
        campo: ids(c.itens?.campo, IDS.campo, CLASSICA_INICIAL.itens.campo),
        cadencias: ids(c.itens?.cadencias, IDS.cadencias, CLASSICA_INICIAL.itens.cadencias),
        progressoes: ids(c.itens?.progressoes, IDS.progressoes, CLASSICA_INICIAL.itens.progressoes),
      },
      direcao: DIRECOES.includes(c.direcao as Direcao) ? (c.direcao as Direcao) : "asc",
      margem: (MARGENS as readonly unknown[]).includes(c.margem) ? (c.margem as number) : CLASSICA_INICIAL.margem,
      tonica: c.tonica === "sorteada" ? "sorteada" : "do",
    },
    historico: h as Historico,
    reforco: typeof s.reforco === "boolean" ? s.reforco : true,
  };
});

type Pergunta = { modo: "classico"; p: PerguntaClassica };
/** Afinação: a segunda metade da resposta pelo teclado. Os números ficam para os intervalos. */
const TECLAS_AFINACAO: Record<string, string> = { "-": "baixo", "0": "afinado", "+": "alto", "=": "alto" };
const KBD_AFINACAO: Record<string, string> = { baixo: "−", afinado: "0", alto: "+" };

/** Treino de ouvido no navegador: ouvir, escolher a resposta e ver no teclado ou no braço o que foi tocado. */
function Ouvido({ programa }: { programa?: ProgramaProp }) {
  const t = useTranslations("treino-de-ouvido");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const [instrumento, setInstrumento] = useInstrumento();
  const [q, setQ] = useState<Pergunta | null>(null);
  const [escolha, setEscolha] = useState<string | null>(null);
  /** Afinação: o intervalo que a pessoa disse, à espera da outra metade da resposta (baixa, afinada ou alta). */
  const [intervaloDito, setIntervaloDito] = useState<string | null>(null);
  const [placar, setPlacar] = useState(PLACAR_ZERO);
  const [carregando, setCarregando] = useState(false);
  const [tocando, setTocando] = useState(false);
  /** Achar: a tecla escolhida; e a tecla que está soando agora (azul). */
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [teclaTocando, setTeclaTocando] = useState<number | null>(null);
  const [erro, setErro] = useState<"audio" | "piano" | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const revela = useRef<HTMLDivElement>(null);
  /** Pontos fracos apagados há pouco: dá para desfazer por alguns segundos. */
  const [apagado, setApagado] = useState<Historico | null>(null);
  const desfazerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (desfazerTimer.current) clearTimeout(desfazerTimer.current); }, []);
  const proxima = useRef<HTMLButtonElement>(null);
  const fim = useRef(0);
  /** Quando a pergunta da vez começou: a duração entra no ritmo da pessoa, que calibra o tempo dos programas. */
  const inicioPergunta = useRef(0);
  // Num programa, o exercício vem do bloco (a config salva da pessoa não muda).
  const exercicioDaVez = (programa?.exercicio as Exercicio | undefined) ?? s.classica.exercicio;

  // Aquece o cache das amostras sem criar o áudio (que só nasce no primeiro toque).
  useEffect(() => { PIANO_SAMPLES.forEach((m) => { void fetch(`/sons/piano/${m}.mp3`).catch(() => {}); }); }, []);
  useEffect(() => () => { const g = getAudio(); if (g) stopPiano(g); }, []);

  const tocar = async (notas: readonly PianoNote[], botao = true) => {
    const g = resumeAudio();
    if (!g) { setErro("audio"); return; }
    try { setCarregando(true); await loadPiano(g); setErro(null); } catch { setErro("piano"); return; } finally { setCarregando(false); }
    const duracao = playPiano(g, notas);
    if (duracao === null) return;
    // Azul = soando agora: o botão de ouvir fica azul até a última nota acabar.
    if (!botao) return;
    const id = ++fim.current;
    setTocando(true);
    setTimeout(() => { if (id === fim.current) setTocando(false); }, duracao * 1000);
  };
  const calar = () => { const g = getAudio(); if (g) stopPiano(g); fim.current++; setTocando(false); };
  const nova = (cfg: Saved = s) => {
    // Com o reforço ligado, o sorteio favorece o que a pessoa mais erra.
    const h = cfg.reforco ? cfg.historico : undefined;
    const p: Pergunta = { modo: "classico", p: perguntaClassica({ ...(programa ? CLASSICA_INICIAL : cfg.classica), exercicio: exercicioDaVez }, Math.random, h) };
    setQ(p);
    inicioPergunta.current = agoraMs();
    setEscolha(null);
    setIntervaloDito(null);
    setSelecionada(null);
    void tocar(p.p.notas);
    // O foco vai para a pergunta: quem usa o teclado continua dali.
    requestAnimationFrame(() => titulo.current?.focus({ preventScroll: true }));
  };
  /** Mudar modo ou ajuste descarta a pergunta em andamento e cala o piano. */
  const mudar = (next: Saved, zerar = true) => {
    store.set(next);
    calar();
    setQ(null);
    setEscolha(null);
    setIntervaloDito(null);
    setSelecionada(null);
    if (zerar) setPlacar(PLACAR_ZERO);
  };
  /** Depois da resposta: a próxima pergunta, ou, na última do bloco de um programa, o próximo bloco. */
  const avancar = () => (programa && programa.restante === 0 ? programa.aoAvancar() : nova());
  const finalizar = (id: string, certo: boolean) => {
    if (!q) return;
    setEscolha(id);
    anotarDuracao(exercicioDaVez, agoraMs() - inicioPergunta.current);
    programa?.aoResponder(certo);
    setPlacar((p) => somar(p, certo));
    store.set((x) => ({ ...x, historico: registrar(x.historico, q.p.chave, certo) }));
  };
  const responder = (id: string) => {
    if (!q || escolha !== null) return;
    // Na afinação a resposta tem duas metades: o intervalo e como soa a segunda nota. Conta como certa só com as duas.
    if (q.modo === "classico" && q.p.intervalo !== undefined) {
      if (intervaloDito === null) return;
      finalizar(id, id === q.p.resposta && intervaloDito === q.p.intervalo);
      return;
    }
    finalizar(id, id === q.p.resposta);
  };
  /** Afinação: escolher (ou trocar) o intervalo; se a outra metade já foi dita antes, a resposta fecha. */
  const dizerIntervalo = (id: string) => {
    if (!q || escolha !== null) return;
    setIntervaloDito(id);
  };
  /** Achar: confere a tecla escolhida com a segunda nota. */
  const confirmar = () => {
    if (!q || q.modo !== "classico" || escolha !== null || selecionada === null) return;
    const certo = selecionada === q.p.alvo;
    setTeclaTocando(null);
    finalizar(certo ? q.p.resposta : "errado", certo);
  };
  /** Cada tecla toca a nota; no achar, tocar também escolhe. */
  const tocarTecla = (midi: number) => {
    void tocar([{ midi, at: 0, dur: 1.2 }], false);
    setTeclaTocando(midi);
    setTimeout(() => setTeclaTocando((m) => (m === midi ? null : m)), 1300);
    if (achar && q && escolha === null) setSelecionada(midi);
  };

  // Dentro de um programa o bloco começa sozinho: o toque em "Começar" ou "Próximo bloco" já liberou o áudio.
  useEffect(() => {
    if (!programa) return;
    const id = setTimeout(() => nova(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modo = "classico" as const;
  const exercicio = exercicioDaVez;
  // Num programa a pergunta usa os itens padrão; as respostas têm que ser as mesmas.
  const grupoDeIds: readonly string[] = (programa ? CLASSICA_INICIAL : s.classica).itens[exercicio];
  const nomeGrupo: string = exercicio;
  // Afinação: os itens (chips) são intervalos, mas as respostas são baixo, afinado e alto.
  const afinacao = modo === "classico" && exercicio === "afinacao";
  const harmonia = modo === "classico" && HARMONIA.includes(exercicio);
  const achar = modo === "classico" && exercicio === "achar";
  const respostas: readonly string[] = achar ? [] : afinacao ? RESPOSTAS_AFINACAO : grupoDeIds;
  const nomeChips = afinacao || achar ? "intervalos" : nomeGrupo;
  const nome = (grupo: string, id: string) => t(`nomes.${grupo}.${id}` as "nomes.graus.1");
  /** Dica curta de uma resposta (ex.: "V → I" na cadência autêntica), se existir. */
  const dicaDe = (grupo: string, id: string) => (t.has(`dicas.${grupo}.${id}` as "dicas.cadencias.plagal") ? t(`dicas.${grupo}.${id}` as "dicas.cadencias.plagal") : null);
  const nomeCompleto = (grupo: string, id: string) => { const d = dicaDe(grupo, id); return d ? `${nome(grupo, id)} (${d})` : nome(grupo, id); };
  const todos = IDS[exercicio];
  const marcar = (id: string) => {
    const atual = grupoDeIds, tem = atual.includes(id);
    if (tem && atual.length === 1) return; // sempre sobra pelo menos um
    const nextIds = tem ? atual.filter((x) => x !== id) : todos.filter((x) => x === id || atual.includes(x));
    mudar({ ...s, classica: { ...s.classica, itens: { ...s.classica.itens, [exercicio]: nextIds } } }, false);
  };
  // Pontos fracos: os itens com menor taxa de acerto (com ao menos duas respostas), do pior para o melhor.
  const fracos = Object.entries(s.historico)
    // "afinacao:30" (pela margem) é a chave antiga, de antes do intervalo: não aparece.
    .filter(([chave, v]) => v && v.total >= 2 && !/^afinacao:\d+$/.test(chave) && !chave.startsWith("graus:"))
    .map(([chave, v]) => {
      const [grupo = "", id = ""] = chave.split(":");
      const rotulo = nome(grupo === "achar" || grupo === "afinacao" ? "intervalos" : grupo, id);
      return { chave, certo: v.certo, total: v.total, nome: `${t(`grupos.${grupo}` as "grupos.graus")} · ${rotulo}` };
    })
    .sort((a, b) => a.certo / a.total - b.certo / b.total || b.total - a.total)
    .slice(0, 6);
  const respondida = q !== null && escolha !== null;
  // Depois de responder a tela rola só o necessário para o resultado e "Próxima pergunta" aparecerem (no celular ficavam abaixo
  // da dobra), e o foco vai para o botão.
  useEffect(() => {
    if (!respondida) return;
    revela.current?.scrollIntoView({ block: "nearest" });
    proxima.current?.focus({ preventScroll: true });
  }, [respondida]);
  const intervaloCerto = q?.modo === "classico" ? q.p.intervalo : undefined;
  const acertou = respondida && escolha === q.p.resposta && (intervaloCerto === undefined || intervaloDito === intervaloCerto);
  const notasTocadas = q ? q.p.notas.map((n) => n.midi) : [];
  const harmonico = q?.modo === "classico" && q.p.notas.length === 2 && q.p.notas[0]!.at === q.p.notas[1]!.at;
  const cents = q?.modo === "classico" ? q.p.cents : undefined;
  const intervaloTocado = INTERVALOS.find((i) => i.semitons === Math.abs((notasTocadas[0] ?? 0) - (notasTocadas[1] ?? 0)));
  const tonicaQ = q?.modo === "classico" ? q.p.tonica : undefined;
  const acordesQ = q?.modo === "classico" ? q.p.acordes : undefined;
  // O teclado está sempre à mostra: antes da resposta marca só o que é dado; depois, acende as notas tocadas (alvo).
  const marcas = new Map<number, Marca>();
  if (q?.modo === "classico" && !respondida && achar && q.p.dada !== undefined) marcas.set(q.p.dada, "dada");
  if (achar && !respondida && selecionada !== null) marcas.set(selecionada, "sel");
  if (respondida && q) {
    const reveladas = q.p.reveal ?? (harmonia ? [] : q.p.notas.map((n) => n.midi));
    reveladas.forEach((m) => marcas.set(m, "alvo"));
    if (achar && selecionada !== null && !acertou) marcas.set(selecionada, "errada");
  }
  if (teclaTocando !== null) marcas.set(teclaTocando, "toca");
  // No violão um acorde tem uma nota por corda (uma forma que cabe na mão); intervalos e notas soltas vão onde ficam mais à frente.
  const acordeAlvo = respondida && q?.modo === "classico" && (exercicio === "acordes" || exercicio === "campo") ? (q.p.reveal ?? q.p.notas.map((n) => n.midi)) : null;
  const extras = instrumento === "violao" && acordeAlvo ? (acordeNoBraco(acordeAlvo) ?? []).map((p) => ({ ...p, marca: "alvo" as const })) : [];
  const janela = q ? q.p.notas.map((n) => n.midi) : [48, 71];
  const detalhe = !q || !respondida ? "" : tonicaQ !== undefined && acordesQ
    ? `${t("tomMaior", { nota: nomeTom(tonicaQ) })}: ${acordesQ.map((g) => nome("campo", g)).join(" – ")} (${acordesQ.map((g) => nomeAcorde(tonicaQ, g)).join(" – ")})`
    : cents !== undefined
    ? `${cents === 0 ? t("exatamenteAfinado") : t(cents > 0 ? "centsAcima" : "centsAbaixo", { n: Math.abs(cents) })} · ${intervaloTocado ? nome("intervalos", intervaloTocado.id) : ""} · ${notasTocadas.map(nomeNota).join(harmonico ? " + " : " → ")}`
    : q.modo === "classico" && (q.p.chave.startsWith("intervalos") || q.p.chave.startsWith("achar"))
    ? `${t("semitons", { n: Math.abs(notasTocadas[0]! - notasTocadas[1]!) })} · ${notasTocadas.map(nomeNota).join(harmonico ? " + " : " → ")}`
    : notasTocadas.map(nomeNota).join(" · ");
  const resultado = !respondida || !q ? "" : acertou ? t("certo") : achar ? t("errado", { resposta: nomeNota(q.p.alvo!) }) : intervaloCerto !== undefined ? t("afinacaoErrado", { intervalo: nome("intervalos", intervaloCerto), sentido: nome("afinacao", q.p.resposta).toLowerCase() }) : t("errado", { resposta: nomeCompleto(nomeGrupo, q.p.resposta) });
  const pergunta = !q ? t("perguntaInicial") : t(harmonia || achar ? (`pergunta_${exercicio}` as "pergunta_campo") : exercicio === "acordes" ? "perguntaAcordes" : afinacao ? "perguntaAfinacao" : "perguntaIntervalos");
  const dica = afinacao ? t("dicaAfinacao", { margem: s.classica.margem }) : harmonia || achar ? t(`dica_${exercicio}` as "dica_campo") : t(exercicio === "acordes" ? "dicaAcordes" : "dicaIntervalos");

  // Teclado: 1 a 9 respondem; Espaço ouve de novo e, depois da resposta, avança.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, select, textarea")) return;
      // Afinação: os números dizem o intervalo; − 0 + dizem como soa a segunda nota.
      if (afinacao && q && escolha === null && TECLAS_AFINACAO[e.key]) {
        e.preventDefault();
        responder(TECLAS_AFINACAO[e.key]!);
        return;
      }
      if (/^[1-9]$/.test(e.key) && q && escolha === null) {
        if (afinacao) {
          const id = grupoDeIds[Number(e.key) - 1];
          if (id) { e.preventDefault(); dizerIntervalo(id); }
          return;
        }
        const id = respostas[Number(e.key) - 1];
        if (id) { e.preventDefault(); responder(id); }
        return;
      }
      if (e.code === "Space" || e.key === "Enter") {
        if (e.target instanceof Element && e.target.closest("button, summary, a, [role=button]")) return; // o controle em foco já faz a sua ação
        e.preventDefault();
        if (e.repeat || carregando) return;
        if (achar && q && escolha === null && selecionada !== null) { confirmar(); return; }
        if (!q) nova(); else if (escolha !== null) avancar(); else void tocar(q.p.notas);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="treino">
      {!programa && <div className="treino-topo">
        <div className="treino-escolhas">
          {(
            <div className="treino-exs" role="radiogroup" aria-label={t("exercicio")} onKeyDown={onRadioKeyDown}>
              {([["notas", ["intervalos", "acordes", "afinacao", "achar"]], ["harmonia", ["campo", "cadencias", "progressoes"]]] as const).map(([grupo, lista]) => (
                <div key={grupo} className="treino-exs-linha" role="presentation">
                  <span className="treino-exs-nome" aria-hidden="true">{t(`grupoExercicios.${grupo}`)}</span>
                  {lista.map((e) => EXERCICIOS.includes(e) && (
                <button key={e} type="button" role="radio" aria-checked={exercicio === e} tabIndex={exercicio === e ? 0 : -1} onClick={() => mudar({ ...s, classica: { ...s.classica, exercicio: e } }, true)}>{t(`exercicios.${e}`)}</button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Antes da primeira resposta o placar só mostraria zeros. */}
        {placar.total > 0 && (
          <dl className="treino-placar" aria-label={t("placarTitulo")}>
            <div><dd>{t("placar", { acertos: placar.acertos, total: placar.total })}</dd><dt>{t("acertos")}</dt></div>
            <div><dd>{placar.sequencia}</dd><dt>{t("sequenciaRotulo")}</dt></div>
          </dl>
        )}
      </div>}

      <section className="treino-palco" aria-label={t("perguntaTitulo")}>
        <div className="treino-linha">
          <button type="button" className={`treino-ouvir${tocando ? " tocando" : ""}`} aria-label={t(q ? "ouvir" : "ouvirPrimeira")} aria-keyshortcuts="Space" disabled={carregando}
            onClick={() => (q ? void tocar(q.p.notas) : nova())}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5Z" /></svg>
          </button>
          <div className="treino-pergunta">
            <h2 ref={titulo} tabIndex={-1}>{pergunta}</h2>
          </div>
          <Info label={t("info")} title={t("info")} close={t("fechar")} items={[dica, t("atalhos"), t("creditos")]} />
        </div>

        {afinacao && (
          <div className="treino-respostas-grupo">
            <p className="treino-respostas-nome" id="treino-afinacao-intervalo">{t("afinacaoIntervalo")}</p>
            <div className="treino-respostas" role="radiogroup" aria-labelledby="treino-afinacao-intervalo">
              {grupoDeIds.map((id, n) => {
                const estado = !q ? "" : escolha !== null ? (id === intervaloCerto ? "certa" : id === intervaloDito ? "errada" : "") : id === intervaloDito ? "sel" : "";
                return (
                  <button key={id} type="button" role="radio" aria-checked={id === intervaloDito} className={`treino-resp ${estado}`} onClick={() => dizerIntervalo(id)} disabled={!q || escolha !== null}>
                    {n < 9 && <kbd aria-hidden="true">{n + 1}</kbd>}
                    <span className="treino-resp-texto">{nome("intervalos", id)}</span>
                  </button>
                );
              })}
            </div>
            <p className="treino-respostas-nome" id="treino-afinacao-segunda">{t("afinacaoSegunda")}</p>
          </div>
        )}
        <div className="treino-respostas" role="group" aria-label={afinacao ? t("afinacaoSegunda") : t("respostas")}>
          {respostas.map((id, n) => {
            const estado = escolha === null || !q ? "" : id === q.p.resposta ? "certa" : id === escolha ? "errada" : "";
            return (
              <button key={id} type="button" className={`treino-resp ${estado}`} onClick={() => responder(id)} disabled={!q || (escolha !== null) || (afinacao && intervaloDito === null)}>
                {afinacao ? <kbd aria-hidden="true">{KBD_AFINACAO[id]}</kbd> : n < 9 && <kbd aria-hidden="true">{n + 1}</kbd>}
                <span className="treino-resp-texto">{nome(nomeGrupo, id)}{dicaDe(nomeGrupo, id) && <small>{dicaDe(nomeGrupo, id)}</small>}</span>
              </button>
            );
          })}
        </div>

        <Instrumento tipo={instrumento} janela={janela} marcas={marcas} onTocar={tocarTecla} extras={extras} label={t(instrumento === "violao" ? "braco" : "teclado")} />
        {achar && q && !respondida && (
          <button type="button" className="go treino-proxima" onClick={confirmar} disabled={selecionada === null || carregando}>{t("responder")}<kbd aria-hidden="true">Enter</kbd></button>
        )}

        {respondida && (
          <div className="treino-revela" ref={revela}>
            <p className={`treino-resultado ${acertou ? "certa" : "errada"}`}>{resultado}</p>
            {cents !== undefined && <Regua cents={cents} margem={s.classica.margem} label={t("regua")} baixo={t("nomes.afinacao.baixo")} alto={t("nomes.afinacao.alto")} />}
            {cents !== undefined && cents !== 0 && q?.modo === "classico" && (
              <div className="treino-ouvir-mais">
                <button type="button" className="treino-btn" onClick={() => void tocar(q.p.notas)} disabled={carregando}>{t("ouvirComoEstava")}</button>
                <button type="button" className="treino-btn" onClick={() => void tocar(q.p.notas.map((n) => ({ ...n, cents: 0 })))} disabled={carregando}>{t("ouvirAfinado")}</button>
                <button type="button" className="treino-btn" onClick={() => void tocar(compararAfinacao(q.p.notas))} disabled={carregando}>{t("compararDois")}</button>
              </div>
            )}
            <p className="treino-detalhe">{detalhe}</p>
            <button ref={proxima} type="button" className="go treino-proxima" onClick={avancar} disabled={carregando}>{programa && programa.restante === 0 ? programa.rotuloFim : t("proxima")}<kbd aria-hidden="true">{t("espaco")}</kbd></button>
          </div>
        )}
        {/* Sempre montada: o leitor de tela anuncia o resultado quando o texto muda (uma região viva que nasce já cheia é pulada). */}
        <p className="treino-estado" role="status">
          {carregando ? t("carregando") : erro === "audio" ? t("erroAudio") : erro === "piano" ? t("erroPiano") : ""}
          {respondida && <span className="sr-only">{resultado} {detalhe}</span>}
        </p>
      </section>

      {!programa && <details className="treino-ajustes">
        <summary>{t("ajustes")}</summary>
        <div className="treino-ajustes-corpo">
          {modo === "classico" && harmonia && (
            <label className="treino-field">
              <span>{t("tonalidade")}</span>
              <select value={s.classica.tonica} onChange={(e) => mudar({ ...s, classica: { ...s.classica, tonica: e.target.value === "sorteada" ? "sorteada" : "do" } }, false)}>
                <option value="do">{t("tonicas.do")}</option>
                <option value="sorteada">{t("tonicas.sorteada")}</option>
              </select>
            </label>
          )}
          {modo === "classico" && (exercicio === "intervalos" || exercicio === "afinacao") && (
            <label className="treino-field">
              <span>{t("direcao")}</span>
              <select value={s.classica.direcao} onChange={(e) => mudar({ ...s, classica: { ...s.classica, direcao: e.target.value as Direcao } }, false)}>
                {DIRECOES.map((d) => <option key={d} value={d}>{t(`direcoes.${d}`)}</option>)}
              </select>
            </label>
          )}
          {afinacao && (
            <div className="treino-field" role="group" aria-label={t("margem")}>
              <span>{t("margem")}</span>
              <div className="treino-chips">
                {MARGENS.map((m) => (
                  <button key={m} type="button" className="treino-chip" aria-pressed={s.classica.margem === m} onClick={() => mudar({ ...s, classica: { ...s.classica, margem: m } }, false)}>
                    {t(`margens.${m}` as "margens.30")} <span className="treino-chip-sub">{t("margemCents", { n: m })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="treino-field" role="group" aria-label={t("instrumento")}>
            <span>{t("instrumento")}</span>
            <div className="treino-chips">
              <button type="button" className="treino-chip" aria-pressed={instrumento === "teclado"} onClick={() => setInstrumento("teclado")}>{t("instrumentos.teclado")}</button>
              <button type="button" className="treino-chip" aria-pressed={instrumento === "violao"} onClick={() => setInstrumento("violao")}>{t("instrumentos.violao")}</button>
            </div>
          </div>
          <Interruptor rotulo={t("reforco")} ligado={s.reforco} aoMudar={(reforco) => store.set((x) => ({ ...x, reforco }))} />
          <div className="treino-field treino-itens" role="group" aria-label={t("itens")}>
            <span>{t("itens")}</span>
            <div className="treino-chips">
              {todos.map((id) => (
                <button key={id} type="button" className="treino-chip" aria-pressed={grupoDeIds.includes(id)} onClick={() => marcar(id)}>{nomeCompleto(nomeChips, id)}</button>
              ))}
            </div>
          </div>
        </div>
      </details>}

      {!programa && <details className="treino-ajustes">
        <summary>{t("fracos")}</summary>
        <div className="treino-ajustes-corpo">
          {apagado ? (
            <p className="treino-vazio" role="status">{t("apagado")} <button type="button" className="treino-btn" onClick={() => { store.set((x) => ({ ...x, historico: apagado })); setApagado(null); }}>{t("desfazer")}</button></p>
          ) : fracos.length === 0 ? <p className="treino-vazio">{t("fracosVazio")}</p> : (
            <ol className="treino-fracos">
              {fracos.map((f) => (
                <li key={f.chave}><span>{f.nome}</span><span className="treino-fraco-n">{t("acertoDe", { certo: f.certo, total: f.total })}</span><span className="treino-barra" aria-hidden="true"><i style={{ width: `${Math.round((f.certo / f.total) * 100)}%` }} /></span></li>
              ))}
            </ol>
          )}
          {fracos.length > 0 && !apagado && <button type="button" className="treino-btn" onClick={() => {
            setApagado(s.historico);
            store.set((x) => ({ ...x, historico: {} }));
            if (desfazerTimer.current) clearTimeout(desfazerTimer.current);
            desfazerTimer.current = setTimeout(() => setApagado(null), 8000);
          }}>{t("apagar")}</button>}
        </div>
      </details>}

    </div>
  );
}

/** Treino de ouvido: os programas por tempo e, abaixo, os exercícios isolados. */
export function TreinoDeOuvido() {
  return (
    <div className="treino-secoes">
      <Programa
        secao="ouvido"
        livre={<Ouvido />}
        bloco={(p, chave) => <Ouvido key={chave} programa={p} />}
      />
    </div>
  );
}
