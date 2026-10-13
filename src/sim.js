// Simulación de la fábrica: un paso fijo de DT segundos.
// No toca nada de pantalla; solo lee y escribe el estado. Determinista.

import {
  BUILDINGS, BELT_SPACING, DT, TICK_RATE, RATE_SECONDS, DX, DY, ITEMS, MACHINE_BUFFER, OUTPUT_BUFFER, SHIP_SIZE,
  opposite, orderAt, planetAt, minRate, beltSpeed, extractorRate, craftTime,
} from './defs.js';
import { key } from './world.js';

// La nave ocupa 2×2: cualquier cosa que entre por cualquiera de sus bordes se envía
const onShip = (state, x, y) => {
  const s = state.ship;
  return !!s && x >= s.x && y >= s.y && x < s.x + SHIP_SIZE && y < s.y + SHIP_SIZE;
};

const EPS = 1e-6;

// Intenta meter un objeto en la casilla (x, y), viajando en dirección `dir`.
export function tryInsert(state, x, y, type, dir) {
  if (onShip(state, x, y)) { deliver(state, type); return true; }
  const e = state.entities[key(x, y)];
  if (!e) return false;
  const fromSide = opposite(dir); // lado por el que entra
  switch (e.kind) {
    case 'cinta': {
      if (e.dir === fromSide) return false;
      const last = e.items[e.items.length - 1];
      if (last && last.p < BELT_SPACING - EPS) return false; // no cabe: hueco mínimo
      e.items.push({ type, p: 0, from: fromSide });
      return true;
    }
    case 'puente': {
      // dos carriles: horizontal (por debajo) y vertical (por encima)
      const lane = dir % 2;
      if (e.lanes[lane]) return false;
      e.lanes[lane] = { type, p: 0, dir };
      return true;
    }
    case 'divisor':
      if (e.item || dir !== e.dir) return false;
      e.item = { type, p: 0, from: fromSide };
      return true;
    default: {
      if (!BUILDINGS[e.kind]?.recipe) return false;
      if (fromSide === e.dir) return false; // no se entra por la salida
      const need = BUILDINGS[e.kind].recipe.in;
      if (!need[type]) return false;
      if ((e.inv[type] || 0) >= MACHINE_BUFFER) return false;
      e.inv[type] = (e.inv[type] || 0) + 1;
      return true;
    }
  }
}

// Llega algo a la nave. Solo cuenta lo que pide el pedido actual y, si el pedido
// pide un ritmo, solo mientras llegue a ese ritmo (medido en los últimos segundos).
// Lo demás Chatarrex se lo queda "por si acaso".
function deliver(state, type) {
  state.delivered[type] = (state.delivered[type] || 0) + 1;
  const order = orderAt(state.planet || 0, state.orderIndex);
  if (type === order.item) {
    const hits = state.hits || (state.hits = []);
    hits.push(state.tick);
    const from = state.tick - RATE_SECONDS * TICK_RATE;
    while (hits.length && hits[0] <= from) hits.shift();
    const rate = hits.length / RATE_SECONDS;
    const min = minRate(order);
    if (!min || rate >= min - 1e-9) {
      state.orderProgress++;
    } else if (!state.slowWarned) {
      state.slowWarned = true;
      state.events.push({ type: 'tooSlow', rate: min });
    }
    if (state.orderProgress >= order.amount) {
      const unlocked = [];
      for (const u of order.unlocks || []) if (!state.unlocked.includes(u)) { state.unlocked.push(u); unlocked.push(u); }
      state.events.push({ type: 'orderDone', index: state.orderIndex, unlocks: unlocked });
      // el último pedido de la tanda abre el despegue al siguiente planeta
      if (!state.planetDone && state.orderIndex === planetAt(state.planet || 0).orders.length - 1) {
        state.planetDone = true;
        state.events.push({ type: 'planetDone', planet: state.planet || 0 });
      }
      state.orderIndex++;
      state.orderProgress = 0;
      state.hits = [];
      state.slowWarned = false;
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
  const lv = state.levels || {}; // sin niveles de momento: todo a nivel 1
  // Orden estable: por id de entidad, para que sea igual en todas las máquinas.
  const list = Object.values(state.entities).sort((a, b) => a.id - b.id);

  for (const e of list) {
    switch (e.kind) {
      case 'extractor': {
        const nodeType = state.world.nodes[key(e.x, e.y)];
        if (!nodeType) break;
        if (e.out.length < OUTPUT_BUFFER) {
          e.timer += DT;
          const every = 1 / extractorRate(lv.extractor);
          if (e.timer >= every - EPS) {
            e.timer -= every;
            e.out.push(nodeType);
          }
        }
        pushOut(state, e);
        break;
      }
      default: {
        const r = BUILDINGS[e.kind]?.recipe;
        if (!r) break;
        if (!e.busy && e.out.length < OUTPUT_BUFFER && hasAll(e.inv, r.in)) {
          for (const t in r.in) e.inv[t] -= r.in[t];
          e.busy = true;
          e.timer = 0;
        }
        if (e.busy) {
          e.timer += DT;
          if (e.timer >= craftTime(e.kind, lv[e.kind]) - EPS) {
            e.busy = false;
            e.out.push(r.out);
          }
        }
        pushOut(state, e);
        break;
      }
      case 'cinta': {
        const items = e.items;
        if (!items.length) break;
        // 1) el de delante intenta pasar a la siguiente casilla
        if (items[0].p >= 1 - EPS && tryInsert(state, e.x + DX[e.dir], e.y + DY[e.dir], items[0].type, e.dir)) items.shift();
        // 2) todos avanzan, respetando el hueco con el de delante
        const spd = beltSpeed(lv.cinta) * DT;
        for (let i = 0; i < items.length; i++) {
          const lim = i === 0 ? 1 : items[i - 1].p - BELT_SPACING;
          if (items[i].p < lim) items[i].p = Math.min(lim, items[i].p + spd);
        }
        break;
      }
      case 'puente': {
        const spd = beltSpeed(lv.cinta) * 2 * DT;
        for (let l = 0; l < 2; l++) {
          const it = e.lanes[l];
          if (!it) continue;
          it.p = Math.min(1, it.p + spd);
          if (it.p >= 1 && tryInsert(state, e.x + DX[it.dir], e.y + DY[it.dir], it.type, it.dir)) e.lanes[l] = null;
        }
        break;
      }
      case 'divisor': {
        if (!e.item) break;
        e.item.p = Math.min(1, e.item.p + beltSpeed(lv.cinta) * 2 * DT);
        if (e.item.p < 1) break;
        // Izquierda, frente, derecha, empezando por donde tocó la última vez
        const outs = [(e.dir + 3) % 4, e.dir, (e.dir + 1) % 4];
        const open = e.outs || [true, true, true];
        for (let i = 0; i < 3; i++) {
          if (!open[(e.rr + i) % 3]) continue;
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
