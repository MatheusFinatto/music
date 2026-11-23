// Treino de ouvido e de voz: a lógica é a mesma do app Android. Ela mora em Kotlin (marmota-tuner/core, pacote treino) e é
// compilada para ../pitch/generated/. Não edite generated/ à mão: mude o Kotlin e rode `./gradlew :core:exportToSite` em marmota-tuner/.
//
// Este arquivo dá a essa lógica os tipos e os nomes que as telas do site usam. Os objetos do Kotlin guardam os campos em getters
// de classe (um `{ ...x }` ou um JSON.stringify os perderia), então tudo entra e sai daqui como objeto simples do TypeScript.
// As tabelas (intervalos, acordes, músicas…) vêm de src/tools/treino-de-ouvido/dados.json e musicas.json, convertidas em Kotlin
// pela tarefa :core:generateTreinoData; aqui elas viram objetos simples uma vez, ao carregar.
import * as K from "../pitch/generated/tuner-core.mjs";
import type { PianoNote } from "../audio";

export type Rng = () => number;

// ---------------------------------------------------------------- conversões
const arr = <T>(a: { get(): T[] } | T[]): T[] => ("get" in a && typeof a.get === "function" ? (a as { get(): T[] }).get() : (a as T[]));
const val = <T>(v: { get(): T }): T => v.get();
const opt = <T>(x: T | null | undefined): T | undefined => (x === null || x === undefined ? undefined : x);

const notaDe = (n: K.PianoNote): PianoNote => {
  const c = opt(n.cents);
  return c === undefined ? { midi: n.midi, at: n.at, dur: n.dur } : { midi: n.midi, at: n.at, dur: n.dur, cents: c };
};
const notasDe = (ns: K.PianoNote[]): PianoNote[] => ns.map(notaDe);
const notaK = (n: PianoNote): K.PianoNote => new K.PianoNote(n.midi, n.at, n.dur, n.cents);

// ---------------------------------------------------------------- tabelas
export const INTERVALOS: readonly { id: string; semitons: number }[] = arr(K.INTERVALOS).map((i) => ({ id: i.id, semitons: i.semitons }));
export const ACORDES: readonly { id: string; semitons: number[] }[] = arr(K.ACORDES).map((a) => ({ id: a.id, semitons: [...a.semitons] }));
export const GRAUS: readonly { id: string; semitons: number }[] = arr(K.GRAUS).map((g) => ({ id: g.id, semitons: g.semitons }));
export const CAMPO: readonly { id: string; raiz: number; semitons: number[] }[] = arr(K.CAMPO).map((c) => ({ id: c.id, raiz: c.raiz, semitons: [...c.semitons] }));
export const CADENCIAS: readonly { id: string; variantes: string[][] }[] = arr(K.CADENCIAS).map((c) => ({ id: c.id, variantes: c.variantes.map((v) => [...v]) }));
export const PROGRESSOES: readonly { id: string; acordes: string[] }[] = arr(K.PROGRESSOES).map((p) => ({ id: p.id, acordes: [...p.acordes] }));
/** Padrões de aquecimento da voz: distâncias em semitons a partir da nota inicial, na ordem em que se canta. */
export const PADROES: readonly { id: string; semitons: number[] }[] = arr(K.PADROES).map((p) => ({ id: p.id, semitons: [...p.semitons] }));

/** Uma nota da melodia: `st` = semitons acima da tônica (null = pausa), `dur` em tempos de semínima, `sil` = a sílaba cantada. */
export type NotaMusica = { st: number | null; dur: number; sil: string };
export type Trecho = { nome: string; notas: NotaMusica[] };
/** `confianca`: o quanto a transcrição foi conferida contra partituras (alta: várias fontes; média: uma ou fontes que divergem; baixa: só cifras, ritmo estimado). */
export type Musica = { id: string; nome: string; compasso: string; bpm: number; confianca: "alta" | "media" | "baixa"; trechos: Trecho[] };
/** As músicas do exercício de cantar: melodias tradicionais ou de domínio público, em semitons acima da tônica (ver docs/treino-de-ouvido/MUSICAS.md). */
export const MUSICAS: readonly Musica[] = arr(K.MUSICAS).map((m) => ({
  id: m.id, nome: m.nome, compasso: m.compasso, bpm: m.bpm, confianca: m.confianca as Musica["confianca"],
  trechos: m.trechos.map((t) => ({ nome: t.nome, notas: t.notas.map((n) => ({ st: opt(n.st) ?? null, dur: n.dur, sil: n.sil })) })),
}));
export const musicaDe = (id: string): Musica => MUSICAS.find((m) => m.id === id) ?? MUSICAS[0]!;

