// Sprites de los objetos de los planetas 3 en adelante (32 px), mismo estilo que items.js.
// Cada planeta: materia prima (raw) → pieza → pieza → producto final.

import { C, grad, vgrad, rgrad, rivet, line } from './common.js';

const { INK, SHADOW } = C;

const shadow = (s, x = 16, y = 23, rx = 11, ry = 5, a = 0.4) => s.ellipse(x, y, rx, ry).fill({ color: SHADOW, alpha: a });

// Puntos de un arco (para formas en banda)
const arcPts = (cx, cy, r, a0, a1, n = 10, ry = r) => {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * ry); }
  return p;
};
const revArc = (cx, cy, r, a0, a1, n = 10, ry = r) => arcPts(cx, cy, r, a1, a0, n, ry);

// Copo de nieve sencillo
function snowflake(g, x, y, r, color = 0xffffff, w = 1.2) {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI + Math.PI / 2;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    line(g, x - dx, y - dy, x + dx, y + dy, w, color);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 2;
    const px = x + Math.cos(a) * r * 0.6, py = y + Math.sin(a) * r * 0.6;
    line(g, px, py, px + Math.cos(a + 0.8) * r * 0.35, py + Math.sin(a + 0.8) * r * 0.35, w * 0.7, color);
    line(g, px, py, px + Math.cos(a - 0.8) * r * 0.35, py + Math.sin(a - 0.8) * r * 0.35, w * 0.7, color);
  }
}

// Hojita (biocombustible)
function leaf(g, x, y, s, color = 0x5fae3a) {
  g.moveTo(x, y + s).quadraticCurveTo(x - s * 1.1, y, x, y - s).quadraticCurveTo(x + s * 1.1, y, x, y + s)
    .fill(color).stroke({ width: 1, color: INK });
  line(g, x, y + s * 0.9, x, y - s * 0.6, 0.8, 0xd9f5b0);
}

