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
  chatarra:  { name: 'Chatarra', plural: 'chatarra' },
  placa:     { name: 'Placa prensada', plural: 'placas' },
  alambre:   { name: 'Alambre', plural: 'rollos de alambre' },
  engranaje: { name: 'Engranaje', plural: 'engranajes' },
  tornillos: { name: 'Tornillos', plural: 'bolsas de tornillos' },
  muelle:    { name: 'Muelle', plural: 'muelles' },
  mecanismo: { name: 'Mecanismo', plural: 'mecanismos' },
  carcasa:   { name: 'Carcasa', plural: 'carcasas' },
  motor:     { name: 'Motor', plural: 'motores' },
  robot:     { name: 'Robot de limpieza', plural: 'robots de limpieza' },
  cristal:   { name: 'Cristal roto', plural: 'cristal roto' },
  vidrio:    { name: 'Vidrio', plural: 'vidrios' },
  ventana:   { name: 'Ventana', plural: 'ventanas' },
  panel:     { name: 'Panel solar', plural: 'paneles solares' },
  // planeta 3: caucho
  caucho:    { name: 'Caucho', plural: 'caucho' },
  goma:      { name: 'Goma', plural: 'planchas de goma' },
  correa:    { name: 'Correa', plural: 'correas' },
  patinete:  { name: 'Patinete', plural: 'patinetes' },
  // planeta 4: circuitos viejos
  circuitos: { name: 'Circuitos viejos', plural: 'circuitos viejos' },
  chip:      { name: 'Chip', plural: 'chips' },
  placabase: { name: 'Placa base', plural: 'placas base' },
  consola:   { name: 'Consola retro', plural: 'consolas retro' },
  // planeta 5: musgo luminoso
  musgo:     { name: 'Musgo luminoso', plural: 'musgo luminoso' },
  biocombustible: { name: 'Biocombustible', plural: 'bidones de biocombustible' },
  bateria:   { name: 'Batería', plural: 'baterías' },
  dron:      { name: 'Dron', plural: 'drones' },
  // planeta 6: lodo tóxico
  lodo:      { name: 'Lodo tóxico', plural: 'lodo tóxico' },
  acido:     { name: 'Ácido', plural: 'botes de ácido' },
  circuito:  { name: 'Circuito impreso', plural: 'circuitos impresos' },
  androide:  { name: 'Androide', plural: 'androides' },
  // planeta 7: arena magnética
  arena:     { name: 'Arena magnética', plural: 'arena magnética' },
  iman:      { name: 'Imán', plural: 'imanes' },
  electroiman: { name: 'Electroimán', plural: 'electroimanes' },
  aerodeslizador: { name: 'Aerodeslizador', plural: 'aerodeslizadores' },
  // planeta 8: hielo azul
  hielo:     { name: 'Hielo azul', plural: 'hielo azul' },
  refrigerante: { name: 'Refrigerante', plural: 'bidones de refrigerante' },
  nevera:    { name: 'Nevera', plural: 'neveras' },
  criocapsula: { name: 'Criocápsula', plural: 'criocápsulas' },
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

// ---- Ritmos ----------------------------------------------------------------------
// Todo está cuadrado: 2 extractores llenan 1 cinta, 1 cinta llena alimenta justo
// 1 prensa, 1 prensa saca justo las placas que necesita 1 ensambladora...
// De momento no hay niveles: todas las cintas y máquinas van a la misma velocidad.
// (Las funciones aceptan un nivel por si algún día vuelven las mejoras.)
export const LEVEL_MULT = [0, 1, 1.5, 2];
export const BELT_SPACING = 0.5;                     // 2 objetos por casilla como mucho
export const BELT_BASE_SPEED = 2.5;                  // casillas/s → 5 objetos/s
export const EXTRACTOR_BASE_RATE = 2.5;              // objetos/s (media cinta)

export const beltSpeed = (lvl) => BELT_BASE_SPEED * LEVEL_MULT[lvl || 1];
export const beltRate = (lvl) => beltSpeed(lvl) / BELT_SPACING;
export const extractorRate = (lvl) => EXTRACTOR_BASE_RATE * LEVEL_MULT[lvl || 1];
export const craftTime = (kind, lvl) => BUILDINGS[kind].recipe.time / LEVEL_MULT[lvl || 1];

