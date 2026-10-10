// Gráficos del juego, dibujados con código.
// Estilo propio "trastos remendados": formas redondeadas, contorno marrón oscuro,
// colores pastel, parches atornillados y piezas de chatarra reaprovechadas.
// Todo se dibuja mirando hacia la derecha (dir = 0). Si algún día se cambia por PNGs,
// basta con mantener las mismas claves (belt1_0, extractor, item_chatarra, ...).

import { Graphics, Rectangle } from '../vendor/pixi.min.mjs';
import { TILE, ITEMS } from './defs.js';

const T = TILE;

// ---- Paleta ----
const INK = 0x3b3328;        // contorno
const SHADOW = 0x1f2a18;
const METAL = 0xcfc8ba, METAL_D = 0x8e877b, METAL_L = 0xece7dc;
const RUST = 0xe7976a, RUST_L = 0xf6c3a0, RUST_D = 0xb5653d;
const MINT = 0x8fd3c1, MINT_L = 0xc7ede2, MINT_D = 0x4f9e8c;
const LILAC = 0xb9a6e3, LILAC_L = 0xddd2f5, LILAC_D = 0x7d68b0;
const BUTTER = 0xf6d77a, BUTTER_D = 0xc9a53f;
const TEAL = 0x7fe3e0, TEAL_D = 0x2f5d63;
const BELT = 0x4b5049, BELT_L = 0x5d635b;

function tex(renderer, draw, size = T) {
  const g = new Graphics();
  draw(g);
  const t = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, size, size), resolution: 2, antialias: true });
  g.destroy();
  return t;
}

// ---- Piezas comunes ----
const shadow = (g, x, y, w, h, r) => g.roundRect(x, y + 4, w, h, r).fill({ color: SHADOW, alpha: 0.22 });

function rivet(g, x, y, r = 2.2) {
  g.circle(x, y, r).fill(METAL_L).stroke({ width: 1.2, color: INK });
}

