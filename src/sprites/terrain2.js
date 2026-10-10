// Piezas sueltas y colores de tierra de los recursos de los planetas 3 en adelante.
// Igual que en terrain.js: render.js pinta la mancha de tierra (NODE_GROUND2) y
// reparte encima estas piezas (NODE_PIECES2), cada una a su aire.

import { C, tex, grad, vgrad, rgrad, cyl, rivet, line, rustStain } from './common.js';

const { INK, SHADOW } = C;
const J = 44; // tamaño de las piezas sueltas

const sh = (s, x, y, rx, ry, a = 0.35) => s.ellipse(x, y, rx, ry).fill({ color: SHADOW, alpha: a });

// ---- utilidades ----
function tire(g, x, y, rx, ry, hole = 0x463f39) {
  g.ellipse(x, y + ry * 0.35, rx, ry).fill(0x1f1d1c).stroke({ width: 2, color: INK });
  g.ellipse(x, y, rx, ry).fill(rgrad(0x7a746d, 0x34312e, 0.4, 0.35)).stroke({ width: 2, color: INK });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    line(g, x + Math.cos(a) * rx * 0.78, y + Math.sin(a) * ry * 0.78, x + Math.cos(a) * rx * 0.97, y + Math.sin(a) * ry * 0.97, 1.5, 0x181716);
  }
  g.ellipse(x, y - ry * 0.05, rx * 0.46, ry * 0.42).fill(hole).stroke({ width: 1.6, color: INK });
  g.ellipse(x - rx * 0.35, y - ry * 0.45, rx * 0.3, ry * 0.14).fill({ color: 0xffffff, alpha: 0.3 });
}
function bubble(g, x, y, r, fill = 0xc8dc6a) {
  g.circle(x, y, r).fill({ color: fill, alpha: 0.7 }).stroke({ width: 1.2, color: INK });
  g.circle(x - r * 0.35, y - r * 0.35, r * 0.3).fill(0xffffff);
}
function sparkle(g, x, y, r, color = 0xffffff) {
  line(g, x - r, y, x + r, y, 1, color);
  line(g, x, y - r, x, y + r, 1, color);
}
function iceBlock(g, x, y, w, h, d) {
  g.roundRect(x, y + d, w, h, 3).fill({ color: 0x6fa8d8, alpha: 0.95 }).stroke({ width: 1.8, color: INK });
  g.roundRect(x, y, w, h, 3).fill(grad([[0, 0xf4fcff], [0.6, 0xbfe2f7], [1, 0x8cc4ea]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
  line(g, x + 3, y + 3, x + w * 0.5, y + 2.5, 1.5, 0xffffff, 0.95);
  line(g, x + w - 4, y + h - 3, x + w - 3, y + h * 0.45, 1, 0x6fa8d8, 0.8);
}
function mossClump(g, s, blobs, glow = true) {
  if (glow) for (const [x, y, r] of blobs) s.circle(x, y, r + 4).fill({ color: 0xc6ff6a, alpha: 0.45 });
  for (const [x, y, r] of blobs) g.circle(x, y + 1.6, r).fill(0x2f7a24).stroke({ width: 1.8, color: INK });
  for (const [x, y, r] of blobs) g.circle(x, y, r).fill(rgrad(0xf0ffb8, 0x7fe03a, 0.4, 0.35));
  for (const [x, y, r] of blobs) {
    g.circle(x - r * 0.3, y - r * 0.35, Math.max(1, r * 0.16)).fill(0xffffff);
    g.circle(x + r * 0.35, y + r * 0.2, Math.max(0.8, r * 0.12)).fill({ color: 0x4f9e2a, alpha: 0.8 });
  }
}

// ---- Caucho: neumáticos ----
const RUBBER = {
  // Dos neumáticos apilados
  a(g, s) {
    sh(s, 23, 32, 17, 8);
    tire(g, 22, 27, 15, 9);
    tire(g, 21, 18, 14, 8.5);
    g.ellipse(21, 18, 12.2, 7.3).stroke({ width: 1.2, color: C.BUTTER, alpha: 0.85 });
  },
  // Neumático roto, medio enterrado
  b(g, s) {
    sh(s, 22, 32, 18, 6);
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.0 + i / 12); pts.push(22 + Math.cos(a) * 18, 30 + Math.sin(a) * 18); }
    for (let i = 12; i >= 0; i--) { const a = Math.PI * (1.0 + i / 12); pts.push(22 + Math.cos(a) * 10, 30 + Math.sin(a) * 10); }
    g.poly(pts).fill(rgrad(0x666059, 0x2a2725, 0.5, 0.3)).stroke({ width: 2, color: INK });
    for (let i = 1; i < 12; i++) {
      const a = Math.PI * (1.0 + i / 12);
      line(g, 22 + Math.cos(a) * 14, 30 + Math.sin(a) * 14, 22 + Math.cos(a + 0.1) * 17.4, 30 + Math.sin(a + 0.1) * 17.4, 1.8, 0x181716);
    }
    line(g, 9, 18, 15, 14, 1.4, 0xffffff, 0.25);
    // tierra que lo entierra
    g.ellipse(22, 32, 20, 5).fill(0x726960).stroke({ width: 1.4, color: 0x5a5149 });
    // tira desgarrada
    g.poly([30, 33, 40, 29, 42, 32, 33, 36]).fill(0x34302d).stroke({ width: 1.4, color: INK });
  },
  // Neumático tumbado con trozos de goma alrededor
  c(g, s) {
    sh(s, 21, 30, 15, 8);
    tire(g, 20, 22, 14, 10);
    g.ellipse(20, 21.5, 6.4, 4.2).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.4, color: INK });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.circle(20 + Math.cos(a) * 3.6, 21.5 + Math.sin(a) * 2.3, 0.8).fill(INK); }
    g.ellipse(20, 21.5, 1.6, 1.1).fill(C.METAL_DD);
    rustStain(g, 23, 23, 1.6, 0.5);
    for (const [x, y, w, h, r] of [[33, 30, 8, 4, 0.4], [4, 33, 7, 3.5, -0.3], [34, 12, 6, 3, 0.9]]) {
      const c = Math.cos(r), sn = Math.sin(r);
      const P = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
      g.poly([P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2 + 1, h / 2), P(-w / 2, h / 2)].flat()).fill(0x2f2c2a).stroke({ width: 1.3, color: INK });
    }
  },
};

