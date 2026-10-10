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
// Vista en PLANTA (desde arriba del todo), igual que las cintas: cada máquina
// ocupa su casilla de borde a borde para que las cintas lleguen hasta ella.
// La altura se insinúa solo con sombras y brillos.
// ---------------------------------------------------------------------------

// Sombra de algo que está levantado del suelo
const lift = (s, x, y, w, h, r, d = 4) => s.roundRect(x + d * 0.6, y + d, w, h, r).fill({ color: SHADOW, alpha: 0.45 });

// Tornillo hexagonal visto desde arriba
function bolt(g, x, y, r = 2.6) {
  const pts = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.poly(pts).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1, color: INK });
}

// ---------------------------------------------------------------------------
// EXTRACTOR: armazón de vigas sobre el montón, con la broca girando en el centro
// ---------------------------------------------------------------------------
function extractor(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 10, 5);
  // armazón abierto: se ve la chatarra de debajo entre las vigas
  for (const [x1, y1, x2, y2] of [[8, 8, 56, 56], [56, 8, 8, 56]]) beam(g, x1, Y(y1), x2, Y(y2), 4, C.RUST_D);
  g.roundRect(6, Y(6), 52, 52, 9).stroke({ width: 10, color: INK });
  g.roundRect(6, Y(6), 52, 52, 9).stroke({ width: 7, color: C.RUST });
  g.roundRect(6, Y(6), 52, 52, 9).stroke({ width: 2, color: C.RUST_L, alpha: 0.7 });
  for (let i = 0; i < 4; i++) bolt(g, [9, 32, 55, 32][i], Y([32, 9, 32, 55][i]), 2);
  // patas en las esquinas
  for (const [x, y] of [[2, 2], [50, 2], [2, 50], [50, 50]]) {
    g.roundRect(x, Y(y), 12, 12, 3).fill(grad([[0, C.METAL_L], [1, C.METAL_D]], 0, 0, 1, 1)).stroke({ width: 2, color: INK });
    bolt(g, x + 6, Y(y + 6), 2.4);
  }
  // broca vista desde arriba: corona dentada con cuchillas en espiral que giran
  const cx = 32, cy = Y(33), rot = f * (Math.PI / 8);
  s.circle(cx + 3, cy + 4, 15).fill({ color: SHADOW, alpha: 0.45 });
  for (let i = 0; i < 12; i++) {
    const a = rot + (i / 12) * Math.PI * 2;
    g.circle(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 2.6).fill(C.METAL_D).stroke({ width: 1, color: INK });
  }
  g.circle(cx, cy, 14).fill(rgrad(C.STEEL_L, C.STEEL_D, 0.38, 0.32)).stroke({ width: 2, color: INK });
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * Math.PI * 2;
    const pts = [];
    for (let t = 0; t <= 6; t++) { const r = 3 + t * 1.7, b = a + t * 0.28; pts.push(cx + Math.cos(b) * r, cy + Math.sin(b) * r); }
    for (let t = 6; t >= 0; t--) { const r = 3 + t * 1.7, b = a + t * 0.28 + 0.5; pts.push(cx + Math.cos(b) * r, cy + Math.sin(b) * r); }
    g.poly(pts).fill(C.METAL_L).stroke({ width: 1, color: INK });
  }
  g.circle(cx, cy, 3.5).fill(C.METAL_DD).stroke({ width: 1.2, color: INK });
  // trozos que salen despedidos
  const bits = [[[-20, -6], [18, 9], [-6, 20]], [[-17, 12], [20, -4], [9, -19]], [[-21, 2], [14, 15], [-12, -17]], [[-15, -14], [19, 6], [4, 21]]][f];
  for (const [dx, dy] of bits) g.poly([cx + dx - 2.5, cy + dy, cx + dx, cy + dy - 2.5, cx + dx + 2.5, cy + dy, cx + dx, cy + dy + 2]).fill(0xb3aa9c).stroke({ width: 0.8, color: INK });
  // motor en un lado, con rejilla y tubo de escape
  lift(s, 34, Y(2), 22, 13, 4, 3);
  g.roundRect(34, Y(2), 22, 13, 4).fill(grad([[0, C.RUST_L], [1, C.RUST]], 0, 0, 1, 1)).stroke({ width: 2, color: INK });
  for (let x = 38; x < 50; x += 3) line(g, x, Y(5), x, Y(12), 1.3, C.RUST_D);
  g.circle(52, Y(8), 3.4).fill(C.METAL_DD).stroke({ width: 1.4, color: INK });
  g.circle(52 + f * 0.6, Y(8) - f * 0.4, 2 + f * 1.2).fill({ color: 0xffffff, alpha: 0.55 - f * 0.1 });
  // luz de aviso
  g.circle(13, Y(13), 3).fill(f < 2 ? rgrad(0xfff3c4, 0xff9a3c) : rgrad(0xc98a55, 0x7a4a22)).stroke({ width: 1.2, color: INK });
  if (f < 2) g.circle(13, Y(13), 6).fill({ color: 0xffc061, alpha: 0.25 });
}

