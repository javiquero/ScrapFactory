// Sprites de las máquinas. Vista cenital con perspectiva (techo + cara frontal, luz
// desde arriba a la izquierda) y más altas que la casilla: textura de 64 × TALL, con
// la casilla en la parte de abajo (centro de la casilla en y = TOP + 32).
// Las máquinas NO se giran; la salida es una rampa aparte ("chute") que sí gira.
// Cada una tiene 4 fotogramas: <tipo>_0 .. <tipo>_3.

import { placeArt } from './art.js';
import { C, T, TALL, TOP, tex, grad, vgrad, hgrad, cyl, rgrad, rivet, line, block, hazard, rustStain } from './common.js';

const { INK, SHADOW } = C;

export const UPRIGHT = [
  'extractor', 'prensa', 'trefiladora', 'ensambladora', 'cortadora', 'bobinadora', 'montadora',
  'soldadora', 'motorera', 'robotica', 'horno', 'cristaleria', 'montasolar',
];
export const HAS_CHUTE = UPRIGHT;

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
// HORNO: horno de ladrillo con crisol al rojo y chimenea
// ---------------------------------------------------------------------------
function horno(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 8, 4);
  g.roundRect(3, Y(3), 58, 58, 8).fill(grad([[0, 0xd98a6a], [1, 0xa45a40]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  // ladrillos
  for (let row = 0; row < 7; row++) {
    const y = Y(6 + row * 8);
    line(g, 5, y, 59, y, 1, 0x7a3f2a, 0.55);
    for (let x = 6 + (row % 2) * 6; x < 58; x += 12) line(g, x, y, x, y + 8, 1, 0x7a3f2a, 0.55);
  }
  // boca del crisol: brillo que tiembla
  const glow = [1, 0.9, 1.05, 0.95][f];
  s.circle(34, Y(36), 17).fill({ color: SHADOW, alpha: 0.35 });
  g.circle(32, Y(33), 17).fill(rgrad(0x5a4a40, 0x2e2822, 0.5, 0.5)).stroke({ width: 2.2, color: INK });
  g.circle(32, Y(33), 13 * glow).fill(rgrad(0xfff6c0, 0xff7a2a, 0.5, 0.5));
  g.circle(32, Y(33), 6).fill({ color: 0xffffff, alpha: 0.7 });
  for (let k = 0; k < 4; k++) {
    const a = f * 0.8 + k * 1.6;
    g.circle(32 + Math.cos(a) * 8, Y(33) + Math.sin(a) * 8, 1.8).fill({ color: 0xfff6c0, alpha: 0.9 });
  }
  // chimenea y humo
  g.circle(51, Y(12), 6.5).fill(rgrad(C.METAL_L, C.METAL_DD, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  g.circle(51, Y(12), 3.2).fill(0x2a2420);
  g.circle(51 + f, Y(12) - f * 1.5, 3 + f * 1.3).fill({ color: 0xe8e2da, alpha: 0.6 - f * 0.12 });
  // tolva de entrada
  g.roundRect(6, Y(6), 16, 10, 3).fill(C.METAL_D).stroke({ width: 1.6, color: INK });
  for (const [x, y] of [[10, 10], [16, 9]]) g.poly([x, Y(y), x + 3, Y(y - 2), x + 5, Y(y + 1), x + 2, Y(y + 3)]).fill(0x9fe6ec).stroke({ width: 0.8, color: INK });
}

// ---------------------------------------------------------------------------
// CRISTALERÍA: mesa de trabajo donde se encaja el vidrio en un marco de placa
// ---------------------------------------------------------------------------
function cristaleria(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 6, 4);
  // mesa de madera con borde metálico
  g.roundRect(3, Y(3), 58, 58, 6).fill(C.METAL_D).stroke({ width: 2.2, color: INK });
  g.roundRect(7, Y(7), 50, 50, 4).fill(grad([[0, 0xd8b07a], [1, 0xa87a48]], 0, 0, 1, 1)).stroke({ width: 1.6, color: INK });
  for (let x = 15; x < 56; x += 9) line(g, x, Y(8), x, Y(56), 1, 0x8a6236, 0.5);
  for (const [x, y] of [[6, 6], [58, 6], [6, 58], [58, 58]]) bolt(g, x, Y(y), 1.8);
  // ventana a medio montar: marco de placa + vidrio que va bajando
  const drop = [6, 3, 0, 0][f];
  s.roundRect(20, Y(22), 26, 24, 2).fill({ color: SHADOW, alpha: 0.35 });
  g.roundRect(18, Y(19), 28, 26, 2).fill(C.STEEL_D).stroke({ width: 2, color: INK });
  g.roundRect(21, Y(22) - drop, 22, 20, 1).fill(grad([[0, 0xe8fbfa], [1, 0x8fd0d8]], 0, 0, 1, 1)).stroke({ width: 1.4, color: INK });
  line(g, 24, Y(25) - drop, 30, Y(25) - drop, 1.6, 0xffffff, 0.9);
  if (f >= 2) { line(g, 32, Y(19), 32, Y(45), 2, C.STEEL_D); line(g, 18, Y(32), 46, Y(32), 2, C.STEEL_D); }
  // ventosa del brazo que sujeta el vidrio
  g.circle(32, Y(32) - drop, 4).fill({ color: C.BUTTER, alpha: f >= 2 ? 0 : 1 }).stroke({ width: f >= 2 ? 0 : 1.2, color: INK });
  // herramientas
  g.roundRect(48, Y(12), 4, 14, 1.5).fill(0x8a6236).stroke({ width: 1, color: INK });
  g.roundRect(45, Y(9), 10, 5, 1.5).fill(C.METAL).stroke({ width: 1, color: INK });
  g.circle(13, Y(50), 4).stroke({ width: 2.2, color: C.METAL_D });
  line(g, 16, Y(47), 22, Y(41), 2.4, C.METAL_D);
  // chispa de remache cuando encaja
  if (f === 3) for (let k = 0; k < 6; k++) { const a = k; line(g, 46, Y(32), 46 + Math.cos(a) * 5, Y(32) + Math.sin(a) * 5, 1, 0xfff0a0); }
}

// ---------------------------------------------------------------------------
// MONTADORA SOLAR: puente grúa que coloca el engranaje sobre el panel solar
// ---------------------------------------------------------------------------
function montasolar(g, s, f) {
  lift(s, 2, Y(2), 60, 60, 8, 4);
  g.roundRect(2, Y(2), 60, 60, 8).fill(grad([[0, 0x6b7280], [1, 0x454b55]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  hazard(g, 5, Y(5), 54, 4);
  hazard(g, 5, Y(55), 54, 4);
  // panel solar en el centro
  s.roundRect(15, Y(18), 34, 28, 3).fill({ color: SHADOW, alpha: 0.4 });
  g.roundRect(13, Y(15), 36, 30, 3).fill(C.METAL_L).stroke({ width: 1.8, color: INK });
  g.roundRect(16, Y(18), 30, 24, 2).fill(grad([[0, 0x4a6fa8], [1, 0x1f3560]], 0, 0, 1, 1));
  for (let x = 21; x < 46; x += 5) line(g, x, Y(18), x, Y(42), 0.9, 0x9fc3ff, 0.6);
  for (let y = 24; y < 42; y += 6) line(g, 16, Y(y), 46, Y(y), 0.9, 0x9fc3ff, 0.6);
  line(g, 18, Y(20), 30, Y(20), 1.4, 0xffffff, 0.6);
  // carriles del puente grúa (arriba y abajo) y carro que se desplaza
  for (const y of [10, 50]) {
    g.roundRect(4, Y(y) - 2.5, 56, 5, 2).fill(C.BUTTER).stroke({ width: 1.4, color: INK });
  }
  const cx = [14, 26, 38, 50][f];
  s.roundRect(cx - 4, Y(12), 10, 40, 2).fill({ color: SHADOW, alpha: 0.4 });
  g.roundRect(cx - 5, Y(8), 10, 44, 3).fill(grad([[0, C.BUTTER_L], [1, C.BUTTER_D]], 0, 0, 1, 0)).stroke({ width: 1.8, color: INK });
  // gancho con un engranaje
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + f * 0.3;
    g.circle(cx + Math.cos(a) * 5.5, Y(30) + Math.sin(a) * 5.5, 1.8).fill(C.BUTTER_D).stroke({ width: 0.8, color: INK });
  }
  g.circle(cx, Y(30), 5).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.4, color: INK });
  g.circle(cx, Y(30), 1.6).fill(INK);
  // luces de estado
  g.circle(56, Y(30), 2.4).fill(f % 2 ? 0x7dff9a : 0x2e6b3b).stroke({ width: 1, color: INK });
}

// ---------------------------------------------------------------------------
// TREFILADORA: tolva de chatarra, tren de rodillos que estira y bobina de alambre
// ---------------------------------------------------------------------------
function trefiladora(g, s, f) {
  lift(s, 3, Y(4), 58, 56, 8, 4);
  g.roundRect(3, Y(4), 58, 56, 8).fill(grad([[0, C.MINT_L], [1, C.MINT_D]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  hazard(g, 6, Y(53), 52, 4);
  // tolva con chatarra a la izquierda
  lift(s, 6, Y(8), 18, 20, 3, 3);
  g.roundRect(6, Y(8), 18, 20, 3).fill(C.METAL_D).stroke({ width: 1.8, color: INK });
  g.roundRect(9, Y(11), 12, 14, 2).fill(0x3a3631);
  for (const [x, y] of [[11, 14], [16, 13], [13, 19], [18, 20]]) g.poly([x, Y(y), x + 3, Y(y - 2), x + 4, Y(y + 1), x + 1, Y(y + 3)]).fill(0xb3aa9c).stroke({ width: 0.8, color: INK });
  // canal por donde corre el alambre
  g.roundRect(8, Y(34), 48, 6, 3).fill(0x3a3631).stroke({ width: 1.4, color: INK });
  const off = f * 3;
  for (let x = 10 + (off % 6); x < 54; x += 6) line(g, x, Y(37), x + 2, Y(37), 1.6, C.METAL_L, 0.9);
  // pares de rodillos (de grande a pequeño: la hilera reduce el grosor)
  [[16, 7], [28, 6], [40, 5]].forEach(([x, r], i) => {
    for (const dy of [-1, 1]) {
      const cy = Y(37) + dy * (r + 3);
      s.circle(x + 2, cy + 3, r).fill({ color: SHADOW, alpha: 0.35 });
      g.circle(x, cy, r).fill(rgrad(C.METAL_L, C.STEEL_D, 0.35, 0.3)).stroke({ width: 1.6, color: INK });
      const a = (f + i) * 0.8 * dy;
      line(g, x - Math.cos(a) * (r - 2), cy - Math.sin(a) * (r - 2), x + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 1.4, C.STEEL_D);
      g.circle(x, cy, 1.6).fill(INK);
    }
  });
  // bobina de alambre que gira
  const bx = 50, by = Y(16);
  s.circle(bx + 2, by + 3, 10).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(bx, by, 10).fill(C.METAL_D).stroke({ width: 1.8, color: INK });
  for (let r = 8.5; r > 3.5; r -= 1.6) g.circle(bx, by, r).stroke({ width: 1.2, color: r % 2 > 1 ? C.METAL_L : 0xa9b4bd });
  const a = f * (Math.PI / 4);
  line(g, bx, by, bx + Math.cos(a) * 8, by + Math.sin(a) * 8, 1.6, C.RUST);
  g.circle(bx, by, 2.4).fill(C.RUST_D).stroke({ width: 1, color: INK });
  line(g, 54, Y(34), bx + 6, by + 7, 1.4, C.METAL_L);
  // piloto
  g.circle(32, Y(10), 2.6).fill(f % 2 ? 0x7dff9a : 0x2e6b3b).stroke({ width: 1, color: INK });
}

// ---------------------------------------------------------------------------
// CORTADORA: mesa con sierra circular que trocea placas en tornillos
// ---------------------------------------------------------------------------
function cortadora(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 7, 4);
  g.roundRect(3, Y(3), 58, 58, 7).fill(grad([[0, C.STEEL_L], [1, C.STEEL]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  for (let x = 10; x < 58; x += 8) line(g, x, Y(5), x, Y(59), 1, C.STEEL_D, 0.3);
  // placa que avanza hacia la sierra
  const px = [8, 11, 14, 11][f];
  g.roundRect(px, Y(22), 22, 20, 2).fill(grad([[0, 0xe3f2fb], [1, 0x7fa9c6]], 0, 0, 1, 1)).stroke({ width: 1.4, color: INK });
  line(g, px + 3, Y(25), px + 12, Y(25), 1.2, 0xffffff, 0.8);
  // sierra con protección naranja
  const cx = 36, cy = Y(32);
  s.circle(cx + 3, cy + 4, 15).fill({ color: SHADOW, alpha: 0.4 });
  const rot = f * (Math.PI / 12);
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = rot + (i / 24) * Math.PI * 2;
    const r = i % 2 ? 11 : 13.5;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.poly(pts).fill(rgrad(0xffffff, C.METAL_D, 0.4, 0.35)).stroke({ width: 1.4, color: INK });
  g.circle(cx, cy, 4).fill(C.METAL_DD).stroke({ width: 1.2, color: INK });
  // guarda: media luna por arriba
  g.moveTo(cx - 15, cy).arc(cx, cy, 15, Math.PI, Math.PI * 1.85).lineTo(cx, cy).closePath()
    .fill({ color: C.RUST, alpha: 0.92 }).stroke({ width: 1.8, color: INK });
  // chispas
  if (f % 2 === 0) for (let k = 0; k < 6; k++) { const a = Math.PI * 0.8 + k * 0.18; line(g, cx - 12, cy + 2, cx - 12 + Math.cos(a) * 7, cy + 2 + Math.sin(a) * 7, 1.1, k % 2 ? 0xfff6c0 : 0xffb03a); }
  // cubeta de tornillos
  lift(s, 42, Y(46), 16, 12, 3, 2);
  g.roundRect(42, Y(46), 16, 12, 3).fill(C.RUST_D).stroke({ width: 1.6, color: INK });
  g.roundRect(44, Y(48), 12, 8, 2).fill(0x3a3631);
  for (const [x, y] of [[46, 50], [50, 51], [53, 49], [48, 53], [52, 54]]) { g.circle(x, Y(y), 1.4).fill(C.METAL_L).stroke({ width: 0.6, color: INK }); }
  // botón de parada
  g.circle(10, Y(52), 4).fill(rgrad(0xff9a9a, 0xc0392b)).stroke({ width: 1.4, color: INK });
}

// ---------------------------------------------------------------------------
// BOBINADORA: mandril que enrolla el alambre en espiral (el muelle, visto desde arriba)
// ---------------------------------------------------------------------------
function bobinadora(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 10, 4);
  g.roundRect(3, Y(3), 58, 58, 10).fill(grad([[0, C.LILAC_L], [1, C.LILAC_D]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  for (const [x, y] of [[8, 8], [56, 8], [8, 56], [56, 56]]) bolt(g, x, Y(y), 2);
  // carrete de alambre que alimenta
  g.circle(14, Y(16), 8).fill(C.METAL_D).stroke({ width: 1.6, color: INK });
  for (let r = 6.5; r > 2.5; r -= 1.5) g.circle(14, Y(16), r).stroke({ width: 1, color: 0xa9b4bd });
  const fa = -f * (Math.PI / 4);
  line(g, 14, Y(16), 14 + Math.cos(fa) * 6, Y(16) + Math.sin(fa) * 6, 1.4, C.RUST);
  // guía del alambre
  line(g, 20, Y(20), 30, Y(28), 1.6, C.METAL_L);
  // plato giratorio con la espiral
  const cx = 34, cy = Y(36);
  s.circle(cx + 2, cy + 3, 18).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(cx, cy, 18).fill(rgrad(C.METAL_L, C.METAL_D, 0.4, 0.35)).stroke({ width: 2, color: INK });
  const rot = f * (Math.PI / 2);
  g.moveTo(cx + 3, cy);
  for (let t = 0; t <= 34; t++) {
    const a = rot + t * 0.45, r = 3 + t * 0.38;
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.stroke({ width: 2.4, color: INK, cap: 'round', join: 'round' });
  g.moveTo(cx + 3, cy);
  for (let t = 0; t <= 34; t++) {
    const a = rot + t * 0.45, r = 3 + t * 0.38;
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.stroke({ width: 1.3, color: 0xdde6ec, cap: 'round', join: 'round' });
  g.circle(cx, cy, 3).fill(C.LILAC_D).stroke({ width: 1, color: INK });
  // contador de vueltas
  g.roundRect(42, Y(6), 16, 9, 2).fill(0x41454f).stroke({ width: 1.4, color: INK });
  for (let i = 0; i < 3; i++) g.rect(44.5 + i * 4.3, Y(8), 3, 5).fill(i === f % 3 ? 0x7dff9a : 0x2e6b3b);
}

// ---------------------------------------------------------------------------
// MONTADORA: mesa giratoria de 4 puestos con atornillador que baja
// ---------------------------------------------------------------------------
function montadora(g, s, f) {
  lift(s, 2, Y(2), 60, 60, 9, 4);
  g.roundRect(2, Y(2), 60, 60, 9).fill(grad([[0, 0x9fb7d6], [1, 0x5a7397]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  hazard(g, 5, Y(5), 54, 4);
  // mesa giratoria
  const cx = 32, cy = Y(36);
  s.circle(cx + 2, cy + 3, 19).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(cx, cy, 19).fill(rgrad(C.METAL_L, C.METAL_D, 0.4, 0.35)).stroke({ width: 2, color: INK });
  const rot = f * (Math.PI / 8);
  for (let i = 0; i < 4; i++) {
    const a = rot + (i / 4) * Math.PI * 2;
    const x = cx + Math.cos(a) * 11, y = cy + Math.sin(a) * 11;
    g.roundRect(x - 5, y - 5, 10, 10, 2).fill(0x3a3631).stroke({ width: 1.2, color: INK });
    // en cada puesto, un engranaje a medio montar
    for (let k = 0; k < 6; k++) { const b = (k / 6) * Math.PI * 2; g.circle(x + Math.cos(b) * 3.4, y + Math.sin(b) * 3.4, 1.1).fill(C.BUTTER_D); }
    g.circle(x, y, 2.6).fill(C.BUTTER).stroke({ width: 0.8, color: INK });
  }
  g.circle(cx, cy, 4).fill(C.METAL_DD).stroke({ width: 1.2, color: INK });
  // brazo con atornillador sobre el puesto de arriba
  const down = [0, 2, 4, 2][f];
  s.roundRect(48, Y(14) + 3 - down * 0.5, 10, 10, 3).fill({ color: SHADOW, alpha: 0.4 });
  beam(g, 54, Y(14), 34, Y(24), 6, C.BUTTER, C.BUTTER_L);
  g.roundRect(48, Y(9), 12, 12, 3).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  g.circle(34, Y(24), 4.5 - down * 0.25).fill(C.METAL_DD).stroke({ width: 1.4, color: INK });
  line(g, 32, Y(24), 36, Y(24), 1.4, C.METAL_L);
  if (f === 2) for (let k = 0; k < 5; k++) { const a = k * 1.25; line(g, 34, Y(24), 34 + Math.cos(a) * 6, Y(24) + Math.sin(a) * 6, 1, 0xfff6c0); }
  // caja de tornillos al lado
  g.roundRect(6, Y(12), 14, 12, 2).fill(C.RUST_D).stroke({ width: 1.4, color: INK });
  for (const [x, y] of [[9, 15], [13, 17], [16, 14], [11, 20], [16, 20]]) g.circle(x, Y(y), 1.2).fill(C.METAL_L);
}

// ---------------------------------------------------------------------------
// SOLDADORA: célula con cortinas, brazo con soplete y carcasa a medio soldar
// ---------------------------------------------------------------------------
function soldadora(g, s, f) {
  lift(s, 2, Y(2), 60, 60, 8, 4);
  g.roundRect(2, Y(2), 60, 60, 8).fill(grad([[0, 0x6b7280], [1, 0x3e434b]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  // rejilla del suelo
  for (let x = 10; x < 56; x += 7) line(g, x, Y(10), x, Y(56), 1, 0x2a2d33, 0.6);
  // cortinas de protección (tiras rosadas translúcidas) por arriba y abajo
  for (const y of [6, 52]) for (let x = 7; x < 57; x += 6) g.roundRect(x, Y(y), 5, 7, 1).fill({ color: C.ROSE, alpha: 0.75 }).stroke({ width: 0.8, color: INK, alpha: 0.6 });
  // carcasa en el centro
  s.roundRect(19, Y(22), 26, 22, 3).fill({ color: SHADOW, alpha: 0.4 });
  g.roundRect(17, Y(19), 26, 22, 3).fill(grad([[0, 0xe3f2fb], [1, 0x7fa9c6]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
  g.roundRect(21, Y(23), 18, 14, 2).fill(0x5d7f94);
  // cordón de soldadura que avanza
  const seam = [0.25, 0.5, 0.75, 1][f];
  line(g, 17, Y(30), 17 + 26 * seam, Y(30), 2.2, 0xffb03a);
  // brazo con soplete
  const tx = 17 + 26 * seam, ty = Y(30);
  s.circle(56, Y(46), 7).fill({ color: SHADOW, alpha: 0.4 });
  beam(g, 54, Y(44), 48, Y(32), 6, C.RUST, C.RUST_L);
  beam(g, 48, Y(32), tx + 2, ty - 2, 4, C.RUST, C.RUST_L);
  g.circle(54, Y(44), 6).fill(rgrad(C.RUST_L, C.RUST_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  g.circle(48, Y(32), 3).fill(C.METAL_DD).stroke({ width: 1, color: INK });
  // destello
  g.circle(tx, ty, 6 + (f % 2) * 2).fill({ color: 0xbfe9ff, alpha: 0.45 });
  g.circle(tx, ty, 2.6).fill(0xffffff);
  for (let k = 0; k < 6; k++) { const a = k * 1.05 + f; line(g, tx, ty, tx + Math.cos(a) * 5, ty + Math.sin(a) * 5, 1, k % 2 ? 0xfff6c0 : 0xffb03a); }
  // bombona de gas
  g.circle(10, Y(44), 5).fill(rgrad(0x9bd078, 0x3f7a3a, 0.35, 0.3)).stroke({ width: 1.4, color: INK });
  g.circle(10, Y(44), 1.8).fill(C.METAL_DD);
}

// ---------------------------------------------------------------------------
// MOTORERA: banco de pruebas con el motor (aletas de refrigeración) girando
// ---------------------------------------------------------------------------
function motorera(g, s, f) {
  lift(s, 3, Y(3), 58, 58, 9, 4);
  g.roundRect(3, Y(3), 58, 58, 9).fill(grad([[0, 0x8fe0d8], [1, 0x3f8a86]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  hazard(g, 6, Y(54), 52, 4);
  for (const [x, y] of [[8, 8], [56, 8]]) bolt(g, x, Y(y), 2);
  // motor visto desde arriba: cuerpo redondo con aletas
  const cx = 30, cy = Y(32);
  s.circle(cx + 3, cy + 4, 17).fill({ color: SHADOW, alpha: 0.45 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    beam(g, cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 2.2, C.METAL_D);
  }
  g.circle(cx, cy, 12).fill(rgrad(C.METAL_L, C.STEEL_D, 0.35, 0.3)).stroke({ width: 2, color: INK });
  // eje con hélice de prueba que gira
  const rot = f * (Math.PI / 6);
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * Math.PI * 2;
    g.ellipse(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, 5, 2.2).fill(C.BUTTER).stroke({ width: 1, color: INK });
  }
  g.circle(cx, cy, 2.8).fill(C.METAL_DD).stroke({ width: 1, color: INK });
  // muelle y mecanismo esperando en una bandeja
  g.roundRect(48, Y(16), 10, 30, 3).fill(C.METAL_D).stroke({ width: 1.4, color: INK });
  g.circle(53, Y(23), 3.2).fill(C.BUTTER).stroke({ width: 0.8, color: INK });
  for (let y = 32; y < 43; y += 2.4) line(g, 50, Y(y), 56, Y(y + 1.2), 1.2, 0xdde6ec);
  // panel con aguja de revoluciones
  g.roundRect(8, Y(46), 18, 6, 2).fill(0x41454f).stroke({ width: 1.2, color: INK });
  g.rect(9.5, Y(47.5), 3 + f * 4, 3).fill(f === 3 ? 0xff7a5a : 0x7dff9a);
}

// ---------------------------------------------------------------------------
// LÍNEA DE ROBOTS: dos brazos meten el motor en la carcasa y sale un robot
// ---------------------------------------------------------------------------
function robotica(g, s, f) {
  lift(s, 2, Y(2), 60, 60, 10, 4);
  g.roundRect(2, Y(2), 60, 60, 10).fill(grad([[0, 0xfff3d6], [1, 0xd8c7a0]], 0, 0, 1, 1)).stroke({ width: 2.2, color: INK });
  // cinta interna
  g.roundRect(6, Y(26), 52, 16, 3).fill(C.BELT).stroke({ width: 1.6, color: INK });
  for (let x = 8 + f * 2; x < 56; x += 8) line(g, x, Y(27), x, Y(41), 1.2, C.BELT_L);
  // robot de limpieza a medio montar: cuerpo redondo con su "cara"
  const rx = [20, 26, 32, 38][f], ry = Y(34);
  s.circle(rx + 2, ry + 3, 9).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(rx, ry, 9).fill(rgrad(C.MINT_L, C.MINT_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  g.roundRect(rx - 5, ry - 4, 10, 4, 2).fill(0x2a2d33);
  if (f >= 2) { g.circle(rx - 2.4, ry - 2, 1.1).fill(0x7fe3e0); g.circle(rx + 2.4, ry - 2, 1.1).fill(0x7fe3e0); }
  g.circle(rx, ry + 4, 1.6).fill(f >= 2 ? 0xff8fa0 : C.METAL_D);
  // brazos arriba y abajo
  for (const side of [-1, 1]) {
    const bx = 14 + (side > 0 ? 34 : 0), by = side < 0 ? Y(12) : Y(54);
    const reach = [0.2, 0.6, 1, 0.6][(f + (side > 0 ? 2 : 0)) % 4];
    const tx = rx + side * 3, ty = ry + side * (14 - reach * 6);
    s.circle(bx + 2, by + 3, 6).fill({ color: SHADOW, alpha: 0.4 });
    beam(g, bx, by, tx, ty, 4.5, C.LILAC, C.LILAC_L);
    g.circle(bx, by, 6).fill(rgrad(C.LILAC_L, C.LILAC_D, 0.35, 0.3)).stroke({ width: 1.6, color: INK });
    g.circle(tx, ty, 2.4).fill(C.METAL_L).stroke({ width: 1, color: INK });
  }
  // pantalla de estado
  g.roundRect(38, Y(6), 20, 10, 2).fill(0x41454f).stroke({ width: 1.4, color: INK });
  g.roundRect(40, Y(8), 16, 6, 1).fill(rgrad(0x7fe3e0, 0x1f5a58));
  g.circle(44 + (f % 2) * 8, Y(11), 1.4).fill(0xffffff);
}

// ---------------------------------------------------------------------------
// NAVE: 2×2 casillas (128 px). Única y fija. Ocho bocas de carga (dos por lado,
// alineadas con el centro de cada casilla), patas de aterrizaje y la bodega
// central con el remolino que se traga lo que llega. Chapa remendada.
// ---------------------------------------------------------------------------
function nave(g, s, f) {
  const W = 128, M = 64;
  // patas de aterrizaje en las esquinas (asoman por fuera del casco)
  for (const [x, y] of [[10, 10], [118, 10], [10, 118], [118, 118]]) {
    s.circle(x + 3, y + 4, 9).fill({ color: SHADOW, alpha: 0.45 });
    beam(g, x, y, M + (x < M ? -30 : 30), M + (y < M ? -30 : 30), 5, C.METAL_D, C.METAL_L);
    g.circle(x, y, 8).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 2, color: INK });
    bolt(g, x, y, 2.4);
  }
  // casco: octógono redondeado
  s.roundRect(9, 12, W - 16, W - 16, 30).fill({ color: SHADOW, alpha: 0.5 });
  g.roundRect(6, 6, W - 12, W - 12, 30).fill(grad([[0, 0xf4eee2], [0.6, 0xcfc6b6], [1, 0x9a9183]], 0, 0, 1, 1)).stroke({ width: 2.6, color: INK });
  // parches atornillados (estilo remendado)
  const patch = (x, y, w, h, color) => {
    g.roundRect(x, y, w, h, 4).fill(color).stroke({ width: 1.6, color: INK });
    for (const [px, py] of [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]]) rivet(g, px, py, 1.2);
  };
  patch(18, 40, 20, 14, C.BUTTER);
  patch(88, 76, 22, 16, C.MINT);
  patch(76, 16, 14, 12, C.ROSE);
  rustStain(g, 30, 96, 4);
  rustStain(g, 100, 34, 3);
  // franja de la empresa
  g.roundRect(44, 104, 40, 9, 3).fill(C.ROSE).stroke({ width: 1.4, color: INK });
  line(g, 49, 108.5, 79, 108.5, 1.6, 0xffffff);
  // ocho bocas: dos por lado, en el centro de cada casilla; llegan al borde
  for (let d = 0; d < 4; d++) {
    for (const t of [32, 96]) {
      const horiz = d % 2 === 0; // derecha/izquierda
      const ex = d === 0 ? W : d === 2 ? 0 : t;
      const ey = d === 1 ? W : d === 3 ? 0 : t;
      const w = horiz ? 18 : 24, h = horiz ? 24 : 18;
      const x = horiz ? (d === 0 ? W - w : 0) : ex - w / 2;
      const y = horiz ? ey - h / 2 : (d === 1 ? W - h : 0);
      g.roundRect(x, y, w, h, 4).fill(C.METAL_D).stroke({ width: 2, color: INK });
      g.roundRect(x + (horiz ? (d === 0 ? 2 : 4) : 4), y + (horiz ? 4 : (d === 1 ? 2 : 4)), w - 6, h - 6, 3).fill(0x2f2a25);
      // flecha hacia dentro que parpadea en secuencia
      const ix = d === 0 ? -1 : d === 2 ? 1 : 0, iy = d === 1 ? -1 : d === 3 ? 1 : 0;
      const cx = x + w / 2, cy = y + h / 2, px = -iy, py = ix;
      const on = (f + d) % 2 === 0;
      g.poly([cx + ix * 4, cy + iy * 4, cx - ix * 2 + px * 5, cy - iy * 2 + py * 5, cx - ix * 2 - px * 5, cy - iy * 2 - py * 5]).fill(on ? C.BUTTER : C.BUTTER_D);
    }
  }
  // bodega central: anillo con remaches y remolino de energía
  s.circle(M + 3, M + 4, 30).fill({ color: SHADOW, alpha: 0.35 });
  g.circle(M, M, 30).fill(rgrad(C.METAL_L, C.METAL, 0.35, 0.3)).stroke({ width: 2.4, color: INK });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; bolt(g, M + Math.cos(a) * 26, M + Math.sin(a) * 26, 1.7); }
  g.circle(M, M, 21).fill(rgrad(0xe9fffd, C.TEAL_D, 0.5, 0.5)).stroke({ width: 2.2, color: INK });
  for (let k = 0; k < 4; k++) {
    const a0 = f * 0.4 + (k / 4) * Math.PI * 2;
    g.moveTo(M + Math.cos(a0) * 2, M + Math.sin(a0) * 2);
    for (let t = 1; t <= 10; t++) { const r = 2 + t * 1.75, b = a0 + t * 0.32; g.lineTo(M + Math.cos(b) * r, M + Math.sin(b) * r); }
    g.stroke({ width: 2.2, color: 0xffffff, alpha: 0.85, cap: 'round' });
  }
  g.circle(M, M, 5).fill({ color: 0xffffff, alpha: 0.95 });
  g.circle(M, M, 13 + f).fill({ color: C.TEAL, alpha: 0.14 });
  // cabina con cristal (arriba a la izquierda) y antena con luz (arriba a la derecha)
  s.circle(36, 34, 11).fill({ color: SHADOW, alpha: 0.4 });
  g.circle(33, 31, 11).fill(C.METAL_D).stroke({ width: 2, color: INK });
  g.circle(33, 31, 8).fill(rgrad(0xe9fffd, 0x3f8a99, 0.35, 0.3)).stroke({ width: 1.4, color: INK });
  line(g, 29, 27, 33, 25, 1.6, 0xffffff, 0.9);
  g.circle(100, 100, 7).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
  line(g, 100, 100, 108, 92, 2, INK);
  g.circle(108, 92, 3).fill(f < 2 ? 0xff5a5a : 0x7a2a2a).stroke({ width: 1, color: INK });
  if (f < 2) g.circle(108, 92, 6).fill({ color: 0xff7a7a, alpha: 0.3 });
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
};

export function makeMachines(renderer, t, art = {}) {
  const DRAW = { extractor, prensa, trefiladora, ensambladora, cortadora, bobinadora, montadora, soldadora, motorera, robotica, horno, cristaleria, montasolar };
  for (const kind of UPRIGHT) {
    for (let f = 0; f < 4; f++) {
      t[`${kind}_${f}`] = art[kind] && ART[kind]
        ? tex(renderer, (g, s, mid) => ART[kind](g, s, mid, f, art[kind]), T, TALL)
        : tex(renderer, (g, s) => DRAW[kind](g, s, f), T, TALL);
    }
    t[kind] = t[`${kind}_0`];
  }
  t.chute = tex(renderer, chute);
  for (let f = 0; f < 4; f++) t[`nave_${f}`] = tex(renderer, (g, sh) => nave(g, sh, f), 2 * T, 2 * T, 4);
  t.nave = t.nave_0;
}
