// Pruebas de la simulación sin navegador: node tests/sim.test.mjs
import assert from 'node:assert/strict';
import { createGame, applyAction, serialize, deserialize, currentOrder } from '../src/state.js';
import { step } from '../src/sim.js';
import { key } from '../src/world.js';
import { TICK_RATE } from '../src/defs.js';

const run = (state, seconds) => { for (let i = 0; i < seconds * TICK_RATE; i++) step(state); };

function findNode(state, type) {
  for (const k in state.world.nodes) if (state.world.nodes[k] === type) return k.split(',').map(Number);
  throw new Error('sin nodo ' + type);
}

// Monta una línea recta: extractor en (x,y) -> n cintas a la derecha -> teletransportador
function line(state, x, y, n) {
  assert.ok(applyAction(state, { type: 'place', kind: 'extractor', x, y, dir: 0 }).ok);
  const cells = [];
  for (let i = 1; i <= n; i++) cells.push({ x: x + i, y, dir: 0 });
  // las cintas pueden caer sobre nodos; quitamos lo que hubiera
  applyAction(state, { type: 'remove', cells });
  assert.ok(applyAction(state, { type: 'placeMany', kind: 'cinta', cells }).ok);
  applyAction(state, { type: 'remove', cells: [{ x: x + n + 1, y }] });
  assert.ok(applyAction(state, { type: 'place', kind: 'teletransportador', x: x + n + 1, y, dir: 0 }).ok);
}

// 1) Chatarra llega al teletransportador y completa el primer pedido
{
  const s = createGame(1234);
  const [x, y] = findNode(s, 'chatarra');
  line(s, x, y, 5);
  run(s, 40);
  assert.ok((s.delivered.chatarra || 0) >= 20, 'debería entregar >= 20 chatarra, entregó ' + s.delivered.chatarra);
  assert.equal(s.orderIndex, 1, 'primer pedido completado');
  assert.ok(s.unlocked.includes('prensa'), 'prensa desbloqueada');
  console.log('✓ línea básica: entregadas', s.delivered.chatarra, 'chatarra');
}

// 2) Extractor fuera de un nodo no se puede colocar
{
  const s = createGame(99);
  let free = null;
  for (let yy = 0; yy < 64 && !free; yy++) for (let xx = 0; xx < 64; xx++) {
    if (!s.world.nodes[key(xx, yy)] && !s.entities[key(xx, yy)]) { free = [xx, yy]; break; }
  }
  const r = applyAction(s, { type: 'place', kind: 'extractor', x: free[0], y: free[1], dir: 0 });
  assert.equal(r.ok, false);
  console.log('✓ extractor exige recurso:', r.reason);
}

// 3) Prensa: chatarra -> placa
{
  const s = createGame(1234);
  s.unlocked.push('prensa');
  const [x, y] = findNode(s, 'chatarra');
  applyAction(s, { type: 'place', kind: 'extractor', x, y, dir: 0 });
  const cells = [{ x: x + 1, y, dir: 0 }, { x: x + 2, y, dir: 0 }];
  applyAction(s, { type: 'remove', cells: [...cells, { x: x + 3, y }, { x: x + 4, y }, { x: x + 5, y }] });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  applyAction(s, { type: 'place', kind: 'prensa', x: x + 3, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'cinta', x: x + 4, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'teletransportador', x: x + 5, y, dir: 0 });
  run(s, 30);
  assert.ok((s.delivered.placa || 0) >= 5, 'placas entregadas: ' + s.delivered.placa);
  console.log('✓ prensa: entregadas', s.delivered.placa, 'placas');
}

// 4) Una cinta no acepta objetos por su salida
{
  const s = createGame(5);
  const [x, y] = findNode(s, 'chatarra');
  applyAction(s, { type: 'place', kind: 'extractor', x, y, dir: 0 });
  applyAction(s, { type: 'remove', cells: [{ x: x + 1, y }] });
  applyAction(s, { type: 'place', kind: 'cinta', x: x + 1, y, dir: 2 }); // apunta hacia el extractor
  run(s, 5);
  assert.equal(s.entities[key(x + 1, y)].item, null);
  console.log('✓ cinta contraria bloquea');
}

// 5) Guardar y cargar conserva la partida y sigue igual que el original
{
  const a = createGame(777);
  const [x, y] = findNode(a, 'chatarra');
  line(a, x, y, 4);
  run(a, 7);
  const b = deserialize(serialize(a));
  run(a, 10); run(b, 10);
  assert.equal(serialize(a), serialize(b).replace(/"rev":\d+/, '"rev":' + a.rev));
  console.log('✓ guardado determinista; pedido actual:', currentOrder(b).item);
}

// 6) Divisor reparte
{
  const s = createGame(1234);
  s.unlocked.push('divisor');
  const [x, y] = findNode(s, 'chatarra');
  // limpia una zona 3x5
  const zone = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = 1; dx <= 4; dx++) zone.push({ x: x + dx, y: y + dy });
  applyAction(s, { type: 'remove', cells: zone });
  for (const c of zone) delete s.world.nodes[key(c.x, c.y)];
  applyAction(s, { type: 'place', kind: 'extractor', x, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'divisor', x: x + 1, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'teletransportador', x: x + 2, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'teletransportador', x: x + 1, y: y - 1, dir: 0 });
  applyAction(s, { type: 'place', kind: 'teletransportador', x: x + 1, y: y + 1, dir: 0 });
  run(s, 20);
  assert.ok(s.delivered.chatarra >= 12, 'divisor entrega ' + s.delivered.chatarra);
  console.log('✓ divisor: entregadas', s.delivered.chatarra);
}

// 7) Ensambladora: 2 placas + 1 chatarra -> engranaje (y sin plátanos en el mapa)
{
  const s = createGame(42);
  assert.ok(Object.values(s.world.nodes).every((t) => t === 'chatarra'), 'solo chatarra en el mapa');
  s.unlocked.push('ensambladora');
  const sp = s.world.spawn;
  applyAction(s, { type: 'place', kind: 'ensambladora', x: sp.x - 1, y: sp.y, dir: 0 });
  const e = s.entities[key(sp.x - 1, sp.y)];
  e.inv = { placa: 4, chatarra: 2 };
  run(s, 8);
  assert.equal(s.delivered.engranaje, 2, 'engranajes: ' + s.delivered.engranaje);
  console.log('✓ ensambladora: entregados', s.delivered.engranaje, 'engranajes');
}

console.log('Todo OK');
