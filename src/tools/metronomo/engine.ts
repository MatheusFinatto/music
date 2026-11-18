// Toca o metrônomo no Web Audio. A conta de quando cada clique soa é do Kotlin (Metronome); aqui só se
// agenda cada clique no relógio do áudio, um pouco à frente, e se avisa a tela no instante em que ele soa.
import { getAudio, resumeAudio, type AudioGraph } from "@/core/audio";
import { ACCENT, BEAT, Metronome, SUB, renderClick, type Tick } from "@/core/rhythm";

const LOOKAHEAD = 0.12; // segundos agendados à frente
const TICK_MS = 25;

export type MetronomeSettings = { bpm: number; beatsPerBar: number; subdivision: number; accentFirst: boolean };

export class MetronomeEngine {
  private readonly clock = new Metronome();
  private graph: AudioGraph | null = null;
  private buffers = new Map<number, AudioBuffer>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private pending: ReturnType<typeof setTimeout>[] = [];
  private sources: AudioBufferSourceNode[] = [];
  running = false;

  /** Chamado no instante em que cada clique soa (para a tela acender o tempo). */
  constructor(private readonly onTick: (tick: Tick) => void) {}

  apply(s: MetronomeSettings) {
    this.clock.bpm = s.bpm;
    this.clock.beatsPerBar = s.beatsPerBar;
    this.clock.subdivision = s.subdivision;
    this.clock.accentFirst = s.accentFirst;
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
    this.clock.reset(g.ctx.currentTime + 0.08);
    this.running = true;
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
    return true;
  }

  stop() {
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
    // Aba em segundo plano: o timer atrasa. Clique que já passou é pulado, sem tocar atrasado.
    while (this.clock.nextTime < now + LOOKAHEAD) {
      const tick = this.clock.next();
      if (tick.time < now - 0.02) continue;
      const src = g.ctx.createBufferSource();
      src.buffer = this.buffers.get(tick.kind)!;
      src.connect(g.bus.click);
      src.start(tick.time);
      src.onended = () => { this.sources = this.sources.filter((x) => x !== src); };
      this.sources.push(src);
      this.pending.push(setTimeout(() => this.onTick(tick), Math.max(0, (tick.time - now) * 1000)));
      if (this.pending.length > 64) this.pending = this.pending.slice(-32);
    }
  }
}
