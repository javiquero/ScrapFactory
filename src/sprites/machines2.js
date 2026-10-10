// Máquinas de los planetas 3 a 8. Mismo estilo que machines.js: vista en PLANTA
// pura (desde arriba del todo), cada máquina ocupa su casilla de borde a borde y la
// altura se insinúa con sombras y brillos. 4 fotogramas de trabajo (f = 0..3).
// NO importar de machines.js (import circular): solo de common.js y parts.js.

import { C, grad, cyl, rgrad, rivet, line, hazard, rustStain } from './common.js';
import { Y, beam, lift, bolt } from './parts.js';

const { INK, SHADOW } = C;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Atajos: TODOS reciben coordenadas de la casilla (0..64) y las pasan a la textura.
// ---------------------------------------------------------------------------
const dg = (a, b) => grad([[0, a], [1, b]], 0, 0, 1, 1);       // degradado en diagonal
const ball = (a, b) => rgrad(a, b, 0.35, 0.3);                   // bola/cúpula con brillo
const R = (g, x, y, w, h, r) => g.roundRect(x, Y(y), w, h, r);
const O = (g, x, y, r) => g.circle(x, Y(y), r);
const E = (g, x, y, rx, ry) => g.ellipse(x, Y(y), rx, ry);
const L = (g, x1, y1, x2, y2, w, color, alpha = 1) => line(g, x1, Y(y1), x2, Y(y2), w, color, alpha);
const B = (g, x1, y1, x2, y2, w, color, light) => beam(g, x1, Y(y1), x2, Y(y2), w, color, light);
const P = (g, pts) => g.poly(pts.map((v, i) => (i % 2 ? Y(v) : v)));
const ink = (w = 1.6) => ({ width: w, color: INK });
const shadowR = (s, x, y, w, h, r, d = 3) => lift(s, x, Y(y), w, h, r, d);
const shadowO = (s, x, y, r, d = 3, a = 0.42) => s.circle(x + d * 0.6, Y(y) + d, r).fill({ color: SHADOW, alpha: a });
const bolts = (g, pts, r = 2) => { for (const [x, y] of pts) bolt(g, x, Y(y), r); };

// Bancada de la máquina, de borde a borde
function base(g, s, light, dark, r = 9) {
  lift(s, 3, Y(3), 58, 58, r, 4);
  R(g, 3, 3, 58, 58, r).fill(dg(light, dark)).stroke(ink(2.2));
  R(g, 5.5, 5.5, 53, 53, r - 2).stroke({ width: 1.2, color: 0xffffff, alpha: 0.28 });
}

// Parche de chapa atornillado
function patch(g, x, y, w, h, color) {
  R(g, x, y, w, h, 2.5).fill(color).stroke(ink(1.3));
  for (const [px, py] of [[x + 2.4, y + 2.4], [x + w - 2.4, y + 2.4], [x + 2.4, y + h - 2.4], [x + w - 2.4, y + h - 2.4]]) rivet(g, px, Y(py), 1.1);
}

// Engranaje
function gear(g, cx, cy, ro, ri, n, rot, fill, w = 1.3) {
  const pts = [];
  const d = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = rot + i * d;
    for (const [k, r] of [[-0.3, ri], [-0.17, ro], [0.17, ro], [0.3, ri]]) pts.push(cx + Math.cos(a + d * k) * r, Y(cy) + Math.sin(a + d * k) * r);
  }
  g.poly(pts).fill(fill).stroke(ink(w));
}

// Piloto (luz) con halo cuando está encendido
function lamp(g, x, y, on, cOn = 0x7dff9a, cOff = 0x2e6b3b, r = 2.6) {
  if (on) O(g, x, y, r + 3).fill({ color: cOn, alpha: 0.3 });
  O(g, x, y, r).fill(on ? rgrad(0xffffff, cOn, 0.4, 0.35) : cOff).stroke(ink(1.1));
}

// Pantallita de estado; devuelve el interior
function screen(g, s, x, y, w, h, glow = 0x7fe3e0, deep = 0x1f5a58) {
  shadowR(s, x, y, w, h, 2.5, 2);
  R(g, x, y, w, h, 2.5).fill(0x41454f).stroke(ink(1.4));
  R(g, x + 2, y + 2, w - 4, h - 4, 1.5).fill(rgrad(glow, deep));
  return [x + 2, y + 2, w - 4, h - 4];
}

// Bocanada de vapor
function puff(g, x, y, r, a = 0.6, color = 0xffffff) {
  O(g, x, y, r).fill({ color, alpha: a });
  O(g, x + r * 0.7, y - r * 0.5, r * 0.7).fill({ color, alpha: a * 0.85 });
  O(g, x - r * 0.6, y - r * 0.3, r * 0.55).fill({ color, alpha: a * 0.7 });
}

// Tubería con contorno siguiendo una lista de puntos [x,y,...]
function pipe(g, pts, w, color, light) {
  for (const [ww, c, a] of [[w + 3, INK, 1], [w, color, 1], [Math.max(1, w * 0.35), light, 0.8]]) {
    if (!c) continue;
    g.moveTo(pts[0], Y(pts[1]));
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], Y(pts[i + 1]));
    g.stroke({ width: ww, color: c, alpha: a, cap: 'round', join: 'round' });
  }
}

// Neumático tumbado visto desde arriba
function tire(g, s, x, y, r, rot) {
  shadowO(s, x, y, r, 2);
  O(g, x, y, r).fill(0x2b2a2c).stroke(ink(1.4));
  for (let i = 0; i < 10; i++) {
    const a = rot + (i / 10) * TAU;
    L(g, x + Math.cos(a) * (r - 2.2), y + Math.sin(a) * (r - 2.2), x + Math.cos(a) * (r - 0.6), y + Math.sin(a) * (r - 0.6), 1.3, 0x55545a);
  }
  O(g, x, y, r * 0.5).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(1.1));
  O(g, x, y, r * 0.18).fill(INK);
}

// Placa de circuito verde con pistas doradas
function pcb(g, x, y, w, h, seed = 0, color = 0x4f9a5a) {
  R(g, x, y, w, h, 1.5).fill(dg(0x7fc486, color)).stroke(ink(1.3));
  const gold = 0xf0d27a;
  for (let i = 0; i < 4; i++) {
    const yy = y + 3 + ((i * 7 + seed * 3) % (h - 5));
    const xm = x + 3 + ((i * 11 + seed * 5) % (w - 8));
    L(g, x + 2, yy, xm, yy, 0.9, gold, 0.9);
    L(g, xm, yy, xm + 3, yy + 3 > y + h - 2 ? yy - 3 : yy + 3, 0.9, gold, 0.9);
    O(g, xm + 3, yy + 3 > y + h - 2 ? yy - 3 : yy + 3, 1.1).fill(gold);
  }
}

// Chip negro con patitas
function chip(g, x, y, w, h) {
  for (let k = 1.5; k < w - 1; k += 2) { L(g, x + k, y - 1.2, x + k, y + h + 1.2, 0.8, C.METAL_L); }
  R(g, x, y, w, h, 1).fill(0x2a2a30).stroke(ink(1));
  O(g, x + 1.6, y + 1.6, 0.6).fill(0x8a8a90);
}

// ---------------------------------------------------------------------------
// PLANETA 3 (caucho)
// ---------------------------------------------------------------------------

// TRITURADORA: tolva con neumáticos, dos rodillos dentados y la plancha de goma
function trituradora(g, s, f) {
  base(g, s, 0xf8c9a0, 0xc47a4c);
  // tolva
  shadowR(s, 6, 5, 52, 22, 4);
  R(g, 6, 5, 52, 22, 4).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(2));
  R(g, 9, 8, 46, 17, 3).fill(grad([[0, 0x5a5048], [1, 0x1f1b18]]));
  for (const [x1, y1, x2, y2] of [[9, 8, 16, 25], [55, 8, 48, 25]]) L(g, x1, y1, x2, y2, 1, 0x7a6e62, 0.7);
  tire(g, s, 19, 15 + [0, 1, 2, 1][f], 6.5, f * 0.35);
  tire(g, s, 43, 15 - [0, 1, 0, -1][f], 6, -f * 0.3);
  bolts(g, [[9, 6.8], [55, 6.8]], 1.5);
  // dos rodillos dentados que giran en sentidos opuestos
  for (const [y, dir] of [[27, 1], [34, -1]]) {
    shadowR(s, 13, y, 38, 7, 3, 2);
    R(g, 13, y, 38, 7, 3).fill(cyl(C.STEEL_D, C.STEEL, C.STEEL_L)).stroke(ink(1.5));
    for (let i = 0; i < 9; i++) {
      const x = 16 + i * 4;
      L(g, x, y + 0.8, x, y + 6.2, 0.9, C.STEEL_D, 0.8);
      const ty = y + ((i * 2 + f * dir + 8) % 4) * 1.5 + 0.8;
      P(g, [x - 1.6, ty, x + 1.6, ty, x, ty + 1.8]).fill(C.METAL_L).stroke(ink(0.7));
    }
  }
  // goma triturada entre los rodillos
  for (let i = 0; i < 5; i++) O(g, 18 + i * 7 + (f % 2) * 2, 34, 1.4).fill(0x26262a);
  // cabezas de eje con engranajes
  for (const [x, dir] of [[8.5, 1], [55.5, -1]]) {
    gear(g, x, 33.5, 6, 4.4, 8, dir * f * 0.4, ball(C.BUTTER_L, C.BUTTER_D));
    O(g, x, 33.5, 1.8).fill(INK);
  }
  // guía de salida y plancha de goma negra que va saliendo
  R(g, 14, 42, 36, 16, 3).fill(dg(C.METAL_L, C.METAL)).stroke(ink(1.6));
  for (const x of [16, 48]) L(g, x, 44, x, 56, 1.6, C.METAL_D);
  const len = 7 + f * 2;
  R(g, 17, 41, 30, len, 1.5).fill(grad([[0, 0x45464c], [1, 0x232326]])).stroke(ink(1.3));
  L(g, 19, 43, 44, 43, 1, 0x7d7f88, 0.8);
  for (let k = 0; k < 4; k++) O(g, 21 + k * 7, 41 + len - 2.5, 0.8).fill(0x5d5f66);
  bolts(g, [[16.5, 56], [47.5, 56]], 1.4);
  lamp(g, 8.5, 47, f % 2 === 0, 0xffb84a, 0x7a4a22);
  bolt(g, 8.5, Y(55), 1.8);
  bolt(g, 55.5, Y(47), 1.8);
  rustStain(g, 55, Y(54), 2.5);
}

