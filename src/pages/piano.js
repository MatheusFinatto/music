import "../styles.css";
import "./piano.css";
import { mountNav } from "../lib/nav.js";
import { mountBaseBar } from "../lib/basebar.js";
import { getBase, setBase, chordsOf, onBaseChange, shiftOf, DEFAULT_BASE } from "../lib/base.js";
import { load, save, onExternalChange } from "../lib/store.js";
import { audio, resume, voice, playNote, transport, now } from "../lib/audio.js";
import { pentatonic, IV, LETTER, noteName, legacyToDegrees } from "../lib/theory.js";
import { sheetBlock, flashSheet, exportHtml } from "../lib/score.js";
import { CATS, CHALLENGES, DEMOS, challengeOfDay, TARGETS, targetLabel } from "../lib/challenges.js";
import { GRIDS, quantize, moveNote, resizeNote, transposeNote, deleteNote, where } from "../lib/edit.js";

const $ = (id) => document.getElementById(id);
$("nav").append(mountNav("piano"));
mountBaseBar($("basebar"));

/* ---------- estado ---------- */
const EMPTY = { meta: { color: false, target: "3" }, ideas: {}, done: {} };
let S = load("piano", EMPTY);
const persist = () => save("piano", S);
onExternalChange("piano", () => { S = load("piano", EMPTY); renderAll(); });

const baseOfIdea = (it) => it.base || { key: 0, prog: legacyToDegrees(it.prog || ["Am", "F", "C", "G"]) };
const chsOfIdea = (it) => chordsOf(baseOfIdea(it));
const sameBase = (a, b) => ((a.key % 12) + 12) % 12 === ((b.key % 12) + 12) % 12 && a.prog.join() === b.prog.join();

function setStatus(t, rec) { ["status", "s-status"].forEach((id) => { const s = $(id); s.textContent = t; s.className = "status" + (rec ? " rec" : ""); }); }

/* ---------- teclado ---------- */
const LO = 57, HI = 79;
const KEYMAP = { KeyA: 57, KeyW: 58, KeyS: 59, KeyD: 60, KeyR: 61, KeyF: 62, KeyT: 63, KeyG: 64, KeyH: 65, KeyU: 66, KeyJ: 67, KeyI: 68, KeyK: 69, KeyO: 70, KeyL: 71, Semicolon: 72, BracketLeft: 73, Quote: 74, BracketRight: 75, Backslash: 76 };
const KEYLABEL = { KeyA: "A", KeyW: "W", KeyS: "S", KeyD: "D", KeyR: "R", KeyF: "F", KeyT: "T", KeyG: "G", KeyH: "H", KeyU: "U", KeyJ: "J", KeyI: "I", KeyK: "K", KeyO: "O", KeyL: "L", Semicolon: "Ç", BracketLeft: "´", Quote: "~", BracketRight: "[", Backslash: "]" };
const MIDI2KEY = {}; for (const k in KEYMAP) MIDI2KEY[KEYMAP[k]] = KEYLABEL[k];
const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
const keyEls = {};
let shownChord = 0;

