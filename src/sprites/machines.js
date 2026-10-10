// Sprites de las máquinas. Vista cenital con perspectiva (techo + cara frontal, luz
// desde arriba a la izquierda) y más altas que la casilla: textura de 64 × TALL, con
// la casilla en la parte de abajo (centro de la casilla en y = TOP + 32).
// Las máquinas NO se giran; la salida es una rampa aparte ("chute") que sí gira.
// Cada una tiene 4 fotogramas: <tipo>_0 .. <tipo>_3.

import { placeArt } from './art.js';
import { C, T, TALL, TOP, tex, grad, vgrad, hgrad, cyl, rgrad, rivet, line, block, hazard, rustStain } from './common.js';

const { INK, SHADOW } = C;

export const UPRIGHT = ['extractor', 'prensa', 'ensambladora', 'teletransportador'];
export const HAS_CHUTE = ['extractor', 'prensa', 'ensambladora'];

const Y = (y) => TOP + y; // coordenada dentro de la casilla → coordenada en la textura

// Viga con contorno (patas, brazos)
function beam(g, x1, y1, x2, y2, w, color, light) {
  line(g, x1, y1, x2, y2, w + 3, INK);
  line(g, x1, y1, x2, y2, w, color);
  if (light) line(g, x1 - w * 0.2, y1, x2 - w * 0.2, y2, Math.max(1, w * 0.3), light, 0.8);
}

// Cilindro vertical (columna, eje) con brillo
function column(g, x, y, w, h, dark, mid, light) {
  g.roundRect(x, y, w, h, w * 0.3).fill(cyl(dark, mid, light, false)).stroke({ width: 2, color: INK });
}

