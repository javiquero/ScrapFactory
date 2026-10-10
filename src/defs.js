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
  // planeta 3: caucho
  caucho:    { name: 'Caucho', plural: 'caucho', value: 1 },
  goma:      { name: 'Goma', plural: 'planchas de goma', value: 4 },
  correa:    { name: 'Correa', plural: 'correas', value: 25 },
  patinete:  { name: 'Patinete', plural: 'patinetes', value: 140 },
  // planeta 4: circuitos viejos
  circuitos: { name: 'Circuitos viejos', plural: 'circuitos viejos', value: 1 },
  chip:      { name: 'Chip', plural: 'chips', value: 5 },
  placabase: { name: 'Placa base', plural: 'placas base', value: 30 },
  consola:   { name: 'Consola retro', plural: 'consolas retro', value: 90 },
  // planeta 5: musgo luminoso
  musgo:     { name: 'Musgo luminoso', plural: 'musgo luminoso', value: 1 },
  biocombustible: { name: 'Biocombustible', plural: 'bidones de biocombustible', value: 5 },
  bateria:   { name: 'Batería', plural: 'baterías', value: 30 },
  dron:      { name: 'Dron', plural: 'drones', value: 140 },
  // planeta 6: lodo tóxico
  lodo:      { name: 'Lodo tóxico', plural: 'lodo tóxico', value: 1 },
  acido:     { name: 'Ácido', plural: 'botes de ácido', value: 6 },
  circuito:  { name: 'Circuito impreso', plural: 'circuitos impresos', value: 30 },
  androide:  { name: 'Androide', plural: 'androides', value: 250 },
  // planeta 7: arena magnética
  arena:     { name: 'Arena magnética', plural: 'arena magnética', value: 1 },
  iman:      { name: 'Imán', plural: 'imanes', value: 6 },
  electroiman: { name: 'Electroimán', plural: 'electroimanes', value: 25 },
  aerodeslizador: { name: 'Aerodeslizador', plural: 'aerodeslizadores', value: 120 },
  // planeta 8: hielo azul
  hielo:     { name: 'Hielo azul', plural: 'hielo azul', value: 1 },
  refrigerante: { name: 'Refrigerante', plural: 'bidones de refrigerante', value: 6 },
  nevera:    { name: 'Nevera', plural: 'neveras', value: 40 },
  criocapsula: { name: 'Criocápsula', plural: 'criocápsulas', value: 150 },
};

