// Piezas de dibujo compartidas por los sprites de máquinas (machines.js y machines2.js).

import { C, TOP, cyl, rgrad, line } from './common.js';

const { INK, SHADOW } = C;

export const Y = (y) => TOP + y; // coordenada dentro de la casilla → coordenada en la textura

// Viga con contorno (patas, brazos)
export function beam(g, x1, y1, x2, y2, w, color, light) {
  line(g, x1, y1, x2, y2, w + 3, INK);
  line(g, x1, y1, x2, y2, w, color);
  if (light) line(g, x1 - w * 0.2, y1, x2 - w * 0.2, y2, Math.max(1, w * 0.3), light, 0.8);
}

// Cilindro vertical (columna, eje) con brillo
export function column(g, x, y, w, h, dark, mid, light) {
  g.roundRect(x, y, w, h, w * 0.3).fill(cyl(dark, mid, light, false)).stroke({ width: 2, color: INK });
}

// ---------------------------------------------------------------------------
// Vista en PLANTA (desde arriba del todo), igual que las cintas: cada máquina
// ocupa su casilla de borde a borde para que las cintas lleguen hasta ella.
// La altura se insinúa solo con sombras y brillos.
// ---------------------------------------------------------------------------

// Sombra de algo que está levantado del suelo
export const lift = (s, x, y, w, h, r, d = 4) => s.roundRect(x + d * 0.6, y + d, w, h, r).fill({ color: SHADOW, alpha: 0.45 });

// Tornillo hexagonal visto desde arriba
export function bolt(g, x, y, r = 2.6) {
  const pts = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.poly(pts).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1, color: INK });
}

