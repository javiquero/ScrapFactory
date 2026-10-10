// Qué forma dibujar en cada cinta según lo que le llega por los lados,
// y por dónde pasan los objetos dentro de la casilla. Solo lee el estado.

import { BUILDINGS, DX, DY, opposite } from './defs.js';
import { key } from './world.js';

// ¿El vecino `n` empuja cosas en la dirección `toward` (hacia nuestra casilla)?
export function feedsInto(n, toward, state = null, depth = 0) {
  if (!n) return false;
  switch (n.kind) {
    case 'puente': {
      // saca hacia `toward` lo que le entra por el lado contrario
      if (!state || depth > 6) return false;
      const back = state.entities[key(n.x - DX[toward], n.y - DY[toward])];
      return feedsInto(back, toward, state, depth + 1);
    }
    case 'cinta':
    case 'extractor':
      return n.dir === toward;
    case 'divisor':
      return toward !== opposite(n.dir); // sale por izquierda, frente y derecha
    default:
      return !!BUILDINGS[n.kind]?.recipe && n.dir === toward; // máquinas con receta
  }
}

// Devuelve una de: straight, curveL, curveR, tee, mergeL, mergeR, mergeLR.
// L/R son los lados según avanza la cinta (L = izquierda, R = derecha).
export function beltShape(state, e) {
  let back = false, left = false, right = false;
  for (let s = 0; s < 4; s++) {
    if (s === e.dir) continue;
    const n = state.entities[key(e.x + DX[s], e.y + DY[s])];
    if (!feedsInto(n, opposite(s), state)) continue;
    const rel = (s - e.dir + 4) % 4; // 1 = derecha, 2 = detrás, 3 = izquierda
    if (rel === 2) back = true;
    else if (rel === 3) left = true;
    else right = true;
  }
  if (back) return left && right ? 'mergeLR' : left ? 'mergeL' : right ? 'mergeR' : 'straight';
  if (left && right) return 'tee';
  if (left) return 'curveL';
  if (right) return 'curveR';
  return 'straight';
}

// Posición de un objeto en la casilla de centro (cx, cy), de tamaño 2·half.
// p va de 0 (entra por el lado `from`) a 1 (sale por el lado `dir`).
// Si entra por un lado, sigue un cuarto de círculo como la curva dibujada.
export function itemPos(cx, cy, half, from, dir, p) {
  if (from === opposite(dir) || from === dir) {
    const sx = cx + DX[from] * half, sy = cy + DY[from] * half;
    const ex = cx + DX[dir] * half, ey = cy + DY[dir] * half;
    return [sx + (ex - sx) * p, sy + (ey - sy) * p];
  }
  const kx = cx + (DX[from] + DX[dir]) * half, ky = cy + (DY[from] + DY[dir]) * half;
  const a0 = Math.atan2(cy + DY[from] * half - ky, cx + DX[from] * half - kx);
  let da = Math.atan2(cy + DY[dir] * half - ky, cx + DX[dir] * half - kx) - a0;
  if (da > Math.PI) da -= Math.PI * 2;
  if (da < -Math.PI) da += Math.PI * 2;
  const a = a0 + da * p;
  return [kx + Math.cos(a) * half, ky + Math.sin(a) * half];
}
