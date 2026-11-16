import "../styles.css";
import "./diario.css";
import { mountNav } from "../lib/nav.js";
import { mountBaseBar } from "../lib/basebar.js";
import { getBase, chordsOf, onBaseChange, isDefaultBase, shiftOf } from "../lib/base.js";
import { load, save, onExternalChange } from "../lib/store.js";
import { pentatonic, pcName, IV } from "../lib/theory.js";
import { WEEKS, D, weekOf, CRIT, BLOCKS } from "../lib/plan.js";

const $ = (id) => document.getElementById(id);
$("nav").append(mountNav("diario"));
const bar = mountBaseBar($("basebar"));
const baseNote = () => bar.setNote(isDefaultBase() ? "Use sempre a base padrão nas gravações, para comparar a evolução." :
  "Atenção: os textos dos dias falam da base padrão (Am F C G). O braço abaixo acompanha a base atual. Para gravar e comparar, volte à base padrão em \"Montar base\".");
baseNote();

/* ---------- estado ---------- */
let S = load("diario", { meta: {}, days: {} });
let sel = null, chordIdx = 0, userNavigated = false;
const day = (n) => S.days[n] || (S.days[n] = {});
const persist = () => save("diario", S);
const saveDay = (n) => { day(n).ts = Date.now(); persist(); };
onExternalChange("diario", () => { S = load("diario", { meta: {}, days: {} }); renderAll(); });

const firstOpen = () => { for (let n = 0; n <= 56; n++) if (!S.days[n]?.done) return n; return 56; };

/* ---------- régua ---------- */
function renderRuler() {
  const r = $("ruler"); r.textContent = "";
  for (let n = 0; n <= 56; n++) {
    if (n === 0 || (n - 1) % 7 === 0) { const w = document.createElement("div"); w.className = "wk"; w.textContent = WEEKS[weekOf(n)]; r.append(w); }
    const b = document.createElement("button"); b.type = "button"; b.className = "dbtn";
    const d = S.days[n] || {}, max = D[n][4];
    if (d.done) b.classList.add("done");
    if (D[n][6]) b.classList.add("rec");
    if (n === sel) b.classList.add("sel");
    b.textContent = n;
    b.setAttribute("aria-label", "Dia " + n + (d.done ? ", feito" : "") + (D[n][6] ? ", gravação" : ""));
    if (typeof d.count === "number" && d.count > 0 && !d.done) {
      const x = document.createElement("span"); x.className = "barx"; x.style.transform = "scaleX(" + Math.min(1, d.count / max) + ")"; b.append(x);
    }
    b.addEventListener("click", () => { userNavigated = true; select(n); });
    r.append(b);
  }
}
function renderStats() {
  let done = 0; for (let n = 0; n <= 56; n++) if (S.days[n]?.done) done++;
  let cur = 0; for (let n = firstOpen() - 1; n >= 0; n--) { if (S.days[n]?.done) cur++; else break; }
  $("st-done").textContent = done; $("st-streak").textContent = cur;
  const vals = [];
  for (let n = 56; n >= 1 && vals.length < 7; n--) { const d = S.days[n]; if (d && typeof d.count === "number" && (d.done || d.count > 0)) vals.push(d.count / D[n][4]); }
  $("st-avg").textContent = vals.length ? Math.round(100 * vals.reduce((a, b) => a + b, 0) / vals.length) + "%" : "–";
}

