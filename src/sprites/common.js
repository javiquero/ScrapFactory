// Paleta y herramientas de dibujo compartidas por todos los sprites.

import { BlurFilter, Container, FillGradient, Graphics, Rectangle } from '../../vendor/pixi.min.mjs';
import { TILE } from '../defs.js';

export const T = TILE;
export const HALF = T / 2;

// Las máquinas son más altas que la casilla: textura de T × TALL, con la casilla
// ocupando la parte de abajo. El sprite se ancla en MACHINE_ANCHOR_Y.
export const TALL = 88;
export const MACHINE_ANCHOR_Y = (TALL - HALF) / TALL;
export const TOP = TALL - T;          // px que sobresalen por arriba de la casilla

export const C = {
  INK: 0x2e2822,          // contorno
  SHADOW: 0x16200f,
  METAL: 0xc9c3b8, METAL_D: 0x7f796f, METAL_L: 0xf1ede6, METAL_DD: 0x55504a,
  STEEL: 0x8fa0ad, STEEL_D: 0x55636e, STEEL_L: 0xd4dee6,
  RUST: 0xe0895b, RUST_L: 0xf5be98, RUST_D: 0xa9562f,
  MINT: 0x7fcab6, MINT_L: 0xc2ece0, MINT_D: 0x3f8a78,
  LILAC: 0xab97dc, LILAC_L: 0xddd2f5, LILAC_D: 0x6a569e,
  BUTTER: 0xf3cf62, BUTTER_L: 0xfff0b8, BUTTER_D: 0xb88d27,
  TEAL: 0x7fe3e0, TEAL_D: 0x245056,
  BELT: 0x3e423d, BELT_L: 0x555a53, BELT_D: 0x2a2d29,
  DIRT: 0x9b8462, DIRT_L: 0xb9a07a, DIRT_D: 0x6f5c42,
  ROSE: 0xff8fa0,
};

// ---- Degradados (coordenadas 0..1 relativas a la forma) ----
export const grad = (stops, x0 = 0, y0 = 0, x1 = 0, y1 = 1) => new FillGradient({
  type: 'linear',
  start: { x: x0, y: y0 },
  end: { x: x1, y: y1 },
  colorStops: stops.map(([offset, color]) => ({ offset, color })),
  textureSpace: 'local',
});
export const vgrad = (top, bottom) => grad([[0, top], [1, bottom]]);
export const hgrad = (left, right) => grad([[0, left], [1, right]], 0, 0, 1, 0);
// Metal cilíndrico: oscuro en los bordes, brillo cerca del centro
export const cyl = (dark, mid, light, horizontal = true) => horizontal
  ? grad([[0, dark], [0.35, light], [0.55, mid], [1, dark]], 0, 0, 0, 1)
  : grad([[0, dark], [0.35, light], [0.55, mid], [1, dark]], 0, 0, 1, 0);
export const rgrad = (inner, outer, cx = 0.5, cy = 0.5) => new FillGradient({
  type: 'radial',
  center: { x: cx, y: cy },
  innerRadius: 0,
  outerCenter: { x: cx, y: cy },
  outerRadius: 0.5,
  colorStops: [{ offset: 0, color: inner }, { offset: 1, color: outer }],
  textureSpace: 'local',
});

// Dibuja y convierte en textura. `draw(g, sh)`: g es el dibujo, sh una capa de
// sombra que se difumina para que quede suave.
export function tex(renderer, draw, w = T, h = w, blur = 3) {
  const root = new Container();
  const sh = new Graphics();
  const g = new Graphics();
  root.addChild(sh, g);
  draw(g, sh);
  if (sh.getLocalBounds().width > 0) sh.filters = [new BlurFilter({ strength: blur, quality: 3 })];
  const t = renderer.generateTexture({ target: root, frame: new Rectangle(0, 0, w, h), resolution: 2, antialias: true });
  root.destroy({ children: true });
  return t;
}

// ---- Piezas ----
export function rivet(g, x, y, r = 2) {
  g.circle(x, y, r).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.35)).stroke({ width: 1, color: C.INK, alpha: 0.8 });
}

export const line = (g, x1, y1, x2, y2, w, color, alpha = 1) =>
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: w, color, alpha, cap: 'round', join: 'round' });

// Bloque con techo y cara frontal (vista cenital con perspectiva)
export function block(g, x, y, w, h, depth, top, front, r = 4, outline = 2.2) {
  g.roundRect(x, y + depth, w, h, r).fill(front).stroke({ width: outline, color: C.INK });
  g.roundRect(x, y, w, h, r).fill(top).stroke({ width: outline, color: C.INK });
}

// Recorta un polígono [x,y,...] a un rectángulo (Sutherland–Hodgman)
function clipToRect(pts, x0, y0, x1, y1) {
  let poly = [];
  for (let i = 0; i < pts.length; i += 2) poly.push([pts[i], pts[i + 1]]);
  const edges = [
    (p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1,
  ];
  const cut = [
    (a, b) => { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y0]; },
    (a, b) => { const t = (y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y1]; },
  ];
  for (let e = 0; e < 4 && poly.length; e++) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ina = edges[e](a), inb = edges[e](b);
      if (ina) out.push(a);
      if (ina !== inb) out.push(cut[e](a, b));
    }
    poly = out;
  }
  return poly.flat();
}

// Rayas de aviso amarillas y negras dentro de un rectángulo
export function hazard(g, x, y, w, h, step = 5) {
  g.rect(x, y, w, h).fill(C.BUTTER);
  for (let k = -h - step; k < w + step; k += step * 2) {
    const pts = clipToRect([x + k, y + h, x + k + h, y, x + k + h + step, y, x + k + step, y + h], x, y, x + w, y + h);
    if (pts.length >= 6) g.poly(pts).fill(C.INK);
  }
  g.rect(x, y, w, h).stroke({ width: 1.5, color: C.INK });
}

// Mancha de óxido irregular
export function rustStain(g, x, y, r, alpha = 0.55) {
  g.circle(x, y, r).fill({ color: C.RUST_D, alpha: alpha * 0.6 });
  g.circle(x + r * 0.4, y + r * 0.2, r * 0.6).fill({ color: C.RUST, alpha });
}

// Generador pseudoaleatorio determinista para los dibujos
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
