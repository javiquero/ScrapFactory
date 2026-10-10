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

// `value`: lo que paga Chatarrex por cada unidad que llega a la nave.
export const ITEMS = {
  chatarra:  { name: 'Chatarra', plural: 'chatarra', value: 1 },
  placa:     { name: 'Placa prensada', plural: 'placas', value: 3 },
  alambre:   { name: 'Alambre', plural: 'rollos de alambre', value: 3 },
  engranaje: { name: 'Engranaje', plural: 'engranajes', value: 8 },
  tornillos: { name: 'Tornillos', plural: 'bolsas de tornillos', value: 4 },
  muelle:    { name: 'Muelle', plural: 'muelles', value: 7 },
  mecanismo: { name: 'Mecanismo', plural: 'mecanismos', value: 20 },
  carcasa:   { name: 'Carcasa', plural: 'carcasas', value: 12 },
  motor:     { name: 'Motor', plural: 'motores', value: 45 },
  robot:     { name: 'Robot de limpieza', plural: 'robots de limpieza', value: 120 },
  cristal:   { name: 'Cristal roto', plural: 'cristal roto', value: 1 },
  vidrio:    { name: 'Vidrio', plural: 'vidrios', value: 3 },
  ventana:   { name: 'Ventana', plural: 'ventanas', value: 8 },
  panel:     { name: 'Panel solar', plural: 'paneles solares', value: 30 },
};

// Nodos de recursos del suelo (ver docs/planetas.md para los 10 previstos)
export const NODES = {
  chatarra: { name: 'Vertedero de chatarra', item: 'chatarra' },
  cristal:  { name: 'Cráter de cristales', item: 'cristal' },
};

// La nave del jugador: única, fija, de 2×2 casillas. Recibe por todos sus bordes.
export const SHIP_SIZE = 2;

// ---- Niveles y ritmos ----------------------------------------------------------
// Todo está cuadrado para que, al mismo nivel:
//   2 extractores llenan 1 cinta, y 1 cinta llena alimenta justo 1 prensa.
//   1 prensa saca justo las placas que necesita 1 ensambladora.
// Las mejoras se compran con dinero y afectan a TODOS los edificios de ese tipo.
export const MAX_LEVEL = 3;
export const LEVEL_MULT = [0, 1, 1.5, 2];            // por nivel (índice 1..3)
export const BELT_SPACING = 0.5;                     // 2 objetos por casilla como mucho
export const BELT_BASE_SPEED = 2.5;                  // casillas/s a nivel 1 → 5 objetos/s
export const EXTRACTOR_BASE_RATE = 2.5;              // objetos/s a nivel 1 (media cinta)
export const LEVELED = ['cinta', 'extractor', 'prensa', 'ensambladora', 'trefiladora', 'cortadora', 'bobinadora', 'montadora', 'soldadora', 'motorera', 'robotica', 'horno', 'cristaleria', 'montasolar'];

export const baseLevels = () => Object.fromEntries(LEVELED.map((k) => [k, 1]));
export const beltSpeed = (lvl) => BELT_BASE_SPEED * LEVEL_MULT[lvl || 1];
export const beltRate = (lvl) => beltSpeed(lvl) / BELT_SPACING;
export const extractorRate = (lvl) => EXTRACTOR_BASE_RATE * LEVEL_MULT[lvl || 1];
export const craftTime = (kind, lvl) => BUILDINGS[kind].recipe.time / LEVEL_MULT[lvl || 1];