// Edificios. Se desbloquean cumpliendo pedidos (`unlocks` de cada pedido).
export const BUILDINGS = {
  cinta: { name: 'Cinta', short: 'Cinta', category: 'logistica',
    desc: 'Mueve cosas. Arrastra el dedo para trazar el recorrido.' },
  divisor: { name: 'Divisor', short: 'Divisor', category: 'logistica',
    desc: 'Reparte lo que entra por detrás entre izquierda, frente y derecha.' },
  puente: { name: 'Puente', short: 'Puente', category: 'logistica',
    desc: 'Cruza dos cintas: una pasa por encima de la otra. Lo que entra por un lado sale por el de enfrente.' },
  extractor: { name: 'Extractor', short: 'Extraer', category: 'extraccion', onNode: true,
    desc: 'Se coloca sobre un recurso del suelo y lo va sacando.' },

  // ---- Planeta 1: todo sale de la chatarra ----
  prensa: { name: 'Prensa', short: 'Prensa', category: 'basicas',
    desc: 'Aprieta fuerte, como la jornada laboral.',
    recipe: { in: { chatarra: 2 }, out: 'placa', time: 0.4 } },
  trefiladora: { name: 'Trefiladora', short: 'Trefilar', category: 'basicas',
    desc: 'Estira la chatarra hasta dejarla en alambre. Como tu paciencia.',
    recipe: { in: { chatarra: 2 }, out: 'alambre', time: 0.4 } },
  ensambladora: { name: 'Ensambladora', short: 'Montar', category: 'piezas',
    desc: 'Engranajes. No preguntes para qué.',
    recipe: { in: { placa: 2, chatarra: 1 }, out: 'engranaje', time: 0.8 } },
  cortadora: { name: 'Cortadora', short: 'Cortar', category: 'piezas',
    desc: 'Una sierra que convierte placas en tornillos. Mantén los dedos lejos.',
    recipe: { in: { placa: 1 }, out: 'tornillos', time: 0.4 } },
  bobinadora: { name: 'Bobinadora', short: 'Bobinar', category: 'piezas',
    desc: 'Enrolla alambre hasta que se rinde y se convierte en muelle.',
    recipe: { in: { alambre: 2 }, out: 'muelle', time: 0.8 } },
  montadora: { name: 'Montadora', short: 'Montadora', category: 'conjuntos',
    desc: 'Atornilla engranajes y saca mecanismos. Nadie sabe qué mueven.',
    recipe: { in: { engranaje: 1, tornillos: 1 }, out: 'mecanismo', time: 0.8 } },
  soldadora: { name: 'Soldadora', short: 'Soldar', category: 'conjuntos',
    desc: 'Suelda placa y alambre en una carcasa. Gafas no incluidas.',
    recipe: { in: { placa: 1, alambre: 1 }, out: 'carcasa', time: 0.8 } },
  motorera: { name: 'Motorera', short: 'Motores', category: 'conjuntos',
    desc: 'Mecanismo + muelle = motor. Ingeniería de primer nivel (del sótano).',
    recipe: { in: { mecanismo: 1, muelle: 1 }, out: 'motor', time: 1.6 } },
  robotica: { name: 'Línea de robots', short: 'Robots', category: 'conjuntos',
    desc: 'Mete un motor en una carcasa y sale un robot de limpieza. Limpiará tu despacho, no el suyo.',
    recipe: { in: { motor: 1, carcasa: 1 }, out: 'robot', time: 1.6 } },

  // ---- Planeta 2: cristal ----
  horno: { name: 'Horno', short: 'Horno', category: 'basicas',
    desc: 'Funde el cristal roto en vidrio. Lo que otros tiraron.',
    recipe: { in: { cristal: 2 }, out: 'vidrio', time: 0.4 } },
  cristaleria: { name: 'Cristalería', short: 'Cristal', category: 'piezas',
    desc: 'Encaja vidrio en un marco de placa. Para que la junta vea el paisaje.',
    recipe: { in: { placa: 1, vidrio: 1 }, out: 'ventana', time: 0.4 } },
  montasolar: { name: 'Montadora solar', short: 'Solar', category: 'conjuntos',
    desc: 'Ventana + engranaje = panel solar. Energía limpia de origen dudoso.',
    recipe: { in: { ventana: 1, engranaje: 1 }, out: 'panel', time: 0.8 } },
};