function buildKeyboard(kb, lo = LO, hi = HI) {
  kb.textContent = ""; for (const k in keyEls) delete keyEls[k];
  const whites = []; for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const W = 100 / whites.length;
  const mk = (cls, m, left, width) => {
    const k = document.createElement("div"); k.className = cls; k.style.left = left + "%"; k.style.width = width + "%"; k.dataset.m = m;
    const dot = document.createElement("span"); dot.className = "dot";
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = LETTER[m % 12];
    k.append(dot, nm);
    if (MIDI2KEY[m]) { const kk = document.createElement("span"); kk.className = "kk"; kk.textContent = MIDI2KEY[m]; k.append(kk); }
    kb.append(k); keyEls[m] = k;
  };
  whites.forEach((m, i) => mk("wk", m, i * W, W));
  for (let m = lo; m <= hi; m++) if (isBlack(m)) { const wi = whites.indexOf(m - 1); if (wi >= 0) mk("bk", m, (wi + 1) * W - W * 0.32, W * 0.64); }
  markChord(shownChord);
  if (kb.dataset.bound) return; kb.dataset.bound = "1";
  kb.addEventListener("contextmenu", (e) => e.preventDefault());
  const active = {};
  kb.addEventListener("pointerdown", (e) => {
    const k = e.target.closest("[data-m]"); if (!k) return;
    e.preventDefault(); kb.setPointerCapture?.(e.pointerId);
    active[e.pointerId] = +k.dataset.m; noteOn(+k.dataset.m);
  });
  kb.addEventListener("pointermove", (e) => {
    if (!(e.pointerId in active)) return;
    const k = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-m]"); if (!k) return;
    const m = +k.dataset.m; if (m !== active[e.pointerId]) { noteOff(active[e.pointerId]); active[e.pointerId] = m; noteOn(m); }
  });
  const up = (e) => { if (e.pointerId in active) { noteOff(active[e.pointerId]); delete active[e.pointerId]; } };
  kb.addEventListener("pointerup", up); kb.addEventListener("pointercancel", up);
}
const curTarget = () => S.meta.target || "3";
function targetPcs(ch, t = curTarget()) {
  if (t === "T") return [ch.r];
  if (t === "5") return [ch.t[2]];
  if (t === "9") return [ch.ninth ?? (ch.r + 2) % 12];
  if (t === "all") return ch.t.slice();
  return [ch.third];
}
const targetFns = (t = curTarget()) => (t === "all" ? ["T", "3", "5"] : [t]);
function renderTarget() {
  const box = $("target"); box.textContent = "";
  TARGETS.forEach(([v, lab]) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = lab;
    b.setAttribute("aria-pressed", curTarget() === v ? "true" : "false");
    b.addEventListener("click", () => { S.meta.target = v; persist(); renderTarget(); markChord(shownChord); renderIdeas(); });
    box.append(b);
  });
  $("legend-target").textContent = curTarget() === "all" ? "Notas do acorde que está soando (alvo)" : targetLabel(curTarget()) + " do acorde que está soando (alvo)";
}
function markChord(ci) {
  shownChord = ci;
  const b = getBase(), ch = chordsOf(b)[ci], penta = pentatonic(b.key);
  for (let m = LO; m <= HI; m++) {
    const k = keyEls[m]; if (!k) continue;
    const d = k.querySelector(".dot"), pc = m % 12;
    d.className = "dot"; d.textContent = "";
    const colorPcs = [ch.ninth, ch.deg === 5 ? (ch.r + 9) % 12 : null].filter((x) => x != null);
    if (targetPcs(ch).includes(pc)) { d.classList.add("target"); d.textContent = IV[(pc - ch.r + 12) % 12]; }
    else if (ch.t.includes(pc)) { d.classList.add("chord"); d.textContent = IV[(pc - ch.r + 12) % 12]; }
    else if (S.meta.color && colorPcs.includes(pc)) { d.classList.add("color"); d.textContent = IV[(pc - ch.r + 12) % 12]; }
    else if (penta.includes(pc)) d.classList.add("penta");
    k.setAttribute("aria-label", noteName(m) + (d.textContent ? " (" + d.textContent + " de " + ch.n + ")" : ""));
  }
}

