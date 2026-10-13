// Obstáculos del mapa: casillas donde no se puede construir ni pasar cintas.
// Se hornean en el suelo, una pieza de 64×64 por casilla. Varias casillas juntas
// forman un grupo (pedregal, charca...), así que cada pieza llena casi toda la
// casilla, tiene volumen (sombra, borde oscuro abajo a la derecha) y contorno
// marcado. Todo en planta pura, visto desde arriba del todo.
//
// OBSTACLE_KEYS[planeta] = las 3 claves de textura de ese planeta.

import { Graphics } from '../../vendor/pixi.min.mjs';
import { C, tex, grad, rgrad, line, rivet, rustStain, prng } from './common.js';

const { INK, SHADOW } = C;
const S = 64;

// ---- utilidades ----
const mix = (a, b, t) => {
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};
const clamp = (v, lo = 1.5, hi = S - 1.5) => Math.max(lo, Math.min(hi, v));

// Puntos de una mancha irregular alrededor de (cx, cy)
function blobPts(rnd, cx, cy, rx, ry, n = 9, jit = 0.16) {
  const off = rnd() * Math.PI * 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    const k = 1 - jit + rnd() * jit * 2;
    pts.push([clamp(cx + Math.cos(a) * rx * k), clamp(cy + Math.sin(a) * ry * k)]);
  }
  return pts;
}
// Curva cerrada y suave que pasa por los puntos medios (formas redondeadas)
function smooth(g, pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  g.closePath();
  return g;
}
const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
const scalePts = (pts, k, dx = 0, dy = 0) => {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);
};
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
// Punto rotado alrededor de (cx, cy)
const R = (cx, cy, a) => (x, y) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];

// Sombra arrojada (abajo a la derecha, difuminada por tex)
const dropShadow = (s, pts, color = SHADOW, a = 0.42) => smooth(s, shift(scalePts(pts, 0.97), 2, 4)).fill({ color, alpha: a });

// Roca vista desde arriba: borde oscuro (da altura), cara de arriba con degradado,
// brillo y grietas. pal = [claro, medio, oscuro].
function rock(g, s, rnd, cx, cy, rx, ry, pal, o = {}) {
  const pts = blobPts(rnd, cx, cy, rx, ry, o.n ?? 9, o.jit ?? 0.16);
  dropShadow(s, pts, o.shadow, o.shadowA);
  smooth(g, pts).fill(pal[2]).stroke({ width: 2.4, color: INK });
  const top = scalePts(pts, 0.84, -1.5, -2.5);
  smooth(g, top).fill(rgrad(pal[0], pal[1], 0.36, 0.3));
  smooth(g, scalePts(pts, 0.42, -rx * 0.22, -ry * 0.3)).fill({ color: 0xffffff, alpha: 0.2 });
  const [tx, ty] = centroid(top);
  for (let i = 0; i < (o.cracks ?? 2); i++) {
    const a = rnd() * Math.PI * 2, r0 = 0.15 + rnd() * 0.2, r1 = 0.55 + rnd() * 0.2;
    const x0 = tx + Math.cos(a) * rx * r0, y0 = ty + Math.sin(a) * ry * r0;
    const xm = tx + Math.cos(a + 0.25) * rx * (r0 + r1) / 2, ym = ty + Math.sin(a + 0.25) * ry * (r0 + r1) / 2;
    const x1 = tx + Math.cos(a) * rx * r1, y1 = ty + Math.sin(a) * ry * r1;
    g.moveTo(x0, y0).lineTo(xm, ym).lineTo(x1, y1).stroke({ width: 1.4, color: INK, alpha: 0.55, cap: 'round', join: 'round' });
  }
  return { pts, top, cx: tx, cy: ty };
}

// Parche de musgo (encima, hacia el norte de la roca)
function moss(g, rnd, x, y, r, cols = [0x9fd86a, 0x5f9e3a, 0xd8f5a0]) {
  const pts = blobPts(rnd, x, y, r, r * 0.75, 7, 0.3);
  smooth(g, shift(pts, 0, 1.2)).fill(cols[1]);
  smooth(g, pts).fill(cols[0]).stroke({ width: 1.2, color: INK, alpha: 0.6 });
  for (let i = 0; i < 3; i++) g.circle(x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r * 0.6, 1 + rnd()).fill(cols[2]);
}

// Musgo fosforito (brilla en la capa de sombra)
function glowMoss(g, s, blobs) {
  for (const [x, y, r] of blobs) s.circle(x, y, r + 5).fill({ color: 0xc6ff6a, alpha: 0.5 });
  for (const [x, y, r] of blobs) g.circle(x, y + 1.4, r).fill(0x2f7a24).stroke({ width: 1.6, color: INK });
  for (const [x, y, r] of blobs) g.circle(x, y, r).fill(rgrad(0xf4ffc8, 0x8fe83a, 0.4, 0.35));
  for (const [x, y, r] of blobs) g.circle(x - r * 0.3, y - r * 0.35, Math.max(1, r * 0.18)).fill(0xffffff);
}