// VULCANIZADORA: autoclave con tapa redonda, vapor y la correa en bucle
function vulcanizadora(g, s, f) {
  base(g, s, 0xeea0a0, 0xa8545c);
  // correa negra en bucle entre dos poleas (derecha)
  s.roundRect(45 + 1.8, Y(7) + 3, 13, 42, 6.5).stroke({ width: 6, color: SHADOW, alpha: 0.4 });
  R(g, 45, 7, 13, 42, 6.5).stroke({ width: 6.4, color: INK });
  R(g, 45, 7, 13, 42, 6.5).stroke({ width: 3.6, color: 0x2e2e33 });
  for (let k = 0; k < 6; k++) {
    const t = (k * 15 + f * 3.5) % 84; // recorrido por el bucle
    let x, y;
    if (t < 30) { x = 45; y = 13 + t; } else if (t < 42) { x = 51.5 + Math.cos(Math.PI - ((t - 30) / 12) * Math.PI) * 6.5; y = 43 + Math.sin(((t - 30) / 12) * Math.PI) * 6.5; } else if (t < 72) { x = 58; y = 43 - (t - 42); } else { x = 51.5 + Math.cos(-((t - 72) / 12) * Math.PI) * 6.5; y = 13 - Math.sin(((t - 72) / 12) * Math.PI) * 6.5; }
    O(g, x, y, 0.9).fill(0x6a6a72);
  }
  for (const y of [13.5, 42.5]) {
    O(g, 51.5, y, 4.6).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(1.3));
    const a = f * (Math.PI / 4);
    L(g, 51.5 - Math.cos(a) * 3, y - Math.sin(a) * 3, 51.5 + Math.cos(a) * 3, y + Math.sin(a) * 3, 1.2, C.METAL_DD);
  }
  // autoclave: tapa redonda con corona de tornillos
  const cx = 24, cy = 26;
  shadowO(s, cx, cy, 18, 4);
  O(g, cx, cy, 18).fill(ball(0xf3e6e0, 0x9a8a86)).stroke(ink(2.2));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; bolt(g, cx + Math.cos(a) * 15.5, Y(cy) + Math.sin(a) * 15.5, 1.7); }
  O(g, cx, cy, 12.5).fill(ball(C.METAL_L, C.STEEL_D)).stroke(ink(1.6));
  // volante de cierre
  const rot = f * 0.25;
  O(g, cx, cy, 8).stroke({ width: 4.4, color: INK });
  O(g, cx, cy, 8).stroke({ width: 2.4, color: 0xd9534f });
  for (let k = 0; k < 3; k++) { const a = rot + (k / 3) * TAU; L(g, cx, cy, cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 1.8, 0xd9534f); }
  O(g, cx, cy, 2.6).fill(ball(C.METAL_L, C.METAL_DD)).stroke(ink(1));
  // manómetro en la tapa
  O(g, 36, 13, 4).fill(0xf6f2e8).stroke(ink(1.3));
  const nd = [-2.4, -1.4, -0.4, -1.4][f];
  L(g, 36, 13, 36 + Math.cos(nd) * 3, 13 + Math.sin(nd) * 3, 1.1, 0xc94a4a);
  // vapor que se escapa por el borde
  const steam = [[[9, 14], [38, 38]], [[7, 22], [40, 32]], [[11, 10], [36, 42]], [[8, 30], [41, 24]]][f];
  for (const [x, y] of steam) puff(g, x, y, 3.2, 0.55);
  // bandeja de engranajes y termómetro abajo
  shadowR(s, 6, 47, 18, 11, 3, 2);
  R(g, 6, 47, 18, 11, 3).fill(C.METAL_D).stroke(ink(1.4));
  gear(g, 11.5, 52.5, 4, 2.8, 7, 0, C.BUTTER);
  gear(g, 18.5, 52.5, 4, 2.8, 7, 0.3, C.BUTTER_D);
  hazard(g, 27, Y(52), 16, 5);
  R(g, 28, 46, 14, 4, 2).fill(0xf6f2e8).stroke(ink(1.1));
  R(g, 29, 47, 3 + f * 3, 2, 1).fill(0xff6a4a);
}

// PATINETERA: banco de montaje con un patinete eléctrico y un brazo atornillando
function patinetera(g, s, f) {
  base(g, s, 0xb4def5, 0x4f8fb8);
  // tapete de goma del banco
  R(g, 6, 13, 52, 34, 4).fill(0x3f4a52).stroke(ink(1.6));
  for (let x = 12; x < 58; x += 6) L(g, x, 14, x, 46, 0.8, 0x56636c, 0.8);
  for (let y = 19; y < 47; y += 6) L(g, 7, y, 57, y, 0.8, 0x56636c, 0.8);
  // patinete visto desde arriba: tabla, ruedas, guardabarros y manillar
  shadowR(s, 12, 26, 38, 10, 5, 3);
  R(g, 8.5, 28, 6, 6, 2).fill(0x26262a).stroke(ink(1));                 // rueda trasera
  R(g, 46.5, 28, 7, 6, 2).fill(0x26262a).stroke(ink(1));                // rueda delantera
  R(g, 12, 26, 34, 10, 5).fill(dg(C.ROSE, 0xd95f75)).stroke(ink(1.6));  // tabla
  R(g, 16, 28, 24, 6, 3).fill(0x3a3a40);                                // lija antideslizante
  for (let x = 18; x < 40; x += 3) L(g, x, 28.6, x + 1, 33.4, 0.7, 0x55555c);
  R(g, 9, 27.5, 6, 7, 2.5).fill(C.METAL_L).stroke(ink(1.1));            // guardabarros
  // barra y manillar (perpendicular a la tabla)
  B(g, 44, 31, 49, 31, 3, C.METAL_D, C.METAL_L);
  B(g, 49, 19, 49, 43, 2.6, C.METAL_D, C.METAL_L);
  R(g, 46.8, 15.5, 4.4, 6, 2).fill(0x2a2a30).stroke(ink(1));             // puños
  R(g, 46.8, 40.5, 4.4, 6, 2).fill(0x2a2a30).stroke(ink(1));
  O(g, 49, 31, 2.8).fill(rgrad(0x9ff7ff, 0x2a6a7a)).stroke(ink(1));      // pantallita
  // motor esperando en una caja (arriba)
  shadowR(s, 7, 5, 18, 7, 2, 2);
  R(g, 7, 5, 18, 7, 2).fill(C.RUST_D).stroke(ink(1.3));
  for (const x of [11, 16, 21]) { O(g, x, 8.5, 2.3).fill(ball(C.METAL_L, C.STEEL_D)).stroke(ink(0.8)); }
  // correa enrollada
  O(g, 33, 8.5, 3.4).stroke({ width: 3.6, color: INK });
  O(g, 33, 8.5, 3.4).stroke({ width: 1.8, color: 0x3a3a40 });
  // brazo con atornillador que va recorriendo la tabla
  const tx = [21, 27, 33, 27][f], ty = 32;
  const bx = 46, by = 53;
  const ex = 36 + f, ey = 46 - (f % 2) * 1.5;
  shadowO(s, bx, by, 5, 3);
  B(g, bx, by, ex, ey, 4.4, C.BUTTER, C.BUTTER_L);
  B(g, ex, ey, tx, ty + 1, 3.2, C.BUTTER, C.BUTTER_L);
  O(g, bx, by, 5).fill(ball(C.BUTTER_L, C.BUTTER_D)).stroke(ink(1.7));
  O(g, ex, ey, 3.2).fill(C.METAL_DD).stroke(ink(1.1));
  O(g, tx, ty, 3.2).fill(C.METAL_DD).stroke(ink(1.2));
  const sa = f * 1.2;
  L(g, tx - Math.cos(sa) * 2, ty - Math.sin(sa) * 2, tx + Math.cos(sa) * 2, ty + Math.sin(sa) * 2, 1.2, C.METAL_L);
  if (f % 2) for (let k = 0; k < 5; k++) { const a = k * 1.25 + f; L(g, tx, ty, tx + Math.cos(a) * 5, ty + Math.sin(a) * 5, 1, k % 2 ? 0xfff6c0 : 0xffb03a); }
  // tornillos sueltos y piloto
  for (const [x, y] of [[10, 51], [14, 54], [18, 50]]) O(g, x, y, 1.3).fill(C.METAL_L).stroke(ink(0.6));
  lamp(g, 54, 8.5, f < 2);
  bolts(g, [[29, 54], [56, 54]], 1.6);
}

// ---------------------------------------------------------------------------
// PLANETA 4 (circuitos viejos)
// ---------------------------------------------------------------------------