const held = {};
function noteOn(m) {
  if (!audio()) return; resume();
  if (held[m]) noteOff(m);
  held[m] = { v: voice(m, now()), b: transport.curBeat() };
  keyEls[m]?.classList.add("down");
  if (recState === "rec") {
    const rel = held[m].b - recStart;
    if (rel > -0.3 && rel < 16) { held[m].rec = { m, b: Math.max(0, rel), d: null }; recNotes.push(held[m].rec); }
  }
}
function noteOff(m) {
  const h = held[m]; if (!h) return;
  h.v.stop(now());
  if (h.rec) h.rec.d = Math.max(0.1, transport.curBeat() - h.b);
  delete held[m]; keyEls[m]?.classList.remove("down");
}
document.addEventListener("keydown", (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
  const m = KEYMAP[e.code]; if (m == null) return; e.preventDefault(); noteOn(m);
});
document.addEventListener("keyup", (e) => { const m = KEYMAP[e.code]; if (m != null) noteOff(m); });
window.addEventListener("blur", () => Object.keys(held).forEach((m) => noteOff(+m)));

/* ---------- gravação e reprodução ---------- */
let recState = "off", recStart = 0, recNotes = [], recBase = null;
let playing = null; // { obj, notes, owner }

function updateRecBtn() {
  $("rec").classList.toggle("on", recState !== "off"); $("rec").textContent = recState === "off" ? "● Gravar ideia" : "■ Cancelar gravação";
  $("s-rec").classList.toggle("on", recState !== "off"); $("s-rec").textContent = recState === "off" ? "● Gravar" : "■ Cancelar";
}
function recStatus(b) {
  const first = chordsOf()[0].n;
  if (recState === "armed") setStatus(b < 0 ? "Contagem… a gravação começa no " + first + "." : "Armado: a gravação começa no próximo " + first + ".", true);
  else if (recState === "rec") setStatus("Gravando: " + Math.max(0, Math.ceil(recStart + 16 - b)) + " tempos restantes. Toque a sua ideia.", true);
}
function toggleRec() {
  if (recState !== "off") { recState = "off"; updateRecBtn(); setStatus("Gravação cancelada."); return; }
  recState = "armed"; updateRecBtn();
  if (!transport.running) transport.start({ countIn: true });
  recStatus(transport.curBeat());
}
$("rec").addEventListener("click", toggleRec);
$("s-rec").addEventListener("click", toggleRec);
$("s-play").addEventListener("click", () => (transport.running ? transport.stop() : transport.start()));

function finishRec() {
  Object.keys(held).forEach((m) => noteOff(+m));
  recState = "off"; updateRecBtn();
  const notes = recNotes.map((x) => ({ m: x.m, b: Math.max(0, Math.min(15.75, Math.round(x.b * 4) / 4)), d: Math.max(0.25, Math.round((x.d ?? 0.5) * 4) / 4) })).sort((a, b) => a.b - b.b);
  if (!notes.length) { setStatus("Nenhuma nota gravada. Tente de novo quando quiser."); return; }
  draft = { notes, bpm: getBase().bpm, base: recBase, challenge: activeChallenge };
  renderDraft();
  setStatus("Ideia gravada com " + notes.length + " notas. Ouça, dê um nome e salve.");
}

transport.on("beat", (beat, t, info) => {
  if (beat >= 0) {
    const p = beat % 16;
    if (p === 0 && recState === "armed") { recState = "rec"; recStart = beat; recNotes = []; const b = getBase(); recBase = { key: b.key, prog: b.prog.slice() }; }
    if (playing) {
      playing.notes.forEach((x, ni) => {
        if (x.b >= p && x.b < p + 1) {
          const at = t + (x.b - p) * transport.beatDur, du = Math.max(0.12, x.d * transport.beatDur);
          playNote(x.m, at, du);
          const delay = (at - now()) * 1000;
          setTimeout(() => { keyEls[x.m]?.classList.add("play"); setTimeout(() => keyEls[x.m]?.classList.remove("play"), Math.max(90, du * 1000 - 40)); }, Math.max(0, delay));
          if (playing.owner) flashSheet(playing.owner, ni, delay, du * 1000);
        }
      });
    }
  }
  setTimeout(() => {
    if (!transport.running) return;
    const p = beat < 0 ? -1 : beat % 16;
    markChord(p < 0 ? 0 : Math.floor(p / 4));
    renderStageBars(p);
    recStatus(beat);
    if (recState === "rec" && beat >= recStart + 16) finishRec();
  }, Math.max(0, (t - now()) * 1000));
});
transport.on("stop", () => {
  if (recState !== "off") { recState = "off"; updateRecBtn(); setStatus("Gravação cancelada."); }
  playing = null; renderStageBars(-1); $("s-play").textContent = "▶ Base"; renderDraft(); renderIdeas(); renderDesafios();
});
transport.on("start", () => { $("s-play").textContent = "■ Base"; });

