// Desenho da tela do afinador no <canvas>: porte de marmota-tuner/app/.../TunerPainter.kt.
// A geometria (onde cada coisa fica) e a cena (o que mostrar) vêm do Kotlin compartilhado;
// aqui fica só o traço, que depende de cada plataforma. Mudou o visual do app? Mude aqui também.
import { IN_TUNE_CENTS, type TunerGeometry, type TunerScene } from "@/core/pitch";

// Laranja = alvo (nota e marca central), azul = o que está soando, verde = afinado.
// As cores vêm do CSS da página: no computador, a paleta da marmota; no celular (.app-screen), globals.css troca as
// variáveis pelas de marmota-tuner/app/src/main/res/values/colors.xml e a tela fica igual à do app.
export type TunerColors = { background: string; ink: string; muted: string; target: string; now: string; inTune: string };

/** Fallback: as cores do app, para quando o CSS ainda não chegou. */
export const TUNER_COLORS: TunerColors = {
  background: "#1e1e1e",
  ink: "#ededed",
  muted: "#9a9a9a",
  target: "#ff7a1a",
  now: "#4aa3ff",
  inTune: "#3ddc84",
};

export function readTunerColors(el: Element): TunerColors {
  const s = getComputedStyle(el);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  const f = TUNER_COLORS;
  return {
    background: v("--bg", f.background),
    ink: v("--ink", f.ink),
    muted: v("--muted", f.muted),
    target: v("--target", f.target),
    now: v("--accent", f.now),
    inTune: v("--ok", f.inTune),
  };
}

const IDLE_ALPHA = 90 / 255;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const rad = (deg: number) => (deg * Math.PI) / 180;
const frequencyFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function drawTuner(ctx: CanvasRenderingContext2D, g: TunerGeometry, scene: TunerScene, width: number, height: number, c: TunerColors = TUNER_COLORS) {
  const dp = g.dp;
  const sp = (v: number) => v * dp;

  ctx.save();
  ctx.fillStyle = c.background;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";
  ctx.lineCap = "round";

  // Nota e oitava
  const reading = scene.reading ?? null;
  if (reading) {
    ctx.globalAlpha = scene.active ? 1 : IDLE_ALPHA;
    ctx.fillStyle = c.target;
    ctx.font = `300 ${g.noteTextSize}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(reading.name, g.centerX, g.noteBaseline);
    const octaveX = g.centerX + ctx.measureText(reading.name).width / 2 + 3 * dp;
    ctx.font = `400 ${g.noteTextSize * 0.28}px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(String(reading.octave), octaveX, g.noteBaseline + g.noteTextSize * 0.06);
    ctx.globalAlpha = 1;
  }

  // Frequência, ou o aviso no lugar dela
  const message = scene.message ?? null;
  const frequency = message ?? (reading ? `${frequencyFormat.format(reading.frequencyHz)} Hz` : null);
  if (frequency) {
    ctx.globalAlpha = scene.active || message ? 1 : IDLE_ALPHA;
    ctx.fillStyle = c.ink;
    ctx.font = `400 ${sp(15)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(frequency, g.centerX, g.frequencyBaseline);
    ctx.globalAlpha = 1;
  }

  // Mostrador: faixa de ±5 cents, marcas a cada 10, ♭ e ♯ nas pontas
  const ring = g.radius + 10 * dp;
  const tolerance = g.angleForCents(IN_TUNE_CENTS);
  ctx.globalAlpha = 70 / 255;
  ctx.strokeStyle = c.inTune;
  ctx.lineWidth = 3 * dp;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.arc(g.centerX, g.pivotY, ring, rad(-90 - tolerance), rad(-90 + tolerance));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  for (let cents = -50; cents <= 50; cents += 10) drawTick(ctx, g, cents);

  const edge = rad(g.maxAngleDegrees);
  const reach = g.radius * Math.sin(edge) + 22 * dp;
  const symbolY = g.pivotY - g.radius * Math.cos(edge) + 22 * dp;
  ctx.fillStyle = c.muted;
  ctx.font = `400 ${sp(22)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("♭", g.centerX - reach, symbolY);
  ctx.fillText("♯", g.centerX + reach, symbolY);

  // Agulha: cheia perto do pino, sumindo na ponta
  const needleColor = !scene.active ? c.muted : reading?.isInTune ? c.inTune : c.now;
  ctx.save();
  ctx.translate(g.centerX, g.pivotY);
  ctx.rotate(rad(g.angleForCents(scene.needleCents)));
  const fade = ctx.createLinearGradient(0, 0, 0, -g.radius);
  fade.addColorStop(0, needleColor);
  fade.addColorStop(1, `${needleColor}30`);
  ctx.strokeStyle = fade;
  ctx.lineWidth = 3 * dp;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -g.radius + 6 * dp);
  ctx.stroke();
  ctx.restore();

  ctx.globalAlpha = 150 / 255;
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5 * dp;
  ctx.beginPath();
  ctx.arc(g.centerX, g.pivotY, 30 * dp, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = needleColor;
  ctx.beginPath();
  ctx.arc(g.centerX, g.pivotY, 5 * dp, 0, 2 * Math.PI);
  ctx.fill();

  // Nível do microfone: contorno do microfone e uma barra que enche de baixo para cima
  const barLeft = g.meterRight - 4 * dp;
  const barBottom = g.meterTop + 24 * dp;
  const micLeft = barLeft - 20 * dp;
  const micRight = barLeft - 10 * dp;
  const micBottom = g.meterTop + 17 * dp;
  ctx.globalAlpha = 150 / 255;
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 1.5 * dp;
  roundRect(ctx, micLeft, g.meterTop + 2 * dp, micRight - micLeft, micBottom - g.meterTop - 2 * dp, 5 * dp);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((micLeft + micRight) / 2, micBottom + 2 * dp);
  ctx.lineTo((micLeft + micRight) / 2, barBottom);
  ctx.stroke();
  ctx.globalAlpha = 60 / 255;
  ctx.fillStyle = c.muted;
  roundRect(ctx, barLeft, g.meterTop, g.meterRight - barLeft, barBottom - g.meterTop, 2 * dp);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.now;
  const levelTop = barBottom - (barBottom - g.meterTop) * scene.level;
  roundRect(ctx, barLeft, levelTop, g.meterRight - barLeft, barBottom - levelTop, 2 * dp);
  ctx.fill();

  ctx.restore();
}

/** Marcas a cada 10 cents; o centro é uma linha laranja dupla. */
function drawTick(ctx: CanvasRenderingContext2D, g: TunerGeometry, cents: number) {
  const dp = g.dp;
  const isEnd = cents === -50 || cents === 50;
  const length = (cents === 0 || isEnd ? 30 : 22) * dp;
  ctx.save();
  ctx.translate(g.centerX, g.pivotY);
  ctx.rotate(rad(g.angleForCents(cents)));
  const top = -g.radius;
  ctx.beginPath();
  if (cents === 0) {
    const half = 3.5 * dp;
    ctx.strokeStyle = TUNER_COLORS.target;
    ctx.lineWidth = 2.5 * dp;
    ctx.moveTo(-half, top);
    ctx.lineTo(-half, top + length);
    ctx.moveTo(half, top);
    ctx.lineTo(half, top + length);
  } else {
    ctx.strokeStyle = TUNER_COLORS.muted;
    ctx.lineWidth = 2 * dp;
    ctx.moveTo(0, top);
    ctx.lineTo(0, top + length);
  }
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, Math.max(0, h), Math.min(r, Math.abs(h) / 2));
}
