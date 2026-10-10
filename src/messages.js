// Comunicados de Chatarrex S.A., la corporación que paga poco y tarde (pero paga).

import { BUILDINGS, ITEMS, PLANETS } from './defs.js';
import { RESCUE_SECONDS } from './rescue.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const CORP = 'Chatarrex S.A.';

// Dinero con separador de miles: 1.500 ₡
export const money = (v) => `${Math.floor(v).toLocaleString('es-ES')} ₡`;

export const WELCOME = [
  'Bienvenido al planeta SC-7, colono. Tu misión: enviarnos chatarra. Te pagamos cada pieza que pidamos, y un extra al completar el pedido. Lo que no pidamos, no se paga.',
];

export const TIPS = [
  'Pon un extractor encima de un vertedero de chatarra y lleva lo que saque con cintas hasta tu nave. Entra por cualquier lado.',
  'Arrastra el dedo con la cinta elegida para trazar el recorrido de una vez. Con dos dedos mueves el mapa.',
  'Solo pagamos lo que pide el pedido. Lo demás nos lo quedamos igual, por si acaso. Gratis.',
  'Con los créditos compras máquinas nuevas y mejoras en el catálogo (botón Más).',
  'Recordatorio: el casco de la empresa es solo decorativo. No lo uses si cae algo.',
  'El aire local tiene un 3 % de radiactividad. Dentro de lo aceptable para el personal de campo.',
  'El departamento de Recursos Humanos te recuerda que no hay departamento de Recursos Humanos.',
  'Toca un edificio para girarlo. Mantenlo pulsado para ver qué tiene dentro o quitarlo.',
  'Consejo de eficiencia: dos extractores llenan una cinta, y una cinta llena alimenta justo una prensa.',
  'La nave tiene dos entradas por cada lado. Ocho cintas a la vez, si eres de los que no duermen.',
];

export function orderDoneMessage(pay) {
  const base = pick([
    'Pedido recibido. El departamento de Gratitud está cerrado por vacaciones.',
    'Envío completado. Tu ascenso sigue en estudio desde hace 14 años. Ánimo.',
    'Recibido. Un directivo ha sonreído. No sabemos si por ti.',
    'Pedido cumplido. Contabilidad ha llorado un poco al firmar la transferencia.',
  ]);
  return `${base} Te pagamos ${money(pay)}.`;
}

export function boughtMessage(kind) {
  return pick([
    `${BUILDINGS[kind].name} comprada. Sin garantía, sin devoluciones, sin manual.`,
    `Te enviamos una ${BUILDINGS[kind].name.toLowerCase()} de segunda mano. Bueno, de quinta.`,
    `${BUILDINGS[kind].name} en camino. Los gastos de envío ya los has pagado sin darte cuenta.`,
  ]);
}

export function upgradedMessage(kind, level) {
  const name = kind === 'cinta' ? 'Cintas' : kind === 'extractor' ? 'Extractores' : `Todas las máquinas de tipo ${BUILDINGS[kind].name.toLowerCase()}`;
  return `${name} a nivel ${level}. Más rápidas, mismo sueldo.`;
}

export function orderIntro(order) {
  const name = ITEMS[order.item].name.toLowerCase();
  const n = order.amount;
  const lines = {
    chatarra: `Necesitamos ${n} de chatarra. Para un proyecto muy importante que no podemos contarte.`,
    placa: `Ahora ${n} placas prensadas. Compra una prensa en el catálogo, mete la chatarra y aprieta.`,
    engranaje: `Urgente: ${n} engranajes. La máquina de café de la junta directiva ha vuelto a romperse.`,
    alambre: `Queremos ${n} rollos de alambre. La trefiladora estira la chatarra como Contabilidad estira tu sueldo.`,
    tornillos: `${n} bolsas de tornillos. La cortadora las saca de placas. A la junta le falta alguno, dicen.`,
    muelle: `${n} muelles, por favor. Alambre a la bobinadora y que dé vueltas hasta marearse.`,
    mecanismo: `${n} mecanismos: un engranaje y unos tornillos en la montadora. Dos líneas que se juntan.`,
    carcasa: `${n} carcasas. Placa y alambre a la soldadora. No mires la chispa.`,
    motor: `${n} motores. Mecanismo más muelle en la motorera. Esto ya parece una fábrica de verdad.`,
    robot: `${n} robots de limpieza. Motor más carcasa en la línea de robots. Limpiarán la sede. Tu planeta, no.`,
    cristal: `Aquí el suelo brilla. Mándanos ${n} de cristal roto, que la junta quiere ver si es caro.`,
    vidrio: `Funde el cristal y mándanos ${n} vidrios. Las ventanas de la sede llevan años con cartón.`,
    ventana: `Ahora ${n} ventanas: una placa y un vidrio cada una, en la cristalería.`,
    panel: `Queremos ${n} paneles solares. Ventana más engranaje en la montadora solar. Suerte.`,
  };
  return lines[order.item] || `Siguiente pedido: ${n} × ${name}.`;
}