/* ---------- dia ---------- */
const setVal = (el, v) => { if (document.activeElement !== el) el.value = v || ""; };
function select(n) { sel = n; renderRuler(); renderDay(); }
function renderDay() {
  const n = sel, c = D[n], d = S.days[n] || {}, w = weekOf(n);
  $("d-eyebrow").textContent = (n === 0 ? "Dia 0" : "Dia " + n + " de 56") + " · " + WEEKS[w].split(" · ")[1];
  $("d-title").textContent = c[0];
  $("d-goal").textContent = c[1];
  const ol = $("d-steps"); ol.textContent = "";
  c[2].forEach((s) => { const li = document.createElement("li"); li.textContent = s; ol.append(li); });
  $("prev").disabled = n === 0; $("next").disabled = n === 56;
  $("m-label").textContent = c[3] + " (meta: " + c[4] + ")";
  renderCounter();
  let prev = "";
  for (let k = n - 1; k >= 1; k--) {
    const p = S.days[k];
    if (p && typeof p.count === "number" && D[k][5] === c[5] && (p.done || p.count > 0)) {
      prev = "Última vez com esse foco (dia " + k + "): " + p.count + "/" + D[k][4] + ". Hoje, tente " + Math.min(c[4], Math.round(p.count / D[k][4] * c[4]) + 1) + ".";
      break;
    }
  }
  $("m-prev").textContent = prev || "Primeira vez com esse foco. Qualquer número é o ponto de partida.";
  setVal($("note"), d.note);
  const db = $("done"); db.setAttribute("aria-pressed", d.done ? "true" : "false"); db.textContent = d.done ? "Dia feito ✓" : "Marcar dia como feito";
  setVal($("phrase"), (S.meta.phrases || {})[w]);
  $("phrase").disabled = n === 0;
  $("rec").hidden = !c[6];
  if (c[6]) renderCrit();
  renderChords(); renderBoard();
}
function renderCounter() {
  const c = D[sel], v = S.days[sel]?.count || 0;
  $("c-val").textContent = v + "/" + c[4];
  const p = $("pips"); p.textContent = "";
  for (let i = 0; i < c[4]; i++) { const s = document.createElement("span"); s.className = "pip" + (i < v ? " on" : ""); p.append(s); }
}
function renderCrit() {
  const box = $("crit"), sc = S.days[sel]?.scores || {}; box.textContent = "";
  CRIT.forEach(([k, label]) => {
    const l = document.createElement("span"); l.textContent = label; box.append(l);
    const g = document.createElement("div"); g.className = "scale"; g.setAttribute("role", "group"); g.setAttribute("aria-label", label);
    for (let i = 1; i <= 5; i++) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = i; b.setAttribute("aria-pressed", sc[k] === i ? "true" : "false");
      b.addEventListener("click", () => { const dd = day(sel); dd.scores = { ...(dd.scores || {}), [k]: i }; saveDay(sel); renderCrit(); renderCompare(); });
      g.append(b);
    }
    box.append(g);
  });
  const l = document.createElement("label"); l.textContent = "Vezes parado na tônica"; l.htmlFor = "tonica"; box.append(l);
  const inp = document.createElement("input"); inp.id = "tonica"; inp.type = "number"; inp.min = "0"; inp.inputMode = "numeric"; inp.className = "txt num"; inp.value = sc.tonica ?? "";
  inp.addEventListener("input", () => { const dd = day(sel); dd.scores = { ...(dd.scores || {}) }; const v = parseInt(inp.value, 10); if (isNaN(v)) delete dd.scores.tonica; else dd.scores.tonica = v; saveDay(sel); renderCompare(); });
  box.append(inp);
  setVal($("vid"), S.days[sel]?.video);
}