// Cristal hexagonal visto desde arriba: pirámide de 6 caras, luz arriba a la izquierda
function prism(g, cx, cy, r, rot, light, dark, tip = [0, 0]) {
  const P = (i) => [cx + Math.cos(rot + (i * Math.PI) / 3) * r, cy + Math.sin(rot + (i * Math.PI) / 3) * r];
  const ax = cx + tip[0], ay = cy + tip[1];
  for (let i = 0; i < 6; i++) {
    const a = rot + ((i + 0.5) * Math.PI) / 3;
    const lit = (Math.cos(a) * -0.6 + Math.sin(a) * -0.8 + 1) / 2;
    g.poly([ax, ay, ...P(i), ...P(i + 1)]).fill(mix(dark, light, lit));
  }
  for (let i = 0; i < 6; i++) line(g, ax, ay, ...P(i), 0.9, INK, 0.45);
  g.poly([0, 1, 2, 3, 4, 5].flatMap(P)).stroke({ width: 2, color: INK, join: 'round' });
  line(g, ax - r * 0.15, ay - r * 0.2, ...P(4).map((v, k) => v * 0.6 + (k ? ay : ax) * 0.4), 1.2, 0xffffff, 0.9);
}

// Neumático visto desde arriba (anillo con dibujo); el agujero deja ver lo de abajo
function tireTop(g, x, y, r, hole = 0x15130f, o = {}) {
  g.circle(x, y, r).fill(0x2a2725).stroke({ width: 2.2, color: INK });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    line(g, x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84, x + Math.cos(a + 0.09) * r * 0.98, y + Math.sin(a + 0.09) * r * 0.98, 1.6, 0x141210);
  }
  g.circle(x, y, r * 0.78).fill(rgrad(0x7a746d, 0x3a3633, 0.38, 0.32)).stroke({ width: 1.2, color: INK, alpha: 0.7 });
  if (o.stripe) g.circle(x, y, r * 0.66).stroke({ width: 1.3, color: o.stripe, alpha: 0.9 });
  g.circle(x, y, r * 0.48).fill(hole).stroke({ width: 1.8, color: INK });
  // borde interior del de abajo que asoma por el agujero
  if (o.depth) g.circle(x + r * 0.06, y + r * 0.08, r * 0.36).stroke({ width: 1.4, color: 0x4a4540, alpha: 0.9 });
  g.moveTo(x + Math.cos(Math.PI * 1.05) * r * 0.88, y + Math.sin(Math.PI * 1.05) * r * 0.88);
  g.arc(x, y, r * 0.88, Math.PI * 1.05, Math.PI * 1.45).stroke({ width: 1.6, color: 0xffffff, alpha: 0.28, cap: 'round' });
}

// Rectángulo girado como polígono
function rotRect(cx, cy, w, h, a) {
  const P = R(cx, cy, a);
  return [P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)].flat();
}

// ---- Piezas por planeta ----
const GREY = [0xe4e6dc, 0xa9ad9f, 0x6f7468];
const VIOLET = [0xd9c8f0, 0x9a82c4, 0x5e4a86];
const SAND = [0xf6e6c4, 0xd9bd8c, 0x9a7a4c];
const DARK = [0x8a8698, 0x5a5668, 0x37343f];
const SLATE = [0x9aa8b8, 0x63707f, 0x3c4652];
const ICEBLUE = 0x2a3a52;

const P0 = {
  // Roca gris grande con musgo
  a(g, s) {
    const rnd = prng(101);
    const k = rock(g, s, rnd, 31, 30, 31, 29, GREY, { cracks: 3, n: 10 });
    moss(g, rnd, k.cx - 6, k.cy - 15, 10);
    moss(g, rnd, k.cx + 13, k.cy - 9, 6);
    moss(g, rnd, k.cx - 16, k.cy + 4, 5);
  },
  // Pedregal: tres rocas juntas
  b(g, s) {
    const rnd = prng(202);
    rock(g, s, rnd, 18, 44, 18, 18, GREY);
    rock(g, s, rnd, 45, 42, 19, 20, [0xdcdccf, 0x9ea293, 0x666b5f]);
    const k = rock(g, s, rnd, 30, 18, 24, 17, GREY, { cracks: 1 });
    moss(g, rnd, k.cx - 4, k.cy - 7, 7);
    moss(g, rnd, 46, 33, 5);
  },
  // Peñasco plano y oscuro, partido en dos, con musgo
  c(g, s) {
    const rnd = prng(303);
    const SLAB = [0xcfd2c6, 0x8e9286, 0x5a5e54];
    rock(g, s, rnd, 22, 33, 20, 27, SLAB, { cracks: 2, n: 9 });
    const k = rock(g, s, rnd, 44, 31, 18, 26, [0xd9dbd0, 0x979b8f, 0x60645a], { cracks: 1, n: 9 });
    moss(g, rnd, 20, 15, 8);
    moss(g, rnd, k.cx + 3, k.cy + 12, 6);
    moss(g, rnd, 12, 46, 5);
  },
};