// ---------------------------------------------------------------- ouvido (Engine.kt)
/** Gerador com semente (para testes), igual bit a bit ao do Kotlin. */
export const mulberry32 = (seed: number): Rng => K.mulberry32(seed | 0);

export type Exercicio = "intervalos" | "acordes" | "afinacao" | "achar" | "campo" | "cadencias" | "progressoes";
export type Direcao = "asc" | "desc" | "harm" | "misto";
export const EXERCICIOS = arr(K.EXERCICIOS) as readonly Exercicio[];
/** Os exercícios de harmonia: acordes dentro de um tom maior. */
export const HARMONIA = arr(K.HARMONIA) as readonly Exercicio[];
/** Margem da afinação, em cents: do óbvio ao fino. */
export const MARGENS = arr(K.MARGENS) as readonly (50 | 30 | 20 | 10)[];
/** As respostas da afinação: a segunda nota está baixa, afinada ou alta. */
export const RESPOSTAS_AFINACAO = arr(K.RESPOSTAS_AFINACAO) as readonly ("baixo" | "afinado" | "alto")[];
export const DIRECOES = arr(K.DIRECOES) as readonly Direcao[];

export const IDS: Record<Exercicio | "graus", readonly string[]> = {
  intervalos: INTERVALOS.map((i) => i.id),
  acordes: ACORDES.map((a) => a.id),
  /** Na afinação, os itens são os intervalos que entram. */
  afinacao: INTERVALOS.map((i) => i.id),
  /** No "achar", os itens também são os intervalos que entram. */
  achar: INTERVALOS.map((i) => i.id),
  graus: GRAUS.map((g) => g.id),
  campo: CAMPO.map((c) => c.id),
  cadencias: CADENCIAS.map((c) => c.id),
  progressoes: PROGRESSOES.map((p) => p.id),
};

export type ConfigClassica = { exercicio: Exercicio; itens: Record<Exercicio, string[]>; direcao: Direcao; margem: number; /** Tonalidade dos exercícios de harmonia. */ tonica: "do" | "sorteada" };
export type ConfigFuncional = { tonica: "do" | "sorteada"; graus: string[] };

export const CLASSICA_INICIAL: ConfigClassica = {
  exercicio: "intervalos",
  itens: { intervalos: ["3m", "3M", "4J", "5J", "8J"], acordes: ["maior", "menor"], afinacao: ["3M", "5J", "8J"], achar: ["3m", "3M", "5J"],
    campo: ["I", "IV", "V", "vi"], cadencias: ["autentica", "plagal", "deceptiva", "meia"], progressoes: ["I-IV-V-I", "I-V-vi-IV", "vi-IV-I-V"] },
  direcao: "asc",
  margem: 30,
  tonica: "do",
};
export const FUNCIONAL_INICIAL: ConfigFuncional = { tonica: "do", graus: ["1", "3", "5"] };

/** A pergunta do modo clássico: o que tocar e o que é a resposta certa. */
export type PerguntaClassica = {
  chave: string; resposta: string; notas: PianoNote[];
  /** Só na afinação: quantos cents a segunda nota saiu do lugar (0 = afinada). */
  cents?: number;
  /** Só na harmonia: a tônica (MIDI) e os graus da pergunta, na ordem (sem o acorde de tônica que antecede e fixa o tom). */
  tonica?: number; acordes?: string[];
  /** Notas a acender no teclado depois da resposta, se houver (o acorde do campo). */
  reveal?: number[];
  /** Só no "achar": a primeira nota (dada, marcada no teclado) e a segunda (a que se procura), em MIDI. */
  dada?: number; alvo?: number;
  /** Só na afinação: o intervalo tocado, que a pessoa também diz (além de baixa, afinada ou alta). */
  intervalo?: string;
};
/** A pergunta do modo funcional: a cadência que fixa o tom e a nota, juntas ou cada uma por si. */
export type PerguntaFuncional = { chave: string; resposta: string; tonica: number; cadencia: PianoNote[]; nota: PianoNote[]; tudo: PianoNote[] };

