// Definiciones del juego: objetos, edificios, recetas y pedidos.
// Todo lo "de datos" vive aquí para poder ajustar el equilibrio sin tocar la lógica.

export const TILE = 64;          // tamaño de casilla en unidades de mundo (px a zoom 1)
export const MAP_W = 64;
export const MAP_H = 64;
export const TICK_RATE = 20;     // ticks de simulación por segundo
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

export const BELT_SPEED = 2.2; // casillas por segundo

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
    time: 1.2,
    onNode: true,
  },
  prensa: {
    name: 'Prensa',
    short: 'Prensa',
    desc: '2 chatarra → 1 placa. Aprieta fuerte, como la jornada laboral.',
    category: 'produccion',
    recipe: { in: { chatarra: 2 }, out: 'placa', time: 1.6 },
  },
  ensambladora: {
    name: 'Ensambladora',
    short: 'Montar',
    desc: '2 placas + 1 chatarra → 1 engranaje. No preguntes para qué.',
    category: 'produccion',
    recipe: { in: { placa: 2, chatarra: 1 }, out: 'engranaje', time: 3 },
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

export const MACHINE_BUFFER = 8;   // máximo de cada ingrediente guardado
export const OUTPUT_BUFFER = 4;    // máximo de productos esperando salir

// Pedidos de la corporación. Al completar uno se desbloquea lo indicado.
export const ORDERS = [
  { item: 'chatarra', amount: 20, unlocks: ['prensa'] },
  { item: 'placa', amount: 10, unlocks: ['divisor'] },
  { item: 'chatarra', amount: 30, unlocks: ['ensambladora'] },
  { item: 'engranaje', amount: 6, unlocks: [] },
];

export const STARTING_UNLOCKS = ['cinta', 'extractor', 'teletransportador'];

// Pedidos infinitos cuando se acaba la lista
export function orderAt(index) {
  if (index < ORDERS.length) return ORDERS[index];
  const pool = ['placa', 'engranaje', 'chatarra'];
  const k = index - ORDERS.length;
  const item = pool[k % pool.length];
  const base = { placa: 20, engranaje: 8, chatarra: 40 }[item];
  return { item, amount: Math.round(base * (1 + k * 0.35)), unlocks: [] };
}