// DESGUAZADORA: mesa con placas rotas y una garra que arranca los chips
function desguazadora(g, s, f) {
  base(g, s, 0xd8d09a, 0x8e8550);
  // mesa de rejilla
  R(g, 6, 16, 52, 41, 4).fill(0x4a4740).stroke(ink(1.6));
  for (let x = 11; x < 58; x += 5) L(g, x, 17, x, 56, 0.8, 0x34322d);
  // placas verdes rotas (borde mellado)
  const broken = (pts, seed) => {
    P(g, pts).fill(dg(0x86c98c, 0x3f8a4c)).stroke(ink(1.4));
    const [x0, y0] = [pts[0], pts[1]];
    for (let i = 0; i < 3; i++) L(g, x0 + 2, y0 + 3 + i * 4, x0 + 10 + ((i + seed) % 3) * 3, y0 + 3 + i * 4, 0.9, 0xf0d27a, 0.9);
  };
  broken([9, 20, 29, 19, 31, 26, 27, 29, 30, 34, 28, 38, 10, 39], 0);
  broken([34, 37, 54, 36, 55, 53, 41, 54, 38, 49, 35, 51], 1);
  // chips aún soldados y huecos de los arrancados
  chip(g, 14, 30, 6, 5);
  chip(g, 44, 41, 7, 5);
  R(g, 21, 23, 5, 4, 1).fill(0x23331f);
  R(g, 46, 48, 5, 3.5, 1).fill(0x23331f);
  if (f < 2) chip(g, 21, 23, 5, 4);
  // cubeta de chips arrancados (arriba a la derecha)
  shadowR(s, 40, 5, 18, 10, 2.5, 2);
  R(g, 40, 5, 18, 10, 2.5).fill(C.RUST_D).stroke(ink(1.3));
  R(g, 42, 7, 14, 6, 1.5).fill(0x3a3631);
  for (const [x, y] of [[43.5, 8], [48, 9.5], [52, 7.5]]) R(g, x, y, 3.5, 2.6, 0.6).fill(0x18181c);
  // raíl del pórtico y garra
  R(g, 4, 9, 34, 5, 2).fill(C.BUTTER).stroke(ink(1.3));
  const cx = [24, 23.5, 28, 33][f], cy = [24, 25, 22, 20][f];
  const lifted = f >= 2;
  shadowR(s, cx - 4, 9, 8, 6, 2, 2);
  B(g, cx, 11.5, cx, cy - 2, 3.2, C.METAL_D, C.METAL_L);
  R(g, cx - 4.5, 7.5, 9, 8, 2).fill(ball(C.BUTTER_L, C.BUTTER_D)).stroke(ink(1.5));
  // garra de tres dedos (abierta / cerrada)
  const open = f === 0 ? 4.2 : lifted ? 4.6 : 2.6;
  shadowO(s, cx, cy, 4, lifted ? 6 : 2.5, 0.38);
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k / 3) * TAU;
    B(g, cx, cy, cx + Math.cos(a) * open, cy + Math.sin(a) * open, 1.6, C.METAL_L);
  }
  if (lifted) {
    chip(g, cx - 3.5, cy - 3, 7, 6);
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k / 3) * TAU; O(g, cx + Math.cos(a) * open, cy + Math.sin(a) * open, 1.3).fill(C.METAL_L).stroke(ink(0.9)); }
  } else O(g, cx, cy, 2.4).fill(C.METAL_DD).stroke(ink(1));
  if (f === 1) for (let k = 0; k < 5; k++) { const a = k * 1.25; L(g, cx, cy + 1, cx + Math.cos(a) * 5, cy + 1 + Math.sin(a) * 5, 0.9, 0xfff0a0); }
  // parche y óxido
  patch(g, 7, 49, 13, 7, C.MINT);
  rustStain(g, 25, Y(54), 2.6);
  lamp(g, 56, 21, f % 2 === 1, 0xff6a5a, 0x6a2a2a, 2.2);
}

// GRABADORA: pick-and-place sobre una placa verde con pistas doradas
function grabadora(g, s, f) {
  base(g, s, 0xc8c4e4, 0x6e6a9e);
  // carretes de componentes arriba
  for (const [x, c] of [[17, C.ROSE], [27, C.BUTTER], [37, C.MINT]]) {
    O(g, x, 8.5, 4).fill(c).stroke(ink(1.2));
    O(g, x, 8.5, 1.4).fill(INK);
    const a = f * 0.6 + x;
    L(g, x, 8.5, x + Math.cos(a) * 3.2, 8.5 + Math.sin(a) * 3.2, 0.9, INK, 0.7);
  }
  // vidrio esperando (arriba a la derecha)
  R(g, 44, 4.5, 12, 8, 1.5).fill({ color: 0xbdeef2, alpha: 0.9 }).stroke(ink(1.2));
  L(g, 46, 6.5, 50, 6.5, 1.2, 0xffffff, 0.9);
  // placa base: verde con pistas doradas
  shadowR(s, 12, 17, 40, 34, 2.5, 2);
  R(g, 12, 17, 40, 34, 2.5).fill(dg(0x84c98a, 0x3a874a)).stroke(ink(1.6));
  const gold = 0xf2d67e;
  const traces = [[14, 22, 30, 22, 34, 26, 48, 26], [14, 30, 22, 30, 26, 34, 26, 48], [30, 48, 30, 40, 40, 40, 48, 32], [48, 20, 40, 20, 36, 16.5]];
  for (const t of traces) { g.moveTo(t[0], Y(t[1])); for (let i = 2; i < t.length; i += 2) g.lineTo(t[i], Y(t[i + 1])); g.stroke({ width: 1.1, color: gold, join: 'round' }); }
  for (const [x, y] of [[30, 22], [48, 26], [22, 30], [26, 48], [48, 32], [40, 40], [16, 44], [44, 46]]) O(g, x, y, 1.5).fill(gold).stroke({ width: 0.6, color: INK, alpha: 0.6 });
  R(g, 33, 30, 9, 7, 1).fill(0xd8d4cc).stroke(ink(1)); // zócalo
  chip(g, 18, 36, 6, 5);
  if (f >= 1) chip(g, 39, 43, 5, 4);
  if (f >= 2) chip(g, 34, 31, 7, 5);
  // pórtico: raíles laterales y viga que se desplaza
  for (const x of [5, 55]) { R(g, x, 15, 4, 44, 2).fill(C.METAL_D).stroke(ink(1.3)); }
  const by = [24, 33, 33, 42][f], hx = [22, 36, 37, 42][f];
  shadowR(s, 4, by - 3, 56, 6, 2, 4);
  R(g, 4, by - 3, 56, 6, 2.5).fill(cyl(C.LILAC_D, C.LILAC, C.LILAC_L)).stroke(ink(1.6));
  // cabezal con boquilla
  shadowR(s, hx - 5, by - 5, 10, 10, 2.5, 5);
  R(g, hx - 5, by - 5, 10, 10, 2.5).fill(ball(C.METAL_L, C.STEEL_D)).stroke(ink(1.6));
  O(g, hx, by, 2.6).fill(0x2e2a26).stroke(ink(1));
  O(g, hx, by, 1).fill(f === 2 ? 0xff5a5a : 0xffb0b0);
  if (f === 2) O(g, hx, by, 5.5).fill({ color: 0xff7a7a, alpha: 0.25 });
  lamp(g, 9, 56, f % 2 === 0, 0x7dff9a, 0x2e6b3b, 2);
}

// CONSOLERA: línea donde se prueba una consola retro con su pantallita
function consolera(g, s, f) {
  base(g, s, 0xf8c2da, 0xb86a92);
  // cinta interna
  R(g, 5, 21, 54, 24, 3).fill(C.BELT).stroke(ink(1.6));
  for (let x = 7 + f * 2; x < 58; x += 8) L(g, x, 22, x, 44, 1.2, C.BELT_L);
  // consola portátil retro vista desde arriba
  const ox = [-1, 0, 1, 0][f];
  shadowR(s, 13 + ox, 23, 36, 20, 6, 3);
  R(g, 13 + ox, 23, 36, 20, 6).fill(dg(0xf1ece2, 0xbdb5a6)).stroke(ink(1.8));
  // pantallita: un bichito que salta
  R(g, 23 + ox, 25.5, 16, 12, 2).fill(0x5a5e66).stroke(ink(1.1));
  R(g, 25 + ox, 27.5, 12, 8, 1).fill(0x9fd28a);
  const px = 27 + ox + f * 2, py = 32 - [0, 2, 3, 2][f];
  R(g, px, py, 2.5, 2.5, 0.5).fill(0x2e5a30);
  L(g, 25.5 + ox, 34.8, 36.5 + ox, 34.8, 0.8, 0x2e5a30);
  // cruceta
  const dx = 18 + ox, dy = 33;
  R(g, dx - 4, dy - 1.4, 8, 2.8, 0.8).fill(0x2e2e33);
  R(g, dx - 1.4, dy - 4, 2.8, 8, 0.8).fill(0x2e2e33);
  // botones de colores (el que pulsa la sonda se ilumina)
  const btn = [[44, 30, 0xff6a6a], [42, 35, 0x6aa8ff], [46.5, 35.5, C.BUTTER]];
  btn.forEach(([x, y, c], i) => {
    const pressed = i === f % 3;
    O(g, x + ox, y, pressed ? 2.6 : 2.2).fill(pressed ? rgrad(0xffffff, c, 0.4, 0.35) : c).stroke(ink(0.9));
  });
  R(g, 27 + ox, 39.5, 3.5, 1.6, 0.8).fill(0x6b6b72);
  R(g, 32 + ox, 39.5, 3.5, 1.6, 0.8).fill(0x6b6b72);
  // monitor de pruebas
  const [sx, sy] = screen(g, s, 6, 5, 22, 13, 0xb8f5a0, 0x2e6a3a);
  for (let i = 0; i < 4; i++) R(g, sx + 1.5 + i * 4.5, sy + 7 - [2, 4, 3, 5, 1, 3, 4][(i + f) % 7], 3, [2, 4, 3, 5, 1, 3, 4][(i + f) % 7] + 1, 0.5).fill(0xe9ffe0);
  // sonda que pulsa los botones
  const [bx2, by2] = btn[f % 3];
  const tx = bx2 + ox, ty = by2;
  shadowO(s, 54, 54, 6, 3);
  B(g, 54, 54, 52, 44, 5, C.LILAC, C.LILAC_L);
  B(g, 52, 44, tx + 1, ty + 1.5, 3.4, C.LILAC, C.LILAC_L);
  O(g, 54, 54, 6).fill(ball(C.LILAC_L, C.LILAC_D)).stroke(ink(1.7));
  O(g, 52, 44, 2.6).fill(C.METAL_DD).stroke(ink(1));
  O(g, tx + 1, ty + 1.5, 1.6).fill(C.METAL_L).stroke(ink(0.9));
  // caja de placas base y carcasas
  shadowR(s, 6, 47, 16, 11, 2.5, 2);
  R(g, 6, 47, 16, 11, 2.5).fill(C.RUST_D).stroke(ink(1.3));
  pcb(g, 8, 49, 12, 7, 2);
  patch(g, 32, 6, 14, 8, C.MINT);
  lamp(g, 54, 11, f !== 3, 0xff8fd0, 0x6a2a4a);
  rustStain(g, 34, Y(54), 2.4);
}

