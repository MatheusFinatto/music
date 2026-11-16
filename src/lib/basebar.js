// Barra da base (tocar, compassos, acorde atual) + janela "Montar base".
import { getBase, setBase, resetBase, onBaseChange, chordsOf, keyLabel, PRESETS, STYLES, DEFAULT_BASE, isDefaultBase } from "./base.js";
import { transport, previewChord, applyMix, now } from "./audio.js";
import { makeChord, DEG_ROMAN } from "./theory.js";

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
  }
  kids.flat().forEach((c) => c != null && e.append(c));
  return e;
};

export function mountBaseBar(container, { title = "Base", note = "" } = {}) {
  const play = h("button", { class: "btn primary", type: "button" }, "▶ Tocar base");
  const edit = h("button", { class: "btn", type: "button" }, "Montar base");
  const name = h("b"); const detail = h("span", { class: "small muted" });
  const bars = h("div", { class: "bars" });
  const msg = h("p", { class: "small muted" }, note);
  container.classList.add("panel");
  container.append(
    h("div", { class: "basebar" },
      h("div", { class: "row" }, play, edit),
      bars,
      h("div", { class: "info" }, name, detail)),
    msg,
  );

  let lastBeat = -1;
  const render = (beat = lastBeat) => {
    const b = getBase(), chs = chordsOf(b);
    name.textContent = chs.map((c) => c.n).join(" ");
    const kl = keyLabel(b.key);
    detail.textContent = kl.minor + " / " + kl.major + " · " + b.bpm + " bpm · " + (STYLES[b.style]?.label || "");
    bars.textContent = "";
    chs.forEach((ch, i) => {
      const bar = h("div", { class: "bar" + (beat >= 0 && Math.floor(beat / 4) === i ? " on" : "") }, h("b", {}, ch.n));
      const bt = h("div", { class: "beats" });
      for (let k = 0; k < 4; k++) bt.append(h("i", { class: beat === i * 4 + k ? "on" : "" }));
      bar.append(bt); bars.append(bar);
    });
    play.textContent = transport.running ? "■ Parar base" : "▶ Tocar base";
  };

  play.addEventListener("click", () => { transport.running ? transport.stop() : transport.start(); render(); });
  edit.addEventListener("click", () => openBaseModal());
  transport.on("start", () => render());
  transport.on("stop", () => { lastBeat = -1; render(-1); });
  transport.on("beat", (beat, t) => {
    setTimeout(() => { if (!transport.running) return; lastBeat = beat < 0 ? -1 : ((beat % 16) + 16) % 16; render(); }, Math.max(0, (t - now()) * 1000));
  });
  onBaseChange(() => { transport.update(); render(); });
  render(-1);
  return { render, setNote: (t) => (msg.textContent = t) };
}

