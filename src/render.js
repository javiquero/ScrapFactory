// Pintado con PixiJS. Solo LEE el estado; nunca lo modifica.

import { Container, Graphics, Sprite } from '../vendor/pixi.min.mjs';
import { TILE, MAP_W, MAP_H, DX, DY, DT, BELT_SPACING, LEVEL_MULT, beltSpeed } from './defs.js';
import { rng, key } from './world.js';

const T = TILE;
const HALF = T / 2;

export class Renderer {
  constructor(app, textures) {
    this.app = app;
    this.tx = textures;
    this.world = new Container();
    this.ground = new Graphics();
    this.nodeLayer = new Container();
    this.decorLayer = new Container();
    this.entityLayer = new Container();
    this.itemLayer = new Container();
    this.ghostLayer = new Container();
    this.highlight = new Graphics();
    this.world.addChild(this.ground, this.nodeLayer, this.decorLayer, this.entityLayer, this.itemLayer, this.ghostLayer, this.highlight);
    app.stage.addChild(this.world);
    this.sprites = new Map();   // id de entidad -> sprite
    this.itemPool = [];
    this.ghostPool = [];
    this.lastRev = -1;
    this.carriers = [];         // cintas y divisores (llevan objetos)
    this.machines = [];
    this.minZoom = 0.3;
    this.maxZoom = 2;
  }

  // Cambia de partida (nueva o cargada): repinta el planeta entero
  setState(state) {
    this.state = state;
    this.lastRev = -1;
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
    this.drawGround(state);
    this.sync();
  }

