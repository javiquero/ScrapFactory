// Comunicados de Chatarrex S.A., la corporación que no paga pero manda maquinaria.

import { BUILDINGS, ITEMS, PLANETS } from './defs.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const CORP = 'Chatarrex S.A.';

export const WELCOME = [
  'Bienvenido al planeta SC-7, colono. Tu misión: enviarnos chatarra. Cada pedido que cumplas te dará acceso a maquinaria nueva. Sueldo no, pero maquinaria sí.',
];

// Bienvenidas alternativas (cada una es un solo comunicado completo).
export const WELCOME_ALT = [
  'Colono: has sido seleccionado entre un solo candidato para dirigir la planta de SC-7. Envíanos chatarra y te iremos mandando máquinas. Lo de cobrar ya lo hablaremos.',
  'Chatarrex S.A. te da la bienvenida a SC-7, nuestro planeta-vertedero insignia. Cumple pedidos, desbloquea maquinaria y no toques nada que brille sin rellenar el formulario.',
  'Enhorabuena por tu nuevo puesto de Responsable Único de Todo en SC-7. La nave está aparcada, los vertederos llenos y la junta, impaciente. Empieza por la chatarra.',
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

  // --- Consejos de verdad ---
  'Mantén pulsada una máquina que ya funcione y pon copias al lado. Copiar no es plagio si lo hace la empresa.',
  'Deshacer recuerda tus últimas 50 meteduras de pata. La junta querría uno igual para sus decisiones.',
  'Una prensa llena alimenta justo una ensambladora. Si le das más, se atasca. Si le das menos, se aburre.',
  'El divisor reparte lo que entra por detrás entre izquierda, frente y derecha. Ideal para alimentar varias máquinas con una sola cinta.',
  'El puente tiene dos carriles: uno pasa por debajo y otro por encima. No hace falta girarlo; ya viene orientado de fábrica.',
  'En el catálogo cada máquina dice qué le entra y qué sale. Leerlo es gratis, y en Chatarrex eso es mucho decir.',
  'Si un pedido pide ritmo, mira cuántas cosas llegan por segundo. Dos líneas iguales en paralelo dan el doble. Matemáticas corporativas.',
  'Pon una máquina encima de una cinta y la sustituye. No hace falta quitar primero: aquí se despide sin preaviso.',
  'La salida de cada máquina es una rampita que sí gira. La máquina no. Las máquinas, como los directivos, no cambian de opinión.',
  'La nave recibe por los cuatro lados, con dos entradas por lado. No hace falta hacer cola, aunque a la junta le encanten.',
  'Si una cinta va medio vacía, añade otro extractor. Dos extractores la llenan; uno solo la deja triste.',
  'Al soltar el dedo después de construir, vuelves a la mano. Lo que elegiste sigue en la barra, esperándote.',
  'Arrastrar con Quitar borra un rectángulo entero. Muy útil para "reestructuraciones", como dicen arriba.',
  'Si con la cinta atraviesas en recto otra perpendicular y tienes puentes, el puente se pone solo. Automatización sin sindicato.',
  'Cada planeta trae un recurso nuevo en el suelo, pero la chatarra de siempre sigue ahí. Lo de siempre nunca falla.',
  'Montar varias líneas iguales una al lado de otra es la forma más rápida de cumplir pedidos con ritmo mínimo.',
  'Las máquinas que esperan dos ingredientes necesitan las dos cintas llenas. Si falta uno, se quedan mirando al infinito.',
  'Antes de alargar una línea, piensa por dónde va a llegar a la nave. Las cintas largas funcionan, pero las cortas se ven más profesionales.',
  'Un divisor delante de varias prensas reparte la chatarra para todas. Igualdad de condiciones, cosa rara en esta empresa.',
  'Si no sabes qué hacer con lo desbloqueado, ábrelo en el catálogo: te dice qué pide y qué fabrica.',
  'Todas las cintas y máquinas van a la misma velocidad. La única forma de ir más rápido es tener más.',
  'Las cosas que no pide el pedido no cuentan. Asegúrate de que a la nave solo llega lo que toca.',

  // --- Ambiente corporativo ---
  'La junta directiva ha aprobado un plan de sinergias. Nadie sabe qué es, pero ya tiene logotipo.',
  'Aviso de Seguridad Laboral: si oyes un ruido raro, sube el volumen de la música.',
  'Tu solicitud de vacaciones ha sido recibida. Será estudiada en cuanto se invente el concepto.',
  'El café de la sede se ha agotado. La junta se reúne en sesión de urgencia. Tú sigue a lo tuyo.',
  'Recordatorio: rellenar el formulario B-27 es obligatorio para pedir el formulario B-28.',
  'Nuestro eslogan de este trimestre: "Chatarrex: transformando basura en otra basura más cara".',
  'El buzón de sugerencias está en la sede, a 300 años luz. Se admiten sugerencias por paloma mensajera.',
  'Chatarrex S.A. ha sido nombrada Mejor Empresa Para Trabajar por el comité de Chatarrex S.A.',
  'Si te sientes solo, recuerda que formas parte de una gran familia. Una familia que no llama.',
  'Nueva política de vestimenta: mono de trabajo obligatorio. Lavarlo, opcional.',
  'El director general ha publicado un libro de liderazgo. Capítulo uno: "Delegar en el colono".',
  'Formación obligatoria: "Cómo sonreír mientras extraes chatarra". Duración: toda tu vida laboral.',
  'Encuesta de satisfacción: del 1 al 10, ¿cuánto te gusta trabajar gratis? Respuestas por debajo de 9 serán revisadas.',
  'Seguridad Laboral recuerda: está prohibido correr por la fábrica. Sobre todo si hay que correr para huir.',
  'La sede ha instalado una máquina de vending nueva. A ti te mandamos una foto.',
  'Recordatorio fiscal: no cobras, así que no tienes que hacer la declaración. Ventajas del puesto.',
  'Departamento Legal informa: todo lo que construyas pertenece a Chatarrex. Lo que pienses, también, en breve.',
  'La reunión de los lunes se ha movido a los martes. A ti no te afecta, pero queríamos que lo supieras.',
  'Hemos contratado a una consultora para mejorar tu productividad. Recomienda que trabajes más.',
  'El plan de pensiones de Chatarrex consiste en no jubilarse. Muy sostenible.',
  'La junta ha aprobado una partida para tu bienestar. Se ha gastado en un cuadro motivador para la sede.',
  'Recuerda fichar al entrar y al salir. Como nunca sales, con fichar una vez basta.',
  'Mensaje del Comité de Innovación: hemos inventado la reunión para decidir cuándo hacer la reunión.',
  'Seguridad Laboral: el extintor de tu planeta está en otro planeta. Evita los incendios.',
  'Los directivos han hecho un curso de empatía. Han aprobado todos sin asistir.',
  'Chatarrex apuesta por la conciliación: puedes conciliar el sueño en tus horas libres, si encuentras alguna.',
  'Nuevo valor corporativo: "Resiliencia". Significa que no te vamos a mandar ayuda.',
  'Por motivos de presupuesto, el manual de instrucciones de las máquinas se ha sustituido por intuición.',
  'Atención: la cafetera de la sede está en mantenimiento. Los directivos piden comprensión.',
  'Tu evaluación de desempeño: "Cumple expectativas". Las expectativas eran bajas, pero enhorabuena.',
  'El protocolo de evacuación es sencillo: no hay evacuación. Gracias por tu comprensión.',
  'Comunicado interno: se ruega no mencionar la palabra "sueldo" en los informes. Asusta a los accionistas.',
  'La empresa celebra su aniversario. Habrá tarta en la sede. Te guardamos la vela.',
  'Hemos detectado que respiras en horario laboral. Lo permitimos, de momento.',
  'Recordatorio de Compras: si necesitas algo, pídelo por escrito, en triplicado, con sello. Luego no lo compraremos.',
  'La junta ha decidido que este planeta tiene "mucho potencial". Traducción: está lleno de basura.',
  'El Comité de Sostenibilidad ha calculado tu huella de carbono. Por suerte, aquí no hay carbono.',
  'Aviso: el wifi de la sede ha caído. Los directivos han descubierto que existen las ventanas. Sin vidrio, pero ventanas.',
];

