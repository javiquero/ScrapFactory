// Estado de la partida y ACCIONES.
//
// Regla de oro: el estado solo cambia a través de applyAction(). Cada acción es un
// objeto plano y serializable ({ type: 'place', ... }). Hoy las acciones vienen del
// jugador local; el día del multijugador vendrán también por WebSocket, y el juego
// ni se enterará. La simulación (sim.js) es determinista a partir de este estado.

import {
  BUILDINGS, MAP_W, MAP_H, BELT_SPACING, PLANETS, SHIP_SIZE, MAX_LEVEL, LEVELED,
  planetAt, orderAt, shopAt, upgradeCost, baseLevels, STARTING_UNLOCKS,
} from './defs.js';
import { generateWorld, key } from './world.js';

export const SAVE_VERSION = 5;

export function createGame(seed = Math.floor(Math.random() * 1e9)) {
  const world = generateWorld(seed, 0);
  const state = {
    version: SAVE_VERSION,
    seed,
    planet: 0,                // índice del planeta actual (ver PLANETS)
    planetDone: false,        // ya se puede despegar al siguiente
    tick: 0,
    nextId: 1,
    entities: {},             // "x,y" -> entidad
    ship: { x: world.spawn.x, y: world.spawn.y }, // esquina de arriba a la izquierda de la nave (2×2)
    money: 0,                 // créditos Chatarrex
    unlocked: [...STARTING_UNLOCKS],
    levels: baseLevels(),     // nivel de cada tipo de edificio (se compra)
    orderIndex: 0,
    orderProgress: 0,
    delivered: {},            // total histórico por objeto
    events: [],               // cola de eventos para la interfaz (no se guarda)
    rev: 0,                   // sube con cada cambio estructural (para redibujar)
  };
  state.world = world;
  return state;
}

export function currentOrder(state) {
  return orderAt(state.planet, state.orderIndex);
}

export const hasNextPlanet = (state) => state.planet + 1 < PLANETS.length;

// ¿La casilla (x, y) es parte de la nave?
export function isShip(state, x, y) {
  const s = state.ship;
  return !!s && x >= s.x && y >= s.y && x < s.x + SHIP_SIZE && y < s.y + SHIP_SIZE;
}

// Precio del siguiente nivel de un tipo de edificio, o null si ya está al máximo
export function nextUpgrade(state, kind) {
  if (!LEVELED.includes(kind)) return null;
  const lvl = state.levels[kind] || 1;
  if (lvl >= MAX_LEVEL) return null;
  return { to: lvl + 1, cost: upgradeCost(kind, lvl + 1) };
}

// Semilla del planeta siguiente: sale de la anterior (determinista, para el multijugador)
const nextSeed = (seed, planet) => ((Math.imul(seed ^ 0x5bd1e995, 2654435761) + planet * 7919) >>> 0) % 1000000000;

