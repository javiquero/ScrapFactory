// Sprites del planeta: vertederos de chatarra y decoración.

import { C, T, HALF, tex, shadow, rivet, patch } from './common.js';

const { INK, SHADOW, METAL, METAL_D, METAL_L, RUST, RUST_L, RUST_D, MINT, MINT_L, MINT_D, LILAC, LILAC_L, LILAC_D, BUTTER, BUTTER_D, TEAL, TEAL_D } = C;

export function makeTerrain(renderer, t) {
  // ---- Vertederos de chatarra (3 variantes para que no se vean todos iguales) ----
  const junk = [
    (g) => { // neumático + lata
      g.circle(22, 24, 10).fill(0x4a4540).stroke({ width: 2.5, color: INK }); g.circle(22, 24, 4).fill(0x8a7a60);
      g.roundRect(36, 30, 12, 16, 3).fill(RUST).stroke({ width: 2, color: INK }); g.rect(36, 35, 12, 3).fill(RUST_L);
    },
    (g) => { // tubo doblado + engranaje roto
      g.moveTo(14, 42).lineTo(26, 42).lineTo(32, 30).stroke({ width: 7, color: INK });
      g.moveTo(14, 42).lineTo(26, 42).lineTo(32, 30).stroke({ width: 4, color: METAL });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 1.6; g.circle(42 + Math.cos(a) * 8, 22 + Math.sin(a) * 8, 2.6).fill(BUTTER_D); }
      g.circle(42, 22, 6).fill(BUTTER).stroke({ width: 2, color: INK });
    },
    (g) => { // tablón + chapa abollada
      g.roundRect(12, 18, 28, 8, 2).fill(0xb98a5a).stroke({ width: 2, color: INK });
      g.poly([30, 34, 48, 30, 50, 44, 34, 48]).fill(MINT).stroke({ width: 2, color: INK });
      rivet(g, 34, 36, 1.5);
    },
  ];
  junk.forEach((draw, i) => {
    t['node_chatarra_' + i] = tex(renderer, (g) => {
      // montículo de tierra irregular
      g.poly([6, 34, 10, 14, 24, 6, 42, 8, 56, 18, 58, 40, 50, 56, 30, 58, 12, 52]).fill(0xa08a68).stroke({ width: 2, color: 0x7d6a4f });
      g.poly([12, 30, 16, 18, 28, 12, 40, 14, 50, 22]).fill({ color: 0xbca27c, alpha: 0.6 });
      g.circle(18, 48, 2).fill(0x7d6a4f); g.circle(46, 50, 1.6).fill(0x7d6a4f);
      draw(g);
    });
  });
  t.node_chatarra = t.node_chatarra_0;

  // ---- Decoración del planeta ----
  t.arbol = tex(renderer, (g) => {
    g.ellipse(32, 54, 16, 5).fill({ color: SHADOW, alpha: 0.18 });
    g.roundRect(29, 34, 6, 20, 3).fill(0x8a6a4a).stroke({ width: 2, color: INK });
    // copa alienígena: bolas con antenitas
    g.circle(32, 26, 16).fill(0x5fb87a).stroke({ width: 2.5, color: INK });
    g.circle(22, 32, 9).fill(0x6fc78a).stroke({ width: 2, color: INK });
    g.circle(42, 31, 9).fill(0x52a86c).stroke({ width: 2, color: INK });
    g.circle(27, 21, 4).fill({ color: 0xffffff, alpha: 0.35 });
    g.moveTo(32, 10).lineTo(34, 4).stroke({ width: 2, color: INK }); g.circle(34, 4, 2.4).fill(0xffd1f0).stroke({ width: 1.2, color: INK });
  });
  t.flor = tex(renderer, (g) => {
    for (const [x, y, c] of [[20, 26, 0xffb3d1], [42, 38, 0xfff09a], [28, 46, 0xc7b8ff]]) {
      g.moveTo(x, y + 2).lineTo(x, y + 9).stroke({ width: 2, color: 0x3f7a40 });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.circle(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3).fill(c);
      }
      g.circle(x, y, 2.5).fill(0xffffff);
    }
  });
  t.piedra = tex(renderer, (g) => {
    g.ellipse(32, 44, 17, 6).fill({ color: SHADOW, alpha: 0.15 });
    g.poly([16, 42, 20, 30, 32, 26, 44, 30, 48, 42, 36, 46, 22, 46]).fill(0xb3b9a8).stroke({ width: 2.5, color: INK });
    g.poly([22, 34, 30, 30, 36, 32]).fill({ color: 0xffffff, alpha: 0.4 });
  });

}
