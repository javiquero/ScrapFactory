// Sprites del planeta: piezas de chatarra para los vertederos y decoración.
// Los vertederos no son un sprite por casilla: render.js pinta una mancha de tierra
// continua y reparte encima estas piezas sueltas (junk_*), cada una a su aire.

import { C, T, tex, grad, vgrad, rgrad, cyl, rivet, line, rustStain, prng } from './common.js';

const { INK, SHADOW } = C;
const J = 44; // tamaño de las piezas sueltas

const sh = (s, x, y, rx, ry, a = 0.35) => s.ellipse(x, y, rx, ry).fill({ color: SHADOW, alpha: a });

const JUNK = {
  // Neumático tumbado
  tire(g, s) {
    sh(s, 23, 27, 17, 11);
    g.ellipse(22, 22, 17, 12).fill(rgrad(0x5a5550, 0x2a2725, 0.4, 0.35)).stroke({ width: 2, color: INK });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      line(g, 22 + Math.cos(a) * 13.5, 22 + Math.sin(a) * 9.5, 22 + Math.cos(a) * 16.5, 22 + Math.sin(a) * 11.5, 1.6, 0x1c1a19);
    }
    g.ellipse(22, 21, 8, 5).fill(C.DIRT_D).stroke({ width: 1.6, color: INK });
    g.ellipse(22, 22.5, 6, 3).fill({ color: C.DIRT, alpha: 0.9 });
    g.ellipse(16, 16, 5, 2).fill({ color: 0xffffff, alpha: 0.18 });
  },
  // Bidón tumbado, pintura verde descascarillada
  barrel(g, s) {
    sh(s, 23, 32, 18, 6);
    g.roundRect(6, 12, 32, 18, 6).fill(cyl(0x2f6b5b, 0x4f9e8c, 0x9fdcca)).stroke({ width: 2, color: INK });
    for (const x of [14, 30]) g.rect(x, 12, 2.5, 18).fill({ color: INK, alpha: 0.45 });
    g.ellipse(38, 21, 4, 9).fill(cyl(0x2f6b5b, 0x4f9e8c, 0x9fdcca, false)).stroke({ width: 2, color: INK });
    g.circle(38, 18, 1.6).fill(INK);
    rustStain(g, 21, 26, 3.5);
    rustStain(g, 10, 15, 2.5, 0.45);
  },
  // Tubo doblado con bridas
  pipe(g, s) {
    sh(s, 22, 30, 18, 6);
    g.moveTo(6, 30).lineTo(18, 30).quadraticCurveTo(30, 30, 32, 14).stroke({ width: 10, color: INK, cap: 'butt' });
    g.moveTo(6, 30).lineTo(18, 30).quadraticCurveTo(30, 30, 32, 14).stroke({ width: 7, color: C.STEEL, cap: 'butt' });
    g.moveTo(6, 28).lineTo(18, 28).quadraticCurveTo(28, 28, 30, 14).stroke({ width: 2, color: C.STEEL_L, cap: 'butt' });
    g.roundRect(2, 23, 6, 14, 2).fill(C.STEEL_D).stroke({ width: 1.6, color: INK });
    g.roundRect(26, 8, 13, 6, 2).fill(C.STEEL_D).stroke({ width: 1.6, color: INK });
    rustStain(g, 20, 31, 2.5);
  },
  // Chapa doblada con remaches
  plate(g, s) {
    sh(s, 23, 30, 17, 7);
    g.poly([5, 18, 30, 10, 40, 22, 14, 34]).fill(grad([[0, 0xd9d3c7], [0.5, 0xaea79a], [1, 0x8a8377]], 0, 0, 1, 1)).stroke({ width: 2, color: INK });
    g.poly([30, 10, 40, 22, 39, 27, 29, 14]).fill(0x6f695f).stroke({ width: 1.6, color: INK });
    rivet(g, 11, 20, 1.6); rivet(g, 27, 15, 1.6); rivet(g, 18, 29, 1.6);
    rustStain(g, 31, 22, 3);
  },
  // Engranaje medio enterrado
  gear(g, s) {
    sh(s, 22, 30, 16, 6);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.roundRect(22 + Math.cos(a) * 13 - 3, 21 + Math.sin(a) * 13 - 3, 6, 6, 1.5).fill(C.BUTTER_D).stroke({ width: 1.2, color: INK });
    }
    g.circle(22, 21, 12).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.38, 0.32)).stroke({ width: 2, color: INK });
    g.circle(22, 21, 5).fill(C.BUTTER_D).stroke({ width: 1.6, color: INK });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      g.circle(22 + Math.cos(a) * 8.5, 21 + Math.sin(a) * 8.5, 1.8).fill(INK);
    }
    // tierra que lo tapa por abajo
    g.ellipse(22, 34, 16, 5).fill(C.DIRT).stroke({ width: 1.4, color: C.DIRT_D });
  },
  // Viga en doble T
  beam(g, s) {
    sh(s, 22, 30, 19, 6);
    g.poly([3, 26, 33, 10, 40, 16, 10, 32]).fill(vgrad(0xc87a4d, 0x8d4a27)).stroke({ width: 2, color: INK });
    g.poly([5, 22, 33, 7, 35, 10, 5, 26]).fill(C.RUST_L).stroke({ width: 1.6, color: INK });
    for (const [x, y] of [[13, 23], [22, 18], [31, 13]]) g.ellipse(x, y, 2.2, 1.6).fill(INK);
  },
  // Lata de pintura volcada
  can(g, s) {
    sh(s, 21, 31, 13, 5);
    g.roundRect(8, 16, 20, 14, 4).fill(cyl(0xa9562f, C.RUST, C.RUST_L)).stroke({ width: 2, color: INK });
    g.ellipse(28, 23, 3.5, 7).fill(C.METAL_D).stroke({ width: 1.6, color: INK });
    g.ellipse(36, 30, 7, 3).fill({ color: 0x7fcab6, alpha: 0.9 }); // pintura derramada
    g.rect(12, 20, 10, 4).fill({ color: 0xffffff, alpha: 0.5 });
  },
  // Caja de madera rota
  crate(g, s) {
    sh(s, 22, 32, 17, 6);
    g.roundRect(7, 10, 28, 22, 2).fill(vgrad(0xd2a370, 0x9c6e40)).stroke({ width: 2, color: INK });
    for (const y of [17, 24]) line(g, 8, y, 34, y, 1.4, 0x7a5330);
    line(g, 8, 11, 34, 31, 3, 0x7a5330);
    g.poly([26, 10, 35, 10, 35, 18]).fill(C.DIRT_D);
    for (const [x, y] of [[10, 13], [32, 13], [10, 29], [32, 29]]) g.circle(x, y, 1.2).fill(INK);
  },
};

