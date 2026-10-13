// Interfaz en HTML por encima del lienzo: pedido, barra rápida, catálogo, comunicados.

import { BUILDINGS, CATEGORIES, ITEMS, PLANETS, MACHINE_BUFFER, beltRate, extractorRate, craftTime, unlockedBy, minRate } from './defs.js';
import { currentOrder, hasNextPlanet, orderRate } from './state.js';
import { shipText } from './messages.js';

const $ = (id) => document.getElementById(id);

const SVG = {
  mano: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17V8a2 2 0 0 1 4 0v7M15 14V6a2 2 0 0 1 4 0v8M19 14V8a2 2 0 0 1 4 0v9c0 6-3.5 10-8.5 10-3.5 0-5.5-2-7.5-5l-2.5-4a2 2 0 0 1 3.2-2.4L11 18"/></svg>',
  deshacer: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13h11a6 6 0 0 1 0 12h-6"/><path d="M14 8l-5 5 5 5"/></svg>',
  girar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M25 16a9 9 0 1 1-3-6.7"/><path d="M23 4v6h-6"/></svg>',
  copiar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="15" height="15" rx="3" stroke-dasharray="3 3"/><rect x="12" y="12" width="15" height="15" rx="3"/></svg>',
  pegar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="18" height="21" rx="3"/><path d="M12 7V5h8v2M12 15h8M12 20h6"/></svg>',
  borrar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h20M13 9V6h6v3M9 9l1.5 17h11L23 9M14 14v8M18 14v8"/></svg>',
  mas: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="5" width="9" height="9" rx="2.5"/><rect x="18" y="5" width="9" height="9" rx="2.5"/><rect x="5" y="18" width="9" height="9" rx="2.5"/><path d="M22.5 18v9M18 22.5h9"/></svg>',
};

// Cuándo se desbloquea un edificio que aún no tienes
function unlockText(kind, state) {
  const u = unlockedBy(kind);
  if (!u) return 'Próximamente.';
  if (u.planet > state.planet) return `Se desbloquea en el planeta ${u.planet + 1}.`;
  return `Se desbloquea al cumplir el pedido ${u.order + 1}.`;
}

export class UI {
  constructor({ icons, ctl, onSelectTool, onUndo, onInspectRotate, onInspectRemove, onReset, onLaunch, onTutorial, onToggleOut, onStats }) {
    this.icons = icons;
    this.ctl = ctl;
    this.cb = { onSelectTool, onUndo, onInspectRotate, onInspectRemove, onReset, onLaunch, onTutorial, onToggleOut, onStats };
    this.canUndo = false;
    this.tutTool = null;     // herramienta que el tutorial está señalando
    $('launchBtn').addEventListener('click', () => this.cb.onLaunch());
    this.memoQueue = [];
    this.memoTimer = null;
    this.hintTimer = null;
    this.lastOrderKey = '';

    $('memo').addEventListener('click', () => this.nextMemo());
    $('panelClose').addEventListener('click', () => this.closePanel());
    $('scrim').addEventListener('click', () => this.closePanel());
    $('inspectClose').addEventListener('click', () => this.hideInspect());
    $('inspectRotate').addEventListener('click', () => this.cb.onInspectRotate());
    $('inspectRemove').addEventListener('click', () => this.cb.onInspectRemove());
    $('tutSkip').addEventListener('click', () => this.cb.onTutorial('skip'));
    $('tutAgain').addEventListener('click', () => { this.closePanel(); this.cb.onTutorial('again'); });
    $('resetBtn').addEventListener('click', () => {
      if (confirm('¿Empezar una partida nueva? Se pierde la fábrica actual.')) { this.closePanel(); this.cb.onReset(); }
    });
  }

