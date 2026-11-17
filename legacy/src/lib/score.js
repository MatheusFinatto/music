// Partitura (abcjs) e tablatura de uma ideia de 4 compassos.
import abcjs from "abcjs";
import { IV, LETTER, noteName, place, STRING_LETTER } from "./theory.js";

const fn = (m, ch) => IV[(((m - ch.r) % 12) + 12) % 12];
const chordAtBeat = (chs, b) => chs[Math.min(3, Math.floor(b / 4))];

export function tabText(notes, chs, asHtml, layout, targets = ["3"]) {
  const CW = layout?.cw || 3, bpl = layout?.bpl || 4, perBar = 16 * CW;
  const lines = STRING_LETTER.map(() => [0, 1, 2, 3].map(() => Array(perBar).fill("-")));
  const own = STRING_LETTER.map(() => [0, 1, 2, 3].map(() => Array(perBar).fill(-1)));
  notes.forEach((x, ni) => {
    const pos = place(x.m); if (!pos) return;
    const six = Math.round(x.b * 4), bar = Math.min(3, Math.floor(six / 16)), c = (six % 16) * CW + (CW > 2 ? 1 : 0);
    const st = String(pos.f);
    for (let i = 0; i < st.length && c + i < perBar; i++) { lines[pos.s][bar][c + i] = st[i]; own[pos.s][bar][c + i] = ni; }
  });
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const row = (si, bi) => {
    if (!asHtml) return lines[si][bi].join("");
    let out = "", open = -1;
    lines[si][bi].forEach((ch, ci) => {
      const o = own[si][bi][ci];
      if (o !== open) {
        if (open >= 0) out += "</span>";
        if (o >= 0) {
          const tg = targets.includes(fn(notes[o].m, chordAtBeat(chs, notes[o].b)));
          out += '<span class="tn' + (tg ? " tgt" : "") + '" data-ni="' + o + '">';
        }
        open = o;
      }
      out += ch;
    });
    if (open >= 0) out += "</span>";
    return out;
  };
  const systems = [];
  for (let b0 = 0; b0 < 4; b0 += bpl) {
    const bars = []; for (let b = b0; b < Math.min(4, b0 + bpl); b++) bars.push(b);
    const head = "  " + bars.map((b) => (chs[b].n + " ".repeat(perBar)).slice(0, perBar)).join(" ");
    const cnt = "  " + bars.map(() => { let r = ""; for (let k = 0; k < 4; k++) r += (String(k + 1) + " ".repeat(4 * CW)).slice(0, 4 * CW); return r; }).join(" ");
    const rows = STRING_LETTER.map((nm, si) => nm + "|" + bars.map((b) => row(si, b)).join("|") + "|");
    systems.push((asHtml ? esc(head) : head) + "\n" + rows.join("\n") + "\n" + cnt);
  }
  return systems.join("\n\n") + "\n";
}

const LENS = [16, 12, 8, 6, 4, 3, 2, 1];
function abcPitch(m) {
  const pc = m % 12, oct = Math.floor(m / 12) - 1;
  const map = { 0: ["C", ""], 1: ["C", "^"], 2: ["D", ""], 3: ["E", "_"], 4: ["E", ""], 5: ["F", ""], 6: ["F", "^"], 7: ["G", ""], 8: ["G", "^"], 9: ["A", ""], 10: ["B", "_"], 11: ["B", ""] };
  const [L, acc] = map[pc];
  let name = oct >= 5 ? L.toLowerCase() : L;
  if (oct >= 6) name += "'".repeat(oct - 5);
  if (oct <= 3) name += ",".repeat(4 - oct);
  return { key: L + oct, acc, name };
}

