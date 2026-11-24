// Microfone em blocos de tamanho fixo, como o AudioCapture do app Android.
// Só no navegador. Pode ser pedido ao abrir a página: se o navegador ainda não deixa o áudio rodar (nenhum
// clique ou toque na página até agora), espera o primeiro gesto e avisa com `onNeedsGesture`.
import { getAudio } from "./context";

export type MicProblem = "denied" | "unavailable" | "failed";

export class MicError extends Error {
  constructor(readonly problem: MicProblem, cause?: unknown) {
    super(problem, { cause });
  }
}

export type Mic = { sampleRate: number; stop: () => void };

const PROCESSOR = "marmota-mic-tap";

// Junta os quadros de 128 amostras do áudio em blocos de `size` e manda cada bloco para a página.
const TAP_SOURCE = `
class Tap extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.size = options.processorOptions.size;
    this.chunk = new Float32Array(this.size);
    this.filled = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.chunk[this.filled++] = channel[i];
        if (this.filled === this.size) {
          this.port.postMessage(this.chunk, [this.chunk.buffer]);
          this.chunk = new Float32Array(this.size);
          this.filled = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("${PROCESSOR}", Tap);
`;

/**
 * Põe o áudio para rodar. Sem nenhum gesto na página, o navegador segura o resume() até o primeiro clique,
 * toque ou tecla: então avisa e espera esse gesto.
 */
async function running(ctx: AudioContext, onNeedsGesture?: () => void) {
  if (ctx.state === "running") return;
  await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 400))]);
  if ((ctx.state as AudioContextState) === "running") return; // o await acima pode ter mudado o estado
  onNeedsGesture?.();
  await new Promise<void>((resolve) => {
    const go = () => {
      void ctx.resume().then(() => {
        for (const type of GESTURES) window.removeEventListener(type, go, true);
        resolve();
      });
    };
    for (const type of GESTURES) window.addEventListener(type, go, true);
  });
}
const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

const loaded = new WeakSet<BaseAudioContext>();

async function loadTap(ctx: AudioContext) {
  if (loaded.has(ctx)) return;
  const url = URL.createObjectURL(new Blob([TAP_SOURCE], { type: "text/javascript" }));
  try {
    await ctx.audioWorklet.addModule(url);
    loaded.add(ctx);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Abre o microfone e chama `onChunk` a cada `chunkSize` amostras (mono, −1..1).
 * Falha com MicError: "denied" (o usuário ou o navegador negou), "unavailable" (sem microfone ou sem suporte),
 * "failed" (qualquer outro erro).
 *
 * Ex.: const mic = await openMic(1024, (chunk) => pipeline.process(chunk, chunk.length)); … mic.stop();
 */
export async function openMic(
  chunkSize: number,
  onChunk: (chunk: Float32Array) => void,
  onNeedsGesture?: () => void,
): Promise<Mic> {
  const audio = getAudio();
  if (!audio || !navigator.mediaDevices?.getUserMedia || !audio.ctx.audioWorklet) throw new MicError("unavailable");
  const { ctx } = audio;

  let stream: MediaStream;
  try {
    // Sem os filtros de voz: eles achatam uma corda que vai morrendo e atrapalham a detecção.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") throw new MicError("denied", err);
    if (name === "NotFoundError" || name === "OverconstrainedError") throw new MicError("unavailable", err);
    throw new MicError("failed", err);
  }

  try {
    await running(ctx, onNeedsGesture);
    await loadTap(ctx);
    const source = ctx.createMediaStreamSource(stream);
    const tap = new AudioWorkletNode(ctx, PROCESSOR, { processorOptions: { size: chunkSize } });
    // O nó só roda se estiver ligado à saída; o ganho zero garante que nada do microfone sai na caixa.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    tap.port.onmessage = (e: MessageEvent<Float32Array>) => onChunk(e.data);
    source.connect(tap).connect(mute).connect(ctx.destination);
    return {
      sampleRate: ctx.sampleRate,
      stop: () => {
        tap.port.onmessage = null;
        source.disconnect();
        tap.disconnect();
        mute.disconnect();
        for (const track of stream.getTracks()) track.stop();
      },
    };
  } catch (err) {
    for (const track of stream.getTracks()) track.stop();
    throw new MicError("failed", err);
  }
}
