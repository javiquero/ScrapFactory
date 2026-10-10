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
  'Recordatorio: el paraguas de la empresa es solo decorativo. No lo uses si llueve.',
  'Los plátanos locales tienen un 3 % de radiactividad. Dentro de lo aceptable para el personal de campo.',
  'El departamento de Recursos Humanos te recuerda que no hay departamento de Recursos Humanos.',
  'Toca un edificio con la mano para girarlo o ver qué tiene dentro.',
];

export function orderDoneMessage(unlocks) {
  const base = pick([
    'Pedido recibido. El departamento de Gratitud está cerrado por vacaciones. Siguiente pedido adjunto.',
    'Envío completado. Tu ascenso sigue en estudio desde hace 14 años. Ánimo.',
    'Recibido. Un directivo ha sonreído. No sabemos si por ti.',
  ]);
  if (!unlocks.length) return base;
  const names = unlocks.map((u) => BUILDINGS[u].name).join(', ');
  return `${base} Desbloqueado: ${names}.`;
}

export function orderIntro(order) {
  const name = ITEMS[order.item].name.toLowerCase();
  const lines = {
    chatarra: `Necesitamos ${order.amount} de chatarra. Para un proyecto muy importante que no podemos contarte.`,
    platano: `La junta quiere ${order.amount} plátanos alienígenas. Para el desayuno, suponemos.`,
    placa: `Ahora ${order.amount} placas prensadas. Mete la chatarra en una prensa y aprieta.`,
    paraguas: `Urgente: ${order.amount} paraguas. En la Tierra llueve chatarra desde que empezaste a enviarla.`,
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
