// Transporte: o relógio musical que toca a base em ciclo e avisa quem estiver ouvindo.
// Conta em semicolcheias, compasso 4/4, um acorde por compasso (ou o compasso dividido em partes iguais).
import type { Chord } from "@/core/theory";
import { getAudio, resumeAudio, silence, type AudioGraph } from "./context";
import { prepareLead } from "./lead";
import { STYLES, bassNote, click, hat, kick, pad, snare, voicing, type Style, type StyleName } from "./backing";

/**
 * `chords`: um acorde por compasso, em ciclo. `split`: compassos com mais de um acorde (mesma posição em
 * `chords`), que dividem o compasso em partes iguais (2 ou 4).
 */
export type Backing = { chords: Chord[]; split?: (Chord[] | undefined)[]; bpm: number; style: StyleName; click?: boolean };

export type BeatInfo = {
  /** Tempo absoluto desde o início (negativo durante a contagem). */
  beat: number;
  /** Compasso absoluto desde o início (negativo na contagem) e posição dentro do ciclo. */
  bar: number;
  barInCycle: number;
  /** Tempo dentro do compasso, 0..3. */
  beatInBar: number;
  chord: Chord | null;
  /** Instante no relógio do AudioContext em que este tempo soa. */
  time: number;
};

type Events = { beat: (info: BeatInfo) => void; start: () => void; stop: () => void };

const LOOKAHEAD = 0.15; // segundos agendados à frente
const TICK = 25; // ms entre verificações

class Transport {
  running = false;
  /** Quando true, a base não soa (o relógio e os eventos continuam). */
  muted = false;
  private graph: AudioGraph | null = null;
  private backing: Backing | null = null;
  private style: Style = STYLES.balada;
  private t0 = 0;
  private beatDur = 60 / 72;
  private nextStep = 0;
  /** Andamento pedido durante a execução, aplicado no próximo compasso. */
  private pendingBeatDur: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: { [K in keyof Events]: Set<Events[K]> } = { beat: new Set(), start: new Set(), stop: new Set() };

  /** Assina um evento; devolve a função que cancela. */
  on<K extends keyof Events>(ev: K, fn: Events[K]): () => void {
    this.listeners[ev].add(fn);
    return () => { this.listeners[ev].delete(fn); };
  }

  /** Chame dentro de um gesto do usuário. `countIn` = compassos de contagem. */
  start(backing: Backing, { countIn = 0 }: { countIn?: number } = {}): boolean {
    const graph = resumeAudio();
    if (!graph || backing.chords.length === 0) return false;
    // As gravações do violão começam a baixar já, durante a contagem.
    prepareLead(graph);
    this.stop();
    this.graph = graph;
    this.pendingBeatDur = null;
    this.setBacking(backing);
    this.t0 = graph.ctx.currentTime + 0.12 + countIn * 4 * this.beatDur;
    this.nextStep = -countIn * 16;
    this.running = true;
    this.timer = setInterval(() => this.schedule(), TICK);
    this.schedule();
    this.listeners.start.forEach((f) => f());
    return true;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.graph) silence(this.graph);
    this.listeners.stop.forEach((f) => f());
  }

  /** Troca acordes ou estilo sem parar. Para o andamento, use setTempo. */
  setBacking(backing: Backing) {
    this.backing = backing;
    this.style = STYLES[backing.style];
    if (!this.running) this.beatDur = 60 / backing.bpm;
  }

  /**
   * Muda o andamento. Tocando, vale a partir do próximo compasso, sem salto: quem agendou notas até o fim do
   * compasso (a frase do eco, o exemplo) continua alinhado com a base.
   */
  setTempo(bpm: number) {
    if (this.backing) this.backing = { ...this.backing, bpm };
    if (this.running) this.pendingBeatDur = 60 / bpm;
    else this.beatDur = 60 / bpm;
  }

  private applyPendingTempo() {
    if (this.pendingBeatDur === null) return;
    const next = this.pendingBeatDur;
    this.t0 += (this.nextStep * (this.beatDur - next)) / 4;
    this.beatDur = next;
    this.pendingBeatDur = null;
  }

  get secondsPerBeat() { return this.beatDur; }
  /** Instante (relógio do AudioContext) de um tempo absoluto. */
  timeOfBeat(beat: number) { return this.t0 + beat * this.beatDur; }
  /** Tempo atual, fracionado. */
  currentBeat() { const g = this.graph ?? getAudio(); return g ? (g.ctx.currentTime - this.t0) / this.beatDur : 0; }

  private schedule() {
    const { graph, backing } = this;
    if (!graph || !backing) return;
    const n = backing.chords.length;
    while (true) {
      if (this.pendingBeatDur !== null && ((this.nextStep % 16) + 16) % 16 === 0) this.applyPendingTempo();
      const stepDur = this.beatDur / 4;
      if (this.t0 + this.nextStep * stepDur >= graph.ctx.currentTime + LOOKAHEAD) break;
      const step = this.nextStep, t = this.t0 + step * stepDur;
      const s = ((step % 16) + 16) % 16;
      const bar = Math.floor(step / 16);
      const barInCycle = ((bar % n) + n) % n;
      const parts = backing.split?.[barInCycle];
      const partLen = parts ? 16 / parts.length : 16;
      const chord = step < 0 ? null : parts ? parts[Math.floor(s / partLen)]! : backing.chords[barInCycle]!;

      // Timer estrangulado (aba em segundo plano): o passo já passou. Avança o relógio sem tocar.
      const late = t < graph.ctx.currentTime - 0.03;
      if (late) {
        this.nextStep++;
        continue;
      }
      if (step < 0) {
        if (s % 4 === 0) click(graph, t, s === 0);
      } else if (!this.muted && chord) {
        const st = this.style, v = voicing(chord);
        if (s % partLen === 0) pad(graph, v.pad, t, partLen * stepDur);
        if (st.bass[s]) {
          let len = 1;
          while (s + len < 16 && !st.bass[s + len]) len++;
          bassNote(graph, v.bass, t, len * stepDur * 0.95);
        }
        if (st.kick?.[s]) kick(graph, t, st.kick[s]!);
        if (st.snare?.[s]) snare(graph, t, st.snare[s]!);
        if (st.hat?.[s]) hat(graph, t, st.hat[s]!);
        if (backing.click && s % 4 === 0) click(graph, t, s === 0);
      }
      if (s % 4 === 0) {
        const info: BeatInfo = { beat: step / 4, bar, barInCycle, beatInBar: s / 4, chord, time: t };
        this.listeners.beat.forEach((f) => f(info));
      }
      this.nextStep++;
    }
  }
}

/** O transporte do site. Uma base de cada vez. */
export const transport = new Transport();

/** Roda `fn` na tela no instante em que `time` (relógio do áudio) soar. Devolve o cancelamento. */
export function atAudioTime(time: number, fn: () => void): () => void {
  const g = getAudio();
  const delay = g ? Math.max(0, (time - g.ctx.currentTime) * 1000) : 0;
  const id = setTimeout(fn, delay);
  return () => clearTimeout(id);
}
