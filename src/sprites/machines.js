// Sprites de las máquinas: extractor, prensa, ensambladora y teletransportador.
// Dibujadas con la salida hacia la derecha.

import { C, T, HALF, tex, shadow, rivet, patch } from './common.js';

const { INK, SHADOW, METAL, METAL_D, METAL_L, RUST, RUST_L, RUST_D, MINT, MINT_L, MINT_D, LILAC, LILAC_L, LILAC_D, BUTTER, BUTTER_D, TEAL, TEAL_D } = C;

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

export function makeMachines(renderer, t) {
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

}
