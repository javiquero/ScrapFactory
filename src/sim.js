// Simulación de la fábrica: un paso fijo de DT segundos.
// No toca nada de pantalla; solo lee y escribe el estado. Determinista.

import {
  BUILDINGS, BELT_SPACING, DT, DX, DY, ITEMS, MACHINE_BUFFER, OUTPUT_BUFFER, SHIP_SIZE,
  opposite, orderAt, planetAt, beltSpeed, extractorRate, craftTime,
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

// Llega algo a la nave: Chatarrex lo paga siempre, y si es lo del pedido, cuenta.
function deliver(state, type) {
  state.delivered[type] = (state.delivered[type] || 0) + 1;
  state.money = (state.money || 0) + (ITEMS[type]?.value || 0);
  const order = orderAt(state.planet || 0, state.orderIndex);
  if (type === order.item) {
    state.orderProgress++;
    if (state.orderProgress >= order.amount) {
      state.money += order.pay;
      state.events.push({ type: 'orderDone', index: state.orderIndex, pay: order.pay });
      // el último pedido de la tanda abre el despegue al siguiente planeta
      if (!state.planetDone && state.orderIndex === planetAt(state.planet || 0).orders.length - 1) {
        state.planetDone = true;
        state.events.push({ type: 'planetDone', planet: state.planet || 0 });
      }
      state.orderIndex++;
      state.orderProgress = 0;
      state.rev++;
    }
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
          const every = 1 / extractorRate(state.levels.extractor);
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
          if (e.timer >= craftTime(e.kind, state.levels[e.kind]) - EPS) {
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
        const spd = beltSpeed(state.levels.cinta) * DT;
        for (let i = 0; i < items.length; i++) {
          const lim = i === 0 ? 1 : items[i - 1].p - BELT_SPACING;
          if (items[i].p < lim) items[i].p = Math.min(lim, items[i].p + spd);
        }
        break;
      }
      case 'divisor': {
        if (!e.item) break;
        e.item.p = Math.min(1, e.item.p + beltSpeed(state.levels.cinta) * 2 * DT);
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