/** Histórico por item (guardado no navegador): quantas vezes acertou de quantas. */
export type Historico = Record<string, { certo: number; total: number }>;
const historicoK = (h: Historico): K.HistoricoItem[] => Object.entries(h).map(([k, v]) => new K.HistoricoItem(k, v.certo, v.total));
const historicoDe = (h: K.HistoricoItem[]): Historico => Object.fromEntries(h.map((x) => [x.chave, { certo: x.certo, total: x.total }]));

export const registrar = (h: Historico, chave: string, certo: boolean): Historico => historicoDe(K.registrar(historicoK(h), chave, certo));
/**
 * Quanto um item deve aparecer: o que ainda não foi visto o bastante pesa 2 (para conhecer), e daí em diante pesa de 1
 * (acerta sempre) a 5 (erra sempre). Assim o treino volta mais ao que a pessoa erra, sem esquecer o resto.
 */
export const peso = (h: Historico, chave: string): number => K.peso(historicoK(h), chave);

const configK = (cfg: ConfigClassica) =>
  new K.ConfigClassica(cfg.exercicio, [...(cfg.itens[cfg.exercicio] ?? [])], cfg.direcao, cfg.margem, cfg.tonica);
const classicaDe = (p: K.PerguntaClassica): PerguntaClassica => {
  const out: PerguntaClassica = { chave: p.chave, resposta: p.resposta, notas: notasDe(p.notas) };
  if (p.cents != null) out.cents = p.cents;
  if (p.tonica != null) out.tonica = p.tonica;
  if (p.acordes != null) out.acordes = [...p.acordes];
  if (p.reveal != null) out.reveal = [...p.reveal];
  if (p.dada != null) out.dada = p.dada;
  if (p.alvo != null) out.alvo = p.alvo;
  if (p.intervalo != null) out.intervalo = p.intervalo;
  return out;
};
const histOpt = (h?: Historico) => (h ? historicoK(h) : null);

/** Afinação: o intervalo toca com a segunda nota baixa, afinada ou alta (um terço de cada, em média), no temperamento igual. */
export const perguntaAfinacao = (cfg: ConfigClassica, rng: Rng = Math.random): PerguntaClassica => classicaDe(K.perguntaAfinacao(configK(cfg), rng));
/** Harmonia: a tônica fixa o tom e depois vêm um acorde (graus do campo), dois (cadências) ou quatro (progressões). */
export const perguntaHarmonia = (cfg: ConfigClassica, rng: Rng = Math.random, historico?: Historico): PerguntaClassica =>
  classicaDe(K.perguntaHarmonia(configK(cfg), rng, histOpt(historico)));
/** Achar no teclado: duas notas em sequência; a primeira vem marcada e a pessoa procura a segunda de ouvido. */
export const perguntaAchar = (cfg: ConfigClassica, rng: Rng = Math.random, historico?: Historico): PerguntaClassica =>
  classicaDe(K.perguntaAchar(configK(cfg), rng, histOpt(historico)));
export const perguntaClassica = (cfg: ConfigClassica, rng: Rng = Math.random, historico?: Historico): PerguntaClassica =>
  classicaDe(K.perguntaClassica(configK(cfg), rng, histOpt(historico)));
export const perguntaFuncional = (cfg: ConfigFuncional, rng: Rng = Math.random, historico?: Historico): PerguntaFuncional => {
  const p = K.perguntaFuncional(new K.ConfigFuncional(cfg.tonica, [...cfg.graus]), rng, histOpt(historico));
  return { chave: p.chave, resposta: p.resposta, tonica: p.tonica, cadencia: notasDe(p.cadencia), nota: notasDe(p.nota), tudo: notasDe(p.tudo) };
};

/** Para comparar: as notas como estavam e, em seguida, as mesmas afinadas, uma pausa depois. */
export const compararAfinacao = (notas: readonly PianoNote[]): PianoNote[] => notasDe(K.compararAfinacao(notas.map(notaK)));
/** Cadência I-IV-V-I com o baixo uma oitava abaixo da fundamental de cada acorde; 0,95 s por acorde. */
export const cadencia = (tonica: number): PianoNote[] => notasDe(K.cadencia(tonica));
/** Nome da tônica em letra: bemóis nas tonalidades que usam bemol (Db, Eb, F, Ab, Bb), sustenidos nas outras. */
export const nomeTom = (tonica: number): string => K.nomeTom(tonica);
/** Cifra do acorde de um grau do campo na tonalidade: I em Dó é C, vi é Am, vii° é Bdim. */
export const nomeAcorde = (tonica: number, grau: string): string => K.nomeAcorde(tonica, grau);
/** Nome da nota em letra e oitava, como no resto do site: 60 = C4 (Dó central), 61 = C#4. */
export const nomeNota = (midi: number): string => K.nomeNota(midi);
/** Primeira e última tecla do teclado na tela: do Dó da nota mais grave, duas oitavas (mais, só se as notas não couberem). */
export const faixaDoTeclado = (janela: readonly number[]): [number, number] => {
  const [lo, hi] = K.faixaDoTeclado([...janela]);
  return [lo!, hi!];
};

