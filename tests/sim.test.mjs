// Pruebas de la simulación sin navegador: node tests/sim.test.mjs
import assert from 'node:assert/strict';
import { createGame, applyAction, serialize, deserialize, currentOrder } from '../src/state.js';
import { step } from '../src/sim.js';
import { key } from '../src/world.js';
import { TICK_RATE, beltRate, extractorRate } from '../src/defs.js';
import { beltShape } from '../src/beltShapes.js';

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
  assert.equal(s.entities[key(x + 1, y)].items.length, 0);
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

// 8) Ritmos cuadrados: 1 extractor = media cinta, 2 extractores = cinta llena
function throughput(nExtractors, level) {
  const s = createGame(7);
  s.levels = { cinta: level, extractor: level, prensa: level, ensambladora: level };
  const x0 = s.world.spawn.x - 10, y0 = s.world.spawn.y + 8;
  for (let x = x0 - 1; x <= x0 + 12; x++) for (let y = y0 - 1; y <= y0; y++) {
    delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)];
  }
  for (let i = 0; i < nExtractors; i++) {
    s.world.nodes[key(x0 + i, y0 - 1)] = 'chatarra';
    assert.ok(applyAction(s, { type: 'place', kind: 'extractor', x: x0 + i, y: y0 - 1, dir: 1 }).ok);
  }
  const cells = [];
  for (let i = 0; i < 10; i++) cells.push({ x: x0 + i, y: y0, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  assert.ok(applyAction(s, { type: 'place', kind: 'teletransportador', x: x0 + 10, y: y0, dir: 0 }).ok);
  run(s, 20);
  const before = s.delivered.chatarra || 0;
  run(s, 40);
  return ((s.delivered.chatarra || 0) - before) / 40;
}
for (const lvl of [1, 2, 3]) {
  const one = throughput(1, lvl), two = throughput(2, lvl), three = throughput(3, lvl);
  const er = extractorRate(lvl), br = beltRate(lvl);
  assert.ok(Math.abs(one - er) < 0.1, `nivel ${lvl}: 1 extractor da ${one}/s, esperado ${er}`);
  assert.ok(Math.abs(two - br) < 0.15, `nivel ${lvl}: 2 extractores dan ${two}/s, esperado ${br}`);
  assert.ok(three <= br + 0.1, `nivel ${lvl}: la cinta no puede pasar de ${br}/s (da ${three})`);
  console.log(`✓ nivel ${lvl}: 1 extractor ${one.toFixed(2)}/s · 2 extractores ${two.toFixed(2)}/s · tope cinta ${br}/s`);
}

// 9) Una cinta llena alimenta justo una prensa (nivel 1: 5 chatarra/s -> 2,5 placas/s)
{
  const s = createGame(7);
  s.unlocked.push('prensa');
  const x0 = s.world.spawn.x - 10, y0 = s.world.spawn.y + 8;
  for (let x = x0 - 1; x <= x0 + 12; x++) for (let y = y0 - 1; y <= y0; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  for (let i = 0; i < 2; i++) { s.world.nodes[key(x0 + i, y0 - 1)] = 'chatarra'; applyAction(s, { type: 'place', kind: 'extractor', x: x0 + i, y: y0 - 1, dir: 1 }); }
  const cells = []; for (let i = 0; i < 6; i++) cells.push({ x: x0 + i, y: y0, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  applyAction(s, { type: 'place', kind: 'prensa', x: x0 + 6, y: y0, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: x0 + 7, y: y0, dir: 0 }, { x: x0 + 8, y: y0, dir: 0 }] });
  applyAction(s, { type: 'place', kind: 'teletransportador', x: x0 + 9, y: y0, dir: 0 });
  run(s, 20); const b = s.delivered.placa || 0; run(s, 40);
  const rate = ((s.delivered.placa || 0) - b) / 40;
  assert.ok(Math.abs(rate - 2.5) < 0.15, 'prensa da ' + rate);
  console.log('✓ prensa con cinta llena:', rate.toFixed(2), 'placas/s');
}

// 10) Una partida guardada en la versión anterior se pone al día
{
  const old = { version: 2, seed: 3, tick: 10, nextId: 3, unlocked: ['cinta', 'extractor', 'teletransportador', 'prensa'], orderIndex: 2, orderProgress: 5, delivered: {}, rev: 4,
    entities: { '1,1': { id: 2, kind: 'cinta', x: 1, y: 1, dir: 0, item: { type: 'chatarra', p: 0.3, from: 2 } } } };
  const st = deserialize(JSON.stringify(old));
  assert.equal(st.version, 3);
  assert.equal(st.entities['1,1'].items.length, 1);
  assert.equal(st.levels.extractor, 2);
  assert.ok(st.unlocked.includes('divisor'));
  console.log('✓ migración de guardado v2 → v3');
}

// 11) Forma de las cintas: curva al girar y unión cuando entra otra por un lado
{
  const s = createGame(11);
  const X = 5, Y = 5;
  for (let x = X - 1; x <= X + 4; x++) for (let y = Y - 1; y <= Y + 4; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: X, y: Y, dir: 0 }, { x: X + 1, y: Y, dir: 1 }, { x: X + 1, y: Y + 1, dir: 1 }] });
  const shape = (x, y) => beltShape(s, s.entities[key(x, y)]);
  assert.equal(shape(X, Y), 'straight');
  assert.equal(shape(X + 1, Y), 'curveR', 'gira a la derecha: entra por la izquierda del sentido');
  assert.equal(shape(X + 1, Y + 1), 'straight');
  applyAction(s, { type: 'place', kind: 'cinta', x: X + 2, y: Y + 1, dir: 2 }); // entra por el lado
  assert.equal(shape(X + 1, Y + 1), 'mergeL');
  console.log('✓ formas de cinta: recta, curva y unión');
}

// 12) Una máquina puesta encima de una cinta la sustituye; encima de otra máquina, no
{
  const s = createGame(12);
  s.unlocked.push('prensa');
  const X = 6, Y = 6;
  for (let x = X - 1; x <= X + 3; x++) { delete s.world.nodes[key(x, Y)]; delete s.entities[key(x, Y)]; }
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: X, y: Y, dir: 0 }, { x: X + 1, y: Y, dir: 0 }] });
  assert.ok(applyAction(s, { type: 'place', kind: 'prensa', x: X + 1, y: Y, dir: 0 }).ok);
  assert.equal(s.entities[key(X + 1, Y)].kind, 'prensa');
  assert.equal(applyAction(s, { type: 'place', kind: 'teletransportador', x: X + 1, y: Y, dir: 0 }).ok, false);
  console.log('✓ máquina sustituye cinta');
}

console.log('Todo OK');