export function planetDoneMessage(state) {
  const next = PLANETS[state.planet + 1];
  if (!next) return 'Has cumplido todos los pedidos de este planeta. Seguiremos pidiendo cosas, por costumbre. Pronto habrá más planetas que saquear.';
  return `Planeta ${state.planet + 1} exprimido. Prepara el despegue: te esperamos en ${next.name}, "${next.nick}". La fábrica se queda aquí, como recuerdo. Tus créditos y mejoras viajan contigo.`;
}

export function planetIntro(state) {
  const p = PLANETS[state.planet];
  const nuevo = p.resources[p.resources.length - 1];
  return [
    `Bienvenido a ${p.name}, "${p.nick}". Empiezas de cero, pero conservas lo que compraste y tus mejoras.`,
    `Novedad del planeta: ${ITEMS[nuevo].name.toLowerCase()}. Lo encontrarás en el suelo junto a la chatarra de siempre. Hay máquinas nuevas a la venta.`,
  ];
}

export function wrongItemMessage(item) {
  return pick([
    `¿${ITEMS[item].name}? Eso no estaba en el pedido. Nos lo quedamos, pero no se paga.`,
    `Hemos recibido ${ITEMS[item].plural} que nadie pidió. Lo archivamos "por si acaso". Sin cobrar, claro.`,
    `Recordatorio: solo pagamos lo del pedido. Lo otro lo usamos de pisapapeles.`,
  ]);
}

export function rescueStartMessages(state, missing) {
  const r = state.rescue;
  const MASC = ['horno', 'divisor', 'extractor'];
  const what = missing.map((k) => `${MASC.includes(k) ? 'el' : 'la'} ${BUILDINGS[k].name.toLowerCase()}`).join(' y ');
  return [
    pick([
      `Contabilidad ha detectado que te has gastado el dinero en caprichos y ahora no puedes pagar ${what}. Qué sorpresa.`,
      `Sin dinero para ${what}. Te recordamos que el catálogo no es una tienda de chuches, colono.`,
      `Alerta financiera: tus decisiones de compra han sido estudiadas por expertos. No salen bien paradas. Te falta ${what}.`,
    ]),
    `Te ofrecemos un trabajito de rescate: mantén ${num(r.rate)} ${ITEMS[r.item].plural} por segundo llegando a la nave durante ${RESCUE_SECONDS} segundos. Con lo que ya tienes se puede, pero no con una sola máquina. Paga ${money(r.pay)}, justo para salir del lío.`,
  ];
}

export function rescueDoneMessage(pay) {
  return pick([
    `Rescate cumplido. Te pagamos ${money(pay)}. Esta vez gástalo en lo que pide el pedido, ¿vale?`,
    `Muy bien, colono. ${money(pay)} en tu cuenta. Hemos anotado este episodio en tu expediente. En rojo.`,
  ]);
}

const num = (v) => (Math.round(v * 100) / 100).toLocaleString('es-ES');

export const FIRST_BELT = 'Primera cinta instalada. Nuestros abogados confirman que mover cosas sigue siendo legal.';

export function shipText(state) {
  const total = Object.values(state.delivered).reduce((a, b) => a + b, 0);
  return `Recibe por los cuatro lados, dos entradas en cada uno. ${total.toLocaleString('es-ES')} cosas enviadas a Chatarrex.`;
}

export function randomTip() {
  return pick(TIPS);
}
