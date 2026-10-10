// Sprites de las máquinas, en vista cenital con algo de perspectiva: se ve el techo
// y la cara frontal (luz desde arriba a la izquierda). Las máquinas NO se giran: la
// salida es una rampa aparte ("chute") que sí gira con la dirección.
// Cada máquina tiene 4 fotogramas de animación: <tipo>_0 .. <tipo>_3.

import { C, T, HALF, tex, rivet } from './common.js';

const { INK, SHADOW, METAL, METAL_D, METAL_L, RUST, RUST_L, RUST_D, MINT, MINT_L, MINT_D, LILAC, LILAC_L, LILAC_D, BUTTER, BUTTER_D, TEAL, TEAL_D } = C;

export const ANIMATED = ['extractor', 'prensa', 'ensambladora'];

const groundShadow = (g, cx, cy, rx, ry) => g.ellipse(cx, cy, rx, ry).fill({ color: SHADOW, alpha: 0.25 });

// Bloque con techo y cara frontal
function block(g, x, y, w, h, depth, top, front, r = 4) {
  g.roundRect(x, y + depth, w, h, r).fill(front).stroke({ width: 2.5, color: INK });
  g.roundRect(x, y, w, h, r).fill(top).stroke({ width: 2.5, color: INK });
}

const line = (g, x1, y1, x2, y2, w, color) => g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w, color, cap: 'round' });
const beam = (g, x1, y1, x2, y2, w, color) => { line(g, x1, y1, x2, y2, w + 3, INK); line(g, x1, y1, x2, y2, w, color); };

// ---- Extractor: torre de perforación sobre el montón de chatarra ----
function extractor(g, f) {
  groundShadow(g, HALF, 52, 24, 7);
  // trozos que salen despedidos de la broca
  const bits = [[[-12, 2], [10, -1], [-4, 6]], [[-9, -2], [13, 3], [3, 7]], [[-14, 4], [7, -3], [-1, 8]], [[-10, 0], [12, 5], [5, 6]]][f];
  for (const [dx, dy] of bits) g.poly([HALF + dx - 3, 50 + dy, HALF + dx, 47 + dy, HALF + dx + 3, 50 + dy, HALF + dx, 52 + dy]).fill(0xaaa194).stroke({ width: 1.2, color: INK });
  // patas traseras (más oscuras) y delanteras
  beam(g, 20, 40, 23, 14, 3, RUST_D);
  beam(g, 44, 40, 41, 14, 3, RUST_D);
  // broca: eje y punta con espiral que gira
  g.rect(HALF - 3, 18, 6, 24).fill(METAL).stroke({ width: 2, color: INK });
  g.poly([HALF - 8, 40, HALF + 8, 40, HALF, 53]).fill(METAL_L).stroke({ width: 2, color: INK });
  for (let k = 0; k < 3; k++) {
    const y = 41 + ((k * 4 + f) % 12);
    if (y > 51) continue;
    const half = 8 * (1 - (y - 40) / 13);
    g.moveTo(HALF - half, y).lineTo(HALF + half, y + 2).stroke({ width: 1.6, color: METAL_D });
  }
  beam(g, 12, 50, 21, 14, 4, RUST);
  beam(g, 52, 50, 43, 14, 4, RUST);
  beam(g, 14, 38, 50, 38, 3, RUST); // travesaño
  for (const [x, y] of [[12, 50], [52, 50]]) g.roundRect(x - 4, y - 2, 8, 5, 2).fill(METAL_D).stroke({ width: 2, color: INK }); // pies
  // motor arriba
  block(g, 18, 7, 28, 12, 5, RUST_L, RUST_D, 4);
  rivet(g, 22, 11, 1.6); rivet(g, 42, 11, 1.6);
  g.roundRect(26, 10, 12, 5, 2).fill({ color: INK, alpha: 0.35 });
  // tubo de escape con humo
  g.roundRect(44, 1, 6, 10, 2).fill(METAL_D).stroke({ width: 2, color: INK });
  const puff = [[47, -1, 3], [48, -3, 4], [49, -5, 4.5], [47, 0, 2]][f];
  g.circle(puff[0], puff[1] + 4, puff[2]).fill({ color: 0xffffff, alpha: 0.7 });
}