export function toAbc(notes, chs, bpm, seq, bpl = 4, labels = true) {
  const ev = notes.map((x, ni) => ({ m: x.m, ni, s: Math.round(x.b * 4), e: Math.round(x.b * 4) + Math.max(1, Math.round(x.d * 4)) }))
    .filter((x) => x.s < 64).sort((a, b) => a.s - b.s);
  for (let i = 0; i < ev.length; i++) {
    const nx = ev[i + 1];
    if (nx && nx.s <= ev[i].s) { ev.splice(i + 1, 1); i--; continue; }
    if (nx && ev[i].e > nx.s) ev[i].e = nx.s;
    if (ev[i].e > 64) ev[i].e = 64;
  }
  const segs = []; let cur = 0;
  ev.forEach((x) => { if (x.s > cur) segs.push({ rest: true, s: cur, e: x.s }); segs.push({ m: x.m, ni: x.ni, s: x.s, e: x.e }); cur = x.e; });
  if (cur < 64) segs.push({ rest: true, s: cur, e: 64 });
  const bars = [[], [], [], []];
  segs.forEach((sg) => {
    let pos = sg.s;
    while (pos < sg.e) {
      const bar = Math.floor(pos / 16), barEnd = (bar + 1) * 16;
      let room = Math.min(sg.e, barEnd) - pos;
      while (room > 0) {
        const beatRoom = 4 - (pos % 4);
        const L = LENS.find((l) => l <= room && (l <= beatRoom || pos % 4 === 0)) || 1;
        bars[bar].push({ rest: sg.rest, m: sg.m, ni: sg.ni, s: pos, l: L, first: pos === sg.s, tie: !sg.rest && pos + L < sg.e });
        pos += L; room -= L;
      }
    }
  });
  const body = bars.map((items, bi) => {
    const accs = {}; let out = '"' + chs[bi].n + '"';
    items.forEach((it, k) => {
      if (k > 0 && it.s % 4 === 0) out += " ";
      if (it.rest) { out += "z" + (it.l === 1 ? "" : it.l); return; }
      const p = abcPitch(it.m); let a = p.acc;
      if (a === "") { if (accs[p.key]) a = "="; } else if (accs[p.key] === a) a = "";
      accs[p.key] = p.acc || undefined;
      const f = fn(it.m, chs[bi]);
      if (seq) seq.push({ m: it.m, ni: it.ni, fn: f });
      if (it.first && labels) out += '"_' + f + '"';
      out += a + p.name + (it.l === 1 ? "" : it.l) + (it.tie ? "-" : "");
    });
    return out;
  }).map((b, i) => b + (i === 3 ? " |]" : " |") + (bpl && (i + 1) % bpl === 0 && i < 3 ? "\n" : " ")).join("");
  return "X:1\nM:4/4\nL:1/16\nQ:1/4=" + (bpm || 72) + "\nK:C\n" + body + "\n";
}

let CHAR_W = 0;
function charWidth() {
  if (CHAR_W) return CHAR_W;
  const pre = document.createElement("pre"); pre.className = "tab";
  Object.assign(pre.style, { position: "absolute", visibility: "hidden", border: "0", padding: "0" });
  pre.textContent = "0".repeat(40); document.body.appendChild(pre);
  CHAR_W = pre.getBoundingClientRect().width / 40 || 7.6; pre.remove(); return CHAR_W;
}
function tabLayout(width) {
  const chars = Math.floor((width - 22) / charWidth());
  const opts = [{ cw: 3, bpl: 4 }, { cw: 3, bpl: 2 }, { cw: 2, bpl: 2 }, { cw: 3, bpl: 1 }, { cw: 2, bpl: 1 }];
  return opts.find((o) => 2 + o.bpl * (16 * o.cw + 1) <= chars) || { cw: 2, bpl: 1 };
}
const scoreBpl = (w) => (w >= 640 ? 4 : w >= 300 ? 2 : 1);

function wireNotes(el, seq, targets, onSelect, selected) {
  const els = el.querySelectorAll(".abcjs-note");
  if (els.length !== seq.length) return;
  const tip = document.createElement("div"); tip.className = "ntip"; tip.hidden = true; el.appendChild(tip);
  let pinned = null;
  const show = (n, m) => {
    tip.textContent = noteName(m); tip.hidden = false;
    const r = n.getBoundingClientRect(), c = el.getBoundingClientRect();
    let x = r.left - c.left + el.scrollLeft + r.width / 2; const y = r.top - c.top + el.scrollTop;
    tip.style.left = "0px"; tip.style.top = "0px";
    const w = tip.offsetWidth; x = Math.max(4, Math.min(x - w / 2, el.scrollWidth - w - 4));
    tip.style.left = x + "px"; tip.style.top = Math.max(2, y - tip.offsetHeight - 6) + "px";
    els.forEach((o) => o.classList.remove("hl")); n.classList.add("hl");
  };
  const hide = () => { if (pinned) return; tip.hidden = true; els.forEach((o) => o.classList.remove("hl")); };
  els.forEach((n, i) => {
    const m = seq[i].m;
    n.setAttribute("data-ni", seq[i].ni);
    if (targets.includes(seq[i].fn)) n.classList.add("tgt");
    if (seq[i].ni === selected) n.classList.add("sel");
    const addHit = (tries) => {
      try {
        if (!n.isConnected || !n.getBBox().width) { if (tries < 20) requestAnimationFrame(() => addHit(tries + 1)); return; }
        const bb = n.getBBox(), hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hit.setAttribute("x", bb.x - 4); hit.setAttribute("y", bb.y - 4); hit.setAttribute("width", bb.width + 8); hit.setAttribute("height", bb.height + 8);
        hit.setAttribute("fill", "#000"); hit.setAttribute("fill-opacity", "0"); hit.style.pointerEvents = "all";
        n.insertBefore(hit, n.firstChild);
      } catch (e) { /* ignora */ }
    };
    addHit(0);
    n.setAttribute("tabindex", "0"); n.setAttribute("aria-label", noteName(m));
    n.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { pinned = null; show(n, m); } });
    n.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
    n.addEventListener("click", () => { pinned = n; show(n, m); if (onSelect) onSelect(seq[i].ni); });
    n.addEventListener("focus", () => show(n, m));
    n.addEventListener("blur", () => { pinned = null; hide(); });
  });
  el.addEventListener("click", (e) => { if (!e.target.closest(".abcjs-note")) { pinned = null; hide(); } });
}