// ---- Circuitos: placas, cables, teclas ----
const ELEC = {
  // Placa verde rota con componentes
  a(g, s) {
    sh(s, 22, 31, 17, 6);
    g.poly([5, 16, 28, 7, 33, 13, 38, 12, 40, 24, 30, 30, 18, 35, 11, 30, 6, 28]).fill(grad([[0, 0x6fb06a], [1, 0x2f6a3a]], 0, 0, 0.7, 1)).stroke({ width: 2, color: INK });
    for (const [x1, y1, x2, y2] of [[9, 20, 20, 16], [20, 16, 26, 20], [14, 26, 32, 20], [30, 12, 34, 22]]) line(g, x1, y1, x2, y2, 1.2, 0xd6e08a, 0.9);
    g.roundRect(14, 13, 9, 6, 1).fill(0x26282b).stroke({ width: 1.2, color: INK });
    for (let i = 0; i < 3; i++) line(g, 15.5 + i * 3, 19, 15.5 + i * 3, 21, 0.9, C.METAL_L);
    g.circle(31, 18, 3).fill(rgrad(0x9fc3ff, 0x3a5fa8, 0.35, 0.3)).stroke({ width: 1, color: INK });
    g.roundRect(20, 25, 7, 3, 1).fill(0xd9a46a).stroke({ width: 0.9, color: INK });
    g.circle(11, 22, 2.8).fill({ color: 0x2a2620, alpha: 0.45 });
  },
  // Maraña de cables de colores con un enchufe
  b(g, s) {
    sh(s, 22, 31, 18, 6);
    const wires = [
      [[4, 28], [14, 10], [26, 34], [40, 18], 0xe5484d],
      [[6, 18], [20, 36], [30, 8], [38, 30], C.BUTTER],
      [[10, 34], [18, 18], [30, 26], [34, 10], 0x5fa8ff],
    ];
    for (const [a, b, c, d, col] of wires) {
      g.moveTo(...a).bezierCurveTo(...b, ...c, ...d).stroke({ width: 4.2, color: INK, cap: 'round' });
      g.moveTo(...a).bezierCurveTo(...b, ...c, ...d).stroke({ width: 2.4, color: col, cap: 'round' });
    }
    // enchufe
    g.roundRect(34, 6, 8, 8, 2).fill(0xe6e1d6).stroke({ width: 1.5, color: INK });
    line(g, 36.5, 6, 36.5, 3, 1.4, C.METAL_D);
    line(g, 39.5, 6, 39.5, 3, 1.4, C.METAL_D);
    // cables pelados
    line(g, 40, 18, 42, 16, 1.2, 0xe08a4a);
    line(g, 38, 30, 41, 31, 1.2, 0xe08a4a);
  },
  // Teclas de teclado sueltas
  c(g, s) {
    sh(s, 22, 31, 17, 6);
    const key = (x, y, w, c, d) => {
      g.roundRect(x, y + 2.5, w, 9, 2).fill(d).stroke({ width: 1.6, color: INK });
      g.roundRect(x, y, w, 9, 2).fill(c).stroke({ width: 1.6, color: INK });
      g.roundRect(x + 2, y + 1.6, w - 4, 5.6, 1.5).fill({ color: 0xffffff, alpha: 0.35 });
    };
    key(5, 18, 10, 0xe6e1d6, 0xa9a396);
    key(17, 10, 10, 0xd2ccc0, 0x958f83);
    key(14, 24, 18, 0xe6e1d6, 0xa9a396);
    key(30, 15, 10, 0xff8fa0, 0xc35c6e);
    line(g, 9, 21.5, 11, 21.5, 1.4, INK); line(g, 10, 20.5, 10, 23, 1.4, INK);
    line(g, 20, 13, 24, 15, 1.4, INK);
    line(g, 19, 28, 27, 28, 1.4, INK);
  },
};