// Máquinas de los planetas 3 a 8: básica (2 recurso → producto), mezcla y producto final
const P = (name, short, desc, inp, out, time) => ({ name, short, category: time === 0.4 ? 'basicas' : time === 0.8 ? 'piezas' : 'conjuntos', desc, recipe: { in: inp, out, time } });
Object.assign(BUILDINGS, {
  trituradora: P('Trituradora', 'Triturar', 'Mastica neumáticos viejos y escupe planchas de goma. Huele a domingo de taller.', { caucho: 2 }, 'goma', 0.4),
  vulcanizadora: P('Vulcanizadora', 'Vulcanizar', 'Cuece goma con un engranaje dentro hasta que sale una correa.', { goma: 1, engranaje: 1 }, 'correa', 0.8),
  patinetera: P('Taller de patinetes', 'Patinetes', 'Correa más motor: patinete eléctrico para que los directivos lleguen antes al café.', { correa: 1, motor: 1 }, 'patinete', 1.6),
  desguazadora: P('Desguazadora', 'Desguazar', 'Arranca los chips de la electrónica vieja. Con cariño no, con alicates.', { circuitos: 2 }, 'chip', 0.4),
  grabadora: P('Grabadora de placas', 'Placas base', 'Monta chips sobre vidrio y salen placas base. Nadie sabe por qué vidrio.', { chip: 1, vidrio: 1 }, 'placabase', 0.8),
  consolera: P('Línea de consolas', 'Consolas', 'Placa base en una carcasa: consola retro. La junta la llama "inversión estratégica".', { placabase: 1, carcasa: 1 }, 'consola', 1.6),
  fermentador: P('Fermentador', 'Fermentar', 'Deja pudrir el musgo con estilo hasta que arde. Biocombustible artesano.', { musgo: 2 }, 'biocombustible', 0.4),
  bateriera: P('Envasadora de baterías', 'Baterías', 'Mete biocombustible en una carcasa y la llama batería. Ingeniería creativa.', { biocombustible: 1, carcasa: 1 }, 'bateria', 0.8),
  dronera: P('Hangar de drones', 'Drones', 'Batería más motor: un dron. Para vigilar que trabajas. Lo pagas tú.', { bateria: 1, motor: 1 }, 'dron', 1.6),
  destileria: P('Destilería', 'Destilar', 'Hierve lodo tóxico hasta sacar ácido. No respires. Bueno, respira poco.', { lodo: 2 }, 'acido', 0.4),
  grabadoacido: P('Grabado al ácido', 'Circuitos', 'Baña chips en ácido y salen circuitos impresos. Guantes no incluidos.', { acido: 1, chip: 1 }, 'circuito', 0.8),
  androidera: P('Fábrica de androides', 'Androides', 'Un circuito dentro de un robot: androide. Ya tienes compañía (no habla).', { circuito: 1, robot: 1 }, 'androide', 1.6),
  imantador: P('Imantador', 'Imantar', 'Aprieta la arena magnética hasta hacer imanes. Aleja el móvil.', { arena: 2 }, 'iman', 0.4),
  electroimanes: P('Bobinadora magnética', 'Electroimán', 'Enrolla alambre alrededor de un imán y sale un electroimán.', { iman: 1, alambre: 1 }, 'electroiman', 0.8),
  aerodeslizadores: P('Hangar de aerodeslizadores', 'Aerodesliz.', 'Electroimán bajo un panel solar: flota. Más o menos.', { electroiman: 1, panel: 1 }, 'aerodeslizador', 1.6),
  congelador: P('Congelador', 'Congelar', 'Machaca hielo azul y lo convierte en refrigerante. Abrígate.', { hielo: 2 }, 'refrigerante', 0.4),
  nevereria: P('Montadora de neveras', 'Neveras', 'Refrigerante en una carcasa: nevera. Para el yogur de la junta directiva.', { refrigerante: 1, carcasa: 1 }, 'nevera', 0.8),
  criogenia: P('Laboratorio criogénico', 'Criogenia', 'Nevera con circuito: criocápsula. Para congelar directivos hasta que suban las acciones.', { nevera: 1, circuito: 1 }, 'criocapsula', 1.6),
});

export const CATEGORIES = [
  { id: 'logistica', name: 'Logística' },
  { id: 'extraccion', name: 'Extracción' },
  { id: 'basicas', name: 'Transformar' },
  { id: 'piezas', name: 'Piezas' },
  { id: 'conjuntos', name: 'Conjuntos' },
];

export const MACHINE_BUFFER = 10;  // máximo de cada ingrediente guardado
export const OUTPUT_BUFFER = 4;    // máximo de productos esperando salir

// Lo que fabrica cada máquina y cuántas piezas por segundo saca UNA línea
export const MAKER = {};
for (const [k, b] of Object.entries(BUILDINGS)) if (b.recipe) MAKER[b.recipe.out] = k;
export const lineRate = (item) => (MAKER[item] ? 1 / BUILDINGS[MAKER[item]].recipe.time : EXTRACTOR_BASE_RATE);

// Ventana en la que se mide el ritmo de un pedido
export const RATE_SECONDS = 10;

