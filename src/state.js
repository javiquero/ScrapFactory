// Estado de la partida y ACCIONES.
//
// Regla de oro: el estado solo cambia a través de applyAction(). Cada acción es un
// objeto plano y serializable ({ type: 'place', ... }). Hoy las acciones vienen del
// jugador local; el día del multijugador vendrán también por WebSocket, y el juego
// ni se enterará. La simulación (sim.js) es determinista a partir de este estado.

import {
  BUILDINGS, MAP_W, MAP_H, BELT_SPACING, PLANETS, SHIP_SIZE, TICK_RATE, RATE_SECONDS,
  orderAt, STARTING_UNLOCKS,
} from './defs.js';
import { generateWorld, key } from './world.js';

export const SAVE_VERSION = 6;

export const WORLD_GEN = 2; // versión del generador de mapas (2 = con obstáculos)

export function createGame(seed = Math.floor(Math.random() * 1e9)) {
  const world = generateWorld(seed, 0, WORLD_GEN);
  const state = {
    version: SAVE_VERSION,
    seed,
    planet: 0,                // índice del planeta actual (ver PLANETS)
    planetDone: false,        // ya se puede despegar al siguiente
    worldGen: WORLD_GEN,      // las partidas anteriores a los obstáculos siguen con su mapa
    tick: 0,
    nextId: 1,
    entities: {},             // "x,y" -> entidad
    ship: { x: world.spawn.x, y: world.spawn.y }, // esquina de arriba a la izquierda de la nave (2×2)
    unlocked: [...STARTING_UNLOCKS], // se amplía al cumplir pedidos
    orderIndex: 0,
    orderProgress: 0,
    hits: [],                 // ticks de las últimas entregas del pedido (para medir el ritmo)
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

// Ritmo actual del pedido: piezas por segundo en la ventana de RATE_SECONDS
export function orderRate(state) {
  const from = state.tick - RATE_SECONDS * TICK_RATE;
  let n = 0;
  for (const t of state.hits || []) if (t > from) n++;
  return n / RATE_SECONDS;
}

// Semilla del planeta siguiente: sale de la anterior (determinista, para el multijugador)
const nextSeed = (seed, planet) => ((Math.imul(seed ^ 0x5bd1e995, 2654435761) + planet * 7919) >>> 0) % 1000000000;

function addEntity(state, kind, x, y, dir) {
  const e = { id: state.nextId++, kind, x, y, dir };
  if (kind === 'cinta') e.items = [];      // de delante (p alto) a detrás
  if (kind === 'divisor') e.item = null;
  if (kind === 'divisor') { e.rr = 0; e.outs = [true, true, true]; } // salidas: izquierda, frente, derecha
  if (kind === 'puente') e.lanes = [null, null]; // [por debajo (horizontal), por encima (vertical)]
  if (kind === 'extractor') { e.timer = 0; e.out = []; }
  if (BUILDINGS[kind]?.recipe) { e.inv = {}; e.out = []; e.timer = 0; e.busy = false; }
  state.entities[key(x, y)] = e;
  return e;
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

// Lo que se puede pisar con otro edificio (se sustituye)
export const replaceable = (e) => e.kind === 'cinta' || e.kind === 'divisor' || e.kind === 'puente';

// Comprueba si se puede colocar algo; devuelve null si sí, o el motivo si no.
export function canPlace(state, kind, x, y) {
  if (!BUILDINGS[kind]) return 'Edificio desconocido';
  if (!state.unlocked.includes(kind)) return 'Aún no está desbloqueado';
  if (!inBounds(x, y)) return 'Fuera del mapa';
  if (isShip(state, x, y)) return 'Ahí está tu nave';
  if (state.world.obstacles?.[key(x, y)] !== undefined) return 'Ahí hay un obstáculo';
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

// Acciones de construcción que se pueden deshacer, y las casillas que tocan
function touched(action) {
  switch (action.type) {
    case 'place': case 'rotate': case 'setOutputs': return [{ x: action.x, y: action.y }];
    case 'placeMany': case 'remove': return action.cells;
    case 'placeBlueprint': return action.items.map((it) => ({ x: action.x + it.dx, y: action.y + it.dy }));
    default: return null;
  }
}

const clone = (o) => (o == null ? null : JSON.parse(JSON.stringify(o)));

// Aplica la acción. Si es de construcción y sale bien, devuelve también `undo`:
// otra acción plana ({ type: 'setCells', ... }) que deja esas casillas como estaban.
export function applyAction(state, action) {
  const cells = touched(action);
  if (!cells) return apply(state, action);
  const seen = new Set();
  const before = [];
  for (const c of cells) {
    const k = key(c.x, c.y);
    if (seen.has(k)) continue;
    seen.add(k);
    before.push({ x: c.x, y: c.y, e: clone(state.entities[k]) });
  }
  const res = apply(state, action);
  if (res.ok) res.undo = { type: 'setCells', cells: before };
  return res;
}

function apply(state, action) {
  switch (action.type) {
    case 'place': return placeOne(state, action.kind, action.x, action.y, action.dir);
    case 'placeMany': {
      let placed = 0;
      const cs = action.cells;
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i];
        // Cinta que atraviesa otra en perpendicular, en línea recta: se pone un puente
        if (action.kind === 'cinta' && i > 0 && i < cs.length - 1 && crossing(state, c, cs[i - 1])) {
          if (placeOne(state, 'puente', c.x, c.y, 0).ok) placed++;
          continue;
        }
        // por encima de un puente, la cinta sigue su camino sin tocarlo
        if (action.kind === 'cinta' && state.entities[key(c.x, c.y)]?.kind === 'puente') continue;
        if (placeOne(state, action.kind, c.x, c.y, c.dir).ok) placed++;
      }
      return placed ? { ok: true, placed } : { ok: false, reason: 'Nada que colocar' };
    }
    case 'placeBlueprint': {
      // Pegar un trozo de fábrica copiado: cada pieza en (x+dx, y+dy). Lo que no
      // quepa (obstáculo, otra máquina, extractor sin recurso...) se salta.
      let placed = 0;
      for (const it of action.items) {
        const x = action.x + it.dx, y = action.y + it.dy;
        if (!placeOne(state, it.kind, x, y, it.dir).ok) continue;
        placed++;
        const e = state.entities[key(x, y)];
        if (it.outs && e?.kind === 'divisor') e.outs = it.outs.map(Boolean);
      }
      return placed ? { ok: true, placed } : { ok: false, reason: 'Ahí no cabe nada del trozo copiado' };
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
    case 'nextPlanet': {
      // Despegar: mapa nuevo con un recurso más. Se conservan las máquinas
      // desbloqueadas y el total enviado; la fábrica empieza de cero.
      if (!state.planetDone) return { ok: false, reason: 'Aún quedan pedidos en este planeta' };
      if (!hasNextPlanet(state)) return { ok: false, reason: 'No hay más planetas (de momento)' };
      const p = state.planet + 1;
      state.seed = nextSeed(state.seed, p);
      state.planet = p;
      state.planetDone = false;
      state.world = generateWorld(state.seed, p, state.worldGen || 1);
      state.entities = {};
      state.ship = { x: state.world.spawn.x, y: state.world.spawn.y };
      state.orderIndex = 0;
      state.orderProgress = 0;
      state.hits = [];
      state.rev++;
      state.events.push({ type: 'planetStart', planet: p });
      return { ok: true };
    }
    case 'setCells': {
      // Deshacer: cada casilla vuelve a como estaba. Si sigue el mismo edificio,
      // solo se le devuelve la orientación (lo que lleva encima sigue su camino).
      for (const c of action.cells) {
        const k = key(c.x, c.y);
        const now = state.entities[k];
        if (!c.e) { delete state.entities[k]; continue; }
        if (isShip(state, c.x, c.y)) continue;
        if (now && now.id === c.e.id) { now.dir = c.e.dir; if (c.e.outs) now.outs = [...c.e.outs]; resettle(now); continue; }
        state.entities[k] = clone(c.e);
        if (c.e.id >= state.nextId) state.nextId = c.e.id + 1;
      }
      state.rev++;
      return { ok: true };
    }
    case 'setOutputs': {
      // Divisor: qué salidas están abiertas (izquierda, frente, derecha). Al menos una.
      const e = state.entities[key(action.x, action.y)];
      if (!e || e.kind !== 'divisor') return { ok: false, reason: 'Eso no es un divisor' };
      const outs = (action.outs || []).slice(0, 3).map(Boolean);
      if (outs.length !== 3 || !outs.some(Boolean)) return { ok: false, reason: 'Deja al menos una salida abierta' };
      e.outs = outs;
      state.rev++;
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

// ¿La cinta nueva cruza en recto una cinta que va en perpendicular (y hay puentes)?
function crossing(state, c, prev) {
  if (!state.unlocked.includes('puente')) return false;
  const e = state.entities[key(c.x, c.y)];
  return !!e && e.kind === 'cinta' && prev.dir === c.dir && e.dir % 2 !== c.dir % 2;
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
  const world = generateWorld(data.seed, data.planet || 0, data.worldGen || 1);
  return { ...data, world, events: [], rev: (data.rev || 0) + 1 };
}

// Las partidas de antes de la versión 6 (con dinero y tienda) no se pueden poner
// al día: el juego cambió de reglas. Se empieza una nueva.
function migrate(data) {
  if (data.version !== SAVE_VERSION) throw new Error('Versión de guardado incompatible');
  return data;
}