let modal = null;
export function openBaseModal() {
  if (modal) modal.remove();
  const close = () => { modal.remove(); modal = null; document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);

  const body = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Montar base" });
  modal = h("div", { class: "modal", onclick: (e) => { if (e.target === modal) close(); } }, body);
  document.body.append(modal);

  const render = () => {
    const b = getBase(), kl = keyLabel(b.key), chs = chordsOf(b);
    body.textContent = "";
    body.append(h("div", { class: "head" }, h("h2", {}, "Montar base"), h("button", { class: "btn", type: "button", onclick: close, "aria-label": "Fechar" }, "✕")));

    // tom
    body.append(h("div", { class: "field" }, h("span", {}, "Tom"),
      h("div", { class: "keybox" },
        h("button", { class: "btn", type: "button", onclick: () => setBase({ key: b.key - 1 }) }, "− ½ tom"),
        h("b", {}, kl.minor),
        h("button", { class: "btn", type: "button", onclick: () => setBase({ key: b.key + 1 }) }, "+ ½ tom"),
        h("span", { class: "small muted" }, "relativo de " + kl.major))));

    // progressão
    const degs = h("div", { class: "degs" });
    b.prog.forEach((d, i) => {
      const sel = h("select", { class: "txt", "aria-label": "Compasso " + (i + 1), onchange: (e) => { const p = b.prog.slice(); p[i] = +e.target.value; setBase({ prog: p }); previewChord(makeChord(+e.target.value, b.key)); } });
      for (let k = 0; k < 7; k++) { const c = makeChord(k, b.key); const o = h("option", { value: k }, c.n + "  (" + DEG_ROMAN[k] + ")"); if (k === d) o.selected = true; sel.append(o); }
      degs.append(sel);
    });
    const presets = h("select", { class: "txt", "aria-label": "Atalhos", onchange: (e) => { if (e.target.value !== "") setBase({ prog: PRESETS[+e.target.value][1].slice() }); } },
      h("option", { value: "" }, "Atalhos de progressão…"),
      PRESETS.map(([n, p], i) => h("option", { value: i }, n + ": " + p.map((d) => makeChord(d, b.key).n).join(" "))));
    body.append(h("div", { class: "field" }, h("span", {}, "Acordes (campo harmônico de " + kl.major + " maior)"), degs, presets));

    // andamento e estilo
    const bpmV = h("b", { class: "mono" }, String(b.bpm));
    body.append(h("div", { class: "field" }, h("span", {}, "Andamento"),
      h("div", { class: "row" },
        h("button", { class: "btn", type: "button", onclick: () => setBase({ bpm: Math.max(40, b.bpm - 4) }) }, "−4"),
        h("input", { type: "range", min: 40, max: 160, value: b.bpm, "aria-label": "Andamento", oninput: (e) => { bpmV.textContent = e.target.value; }, onchange: (e) => setBase({ bpm: +e.target.value }) }),
        h("button", { class: "btn", type: "button", onclick: () => setBase({ bpm: Math.min(160, b.bpm + 4) }) }, "+4"),
        bpmV, h("span", { class: "small muted" }, "bpm"))));
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Estilo" });
    Object.entries(STYLES).forEach(([k, s]) => seg.append(h("button", { type: "button", "aria-pressed": b.style === k ? "true" : "false", onclick: () => setBase({ style: k }) }, s.label)));
    body.append(h("div", { class: "field" }, h("span", {}, "Estilo"), seg));

    // mixagem
    const mix = h("div", { class: "mix" });
    [["drums", "Bateria"], ["bass", "Baixo"], ["chords", "Acordes"], ["master", "Volume geral"]].forEach(([k, lab]) => {
      mix.append(h("label", {}, lab, h("input", { type: "range", min: 0, max: 100, value: b.mix[k], oninput: (e) => { const m = { ...getBase().mix, [k]: +e.target.value }; applyMix(m); }, onchange: (e) => setBase({ mix: { [k]: +e.target.value } }) })));
    });
    body.append(h("div", { class: "field" }, h("span", {}, "Mixagem"), mix,
      h("label", { class: "row small" }, h("input", { type: "checkbox", checked: b.click || false, onchange: (e) => setBase({ click: e.target.checked }) }), "Metrônomo junto")));

    body.append(h("div", { class: "row" },
      h("button", { class: "btn primary", type: "button", onclick: () => { transport.running ? transport.stop() : transport.start(); render(); } }, transport.running ? "■ Parar" : "▶ Ouvir"),
      h("button", { class: "btn", type: "button", disabled: isDefaultBase(b) && b.bpm === DEFAULT_BASE.bpm, onclick: () => { resetBase(); setBase({ bpm: DEFAULT_BASE.bpm, style: DEFAULT_BASE.style }); } }, "Voltar à base padrão (Am F C G, 72)"),
      h("span", { class: "small muted" }, chs.map((c) => c.roman).join(" · "))));
  };
  const unsub = () => {};
  onBaseChange(() => { if (modal) render(); });
  render();
  return unsub;
}

export { h };
