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
  platano:  { name: 'Plátano alienígena', color: 0xffd84a, accent: 0xc9a227 },
  placa:    { name: 'Placa prensada', color: 0x8fb3c9, accent: 0x5d7f94 },
  paraguas: { name: 'Paraguas reglamentario', color: 0xff7a8a, accent: 0xc94a5c },
};

// Nodos de recursos del suelo
export const NODES = {
  chatarra: { name: 'Vertedero de chatarra', item: 'chatarra' },
  platano:  { name: 'Platanera alienígena', item: 'platano' },
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
    desc: 'Se coloca sobre un vertedero o una platanera y escupe recursos.',
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
    desc: '1 placa + 2 plátanos → 1 paraguas. No preguntes.',
    category: 'produccion',
    recipe: { in: { placa: 1, platano: 2 }, out: 'paraguas', time: 3 },
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
  { item: 'platano', amount: 15, unlocks: ['divisor'] },
  { item: 'placa', amount: 12, unlocks: ['ensambladora'] },
  { item: 'paraguas', amount: 6, unlocks: [] },
];

export const STARTING_UNLOCKS = ['cinta', 'extractor', 'teletransportador'];

// Pedidos infinitos cuando se acaba la lista
export function orderAt(index) {
  if (index < ORDERS.length) return ORDERS[index];
  const pool = ['placa', 'paraguas', 'chatarra', 'platano'];
  const k = index - ORDERS.length;
  const item = pool[k % pool.length];
  const base = { placa: 20, paraguas: 8, chatarra: 40, platano: 30 }[item];
  return { item, amount: Math.round(base * (1 + k * 0.35)), unlocks: [] };
}