// ---------------------------------------------------------------------------
// PLANETA 5 (musgo luminoso)
// ---------------------------------------------------------------------------

// Cuba redonda con líquido fosforito burbujeando
function vat(g, s, x, y, r, f, seed, inner = 0xeaffb0, outer = 0x48c845) {
  shadowO(s, x, y, r, 4, 0.45);
  O(g, x, y, r + 5).fill({ color: inner, alpha: 0.16 + (f % 2) * 0.06 });
  O(g, x, y, r).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(2));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + seed; bolt(g, x + Math.cos(a) * (r - 2.3), Y(y) + Math.sin(a) * (r - 2.3), 1.3); }
  O(g, x, y, r - 4.5).fill(rgrad(inner, outer, 0.5, 0.5)).stroke(ink(1.4));
  // burbujas que suben (crecen y explotan)
  const bub = [[-0.4, 0.2], [0.35, -0.3], [0.1, 0.45], [-0.25, -0.45], [0.5, 0.25]];
  bub.forEach(([bx, by], i) => {
    const ph = (f + i + seed) % 4;
    const rr = (r - 5) * (0.12 + ph * 0.05);
    const cx = x + bx * (r - 6), cy = y + by * (r - 6);
    if (ph === 3) O(g, cx, cy, rr + 1).stroke({ width: 0.8, color: 0xffffff, alpha: 0.7 });
    else O(g, cx, cy, rr).fill({ color: 0xffffff, alpha: 0.55 }).stroke({ width: 0.8, color: 0x2a6a2a, alpha: 0.7 });
  });
  O(g, x - r * 0.25, y - r * 0.25, (r - 5) * 0.35).fill({ color: 0xffffff, alpha: 0.25 });
}

// FERMENTADOR: cubas de musgo verde fosforito burbujeando, tuberías y depósito
function fermentador(g, s, f) {
  base(g, s, 0x8e7cb4, 0x463a68);
  for (let x = 12; x < 58; x += 8) L(g, x, 6, x, 58, 0.8, 0x3a2f58, 0.5);
  // tuberías (debajo de las cubas)
  pipe(g, [21, 22, 21, 51, 32, 51], 3.4, C.METAL_D, C.METAL_L);
  pipe(g, [21, 22, 51, 22, 51, 12], 3.4, C.METAL_D, C.METAL_L);
  pipe(g, [43, 41, 56, 41, 56, 18], 3, C.METAL_D, C.METAL_L);
  vat(g, s, 20, 20, 13, f, 0);
  vat(g, s, 41, 41, 14, f, 2);
  // válvula
  O(g, 21, 41, 3.6).fill(0xd9534f).stroke(ink(1.2));
  L(g, 18.5, 41, 23.5, 41, 1.2, 0xffb0a0);
  // depósito de biocombustible con nivel
  shadowO(s, 51, 11, 6.5, 3);
  O(g, 51, 11, 6.5).fill(ball(0xffe6a0, 0xc08a2a)).stroke(ink(1.6));
  O(g, 51, 11, 3).fill(0x8a5a1a).stroke(ink(0.9));
  O(g, 51, 11, 1.2 + f * 0.4).fill({ color: 0xffd060, alpha: 0.9 });
  // matas de musgo en el borde
  for (const [x, y] of [[9, 33], [12, 36], [32, 12], [53, 53], [29, 55]]) O(g, x, y, 2.6).fill(rgrad(0xeaffb0, 0x4fbf3a)).stroke({ width: 0.8, color: INK, alpha: 0.7 });
  // manómetro
  O(g, 10, 52, 4).fill(0xf6f2e8).stroke(ink(1.2));
  const nd = [-2.2, -1.6, -1, -1.6][f];
  L(g, 10, 52, 10 + Math.cos(nd) * 3, 52 + Math.sin(nd) * 3, 1, 0xc94a4a);
}

// Batería tumbada (borne + y -) vista desde arriba
function battery(g, s, x, y, glow) {
  shadowR(s, x, y, 14, 9, 2.5, 2);
  R(g, x + 13.4, y + 2.6, 2, 3.8, 0.8).fill(C.METAL_L).stroke(ink(0.8));
  R(g, x, y, 14, 9, 2.5).fill(grad([[0, 0x4a4a52], [0.4, 0x6a6a74], [1, 0x2e2e34]])).stroke(ink(1.3));
  R(g, x + 8, y + 0.6, 5.4, 7.8, 1.5).fill(glow ? 0xfff07a : 0xd8e870);
  L(g, x + 2.3, y + 4.5, x + 5.3, y + 4.5, 1, 0xffffff);          // -
  L(g, x + 10.7, y + 3, x + 10.7, y + 6, 1, INK);                  // +
  L(g, x + 9.2, y + 4.5, x + 12.2, y + 4.5, 1, INK);
}

// BATERIERA: envasadora con baterías en fila y brillo de carga
function bateriera(g, s, f) {
  base(g, s, 0xe0ee98, 0x93a646);
  // cinta interna
  R(g, 4, 29, 56, 17, 3).fill(C.BELT).stroke(ink(1.6));
  const off = f * 4.5;
  for (let x = 6 + (off % 6); x < 58; x += 6) L(g, x, 30, x, 45, 1, C.BELT_L);
  // baterías que avanzan (separación 18 → bucle perfecto en 4 fotogramas)
  for (let k = -1; k < 4; k++) {
    const x = 2 + off + k * 18;
    if (x < 0 || x > 50) continue;
    battery(g, s, x, 33, x > 34);
  }
  // rodillos de los extremos (tapan las baterías que entran/salen)
  for (const x of [3, 55]) R(g, x, 28, 6, 19, 2.5).fill(cyl(C.METAL_DD, C.METAL_D, C.METAL_L, false)).stroke(ink(1.4));
  // depósito de biocombustible y boquilla de llenado
  shadowO(s, 13, 15, 8, 3);
  O(g, 13, 15, 8).fill(ball(0xffe6a0, 0xc08a2a)).stroke(ink(1.8));
  O(g, 13, 15, 4).fill(ball(0xfff3c4, 0xd89a2a)).stroke(ink(1));
  pipe(g, [21, 15, 26, 15], 3, C.METAL_D, C.METAL_L);
  shadowR(s, 24, 9, 12, 21, 3, 4);
  R(g, 24, 9, 12, 21, 3).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(1.7));
  O(g, 30, 25, 3).fill(C.METAL_DD).stroke(ink(1));
  if (f % 2 === 0) { O(g, 30, 29 + f, 1.6).fill(0xffc040).stroke(ink(0.6)); }
  // pinza de carga con rayo y brillo
  shadowR(s, 40, 9, 14, 17, 3, 4);
  R(g, 40, 9, 14, 17, 3).fill(dg(0xffd27a, 0xd08a2a)).stroke(ink(1.7));
  P(g, [48, 11.5, 44, 18, 47, 18, 45.5, 23.5, 50.5, 16, 47.5, 16]).fill(f % 2 ? 0xffffff : 0xfff07a).stroke(ink(0.9));
  B(g, 47, 26, 47, 32, 2.4, C.METAL_D, C.METAL_L);
  const glow = 6 + (f % 2) * 2.5;
  O(g, 47, 37.5, glow).fill({ color: 0xfff07a, alpha: 0.35 });
  for (let k = 0; k < 4; k++) { const a = k * (TAU / 4) + f * 0.4; L(g, 47 + Math.cos(a) * 6, 37.5 + Math.sin(a) * 6, 47 + Math.cos(a) * 9, 37.5 + Math.sin(a) * 9, 1, 0xfff6c0); }
  // barra de carga
  R(g, 8, 50, 30, 7, 2).fill(0x41454f).stroke(ink(1.3));
  for (let i = 0; i < 4; i++) R(g, 10 + i * 6.8, 51.8, 5.6, 3.4, 1).fill(i <= f ? 0x9cff7a : 0x2e5a2e);
  hazard(g, 42, Y(51), 15, 5);
}

