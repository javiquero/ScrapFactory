// Interfaz en HTML por encima del lienzo: pedido, barra rápida, catálogo, comunicados.

import { BUILDINGS, CATEGORIES, ITEMS, ORDERS, MACHINE_BUFFER, beltRate, extractorRate, craftTime } from './defs.js';
import { currentOrder } from './state.js';

const $ = (id) => document.getElementById(id);

const SVG = {
  mano: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17V8a2 2 0 0 1 4 0v7M15 14V6a2 2 0 0 1 4 0v8M19 14V8a2 2 0 0 1 4 0v9c0 6-3.5 10-8.5 10-3.5 0-5.5-2-7.5-5l-2.5-4a2 2 0 0 1 3.2-2.4L11 18"/></svg>',
  girar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M25 16a9 9 0 1 1-3-6.7"/><path d="M23 4v6h-6"/></svg>',
  borrar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h20M13 9V6h6v3M9 9l1.5 17h11L23 9M14 14v8M18 14v8"/></svg>',
  mas: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="5" width="9" height="9" rx="2.5"/><rect x="18" y="5" width="9" height="9" rx="2.5"/><rect x="5" y="18" width="9" height="9" rx="2.5"/><path d="M22.5 18v9M18 22.5h9"/></svg>',
};

function unlockOrderOf(kind) {
  const i = ORDERS.findIndex((o) => o.unlocks.includes(kind));
  return i >= 0 ? i + 1 : null;
}

export class UI {
  constructor({ icons, ctl, onSelectTool, onRotateTool, onInspectRotate, onInspectRemove, onReset }) {
    this.icons = icons;
    this.ctl = ctl;
    this.cb = { onSelectTool, onRotateTool, onInspectRotate, onInspectRemove, onReset };
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
    $('resetBtn').addEventListener('click', () => {
      if (confirm('¿Empezar una partida nueva? Se pierde la fábrica actual.')) { this.closePanel(); this.cb.onReset(); }
    });
  }

