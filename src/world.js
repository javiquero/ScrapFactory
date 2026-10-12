// Generación del planeta: suelo, nodos de recursos y decoración.
// Determinista a partir de una semilla, así dos jugadores con la misma semilla ven el mismo mapa.

import { MAP_W, MAP_H, planetAt } from './defs.js';

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

// gen: versión del generador. 1 = mapa abierto (partidas antiguas); 2 = con obstáculos.
export function generateWorld(seed, planet = 0, gen = 1) {
  const rand = rng(seed);
  const nodes = {};
  const cx = Math.floor(MAP_W / 2);
  const cy = Math.floor(MAP_H / 2);
  const res = planetAt(planet).resources;
  // El recurso nuevo del planeta sale un poco más lejos que los conocidos
  const pick = (i) => res[i % res.length];

  // Parcelas garantizadas cerca del punto de aterrizaje: una de cada recurso
  blob(nodes, rand, cx - 6, cy - 2, pick(0), 9);
  blob(nodes, rand, cx + 6, cy + 3, pick(1), res.length > 1 ? 8 : 6);
  blob(nodes, rand, cx - 3, cy + 7, pick(2), 7);
  for (let i = 3; i < res.length; i++) {
    const a = (i / res.length) * Math.PI * 2;
    blob(nodes, rand, cx + Math.round(Math.cos(a) * 9), cy + Math.round(Math.sin(a) * 9), res[i], 7);
  }

  // Resto del mapa
  for (let i = 0; i < 18 + (res.length - 1) * 6; i++) {
    const x = 3 + Math.floor(rand() * (MAP_W - 6));
    const y = 3 + Math.floor(rand() * (MAP_H - 6));
    if (Math.abs(x - cx) < 5 && Math.abs(y - cy) < 5) continue;
    blob(nodes, rand, x, y, pick(i), 5 + Math.floor(rand() * 8));
  }

  // Zona despejada alrededor de la nave (2×2, esquina en el centro)
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) delete nodes[key(x, y)];

  const obstacles = gen >= 2 ? makeObstacles(seed, planet, nodes, cx, cy) : {};

  // Decoración (no bloquea): árboles, arbustos, flores, piedras, matas
  const decor = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (nodes[key(x, y)]) continue;
      if (obstacles[key(x, y)] !== undefined) { rand(); continue; }
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

  return { nodes, decor, obstacles, spawn: { x: cx, y: cy } };
}

// Obstáculos: grupos de rocas (o lo que toque en cada planeta) y, desde el planeta 3,
// cordilleras largas con algún hueco. Cuantos más planetas, más. Nunca encierran un
// recurso: si alguno queda aislado, se abre camino hasta él desde la nave.
function makeObstacles(seed, planet, nodes, cx, cy) {
  const rand = rng((seed ^ 0x2c1b3c6d) >>> 0);
  const obs = {};
  const free = (x, y) => x >= 1 && y >= 1 && x < MAP_W - 1 && y < MAP_H - 1 && !nodes[key(x, y)]
    && !(Math.abs(x - cx - 0.5) < 4.5 && Math.abs(y - cy - 0.5) < 4.5);
  const put = (x, y) => { if (free(x, y)) obs[key(x, y)] = Math.floor(rand() * 3); };
  // grupos
  const groups = 14 + planet * 4;
  for (let i = 0; i < groups; i++) {
    let x = 2 + Math.floor(rand() * (MAP_W - 4)), y = 2 + Math.floor(rand() * (MAP_H - 4));
    const size = 3 + Math.floor(rand() * (6 + planet));
    for (let k = 0; k < size; k++) {
      put(x, y);
      const d = Math.floor(rand() * 4);
      x += [1, 0, -1, 0][d]; y += [0, 1, 0, -1][d];
    }
  }
  // cordilleras (rectas largas con un hueco para pasar)
  const ridges = planet >= 2 ? 2 + planet : planet;
  for (let i = 0; i < ridges; i++) {
    const horiz = rand() < 0.5;
    const len = 8 + Math.floor(rand() * 12);
    const x0 = 3 + Math.floor(rand() * (MAP_W - 6)), y0 = 3 + Math.floor(rand() * (MAP_H - 6));
    const gap = 2 + Math.floor(rand() * (len - 4));
    for (let t = 0; t < len; t++) {
      if (t === gap || t === gap + 1) continue;
      const x = horiz ? x0 + t : x0 + Math.round(Math.sin(t * 0.5) * 0.6);
      const y = horiz ? y0 + Math.round(Math.sin(t * 0.5) * 0.6) : y0 + t;
      put(x, y);
    }
  }
  openPaths(obs, nodes, cx, cy);
  return obs;
}

// Garantiza que se puede llegar desde la nave a todas las casillas de recurso:
// camino más barato (cruzar un obstáculo cuesta 1, el resto 0) y se quita lo que estorbe.
function openPaths(obs, nodes, cx, cy) {
  const N = MAP_W * MAP_H;
  const idx = (x, y) => y * MAP_W + x;
  const dist = new Int32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1);
  const dq = new Int32Array(N * 4); let head = N * 2, tail = N * 2;
  const s0 = idx(cx, cy);
  dist[s0] = 0; dq[tail++] = s0;
  while (head < tail) {
    const c = dq[head++];
    const x = c % MAP_W, y = (c / MAP_W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + [1, 0, -1, 0][d], ny = y + [0, 1, 0, -1][d];
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      const n = idx(nx, ny), w = obs[key(nx, ny)] !== undefined ? 1 : 0;
      if (dist[c] + w < dist[n]) {
        dist[n] = dist[c] + w; prev[n] = c;
        if (w) dq[tail++] = n; else dq[--head] = n;
      }
    }
  }
  for (const k in nodes) {
    const [x, y] = k.split(',').map(Number);
    let c = idx(x, y);
    if (dist[c] === 0) continue;
    while (c !== -1 && c !== s0) { delete obs[key(c % MAP_W, (c / MAP_W) | 0)]; c = prev[c]; }
  }
}
