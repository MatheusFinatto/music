// Verificação rápida dos dados do plano e das missões (roda em Node, sem navegador).
// Uso: npm run check
import { D, WEEKS, CRIT, BLOCKS } from "../src/lib/plan.js";
import { WEEKS as MW, DEMOS, MISS } from "../src/lib/missions.js";

const fail = (m) => { console.error("FALHOU:", m); process.exitCode = 1; };
const LAYERS = ["all", "thirds", "fifths", "chord", "bends", "approach", "color", "ninths"];

if (D.length !== 57) fail("o plano deve ter 57 dias (0..56), tem " + D.length);
if (WEEKS.length !== 9) fail("WEEKS deve ter 9 entradas (dia 0 + 8 semanas)");
D.forEach((d, n) => {
  if (d.length !== 7) fail("dia " + n + " deve ter 7 campos");
  if (!LAYERS.includes(d[5])) fail("dia " + n + " usa camada desconhecida: " + d[5]);
  if (!(d[4] > 0)) fail("dia " + n + " precisa de meta > 0");
});
if (BLOCKS.reduce((a, b) => a + b[1], 0) !== 30) fail("os blocos do timer devem somar 30 minutos");
if (!CRIT.length) fail("CRIT vazio");

if (MW.length !== 8 || MISS.length !== 8) fail("missões devem ter 8 semanas");
MISS.forEach((week, w) => week.forEach((m, i) => {
  if (!["piano", "ouvir", "guitarra"].includes(m[0])) fail(`missão s${w + 1}#${i} tem tipo inválido`);
  if (m[2] && !DEMOS[m[2]]) fail(`missão s${w + 1}#${i} aponta para exemplo inexistente: ${m[2]}`);
}));
Object.entries(DEMOS).forEach(([k, d]) => d.notes.forEach((x) => {
  if (x.b < 0 || x.b >= 16 || x.d <= 0) fail("exemplo " + k + " tem nota fora dos 4 compassos");
}));

if (!process.exitCode) console.log("ok: 57 dias, 8 semanas de missões, " + Object.keys(DEMOS).length + " exemplos");
