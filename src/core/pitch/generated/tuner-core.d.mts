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
export declare const INTERVALOS: { get(): Array<Intervalo>; };
export declare const ACORDES: { get(): Array<Acorde>; };
export declare const GRAUS: { get(): Array<Grau>; };
export declare const CADENCIA: { get(): Array<AcordeDaCadencia>; };
export declare const CAMPO: { get(): Array<GrauDoCampo>; };
export declare const CADENCIAS: { get(): Array<Cadencia>; };
export declare const PROGRESSOES: { get(): Array<Progressao>; };
export declare const PADROES: { get(): Array<Padrao>; };
export declare const MUSICAS: { get(): Array<Musica>; };
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
export declare class Janela {
    constructor(ini: number, fim: number, midi: Nullable<number>, sil: string);
    get ini(): number;
    get fim(): number;
    get midi(): Nullable<number>;
    get sil(): string;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Janela.$metadata$ {
    const constructor: abstract new () => Janela;
}
export declare const CURTA_S: { get(): number; };
export declare function ehCurta(j: Janela): boolean;
export declare function janelas(notas: Array<NotaMusica>, bpm: number, tonicaMidi: number): Array<Janela>;
export declare function duracaoDe(js: Array<Janela>): number;
export declare function tonicaParaCaber(classe: number, notas: Array<NotaMusica>, faixa: Nullable<Faixa>): number;
export declare function dobrar(midi: number, centro: number): number;
export declare class Amostra {
    constructor(t: number, midi: Nullable<number>);
    get t(): number;
    get midi(): Nullable<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Amostra.$metadata$ {
    const constructor: abstract new () => Amostra;
}
export declare const GRACA_S: { get(): number; };
export declare const GRACA_MAX: { get(): number; };
export declare const LIMIAR: { get(): number; };
export declare const LATENCIA_S: { get(): number; };
export declare class Acerto {
    constructor(fracao: number, ok: boolean, ouvido: Nullable<number>);
    get fracao(): number;
    get ok(): boolean;
    get ouvido(): Nullable<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Acerto.$metadata$ {
    const constructor: abstract new () => Acerto;
}
export declare function acertoDaNota(amostras: Array<Amostra>, j: Janela, tolerancia: number, qualquerOitava: boolean, ate: number): Acerto;
export declare class Resumo {
    constructor(acertadas: number, total: number, ok: boolean);
    get acertadas(): number;
    get total(): number;
    get ok(): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Resumo.$metadata$ {
    const constructor: abstract new () => Resumo;
}
export declare function resumir(js: Array<Janela>, acertos: Array<Acerto>): Resumo;
export declare function musicaDe(id: string): Musica;
export declare class Intervalo {
    constructor(id: string, semitons: number);
    get id(): string;
    get semitons(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Intervalo.$metadata$ {
    const constructor: abstract new () => Intervalo;
}
export declare class Acorde {
    constructor(id: string, semitons: Array<number>);
    get id(): string;
    get semitons(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Acorde.$metadata$ {
    const constructor: abstract new () => Acorde;
}
export declare class Grau {
    constructor(id: string, semitons: number);
    get id(): string;
    get semitons(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Grau.$metadata$ {
    const constructor: abstract new () => Grau;
}
export declare class AcordeDaCadencia {
    constructor(grau: number, semitons: Array<number>);
    get grau(): number;
    get semitons(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace AcordeDaCadencia.$metadata$ {
    const constructor: abstract new () => AcordeDaCadencia;
}
export declare class GrauDoCampo {
    constructor(id: string, raiz: number, semitons: Array<number>);
    get id(): string;
    get raiz(): number;
    get semitons(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace GrauDoCampo.$metadata$ {
    const constructor: abstract new () => GrauDoCampo;
}
export declare class Cadencia {
    constructor(id: string, variantes: Array<Array<string>>);
    get id(): string;
    get variantes(): Array<Array<string>>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Cadencia.$metadata$ {
    const constructor: abstract new () => Cadencia;
}
export declare class Progressao {
    constructor(id: string, acordes: Array<string>);
    get id(): string;
    get acordes(): Array<string>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Progressao.$metadata$ {
    const constructor: abstract new () => Progressao;
}
export declare class Padrao {
    constructor(id: string, semitons: Array<number>);
    get id(): string;
    get semitons(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Padrao.$metadata$ {
    const constructor: abstract new () => Padrao;
}
export declare class NotaMusica {
    constructor(st: Nullable<number>, dur: number, sil: string);
    get st(): Nullable<number>;
    get dur(): number;
    get sil(): string;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace NotaMusica.$metadata$ {
    const constructor: abstract new () => NotaMusica;
}
export declare class Trecho {
    constructor(nome: string, notas: Array<NotaMusica>);
    get nome(): string;
    get notas(): Array<NotaMusica>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Trecho.$metadata$ {
    const constructor: abstract new () => Trecho;
}
export declare class Musica {
    constructor(id: string, nome: string, compasso: string, bpm: number, confianca: string, trechos: Array<Trecho>);
    get id(): string;
    get nome(): string;
    get compasso(): string;
    get bpm(): number;
    get confianca(): string;
    get trechos(): Array<Trecho>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Musica.$metadata$ {
    const constructor: abstract new () => Musica;
}
export declare class PianoNote {
    constructor(midi: number, at: number, dur: number, cents?: Nullable<number>);
    get midi(): number;
    get at(): number;
    get dur(): number;
    get cents(): Nullable<number>;
    copy(midi?: number, at?: number, dur?: number, cents?: Nullable<number>): PianoNote;
    toString(): string;
    hashCode(): number;
    equals(other: Nullable<any>): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PianoNote.$metadata$ {
    const constructor: abstract new () => PianoNote;
}
export declare function mulberry32(seed: number): () => number;
export declare class Dia {
    constructor(data: string, secao: string, respostas: number, acertos: number, segundos: number);
    get data(): string;
    get secao(): string;
    get respostas(): number;
    get acertos(): number;
    get segundos(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Dia.$metadata$ {
    const constructor: abstract new () => Dia;
}
export declare const DIAS_GUARDADOS: { get(): number; };
export declare const TETO_RESPOSTA_S: { get(): number; };
export declare function registrarDia(dias: Array<Dia>, data: string, secao: string, certo: boolean, segundos: number): Array<Dia>;
export declare class ResumoDiario {
    constructor(respostasHoje: number, acertosHoje: number, minutosHoje: number, semana: Int32Array, sequencia: number);
    get respostasHoje(): number;
    get acertosHoje(): number;
    get minutosHoje(): number;
    get semana(): Int32Array;
    get sequencia(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace ResumoDiario.$metadata$ {
    const constructor: abstract new () => ResumoDiario;
}
export declare function resumoDiario(dias: Array<Dia>, hoje: string, secao: string): ResumoDiario;
export declare function numeroDoDia(data: string): number;
export declare const EXERCICIOS: { get(): Array<string>; };
export declare const TAMANHOS_ECO: { get(): Array<string>; };
export declare const HARMONIA: { get(): Array<string>; };
export declare const MARGENS: { get(): Array<number>; };
export declare const RESPOSTAS_AFINACAO: { get(): Array<string>; };
export declare const DIRECOES: { get(): Array<string>; };
export declare const RITMOS: { get(): Array<PadraoRitmo>; };
export declare const PLACAR_ZERO: { get(): Placar; };
export declare class ConfigClassica {
    constructor(exercicio: string, itens: Array<string>, direcao: string, margem: number, tonica: string);
    get exercicio(): string;
    get itens(): Array<string>;
    get direcao(): string;
    get margem(): number;
    get tonica(): string;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace ConfigClassica.$metadata$ {
    const constructor: abstract new () => ConfigClassica;
}
export declare class ConfigFuncional {
    constructor(tonica: string, graus: Array<string>);
    get tonica(): string;
    get graus(): Array<string>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace ConfigFuncional.$metadata$ {
    const constructor: abstract new () => ConfigFuncional;
}
export declare class PerguntaClassica {
    constructor(chave: string, resposta: string, notas: Array<PianoNote>, cents?: Nullable<number>, tonica?: Nullable<number>, acordes?: Nullable<Array<string>>, reveal?: Nullable<Array<number>>, dada?: Nullable<number>, alvo?: Nullable<number>, intervalo?: Nullable<string>);
    get chave(): string;
    get resposta(): string;
    get notas(): Array<PianoNote>;
    get cents(): Nullable<number>;
    get tonica(): Nullable<number>;
    get acordes(): Nullable<Array<string>>;
    get reveal(): Nullable<Array<number>>;
    get dada(): Nullable<number>;
    get alvo(): Nullable<number>;
    get intervalo(): Nullable<string>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PerguntaClassica.$metadata$ {
    const constructor: abstract new () => PerguntaClassica;
}
export declare class PerguntaFuncional {
    constructor(chave: string, resposta: string, tonica: number, cadencia: Array<PianoNote>, nota: Array<PianoNote>, tudo: Array<PianoNote>);
    get chave(): string;
    get resposta(): string;
    get tonica(): number;
    get cadencia(): Array<PianoNote>;
    get nota(): Array<PianoNote>;
    get tudo(): Array<PianoNote>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PerguntaFuncional.$metadata$ {
    const constructor: abstract new () => PerguntaFuncional;
}
export declare class HistoricoItem {
    constructor(chave: string, certo: number, total: number, recentes?: string);
    get chave(): string;
    get certo(): number;
    get total(): number;
    get recentes(): string;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace HistoricoItem.$metadata$ {
    const constructor: abstract new () => HistoricoItem;
}
export declare const JANELA: { get(): number; };
export declare function taxaAtual(x: HistoricoItem): Nullable<number>;
export declare function registrar(h: Array<HistoricoItem>, chave: string, certo: boolean): Array<HistoricoItem>;
export declare function peso(h: Array<HistoricoItem>, chave: string): number;
export declare function perguntaAfinacao(cfg: ConfigClassica, rng: () => number, historico?: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare function nomeTom(tonica: number): string;
export declare function nomeAcorde(tonica: number, grau: string): string;
export declare function perguntaHarmonia(cfg: ConfigClassica, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare function compararAfinacao(notas: Array<PianoNote>): Array<PianoNote>;
export declare function perguntaAchar(cfg: ConfigClassica, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare function perguntaEco(cfg: ConfigClassica, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare class PadraoRitmo {
    constructor(id: string, inicios: Array<number>);
    get id(): string;
    get inicios(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace PadraoRitmo.$metadata$ {
    const constructor: abstract new () => PadraoRitmo;
}
export declare const COLCHEIA_RITMO_S: { get(): number; };
export declare function perguntaRitmo(cfg: ConfigClassica, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare function perguntaClassica(cfg: ConfigClassica, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaClassica;
export declare function cadencia(tonica: number): Array<PianoNote>;
export declare function perguntaFuncional(cfg: ConfigFuncional, rng: () => number, historico: Nullable<Array<HistoricoItem>>): PerguntaFuncional;
export declare class Placar {
    constructor(acertos: number, total: number, sequencia: number, melhor: number);
    get acertos(): number;
    get total(): number;
    get sequencia(): number;
    get melhor(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Placar.$metadata$ {
    const constructor: abstract new () => Placar;
}
export declare function somar(p: Placar, certo: boolean): Placar;
export declare function nomeNota(midi: number): string;
export declare function faixaDoTeclado(janela: Array<number>): Array<number>;
export declare const PIANO_SAMPLES: { get(): Array<number>; };
export declare function nearestSample(midi: number): number;
export declare function rateFor(midi: number, sample: number, cents: number): number;
export declare const PIANO_PEAK: { get(): number; };
export declare const PIANO_ATTACK_S: { get(): number; };
export declare const PIANO_RELEASE_S: { get(): number; };
export declare const MINUTOS: { get(): Array<number>; };
export declare const EXERCICIOS_DE_PROGRAMA: { get(): Array<string>; };
export declare const MINUTOS_PADRAO: { get(): number; };
export declare function focosDe(secao: string): Array<string>;
export declare class Bloco {
    constructor(exercicio: string, segundos: number);
    get exercicio(): string;
    get segundos(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Bloco.$metadata$ {
    const constructor: abstract new () => Bloco;
}
export declare class BlocoPlano {
    constructor(exercicio: string, perguntas: number);
    get exercicio(): string;
    get perguntas(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace BlocoPlano.$metadata$ {
    const constructor: abstract new () => BlocoPlano;
}
export declare function programaDe(secao: string, foco: string, minutos: number): Array<Bloco>;
export declare function medianaInicial(exercicio: string): number;
export declare const SOBRA_S: { get(): number; };
export declare const AMOSTRAS_MAX: { get(): number; };
export declare const AMOSTRAS_MIN: { get(): number; };
export declare const TETO_S: { get(): number; };
export declare const PISO_S: { get(): number; };
export declare class Duracao {
    constructor(exercicio: string, valores: Array<number>);
    get exercicio(): string;
    get valores(): Array<number>;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Duracao.$metadata$ {
    const constructor: abstract new () => Duracao;
}
export declare function mediana(valores: Array<number>): number;
export declare function medianaDe(exercicio: string, duracoes: Array<Duracao>): number;
export declare function planejar(secao: string, foco: string, minutos: number, duracoes: Array<Duracao>): Array<BlocoPlano>;
export declare function estimarSegundos(plano: Array<BlocoPlano>, duracoes: Array<Duracao>): number;
export declare function minutosParaMostrar(segundos: number): number;
export declare function registrarDuracao(duracoes: Array<Duracao>, exercicio: string, ms: number): Array<Duracao>;
export declare const ABERTAS: { get(): Array<number>; };
export declare const CASAS: { get(): number; };
export declare class Pos {
    constructor(corda: number, casa: number, midi: number, raiz?: boolean);
    get corda(): number;
    get casa(): number;
    get midi(): number;
    get raiz(): boolean;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Pos.$metadata$ {
    const constructor: abstract new () => Pos;
}
export declare function posicoesDe(midi: number): Array<Pos>;
export declare function melhorPosicao(midi: number): Nullable<Pos>;
export declare function acordeNoBraco(midis: Array<number>): Nullable<Array<Pos>>;
export declare class Forma {
    constructor(posicoes: Array<Pos>, de: number, ate: number);
    get posicoes(): Array<Pos>;
    get de(): number;
    get ate(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Forma.$metadata$ {
    const constructor: abstract new () => Forma;
}
export declare function formaDoArpejo(midis: Array<number>): Nullable<Forma>;
export declare const FAIXA_PADRAO: { get(): Faixa; };
export declare const VOZES: { get(): Array<TipoDeVoz>; };
export declare const TOLERANCIAS: { get(): Array<number>; };
export declare const SEGURANDO_ZERO: { get(): Segurando; };
export declare const ALCANCE_ZERO: { get(): Alcance; };
export declare function centsDe(midi: number, alvo: number, qualquerOitava: boolean): number;
export declare function sortearClasseDeVoz(rng: () => number): number;
export declare class Faixa {
    constructor(min: number, max: number);
    get min(): number;
    get max(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Faixa.$metadata$ {
    const constructor: abstract new () => Faixa;
}
export declare class TipoDeVoz {
    constructor(id: string, min: number, max: number);
    get id(): string;
    get min(): number;
    get max(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace TipoDeVoz.$metadata$ {
    const constructor: abstract new () => TipoDeVoz;
}
export declare function sortearAlvoDeVoz(rng: () => number, faixa: Faixa): number;
export declare function faixaConfortavel(min: number, max: number): Faixa;
export declare function vozMaisProxima(f: Faixa): string;
export declare const SEGURAR_MS: { get(): number; };
export declare class Segurando {
    constructor(desde: Nullable<number>, visto: number, soma: number, soma2: number, n: number);
    get desde(): Nullable<number>;
    get visto(): number;
    get soma(): number;
    get soma2(): number;
    get n(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Segurando.$metadata$ {
    const constructor: abstract new () => Segurando;
}
export declare class Passo {
    constructor(estado: Segurando, cents: Nullable<number>, ok: boolean, media: number, oscilacao: number);
    get estado(): Segurando;
    get cents(): Nullable<number>;
    get ok(): boolean;
    get media(): number;
    get oscilacao(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Passo.$metadata$ {
    const constructor: abstract new () => Passo;
}
export declare function atualizar(s: Segurando, midi: Nullable<number>, t: number, alvo: number, tolerancia: number, qualquerOitava: boolean, segurarMs: number): Passo;
export declare class Alcance {
    constructor(min: Nullable<number>, max: Nullable<number>, candidato: Nullable<number>, desde: number, visto: number);
    get min(): Nullable<number>;
    get max(): Nullable<number>;
    get candidato(): Nullable<number>;
    get desde(): number;
    get visto(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Alcance.$metadata$ {
    const constructor: abstract new () => Alcance;
}
export declare const PARADO_MS: { get(): number; };
export declare function medirAlcance(s: Alcance, midi: Nullable<number>, t: number): Alcance;
export declare class Extensao {
    constructor(oitavas: number, semitons: number);
    get oitavas(): number;
    get semitons(): number;
}
/** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
export declare namespace Extensao.$metadata$ {
    const constructor: abstract new () => Extensao;
}
export declare function extensao(semitons: number): Extensao;
export declare const SEGURAR_PASSO_MS: { get(): number; };
export declare const SEGURAR_LONGA_MS: { get(): number; };
export declare function notasDoPadrao(inicio: number, semitons: Array<number>): Array<number>;
export declare function inicioDaRodada(classe: number, rodada: number, subir: boolean, faixa: Nullable<Faixa>, largura: number): number;