// ---------------------------------------------------------------------------
// EXTRACTOR: torre de perforación sobre el vertedero
// ---------------------------------------------------------------------------
function extractor(g, s, f) {
  s.ellipse(34, Y(46), 28, 12).fill({ color: SHADOW, alpha: 0.45 });
  // plataforma circular con borde de aviso
  g.ellipse(32, Y(46), 27, 14).fill(C.STEEL_D).stroke({ width: 2.2, color: INK });
  g.ellipse(32, Y(41), 27, 14).fill(grad([[0, C.STEEL_L], [0.5, C.STEEL], [1, C.STEEL_D]], 0, 0, 0.4, 1)).stroke({ width: 2.2, color: INK });
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16;
    g.moveTo(32 + Math.cos(a0) * 23, Y(41) + Math.sin(a0) * 11).lineTo(32 + Math.cos(a1) * 23, Y(41) + Math.sin(a1) * 11)
      .stroke({ width: 3, color: i % 2 ? INK : C.BUTTER });
  }
  // agujero con chatarra removida
  g.ellipse(32, Y(42), 12, 6).fill(rgrad(0x2a221a, 0x5a4a38, 0.5, 0.4)).stroke({ width: 1.8, color: INK });
  // patas traseras
  beam(g, 18, Y(34), 26, 8, 3, C.RUST_D);
  beam(g, 46, Y(34), 38, 8, 3, C.RUST_D);
  // eje y broca (las estrías avanzan con el fotograma)
  column(g, 29, 14, 6, Y(30) - 14, C.STEEL_D, C.STEEL, C.STEEL_L);
  g.poly([24, Y(30), 40, Y(30), 32, Y(45)]).fill(hgrad(C.METAL_D, C.METAL_L)).stroke({ width: 2, color: INK });
  for (let k = 0; k < 3; k++) {
    const yy = Y(31) + ((k * 5 + f * 1.6) % 14);
    const half = 8 * (1 - (yy - Y(30)) / 15);
    if (half > 1) line(g, 32 - half, yy + 1.5, 32 + half, yy - 1.5, 1.5, C.METAL_DD);
  }
  // trozos que saltan
  const bits = [[[-14, -4], [12, -7], [-6, -11]], [[-11, -8], [15, -3], [4, -13]], [[-16, -2], [9, -10], [-2, -15]], [[-12, -6], [13, -5], [6, -10]]][f];
  for (const [dx, dy] of bits) g.poly([32 + dx - 2.5, Y(40) + dy, 32 + dx, Y(37) + dy, 32 + dx + 3, Y(40) + dy, 32 + dx, Y(42) + dy]).fill(0xb3aa9c).stroke({ width: 1, color: INK });
  // patas delanteras con riostras en X
  beam(g, 10, Y(44), 22, 10, 4.5, C.RUST, C.RUST_L);
  beam(g, 54, Y(44), 42, 10, 4.5, C.RUST, C.RUST_L);
  beam(g, 13, Y(32), 50, Y(12), 2, C.RUST_D);
  beam(g, 51, Y(32), 14, Y(12), 2, C.RUST_D);
  for (const x of [10, 54]) g.roundRect(x - 5, Y(42), 10, 6, 2).fill(C.METAL_D).stroke({ width: 1.8, color: INK });
  // manguera del motor a la plataforma
  g.moveTo(48, 20).bezierCurveTo(60, 30, 60, Y(20), 52, Y(36)).stroke({ width: 4, color: INK });
  g.moveTo(48, 20).bezierCurveTo(60, 30, 60, Y(20), 52, Y(36)).stroke({ width: 2, color: 0x3a3a38 });
  // motor arriba
  block(g, 14, 6, 36, 13, 6, grad([[0, C.RUST_L], [1, C.RUST]]), C.RUST_D, 4);
  for (let x = 20; x < 38; x += 4) line(g, x, 10, x, 16, 1.4, C.RUST_D);
  rivet(g, 17, 9, 1.4); rivet(g, 47, 9, 1.4);
  rustStain(g, 42, 15, 2.5, 0.5);
  // chimenea y humo
  g.roundRect(39, 0, 6, 9, 2).fill(cyl(C.METAL_DD, C.METAL_D, C.METAL, false)).stroke({ width: 1.6, color: INK });
  const puff = [[42, -2, 3], [43, -4, 4], [44, -6, 5], [42, -1, 2]][f];
  if (puff[1] + 2 > 0) g.circle(puff[0], puff[1] + 4, puff[2]).fill({ color: 0xffffff, alpha: 0.6 });
  // luz de aviso que parpadea
  g.circle(19, 6, 3.2).fill(f < 2 ? rgrad(0xfff3c4, 0xff9a3c) : rgrad(0xc98a55, 0x7a4a22)).stroke({ width: 1.4, color: INK });
  if (f < 2) g.circle(19, 6, 6).fill({ color: 0xffc061, alpha: 0.25 });
}

// ---------------------------------------------------------------------------
// PRENSA: prensa hidráulica de dos columnas
// ---------------------------------------------------------------------------
function prensa(g, s, f) {
  s.roundRect(6, Y(32), 56, 18, 8).fill({ color: SHADOW, alpha: 0.45 });
  // bancada
  block(g, 5, Y(22), 54, 20, 8, grad([[0, C.STEEL_L], [1, C.STEEL]]), C.STEEL_D, 5);
  hazard(g, 8, Y(43), 48, 5);
  // lo que hay en la bancada
  const ramY = [22, 30, 40, 30][f]; // posición del pistón (en textura)
  if (f === 2) {
    g.roundRect(20, Y(24), 24, 6, 2).fill(vgrad(0xcfe6f5, 0x7fa9c6)).stroke({ width: 1.5, color: INK });
    for (const dx of [-16, 16]) g.circle(32 + dx, Y(25), 3).fill({ color: 0xffffff, alpha: 0.7 }); // vapor
  } else {
    g.poly([21, Y(31), 26, Y(24), 36, Y(23), 43, Y(29), 37, Y(33), 25, Y(33)]).fill(grad([[0, 0xd2cabc], [1, 0x8d8579]], 0, 0, 0.6, 1)).stroke({ width: 1.5, color: INK });
    rustStain(g, 34, Y(29), 2.2);
  }
  // columnas cromadas
  column(g, 8, 12, 11, Y(26) - 12, C.STEEL_D, C.STEEL, C.STEEL_L);
  column(g, 45, 12, 11, Y(26) - 12, C.STEEL_D, C.STEEL, C.STEEL_L);
  // manómetro en la columna izquierda
  g.circle(13.5, Y(4), 5).fill(0xf6f2e8).stroke({ width: 1.6, color: INK });
  const needle = [-2.2, -1.2, 0.2, -1.2][f];
  line(g, 13.5, Y(4), 13.5 + Math.cos(needle) * 3.8, Y(4) + Math.sin(needle) * 3.8, 1.2, 0xc94a4a);
  // vástago y cabezal del pistón
  column(g, 28, 14, 8, ramY - 12, C.METAL_D, C.METAL, 0xffffff);
  block(g, 17, ramY, 30, 9, 5, grad([[0, C.BUTTER_L], [1, C.BUTTER]]), C.BUTTER_D, 3);
  hazard(g, 19, ramY + 9.5, 26, 3.5, 3.5);
  // travesaño con placa
  block(g, 3, 4, 58, 13, 6, grad([[0, C.MINT_L], [1, C.MINT]]), C.MINT_D, 5);
  g.roundRect(23, 7, 18, 7, 2).fill(0xf6f2e8).stroke({ width: 1.2, color: INK });
  line(g, 26, 10.5, 38, 10.5, 1.4, C.MINT_D);
  for (const x of [8, 56]) rivet(g, x, 9, 1.6);
  // mangueras hidráulicas
  g.moveTo(6, 16).bezierCurveTo(1, 26, 2, 34, 8, 40).stroke({ width: 3, color: INK });
  g.moveTo(58, 16).bezierCurveTo(63, 26, 62, 34, 56, 40).stroke({ width: 3, color: INK });
}