/** Placar da sessão. */
export type Placar = { acertos: number; total: number; sequencia: number; melhor: number };
export const PLACAR_ZERO: Placar = { acertos: 0, total: 0, sequencia: 0, melhor: 0 };
export const somar = (p: Placar, certo: boolean): Placar => {
  const r = K.somar(new K.Placar(p.acertos, p.total, p.sequencia, p.melhor), certo);
  return { acertos: r.acertos, total: r.total, sequencia: r.sequencia, melhor: r.melhor };
};

// ---------------------------------------------------------------- voz (Voz.kt)
/** Quanto a altura cantada está acima (+) ou abaixo (-) do alvo, em cents. Em `qualquerOitava`, 12 semitons de diferença não contam. */
export const centsDe = (midi: number, alvo: number, qualquerOitava: boolean): number => K.centsDe(midi, alvo, qualquerOitava);
/** Uma nota inicial qualquer (classe de altura, 0 = Dó): a opção "aleatória" da nota da tônica e do início dos padrões. */
export const sortearClasseDeVoz = (rng: Rng = Math.random): number => K.sortearClasseDeVoz(rng);

/** A faixa de notas (MIDI) em que a pessoa canta com conforto: os exercícios sorteiam e escolhem o tom dentro dela. */
export type Faixa = { min: number; max: number };
const faixaK = (f: Faixa) => new K.Faixa(f.min, f.max);
/** Sem escolha, de C3 a C5: o piano toca bem e cabe na voz de quase todo mundo em alguma oitava. */
export const FAIXA_PADRAO: Faixa = { min: val(K.FAIXA_PADRAO).min, max: val(K.FAIXA_PADRAO).max };
export type VozId = "baixo" | "baritono" | "tenor" | "contralto" | "mezzo" | "soprano";
/** Faixas confortáveis por tipo de voz (menores que a extensão total: o canto de treino fica longe dos extremos). */
export const VOZES: readonly { id: VozId; min: number; max: number }[] = arr(K.VOZES).map((v) => ({ id: v.id as VozId, min: v.min, max: v.max }));

/** Uma nota-alvo para a voz, dentro da faixa. */
export const sortearAlvoDeVoz = (rng: Rng = Math.random, faixa: Faixa = FAIXA_PADRAO): number => K.sortearAlvoDeVoz(rng, faixaK(faixa));
/** Da extensão medida à faixa confortável: os extremos cansam, então tira 2 semitons do grave e 3 do agudo (se a extensão for estreita, fica inteira). */
export const faixaConfortavel = (min: number, max: number): Faixa => {
  const f = K.faixaConfortavel(min, max);
  return { min: f.min, max: f.max };
};
/** O tipo de voz cuja faixa tem o centro mais perto do da faixa dada. */
export const vozMaisProxima = (f: Faixa): VozId => K.vozMaisProxima(faixaK(f)) as VozId;

/** Margens de acerto, em cents: da folgada à fina. */
export const TOLERANCIAS = arr(K.TOLERANCIAS) as readonly (50 | 30 | 20 | 10)[];
/** Quanto tempo a nota tem que ficar dentro da margem, em milissegundos. */
export const SEGURAR_MS: number = val(K.SEGURAR_MS);

export type Segurando = {
  /** Desde quando a nota está dentro da margem; null se não está. */
  desde: number | null;
  /** Última vez que houve altura dentro da margem (para perdoar falhas curtas). */
  visto: number;
  soma: number;
  soma2: number;
  n: number;
};
export const SEGURANDO_ZERO: Segurando = { desde: null, visto: 0, soma: 0, soma2: 0, n: 0 };
/** `media`: desvio médio em cents (com sinal); `oscilacao`: quanto a altura balançou em torno da média (desvio-padrão, em cents). */
export type Passo = { estado: Segurando; cents: number | null; ok: boolean; media: number; oscilacao: number };

