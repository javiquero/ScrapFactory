// Pintado con PixiJS. Solo LEE el estado; nunca lo modifica.

import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite } from '../vendor/pixi.min.mjs';
import { planetAt, TILE, MAP_W, MAP_H, DX, DY, DT, BELT_SPACING, LEVEL_MULT, beltSpeed, opposite } from './defs.js';
import { rng, key } from './world.js';
import { beltShape, itemPos } from './beltShapes.js';
import { UPRIGHT, HAS_CHUTE } from './sprites/machines.js';
import { NODE_PIECES, NODE_GROUND } from './sprites/terrain.js';
import { MACHINE_ANCHOR_Y, TOP } from './sprites/common.js';

const TALL_DECOR = ['arbol', 'arbol2', 'arbusto'];
const CH = 16;              // casillas por trozo de suelo
const CHPX = CH * TILE;

const T = TILE;
const HALF = T / 2;

export class Renderer {
  constructor(app, textures) {
    this.app = app;
    this.tx = textures;
    this.world = new Container();
    this.chunkLayer = new Container();     // suelo horneado por trozos + chatarra y decoración plana
    this.grid = new TilingSprite({ texture: Texture.EMPTY, width: MAP_W * T, height: MAP_H * T });
    this.entityLayer = new Container();    // cintas y divisores (planos)
    this.itemLayer = new Container();      // objetos sobre las cintas
    this.tallLayer = new Container();      // máquinas y árboles, ordenados por profundidad
    this.tallLayer.sortableChildren = true;
    this.ghostLayer = new Container();
    this.highlight = new Graphics();
    this.world.addChild(this.chunkLayer, this.grid, this.entityLayer, this.itemLayer, this.tallLayer, this.ghostLayer, this.highlight);
    app.stage.addChild(this.world);
    this.sprites = new Map();   // id de entidad -> sprite
    this.chunks = [];
    this.baked = [];
    this.junk = [];             // piezas de chatarra sueltas
    this.flatDecor = [];
    this.itemPool = [];
    this.ghostPool = [];
    this.ghostChutes = [];
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
    for (const s of this.sprites.values()) s.destroy({ children: true });
    this.sprites.clear();
    this.drawGround(state);
    // la nave: única y fija, ocupa 2×2 casillas
    if (!this.ship) { this.ship = new Sprite(this.tx.nave); this.ship.anchor.set(0.5); this.tallLayer.addChild(this.ship); }
    this.ship.position.set((state.ship.x + 1) * T, (state.ship.y + 1) * T);
    this.ship.zIndex = (state.ship.y + 1) * T + HALF;
    this.sync();
  }

  // El suelo es estático: se dibuja una vez y se "hornea" en texturas por trozos de
  // 16×16 casillas. Así el móvil no repinta miles de formas en cada fotograma.
  drawGround(state) {
    for (const t of this.baked) t.destroy(true);
    this.baked = [];
    this.chunkLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const c of [...this.tallLayer.children]) if (c.isDecor) { this.tallLayer.removeChild(c); c.destroy(); }
    this.junk = [];
    this.flatDecor = [];

    const rand = rng(state.seed ^ 0x9e3779b9);
    const W = MAP_W * T, H = MAP_H * T;
    const NX = Math.ceil(MAP_W / CH), NY = Math.ceil(MAP_H / CH);
    const gfx = [];
    for (let i = 0; i < NX * NY; i++) gfx.push(new Graphics());
    // dibuja en todos los trozos que toca el rectángulo [x0,x1]×[y0,y1]
    const each = (x0, y0, x1, y1, fn) => {
      const a = Math.max(0, Math.floor(x0 / CHPX)), b = Math.min(NX - 1, Math.floor(x1 / CHPX));
      const c = Math.max(0, Math.floor(y0 / CHPX)), d = Math.min(NY - 1, Math.floor(y1 / CHPX));
      for (let cy = c; cy <= d; cy++) for (let cx = a; cx <= b; cx++) fn(gfx[cy * NX + cx]);
    };
    const circle = (x, y, r, fill) => each(x - r, y - r, x + r, y + r, (g) => g.circle(x, y, r).fill(fill));

