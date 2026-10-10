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
  if (saved) {
    try { state = deserialize(saved); } catch (err) { console.warn('Guardado no válido, empezamos de cero', err); }
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
  function dispatch(action, explain = false) {
    const res = applyAction(state, action);
    if (!res.ok && explain) ui.hint(res.reason);
    if (res.ok) ui.refreshInspect(state);
    return res;
  }

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
      };
      if (tips[tool]) ui.hint(tips[tool]);
    }
  }

  const ui = new UI({
    icons,
    ctl,
    onSelectTool: selectTool,
    onRotateTool: () => { ctl.dir = (ctl.dir + 1) % 4; ui.renderBar(state); },
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
      welcome();
      save();
    },
    onLaunch: () => {
      if (!confirm(`¿Despegar al planeta ${state.planet + 2}? La fábrica de este planeta se queda aquí: empiezas de cero con un recurso nuevo.`)) return;
      dispatch({ type: 'nextPlanet' }, true);
      flushEvents();
      save();
    },
    onBuy: (kind) => {
      if (!dispatch({ type: 'buy', kind }, true).ok) return;
      ctl.recent = [kind, ...ctl.recent.filter((k) => k !== kind)];
      flushEvents();
      ui.renderPanel(state);
      save();
    },
    onUpgrade: (kind) => {
      if (!dispatch({ type: 'upgrade', kind }, true).ok) return;
      flushEvents();
      ui.renderPanel(state);
      save();
    },
    getState: () => state,
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
    onLongPress: (tile) => {
      if (isShip(state, tile.x, tile.y)) { ui.showShip(state); return; }
      const e = state.entities[key(tile.x, tile.y)];
      if (e) { ui.showInspect(e, state); renderer.setSelected(tile); }
    },
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'r' || ev.key === 'R') { ctl.dir = (ctl.dir + 1) % 4; ui.renderBar(state); }
    if (ev.key === 'Escape') { selectTool('mano'); ui.closePanel(); }
  });

  // ---- Mensajes ----
  function welcome() {
    for (const m of msg.WELCOME) ui.memo(m);
    ui.memo(msg.orderIntro(currentOrder(state)));
    ui.memo(msg.TIPS[0]);
  }
  let lastWrong = -1e9;
  function flushEvents() {
    if (!state.events.length) return;
    for (const ev of state.events) {
      if (ev.type === 'orderDone') {
        ui.memo(msg.orderDoneMessage(ev.pay));
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
        for (const m of msg.planetIntro(state)) ui.memo(m);
        ui.memo(msg.orderIntro(currentOrder(state)));
      } else if (ev.type === 'bought') {
        ui.memo(msg.boughtMessage(ev.kind));
        ui.renderBar(state);
      } else if (ev.type === 'upgraded') {
        ui.memo(msg.upgradedMessage(ev.kind, ev.level));
      } else if (ev.type === 'wrongItem' && performance.now() - lastWrong > 30000) {
        lastWrong = performance.now();
        ui.memo(msg.wrongItemMessage(ev.item));
      } else if (ev.type === 'rescueStart') {
        for (const m of msg.rescueStartMessages(state, ev.missing)) ui.memo(m);
        ui.renderOrder(state, true);
      } else if (ev.type === 'rescueDone') {
        ui.memo(msg.rescueDoneMessage(ev.pay));
        ui.renderOrder(state, true);
      } else if (ev.type === 'firstBelt') {
        ui.memo(msg.FIRST_BELT);
      }
    }
    state.events.length = 0;
  }
  if (isNew) welcome();
  else ui.memo('Bienvenido de vuelta, colono. La fábrica no se ha movido. Tus créditos tampoco: siguen donde los dejaste.');
  setInterval(() => { if (document.getElementById('memo').hidden) ui.memo(msg.randomTip()); }, 90000);

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
    while (acc >= DT) { step(state); acc -= DT; }
    flushEvents();
    renderer.update(time, acc / DT);
    ui.renderOrder(state);
    if ((inspectTick = (inspectTick + 1) % 15) === 0) { ui.refreshInspect(state); ui.refreshPanelMoney(state); }
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
