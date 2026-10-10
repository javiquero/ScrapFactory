// Sprites de los objetos que viajan por las cintas (32 px).

import { ITEMS } from '../defs.js';
import { placeArt } from './art.js';
import { C, tex, grad, vgrad, rgrad, rivet, line, rustStain } from './common.js';

const { INK, SHADOW } = C;

const DRAW = {
  // Trozo de chatarra: chapa abollada con un tornillo y óxido
  chatarra(g, s) {
    s.ellipse(16, 22, 11, 5).fill({ color: SHADOW, alpha: 0.4 });
    g.poly([4, 15, 9, 6, 20, 4, 27, 10, 26, 20, 15, 24, 6, 22]).fill(grad([[0, 0xe0dacd], [0.5, 0xaaa294], [1, 0x7e776c]], 0, 0, 0.7, 1)).stroke({ width: 1.8, color: INK });
    g.poly([20, 4, 27, 10, 26, 20, 22, 13]).fill({ color: 0x6f695f, alpha: 0.85 });
    line(g, 8, 15, 18, 18, 1.3, 0x7d756a);
    rustStain(g, 19, 9, 2.6);
    rivet(g, 11, 11, 1.6);
  },
  // Placa prensada: lámina azulada con remaches y brillo
  placa(g, s) {
    s.roundRect(6, 12, 22, 14, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(5, 11, 22, 4, 2).fill(0x5d7f94).stroke({ width: 1.5, color: INK });
    g.roundRect(5, 6, 22, 9, 2).fill(grad([[0, 0xe3f2fb], [0.5, 0xa9cde6], [1, 0x7fa9c6]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
    line(g, 8, 8, 18, 8, 1.4, 0xffffff, 0.7);
    for (const x of [8.5, 23.5]) rivet(g, x, 10.5, 1.3);
  },
  // Engranaje de latón
  engranaje(g, s) {
    s.ellipse(16, 23, 11, 5).fill({ color: SHADOW, alpha: 0.4 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.roundRect(16 + Math.cos(a) * 10 - 2.6, 15 + Math.sin(a) * 10 - 2.6, 5.2, 5.2, 1.2).fill(C.BUTTER_D).stroke({ width: 1.1, color: INK });
    }
    g.circle(16, 15, 9.5).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
    g.circle(16, 15, 3.4).fill(0x6b5214).stroke({ width: 1.2, color: INK });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      g.circle(16 + Math.cos(a) * 6.3, 15 + Math.sin(a) * 6.3, 1.2).fill({ color: INK, alpha: 0.6 });
    }
  },
};

export function makeItems(renderer, t, art = {}) {
  for (const type in ITEMS) {
    const png = art['item_' + type];
    t['item_' + type] = png
      ? tex(renderer, (g, s, mid) => { s.ellipse(16, 25, 10, 4).fill({ color: SHADOW, alpha: 0.4 }); placeArt(mid, png, { cx: 16, bottom: 27, w: 27, h: 24 }); }, 32, 32, 1.5)
      : tex(renderer, DRAW[type], 32, 32, 1.5);
  }
}