/** Um passo: com a altura ouvida agora, a nota está sendo segurada no alvo? `ok` quando passou de `SEGURAR_MS` dentro da margem. */
export function atualizar(s: Segurando, midi: number | null, t: number, alvo: number, tolerancia: number, qualquerOitava: boolean, segurarMs = SEGURAR_MS): Passo {
  const sk = new K.Segurando(s.desde, s.visto, s.soma, s.soma2, s.n);
  const p = K.atualizar(sk, midi, t, alvo, tolerancia, qualquerOitava, segurarMs);
  const e = p.estado;
  // Sem mudança (silêncio curto), o estado é o mesmo objeto, como antes.
  const estado = e === sk ? s : { desde: opt(e.desde) ?? null, visto: e.visto, soma: e.soma, soma2: e.soma2, n: e.n };
  return { estado, cents: opt(p.cents) ?? null, ok: p.ok, media: p.media, oscilacao: p.oscilacao };
}

/** Alcance: as notas em que a voz ficou parada por um tempo, e a mais grave e a mais aguda entre elas. */
export type Alcance = { min: number | null; max: number | null; candidato: number | null; desde: number; visto: number };
export const ALCANCE_ZERO: Alcance = { min: null, max: null, candidato: null, desde: 0, visto: 0 };
/** Tempo parado numa nota para ela contar no alcance, em ms. */
export const PARADO_MS: number = val(K.PARADO_MS);
export function medirAlcance(s: Alcance, midi: number | null, t: number): Alcance {
  const sk = new K.Alcance(s.min, s.max, s.candidato, s.desde, s.visto);
  const a = K.medirAlcance(sk, midi, t);
  return a === sk ? s : { min: opt(a.min) ?? null, max: opt(a.max) ?? null, candidato: opt(a.candidato) ?? null, desde: a.desde, visto: a.visto };
}

/** "1 oitava e 7 semitons" para uma extensão em semitons. */
export const extensao = (semitons: number): { oitavas: number; semitons: number } => {
  const e = K.extensao(semitons);
  return { oitavas: e.oitavas, semitons: e.semitons };
};

/** Quanto tempo a nota de cada passo de um arpejo ou escala precisa ficar firme, e na nota longa. */
export const SEGURAR_PASSO_MS: number = val(K.SEGURAR_PASSO_MS);
export const SEGURAR_LONGA_MS: number = val(K.SEGURAR_LONGA_MS);

/** Notas (MIDI) de um padrão a partir da nota inicial. */
export const notasDoPadrao = (inicio: number, semitons: readonly number[]): number[] => [...K.notasDoPadrao(inicio, [...semitons])];
/**
 * A nota inicial de cada rodada: a escolhida (classe de altura, 0 = Dó) na região do Dó central; no aquecimento que sobe, cada
 * rodada vem meio tom acima da anterior, até 6 semitons, e então recomeça.
 */
export const inicioDaRodada = (classe: number, rodada: number, subir: boolean, faixa?: Faixa, largura = 12): number =>
  K.inicioDaRodada(classe, rodada, subir, faixa ? faixaK(faixa) : null, largura);

// ---------------------------------------------------------------- programas (Programas.kt)
export type Secao = "ouvido" | "voz";
/** O alcance não entra nos programas: é uma medição, não um exercício. */
export type ExVoz = "igualar" | "longa" | "sequencia" | "tonica" | "intervalo" | "musica";
export type Ex = Exercicio | ExVoz;
export type Minutos = 5 | 10 | 15 | 20 | 30;
export const MINUTOS = arr(K.MINUTOS) as readonly Minutos[];
export const MINUTOS_PADRAO = val(K.MINUTOS_PADRAO) as Minutos;
/** O que o programa enfatiza. "geral" é o mix equilibrado; os outros concentram o tempo no que importa para aquele foco. */
export type Foco = "geral" | "notas" | "afinacao" | "harmonia" | "segundaVoz" | "musicas";
export const FOCOS: Record<Secao, readonly Foco[]> = { ouvido: K.focosDe("ouvido") as Foco[], voz: K.focosDe("voz") as Foco[] };

export type Bloco = { exercicio: Ex; segundos: number };
export type BlocoPlano = { exercicio: Ex; perguntas: number };
export const programaDe = (secao: Secao, foco: Foco, minutos: Minutos): readonly Bloco[] =>
  K.programaDe(secao, foco, minutos).map((b) => ({ exercicio: b.exercicio as Ex, segundos: b.segundos }));

