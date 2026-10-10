// Paleta y piezas de dibujo compartidas por todos los sprites.

import { Graphics, Rectangle } from '../../vendor/pixi.min.mjs';
import { TILE } from '../defs.js';

export const T = TILE;
export const HALF = T / 2;

export const C = {
  INK: 0x3b3328,          // contorno
  SHADOW: 0x1f2a18,
  METAL: 0xcfc8ba, METAL_D: 0x8e877b, METAL_L: 0xece7dc,
  RUST: 0xe7976a, RUST_L: 0xf6c3a0, RUST_D: 0xb5653d,
  MINT: 0x8fd3c1, MINT_L: 0xc7ede2, MINT_D: 0x4f9e8c,
  LILAC: 0xb9a6e3, LILAC_L: 0xddd2f5, LILAC_D: 0x7d68b0,
  BUTTER: 0xf6d77a, BUTTER_D: 0xc9a53f,
  TEAL: 0x7fe3e0, TEAL_D: 0x2f5d63,
  BELT: 0x4b5049, BELT_L: 0x5d635b,
};

// Dibuja con `draw` y lo convierte en textura de `size` px (resolución doble)
export function tex(renderer, draw, size = T) {
  const g = new Graphics();
  draw(g);
  const t = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, size, size), resolution: 2, antialias: true });
  g.destroy();
  return t;
}

export const shadow = (g, x, y, w, h, r) => g.roundRect(x, y + 4, w, h, r).fill({ color: C.SHADOW, alpha: 0.22 });

export function rivet(g, x, y, r = 2.2) {
  g.circle(x, y, r).fill(C.METAL_L).stroke({ width: 1.2, color: C.INK });
}

// Parche atornillado, ligeramente torcido
export function patch(g, x, y, w, h, color = C.METAL, tilt = 0.08) {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const pts = [[0, 0], [w, 0], [w, h], [0, h]].flatMap(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
  g.poly(pts).fill(color).stroke({ width: 2, color: C.INK });
  rivet(g, pts[0] + 3 * c, pts[1] + 3, 1.5);
  rivet(g, pts[2] - 3, pts[3] + 3, 1.5);
}
