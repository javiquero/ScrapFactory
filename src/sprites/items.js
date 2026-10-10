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
  // Alambre: rollo de alambre gris con el extremo suelto
  alambre(g, s) {
    s.ellipse(16, 23, 11, 5).fill({ color: SHADOW, alpha: 0.4 });
    g.circle(16, 15, 10).fill(0x7f8a93).stroke({ width: 1.8, color: INK });
    for (let r = 8.6; r > 3.5; r -= 1.7) g.circle(16, 15, r).stroke({ width: 1.1, color: r > 6 ? 0xdde6ec : 0xb4c0c9 });
    g.circle(16, 15, 3.2).fill(0x3a3631).stroke({ width: 1, color: INK });
    line(g, 24, 19, 29, 24, 1.6, INK);
    line(g, 24, 19, 29, 24, 0.8, 0xdde6ec);
    line(g, 11, 9, 15, 7.5, 1.2, 0xffffff, 0.8);
  },
  // Tornillos: tres tornillos de cabeza hexagonal, amontonados
  tornillos(g, s) {
    s.ellipse(16, 24, 11, 4.5).fill({ color: SHADOW, alpha: 0.4 });
    const screw = (x, y, a) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      line(g, x, y, x + dx * 13, y + dy * 13, 4.6, INK);
      line(g, x, y, x + dx * 13, y + dy * 13, 2.8, C.METAL_L);
      for (let t = 4; t < 13; t += 2.4) line(g, x + dx * t - dy * 1.6, y + dy * t + dx * 1.6, x + dx * (t + 1) + dy * 1.6, y + dy * (t + 1) - dx * 1.6, 0.9, C.METAL_D);
      const pts = [];
      for (let i = 0; i < 6; i++) { const b = (i / 6) * Math.PI * 2; pts.push(x + Math.cos(b) * 4, y + Math.sin(b) * 4); }
      g.poly(pts).fill(rgrad(C.METAL_L, C.METAL_D, 0.35, 0.3)).stroke({ width: 1.2, color: INK });
      line(g, x - 2, y, x + 2, y, 1.1, INK);
    };
    screw(7, 9, 0.5);
    screw(23, 8, 2.2);
    screw(10, 20, -0.25);
  },
  // Muelle: espiral de alambre vista de lado
  muelle(g, s) {
    s.ellipse(16, 24, 10, 4).fill({ color: SHADOW, alpha: 0.4 });
    for (const [w, c] of [[3.6, INK], [1.8, 0xdde6ec]]) {
      g.moveTo(9, 22);
      for (let i = 0; i < 6; i++) {
        const y = 22 - i * 3;
        g.lineTo(23, y - 1.5).lineTo(9, y - 3);
      }
      g.stroke({ width: w, color: c, cap: 'round', join: 'round' });
    }
    line(g, 9, 22, 23, 22, 2, C.METAL_D);
    line(g, 9, 4, 23, 4, 2, C.METAL_D);
  },
  // Mecanismo: cajita con dos engranajes engranados y tornillos en las esquinas
  mecanismo(g, s) {
    s.roundRect(5, 11, 24, 16, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(3, 6, 26, 19, 3).fill(grad([[0, 0x9fb7d6], [1, 0x5a7397]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
    const gear = (x, y, r, n) => {
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.circle(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.6).fill(C.BUTTER_D).stroke({ width: 0.7, color: INK }); }
      g.circle(x, y, r - 0.8).fill(rgrad(C.BUTTER_L, C.BUTTER_D, 0.35, 0.3)).stroke({ width: 1.1, color: INK });
      g.circle(x, y, 1.3).fill(INK);
    };
    gear(12, 15.5, 5.5, 8);
    gear(21.5, 14, 3.8, 6);
    for (const [x, y] of [[6, 9], [26, 9], [6, 22], [26, 22]]) g.circle(x, y, 1).fill(C.METAL_L);
  },
  // Carcasa: caja de chapa abierta por arriba, con remaches
  carcasa(g, s) {
    s.roundRect(5, 11, 24, 15, 3).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(4, 6, 24, 19, 3).fill(grad([[0, 0xe3f2fb], [1, 0x7fa9c6]], 0, 0, 1, 1)).stroke({ width: 1.8, color: INK });
    g.roundRect(8, 10, 16, 11, 2).fill(0x4b6a7e).stroke({ width: 1, color: INK });
    line(g, 9, 12, 16, 12, 1.1, 0x87a8bd, 0.9);
    for (const [x, y] of [[6.5, 8.5], [25.5, 8.5], [6.5, 22.5], [25.5, 22.5]]) rivet(g, x, y, 1.2);
    line(g, 6, 7.5, 14, 7.5, 1.1, 0xffffff, 0.8);
  },
  // Motor: cuerpo cilíndrico con aletas, eje y bornes
  motor(g, s) {
    s.ellipse(16, 24, 12, 4.5).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(26, 13, 5, 4, 1).fill(C.METAL_L).stroke({ width: 1, color: INK });
    g.roundRect(5, 7, 21, 16, 5).fill(grad([[0, 0x3f8a86], [0.35, 0xbfeee8], [0.55, 0x8fe0d8], [1, 0x2f6a66]], 0, 0, 0, 1)).stroke({ width: 1.8, color: INK });
    for (let x = 9; x < 24; x += 3) line(g, x, 8, x, 22, 1, 0x2f6a66, 0.7);
    g.roundRect(3, 9, 5, 12, 2).fill(C.METAL_D).stroke({ width: 1.2, color: INK });
    g.roundRect(12, 3.5, 7, 4, 1).fill(C.BUTTER).stroke({ width: 1, color: INK });
    g.circle(14, 3.5, 1).fill(0xc0392b);
    g.circle(17.5, 3.5, 1).fill(INK);
  },
  // Robot de limpieza: disco con cara, parachoques y una antena
  robot(g, s) {
    s.ellipse(16, 25, 12, 4.5).fill({ color: SHADOW, alpha: 0.4 });
    line(g, 21, 8, 24, 2.5, 1.4, INK);
    g.circle(24, 2.5, 1.8).fill(C.ROSE).stroke({ width: 0.8, color: INK });
    g.ellipse(16, 15, 12, 10).fill(rgrad(C.MINT_L, C.MINT_D, 0.35, 0.3)).stroke({ width: 1.8, color: INK });
    g.moveTo(5, 18).arc(16, 15, 11.4, Math.PI * 0.85, Math.PI * 0.15, true).stroke({ width: 2.2, color: C.METAL_D });
    g.roundRect(9, 10, 14, 6, 3).fill(0x2a2d33).stroke({ width: 1, color: INK });
    g.circle(13, 13, 1.5).fill(0x7fe3e0);
    g.circle(19, 13, 1.5).fill(0x7fe3e0);
    line(g, 13.5, 19, 18.5, 19, 1.2, INK);
  },
  // Cristal roto: esquirlas azuladas
  cristal(g, s) {
    s.ellipse(16, 23, 11, 4.5).fill({ color: SHADOW, alpha: 0.4 });
    g.poly([8, 22, 10, 9, 15, 20]).fill(grad([[0, 0xe9fdff], [1, 0x6fc8d4]], 0, 0, 1, 1)).stroke({ width: 1.4, color: INK });
    g.poly([13, 22, 17, 4, 22, 21]).fill(grad([[0, 0xf4ffff], [1, 0x7fd8e2]], 0, 0, 1, 1)).stroke({ width: 1.4, color: INK });
    g.poly([19, 22, 24, 11, 26, 22]).fill(grad([[0, 0xe0fbff], [1, 0x5fb8c6]], 0, 0, 1, 1)).stroke({ width: 1.4, color: INK });
    line(g, 16, 8, 16.5, 16, 1.2, 0xffffff, 0.9);
  },
  // Vidrio: lámina translúcida con reflejos
  vidrio(g, s) {
    s.roundRect(7, 12, 20, 13, 2).fill({ color: SHADOW, alpha: 0.35 });
    g.roundRect(5, 7, 22, 16, 2).fill({ color: 0xcff4f2, alpha: 0.85 }).stroke({ width: 1.6, color: INK });
    line(g, 8, 11, 14, 9, 1.6, 0xffffff, 0.95);
    line(g, 10, 15, 20, 11, 1.2, 0xffffff, 0.7);
  },
  // Ventana: marco metálico con cruz y vidrio
  ventana(g, s) {
    s.roundRect(7, 9, 20, 18, 2).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(5, 5, 22, 20, 2).fill(C.STEEL_D).stroke({ width: 1.6, color: INK });
    g.roundRect(8, 8, 16, 14, 1).fill(grad([[0, 0xe8fbfa], [1, 0x8fd0d8]], 0, 0, 1, 1));
    line(g, 16, 8, 16, 22, 1.8, C.STEEL_D);
    line(g, 8, 15, 24, 15, 1.8, C.STEEL_D);
    line(g, 9.5, 10, 13, 10, 1.2, 0xffffff, 0.9);
  },
  // Panel solar: celdas azules con marco plateado
  panel(g, s) {
    s.roundRect(6, 10, 22, 16, 2).fill({ color: SHADOW, alpha: 0.4 });
    g.roundRect(4, 6, 24, 18, 2).fill(C.METAL_L).stroke({ width: 1.6, color: INK });
    g.roundRect(6, 8, 20, 14, 1).fill(grad([[0, 0x4a6fa8], [1, 0x1f3560]], 0, 0, 1, 1));
    for (const x of [11, 16, 21]) line(g, x, 8, x, 22, 0.8, 0x9fc3ff, 0.7);
    line(g, 6, 15, 26, 15, 0.8, 0x9fc3ff, 0.7);
    line(g, 7.5, 9.5, 12, 9.5, 1, 0xffffff, 0.7);
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