/** Segundos por pergunta, enquanto a pessoa ainda não tem respostas suficientes: palpites a conferir com o uso. */
export const MEDIANAS_INICIAIS = Object.fromEntries(arr(K.EXERCICIOS_DE_PROGRAMA).map((e) => [e, K.medianaInicial(e)])) as Record<Ex, number>;
/** O toque em "Próxima" e a respiração entre uma pergunta e outra, que a medição (até a resposta) não pega. */
export const SOBRA_S: number = val(K.SOBRA_S);
/** Respostas guardadas por exercício, e quantas é preciso ter para confiar na mediana. */
export const AMOSTRAS_MAX: number = val(K.AMOSTRAS_MAX);
export const AMOSTRAS_MIN: number = val(K.AMOSTRAS_MIN);
/** Uma pergunta que passou disso (a pessoa saiu para tomar água) conta como isto. */
export const TETO_S: number = val(K.TETO_S);
/** Nenhuma pergunta leva menos que isto (só o som já dura mais): protege a estimativa de cliques sem ouvir. */
export const PISO_S: number = val(K.PISO_S);

/** Respostas por exercício: `Partial` porque só existe o que a pessoa já fez. */
export type Duracoes = Partial<Record<Ex, readonly number[]>>;
const duracoesK = (d: Duracoes): K.Duracao[] => Object.entries(d).map(([e, v]) => new K.Duracao(e, [...(v as number[])]));
const duracoesDe = (d: K.Duracao[]): Duracoes => Object.fromEntries(d.map((x) => [x.exercicio, [...x.valores]]));

export const mediana = (valores: readonly number[]): number => K.mediana([...valores]);
/** Segundos por pergunta: a mediana das últimas respostas da pessoa, ou o palpite se ainda são poucas. */
export const medianaDe = (exercicio: Ex, duracoes: Duracoes): number => K.medianaDe(exercicio, duracoesK(duracoes));
/** O programa com o número de perguntas de cada bloco (ao menos duas). */
export const planejar = (secao: Secao, foco: Foco, minutos: Minutos, duracoes: Duracoes): BlocoPlano[] =>
  K.planejar(secao, foco, minutos, duracoesK(duracoes)).map((b) => ({ exercicio: b.exercicio as Ex, perguntas: b.perguntas }));
/** Quanto o plano deve levar, em segundos, com o ritmo atual da pessoa. */
export const estimarSegundos = (plano: readonly BlocoPlano[], duracoes: Duracoes): number =>
  K.estimarSegundos(plano.map((b) => new K.BlocoPlano(b.exercicio, b.perguntas)), duracoesK(duracoes));
/** Minutos inteiros para mostrar: o mais perto, nunca zero. */
export const minutosParaMostrar = (segundos: number): number => K.minutosParaMostrar(segundos);
/** Guarda uma duração (em ms) no fim da lista do exercício: limitada ao teto e às últimas `AMOSTRAS_MAX`. */
export function registrarDuracao(duracoes: Duracoes, exercicio: Ex, ms: number): Duracoes {
  const k = duracoesK(duracoes);
  const r = K.registrarDuracao(k, exercicio, ms);
  return r === k ? duracoes : duracoesDe(r);
}

// ---------------------------------------------------------------- cantar (Cantar.kt)
/** A nota no tempo: segundos a partir da primeira nota do trecho. `midi` null = pausa. */
export type Janela = { ini: number; fim: number; midi: number | null; sil: string };
const janelaK = (j: Janela) => new K.Janela(j.ini, j.fim, j.midi, j.sil);
const notasMusicaK = (notas: readonly NotaMusica[]) => notas.map((n) => new K.NotaMusica(n.st, n.dur, n.sil));

/** Uma nota que dura menos que isto (em segundos) é de passagem: ninguém firma a altura em tão pouco tempo, então não é avaliada. */
export const CURTA_S: number = val(K.CURTA_S);
export const ehCurta = (j: Janela): boolean => K.ehCurta(janelaK(j));
export const janelas = (notas: readonly NotaMusica[], bpm: number, tonicaMidi: number): Janela[] =>
  K.janelas(notasMusicaK(notas), bpm, tonicaMidi).map((j) => ({ ini: j.ini, fim: j.fim, midi: opt(j.midi) ?? null, sil: j.sil }));