/* ---------- braço ---------- */
const OPEN = [4, 11, 7, 2, 9, 4];
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; parent.append(e); return e; };
const FX = (f) => (f === 0 ? 26 : 44 + (f - 0.5) * 55);
const SY = (s) => 22 + s * 28;
const LAYER_INFO = {
  all: "Pentatônica e as notas do acorde selecionado.",
  thirds: "Alvo do dia: a 3ª do acorde selecionado.",
  fifths: "Alvo do dia: a 5ª do acorde selecionado.",
  chord: "Alvos do dia: as três notas do acorde selecionado (tônica, 3ª e 5ª).",
  bends: "As setas mostram de onde sai o bend para chegar no alvo do acorde selecionado.",
  approach: "Alvo: a 3ª. A bolinha pequena logo atrás é a nota de passagem cromática.",
  color: "Cor sobre o acorde menor do vi: 9ª e 6ª. Nos outros acordes, use a 9ª com cuidado.",
  ninths: "Alvo do dia: a 9ª do acorde selecionado.",
};
function targetsFor(layer, ch) {
  const nine = ch.ninth ?? (ch.r + 2) % 12, isVi = ch.deg === 5;
  switch (layer) {
    case "thirds": case "approach": return [ch.third];
    case "fifths": return [ch.t[2]];
    case "ninths": return [nine];
    case "color": return isVi ? [nine, (ch.r + 9) % 12] : [nine];
    case "bends": return isVi ? [ch.third, nine] : [ch.third];
    default: return ch.t.slice();
  }
}
function renderChords() {
  const box = $("chords"); box.textContent = "";
  chordsOf().forEach((ch, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = ch.n;
    b.setAttribute("aria-pressed", i === chordIdx ? "true" : "false");
    b.addEventListener("click", () => { chordIdx = i; renderChords(); renderBoard(); });
    box.append(b);
  });
}
function renderBoard() {
  const svg = $("board"); svg.textContent = "";
  const base = getBase(), chs = chordsOf(base), ch = chs[chordIdx] || chs[0], layer = D[sel][5];
  const tg = targetsFor(layer, ch), penta = pentatonic(base.key);
  let lo = 4 + shiftOf(base); if (lo < 1) lo += 12; if (lo > 10) lo -= 12;
  const hi = lo + 6;
  el("rect", { x: 44, y: 8, width: 660, height: 168, rx: 4, style: "fill:var(--wood)" }, svg);
  for (let f = 1; f <= 12; f += 2) el("rect", { x: 44 + (f - 1) * 55, y: 8, width: 55, height: 168, style: "fill:var(--wood-2)" }, svg);
  [3, 5, 7, 9].forEach((f) => el("circle", { cx: FX(f), cy: 92, r: 6, style: "fill:var(--inlay);opacity:.55" }, svg));
  el("circle", { cx: FX(12), cy: 64, r: 6, style: "fill:var(--inlay);opacity:.55" }, svg);
  el("circle", { cx: FX(12), cy: 120, r: 6, style: "fill:var(--inlay);opacity:.55" }, svg);
  el("rect", { x: 44 + (lo - 1) * 55, y: 8, width: 55 * (Math.min(hi, 12) - lo + 1), height: 168, style: "fill:none;stroke:var(--target);stroke-width:1.5;stroke-dasharray:4 4;opacity:.7" }, svg);
  el("rect", { x: 40, y: 8, width: 6, height: 168, style: "fill:var(--inlay)" }, svg);
  for (let f = 1; f <= 12; f++) el("line", { x1: 44 + f * 55, y1: 8, x2: 44 + f * 55, y2: 176, style: "stroke:var(--fret);stroke-width:2" }, svg);
  for (let s = 0; s < 6; s++) el("line", { x1: 40, y1: SY(s), x2: 704, y2: SY(s), style: "stroke:var(--string);stroke-width:" + (0.8 + s * 0.35) }, svg);
  for (let f = 0; f <= 12; f++) el("text", { x: FX(f), y: 193, "text-anchor": "middle", style: "fill:var(--muted);font:500 10px var(--mono)" }, svg, String(f));
  ["e", "B", "G", "D", "A", "E"].forEach((n, s) => el("text", { x: 8, y: SY(s) + 4, style: "fill:var(--muted);font:500 10px var(--mono)" }, svg, n));

  const dots = [];
  for (let s = 0; s < 6; s++) for (let f = lo; f <= Math.min(hi, 12); f++) {
    const pc = (OPEN[s] + f) % 12, isT = tg.includes(pc);
    if (isT || penta.includes(pc)) dots.push({ s, f, pc, isT });
  }
  if (layer === "bends") {
    const half = sel === 13 && ch.deg === 5 ? 1 : 2;
    for (let s = 0; s < 3; s++) for (let f = lo; f <= hi; f++) {
      const pc = (OPEN[s] + f) % 12;
      tg.forEach((t) => {
        if ((pc + half) % 12 === t && (penta.includes(pc) || half === 1) && f + half <= 12) {
          const y = SY(s);
          el("path", { d: "M" + (FX(f) + 10) + " " + (y - 4) + " Q " + (FX(f) + FX(f + half)) / 2 + " " + (y - 24) + " " + (FX(f + half) - 11) + " " + (y - 6), style: "fill:none;stroke:var(--target);stroke-width:2" }, svg);
          el("circle", { cx: FX(f + half), cy: y, r: 9, style: "fill:none;stroke:var(--target);stroke-width:2;stroke-dasharray:3 2" }, svg);
        }
      });
    }
  }
  if (layer === "approach") dots.filter((d) => d.isT && d.f - 1 >= 1).forEach((d) => el("circle", { cx: FX(d.f - 1), cy: SY(d.s), r: 5, style: "fill:var(--accent)" }, svg));
  dots.forEach((d) => {
    const x = FX(d.f), y = SY(d.s), iv = IV[(d.pc - ch.r + 12) % 12], tone = ch.t.includes(d.pc);
    if (d.isT) {
      el("circle", { cx: x, cy: y, r: 11, style: "fill:var(--target)" }, svg);
      el("text", { x, y: y + 4, "text-anchor": "middle", style: "fill:#1b1206;font:700 11px var(--mono)" }, svg, iv);
    } else {
      el("circle", { cx: x, cy: y, r: 8, style: "fill:var(--inlay);opacity:" + (tone && layer === "all" ? "1" : ".8") }, svg);
      el("text", { x, y: y + 3.5, "text-anchor": "middle", style: "fill:var(--wood);font:600 8.5px var(--mono)" }, svg, tone ? iv : pcName(d.pc, base.key));
    }
  });
  const lg = $("legend"); lg.textContent = "";
  const item = (color, txt) => { const s = document.createElement("span"); const i = document.createElement("i"); i.style.background = color; s.append(i, txt); lg.append(s); };
  item("var(--target)", "Alvo: " + tg.map((p) => pcName(p, base.key)).join(" e ") + " sobre " + ch.n);
  item("var(--inlay)", "Pentatônica");
  if (layer === "approach") item("var(--accent)", "Nota de passagem");
  $("boardnote").textContent = LAYER_INFO[layer] + " O número dentro da bolinha é o intervalo em relação ao acorde (T = tônica). A moldura tracejada é a região onde você vai trabalhar.";
}

