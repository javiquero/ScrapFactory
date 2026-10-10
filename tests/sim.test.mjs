// Pruebas de la simulación sin navegador: node tests/sim.test.mjs
import assert from 'node:assert/strict';
import { createGame, applyAction, serialize, deserialize, currentOrder, isShip } from '../src/state.js';
import { step, tryInsert } from '../src/sim.js';
import { isStuck, rescueCount, machinesFor } from '../src/rescue.js';
import { key } from '../src/world.js';
import { TICK_RATE, beltRate, extractorRate, PLANETS, BUILDINGS, ITEMS, NODES, LEVEL_MULT, upgradeCost, shopAt } from '../src/defs.js';
import { beltShape } from '../src/beltShapes.js';

const run = (state, seconds) => { for (let i = 0; i < seconds * TICK_RATE; i++) step(state); };

function findNode(state, type) {
  for (const k in state.world.nodes) if (state.world.nodes[k] === type) return k.split(',').map(Number);
  throw new Error('sin nodo ' + type);
}

// Para las pruebas: lleva la nave a (x, y) (esquina de arriba a la izquierda) y despeja debajo
function shipAt(state, x, y) {
  state.ship = { x, y };
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) delete state.entities[key(x + dx, y + dy)];
}
const own = (s, ...kinds) => { for (const k of kinds) if (!s.unlocked.includes(k)) s.unlocked.push(k); };

// Monta una línea recta: extractor en (x,y) -> n cintas a la derecha -> nave
function line(state, x, y, n) {
  assert.ok(applyAction(state, { type: 'place', kind: 'extractor', x, y, dir: 0 }).ok);
  const cells = [];
  for (let i = 1; i <= n; i++) cells.push({ x: x + i, y, dir: 0 });
  // las cintas pueden caer sobre nodos; quitamos lo que hubiera
  applyAction(state, { type: 'remove', cells });
  assert.ok(applyAction(state, { type: 'placeMany', kind: 'cinta', cells }).ok);
  shipAt(state, x + n + 1, y);
}

// 1) Chatarra llega a la nave, completa el primer pedido y Chatarrex paga
{
  const s = createGame(1234);
  const [x, y] = findNode(s, 'chatarra');
  line(s, x, y, 5);
  run(s, 40);
  const need = PLANETS[0].orders[0];
  assert.ok((s.delivered.chatarra || 0) >= need.amount, 'debería entregar >= ' + need.amount + ' chatarra, entregó ' + s.delivered.chatarra);
  assert.equal(s.orderIndex, 1, 'primer pedido completado');
  assert.equal(s.money, need.amount * ITEMS.chatarra.value + need.pay, 'cobra las piezas del pedido y el pedido; la chatarra de más no');
  assert.ok(!s.unlocked.includes('prensa'), 'la prensa ya no se regala: se compra');
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
  own(s, 'prensa');
  const [x, y] = findNode(s, 'chatarra');
  applyAction(s, { type: 'place', kind: 'extractor', x, y, dir: 0 });
  const cells = [{ x: x + 1, y, dir: 0 }, { x: x + 2, y, dir: 0 }];
  applyAction(s, { type: 'remove', cells: [...cells, { x: x + 3, y }, { x: x + 4, y }, { x: x + 5, y }] });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  applyAction(s, { type: 'place', kind: 'prensa', x: x + 3, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'cinta', x: x + 4, y, dir: 0 });
  shipAt(s, x + 5, y);
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
  own(s, 'divisor');
  const [x, y] = findNode(s, 'chatarra');
  // limpia una zona 3x5
  const zone = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = 1; dx <= 4; dx++) zone.push({ x: x + dx, y: y + dy });
  applyAction(s, { type: 'remove', cells: zone });
  for (const c of zone) delete s.world.nodes[key(c.x, c.y)];
  applyAction(s, { type: 'place', kind: 'extractor', x, y, dir: 0 });
  applyAction(s, { type: 'place', kind: 'divisor', x: x + 1, y, dir: 0 });
  // salida de frente a la nave; izquierda y derecha, a cintas que acaban en la misma nave
  shipAt(s, x + 2, y - 1);
  applyAction(s, { type: 'place', kind: 'cinta', x: x + 1, y: y - 1, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: x + 1, y: y + 1, dir: 0 }, { x: x + 2, y: y + 1, dir: 3 }] });
  run(s, 20);
  assert.ok(s.delivered.chatarra >= 12, 'divisor entrega ' + s.delivered.chatarra);
  assert.ok(s.entities[key(x + 2, y + 1)].items.length > 0 || s.delivered.chatarra > 0, 'reparte por los lados');
  console.log('✓ divisor: entregadas', s.delivered.chatarra);
}