// DRONERA: plataforma de aterrizaje con un cuadricóptero cuyas hélices giran
function dronera(g, s, f) {
  base(g, s, 0x7a96bc, 0x34507c);
  // plataforma
  O(g, 32, 32, 25).fill(rgrad(0x8aa0b8, 0x5a6e88)).stroke(ink(1.8));
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * TAU, a1 = a0 + TAU / 32;
    g.moveTo(32 + Math.cos(a0) * 22, Y(32) + Math.sin(a0) * 22).arc(32, Y(32), 22, a0, a1).stroke({ width: 2.4, color: C.BUTTER });
  }
  // H de helipuerto
  for (const x of [24, 38]) R(g, x, 23, 3, 18, 1).fill({ color: 0xffffff, alpha: 0.6 });
  R(g, 24, 30.5, 17, 3, 1).fill({ color: 0xffffff, alpha: 0.6 });
  // luces de las esquinas, parpadeo alterno
  [[8, 8], [56, 8], [56, 56], [8, 56]].forEach(([x, y], i) => lamp(g, x, y, (i + f) % 2 === 0, i < 2 ? 0x7dff9a : 0xff6a5a, i < 2 ? 0x2e6b3b : 0x6a2a2a, 2.3));
  // dron flotando: la sombra se separa cuando sube
  const h = [4, 6, 8, 6][f], up = [0, -0.6, -1.2, -0.6][f];
  const cx = 32, cy = 32 + up, arm = 13.5;
  s.circle(cx + h * 0.6, Y(cy) + h, 11).fill({ color: SHADOW, alpha: 0.4 });
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s.circle(cx + sx * arm + h * 0.6, Y(cy + sy * arm) + h, 6).fill({ color: SHADOW, alpha: 0.3 });
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B(g, cx, cy, cx + sx * arm, cy + sy * arm, 3, C.METAL_D, C.METAL_L);
  // cuerpo
  R(g, cx - 7, cy - 7, 14, 14, 4).fill(dg(C.ROSE, 0xd95f75)).stroke(ink(1.6));
  R(g, cx - 4, cy - 4.5, 8, 4, 1.5).fill(0x2a2d33);
  O(g, cx, cy - 2.5, 1.3).fill(f % 2 ? 0x7fe3e0 : 0x3a8a88);
  R(g, cx - 4, cy + 1.5, 8, 4, 1).fill(C.BUTTER).stroke(ink(0.8));  // batería
  // rotores: disco borroso + dos palas que giran
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => {
    const rx = cx + sx * arm, ry = cy + sy * arm;
    O(g, rx, ry, 7.5).fill({ color: 0xe8f4ff, alpha: 0.28 }).stroke({ width: 1, color: INK, alpha: 0.5 });
    const a = f * (Math.PI / 4) * (i % 2 ? -1 : 1) + i;
    for (const d of [0, Math.PI]) {
      const ex = rx + Math.cos(a + d) * 7, ey = ry + Math.sin(a + d) * 7;
      L(g, rx, ry, ex, ey, 3.4, INK);
      L(g, rx, ry, ex, ey, 2, C.METAL_L);
    }
    O(g, rx, ry, 2.4).fill(ball(C.METAL_L, C.METAL_DD)).stroke(ink(0.9));
  });
}

// ---------------------------------------------------------------------------
// PLANETA 6 (lodo tóxico)
// ---------------------------------------------------------------------------

// DESTILERÍA: alambique con caldera verde tóxico, serpentín y goteo a un bote
function destileria(g, s, f) {
  base(g, s, 0xd8a8c8, 0x8a5a7c);
  // rejilla del hogar con fuego debajo
  R(g, 6, 42, 24, 15, 3).fill(0x2e2622).stroke(ink(1.5));
  R(g, 8, 44, 20, 11, 2).fill(rgrad(f % 2 ? 0xfff0a0 : 0xffd27a, 0xd8501a));
  for (let x = 10; x < 28; x += 3.5) L(g, x, 43, x, 56, 1.6, 0x2e2622);
  // caldera abierta con lodo tóxico burbujeando
  vat(g, s, 19, 21, 14, f, 1, 0xf4ff9a, 0x7ac22a);
  // cuello de cisne hacia el condensador
  pipe(g, [27, 12, 35, 8, 44, 10, 47, 14], 3.2, C.METAL_D, C.METAL_L);
  // condensador: depósito de agua con el serpentín dentro
  shadowO(s, 47, 23, 11, 3);
  O(g, 47, 23, 11).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(1.8));
  O(g, 47, 23, 8).fill(rgrad(0xc8f0ff, 0x4f9ac8)).stroke(ink(1.2));
  for (const [w, c] of [[2.8, INK], [1.4, 0xf2b27a]]) {
    g.moveTo(47 + 6.6, Y(23));
    for (let t = 1; t <= 26; t++) { const a = t * 0.5, r = 6.6 - t * 0.17; g.lineTo(47 + Math.cos(a) * r, Y(23) + Math.sin(a) * r); }
    g.stroke({ width: w, color: c, cap: 'round', join: 'round' });
  }
  O(g, 47 - 3 + f, 22, 1).fill({ color: 0xffffff, alpha: 0.7 });
  // salida y goteo
  pipe(g, [47, 34, 47, 40], 2.6, C.METAL_D, C.METAL_L);
  shadowO(s, 47, 50, 7.5, 3);
  O(g, 47, 50, 7.5).fill(rgrad(0xf6f2e8, 0xa8a49a)).stroke(ink(1.6));
  O(g, 47, 50, 5.4).fill(rgrad(0xf4ff9a, 0x9ac22a)).stroke(ink(1));
  const dy = [41.5, 43.5, 45.5, 50][f];
  if (f < 3) P(g, [47, dy - 1.8, 48.3, dy + 0.4, 47, dy + 1.6, 45.7, dy + 0.4]).fill(0xd8ff5a).stroke(ink(0.7));
  else O(g, 47, 50, 3 + 1).stroke({ width: 0.9, color: 0xffffff, alpha: 0.8 });
  // señal de peligro
  P(g, [37, 45, 42, 54, 32, 54]).fill(C.BUTTER).stroke(ink(1.3));
  L(g, 37, 48, 37, 51, 1.3, INK);
  O(g, 37, 52.6, 0.7).fill(INK);
  // humo tóxico de la caldera
  puff(g, 12 + f, 9 - f * 0.5, 2.5 + f * 0.5, 0.45 - f * 0.06, 0xe8ffb0);
}

// GRABADO AL ÁCIDO: bandeja de ácido donde un brazo baña la placa
function grabadoacido(g, s, f) {
  base(g, s, 0xf4e6b4, 0xb6a064);
  // bandeja con el ácido
  shadowR(s, 6, 15, 44, 37, 5, 3);
  R(g, 6, 15, 44, 37, 5).fill(dg(0x5a5e66, 0x34363c)).stroke(ink(1.8));
  R(g, 9.5, 18.5, 37, 30, 3.5).fill(rgrad(0xf0ff8a, 0x9ac22a)).stroke(ink(1.2));
  // ondas
  for (let i = 0; i < 3; i++) {
    const r = 3 + ((i * 4 + f * 2) % 12);
    E(g, 28, 33.5, r * 1.3, r * 0.9).stroke({ width: 0.9, color: 0xffffff, alpha: 0.5 - r * 0.03 });
  }
  // placa bañándose (va y viene), con el cobre a la vista
  const ox = [-3, 0, 3, 0][f], sink = f === 2;
  const px = 18 + ox, py = 25;
  R(g, px, py, 20, 16, 1.5).fill(dg(0x9a7a4a, 0x6a4f2a)).stroke(ink(1.3));
  for (const [x1, y1, x2, y2] of [[2, 4, 12, 4], [12, 4, 16, 8], [2, 10, 8, 10], [8, 10, 8, 14], [14, 12, 18, 12]]) L(g, px + x1, py + y1, px + x2, py + y2, 1.1, 0xf2d67e);
  if (sink) R(g, px, py, 20, 16, 1.5).fill({ color: 0xc8ff5a, alpha: 0.45 });
  for (let k = 0; k < 4; k++) O(g, px + 3 + k * 5, py + 18 + ((k + f) % 2), 1).fill({ color: 0xffffff, alpha: 0.75 });
  // brazo con pinza que sujeta la placa por el borde
  shadowO(s, 55, 9, 6, 3);
  B(g, 55, 9, 46, 18 + (f % 2), 5, C.MINT, C.MINT_L);
  B(g, 46, 18 + (f % 2), px + 10, py, 3.6, C.MINT, C.MINT_L);
  O(g, 55, 9, 6).fill(ball(C.MINT_L, C.MINT_D)).stroke(ink(1.7));
  O(g, 46, 18 + (f % 2), 2.6).fill(C.METAL_DD).stroke(ink(1));
  R(g, px + 7, py - 2, 6, 3.5, 1).fill(C.METAL_L).stroke(ink(1));
  // garrafa de ácido
  shadowR(s, 52, 22, 8, 14, 2.5, 2);
  R(g, 52, 22, 8, 14, 2.5).fill(dg(0xfff6c0, 0xd8c070)).stroke(ink(1.3));
  O(g, 56, 25, 1.8).fill(0xd9534f).stroke(ink(0.8));
  P(g, [56, 29, 58.6, 33.5, 53.4, 33.5]).fill(C.BUTTER).stroke(ink(0.8));
  // chips esperando y rayas de aviso
  R(g, 52, 40, 8, 12, 2).fill(C.RUST_D).stroke(ink(1.2));
  for (const y of [42, 46.5]) chip(g, 53.5, y, 5, 3);
  hazard(g, 7, Y(54.5), 42, 4);
  bolts(g, [[9, 9], [30, 9]], 1.8);
  lamp(g, 40, 9, f % 2 === 0, 0xd8ff5a, 0x4a5a1a);
}