// Un pedido: `amount` piezas de `item`, llegando a la nave al menos a `rate` por segundo
// (lo que llega más despacio no cuenta). `lines` = cuántas líneas hacen falta para ese
// ritmo (0 = sin mínimo). Al cumplirlo se desbloquean las máquinas de `unlocks`.
function O(item, lines, amountOrSeconds, unlocks = []) {
  if (!lines) return { item, amount: amountOrSeconds, rate: 0, unlocks };
  const rate = lines * lineRate(item);
  return { item, rate, amount: Math.ceil((rate * amountOrSeconds) / 10) * 10, unlocks };
}

// ---- Planetas ---------------------------------------------------------------------
// Cada planeta es un mapa nuevo. Cambiar de planeta = recurso nuevo (docs/planetas.md).
// El planeta 1 tiene toda la cadena larga de la chatarra. Cada pedido paga `pay`.
// `shop`: lo que se puede comprar a partir de ese planeta.
// El planeta 1 tiene toda la cadena larga de la chatarra. Cada pedido grande pide un
// ritmo que una sola línea no da: hay que montar varias en paralelo.
export const PLANETS = [
  {
    name: 'SC-7',
    nick: 'El Vertedero',
    resources: ['chatarra'],
    ground: 0x8cc56a,
    orders: [
      O('chatarra', 0, 40, ['prensa']),
      O('placa', 0, 40, ['divisor', 'puente']),
      O('chatarra', 2, 60, ['ensambladora']),        // 5/s: dos extractores
      O('engranaje', 0, 40, ['trefiladora']),
      O('placa', 2, 60),                             // 5/s: dos prensas
      O('alambre', 2, 60, ['cortadora']),
      O('engranaje', 2, 90, ['bobinadora']),
      O('tornillos', 2, 60, ['montadora']),
      O('muelle', 2, 90),
      O('mecanismo', 1, 120, ['soldadora']),
      O('alambre', 4, 90),                           // 10/s: cuatro trefiladoras
      O('carcasa', 2, 90, ['motorera']),
      O('mecanismo', 2, 120),
      O('motor', 1, 150, ['robotica']),
      O('placa', 6, 90),                             // 15/s
      O('carcasa', 3, 120),
      O('motor', 2, 150),
      O('robot', 1, 120),
      O('engranaje', 6, 120),
      O('motor', 3, 180),
      O('robot', 2, 180),                            // el gordo
    ],
  },
  {
    name: 'SC-12',
    nick: 'Los Cristales',
    resources: ['chatarra', 'cristal'],
    ground: 0x84c79a,
    orders: [
      O('cristal', 0, 60, ['horno']),
      O('vidrio', 0, 60),
      O('cristal', 3, 60),
      O('vidrio', 2, 90, ['cristaleria']),
      O('placa', 3, 90),
      O('ventana', 2, 90, ['montasolar']),
      O('engranaje', 3, 90),
      O('panel', 1, 120),
      O('vidrio', 4, 120),
      O('ventana', 4, 120),
      O('motor', 2, 120),
      O('panel', 2, 150),
      O('robot', 1, 150),
      O('panel', 3, 180),
      O('panel', 4, 240),
    ],
  },
];

// Planetas 3 a 8: misma forma de pedidos. R recurso, B básico, M mezcla, F final,
// O1/O2 lo de planetas anteriores que hace falta para M y F. Cuanto más lejos,
// más líneas en paralelo.
function laterOrders(R, B, M, F, O1, O2, shop, extra) {
  const x = (n) => n + extra;
  return [
    O(R, 0, 60, [shop[0]]), O(B, 0, 60), O(R, x(3), 60), O(B, x(2), 90, [shop[1]]),
    O(O1, x(2), 90), O(M, 1, 90), O(B, x(3), 90), O(M, x(2), 120, [shop[2]]),
    O(O2, x(1), 120), O(F, 1, 90), O(M, x(3), 120), O(F, x(1), 150),
    O(B, x(4), 120), O(M, x(4), 150), O(F, x(2), 180), O(F, x(3), 240),
  ];
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
  PLANETS.push({ name, nick, resources: [...prev.resources, res], ground, orders: laterOrders(R, B, M, F, O1, O2, shop, Math.floor(i / 2)) });
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

// Lo que se tiene desde el principio
export const STARTING_UNLOCKS = ['cinta', 'extractor'];

// En qué planeta y pedido se desbloquea un edificio (o null)
export function unlockedBy(kind) {
  for (let p = 0; p < PLANETS.length; p++) {
    const i = PLANETS[p].orders.findIndex((o) => o.unlocks.includes(kind));
    if (i >= 0) return { planet: p, order: i };
  }
  return null;
}

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
  return { item, amount: Math.round((last.amount * f) / 10) * 10, rate: last.rate * f, unlocks: [], bonus: true };
}
