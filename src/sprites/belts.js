// Sprites de las cintas: recta, curvas y uniones, en 3 niveles × 4 fotogramas.
// Todo se dibuja con la salida hacia la DERECHA. "L" = entra por el lado de arriba
// (izquierda según avanza la cinta), "R" = entra por abajo (derecha según avanza).

import { C, T, HALF, tex } from './common.js';

export const BELT_SHAPES = ['straight', 'curveL', 'curveR', 'tee', 'mergeL', 'mergeR', 'mergeLR'];

const W = 21;                       // media anchura de la banda
const RAIL = [0, C.METAL, C.BUTTER, C.TEAL];
const RAIL_D = [0, C.METAL_D, C.BUTTER_D, 0x3fa9a6];
const SLAT = 16;                    // separación de los listones (px)

function straight(g, lvl, f) {
  g.rect(0, HALF - W + 3, T, W * 2).fill({ color: C.SHADOW, alpha: 0.18 });
  g.rect(0, HALF - W, T, W * 2).fill(C.BELT);
  const off = (f / 4) * SLAT;
  for (let x = -SLAT; x < T + SLAT; x += SLAT) {
    const cx = x + off;
    g.roundRect(cx, HALF - 15, 7, 30, 3).fill(C.BELT_L);
    g.poly([cx + 9, HALF - 5, cx + 14, HALF, cx + 9, HALF + 5]).fill({ color: RAIL[lvl], alpha: 0.55 });
  }
  for (const y of [HALF - W - 3, HALF + W - 3]) {
    g.rect(0, y, T, 6).fill(RAIL[lvl]);
    g.moveTo(0, y).lineTo(T, y).moveTo(0, y + 6).lineTo(T, y + 6).stroke({ width: 2, color: C.INK });
  }
  for (const x of [8, 40]) { g.circle(x, HALF - W, 1.4).fill(RAIL_D[lvl]); g.circle(x, HALF + W, 1.4).fill(RAIL_D[lvl]); }
}

// Cuarto de círculo alrededor de la esquina (cx, cy), de a0 a a1 (sentido horario)
function arcBand(g, lvl, f, cx, cy, a0, a1) {
  const R = HALF;
  // se pasa un poco de los bordes para que no quede una rendija al empalmar (lo de fuera se recorta)
  const ext = 0.08 * Math.sign(a1 - a0);
  const b0 = a0 - ext, b1 = a1 + ext;
  const ring = (r, width, style) => g.moveTo(cx + r * Math.cos(b0), cy + r * Math.sin(b0)).arc(cx, cy, r, b0, b1, b1 < b0).stroke({ width, ...style });
  ring(R, W * 2, { color: C.BELT });
  // listones radiales que avanzan de a0 hacia a1
  const step = SLAT / R;
  const dir = Math.sign(a1 - a0);
  const phase = (f / 4) * step;
  for (let k = -1; k < 5; k++) {
    const a = a0 + dir * (phase + k * step);
    if ((a - a0) * dir < 0.05 || (a1 - a) * dir < 0.05) continue;
    const c = Math.cos(a), s = Math.sin(a);
    g.moveTo(cx + c * (R - 15), cy + s * (R - 15)).lineTo(cx + c * (R + 15), cy + s * (R + 15)).stroke({ width: 7, color: C.BELT_L, cap: 'round' });
  }
  for (const r of [R - W, R + W]) {
    ring(r, 6, { color: RAIL[lvl] });
    ring(r - 3, 2, { color: C.INK });
    ring(r + 3, 2, { color: C.INK });
  }
}

const curveL = (g, lvl, f) => arcBand(g, lvl, f, T, 0, Math.PI, Math.PI / 2);         // entra por arriba
const curveR = (g, lvl, f) => arcBand(g, lvl, f, T, T, Math.PI, Math.PI * 1.5);       // entra por abajo

// Trozo de cinta que llega por un lado y se une a la recta
function stub(g, lvl, f, top) {
  const y0 = top ? 0 : HALF + W - 3;
  const h = HALF - W + 3;
  g.rect(HALF - W, y0, W * 2, h).fill(C.BELT);
  const off = (f / 4) * SLAT;
  for (let k = -1; k < 2; k++) {
    const y = top ? k * SLAT + off : T - (k * SLAT + off) - 6;
    if (y < y0 - 6 || y > y0 + h) continue;
    g.roundRect(HALF - 15, Math.max(y0, y), 30, 6, 3).fill(C.BELT_L);
  }
  for (const x of [HALF - W - 3, HALF + W - 3]) {
    g.rect(x, y0, 6, h).fill(RAIL[lvl]);
    g.moveTo(x, y0).lineTo(x, y0 + h).moveTo(x + 6, y0).lineTo(x + 6, y0 + h).stroke({ width: 2, color: C.INK });
  }
}

const DRAW = {
  straight,
  curveL,
  curveR,
  tee: (g, l, f) => { curveL(g, l, f); curveR(g, l, f); },
  mergeL: (g, l, f) => { straight(g, l, f); stub(g, l, f, true); },
  mergeR: (g, l, f) => { straight(g, l, f); stub(g, l, f, false); },
  mergeLR: (g, l, f) => { straight(g, l, f); stub(g, l, f, true); stub(g, l, f, false); },
};

export function makeBelts(renderer, t) {
  for (let lvl = 1; lvl <= 3; lvl++) {
    for (const shape of BELT_SHAPES) {
      for (let f = 0; f < 4; f++) {
        t[`belt${lvl}_${shape}_${f}`] = tex(renderer, (g) => DRAW[shape](g, lvl, f));
      }
    }
    for (let f = 0; f < 4; f++) t[`belt${lvl}_${f}`] = t[`belt${lvl}_straight_${f}`];
  }
  for (let f = 0; f < 4; f++) t['belt' + f] = t[`belt1_${f}`]; // nombres antiguos

  t.divisor = tex(renderer, (g) => {
    g.roundRect(6, 10, 52, 52, 16).fill({ color: C.SHADOW, alpha: 0.22 });
    g.roundRect(6, 6, 52, 52, 16).fill(C.BELT).stroke({ width: 3, color: C.INK });
    g.circle(HALF, HALF, 15).fill(C.BUTTER).stroke({ width: 2.5, color: C.INK });
    g.poly([HALF + 10, HALF - 6, T - 9, HALF, HALF + 10, HALF + 6]).fill(C.BUTTER).stroke({ width: 2, color: C.INK });
    g.poly([HALF - 6, HALF - 10, HALF, 9, HALF + 6, HALF - 10]).fill(C.BUTTER).stroke({ width: 2, color: C.INK });
    g.poly([HALF - 6, HALF + 10, HALF, T - 9, HALF + 6, HALF + 10]).fill(C.BUTTER).stroke({ width: 2, color: C.INK });
    g.circle(HALF, HALF, 5).fill(C.INK);
  });
}
