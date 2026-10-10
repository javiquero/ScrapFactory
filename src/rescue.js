// Pedido de rescate: si te gastas el dinero en lo que no toca y ya no puedes pagar
// la máquina que necesita el pedido actual, Chatarrex te manda un trabajito extra.
// Se cumple SOLO con lo que ya tienes desbloqueado y pide un RITMO (piezas por
// segundo durante un rato), así que hay que montar varias máquinas a la vez.
// Paga lo justo para comprar lo que te falta. Todo determinista (sin azar ni reloj).

import { BUILDINGS, ITEMS, NODES, TICK_RATE, planetAt, orderAt, extractorRate, craftTime } from './defs.js';

export const RESCUE_SECONDS = 20;          // ventana en la que se mide el ritmo
const WINDOW = RESCUE_SECONDS * TICK_RATE;

// Qué máquina fabrica cada objeto
const MAKER = {};
for (const [k, b] of Object.entries(BUILDINGS)) if (b.recipe) MAKER[b.recipe.out] = k;
const RAW = new Set(Object.values(NODES).map((n) => n.item));

// Máquinas que hacen falta para fabricar `item` (toda la cadena)
export function machinesFor(item, acc = new Set()) {
  const m = MAKER[item];
  if (!m) return acc;
  acc.add(m);
  for (const t in BUILDINGS[m].recipe.in) machinesFor(t, acc);
  return acc;
}

// Recursos del suelo que hacen falta para fabricar `item`
function rawFor(item, acc = new Set()) {
  if (RAW.has(item)) { acc.add(item); return acc; }
  const m = MAKER[item];
  if (m) for (const t in BUILDINGS[m].recipe.in) rawFor(t, acc);
  return acc;
}

// Lo que falta comprar para el pedido actual y cuánto cuesta
export function missingFor(state) {
  const order = orderAt(state.planet || 0, state.orderIndex);
  const missing = [...machinesFor(order.item)].filter((k) => !state.unlocked.includes(k));
  return { order, missing, cost: missing.reduce((a, k) => a + BUILDINGS[k].price, 0) };
}

// ¿Atascado? Falta alguna máquina y no hay dinero para comprarlas todas
// (solo se cobra lo del pedido, así que sin ellas no entra ni un crédito más)
export function isStuck(state) {
  const { missing, cost } = missingFor(state);
  return missing.length > 0 && (state.money || 0) < cost;
}

// Elige el rescate: el objeto más valioso que puedes fabricar con lo que tienes
// en este planeta, a un ritmo que pide al menos 2 máquinas (3 extractores si es en bruto)
function makeRescue(state) {
  const { order, cost } = missingFor(state);
  const res = new Set(planetAt(state.planet || 0).resources);
  let best = null;
  for (const item in ITEMS) {
    if (item === order.item) continue;
    if (![...rawFor(item)].every((r) => res.has(r))) continue;
    if (![...machinesFor(item)].every((k) => state.unlocked.includes(k))) continue;
    if (!best || ITEMS[item].value > ITEMS[best].value) best = item;
  }
  if (!best) return null;
  const m = MAKER[best];
  const lv = state.levels || {};
  const rate = m ? (2 / craftTime(m, lv[m])) : 3 * extractorRate(lv.extractor);
  const amount = Math.ceil(rate * RESCUE_SECONDS);
  const pay = Math.max(50, Math.ceil(((cost - (state.money || 0)) * 1.1) / 10) * 10);
  return { item: best, rate, amount, pay, hits: [] };
}

// Cuántas piezas del rescate han llegado en la ventana
export function rescueCount(state) {
  const r = state.rescue;
  if (!r) return 0;
  const from = state.tick - WINDOW;
  let n = 0;
  for (const t of r.hits) if (t > from) n++;
  return n;
}

// Se llama desde step() de vez en cuando: abre o cierra el rescate según haga falta
export function checkRescue(state) {
  if (state.rescue) {
    if (!isStuck(state)) { state.rescue = null; state.rev++; }
    return;
  }
  if (!isStuck(state)) return;
  const r = makeRescue(state);
  if (!r) return;
  state.rescue = r;
  state.rev++;
  state.events.push({ type: 'rescueStart', missing: missingFor(state).missing });
}

// Llega algo a la nave con un rescate abierto. Devuelve true si cuenta para el rescate.
export function rescueDeliver(state, type) {
  const r = state.rescue;
  if (!r || type !== r.item) return false;
  r.hits.push(state.tick);
  const from = state.tick - WINDOW;
  while (r.hits.length && r.hits[0] <= from) r.hits.shift();
  if (r.hits.length >= r.amount) {
    state.money = (state.money || 0) + r.pay;
    state.events.push({ type: 'rescueDone', pay: r.pay });
    state.rescue = null;
    state.rev++;
  }
  return true;
}