export const JUNK_KEYS = Object.keys(JUNK).map((k) => 'junk_' + k);

// ---- Decoración ----
function tree(g, s, variant) {
  sh(s, 33, 58, 20, 7, 0.4);
  g.roundRect(29, 40, 7, 18, 3).fill(hgradTrunk()).stroke({ width: 2, color: INK });
  const greens = [[0x4fae6e, 0x2f7d4a, 0x8fdba5], [0x5cb38a, 0x2f7a5e, 0x9fe3c0]][variant];
  const blobs = [[32, 26, 17], [20, 33, 11], [44, 32, 11], [33, 38, 12]];
  for (const [x, y, r] of blobs) g.circle(x, y + 2, r).fill(greens[1]);
  for (const [x, y, r] of blobs) g.circle(x, y, r).fill(rgrad(greens[2], greens[0], 0.35, 0.3)).stroke({ width: 2, color: INK, alpha: 0.85 });
  // frutos/brotes alienígenas
  for (const [x, y] of [[26, 22], [40, 28], [30, 35]]) g.circle(x, y, 2.4).fill(variant ? 0xffd1f0 : 0xfff0a0).stroke({ width: 1, color: INK });
}
const hgradTrunk = () => grad([[0, 0x6b4b2e], [0.4, 0xa07650], [1, 0x5a3e25]], 0, 0, 1, 0);

export function makeTerrain(renderer, t) {
  for (const [k, draw] of Object.entries(JUNK)) t['junk_' + k] = tex(renderer, draw, J, J, 2.5);

  // Icono genérico de vertedero (para la interfaz)
  t.node_chatarra = tex(renderer, (g, s) => {
    s.ellipse(32, 44, 28, 14).fill({ color: SHADOW, alpha: 0.3 });
    g.ellipse(32, 40, 28, 16).fill(C.DIRT).stroke({ width: 2, color: C.DIRT_D });
    JUNK.tire(g, s);
  });

  t.arbol = tex(renderer, (g, s) => tree(g, s, 0));
  t.arbol2 = tex(renderer, (g, s) => tree(g, s, 1));

  t.arbusto = tex(renderer, (g, s) => {
    sh(s, 32, 46, 18, 6);
    for (const [x, y, r] of [[24, 38, 10], [38, 38, 11], [31, 32, 11]]) g.circle(x, y, r).fill(rgrad(0x9fdca0, 0x4f9a5a, 0.35, 0.3)).stroke({ width: 2, color: INK, alpha: 0.85 });
    for (const [x, y] of [[26, 34], [36, 31], [40, 40]]) g.circle(x, y, 1.8).fill(0xff9ec4);
  });

  t.flor = tex(renderer, (g) => {
    const r = prng(7);
    for (const [x, y, c] of [[18, 26, 0xffb3d1], [42, 36, 0xfff09a], [28, 46, 0xc7b8ff], [46, 18, 0xffb3d1]]) {
      line(g, x, y + 2, x + (r() - 0.5) * 3, y + 10, 1.8, 0x3f7a40);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + r();
        g.circle(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6, 2.8).fill(c).stroke({ width: 0.8, color: INK, alpha: 0.5 });
      }
      g.circle(x, y, 2).fill(0xfff6d8);
    }
  });

  t.piedra = tex(renderer, (g, s) => {
    sh(s, 32, 46, 18, 6);
    g.poly([14, 44, 17, 32, 27, 25, 41, 27, 49, 37, 46, 46, 30, 49]).fill(grad([[0, 0xdfe3d6], [0.6, 0xa7ad9d], [1, 0x7c8274]], 0, 0, 0.6, 1)).stroke({ width: 2, color: INK });
    g.poly([20, 34, 27, 28, 36, 29, 30, 33]).fill({ color: 0xffffff, alpha: 0.35 });
    g.circle(40, 41, 4).fill({ color: 0x6fae5e, alpha: 0.8 }); // musgo
  });

  t.mata = tex(renderer, (g) => {
    for (const [x, y] of [[20, 40], [40, 30], [30, 50]]) {
      for (const dx of [-4, 0, 4]) line(g, x, y, x + dx * 0.8, y - 9 - Math.abs(dx) * -0.3, 2, 0x5f9e48);
    }
  });
}
