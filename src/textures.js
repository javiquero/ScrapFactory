// Reúne todos los sprites del juego. Cada grupo vive en su propio archivo de
// src/sprites/. Si algún día se cambian por PNGs, basta con mantener las claves
// (belt1_straight_0, extractor, node_chatarra_0, item_chatarra, ...).

import { makeBelts } from './sprites/belts.js';
import { makeMachines } from './sprites/machines.js';
import { makeTerrain } from './sprites/terrain.js';
import { makeItems } from './sprites/items.js';

export function makeTextures(renderer) {
  const t = {};
  makeBelts(renderer, t);
  makeMachines(renderer, t);
  makeTerrain(renderer, t);
  makeItems(renderer, t);
  return t;
}
