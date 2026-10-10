// Texturas PROVISIONALES dibujadas con código.
// Cuando tengamos arte de verdad, basta con cambiar este archivo por uno que cargue PNGs
// con las mismas claves (belt0..3, extractor, prensa, item_chatarra, ...). El resto del
// juego no se entera. Todo se dibuja mirando hacia la derecha (dir = 0).

import { Graphics, Rectangle } from '../vendor/pixi.min.mjs';
import { TILE, ITEMS } from './defs.js';

const T = TILE;

function tex(renderer, draw, size = T) {
  const g = new Graphics();
  draw(g);
  const t = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, size, size), resolution: 2, antialias: true });
  g.destroy();
  return t;
}

function arrow(g, color = 0xffffff, alpha = 0.9) {
  // pequeña flecha en el borde derecho: indica la salida
  g.poly([T - 12, T / 2 - 7, T - 3, T / 2, T - 12, T / 2 + 7]).fill({ color, alpha });
}

function box(g, color, dark) {
  g.roundRect(5, 7, T - 10, T - 10, 12).fill({ color: 0x000000, alpha: 0.18 }); // sombra
  g.roundRect(5, 4, T - 10, T - 10, 12).fill(color);
  g.roundRect(5, 4, T - 10, T - 10, 12).stroke({ width: 3, color: dark });
}

export function makeTextures(renderer) {
  const t = {};

  // --- Cintas (4 fotogramas para la animación de las flechitas) ---
  for (let f = 0; f < 4; f++) {
    t['belt' + f] = tex(renderer, (g) => {
      g.rect(0, 10, T, T - 20).fill(0x3f4a3c);
      g.rect(0, 10, T, 4).fill(0x2c352a);
      g.rect(0, T - 14, T, 4).fill(0x2c352a);
      const off = (f / 4) * 16;
      for (let x = -16; x < T + 16; x += 16) {
        const cx = x + off;
        g.poly([cx, 22, cx + 7, T / 2, cx, T - 22, cx + 3, T - 22, cx + 10, T / 2, cx + 3, 22]).fill({ color: 0xa9c79a, alpha: 0.55 });
      }
    });
  }

  t.divisor = tex(renderer, (g) => {
    g.roundRect(4, 4, T - 8, T - 8, 10).fill(0x3f4a3c);
    g.roundRect(4, 4, T - 8, T - 8, 10).stroke({ width: 3, color: 0xffd84a });
    g.poly([T / 2 + 4, T / 2 - 6, T - 10, T / 2, T / 2 + 4, T / 2 + 6]).fill(0xffd84a);
    g.poly([T / 2 - 6, T / 2 - 4, T / 2, 10, T / 2 + 6, T / 2 - 4]).fill(0xffd84a);
    g.poly([T / 2 - 6, T / 2 + 4, T / 2, T - 10, T / 2 + 6, T / 2 + 4]).fill(0xffd84a);
    g.circle(T / 2 - 8, T / 2, 5).fill(0xffd84a);
  });

  t.extractor = tex(renderer, (g) => {
    box(g, 0xd98f4e, 0x8a5226);
    g.circle(T / 2 - 4, T / 2 - 2, 14).fill(0x8a5226);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.circle(T / 2 - 4 + Math.cos(a) * 9, T / 2 - 2 + Math.sin(a) * 9, 3).fill(0xf2c59a);
    }
    g.circle(T / 2 - 4, T / 2 - 2, 4).fill(0xf2c59a);
    arrow(g);
  });

  t.prensa = tex(renderer, (g) => {
    box(g, 0x6f9bb5, 0x3c6278);
    g.roundRect(14, 14, 30, 8, 3).fill(0x3c6278);
    g.roundRect(14, 34, 30, 8, 3).fill(0x3c6278);
    g.rect(27, 22, 4, 12).fill(0xdfe9ef);
    arrow(g);
  });

  t.ensambladora = tex(renderer, (g) => {
    box(g, 0xb48ad6, 0x6c4a8c);
    const cx = T / 2 - 4, cy = T / 2 - 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.rect(cx + Math.cos(a) * 13 - 3, cy + Math.sin(a) * 13 - 3, 6, 6).fill(0x6c4a8c);
    }
    g.circle(cx, cy, 12).fill(0x6c4a8c);
    g.circle(cx, cy, 5).fill(0xf0e2fb);
    arrow(g);
  });

  t.teletransportador = tex(renderer, (g) => {
    g.circle(T / 2, T / 2 + 3, 27).fill({ color: 0x000000, alpha: 0.18 });
    g.circle(T / 2, T / 2, 27).fill(0x2f5d63);
    g.circle(T / 2, T / 2, 27).stroke({ width: 4, color: 0x7fe3e0 });
    g.circle(T / 2, T / 2, 17).stroke({ width: 3, color: 0x7fe3e0, alpha: 0.7 });
    g.circle(T / 2, T / 2, 7).fill(0xc9fffb);
  });

  // --- Nodos de recursos ---
  t.node_chatarra = tex(renderer, (g) => {
    g.roundRect(3, 3, T - 6, T - 6, 16).fill({ color: 0x7d6a55, alpha: 0.75 });
    const bits = [[16, 18, 9, 0x9a8f86], [40, 22, 7, 0x8a8178], [24, 42, 8, 0xa59a90], [46, 44, 6, 0x7c746c]];
    for (const [x, y, r, c] of bits) {
      g.poly([x - r, y, x - r / 3, y - r, x + r, y - r / 2, x + r * 0.8, y + r * 0.7, x - r / 2, y + r]).fill(c);
    }
  });

  t.node_platano = tex(renderer, (g) => {
    g.roundRect(3, 3, T - 6, T - 6, 16).fill({ color: 0x4f8f3a, alpha: 0.75 });
    // hojas
    g.ellipse(22, 22, 16, 7).fill(0x3f7a2c);
    g.ellipse(42, 24, 16, 7).fill(0x47873a);
    g.ellipse(32, 40, 7, 16).fill(0x3a7029);
    // racimos
    for (const [x, y] of [[20, 36], [44, 40], [30, 20]]) bananaShape(g, x, y, 8);
  });

  // --- Decoración ---
  t.arbol = tex(renderer, (g) => {
    g.ellipse(T / 2, T - 12, 18, 6).fill({ color: 0x000000, alpha: 0.15 });
    g.rect(T / 2 - 3, 34, 6, 18).fill(0x6b4b2e);
    g.circle(T / 2, 26, 18).fill(0x3e8a3a);
    g.circle(T / 2 - 9, 31, 11).fill(0x479a41);
    g.circle(T / 2 + 9, 30, 11).fill(0x357a31);
  });
  t.flor = tex(renderer, (g) => {
    for (const [x, y, c] of [[20, 24, 0xff9ec4], [40, 36, 0xfff27a], [28, 44, 0xb9a6ff]]) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.circle(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3).fill(c);
      }
      g.circle(x, y, 2.5).fill(0xffffff);
    }
  });
  t.piedra = tex(renderer, (g) => {
    g.ellipse(32, 40, 16, 10).fill(0x8f9a8a);
    g.ellipse(28, 37, 9, 5).fill(0xa9b3a3);
  });
  t.sombrilla = tex(renderer, (g) => {
    g.rect(T / 2 - 2, 26, 4, 30).fill(0x5a4632);
    g.ellipse(T / 2, T - 8, 14, 4).fill({ color: 0x000000, alpha: 0.18 });
    const cols = [0xff7a8a, 0xfff2e0];
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI + (i / 6) * Math.PI;
      const a1 = Math.PI + ((i + 1) / 6) * Math.PI;
      g.moveTo(T / 2, 28).arc(T / 2, 28, 24, a0, a1).lineTo(T / 2, 28).fill(cols[i % 2]);
    }
  });

  // --- Objetos ---
  for (const type in ITEMS) {
    t['item_' + type] = tex(renderer, (g) => drawItem(g, type), 32);
  }

  return t;
}