const P1 = {
  // Roca violácea con vetas
  a(g, s) {
    const rnd = prng(111);
    const k = rock(g, s, rnd, 31, 30, 31, 29, VIOLET, { cracks: 2, n: 10 });
    for (const [x, y, r] of [[k.cx - 10, k.cy - 8, 0.4], [k.cx + 8, k.cy + 6, -0.6]]) {
      prism(g, x, y, 5.5, r, 0xf0fdff, 0x6fc8d4);
    }
    line(g, k.cx - 18, k.cy + 10, k.cx + 2, k.cy + 16, 1.4, 0xf0e6ff, 0.6);
  },
  // Geoda gigante abierta: anillo de roca con cristales que apuntan al centro
  b(g, s) {
    const rnd = prng(222);
    const k = rock(g, s, rnd, 31, 30, 29, 28, VIOLET, { cracks: 0, jit: 0.1 });
    const cav = scalePts(k.top, 0.66, 1, 1);
    smooth(g, cav).fill(0x2c1f46).stroke({ width: 2, color: INK });
    const [cx, cy] = centroid(cav);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.2;
      const r0 = 15.5, r1 = 5 + rnd() * 5, wA = 0.22;
      const b1 = [cx + Math.cos(a - wA) * r0, cy + Math.sin(a - wA) * r0];
      const b2 = [cx + Math.cos(a + wA) * r0, cy + Math.sin(a + wA) * r0];
      const tp = [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1];
      const lit = (Math.cos(a + Math.PI) * -0.6 + Math.sin(a + Math.PI) * -0.8 + 1) / 2;
      const col = i % 3 === 0 ? [0xfbe8ff, 0xa77fe0] : [0xeafcff, 0x5fb0d0];
      g.poly([...b1, ...tp, ...b2]).fill(mix(col[1], col[0], lit)).stroke({ width: 1, color: INK, alpha: 0.7 });
    }
    g.circle(cx, cy, 4).fill({ color: 0xe8fbff, alpha: 0.9 }).stroke({ width: 1, color: INK, alpha: 0.6 });
    line(g, cx - 1.5, cy - 1.5, cx + 1, cy - 2, 1, 0xffffff);
  },
  // Cristales gigantes que salen de la roca
  c(g, s) {
    const rnd = prng(333);
    s.circle(32, 32, 26).fill({ color: 0xd8f8ff, alpha: 0.5 });
    const base = blobPts(rnd, 31, 32, 28, 26, 10, 0.12);
    dropShadow(s, base);
    smooth(g, base).fill(VIOLET[2]).stroke({ width: 2.4, color: INK });
    smooth(g, scalePts(base, 0.86, -1, -2)).fill(rgrad(VIOLET[1], VIOLET[2], 0.4, 0.35));
    prism(g, 19, 40, 11, 0.3, 0xf6e8ff, 0x8a62c8, [1, -1]);
    prism(g, 45, 42, 10, 0.1, 0xeafcff, 0x4f9fc0, [-1, -1]);
    prism(g, 44, 19, 9, 0.5, 0xf0fdff, 0x5fb0d0, [-1, 1]);
    prism(g, 29, 26, 16, 0.15, 0xf4ffff, 0x5fa8c8, [-2, -2]);
    prism(g, 16, 17, 6, 0.4, 0xfbe8ff, 0x9a72d8);
  },
};

const P2 = {
  // Montaña de neumáticos: torre enorme vista desde arriba
  a(g, s) {
    s.circle(35, 36, 29).fill({ color: SHADOW, alpha: 0.48 });
    tireTop(g, 31, 31, 30, 0x0e0d0b, { stripe: C.BUTTER, depth: true });
    g.circle(32, 32, 9).stroke({ width: 1.2, color: 0x3a3632, alpha: 0.9 });
    g.circle(33, 33, 5).fill(0x050505);
  },
  // Rocas arenosas
  b(g, s) {
    const rnd = prng(242);
    const rocks = [[20, 19, 18, 16], [46, 22, 16, 18], [32, 45, 27, 17]];
    for (const [x, y, rx, ry] of rocks) {
      const k = rock(g, s, rnd, x, y, rx, ry, SAND, { cracks: 1, n: 8, jit: 0.2 });
      // estratos de arena
      for (const dy of [-0.3, 0.15]) line(g, k.cx - rx * 0.55, k.cy + ry * dy, k.cx + rx * 0.5, k.cy + ry * dy + 2, 1.2, 0x9a7a4c, 0.6);
    }
  },
  // Pila de neumáticos tirados unos encima de otros
  c(g, s) {
    const pile = [[18, 44, 16], [46, 46, 15], [44, 18, 15], [20, 18, 14], [32, 31, 17]];
    for (const [x, y, r] of pile) s.circle(x + 3, y + 5, r).fill({ color: SHADOW, alpha: 0.45 });
    pile.forEach(([x, y, r], i) => tireTop(g, x, y, r, 0x15130f, { stripe: i === 4 ? 0xe0895b : i === 1 ? C.BUTTER : 0, depth: i === 4 }));
  },
};