function addEntity(state, kind, x, y, dir) {
  const e = { id: state.nextId++, kind, x, y, dir };
  if (kind === 'cinta') e.items = [];      // de delante (p alto) a detrás
  if (kind === 'divisor') e.item = null;
  if (kind === 'divisor') e.rr = 0;
  if (kind === 'extractor') { e.timer = 0; e.out = []; }
  if (BUILDINGS[kind]?.recipe) { e.inv = {}; e.out = []; e.timer = 0; e.busy = false; }
  state.entities[key(x, y)] = e;
  return e;
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

// Lo que se puede pisar con otro edificio (se sustituye)
export const replaceable = (e) => e.kind === 'cinta' || e.kind === 'divisor';

// Comprueba si se puede colocar algo; devuelve null si sí, o el motivo si no.
export function canPlace(state, kind, x, y) {
  if (!BUILDINGS[kind]) return 'Edificio desconocido';
  if (!state.unlocked.includes(kind)) return 'Aún no lo has comprado';
  if (!inBounds(x, y)) return 'Fuera del mapa';
  if (isShip(state, x, y)) return 'Ahí está tu nave';
  const existing = state.entities[key(x, y)];
  const node = state.world.nodes[key(x, y)];
  if (BUILDINGS[kind].onNode && !node) return 'Tiene que ir sobre un recurso';
  if (existing) {
    // Las cintas se pueden re-trazar encima de otras cintas
    if (kind === 'cinta' && existing.kind === 'cinta') return null;
    // Una máquina o un divisor puesto encima de una cinta la sustituye
    if (kind !== 'cinta' && replaceable(existing)) return null;
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
        if (!state.entities[k]) continue;
        delete state.entities[k];
        removed++;
      }
      if (removed) state.rev++;
      return removed ? { ok: true } : { ok: false, reason: 'Nada que borrar' };
    }
    case 'buy': {
      // Comprar un edificio nuevo en el catálogo
      const b = BUILDINGS[action.kind];
      if (!b) return { ok: false, reason: 'Edificio desconocido' };
      if (state.unlocked.includes(action.kind)) return { ok: false, reason: 'Ya lo tienes' };
      if (!shopAt(state.planet).includes(action.kind)) return { ok: false, reason: 'No se vende en este planeta' };
      if (state.money < b.price) return { ok: false, reason: 'No te llega el dinero' };
      state.money -= b.price;
      state.unlocked.push(action.kind);
      state.rev++;
      state.events.push({ type: 'bought', kind: action.kind });
      return { ok: true };
    }
    case 'upgrade': {
      // Subir de nivel TODOS los edificios de un tipo
      if (!state.unlocked.includes(action.kind)) return { ok: false, reason: 'Primero tienes que comprarlo' };
      const up = nextUpgrade(state, action.kind);
      if (!up) return { ok: false, reason: 'Ya está al máximo' };
      if (state.money < up.cost) return { ok: false, reason: 'No te llega el dinero' };
      state.money -= up.cost;
      state.levels[action.kind] = up.to;
      state.rev++;
      state.events.push({ type: 'upgraded', kind: action.kind, level: up.to });
      return { ok: true };
    }
    case 'nextPlanet': {
      // Despegar: mapa nuevo con un recurso más. Se conserva lo comprado, las
      // mejoras, el dinero y el total enviado; la fábrica empieza de cero.
      if (!state.planetDone) return { ok: false, reason: 'Aún quedan pedidos en este planeta' };
      if (!hasNextPlanet(state)) return { ok: false, reason: 'No hay más planetas (de momento)' };
      const p = state.planet + 1;
      state.seed = nextSeed(state.seed, p);
      state.planet = p;
      state.planetDone = false;
      state.world = generateWorld(state.seed, p);
      state.entities = {};
      state.ship = { x: state.world.spawn.x, y: state.world.spawn.y };
      state.orderIndex = 0;
      state.orderProgress = 0;
      state.rev++;
      state.events.push({ type: 'planetStart', planet: p });
      return { ok: true };
    }
    case 'rotate': {
      const e = state.entities[key(action.x, action.y)];
      if (!e) return { ok: false, reason: 'No hay nada ahí' };
      e.dir = (e.dir + 1) % 4;
      resettle(e);
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
  if (existing && existing.kind === 'cinta' && kind === 'cinta') {
    existing.dir = dir;
    resettle(existing);
  } else {
    if (existing) delete state.entities[key(x, y)]; // sustituye la cinta o el divisor
    addEntity(state, kind, x, y, dir);
    if (kind === 'cinta' && !state.firstBelt) { state.firstBelt = true; state.events.push({ type: 'firstBelt' }); }
  }
  state.rev++;
  return { ok: true };
}

// Al girar una cinta, lo que llevaba vuelve a la mitad para no saltar de golpe
function resettle(e) {
  if (e.item) e.item.p = Math.min(e.item.p, 0.5);
  if (!e.items) return;
  let lim = 0.5;
  for (const it of e.items) { it.p = Math.max(0, Math.min(it.p, lim)); lim = it.p - BELT_SPACING; }
  e.items = e.items.filter((it, i) => i === 0 || it.p <= e.items[i - 1].p - BELT_SPACING + 1e-6);
}

// ---- Guardado ----------------------------------------------------------------

export function serialize(state) {
  const { world, events, ...rest } = state;
  return JSON.stringify(rest);
}

export function deserialize(json) {
  const data = migrate(JSON.parse(json));
  const world = generateWorld(data.seed, data.planet || 0);
  return { ...data, world, events: [], rev: (data.rev || 0) + 1 };
}

// Pone al día partidas guardadas con versiones anteriores
function migrate(data) {
  if (data.version === 2) {
    for (const k in data.entities) {
      const e = data.entities[k];
      if (e.kind === 'cinta') { e.items = e.item ? [e.item] : []; delete e.item; }
    }
    data.orderIndex = Math.min(data.orderIndex || 0, 5);
    data.orderProgress = 0;
    data.version = 3;
  }
  if (data.version === 3) {
    // llegan los planetas: la partida antigua sigue en el planeta 1
    data.planet = 0;
    data.planetDone = false;
    data.version = 4;
  }
  if (data.version === 4) {
    // llegan la nave fija, el dinero y la cadena larga de la chatarra
    const planet = data.planet || 0;
    const world = generateWorld(data.seed, planet);
    data.ship = { x: world.spawn.x, y: world.spawn.y };
    const rename = { taller: 'cristaleria', montadora: planet >= 1 ? 'montasolar' : 'montadora' };
    for (const k in data.entities) {
      const e = data.entities[k];
      if (rename[e.kind]) e.kind = rename[e.kind];
      const onShip = e.x >= data.ship.x && e.y >= data.ship.y && e.x < data.ship.x + SHIP_SIZE && e.y < data.ship.y + SHIP_SIZE;
      if (e.kind === 'teletransportador' || !BUILDINGS[e.kind] || onShip) delete data.entities[k];
    }
    // se conserva lo que ya tenía; los pedidos empiezan la lista nueva desde donde iba
    const had = (data.unlocked || []).map((u) => rename[u] || u).filter((u) => BUILDINGS[u]);
    data.unlocked = [...new Set([...STARTING_UNLOCKS, ...had])];
    data.levels = { ...baseLevels(), ...(data.levels || {}) };
    for (const k of Object.keys(data.levels)) if (!LEVELED.includes(k)) delete data.levels[k];
    data.orderIndex = Math.min(data.orderIndex || 0, planetAt(planet).orders.length - 1);
    data.orderProgress = 0;
    data.planetDone = false;
    data.money = 100; // un detalle de Chatarrex por las molestias
    data.version = 5;
  }
  if (data.version !== SAVE_VERSION) throw new Error('Versión de guardado incompatible');
  return data;
}
