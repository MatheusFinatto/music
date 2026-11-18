export { getAudio, resumeAudio, audioNow, type AudioGraph, type BusName } from "./context";
export { STYLES, type Style, type StyleName } from "./backing";
export { legatoChains, playLead, playPhrase, prepareLead, type LeadNote } from "./lead";
export { transport, atAudioTime, NATURAL_END, type Backing, type BeatInfo } from "./transport";
export { soundStore, DEFAULT_SOUND, type Sound, type Instrument } from "./sound";
export { openMic, MicError, type Mic, type MicProblem } from "./mic";
export { eqStore, FLAT_EQ, EQ_MIN, EQ_MAX, type BaseEq } from "./eq";