// 7) Ensambladora: 2 placas + 1 chatarra -> engranaje (y sin plátanos en el mapa)
{
  const s = createGame(42);
  assert.ok(Object.values(s.world.nodes).every((t) => t === 'chatarra'), 'solo chatarra en el mapa');
  own(s, 'ensambladora');
  const sp = s.ship;
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
  s.levels = { ...s.levels, cinta: level, extractor: level, prensa: level, ensambladora: level };
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
  shipAt(s, x0 + 10, y0);
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
  own(s, 'prensa');
  const x0 = s.world.spawn.x - 10, y0 = s.world.spawn.y + 8;
  for (let x = x0 - 1; x <= x0 + 12; x++) for (let y = y0 - 1; y <= y0; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  for (let i = 0; i < 2; i++) { s.world.nodes[key(x0 + i, y0 - 1)] = 'chatarra'; applyAction(s, { type: 'place', kind: 'extractor', x: x0 + i, y: y0 - 1, dir: 1 }); }
  const cells = []; for (let i = 0; i < 6; i++) cells.push({ x: x0 + i, y: y0, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  applyAction(s, { type: 'place', kind: 'prensa', x: x0 + 6, y: y0, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: x0 + 7, y: y0, dir: 0 }, { x: x0 + 8, y: y0, dir: 0 }] });
  shipAt(s, x0 + 9, y0);
  run(s, 20); const b = s.delivered.placa || 0; run(s, 40);
  const rate = ((s.delivered.placa || 0) - b) / 40;
  assert.ok(Math.abs(rate - 2.5) < 0.15, 'prensa da ' + rate);
  console.log('✓ prensa con cinta llena:', rate.toFixed(2), 'placas/s');
}

// 10) Una partida guardada en versiones anteriores se pone al día (nave fija, dinero)
{
  const old = { version: 2, seed: 3, tick: 10, nextId: 4, unlocked: ['cinta', 'extractor', 'teletransportador', 'prensa'], orderIndex: 2, orderProgress: 5, delivered: {}, rev: 4,
    levels: { cinta: 1, extractor: 2, prensa: 1, ensambladora: 1 },
    entities: {
      '1,1': { id: 2, kind: 'cinta', x: 1, y: 1, dir: 0, item: { type: 'chatarra', p: 0.3, from: 2 } },
      '9,9': { id: 3, kind: 'teletransportador', x: 9, y: 9, dir: 0 },
    } };
  const st = deserialize(JSON.stringify(old));
  assert.equal(st.version, 5);
  assert.equal(st.planet, 0);
  assert.equal(st.entities['1,1'].items.length, 1);
  assert.equal(st.entities['9,9'], undefined, 'el teletransportador viejo desaparece');
  assert.ok(st.ship && isShip(st, st.ship.x + 1, st.ship.y + 1), 'tiene nave');
  assert.equal(st.levels.extractor, 2, 'conserva las mejoras');
  assert.ok(st.unlocked.includes('prensa') && !st.unlocked.includes('teletransportador'));
  assert.ok(st.money > 0, 'un detalle por las molestias');
  // una del planeta 2 con las máquinas que cambiaron de nombre
  const p2 = { version: 4, seed: 8, planet: 1, planetDone: false, tick: 0, nextId: 5, orderIndex: 3, orderProgress: 2, delivered: {}, rev: 1,
    unlocked: ['cinta', 'extractor', 'teletransportador', 'prensa', 'horno', 'taller', 'montadora'],
    levels: { cinta: 2, extractor: 1, prensa: 1, ensambladora: 1, horno: 1, taller: 1, montadora: 1 },
    entities: {
      '2,2': { id: 2, kind: 'taller', x: 2, y: 2, dir: 0, inv: {}, out: [], timer: 0, busy: false },
      '3,2': { id: 3, kind: 'montadora', x: 3, y: 2, dir: 0, inv: {}, out: [], timer: 0, busy: false },
    } };
  const st2 = deserialize(JSON.stringify(p2));
  assert.equal(st2.entities['2,2'].kind, 'cristaleria');
  assert.equal(st2.entities['3,2'].kind, 'montasolar');
  assert.ok(st2.unlocked.includes('montasolar') && !st2.unlocked.includes('montadora'));
  assert.equal(st2.levels.cinta, 2);
  console.log('✓ migración de guardado hasta v5');
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
  own(s, 'prensa', 'ensambladora');
  const X = 6, Y = 6;
  for (let x = X - 1; x <= X + 3; x++) { delete s.world.nodes[key(x, Y)]; delete s.entities[key(x, Y)]; }
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: [{ x: X, y: Y, dir: 0 }, { x: X + 1, y: Y, dir: 0 }] });
  assert.ok(applyAction(s, { type: 'place', kind: 'prensa', x: X + 1, y: Y, dir: 0 }).ok);
  assert.equal(s.entities[key(X + 1, Y)].kind, 'prensa');
  assert.equal(applyAction(s, { type: 'place', kind: 'ensambladora', x: X + 1, y: Y, dir: 0 }).ok, false);
  console.log('✓ máquina sustituye cinta');
}