/* ---------- timer ---------- */
let tb = 0, tleft = BLOCKS[0][1] * 60, running = false, tick = null, actx = null, wake = null;
function beep() {
  try {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.6);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.65);
  } catch (e) { /* ignora */ }
}
function renderTimer() {
  const m = Math.floor(tleft / 60), s = tleft % 60;
  $("clock").textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  const bl = $("blocks"), lb = $("blabels"); bl.textContent = ""; lb.textContent = "";
  BLOCKS.forEach((b, i) => {
    const o = document.createElement("div"); o.className = "blk"; const f = document.createElement("div");
    f.style.width = (i < tb ? 100 : i > tb ? 0 : 100 * (1 - tleft / (b[1] * 60))) + "%"; o.append(f); bl.append(o);
    const l = document.createElement("span"); l.textContent = b[0] + " · " + b[1] + "′"; if (i === tb) l.className = "on"; lb.append(l);
  });
  $("t-now").textContent = tb < BLOCKS.length ? BLOCKS[tb][2] : "Sessão completa. Registre a medição e marque o dia.";
  $("t-go").textContent = running ? "Pausar" : tb >= BLOCKS.length ? "Recomeçar" : "Iniciar";
}
function nextBlock() { tb++; if (tb >= BLOCKS.length) { running = false; clearInterval(tick); tleft = 0; releaseWake(); } else tleft = BLOCKS[tb][1] * 60; beep(); renderTimer(); }
async function grabWake() { try { if (navigator.wakeLock) wake = await navigator.wakeLock.request("screen"); } catch (e) { /* ignora */ } }
function releaseWake() { try { wake && wake.release(); } catch (e) { /* ignora */ } wake = null; }
$("t-go").addEventListener("click", () => {
  try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ignora */ }
  if (tb >= BLOCKS.length) { tb = 0; tleft = BLOCKS[0][1] * 60; }
  running = !running;
  if (running) { grabWake(); tick = setInterval(() => { tleft--; if (tleft <= 0) nextBlock(); else renderTimer(); }, 1000); }
  else { clearInterval(tick); releaseWake(); }
  renderTimer();
});
$("t-skip").addEventListener("click", () => { if (tb < BLOCKS.length) nextBlock(); });
$("t-reset").addEventListener("click", () => { running = false; clearInterval(tick); releaseWake(); tb = 0; tleft = BLOCKS[0][1] * 60; renderTimer(); });

