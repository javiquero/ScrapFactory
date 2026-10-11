// Comunicados de Chatarrex S.A., la corporación que no paga pero manda maquinaria.

import { BUILDINGS, ITEMS, PLANETS } from './defs.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const CORP = 'Chatarrex S.A.';

export const WELCOME = [
  'Bienvenido al planeta SC-7, colono. Tu misión: enviarnos chatarra. Cada pedido que cumplas te dará acceso a maquinaria nueva. Sueldo no, pero maquinaria sí.',
];

export const TIPS = [
  'Pon un extractor encima de un vertedero de chatarra y lleva lo que saque con cintas hasta tu nave. Entra por cualquier lado.',
  'Arrastra el dedo con la cinta elegida para trazar el recorrido de una vez. Con dos dedos mueves el mapa.',
  'Con Quitar puedes arrastrar para borrar un área entera. Y si te arrepientes, Deshacer.',
  '¿Dos cintas que se cruzan? Compra el puente: al trazar una cinta por encima de otra, se pone solo.',
  'Los pedidos grandes piden un ritmo mínimo. Si llega más despacio, no cuenta: monta más líneas en paralelo.',
  'Cada pedido cumplido desbloquea máquinas nuevas. Míralas en el catálogo (botón Más).',
  'Recordatorio: el casco de la empresa es solo decorativo. No lo uses si cae algo.',
  'El aire local tiene un 3 % de radiactividad. Dentro de lo aceptable para el personal de campo.',
  'El departamento de Recursos Humanos te recuerda que no hay departamento de Recursos Humanos.',
  'Toca un edificio para girarlo. Mantenlo pulsado para copiarlo: el siguiente toque pone otro igual.',
  'Consejo de eficiencia: dos extractores llenan una cinta, y una cinta llena alimenta justo una prensa.',
  'La nave tiene dos entradas por cada lado. Ocho cintas a la vez, si eres de los que no duermen.',
];

export function orderDoneMessage(unlocks) {
  const base = pick([
    'Pedido recibido. El departamento de Gratitud está cerrado por vacaciones.',
    'Envío completado. Tu ascenso sigue en estudio desde hace 14 años. Ánimo.',
    'Recibido. Un directivo ha sonreído. No sabemos si por ti.',
    'Pedido cumplido. Contabilidad no se ha enterado, y es mejor así.',
  ]);
  if (!unlocks.length) return base;
  return `${base} Te mandamos maquinaria nueva: ${unlocks.map((k) => BUILDINGS[k].name.toLowerCase()).join(', ')}. Está en el catálogo.`;
}

export function tooSlowMessage(rate) {
  return pick([
    `Llega demasiado despacio. Para este pedido queremos al menos ${num(rate)} por segundo; lo que llegue más lento no cuenta. Monta más líneas.`,
    `A ese ritmo, la junta se jubila antes. Mínimo ${num(rate)} por segundo, colono. Más líneas en paralelo.`,
  ]);
}

export function orderIntro(order) {
  const name = ITEMS[order.item].name.toLowerCase();
  const n = order.amount;
  const lines = {
    chatarra: `Necesitamos ${n} de chatarra. Para un proyecto muy importante que no podemos contarte.`,
    placa: `Ahora ${n} placas prensadas. Ya tienes la prensa: mete la chatarra y aprieta.`,
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
    caucho: `Este planeta es una montaña de neumáticos. Mándanos ${n} de caucho, que en la sede faltan topes para las puertas.`,
    goma: `${n} planchas de goma, por favor. La trituradora mastica neumáticos y las escupe.`,
    correa: `${n} correas: goma y un engranaje en la vulcanizadora. Huele a quemado, es normal.`,
    patinete: `${n} patinetes. Correa más motor. Los directivos quieren llegar antes al café.`,
    circuitos: `Montañas de electrónica vieja. Mándanos ${n} de circuitos viejos; los vendemos como "vintage".`,
    chip: `${n} chips. La desguazadora los arranca de los circuitos. Con delicadeza no, con prisa.`,
    placabase: `${n} placas base: chip más vidrio en la grabadora. Sí, vidrio. No preguntes.`,
    consola: `${n} consolas retro. Placa base dentro de una carcasa. Para la sala de "creatividad" de la sede.`,
    musgo: `El suelo brilla en verde. Mándanos ${n} de musgo luminoso. No lo lamas.`,
    biocombustible: `${n} bidones de biocombustible. El fermentador pudre el musgo hasta que arde. Precioso.`,
    bateria: `${n} baterías: biocombustible en una carcasa. Que no huela mucho, por favor.`,
    dron: `${n} drones. Batería más motor. Servirán para vigilar que trabajas. Ironías de la vida.`,
    lodo: `Charcas de lodo tóxico por todas partes. Mándanos ${n}. Con guantes. Bueno, sin guantes también vale.`,
    acido: `${n} botes de ácido. La destilería hierve el lodo. No respires cerca.`,
    circuito: `${n} circuitos impresos: ácido y un chip en el grabado al ácido.`,
    androide: `${n} androides. Un circuito dentro de un robot de limpieza. Ya no estarás tan solo. Tampoco hablarán.`,
    arena: `La arena de aquí se pega a todo. Mándanos ${n} de arena magnética. Aparta el móvil.`,
    iman: `${n} imanes. El imantador aprieta la arena hasta que atrae cosas. Como tu jefe, pero útil.`,
    electroiman: `${n} electroimanes: imán y alambre en la bobinadora magnética.`,
    aerodeslizador: `${n} aerodeslizadores. Electroimán bajo un panel solar. Flotan. A veces.`,
    hielo: `Planeta helado. Mándanos ${n} de hielo azul para el aire acondicionado de la junta.`,
    refrigerante: `${n} bidones de refrigerante. El congelador machaca el hielo. Abrígate.`,
    nevera: `${n} neveras: refrigerante en una carcasa. Para el yogur de los directivos.`,
    criocapsula: `${n} criocápsulas. Nevera con circuito. Para congelar directivos hasta que suban las acciones.`,
  };
  return lines[order.item] || `Siguiente pedido: ${n} × ${name}.`;
}

export function planetDoneMessage(state) {
  const next = PLANETS[state.planet + 1];
  if (!next) return 'Has cumplido todos los pedidos de este planeta. Seguiremos pidiendo cosas, por costumbre. Pronto habrá más planetas que saquear.';
  return `Planeta ${state.planet + 1} exprimido. Prepara el despegue: te esperamos en ${next.name}, "${next.nick}". La fábrica se queda aquí, como recuerdo. La maquinaria desbloqueada viaja contigo.`;
}

export function planetIntro(state) {
  const p = PLANETS[state.planet];
  const nuevo = p.resources[p.resources.length - 1];
  return [
    `Bienvenido a ${p.name}, "${p.nick}". Empiezas de cero, pero conservas toda la maquinaria que ya tenías.`,
    `Novedad del planeta: ${ITEMS[nuevo].name.toLowerCase()}. Lo encontrarás en el suelo junto a la chatarra de siempre. Los pedidos te irán dando las máquinas nuevas.`,
  ];
}

export function wrongItemMessage(item) {
  return pick([
    `¿${ITEMS[item].name}? Eso no estaba en el pedido. Nos lo quedamos, pero no cuenta.`,
    `Hemos recibido ${ITEMS[item].plural} que nadie pidió. Lo archivamos "por si acaso".`,
    `Recordatorio: solo cuenta lo del pedido. Lo otro lo usamos de pisapapeles.`,
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