// Parche atornillado, ligeramente torcido
function patch(g, x, y, w, h, color = METAL, tilt = 0.08) {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const pts = [[0, 0], [w, 0], [w, h], [0, h]].flatMap(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
  g.poly(pts).fill(color).stroke({ width: 2, color: INK });
  rivet(g, pts[0] + 3 * c, pts[1] + 3, 1.5);
  rivet(g, pts[2] - 3, pts[3] + 3, 1.5);
}

// Cuerpo de máquina: caja redondeada con brillo arriba
function body(g, color, light) {
  shadow(g, 6, 7, 50, 50, 14);
  g.roundRect(6, 6, 50, 50, 14).fill(color).stroke({ width: 3, color: INK });
  g.roundRect(11, 10, 40, 8, 4).fill({ color: light, alpha: 0.75 });
}

// Boca de salida a la derecha, con flechita
function spout(g) {
  g.roundRect(50, 23, 12, 18, 4).fill(0x5a5046).stroke({ width: 2.5, color: INK });
  g.poly([54, 27, 60, 32, 54, 37]).fill(BUTTER);
}

// ---- Texturas ----
export function makeTextures(renderer) {
  const t = {};

  // Cintas: 3 niveles × 4 fotogramas. Listones de goma que avanzan y barandillas
  // del color del nivel.
  const rail = [0, METAL, BUTTER, TEAL];
  const railD = [0, METAL_D, BUTTER_D, 0x3fa9a6];
  for (let lvl = 1; lvl <= 3; lvl++) {
    for (let f = 0; f < 4; f++) {
      t[`belt${lvl}_${f}`] = tex(renderer, (g) => {
        g.rect(0, 12, T, 40).fill({ color: SHADOW, alpha: 0.18 });
        g.rect(0, 10, T, 42).fill(BELT);
        const off = (f / 4) * 16;
        for (let x = -16; x < T + 16; x += 16) {
          const cx = x + off;
          g.roundRect(cx, 16, 7, 30, 3).fill(BELT_L);
          g.poly([cx + 9, 26, cx + 14, 31, cx + 9, 36]).fill({ color: rail[lvl], alpha: 0.55 });
        }
        // barandillas con remaches
        // barandillas: solo líneas arriba y abajo, para que las casillas empalmen sin cortes
        for (const y of [8, 48]) {
          g.rect(0, y, T, 6).fill(rail[lvl]);
          g.moveTo(0, y).lineTo(T, y).moveTo(0, y + 6).lineTo(T, y + 6).stroke({ width: 2, color: INK });
        }
        for (const x of [8, 40]) { g.circle(x, 11, 1.4).fill(railD[lvl]); g.circle(x, 51, 1.4).fill(railD[lvl]); }
      });
    }
  }
  for (let f = 0; f < 4; f++) t['belt' + f] = t[`belt1_${f}`]; // nombres antiguos

  t.divisor = tex(renderer, (g) => {
    shadow(g, 6, 6, 52, 52, 16);
    g.roundRect(6, 6, 52, 52, 16).fill(BELT).stroke({ width: 3, color: INK });
    g.circle(T / 2, T / 2, 15).fill(BUTTER).stroke({ width: 2.5, color: INK });
    // tres salidas: izquierda (arriba en pantalla), frente y derecha
    g.poly([T / 2 + 10, T / 2 - 6, T - 9, T / 2, T / 2 + 10, T / 2 + 6]).fill(BUTTER).stroke({ width: 2, color: INK });
    g.poly([T / 2 - 6, T / 2 - 10, T / 2, 9, T / 2 + 6, T / 2 - 10]).fill(BUTTER).stroke({ width: 2, color: INK });
    g.poly([T / 2 - 6, T / 2 + 10, T / 2, T - 9, T / 2 + 6, T / 2 + 10]).fill(BUTTER).stroke({ width: 2, color: INK });
    g.circle(T / 2, T / 2, 5).fill(INK);
    rivet(g, 13, 13); rivet(g, 13, 51);
  });

  t.extractor = tex(renderer, (g) => {
    body(g, RUST, RUST_L);
    patch(g, 10, 38, 14, 12, METAL, -0.12);
    // broca: corona dentada con espiral
    const cx = 31, cy = 32;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.circle(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 3.2).fill(METAL).stroke({ width: 1.5, color: INK });
    }
    g.circle(cx, cy, 12).fill(METAL).stroke({ width: 2.5, color: INK });
    g.moveTo(cx, cy).arc(cx, cy, 7, 0, Math.PI * 1.5).stroke({ width: 2.5, color: METAL_D });
    g.circle(cx, cy, 2.5).fill(INK);
    // tubo de escape doblado
    g.roundRect(42, 9, 7, 12, 3).fill(METAL_D).stroke({ width: 2, color: INK });
    spout(g);
  });

  t.prensa = tex(renderer, (g) => {
    body(g, MINT, MINT_L);
    // pistón con rayas de aviso
    g.roundRect(14, 20, 32, 11, 3).fill(BUTTER).stroke({ width: 2.5, color: INK });
    for (let x = 18; x < 44; x += 8) g.poly([x, 21, x + 4, 21, x + 1, 30, x - 3, 30]).fill(INK);
    g.rect(28, 31, 4, 6).fill(METAL_D);
    g.roundRect(12, 37, 36, 9, 3).fill(METAL).stroke({ width: 2.5, color: INK });
    rivet(g, 16, 41.5); rivet(g, 44, 41.5);
    patch(g, 40, 10, 10, 8, RUST_L, 0.15);
    spout(g);
  });

  t.ensambladora = tex(renderer, (g) => {
    body(g, LILAC, LILAC_L);
    // ventana redonda con engranaje dentro
    g.circle(28, 33, 15).fill(LILAC_D).stroke({ width: 2.5, color: INK });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      g.circle(28 + Math.cos(a) * 9, 33 + Math.sin(a) * 9, 3).fill(BUTTER);
    }
    g.circle(28, 33, 8).fill(BUTTER).stroke({ width: 2, color: INK });
    g.circle(28, 33, 2.5).fill(INK);
    // brazo de robot asomando
    g.moveTo(44, 46).lineTo(46, 30).lineTo(40, 22).stroke({ width: 4, color: INK });
    g.moveTo(44, 46).lineTo(46, 30).lineTo(40, 22).stroke({ width: 2, color: METAL });
    g.circle(46, 30, 2.5).fill(METAL_L).stroke({ width: 1.5, color: INK });
    spout(g);
  });

  t.teletransportador = tex(renderer, (g) => {
    g.circle(T / 2, T / 2 + 4, 28).fill({ color: SHADOW, alpha: 0.22 });
    g.circle(T / 2, T / 2, 28).fill(METAL).stroke({ width: 3, color: INK });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      rivet(g, T / 2 + Math.cos(a) * 24, T / 2 + Math.sin(a) * 24, 1.8);
    }
    g.circle(T / 2, T / 2, 19).fill(TEAL_D).stroke({ width: 2.5, color: INK });
    // remolino
    g.moveTo(T / 2 + 12, T / 2).arc(T / 2, T / 2, 12, 0, Math.PI * 1.4).stroke({ width: 3, color: TEAL });
    g.moveTo(T / 2 - 6, T / 2).arc(T / 2, T / 2, 6, Math.PI, Math.PI * 2.3).stroke({ width: 3, color: TEAL });
    g.circle(T / 2, T / 2, 3).fill(0xe9fffd);
    // pegatina de la empresa
    g.roundRect(38, 4, 20, 10, 3).fill(0xff8fa0).stroke({ width: 2, color: INK });
    g.rect(42, 8, 12, 2).fill(0xffffff);
  });

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

  // ---- Objetos (32 px) ----
  for (const type in ITEMS) {
    t['item_' + type] = tex(renderer, (g) => drawItem(g, type), 32);
  }

  return t;
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