function togglePlay(key, obj, notes, base) {
  if (playing && playing.key === key) { transport.stop(); return; }
  playing = { key, obj, notes, owner: key };
  if (!sameBase(base, getBase())) {
    setBase({ key: base.key, prog: base.prog.slice() });
    setStatus("A base mudou para " + chordsOf(base).map((c) => c.n).join(" ") + ", a base em que essa ideia foi feita.");
  }
  if (!transport.running) transport.start();
  renderDraft(); renderIdeas(); renderDesafios();
}
const isPlaying = (key) => !!(playing && playing.key === key);

/* ---------- ideias ---------- */
let draft = null, filterStar = false;
const openTabs = new Set(), confirmDel = new Set();

function renderDraft() {
  $("draft").hidden = !draft; $("s-draft").hidden = !draft;
  if (!draft) return;
  $("s-draft-txt").textContent = "Ideia gravada: " + draft.notes.length + " notas.";
  $("s-draft-play").textContent = isPlaying("draft") ? "■ Parar" : "▶ Ouvir";
  $("draft-play").textContent = isPlaying("draft") ? "■ Parar" : "▶ Ouvir com a base";
  const box = $("draft-sheet");
  if (box.dataset.for !== String(draft.notes.length) + draft.notes[0].b) {
    box.textContent = ""; box.dataset.for = String(draft.notes.length) + draft.notes[0].b;
    sheetBlock(box, { notes: draft.notes, chs: chordsOf(draft.base), bpm: draft.bpm, owner: "draft", targets: targetFns() });
  }
}
$("draft-play").addEventListener("click", () => togglePlay("draft", draft, draft.notes, draft.base));
$("s-draft-play").addEventListener("click", () => $("draft-play").click());
const dropDraft = () => { if (isPlaying("draft")) transport.stop(); draft = null; $("draft-name").value = ""; $("draft-sheet").dataset.for = ""; renderDraft(); setStatus("Ideia descartada."); };
$("draft-drop").addEventListener("click", dropDraft);
$("s-draft-drop").addEventListener("click", dropDraft);
const saveDraft = () => {
  const id = "idea_" + Date.now();
  const name = $("draft-name").value.trim() || "Ideia " + (Object.keys(S.ideas).length + 1);
  S.ideas[id] = { name, notes: draft.notes, bpm: draft.bpm, base: draft.base, created: Date.now(), star: false, tried: false, ...(draft.challenge ? { challenge: draft.challenge } : {}) };
  if (isPlaying("draft")) transport.stop();
  draft = null; $("draft-name").value = ""; $("draft-sheet").dataset.for = "";
  persist(); renderDraft(); renderIdeas(); setStatus("Ideia salva: " + name + ".");
};
$("draft-save").addEventListener("click", saveDraft);
$("s-draft-save").addEventListener("click", saveDraft);

$("f-all").addEventListener("click", () => { filterStar = false; $("f-all").setAttribute("aria-pressed", "true"); $("f-star").setAttribute("aria-pressed", "false"); renderIdeas(); });
$("f-star").addEventListener("click", () => { filterStar = true; $("f-all").setAttribute("aria-pressed", "false"); $("f-star").setAttribute("aria-pressed", "true"); renderIdeas(); });

const btn = (txt, onclick, cls = "btn") => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.addEventListener("click", onclick); return b; };

