// Generación del planeta: suelo, nodos de recursos y decoración.
// Determinista a partir de una semilla, así dos jugadores con la misma semilla ven el mismo mapa.

import { MAP_W, MAP_H } from './defs.js';

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const key = (x, y) => x + ',' + y;

function blob(nodes, rand, cx, cy, type, size) {
  const cells = [[cx, cy]];
  const seen = new Set([key(cx, cy)]);
  while (cells.length < size) {
    const [bx, by] = cells[Math.floor(rand() * cells.length)];
    const d = Math.floor(rand() * 4);
    const nx = bx + [1, 0, -1, 0][d];
    const ny = by + [0, 1, 0, -1][d];
    if (nx < 1 || ny < 1 || nx >= MAP_W - 1 || ny >= MAP_H - 1) continue;
    const k = key(nx, ny);
    if (seen.has(k)) continue;
    seen.add(k);
    cells.push([nx, ny]);
  }
  for (const [x, y] of cells) nodes[key(x, y)] = type;
}

export function generateWorld(seed) {
  const rand = rng(seed);
  const nodes = {};
  const cx = Math.floor(MAP_W / 2);
  const cy = Math.floor(MAP_H / 2);

  // Parcelas garantizadas cerca del punto de aterrizaje
  blob(nodes, rand, cx - 6, cy - 2, 'chatarra', 9);
  blob(nodes, rand, cx + 6, cy + 3, 'chatarra', 6);
  blob(nodes, rand, cx - 3, cy + 7, 'chatarra', 7);

  // Resto del mapa
  for (let i = 0; i < 18; i++) {
    const x = 3 + Math.floor(rand() * (MAP_W - 6));
    const y = 3 + Math.floor(rand() * (MAP_H - 6));
    if (Math.abs(x - cx) < 5 && Math.abs(y - cy) < 5) continue;
    blob(nodes, rand, x, y, 'chatarra', 5 + Math.floor(rand() * 8));
  }

  // Zona despejada alrededor del teletransportador inicial
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) delete nodes[key(x, y)];

  // Decoración (no bloquea): árboles, arbustos, flores, piedras, matas
  const decor = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (nodes[key(x, y)]) continue;
      if (Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3) continue;
      const r = rand();
      if (r < 0.02) decor.push({ x, y, kind: 'arbol' });
      else if (r < 0.035) decor.push({ x, y, kind: 'arbol2' });
      else if (r < 0.05) decor.push({ x, y, kind: 'arbusto' });
      else if (r < 0.09) decor.push({ x, y, kind: 'flor' });
      else if (r < 0.105) decor.push({ x, y, kind: 'piedra' });
      else if (r < 0.16) decor.push({ x, y, kind: 'mata' });
    }
  }

  return { nodes, decor, spawn: { x: cx, y: cy } };
}