  // ---- Barra rápida ----
  renderBar(state) {
    const bar = $('bar');
    const { tool, dir } = this.ctl;
    const recent = this.ctl.recent.filter((k) => state.unlocked.includes(k)).slice(0, 3);
    const btn = (id, label, iconHtml, extra = '') =>
      `<button class="tool ${extra}" data-tool="${id}" aria-pressed="${tool === id}" title="${label}">${iconHtml}<span>${label}</span></button>`;
    const img = (k) => `<img src="${this.icons[k] || ''}" alt="">`;
    let html = btn('mano', 'Mover', SVG.mano);
    html += btn('cinta', 'Cinta', img('cinta'));
    for (const k of recent) html += btn(k, BUILDINGS[k].short, img(k));
    html += '<span class="sep" aria-hidden="true"></span>';
    html += `<button class="tool" data-act="rotate" title="Girar (R)"><span style="display:block;transform:rotate(${dir * 90}deg)">${SVG.girar}</span><span>Girar</span></button>`;
    html += btn('borrar', 'Quitar', SVG.borrar);
    html += `<button class="tool more" data-act="panel" title="Catálogo">${SVG.mas}<span>Más</span></button>`;
    bar.innerHTML = html;
    bar.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => this.cb.onSelectTool(b.dataset.tool)));
    bar.querySelector('[data-act=rotate]').addEventListener('click', () => this.cb.onRotateTool());
    bar.querySelector('[data-act=panel]').addEventListener('click', () => this.openPanel(state));
  }

  // ---- Catálogo lateral ----
  openPanel(state) {
    const list = $('panelList');
    let html = '';
    for (const cat of CATEGORIES) {
      html += `<div class="cat">${cat.name}</div>`;
      for (const k in BUILDINGS) {
        const b = BUILDINGS[k];
        if (b.category !== cat.id) continue;
        const ok = state.unlocked.includes(k);
        const lock = ok ? `${b.desc} <i>${rateText(k, state)}</i>` : `Se desbloquea al completar el pedido ${unlockOrderOf(k)}.`;
        html += `<button class="entry ${ok ? '' : 'locked'}" data-k="${k}" ${ok ? '' : 'aria-disabled="true"'}>
          <img src="${this.icons[k] || ''}" alt=""><span><b>${b.name}</b><small>${lock}</small></span></button>`;
      }
    }
    list.innerHTML = html;
    list.querySelectorAll('.entry').forEach((el) => el.addEventListener('click', () => {
      if (!state.unlocked.includes(el.dataset.k)) { this.hint('Aún bloqueado'); return; }
      this.closePanel();
      this.cb.onSelectTool(el.dataset.k, true);
    }));
    $('scrim').hidden = false;
    $('panel').classList.add('open');
    $('panel').setAttribute('aria-hidden', 'false');
  }

  closePanel() {
    $('scrim').hidden = true;
    $('panel').classList.remove('open');
    $('panel').setAttribute('aria-hidden', 'true');
  }

  // ---- Pedido ----
  renderOrder(state, celebrate = false) {
    const o = currentOrder(state);
    const k = `${state.orderIndex}:${state.orderProgress}`;
    if (k === this.lastOrderKey && !celebrate) return;
    this.lastOrderKey = k;
    $('orderIcon').src = this.icons['item_' + o.item] || '';
    $('orderTitle').textContent = `Pedido ${state.orderIndex + 1}`;
    $('orderCount').textContent = `${state.orderProgress} / ${o.amount} ${ITEMS[o.item].name.toLowerCase()}`;
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

  nextMemo() {
    clearTimeout(this.memoTimer);
    this.memoTimer = null;
    const text = this.memoQueue.shift();
    if (!text) { $('memo').hidden = true; return; }
    $('memoText').textContent = text;
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
    $('inspectIcon').src = this.icons[e.kind] || '';
    $('inspectName').textContent = BUILDINGS[e.kind].name;
    $('inspectInfo').textContent = describe(e, state);
    $('inspectRotate').hidden = e.kind === 'teletransportador';
    $('inspect').hidden = false;
  }

  refreshInspect(state) {
    if (!this.inspected || $('inspect').hidden) return;
    const e = this.inspected;
    if (state.entities[`${e.x},${e.y}`] !== e) return this.hideInspect();
    $('inspectInfo').textContent = describe(e, state);
  }

  hideInspect() {
    this.inspected = null;
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
    case 'extractor': return `Nivel ${lv.extractor} · ${num(extractorRate(lv.extractor))} chatarra/s`;
    case 'prensa':
    case 'ensambladora': {
      const r = BUILDINGS[kind].recipe;
      const per = 1 / craftTime(kind, lv[kind]);
      const ins = Object.entries(r.in).map(([t, n]) => `${num(n * per)} ${ITEMS[t].name.toLowerCase()}`).join(' + ');
      return `Nivel ${lv[kind]} · ${ins} → ${num(per)} ${ITEMS[r.out].name.toLowerCase()} por segundo`;
    }
    default: return '';
  }
}

function describe(e, state) {
  const n = (t) => ITEMS[t].name.toLowerCase();
  switch (e.kind) {
    case 'cinta':
      return `${rateText('cinta', state)} · lleva ${e.items.length}`;
    case 'divisor':
      return e.item ? `Lleva: ${n(e.item.type)}` : 'Vacío';
    case 'extractor':
      return `${rateText('extractor', state)}${e.out.length >= 4 ? ' · salida atascada' : ''}`;
    case 'prensa':
    case 'ensambladora': {
      const r = BUILDINGS[e.kind].recipe;
      const parts = Object.keys(r.in).map((t) => `${e.inv[t] || 0}/${MACHINE_BUFFER} ${n(t)}`);
      return `${rateText(e.kind, state)}. Dentro: ${parts.join(', ')} · ${e.busy ? 'trabajando' : 'esperando'}`;
    }
    case 'teletransportador': {
      const total = Object.values(state.delivered).reduce((a, b) => a + b, 0);
      return `${total} cosas enviadas a la Tierra`;
    }
    default:
      return '';
  }
}