// 13) Planetas: al acabar la tanda se puede despegar, y el mapa nuevo trae cristal
{
  const s = createGame(2024);
  const orders = PLANETS[0].orders;
  s.orderIndex = orders.length - 1;
  s.orderProgress = orders[orders.length - 1].amount - 1;
  assert.equal(applyAction(s, { type: 'nextPlanet' }).ok, false, 'no se despega antes de tiempo');
  const item = orders[orders.length - 1].item;
  own(s, 'prensa');
  s.levels.cinta = 2;
  const sp = s.ship;
  // metemos el objeto en una cinta que apunta a la nave
  delete s.entities[key(sp.x - 1, sp.y)];
  delete s.world.nodes[key(sp.x - 1, sp.y)];
  assert.ok(applyAction(s, { type: 'place', kind: 'cinta', x: sp.x - 1, y: sp.y, dir: 0 }).ok);
  s.entities[key(sp.x - 1, sp.y)].items.push({ type: item, p: 0.9, from: 2 });
  run(s, 1);
  assert.equal(s.planetDone, true, 'planeta completado');
  const money = s.money;
  const twin = deserialize(serialize(s));
  assert.ok(applyAction(s, { type: 'nextPlanet' }).ok, 'despega');
  assert.ok(applyAction(twin, { type: 'nextPlanet' }).ok);
  assert.equal(s.planet, 1);
  assert.equal(s.seed, twin.seed, 'la semilla del planeta nuevo es determinista');
  assert.equal(Object.keys(s.entities).length, 0, 'fábrica vacía');
  assert.ok(isShip(s, s.world.spawn.x, s.world.spawn.y), 'la nave aterriza en el planeta nuevo');
  assert.equal(s.orderIndex, 0);
  assert.equal(s.money, money, 'el dinero viaja contigo');
  assert.equal(s.levels.cinta, 2, 'las mejoras compradas también');
  assert.ok(s.unlocked.includes('prensa'), 'y lo comprado');
  const types = new Set(Object.values(s.world.nodes));
  assert.ok(types.has('cristal') && types.has('chatarra'), 'el planeta 2 tiene chatarra y cristal');
  const back = deserialize(serialize(s));
  assert.equal(JSON.stringify(back.world.nodes), JSON.stringify(s.world.nodes), 'al cargar se regenera el mismo mapa');
  console.log('✓ despegue al planeta 2 con mapa nuevo, cristal, dinero y mejoras');
}