// ANDROIDERA: camilla con un androide al que montan entre dos brazos
function androidera(g, s, f) {
  base(g, s, 0xf4f6fa, 0xa8aebc);
  R(g, 5.5, 5.5, 4, 53, 2).fill(C.TEAL);
  // camilla
  shadowR(s, 13, 4, 38, 56, 6, 2);
  R(g, 13, 4, 38, 56, 6).fill(dg(0x9aa6b4, 0x5e6876)).stroke(ink(1.7));
  for (let y = 12; y < 58; y += 8) L(g, 14, y, 50, y, 0.8, 0x4e5866, 0.6);
  const eyes = f >= 2;
  // piernas
  for (const x of [24.5, 33.5]) { shadowR(s, x, 42, 6, 15, 3, 2); R(g, x, 42, 6, 15, 3).fill(cyl(C.METAL_D, C.METAL, C.METAL_L, false)).stroke(ink(1.3)); O(g, x + 3, 49, 1.6).fill(C.METAL_DD); }
  // brazos a los lados
  for (const x of [15.5, 43.5]) { R(g, x, 25, 5, 20, 2.5).fill(cyl(C.METAL_D, C.METAL, C.METAL_L, false)).stroke(ink(1.3)); O(g, x + 2.5, 45.5, 2.6).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(1)); }
  // torso con trampilla abierta (circuito) hasta que se cierra
  shadowR(s, 21, 22, 22, 22, 5, 2);
  R(g, 21, 22, 22, 22, 5).fill(dg(0xe8ecf2, 0x9aa2b0)).stroke(ink(1.6));
  if (f < 3) { R(g, 25, 26, 14, 11, 1.5).fill(0x4f9a5a).stroke(ink(1)); L(g, 27, 29, 33, 29, 0.9, 0xf2d67e); L(g, 33, 29, 36, 33, 0.9, 0xf2d67e); chip(g, 28, 31, 4, 3); }
  else { R(g, 25, 26, 14, 11, 1.5).fill(0xc8ced8).stroke(ink(1)); bolts(g, [[27, 28], [37, 28], [27, 35], [37, 35]], 1); }
  O(g, 32, 40.5, 1.8).fill(f >= 2 ? 0xff8fa0 : 0x7a4a52);
  // hombros
  for (const x of [20, 44]) O(g, x, 25.5, 4).fill(ball(C.METAL_L, C.STEEL_D)).stroke(ink(1.3));
  // cabeza redonda con visor
  shadowO(s, 32, 13.5, 7.5, 2);
  R(g, 30, 18, 4, 5, 1).fill(C.METAL_DD);
  O(g, 32, 13.5, 7.5).fill(ball(0xffffff, 0xa8b0bc)).stroke(ink(1.6));
  R(g, 26.5, 11.5, 11, 4.5, 2.2).fill(0x2a2d33);
  for (const x of [29.5, 34.5]) {
    if (eyes) O(g, x, 13.75, 2.6).fill({ color: 0x7fe3e0, alpha: 0.4 });
    O(g, x, 13.75, 1.2).fill(eyes ? 0xe9fffd : 0x3a5a5a);
  }
  // brazos de montaje
  const reach = [0, 1, 2, 1][f];
  const arms = [[9, 52, 22 + reach, 34 - reach], [55, 12, 40 - reach, 20 + reach * 1.5]];
  arms.forEach(([bx, by, tx, ty], i) => {
    const ex = (bx + tx) / 2 + (i ? 4 : -4), ey = (by + ty) / 2 + (i ? -2 : 3);
    shadowO(s, bx, by, 5, 3);
    B(g, bx, by, ex, ey, 4.4, C.LILAC, C.LILAC_L);
    B(g, ex, ey, tx, ty, 3.2, C.LILAC, C.LILAC_L);
    O(g, bx, by, 5).fill(ball(C.LILAC_L, C.LILAC_D)).stroke(ink(1.6));
    O(g, ex, ey, 2.4).fill(C.METAL_DD).stroke(ink(1));
    O(g, tx, ty, 1.8).fill(C.METAL_L).stroke(ink(0.9));
    if ((f + i) % 2) { O(g, tx, ty, 4).fill({ color: 0xbfe9ff, alpha: 0.5 }); for (let k = 0; k < 5; k++) { const a = k * 1.25 + f; L(g, tx, ty, tx + Math.cos(a) * 4.5, ty + Math.sin(a) * 4.5, 0.9, k % 2 ? 0xfff6c0 : 0xffb03a); } }
  });
  lamp(g, 56, 56, eyes, 0x7fe3e0, 0x245056, 2.2);
}

// ---------------------------------------------------------------------------
// PLANETA 7 (arena magnética)
// ---------------------------------------------------------------------------

// Imán de herradura (abertura hacia abajo)
function horseshoe(g, s, cx, cy, r, w) {
  s.moveTo(cx - r + 2, Y(cy) + 3).arc(cx + 2, Y(cy) + 3, r, Math.PI, TAU).stroke({ width: w, color: SHADOW, alpha: 0.4 });
  const arcStroke = (ww, color) => {
    g.moveTo(cx - r, Y(cy + r * 0.9)).lineTo(cx - r, Y(cy)).arc(cx, Y(cy), r, Math.PI, TAU).lineTo(cx + r, Y(cy + r * 0.9));
    g.stroke({ width: ww, color, cap: 'butt', join: 'round' });
  };
  arcStroke(w + 3.4, INK);
  arcStroke(w, 0xe85a5a);
  g.moveTo(cx - r - w * 0.25, Y(cy)).arc(cx, Y(cy), r + w * 0.25, Math.PI, Math.PI * 1.6).stroke({ width: 1.4, color: 0xffb0a8, alpha: 0.9 });
  for (const x of [cx - r, cx + r]) R(g, x - w / 2 - 0.4, cy + r * 0.9, w + 0.8, 5, 1).fill(cyl(C.METAL_D, C.METAL, 0xffffff, false)).stroke(ink(1.4));
}

// IMANTADOR: compactadora con limaduras alineadas y un imán de herradura
function imantador(g, s, f) {
  base(g, s, 0xe8d4a8, 0xa48858);
  // lecho de compactación
  R(g, 13, 7, 38, 50, 4).fill(dg(0x5a544a, 0x3a352e)).stroke(ink(1.6));
  // líneas de campo entre los polos (laten)
  const cx = 32, cy = 22, r = 10;
  const pulse = [0, 1, 2, 1][f];
  for (let i = 0; i < 3; i++) {
    const rr = 5 + i * 3.5 + pulse * 0.6;
    g.moveTo(cx - r, Y(cy + r * 0.9 + 5)).bezierCurveTo(cx - r, Y(cy + r + 5 + rr * 1.4), cx + r, Y(cy + r + 5 + rr * 1.4), cx + r, Y(cy + r * 0.9 + 5));
    g.stroke({ width: 1, color: 0x9fd8ff, alpha: 0.55 - i * 0.12 + (f === 2 ? 0.15 : 0) });
  }
  // limaduras de hierro alineadas con el campo
  for (let i = 0; i < 3; i++) {
    const rr = 5 + i * 3.5;
    for (let t = 0.12; t < 0.9; t += 0.13) {
      const u = 1 - t;
      const p = (a, b, c2, d) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c2 + t * t * t * d;
      const yA = cy + r * 0.9 + 5, yB = cy + r + 5 + rr * 1.4;
      const x = p(cx - r, cx - r, cx + r, cx + r), y = p(yA, yB, yB, yA);
      const t2 = t + 0.03, u2 = 1 - t2;
      const p2 = (a, b, c2, d) => u2 * u2 * u2 * a + 3 * u2 * u2 * t2 * b + 3 * u2 * t2 * t2 * c2 + t2 * t2 * t2 * d;
      const x2 = p2(cx - r, cx - r, cx + r, cx + r), y2 = p2(yA, yB, yB, yA);
      const k = 2.2 / Math.hypot(x2 - x, y2 - y);
      L(g, x - (x2 - x) * k * 0.5, y - (y2 - y) * k * 0.5, x + (x2 - x) * k * 0.5, y + (y2 - y) * k * 0.5, 1.1, 0x2a2622);
      L(g, x - (x2 - x) * k * 0.3, y - (y2 - y) * k * 0.3, x, y, 0.6, 0xb8b0a4);
    }
  }
  // montoncitos de arena en las esquinas del lecho
  for (const [x, y] of [[18, 12], [46, 12], [18, 52], [46, 52]]) { O(g, x, y, 3.4).fill(rgrad(0xd8c49a, 0x8a7a5a)).stroke({ width: 0.8, color: INK, alpha: 0.7 }); }
  // imán de herradura
  horseshoe(g, s, cx, cy, r, 6);
  // chispas en los polos
  if (f % 2) for (const px of [cx - r, cx + r]) for (let k = 0; k < 4; k++) { const a = Math.PI * 0.25 + k * 0.5 + f * 0.3; L(g, px, cy + r * 0.9 + 5.5, px + Math.cos(a) * 4.5, cy + r * 0.9 + 5.5 + Math.sin(a) * 4.5, 1, 0xd8f4ff); }
  // pistones laterales que compactan
  const push = [0, 2, 4, 2][f];
  for (const [side, x0] of [[-1, 4], [1, 51]]) {
    const w = 9;
    shadowR(s, x0, 26, w, 14, 3, 3);
    B(g, side < 0 ? x0 + w : x0, 33, side < 0 ? x0 + w + push : x0 - push, 33, 3, C.METAL_L);
    R(g, side < 0 ? x0 + w + push - 1 : x0 - push - 2, 28, 3, 10, 1).fill(C.METAL_DD).stroke(ink(1));
    R(g, x0, 26, w, 14, 3).fill(dg(C.STEEL_L, C.STEEL_D)).stroke(ink(1.6));
    bolt(g, x0 + w / 2, Y(30), 1.4);
    bolt(g, x0 + w / 2, Y(36), 1.4);
  }
  hazard(g, 4, Y(46), 9, 11, 3.5);
  hazard(g, 51, Y(46), 9, 11, 3.5);
  lamp(g, 8.5, 9, f === 2, 0x9fd8ff, 0x2a4a6a, 2.4);
  lamp(g, 55.5, 9, f === 2, 0x9fd8ff, 0x2a4a6a, 2.4);
}

