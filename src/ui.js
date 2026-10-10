// Interfaz en HTML por encima del lienzo: pedido, barra rápida, catálogo, comunicados.

import { BUILDINGS, CATEGORIES, ITEMS, PLANETS, MACHINE_BUFFER, beltRate, extractorRate, craftTime, shopAt } from './defs.js';
import { currentOrder, hasNextPlanet, nextUpgrade } from './state.js';
import { money, shipText } from './messages.js';
import { rescueCount, RESCUE_SECONDS } from './rescue.js';

const $ = (id) => document.getElementById(id);

const SVG = {
  mano: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17V8a2 2 0 0 1 4 0v7M15 14V6a2 2 0 0 1 4 0v8M19 14V8a2 2 0 0 1 4 0v9c0 6-3.5 10-8.5 10-3.5 0-5.5-2-7.5-5l-2.5-4a2 2 0 0 1 3.2-2.4L11 18"/></svg>',
  deshacer: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13h11a6 6 0 0 1 0 12h-6"/><path d="M14 8l-5 5 5 5"/></svg>',
  girar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M25 16a9 9 0 1 1-3-6.7"/><path d="M23 4v6h-6"/></svg>',
  borrar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h20M13 9V6h6v3M9 9l1.5 17h11L23 9M14 14v8M18 14v8"/></svg>',
  mas: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="5" width="9" height="9" rx="2.5"/><rect x="18" y="5" width="9" height="9" rx="2.5"/><rect x="5" y="18" width="9" height="9" rx="2.5"/><path d="M22.5 18v9M18 22.5h9"/></svg>',
};

// En qué planeta empieza a venderse un edificio
function firstPlanet(kind) {
  const p = PLANETS.findIndex((pl) => pl.shop.includes(kind));
  return p < 0 ? null : p;
}

