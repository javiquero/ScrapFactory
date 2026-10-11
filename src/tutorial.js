// Tutorial inicial: una tarjeta con el paso actual que avanza sola al hacerlo.
// Solo LEE la partida (y unas marcas de la interfaz); nunca la cambia.
// Cubre: moverse, sacar chatarra, girar, cintas hasta la nave, y los pedidos 1 y 2.

const has = (state, kind) => Object.values(state.entities).some((e) => e.kind === kind);

export const STEPS = [
  {
    text: 'Arrastra el dedo por el mapa para moverte. Con dos dedos (o la rueda del ratón) te acercas y te alejas.',
    done: (s, ui) => ui.panned > 250,
  },
  {
    tool: 'extractor',
    text: 'Elige «Extraer» en la barra de abajo y tócalo encima de un montón de chatarra (las manchas marrones).',
    done: (s) => has(s, 'extractor'),
  },
  {
    text: 'La rampa amarilla del extractor marca por dónde sale la chatarra. Toca el extractor para girarlo hacia donde quieras llevarla.',
    done: (s, ui) => ui.rotated,
  },
  {
    tool: 'cinta',
    text: 'Elige «Cinta» y arrastra desde la rampa del extractor hasta tu nave. La nave recibe por cualquiera de sus lados.',
    done: (s) => (s.delivered.chatarra || 0) > 0,
  },
  {
    text: '¡Llega chatarra! Completa el primer pedido. Si va lento, pon más extractores: dos llenan una cinta. Mantén pulsado uno para copiarlo.',
    done: (s) => s.orderIndex >= 1,
  },
  {
    tool: 'prensa',
    text: '¡Pedido cumplido! Chatarrex te manda la prensa: convierte chatarra en placas. Ponla en el camino de la chatarra (encima de la cinta la sustituye) y tócala para girar su salida hacia la nave.',
    done: (s) => has(s, 'prensa'),
  },
  {
    text: 'Haz que las placas lleguen a la nave y completa el segundo pedido. Si te equivocas, tienes «Deshacer» abajo.',
    done: (s) => s.orderIndex >= 2,
  },
  {
    last: true,
    text: '¡Ya sabes lo básico! Cada pedido cumplido desbloquea máquinas. Los grandes piden un ritmo mínimo (lo ves bajo el pedido): si no llegas, monta más líneas en paralelo.',
    done: () => false,
  },
];

const KEY = 'scrapfactory.tutorial.v1';

export class Tutorial {
  constructor({ ui, store }) {
    this.ui = ui;
    this.store = store;
    this.flags = { panned: 0, rotated: false };
    const saved = Number(store.get(KEY));
    this.index = Number.isFinite(saved) && store.get(KEY) !== null ? saved : -1; // -1: apagado
  }

  get active() { return this.index >= 0 && this.index < STEPS.length; }

  start() { this.set(0); this.flags = { panned: 0, rotated: false }; }
  stop() { this.set(STEPS.length); }

  set(i) {
    this.index = i;
    this.store.set(KEY, String(i));
    this.render();
  }

  render() {
    const step = this.active ? STEPS[this.index] : null;
    this.ui.tutTool = step?.tool || null;
    this.ui.showTutorial(step, this.index, STEPS.length);
  }

  // Se llama a menudo desde el bucle: si el paso está hecho, pasa al siguiente
  // (saltando los que ya estuvieran hechos, por si el jugador va por delante)
  check(state) {
    if (!this.active) return false;
    let i = this.index;
    while (i < STEPS.length && STEPS[i].done(state, this.flags)) i++;
    if (i === this.index) return false;
    this.set(i);
    return true;
  }
}