// ELECTROIMANES: torno que bobina alambre naranja alrededor del núcleo
function electroimanes(g, s, f) {
  base(g, s, 0xaee0a4, 0x548e4f);
  // carrete de alambre y guía con su carro
  const sx = 20, sy = 11;
  shadowO(s, sx, sy, 7.5, 3);
  O(g, sx, sy, 7.5).fill(C.METAL_D).stroke(ink(1.6));
  for (let rr = 6; rr > 2.5; rr -= 1.3) O(g, sx, sy, rr).stroke({ width: 1.1, color: rr % 2.6 > 1.3 ? 0xffc690 : 0xe8945a });
  const sa = -f * (Math.PI / 4);
  L(g, sx, sy, sx + Math.cos(sa) * 6, sy + Math.sin(sa) * 6, 1.3, C.METAL_DD);
  O(g, sx, sy, 1.8).fill(INK);
  R(g, 6, 19, 52, 3.5, 1.5).fill(C.METAL_D).stroke(ink(1.1));
  const gx = [28, 33, 38, 43][f];
  L(g, sx + 5, sy + 4, gx, 20.5, 1.2, 0xe8945a);
  L(g, gx, 20.5, gx, 29, 1.2, 0xe8945a);
  R(g, gx - 3, 18, 6, 5.5, 1.5).fill(C.BUTTER).stroke(ink(1.1));
  // bancada del torno
  R(g, 6, 25, 52, 22, 3).fill(0x3e4a3a).stroke(ink(1.4));
  // cabezal motor (izquierda)
  shadowR(s, 5, 23, 13, 26, 3, 3);
  R(g, 5, 23, 13, 26, 3).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(1.7));
  for (let y = 27; y < 46; y += 3) L(g, 8, y, 15, y, 1, C.METAL_DD, 0.8);
  // contrapunto (derecha)
  shadowR(s, 49, 27, 10, 18, 3, 3);
  R(g, 49, 27, 10, 18, 3).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(1.7));
  O(g, 54, 36, 2.6).fill(ball(C.METAL_L, C.METAL_DD)).stroke(ink(1));
  // núcleo de hierro
  R(g, 17, 32.5, 33, 7, 2).fill(cyl(C.STEEL_D, C.STEEL, C.STEEL_L)).stroke(ink(1.3));
  // bobina: espiras que se mueven al girar, hasta donde está la guía
  const end = gx + 2;
  shadowR(s, 21, 29, end - 21, 14, 3, 2);
  R(g, 21, 29, end - 21, 14, 3).fill(cyl(0xb8643a, 0xe8945a, 0xffd2a8)).stroke(ink(1.5));
  for (let x = 22.5 + (f % 2) * 1.2; x < end - 0.5; x += 2.4) L(g, x, 29.8, x + 1.2, 42.2, 0.9, 0xa4552e, 0.85);
  // brillo de la bobina recién hecha
  L(g, 23, 32, end - 2, 32, 1.1, 0xffffff, 0.5);
  // caja de imanes y piloto
  shadowR(s, 7, 50, 20, 8, 2, 2);
  R(g, 7, 50, 20, 8, 2).fill(C.RUST_D).stroke(ink(1.2));
  for (const x of [11, 17, 23]) { g.moveTo(x - 2.2, Y(56)).lineTo(x - 2.2, Y(53.5)).arc(x, Y(53.5), 2.2, Math.PI, TAU).lineTo(x + 2.2, Y(56)).stroke({ width: 1.6, color: 0xe85a5a }); }
  patch(g, 32, 49, 14, 8, C.LILAC_L);
  lamp(g, 53, 53, f % 2 === 0, 0xffb84a, 0x7a4a22);
  bolts(g, [[50, 9], [56, 9]], 1.8);
}

// AERODESLIZADORES: hangar con un vehículo flotante que sube y baja
function aerodeslizadores(g, s, f) {
  base(g, s, 0x8cc4d4, 0x3f7488);
  // suelo del hangar
  for (const [x, y] of [[5, 5], [51, 5], [5, 51], [51, 51]]) hazard(g, x, Y(y), 8, 8, 3);
  // bobinas de levitación en los laterales
  for (const y of [18, 46]) for (const x of [7.5, 56.5]) {
    O(g, x, y, 3.6 + (f % 2) * 0.6).fill({ color: 0x9ff7ff, alpha: 0.35 });
    O(g, x, y, 2.6).fill(rgrad(0xe9fffd, 0x2a8a98)).stroke(ink(1));
  }
  // aura que late bajo el vehículo
  const h = [4, 6, 8, 6][f], k = [1, 1.02, 1.04, 1.02][f];
  O(g, 32, 33, 26).fill({ color: 0x9ff7ff, alpha: 0.12 + f * 0.04 });
  s.roundRect(11 + h * 0.6, Y(10) + h, 42, 46, 20).fill({ color: SHADOW, alpha: 0.42 - f * 0.04 });
  // falda de goma
  const W = 42 * k, H = 46 * k, x0 = 32 - W / 2, y0 = 32.5 - H / 2;
  R(g, x0 - 2.5, y0 - 2.5, W + 5, H + 5, 22 * k).stroke({ width: 2 + f * 0.8, color: 0x9ff7ff, alpha: 0.35 + (f % 2) * 0.2 });
  R(g, x0, y0, W, H, 20 * k).fill(0x2e3036).stroke(ink(2));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    L(g, 32 + Math.cos(a) * W * 0.4, 32.5 + Math.sin(a) * H * 0.4, 32 + Math.cos(a) * W * 0.47, 32.5 + Math.sin(a) * H * 0.47, 1, 0x4a4d55);
  }
  // casco
  R(g, x0 + 4, y0 + 4, W - 8, H - 8, 16 * k).fill(dg(0xffe0a8, 0xe0a050)).stroke(ink(1.7));
  // cabina de cristal (delante)
  E(g, 32, y0 + 11, 8 * k, 4.5 * k).fill(rgrad(0xe9fffd, 0x3f8a99, 0.35, 0.3)).stroke(ink(1.3));
  L(g, 28.5, y0 + 9.5, 31, y0 + 8.5, 1.2, 0xffffff, 0.9);
  // panel solar encima
  const pw = 20 * k, ph = 13 * k, pX = 32 - pw / 2, pY = 30 - ph / 2;
  R(g, pX, pY, pw, ph, 1.5).fill(C.METAL_L).stroke(ink(1.3));
  R(g, pX + 1.5, pY + 1.5, pw - 3, ph - 3, 1).fill(grad([[0, 0x4a6fa8], [1, 0x1f3560]], 0, 0, 1, 1));
  for (let i = 1; i < 4; i++) L(g, pX + 1.5 + i * (pw - 3) / 4, pY + 1.5, pX + 1.5 + i * (pw - 3) / 4, pY + ph - 1.5, 0.8, 0x9fc3ff, 0.6);
  L(g, pX + 1.5, pY + ph / 2, pX + pw - 1.5, pY + ph / 2, 0.8, 0x9fc3ff, 0.6);
  // ventiladores traseros que giran
  for (const fx of [25, 39]) {
    const fy = y0 + H - 10;
    O(g, fx, fy, 5.4).fill(C.METAL_DD).stroke(ink(1.3));
    for (let b = 0; b < 3; b++) {
      const a = f * (Math.PI / 6) * (fx < 32 ? 1 : -1) + (b / 3) * TAU;
      E(g, fx + Math.cos(a) * 2.5, fy + Math.sin(a) * 2.5, 2.4, 1.2).fill(C.METAL_L);
    }
    O(g, fx, fy, 1.3).fill(INK);
  }
}

// ---------------------------------------------------------------------------
// PLANETA 8 (hielo azul)
// ---------------------------------------------------------------------------

// Escarcha: copitos blancos irregulares
function frost(g, pts, a = 0.8) {
  for (const [x, y, r] of pts) {
    O(g, x, y, r).fill({ color: 0xffffff, alpha: a });
    O(g, x + r * 0.8, y + r * 0.3, r * 0.6).fill({ color: 0xffffff, alpha: a * 0.8 });
  }
}
// Bloque de hielo visto desde arriba
function iceCube(g, s, x, y, w, rot) {
  const c = Math.cos(rot), sn = Math.sin(rot), hw = w / 2;
  const pts = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]].flatMap(([a, b]) => [x + a * c - b * sn, Y(y) + a * sn + b * c]);
  s.poly(pts.map((v, i) => v + (i % 2 ? 2.5 : 1.5))).fill({ color: SHADOW, alpha: 0.35 });
  g.poly(pts).fill(dg(0xe6f8ff, 0x6fb4e0)).stroke(ink(1.2));
  line(g, pts[0] + 1.5, pts[1] + 1.5, pts[2] - 1.5 * c, pts[3] + 1.5, 1.2, 0xffffff, 0.85);
}

// CONGELADOR: tolva de bloques de hielo, trituradora de cono y ventilador
function congelador(g, s, f) {
  base(g, s, 0xdcf2fc, 0x86b8d8);
  // tolva con bloques de hielo
  shadowR(s, 6, 5, 26, 21, 4, 3);
  R(g, 6, 5, 26, 21, 4).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(1.8));
  R(g, 9, 8, 20, 15, 3).fill(grad([[0, 0x4a5a66], [1, 0x1f2a33]]));
  iceCube(g, s, 15, 14 + (f % 2), 7, 0.3 + f * 0.15);
  iceCube(g, s, 23, 16 - (f % 2), 6, -0.2 - f * 0.12);
  // trituradora de cono: cuenco con cuchillas que giran
  const cx = 21, cy = 41;
  shadowO(s, cx, cy, 15, 4);
  O(g, cx, cy, 15).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(2));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; bolt(g, cx + Math.cos(a) * 12.8, Y(cy) + Math.sin(a) * 12.8, 1.3); }
  O(g, cx, cy, 10.5).fill(rgrad(0xf4fbff, 0x8ec6e6)).stroke(ink(1.4));
  for (let i = 0; i < 9; i++) { const a = i * 2.3 + f * 0.9; O(g, cx + Math.cos(a) * (3 + (i % 3) * 2.5), cy + Math.sin(a) * (3 + (i % 3) * 2.5), 1.1).fill(0xffffff).stroke({ width: 0.5, color: 0x4f8ab0 }); }
  const rot = f * (Math.PI / 6);
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * TAU;
    P(g, [cx + Math.cos(a - 0.25) * 2.5, cy + Math.sin(a - 0.25) * 2.5, cx + Math.cos(a + 0.12) * 9.5, cy + Math.sin(a + 0.12) * 9.5, cx + Math.cos(a + 0.35) * 2.5, cy + Math.sin(a + 0.35) * 2.5]).fill(C.METAL_L).stroke(ink(1));
  }
  O(g, cx, cy, 2.6).fill(C.METAL_DD).stroke(ink(1));
  // depósito de refrigerante azul
  shadowO(s, 47, 13, 8, 3);
  O(g, 47, 13, 8).fill(ball(C.METAL_L, C.METAL_D)).stroke(ink(1.7));
  O(g, 47, 13, 5.2).fill(rgrad(0xa8e8ff, 0x2a78c8)).stroke(ink(1));
  O(g, 45.5 + f * 0.8, 11.5, 1.2).fill({ color: 0xffffff, alpha: 0.8 });
  pipe(g, [34, 41, 40, 41, 40, 24, 44, 20], 2.8, C.METAL_D, C.METAL_L);
  // ventilador con rejilla
  const fx = 47, fy = 43;
  shadowO(s, fx, fy, 11, 3);
  O(g, fx, fy, 11).fill(C.METAL_D).stroke(ink(1.8));
  O(g, fx, fy, 8.8).fill(0x2a323a);
  const fr = f * (Math.PI / 10);
  for (let b = 0; b < 5; b++) {
    const a = fr + (b / 5) * TAU;
    E(g, fx + Math.cos(a) * 4.5, fy + Math.sin(a) * 4.5, 4, 2).fill(0xbfe4f8);
    g.ellipse(fx + Math.cos(a) * 4.5, Y(fy) + Math.sin(a) * 4.5, 4, 2).stroke({ width: 0.7, color: INK, alpha: 0.6 });
  }
  for (let rr = 3; rr < 9; rr += 2.5) O(g, fx, fy, rr).stroke({ width: 0.8, color: C.METAL_L, alpha: 0.75 });
  L(g, fx - 9, fy, fx + 9, fy, 0.9, C.METAL_L, 0.75);
  L(g, fx, fy - 9, fx, fy + 9, 0.9, C.METAL_L, 0.75);
  O(g, fx, fy, 2).fill(C.METAL_L).stroke(ink(0.9));
  // escarcha y vaho
  frost(g, [[6, 31, 1.6], [5.5, 55, 2], [58, 30, 1.8], [36, 58, 1.6], [58, 57, 1.4]]);
  puff(g, 34 + f * 0.8, 29 - f, 2.2 + f * 0.4, 0.5 - f * 0.08, 0xe8f8ff);
}