export const ITEM_DRAW2 = {
  // ===================== Planeta caucho =====================
  // Caucho: trozo roto de neumático (arco con dibujo)
  caucho(g, s) {
    shadow(s, 16, 23, 12, 5);
    const cx = 16, cy = 22, a0 = Math.PI * 1.04, a1 = Math.PI * 1.96;
    const pts = [...arcPts(cx, cy, 13, a0, a1, 14, 12), 26.5, 20, 23, 20.5, ...revArc(cx, cy, 7, a0 + 0.12, a1 - 0.12, 10, 6.5), 6, 21, 3.5, 19.5];
    g.poly(pts).fill(rgrad(0x6a6560, 0x252322, 0.45, 0.2)).stroke({ width: 1.8, color: INK });
    // dibujo de la banda de rodadura
    for (let i = 1; i < 9; i++) {
      const a = a0 + (a1 - a0) * (i / 9);
      line(g, cx + Math.cos(a) * 10, cy + Math.sin(a) * 9.4, cx + Math.cos(a + 0.12) * 12.6, cy + Math.sin(a + 0.12) * 11.6, 1.5, 0x161514);
    }
    g.poly(arcPts(cx, cy, 8.5, a0 + 0.3, a1 - 0.3, 8, 8)).stroke({ width: 1, color: 0x8a847d, alpha: 0.7 });
    line(g, 8, 13, 13, 10.5, 1.2, 0xffffff, 0.35);
    // tira suelta
    g.roundRect(20, 22, 9, 3.4, 1.5).fill(0x3a3735).stroke({ width: 1.2, color: INK });
  },
  // Goma: plancha de goma con el extremo enrollado
  goma(g, s) {
    s.roundRect(5, 13, 24, 14, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.poly([5, 12, 27, 12, 28, 25, 4, 25]).fill(grad([[0, 0x6a6e74], [0.5, 0x4f5358], [1, 0x34363a]], 0, 0, 0.6, 1)).stroke({ width: 1.8, color: INK, join: 'round' });
    for (let y = 16; y < 25; y += 3) for (let x = 7; x < 27; x += 3) g.circle(x + (y % 2), y, 0.5).fill({ color: 0x24262a, alpha: 0.8 });
    // rollo de arriba
    g.roundRect(3.5, 5, 25, 9, 4.5).fill(grad([[0, 0x2c2e31], [0.35, 0x8a8f96], [0.6, 0x55595f], [1, 0x26282b]])).stroke({ width: 1.7, color: INK });
    line(g, 7, 7.3, 22, 7.3, 1.1, 0xffffff, 0.45);
    // extremo en espiral
    g.ellipse(27.5, 9.5, 3.3, 4.6).fill(0x3a3d42).stroke({ width: 1.4, color: INK });
    g.ellipse(27.5, 9.5, 2, 2.9).stroke({ width: 0.9, color: 0x7a7f86 });
    g.ellipse(27.5, 9.5, 0.8, 1.2).fill(0x1a1b1d);
  },
  // Correa: correa de transmisión entre dos poleas
  correa(g, s) {
    shadow(s, 16, 22, 13, 5);
    for (const [x, r] of [[9, 5], [23.5, 3.6]]) {
      g.circle(x, 15, r).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.2, color: INK });
      g.circle(x, 15, 1.3).fill(INK);
    }
    // banda: tangentes a las dos poleas
    const belt = () => g.moveTo(9, 8.6).lineTo(23.5, 10).arc(23.5, 15, 5, -Math.PI / 2, Math.PI / 2).lineTo(9, 21.4).arc(9, 15, 6.4, Math.PI / 2, Math.PI * 1.5);
    belt().stroke({ width: 4.6, color: INK, join: 'round' });
    belt().stroke({ width: 2.6, color: 0x3a3d42, join: 'round' });
    line(g, 10, 8.6, 22, 9.9, 0.9, 0x7a7f86);
    for (const [x, y] of [[13, 9], [17, 9.4], [21, 9.8], [13, 21.2], [17, 20.6], [21, 20.1]]) g.circle(x, y, 0.55).fill(0x16171a);
    g.roundRect(14, 19.3, 5, 2.8, 0.8).fill(C.BUTTER).stroke({ width: 0.9, color: INK });
  },
  // Patinete eléctrico visto desde arriba
  patinete(g, s) {
    s.roundRect(3, 15, 27, 10, 4).fill({ color: SHADOW, alpha: 0.4 });
    // ruedas
    g.roundRect(1.5, 12.5, 6, 7, 2.5).fill(0x24262a).stroke({ width: 1.3, color: INK });
    g.roundRect(24.5, 12.5, 6, 7, 2.5).fill(0x24262a).stroke({ width: 1.3, color: INK });
    // tabla
    g.roundRect(4, 11.5, 21, 9, 4).fill(grad([[0, C.MINT_L], [1, C.MINT_D]], 0, 0, 0, 1)).stroke({ width: 1.7, color: INK });
    g.roundRect(6.5, 13.5, 14, 5, 2.5).fill(0x2f3236);
    for (let x = 8; x < 20; x += 2) line(g, x, 14.2, x, 17.8, 0.6, 0x4a4e54);
    // barra y manillar
    g.roundRect(21, 13.6, 5, 4.8, 1.6).fill(C.STEEL).stroke({ width: 1.1, color: INK });
    line(g, 25, 4, 25, 28, 4, INK);
    line(g, 25, 4, 25, 28, 2.2, C.STEEL_L);
    g.roundRect(23.2, 2, 3.6, 5.5, 1.5).fill(0x2a2c30).stroke({ width: 1, color: INK });
    g.roundRect(23.2, 24.5, 3.6, 5.5, 1.5).fill(0x2a2c30).stroke({ width: 1, color: INK });
    g.circle(25, 16, 2.2).fill(C.BUTTER_L).stroke({ width: 1, color: INK });
    line(g, 7, 12.8, 15, 12.8, 1, 0xffffff, 0.7);
  },

  // ===================== Planeta circuitos =====================
  // Circuitos: trozo roto de placa vieja con componentes
  circuitos(g, s) {
    shadow(s, 16, 23, 12, 5);
    g.poly([4, 10, 18, 5, 21, 9, 25, 7, 28, 14, 24, 17, 26, 22, 12, 25, 9, 21, 5, 22])
      .fill(grad([[0, 0x7fb06a], [1, 0x3d7244]], 0, 0, 0.6, 1)).stroke({ width: 1.7, color: INK });
    for (const [x1, y1, x2, y2] of [[7, 13, 15, 13], [15, 13, 18, 16], [10, 18, 22, 18], [20, 9, 20, 14]]) line(g, x1, y1, x2, y2, 1, 0xc9d88a, 0.9);
    g.roundRect(9, 8.5, 5.5, 3.5, 0.8).fill(0x26282b).stroke({ width: 0.9, color: INK });
    g.circle(22, 13.5, 2.2).fill(rgrad(0x9fc3ff, 0x3a5fa8, 0.35, 0.3)).stroke({ width: 0.9, color: INK });
    g.roundRect(13, 19.5, 4.5, 2.2, 0.6).fill(0xd9a46a).stroke({ width: 0.7, color: INK });
    for (const [x, y] of [[7, 19], [19, 21.5], [24, 19]]) g.circle(x, y, 0.9).fill(0xe8d38a);
    g.circle(17, 9.5, 2.4).fill({ color: 0x2a2620, alpha: 0.45 }); // quemadura
  },
  // Chip: chip negro con patitas plateadas
  chip(g, s) {
    s.roundRect(7, 10, 20, 16, 3).fill({ color: SHADOW, alpha: 0.4 });
    for (let i = 0; i < 4; i++) {
      const p = 10.5 + i * 3.7;
      for (const [x, y, w, h] of [[p - 1, 3.5, 2, 4], [p - 1, 22.5, 2, 4], [3.5, p - 1, 4, 2], [24.5, p - 1, 4, 2]]) {
        g.rect(x, y, w, h).fill(C.METAL_L).stroke({ width: 0.7, color: INK });
      }
    }
    g.roundRect(7, 7, 18, 16, 2).fill(grad([[0, 0x4a4d54], [1, 0x1c1d21]], 0, 0, 1, 1)).stroke({ width: 1.7, color: INK });
    g.circle(10.5, 10.5, 1.2).fill(0x6a6e76);
    line(g, 13, 15, 21, 15, 1, 0x6a6e76, 0.8);
    line(g, 13, 18, 18, 18, 1, 0x6a6e76, 0.8);
    line(g, 9, 8.5, 18, 8.5, 1, 0xffffff, 0.45);
  },
  // Placa base: placa verde con pistas doradas y un chip
  placabase(g, s) {
    s.roundRect(6, 10, 22, 16, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(4, 5, 24, 20, 2).fill(grad([[0, 0x4fc07a], [1, 0x1f7a48]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
    const gold = 0xf3cf62;
    for (const [x1, y1, x2, y2] of [[7, 9, 13, 9], [7, 21, 13, 21], [19, 9, 25, 9], [19, 21, 25, 21], [6.5, 15, 12, 15], [20, 15, 25.5, 15], [16, 6.5, 16, 10.5], [16, 19.5, 16, 23]]) {
      line(g, x1, y1, x2, y2, 1.1, gold, 0.95);
    }
    g.roundRect(12, 10.5, 8, 9, 1.2).fill(grad([[0, 0x45484f], [1, 0x1c1d21]], 0, 0, 1, 1)).stroke({ width: 1.2, color: INK });
    g.circle(13.8, 12.2, 0.7).fill(0x7a7e86);
    for (const [x, y] of [[6.5, 7.5], [25.5, 7.5], [6.5, 22.5], [25.5, 22.5]]) g.circle(x, y, 1.3).fill(0x1f5a36).stroke({ width: 0.9, color: gold });
    g.roundRect(21, 17.5, 3.5, 2, 0.5).fill(0xe6e1d6).stroke({ width: 0.6, color: INK });
    line(g, 6.5, 6.6, 12, 6.6, 1, 0xffffff, 0.6);
  },
  // Consola: mando retro con cruceta y botones de colores
  consola(g, s) {
    shadow(s, 16, 23, 13, 5);
    g.moveTo(9, 7).lineTo(23, 7).quadraticCurveTo(30, 7, 30, 15).quadraticCurveTo(30, 24, 24, 23).lineTo(21, 19.5).lineTo(11, 19.5)
      .lineTo(8, 23).quadraticCurveTo(2, 24, 2, 15).quadraticCurveTo(2, 7, 9, 7)
      .fill(grad([[0, C.LILAC_L], [1, C.LILAC_D]], 0, 0, 0.4, 1)).stroke({ width: 1.8, color: INK });
    // cruceta
    g.roundRect(6, 12.4, 8, 2.8, 0.8).fill(0x2a2730).stroke({ width: 0.9, color: INK });
    g.roundRect(8.6, 9.8, 2.8, 8, 0.8).fill(0x2a2730).stroke({ width: 0.9, color: INK });
    g.roundRect(6.3, 12.7, 7.4, 2.2, 0.6).fill(0x2a2730);
    // botones
    for (const [x, y, c] of [[24.5, 10.5, C.ROSE], [27.2, 13.6, C.BUTTER], [21.8, 13.6, C.MINT], [24.5, 16.6, 0x7fb8ff]]) {
      g.circle(x, y, 1.7).fill(c).stroke({ width: 0.9, color: INK });
    }
    g.roundRect(14, 13, 2.2, 1.2, 0.6).fill(0x4a4458);
    g.roundRect(17, 13, 2.2, 1.2, 0.6).fill(0x4a4458);
    line(g, 7, 8.6, 13, 8.6, 1.1, 0xffffff, 0.7);
  },

  // ===================== Planeta musgo =====================
  // Musgo: mata de musgo verde fosforito que brilla
  musgo(g, s) {
    s.circle(16, 15, 12).fill({ color: 0xc6ff6a, alpha: 0.55 }); // resplandor
    shadow(s, 16, 23, 11, 4, 0.35);
    const blobs = [[10, 17, 6], [21, 17, 6.5], [15.5, 11, 7], [16, 19, 5.5]];
    for (const [x, y, r] of blobs) g.circle(x, y + 1.2, r).fill(0x3f8f2a).stroke({ width: 1.6, color: INK });
    for (const [x, y, r] of blobs) g.circle(x, y, r).fill(rgrad(0xeaffb0, 0x7fe03a, 0.4, 0.35));
    for (const [x, y] of [[9, 15], [13, 9], [19, 12], [23, 16], [15, 19], [18, 7.5]]) g.circle(x, y, 1).fill({ color: 0x4f9e2a, alpha: 0.8 });
    for (const [x, y] of [[12, 12], [20, 14.5], [16, 16]]) g.circle(x, y, 0.9).fill(0xffffff);
    line(g, 12, 8, 15, 6.5, 1.2, 0xffffff, 0.8);
  },
  // Biocombustible: garrafa verde con hoja
  biocombustible(g, s) {
    s.roundRect(7, 12, 20, 14, 3).fill({ color: SHADOW, alpha: 0.4 });
    // tapón
    g.roundRect(20, 2.5, 5, 4, 1).fill(C.BUTTER).stroke({ width: 1.1, color: INK });
    g.poly([6, 9, 11, 4, 25, 4, 27, 7, 27, 25, 6, 25]).fill(grad([[0, 0xa6e36a], [0.55, 0x5fae3a], [1, 0x3a7a24]], 0, 0, 1, 0.4)).stroke({ width: 1.8, color: INK });
    // asa
    g.roundRect(11, 5.5, 7, 3, 1.4).fill(0x2f5e1c).stroke({ width: 1, color: INK });
    line(g, 7.5, 12, 7.5, 22, 1.2, 0xffffff, 0.55);
    // etiqueta con hoja y gota
    g.roundRect(10, 11, 13, 11, 2.5).fill(0xf4fbe6).stroke({ width: 1, color: INK });
    leaf(g, 16.5, 16.5, 4.4);
  },
  // Batería: pila gorda con borne + y franja de color
  bateria(g, s) {
    shadow(s, 16, 25, 9, 4);
    g.roundRect(13, 2.5, 6, 4, 1.2).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.1, color: INK });
    g.roundRect(8.5, 5.5, 15, 21, 4.5).fill(grad([[0, 0x1f2125], [0.3, 0x5a5e66], [0.5, 0x3a3d43], [1, 0x17181b]], 0, 0, 1, 0)).stroke({ width: 1.8, color: INK });
    g.rect(9.3, 6.5, 13.4, 7).fill(grad([[0, C.BUTTER_D], [0.3, C.BUTTER_L], [0.55, C.BUTTER], [1, C.BUTTER_D]], 0, 0, 1, 0));
    line(g, 9, 13.5, 23, 13.5, 1.2, INK);
    g.ellipse(16, 6.2, 7, 1.5).stroke({ width: 1, color: INK, alpha: 0.6 });
    line(g, 16, 17, 16, 23, 1.6, C.MINT_L);
    line(g, 13, 20, 19, 20, 1.6, C.MINT_L);
    line(g, 11, 8, 11, 12, 1.2, 0xffffff, 0.7);
  },
  // Dron: quadcóptero visto desde arriba
  dron(g, s) {
    s.ellipse(16, 18, 13, 9).fill({ color: SHADOW, alpha: 0.32 });
    const rot = [[6.5, 6], [25.5, 6], [6.5, 24], [25.5, 24]];
    for (const [x, y] of rot) { line(g, 16, 15, x, y, 3.6, INK); line(g, 16, 15, x, y, 1.8, C.METAL_D); }
    for (const [x, y] of rot) {
      g.circle(x, y, 5.6).fill({ color: 0xdfe8ee, alpha: 0.45 }).stroke({ width: 1.1, color: INK, alpha: 0.8 });
      line(g, x - 4.6, y - 1.5, x + 4.6, y + 1.5, 1.4, 0x3a3d42);
      g.circle(x, y, 1.6).fill(C.METAL_L).stroke({ width: 0.8, color: INK });
    }
    g.roundRect(10.5, 10, 11, 10, 3.5).fill(grad([[0, C.RUST_L], [1, C.RUST_D]], 0, 0, 1, 1)).stroke({ width: 1.7, color: INK });
    g.circle(16, 15, 2.3).fill(0x2a2d33).stroke({ width: 0.9, color: INK });
    g.circle(15.5, 14.5, 0.8).fill(C.TEAL);
    line(g, 12, 11.6, 17, 11.6, 1, 0xffffff, 0.7);
  },

  // ===================== Planeta lodo =====================
  // Lodo: pegote de lodo tóxico con burbuja
  lodo(g, s) {
    shadow(s, 16, 23, 12, 5);
    g.moveTo(4, 20).quadraticCurveTo(3, 14, 9, 12).quadraticCurveTo(11, 6, 17, 7).quadraticCurveTo(24, 6, 25, 12)
      .quadraticCurveTo(30, 15, 27, 21).quadraticCurveTo(26, 25, 22, 23).quadraticCurveTo(21, 27, 18, 24)
      .quadraticCurveTo(10, 25, 4, 20)
      .fill(grad([[0, 0xb4c050], [0.5, 0x8a9a36], [1, 0x55611c]], 0, 0, 0.5, 1)).stroke({ width: 1.8, color: INK });
    g.ellipse(13, 18, 4, 2).fill({ color: 0x5c6a1e, alpha: 0.6 });
    // burbuja
    g.circle(20, 12, 3.6).fill({ color: 0xd8ec7a, alpha: 0.75 }).stroke({ width: 1.2, color: INK });
    g.circle(19, 11, 1).fill(0xffffff);
    g.circle(9.5, 15.5, 1.6).fill({ color: 0xd8ec7a, alpha: 0.8 }).stroke({ width: 0.9, color: INK });
    line(g, 11, 11, 15, 9, 1.3, 0xffffff, 0.6);
  },
  // Ácido: frasco con líquido amarillo-verdoso y símbolo de peligro
  acido(g, s) {
    shadow(s, 16, 25, 11, 4);
    g.roundRect(12.5, 1.5, 7, 4, 1.2).fill(0xb7834f).stroke({ width: 1.1, color: INK });
    const flask = [13, 5, 19, 5, 19, 11, 27, 22, 25.5, 26, 6.5, 26, 5, 22, 13, 11];
    g.poly(flask).fill({ color: 0xe6fbff, alpha: 0.55 });
    g.poly([9.2, 16.5, 22.8, 16.5, 27, 22, 25.5, 26, 6.5, 26, 5, 22]).fill(grad([[0, 0xf0ff7a], [1, 0xa8cf2a]], 0, 0, 0, 1));
    line(g, 9.6, 16.5, 22.4, 16.5, 1, 0xfaffc0);
    g.poly(flask).stroke({ width: 1.7, color: INK, join: 'round' });
    line(g, 15, 7, 15, 11.5, 1.1, 0xffffff, 0.9);
    // rombo de peligro
    g.poly([16, 16.8, 20, 20.8, 16, 24.8, 12, 20.8]).fill(0xffffff).stroke({ width: 1, color: INK });
    line(g, 16, 18.8, 16, 21.4, 1.2, INK);
    g.circle(16, 23, 0.6).fill(INK);
    g.circle(23, 22, 0.9).fill({ color: 0xffffff, alpha: 0.8 });
  },
  // Circuito: placa morada con pistas plateadas y peine de contactos
  circuito(g, s) {
    s.roundRect(7, 10, 20, 16, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(5, 6, 22, 16, 2).fill(grad([[0, 0x8a86e8], [1, 0x45338f]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
    // peine de contactos
    g.rect(8, 22, 16, 3.5).fill(0x45338f).stroke({ width: 1.2, color: INK });
    for (let x = 9.5; x < 23; x += 2.5) g.rect(x, 22.5, 1.3, 2.6).fill(C.METAL_L);
    const sil = 0xe6ecf2;
    for (const pts of [[8, 9, 13, 9, 15, 11, 15, 14], [24, 9, 20, 9, 18, 11], [8, 19, 12, 19, 14, 17, 19, 17], [24, 14, 21, 14, 21, 20]]) {
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.stroke({ width: 1, color: sil, alpha: 0.95, join: 'round', cap: 'round' });
    }
    for (const [x, y] of [[15, 14], [18, 11], [19, 17], [21, 20]]) g.circle(x, y, 1).fill(sil);
    g.roundRect(9, 12, 4, 3, 0.6).fill(0x1f1d2e).stroke({ width: 0.7, color: INK });
    g.roundRect(17, 12.5, 3, 2, 0.5).fill(C.BUTTER).stroke({ width: 0.6, color: INK });
    line(g, 7, 7.7, 13, 7.7, 1, 0xffffff, 0.6);
  },
  // Androide: cabeza y hombros, ojos cian
  androide(g, s) {
    shadow(s, 16, 27, 13, 4);
    // hombros
    g.moveTo(3, 29).quadraticCurveTo(3, 21, 10, 20.5).lineTo(22, 20.5).quadraticCurveTo(29, 21, 29, 29).closePath()
      .fill(grad([[0, C.STEEL_L], [1, C.STEEL_D]], 0, 0, 0, 1)).stroke({ width: 1.7, color: INK });
    g.circle(16, 25, 1.8).fill(C.TEAL).stroke({ width: 0.8, color: INK });
    g.roundRect(13, 17, 6, 4.5, 1).fill(C.METAL_D).stroke({ width: 1.1, color: INK });
    // orejas
    g.roundRect(6, 8.5, 3.5, 6, 1.4).fill(C.STEEL).stroke({ width: 1, color: INK });
    g.roundRect(22.5, 8.5, 3.5, 6, 1.4).fill(C.STEEL).stroke({ width: 1, color: INK });
    // cabeza
    g.roundRect(8.5, 3, 15, 15.5, 6).fill(rgrad(0xffffff, 0xb9c4cc, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
    g.roundRect(10, 8, 12, 5, 2.5).fill(0x1f2a33).stroke({ width: 1, color: INK });
    g.circle(13, 10.5, 1.5).fill(C.TEAL);
    g.circle(19, 10.5, 1.5).fill(C.TEAL);
    g.circle(12.6, 10, 0.5).fill(0xffffff);
    g.circle(18.6, 10, 0.5).fill(0xffffff);
    line(g, 13.5, 15.3, 18.5, 15.3, 1, C.METAL_D);
    line(g, 11, 5, 15, 4.5, 1.1, 0xffffff, 0.9);
  },

  // ===================== Planeta arena =====================
  // Arena: montoncito gris-violeta con limaduras brillantes
  arena(g, s) {
    shadow(s, 16, 23, 13, 4.5);
    g.moveTo(3, 23).quadraticCurveTo(6, 15, 11, 12).quadraticCurveTo(16, 6, 21, 11).quadraticCurveTo(27, 15, 29, 23)
      .quadraticCurveTo(16, 26, 3, 23)
      .fill(grad([[0, 0xe0d8ec], [0.55, 0xb2a6c6], [1, 0x857a9c]], 0.3, 0, 0.7, 1)).stroke({ width: 1.7, color: INK });
    const dots = [[9, 19], [13, 15], [18, 13], [22, 18], [16, 21], [11, 22], [24, 21], [19, 17]];
    for (const [x, y] of dots) g.circle(x, y, 0.7).fill({ color: 0x6a5f80, alpha: 0.85 });
    // limaduras
    for (const [x, y, a] of [[12, 18, 0.4], [20, 15, -0.6], [17, 19.5, 1.2], [23, 20, 0.1]]) {
      line(g, x - Math.cos(a) * 1.4, y - Math.sin(a) * 1.4, x + Math.cos(a) * 1.4, y + Math.sin(a) * 1.4, 1, 0x4a4a55);
    }
    for (const [x, y, r] of [[15, 11, 1.8], [21, 19, 1.4], [10, 17, 1.2]]) {
      line(g, x - r, y, x + r, y, 0.9, 0xffffff);
      line(g, x, y - r, x, y + r, 0.9, 0xffffff);
    }
  },
  // Imán de herradura rojo con puntas plateadas
  iman(g, s) {
    shadow(s, 16, 25, 11, 4);
    const U = () => g.moveTo(9.5, 25).lineTo(9.5, 13).arc(16, 13, 6.5, Math.PI, 0).lineTo(22.5, 25);
    U().stroke({ width: 8.4, color: INK, cap: 'butt' });
    U().stroke({ width: 5.4, color: 0xe5484d, cap: 'butt' });
    g.moveTo(8.2, 13).arc(16, 13, 7.8, Math.PI * 1.05, Math.PI * 1.5).stroke({ width: 1.3, color: 0xff9a9a });
    // puntas
    for (const x of [9.5, 22.5]) {
      g.rect(x - 4.2, 19.5, 8.4, 6).fill(INK);
      g.rect(x - 2.7, 20.3, 5.4, 4.6).fill(grad([[0, C.METAL_D], [0.4, C.METAL_L], [1, C.METAL_D]], 0, 0, 1, 0));
    }
    line(g, 7, 17.8, 7, 12, 1, 0xffffff, 0.6);
  },
  // Electroimán: núcleo metálico con bobina de hilo naranja
  electroiman(g, s) {
    shadow(s, 16, 23, 13, 4.5);
    g.roundRect(3, 11, 26, 9, 2).fill(grad([[0, C.STEEL_D], [0.35, C.STEEL_L], [0.6, C.STEEL], [1, C.STEEL_D]])).stroke({ width: 1.6, color: INK });
    g.roundRect(8.5, 6.5, 15, 18, 3).fill(grad([[0, 0xc96a35], [0.35, 0xffc79a], [0.6, 0xf5a96b], [1, 0xb05a2a]])).stroke({ width: 1.7, color: INK });
    for (let x = 10.5; x < 23; x += 1.9) line(g, x, 7.3, x - 0.8, 23.7, 0.8, 0xa04f22, 0.75);
    line(g, 9.5, 10, 22.5, 10, 1.1, 0xffffff, 0.45);
    // cables
    g.moveTo(11, 24).quadraticCurveTo(9, 28, 5, 27).stroke({ width: 1.4, color: 0xb05a2a, cap: 'round' });
    g.moveTo(21, 24).quadraticCurveTo(23, 28, 27, 27).stroke({ width: 1.4, color: 0xb05a2a, cap: 'round' });
    g.circle(5, 27, 1.1).fill(C.METAL_L).stroke({ width: 0.6, color: INK });
    g.circle(27, 27, 1.1).fill(C.METAL_L).stroke({ width: 0.6, color: INK });
  },
  // Aerodeslizador: vehículo flotante redondo con falda y panel azul
  aerodeslizador(g, s) {
    s.ellipse(16, 23, 13, 5).fill({ color: 0x7fe3e0, alpha: 0.5 }); // colchón de aire
    shadow(s, 16, 24, 11, 4, 0.35);
    g.ellipse(16, 17, 14, 9.5).fill(grad([[0, 0x4a4e55], [1, 0x23252a]])).stroke({ width: 1.8, color: INK });
    g.ellipse(16, 14.5, 11, 7.5).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.4, 0.3)).stroke({ width: 1.6, color: INK });
    // ventilador trasero
    g.circle(9, 13.5, 4).fill(0x3a3d42).stroke({ width: 1.3, color: INK });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      g.ellipse(9 + Math.cos(a) * 1.9, 13.5 + Math.sin(a) * 1.9, 1.7, 1).fill(C.METAL_L);
    }
    g.circle(9, 13.5, 1).fill(C.RUST);
    // panel azul
    g.roundRect(15, 10, 8, 6, 2.5).fill(grad([[0, 0xbfe2ff], [1, 0x3f7fd6]], 0, 0, 1, 1)).stroke({ width: 1.2, color: INK });
    line(g, 16.5, 11.5, 19.5, 11.5, 1, 0xffffff, 0.9);
    g.circle(24.5, 17, 1).fill(C.ROSE);
  },

  // ===================== Planeta hielo =====================
  // Hielo: bloques de hielo azul translúcido
  hielo(g, s) {
    shadow(s, 16, 24, 12, 4.5);
    const cube = (x, y, w, h, d) => {
      g.roundRect(x, y + d, w, h, 2).fill({ color: 0x6fa8d8, alpha: 0.9 }).stroke({ width: 1.5, color: INK });
      g.roundRect(x, y, w, h, 2).fill(grad([[0, 0xf2fbff], [1, 0x9fd0f0]], 0, 0, 1, 1)).stroke({ width: 1.5, color: INK });
      line(g, x + 2, y + 2.5, x + w * 0.55, y + 2, 1.2, 0xffffff, 0.95);
      line(g, x + w - 3, y + h - 2, x + w - 2, y + h * 0.5, 0.9, 0x6fa8d8, 0.8);
    };
    cube(4, 9, 13, 10, 4);
    cube(15, 5, 12, 11, 4.5);
    cube(17, 16, 9, 6, 3);
  },
  // Refrigerante: bidón azul con copo de nieve
  refrigerante(g, s) {
    shadow(s, 16, 25, 11, 4.5);
    g.roundRect(6.5, 6, 19, 20, 4).fill(grad([[0, 0x2f6aa8], [0.3, 0xbfe2ff], [0.55, 0x6fb4e8], [1, 0x2a5f99]], 0, 0, 1, 0)).stroke({ width: 1.8, color: INK });
    for (const y of [11, 21]) line(g, 7, y, 25, y, 1.4, 0x2a5f99, 0.8);
    g.ellipse(16, 6.5, 9.5, 3.2).fill(grad([[0, 0xdff1ff], [1, 0x8fc6ef]])).stroke({ width: 1.5, color: INK });
    g.circle(19.5, 6.3, 1.4).fill(0x2a5f99).stroke({ width: 0.8, color: INK });
    snowflake(g, 16, 16, 4.2, 0xffffff, 1.3);
  },
  // Nevera: nevera blanca pequeña con tirador
  nevera(g, s) {
    s.roundRect(9, 20, 17, 7, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(8, 3, 16, 24, 3).fill(grad([[0, 0xffffff], [0.7, 0xe6ebf0], [1, 0xc3ccd6]], 0, 0, 1, 0)).stroke({ width: 1.8, color: INK });
    line(g, 8.5, 11, 23.5, 11, 1.3, INK);
    g.roundRect(20, 5.5, 2, 3.8, 1).fill(C.METAL_D).stroke({ width: 0.7, color: INK });
    g.roundRect(20, 13.5, 2, 8, 1).fill(C.METAL_D).stroke({ width: 0.7, color: INK });
    g.circle(12, 7, 1.4).fill(0x6fb4e8).stroke({ width: 0.7, color: INK });
    line(g, 10, 13.5, 10, 22, 1.2, 0xffffff, 0.9);
    g.rect(9.5, 25, 3, 2.5).fill(C.METAL_DD);
    g.rect(19.5, 25, 3, 2.5).fill(C.METAL_DD);
  },
  // Criocápsula: cápsula ovalada de cristal escarchado con marco metálico
  criocapsula(g, s) {
    shadow(s, 16, 24, 14, 4.5);
    g.roundRect(2, 7, 28, 17, 8.5).fill(grad([[0, C.METAL_L], [1, C.METAL_D]])).stroke({ width: 1.8, color: INK });
    g.roundRect(5, 9.5, 22, 12, 6).fill(grad([[0, 0xeefcff], [1, 0x8fd8ea]], 0, 0, 1, 1)).stroke({ width: 1.2, color: INK });
    // silueta helada dentro
    g.ellipse(16, 15.5, 7, 3).fill({ color: 0x5fa8c8, alpha: 0.45 });
    g.circle(9.5, 15.5, 2.4).fill({ color: 0x5fa8c8, alpha: 0.45 });
    // escarcha
    for (const [x, y, r] of [[8, 11.5, 2.4], [24, 19, 2.6], [20, 11, 1.6], [12, 19.5, 1.5]]) g.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.75 });
    line(g, 13, 11.3, 19, 11.3, 1.1, 0xffffff, 0.95);
    for (const x of [11, 21]) line(g, x, 7.5, x, 23.5, 2, C.METAL_D);
    g.circle(28, 15.5, 1.2).fill(C.TEAL).stroke({ width: 0.7, color: INK });
    rivet(g, 4.5, 15.5, 1.1);
  },
};
