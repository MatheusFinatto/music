import "../styles.css";
import { mountNav } from "../lib/nav.js";
import { mountBaseBar } from "../lib/basebar.js";
import { exportAll, importAll } from "../lib/store.js";

const $ = (id) => document.getElementById(id);
$("nav").append(mountNav("home"));
mountBaseBar($("basebar"), { note: "A base vale para o Diário e o Piano. Monte, transponha e salve aqui ou dentro de cada página." });

const css = document.createElement("style");
css.textContent = `.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.card{display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px;text-decoration:none;color:var(--ink)}
.card:hover{border-color:var(--accent)} .card p{color:var(--muted)} .card .go{color:var(--accent);font-weight:600;margin-top:auto}`;
document.head.append(css);

$("export").addEventListener("click", () => {
  const data = JSON.stringify(exportAll(), null, 1);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "musica-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  $("status").textContent = "Backup baixado.";
});
$("import").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const n = importAll(JSON.parse(await f.text()));
    $("status").textContent = "Importado (" + n + " partes). Recarregando…";
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    $("status").textContent = "Não consegui importar: " + (err.message || "arquivo inválido") + ".";
  }
  e.target.value = "";
});