function bananaShape(g, x, y, s) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.15 + (i / 10) * Math.PI * 0.7;
    pts.push(x + Math.cos(a) * s * 1.4, y - s * 0.6 + Math.sin(a) * s);
  }
  for (let i = 10; i >= 0; i--) {
    const a = Math.PI * 0.15 + (i / 10) * Math.PI * 0.7;
    pts.push(x + Math.cos(a) * s * 1.1, y - s * 0.6 + Math.sin(a) * s * 0.55);
  }
  g.poly(pts).fill(0xffd84a);
  g.poly(pts).stroke({ width: 1.5, color: 0xc9a227 });
}

function drawItem(g, type) {
  const { color, accent } = ITEMS[type];
  g.circle(16, 18, 11).fill({ color: 0x000000, alpha: 0.2 });
  switch (type) {
    case 'chatarra':
      g.poly([6, 14, 12, 6, 24, 8, 27, 18, 20, 26, 9, 24]).fill(color);
      g.poly([6, 14, 12, 6, 24, 8, 27, 18, 20, 26, 9, 24]).stroke({ width: 2, color: accent });
      g.circle(16, 16, 3).fill(accent);
      break;
    case 'platano':
      bananaShape(g, 16, 18, 10);
      break;
    case 'placa':
      g.roundRect(6, 6, 20, 20, 4).fill(color);
      g.roundRect(6, 6, 20, 20, 4).stroke({ width: 2, color: accent });
      for (const [x, y] of [[10, 10], [22, 10], [10, 22], [22, 22]]) g.circle(x, y, 1.6).fill(accent);
      break;
    case 'paraguas':
      g.rect(15, 15, 2.5, 12).fill(0x5a4632);
      g.moveTo(16, 16).arc(16, 16, 11, Math.PI, Math.PI * 2).lineTo(16, 16).fill(color);
      g.moveTo(16, 16).arc(16, 16, 11, Math.PI, Math.PI * 2).lineTo(16, 16).stroke({ width: 2, color: accent });
      break;
  }
}