const P3 = {
  // Carcasa de servidor gigante (rack visto desde arriba)
  a(g, s) {
    s.roundRect(7, 9, 55, 54, 5).fill({ color: SHADOW, alpha: 0.5 });
    g.roundRect(3, 3, 58, 57, 6).fill(0x23262c).stroke({ width: 2.4, color: INK });
    g.roundRect(5, 4, 54, 51, 5).fill(grad([[0, 0x6c7480], [1, 0x434952]], 0, 0, 1, 1));
    // rejillas de ventilación
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) g.roundRect(9 + i * 4.2, 9 + r * 13, 2.4, 10, 1).fill(0x1c1e22);
    // ventilador
    g.circle(44, 18, 10).fill(0x1c1e22).stroke({ width: 1.6, color: INK });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.moveTo(44, 18).quadraticCurveTo(44 + Math.cos(a) * 9, 18 + Math.sin(a) * 9, 44 + Math.cos(a + 0.9) * 8.5, 18 + Math.sin(a + 0.9) * 8.5).stroke({ width: 2.4, color: 0x5a616c, cap: 'round' });
    }
    g.circle(44, 18, 2.6).fill(C.STEEL_D).stroke({ width: 1, color: INK });
    for (let i = -1; i <= 1; i++) line(g, 34, 18 + i * 5, 54, 18 + i * 5, 0.8, 0x8a929e, 0.6);
    // panel con luces
    g.roundRect(8, 36, 48, 14, 2).fill(0x17191c).stroke({ width: 1.2, color: INK });
    [0x7fe36a, 0x7fe36a, 0xff6a5a, 0x7fe3e0, 0x7fe36a, C.BUTTER].forEach((c, i) => g.circle(13 + i * 4.5, 43, 1.5).fill(c));
    g.roundRect(41, 39, 12, 8, 1).fill(C.BUTTER_L).stroke({ width: 1, color: INK }); // pegatina
    line(g, 43, 42, 51, 42, 0.9, INK, 0.6); line(g, 43, 44.5, 49, 44.5, 0.9, INK, 0.6);
    for (const [x, y] of [[7, 7], [57, 7], [7, 52], [57, 52]]) rivet(g, x, y, 1.6);
    line(g, 7, 5.5, 56, 5.5, 1.3, 0xffffff, 0.35);
    // cables que salen por abajo
    for (const [x, c] of [[18, 0xe5484d], [24, 0x5fa8ff], [30, C.BUTTER]]) {
      g.moveTo(x, 56).bezierCurveTo(x, 62, x + 8, 58, x + 12, 63).stroke({ width: 4, color: INK, cap: 'round' });
      g.moveTo(x, 56).bezierCurveTo(x, 62, x + 8, 58, x + 12, 63).stroke({ width: 2.2, color: c, cap: 'round' });
    }
  },
  // Roca oscura con cables enredados
  b(g, s) {
    const rnd = prng(343);
    rock(g, s, rnd, 31, 30, 29, 27, DARK, { cracks: 2 });
    const wires = [
      [[4, 40], [20, 20], [38, 50], [60, 26], 0xe5484d],
      [[10, 10], [24, 38], [40, 12], [56, 48], 0x7fe3e0],
      [[30, 4], [22, 30], [46, 34], [36, 60], C.BUTTER],
    ];
    for (const [a, b, c, d, col] of wires) {
      g.moveTo(...a).bezierCurveTo(...b, ...c, ...d).stroke({ width: 4.6, color: INK, cap: 'round' });
      g.moveTo(...a).bezierCurveTo(...b, ...c, ...d).stroke({ width: 2.6, color: col, cap: 'round' });
    }
    g.roundRect(50, 44, 9, 8, 2).fill(0xe6e1d6).stroke({ width: 1.4, color: INK }); // enchufe
    line(g, 53, 52, 53, 55, 1.4, C.METAL_D); line(g, 56, 52, 56, 55, 1.4, C.METAL_D);
  },
  // Torre de ordenador gigante tumbada y sin tapa: se ven las tripas
  c(g, s) {
    s.roundRect(5, 7, 56, 55, 6).fill({ color: SHADOW, alpha: 0.5 });
    g.roundRect(2, 3, 60, 57, 6).fill(0x8a8068).stroke({ width: 2.4, color: INK });
    g.roundRect(4, 4, 56, 52, 5).fill(grad([[0, 0xf2e8cc], [1, 0xd2c6a4]], 0, 0, 1, 1));
    // hueco de la tapa: placa base
    g.roundRect(9, 9, 46, 42, 3).fill(0x2a2f36).stroke({ width: 1.6, color: INK });
    g.roundRect(11, 11, 42, 38, 2).fill(grad([[0, 0x5fa86a], [1, 0x2f6a3a]], 0, 0, 1, 1));
    for (const [x1, y1, x2, y2] of [[14, 44, 30, 44], [30, 44, 34, 40], [14, 14, 14, 30], [40, 46, 50, 46], [36, 14, 50, 14]]) line(g, x1, y1, x2, y2, 1, 0xd6e08a, 0.8);
    // disipador del procesador (aletas)
    g.roundRect(16, 15, 17, 17, 2).fill(C.METAL_D).stroke({ width: 1.4, color: INK });
    for (let i = 0; i < 5; i++) g.rect(18 + i * 3, 16.5, 1.6, 14).fill(C.METAL_L);
    // ventilador
    g.circle(24.5, 23.5, 5).fill(0x1c1e22).stroke({ width: 1, color: INK });
    for (let i = 0; i < 4; i++) { const an = (i / 4) * Math.PI * 2; line(g, 24.5, 23.5, 24.5 + Math.cos(an) * 4.2, 23.5 + Math.sin(an) * 4.2, 1.8, 0x5a616c); }
    // memorias
    for (let i = 0; i < 4; i++) {
      g.roundRect(38 + i * 4, 15, 2.8, 20, 0.8).fill(i % 2 ? 0x3a5fa8 : 0x2a4a8a).stroke({ width: 0.9, color: INK });
      for (let k = 0; k < 4; k++) g.rect(38.5 + i * 4, 17 + k * 4.5, 1.8, 2.2).fill(0x16181c);
    }
    // tarjeta gráfica
    g.roundRect(14, 36, 30, 7, 1.5).fill(0x3c4048).stroke({ width: 1.2, color: INK });
    g.circle(22, 39.5, 2.6).fill(0x1c1e22); g.circle(34, 39.5, 2.6).fill(0x1c1e22);
    line(g, 44, 37, 44, 42, 1.6, C.BUTTER);
    // fuente de alimentación y cables
    g.roundRect(44, 38, 9, 10, 1.5).fill(C.METAL).stroke({ width: 1.2, color: INK });
    g.moveTo(48, 38).bezierCurveTo(48, 30, 32, 34, 30, 30).stroke({ width: 3.4, color: INK, cap: 'round' });
    g.moveTo(48, 38).bezierCurveTo(48, 30, 32, 34, 30, 30).stroke({ width: 1.8, color: 0xe5484d, cap: 'round' });
    // tornillos y bisel
    for (const [x, y] of [[6.5, 6.5], [57.5, 6.5], [6.5, 53.5], [57.5, 53.5]]) rivet(g, x, y, 1.5);
    line(g, 7, 5.5, 56, 5.5, 1.3, 0xffffff, 0.5);
    rustStain(g, 52, 52, 2.6, 0.4);
  },
};