function claudeText(it) {
  const chs = chsOfIdea(it);
  return "Avalie esta ideia do Piano de Ideias.\n" + JSON.stringify({
    ideia: it.name, base: chs.map((c) => c.n).join(" "), bpm: it.bpm,
    notas: it.notes.map((x) => ({ nota: noteName(x.m), compasso: Math.floor(x.b / 4) + 1, tempo: +((x.b % 4) + 1).toFixed(2), duracao: x.d })),
  }, null, 1);
}
async function copyForClaude(it) {
  const text = claudeText(it);
  try { await navigator.clipboard.writeText(text); setStatus("Copiado. Cole no chat do Claude."); }
  catch (e) { setStatus("Não consegui copiar automaticamente. Selecione e copie o texto que apareceu no topo da ideia."); }
}
function download(it) {
  const html = exportHtml(it.name || "Ideia", it.notes, chsOfIdea(it), it.bpm);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = (it.name || "ideia").replace(/[\\/:*?"<>|]/g, "").slice(0, 80) + ".html";
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- editor de ideias ---------- */
const selectedOf = {}, undoOf = {};
let editStep = 0.25;
function applyEdit(id, it, res) {
  (undoOf[id] = undoOf[id] || []).push(it.notes.map((x) => ({ ...x })));
  if (!it.original) it.original = it.notes.map((x) => ({ ...x }));
  it.notes = res.notes; selectedOf[id] = res.sel;
  if (isPlaying(id)) playing.notes = it.notes;
  persist(); renderIdeas();
}
function editorFor(id, it, sel) {
  const box = document.createElement("div"); box.className = "editor";
  const row = (...kids) => { const r = document.createElement("div"); r.className = "row"; r.append(...kids); return r; };
  const label = (t) => { const s = document.createElement("span"); s.className = "small muted"; s.textContent = t; return s; };

  box.append(row(label("Ajustar todas ao tempo:"), ...GRIDS.map(([g, n]) => btn(n, () => applyEdit(id, it, quantize(it.notes, g))))));

  const step = document.createElement("div"); step.className = "seg"; step.setAttribute("role", "group"); step.setAttribute("aria-label", "Passo");
  GRIDS.forEach(([g, n]) => { const b = btn(n, () => { editStep = g; renderIdeas(); }); b.setAttribute("aria-pressed", editStep === g ? "true" : "false"); step.append(b); });

  if (sel >= 0 && it.notes[sel]) {
    const x = it.notes[sel];
    const info = document.createElement("b"); info.className = "sel-info"; info.textContent = noteName(x.m) + " · " + where(x.b);
    box.append(row(label("Nota selecionada:"), info, label("Passo:"), step));
    box.append(row(
      btn("← Antes", () => applyEdit(id, it, moveNote(it.notes, sel, -editStep))),
      btn("Depois →", () => applyEdit(id, it, moveNote(it.notes, sel, editStep))),
      btn("Mais curta", () => applyEdit(id, it, resizeNote(it.notes, sel, -editStep))),
      btn("Mais longa", () => applyEdit(id, it, resizeNote(it.notes, sel, editStep))),
      btn("↑ ½ tom", () => { const r = transposeNote(it.notes, sel, 1); applyEdit(id, it, r); playNote(x.m + 1, now(), 0.4); }),
      btn("↓ ½ tom", () => { const r = transposeNote(it.notes, sel, -1); applyEdit(id, it, r); playNote(x.m - 1, now(), 0.4); }),
      Object.assign(btn("Apagar nota", () => applyEdit(id, it, deleteNote(it.notes, sel))), { style: "color:var(--bad)" }),
    ));
  } else {
    box.append(label("Clique numa nota da partitura ou da tab para editar só ela. Ela fica verde."));
  }
  const tail = [];
  if (undoOf[id]?.length) tail.push(btn("Desfazer", () => { it.notes = undoOf[id].pop(); selectedOf[id] = -1; persist(); renderIdeas(); }));
  if (it.original) tail.push(btn("Voltar ao original", () => { (undoOf[id] = undoOf[id] || []).push(it.notes); it.notes = it.original.map((x) => ({ ...x })); selectedOf[id] = -1; persist(); renderIdeas(); }));
  if (tail.length) box.append(row(...tail));
  return box;
}

function renderIdeas() {
  const box = $("ideas"); box.textContent = "";
  const ids = Object.keys(S.ideas).filter((k) => S.ideas[k] && (!filterStar || S.ideas[k].star)).sort((a, b) => (S.ideas[b].created || 0) - (S.ideas[a].created || 0));
  if (!ids.length) {
    const p = document.createElement("p"); p.className = "empty";
    p.textContent = filterStar ? "Nenhuma favorita ainda. Marque com ★ as ideias que você quer levar para a guitarra." : "Nenhuma ideia salva ainda. Aperte \"Gravar ideia\": vem 1 compasso de contagem e você tem 4 compassos para tocar. A ideia aparece aqui em partitura e tab.";
    box.append(p); return;
  }
  ids.forEach((id) => {
    const it = S.ideas[id], card = document.createElement("article"); card.className = "idea";
    const head = document.createElement("div"); head.className = "head";
    const star = btn("★", () => { it.star = !it.star; persist(); renderIdeas(); }, "star");
    star.setAttribute("aria-pressed", it.star ? "true" : "false"); star.setAttribute("aria-label", "Favorita");
    const nm = document.createElement("input"); nm.className = "name"; nm.value = it.name || ""; nm.setAttribute("aria-label", "Nome da ideia");
    nm.addEventListener("change", () => { it.name = nm.value.trim() || it.name; persist(); });
    const acts = document.createElement("div"); acts.className = "row";
    acts.append(
      btn(isPlaying(id) ? "■ Parar" : "▶ Ouvir", () => togglePlay(id, it, it.notes, baseOfIdea(it))),
      btn(openTabs.has(id) ? "Esconder partitura" : "Partitura e tab", () => { openTabs.has(id) ? openTabs.delete(id) : openTabs.add(id); renderIdeas(); }),
      btn(it.tried ? "✓ Testei na guitarra" : "Testei na guitarra", () => { it.tried = !it.tried; persist(); renderIdeas(); }),
      btn("Copiar para o Claude", () => copyForClaude(it)),
      confirmDel.has(id)
        ? Object.assign(btn("Confirmar exclusão", () => { if (isPlaying(id)) transport.stop(); delete S.ideas[id]; confirmDel.delete(id); persist(); renderIdeas(); }), { style: "color:var(--bad)" })
        : btn("Excluir", () => { confirmDel.add(id); renderIdeas(); setTimeout(() => { confirmDel.delete(id); renderIdeas(); }, 4000); }),
    );
    head.append(star, nm, acts); card.append(head);
    const meta = document.createElement("p"); meta.className = "meta";
    const chal = CHALLENGES.find((c) => c.id === it.challenge);
    meta.textContent = (chal ? "Desafio: " + chal.title + " · " : "") + chsOfIdea(it).map((c) => c.n).join(" ") + " · " + it.notes.length + " notas · " + (it.bpm || "?") + " bpm · " + new Date(it.created).toLocaleDateString("pt-BR");
    card.append(meta);
    if (openTabs.has(id)) {
      const sel = selectedOf[id] ?? -1;
      const sheet = document.createElement("div"); sheet.style.cssText = "display:flex;flex-direction:column;gap:10px";
      card.append(sheet);
      sheetBlock(sheet, {
        notes: it.notes, chs: chsOfIdea(it), bpm: it.bpm, owner: id, selected: sel, targets: targetFns(),
        onSelect: (ni) => { selectedOf[id] = ni === selectedOf[id] ? -1 : ni; if (selectedOf[id] >= 0 && audio()) { resume(); playNote(it.notes[ni].m, now(), 0.5); } renderIdeas(); },
      });
      card.append(editorFor(id, it, sel), btn("Baixar partitura e tab (.html)", () => download(it)));
    }
    box.append(card);
  });
}

/* ---------- desafios ---------- */
let pick = null, activeChallenge = null, demoOpen = false;
const demoFor = (key) => {
  const d = DEMOS[key], b = getBase(), sh = shiftOf(b);
  return { ...d, base: { key: b.key, prog: DEFAULT_BASE.prog.slice() }, notes: d.notes.map((x) => ({ ...x, m: x.m + sh })) };
};
function currentIdx() { return pick ?? challengeOfDay(); }
function startChallenge(c) {
  activeChallenge = c.id;
  S.meta.target = c.target; persist(); renderTarget(); markChord(shownChord);
  setStatus("Desafio: " + c.title + ". Alvo: " + targetLabel(c.target) + ". Grave quando quiser.");
  renderDesafios();
}
function renderDesafios() {
  const i = currentIdx(), c = CHALLENGES[i], box = $("today"); box.textContent = "";
  const card = document.createElement("article"); card.className = "challenge";
  const chip = document.createElement("span"); chip.className = "catchip"; chip.textContent = (pick == null ? "Desafio do dia · " : "") + CATS[c.cat];
  const h = document.createElement("h2"); h.textContent = c.title;
  const p = document.createElement("p"); p.className = "text"; p.textContent = c.text;
  const next = document.createElement("p"); next.className = "next"; next.textContent = "Depois, na guitarra: toque a sua melhor versão e improvise com a mesma ideia, sem olhar nada.";
  const done = S.done[c.id] || 0;
  const row = document.createElement("div"); row.className = "row";
  row.append(
    btn(activeChallenge === c.id ? "✓ Desafio ativo" : "Começar este desafio", () => startChallenge(c), "btn primary"),
    btn("Fiz ✓" + (done ? " (" + done + "x)" : ""), () => { S.done[c.id] = done + 1; persist(); renderDesafios(); }),
    btn("Outro desafio", () => { pick = (currentIdx() + 1) % CHALLENGES.length; demoOpen = false; renderDesafios(); }),
  );
  card.append(chip, h, p, row);
  if (c.demo && DEMOS[c.demo]) {
    const demo = demoFor(c.demo), owner = "demo-" + c.demo;
    const dbox = document.createElement("div"); dbox.className = "demo";
    const t = document.createElement("p"); t.className = "small"; const b = document.createElement("b"); b.textContent = demo.name; t.append(b);
    const r = document.createElement("div"); r.className = "row";
    r.append(
      btn(isPlaying(owner) ? "■ Parar" : "▶ Ouvir com a base", () => togglePlay(owner, demo, demo.notes, demo.base)),
      btn(demoOpen ? "Esconder partitura" : "Ver partitura e tab", () => { demoOpen = !demoOpen; renderDesafios(); }),
    );
    dbox.append(t, r);
    if (demoOpen) sheetBlock(dbox, { notes: demo.notes, chs: chordsOf(demo.base), bpm: demo.bpm, owner, targets: targetFns(c.target), cifra: true });
    card.append(dbox);
  }
  card.append(next);
  box.append(card);

  const deck = $("deck"); deck.textContent = "";
  Object.entries(CATS).forEach(([k, name]) => {
    const g = document.createElement("div"); g.className = "group";
    const gh = document.createElement("h3"); gh.textContent = name; g.append(gh);
    CHALLENGES.forEach((x, xi) => {
      if (x.cat !== k) return;
      const it = document.createElement("div"); it.className = "item" + (xi === i ? " cur" : "");
      const tt = document.createElement("b"); tt.textContent = x.title;
      const right = document.createElement("div"); right.className = "row";
      const cnt = document.createElement("span"); cnt.className = "count"; cnt.textContent = (S.done[x.id] || 0) + "x";
      right.append(cnt, btn(xi === i ? "Aberto" : "Abrir", () => { pick = xi; demoOpen = false; document.querySelector(".deckwrap").open = false; renderDesafios(); window.scrollTo({ top: $("today").getBoundingClientRect().top + scrollY - 80, behavior: "smooth" }); }));
      it.append(tt, right); g.append(it);
    });
    deck.append(g);
  });
}

/* ---------- abas, cor ---------- */
["ideias", "desafios"].forEach((t) => $("tab-" + t).addEventListener("click", () => {
  ["ideias", "desafios"].forEach((x) => { $("tab-" + x).setAttribute("aria-selected", x === t ? "true" : "false"); $("p-" + x).hidden = x !== t; });
}));
$("color").addEventListener("change", (e) => { S.meta.color = e.target.checked; persist(); markChord(shownChord); });

/* ---------- tela cheia ---------- */
let staged = false, stageOct = 0, fsOn = false, stageWake = null;
const narrow = () => window.innerWidth < 640;
const stageRange = () => (!narrow() ? [LO, HI] : stageOct === 0 ? [57, 69] : [67, 79]);
function renderStageBars(p) {
  const box = $("s-bars"); box.textContent = "";
  chordsOf().forEach((ch, i) => {
    const d = document.createElement("div"); d.className = "bar" + (p >= 0 && Math.floor(p / 4) === i ? " on" : "");
    const b = document.createElement("b"); b.textContent = ch.n; d.append(b);
    const bt = document.createElement("div"); bt.className = "beats";
    for (let k = 0; k < 4; k++) { const x = document.createElement("i"); if (p === i * 4 + k) x.className = "on"; bt.append(x); }
    d.append(bt); box.append(d);
  });
}
function buildStage() {
  const [lo, hi] = stageRange(); buildKeyboard($("s-kb"), lo, hi);
  $("s-oct").hidden = !narrow(); $("s-oct").textContent = stageOct === 0 ? "Oitava ↑" : "Oitava ↓";
}
async function openStage() {
  staged = true; $("stage").hidden = false; document.body.classList.add("staged");
  buildStage(); renderStageBars(-1); renderDraft();
  try { if (document.documentElement.requestFullscreen) { await document.documentElement.requestFullscreen(); fsOn = true; } } catch (e) { /* ignora */ }
  try { await screen.orientation?.lock?.("landscape"); } catch (e) { /* ignora */ }
  try { if (navigator.wakeLock) stageWake = await navigator.wakeLock.request("screen"); } catch (e) { /* ignora */ }
  if (staged) buildStage();
}
function closeStage() {
  if (!staged) return; staged = false;
  Object.keys(held).forEach((m) => noteOff(+m));
  $("stage").hidden = true; document.body.classList.remove("staged");
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignora */ }
  try { screen.orientation?.unlock?.(); } catch (e) { /* ignora */ }
  try { stageWake?.release(); } catch (e) { /* ignora */ }
  stageWake = null; fsOn = false;
  buildKeyboard($("kb"));
}
$("stage-open").addEventListener("click", openStage);
$("s-close").addEventListener("click", closeStage);
$("s-oct").addEventListener("click", () => { Object.keys(held).forEach((m) => noteOff(+m)); stageOct = 1 - stageOct; buildStage(); });
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && fsOn) closeStage(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && staged) closeStage(); });
let rsz = null; window.addEventListener("resize", () => { if (!staged) return; clearTimeout(rsz); rsz = setTimeout(buildStage, 150); });

/* ---------- início ---------- */
function renderAll() { if (!S.done) S.done = {}; $("color").checked = !!S.meta.color; renderTarget(); markChord(shownChord); renderIdeas(); renderDesafios(); renderDraft(); }
onBaseChange(() => { markChord(shownChord); renderStageBars(-1); renderDesafios(); });
buildKeyboard($("kb"));
renderStageBars(-1);
renderAll();