// ---- Musgo fosforito ----
const MOSS = {
  a(g, s) {
    sh(s, 22, 32, 16, 5);
    mossClump(g, s, [[14, 24, 8], [28, 24, 9], [21, 16, 9], [22, 27, 7]]);
  },
  // Musgo sobre una piedra
  b(g, s) {
    sh(s, 22, 33, 17, 6);
    g.poly([6, 32, 9, 20, 20, 13, 33, 15, 39, 26, 35, 34, 18, 36]).fill(grad([[0, 0xc9cfc4], [0.6, 0x8e9588], [1, 0x6a7064]], 0, 0, 0.6, 1)).stroke({ width: 2, color: INK });
    mossClump(g, s, [[17, 17, 6], [26, 16, 6.5], [33, 22, 5]]);
  },
  // Matitas con esporas brillantes en tallos
  c(g, s) {
    sh(s, 22, 32, 15, 5);
    for (const [x, y, h, a] of [[15, 26, 14, -0.3], [22, 24, 18, 0.05], [29, 26, 13, 0.35]]) {
      const tx = x + Math.sin(a) * h, ty = y - Math.cos(a) * h;
      line(g, x, y, tx, ty, 3.2, INK);
      line(g, x, y, tx, ty, 1.6, 0x5fae3a);
      s.circle(tx, ty, 6).fill({ color: 0xc6ff6a, alpha: 0.6 });
      g.circle(tx, ty, 3.4).fill(rgrad(0xffffe0, 0xb8ff4a, 0.4, 0.35)).stroke({ width: 1.3, color: INK });
    }
    mossClump(g, s, [[16, 29, 6], [28, 29, 6.5], [22, 31, 5.5]]);
  },
};

// ---- Lodo tóxico ----
function puddle(g, cx, cy, rx, ry, seed = 0) {
  const pts = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.08 * Math.cos(a * 5 + seed * 2);
    pts.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  g.poly(pts).fill(0x4a4f1c).stroke({ width: 2, color: INK });
  g.ellipse(cx, cy - 0.6, rx * 0.88, ry * 0.78).fill(grad([[0, 0xb4c050], [0.6, 0x8a9a36], [1, 0x6a7a26]], 0, 0, 0.6, 1));
  g.ellipse(cx - rx * 0.35, cy - ry * 0.35, rx * 0.3, ry * 0.15).fill({ color: 0xffffff, alpha: 0.4 });
}
const MUD = {
  a(g, s) {
    sh(s, 22, 28, 18, 9, 0.25);
    puddle(g, 22, 25, 18, 10, 0.5);
    bubble(g, 27, 22, 3.6); bubble(g, 15, 27, 2.4); bubble(g, 21, 29, 1.6);
  },
  // Charquito con una burbuja gorda a punto de reventar
  b(g, s) {
    sh(s, 22, 29, 15, 8, 0.25);
    puddle(g, 22, 26, 15, 9, 2);
    g.ellipse(21, 20, 7.5, 6.5).fill({ color: 0xd8ec7a, alpha: 0.7 }).stroke({ width: 1.5, color: INK });
    g.ellipse(18.5, 17.5, 2.2, 1.4).fill(0xffffff);
    bubble(g, 30, 28, 2);
    for (const [x, y] of [[12, 14], [31, 15], [26, 11]]) g.circle(x, y, 1).fill({ color: 0xd8ec7a, alpha: 0.9 });
  },
  // Bidón hundido en el lodo
  c(g, s) {
    sh(s, 22, 30, 18, 8, 0.25);
    puddle(g, 22, 29, 19, 9, 4);
    g.roundRect(13, 9, 17, 21, 4).fill(cyl(0x7a5a22, 0xd9a440, 0xf3cf62, false)).stroke({ width: 2, color: INK });
    for (const y of [15, 22]) g.rect(13, y, 17, 2.4).fill({ color: INK, alpha: 0.4 });
    g.ellipse(21.5, 9.5, 8.5, 3).fill(0xb88d27).stroke({ width: 1.6, color: INK });
    g.circle(24.5, 9.3, 1.3).fill(INK);
    // símbolo de peligro y óxido
    g.poly([21.5, 16.5, 25, 20, 21.5, 23.5, 18, 20]).fill(0x2e2822);
    g.circle(21.5, 20, 1.2).fill(0xd8ec7a);
    rustStain(g, 16, 13, 2.2, 0.5);
    // lodo que lo cubre por abajo
    g.ellipse(21.5, 30, 12, 4).fill(0x8a9a36).stroke({ width: 1.4, color: 0x4a4f1c });
    bubble(g, 33, 30, 2);
    bubble(g, 9, 29, 1.6);
  },
};

