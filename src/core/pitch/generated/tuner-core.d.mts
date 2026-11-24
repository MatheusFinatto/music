type Nullable<T> = T | null | undefined
declare function KtSingleton<T>(): T & (abstract new() => any);
export declare interface KtList<E> /* extends Collection<E> */ {
    asJsReadonlyArrayView(): ReadonlyArray<E>;
    readonly __doNotUseOrImplementIt: {
        readonly "kotlin.collections.KtList": unique symbol;
    };
}
export declare abstract class KtList<E> extends KtSingleton<KtList.$metadata$.constructor>() {
    private constructor();
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace KtList.$metadata$ {
    abstract class constructor {
        fromJsArray<E>(array: ReadonlyArray<E>): KtList<E>;
        private constructor();
    }
}
export declare class Tick {
    constructor(time: number, beat: number, sub: number, kind: number);
    get time(): number;
    get beat(): number;
    get sub(): number;
    get kind(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Tick.$metadata$ {
    const constructor: abstract new () => Tick;
}
export declare namespace Tick {
    abstract class Companion extends KtSingleton<Companion.$metadata$.constructor>() {
        private constructor();
    }
    /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
    namespace Companion.$metadata$ {
        abstract class constructor {
            get ACCENT(): number;
            get BEAT(): number;
            get SUB(): number;
            get MUTE(): number;
            private constructor();
        }
    }
}
export declare class Note {
    constructor(beams: number, dotted?: boolean);
    get beams(): number;
    get dotted(): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Note.$metadata$ {
    const constructor: abstract new () => Note;
}
export declare class Subdivision {
    constructor(id: number, offsets: Float64Array, notes: Array<Note>, tuplet?: number);
    get id(): number;
    get offsets(): Float64Array;
    get notes(): Array<Note>;
    get tuplet(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Subdivision.$metadata$ {
    const constructor: abstract new () => Subdivision;
}
export declare abstract class Subdivisions {
    static readonly getInstance: () => typeof Subdivisions.$metadata$.type;
    private constructor();
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Subdivisions.$metadata$ {
    abstract class type extends KtSingleton<constructor>() {
        private constructor();
    }
    abstract class constructor {
        get all(): Array<Subdivision>;
        byId(id: number): Subdivision;
        private constructor();
    }
}
export declare class Metronome {
    constructor(bpm?: number, beatsPerBar?: number, subdivision?: number);
    get bpm(): number;
    set bpm(value: number);
    get beatsPerBar(): number;
    set beatsPerBar(value: number);
    get subdivision(): number;
    set subdivision(value: number);
    get nextTime(): number;
    set nextTime(value: number);
    accent(beat: number): number;
    setAccent(beat: number, kind: number): void;
    cycleAccent(beat: number): number;
    accentList(): Int32Array;
    restoreAccents(saved: Int32Array): void;
    reset(start: number): void;
    next(): Tick;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Metronome.$metadata$ {
    const constructor: abstract new () => Metronome;
}
export declare namespace Metronome {
    abstract class Companion extends KtSingleton<Companion.$metadata$.constructor>() {
        private constructor();
    }
    /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
    namespace Companion.$metadata$ {
        abstract class constructor {
            get MIN_BPM(): number;
            get MAX_BPM(): number;
            get MAX_BEATS(): number;
            clampBpm(bpm: number): number;
            private constructor();
        }
    }
}
export declare abstract class ClickSound {
    static readonly getInstance: () => typeof ClickSound.$metadata$.type;
    private constructor();
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace ClickSound.$metadata$ {
    abstract class type extends KtSingleton<constructor>() {
        private constructor();
    }
    abstract class constructor {
        get DURATION(): number;
        frequency(kind: number): number;
        gain(kind: number): number;
        render(kind: number, sampleRate: number): Float64Array;
        renderChime(sampleRate: number): Float64Array;
        private constructor();
    }
}
export declare class TapTempo {
    constructor(maxGap?: number);
    tap(time: number): Nullable<number>;
    reset(): void;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace TapTempo.$metadata$ {
    const constructor: abstract new () => TapTempo;
}
export declare class NeedleAnimator {
    constructor(timeConstantMs?: number);
    get target(): number;
    set target(value: number);
    get position(): number;
    set position(value: number);
    step(nowMs: number): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace NeedleAnimator.$metadata$ {
    const constructor: abstract new () => NeedleAnimator;
}
export declare class NoteReading {
    constructor(pitchClass: number, octave: number, cents: number, frequencyHz: number);
    get pitchClass(): number;
    get octave(): number;
    get cents(): number;
    get frequencyHz(): number;
    get name(): string;
    get isInTune(): boolean;
    copy(pitchClass?: number, octave?: number, cents?: number, frequencyHz?: number): NoteReading;
    toString(): string;
    hashCode(): number;
    equals(other: Nullable<any>): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace NoteReading.$metadata$ {
    const constructor: abstract new () => NoteReading;
}
export declare namespace NoteReading {
    abstract class Companion extends KtSingleton<Companion.$metadata$.constructor>() {
        private constructor();
    }
    /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
    namespace Companion.$metadata$ {
        abstract class constructor {
            get NOTE_NAMES(): KtList<string>;
            get IN_TUNE_CENTS(): number;
            private constructor();
        }
    }
}
export declare abstract class NoteMapper {
    static readonly getInstance: () => typeof NoteMapper.$metadata$.type;
    private constructor();
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace NoteMapper.$metadata$ {
    abstract class type extends KtSingleton<constructor>() {
        private constructor();
    }
    abstract class constructor {
        get A4_HZ(): number;
        midiFromFrequency(hz: number): number;
        frequencyFromMidi(midi: number): number;
        readingFromMidi(midi: number): NoteReading;
        private constructor();
    }
}
export declare class PitchSample {
    constructor(midi: Nullable<number>, level: number);
    get midi(): Nullable<number>;
    get level(): number;
    copy(midi?: Nullable<number>, level?: number): PitchSample;
    toString(): string;
    hashCode(): number;
    equals(other: Nullable<any>): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PitchSample.$metadata$ {
    const constructor: abstract new () => PitchSample;
}
export declare class SampleWindow {
    constructor(size: number);
    get size(): number;
    get isFull(): boolean;
    append(chunk: Float32Array, count: number): void;
    samples(): Float32Array;
    clear(): void;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace SampleWindow.$metadata$ {
    const constructor: abstract new () => SampleWindow;
}
export declare class PitchPipeline {
    constructor(sampleRate: number);
    process(chunk: Float32Array, count: number): PitchSample;
    reset(): void;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PitchPipeline.$metadata$ {
    const constructor: abstract new () => PitchPipeline;
}
export declare namespace PitchPipeline {
    abstract class Companion extends KtSingleton<Companion.$metadata$.constructor>() {
        private constructor();
    }
    /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
    namespace Companion.$metadata$ {
        abstract class constructor {
            get CHUNK_SAMPLES(): number;
            get SILENCE_RMS(): number;
            rootMeanSquare(chunk: Float32Array, count: number): number;
            levelFromRms(rms: number): number;
            private constructor();
        }
    }
}
export declare class PitchSmoother {
    constructor(easing?: number, newNoteSemitones?: number, silenceFrames?: number);
    push(midi: Nullable<number>): Nullable<number>;
    reset(): void;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PitchSmoother.$metadata$ {
    const constructor: abstract new () => PitchSmoother;
}
export declare class Box {
    constructor(left: number, top: number, right: number, bottom: number);
    get left(): number;
    get top(): number;
    get right(): number;
    get bottom(): number;
    get width(): number;
    get height(): number;
    get centerX(): number;
    copy(left?: number, top?: number, right?: number, bottom?: number): Box;
    toString(): string;
    hashCode(): number;
    equals(other: Nullable<any>): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Box.$metadata$ {
    const constructor: abstract new () => Box;
}
export declare class TunerGeometry {
    constructor(dp: number, centerX: number, noteTextSize: number, noteBaseline: number, frequencyBaseline: number, pivotY: number, radius: number, maxAngleDegrees: number, meterRight: number, meterTop: number);
    get dp(): number;
    get centerX(): number;
    get noteTextSize(): number;
    get noteBaseline(): number;
    get frequencyBaseline(): number;
    get pivotY(): number;
    get radius(): number;
    get maxAngleDegrees(): number;
    get meterRight(): number;
    get meterTop(): number;
    angleForCents(cents: number): number;
    copy(dp?: number, centerX?: number, noteTextSize?: number, noteBaseline?: number, frequencyBaseline?: number, pivotY?: number, radius?: number, maxAngleDegrees?: number, meterRight?: number, meterTop?: number): TunerGeometry;
    toString(): string;
    hashCode(): number;
    equals(other: Nullable<any>): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace TunerGeometry.$metadata$ {
    const constructor: abstract new () => TunerGeometry;
}
export declare namespace TunerGeometry {
    abstract class Companion extends KtSingleton<Companion.$metadata$.constructor>() {
        private constructor();
    }
    /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
    namespace Companion.$metadata$ {
        abstract class constructor {
            get MAX_CENTS(): number;
            compute(box: Box, dp: number): TunerGeometry;
            private constructor();
        }
    }
}
export declare class TunerScene {
    constructor();
    get reading(): Nullable<NoteReading>;
    set reading(value: Nullable<NoteReading>);
    get active(): boolean;
    set active(value: boolean);
    get level(): number;
    set level(value: number);
    get message(): Nullable<string>;
    set message(value: Nullable<string>);
    get needleCents(): number;
    set needleCents(value: number);
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace TunerScene.$metadata$ {
    const constructor: abstract new () => TunerScene;
}
export declare class YinPitchDetector {
    constructor(sampleRate: number, windowSize?: number, minFrequencyHz?: number, maxFrequencyHz?: number, threshold?: number);
    get requiredSamples(): number;
    detect(samples: Float32Array): Nullable<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace YinPitchDetector.$metadata$ {
    const constructor: abstract new () => YinPitchDetector;
}