// 14) Cadena del planeta 2: chatarra→placa, cristal→vidrio, taller→ventana, montadora→panel
{
  const s = createGame(5);
  own(s, 'prensa', 'ensambladora', 'horno', 'cristaleria', 'montasolar');
  // máquinas pegadas: cada una suelta directamente en la siguiente
  const X = 10, Y = 10;
  for (let x = X - 1; x <= X + 6; x++) for (let y = Y - 1; y <= Y + 3; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  const place = (kind, x, y, dir) => assert.ok(applyAction(s, { type: 'place', kind, x, y, dir }).ok, kind);
  place('cristaleria', X + 1, Y, 0);     // recibe placa (por arriba) y vidrio (por abajo)
  place('prensa', X + 1, Y - 1, 1);
  place('horno', X + 1, Y + 1, 3);
  place('montasolar', X + 2, Y, 0);      // recibe ventana (izquierda) y engranaje (abajo)
  place('ensambladora', X + 2, Y + 1, 3);
  shipAt(s, X + 3, Y);
  const feed = () => {
    s.entities[key(X + 1, Y - 1)].inv.chatarra = 10;
    s.entities[key(X + 1, Y + 1)].inv.cristal = 10;
    const ens = s.entities[key(X + 2, Y + 1)].inv; ens.placa = 10; ens.chatarra = 10;
  };
  for (let i = 0; i < 20 * TICK_RATE; i++) { if (i % 10 === 0) feed(); step(s); }
  assert.ok((s.delivered.panel || 0) >= 15, 'paneles: ' + s.delivered.panel);
  console.log('✓ cadena del planeta 2: entregados', s.delivered.panel, 'paneles solares');
}

// 15) Comprar y mejorar con dinero (acciones serializables)
{
  const s = createGame(31);
  assert.equal(applyAction(s, { type: 'buy', kind: 'prensa' }).ok, false, 'sin dinero no hay prensa');
  s.money = BUILDINGS.prensa.price;
  assert.ok(applyAction(s, { type: 'buy', kind: 'prensa' }).ok);
  assert.equal(s.money, 0);
  assert.ok(s.unlocked.includes('prensa'));
  assert.equal(applyAction(s, { type: 'buy', kind: 'prensa' }).ok, false, 'no se compra dos veces');
  assert.equal(applyAction(s, { type: 'buy', kind: 'horno' }).ok, false, 'el horno no se vende en el planeta 1');
  s.money = upgradeCost('cinta', 2) + upgradeCost('cinta', 3);
  assert.ok(applyAction(s, { type: 'upgrade', kind: 'cinta' }).ok);
  assert.ok(applyAction(s, { type: 'upgrade', kind: 'cinta' }).ok);
  assert.equal(s.levels.cinta, 3);
  assert.equal(s.money, 0);
  s.money = 1e6;
  assert.equal(applyAction(s, { type: 'upgrade', kind: 'cinta' }).ok, false, 'nivel 3 es el máximo');
  assert.equal(applyAction(s, { type: 'upgrade', kind: 'robotica' }).ok, false, 'no se mejora lo que no tienes');
  console.log('✓ tienda: comprar máquinas y mejoras');
}

// 16) La nave: no se construye encima, recibe por sus 8 bocas, y no se puede quitar
{
  const s = createGame(77);
  const { x, y } = s.ship;
  assert.equal(applyAction(s, { type: 'place', kind: 'cinta', x: x + 1, y: y + 1, dir: 0 }).ok, false, 'no se construye en la nave');
  assert.equal(applyAction(s, { type: 'remove', cells: [{ x, y }] }).ok, false, 'la nave no se quita');
  // una cinta por cada boca, con un objeto a punto de entrar
  const mouths = [];
  for (const t of [0, 1]) {
    mouths.push([x - 1, y + t, 0], [x + 2, y + t, 2], [x + t, y - 1, 1], [x + t, y + 2, 3]);
  }
  for (const [bx, by, d] of mouths) {
    delete s.world.nodes[key(bx, by)];
    assert.ok(applyAction(s, { type: 'place', kind: 'cinta', x: bx, y: by, dir: d }).ok, `cinta en ${bx},${by}`);
    s.entities[key(bx, by)].items.push({ type: 'chatarra', p: 0.95, from: (d + 2) % 4 });
  }
  run(s, 0.5);
  assert.equal(s.delivered.chatarra, 8, 'entran por las 8 bocas');
  console.log('✓ nave fija de 2×2 con 8 entradas');
}

// 16b) Solo se paga lo que pide el pedido
{
  const s = createGame(78);
  const { x, y } = s.ship;
  delete s.world.nodes[key(x - 1, y)];
  applyAction(s, { type: 'place', kind: 'cinta', x: x - 1, y, dir: 0 });
  assert.equal(currentOrder(s).item, 'chatarra');
  s.entities[key(x - 1, y)].items.push({ type: 'placa', p: 0.95, from: 2 });
  run(s, 0.3);
  assert.equal(s.delivered.placa, 1, 'la nave lo acepta');
  assert.equal(s.money, 0, 'pero no lo paga');
  assert.equal(s.orderProgress, 0, 'ni cuenta para el pedido');
  s.entities[key(x - 1, y)].items.push({ type: 'chatarra', p: 0.95, from: 2 });
  run(s, 0.3);
  assert.equal(s.money, ITEMS.chatarra.value, 'lo del pedido sí se paga');
  console.log('✓ solo se paga lo del pedido');
}

// 17) Cadena larga del planeta 1: chatarra → alambre/placa → muelle/tornillos/engranaje → mecanismo → motor; + carcasa → robot
{
  const s = createGame(9);
  own(s, 'trefiladora', 'bobinadora', 'cortadora', 'ensambladora', 'montadora', 'soldadora', 'motorera', 'robotica', 'prensa');
  const X = 20, Y = 20;
  for (let x = X - 2; x <= X + 6; x++) for (let y = Y - 3; y <= Y + 3; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  const place = (kind, x, y, dir) => assert.ok(applyAction(s, { type: 'place', kind, x, y, dir }).ok, kind);
  // robótica en (X+2,Y) suelta en la nave; recibe motor (izquierda) y carcasa (abajo)
  place('robotica', X + 2, Y, 0);
  place('motorera', X + 1, Y, 0);        // recibe mecanismo (arriba) y muelle (izquierda)
  place('montadora', X + 1, Y - 1, 1);
  place('bobinadora', X, Y, 0);
  place('soldadora', X + 2, Y + 1, 3);
  shipAt(s, X + 3, Y);
  const feed = () => {
    s.entities[key(X + 1, Y - 1)].inv = { engranaje: 10, tornillos: 10 };
    s.entities[key(X, Y)].inv = { alambre: 10 };
    s.entities[key(X + 2, Y + 1)].inv = { placa: 10, alambre: 10 };
  };
  for (let i = 0; i < 20 * TICK_RATE; i++) { if (i % 10 === 0) feed(); step(s); }
  // a nivel 1 la motorera saca 0,625 motores/s → unos 12 robots en 20 s
  assert.ok((s.delivered.robot || 0) >= 10, 'robots: ' + s.delivered.robot);
  console.log('✓ cadena larga del planeta 1: entregados', s.delivered.robot, 'robots de limpieza');
}

// 18) Ritmos cuadrados de las máquinas nuevas (nivel 1)
{
  const per = (k) => 1 / BUILDINGS[k].recipe.time;
  const inRate = (k, t) => BUILDINGS[k].recipe.in[t] * per(k);
  const belt = beltRate(1);
  assert.equal(inRate('trefiladora', 'chatarra'), belt, 'una cinta llena alimenta una trefiladora');
  assert.equal(inRate('cortadora', 'placa'), per('prensa'), 'una prensa alimenta una cortadora');
  assert.equal(inRate('bobinadora', 'alambre'), per('trefiladora'), 'una trefiladora alimenta una bobinadora');
  assert.equal(inRate('montadora', 'engranaje'), per('ensambladora'), 'una ensambladora alimenta una montadora');
  assert.equal(inRate('robotica', 'motor'), per('motorera'), 'una motorera alimenta una línea de robots');
  assert.equal(inRate('motorera', 'mecanismo') * 2, per('montadora'), 'una montadora alimenta dos motoreras');
  assert.equal(LEVEL_MULT[3], 2);
  console.log('✓ ritmos cuadrados de la cadena larga');
}

// 19) Los precios siguen la cadena: nunca hace falta algo que aún no se puede pagar
{
  const orders = PLANETS[0].orders;
  // qué máquina hace falta para cada objeto
  const maker = {};
  for (const [k, b] of Object.entries(BUILDINGS)) if (b.recipe) maker[b.recipe.out] = k;
  const needs = (item, acc = new Set()) => {
    const m = maker[item];
    if (!m) return acc;
    acc.add(m);
    for (const t in BUILDINGS[m].recipe.in) needs(t, acc);
    return acc;
  };
  // ganando solo con los pedidos (sin contar el pago por pieza), ¿llega para lo que se pide?
  let earned = 0;
  const bought = new Set();
  for (const o of orders) {
    for (const m of needs(o.item)) if (!bought.has(m)) { earned -= BUILDINGS[m].price; bought.add(m); }
    // las piezas entregadas también pagan
    earned += o.amount * ITEMS[o.item].value;
    assert.ok(earned >= 0, `al llegar al pedido de ${o.item} faltan ${-earned} créditos`);
    earned += o.pay;
  }
  console.log('✓ la economía del planeta 1 nunca se atasca (sobran', earned, 'créditos)');
}

// 20) Pedido de rescate: te gastas el dinero en el divisor y no te llega para la prensa
{
  const s = createGame(55);
  s.orderIndex = 1;                       // pedido 2: placas
  s.money = 20;
  own(s, 'divisor');                      // ...porque compraste el divisor
  assert.ok(isStuck(s), 'atascado: sin prensa y sin dinero');
  run(s, 1.1);
  const r = s.rescue;
  assert.ok(r, 'Chatarrex abre un rescate');
  assert.equal(r.item, 'chatarra', 'con lo que tienes solo puedes mandar chatarra');
  assert.ok(r.rate > beltRate(1), 'pide más de lo que lleva una cinta: hay que montar varias líneas');
  assert.ok(20 + r.pay >= BUILDINGS.prensa.price, 'paga lo justo para la prensa');
  const { x, y } = s.ship;
  // a ritmo flojo (una sola cinta) no se cumple
  for (let i = 0; i < 25 * TICK_RATE; i++) { if (i % 6 === 0) tryInsert(s, x, y, 'chatarra', 0); step(s); }
  assert.ok(s.rescue, 'una cinta sola no llega');
  assert.equal(s.money, 20, 'y la chatarra suelta no se paga');
  // a buen ritmo, sí
  for (let i = 0; i < 25 * TICK_RATE && s.rescue; i++) { if (i % 3 === 0) tryInsert(s, x, y, 'chatarra', 0); step(s); }
  assert.equal(s.rescue, null, 'rescate cumplido');
  assert.ok(s.money >= BUILDINGS.prensa.price);
  assert.ok(applyAction(s, { type: 'buy', kind: 'prensa' }).ok, 'ya puedes comprar la prensa');
  run(s, 1.1);
  assert.equal(s.rescue, null, 'y no vuelve a saltar');
  console.log('✓ pedido de rescate: chatarra a', r.rate, '/s, paga', r.pay);
}

// 21) El rescate usa lo más valioso que ya sabes fabricar
{
  const s = createGame(56);
  own(s, 'prensa', 'ensambladora', 'divisor');
  s.orderIndex = 4;                       // pedido 5: alambre (falta la trefiladora)
  s.money = 0;
  run(s, 1.1);
  assert.equal(s.rescue.item, 'engranaje', 'pide engranajes, que es lo mejor que tienes');
  assert.ok(Math.abs(s.rescue.rate - 2.5) < 1e-9, 'dos ensambladoras: 2,5 engranajes/s');
  assert.equal(rescueCount(s), 0);
  const twin = deserialize(serialize(s));
  assert.deepEqual(twin.rescue, s.rescue, 'el rescate se guarda con la partida');
  console.log('✓ rescate con engranajes a 2,5/s');
}

// 22) Deshacer: cada acción de construcción devuelve otra acción plana que la revierte
{
  const s = createGame(61);
  own(s, 'prensa');
  const X = 8, Y = 8;
  for (let x = X - 1; x <= X + 5; x++) for (let y = Y - 1; y <= Y + 3; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  const cells = [0, 1, 2, 3].map((i) => ({ x: X + i, y: Y, dir: 0 }));
  const a = applyAction(s, { type: 'placeMany', kind: 'cinta', cells });
  assert.ok(a.undo && a.undo.type === 'setCells');
  // máquina encima de una cinta, y deshacer: vuelve la cinta
  const b = applyAction(s, { type: 'place', kind: 'prensa', x: X + 1, y: Y, dir: 0 });
  assert.equal(s.entities[key(X + 1, Y)].kind, 'prensa');
  applyAction(s, JSON.parse(JSON.stringify(b.undo)));   // viaja como JSON, igual que por la red
  assert.equal(s.entities[key(X + 1, Y)].kind, 'cinta', 'vuelve la cinta');
  // girar y deshacer
  const c = applyAction(s, { type: 'rotate', x: X + 2, y: Y });
  assert.equal(s.entities[key(X + 2, Y)].dir, 1);
  applyAction(s, c.undo);
  assert.equal(s.entities[key(X + 2, Y)].dir, 0);
  // borrar un área y deshacer: vuelve todo
  const area = [];
  for (let x = X - 1; x <= X + 4; x++) for (let y = Y - 1; y <= Y + 1; y++) area.push({ x, y });
  const d = applyAction(s, { type: 'remove', cells: area });
  assert.equal(Object.keys(s.entities).length, 0);
  applyAction(s, d.undo);
  assert.equal(Object.keys(s.entities).length, 4, 'las 4 cintas vuelven');
  // y deshacer la primera colocación las quita
  applyAction(s, a.undo);
  assert.equal(Object.keys(s.entities).length, 0);
  assert.equal(applyAction(s, { type: 'buy', kind: 'divisor' }).undo, undefined, 'las compras no se deshacen');
  console.log('✓ deshacer: colocar, sustituir, girar y borrar por área');
}

// 23) Puente: dos líneas que se cruzan sin mezclarse; y trazar una cinta encima pone el puente solo
{
  const s = createGame(70);
  own(s, 'puente');
  const X = 20, Y = 20;
  for (let x = X - 4; x <= X + 6; x++) for (let y = Y - 4; y <= Y + 6; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  // línea horizontal de chatarra hacia la derecha
  s.world.nodes[key(X - 3, Y)] = 'chatarra';
  applyAction(s, { type: 'place', kind: 'extractor', x: X - 3, y: Y, dir: 0 });
  const h = []; for (let x = X - 2; x <= X + 3; x++) h.push({ x, y: Y, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: h });
  // línea vertical hacia abajo que la cruza en (X, Y): se pone el puente solo
  const v = []; for (let y = Y - 2; y <= Y + 3; y++) v.push({ x: X, y, dir: 1 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: v });
  assert.equal(s.entities[key(X, Y)].kind, 'puente', 'puente automático en el cruce');
  assert.equal(s.entities[key(X + 1, Y)].dir, 0, 'la cinta horizontal sigue igual');
  // la horizontal acaba en la nave; por la vertical metemos placas a mano y las recogemos al final
  s.ship = { x: X + 4, y: Y - 1 };
  const outV = [];
  delete s.entities[key(X, Y + 3)];
  for (let i = 0; i < 20 * TICK_RATE; i++) {
    if (i % 12 === 0) tryInsert(s, X, Y - 2, 'placa', 1);
    const e = s.entities[key(X, Y + 2)];
    if (e && e.items.length && e.items[0].p >= 1 - 1e-6) outV.push(e.items.shift().type);
    step(s);
  }
  assert.ok((s.delivered.chatarra || 0) > 20, 'la chatarra cruza por debajo: ' + s.delivered.chatarra);
  assert.ok(outV.length > 20 && outV.every((t) => t === 'placa'), 'las placas cruzan por encima sin mezclarse: ' + outV.length);
  assert.ok(!s.delivered.placa, 'ninguna placa se cuela en la línea de chatarra');
  console.log('✓ puente: cruzan', s.delivered.chatarra, 'chatarra por debajo y', outV.length, 'placas por encima');
}

// 24) Una cinta cruza varias cintas seguidas: puentes encadenados
{
  const s = createGame(71);
  own(s, 'puente');
  const X = 20, Y = 20;
  for (let x = X - 4; x <= X + 8; x++) for (let y = Y - 4; y <= Y + 6; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
  // tres cintas verticales paralelas, una al lado de otra
  for (const x of [X, X + 1, X + 2]) {
    const v = []; for (let y = Y - 3; y <= Y + 3; y++) v.push({ x, y, dir: 1 });
    applyAction(s, { type: 'placeMany', kind: 'cinta', cells: v });
  }
  // una horizontal que las atraviesa las tres
  s.world.nodes[key(X - 3, Y)] = 'chatarra';
  applyAction(s, { type: 'place', kind: 'extractor', x: X - 3, y: Y, dir: 0 });
  const h = []; for (let x = X - 2; x <= X + 4; x++) h.push({ x, y: Y, dir: 0 });
  applyAction(s, { type: 'placeMany', kind: 'cinta', cells: h });
  for (const x of [X, X + 1, X + 2]) assert.equal(s.entities[key(x, Y)].kind, 'puente', 'puente en ' + x);
  assert.equal(beltShape(s, s.entities[key(X + 3, Y)]), 'straight', 'la cinta de después del último puente va recta');
  s.ship = { x: X + 5, y: Y - 1 };
  run(s, 20);
  assert.ok((s.delivered.chatarra || 0) > 30, 'cruza tres cintas seguidas: ' + s.delivered.chatarra);
  console.log('✓ puentes encadenados: cruza 3 cintas y entrega', s.delivered.chatarra);
}

// 25) Todos los planetas: cada pedido se puede fabricar allí, con máquinas a la venta,
// y ganando solo con los pedidos de ESE planeta (empezando sin un crédito) nunca falta dinero
{
  const raw = (item, acc = new Set()) => {
    if (Object.values(NODES).some((n) => n.item === item)) { acc.add(item); return acc; }
    const m = Object.keys(BUILDINGS).find((k) => BUILDINGS[k].recipe?.out === item);
    for (const t in BUILDINGS[m].recipe.in) raw(t, acc);
    return acc;
  };
  const owned = new Set(['cinta', 'extractor']);
  PLANETS.forEach((pl, p) => {
    let money = 0;
    for (const o of pl.orders) {
      for (const r of raw(o.item)) assert.ok(pl.resources.includes(r), `planeta ${p + 1}: ${o.item} necesita ${r}, que no hay`);
      for (const m of machinesFor(o.item)) {
        assert.ok(shopAt(p).includes(m), `planeta ${p + 1}: ${m} no se vende`);
        if (!owned.has(m)) { money -= BUILDINGS[m].price; owned.add(m); }
      }
      assert.ok(money >= 0, `planeta ${p + 1}: al pedido de ${o.item} le faltan ${-money} ₡`);
      money += o.amount * ITEMS[o.item].value + o.pay;
    }
    // las máquinas nuevas del planeta se usan en algún pedido
    for (const m of pl.shop) if (BUILDINGS[m].recipe) assert.ok(owned.has(m), `planeta ${p + 1}: ${m} no la pide ningún pedido`);
  });
  console.log('✓ los', PLANETS.length, 'planetas: pedidos fabricables y economía sin atascos');
}

// 26) Las cadenas nuevas producen (cada máquina final, alimentada a mano, saca su producto)
{
  for (const k of ['patinetera', 'consolera', 'dronera', 'androidera', 'aerodeslizadores', 'criogenia']) {
    const s = createGame(80);
    own(s, k);
    const X = 12, Y = 12;
    for (let x = X - 1; x <= X + 3; x++) for (let y = Y - 1; y <= Y + 2; y++) { delete s.world.nodes[key(x, y)]; delete s.entities[key(x, y)]; }
    assert.ok(applyAction(s, { type: 'place', kind: k, x: X, y: Y, dir: 0 }).ok, k);
    shipAt(s, X + 1, Y);
    const r = BUILDINGS[k].recipe;
    for (let i = 0; i < 10 * TICK_RATE; i++) { if (i % 10 === 0) s.entities[key(X, Y)].inv = Object.fromEntries(Object.keys(r.in).map((t) => [t, 10])); step(s); }
    const got = s.delivered[r.out] || 0;
    assert.ok(got >= 5, `${k} saca ${r.out}: ${got}`);
  }
  console.log('✓ las 6 máquinas finales nuevas producen');
}

// 27) Viaje completo: del planeta 1 al 8, cada salto trae su recurso nuevo
{
  const s = createGame(90);
  for (let p = 0; p < PLANETS.length - 1; p++) {
    s.planetDone = true;
    assert.ok(applyAction(s, { type: 'nextPlanet' }).ok, 'despega al ' + (p + 2));
    const types = new Set(Object.values(s.world.nodes));
    const nuevo = PLANETS[p + 1].resources.at(-1);
    assert.ok(types.has(nuevo), `planeta ${p + 2} tiene ${nuevo}`);
  }
  assert.equal(s.planet, PLANETS.length - 1);
  console.log('✓ viaje del planeta 1 al', PLANETS.length, 'con un recurso nuevo en cada uno');
}

console.log('Todo OK');