export const duracaoDe = (js: readonly Janela[]): number => K.duracaoDe(js.map(janelaK));
/**
 * A tônica (MIDI) de uma classe de altura (0 = Dó) numa oitava em que a melodia fica em volta do Dó central e dentro do alcance
 * do piano de amostras. Se a melodia for mais larga que isso, vale a mais próxima do centro.
 */
export const tonicaParaCaber = (classe: number, notas: readonly NotaMusica[], faixa?: Faixa): number =>
  K.tonicaParaCaber(classe, notasMusicaK(notas), faixa ? faixaK(faixa) : null);
/** Leva `midi` para a oitava mais perto de `centro`: com "qualquer oitava", a voz aparece dentro da pista, onde quer que cante. */
export const dobrar = (midi: number, centro: number): number => K.dobrar(midi, centro);

export type Amostra = { t: number; midi: number | null };
/** O começo de cada nota é perdoado (a pessoa leva um instante para entrar, e o microfone e a suavização atrasam). */
export const GRACA_S: number = val(K.GRACA_S);
export const GRACA_MAX: number = val(K.GRACA_MAX);
/** Quanto da janela (depois da folga) a voz precisa estar na altura certa. */
export const LIMIAR: number = val(K.LIMIAR);
/** Compensação do atraso do microfone e da suavização. */
export const LATENCIA_S: number = val(K.LATENCIA_S);

export type Acerto = { fracao: number; ok: boolean; ouvido: number | null };
const acertoDe = (a: K.Acerto): Acerto => ({ fracao: a.fracao, ok: a.ok, ouvido: opt(a.ouvido) ?? null });
/** O quanto da janela (até `ate`, para a leitura ao vivo) a voz esteve dentro da margem em torno da nota. */
export const acertoDaNota = (amostras: readonly Amostra[], j: Janela, tolerancia: number, qualquerOitava: boolean, ate = j.fim): Acerto =>
  acertoDe(K.acertoDaNota(amostras.map((a) => new K.Amostra(a.t, a.midi)), janelaK(j), tolerancia, qualquerOitava, ate));

export type Resumo = { acertadas: number; total: number; ok: boolean };
/** Quantas notas (sem contar pausas nem notas de passagem) foram cantadas, e se o trecho passa: 80% ou mais. */
export const resumir = (js: readonly Janela[], acertos: readonly Acerto[]): Resumo => {
  const r = K.resumir(js.map(janelaK), acertos.map((a) => new K.Acerto(a.fracao, a.ok, a.ouvido)));
  return { acertadas: r.acertadas, total: r.total, ok: r.ok };
};

// ---------------------------------------------------------------- violão (Violao.kt)
/** MIDI das cordas soltas, da 1ª (mais fina) à 6ª: e B G D A E. */
export const ABERTAS: readonly number[] = arr(K.ABERTAS);
export const CASAS: number = val(K.CASAS);
export type Pos = { corda: number; casa: number; midi: number };
const posDe = (p: K.Pos): Pos => ({ corda: p.corda, casa: p.casa, midi: p.midi });

/** Todas as posições de uma nota nas primeiras casas, da mais à frente para trás. */
export const posicoesDe = (midi: number): Pos[] => K.posicoesDe(midi).map(posDe);
/** A posição mais à frente do braço (menor casa), ou null se a nota não cabe nas 12 primeiras casas. */
export const melhorPosicao = (midi: number): Pos | null => {
  const p = K.melhorPosicao(midi);
  return p ? posDe(p) : null;
};
/** Um acorde no violão: uma nota por corda, numa forma que cabe na mão e o mais à frente do braço possível (ver Violao.kt). */
export const acordeNoBraco = (midis: readonly number[]): Pos[] | null => {
  const f = K.acordeNoBraco([...midis]);
  return f ? f.map(posDe) : null;
};
/** A forma de um arpejo: todas as posições das notas dele (qualquer oitava) numa janela de 5 casas, a mais à frente possível. */
export type Forma = { posicoes: (Pos & { raiz: boolean })[]; de: number; ate: number };
export const formaDoArpejo = (midis: readonly number[]): Forma | null => {
  const f = K.formaDoArpejo([...midis]);
  return f ? { posicoes: f.posicoes.map((p) => ({ ...posDe(p), raiz: p.raiz })), de: f.de, ate: f.ate } : null;
};