// ---- Prensa: columnas, travesaño y pistón que baja sobre el yunque ----
function prensa(g, f) {
  groundShadow(g, HALF, 54, 27, 7);
  block(g, 6, 34, 52, 14, 6, METAL, METAL_D, 5);               // yunque
  // lo que hay en el yunque: chatarra o placa recién aplastada
  if (f === 2) g.roundRect(22, 36, 20, 6, 2).fill(0xa9cde6).stroke({ width: 1.5, color: INK });
  else g.poly([22, 41, 27, 35, 36, 36, 41, 41, 33, 44, 25, 44]).fill(0xaaa194).stroke({ width: 1.5, color: INK });
  block(g, 6, 8, 10, 32, 5, MINT, MINT_D, 3);                  // columnas
  block(g, 48, 8, 10, 32, 5, MINT, MINT_D, 3);
  const ramY = [14, 18, 24, 18][f];                             // el pistón baja y sube
  g.rect(HALF - 3, 8, 6, ramY - 6).fill(METAL_L).stroke({ width: 2, color: INK });
  block(g, 18, ramY, 28, 9, 4, BUTTER, BUTTER_D, 3);
  for (let x = 21; x < 44; x += 7) g.poly([x, ramY + 1, x + 3, ramY + 1, x + 1, ramY + 8, x - 2, ramY + 8]).fill(INK);
  block(g, 4, 2, 56, 9, 5, MINT_L, MINT_D, 4);                 // travesaño
  rivet(g, 10, 6, 1.6); rivet(g, 54, 6, 1.6);
  g.roundRect(26, 4, 12, 4, 2).fill(MINT_D);
}

// ---- Ensambladora: banco con dos brazos robóticos montando un engranaje ----
function ensambladora(g, f) {
  groundShadow(g, HALF, 54, 28, 7);
  block(g, 20, 3, 24, 11, 4, 0x4a4f5a, 0x34383f, 3);           // pantalla al fondo
  g.roundRect(23, 5, 18, 7, 2).fill(f % 2 ? TEAL : 0x9ff0ec);
  block(g, 5, 18, 54, 24, 8, LILAC, LILAC_D, 6);               // banco
  g.roundRect(9, 21, 46, 5, 2).fill({ color: LILAC_L, alpha: 0.8 });
  // engranaje en el centro
  const cx = HALF, cy = 31;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + f * 0.2;
    g.circle(cx + Math.cos(a) * 7.5, cy + Math.sin(a) * 7.5, 2.4).fill(BUTTER).stroke({ width: 1.2, color: INK });
  }
  g.circle(cx, cy, 7).fill(BUTTER).stroke({ width: 2, color: INK });
  g.circle(cx, cy, 2.4).fill(INK);
  // brazos: base, codo y pinza; se mueven por fotograma
  const swing = [0, 0.25, 0.45, 0.25][f];
  for (const side of [-1, 1]) {
    const bx = HALF + side * 22, by = 44;
    const a1 = -Math.PI / 2 - side * (0.55 + swing);
    const ex = bx + Math.cos(a1) * 13, ey = by + Math.sin(a1) * 13;
    const tx = cx + side * 9, ty = cy + 4 - swing * 6;
    g.circle(bx, by, 6).fill(METAL_D).stroke({ width: 2, color: INK });
    beam(g, bx, by, ex, ey, 4, METAL);
    beam(g, ex, ey, tx, ty, 3, METAL_L);
    g.circle(ex, ey, 2.6).fill(BUTTER).stroke({ width: 1.4, color: INK });
    line(g, tx, ty, tx - side * 4, ty - 3, 2, INK);
    line(g, tx, ty, tx - side * 4, ty + 3, 2, INK);
  }
}

// Rampa de salida: se dibuja hacia la derecha y el juego la gira
function chute(g) {
  g.roundRect(50, 23, 14, 18, 3).fill(0x5a5046).stroke({ width: 2.5, color: INK });
  g.poly([53, 27, 60, 32, 53, 37]).fill(BUTTER).stroke({ width: 1.2, color: INK });
}

export function makeMachines(renderer, t) {
  const DRAW = { extractor, prensa, ensambladora };
  for (const kind of ANIMATED) {
    for (let f = 0; f < 4; f++) t[`${kind}_${f}`] = tex(renderer, (g) => DRAW[kind](g, f));
    t[kind] = t[`${kind}_0`];
  }
  t.chute = tex(renderer, chute);

  t.teletransportador = tex(renderer, (g) => {
    g.circle(T / 2, T / 2 + 4, 28).fill({ color: SHADOW, alpha: 0.22 });
    g.circle(T / 2, T / 2, 28).fill(METAL).stroke({ width: 3, color: INK });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      rivet(g, T / 2 + Math.cos(a) * 24, T / 2 + Math.sin(a) * 24, 1.8);
    }
    g.circle(T / 2, T / 2, 19).fill(TEAL_D).stroke({ width: 2.5, color: INK });
    g.moveTo(T / 2 + 12, T / 2).arc(T / 2, T / 2, 12, 0, Math.PI * 1.4).stroke({ width: 3, color: TEAL });
    g.moveTo(T / 2 - 6, T / 2).arc(T / 2, T / 2, 6, Math.PI, Math.PI * 2.3).stroke({ width: 3, color: TEAL });
    g.circle(T / 2, T / 2, 3).fill(0xe9fffd);
    g.roundRect(38, 4, 20, 10, 3).fill(0xff8fa0).stroke({ width: 2, color: INK });
    g.rect(42, 8, 12, 2).fill(0xffffff);
  });
}
