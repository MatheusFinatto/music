import {
  protoOf180f3jzyo7rfj as protoOf,
  initMetadataForCompanion1wyw17z38v6ac as initMetadataForCompanion,
  initMetadataForClassbxx6q50dy2s7 as initMetadataForClass,
  coerceIn1xblvmyr0tby6 as coerceIn,
  isNaNymqb93xtq8w8 as isNaN_0,
  VOID3gxj6tk5isa35 as VOID,
  coerceIn10f36k81le1mm as coerceIn_0,
  defineProp3hxgpk2knu2px as defineProp,
  numberToInt1ygmcfwhs2fkq as numberToInt,
  initMetadataForObject1cxne3s9w65el as initMetadataForObject,
  ArrayList_init_$Create$149jv2ovkkvnt as ArrayList_init_$Create$,
  last1vo29oleiqj36 as last,
  Unit_instance1fbcbse1fwigr as Unit_instance,
  emptyList1g2z5xcrvp2zy as emptyList,
  sorted354mfsiv4s7x5 as sorted,
  round2mrvepag8eey0 as round,
  listOf1jh22dvmctj1r as listOf,
  getNumberHashCode2l4nbdcihl25f as getNumberHashCode,
  THROW_CCE2g6jy02ryeudk as THROW_CCE,
  equals2au1ep9vhcato as equals,
  isFinite2t9l5a275mxm6 as isFinite,
  toString1pkumu07cwy4m as toString,
  IllegalArgumentException_init_$Create$3ewkh27kzt8z8 as IllegalArgumentException_init_$Create$,
  roundToInt1ue8x8yshtznx as roundToInt,
  arrayCopytctsywo3h7gj as arrayCopy,
  coerceInlzh524ulyz3c as coerceIn_1,
  ArrayDeque_init_$Create$2333dl090ltjt as ArrayDeque_init_$Create$,
  coerceAtLeast2bkz8m9ik7hep as coerceAtLeast,
} from './kotlin-kotlin-stdlib.mjs';
//region block: imports
var imul = Math.imul;
var log2 = Math.log2;
var log10 = Math.log10;
//endregion
//region block: pre-declaration
initMetadataForCompanion(Companion);
initMetadataForClass(Tick, 'Tick');
initMetadataForCompanion(Companion_0);
initMetadataForClass(Metronome, 'Metronome', Metronome);
initMetadataForObject(ClickSound_0, 'ClickSound');
initMetadataForClass(TapTempo, 'TapTempo', TapTempo);
initMetadataForCompanion(Companion_1);
initMetadataForClass(NeedleAnimator, 'NeedleAnimator', NeedleAnimator);
initMetadataForCompanion(Companion_2);
initMetadataForClass(NoteReading, 'NoteReading');
initMetadataForObject(NoteMapper_0, 'NoteMapper');
initMetadataForClass(PitchSample, 'PitchSample');
initMetadataForClass(SampleWindow, 'SampleWindow');
initMetadataForCompanion(Companion_3);
initMetadataForClass(PitchPipeline, 'PitchPipeline');
initMetadataForCompanion(Companion_4);
initMetadataForClass(PitchSmoother, 'PitchSmoother', PitchSmoother);
initMetadataForClass(Box, 'Box');
initMetadataForCompanion(Companion_5);
initMetadataForClass(TunerGeometry, 'TunerGeometry');
initMetadataForClass(TunerScene, 'TunerScene', TunerScene);
initMetadataForClass(YinPitchDetector, 'YinPitchDetector');
//endregion
function Companion() {
  this.ACCENT = 0;
  this.BEAT = 1;
  this.SUB = 2;
}
protoOf(Companion).f3 = function () {
  return this.ACCENT;
};
protoOf(Companion).g3 = function () {
  return this.BEAT;
};
protoOf(Companion).h3 = function () {
  return this.SUB;
};
var Companion_instance;
function Companion_getInstance() {
  return Companion_instance;
}
function Tick(time, beat, sub, kind) {
  this.time = time;
  this.beat = beat;
  this.sub = sub;
  this.kind = kind;
}
protoOf(Tick).i3 = function () {
  return this.time;
};
protoOf(Tick).j3 = function () {
  return this.beat;
};
protoOf(Tick).k3 = function () {
  return this.sub;
};
protoOf(Tick).l3 = function () {
  return this.kind;
};
function Companion_0() {
  this.MIN_BPM = 30.0;
  this.MAX_BPM = 250.0;
  this.MAX_BEATS = 12;
}
protoOf(Companion_0).m3 = function () {
  return this.MIN_BPM;
};
protoOf(Companion_0).n3 = function () {
  return this.MAX_BPM;
};
protoOf(Companion_0).o3 = function () {
  return this.MAX_BEATS;
};
protoOf(Companion_0).clampBpm = function (bpm) {
  return isNaN_0(bpm) ? 90.0 : coerceIn(bpm, 30.0, 250.0);
};
var Companion_instance_0;
function Companion_getInstance_0() {
  return Companion_instance_0;
}
function Metronome(bpm, beatsPerBar, subdivision) {
  bpm = bpm === VOID ? 90.0 : bpm;
  beatsPerBar = beatsPerBar === VOID ? 4 : beatsPerBar;
  subdivision = subdivision === VOID ? 1 : subdivision;
  this.p3_1 = Companion_instance_0.clampBpm(bpm);
  this.q3_1 = coerceIn_0(beatsPerBar, 1, 12);
  this.r3_1 = coerceIn_0(subdivision, 1, 4);
  this.accentFirst = true;
  this.nextTime = 0.0;
  this.s3_1 = 0;
}
protoOf(Metronome).t3 = function (value) {
  this.p3_1 = Companion_instance_0.clampBpm(value);
};
protoOf(Metronome).u3 = function () {
  return this.p3_1;
};
protoOf(Metronome).v3 = function (value) {
  this.q3_1 = coerceIn_0(value, 1, 12);
};
protoOf(Metronome).w3 = function () {
  return this.q3_1;
};
protoOf(Metronome).x3 = function (value) {
  this.r3_1 = coerceIn_0(value, 1, 4);
};
protoOf(Metronome).y3 = function () {
  return this.r3_1;
};
protoOf(Metronome).z3 = function (_set____db54di) {
  this.accentFirst = _set____db54di;
};
protoOf(Metronome).a4 = function () {
  return this.accentFirst;
};
protoOf(Metronome).b4 = function () {
  return this.nextTime;
};
protoOf(Metronome).reset = function (start) {
  this.nextTime = start;
  this.s3_1 = 0;
};
protoOf(Metronome).next = function () {
  var perBar = imul(this.q3_1, this.r3_1);
  var i = this.s3_1 % perBar | 0;
  var beat = i / this.r3_1 | 0;
  var sub = i % this.r3_1 | 0;
  var kind = !(sub === 0) ? 2 : beat === 0 && this.accentFirst && this.q3_1 > 1 ? 0 : 1;
  var tick = new Tick(this.nextTime, beat, sub, kind);
  this.nextTime = this.nextTime + 60.0 / this.p3_1 / this.r3_1;
  this.s3_1 = (i + 1 | 0) % perBar | 0;
  return tick;
};
function ClickSound_0() {
  this.DURATION = 0.04;
}
protoOf(ClickSound_0).c4 = function () {
  return this.DURATION;
};
protoOf(ClickSound_0).frequency = function (kind) {
  switch (kind) {
    case 0:
      return 1760.0;
    case 1:
      return 1320.0;
    default:
      return 880.0;
  }
};
protoOf(ClickSound_0).gain = function (kind) {
  switch (kind) {
    case 0:
      return 1.0;
    case 1:
      return 0.7;
    default:
      return 0.4;
  }
};
protoOf(ClickSound_0).render = function (kind, sampleRate) {
  var n = numberToInt(0.04 * sampleRate);
  var f = this.frequency(kind);
  var g = this.gain(kind);
  var tmp = 0;
  var tmp_0 = new Float64Array(n);
  while (tmp < n) {
    var tmp_1 = tmp;
    var t = tmp_1 / sampleRate;
    // Inline function 'kotlin.math.min' call
    var b = t / 0.001;
    var attack = Math.min(1.0, b);
    // Inline function 'kotlin.math.sin' call
    var x = 2 * 3.141592653589793 * f * t;
    var tmp_2 = Math.sin(x);
    // Inline function 'kotlin.math.exp' call
    var x_0 = -t * 110.0;
    tmp_0[tmp_1] = tmp_2 * Math.exp(x_0) * attack * g;
    tmp = tmp + 1 | 0;
  }
  return tmp_0;
};
var ClickSound_instance;
function ClickSound_getInstance() {
  return ClickSound_instance;
}
function TapTempo(maxGap) {
  maxGap = maxGap === VOID ? 2.0 : maxGap;
  this.d4_1 = maxGap;
  this.e4_1 = ArrayList_init_$Create$();
}
protoOf(TapTempo).tap = function (time) {
  var tmp;
  // Inline function 'kotlin.collections.isNotEmpty' call
  if (!this.e4_1.f()) {
    tmp = time - last(this.e4_1) > this.d4_1 || time <= last(this.e4_1);
  } else {
    tmp = false;
  }
  if (tmp) {
    this.e4_1.h2();
  }
  this.e4_1.i(time);
  if (this.e4_1.h() > 6) {
    this.e4_1.g2(0);
  }
  if (this.e4_1.h() < 2)
    return null;
  var tmp0 = this.e4_1;
  var tmp$ret$1;
  $l$block: {
    // Inline function 'kotlin.collections.zipWithNext' call
    var iterator = tmp0.c();
    if (!iterator.d()) {
      tmp$ret$1 = emptyList();
      break $l$block;
    }
    // Inline function 'kotlin.collections.mutableListOf' call
    var result = ArrayList_init_$Create$();
    var current = iterator.e();
    while (iterator.d()) {
      var next = iterator.e();
      var tmp$ret$3 = next - current;
      result.i(tmp$ret$3);
      current = next;
    }
    tmp$ret$1 = result;
  }
  var gaps = sorted(tmp$ret$1);
  var median = (gaps.h() % 2 | 0) === 1 ? gaps.g(gaps.h() / 2 | 0) : (gaps.g((gaps.h() / 2 | 0) - 1 | 0) + gaps.g(gaps.h() / 2 | 0)) / 2;
  return Companion_instance_0.clampBpm(round(60.0 / median));
};
protoOf(TapTempo).reset = function () {
  return this.e4_1.h2();
};
function Companion_1() {
  this.f4_1 = -1.0;
  this.g4_1 = 16.0;
  this.h4_1 = 100.0;
  this.i4_1 = 0.05;
}
var Companion_instance_1;
function Companion_getInstance_1() {
  return Companion_instance_1;
}
function NeedleAnimator(timeConstantMs) {
  timeConstantMs = timeConstantMs === VOID ? 90.0 : timeConstantMs;
  this.j4_1 = timeConstantMs;
  this.target = 0.0;
  this.position = 0.0;
  this.k4_1 = -1.0;
}
protoOf(NeedleAnimator).l4 = function (_set____db54di) {
  this.target = _set____db54di;
};
protoOf(NeedleAnimator).m4 = function () {
  return this.target;
};
protoOf(NeedleAnimator).n4 = function () {
  return this.position;
};
protoOf(NeedleAnimator).step = function (nowMs) {
  var elapsedMs = this.k4_1 === -1.0 ? 16.0 : coerceIn(nowMs - this.k4_1, 0.0, 100.0);
  this.k4_1 = nowMs;
  var tmp = this;
  var tmp_0 = this.position;
  var tmp_1 = this.target - this.position;
  // Inline function 'kotlin.math.exp' call
  var x = -elapsedMs / this.j4_1;
  tmp.position = tmp_0 + tmp_1 * (1 - Math.exp(x));
  // Inline function 'kotlin.math.abs' call
  var x_0 = this.target - this.position;
  if (Math.abs(x_0) >= 0.05)
    return true;
  this.position = this.target;
  this.k4_1 = -1.0;
  return false;
};
function Companion_2() {
  Companion_instance_2 = this;
  this.NOTE_NAMES = listOf(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
  this.IN_TUNE_CENTS = 5.0;
}
protoOf(Companion_2).o4 = function () {
  return this.NOTE_NAMES;
};
protoOf(Companion_2).p4 = function () {
  return this.IN_TUNE_CENTS;
};
var Companion_instance_2;
function Companion_getInstance_2() {
  if (Companion_instance_2 == null)
    new Companion_2();
  return Companion_instance_2;
}
function NoteReading(pitchClass, octave, cents, frequencyHz) {
  Companion_getInstance_2();
  this.pitchClass = pitchClass;
  this.octave = octave;
  this.cents = cents;
  this.frequencyHz = frequencyHz;
}
protoOf(NoteReading).q4 = function () {
  return this.pitchClass;
};
protoOf(NoteReading).r4 = function () {
  return this.octave;
};
protoOf(NoteReading).s4 = function () {
  return this.cents;
};
protoOf(NoteReading).t4 = function () {
  return this.frequencyHz;
};
protoOf(NoteReading).u4 = function () {
  return Companion_getInstance_2().NOTE_NAMES.g(this.pitchClass);
};
protoOf(NoteReading).v4 = function () {
  // Inline function 'kotlin.math.abs' call
  var x = this.cents;
  return Math.abs(x) <= 5.0;
};
protoOf(NoteReading).w4 = function () {
  return this.pitchClass;
};
protoOf(NoteReading).x4 = function () {
  return this.octave;
};
protoOf(NoteReading).y4 = function () {
  return this.cents;
};
protoOf(NoteReading).z4 = function () {
  return this.frequencyHz;
};
protoOf(NoteReading).a5 = function (pitchClass, octave, cents, frequencyHz) {
  return new NoteReading(pitchClass, octave, cents, frequencyHz);
};
protoOf(NoteReading).copy = function (pitchClass, octave, cents, frequencyHz, $super) {
  pitchClass = pitchClass === VOID ? this.pitchClass : pitchClass;
  octave = octave === VOID ? this.octave : octave;
  cents = cents === VOID ? this.cents : cents;
  frequencyHz = frequencyHz === VOID ? this.frequencyHz : frequencyHz;
  return $super === VOID ? this.a5(pitchClass, octave, cents, frequencyHz) : $super.a5.call(this, pitchClass, octave, cents, frequencyHz);
};
protoOf(NoteReading).toString = function () {
  return 'NoteReading(pitchClass=' + this.pitchClass + ', octave=' + this.octave + ', cents=' + this.cents + ', frequencyHz=' + this.frequencyHz + ')';
};
protoOf(NoteReading).hashCode = function () {
  var result = this.pitchClass;
  result = imul(result, 31) + this.octave | 0;
  result = imul(result, 31) + getNumberHashCode(this.cents) | 0;
  result = imul(result, 31) + getNumberHashCode(this.frequencyHz) | 0;
  return result;
};
protoOf(NoteReading).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof NoteReading))
    return false;
  var tmp0_other_with_cast = other instanceof NoteReading ? other : THROW_CCE();
  if (!(this.pitchClass === tmp0_other_with_cast.pitchClass))
    return false;
  if (!(this.octave === tmp0_other_with_cast.octave))
    return false;
  if (!equals(this.cents, tmp0_other_with_cast.cents))
    return false;
  if (!equals(this.frequencyHz, tmp0_other_with_cast.frequencyHz))
    return false;
  return true;
};
function NoteMapper_0() {
  this.A4_HZ = 440.0;
  this.b5_1 = 69;
}
protoOf(NoteMapper_0).c5 = function () {
  return this.A4_HZ;
};
protoOf(NoteMapper_0).midiFromFrequency = function (hz) {
  // Inline function 'kotlin.require' call
  if (!(hz > 0 && isFinite(hz))) {
    var message = 'frequency must be a positive finite number of Hz, got ' + hz;
    throw IllegalArgumentException_init_$Create$(toString(message));
  }
  // Inline function 'kotlin.math.log2' call
  var x = hz / 440.0;
  return 69 + 12 * log2(x);
};
protoOf(NoteMapper_0).frequencyFromMidi = function (midi) {
  // Inline function 'kotlin.math.pow' call
  var x = (midi - 69) / 12;
  return 440.0 * Math.pow(2.0, x);
};
protoOf(NoteMapper_0).readingFromMidi = function (midi) {
  var nearest = roundToInt(midi);
  // Inline function 'kotlin.mod' call
  var r = nearest % 12 | 0;
  var tmp = r + (12 & ((r ^ 12) & (r | (-r | 0))) >> 31) | 0;
  // Inline function 'kotlin.floorDiv' call
  var q = nearest / 12 | 0;
  if ((nearest ^ 12) < 0 && !(imul(q, 12) === nearest)) {
    q = q - 1 | 0;
  }
  var tmp$ret$1 = q;
  return new NoteReading(tmp, tmp$ret$1 - 1 | 0, (midi - nearest) * 100, this.frequencyFromMidi(midi));
};
var NoteMapper_instance;
function NoteMapper_getInstance() {
  return NoteMapper_instance;
}
function PitchSample(midi, level) {
  this.midi = midi;
  this.level = level;
}
protoOf(PitchSample).d5 = function () {
  return this.midi;
};
protoOf(PitchSample).e5 = function () {
  return this.level;
};
protoOf(PitchSample).w4 = function () {
  return this.midi;
};
protoOf(PitchSample).x4 = function () {
  return this.level;
};
protoOf(PitchSample).f5 = function (midi, level) {
  return new PitchSample(midi, level);
};
protoOf(PitchSample).copy = function (midi, level, $super) {
  midi = midi === VOID ? this.midi : midi;
  level = level === VOID ? this.level : level;
  return $super === VOID ? this.f5(midi, level) : $super.f5.call(this, midi, level);
};
protoOf(PitchSample).toString = function () {
  return 'PitchSample(midi=' + this.midi + ', level=' + this.level + ')';
};
protoOf(PitchSample).hashCode = function () {
  var result = this.midi == null ? 0 : getNumberHashCode(this.midi);
  result = imul(result, 31) + getNumberHashCode(this.level) | 0;
  return result;
};
protoOf(PitchSample).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof PitchSample))
    return false;
  var tmp0_other_with_cast = other instanceof PitchSample ? other : THROW_CCE();
  if (!equals(this.midi, tmp0_other_with_cast.midi))
    return false;
  if (!equals(this.level, tmp0_other_with_cast.level))
    return false;
  return true;
};
function SampleWindow(size) {
  this.size = size;
  this.g5_1 = new Float32Array(this.size);
  this.h5_1 = 0;
}
protoOf(SampleWindow).h = function () {
  return this.size;
};
protoOf(SampleWindow).i5 = function () {
  return this.h5_1 >= this.size;
};
protoOf(SampleWindow).append = function (chunk, count) {
  // Inline function 'kotlin.require' call
  if (!(0 <= count ? count <= chunk.length : false)) {
    var message = 'count must be within 0..' + chunk.length + ', got ' + count;
    throw IllegalArgumentException_init_$Create$(toString(message));
  }
  // Inline function 'kotlin.comparisons.minOf' call
  var b = this.size;
  var incoming = Math.min(count, b);
  var tmp0 = this.g5_1;
  var tmp2 = this.g5_1;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex = this.size;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp, tmp2, 0, incoming, endIndex);
  var tmp2_0 = this.g5_1;
  var tmp4 = this.size - incoming | 0;
  // Inline function 'kotlin.collections.copyInto' call
  var startIndex = count - incoming | 0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_0 = chunk;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp_0, tmp2_0, tmp4, startIndex, count);
  var tmp_1 = this;
  var tmp0_0 = this.size;
  // Inline function 'kotlin.comparisons.minOf' call
  var b_0 = this.h5_1 + count | 0;
  tmp_1.h5_1 = Math.min(tmp0_0, b_0);
};
protoOf(SampleWindow).samples = function () {
  return this.g5_1;
};
protoOf(SampleWindow).clear = function () {
  this.h5_1 = 0;
};
function Companion_3() {
  this.CHUNK_SAMPLES = 1024;
  this.SILENCE_RMS = 0.003;
}
protoOf(Companion_3).j5 = function () {
  return this.CHUNK_SAMPLES;
};
protoOf(Companion_3).k5 = function () {
  return this.SILENCE_RMS;
};
protoOf(Companion_3).rootMeanSquare = function (chunk, count) {
  if (count <= 0)
    return 0.0;
  var sum = 0.0;
  var inductionVariable = 0;
  if (inductionVariable < count)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      sum = sum + chunk[i] * chunk[i];
    }
     while (inductionVariable < count);
  // Inline function 'kotlin.math.sqrt' call
  var x = sum / count;
  return Math.sqrt(x);
};
protoOf(Companion_3).levelFromRms = function (rms) {
  if (rms <= 0.0)
    return 0.0;
  // Inline function 'kotlin.math.log10' call
  var dbfs = 20 * log10(rms);
  return coerceIn_1((dbfs + 60) / 60, 0.0, 1.0);
};
var Companion_instance_3;
function Companion_getInstance_3() {
  return Companion_instance_3;
}
function PitchPipeline(sampleRate) {
  this.l5_1 = new YinPitchDetector(sampleRate);
  this.m5_1 = new SampleWindow(this.l5_1.requiredSamples);
}
protoOf(PitchPipeline).process = function (chunk, count) {
  this.m5_1.append(chunk, count);
  var rms = Companion_instance_3.rootMeanSquare(chunk, count);
  var level = Companion_instance_3.levelFromRms(rms);
  if (!this.m5_1.isFull || rms < 0.003)
    return new PitchSample(null, level);
  var tmp0_elvis_lhs = this.l5_1.detect(this.m5_1.samples());
  var tmp;
  if (tmp0_elvis_lhs == null) {
    return new PitchSample(null, level);
  } else {
    tmp = tmp0_elvis_lhs;
  }
  var hz = tmp;
  return new PitchSample(NoteMapper_instance.midiFromFrequency(hz), level);
};
protoOf(PitchPipeline).reset = function () {
  return this.m5_1.clear();
};
function onMissing($this) {
  $this.y5_1 = $this.y5_1 + 1 | 0;
  if ($this.y5_1 >= $this.v5_1) {
    $this.reset();
  }
  return $this.x5_1;
}
function blend($this, previous, target) {
  var tmp;
  if (previous == null) {
    tmp = true;
  } else {
    // Inline function 'kotlin.math.abs' call
    var x = target - previous;
    tmp = Math.abs(x) >= $this.u5_1;
  }
  if (tmp)
    return target;
  return previous + $this.t5_1 * (target - previous);
}
function median($this, values) {
  var sorted_0 = sorted(values);
  var mid = sorted_0.h() / 2 | 0;
  return (sorted_0.h() % 2 | 0) === 1 ? sorted_0.g(mid) : (sorted_0.g(mid - 1 | 0) + sorted_0.g(mid)) / 2;
}
function Companion_4() {
  this.z5_1 = 3;
}
var Companion_instance_4;
function Companion_getInstance_4() {
  return Companion_instance_4;
}
function PitchSmoother(easing, newNoteSemitones, silenceFrames) {
  easing = easing === VOID ? 0.3 : easing;
  newNoteSemitones = newNoteSemitones === VOID ? 0.8 : newNoteSemitones;
  silenceFrames = silenceFrames === VOID ? 15 : silenceFrames;
  this.t5_1 = easing;
  this.u5_1 = newNoteSemitones;
  this.v5_1 = silenceFrames;
  this.w5_1 = ArrayDeque_init_$Create$();
  this.x5_1 = null;
  this.y5_1 = 0;
}
protoOf(PitchSmoother).push = function (midi) {
  if (midi == null)
    return onMissing(this);
  this.y5_1 = 0;
  this.w5_1.v2(midi);
  if (this.w5_1.r2_1 > 3) {
    this.w5_1.w2();
  }
  this.x5_1 = blend(this, this.x5_1, median(this, this.w5_1));
  return this.x5_1;
};
protoOf(PitchSmoother).reset = function () {
  this.w5_1.h2();
  this.x5_1 = null;
  this.y5_1 = 0;
};
function Box(left, top, right, bottom) {
  this.left = left;
  this.top = top;
  this.right = right;
  this.bottom = bottom;
}
protoOf(Box).a6 = function () {
  return this.left;
};
protoOf(Box).b6 = function () {
  return this.top;
};
protoOf(Box).c6 = function () {
  return this.right;
};
protoOf(Box).d6 = function () {
  return this.bottom;
};
protoOf(Box).e6 = function () {
  return this.right - this.left;
};
protoOf(Box).f6 = function () {
  return this.bottom - this.top;
};
protoOf(Box).g6 = function () {
  return (this.left + this.right) / 2;
};
protoOf(Box).w4 = function () {
  return this.left;
};
protoOf(Box).x4 = function () {
  return this.top;
};
protoOf(Box).y4 = function () {
  return this.right;
};
protoOf(Box).z4 = function () {
  return this.bottom;
};
protoOf(Box).h6 = function (left, top, right, bottom) {
  return new Box(left, top, right, bottom);
};
protoOf(Box).copy = function (left, top, right, bottom, $super) {
  left = left === VOID ? this.left : left;
  top = top === VOID ? this.top : top;
  right = right === VOID ? this.right : right;
  bottom = bottom === VOID ? this.bottom : bottom;
  return $super === VOID ? this.h6(left, top, right, bottom) : $super.h6.call(this, left, top, right, bottom);
};
protoOf(Box).toString = function () {
  return 'Box(left=' + this.left + ', top=' + this.top + ', right=' + this.right + ', bottom=' + this.bottom + ')';
};
protoOf(Box).hashCode = function () {
  var result = getNumberHashCode(this.left);
  result = imul(result, 31) + getNumberHashCode(this.top) | 0;
  result = imul(result, 31) + getNumberHashCode(this.right) | 0;
  result = imul(result, 31) + getNumberHashCode(this.bottom) | 0;
  return result;
};
protoOf(Box).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof Box))
    return false;
  var tmp0_other_with_cast = other instanceof Box ? other : THROW_CCE();
  if (!equals(this.left, tmp0_other_with_cast.left))
    return false;
  if (!equals(this.top, tmp0_other_with_cast.top))
    return false;
  if (!equals(this.right, tmp0_other_with_cast.right))
    return false;
  if (!equals(this.bottom, tmp0_other_with_cast.bottom))
    return false;
  return true;
};
function swingThatFits($this, halfWidth, radius) {
  if (radius <= 0.0)
    return 40.0;
  // Inline function 'kotlin.math.min' call
  var b = halfWidth / radius;
  // Inline function 'kotlin.math.asin' call
  var x = Math.min(1.0, b);
  var fits = Math.asin(x) * 180 / 3.141592653589793;
  // Inline function 'kotlin.math.min' call
  return Math.min(40.0, fits);
}
function Companion_5() {
  this.MAX_CENTS = 50.0;
  this.i6_1 = 1.08;
  this.j6_1 = 40.0;
}
protoOf(Companion_5).k6 = function () {
  return this.MAX_CENTS;
};
protoOf(Companion_5).compute = function (box, dp) {
  var tmp0 = box.width * 0.3;
  // Inline function 'kotlin.math.min' call
  var b = box.height * 0.13;
  var noteTextSize = Math.min(tmp0, b);
  var noteBaseline = box.top + 28 * dp + noteTextSize * 0.85;
  var frequencyBaseline = noteBaseline + 34 * dp;
  var stripBaseline = box.bottom - 28 * dp;
  var pivotY = stripBaseline - 96 * dp;
  var radius = pivotY - (frequencyBaseline + 64 * dp);
  return new TunerGeometry(dp, box.centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, swingThatFits(this, box.width / 2 - 40 * dp, radius), box.left, box.width / 12, stripBaseline, box.right - 20 * dp, box.top + 20 * dp);
};
var Companion_instance_5;
function Companion_getInstance_5() {
  return Companion_instance_5;
}
function TunerGeometry(dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop) {
  this.dp = dp;
  this.centerX = centerX;
  this.noteTextSize = noteTextSize;
  this.noteBaseline = noteBaseline;
  this.frequencyBaseline = frequencyBaseline;
  this.pivotY = pivotY;
  this.radius = radius;
  this.maxAngleDegrees = maxAngleDegrees;
  this.stripLeft = stripLeft;
  this.stripCellWidth = stripCellWidth;
  this.stripBaseline = stripBaseline;
  this.meterRight = meterRight;
  this.meterTop = meterTop;
}
protoOf(TunerGeometry).l6 = function () {
  return this.dp;
};
protoOf(TunerGeometry).g6 = function () {
  return this.centerX;
};
protoOf(TunerGeometry).m6 = function () {
  return this.noteTextSize;
};
protoOf(TunerGeometry).n6 = function () {
  return this.noteBaseline;
};
protoOf(TunerGeometry).o6 = function () {
  return this.frequencyBaseline;
};
protoOf(TunerGeometry).p6 = function () {
  return this.pivotY;
};
protoOf(TunerGeometry).q6 = function () {
  return this.radius;
};
protoOf(TunerGeometry).r6 = function () {
  return this.maxAngleDegrees;
};
protoOf(TunerGeometry).s6 = function () {
  return this.stripLeft;
};
protoOf(TunerGeometry).t6 = function () {
  return this.stripCellWidth;
};
protoOf(TunerGeometry).u6 = function () {
  return this.stripBaseline;
};
protoOf(TunerGeometry).v6 = function () {
  return this.meterRight;
};
protoOf(TunerGeometry).w6 = function () {
  return this.meterTop;
};
protoOf(TunerGeometry).angleForCents = function (cents) {
  return coerceIn_1(cents / 50.0, -1.08, 1.08) * this.maxAngleDegrees;
};
protoOf(TunerGeometry).w4 = function () {
  return this.dp;
};
protoOf(TunerGeometry).x4 = function () {
  return this.centerX;
};
protoOf(TunerGeometry).y4 = function () {
  return this.noteTextSize;
};
protoOf(TunerGeometry).z4 = function () {
  return this.noteBaseline;
};
protoOf(TunerGeometry).x6 = function () {
  return this.frequencyBaseline;
};
protoOf(TunerGeometry).y6 = function () {
  return this.pivotY;
};
protoOf(TunerGeometry).z6 = function () {
  return this.radius;
};
protoOf(TunerGeometry).a7 = function () {
  return this.maxAngleDegrees;
};
protoOf(TunerGeometry).b7 = function () {
  return this.stripLeft;
};
protoOf(TunerGeometry).c7 = function () {
  return this.stripCellWidth;
};
protoOf(TunerGeometry).d7 = function () {
  return this.stripBaseline;
};
protoOf(TunerGeometry).e7 = function () {
  return this.meterRight;
};
protoOf(TunerGeometry).f7 = function () {
  return this.meterTop;
};
protoOf(TunerGeometry).g7 = function (dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop) {
  return new TunerGeometry(dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop);
};
protoOf(TunerGeometry).copy = function (dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop, $super) {
  dp = dp === VOID ? this.dp : dp;
  centerX = centerX === VOID ? this.centerX : centerX;
  noteTextSize = noteTextSize === VOID ? this.noteTextSize : noteTextSize;
  noteBaseline = noteBaseline === VOID ? this.noteBaseline : noteBaseline;
  frequencyBaseline = frequencyBaseline === VOID ? this.frequencyBaseline : frequencyBaseline;
  pivotY = pivotY === VOID ? this.pivotY : pivotY;
  radius = radius === VOID ? this.radius : radius;
  maxAngleDegrees = maxAngleDegrees === VOID ? this.maxAngleDegrees : maxAngleDegrees;
  stripLeft = stripLeft === VOID ? this.stripLeft : stripLeft;
  stripCellWidth = stripCellWidth === VOID ? this.stripCellWidth : stripCellWidth;
  stripBaseline = stripBaseline === VOID ? this.stripBaseline : stripBaseline;
  meterRight = meterRight === VOID ? this.meterRight : meterRight;
  meterTop = meterTop === VOID ? this.meterTop : meterTop;
  return $super === VOID ? this.g7(dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop) : $super.g7.call(this, dp, centerX, noteTextSize, noteBaseline, frequencyBaseline, pivotY, radius, maxAngleDegrees, stripLeft, stripCellWidth, stripBaseline, meterRight, meterTop);
};
protoOf(TunerGeometry).toString = function () {
  return 'TunerGeometry(dp=' + this.dp + ', centerX=' + this.centerX + ', noteTextSize=' + this.noteTextSize + ', noteBaseline=' + this.noteBaseline + ', frequencyBaseline=' + this.frequencyBaseline + ', pivotY=' + this.pivotY + ', radius=' + this.radius + ', maxAngleDegrees=' + this.maxAngleDegrees + ', stripLeft=' + this.stripLeft + ', stripCellWidth=' + this.stripCellWidth + ', stripBaseline=' + this.stripBaseline + ', meterRight=' + this.meterRight + ', meterTop=' + this.meterTop + ')';
};
protoOf(TunerGeometry).hashCode = function () {
  var result = getNumberHashCode(this.dp);
  result = imul(result, 31) + getNumberHashCode(this.centerX) | 0;
  result = imul(result, 31) + getNumberHashCode(this.noteTextSize) | 0;
  result = imul(result, 31) + getNumberHashCode(this.noteBaseline) | 0;
  result = imul(result, 31) + getNumberHashCode(this.frequencyBaseline) | 0;
  result = imul(result, 31) + getNumberHashCode(this.pivotY) | 0;
  result = imul(result, 31) + getNumberHashCode(this.radius) | 0;
  result = imul(result, 31) + getNumberHashCode(this.maxAngleDegrees) | 0;
  result = imul(result, 31) + getNumberHashCode(this.stripLeft) | 0;
  result = imul(result, 31) + getNumberHashCode(this.stripCellWidth) | 0;
  result = imul(result, 31) + getNumberHashCode(this.stripBaseline) | 0;
  result = imul(result, 31) + getNumberHashCode(this.meterRight) | 0;
  result = imul(result, 31) + getNumberHashCode(this.meterTop) | 0;
  return result;
};
protoOf(TunerGeometry).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof TunerGeometry))
    return false;
  var tmp0_other_with_cast = other instanceof TunerGeometry ? other : THROW_CCE();
  if (!equals(this.dp, tmp0_other_with_cast.dp))
    return false;
  if (!equals(this.centerX, tmp0_other_with_cast.centerX))
    return false;
  if (!equals(this.noteTextSize, tmp0_other_with_cast.noteTextSize))
    return false;
  if (!equals(this.noteBaseline, tmp0_other_with_cast.noteBaseline))
    return false;
  if (!equals(this.frequencyBaseline, tmp0_other_with_cast.frequencyBaseline))
    return false;
  if (!equals(this.pivotY, tmp0_other_with_cast.pivotY))
    return false;
  if (!equals(this.radius, tmp0_other_with_cast.radius))
    return false;
  if (!equals(this.maxAngleDegrees, tmp0_other_with_cast.maxAngleDegrees))
    return false;
  if (!equals(this.stripLeft, tmp0_other_with_cast.stripLeft))
    return false;
  if (!equals(this.stripCellWidth, tmp0_other_with_cast.stripCellWidth))
    return false;
  if (!equals(this.stripBaseline, tmp0_other_with_cast.stripBaseline))
    return false;
  if (!equals(this.meterRight, tmp0_other_with_cast.meterRight))
    return false;
  if (!equals(this.meterTop, tmp0_other_with_cast.meterTop))
    return false;
  return true;
};
function TunerScene() {
  this.reading = null;
  this.active = false;
  this.level = 0.0;
  this.message = null;
  this.needleCents = 0.0;
}
protoOf(TunerScene).h7 = function (_set____db54di) {
  this.reading = _set____db54di;
};
protoOf(TunerScene).i7 = function () {
  return this.reading;
};
protoOf(TunerScene).j7 = function (_set____db54di) {
  this.active = _set____db54di;
};
protoOf(TunerScene).k7 = function () {
  return this.active;
};
protoOf(TunerScene).l7 = function (_set____db54di) {
  this.level = _set____db54di;
};
protoOf(TunerScene).e5 = function () {
  return this.level;
};
protoOf(TunerScene).m7 = function (_set____db54di) {
  this.message = _set____db54di;
};
protoOf(TunerScene).j2 = function () {
  return this.message;
};
protoOf(TunerScene).n7 = function (_set____db54di) {
  this.needleCents = _set____db54di;
};
protoOf(TunerScene).o7 = function () {
  return this.needleCents;
};
function computeDifference($this, x) {
  var inductionVariable = 1;
  var last = $this.r5_1 + 1 | 0;
  if (inductionVariable <= last)
    do {
      var tau = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var sum = 0.0;
      var inductionVariable_0 = 0;
      var last_0 = $this.o5_1;
      if (inductionVariable_0 < last_0)
        do {
          var j = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var delta = x[j] - x[j + tau | 0];
          sum = sum + delta * delta;
        }
         while (inductionVariable_0 < last_0);
      $this.s5_1[tau] = sum;
    }
     while (!(tau === last));
}
function normalizeCumulativeMean($this) {
  $this.s5_1[0] = 1.0;
  var runningSum = 0.0;
  var inductionVariable = 1;
  var last = $this.r5_1 + 1 | 0;
  if (inductionVariable <= last)
    do {
      var tau = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      runningSum = runningSum + $this.s5_1[tau];
      $this.s5_1[tau] = runningSum === 0.0 ? 1.0 : $this.s5_1[tau] * tau / runningSum;
    }
     while (!(tau === last));
}
function firstDipBelowThreshold($this) {
  var tau = $this.q5_1;
  while (tau <= $this.r5_1 && $this.s5_1[tau] >= $this.p5_1) {
    tau = tau + 1 | 0;
  }
  if (tau > $this.r5_1)
    return null;
  while (tau < $this.r5_1 && $this.s5_1[tau + 1 | 0] < $this.s5_1[tau]) {
    tau = tau + 1 | 0;
  }
  return tau;
}
function refineByParabola($this, tau) {
  var before = $this.s5_1[tau - 1 | 0];
  var at = $this.s5_1[tau];
  var after = $this.s5_1[tau + 1 | 0];
  var denominator = 2 * (2 * at - after - before);
  if (denominator === 0.0)
    return tau;
  return tau + (after - before) / denominator;
}
function YinPitchDetector(sampleRate, windowSize, minFrequencyHz, maxFrequencyHz, threshold) {
  windowSize = windowSize === VOID ? 2048 : windowSize;
  minFrequencyHz = minFrequencyHz === VOID ? 38.0 : minFrequencyHz;
  maxFrequencyHz = maxFrequencyHz === VOID ? 1400.0 : maxFrequencyHz;
  threshold = threshold === VOID ? 0.15 : threshold;
  this.n5_1 = sampleRate;
  this.o5_1 = windowSize;
  this.p5_1 = threshold;
  var tmp = this;
  // Inline function 'kotlin.math.floor' call
  var x = this.n5_1 / maxFrequencyHz;
  var tmp$ret$0 = Math.floor(x);
  tmp.q5_1 = coerceAtLeast(numberToInt(tmp$ret$0), 2);
  var tmp_0 = this;
  // Inline function 'kotlin.math.ceil' call
  var x_0 = this.n5_1 / minFrequencyHz;
  var tmp$ret$1 = Math.ceil(x_0);
  tmp_0.r5_1 = numberToInt(tmp$ret$1);
  this.s5_1 = new Float64Array(this.r5_1 + 2 | 0);
  this.requiredSamples = (this.o5_1 + this.r5_1 | 0) + 2 | 0;
}
protoOf(YinPitchDetector).p7 = function () {
  return this.requiredSamples;
};
protoOf(YinPitchDetector).detect = function (samples) {
  // Inline function 'kotlin.require' call
  if (!(samples.length >= this.requiredSamples)) {
    var message = 'need at least ' + this.requiredSamples + ' samples, got ' + samples.length;
    throw IllegalArgumentException_init_$Create$(toString(message));
  }
  computeDifference(this, samples);
  normalizeCumulativeMean(this);
  var tmp0_elvis_lhs = firstDipBelowThreshold(this);
  var tmp;
  if (tmp0_elvis_lhs == null) {
    return null;
  } else {
    tmp = tmp0_elvis_lhs;
  }
  var tau = tmp;
  return this.n5_1 / refineByParabola(this, tau);
};
//region block: post-declaration
defineProp(protoOf(Metronome), 'bpm', protoOf(Metronome).u3, protoOf(Metronome).t3);
defineProp(protoOf(Metronome), 'beatsPerBar', protoOf(Metronome).w3, protoOf(Metronome).v3);
defineProp(protoOf(Metronome), 'subdivision', protoOf(Metronome).y3, protoOf(Metronome).x3);
defineProp(protoOf(NoteReading), 'name', protoOf(NoteReading).u4);
defineProp(protoOf(NoteReading), 'isInTune', protoOf(NoteReading).v4);
defineProp(protoOf(SampleWindow), 'isFull', protoOf(SampleWindow).i5);
defineProp(protoOf(Box), 'width', protoOf(Box).e6);
defineProp(protoOf(Box), 'height', protoOf(Box).f6);
defineProp(protoOf(Box), 'centerX', protoOf(Box).g6);
//endregion
//region block: init
Companion_instance = new Companion();
Companion_instance_0 = new Companion_0();
ClickSound_instance = new ClickSound_0();
Companion_instance_1 = new Companion_1();
NoteMapper_instance = new NoteMapper_0();
Companion_instance_3 = new Companion_3();
Companion_instance_4 = new Companion_4();
Companion_instance_5 = new Companion_5();
//endregion
//region block: exports
defineProp(Tick, 'Companion', Companion_getInstance);
defineProp(Metronome, 'Companion', Companion_getInstance_0);
var ClickSound = {getInstance: ClickSound_getInstance};
defineProp(NoteReading, 'Companion', Companion_getInstance_2);
var NoteMapper = {getInstance: NoteMapper_getInstance};
defineProp(PitchPipeline, 'Companion', Companion_getInstance_3);
defineProp(TunerGeometry, 'Companion', Companion_getInstance_5);
export {
  Tick as Tick,
  Metronome as Metronome,
  ClickSound as ClickSound,
  TapTempo as TapTempo,
  NeedleAnimator as NeedleAnimator,
  NoteReading as NoteReading,
  NoteMapper as NoteMapper,
  PitchSample as PitchSample,
  SampleWindow as SampleWindow,
  PitchPipeline as PitchPipeline,
  PitchSmoother as PitchSmoother,
  Box as Box,
  TunerGeometry as TunerGeometry,
  TunerScene as TunerScene,
  YinPitchDetector as YinPitchDetector,
};
//endregion