  drawGround(state) {
    const g = this.ground;
    g.clear();
    const rand = rng(state.seed ^ 0x9e3779b9);
    const greens = [0x8cc56a, 0x86c064, 0x91ca70, 0x82bb60];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        g.rect(x * T, y * T, T, T).fill(greens[Math.floor(rand() * greens.length)]);
      }
    }
    // rejilla suave para saber dónde cae cada cosa
    for (let x = 0; x <= MAP_W; x++) g.moveTo(x * T, 0).lineTo(x * T, MAP_H * T);
    for (let y = 0; y <= MAP_H; y++) g.moveTo(0, y * T).lineTo(MAP_W * T, y * T);
    g.stroke({ width: 1.5, color: 0x2f5a2a, alpha: 0.12 });
    // borde del mapa
    g.rect(0, 0, MAP_W * T, MAP_H * T).stroke({ width: 8, color: 0x2f5a2a, alpha: 0.35 });

    this.nodeLayer.removeChildren().forEach((c) => c.destroy());
    for (const k in state.world.nodes) {
      const [x, y] = k.split(',').map(Number);
      const s = new Sprite(this.tx['node_' + state.world.nodes[k]]);
      s.position.set(x * T, y * T);
      this.nodeLayer.addChild(s);
    }
    this.decorLayer.removeChildren().forEach((c) => c.destroy());
    for (const d of state.world.decor) {
      const s = new Sprite(this.tx[d.kind]);
      s.position.set(d.x * T, d.y * T);
      s.label = key(d.x, d.y);
      this.decorLayer.addChild(s);
    }
  }

  // Crea/actualiza/borra sprites de edificios cuando cambia la estructura
  sync() {
    const state = this.state;
    if (state.rev === this.lastRev) return;
    this.lastRev = state.rev;
    const alive = new Set();
    this.carriers = [];
    this.machines = [];
    const occupied = new Set();
    for (const k in state.entities) {
      const e = state.entities[k];
      alive.add(e.id);
      occupied.add(k);
      let s = this.sprites.get(e.id);
      if (!s) {
        s = new Sprite(this.textureFor(e));
        s.anchor.set(0.5);
        this.entityLayer.addChild(s);
        this.sprites.set(e.id, s);
      }
      s.position.set(e.x * T + HALF, e.y * T + HALF);
      s.rotation = e.kind === 'teletransportador' ? 0 : (e.dir * Math.PI) / 2;
      if (e.kind === 'cinta' || e.kind === 'divisor') this.carriers.push([e, s]);
      else this.machines.push([e, s]);
    }
    for (const [id, s] of this.sprites) {
      if (!alive.has(id)) { s.destroy(); this.sprites.delete(id); }
    }
    // la decoración se esconde bajo los edificios
    for (const d of this.decorLayer.children) d.visible = !occupied.has(d.label);
  }

  textureFor(e) {
    if (e.kind === 'cinta') return this.tx[`belt${this.state.levels?.cinta || 1}_0`];
    return this.tx[e.kind];
  }

  // Se llama cada fotograma. alpha = fracción del tick actual (para suavizar).
  update(time, alpha) {
    this.sync();
    const lvl = this.state.levels?.cinta || 1;
    const frame = Math.floor(time * 10 * LEVEL_MULT[lvl]) % 4;
    const beltTex = this.tx[`belt${lvl}_${frame}`];
    const ahead = beltSpeed(lvl) * DT * alpha; // cuánto avanzan entre ticks
    let used = 0;
    const put = (type, x, y) => {
      let sp = this.itemPool[used];
      if (!sp) { sp = new Sprite(); sp.anchor.set(0.5); this.itemLayer.addChild(sp); this.itemPool.push(sp); }
      sp.texture = this.tx['item_' + type];
      sp.position.set(x, y);
      sp.visible = true;
      used++;
    };
    for (const [e, bs] of this.carriers) {
      const cx = e.x * T + HALF, cy = e.y * T + HALF;
      if (e.kind === 'cinta') {
        bs.texture = beltTex;
        let lim = 1;
        for (const it of e.items) {
          const p = Math.min(lim, it.p + ahead);
          lim = p - BELT_SPACING;
          const [x, y] = beltPos(cx, cy, it.from, e.dir, p);
          put(it.type, x, y);
        }
      } else if (e.item) {
        const p = Math.min(0.5, e.item.p);
        const [x, y] = beltPos(cx, cy, e.item.from, e.dir, p);
        put(e.item.type, x, y);
      }
    }
    for (let i = used; i < this.itemPool.length; i++) this.itemPool[i].visible = false;

    // pequeño "latido" de las máquinas que están trabajando
    for (const [e, s] of this.machines) {
      let working = false;
      if (e.kind === 'extractor') working = e.out.length < 4;
      else if (e.busy !== undefined) working = e.busy;
      const pulse = working ? 1 + Math.sin(time * 10 + e.id) * 0.04 : 1;
      if (e.kind === 'teletransportador') s.scale.set(1 + Math.sin(time * 3) * 0.03);
      else s.scale.set(pulse);
    }
  }

  setGhosts(list) {
    let i = 0;
    for (const g of list) {
      let s = this.ghostPool[i];
      if (!s) { s = new Sprite(); s.anchor.set(0.5); this.ghostLayer.addChild(s); this.ghostPool.push(s); }
      s.texture = g.kind === 'cinta' ? this.tx.belt0 : g.kind === 'borrar' ? this.tx.piedra : this.tx[g.kind];
      s.position.set(g.x * T + HALF, g.y * T + HALF);
      s.rotation = g.kind === 'teletransportador' ? 0 : (g.dir * Math.PI) / 2;
      s.alpha = 0.6;
      s.tint = g.valid ? 0xffffff : 0xff6b6b;
      s.visible = g.kind !== 'borrar';
      i++;
    }
    for (; i < this.ghostPool.length; i++) this.ghostPool[i].visible = false;
    // marco de las casillas afectadas
    const h = this.highlight;
    h.clear();
    for (const g of list) {
      const color = g.kind === 'borrar' ? 0xff6b6b : g.valid ? 0xffd84a : 0xff6b6b;
      h.roundRect(g.x * T + 2, g.y * T + 2, T - 4, T - 4, 10).stroke({ width: 3, color, alpha: 0.95 });
    }
  }

  setSelected(cell) {
    if (!cell) { this.setGhosts([]); return; }
    this.setGhosts([]);
    this.highlight.roundRect(cell.x * T + 2, cell.y * T + 2, T - 4, T - 4, 10).stroke({ width: 4, color: 0xffd84a });
  }

  // --- Cámara ---
  get zoom() { return this.world.scale.x; }

  centerOn(tx, ty, zoom = this.zoom) {
    const { width, height } = this.app.screen;
    this.world.scale.set(zoom);
    this.world.position.set(width / 2 - (tx + 0.5) * T * zoom, height / 2 - (ty + 0.5) * T * zoom);
    this.clamp();
  }

  pan(dx, dy) {
    this.world.x += dx;
    this.world.y += dy;
    this.clamp();
  }

  zoomAt(factor, sx, sy) {
    const old = this.zoom;
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, old * factor));
    const wx = (sx - this.world.x) / old;
    const wy = (sy - this.world.y) / old;
    this.world.scale.set(z);
    this.world.x = sx - wx * z;
    this.world.y = sy - wy * z;
    this.clamp();
  }

  clamp() {
    const { width, height } = this.app.screen;
    const z = this.zoom;
    const mw = MAP_W * T * z, mh = MAP_H * T * z;
    const margin = 120;
    this.world.x = Math.min(margin, Math.max(width - mw - margin, this.world.x));
    this.world.y = Math.min(margin, Math.max(height - mh - margin, this.world.y));
  }

  screenToTile(sx, sy) {
    const z = this.zoom;
    return { x: Math.floor((sx - this.world.x) / z / T), y: Math.floor((sy - this.world.y) / z / T) };
  }

  cameraTile() {
    const { width, height } = this.app.screen;
    const t = this.screenToTile(width / 2, height / 2);
    return { ...t, zoom: this.zoom };
  }
}

// Posición de un objeto en una casilla: de la entrada al centro y del centro a la salida
function beltPos(cx, cy, from, dir, p) {
  if (p < 0.5) {
    const k = p * 2;
    const sx = cx + DX[from] * HALF, sy = cy + DY[from] * HALF;
    return [sx + (cx - sx) * k, sy + (cy - sy) * k];
  }
  const k = (p - 0.5) * 2;
  return [cx + DX[dir] * HALF * k, cy + DY[dir] * HALF * k];
}