// ---------------------------------------------------------------------------
// ENSAMBLADORA: célula con dos brazos robóticos y pantalla
// ---------------------------------------------------------------------------
function ensambladora(g, s, f) {
  s.roundRect(4, Y(28), 60, 24, 10).fill({ color: SHADOW, alpha: 0.45 });
  // panel trasero con pantalla
  block(g, 13, 4, 38, 30, 6, grad([[0, 0x5a6070], [1, 0x41454f]]), 0x2d3038, 5);
  g.roundRect(17, 8, 30, 18, 3).fill(rgrad(0x2f8f8b, 0x10302f)).stroke({ width: 1.5, color: INK });
  // esquema de engranaje en pantalla
  g.circle(32, 17, 5).stroke({ width: 1.4, color: C.TEAL });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + f * 0.3;
    line(g, 32 + Math.cos(a) * 5, 17 + Math.sin(a) * 5, 32 + Math.cos(a) * 7, 17 + Math.sin(a) * 7, 1.4, C.TEAL);
  }
  line(g, 19, 23, 19 + 6 + f * 5, 23, 1.6, 0x9ff0ec);
  g.circle(46, 30, 2).fill(f % 2 ? 0x7dff9a : 0x2e6b3b);
  // plataforma
  block(g, 3, Y(12), 58, 30, 8, grad([[0, C.LILAC_L], [1, C.LILAC]]), C.LILAC_D, 7);
  hazard(g, 6, Y(43), 52, 5);
  for (const [x, y] of [[7, Y(15)], [57, Y(15)], [7, Y(38)], [57, Y(38)]]) rivet(g, x, y, 1.5);
  // plato giratorio con el engranaje
  g.ellipse(32, Y(30), 11, 6).fill(C.METAL_D).stroke({ width: 1.6, color: INK });
  g.ellipse(32, Y(28), 11, 6).fill(grad([[0, C.METAL_L], [1, C.METAL]])).stroke({ width: 1.6, color: INK });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + f * 0.25;
    g.circle(32 + Math.cos(a) * 6.5, Y(25) + Math.sin(a) * 3.6, 1.9).fill(C.BUTTER).stroke({ width: 1, color: INK });
  }
  g.ellipse(32, Y(25), 6, 3.4).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.4, 0.35)).stroke({ width: 1.4, color: INK });
  // brazos robóticos (amarillo industrial)
  const swing = [0, 0.18, 0.32, 0.18][f];
  for (const side of [-1, 1]) {
    const bx = 32 + side * 21, by = Y(32);
    g.ellipse(bx, by + 2, 6, 3.5).fill(C.METAL_DD).stroke({ width: 1.4, color: INK });
    g.roundRect(bx - 4.5, by - 7, 9, 9, 3).fill(cyl(C.BUTTER_D, C.BUTTER, C.BUTTER_L, false)).stroke({ width: 1.6, color: INK });
    const ex = bx + side * 2, ey = by - 22 + swing * 8;          // codo
    const tx = 32 + side * (7 - swing * 4), ty = Y(22) + swing * 6; // herramienta
    beam(g, bx, by - 5, ex, ey, 5, C.BUTTER, C.BUTTER_L);
    beam(g, ex, ey, tx, ty, 4, C.BUTTER, C.BUTTER_L);
    g.circle(ex, ey, 3.2).fill(C.METAL_DD).stroke({ width: 1.4, color: INK });
    g.circle(tx, ty, 2.4).fill(C.METAL_L).stroke({ width: 1.2, color: INK });
    // chispas de soldadura
    if ((f + (side > 0 ? 1 : 0)) % 2) {
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * 0.55 + side * 0.3;
        line(g, tx, ty, tx + Math.cos(a) * 6, ty + Math.sin(a) * 6, 1.2, k % 2 ? 0xfff6c0 : 0xffb03a);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TELETRANSPORTADOR: plataforma con haz de energía
// ---------------------------------------------------------------------------
function teletransportador(g, s, f) {
  s.ellipse(33, Y(42), 30, 12).fill({ color: SHADOW, alpha: 0.4 });
  g.ellipse(32, Y(42), 29, 14).fill(C.METAL_D).stroke({ width: 2.2, color: INK });
  g.ellipse(32, Y(36), 29, 14).fill(grad([[0, C.METAL_L], [1, C.METAL]], 0, 0, 0.3, 1)).stroke({ width: 2.2, color: INK });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rivet(g, 32 + Math.cos(a) * 25, Y(36) + Math.sin(a) * 11.5, 1.3);
  }
  // anillo de energía
  g.ellipse(32, Y(36), 19, 9).fill(rgrad(0xe9fffd, C.TEAL_D)).stroke({ width: 2, color: INK });
  for (let k = 0; k < 3; k++) {
    const a0 = f * 0.5 + k * 2.1;
    g.moveTo(32 + Math.cos(a0) * 14, Y(36) + Math.sin(a0) * 6.5).arc(32, Y(36), 14, a0, a0 + 1.2).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
  }
  // haz vertical
  const alpha = [0.35, 0.5, 0.4, 0.55][f];
  g.poly([20, Y(36), 44, Y(36), 40, 0, 24, 0]).fill(grad([[0, 'rgba(127,227,224,0.55)'], [1, 'rgba(255,255,255,0)']], 0, 1, 0, 0));
  g.poly([26, Y(36), 38, Y(36), 35, 4, 29, 4]).fill({ color: 0xffffff, alpha });
  // chispas que suben
  for (const [x, y] of [[26, 40 - f * 8], [37, 30 - f * 6], [31, 50 - f * 9]]) if (y > 2) g.circle(x, y, 1.4).fill(0xffffff);
  // pegatina de la empresa
  g.roundRect(42, Y(44), 18, 8, 2).fill(C.ROSE).stroke({ width: 1.4, color: INK });
  line(g, 45, Y(48), 57, Y(48), 1.6, 0xffffff);
}

// Rampa de salida: se dibuja hacia la derecha en una casilla de 64 y el juego la gira
function chute(g, s) {
  s.roundRect(50, 26, 14, 16, 3).fill({ color: SHADOW, alpha: 0.35 });
  g.roundRect(49, 22, 15, 20, 3).fill(vgrad(0x6d6458, 0x463e35)).stroke({ width: 2, color: INK });
  g.poly([52, 26, 60, 32, 52, 38]).fill(C.BUTTER).stroke({ width: 1.2, color: INK });
}

// ---------------------------------------------------------------------------
// Versión con arte en PNG: la imagen + efectos animados dibujados por código
// ---------------------------------------------------------------------------
const BOTTOM = TALL - 3;
const ART = {
  extractor(g, s, mid, f, tex) {
    s.ellipse(32, BOTTOM - 4, 30, 9).fill({ color: SHADOW, alpha: 0.4 });
    placeArt(mid, tex, { cx: 32, bottom: BOTTOM, w: 62, h: 84, dx: [0, 0.7, 0, -0.7][f], dy: [0, -0.6, 0, -0.3][f] });
    // trozos que salta la broca
    const bits = [[[-9, -6], [7, -10], [-3, -14]], [[-6, -11], [10, -6], [2, -16]], [[-11, -4], [5, -13], [-1, -19]], [[-7, -9], [9, -8], [3, -12]]][f];
    for (const [dx, dy] of bits) g.poly([28 + dx - 2, BOTTOM - 8 + dy, 28 + dx, BOTTOM - 10 + dy, 28 + dx + 2.5, BOTTOM - 8 + dy, 28 + dx, BOTTOM - 6.5 + dy]).fill(0xb3aa9c).stroke({ width: 0.8, color: INK });
    g.circle(28, BOTTOM - 6, 4 + f).fill({ color: 0xc9b89a, alpha: 0.35 - f * 0.06 });
  },
  prensa(g, s, mid, f, tex) {
    s.roundRect(6, BOTTOM - 12, 54, 14, 6).fill({ color: SHADOW, alpha: 0.4 });
    placeArt(mid, tex, { cx: 32, bottom: BOTTOM, w: 62, h: 84, sy: [1, 0.985, 0.965, 0.985][f] });
    if (f === 2) for (const dx of [-17, 17]) { g.circle(32 + dx, BOTTOM - 26, 4).fill({ color: 0xffffff, alpha: 0.65 }); g.circle(32 + dx * 1.2, BOTTOM - 31, 3).fill({ color: 0xffffff, alpha: 0.4 }); }
  },
  ensambladora(g, s, mid, f, tex) {
    s.roundRect(2, BOTTOM - 14, 60, 16, 7).fill({ color: SHADOW, alpha: 0.4 });
    placeArt(mid, tex, { cx: 32, bottom: BOTTOM, w: 63, h: 80 });
    // chispas de soldadura alrededor del engranaje
    if (f % 2) {
      const cx = 31, cy = BOTTOM - 20;
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.5 + f * 0.2;
        line(g, cx, cy, cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 1.1, k % 2 ? 0xfff6c0 : 0xffb03a);
      }
      g.circle(cx, cy, 3).fill({ color: 0xfff6c0, alpha: 0.8 });
    }
  },
  teletransportador(g, s, mid, f, tex) {
    s.ellipse(33, BOTTOM - 8, 31, 10).fill({ color: SHADOW, alpha: 0.4 });
    placeArt(mid, tex, { cx: 32, bottom: BOTTOM, w: 64, h: 60 });
    const ringY = BOTTOM - 22;
    const alpha = [0.35, 0.5, 0.42, 0.55][f];
    g.poly([18, ringY, 46, ringY, 41, 0, 23, 0]).fill(grad([[0, 'rgba(127,227,224,0.6)'], [1, 'rgba(255,255,255,0)']], 0, 1, 0, 0));
    g.poly([26, ringY, 38, ringY, 35, 6, 29, 6]).fill({ color: 0xffffff, alpha });
    for (const [x, y] of [[25, 50 - f * 9], [38, 40 - f * 7], [31, 60 - f * 10]]) if (y > 2) g.circle(x, y, 1.4).fill(0xffffff);
  },
};

export function makeMachines(renderer, t, art = {}) {
  const DRAW = { extractor, prensa, ensambladora, teletransportador };
  for (const kind of UPRIGHT) {
    for (let f = 0; f < 4; f++) {
      t[`${kind}_${f}`] = art[kind]
        ? tex(renderer, (g, s, mid) => ART[kind](g, s, mid, f, art[kind]), T, TALL)
        : tex(renderer, (g, s) => DRAW[kind](g, s, f), T, TALL);
    }
    t[kind] = t[`${kind}_0`];
  }
  t.chute = tex(renderer, chute);
}