const P4 = {
  // Seta gigante luminosa (sombrero visto desde arriba)
  a(g, s) {
    const rnd = prng(454);
    s.circle(32, 32, 28).fill({ color: 0xff9ef0, alpha: 0.5 });
    const pts = blobPts(rnd, 31, 30, 27, 26, 10, 0.07);
    dropShadow(s, pts, 0x0a1a1c, 0.5);
    smooth(g, pts).fill(0x8a3f9a).stroke({ width: 2.4, color: INK });
    smooth(g, scalePts(pts, 0.86, -1, -2)).fill(rgrad(0xffd8fb, 0xd96ad8, 0.4, 0.35));
    for (const [x, y, r] of [[22, 18, 5], [40, 16, 3.5], [16, 33, 3.5], [32, 28, 6], [46, 34, 4.5], [27, 44, 4], [40, 46, 3]]) {
      s.circle(x, y, r + 3).fill({ color: 0xfff6a0, alpha: 0.5 });
      g.circle(x, y, r).fill(rgrad(0xffffff, 0xfff0a0, 0.4, 0.4)).stroke({ width: 1.2, color: INK, alpha: 0.7 });
    }
    g.moveTo(31 + Math.cos(Math.PI * 1.1) * 19, 30 + Math.sin(Math.PI * 1.1) * 19);
    g.arc(31, 30, 19, Math.PI * 1.1, Math.PI * 1.45).stroke({ width: 2.4, color: 0xffffff, alpha: 0.6, cap: 'round' });
  },
  // Corro de setas luminosas
  b(g, s) {
    const caps = [[19, 42, 15, 0x3a8fa0, 0x9ff6ff, 0x3fc8e0], [45, 44, 14, 0x4f8a2a, 0xeaffb0, 0x9fe04a], [36, 20, 17, 0x8a3f9a, 0xffd8fb, 0xd96ad8]];
    for (const [x, y, r, , , mid] of caps) s.circle(x, y, r + 4).fill({ color: mid, alpha: 0.5 });
    for (const [x, y, r] of caps) s.circle(x + 3, y + 5, r).fill({ color: 0x0a1a1c, alpha: 0.5 });
    for (const [x, y, r, dark, light, mid] of caps) {
      g.circle(x, y, r).fill(dark).stroke({ width: 2.4, color: INK });
      g.circle(x - 1, y - 1.8, r * 0.86).fill(rgrad(light, mid, 0.4, 0.35));
      for (const [dx, dy, dr] of [[-0.35, -0.3, 0.2], [0.3, 0.1, 0.16], [-0.1, 0.4, 0.13]]) g.circle(x + dx * r, y + dy * r, r * dr).fill(0xffffff).stroke({ width: 1, color: INK, alpha: 0.5 });
    }
  },
  // Roca cubierta de musgo fosforito
  c(g, s) {
    const rnd = prng(464);
    const k = rock(g, s, rnd, 31, 30, 29, 27, SLATE, { cracks: 1, shadow: 0x0a1a1c, shadowA: 0.5 });
    glowMoss(g, s, [[k.cx - 8, k.cy - 10, 9], [k.cx + 7, k.cy - 13, 6], [k.cx + 14, k.cy - 2, 5], [k.cx - 17, k.cy + 2, 5], [k.cx - 2, k.cy + 1, 4]]);
    glowMoss(g, s, [[k.cx + 8, k.cy + 13, 3.5], [k.cx - 9, k.cy + 14, 3]]);
  },
};