    // hierba: verde de base con manchas grandes y suaves de otros tonos
    gfx.forEach((g) => g.rect(0, 0, W, H).fill(planetAt(state.planet || 0).ground));
    for (let i = 0; i < MAP_W * MAP_H * 0.08; i++) {
      const x = rand() * W, y = rand() * H, r = 50 + rand() * 140;
      circle(x, y, r, { color: rand() < 0.5 ? 0x9bd078 : 0x7fb95e, alpha: 0.22 });
    }
    for (let i = 0; i < MAP_W * MAP_H * 0.9; i++) {
      const x = rand() * W, y = rand() * H, h = 5 + rand() * 5;
      each(x - 5, y - h, x + 5, y, (g) => g.moveTo(x - 3, y).lineTo(x - 4, y - h * 0.7).moveTo(x, y).lineTo(x + 0.5, y - h).moveTo(x + 3, y).lineTo(x + 4, y - h * 0.7)
        .stroke({ width: 1.6, color: 0x5d9a45, alpha: 0.5, cap: 'round' }));
    }

    // vertederos: tierra continua con borde irregular
    const nodes = Object.entries(state.world.nodes).map(([k, type]) => [...k.split(',').map(Number), type]);
    const blobs = [];
    for (const [x, y, type] of nodes) {
      blobs.push([x * T + HALF + (rand() - 0.5) * 10, y * T + HALF + (rand() - 0.5) * 10, T * 0.5, type]);
      for (let k = 0; k < 3; k++) {
        const a = rand() * Math.PI * 2, d = T * (0.18 + rand() * 0.16);
        blobs.push([x * T + HALF + Math.cos(a) * d, y * T + HALF + Math.sin(a) * d, T * (0.26 + rand() * 0.12), type]);
      }
    }
    const tone = (type, i) => (NODE_GROUND[type] || NODE_GROUND.chatarra)[i];
    for (const [x, y, r] of blobs) circle(x, y, r + 4, { color: 0x6f8f45, alpha: 0.55 }); // hierba pisada
    for (const [x, y, r, type] of blobs) circle(x, y, r + 1.5, tone(type, 0));
    for (const [x, y, r, type] of blobs) circle(x, y, r - 1, tone(type, 1));
    for (const [x, y, type] of nodes) {
      for (let k = 0; k < 3; k++) circle(x * T + rand() * T, y * T + rand() * T, 8 + rand() * 10, { color: tone(type, 2), alpha: 0.35 });
      for (let k = 0; k < 5; k++) circle(x * T + rand() * T, y * T + rand() * T, 1.5 + rand() * 2, { color: tone(type, 3), alpha: 0.8 });
    }
    gfx.forEach((g) => g.rect(0, 0, W, H).stroke({ width: 10, color: 0x2f5a2a, alpha: 0.35 }));

    // hornear cada trozo y montar su contenedor (suelo + piezas sueltas encima)
    this.chunks = [];
    for (let cy = 0; cy < NY; cy++) {
      for (let cx = 0; cx < NX; cx++) {
        const g = gfx[cy * NX + cx];
        const t = this.app.renderer.generateTexture({ target: g, frame: new Rectangle(cx * CHPX, cy * CHPX, CHPX, CHPX), resolution: 0.5 });
        g.destroy();
        this.baked.push(t);
        const chunk = new Container();
        const bg = new Sprite(t);
        bg.position.set(cx * CHPX, cy * CHPX);
        bg.width = CHPX; bg.height = CHPX;
        chunk.addChild(bg);
        chunk.bounds = [cx * CHPX, cy * CHPX, (cx + 1) * CHPX, (cy + 1) * CHPX];
        this.chunks.push(chunk);
        this.chunkLayer.addChild(chunk);
      }
    }
    const chunkAt = (px, py) => this.chunks[Math.min(NY - 1, Math.floor(py / CHPX)) * NX + Math.min(NX - 1, Math.floor(px / CHPX))];

    // piezas de chatarra repartidas a su aire
    const pieces = [];
    for (const [x, y, type] of nodes) {
      const set = NODE_PIECES[type] || NODE_PIECES.chatarra;
      for (let k = 0; k < 3; k++) {
        const sp = new Sprite(this.tx[set[Math.floor(rand() * set.length)]]);
        sp.anchor.set(0.5);
        sp.position.set(x * T + 18 + rand() * (T - 36), y * T + 18 + rand() * (T - 36));
        sp.rotation = (rand() - 0.5) * 0.8;
        const sc = 0.62 + rand() * 0.25;
        sp.scale.set(sc * (rand() < 0.5 ? -1 : 1), sc);
        sp.label = key(x, y);
        pieces.push(sp);
      }
    }
    pieces.sort((a, b) => a.y - b.y).forEach((sp) => { chunkAt(sp.x, sp.y).addChild(sp); this.junk.push(sp); });

