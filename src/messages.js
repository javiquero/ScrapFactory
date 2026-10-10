// Comunicados de Chatarrex S.A., la corporación que te paga en "visibilidad".

import { BUILDINGS, ITEMS } from './defs.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const CORP = 'Chatarrex S.A.';

export const WELCOME = [
  'Bienvenido al planeta SC-7, colono. Tu misión: enviarnos chatarra. Tu sueldo: la satisfacción del deber cumplido.',
];

export const TIPS = [
  'Pon un extractor encima de un vertedero de chatarra y lleva lo que saque con cintas hasta el teletransportador.',
  'Arrastra el dedo con la cinta elegida para trazar el recorrido de una vez. Con dos dedos mueves el mapa.',
  'Recordatorio: el casco de la empresa es solo decorativo. No lo uses si cae algo.',
  'El aire local tiene un 3 % de radiactividad. Dentro de lo aceptable para el personal de campo.',
  'El departamento de Recursos Humanos te recuerda que no hay departamento de Recursos Humanos.',
  'Toca un edificio para girarlo. Mantenlo pulsado para ver qué tiene dentro o quitarlo.',
  'Consejo de eficiencia: dos extractores llenan una cinta, y una cinta llena alimenta justo una prensa.',
];

export function orderDoneMessage(unlocks, upgrades = {}) {
  const base = pick([
    'Pedido recibido. El departamento de Gratitud está cerrado por vacaciones. Siguiente pedido adjunto.',
    'Envío completado. Tu ascenso sigue en estudio desde hace 14 años. Ánimo.',
    'Recibido. Un directivo ha sonreído. No sabemos si por ti.',
  ]);
  const parts = [base];
  if (unlocks.length) parts.push(`Desbloqueado: ${unlocks.map((u) => BUILDINGS[u].name).join(', ')}.`);
  const up = Object.entries(upgrades);
  if (up.length) {
    const plural = { cinta: 'Cintas', extractor: 'Extractores', prensa: 'Prensas', ensambladora: 'Ensambladoras' };
    parts.push(`Mejora gratis: ${up.map(([k, v]) => `${plural[k]} a nivel ${v}`).join(', ')}. Más rápidas, mismo sueldo.`);
  }
  return parts.join(' ');
}

export function orderIntro(order) {
  const name = ITEMS[order.item].name.toLowerCase();
  const lines = {
    chatarra: `Necesitamos ${order.amount} de chatarra. Para un proyecto muy importante que no podemos contarte.`,
    placa: `Ahora ${order.amount} placas prensadas. Mete la chatarra en una prensa y aprieta.`,
    engranaje: `Urgente: ${order.amount} engranajes. La máquina de café de la junta directiva ha vuelto a romperse.`,
  };
  return lines[order.item] || `Siguiente pedido: ${order.amount} × ${name}.`;
}

export function wrongItemMessage(item) {
  return pick([
    `¿${ITEMS[item].name}? Eso no estaba en el pedido. Lo descontaremos de tu nómina inexistente.`,
    `Hemos recibido ${ITEMS[item].name.toLowerCase()} que nadie pidió. Lo guardamos "por si acaso".`,
  ]);
}

export const FIRST_BELT = 'Primera cinta instalada. Nuestros abogados confirman que mover cosas sigue siendo legal.';
export const LAST_TELEPORTER = 'Ese teletransportador es el último. Sin él no hay envíos, y sin envíos no hay... bueno, tampoco había sueldo.';

export function randomTip() {
  return pick(TIPS);
}
