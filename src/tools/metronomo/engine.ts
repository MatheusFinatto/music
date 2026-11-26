// Toca o metrônomo no Web Audio. A conta de quando cada clique soa é do Kotlin (Metronome); aqui só se
// agenda cada clique no relógio do áudio, um pouco à frente, e se avisa a tela no instante em que ele soa.
import { getAudio, outputDelay, readyAudio, resumeAudio, type AudioGraph } from "@/core/audio";
import { ACCENT, BEAT, MUTE, Metronome, SUB, renderChime, renderClick, type Tick } from "@/core/rhythm";

const LOOKAHEAD = 0.12; // segundos agendados à frente
const TICK_MS = 25;

/** [subdivision] é o id da divisão do tempo; [accents] tem um acento (ACCENT, BEAT ou MUTE) por tempo, até MAX_BEATS. */
export type MetronomeSettings = { bpm: number; beatsPerBar: number; subdivision: number; accents: number[] };

export class MetronomeEngine {
  private readonly clock = new Metronome();
  private graph: AudioGraph | null = null;
  private buffers = new Map<number, AudioBuffer>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private pending: ReturnType<typeof setTimeout>[] = [];
  private sources: AudioBufferSourceNode[] = [];
  /** Muda a cada start/stop: um start que ainda espera a saída abrir e foi parado não começa depois. */
  private vez = 0;
  running = false;

  /** Chamado no instante em que cada clique soa (para a tela acender o tempo). */
  constructor(private readonly onTick: (tick: Tick) => void) {}

  apply(s: MetronomeSettings) {
    this.clock.bpm = s.bpm;
    this.clock.beatsPerBar = s.beatsPerBar;
    this.clock.subdivision = s.subdivision;
    this.clock.restoreAccents(Int32Array.from(s.accents));
  }

  /** Chame dentro de um gesto do usuário. Devolve false se o navegador não tem áudio. */
  start(s: MetronomeSettings): boolean {
    const g = resumeAudio();
    if (!g) return false;
    this.stop();
    this.graph = g;
    if (this.buffers.size === 0)
      for (const kind of [ACCENT, BEAT, SUB]) {
        const data = renderClick(kind, g.ctx.sampleRate);
        const buf = g.ctx.createBuffer(1, data.length, g.ctx.sampleRate);
        buf.getChannelData(0).set(data);
        this.buffers.set(kind, buf);
      }
    this.apply(s);
    this.running = true;
    // O primeiro clique só sai com a saída aberta: no celular, o que se agenda antes disso some (a pauta tinha o mesmo).
    // Na primeira vez espera ~¼ s; depois, readyAudio volta na hora.
    const vez = this.vez;
    void readyAudio(g).then(() => {
      if (vez !== this.vez) return;
      this.clock.reset(g.ctx.currentTime + 0.08);
      this.timer = setInterval(() => this.schedule(), TICK_MS);
      this.schedule();
    });
    return true;
  }

  stop() {
    this.vez++;
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.pending.forEach(clearTimeout);
    this.pending = [];
    for (const s of this.sources) { try { s.stop(); } catch { /* já parou */ } }
    this.sources = [];
  }

  private schedule() {
    const g = this.graph ?? getAudio();
    if (!g) return;
    const now = g.ctx.currentTime;
    // A tela acende quando o clique sai no alto-falante, não quando é calculado (no Android a saída atrasa mais).
    const atraso = outputDelay(g.ctx);
    // Aba em segundo plano: o timer atrasa. Clique que já passou é pulado, sem tocar atrasado.
    while (this.clock.nextTime < now + LOOKAHEAD) {
      const tick = this.clock.next();
      if (tick.time < now - 0.02) continue;
      this.pending.push(setTimeout(() => this.onTick(tick), Math.max(0, (tick.time - now + atraso) * 1000)));
      if (this.pending.length > 64) this.pending = this.pending.slice(-32);
      if (tick.kind === MUTE) continue; // tempo mudo: a tela acompanha, o som não
      const src = g.ctx.createBufferSource();
      src.buffer = this.buffers.get(tick.kind)!;
      src.connect(g.bus.click);
      src.start(tick.time);
      src.onended = () => { this.sources = this.sources.filter((x) => x !== src); };
      this.sources.push(src);
    }
  }
}

/** Avisa que o timer acabou: dois tons curtos, os mesmos do app (ClickSound.renderChime no núcleo). */
export function chime() {
  const g = getAudio();
  if (!g) return;
  const data = renderChime(g.ctx.sampleRate);
  const buf = g.ctx.createBuffer(1, data.length, g.ctx.sampleRate);
  buf.getChannelData(0).set(data);
  const src = g.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(g.master);
  src.start(g.ctx.currentTime + 0.05);
}