  // ---- Barra rápida ----
  renderBar(state) {
    const bar = $('bar');
    const { tool, dir } = this.ctl;
    let recent = this.ctl.recent.filter((k) => state.unlocked.includes(k)).slice(0, window.innerWidth < 430 ? 2 : 3);
    // lo que señala el tutorial tiene que estar en la barra
    if (this.tutTool && BUILDINGS[this.tutTool] && this.tutTool !== 'cinta' && state.unlocked.includes(this.tutTool) && !recent.includes(this.tutTool)) recent = [this.tutTool, ...recent.slice(0, 2)];
    const btn = (id, label, iconHtml, extra = '') =>
      `<button class="tool ${extra} ${this.tutTool === id ? 'tut' : ''}" data-tool="${id}" aria-pressed="${tool === id}" title="${label}">${iconHtml}<span>${label}</span></button>`;
    const img = (k) => `<img src="${this.icons[k] || ''}" alt="">`;
    let html = btn('mano', 'Mover', SVG.mano);
    html += btn('cinta', 'Cinta', img('cinta'));
    for (const k of recent) html += btn(k, BUILDINGS[k].short, img(k));
    html += '<span class="sep" aria-hidden="true"></span>';
    html += `<button class="tool" data-act="undo" title="Deshacer (Ctrl+Z)" ${this.canUndo ? '' : 'disabled'}>${SVG.deshacer}<span>Deshacer</span></button>`;
    // Copiar un trozo; con algo copiado, el botón pasa a Pegar (y tocarlo otra vez vuelve a Copiar)
    const pasting = this.ctl.blueprint && tool !== 'copiar';
    html += `<button class="tool" data-act="copy" aria-pressed="${tool === 'copiar' || tool === 'pegar'}" title="${pasting ? 'Pegar lo copiado' : 'Copiar un trozo'}">${pasting ? SVG.pegar : SVG.copiar}<span>${pasting ? 'Pegar' : 'Copiar'}</span></button>`;
    html += btn('borrar', 'Quitar', SVG.borrar);
    html += `<button class="tool more ${this.tutTool === 'panel' ? 'tut' : ''}" data-act="panel" title="Catálogo">${SVG.mas}<span>Más</span></button>`;
    bar.innerHTML = html;
    bar.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => this.cb.onSelectTool(b.dataset.tool)));
    bar.querySelector('[data-act=undo]').addEventListener('click', () => this.cb.onUndo());
    bar.querySelector('[data-act=copy]').addEventListener('click', () => {
      const t = this.ctl.tool;
      this.cb.onSelectTool(t === 'pegar' || !this.ctl.blueprint ? 'copiar' : 'pegar');
    });
    bar.querySelector('[data-act=panel]').addEventListener('click', () => this.openPanel(state));
  }

  setUndo(on) {
    this.canUndo = on;
    const b = document.querySelector('#bar [data-act=undo]');
    if (b) b.disabled = !on;
  }

  // ---- Estadísticas de producción ----
  // `arrivals`: { item: [tiempos ms] } de lo que ha llegado a la nave (lo apunta main.js)
  openStats(state, arrivals) {
    this.statsOpen = true;
    $('stats').hidden = false;
    this.renderStats(state, arrivals);
  }

  closeStats() { this.statsOpen = false; $('stats').hidden = true; }

  renderStats(state, arrivals) {
    if (!this.statsOpen) return;
    const now = performance.now();
    const WIN = 30000;
    const o = currentOrder(state);
    const rates = Object.entries(arrivals)
      .map(([item, ts]) => [item, ts.filter((t) => now - t < WIN).length / (WIN / 1000)])
      .filter(([, r]) => r > 0).sort((a, b) => b[1] - a[1]);
    const icon = (k) => `<img src="${this.icons[k] || ''}" alt="">`;
    let html = '<h3>Llegando a la nave (últimos 30 s)</h3>';
    if (!rates.length) html += '<p class="snote">Todavía no llega nada. La nave espera, la junta también.</p>';
    for (const [item, r] of rates) {
      const want = item === o.item;
      html += `<div class="srow ${want ? 'want' : ''}">${icon('item_' + item)}<span class="sname">${ITEMS[item].name}${want && o.rate ? ` <small>(pedido: mín. ${num(minRate(o))}/s)</small>` : ''}</span><span class="sval">${num(r)}/s</span></div>`;
    }
    // máquinas: cuántas hay de cada tipo y cuántas están trabajando ahora
    const count = {};
    for (const k in state.entities) {
      const e = state.entities[k];
      if (e.kind === 'cinta' || e.kind === 'puente' || e.kind === 'divisor') continue;
      const c = count[e.kind] || (count[e.kind] = { n: 0, busy: 0 });
      c.n++;
      if (e.kind === 'extractor' ? e.out.length < 4 : e.busy) c.busy++;
    }
    const kinds = Object.keys(count);
    html += '<h3>Máquinas trabajando</h3>';
    if (!kinds.length) html += '<p class="snote">Ni una. Las máquinas no se montan solas (todavía).</p>';
    for (const k of kinds) {
      const c = count[k], pct = Math.round((c.busy / c.n) * 100);
      html += `<div class="srow">${icon(k)}<span class="sname">${BUILDINGS[k].name} × ${c.n}<div class="sbar"><i style="width:${pct}%"></i></div></span><span class="sval">${pct}%</span></div>`;
    }
    html += '<p class="snote">Si una máquina está casi siempre parada, le falta material o se le atasca la salida.</p>';
    $('statsBody').innerHTML = html;
  }

  // ---- Tutorial: una tarjeta con el paso actual ----
  showTutorial(step, index, total) {
    const el = $('tutorial');
    if (!step) { el.hidden = true; this.placeMemo(); return; }
    $('tutStep').textContent = `Tutorial · paso ${index + 1} de ${total}`;
    $('tutText').textContent = step.text;
    $('tutSkip').textContent = step.last ? '¡Entendido!' : 'Saltar tutorial';
    el.hidden = false;
    el.classList.remove('tut-new'); void el.offsetWidth; el.classList.add('tut-new');
    this.placeMemo();
  }

  // Los comunicados van debajo de lo que haya arriba (dinero o tutorial)
  placeMemo() {
    const below = !$('tutorial').hidden ? $('tutorial') : $('order');
    $('memo').style.top = `${below.getBoundingClientRect().bottom + 10}px`;
  }

  // ---- Catálogo lateral: elegir, comprar y mejorar ----
  get panelOpen() { return $('panel').classList.contains('open'); }

  openPanel(state) {
    this.renderPanel(state);
    $('scrim').hidden = false;
    $('panel').classList.add('open');
    $('panel').setAttribute('aria-hidden', 'false');
  }

  renderPanel(state) {
    const list = $('panelList');
    const scroll = list.scrollTop;
    let html = '';
    for (const cat of CATEGORIES) {
      let rows = '';
      for (const k in BUILDINGS) {
        const b = BUILDINGS[k];
        if (b.category !== cat.id) continue;
        const img = `<img src="${this.icons[k] || ''}" alt="">`;
        const flow = this.flowHtml(k, state);
        if (state.unlocked.includes(k)) {
          rows += `<div class="entry ${this.tutTool === k ? 'tut' : ''}"><button class="entry-main" data-k="${k}">${img}<span><b>${b.name}</b>${flow}<small>${b.desc} <i>${rateText(k, state)}</i></small></span></button></div>`;
        } else {
          const later = (unlockedBy(k)?.planet ?? 99) > state.planet;
          rows += `<div class="entry locked ${later ? 'soon' : ''}"><div class="entry-main">${img}<span><b>${b.name}</b>${flow}<small>${unlockText(k, state)}</small></span></div></div>`;
        }
      }
      if (rows) html += `<div class="cat">${cat.name}</div>${rows}`;
    }
    list.innerHTML = html;
    list.scrollTop = scroll;
    list.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('click', () => {
      this.closePanel();
      this.cb.onSelectTool(el.dataset.k, true);
    }));
  }

  // Lo que entra → lo que sale, con dibujos (para encontrar de un vistazo quién hace muelles)
  flowHtml(kind, state) {
    const icon = (t, n = 1) => `<span class="fi" title="${ITEMS[t].name}">${n > 1 ? `<em>${n}</em>` : ''}<img src="${this.icons['item_' + t] || ''}" alt="${n} ${ITEMS[t].name}"></span>`;
    const r = BUILDINGS[kind].recipe;
    if (r) {
      const ins = Object.entries(r.in).map(([t, n]) => icon(t, n)).join('<i class="fop">+</i>');
      return `<span class="flow">${ins}<i class="fop">→</i>${icon(r.out)}</span>`;
    }
    if (kind === 'extractor') {
      const res = PLANETS[Math.min(state.planet, PLANETS.length - 1)].resources;
      return `<span class="flow"><i class="fop">⛏</i>${res.map((t) => icon(t)).join('<i class="fop">/</i>')}</span>`;
    }
    return '';
  }

  closePanel() {
    $('scrim').hidden = true;
    $('panel').classList.remove('open');
    $('panel').setAttribute('aria-hidden', 'true');
  }

  // ---- Pedido ----
  renderOrder(state, celebrate = false) {
    const o = currentOrder(state);
    const rate = o.rate ? orderRate(state) : 0;
    const k = `${state.planet}:${state.orderIndex}:${state.orderProgress}:${state.planetDone}:${rate.toFixed(1)}`;
    if (k === this.lastOrderKey && !celebrate) return;
    this.lastOrderKey = k;
    const total = PLANETS[state.planet].orders.length;
    $('orderIcon').src = this.icons['item_' + o.item] || '';
    $('orderPlanet').textContent = `Planeta ${state.planet + 1} · ${PLANETS[state.planet].nick}`;
    $('orderTitle').textContent = !o.bonus ? `Pedido ${state.orderIndex + 1} de ${total}`
      : hasNextPlanet(state) ? 'Pedido extra' : `Pedido extra · planeta ${state.planet + 2} en obras`;
    $('orderCount').textContent = `${state.orderProgress} / ${o.amount} ${ITEMS[o.item].plural}`;
    // ritmo: lo que llega más despacio que el mínimo no cuenta
    const r = $('orderRate');
    r.hidden = !o.rate;
    if (o.rate) {
      const min = minRate(o);
      const ok = rate >= min - 1e-9;
      r.textContent = `Ritmo ${num(rate)}/s · mín. ${num(min)}/s${ok ? ' ✓' : ' · no cuenta'}`;
      r.classList.toggle('slow', !ok);
    }
    const canLaunch = state.planetDone && hasNextPlanet(state);
    $('launchBtn').hidden = !canLaunch;
    if (canLaunch) $('launchBtn').textContent = `Despegar al planeta ${state.planet + 2}`;
    $('orderFill').style.width = `${Math.min(100, (state.orderProgress / o.amount) * 100)}%`;
    if (celebrate) {
      const el = $('order');
      el.classList.remove('done');
      void el.offsetWidth;
      el.classList.add('done');
    }
  }

  // ---- Comunicados de la corporación ----
  memo(text) {
    this.memoQueue.push(text);
    if (!this.memoTimer && $('memo').hidden) this.nextMemo();
  }

  // Al cambiar de planeta o de partida, lo pendiente ya no viene a cuento
  clearMemos() {
    this.memoQueue.length = 0;
    this.nextMemo();
  }

  nextMemo() {
    clearTimeout(this.memoTimer);
    this.memoTimer = null;
    const text = this.memoQueue.shift();
    if (!text) { $('memo').hidden = true; return; }
    $('memoText').textContent = text;
    // el comunicado va justo debajo de la etiqueta del pedido, que cambia de alto
    this.placeMemo();
    $('memo').hidden = false;
    const ms = Math.min(11000, 3500 + text.length * 45);
    this.memoTimer = setTimeout(() => this.nextMemo(), ms);
  }

  hint(text) {
    const el = $('hint');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => { el.hidden = true; }, 1600);
  }

  // ---- Ficha de edificio ----
  showInspect(e, state) {
    if (!e) return this.hideInspect();
    this.inspected = e;
    this.shipOpen = false;
    $('inspectIcon').src = this.icons[e.kind] || '';
    $('inspectName').textContent = BUILDINGS[e.kind].name;
    $('inspectInfo').textContent = describe(e, state);
    $('inspectRotate').hidden = false;
    $('inspectRemove').hidden = false;
    this.renderOuts(e);
    $('inspect').hidden = false;
  }

  // Divisor: botones para abrir/cerrar cada salida, con la flecha hacia donde sale en pantalla
  renderOuts(e) {
    const box = $('inspectOuts');
    if (!e || e.kind !== 'divisor') { box.hidden = true; this.outsKey = ''; return; }
    // Solo se repinta si algo cambió: si se rehace el botón entre que pulsas y sueltas
    // el ratón, el navegador no da el clic (en táctil casi no se notaba)
    const key = `${e.id}:${e.dir}:${(e.outs || []).join()}`;
    if (key === this.outsKey && !box.hidden) return;
    this.outsKey = key;
    const ARROW = ['→', '↓', '←', '↑'];
    const dirs = [(e.dir + 3) % 4, e.dir, (e.dir + 1) % 4];
    const outs = e.outs || [true, true, true];
    box.innerHTML = 'Salidas:' + dirs.map((d, i) =>
      `<button class="out ${outs[i] ? '' : 'off'}" data-out="${i}" aria-pressed="${outs[i]}" title="${outs[i] ? 'Abierta' : 'Cerrada'}">${ARROW[d]}</button>`).join('');
    box.querySelectorAll('[data-out]').forEach((b) => b.addEventListener('click', () => this.cb.onToggleOut(Number(b.dataset.out))));
    box.hidden = false;
  }

  // La nave no se gira ni se quita: solo se mira
  showShip(state) {
    this.inspected = null;
    this.shipOpen = true;
    $('inspectIcon').src = this.icons.nave || '';
    $('inspectName').textContent = 'Tu nave';
    $('inspectInfo').textContent = shipText(state);
    $('inspectRotate').hidden = true;
    $('inspectRemove').hidden = true;
    $('inspectOuts').hidden = true;
    $('inspect').hidden = false;
  }

  refreshInspect(state) {
    if ($('inspect').hidden) return;
    if (this.shipOpen) { $('inspectInfo').textContent = shipText(state); return; }
    if (!this.inspected) return;
    const e = this.inspected;
    if (state.entities[`${e.x},${e.y}`] !== e) return this.hideInspect();
    $('inspectInfo').textContent = describe(e, state);
    if (e.kind === 'divisor') this.renderOuts(e);
  }

  hideInspect() {
    this.inspected = null;
    this.shipOpen = false;
    $('inspect').hidden = true;
  }

  get inspectOpen() { return !$('inspect').hidden; }
}

