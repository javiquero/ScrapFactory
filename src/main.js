// Arranque: une estado, simulación, pintado, gestos e interfaz.

import { Application } from '../vendor/pixi.min.mjs';
import { DT, BUILDINGS, ITEMS } from './defs.js';
import { createGame, applyAction, serialize, deserialize, currentOrder, isShip } from './state.js';
import { step } from './sim.js';
import { makeTextures } from './textures.js';
import { Renderer } from './render.js';
import { attachInput } from './input.js';
import { UI } from './ui.js';
import { key } from './world.js';
import * as msg from './messages.js';
import { Tutorial } from './tutorial.js';
import { sfx } from './audio.js';

const SAVE_KEY = 'scrapfactory.save.v2';
const CAM_KEY = 'scrapfactory.cam.v1';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: no pasa nada */ } },
};

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#8cc56a',
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  document.getElementById('game').appendChild(app.canvas);

  // El arte en PNG (sprites/art.js) está desactivado: Javi prefiere el dibujo por código
  const textures = makeTextures(app.renderer);
  const icons = {};
  const iconKeys = { cinta: 'belt0', ...Object.fromEntries(Object.keys(BUILDINGS).filter((k) => k !== 'cinta').map((k) => [k, k])) };
  for (const t of Object.keys(ITEMS)) iconKeys['item_' + t] = 'item_' + t;
  iconKeys.nave = 'nave';
  await Promise.all(Object.entries(iconKeys).map(async ([name, tk]) => {
    try { icons[name] = await app.renderer.extract.base64(textures[tk]); } catch { icons[name] = ''; }
  }));

  // ---- Partida ----
  let state = null;
  let isNew = false;
  const saved = store.get(SAVE_KEY);
  let restarted = false;
  if (saved) {
    try { state = deserialize(saved); } catch (err) { console.warn('Guardado no válido, empezamos de cero', err); restarted = true; }
  }
  if (!state) { state = createGame(); isNew = true; }

  const ctl = { tool: 'mano', dir: 0, recent: ['extractor', 'prensa', 'ensambladora', 'divisor', 'trefiladora', 'cortadora'] };
  const renderer = new Renderer(app, textures);
  renderer.setState(state);

  const cam = (() => { try { return JSON.parse(store.get(CAM_KEY)); } catch { return null; } })();
  const defaultZoom = Math.min(app.screen.width, app.screen.height) < 600 ? 0.6 : 0.9;
  if (cam && !isNew) renderer.centerOn(cam.x, cam.y, cam.zoom);
  else renderer.centerOn(state.ship.x + 0.5, state.ship.y + 0.5, defaultZoom);

  // Único punto por el que cambia la partida. En multijugador, aquí se enviará
  // la acción al servidor y se aplicarán también las que lleguen de los demás.
  const undoStack = [];
  let lastAction = performance.now();
  const SOUND = { place: 'place', placeMany: 'place', placeBlueprint: 'place', remove: 'remove', rotate: 'rotate', setOutputs: 'tap', nextPlanet: 'launch' };
  function dispatch(action, explain = false) {
    const res = applyAction(state, action);
    lastAction = performance.now();
    if (!res.ok && explain) { ui.hint(res.reason); sfx.play('error'); }
    if (res.ok) sfx.play(action.kind === 'cinta' ? 'belt' : SOUND[action.type] || 'tap');
    if (res.ok) ui.refreshInspect(state);
    if (res.ok && res.undo) {
      undoStack.push(res.undo);
      if (undoStack.length > 50) undoStack.shift();
      ui.setUndo(true);
    }
    if (res.ok && action.type === 'rotate' && tut) tut.flags.rotated = true;
    return res;
  }
  function undo() {
    const a = undoStack.pop();
    ui.setUndo(undoStack.length > 0);
    if (!a) return;
    applyAction(state, a);
    sfx.play('undo');
    ui.hideInspect();
    renderer.setSelected(null);
    ui.hint('Deshecho');
  }
  function clearUndo() { undoStack.length = 0; ui.setUndo(false); }
  let tut = null;

  function selectTool(tool, fromPanel = false) {
    ctl.tool = tool;
    renderer.setBuildMode(tool !== 'mano');
    if (BUILDINGS[tool] && tool !== 'cinta') {
      ctl.recent = [tool, ...ctl.recent.filter((k) => k !== tool)];
    }
    ui.hideInspect();
    renderer.setSelected(null);
    ui.renderBar(state);
    if (fromPanel || tool !== 'mano') {
      const tips = {
        cinta: 'Arrastra para trazar la cinta',
        extractor: 'Tócalo encima de un recurso',
        borrar: 'Toca o arrastra para quitar',
        copiar: 'Arrastra para marcar el trozo que quieres copiar',
        pegar: 'Toca donde quieras pegarlo (esquina de arriba a la izquierda)',
      };
      if (tips[tool]) ui.hint(tips[tool]);
    }
  }

  const ui = new UI({
    icons,
    ctl,
    onSelectTool: selectTool,
    onUndo: undo,
    onToggleOut: (i) => {
      const e = ui.inspected;
      if (!e || e.kind !== 'divisor') return;
      const outs = [...(e.outs || [true, true, true])];
      outs[i] = !outs[i];
      dispatch({ type: 'setOutputs', x: e.x, y: e.y, outs }, true);
      ui.renderOuts(e);
    },
    onTutorial: (what) => {
      if (what === 'again') { tut.start(); tut.flags.panned = 0; panBase = renderer.panned || 0; ui.renderBar(state); }
      else { tut.stop(); ui.renderBar(state); }
    },
    onInspectRotate: () => {
      const e = ui.inspected;
      if (e) dispatch({ type: 'rotate', x: e.x, y: e.y }, true);
    },
    onInspectRemove: () => {
      const e = ui.inspected;
      if (!e) return;
      dispatch({ type: 'remove', cells: [{ x: e.x, y: e.y }] }, true);
      if (!state.entities[key(e.x, e.y)]) { ui.hideInspect(); renderer.setSelected(null); }
      flushEvents();
    },
    onReset: () => {
      state = createGame();
      renderer.setState(state);
      renderer.centerOn(state.ship.x + 0.5, state.ship.y + 0.5, defaultZoom);
      ctl.tool = 'mano';
      ctl.dir = 0;
      ui.hideInspect();
      ui.renderBar(state);
      ui.renderOrder(state, true);
      ui.clearMemos();
      clearUndo();
      tut.start(); panBase = renderer.panned || 0;
      ui.renderBar(state);
      welcome();
      save();
    },
    onLaunch: () => {
      if (!confirm(`¿Despegar al planeta ${state.planet + 2}? La fábrica de este planeta se queda aquí: empiezas de cero con un recurso nuevo.`)) return;
      dispatch({ type: 'nextPlanet' }, true);
      flushEvents();
      save();
    },
  });

  attachInput(app.canvas, {
    renderer,
    getState: () => state,
    ctl,
    dispatch,
    onTapEntity: (tile) => {
      if (isShip(state, tile.x, tile.y)) { ui.showShip(state); renderer.setSelected(null); return; }
      const e = state.entities[key(tile.x, tile.y)];
      if (!e) return;
      dispatch({ type: 'rotate', x: tile.x, y: tile.y });
      if (ui.inspected === e) renderer.setSelected(tile);
    },
    onTapEmpty: () => { ui.hideInspect(); renderer.setSelected(null); },
    onBuildDone: () => selectTool('mano'),
    onCopy: (cells) => {
      // guarda lo que hay en el rectángulo, con posiciones relativas a su esquina
      const x0 = Math.min(...cells.map((c) => c.x)), y0 = Math.min(...cells.map((c) => c.y));
      const items = [];
      for (const c of cells) {
        const e = state.entities[key(c.x, c.y)];
        if (!e) continue;
        const it = { dx: c.x - x0, dy: c.y - y0, kind: e.kind, dir: e.dir };
        if (e.outs) it.outs = [...e.outs];
        items.push(it);
      }
      if (!items.length) { ui.hint('Ahí no hay nada que copiar'); selectTool('mano'); return; }
      ctl.blueprint = items;
      selectTool('pegar');
      ui.hint(`Copiado: ${items.length} piezas. Toca donde quieras pegarlas`);
    },
    onLongPress: (tile) => {
      if (isShip(state, tile.x, tile.y)) { ui.showShip(state); return; }
      const e = state.entities[key(tile.x, tile.y)];
      if (!e) return;
      // Copiar: se coge ese mismo edificio, con su orientación; el siguiente toque pone otro igual
      if (state.unlocked.includes(e.kind)) {
        selectTool(e.kind);
        ctl.dir = e.dir;
        ui.renderBar(state);
        ui.hint(`Copiado: ${BUILDINGS[e.kind].name.toLowerCase()}. Toca donde quieras otra copia`);
      }
      ui.showInspect(e, state);
      renderer.setSelected(tile);
    },
  });

  window.addEventListener('keydown', (ev) => {
    if ((ev.key === 'z' || ev.key === 'Z') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); undo(); return; }
    if (ev.key === 'r' || ev.key === 'R') { ctl.dir = (ctl.dir + 1) % 4; ui.renderBar(state); }
    if (ev.key === 'Escape') { selectTool('mano'); ui.closePanel(); }
  });

  // ---- Mensajes ----
  function welcome() {
    const opts = [msg.WELCOME[0], ...msg.WELCOME_ALT];
    ui.memo(opts[Math.floor(Math.random() * opts.length)]);
    ui.memo(msg.orderIntro(currentOrder(state)));
  }
  let lastWrong = -1e9;
  const arrivals = {}; // para las estadísticas: cuándo llegó cada cosa a la nave
  function flushEvents() {
    if (!state.events.length) return;
    for (const ev of state.events) {
      if (ev.type === 'orderDone') {
        ui.memo(msg.orderDoneMessage(ev.unlocks));
        sfx.play(ev.unlocks.length ? 'unlock' : 'order');
        for (const k of ev.unlocks) ctl.recent = [k, ...ctl.recent.filter((r) => r !== k)];
        if (!state.planetDone) ui.memo(msg.orderIntro(currentOrder(state)));
        ui.renderOrder(state, true);
        ui.renderBar(state);
      } else if (ev.type === 'planetDone') {
        ui.memo(msg.planetDoneMessage(state));
        ui.renderOrder(state, true);
      } else if (ev.type === 'planetStart') {
        // mapa nuevo: se repinta el planeta entero y la cámara vuelve a la nave
        renderer.setState(state);
        renderer.centerOn(state.ship.x + 0.5, state.ship.y + 0.5, defaultZoom);
        ui.hideInspect();
        ui.renderBar(state);
        ui.renderOrder(state, true);
        ui.clearMemos();
        clearUndo();
        for (const m of msg.planetIntro(state)) ui.memo(m);
        ui.memo(msg.orderIntro(currentOrder(state)));
      } else if (ev.type === 'tooSlow') {
        ui.memo(msg.tooSlowMessage(ev.rate));
        sfx.play('slow');
      } else if (ev.type === 'delivered') {
        sfx.play('deliver');
        (arrivals[ev.item] || (arrivals[ev.item] = [])).push(performance.now());
      } else if (ev.type === 'firstBelt') {
        ui.memo(msg.FIRST_BELT);
      }
    }
    state.events.length = 0;
  }
  // ---- Pantalla principal ----
  // La partida está en pausa detrás hasta que se pulsa Continuar o Partida nueva.
  let paused = true;
  let panBase = renderer.panned || 0;
  tut = new Tutorial({ ui, store });
  const $ = (id) => document.getElementById(id);
  const hasSave = !isNew;
  if (hasSave) {
    $('title').classList.add('has-save');
    $('continueBtn').hidden = false;
    $('titleSave').hidden = false;
    $('titleSave').textContent = `Planeta ${state.planet + 1} · pedido ${state.orderIndex + 1} · ${Object.keys(state.entities).length} piezas montadas`;
  }
  const soundLabel = () => {
    $('titleSound').textContent = sfx.muted ? 'Sonido: apagado' : 'Sonido: encendido';
    $('soundBtn').textContent = sfx.muted ? '🔇' : '🔊';
  };
  soundLabel();
  const toggleSound = () => { sfx.setMuted(!sfx.muted); soundLabel(); sfx.play('tap'); };
  $('titleSound').addEventListener('click', () => { sfx.unlock(); toggleSound(); });
  $('soundBtn').addEventListener('click', toggleSound);
  $('statsBtn').addEventListener('click', () => { sfx.play('tap'); ui.statsOpen ? ui.closeStats() : ui.openStats(state, arrivals); });
  $('statsClose').addEventListener('click', () => ui.closeStats());
  function start(fresh) {
    sfx.unlock();
    sfx.setAmbient(true);
    sfx.play('tap');
    $('title').hidden = true;
    paused = false;
    lastAction = performance.now();
    if (fresh) {
      tut.start(); panBase = renderer.panned || 0;
      ui.renderBar(state);
      welcome();
    } else {
      tut.render();
      ui.memo('Bienvenido de vuelta, colono. La fábrica no se ha movido. Los pedidos tampoco: siguen esperándote.');
    }
  }
  $('continueBtn').addEventListener('click', () => start(false));
  $('newBtn').addEventListener('click', () => {
    if (hasSave && !confirm('¿Empezar una partida nueva? Se pierde la fábrica guardada.')) return;
    $('title').classList.remove('has-save');
    if (hasSave) { state = createGame(); renderer.setState(state); renderer.centerOn(state.ship.x + 0.5, state.ship.y + 0.5, defaultZoom); clearUndo(); ui.renderOrder(state, true); save(); }
    start(true);
  });
  if (restarted) ui.memo('Chatarrex S.A. ha reestructurado la empresa: se acabaron los créditos. Ahora cada pedido cumplido te da maquinaria nueva. Tu fábrica antigua ha sido "reubicada". Empiezas de cero.');
  setInterval(() => { if (!paused && document.getElementById('memo').hidden) ui.memo(msg.randomTip()); }, 90000);
  // si lleva rato sin tocar nada, Chatarrex se interesa (con mucho cariño)
  setInterval(() => {
    if (paused || !document.getElementById('memo').hidden || performance.now() - lastAction < 180000) return;
    lastAction = performance.now();
    ui.memo(msg.IDLE[Math.floor(Math.random() * msg.IDLE.length)]);
  }, 20000);

  // ---- Guardado ----
  function save() {
    store.set(SAVE_KEY, serialize(state));
    store.set(CAM_KEY, JSON.stringify(renderer.cameraTile()));
  }
  setInterval(save, 4000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);

  // ---- Bucle ----
  ui.renderBar(state);
  ui.renderOrder(state);
  let acc = 0;
  let time = 0;
  let inspectTick = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(0.25, ticker.deltaMS / 1000);
    acc += dt;
    time += dt;
    if (paused) acc = 0;
    while (acc >= DT) { step(state); acc -= DT; }
    flushEvents();
    renderer.update(time, acc / DT);
    ui.renderOrder(state);
    if ((inspectTick = (inspectTick + 1) % 15) === 0) {
      ui.refreshInspect(state);
      ui.renderStats(state, arrivals);
      for (const k in arrivals) { const a = arrivals[k]; while (a.length && performance.now() - a[0] > 30000) a.shift(); }
      tut.flags.panned = (renderer.panned || 0) - panBase;
      if (tut.check(state)) ui.renderBar(state);
    }
  });

  window.addEventListener('resize', () => renderer.clamp());

  // Acceso para depurar desde la consola
  window.__sf = { get state() { return state; }, dispatch, renderer, selectTool, save };
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend',
    `<p style="position:fixed;inset:auto 16px 50% 16px;background:#fff;padding:16px;border-radius:12px;font-family:sans-serif">
      No se ha podido arrancar el juego en este navegador. Prueba con Chrome o Safari actualizados.</p>`);
});