// ---- Arena gris-violeta con limaduras ----
function mound(g, x, y, w, h) {
  g.moveTo(x - w, y).quadraticCurveTo(x - w * 0.6, y - h * 0.8, x - w * 0.1, y - h).quadraticCurveTo(x + w * 0.5, y - h, x + w, y)
    .quadraticCurveTo(x, y + h * 0.25, x - w, y)
    .fill(grad([[0, 0xe6deef], [0.55, 0xb4a8c8], [1, 0x8a7fa0]], 0.3, 0, 0.7, 1)).stroke({ width: 2, color: INK });
  g.moveTo(x - w * 0.55, y - h * 0.55).quadraticCurveTo(x - w * 0.3, y - h * 0.9, x, y - h * 0.92).stroke({ width: 1.3, color: 0xffffff, alpha: 0.5, cap: 'round' });
}
function grains(g, pts) {
  for (const [x, y] of pts) g.circle(x, y, 0.9).fill({ color: 0x6a5f80, alpha: 0.85 });
}
function filings(g, pts) {
  for (const [x, y, a] of pts) line(g, x - Math.cos(a) * 1.8, y - Math.sin(a) * 1.8, x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.8, 1.2, 0x45454f);
}
const SAND = {
  a(g, s) {
    sh(s, 22, 31, 18, 6);
    mound(g, 22, 31, 18, 17);
    grains(g, [[12, 27], [17, 21], [24, 18], [30, 25], [22, 27], [27, 29]]);
    filings(g, [[15, 25, 0.4], [26, 22, -0.6], [21, 28, 1.2], [31, 28, 0.1], [20, 19, 2.2]]);
    sparkle(g, 19, 17, 2.4); sparkle(g, 28, 24, 2); sparkle(g, 13, 24, 1.6);
  },
  // Dos montículos con un tornillo clavado
  b(g, s) {
    sh(s, 22, 32, 19, 6);
    mound(g, 13, 32, 11, 10);
    // tornillo clavado
    line(g, 29, 26, 33, 12, 4.6, INK);
    line(g, 29, 26, 33, 12, 2.8, C.METAL_L);
    for (let t = 0.2; t < 0.9; t += 0.18) { const x = 29 + 4 * t, y = 26 - 14 * t; line(g, x - 1.6, y - 0.3, x + 1.6, y + 0.6, 0.9, C.METAL_D); }
    const hex = [];
    for (let i = 0; i < 6; i++) { const b = (i / 6) * Math.PI * 2; hex.push(33.2 + Math.cos(b) * 4, 11 + Math.sin(b) * 3); }
    g.poly(hex).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.3, color: INK });
    mound(g, 30, 33, 11, 9);
    grains(g, [[10, 28], [15, 26], [27, 29], [34, 30]]);
    filings(g, [[12, 30, 0.6], [32, 28, -0.4]]);
    sparkle(g, 14, 24, 1.8); sparkle(g, 26, 27, 1.8);
  },
  // Montículo bajo con ondas y una tuerca
  c(g, s) {
    sh(s, 22, 31, 19, 6);
    mound(g, 22, 32, 19, 11);
    for (const y of [26, 29]) g.moveTo(9, y).quadraticCurveTo(15, y - 2, 21, y).quadraticCurveTo(27, y + 2, 34, y - 0.5).stroke({ width: 1, color: 0x7a7090, alpha: 0.7 });
    const hex = [];
    for (let i = 0; i < 6; i++) { const b = (i / 6) * Math.PI * 2 + 0.3; hex.push(28 + Math.cos(b) * 4.2, 23 + Math.sin(b) * 3.4); }
    g.poly(hex).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.3, color: INK });
    g.circle(28, 23, 1.5).fill(0x6a5f80).stroke({ width: 0.8, color: INK });
    filings(g, [[14, 27, 0.5], [20, 24, -0.3], [33, 28, 1.1]]);
    sparkle(g, 17, 23, 2); sparkle(g, 23, 29, 1.6);
  },
};