const P5 = {
  // Charca de lodo tóxico (plana, con borde claro)
  a(g, s) {
    s.roundRect(4, 4, 56, 56, 18).fill({ color: 0xd8ff6a, alpha: 0.35 });
    g.roundRect(1.5, 1.5, 61, 61, 20).fill(0xe0d89a).stroke({ width: 2.4, color: INK });
    g.roundRect(5, 5, 54, 54, 16).fill(grad([[0, 0x2f5a1f], [0.25, 0x5faa2a], [1, 0x9fe04a]], 0, 0, 0, 1)).stroke({ width: 1.8, color: 0x4a5a1a });
    g.roundRect(6, 5.5, 52, 6, 3).fill({ color: 0x1f3a14, alpha: 0.35 }); // borde de arriba en sombra (hundido)
    g.ellipse(24, 30, 12, 4).stroke({ width: 1.4, color: 0xd8ff8a, alpha: 0.7 });
    g.ellipse(40, 44, 9, 3).stroke({ width: 1.4, color: 0xd8ff8a, alpha: 0.6 });
    for (const [x, y, r] of [[38, 24, 3.5], [44, 28, 2], [20, 46, 2.8], [30, 38, 1.6]]) {
      g.circle(x, y, r).fill({ color: 0xd8f07a, alpha: 0.85 }).stroke({ width: 1.1, color: INK, alpha: 0.8 });
      g.circle(x - r * 0.35, y - r * 0.35, r * 0.3).fill(0xffffff);
    }
  },
  // Charca con espuma y un bidón hundido
  b(g, s) {
    s.roundRect(4, 4, 56, 56, 18).fill({ color: 0xd8ff6a, alpha: 0.35 });
    g.roundRect(1.5, 1.5, 61, 61, 22).fill(0xe0d89a).stroke({ width: 2.4, color: INK });
    g.roundRect(5, 5, 54, 54, 18).fill(grad([[0, 0x2f5a1f], [0.25, 0x5faa2a], [1, 0x9fe04a]], 0, 0, 0, 1)).stroke({ width: 1.8, color: 0x4a5a1a });
    g.roundRect(6, 5.5, 52, 6, 3).fill({ color: 0x1f3a14, alpha: 0.35 });
    for (const [x, y, r] of [[16, 20, 4], [21, 17, 3], [19, 24, 2.5], [48, 48, 3.5], [44, 51, 2.4]]) g.circle(x, y, r).fill({ color: 0xf0ffb8, alpha: 0.9 });
    // bidón medio hundido (tapa vista desde arriba)
    g.circle(38, 30, 10).fill(0x2f6b5b).stroke({ width: 2, color: INK });
    g.circle(38, 30, 8).fill(rgrad(0x9fdcca, 0x4f9e8c, 0.35, 0.3));
    g.circle(38, 30, 5.5).stroke({ width: 1.2, color: 0x2f6b5b });
    g.circle(41, 27, 1.6).fill(INK);
    rustStain(g, 34, 33, 2.5);
    g.ellipse(38, 41, 12, 3).stroke({ width: 1.4, color: 0xd8ff8a, alpha: 0.7 });
    for (const [x, y, r] of [[24, 40, 3], [28, 45, 1.8]]) {
      g.circle(x, y, r).fill({ color: 0xd8f07a, alpha: 0.85 }).stroke({ width: 1.1, color: INK, alpha: 0.8 });
      g.circle(x - r * 0.35, y - r * 0.35, r * 0.3).fill(0xffffff);
    }
  },
  // Tronco podrido tumbado (atraviesa la casilla) con setas
  c(g, s) {
    const rnd = prng(565);
    s.roundRect(3, 14, 60, 44, 18).fill({ color: SHADOW, alpha: 0.45 });
    g.roundRect(1.5, 9, 61, 44, 19).fill(0x4a3420).stroke({ width: 2.4, color: INK });
    g.roundRect(3, 10, 57, 38, 17).fill(grad([[0, 0xa88a62], [0.4, 0x8a6a46], [1, 0x5a4028]], 0, 0, 0, 1));
    for (let i = 0; i < 9; i++) {
      const y = 15 + rnd() * 30, x = 6 + rnd() * 40;
      line(g, x, y, x + 8 + rnd() * 10, y + (rnd() - 0.5) * 2, 1.4, 0x3a2614, 0.7);
    }
    // corteza caída: se ve la madera podrida
    smooth(g, blobPts(rnd, 40, 27, 9, 5, 7, 0.2)).fill(0xc9a878).stroke({ width: 1.2, color: INK, alpha: 0.7 });
    g.ellipse(22, 34, 4, 2.6).fill(0x1f140a).stroke({ width: 1, color: INK }); // agujero
    moss(g, rnd, 12, 18, 6, [0xb8c860, 0x6f7a2a, 0xe8f0a0]);
    moss(g, rnd, 50, 40, 5, [0xb8c860, 0x6f7a2a, 0xe8f0a0]);
    for (const [x, y, r] of [[30, 19, 3.5], [35, 17, 2.6], [54, 22, 3]]) {
      g.circle(x, y, r).fill(rgrad(0xfff0d8, 0xe0895b, 0.4, 0.35)).stroke({ width: 1.1, color: INK });
      g.circle(x - r * 0.3, y - r * 0.3, r * 0.25).fill(0xffffff);
    }
  },
};

