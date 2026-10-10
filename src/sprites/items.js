// Sprites de los objetos que viajan por las cintas (32 px).

import { ITEMS } from '../defs.js';
import { C, T, HALF, tex, shadow, rivet, patch } from './common.js';

const { INK, SHADOW, METAL, METAL_D, METAL_L, RUST, RUST_L, RUST_D, MINT, MINT_L, MINT_D, LILAC, LILAC_L, LILAC_D, BUTTER, BUTTER_D, TEAL, TEAL_D } = C;

export function makeItems(renderer, t) {
  for (const type in ITEMS) t['item_' + type] = tex(renderer, (g) => drawItem(g, type), 32);
}

function drawItem(g, type) {
  g.ellipse(16, 24, 10, 4).fill({ color: SHADOW, alpha: 0.25 });
  switch (type) {
    case 'chatarra':
      g.poly([5, 15, 10, 6, 21, 5, 27, 12, 25, 22, 14, 25, 7, 22]).fill(0xaaa194).stroke({ width: 2, color: INK });
      g.circle(19, 11, 2.6).fill(RUST);
      g.moveTo(9, 16).lineTo(18, 19).stroke({ width: 1.6, color: 0x7d756a });
      break;
    case 'placa':
      g.roundRect(6, 6, 20, 18, 4).fill(0xa9cde6).stroke({ width: 2, color: INK });
      g.roundRect(9, 8, 14, 4, 2).fill({ color: 0xffffff, alpha: 0.5 });
      for (const [x, y] of [[10, 20], [22, 20]]) g.circle(x, y, 1.6).fill(INK);
      break;
    case 'engranaje':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.circle(16 + Math.cos(a) * 9.5, 15 + Math.sin(a) * 9.5, 3).fill(BUTTER).stroke({ width: 1.5, color: INK });
      }
      g.circle(16, 15, 9).fill(BUTTER).stroke({ width: 2, color: INK });
      g.circle(16, 15, 3.2).fill(INK);
      break;
  }
}
