"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { playLead, resumeAudio } from "@/core/audio";
import { chordsOf, fretSpan, midiAt, mod12, pcName, pentatonicShape, positionsOf, toneOf, type ChordDegree, type FretPos } from "@/core/theory";
import type { FindExercise } from "../curriculum/types";
import type { Rating } from "../session/schedule";
import { Fretboard, type Dot } from "../components/Fretboard";

type Question = { chord: number; degree: ChordDegree };

const keyOf = (p: FretPos) => `${p.string}-${p.fret}`;

function sound(pos: FretPos) {
  const g = resumeAudio();
  if (g) playLead(g, { midi: midiAt(pos), beat: 0, dur: 0.8 }, g.ctx.currentTime + 0.02, 0.6);
}

/**
 * "Ache a nota". Com várias perguntas possíveis, uma por rodada.
 * Com uma pergunta só (ex.: a tônica de um acorde), uma rodada única: achar todas as posições.
 */
export function FindEngine({ ex, onResult }: { ex: FindExercise; onResult: (r: Rating) => void }) {
  const t = useTranslations("solos.find");
  const base = ex.base!;
  const chords = chordsOf(base.prog, base.key);
  const single = chords.length * ex.ask.length === 1;

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<FretPos[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [map, setMap] = useState(false);

  const box = pentatonicShape(base.key, ex.shape);
  const [lo, hi] = fretSpan(box);
  // Candidatas: as notas do desenho mais as notas dos acordes que caem na mesma região.
  const all = new Map<string, FretPos>();
  [...box, ...positionsOf(chords.flatMap((c) => [...c.tones]), lo, hi)].forEach((p) => all.set(keyOf(p), p));
  const candidates = [...all.values()];

  const start = () => {
    const qs: Question[] = [];
    while (qs.length < (single ? 1 : ex.rounds)) {
      const q = { chord: Math.floor(Math.random() * chords.length), degree: ex.ask[Math.floor(Math.random() * ex.ask.length)]! };
      const prev = qs.at(-1);
      if (!single && prev && prev.chord === q.chord && prev.degree === q.degree) continue; // sem repetir em seguida
      qs.push(q);
    }
    setQuestions(qs); setRound(0); setPicks([]); setHits(0); setMisses(0); setFinished(false); setMap(false);
  };

  if (!questions)
    return <div className="engine"><button type="button" className="btn primary" onClick={start}>{t("start")}</button></div>;

  if (finished) {
    const rating: Rating = single
      ? misses === 0 ? "ok" : misses === 1 ? "quase" : "nao"
      : hits / questions.length >= 0.9 ? "ok" : hits / questions.length >= 0.6 ? "quase" : "nao";
    const again = <button key="a" type="button" className={rating === "nao" ? "btn primary" : "btn"} onClick={start}>{t("again")}</button>;
    const go = <button key="c" type="button" className={rating === "nao" ? "btn" : "btn primary"} onClick={() => onResult(rating)}>{t("continue")}</button>;
    return (
      <div className="engine">
        <p className="result" role="status">{single ? t("scoreAll", { misses }) : t("score", { hits, total: questions.length })}</p>
        <p>{t(`verdict.${rating}`)}</p>
        <div className="row">
          {rating === "nao" ? [again, go] : [go, again]}
          <button type="button" className="btn" aria-expanded={map} onClick={() => setMap((m) => !m)}>{map ? t("hideMap") : t("seeMap")}</button>
        </div>
        {map && (
          <Fretboard
            minFret={lo}
            maxFret={hi}
            label={t("mapLabel")}
            dots={candidates.map((p): Dot => ({ ...p, kind: box.some((b) => keyOf(b) === keyOf(p)) ? "scale" : "pick", label: pcName(midiAt(p), base.key) }))}
          />
        )}
      </div>
    );
  }

  const q = questions[round]!;
  const chord = chords[q.chord]!;
  const target = toneOf(chord, q.degree);
  const isTarget = (p: FretPos) => mod12(midiAt(p)) === target;
  const total = candidates.filter(isTarget).length;
  const found = picks.filter(isTarget).length;
  const last = picks.at(-1);
  const answered = !single && picks.length > 0;

  const pick = (pos: FretPos) => {
    if (answered || picks.some((p) => keyOf(p) === keyOf(pos))) return;
    sound(pos);
    setPicks((ps) => [...ps, pos]);
    if (isTarget(pos)) {
      setHits((h) => h + 1);
      if (single && found + 1 === total) setFinished(true);
    } else setMisses((m) => m + 1);
  };
  const next = () => {
    setPicks([]);
    if (round + 1 >= questions.length) setFinished(true);
    else setRound((r) => r + 1);
  };

  const dots: Dot[] = candidates.map((p) => {
    const picked = picks.some((x) => keyOf(x) === keyOf(p));
    if (picked) return isTarget(p) ? { ...p, kind: "ok", label: q.degree } : { ...p, kind: "bad" };
    if (answered && isTarget(p)) return { ...p, kind: "ok", label: q.degree };
    return { ...p, kind: "pick" };
  });

  const feedback = !last ? (single ? t("hintAll") : "") : isTarget(last) ? (single ? t("foundSome", { found, total }) : t("right")) : t(single ? "wrongAll" : "wrong");

  return (
    <div className="engine">
      <p className="prompt" role="status">
        {!single && <span className="count">{round + 1}/{questions.length}</span>}
        {t(`${single ? "askAll" : "ask"}.${q.degree}`, { chord: chord.name })}
      </p>
      <Fretboard minFret={lo} maxFret={hi} dots={dots} onPick={pick} label={t("board")} describe={(p) => t("pos", { string: p.string + 1, fret: p.fret })} />
      <div className="row">
        <p className={last ? (isTarget(last) ? "feedback ok" : "feedback bad") : "feedback"} role="status">{feedback}</p>
        {answered && <button type="button" className="btn primary" onClick={next} autoFocus>{t("next")}</button>}
      </div>
    </div>
  );
}