const P6 = {
  // Meseta de arenisca: capas como curvas de nivel
  a(g, s) {
    const rnd = prng(676);
    const pts = blobPts(rnd, 31, 31, 29, 28, 10, 0.12);
    dropShadow(s, pts, 0x3a1a10, 0.45);
    const layers = [0x8a3a26, 0xb5573a, 0xcf7550, 0xe5976c, 0xf4bc8e];
    layers.forEach((c, i) => {
      const p = i ? scalePts(pts, 1 - i * 0.17, -i * 1.4, -i * 2) : pts;
      smooth(g, p).fill(c).stroke({ width: i ? 1.4 : 2.4, color: INK, alpha: i ? 0.6 : 1 });
    });
    const top = scalePts(pts, 0.32, -5.6, -8);
    smooth(g, scalePts(top, 0.5, -1, -1)).fill({ color: 0xffffff, alpha: 0.25 });
    for (let i = 0; i < 6; i++) g.circle(10 + rnd() * 44, 10 + rnd() * 44, 0.9).fill({ color: 0x5a2010, alpha: 0.5 });
  },
  // Dos rocas de arenisca estratificada
  b(g, s) {
    const rnd = prng(686);
    const layers = [0x8a3a26, 0xbf6242, 0xe08a62, 0xf4bc8e];
    for (const [x, y, rx, ry] of [[40, 40, 22, 21], [20, 20, 17, 16]]) {
      const pts = blobPts(rnd, x, y, rx, ry, 9, 0.14);
      dropShadow(s, pts, 0x3a1a10, 0.45);
      layers.forEach((c, i) => {
        const p = i ? scalePts(pts, 1 - i * 0.22, -i * 1.2, -i * 1.8) : pts;
        smooth(g, p).fill(c).stroke({ width: i ? 1.3 : 2.4, color: INK, alpha: i ? 0.6 : 1 });
      });
    }
  },
  // Cactus metálico (visto desde arriba: tronco y brazos remachados con pinchos)
  c(g, s) {
    const tops = [[30, 32, 15], [50, 18, 9], [12, 44, 9], [47, 49, 8]];
    const arms = [[30, 32, 50, 18], [30, 32, 12, 44], [30, 32, 47, 49]];
    for (const [x, y, r] of tops) s.circle(x + 3, y + 5, r + 1).fill({ color: 0x3a1a10, alpha: 0.45 });
    for (const [x1, y1, x2, y2] of arms) {
      line(g, x1, y1, x2, y2, 12, INK);
      line(g, x1, y1, x2, y2, 8, 0x5f8a80);
      line(g, x1, y1 - 1.5, x2, y2 - 1.5, 2, 0xb8dcd0, 0.8);
    }
    for (const [x, y, r] of tops) {
      // pinchos
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        line(g, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * (r + 3.5), y + Math.sin(a) * (r + 3.5), 1.3, INK);
      }
      // costillas: estrella de 10 puntas redondeada
      const n = 10, pts = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.88 : r;
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
      }
      g.poly(pts.flat()).fill(0x4f7a70).stroke({ width: 2.2, color: INK, join: 'round' });
      g.circle(x - 0.8, y - 1.2, r * 0.82).fill(rgrad(0xd8f0e6, 0x6fa296, 0.38, 0.32));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        line(g, x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 1, INK, 0.4);
      }
      rivet(g, x, y, Math.max(1.4, r * 0.15));
    }
    g.roundRect(22, 34, 8, 6, 1.5).fill(C.RUST).stroke({ width: 1.2, color: INK }); // parche
    rivet(g, 23.5, 35.5, 1); rivet(g, 28.5, 38.5, 1);
  },
};

