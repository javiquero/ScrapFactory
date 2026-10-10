// Arte en PNG (generado aparte y recortado en assets/art/). Se carga antes de
// montar las texturas; si alguno falta, el juego usa el dibujo por código.

import { Assets, Sprite } from '../../vendor/pixi.min.mjs';

export const ART_FILES = [
  'extractor', 'prensa', 'ensambladora', 'teletransportador',
  'junk_tire', 'junk_barrel', 'junk_pipe', 'junk_crate', 'junk_gear', 'junk_plate', 'junk_beam', 'junk_can',
  'item_chatarra', 'item_placa', 'item_engranaje',
];

export async function loadArt(base = 'assets/art/') {
  const art = {};
  await Promise.all(ART_FILES.map(async (name) => {
    try { art[name] = await Assets.load(`${base}${name}.png`); } catch { /* se usará el dibujo por código */ }
  }));
  return art;
}

// Coloca una imagen dentro de una caja: ancho máximo `w`, alto máximo `h`,
// centrada en x = cx y apoyada en y = bottom.
export function placeArt(parent, texture, { cx, bottom, w, h, dx = 0, dy = 0, sx = 1, sy = 1 }) {
  const s = new Sprite(texture);
  s.anchor.set(0.5, 1);
  const k = Math.min(w / texture.width, h / texture.height);
  s.scale.set(k * sx, k * sy);
  s.position.set(cx + dx, bottom + dy);
  parent.addChild(s);
  return s;
}
