// Gestos táctiles y de ratón.
// Un dedo: usa la herramienta elegida (construir, trazar cinta, quitar, o mover el mapa).
// Dos dedos: mover y hacer zoom siempre, sea cual sea la herramienta.

import { inBounds, canPlace } from './state.js';
import { key } from './world.js';

const TAP_SLOP = 8;
const LONG_PRESS_MS = 500;

// Recorrido en L de una casilla a otra. Cada casilla apunta hacia la siguiente.
export function beltPath(a, b, fallbackDir) {
  const cells = [];
  const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
  const horizontalFirst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  let x = a.x, y = a.y;
  cells.push({ x, y });
  const walk = (sx, sy, tx, ty) => {
    while (x !== tx || y !== ty) { x += sx; y += sy; cells.push({ x, y }); }
  };
  if (horizontalFirst) { walk(dx, 0, b.x, y); walk(0, dy, x, b.y); }
  else { walk(0, dy, x, b.y); walk(dx, 0, b.x, y); }
  for (let i = 0; i < cells.length; i++) {
    const n = cells[i + 1], p = cells[i - 1];
    const from = n ? cells[i] : p, to = n || cells[i];
    if (!n && !p) { cells[i].dir = fallbackDir; continue; }
    const ddx = to.x - from.x, ddy = to.y - from.y;
    cells[i].dir = ddx > 0 ? 0 : ddx < 0 ? 2 : ddy > 0 ? 1 : 3;
  }
  return cells;
}