// ---- Hielo ----
function frost(g, pts) {
  for (const [x, y, r] of pts) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      line(g, x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 0xffffff, 0.95);
    }
  }
}
const ICE = {
  // Bloque gordo con escarcha
  a(g, s) {
    sh(s, 23, 33, 17, 6);
    iceBlock(g, 8, 10, 26, 18, 6);
    line(g, 18, 12, 22, 20, 1.1, 0x6fa8d8, 0.9);
    line(g, 22, 20, 20, 26, 1.1, 0x6fa8d8, 0.9);
    frost(g, [[13, 22, 2.4], [29, 14, 2], [27, 24, 1.5]]);
  },
  // Montoncito de bloques
  b(g, s) {
    sh(s, 22, 33, 18, 6);
    iceBlock(g, 4, 18, 15, 11, 4.5);
    iceBlock(g, 22, 18, 16, 12, 5);
    iceBlock(g, 12, 6, 15, 12, 5);
    frost(g, [[16, 10, 1.8], [32, 22, 1.6]]);
  },
  // Placa de hielo agrietada con pinchos de escarcha
  c(g, s) {
    sh(s, 22, 31, 19, 7, 0.25);
    g.poly([4, 26, 10, 17, 26, 14, 39, 19, 40, 29, 24, 35, 9, 33]).fill({ color: 0x6fa8d8, alpha: 0.95 }).stroke({ width: 2, color: INK });
    g.poly([4, 24, 10, 15, 26, 12, 39, 17, 40, 26, 24, 32, 9, 31]).fill(grad([[0, 0xf4fcff], [1, 0xa6d4f0]], 0, 0, 1, 1)).stroke({ width: 2, color: INK });
    for (const [a, b, c, d] of [[22, 22, 12, 19], [22, 22, 30, 16], [22, 22, 26, 31], [22, 22, 36, 25]]) line(g, a, b, c, d, 1.1, 0x5f98c8, 0.9);
    line(g, 11, 18, 19, 15.5, 1.5, 0xffffff, 0.95);
    for (const [x, y, h, w] of [[30, 22, 12, 4], [35, 24, 8, 3], [14, 27, 9, 3.4]]) {
      g.poly([x - w, y, x - w * 0.3, y - h, x + w * 0.4, y - h * 0.8, x + w, y]).fill(grad([[0, 0xeaf8ff], [1, 0x6fb0dc]], 0, 0, 1, 1)).stroke({ width: 1.3, color: INK });
      line(g, x - w * 0.4, y - h * 0.7, x - w * 0.45, y - h * 0.15, 1, 0xffffff, 0.9);
    }
    frost(g, [[17, 28, 1.8]]);
  },
};

const SETS = {
  caucho: ['rub', RUBBER],
  circuitos: ['elec', ELEC],
  musgo: ['moss', MOSS],
  lodo: ['mud', MUD],
  arena: ['sand', SAND],
  hielo: ['ice', ICE],
};

// Piezas sueltas que se reparten por cada tipo de nodo
export const NODE_PIECES2 = Object.fromEntries(
  Object.entries(SETS).map(([type, [pre, set]]) => [type, Object.keys(set).map((k) => `${pre}_${k}`)]),
);

// Colores de la tierra de cada tipo de nodo: borde, relleno, claros, motas
export const NODE_GROUND2 = {
  caucho: [0x5a5149, 0x726960, 0x8d8378, 0x3e3833],
  circuitos: [0x56685a, 0x738677, 0x9aae9e, 0x3a4a3e],
  musgo: [0x1f4a45, 0x2b655c, 0x4f9a80, 0x15332f],
  lodo: [0x5a5e2c, 0x777b3c, 0x9a9e58, 0x40431d],
  arena: [0x948ba4, 0xb6acc5, 0xd8d0e3, 0x756b87],
  hielo: [0x9fbdd1, 0xcfe3ee, 0xf2f9fd, 0x7d9db4],
};

export function makeTerrain2(renderer, t) {
  for (const [pre, set] of Object.values(SETS)) {
    for (const [k, draw] of Object.entries(set)) t[`${pre}_${k}`] = tex(renderer, draw, J, J, 2.5);
  }
}