/* ---------- eventos ---------- */
$("prev").addEventListener("click", () => { if (sel > 0) { userNavigated = true; select(sel - 1); } });
$("next").addEventListener("click", () => { if (sel < 56) { userNavigated = true; select(sel + 1); } });
const bump = (dlt) => { const d = day(sel); d.count = Math.max(0, Math.min(D[sel][4], (d.count || 0) + dlt)); saveDay(sel); renderCounter(); renderRuler(); renderStats(); renderChart(); };
$("c-plus").addEventListener("click", () => bump(1));
$("c-minus").addEventListener("click", () => bump(-1));
$("note").addEventListener("input", (e) => { day(sel).note = e.target.value; saveDay(sel); });
$("vid").addEventListener("input", (e) => { day(sel).video = e.target.value; saveDay(sel); });
$("phrase").addEventListener("input", (e) => { S.meta.phrases = { ...(S.meta.phrases || {}), [weekOf(sel)]: e.target.value }; persist(); });
$("done").addEventListener("click", () => { const d = day(sel); d.done = !d.done; if (typeof d.count !== "number") d.count = 0; saveDay(sel); renderDay(); renderRuler(); renderStats(); renderChart(); });

/* ---------- evolução ---------- */
function renderChart() {
  const svg = $("chart"); svg.textContent = "";
  const L = 30, R = 592, T = 10, B = 126, w = (R - L) / 56;
  [0, 50, 100].forEach((p) => { const y = B - (B - T) * p / 100; el("line", { x1: L, y1: y, x2: R, y2: y, style: "stroke:var(--line);stroke-width:1" }, svg); el("text", { x: L - 6, y: y + 3, "text-anchor": "end" }, svg, p + "%"); });
  for (let wk = 1; wk <= 8; wk++) {
    const x = L + (wk - 1) * 7 * w;
    el("text", { x: x + 3.5 * w, y: 142, "text-anchor": "middle" }, svg, "S" + wk);
    if (wk > 1) el("line", { x1: x, y1: T, x2: x, y2: B, style: "stroke:var(--line);stroke-dasharray:2 3" }, svg);
  }
  let any = false;
  for (let n = 1; n <= 56; n++) {
    const d = S.days[n]; if (!d || typeof d.count !== "number" || !(d.done || d.count > 0)) continue;
    any = true; const h = (B - T) * d.count / D[n][4];
    el("rect", { x: L + (n - 1) * w + 1.5, y: B - h, width: Math.max(2, w - 3), height: Math.max(h, 1), rx: 1.5, style: "fill:" + (D[n][6] ? "var(--accent)" : "var(--target)") }, svg);
  }
  if (!any) el("text", { x: (L + R) / 2, y: (T + B) / 2, "text-anchor": "middle", style: "font-size:11px" }, svg, "As barras aparecem conforme você registra a medição de cada dia.");
}
function renderCompare() {
  const box = $("compare"); box.textContent = "";
  const cols = []; for (let n = 0; n <= 56; n++) { const s = S.days[n]?.scores; if (D[n][6] && s && Object.keys(s).length) cols.push(n); }
  if (!cols.length) { const p = document.createElement("p"); p.className = "empty"; p.textContent = "A tabela aparece quando você preencher a ficha do dia 0. Os dias com bolinha vermelha são dias de gravação."; box.append(p); return; }
  const t = document.createElement("table"), th = document.createElement("tr");
  const h0 = document.createElement("th"); h0.textContent = "Critério"; th.append(h0);
  cols.forEach((n) => { const h = document.createElement("th"); h.textContent = "Dia " + n; th.append(h); });
  t.append(th);
  CRIT.concat([["tonica", "Vezes parado na tônica"]]).forEach(([k, l]) => {
    const tr = document.createElement("tr"); const td = document.createElement("td"); td.textContent = l; tr.append(td);
    cols.forEach((n) => { const c = document.createElement("td"); const v = S.days[n].scores[k]; c.textContent = v == null ? "–" : v; c.className = "mono"; tr.append(c); });
    t.append(tr);
  });
  box.append(t);
}

function renderAll() {
  if (sel === null || !userNavigated) sel = firstOpen();
  renderRuler(); renderDay(); renderStats(); renderChart(); renderCompare(); renderTimer();
}
onBaseChange(() => { chordIdx = Math.min(chordIdx, 3); baseNote(); renderChords(); renderBoard(); });
renderAll();
