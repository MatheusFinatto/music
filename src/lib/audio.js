// Motor de áudio: vozes, bateria e o transporte que toca a base.
import { getBase, chordsOf, STYLES } from "./base.js";

let ctx = null, master = null;
const bus = {};

export function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master = ctx.createGain();
  master.connect(comp).connect(ctx.destination);
  ["drums", "bass", "chords", "lead", "click"].forEach((k) => { bus[k] = ctx.createGain(); bus[k].connect(master); });
  applyMix();
  return ctx;
}
export const now = () => (ctx ? ctx.currentTime : 0);
export function resume() { if (audio() && ctx.state !== "running") ctx.resume(); }

export function applyMix(mix = getBase().mix) {
  if (!ctx) return;
  master.gain.value = (mix.master ?? 80) / 100;
  bus.drums.gain.value = (mix.drums ?? 70) / 100;
  bus.bass.gain.value = (mix.bass ?? 75) / 100;
  bus.chords.gain.value = (mix.chords ?? 60) / 100;
  bus.lead.gain.value = 1;
  bus.click.gain.value = 1;
}

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Voz de piano elétrico (teclado e ideias).
export function voice(m, t, amp = 1) {
  const g = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain(), f = ctx.createBiquadFilter();
  o1.type = "triangle"; o1.frequency.value = hz(m); o2.type = "sine"; o2.frequency.value = hz(m) * 2; g2.gain.value = 0.25;
  f.type = "lowpass"; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.6);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * amp, t + 0.012); g.gain.setTargetAtTime(0.16 * amp, t + 0.012, 0.18);
  o1.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(bus.lead);
  o1.start(t); o2.start(t);
  return {
    stop(at) {
      const e = Math.max(at, t + 0.03);
      if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(e); else g.gain.cancelScheduledValues(e);
      g.gain.setTargetAtTime(0, e, 0.07);
      o1.stop(e + 0.7); o2.stop(e + 0.7);
    },
  };
}
export function playNote(m, t, dur) { voice(m, t).stop(t + dur); }

function pad(notes, t, dur) {
  notes.forEach((m) => [-6, 6].forEach((det) => {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det;
    f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 0.4;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.2);
    g.gain.setValueAtTime(0.04, t + dur - 0.25); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(bus.chords); o.start(t); o.stop(t + dur + 0.05);
  }));
}
function bassNote(m, t, dur) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = "sawtooth"; o.frequency.value = hz(m);
  f.type = "lowpass"; f.frequency.value = 520;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42, t + 0.01);
  g.gain.setTargetAtTime(0.22, t + 0.01, 0.12); g.gain.setTargetAtTime(0, t + Math.max(0.05, dur - 0.04), 0.03);
  o.connect(f).connect(g).connect(bus.bass); o.start(t); o.stop(t + dur + 0.2);
}

let noiseBuf = null;
function noise() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function kick(t, v) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  o.connect(g).connect(bus.drums); o.start(t); o.stop(t + 0.35);
}
function snare(t, v) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(); f.type = "highpass"; f.frequency.value = 1200;
  g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  n.connect(f).connect(g).connect(bus.drums); n.start(t); n.stop(t + 0.2);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.type = "triangle"; o.frequency.value = 190;
  og.gain.setValueAtTime(0.3 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  o.connect(og).connect(bus.drums); o.start(t); o.stop(t + 0.1);
}
function hat(t, v) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(); f.type = "highpass"; f.frequency.value = 7000;
  g.gain.setValueAtTime(0.22 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(f).connect(g).connect(bus.drums); n.start(t); n.stop(t + 0.06);
}
export function click(t, strong) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = strong ? 1600 : 1100;
  g.gain.setValueAtTime(strong ? 0.25 : 0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(bus.click); o.start(t); o.stop(t + 0.06);
}

// Toca um acorde (sem o transporte), útil para ouvir ao montar a base.
export function previewChord(ch) {
  if (!audio()) return; resume();
  const t = ctx.currentTime + 0.03;
  pad(ch.pad, t, 1.2); bassNote(ch.bass, t, 1.1);
}

/*
  Transporte. Conta em semicolcheias; a cada tempo avisa os ouvintes com
  (beat, time, info). beat negativo = contagem. O ciclo tem 4 compassos (16 tempos).
*/
export const transport = {
  running: false,
  t0: 0, beatDur: 60 / 72, nextStep: 0, timer: null,
  base: null, chords: null,
  listeners: { beat: [], start: [], stop: [] },
  muteBase: false,

  on(ev, f) { this.listeners[ev].push(f); },
  emit(ev, ...a) { this.listeners[ev].forEach((f) => f(...a)); },

  start({ countIn = false, base = getBase() } = {}) {
    if (!audio()) return false;
    resume();
    this.base = base; this.chords = chordsOf(base);
    applyMix(base.mix);
    this.beatDur = 60 / base.bpm;
    const pre = countIn ? 4 : 0;
    this.t0 = ctx.currentTime + 0.12 + pre * this.beatDur;
    this.nextStep = -pre * 4;
    this.running = true;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
    this.emit("start");
    return true;
  },
  stop() {
    if (!this.running) return;
    this.running = false; clearInterval(this.timer);
    this.emit("stop");
  },
  // Troca a base no meio sem parar (vale a partir do próximo compasso).
  update(base = getBase()) {
    if (!this.running) return;
    this.base = base; this.chords = chordsOf(base); applyMix(base.mix);
  },
  stepTime(n) { return this.t0 + n * this.beatDur / 4; },
  beatTime(b) { return this.t0 + b * this.beatDur; },
  curBeat() { return ctx ? (ctx.currentTime - this.t0) / this.beatDur : 0; },
  chordAt(beat) { const p = ((beat % 16) + 16) % 16; return this.chords[Math.floor(p / 4)]; },

  schedule() {
    while (this.stepTime(this.nextStep) < ctx.currentTime + 0.15) {
      const n = this.nextStep, t = this.stepTime(n), sd = this.beatDur / 4;
      if (n < 0) {
        if (n % 4 === 0) click(t, n === -16);
      } else if (!this.muteBase) {
        const s = n % 16, bar = Math.floor(n / 16) % 4, ch = this.chords[bar];
        const st = STYLES[this.base.style] || STYLES.balada;
        if (s === 0) pad(ch.pad, t, 16 * sd);
        if (st.bass && st.bass[s]) {
          let len = 1; while (s + len < 16 && !st.bass[s + len]) len++;
          bassNote(ch.bass, t, len * sd * 0.95);
        }
        if (st.kick && st.kick[s]) kick(t, st.kick[s]);
        if (st.snare && st.snare[s]) snare(t, st.snare[s]);
        if (st.hat && st.hat[s]) hat(t, st.hat[s]);
        if (this.base.click && s % 4 === 0) click(t, s === 0);
      }
      if (n % 4 === 0) {
        const beat = n / 4;
        this.emit("beat", beat, t, { chord: beat >= 0 ? this.chordAt(beat) : null });
      }
      this.nextStep++;
    }
  },
};