// `price`: lo que cuesta comprarlo en el catálogo (0 = se tiene desde el principio).
export const BUILDINGS = {
  cinta: { name: 'Cinta', short: 'Cinta', category: 'logistica', price: 0,
    desc: 'Mueve cosas. Arrastra el dedo para trazar el recorrido.' },
  divisor: { name: 'Divisor', short: 'Divisor', category: 'logistica', price: 80,
    desc: 'Reparte lo que entra por detrás entre izquierda, frente y derecha.' },
  puente: { name: 'Puente', short: 'Puente', category: 'logistica', price: 60,
    desc: 'Cruza dos cintas: una pasa por encima de la otra. Lo que entra por un lado sale por el de enfrente.' },
  extractor: { name: 'Extractor', short: 'Extraer', category: 'extraccion', price: 0, onNode: true,
    desc: 'Se coloca sobre un recurso del suelo y lo va sacando.' },

  // ---- Planeta 1: todo sale de la chatarra ----
  prensa: { name: 'Prensa', short: 'Prensa', category: 'basicas', price: 50,
    desc: 'Aprieta fuerte, como la jornada laboral.',
    recipe: { in: { chatarra: 2 }, out: 'placa', time: 0.4 } },
  trefiladora: { name: 'Trefiladora', short: 'Trefilar', category: 'basicas', price: 200,
    desc: 'Estira la chatarra hasta dejarla en alambre. Como tu paciencia.',
    recipe: { in: { chatarra: 2 }, out: 'alambre', time: 0.4 } },
  ensambladora: { name: 'Ensambladora', short: 'Montar', category: 'piezas', price: 150,
    desc: 'Engranajes. No preguntes para qué.',
    recipe: { in: { placa: 2, chatarra: 1 }, out: 'engranaje', time: 0.8 } },
  cortadora: { name: 'Cortadora', short: 'Cortar', category: 'piezas', price: 250,
    desc: 'Una sierra que convierte placas en tornillos. Mantén los dedos lejos.',
    recipe: { in: { placa: 1 }, out: 'tornillos', time: 0.4 } },
  bobinadora: { name: 'Bobinadora', short: 'Bobinar', category: 'piezas', price: 350,
    desc: 'Enrolla alambre hasta que se rinde y se convierte en muelle.',
    recipe: { in: { alambre: 2 }, out: 'muelle', time: 0.8 } },
  montadora: { name: 'Montadora', short: 'Montadora', category: 'conjuntos', price: 500,
    desc: 'Atornilla engranajes y saca mecanismos. Nadie sabe qué mueven.',
    recipe: { in: { engranaje: 1, tornillos: 1 }, out: 'mecanismo', time: 0.8 } },
  soldadora: { name: 'Soldadora', short: 'Soldar', category: 'conjuntos', price: 600,
    desc: 'Suelda placa y alambre en una carcasa. Gafas no incluidas.',
    recipe: { in: { placa: 1, alambre: 1 }, out: 'carcasa', time: 0.8 } },
  motorera: { name: 'Motorera', short: 'Motores', category: 'conjuntos', price: 900,
    desc: 'Mecanismo + muelle = motor. Ingeniería de primer nivel (del sótano).',
    recipe: { in: { mecanismo: 1, muelle: 1 }, out: 'motor', time: 1.6 } },
  robotica: { name: 'Línea de robots', short: 'Robots', category: 'conjuntos', price: 1400,
    desc: 'Mete un motor en una carcasa y sale un robot de limpieza. Limpiará tu despacho, no el suyo.',
    recipe: { in: { motor: 1, carcasa: 1 }, out: 'robot', time: 1.6 } },

  // ---- Planeta 2: cristal ----
  horno: { name: 'Horno', short: 'Horno', category: 'basicas', price: 400,
    desc: 'Funde el cristal roto en vidrio. Lo que otros tiraron.',
    recipe: { in: { cristal: 2 }, out: 'vidrio', time: 0.4 } },
  cristaleria: { name: 'Cristalería', short: 'Cristal', category: 'piezas', price: 800,
    desc: 'Encaja vidrio en un marco de placa. Para que la junta vea el paisaje.',
    recipe: { in: { placa: 1, vidrio: 1 }, out: 'ventana', time: 0.4 } },
  montasolar: { name: 'Montadora solar', short: 'Solar', category: 'conjuntos', price: 1500,
    desc: 'Ventana + engranaje = panel solar. Energía limpia de origen dudoso.',
    recipe: { in: { ventana: 1, engranaje: 1 }, out: 'panel', time: 0.8 } },
};

export const CATEGORIES = [
  { id: 'logistica', name: 'Logística' },
  { id: 'extraccion', name: 'Extracción' },
  { id: 'basicas', name: 'Transformar' },
  { id: 'piezas', name: 'Piezas' },
  { id: 'conjuntos', name: 'Conjuntos' },
];

export const MACHINE_BUFFER = 10;  // máximo de cada ingrediente guardado
export const OUTPUT_BUFFER = 4;    // máximo de productos esperando salir

// Lo que cuesta subir un tipo de edificio al nivel `to` (2 o 3). Afecta a todos los de ese tipo.
export function upgradeCost(kind, to) {
  const base = kind === 'cinta' ? 300 : kind === 'extractor' ? 250 : Math.max(200, BUILDINGS[kind].price * 2);
  return to === 2 ? base : base * 3;
}