// Para cuando el colono lleva rato sin hacer nada.
export const IDLE = [
  '¿Hola? Detectamos baja actividad en tu planeta. Si estás muerto, rellena el formulario D-1.',
  'La junta ha preguntado por ti. Bueno, por la chatarra. Pero es casi lo mismo.',
  'Pausa detectada. Te recordamos que las pausas no están contempladas en tu contrato. Tampoco el contrato.',
  'Las máquinas se aburren. Y una máquina aburrida es una máquina que piensa. No queremos eso.',
  'Colono, ¿sigues ahí? El radar solo detecta chatarra quieta, y eso nos preocupa.',
  'Inactividad registrada. Lo apuntamos en tu expediente, al lado de "no cobra".',
  'Los vertederos no se vacían solos. Lo hemos comprobado con un estudio carísimo.',
  'Si estás meditando, Chatarrex lo considera tiempo de formación no remunerada. Adelante.',
  'Un directivo ha mirado el gráfico de producción y ha dicho "hmm". Nunca es buena señal.',
  'Recordatorio amable: el pedido sigue ahí. No se va a cumplir mirándolo.',
  'Hemos enviado un dron a ver si sigues vivo. Se ha perdido. Contesta tú, que sale más barato.',
  'La productividad de tu planeta ha bajado a "contemplativa". Rogamos subirla a "aceptable".',
  'Sabemos que estás ahí. Lo sabemos porque nadie más quiere estar ahí.',
  'Descanso detectado. Si es por agotamiento, consulta con Recursos Humanos. Ah, espera.',
  'La cinta transportadora te echa de menos. Nosotros no tanto, pero ella sí.',
  'Informe automático: cero clics en los últimos minutos. ¿Se te ha caído el dedo? Lo cubre el seguro (no hay seguro).',
  'Quietud total en el planeta. La junta pregunta si eso es una huelga. Te recordamos que no tienes sindicato.',
  'Si estás pensando en una fábrica más grande, nos parece genial. Si estás pensando en dimitir, no nos parece nada.',
  'La chatarra del suelo empieza a echar raíces. Recógela antes de que pida derechos.',
  'Pequeña sugerencia: un extractor más nunca ha hecho daño a nadie. A la junta, al menos.',
];