const P7 = {
  // Bloque de hielo azul facetado
  a(g, s) {
    const pts = [[6, 12], [22, 3], [48, 5], [61, 20], [59, 48], [44, 61], [14, 58], [3, 40]];
    s.poly(shift(pts, 3, 5).flat()).fill({ color: ICEBLUE, alpha: 0.45 });
    g.poly(pts.flat()).fill(0x3f7fb8).stroke({ width: 2.4, color: INK, join: 'round' });
    const top = scalePts(pts, 0.82, -1.5, -2.5);
    g.poly(top.flat()).fill(grad([[0, 0xf4fcff], [0.5, 0xa8d8f4], [1, 0x6fb0e0]], 0, 0, 1, 1));
    const [cx, cy] = centroid(top);
    const ap = [cx - 3, cy - 4];
    top.forEach((p, i) => {
      const q = top[(i + 1) % top.length];
      const a = Math.atan2((p[1] + q[1]) / 2 - cy, (p[0] + q[0]) / 2 - cx);
      const lit = (Math.cos(a) * -0.6 + Math.sin(a) * -0.8 + 1) / 2;
      g.poly([...ap, ...p, ...q]).fill({ color: mix(0x5f9fd6, 0xffffff, lit), alpha: 0.55 });
      line(g, ap[0], ap[1], p[0], p[1], 1, INK, 0.3);
    });
    g.poly(top.flat()).stroke({ width: 1.2, color: 0x2f5f90, alpha: 0.6 });
    line(g, 14, 16, 30, 9, 2, 0xffffff, 0.95);
    line(g, 38, 40, 48, 50, 1.2, 0x2f5f90, 0.6);
    line(g, 44, 45, 51, 42, 1.2, 0x2f5f90, 0.6);
  },
  // Grieta de agua helada oscura que cruza la casilla de lado a lado
  // (dos grietas vecinas en horizontal se unen en una sola)
  b(g, s) {
    const rnd = prng(787);
    const top = [], bot = [];
    for (let i = 0; i <= 8; i++) {
      const x = i * 8, w = i === 0 || i === 8 ? 0 : (rnd() - 0.5) * 7;
      top.push([x, 18 + w + Math.sin(i * 1.3) * 3]);
      bot.push([x, 46 + (rnd() - 0.5) * 7 + Math.sin(i * 1.1 + 1) * 3]);
    }
    top[0][1] = top[8][1] = 19; bot[0][1] = bot[8][1] = 45;
    const outline = [...top, ...bot.slice().reverse()];
    // labio de hielo (claro) alrededor del agua
    const lip = [...top.map(([x, y]) => [x, y - 6]), ...bot.slice().reverse().map(([x, y]) => [x, y + 5])];
    g.poly(lip.flat()).fill(0xa8d8f4);
    for (const side of [top.map(([x, y]) => [x, y - 6]), bot.map(([x, y]) => [x, y + 5])]) {
      g.moveTo(...side[0]);
      for (const pt of side.slice(1)) g.lineTo(...pt);
      g.stroke({ width: 2.4, color: INK, join: 'round' });
    }
    g.poly(outline.flat()).fill(grad([[0, 0x0a1626], [0.35, 0x162e4c], [1, 0x2f5f88]], 0, 0, 0, 1));
    for (const side of [top, bot]) {
      g.moveTo(...side[0]);
      for (const pt of side.slice(1)) g.lineTo(...pt);
      g.stroke({ width: 2, color: INK, join: 'round' });
    }
    // reflejo y témpanos
    line(g, 6, 38, 20, 37, 1.2, 0x6fa8d8, 0.6);
    line(g, 40, 41, 56, 40, 1.2, 0x6fa8d8, 0.6);
    for (const [x, y, r, a] of [[20, 30, 5, 0.3], [44, 32, 4.5, -0.5], [33, 37, 2.6, 0.8]]) {
      const P = R(x, y, a);
      const q = [P(-r, -r * 0.6), P(r * 0.8, -r * 0.8), P(r, r * 0.5), P(-r * 0.6, r * 0.8)].flat();
      g.poly(q).fill(0xe6f6ff).stroke({ width: 1.2, color: INK });
    }
    // grietitas que salen al hielo y nieve amontonada
    line(g, 26, 12, 30, 5, 1.2, 0x4f7fa8, 0.8);
    line(g, 46, 51, 50, 58, 1.2, 0x4f7fa8, 0.8);
    for (const [x, y, r] of [[10, 9, 5], [52, 8, 4], [16, 56, 4.5], [56, 55, 5]]) g.circle(x, y, r).fill(0xffffff).stroke({ width: 1.2, color: 0x8aa8c0 });
  },
  // Roca con nieve encima
  c(g, s) {
    const rnd = prng(797);
    const k = rock(g, s, rnd, 31, 31, 29, 27, SLATE, { cracks: 2, shadow: ICEBLUE });
    const snow = scalePts(k.top, 0.7, -2, -5);
    smooth(g, shift(snow, 0, 2)).fill(0xa8c4dc);
    smooth(g, snow).fill(rgrad(0xffffff, 0xe0ecf6, 0.4, 0.35)).stroke({ width: 1.4, color: 0x6a8aa4 });
    g.circle(k.cx - 10, k.cy - 12, 2.4).fill({ color: 0xffffff });
    for (let i = 0; i < 4; i++) g.circle(k.cx + (rnd() - 0.5) * 30, k.cy + (rnd() - 0.5) * 24, 1).fill(0xd8ecff);
  },
};

const SETS = [P0, P1, P2, P3, P4, P5, P6, P7];

// Lecho de cada planeta: un cuadrado redondeado de casilla entera, sin contorno,
// debajo de todo (incluso de la sombra). Como toca los bordes, las casillas vecinas
// se funden en una sola mancha y el grupo se lee como una masa continua.
// [relleno, motas oscuras, motas claras]
const BEDS = [
  [0x76985a, 0x56703f, 0xa8c890],
  [0x6e9c86, 0x4f7a68, 0xb0dcc8],
  [0xa8834f, 0x7a5a32, 0xe0c494],
  [0x7f7598, 0x5a5274, 0xc4bcd8],
  [0x2a5a62, 0x1a3c42, 0x5fa8a8],
  [0x7a7432, 0x5a5420, 0xc8c078],
  [0xc89c74, 0x9a6e4a, 0xf4dcbc],
  [0xb4c8d8, 0x8aa2b8, 0xffffff],
];
function bed(s, p) {
  const b = new Graphics();
  s.parent.addChildAt(b, 0);
  const [base, dark, light] = BEDS[p];
  b.roundRect(0, 0, S, S, 12).fill(base);
  const rnd = prng(900 + p);
  for (let i = 0; i < 26; i++) {
    const x = 4 + rnd() * 56, y = 4 + rnd() * 56, r = 0.8 + rnd() * 1.6;
    b.circle(x, y, r).fill({ color: i % 3 ? dark : light, alpha: 0.75 });
  }
}

export const OBSTACLE_KEYS = SETS.map((set, p) => Object.keys(set).map((k) => `obs${p}_${k}`));

export function makeObstacles(renderer, t) {
  SETS.forEach((set, p) => {
    for (const [k, draw] of Object.entries(set)) {
      t[`obs${p}_${k}`] = tex(renderer, (g, s, mid) => { bed(s, p); draw(g, s, mid); }, S, S, 3);
    }
  });
}