// ---- Planetas ---------------------------------------------------------------------
// Cada planeta es un mapa nuevo. Cambiar de planeta = recurso nuevo (docs/planetas.md).
// El planeta 1 tiene toda la cadena larga de la chatarra. Cada pedido paga `pay`.
// `shop`: lo que se puede comprar a partir de ese planeta.
export const PLANETS = [
  {
    name: 'SC-7',
    nick: 'El Vertedero',
    resources: ['chatarra'],
    ground: 0x8cc56a,
    shop: ['cinta', 'extractor', 'divisor', 'puente', 'prensa', 'trefiladora', 'ensambladora', 'cortadora', 'bobinadora', 'montadora', 'soldadora', 'motorera', 'robotica'],
    orders: [
      { item: 'chatarra', amount: 40, pay: 60 },
      { item: 'placa', amount: 40, pay: 120 },
      { item: 'chatarra', amount: 120, pay: 150 },
      { item: 'engranaje', amount: 30, pay: 200 },
      { item: 'alambre', amount: 60, pay: 250 },
      { item: 'placa', amount: 150, pay: 250 },
      { item: 'tornillos', amount: 80, pay: 300 },
      { item: 'engranaje', amount: 100, pay: 350 },
      { item: 'mecanismo', amount: 30, pay: 450 },
      { item: 'muelle', amount: 50, pay: 450 },
      { item: 'mecanismo', amount: 80, pay: 500 },
      { item: 'carcasa', amount: 40, pay: 600 },
      { item: 'alambre', amount: 250, pay: 500 },
      { item: 'tornillos', amount: 250, pay: 550 },
      { item: 'motor', amount: 20, pay: 900 },
      { item: 'carcasa', amount: 120, pay: 800 },
      { item: 'motor', amount: 60, pay: 1000 },
      { item: 'robot', amount: 10, pay: 1500 },
      { item: 'mecanismo', amount: 200, pay: 1200 },
      { item: 'motor', amount: 120, pay: 1500 },
      { item: 'robot', amount: 40, pay: 2000 },
      { item: 'engranaje', amount: 400, pay: 1500 },
      { item: 'motor', amount: 200, pay: 2200 },
      { item: 'carcasa', amount: 300, pay: 2000 },
      { item: 'robot', amount: 100, pay: 4000 },
    ],
  },
  {
    name: 'SC-12',
    nick: 'Los Cristales',
    resources: ['chatarra', 'cristal'],
    ground: 0x84c79a,
    shop: ['horno', 'cristaleria', 'montasolar'],
    orders: [
      { item: 'cristal', amount: 40, pay: 300 },
      { item: 'vidrio', amount: 40, pay: 400 },
      { item: 'placa', amount: 100, pay: 300 },
      { item: 'ventana', amount: 40, pay: 700 },
      { item: 'engranaje', amount: 80, pay: 500 },
      { item: 'ventana', amount: 120, pay: 900 },
      { item: 'panel', amount: 20, pay: 1500 },
      { item: 'vidrio', amount: 200, pay: 800 },
      { item: 'panel', amount: 60, pay: 1800 },
      { item: 'ventana', amount: 250, pay: 1500 },
      { item: 'motor', amount: 60, pay: 1500 },
      { item: 'panel', amount: 120, pay: 2500 },
      { item: 'robot', amount: 30, pay: 2500 },
      { item: 'panel', amount: 200, pay: 3000 },
      { item: 'panel', amount: 350, pay: 5000 },
    ],
  },
];

export const planetAt = (p) => PLANETS[Math.min(p, PLANETS.length - 1)];

// Lo que se puede comprar estando en el planeta `p` (lo de antes sigue a la venta)
export function shopAt(p) {
  const out = [];
  for (let i = 0; i <= Math.min(p, PLANETS.length - 1); i++) for (const k of PLANETS[i].shop) if (!out.includes(k)) out.push(k);
  return out;
}

// Lo que se tiene gratis desde el principio
export const STARTING_UNLOCKS = Object.keys(BUILDINGS).filter((k) => BUILDINGS[k].price === 0);

// Pedido número `index` del planeta `p`. Tras el último, pedidos extra sin fin
// (para quien no quiera despegar todavía).
export function orderAt(p, index) {
  const orders = planetAt(p).orders;
  if (index < orders.length) return orders[index];
  const pool = [...new Set(orders.slice(-6).map((o) => o.item))];
  const k = index - orders.length;
  const item = pool[k % pool.length];
  const last = [...orders].reverse().find((o) => o.item === item);
  const f = 1 + k * 0.25;
  return { item, amount: Math.round((last.amount * f) / 10) * 10, pay: Math.round((last.pay * f) / 10) * 10, bonus: true };
}