// ---------------------------------------------------------------------------
// PRENSA: bancada con dos columnas y travesaño que baja sobre la chatarra
// ---------------------------------------------------------------------------
function prensa(g, s, f) {
  lift(s, 3, Y(4), 58, 56, 7, 4);
  // bancada
  g.roundRect(3, Y(4), 58, 56, 7).fill(grad([[0, C.STEEL_L], [1, C.STEEL_D]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  hazard(g, 6, Y(7), 52, 5);
  hazard(g, 6, Y(52), 52, 5);
  for (const [x, y] of [[8, 17], [56, 17], [8, 47], [56, 47]]) bolt(g, x, Y(y), 2);
  // lo que hay sobre la bancada: chatarra, o una placa recién aplastada
  if (f === 2) {
    g.roundRect(17, Y(18), 30, 28, 3).fill(grad([[0, 0xe3f2fb], [1, 0x7fa9c6]], 0, 0, 1, 1)).stroke({ width: 1.6, color: INK });
  } else {
    g.poly([20, Y(22), 28, Y(16), 40, Y(18), 45, Y(28), 41, Y(44), 27, Y(46), 19, Y(36)]).fill(grad([[0, 0xd8d0c2], [1, 0x8d8579]], 0, 0, 1, 1)).stroke({ width: 1.6, color: INK });
    rustStain(g, 35, Y(38), 3);
  }
  // travesaño con el pistón: su sombra se acerca cuando baja (efecto de altura)
  const d = [8, 5, 1.5, 5][f];
  s.roundRect(6 + d * 0.6, Y(25) + d, 52, 14, 5).fill({ color: SHADOW, alpha: 0.5 });
  const k = [1, 0.97, 0.94, 0.97][f];
  const bw = 52 * k, bx = 32 - bw / 2;
  g.roundRect(bx, Y(25), bw, 14, 5).fill(grad([[0, C.MINT_L], [1, C.MINT_D]], 0, 0, 0, 1)).stroke({ width: 2.2, color: INK });
  g.circle(32, Y(32), 7 * k).fill(rgrad(0xffffff, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  // cabezas de las columnas
  for (const x of [11, 53]) {
    g.circle(x, Y(32), 7.5).fill(rgrad(C.METAL_L, C.STEEL_D, 0.35, 0.3)).stroke({ width: 2, color: INK });
    bolt(g, x, Y(32), 2.2);
  }
  // vapor al golpear
  if (f === 2) for (const [x, y] of [[20, 16], [45, 48], [14, 46]]) g.circle(x, Y(y), 4).fill({ color: 0xffffff, alpha: 0.6 });
  // manómetro
  g.circle(54, Y(12), 4).fill(0xf6f2e8).stroke({ width: 1.4, color: INK });
  const needle = [-2.2, -1.2, 0.2, -1.2][f];
  line(g, 54, Y(12), 54 + Math.cos(needle) * 3, Y(12) + Math.sin(needle) * 3, 1.1, 0xc94a4a);
}

// ---------------------------------------------------------------------------
// ENSAMBLADORA: plataforma con plato giratorio y dos brazos robóticos
// ---------------------------------------------------------------------------
function ensambladora(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 9, 4);
  g.roundRect(3, Y(3), 58, 58, 9).fill(grad([[0, C.LILAC_L], [1, C.LILAC]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  for (let x = 13; x < 56; x += 10) line(g, x, Y(17), x, Y(56), 1, C.LILAC_D, 0.35);
  hazard(g, 6, Y(55), 52, 4);
  // pantalla al fondo
  lift(s, 16, Y(4), 32, 11, 3, 2);
  g.roundRect(16, Y(4), 32, 11, 3).fill(0x41454f).stroke({ width: 1.8, color: INK });
  g.roundRect(19, Y(6), 26, 7, 2).fill(rgrad(0x7fe3e0, 0x1f5a58));
  line(g, 21, Y(9.5), 22 + f * 5, Y(9.5), 1.4, 0xe9fffd);
  // plato giratorio con el engranaje
  const cx = 32, cy = Y(34);
  s.circle(cx + 2, cy + 3, 13).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(cx, cy, 13).fill(rgrad(C.METAL_L, C.METAL_D, 0.4, 0.35)).stroke({ width: 2, color: INK });
  for (let i = 0; i < 8; i++) {
    const a = f * 0.2 + (i / 8) * Math.PI * 2;
    g.roundRect(cx + Math.cos(a) * 8.5 - 2.2, cy + Math.sin(a) * 8.5 - 2.2, 4.4, 4.4, 1).fill(C.BUTTER_D).stroke({ width: 1, color: INK });
  }
  g.circle(cx, cy, 7.5).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.6, color: INK });
  g.circle(cx, cy, 2.4).fill(INK);
  // brazos vistos desde arriba
  const swing = [0, 0.22, 0.4, 0.22][f];
  for (const side of [-1, 1]) {
    const bx = cx + side * 22, by = Y(50);
    const ex = bx + side * 4, ey = by - 18 + swing * 6;
    const tx = cx + side * (9 - swing * 3), ty = cy + 2 - swing * 4;
    s.circle(bx + 2, by + 3, 7).fill({ color: SHADOW, alpha: 0.4 });
    beam(g, bx, by, ex, ey, 6, C.BUTTER, C.BUTTER_L);
    beam(g, ex, ey, tx, ty, 4.5, C.BUTTER, C.BUTTER_L);
    g.circle(bx, by, 6.5).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
    g.circle(ex, ey, 3.4).fill(C.METAL_DD).stroke({ width: 1.2, color: INK });
    g.circle(tx, ty, 2.2).fill(C.METAL_L).stroke({ width: 1, color: INK });
    if ((f + (side > 0 ? 1 : 0)) % 2) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + f;
        line(g, tx, ty, tx + Math.cos(a) * 5, ty + Math.sin(a) * 5, 1.1, k % 2 ? 0xfff6c0 : 0xffb03a);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TELETRANSPORTADOR: plataforma redonda con bocas en los cuatro lados y un
// remolino de energía en el centro, todo visto desde arriba
// ---------------------------------------------------------------------------
function teletransportador(g, s, f) {
  // base cuadrada con las cuatro bocas de entrada (llegan hasta el borde)
  lift(s, 2, Y(2), 60, 60, 12, 4);
  g.roundRect(2, Y(2), 60, 60, 12).fill(grad([[0, C.METAL_L], [1, C.METAL_D]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  for (let d = 0; d < 4; d++) {
    const a = (d * Math.PI) / 2;
    const ox = 32 + Math.cos(a) * 25, oy = Y(32) + Math.sin(a) * 25;
    const horiz = d % 2 === 0;
    g.roundRect(ox - (horiz ? 7 : 11), oy - (horiz ? 11 : 7), horiz ? 14 : 22, horiz ? 22 : 14, 3).fill(0x3a3631).stroke({ width: 1.6, color: INK });
    // flechita hacia dentro
    const ix = -Math.cos(a), iy = -Math.sin(a);
    const px = -iy, py = ix;
    g.poly([ox + ix * 4, oy + iy * 4, ox - ix * 2 + px * 4, oy - iy * 2 + py * 4, ox - ix * 2 - px * 4, oy - iy * 2 - py * 4]).fill(C.BUTTER);
  }
  // anillo de remaches
  g.circle(32, Y(32), 21).fill(rgrad(C.METAL_L, C.METAL, 0.35, 0.3)).stroke({ width: 2, color: INK });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    bolt(g, 32 + Math.cos(a) * 18, Y(32) + Math.sin(a) * 18, 1.4);
  }
  // pozo de energía con remolino que gira
  g.circle(32, Y(32), 14).fill(rgrad(0xe9fffd, C.TEAL_D, 0.5, 0.5)).stroke({ width: 2, color: INK });
  for (let k = 0; k < 3; k++) {
    const a0 = f * 0.55 + (k / 3) * Math.PI * 2;
    const pts = [];
    for (let t = 0; t <= 8; t++) { const r = 2 + t * 1.4, b = a0 + t * 0.35; pts.push(32 + Math.cos(b) * r, Y(32) + Math.sin(b) * r); }
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke({ width: 2, color: 0xffffff, alpha: 0.85, cap: 'round' });
  }
  g.circle(32, Y(32), 4).fill({ color: 0xffffff, alpha: 0.9 });
  g.circle(32, Y(32), 9 + f).fill({ color: C.TEAL, alpha: 0.12 });
  // pegatina de la empresa
  g.roundRect(42, Y(4), 16, 7, 2).fill(C.ROSE).stroke({ width: 1.2, color: INK });
  line(g, 45, Y(7.5), 55, Y(7.5), 1.4, 0xffffff);
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
