// O motor da tela do afinador, fora do React: mesmo fluxo do MainActivity + TunerView do app.
// microfone → PitchPipeline → PitchSmoother → cena → desenho, com a agulha animando sozinha.
import { openMic, type Mic } from "@/core/audio";
import {
  Box, CHUNK_SAMPLES, NeedleAnimator, PitchPipeline, PitchSmoother, TunerScene,
  computeGeometry, readingFromMidi, type NoteReading, type TunerGeometry,
} from "@/core/pitch";
import { drawTuner, readTunerColors, type TunerColors } from "./painter";

type Layout = { g: TunerGeometry; width: number; height: number; colors: TunerColors };

export class TunerEngine {
  private readonly scene = new TunerScene();
  private readonly needle = new NeedleAnimator();
  private readonly smoother = new PitchSmoother();
  private canvas: HTMLCanvasElement | null = null;
  private layout: Layout | null = null;
  private frame = 0;
  private mic: Mic | null = null;
  private lastNote = "";
  private opening: Promise<void> | null = null;
  private cancelled = false;

  private onNoteChange: (reading: NoteReading) => void = () => {};

  get listening(): boolean {
    return this.mic !== null;
  }

  /**
   * Liga o motor a um canvas que acompanha o tamanho de `box`. Devolve a função que desliga.
   * `onNoteChange` avisa quando muda a nota ouvida (ou ela fica afinada), para leitores de tela.
   */
  attach(canvas: HTMLCanvasElement, box: HTMLElement, onNoteChange: (reading: NoteReading) => void): () => void {
    this.canvas = canvas;
    this.onNoteChange = onNoteChange;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(box.clientWidth * dpr);
      const height = Math.round(box.clientHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      // A geometria é a do app: área em pixels e a densidade no papel do dp do Android.
      // As cores também se releem aqui: cruzar os 640px muda o tamanho da caixa e a paleta junto.
      this.layout = { g: computeGeometry(new Box(0, 0, width, height), dpr), width, height, colors: readTunerColors(box) };
      this.draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.canvas = null;
      this.onNoteChange = () => {};
    };
  }

  /** reading null = silêncio: a última nota e a agulha ficam onde estavam, apagadas, para dar para ler a última leitura. */
  show(reading: NoteReading | null, level: number) {
    const { scene } = this;
    scene.active = reading !== null;
    scene.level = level;
    if (reading) {
      scene.reading = reading;
      scene.message = null;
      const note = `${reading.name}${reading.octave}${reading.isInTune ? "+" : ""}`;
      if (note !== this.lastNote) { this.lastNote = note; this.onNoteChange(reading); }
      this.needle.target = reading.cents;
    }
    this.draw();
  }

  /** Troca a linha da frequência por um aviso (ex.: microfone negado). */
  showMessage(text: string) {
    const { scene } = this;
    scene.message = text;
    scene.active = false;
    scene.level = 0;
    this.needle.target = 0;
    this.draw();
  }

  /**
   * Abre o microfone e começa a afinar. Falha com MicError (ver core/audio/mic.ts). Sem nenhum gesto na página
   * ainda, chama `onNeedsGesture` e espera o primeiro clique ou toque.
   */
  async listen(onNeedsGesture?: () => void): Promise<void> {
    if (this.mic) return;
    // Um pedido só por vez: dois openMic seguidos deixariam um microfone órfão, ainda desenhando na tela.
    this.cancelled = false;
    if (this.opening) return this.opening;
    this.opening = (async () => {
      let pipeline: PitchPipeline | null = null;
      const mic = await openMic(CHUNK_SAMPLES, (chunk) => {
        if (!pipeline) return;
        const sample = pipeline.process(chunk, chunk.length);
        const midi = this.smoother.push(sample.midi ?? null);
        this.show(midi == null ? null : readingFromMidi(midi), sample.level);
      }, onNeedsGesture);
      if (this.cancelled) { mic.stop(); return; }
      pipeline = new PitchPipeline(mic.sampleRate);
      this.mic = mic;
    })().finally(() => { this.opening = null; });
    return this.opening;
  }

  /** Solta o microfone; se ele ainda está abrindo, solta assim que abrir. */
  stop() {
    this.cancelled = true;
    this.mic?.stop();
    this.mic = null;
    this.smoother.reset();
    this.show(null, 0);
  }

  private draw = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const ctx = this.canvas?.getContext("2d");
      if (!ctx || !this.layout) return;
      const stillMoving = this.needle.step(performance.now());
      this.scene.needleCents = this.needle.position;
      drawTuner(ctx, this.layout.g, this.scene, this.layout.width, this.layout.height, this.layout.colors);
      if (stillMoving) this.draw();
    });
  };
}
