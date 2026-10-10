// Simulación de la fábrica: un paso fijo de DT segundos.
// No toca nada de pantalla; solo lee y escribe el estado. Determinista.

import { BUILDINGS, BELT_SPEED, DT, DX, DY, ITEMS, MACHINE_BUFFER, OUTPUT_BUFFER, opposite, orderAt } from './defs.js';
import { key } from './world.js';

// Intenta meter un objeto en la casilla (x, y), viajando en dirección `dir`.
export function tryInsert(state, x, y, type, dir) {
  const e = state.entities[key(x, y)];
  if (!e) return false;
  const fromSide = opposite(dir); // lado por el que entra
  switch (e.kind) {
    case 'cinta':
      if (e.item || e.dir === fromSide) return false;
      e.item = { type, p: 0, from: fromSide };
      return true;
    case 'divisor':
      if (e.item || dir !== e.dir) return false;
      e.item = { type, p: 0, from: fromSide };
      return true;
    case 'teletransportador':
      deliver(state, type);
      return true;
    case 'prensa':
    case 'ensambladora': {
      if (fromSide === e.dir) return false; // no se entra por la salida
      const need = BUILDINGS[e.kind].recipe.in;
      if (!need[type]) return false;
      if ((e.inv[type] || 0) >= MACHINE_BUFFER) return false;
      e.inv[type] = (e.inv[type] || 0) + 1;
      return true;
    }
    default:
      return false;
  }
}

function deliver(state, type) {
  state.delivered[type] = (state.delivered[type] || 0) + 1;
  const order = orderAt(state.orderIndex);
  if (type === order.item) {
    state.orderProgress++;
    if (state.orderProgress >= order.amount) {
      for (const u of order.unlocks) if (!state.unlocked.includes(u)) state.unlocked.push(u);
      state.events.push({ type: 'orderDone', index: state.orderIndex, unlocks: order.unlocks });
      state.orderIndex++;
      state.orderProgress = 0;
      state.rev++;
    }
  } else {
    state.events.push({ type: 'wrongItem', item: type });
  }
  state.events.push({ type: 'delivered', item: type });
}

function pushOut(state, e) {
  if (!e.out.length) return;
  if (tryInsert(state, e.x + DX[e.dir], e.y + DY[e.dir], e.out[0], e.dir)) e.out.shift();
}

export function step(state) {
  state.tick++;
  // Orden estable: por id de entidad, para que sea igual en todas las máquinas.
  const list = Object.values(state.entities).sort((a, b) => a.id - b.id);

  for (const e of list) {
    switch (e.kind) {
      case 'extractor': {
        const nodeType = state.world.nodes[key(e.x, e.y)];
        if (!nodeType) break;
        if (e.out.length < OUTPUT_BUFFER) {
          e.timer += DT;
          if (e.timer >= BUILDINGS.extractor.time) {
            e.timer = 0;
            e.out.push(nodeType === 'chatarra' ? 'chatarra' : 'platano');
          }
        }
        pushOut(state, e);
        break;
      }
      case 'prensa':
      case 'ensambladora': {
        const r = BUILDINGS[e.kind].recipe;
        if (!e.busy && e.out.length < OUTPUT_BUFFER && hasAll(e.inv, r.in)) {
          for (const t in r.in) e.inv[t] -= r.in[t];
          e.busy = true;
          e.timer = 0;
        }
        if (e.busy) {
          e.timer += DT;
          if (e.timer >= r.time) {
            e.busy = false;
            e.out.push(r.out);
          }
        }
        pushOut(state, e);
        break;
      }
      case 'cinta': {
        if (!e.item) break;
        e.item.p = Math.min(1, e.item.p + BELT_SPEED * DT);
        if (e.item.p >= 1 && tryInsert(state, e.x + DX[e.dir], e.y + DY[e.dir], e.item.type, e.dir)) e.item = null;
        break;
      }
      case 'divisor': {
        if (!e.item) break;
        e.item.p = Math.min(1, e.item.p + BELT_SPEED * 1.5 * DT);
        if (e.item.p < 1) break;
        // Izquierda, frente, derecha, empezando por donde tocó la última vez
        const outs = [(e.dir + 3) % 4, e.dir, (e.dir + 1) % 4];
        for (let i = 0; i < 3; i++) {
          const d = outs[(e.rr + i) % 3];
          if (tryInsert(state, e.x + DX[d], e.y + DY[d], e.item.type, d)) {
            e.item = null;
            e.rr = (e.rr + i + 1) % 3;
            break;
          }
        }
        break;
      }
    }
  }
}

function hasAll(inv, need) {
  for (const t in need) if ((inv[t] || 0) < need[t]) return false;
  return true;
}

export function itemName(type) {
  return ITEMS[type]?.name || type;
}