// Números con coma y sin decimales sobrantes: 2,5 · 5 · 7,5
export const num = (v) => (Math.round(v * 100) / 100).toLocaleString('es-ES');

// Ritmo de un tipo de edificio a su nivel actual
export function rateText(kind) {
  switch (kind) {
    case 'cinta': return `Hasta ${num(beltRate())} objetos/s`;
    case 'divisor': return `Tan rápido como las cintas (${num(beltRate())}/s)`;
    case 'puente': return `Se pone solo al cruzar una cinta con otra. Tan rápido como las cintas (${num(beltRate())}/s)`;
    case 'extractor': return `${num(extractorRate())} por segundo de lo que tenga debajo`;
    default: {
      const r = BUILDINGS[kind]?.recipe;
      if (!r) return '';
      const per = 1 / craftTime(kind);
      const ins = Object.entries(r.in).map(([t, n]) => `${num(n * per)} ${ITEMS[t].name.toLowerCase()}`).join(' + ');
      return `${ins} → ${num(per)} ${ITEMS[r.out].name.toLowerCase()} por segundo`;
    }
  }
}

function describe(e, state) {
  const n = (t) => ITEMS[t].name.toLowerCase();
  switch (e.kind) {
    case 'cinta':
      return `${rateText('cinta', state)} · lleva ${e.items.length}`;
    case 'puente': {
      const l = e.lanes.map((it) => (it ? n(it.type) : 'nada'));
      return `Por debajo: ${l[0]} · por encima: ${l[1]}`;
    }
    case 'divisor':
      return e.item ? `Lleva: ${n(e.item.type)}` : 'Vacío';
    case 'extractor': {
      const node = state.world.nodes[`${e.x},${e.y}`];
      const what = node ? ITEMS[node].name.toLowerCase() : 'nada';
      return `Saca ${what} · ${num(extractorRate())}/s${e.out.length >= 4 ? ' · salida atascada' : ''}`;
    }
    default: {
      const r = BUILDINGS[e.kind]?.recipe;
      if (!r) return '';
      const parts = Object.keys(r.in).map((t) => `${e.inv[t] || 0}/${MACHINE_BUFFER} ${n(t)}`);
      return `${rateText(e.kind, state)}. Dentro: ${parts.join(', ')} · ${e.busy ? 'trabajando' : 'esperando'}`;
    }
  }
}