// Coletillas para cuando llega maquinaria nueva.
export const UNLOCK_LINES = [
  'Viene sin manual.',
  'Montaje no incluido. Ni tornillos. Bueno, los tornillos los haces tú.',
  'Garantía de 0 días a partir de la entrega.',
  'Si se rompe, es culpa tuya. Lo pone en la letra pequeña.',
  'Usada solo por un directivo los domingos.',
  'Puede contener restos de otra máquina.',
  'Instrucciones disponibles en un idioma que no existe.',
  'Recién pintada. Bueno, recién manchada.',
  'Ha pasado el control de calidad. El control de calidad es un señor que la miró de lejos.',
  'Se ruega no darle patadas. Tampoco cariño, que se acostumbra.',
  'Incluye pegatina de "Chatarrex: orgullo de pertenecer".',
  'Coste de envío descontado de tu sueldo inexistente.',
];

export function orderDoneMessage(unlocks) {
  const base = pick([
    'Pedido recibido. El departamento de Gratitud está cerrado por vacaciones.',
    'Envío completado. Tu ascenso sigue en estudio desde hace 14 años. Ánimo.',
    'Recibido. Un directivo ha sonreído. No sabemos si por ti.',
    'Pedido cumplido. Contabilidad no se ha enterado, y es mejor así.',
    'Pedido completado. La junta lo celebrará con un café. Tú celébralo con otro pedido.',
    'Recibido todo. Lo hemos guardado en un almacén que ya estaba lleno. Gracias igualmente.',
    'Pedido cumplido. Te hemos puesto una estrellita en el expediente. Es de papel, pero brilla.',
    'Envío recibido. El director general ha dicho "bien". Lo hemos grabado para la posteridad.',
    'Pedido cumplido a tiempo. Esto sienta un precedente peligroso: ahora lo esperaremos siempre.',
    'Recibido. Marketing ya lo está vendiendo como "artesanía espacial".',
    'Pedido completado. La sinergia entre tú y nuestras ganancias es admirable.',
    'Mercancía recibida. Ha llegado entera, cosa que no podemos decir de la sede.',
    'Pedido cumplido. Hemos enviado un correo de felicitación. A nosotros mismos, por contratarte.',
    'Recibido. Tu esfuerzo se ha convertido en un gráfico que sube. A la junta le encantan los gráficos que suben.',
    'Pedido entregado. El comité ha votado darte las gracias. Empate técnico; queda pendiente.',
    'Envío completado. Si existiera el Empleado del Mes, serías candidato. Único candidato.',
    'Pedido recibido. Contabilidad ha intentado pagarte por error. Lo hemos parado a tiempo.',
    'Todo en orden. El departamento de Calidad lo ha revisado con un vistazo rápido y una galleta.',
    'Pedido cumplido. Los accionistas han aplaudido. Muy flojito, pero han aplaudido.',
    'Recibido. Lo usaremos para algo muy importante en cuanto alguien se acuerde de para qué era.',
    'Pedido completado. Tu productividad ya aparece en una diapositiva. En la última, pero aparece.',
    'Entrega recibida. Hemos actualizado tu ficha: "colono" ahora va en negrita.',
    'Pedido cumplido. La junta te manda saludos. Bueno, uno. Bueno, un gesto con la cabeza.',
    'Envío completado. Seguridad Laboral confirma que nadie ha resultado herido. Que ellos sepan.',
    'Recibido con éxito. El departamento de Gratitud ha vuelto de vacaciones y se ha ido otra vez.',
  ]);
  if (!unlocks.length) return base;
  return `${base} Te mandamos maquinaria nueva: ${unlocks.map((k) => BUILDINGS[k].name.toLowerCase()).join(', ')}. Está en el catálogo. ${pick(UNLOCK_LINES)}`;
}