// NEVERERÍA: montaje de una nevera vista desde arriba y tubos de refrigerante
function nevereria(g, s, f) {
  base(g, s, 0xd0daf8, 0x7484bc);
  // bombonas de refrigerante
  for (const y of [13, 29]) {
    shadowO(s, 9.5, y, 5.5, 2);
    O(g, 9.5, y, 5.5).fill(ball(0xbfeaff, 0x2a78c8)).stroke(ink(1.5));
    O(g, 9.5, y, 2).fill(C.METAL_DD).stroke(ink(0.8));
  }
  // manguera con el refrigerante circulando
  const hose = [9.5, 34.5, 9.5, 46, 14, 50, 19, 46];
  pipe(g, hose, 3, 0x6aa8e8, 0xd8f0ff);
  pipe(g, [9.5, 18.5, 9.5, 23.5], 2.4, 0x6aa8e8, 0xd8f0ff);
  for (let k = 0; k < 2; k++) { const t = (f + k * 2) / 4; O(g, 9.5 + (t > 0.6 ? (t - 0.6) * 20 : 0), 36 + Math.min(t, 0.6) * 18, 1.3).fill(0xffffff); }
  // nevera tumbada boca arriba: puerta del congelador y de la nevera, tiradores
  shadowR(s, 18, 6, 26, 52, 4, 3);
  R(g, 18, 6, 26, 52, 4).fill(dg(0xffffff, 0xc8ccd4)).stroke(ink(1.9));
  L(g, 19, 22, 43, 22, 1.6, INK);
  R(g, 20, 8, 3, 46, 1.5).fill({ color: 0xffffff, alpha: 0.7 });
  for (const [y1, h] of [[10, 9], [26, 18]]) { R(g, 38, y1, 3, h, 1.5).fill(cyl(C.METAL_D, C.METAL, C.METAL_L, false)).stroke(ink(1.1)); }
  R(g, 25, 49, 12, 4, 1.5).fill(C.ROSE).stroke(ink(1));
  L(g, 27, 51, 35, 51, 1, 0xffffff);
  // pantallita de temperatura en la puerta
  R(g, 25, 12, 9, 6, 1.5).fill(0x2a3a4a).stroke(ink(1));
  R(g, 26.5, 13.5, 2 + f * 1.4, 3, 0.8).fill(0x8fe8ff);
  // escarcha que sale por la junta
  if (f >= 2) frost(g, [[19.5, 24, 1.3], [42.5, 21, 1.2]], 0.7);
  // brazo que atornilla el tirador
  const ty = [27, 33, 39, 33][f];
  shadowO(s, 55, 54, 6, 3);
  B(g, 55, 54, 53, 40, 5, C.BUTTER, C.BUTTER_L);
  B(g, 53, 40, 41.5, ty, 3.6, C.BUTTER, C.BUTTER_L);
  O(g, 55, 54, 6).fill(ball(C.BUTTER_L, C.BUTTER_D)).stroke(ink(1.7));
  O(g, 53, 40, 2.6).fill(C.METAL_DD).stroke(ink(1));
  O(g, 41.5, ty, 2.4).fill(C.METAL_DD).stroke(ink(1));
  if (f % 2) for (let k = 0; k < 5; k++) { const a = k * 1.25 + f; L(g, 41.5, ty, 41.5 + Math.cos(a) * 4.5, ty + Math.sin(a) * 4.5, 0.9, k % 2 ? 0xfff6c0 : 0xffb03a); }
  // caja de carcasas
  shadowR(s, 47, 5, 12, 14, 2, 2);
  R(g, 47, 5, 12, 14, 2).fill(C.RUST_D).stroke(ink(1.2));
  R(g, 49, 7, 8, 4, 1).fill(C.METAL_L).stroke(ink(0.8));
  R(g, 49, 12.5, 8, 4, 1).fill(C.METAL).stroke(ink(0.8));
  lamp(g, 53, 26, f % 2 === 0, 0x8fe8ff, 0x245066, 2.2);
  bolts(g, [[9, 56], [52, 33]], 1.6);
}

// CRIOGENIA: cápsula ovalada de cristal escarchado con luces y vapor frío
function criogenia(g, s, f) {
  base(g, s, 0x5a6c96, 0x283250);
  for (let y = 10; y < 58; y += 8) L(g, 5, y, 59, y, 0.8, 0x1e2640, 0.6);
  // unidad de frío (izquierda) y tubos
  shadowR(s, 5, 6, 8, 52, 3, 2);
  R(g, 5, 6, 8, 52, 3).fill(dg(C.METAL_L, C.METAL_D)).stroke(ink(1.5));
  for (let y = 10; y < 55; y += 3) L(g, 7, y, 11, y, 1, C.METAL_DD, 0.8);
  for (const y of [18, 46]) pipe(g, [12, y, 17, y], 2.6, 0x6aa8e8, 0xd8f0ff);
  // cápsula: armazón metálico y cristal escarchado
  const cx = 30, cy = 32;
  shadowR(s, 15, 4, 30, 56, 15, 4);
  R(g, 15, 4, 30, 56, 15).fill(dg(C.METAL_L, C.STEEL_D)).stroke(ink(2.1));
  for (const y of [8, 56]) bolt(g, cx, Y(y), 1.6);
  E(g, cx, cy, 11.5, 23).fill(rgrad(0xffffff, 0x7ec8e8, 0.4, 0.35)).stroke(ink(1.5));
  // lo que hay dentro, borroso tras la escarcha
  R(g, cx - 5.5, cy - 12, 11, 24, 4).fill({ color: 0x3a6a9a, alpha: 0.35 });
  O(g, cx, cy - 15, 3.5).fill({ color: 0x3a6a9a, alpha: 0.3 });
  // escarcha y reflejo del cristal
  frost(g, [[cx - 7, cy + 14, 2], [cx + 6, cy + 17, 1.6], [cx - 8, cy - 10, 1.4], [cx + 7, cy - 16, 1.8], [cx + 8, cy + 4, 1.2]], 0.75);
  g.moveTo(cx - 7, Y(cy - 12)).bezierCurveTo(cx - 9, Y(cy - 4), cx - 9, Y(cy + 4), cx - 7, Y(cy + 10)).stroke({ width: 2, color: 0xffffff, alpha: 0.85, cap: 'round' });
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + f * 0.6; const x = cx + Math.cos(a) * 6, y = cy + Math.sin(a) * 14; L(g, x - 1.5, y, x + 1.5, y, 0.8, 0xffffff); L(g, x, y - 1.5, x, y + 1.5, 0.8, 0xffffff); }
  // panel de luces de estado (derecha)
  shadowR(s, 48, 6, 11, 52, 3, 2);
  R(g, 48, 6, 11, 52, 3).fill(0x3a4258).stroke(ink(1.5));
  const colors = [0x7dff9a, 0x8fe8ff, 0xffd27a, 0xff8fa0];
  for (let i = 0; i < 4; i++) lamp(g, 53.5, 12 + i * 7, (i + f) % 4 < 2, colors[i], 0x2a3040, 2);
  const [, sy0] = screen(g, s, 49.5, 40, 8, 15, 0x8fe8ff, 0x1f4a6a);
  R(g, 51.5, sy0 + 11 - f * 2.5, 4, 1.4 + f * 2.5, 0.6).fill(0xe9fffd);
  // vapor frío que se derrama por los bordes de la cápsula
  const vap = [[[16, 52], [44, 12]], [[14, 48], [45, 18]], [[17, 56], [43, 9]], [[15, 50], [46, 15]]][f];
  for (const [x, y] of vap) puff(g, x, y, 3 + (f % 2), 0.5, 0xe8f8ff);
}

export const DRAW2 = {
  trituradora, vulcanizadora, patinetera,
  desguazadora, grabadora, consolera,
  fermentador, bateriera, dronera,
  destileria, grabadoacido, androidera,
  imantador, electroimanes, aerodeslizadores,
  congelador, nevereria, criogenia,
};