// Nodos de recursos del suelo (ver docs/planetas.md para los 10 previstos)
export const NODES = {
  chatarra: { name: 'Vertedero de chatarra', item: 'chatarra' },
  cristal:  { name: 'Cráter de cristales', item: 'cristal' },
  caucho:   { name: 'Montaña de neumáticos', item: 'caucho' },
  circuitos: { name: 'Montón de electrónica', item: 'circuitos' },
  musgo:    { name: 'Pradera de musgo', item: 'musgo' },
  lodo:     { name: 'Charca de lodo', item: 'lodo' },
  arena:    { name: 'Duna magnética', item: 'arena' },
  hielo:    { name: 'Glaciar', item: 'hielo' },
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
export const LEVELED = ['cinta', 'extractor'];  // + todas las máquinas con receta (se añaden tras BUILDINGS)

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

// Máquinas de los planetas 3 a 8: básica (2 recurso → producto), mezcla y producto final
const P = (name, short, price, desc, inp, out, time) => ({ name, short, category: time === 0.4 ? 'basicas' : time === 0.8 ? 'piezas' : 'conjuntos', price, desc, recipe: { in: inp, out, time } });
Object.assign(BUILDINGS, {
  trituradora: P('Trituradora', 'Triturar', 1000, 'Mastica neumáticos viejos y escupe planchas de goma. Huele a domingo de taller.', { caucho: 2 }, 'goma', 0.4),
  vulcanizadora: P('Vulcanizadora', 'Vulcanizar', 1800, 'Cuece goma con un engranaje dentro hasta que sale una correa.', { goma: 1, engranaje: 1 }, 'correa', 0.8),
  patinetera: P('Taller de patinetes', 'Patinetes', 3000, 'Correa más motor: patinete eléctrico para que los directivos lleguen antes al café.', { correa: 1, motor: 1 }, 'patinete', 1.6),
  desguazadora: P('Desguazadora', 'Desguazar', 1500, 'Arranca los chips de la electrónica vieja. Con cariño no, con alicates.', { circuitos: 2 }, 'chip', 0.4),
  grabadora: P('Grabadora de placas', 'Placas base', 2500, 'Monta chips sobre vidrio y salen placas base. Nadie sabe por qué vidrio.', { chip: 1, vidrio: 1 }, 'placabase', 0.8),
  consolera: P('Línea de consolas', 'Consolas', 4000, 'Placa base en una carcasa: consola retro. La junta la llama "inversión estratégica".', { placabase: 1, carcasa: 1 }, 'consola', 1.6),
  fermentador: P('Fermentador', 'Fermentar', 2000, 'Deja pudrir el musgo con estilo hasta que arde. Biocombustible artesano.', { musgo: 2 }, 'biocombustible', 0.4),
  bateriera: P('Envasadora de baterías', 'Baterías', 3500, 'Mete biocombustible en una carcasa y la llama batería. Ingeniería creativa.', { biocombustible: 1, carcasa: 1 }, 'bateria', 0.8),
  dronera: P('Hangar de drones', 'Drones', 5500, 'Batería más motor: un dron. Para vigilar que trabajas. Lo pagas tú.', { bateria: 1, motor: 1 }, 'dron', 1.6),
  destileria: P('Destilería', 'Destilar', 2500, 'Hierve lodo tóxico hasta sacar ácido. No respires. Bueno, respira poco.', { lodo: 2 }, 'acido', 0.4),
  grabadoacido: P('Grabado al ácido', 'Circuitos', 4500, 'Baña chips en ácido y salen circuitos impresos. Guantes no incluidos.', { acido: 1, chip: 1 }, 'circuito', 0.8),
  androidera: P('Fábrica de androides', 'Androides', 7000, 'Un circuito dentro de un robot: androide. Ya tienes compañía (no habla).', { circuito: 1, robot: 1 }, 'androide', 1.6),
  imantador: P('Imantador', 'Imantar', 3000, 'Aprieta la arena magnética hasta hacer imanes. Aleja el móvil.', { arena: 2 }, 'iman', 0.4),
  electroimanes: P('Bobinadora magnética', 'Electroimán', 5500, 'Enrolla alambre alrededor de un imán y sale un electroimán.', { iman: 1, alambre: 1 }, 'electroiman', 0.8),
  aerodeslizadores: P('Hangar de aerodeslizadores', 'Aerodesliz.', 8500, 'Electroimán bajo un panel solar: flota. Más o menos.', { electroiman: 1, panel: 1 }, 'aerodeslizador', 1.6),
  congelador: P('Congelador', 'Congelar', 3500, 'Machaca hielo azul y lo convierte en refrigerante. Abrígate.', { hielo: 2 }, 'refrigerante', 0.4),
  nevereria: P('Montadora de neveras', 'Neveras', 6500, 'Refrigerante en una carcasa: nevera. Para el yogur de la junta directiva.', { refrigerante: 1, carcasa: 1 }, 'nevera', 0.8),
  criogenia: P('Laboratorio criogénico', 'Criogenia', 10000, 'Nevera con circuito: criocápsula. Para congelar directivos hasta que suban las acciones.', { nevera: 1, circuito: 1 }, 'criocapsula', 1.6),
});
for (const k in BUILDINGS) if (BUILDINGS[k].recipe && !LEVELED.includes(k)) LEVELED.push(k);

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
      { item: 'cristal', amount: 40, pay: 400 },
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

// Planetas 3 a 8: misma forma de pedidos. R recurso, B básico, M mezcla, F final,
// O1/O2 lo de planetas anteriores que hace falta para M y F. Las pagas suben por planeta.
function laterOrders(R, B, M, F, O1, O2, mult, firstPay) {
  const list = [
    [R, 60, 1200], [B, 60, 900], [R, 200, 800], [B, 150, 1000], [O1, 100, 1200], [M, 30, 2200],
    [B, 300, 1400], [M, 80, 2400], [O2, 40, 2000], [F, 10, 3500], [M, 150, 3000], [F, 30, 4000],
    [B, 500, 2500], [M, 250, 4000], [F, 60, 5000], [F, 120, 9000],
  ];
  // el primer pedido paga al menos la máquina básica del planeta, para no empezar atascado
  return list.map(([item, amount, pay], i) => ({ item, amount, pay: Math.max(i === 0 ? firstPay : 0, Math.round((pay * mult) / 10) * 10) }));
}
const LATER = [
  ['SC-21', 'La Gomera', 'caucho', 0xc9a36b, ['trituradora', 'vulcanizadora', 'patinetera'], ['caucho', 'goma', 'correa', 'patinete', 'engranaje', 'motor']],
  ['SC-34', 'Silicon Barranco', 'circuitos', 0x9d93b5, ['desguazadora', 'grabadora', 'consolera'], ['circuitos', 'chip', 'placabase', 'consola', 'vidrio', 'carcasa']],
  ['SC-55', 'El Musgal', 'musgo', 0x3f7f86, ['fermentador', 'bateriera', 'dronera'], ['musgo', 'biocombustible', 'bateria', 'dron', 'carcasa', 'motor']],
  ['SC-89', 'La Ciénaga', 'lodo', 0xa8a25a, ['destileria', 'grabadoacido', 'androidera'], ['lodo', 'acido', 'circuito', 'androide', 'chip', 'robot']],
  ['SC-144', 'Las Dunas Raras', 'arena', 0xe6c49a, ['imantador', 'electroimanes', 'aerodeslizadores'], ['arena', 'iman', 'electroiman', 'aerodeslizador', 'alambre', 'panel']],
  ['SC-233', 'El Congelador', 'hielo', 0xdfeaf2, ['congelador', 'nevereria', 'criogenia'], ['hielo', 'refrigerante', 'nevera', 'criocapsula', 'carcasa', 'circuito']],
];
LATER.forEach(([name, nick, res, ground, shop, [R, B, M, F, O1, O2]], i) => {
  const prev = PLANETS[PLANETS.length - 1];
  PLANETS.push({ name, nick, resources: [...prev.resources, res], ground, shop, orders: laterOrders(R, B, M, F, O1, O2, 1 + i * 0.3, BUILDINGS[shop[0]].price + 100) });
});

export const planetAt = (p) => PLANETS[Math.min(p, PLANETS.length - 1)];

// Colores del suelo de cada planeta: manchas claras y oscuras, hierba y tinte de la decoración
export const PLANET_LOOK = [
  { light: 0x9bd078, dark: 0x7fb95e, grass: 0x5d9a45, edge: 0x2f5a2a, tint: 0xffffff },  // 1 verde
  { light: 0x9cd8b8, dark: 0x6fae96, grass: 0x4f8f7a, edge: 0x2a5048, tint: 0xd8f4ff },  // 2 verde azulado
  { light: 0xdcb985, dark: 0xa9834f, grass: 0x8a6a3a, edge: 0x5a4024, tint: 0xffe2b0 },  // 3 tierra ocre
  { light: 0xb5acd0, dark: 0x7f759c, grass: 0x6a6088, edge: 0x3f3858, tint: 0xe6d8ff },  // 4 gris violeta
  { light: 0x5fa7a8, dark: 0x2f6468, grass: 0x8fffc0, edge: 0x1f3c40, tint: 0xa8ffe0 },  // 5 noche fosforito
  { light: 0xbdb76a, dark: 0x847e3c, grass: 0x6b6a2a, edge: 0x45401a, tint: 0xe8f0a0 },  // 6 ciénaga mostaza
  { light: 0xf3d8b2, dark: 0xc9a274, grass: 0xb08a5a, edge: 0x7a5a38, tint: 0xffe8c8 },  // 7 dunas rosadas
  { light: 0xf4f9fc, dark: 0xbfd3e2, grass: 0x9fb8cc, edge: 0x6a8aa4, tint: 0xd8ecff },  // 8 nieve
];
export const lookAt = (p) => PLANET_LOOK[Math.min(p, PLANET_LOOK.length - 1)];

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
