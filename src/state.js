// Estado de la partida y ACCIONES.
//
// Regla de oro: el estado solo cambia a través de applyAction(). Cada acción es un
// objeto plano y serializable ({ type: 'place', ... }). Hoy las acciones vienen del
// jugador local; el día del multijugador vendrán también por WebSocket, y el juego
// ni se enterará. La simulación (sim.js) es determinista a partir de este estado.

import { BUILDINGS, MAP_W, MAP_H, STARTING_UNLOCKS, orderAt } from './defs.js';
import { generateWorld, key } from './world.js';

export const SAVE_VERSION = 1;

export function createGame(seed = Math.floor(Math.random() * 1e9)) {
  const world = generateWorld(seed);
  const state = {
    version: SAVE_VERSION,
    seed,
    tick: 0,
    nextId: 1,
    entities: {},             // "x,y" -> entidad
    unlocked: [...STARTING_UNLOCKS],
    orderIndex: 0,
    orderProgress: 0,
    delivered: {},            // total histórico por objeto
    events: [],               // cola de eventos para la interfaz (no se guarda)
    rev: 0,                   // sube con cada cambio estructural (para redibujar)
  };
  state.world = world;
  // El colono llega con un teletransportador ya instalado
  addEntity(state, 'teletransportador', world.spawn.x, world.spawn.y, 0);
  return state;
}

export function currentOrder(state) {
  return orderAt(state.orderIndex);
}

function addEntity(state, kind, x, y, dir) {
  const e = { id: state.nextId++, kind, x, y, dir };
  if (kind === 'cinta' || kind === 'divisor') e.item = null;
  if (kind === 'divisor') e.rr = 0;
  if (kind === 'extractor') { e.timer = 0; e.out = []; }
  if (BUILDINGS[kind]?.recipe) { e.inv = {}; e.out = []; e.timer = 0; e.busy = false; }
  state.entities[key(x, y)] = e;
  return e;
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

// Comprueba si se puede colocar algo; devuelve null si sí, o el motivo si no.
export function canPlace(state, kind, x, y) {
  if (!BUILDINGS[kind]) return 'Edificio desconocido';
  if (!state.unlocked.includes(kind)) return 'Aún no desbloqueado';
  if (!inBounds(x, y)) return 'Fuera del mapa';
  const existing = state.entities[key(x, y)];
  const node = state.world.nodes[key(x, y)];
  if (BUILDINGS[kind].onNode && !node) return 'Tiene que ir sobre un recurso';
  if (existing) {
    // Las cintas se pueden re-trazar encima de otras cintas
    if (kind === 'cinta' && existing.kind === 'cinta') return null;
    return 'Casilla ocupada';
  }
  return null;
}

// ---- Acciones ----------------------------------------------------------------
// Todas devuelven { ok, reason? }. Nunca lanzan.

export function applyAction(state, action) {
  switch (action.type) {
    case 'place': return placeOne(state, action.kind, action.x, action.y, action.dir);
    case 'placeMany': {
      let placed = 0;
      for (const c of action.cells) if (placeOne(state, action.kind, c.x, c.y, c.dir).ok) placed++;
      return placed ? { ok: true, placed } : { ok: false, reason: 'Nada que colocar' };
    }
    case 'remove': {
      let removed = 0;
      for (const c of action.cells) {
        const k = key(c.x, c.y);
        const e = state.entities[k];
        if (!e) continue;
        if (e.kind === 'teletransportador' && countKind(state, 'teletransportador') <= 1) {
          state.events.push({ type: 'lastTeleporter' });
          continue;
        }
        delete state.entities[k];
        removed++;
      }
      if (removed) state.rev++;
      return removed ? { ok: true } : { ok: false, reason: 'Nada que borrar' };
    }
    case 'rotate': {
      const e = state.entities[key(action.x, action.y)];
      if (!e) return { ok: false, reason: 'No hay nada ahí' };
      e.dir = (e.dir + 1) % 4;
      if (e.item) e.item.p = Math.min(e.item.p, 0.5);
      state.rev++;
      return { ok: true };
    }
    default:
      return { ok: false, reason: 'Acción desconocida' };
  }
}

function placeOne(state, kind, x, y, dir) {
  const why = canPlace(state, kind, x, y);
  if (why) return { ok: false, reason: why };
  const existing = state.entities[key(x, y)];
  if (existing && existing.kind === 'cinta') {
    existing.dir = dir;
    if (existing.item) existing.item.p = Math.min(existing.item.p, 0.5);
  } else {
    addEntity(state, kind, x, y, dir);
    if (kind === 'cinta' && !state.firstBelt) { state.firstBelt = true; state.events.push({ type: 'firstBelt' }); }
  }
  state.rev++;
  return { ok: true };
}

function countKind(state, kind) {
  let n = 0;
  for (const k in state.entities) if (state.entities[k].kind === kind) n++;
  return n;
}

// ---- Guardado ----------------------------------------------------------------

export function serialize(state) {
  const { world, events, ...rest } = state;
  return JSON.stringify(rest);
}

export function deserialize(json) {
  const data = JSON.parse(json);
  if (data.version !== SAVE_VERSION) throw new Error('Versión de guardado incompatible');
  const world = generateWorld(data.seed);
  return { ...data, world, events: [], rev: (data.rev || 0) + 1 };
}