function renderScore(el, notes, chs, bpm, bpl, width, targets, onSelect, selected) {
  el.textContent = "";
  try {
    const seq = [];
    const sw = Math.max(260, Math.min(900, (width || 760) - 24));
    abcjs.renderAbc(el, toAbc(notes, chs, bpm, seq, bpl, true), {
      responsive: "resize", add_classes: true, foregroundColor: getComputedStyle(document.body).color,
      paddingtop: 0, paddingbottom: 0, paddingleft: 0, paddingright: 0, staffwidth: sw,
    });
    wireNotes(el, seq, targets, onSelect, selected);
  } catch (e) {
    el.innerHTML = '<p class="empty small">Não consegui desenhar a partitura desta ideia.</p>';
  }
}

// Bloco completo: legenda, cifra rápida, partitura e tab. Reorganiza ao mudar a largura.
export function sheetBlock(container, { notes, chs, bpm, owner, targets = ["3"], cifra = false, onSelect = null, selected = -1 }) {
  if (owner) container.dataset.owner = owner;
  const tName = { 3: "3ª", 9: "9ª", 5: "5ª", T: "tônica" };
  if (cifra) {
    const cif = document.createElement("div"); cif.className = "cifra";
    chs.forEach((ch, bi) => {
      const hit = notes.filter((x) => Math.floor(x.b / 4) === bi && targets.includes(fn(x.m, ch)));
      if (!hit.length) return;
      const c = document.createElement("div"); c.className = "cif";
      const a = document.createElement("small"); a.textContent = ch.n;
      const b = document.createElement("b"); b.textContent = [...new Set(hit.map((x) => noteName(x.m)))].join(" ");
      c.append(a, b); cif.appendChild(c);
    });
    container.appendChild(cif);
  }
  const hint = document.createElement("p"); hint.className = "score-hint";
  const tg = document.createElement("b"); tg.className = "tgt-word";
  tg.textContent = "laranja: nota-alvo (" + targets.map((x) => tName[x] || x).join(", ") + " do acorde)";
  hint.append("Em ", tg, ". Embaixo de cada nota, a função dela no acorde do compasso. Passe o mouse para ver o nome (C4 = Dó central).");
  const sc = document.createElement("div"); sc.className = "score";
  const pre = document.createElement("pre"); pre.className = "tab";
  if (onSelect) { pre.classList.add("pick"); pre.addEventListener("click", (e) => { const t = e.target.closest(".tn"); if (t) onSelect(+t.dataset.ni); }); }
  container.append(hint, sc, pre);

  let lastKey = "";
  const render = () => {
    const w = container.clientWidth || 700;
    const key = scoreBpl(w) + ":" + JSON.stringify(tabLayout(w));
    if (key === lastKey) return; lastKey = key;
    renderScore(sc, notes, chs, bpm, scoreBpl(w), w, targets, onSelect, selected);
    pre.innerHTML = tabText(notes, chs, true, tabLayout(w), targets);
    if (selected >= 0) pre.querySelectorAll('[data-ni="' + selected + '"]').forEach((e) => e.classList.add("sel"));
  };
  requestAnimationFrame(render);
  if (window.ResizeObserver) {
    let t = null;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (sc.isConnected) render(); else ro.disconnect(); }, 120); });
    ro.observe(container);
  }
}

// Acende a nota `ni` de um bloco enquanto ela toca.
export function flashSheet(owner, ni, delayMs, durMs) {
  setTimeout(() => {
    const sel = '[data-owner="' + owner + '"] [data-ni="' + ni + '"]';
    document.querySelectorAll(sel).forEach((e) => e.classList.add("now"));
    setTimeout(() => document.querySelectorAll(sel).forEach((e) => e.classList.remove("now")), Math.max(110, durMs - 30));
  }, Math.max(0, delayMs));
}

// HTML para baixar/imprimir.
export function exportHtml(title, notes, chs, bpm) {
  const tmp = document.createElement("div");
  Object.assign(tmp.style, { position: "absolute", left: "-9999px", width: "800px" });
  document.body.appendChild(tmp);
  let svg = "";
  try {
    abcjs.renderAbc(tmp, toAbc(notes, chs, bpm, null, 4, true), { foregroundColor: "#000", staffwidth: 740 });
    const sv = tmp.querySelector("svg"); if (sv) { sv.setAttribute("xmlns", "http://www.w3.org/2000/svg"); svg = sv.outerHTML; }
  } catch (e) { /* ignora */ }
  tmp.remove();
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(title) +
    '</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 16px;color:#000;background:#fff}pre{font:13px/1.35 ui-monospace,Menlo,monospace;overflow-x:auto}h1{font-size:22px}p{color:#444}</style></head><body><h1>' +
    esc(title) + "</h1><p>" + esc(chs.map((c) => c.n).join(" ")) + " · " + (bpm || 72) + " bpm</p>" + svg +
    '<h2 style="font-size:16px">Tablatura</h2><pre>' + esc(tabText(notes, chs)) + "</pre></body></html>";
}

export { LETTER };