export function attachInput(canvas, { renderer, getState, ctl, dispatch, onTapEntity, onTapEmpty, onLongPress }) {
  const pointers = new Map();
  let gesture = null;   // gesto de un dedo en curso
  let pinch = null;     // gesto de dos dedos en curso
  let pinchHappened = false;
  let pressTimer = null;
  const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; };
  const entityAt = (t) => getState().entities[key(t.x, t.y)];

  const local = (ev) => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  const ghostsFor = (cells, kind) => {
    const state = getState();
    return cells.filter((c) => inBounds(c.x, c.y)).map((c) => ({
      ...c,
      kind,
      valid: kind === 'borrar' ? !!state.entities[key(c.x, c.y)] : !canPlace(state, kind, c.x, c.y),
    }));
  };

  function previewGesture() {
    if (!gesture) return;
    const t = ctl.tool;
    if (t === 'cinta') {
      gesture.cells = beltPath(gesture.startTile, gesture.lastTile, ctl.dir);
      renderer.setGhosts(ghostsFor(gesture.cells, 'cinta'));
    } else if (t === 'borrar') {
      renderer.setGhosts(ghostsFor(gesture.cells, 'borrar'));
    } else if (t !== 'mano') {
      renderer.setGhosts(ghostsFor(gesture.cells.map((c) => ({ ...c, dir: ctl.dir })), t));
    }
  }

  function startPinch() {
    const [a, b] = [...pointers.values()];
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    pinchHappened = true;
    cancelPress();
    gesture = null;
    renderer.setGhosts([]);
  }

  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture?.(ev.pointerId);
    const p = local(ev);
    pointers.set(ev.pointerId, p);
    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2) return;
    pinchHappened = false;
    const tile = renderer.screenToTile(p.x, p.y);
    const g = { t0: performance.now(), sx: p.x, sy: p.y, lx: p.x, ly: p.y, moved: false, long: false, startTile: tile, lastTile: tile, cells: [tile], seen: new Set([key(tile.x, tile.y)]) };
    gesture = g;
    cancelPress();
    // Mantener pulsado un edificio: menú de girar / quitar
    if (ctl.tool !== 'borrar' && entityAt(tile)) {
      pressTimer = setTimeout(() => {
        if (gesture !== g || g.moved || pinchHappened) return;
        g.long = true;
        renderer.setGhosts([]);
        navigator.vibrate?.(15);
        onLongPress(tile);
      }, LONG_PRESS_MS);
    }
    previewGesture();
  });

  canvas.addEventListener('pointermove', (ev) => {
    const p = local(ev);
    if (!pointers.has(ev.pointerId)) {
      // ratón sin pulsar: enseña dónde caería el edificio
      if (ev.pointerType === 'mouse' && ctl.tool !== 'mano') {
        const t = renderer.screenToTile(p.x, p.y);
        const kind = ctl.tool === 'borrar' ? 'borrar' : ctl.tool;
        renderer.setGhosts(ghostsFor([{ ...t, dir: ctl.dir }], kind));
      }
      return;
    }
    pointers.set(ev.pointerId, p);

    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      renderer.pan(mx - pinch.mx, my - pinch.my);
      if (pinch.dist > 10) renderer.zoomAt(dist / pinch.dist, mx, my);
      pinch = { dist, mx, my };
      return;
    }
    if (!gesture) return;

    if (!gesture.moved && Math.hypot(p.x - gesture.sx, p.y - gesture.sy) > TAP_SLOP) { gesture.moved = true; cancelPress(); }
    if (gesture.long) return;

    if (ctl.tool === 'mano') {
      if (gesture.moved) renderer.pan(p.x - gesture.lx, p.y - gesture.ly);
      gesture.lx = p.x; gesture.ly = p.y;
      return;
    }
    const tile = renderer.screenToTile(p.x, p.y);
    if (tile.x === gesture.lastTile.x && tile.y === gesture.lastTile.y) return;
    gesture.lastTile = tile;
    if (ctl.tool !== 'cinta') {
      // modo "pintar": cada casilla nueva que pisas
      const k = key(tile.x, tile.y);
      if (!gesture.seen.has(k)) { gesture.seen.add(k); gesture.cells.push(tile); }
    }
    previewGesture();
  });

  const end = (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.delete(ev.pointerId);
    if (pointers.size === 1 && pinch) {
      // de dos dedos a uno: seguimos solo moviendo, no construimos
      pinch = null;
      return;
    }
    if (pointers.size > 0) return;
    pinch = null;
    cancelPress();
    const g = gesture;
    gesture = null;
    if (g?.long) return; // la ficha ya está abierta y el edificio marcado
    // Si el temporizador se retrasó (móvil ocupado), decide por el tiempo pulsado
    if (g && !g.moved && !pinchHappened && ctl.tool !== 'borrar' && performance.now() - g.t0 >= LONG_PRESS_MS && entityAt(g.startTile)) {
      renderer.setGhosts([]);
      onLongPress(g.startTile);
      return;
    }
    if (!g || pinchHappened || ev.type === 'pointercancel') { renderer.setGhosts([]); return; }

    const t = ctl.tool;
    const tap = !g.moved && g.cells.length === 1;
    // Tocar un edificio que ya existe lo gira, con cualquier herramienta menos Quitar
    if (tap && t !== 'borrar' && entityAt(g.startTile)) {
      renderer.setGhosts([]);
      onTapEntity(g.startTile);
      return;
    }
    if (t === 'mano') {
      if (tap) onTapEmpty(g.startTile);
    } else if (t === 'cinta') {
      dispatch({ type: 'placeMany', kind: 'cinta', cells: g.cells.map(({ x, y, dir }) => ({ x, y, dir })) }, g.cells.length === 1);
    } else if (t === 'borrar') {
      dispatch({ type: 'remove', cells: g.cells.map(({ x, y }) => ({ x, y })) }, g.cells.length === 1);
    } else {
      dispatch({ type: 'placeMany', kind: t, cells: g.cells.map(({ x, y }) => ({ x, y, dir: ctl.dir })) }, g.cells.length === 1);
    }
    renderer.setGhosts([]);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !pointers.size) renderer.setGhosts([]); });

  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = local(ev);
    renderer.zoomAt(Math.exp(-ev.deltaY * 0.0015), p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
}