export class UI {
  constructor({ icons, ctl, onSelectTool, onUndo, onInspectRotate, onInspectRemove, onReset, onLaunch, onBuy, onUpgrade, onTutorial, getState }) {
    this.icons = icons;
    this.ctl = ctl;
    this.cb = { onSelectTool, onUndo, onInspectRotate, onInspectRemove, onReset, onLaunch, onBuy, onUpgrade, onTutorial };
    this.canUndo = false;
    this.tutTool = null;     // herramienta que el tutorial está señalando
    this.tutShop = null;     // y lo que hay que comprar en el catálogo
    this.lastMoney = -1;
    $('launchBtn').addEventListener('click', () => this.cb.onLaunch());
    $('wallet').addEventListener('click', () => this.openPanel(getState()));
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
    let recent = this.ctl.recent.filter((k) => state.unlocked.includes(k)).slice(0, 3);
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
    html += btn('borrar', 'Quitar', SVG.borrar);
    html += `<button class="tool more ${this.tutTool === 'panel' ? 'tut' : ''}" data-act="panel" title="Catálogo">${SVG.mas}<span>Más</span></button>`;
    bar.innerHTML = html;
    bar.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => this.cb.onSelectTool(b.dataset.tool)));
    bar.querySelector('[data-act=undo]').addEventListener('click', () => this.cb.onUndo());
    bar.querySelector('[data-act=panel]').addEventListener('click', () => this.openPanel(state));
  }

  setUndo(on) {
    this.canUndo = on;
    const b = document.querySelector('#bar [data-act=undo]');
    if (b) b.disabled = !on;
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
    const below = !$('tutorial').hidden ? $('tutorial') : $('wallet');
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
    const shop = shopAt(state.planet);
    const coins = state.money || 0;
    let html = '';
    for (const cat of CATEGORIES) {
      let rows = '';
      for (const k in BUILDINGS) {
        const b = BUILDINGS[k];
        if (b.category !== cat.id) continue;
        const owned = state.unlocked.includes(k);
        const img = `<img src="${this.icons[k] || ''}" alt="">`;
        const flow = this.flowHtml(k, state);
        if (owned) {
          const up = nextUpgrade(state, k);
          const side = up
            ? `<button class="buy up" data-up="${k}" data-cost="${up.cost}" ${coins < up.cost ? 'disabled' : ''}>Nivel ${up.to}<small>${money(up.cost)}</small></button>`
            : (state.levels[k] ? '<span class="max">Nivel máx.</span>' : '');
          rows += `<div class="entry"><button class="entry-main" data-k="${k}">${img}<span><b>${b.name}</b>${flow}<small>${b.desc} <i>${rateText(k, state)}</i></small></span></button>
            <div class="entry-side">${side}</div></div>`;
        } else if (shop.includes(k)) {
          rows += `<div class="entry locked"><div class="entry-main">${img}<span><b>${b.name}</b>${flow}<small>${b.desc}</small></span></div>
            <div class="entry-side"><button class="buy ${this.tutShop === k ? 'tut' : ''}" data-buy="${k}" data-cost="${b.price}" ${coins < b.price ? 'disabled' : ''}>Comprar<small>${money(b.price)}</small></button></div></div>`;
        } else {
          const p = firstPlanet(k);
          rows += `<div class="entry locked soon"><div class="entry-main">${img}<span><b>${b.name}</b>${flow}<small>${p == null ? 'Próximamente.' : `Se vende en el planeta ${p + 1}.`}</small></span></div></div>`;
        }
      }
      if (rows) html += `<div class="cat">${cat.name}</div>${rows}`;
    }
    list.innerHTML = html;
    list.scrollTop = scroll;
    $('panelMoney').textContent = money(coins);
    list.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('click', () => {
      this.closePanel();
      this.cb.onSelectTool(el.dataset.k, true);
    }));
    list.querySelectorAll('[data-buy]').forEach((el) => el.addEventListener('click', () => this.cb.onBuy(el.dataset.buy)));
    list.querySelectorAll('[data-up]').forEach((el) => el.addEventListener('click', () => this.cb.onUpgrade(el.dataset.up)));
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

  // Con el catálogo abierto, los botones se encienden en cuanto llega el dinero
  refreshPanelMoney(state) {
    if (!this.panelOpen) return;
    const coins = state.money || 0;
    $('panelMoney').textContent = money(coins);
    $('panelList').querySelectorAll('[data-cost]').forEach((el) => { el.disabled = coins < Number(el.dataset.cost); });
  }

  closePanel() {
    $('scrim').hidden = true;
    $('panel').classList.remove('open');
    $('panel').setAttribute('aria-hidden', 'true');
  }

  // ---- Pedido ----
  renderMoney(state) {
    const m = Math.floor(state.money || 0);
    if (m === this.lastMoney) return;
    const big = this.lastMoney >= 0 && m - this.lastMoney >= 50;
    this.lastMoney = m;
    $('walletAmount').textContent = money(m);
    if (big) {
      const el = $('wallet');
      el.classList.remove('paid');
      void el.offsetWidth;
      el.classList.add('paid');
    }
  }

  renderOrder(state, celebrate = false) {
    this.renderMoney(state);
    const r = state.rescue;
    const got = r ? rescueCount(state) : 0;
    const k = `${state.planet}:${state.orderIndex}:${state.orderProgress}:${state.planetDone}:${r ? r.item + got : ''}`;
    if (k === this.lastOrderKey && !celebrate) return;
    this.lastOrderKey = k;
    $('order').classList.toggle('rescue', !!r);
    if (r) {
      // pedido de rescate: mide un ritmo, no un total
      $('orderIcon').src = this.icons['item_' + r.item] || '';
      $('orderPlanet').textContent = 'Rescate de Chatarrex';
      $('orderTitle').textContent = `${num(r.rate)} ${ITEMS[r.item].plural}/s`;
      $('orderCount').textContent = `${got} / ${r.amount} en ${RESCUE_SECONDS} s · paga ${money(r.pay)}`;
      $('orderFill').style.width = `${Math.min(100, (got / r.amount) * 100)}%`;
      $('launchBtn').hidden = true;
    } else {
      const o = currentOrder(state);
      const total = PLANETS[state.planet].orders.length;
      $('orderIcon').src = this.icons['item_' + o.item] || '';
      $('orderPlanet').textContent = `Planeta ${state.planet + 1} · ${PLANETS[state.planet].nick}`;
      $('orderTitle').textContent = !o.bonus ? `Pedido ${state.orderIndex + 1} de ${total}`
        : hasNextPlanet(state) ? 'Pedido extra' : `Pedido extra · planeta ${state.planet + 2} en obras`;
      $('orderCount').textContent = `${state.orderProgress} / ${o.amount} ${ITEMS[o.item].plural} · paga ${money(o.pay)}`;
      const canLaunch = state.planetDone && hasNextPlanet(state);
      $('launchBtn').hidden = !canLaunch;
      if (canLaunch) $('launchBtn').textContent = `Despegar al planeta ${state.planet + 2}`;
      $('orderFill').style.width = `${Math.min(100, (state.orderProgress / o.amount) * 100)}%`;
    }
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
    $('inspect').hidden = false;
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
    $('inspect').hidden = false;
  }

  refreshInspect(state) {
    if ($('inspect').hidden) return;
    if (this.shipOpen) { $('inspectInfo').textContent = shipText(state); return; }
    if (!this.inspected) return;
    const e = this.inspected;
    if (state.entities[`${e.x},${e.y}`] !== e) return this.hideInspect();
    $('inspectInfo').textContent = describe(e, state);
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
export function rateText(kind, state) {
  const lv = state.levels || {};
  switch (kind) {
    case 'cinta': return `Nivel ${lv.cinta} · hasta ${num(beltRate(lv.cinta))} objetos/s`;
    case 'divisor': return `Tan rápido como las cintas (${num(beltRate(lv.cinta))}/s)`;
    case 'puente': return `Se pone solo al cruzar una cinta con otra. Tan rápido como las cintas (${num(beltRate(lv.cinta))}/s)`;
    case 'extractor': return `Nivel ${lv.extractor} · ${num(extractorRate(lv.extractor))} por segundo de lo que tenga debajo`;
    default: {
      const r = BUILDINGS[kind]?.recipe;
      if (!r) return '';
      const per = 1 / craftTime(kind, lv[kind]);
      const ins = Object.entries(r.in).map(([t, n]) => `${num(n * per)} ${ITEMS[t].name.toLowerCase()}`).join(' + ');
      return `Nivel ${lv[kind]} · ${ins} → ${num(per)} ${ITEMS[r.out].name.toLowerCase()} por segundo`;
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
      return `Saca ${what} · ${num(extractorRate(state.levels.extractor))}/s${e.out.length >= 4 ? ' · salida atascada' : ''}`;
    }
    default: {
      const r = BUILDINGS[e.kind]?.recipe;
      if (!r) return '';
      const parts = Object.keys(r.in).map((t) => `${e.inv[t] || 0}/${MACHINE_BUFFER} ${n(t)}`);
      return `${rateText(e.kind, state)}. Dentro: ${parts.join(', ')} · ${e.busy ? 'trabajando' : 'esperando'}`;
    }
  }
}
