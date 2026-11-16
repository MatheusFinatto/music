// Teste de fumaça no navegador (precisa do Playwright instalado globalmente ou no projeto).
// Uso: npm run build && npx vite preview --port 4173 &  depois  node scripts/smoke.mjs
import { createRequire } from "node:module";
// Aceita Playwright local ou global (NODE_PATH=$(npm root -g)).
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));

const BASE = process.env.URL || "http://localhost:4173";
const out = process.env.SHOTS || "/tmp";
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const errs = [];
const page = async (path, opts = { viewport: { width: 1100, height: 1400 } }) => {
  const p = await b.newPage(opts);
  p.on("pageerror", (e) => errs.push(path + ": " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push(path + ": " + m.text()); });
  await p.goto(BASE + path); await p.waitForTimeout(400);
  return p;
};

// início
let p = await page("/");
await p.screenshot({ path: out + "/smoke-home.png", fullPage: true });

// diário: tocar base, mudar tom pelo modal
p = await page("/diario");
await p.click("#basebar .btn.primary"); await p.waitForTimeout(1500);
await p.click("text=Montar base"); await p.waitForTimeout(200);
await p.click("text=+ ½ tom"); await p.waitForTimeout(200);
const tom = await p.textContent(".modal .keybox b");
await p.screenshot({ path: out + "/smoke-modal.png" });
await p.click(".modal .head .btn");
await p.click("#c-plus");
const count = await p.textContent("#c-val");
console.log("diário: tom após +½ =", tom, "| contador =", count);
await p.screenshot({ path: out + "/smoke-diario.png", fullPage: true });
await p.evaluate(() => localStorage.clear());

// piano: gravar uma ideia pelo teclado do computador
p = await page("/piano");
await p.click("text=Montar base"); await p.locator(".modal input[type=range]").first().fill("110"); await p.locator(".modal input[type=range]").first().dispatchEvent("change");
await p.click(".modal .head .btn");
await p.click("#rec"); await p.waitForTimeout(2400);
for (const k of ["KeyD", "KeyF", "KeyG", "KeyJ"]) { await p.keyboard.down(k); await p.waitForTimeout(300); await p.keyboard.up(k); await p.waitForTimeout(800); }
await p.waitForTimeout(6000);
console.log("piano:", await p.textContent("#status"));
await p.click("#draft-save"); await p.waitForTimeout(200);
await p.click("text=Partitura e tab"); await p.waitForTimeout(600);
console.log("piano: notas na partitura =", await p.$$eval(".idea .abcjs-note", (e) => e.length));
await p.click("#tab-missoes"); await p.click(".demo .btn:nth-child(2)"); await p.waitForTimeout(500);
await p.screenshot({ path: out + "/smoke-piano.png", fullPage: true });

console.log(errs.length ? "ERROS:\n" + errs.join("\n") : "sem erros no console");
await b.close();
