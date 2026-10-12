// Gestos táctiles y de ratón.
// Un dedo: usa la herramienta elegida (construir, trazar cinta, quitar, o mover el mapa).
// Dos dedos: mover y hacer zoom siempre, sea cual sea la herramienta.

import { inBounds, canPlace, replaceable, isShip } from './state.js';
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

export function attachInput(canvas, { renderer, getState, ctl, dispatch, onTapEntity, onTapEmpty, onLongPress, onBuildDone, onCopy }) {
  const pointers = new Map();
  let gesture = null;   // gesto de un dedo en curso
  let pinch = null;     // gesto de dos dedos en curso
  let pinchHappened = false;
  let pressTimer = null;
  const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; };
  // La nave no es una entidad, pero se toca como si lo fuera (abre su ficha)
  const SHIP = { kind: 'nave' };
  const entityAt = (t) => getState().entities[key(t.x, t.y)] || (isShip(getState(), t.x, t.y) ? SHIP : null);

  const local = (ev) => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  // Fantasmas del trozo copiado con su esquina en `tile`
  const blueprintGhosts = (tile) => {
    const state = getState();
    return (ctl.blueprint || []).map((it) => {
      const x = tile.x + it.dx, y = tile.y + it.dy;
      return { x, y, dir: it.dir, kind: it.kind, valid: inBounds(x, y) && !canPlace(state, it.kind, x, y) };
    });
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
    } else if (t === 'borrar' || t === 'copiar') {
      // Quitar o copiar por área: rectángulo entre donde empezaste y donde tienes el dedo
      const a = gesture.startTile, b = gesture.lastTile;
      gesture.cells = [];
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) gesture.cells.push({ x, y });
      const full = ghostsFor(gesture.cells, 'borrar').filter((c) => c.valid).map((c) => ({ ...c, kind: t === 'copiar' ? 'marca' : 'borrar' }));
      renderer.setGhosts(full, { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y), color: t === 'copiar' ? 0x7fe3e0 : 0xff6b6b });
    } else if (t === 'pegar') {
      renderer.setGhosts(blueprintGhosts(gesture.lastTile));
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
    if (ctl.tool !== 'borrar' && ctl.tool !== 'copiar' && ctl.tool !== 'pegar' && entityAt(tile)) {
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
      if (ev.pointerType === 'mouse' && ctl.tool === 'pegar') {
        renderer.setGhosts(blueprintGhosts(renderer.screenToTile(p.x, p.y)));
      } else if (ev.pointerType === 'mouse' && ctl.tool !== 'mano' && ctl.tool !== 'copiar') {
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
    if (ctl.tool !== 'cinta' && ctl.tool !== 'borrar' && ctl.tool !== 'copiar' && ctl.tool !== 'pegar') {
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
    // Tocar un edificio que ya existe lo gira, con cualquier herramienta menos Quitar;
    // pero una máquina tocada sobre una cinta la sustituye
    const there = entityAt(g.startTile);
    const replaces = there && t !== 'cinta' && t !== 'borrar' && t !== 'mano' && replaceable(there);
    if (tap && t !== 'borrar' && t !== 'copiar' && t !== 'pegar' && there && !replaces) {
      renderer.setGhosts([]);
      onTapEntity(g.startTile);
      if (t !== 'mano') onBuildDone();
      return;
    }
    if (t === 'mano') {
      if (tap) onTapEmpty(g.startTile);
    } else if (t === 'cinta') {
      dispatch({ type: 'placeMany', kind: 'cinta', cells: g.cells.map(({ x, y, dir }) => ({ x, y, dir })) }, g.cells.length === 1);
    } else if (t === 'borrar') {
      dispatch({ type: 'remove', cells: g.cells.map(({ x, y }) => ({ x, y })) }, g.cells.length === 1);
    } else if (t === 'copiar') {
      renderer.setGhosts([]);
      onCopy(g.cells);
      return; // pasa a la herramienta de pegar
    } else if (t === 'pegar') {
      const at = g.lastTile;
      dispatch({ type: 'placeBlueprint', x: at.x, y: at.y, items: ctl.blueprint || [] }, true);
    } else {
      dispatch({ type: 'placeMany', kind: t, cells: g.cells.map(({ x, y }) => ({ x, y, dir: ctl.dir })) }, g.cells.length === 1);
    }
    renderer.setGhosts([]);
    // al soltar, se vuelve a la mano; lo elegido sigue en la barra para repetir
    if (t !== 'mano') onBuildDone();
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