export function tooSlowMessage(rate) {
  return pick([
    `Llega demasiado despacio. Para este pedido queremos al menos ${num(rate)} por segundo; lo que llegue más lento no cuenta. Monta más líneas.`,
    `A ese ritmo, la junta se jubila antes. Mínimo ${num(rate)} por segundo, colono. Más líneas en paralelo.`,
    `Esto llega con calma de funcionario. Necesitamos ${num(rate)} por segundo como mínimo. Duplica la línea.`,
    `Nuestros directivos tardan menos en tomarse el café. Queremos ${num(rate)} por segundo; monta otra línea igual al lado.`,
    `Ritmo insuficiente. El pedido exige ${num(rate)} por segundo y lo que llega más lento lo tiramos a la papelera. Más líneas, por favor.`,
    `Se agradece el esfuerzo, pero no cuenta: hace falta un mínimo de ${num(rate)} por segundo. Una sola línea no llega.`,
    `Informe de Productividad: lento. Objetivo: ${num(rate)} por segundo. Solución recomendada: copiar lo que ya tienes y ponerlo al lado.`,
    `A este paso, el pedido llegará en la próxima era geológica. Mínimo ${num(rate)} por segundo, colono.`,
    `La junta ha cronometrado tus envíos y ha suspirado. Pide ${num(rate)} por segundo. Más extractores, más cintas, más todo.`,
    `Despacito no es un ritmo aceptable. El pedido pide ${num(rate)} por segundo; monta líneas en paralelo hasta llegar.`,
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
  if (!next) {
    return pick([
      'Has cumplido todos los pedidos de este planeta. Seguiremos pidiendo cosas, por costumbre. Pronto habrá más planetas que saquear.',
      'Último planeta exprimido. La junta está buscando más planetas en el mapa. De momento solo han encontrado una mancha de café.',
      'No queda nada que pedirte, de momento. Disfruta del silencio: es lo más parecido a unas vacaciones que vas a tener.',
    ]);
  }
  const n = state.planet + 1;
  const dest = `${next.name}, "${next.nick}"`;
  return pick([
    `Planeta ${n} exprimido. Prepara el despegue: te esperamos en ${dest}. La fábrica se queda aquí, como recuerdo. La maquinaria desbloqueada viaja contigo.`,
    `Buen trabajo: el planeta ${n} ya no da más de sí. Siguiente destino, ${dest}. Las máquinas desbloqueadas te acompañan; la fábrica, no.`,
    `Planeta ${n} completado. La junta lo ha declarado "plenamente sinergizado". Te trasladamos a ${dest}. Llévate la maquinaria; deja las cintas.`,
    `Fin de la obra en el planeta ${n}. Recursos Humanos (que no existe) ha aprobado tu traslado a ${dest}. Conservas todo lo desbloqueado.`,
    `Planeta ${n} cerrado por éxito. Rumbo a ${dest}. Tu fábrica pasa a ser patrimonio histórico de Chatarrex, o sea, abandonada. La maquinaria sí viaja contigo.`,
  ]);
}

export function planetIntro(state) {
  const p = PLANETS[state.planet];
  const nuevo = ITEMS[p.resources[p.resources.length - 1]].name.toLowerCase();
  const where = `${p.name}, "${p.nick}"`;
  return [
    pick([
      `Bienvenido a ${where}. Empiezas de cero, pero conservas toda la maquinaria que ya tenías.`,
      `Aterrizaje completado en ${where}. Mapa vacío, nave nueva y toda tu maquinaria desbloqueada a mano.`,
      `Has llegado a ${where}. El terreno está sin tocar, como tu nómina. Conservas toda la maquinaria que ya tenías.`,
      `Te damos la bienvenida a ${where}. La fábrica anterior se quedó atrás; las máquinas desbloqueadas siguen siendo tuyas. Bueno, nuestras, pero las usas tú.`,
    ]),
    pick([
      `Novedad del planeta: ${nuevo}. Lo encontrarás en el suelo junto a la chatarra de siempre. Los pedidos te irán dando las máquinas nuevas.`,
      `Aquí hay algo nuevo en el suelo: ${nuevo}. La chatarra de siempre también está, por si la echabas de menos. Las máquinas nuevas llegarán con los pedidos.`,
      `Recurso nuevo detectado: ${nuevo}. Nuestro departamento de Geología (un becario con un palo) confirma que hay mucho. Los pedidos te darán las máquinas para tratarlo.`,
      `Este planeta trae ${nuevo}, además de la chatarra de toda la vida. Cumple pedidos y te iremos mandando la maquinaria que lo procesa.`,
    ]),
  ];
}

export function wrongItemMessage(item) {
  const it = ITEMS[item];
  return pick([
    `¿${it.name}? Eso no estaba en el pedido. Nos lo quedamos, pero no cuenta.`,
    `Hemos recibido ${it.plural} que nadie pidió. Lo archivamos "por si acaso".`,
    `Recordatorio: solo cuenta lo del pedido. Lo otro lo usamos de pisapapeles.`,
    `Nos ha llegado ${it.name.toLowerCase()} sin pedirlo. Un directivo lo ha puesto en su despacho como decoración. No cuenta.`,
    `Eso no es lo que pedimos. Lo hemos devuelto al remitente, que eres tú, pero no tenemos sello. Así que nos lo quedamos.`,
    `${it.name}: no figura en el pedido. Lo clasificamos como "regalo voluntario a la empresa". Gracias, supongo.`,
    `Mercancía no solicitada recibida. Contabilidad no sabe en qué casilla meterla y está llorando. Envía solo lo del pedido.`,
    `Hemos recibido ${it.plural}. Preciosidad, pero el pedido es otro. Revisa qué cinta llega a la nave.`,
    `Seguridad Laboral pregunta por qué llegan ${it.plural} a la nave. Nosotros también. No cuenta para el pedido.`,
    `${it.name} recibido por error. Lo hemos enviado al almacén de "cosas que nadie pidió", que ya ocupa tres plantas.`,
    `Esto no estaba en la lista. Lo usaremos para calzar la mesa de la sala de juntas. Gracias, pero no cuenta.`,
    `Pedimos una cosa y nos mandas otra. Muy creativo. La creatividad no está en tu contrato.`,
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