    // decoración: la plana va en el trozo; árboles y arbustos, ordenados con las máquinas
    for (const d of state.world.decor) {
      const sp = new Sprite(this.tx[d.kind]);
      sp.anchor.set(0.5);
      sp.position.set(d.x * T + HALF, d.y * T + HALF);
      sp.label = key(d.x, d.y);
      if (TALL_DECOR.includes(d.kind)) { sp.isDecor = true; sp.zIndex = d.y * T + HALF; this.tallLayer.addChild(sp); }
      else { chunkAt(sp.x, sp.y).addChild(sp); this.flatDecor.push(sp); }
    }

    // rejilla: un azulejo repetido, muy suave al mirar y más visible al construir
    if (!this.tx.gridTile) {
      const gt = new Graphics();
      gt.rect(0, 0, T, 1.5).fill(0x24461f).rect(0, 0, 1.5, T).fill(0x24461f);
      this.tx.gridTile = this.app.renderer.generateTexture({ target: gt, frame: new Rectangle(0, 0, T, T) });
      gt.destroy();
    }
    this.grid.texture = this.tx.gridTile;
    this.setBuildMode(this.buildMode || false);
  }

  // Oculta los trozos de suelo que no están en pantalla
  cull() {
    const z = this.zoom, { width, height } = this.app.screen;
    const x0 = -this.world.x / z, y0 = -this.world.y / z, x1 = x0 + width / z, y1 = y0 + height / z;
    for (const c of this.chunks) {
      const [a, b, cc, d] = c.bounds;
      c.visible = cc > x0 && a < x1 && d > y0 && b < y1;
    }
  }

  // Al construir, la rejilla se ve más
  setBuildMode(on) {
    this.buildMode = on;
    this.grid.visible = on;   // fuera del modo construir no se pinta (ahorra trabajo al móvil)
    this.grid.alpha = 0.16;
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
      const upright = UPRIGHT.includes(e.kind);
      let s = this.sprites.get(e.id);
      if (!s) {
        if (upright) {
          // máquina: cuerpo siempre derecho (más alto que la casilla) + rampa de salida que gira
          s = new Container();
          s.body = new Sprite(this.textureFor(e)); s.body.anchor.set(0.5, MACHINE_ANCHOR_Y);
          s.addChild(s.body);
          if (HAS_CHUTE.includes(e.kind)) { s.chute = new Sprite(this.tx.chute); s.chute.anchor.set(0.5); s.addChild(s.chute); }
          this.tallLayer.addChild(s);
        } else {
          s = new Sprite(this.textureFor(e));
          s.anchor.set(0.5);
          this.entityLayer.addChild(s);
        }
        this.sprites.set(e.id, s);
      }
      s.position.set(e.x * T + HALF, e.y * T + HALF);
      s.zIndex = e.y * T + HALF + 1;
      if (s.chute) {
        s.chute.rotation = (e.dir * Math.PI) / 2;
        // hacia arriba la rampa quedaría en medio de la máquina: se sube por encima
        s.chute.y = e.dir === 3 ? -TOP + 8 : 0;
      }
      if (!upright) s.rotation = e.kind === 'puente' ? 0 : (e.dir * Math.PI) / 2; // el puente no se gira: sirve en las dos direcciones
      if (e.kind === 'cinta' || e.kind === 'divisor' || e.kind === 'puente') this.carriers.push([e, s, e.kind === 'cinta' ? beltShape(state, e) : null]);
      else this.machines.push([e, s]);
    }
    for (const [id, s] of this.sprites) {
      if (!alive.has(id)) { s.destroy({ children: true }); this.sprites.delete(id); }
    }
    // la decoración y la chatarra suelta se esconden bajo los edificios
    for (const d of this.flatDecor) d.visible = !occupied.has(d.label);
    for (const d of this.tallLayer.children) if (d.isDecor) d.visible = !occupied.has(d.label);
    for (const d of this.junk) {
      const e = state.entities[d.label];
      d.visible = !e || e.kind === 'extractor'; // el extractor se planta encima del montón
    }
  }

  textureFor(e) {
    if (e.kind === 'cinta') return this.tx[`belt${this.state.levels?.cinta || 1}_0`];
    return this.tx[e.kind];
  }

  // Se llama cada fotograma. alpha = fracción del tick actual (para suavizar).
  update(time, alpha) {
    this.sync();
    this.cull();
    const lvl = this.state.levels?.cinta || 1;
    const frame = Math.floor(time * 10 * LEVEL_MULT[lvl]) % 4;
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
    for (const [e, bs, shape] of this.carriers) {
      const cx = e.x * T + HALF, cy = e.y * T + HALF;
      if (e.kind === 'cinta') {
        bs.texture = this.tx[`belt${lvl}_${shape}_${frame}`];
        let lim = 1;
        for (const it of e.items) {
          const p = Math.min(lim, it.p + ahead);
          lim = p - BELT_SPACING;
          const [x, y] = itemPos(cx, cy, HALF, it.from, e.dir, p);
          put(it.type, x, y);
        }
      } else if (e.lanes) {
        // puente: lo de abajo se esconde al pasar bajo el tablero
        for (let l = 0; l < 2; l++) {
          const it = e.lanes[l];
          if (!it) continue;
          const p = Math.min(1, it.p + ahead * 2);
          if (l === 0 && p > 0.3 && p < 0.7) continue;
          const [x, y] = itemPos(cx, cy, HALF, opposite(it.dir), it.dir, p);
          put(it.type, x, y);
        }
      } else if (e.item) {
        const p = Math.min(0.5, e.item.p);
        const [x, y] = itemPos(cx, cy, HALF, e.item.from, e.dir, p);
        put(e.item.type, x, y);
      }
    }
    for (let i = used; i < this.itemPool.length; i++) this.itemPool[i].visible = false;
    if (this.ship) this.ship.texture = this.tx[`nave_${Math.floor(time * 6) % 4}`];

    // animación de las máquinas que están trabajando
    for (const [e, s] of this.machines) {
      let working = false;
      if (e.kind === 'extractor') working = e.out.length < 4 && !!this.state.world.nodes[key(e.x, e.y)];
      else working = !!e.busy;
      const f = working ? (Math.floor(time * 9) + e.id) % 4 : 0;
      if (s.body) s.body.texture = this.tx[`${e.kind}_${f}`];
    }
  }

  setGhosts(list, area = null) {
    let i = 0;
    for (const g of list) {
      let s = this.ghostPool[i];
      if (!s) { s = new Sprite(); s.anchor.set(0.5); this.ghostLayer.addChild(s); this.ghostPool.push(s); }
      s.texture = g.kind === 'cinta' ? this.tx.belt0 : g.kind === 'borrar' ? this.tx.piedra : this.tx[g.kind];
      s.position.set(g.x * T + HALF, g.y * T + HALF);
      const upright = UPRIGHT.includes(g.kind);
      s.anchor.set(0.5, upright ? MACHINE_ANCHOR_Y : 0.5);
      s.rotation = upright ? 0 : (g.dir * Math.PI) / 2;
      s.alpha = 0.6;
      s.tint = g.valid ? 0xffffff : 0xff6b6b;
      s.visible = g.kind !== 'borrar';
      // rampa de salida del fantasma, para ver hacia dónde saldrá
      let c = this.ghostChutes[i];
      if (!c) { c = new Sprite(this.tx.chute); c.anchor.set(0.5); this.ghostLayer.addChildAt(c, 0); this.ghostChutes.push(c); }
      c.visible = HAS_CHUTE.includes(g.kind);
      c.position.copyFrom(s.position);
      c.rotation = (g.dir * Math.PI) / 2;
      c.alpha = 0.6;
      c.tint = s.tint;
      i++;
    }
    for (let j = i; j < this.ghostPool.length; j++) this.ghostPool[j].visible = false;
    for (let j = i; j < this.ghostChutes.length; j++) this.ghostChutes[j].visible = false;
    // marco de las casillas afectadas
    const h = this.highlight;
    h.clear();
    if (area) {
      // zona que se va a borrar
      const x = area.x0 * T, y = area.y0 * T, w = (area.x1 - area.x0 + 1) * T, hh = (area.y1 - area.y0 + 1) * T;
      h.roundRect(x + 1, y + 1, w - 2, hh - 2, 12).fill({ color: 0xff6b6b, alpha: 0.16 }).stroke({ width: 3, color: 0xff6b6b, alpha: 0.9 });
    }
    for (const g of list) {
      const color = g.kind === 'borrar' ? 0xff6b6b : g.valid ? 0xffd84a : 0xff6b6b;
      h.roundRect(g.x * T + 2, g.y * T + 2, T - 4, T - 4, 10).stroke({ width: 3, color, alpha: 0.95 });
      if (g.kind === 'borrar') h.roundRect(g.x * T + 6, g.y * T + 6, T - 12, T - 12, 8).fill({ color: 0xff6b6b, alpha: 0.28 });
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
    this.panned = (this.panned || 0) + Math.abs(dx) + Math.abs(dy); // para el tutorial
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

