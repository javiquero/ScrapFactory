// Definiciones del juego: objetos, edificios, recetas y pedidos.
// Todo lo "de datos" vive aquí para poder ajustar el equilibrio sin tocar la lógica.

export const TILE = 64;          // tamaño de casilla en unidades de mundo (px a zoom 1)
export const MAP_W = 64;
export const MAP_H = 64;
export const TICK_RATE = 30;     // ticks de simulación por segundo
export const DT = 1 / TICK_RATE;

// Direcciones: 0 = derecha (E), 1 = abajo (S), 2 = izquierda (O), 3 = arriba (N)
export const DX = [1, 0, -1, 0];
export const DY = [0, 1, 0, -1];
export const opposite = (d) => (d + 2) % 4;

export const ITEMS = {
  chatarra: { name: 'Chatarra', color: 0x9a8f86, accent: 0x6e645c },
  placa:    { name: 'Placa prensada', color: 0x8fb3c9, accent: 0x5d7f94 },
  engranaje: { name: 'Engranaje', color: 0xd9a441, accent: 0x8f6a22 },
};

// Nodos de recursos del suelo
export const NODES = {
  chatarra: { name: 'Vertedero de chatarra', item: 'chatarra' },
};

// ---- Niveles y ritmos ----------------------------------------------------------
// Todo está cuadrado para que, al mismo nivel:
//   2 extractores llenan 1 cinta, y 1 cinta llena alimenta justo 1 prensa.
//   1 prensa saca justo las placas que necesita 1 ensambladora.
// Las mejoras se ganan con pedidos y afectan a TODOS los edificios de ese tipo.
export const MAX_LEVEL = 3;
export const LEVEL_MULT = [0, 1, 1.5, 2];            // por nivel (índice 1..3)
export const BELT_SPACING = 0.5;                     // 2 objetos por casilla como mucho
export const BELT_BASE_SPEED = 2.5;                  // casillas/s a nivel 1 → 5 objetos/s
export const EXTRACTOR_BASE_RATE = 2.5;              // objetos/s a nivel 1 (media cinta)
export const LEVELED = ['cinta', 'extractor', 'prensa', 'ensambladora'];

export const beltSpeed = (lvl) => BELT_BASE_SPEED * LEVEL_MULT[lvl];
export const beltRate = (lvl) => beltSpeed(lvl) / BELT_SPACING;
export const extractorRate = (lvl) => EXTRACTOR_BASE_RATE * LEVEL_MULT[lvl];
export const craftTime = (kind, lvl) => BUILDINGS[kind].recipe.time / LEVEL_MULT[lvl];

export const BUILDINGS = {
  cinta: {
    name: 'Cinta',
    short: 'Cinta',
    desc: 'Mueve cosas. Arrastra el dedo para trazar el recorrido.',
    category: 'logistica',
  },
  divisor: {
    name: 'Divisor',
    short: 'Divisor',
    desc: 'Reparte lo que entra por detrás entre izquierda, frente y derecha.',
    category: 'logistica',
  },
  extractor: {
    name: 'Extractor',
    short: 'Extraer',
    desc: 'Se coloca sobre un vertedero de chatarra y la va sacando.',
    category: 'produccion',
    onNode: true,
  },
  prensa: {
    name: 'Prensa',
    short: 'Prensa',
    desc: '2 chatarra → 1 placa. Aprieta fuerte, como la jornada laboral.',
    category: 'produccion',
    recipe: { in: { chatarra: 2 }, out: 'placa', time: 0.4 },
  },
  ensambladora: {
    name: 'Ensambladora',
    short: 'Montar',
    desc: '2 placas + 1 chatarra → 1 engranaje. No preguntes para qué.',
    category: 'produccion',
    recipe: { in: { placa: 2, chatarra: 1 }, out: 'engranaje', time: 0.8 },
  },
  teletransportador: {
    name: 'Teletransportador',
    short: 'Envío',
    desc: 'Envía todo lo que recibe a Chatarrex S.A. Cuenta para el pedido.',
    category: 'envio',
  },
};

export const CATEGORIES = [
  { id: 'logistica', name: 'Logística' },
  { id: 'produccion', name: 'Producción' },
  { id: 'envio', name: 'Envío' },
];

export const MACHINE_BUFFER = 10;  // máximo de cada ingrediente guardado
export const OUTPUT_BUFFER = 4;    // máximo de productos esperando salir

// Pedidos de la corporación. Al completar uno se desbloquea lo indicado y se
// suben de nivel los edificios de `upgrades`.
export const ORDERS = [
  { item: 'chatarra', amount: 40, unlocks: ['prensa'] },
  { item: 'placa', amount: 40, unlocks: ['divisor'], upgrades: { extractor: 2 } },
  { item: 'chatarra', amount: 150, unlocks: ['ensambladora'], upgrades: { cinta: 2 } },
  { item: 'engranaje', amount: 30, unlocks: [], upgrades: { prensa: 2, ensambladora: 2 } },
  { item: 'placa', amount: 250, unlocks: [], upgrades: { cinta: 3, extractor: 3 } },
  { item: 'engranaje', amount: 120, unlocks: [], upgrades: { prensa: 3, ensambladora: 3 } },
];

// Niveles que corresponden a haber completado `orderIndex` pedidos
export function levelsAfter(orderIndex) {
  const lv = Object.fromEntries(LEVELED.map((k) => [k, 1]));
  for (let i = 0; i < Math.min(orderIndex, ORDERS.length); i++) {
    for (const [k, v] of Object.entries(ORDERS[i].upgrades || {})) lv[k] = Math.max(lv[k], v);
  }
  return lv;
}

export const STARTING_UNLOCKS = ['cinta', 'extractor', 'teletransportador'];

// Pedidos infinitos cuando se acaba la lista
export function orderAt(index) {
  if (index < ORDERS.length) return ORDERS[index];
  const pool = ['placa', 'engranaje', 'chatarra'];
  const k = index - ORDERS.length;
  const item = pool[k % pool.length];
  const base = { placa: 300, engranaje: 150, chatarra: 500 }[item];
  return { item, amount: Math.round((base * (1 + k * 0.35)) / 10) * 10, unlocks: [] };
}
