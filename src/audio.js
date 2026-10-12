// Sonido de Scrap Factory: todo sintetizado con Web Audio, sin archivos.
// Estilo "chatarra simpática": clacs metálicos amables, una música de fondo
// generativa muy flojita y el rumor de las máquinas según cuánto trabajan.
// Nada de esto toca el estado de la partida: es solo presentación (por eso
// aquí sí se puede usar Math.random).
//
// Uso:
//   sfx.unlock()            en el primer toque (crea o reanuda el AudioContext)
//   sfx.play('place')       efectos cortos
//   sfx.setMuted(true)      silencia TODO y lo recuerda en localStorage
//   sfx.setAmbient(true)    activa el fondo: música + máquinas
//   sfx.setMusic(false)     apaga solo la música (se recuerda)
//   sfx.setActivity(0.5)    cuánto trabaja la fábrica (0..1), ~2 veces por segundo

const CLAVE_MUTE = 'scrapfactory.muted';
const CLAVE_MUSICA = 'scrapfactory.music';
const VOLUMEN_MAESTRO = 0.55;
const VOLUMEN_MUSICA = 0.6;     // ganancia del bus de música (las voces ya son flojas)
const VOLUMEN_RUMOR = 0.05;     // rumor de fábrica a nivel 1
const VOLUMEN_CLANC = 0.045;    // golpes mecánicos sueltos
const ANTICIPACION = 1.2;       // segundos que se programan por adelantado
const CADA_TICK = 250;          // ms entre vueltas del programador
const DUR_ACORDE = 8;           // segundos por acorde

let ctx = null;          // AudioContext (no se crea hasta unlock)
let maestro = null;      // GainNode general
let compresor = null;    // DynamicsCompressor para que no sature
let ruido = null;        // 1 s de ruido blanco para clacs
let ruidoMarron = null;  // ruido grave largo, en bucle sin costura, para el rumor
let muted = leerBool(CLAVE_MUTE, false);
let musicaOn = leerBool(CLAVE_MUSICA, true);
let quiereAmbiente = false;
let nivel = 0;           // actividad de la fábrica 0..1
let musica = null;       // estado de la música mientras suena
let maquinas = null;     // estado del sonido de máquinas mientras suena
let timer = null;        // setTimeout del programador
let contador = 0;        // para variar un poco los efectos

// Limitadores: última vez (en segundos del contexto) que sonó cada efecto
// frecuente, y separación mínima entre dos seguidos.
const ultimo = {};
const SEPARACION = { belt: 1 / 8, tap: 1 / 30, rotate: 1 / 20 };

function leerBool(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave);
    return v === null ? porDefecto : v === '1';
  } catch { return porDefecto; }
}

function guardarBool(clave, v) {
  try { localStorage.setItem(clave, v ? '1' : '0'); } catch { /* sin almacenamiento */ }
}

function claseContexto() {
  try {
    if (typeof window === 'undefined') return null;
    return window.AudioContext || window.webkitAudioContext || null;
  } catch { return null; }
}

const azar = (a, b) => a + Math.random() * (b - a);
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function reanudar() {
  try {
    const p = ctx.resume();
    if (p && p.catch) p.catch(() => {});
  } catch { /* nada */ }
}

// Crea el contexto, la cadena maestra y los buffers de ruido (una sola vez).
function crearContexto() {
  const AC = claseContexto();
  if (!AC) return false;
  ctx = new AC();
  compresor = ctx.createDynamicsCompressor();
  compresor.threshold.value = -18;
  compresor.knee.value = 12;
  compresor.ratio.value = 4;
  compresor.attack.value = 0.003;
  compresor.release.value = 0.2;
  maestro = ctx.createGain();
  maestro.gain.value = muted ? 0 : VOLUMEN_MAESTRO;
  maestro.connect(compresor);
  compresor.connect(ctx.destination);

  const sr = ctx.sampleRate;
  // Ruido blanco de 1 s para los clacs.
  ruido = ctx.createBuffer(1, sr, sr);
  const d = ruido.getChannelData(0);
  for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1;

  // Ruido marrón de 7 s con los extremos fundidos, para que el bucle no
  // tenga un "clic" periódico (eso sí que se notaría como algo repetitivo).
  const L = sr * 7;
  const X = Math.floor(sr * 0.5);
  const crudo = new Float32Array(L + X);
  let b = 0;
  for (let i = 0; i < L + X; i++) {
    b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    crudo[i] = b * 3.5;
  }
  ruidoMarron = ctx.createBuffer(1, L, sr);
  const m = ruidoMarron.getChannelData(0);
  for (let i = 0; i < L; i++) m[i] = crudo[i];
  for (let i = 0; i < X; i++) {
    const w = i / X;
    m[i] = crudo[i] * w + crudo[L + i] * (1 - w);
  }
  return true;
}

// Al acabar un nodo fuente, desconecta toda su cadena para no acumular.
// Si ya tenía otro aviso de fin, lo encadena.
function alAcabar(fuente, nodos, despues) {
  fuente.onended = () => {
    for (const nd of nodos) { try { nd.disconnect(); } catch { /* ya estaba */ } }
    if (despues) despues(fuente);
  };
}

// Tono con envolvente: ataque corto y caída exponencial.
// o: { tipo, f, f2 (deslizamiento), at (tiempo absoluto) o t (retardo), dur,
//      vol, ataque, filtro, q, detune, destino, fin (callback al acabar) }
function tono(o) {
  const t0 = o.at ?? (ctx.currentTime + (o.t || 0));
  const dur = o.dur || 0.1;
  const ataque = o.ataque ?? 0.005;
  const osc = ctx.createOscillator();
  osc.type = o.tipo || 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(o.vol ?? 0.2, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const nodos = [osc, g];
  let ultimoNodo = osc;
  if (o.filtro) {
    // Paso bajo para suavizar cuadradas y sierras.
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = o.filtro;
    fl.Q.value = o.q ?? 0.7;
    osc.connect(fl);
    ultimoNodo = fl;
    nodos.push(fl);
  }
  ultimoNodo.connect(g);
  g.connect(o.destino || maestro);
  alAcabar(osc, nodos, o.fin);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  return osc;
}

// Ráfaga de ruido filtrado (clacs, chasquidos, vapor).
// o: { at o t, dur, vol, tipoFiltro, f, f2, q, ataque, destino, fin }
function rafaga(o) {
  const t0 = o.at ?? (ctx.currentTime + (o.t || 0));
  const dur = o.dur || 0.05;
  const src = ctx.createBufferSource();
  src.buffer = ruido;
  src.loop = true; // por si la ráfaga dura más que el buffer (despegue)
  const fl = ctx.createBiquadFilter();
  fl.type = o.tipoFiltro || 'bandpass';
  fl.frequency.setValueAtTime(o.f || 2000, t0);
  if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
  fl.Q.value = o.q ?? 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(o.vol ?? 0.2, t0 + (o.ataque ?? 0.002));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(fl);
  fl.connect(g);
  g.connect(o.destino || maestro);
  alAcabar(src, [src, fl, g], o.fin);
  // Empieza en un punto distinto cada vez para que no suene idéntico.
  src.start(t0, azar(0, 0.8), dur + 0.05);
  src.stop(t0 + dur + 0.05);
  return src;
}

// Notas (Hz) que se usan en jingles.
const N = {
  G3: 196, C4: 261.63, E4: 329.63, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5,
};

// Una nota "campanita": triangular + un sinusoidal una octava arriba muy flojo.
function campana(f, t, dur, vol) {
  tono({ tipo: 'triangle', f, t, dur, vol });
  tono({ tipo: 'sine', f: f * 2, t, dur: dur * 0.7, vol: vol * 0.25 });
}

// Recetas de cada efecto.
const SONIDOS = {
  // Clac seco: golpe de ruido metálico + golpe grave corto.
  place() {
    rafaga({ dur: 0.045, vol: 0.28, f: 2200, q: 1.5 });
    tono({ tipo: 'triangle', f: 190, f2: 85, dur: 0.09, vol: 0.32 });
    tono({ tipo: 'sine', f: 1250, dur: 0.05, vol: 0.05, t: 0.004 });
  },
  // "Tok" suave y corto al trazar cinta (tope de 8 por segundo).
  belt() {
    const f = contador % 2 ? 640 : 560;
    tono({ tipo: 'sine', f, f2: f * 0.85, dur: 0.035, vol: 0.035, ataque: 0.004 });
  },
  // Chasquido que cae: barrido descendente + ruido que se oscurece.
  remove() {
    tono({ tipo: 'square', f: 520, f2: 110, dur: 0.14, vol: 0.13, filtro: 1400 });
    rafaga({ dur: 0.12, vol: 0.16, tipoFiltro: 'lowpass', f: 4000, f2: 300, q: 0.8 });
  },
  // Clic metálico pequeño: dos pings agudos casi a la vez.
  rotate() {
    rafaga({ dur: 0.02, vol: 0.14, f: 4200, q: 3 });
    tono({ tipo: 'sine', f: 1500, dur: 0.06, vol: 0.08 });
    tono({ tipo: 'sine', f: 2240, dur: 0.045, vol: 0.05, t: 0.012 });
  },
  // Dos notas que bajan.
  undo() {
    campana(N.E5, 0, 0.12, 0.13);
    campana(N.B4, 0.09, 0.16, 0.13);
  },
  // Ya no suena nada por pieza entregada (resultaba repetitivo).
  deliver() {},
  // Jingle alegre de pedido cumplido: C-E-G-C.
  order() {
    const notas = [N.C5, N.E5, N.G5, N.C6];
    notas.forEach((f, i) => campana(f, i * 0.09, i === 3 ? 0.4 : 0.16, 0.14));
    tono({ tipo: 'sine', f: N.C4, t: 0.27, dur: 0.4, vol: 0.08 });
  },
  // Fanfarria brillante: arpegio rápido + acorde final con brillo.
  unlock() {
    const arpegio = [N.G4, N.C5, N.E5, N.G5];
    arpegio.forEach((f, i) => campana(f, i * 0.06, 0.14, 0.12));
    const t = 0.26;
    for (const f of [N.C5, N.E5, N.G5, N.C6]) {
      tono({ tipo: 'square', f, t, dur: 0.6, vol: 0.045, filtro: 2200, ataque: 0.02 });
      tono({ tipo: 'triangle', f, t, dur: 0.7, vol: 0.06, ataque: 0.02, detune: 6 });
    }
    tono({ tipo: 'sine', f: N.E6, t: t + 0.05, dur: 0.5, vol: 0.04 });
    rafaga({ t, dur: 0.35, vol: 0.05, tipoFiltro: 'highpass', f: 6000, q: 0.5, ataque: 0.02 });
  },
  // Despegue: sierra filtrada que sube + rumor de motor creciente (~1,2 s).
  launch() {
    const t0 = ctx.currentTime;
    const dur = 1.25;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t0);
    osc.frequency.exponentialRampToValueAtTime(620, t0 + dur);
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(140, t0);
    osc2.frequency.exponentialRampToValueAtTime(1240, t0 + dur);
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(250, t0);
    fl.frequency.exponentialRampToValueAtTime(2400, t0 + dur);
    fl.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.16, t0 + 0.25);
    g.gain.setValueAtTime(0.16, t0 + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(fl);
    osc2.connect(fl);
    fl.connect(g);
    g.connect(maestro);
    alAcabar(osc, [osc, osc2, fl, g]);
    osc.start(t0); osc2.start(t0);
    osc.stop(t0 + dur + 0.02); osc2.stop(t0 + dur + 0.02);
    rafaga({ dur, vol: 0.14, f: 180, f2: 1600, q: 0.9, ataque: 0.3 });
    campana(N.G5, dur - 0.15, 0.25, 0.06);
  },
  // Buzz corto y grave, en dos pulsos.
  error() {
    tono({ tipo: 'square', f: 110, dur: 0.11, vol: 0.14, filtro: 650 });
    tono({ tipo: 'square', f: 98, t: 0.12, dur: 0.14, vol: 0.14, filtro: 600 });
  },
  // Clic suave de botón.
  tap() {
    tono({ tipo: 'sine', f: 1050, f2: 900, dur: 0.035, vol: 0.07, ataque: 0.002 });
    rafaga({ dur: 0.012, vol: 0.03, f: 5000, q: 2 });
  },
  // Aviso de pedido lento: dos tonos suaves.
  slow() {
    tono({ tipo: 'sine', f: 523.25, dur: 0.18, vol: 0.1, ataque: 0.02 });
    tono({ tipo: 'sine', f: 392, t: 0.2, dur: 0.24, vol: 0.1, ataque: 0.02 });
    tono({ tipo: 'triangle', f: 392, t: 0.2, dur: 0.2, vol: 0.03, ataque: 0.02 });
  },
};

// =====================================================================
// Música de fondo generativa
// =====================================================================
// Pad de acordes muy suave (4 acordes, ~8 s cada uno) y encima notas sueltas
// tipo marimba de una pentatónica, a intervalos irregulares, con eco suave.
// Cada pocos acordes cambia la progresión, el registro, o hay silencios.

// Acordes en notas MIDI (voicing grave y cerrado) + escala para la melodía.
const PENTA_MAYOR = [0, 2, 4, 7, 9];      // C D E G A
const PENTA_MIXO = [0, 2, 5, 7, 10];      // C D F G Bb
const PROGRESIONES = [
  // Cmaj7 - Am7 - Fmaj7 - G6
  [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 52, 59]].map((n) => ({ n, e: PENTA_MAYOR })),
  // Cadd9 - Bb - Fadd9 - C (sabor mixolidio)
  [
    { n: [48, 55, 62, 64], e: PENTA_MAYOR }, { n: [46, 53, 58, 62], e: PENTA_MIXO },
    { n: [41, 48, 55, 57], e: PENTA_MIXO }, { n: [48, 52, 55, 60], e: PENTA_MAYOR },
  ],
  // Fmaj7 - G - Em7 - Am7
  [[41, 48, 52, 57], [43, 50, 55, 59], [40, 47, 50, 55], [45, 52, 55, 60]].map((n) => ({ n, e: PENTA_MAYOR })),
];

function arrancarMusica() {
  if (musica || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t0);
    bus.gain.setTargetAtTime(VOLUMEN_MUSICA, t0, 1.5);
    bus.connect(maestro);

    // Pad: un paso bajo común para que quede aterciopelado.
    const padFiltro = ctx.createBiquadFilter();
    padFiltro.type = 'lowpass';
    padFiltro.frequency.value = 900;
    padFiltro.Q.value = 0.5;
    padFiltro.connect(bus);

    // Eco suave para las campanitas: delay con realimentación baja y oscura.
    const envio = ctx.createGain();
    envio.gain.value = 0.35;
    const eco = ctx.createDelay(2);
    eco.delayTime.value = 0.42;
    const ecoFiltro = ctx.createBiquadFilter();
    ecoFiltro.type = 'lowpass';
    ecoFiltro.frequency.value = 2200;
    const realim = ctx.createGain();
    realim.gain.value = 0.28;
    envio.connect(eco);
    eco.connect(ecoFiltro);
    ecoFiltro.connect(realim);
    realim.connect(eco);
    ecoFiltro.connect(bus);

    musica = {
      bus, padFiltro, envio,
      nodos: [bus, padFiltro, envio, eco, ecoFiltro, realim],
      fuentes: new Set(),
      prog: elegir(PROGRESIONES),
      idx: 0,
      vueltas: 0,
      proxAcorde: t0 + 0.3,
      acordeActual: null,
      finAcorde: t0 + 0.3,
      proxNota: t0 + azar(2, 4),
      silencioHasta: 0,
      registro: 12,         // desplazamiento de la melodía sobre C4
      cambioRegistro: 3,    // acordes hasta el próximo cambio de registro
      ultimoGrado: 2,
    };
  } catch { musica = null; }
}

// Registra una fuente de la música para poder pararla y limpiarla.
function fuenteMusica(m) {
  return (src) => {
    m.fuentes.add(src);
    const prev = src.onended;
    src.onended = (e) => { m.fuentes.delete(src); if (prev) prev.call(src, e); };
  };
}

function pararMusica() {
  if (!musica) return;
  const m = musica;
  musica = null;
  try {
    const t0 = ctx.currentTime;
    m.bus.gain.cancelScheduledValues(t0);
    m.bus.gain.setValueAtTime(m.bus.gain.value, t0);
    m.bus.gain.linearRampToValueAtTime(0, t0 + 1.2);
    for (const f of m.fuentes) { try { f.stop(t0 + 1.3); } catch { /* ya parada */ } }
  } catch { /* nada */ }
  // El eco tiene un lazo de realimentación: hay que desconectarlo a mano.
  setTimeout(() => {
    for (const nd of m.nodos) { try { nd.disconnect(); } catch { /* ya estaba */ } }
  }, 2500);
}

// Una voz de pad: dos osciladores suaves con ataque y relajación largos.
function vozPad(m, f, at, dur, vol) {
  const registrar = fuenteMusica(m);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 2.5);
  g.gain.setValueAtTime(vol, at + dur - 3);
  g.gain.linearRampToValueAtTime(0.0001, at + dur);
  g.connect(m.padFiltro);
  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f;
  o2.detune.value = azar(4, 8);
  o1.connect(g);
  o2.connect(g);
  alAcabar(o1, [o1, g]);
  alAcabar(o2, [o2]);
  registrar(o1);
  registrar(o2);
  o1.start(at); o2.start(at);
  o1.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
}

// Programa un acorde (pad + bajo suave).
function programarAcorde(m, at) {
  // Cada vuelta completa puede cambiar de progresión.
  if (m.idx === 0 && m.vueltas > 0 && Math.random() < 0.5) m.prog = elegir(PROGRESIONES);
  const acorde = m.prog[m.idx];
  m.acordeActual = acorde;
  m.finAcorde = at + DUR_ACORDE;
  const dur = DUR_ACORDE + 2.5; // se solapa con el siguiente

  const r = Math.random();
  if (r < 0.08) {
    // Respiro: este acorde el pad descansa.
  } else if (r < 0.2) {
    // Versión ligera: solo fundamental y quinta.
    vozPad(m, midiHz(acorde.n[0]), at, dur, 0.009);
    vozPad(m, midiHz(acorde.n[1]), at, dur, 0.008);
  } else {
    for (const n of acorde.n) vozPad(m, midiHz(n), at, dur, 0.011);
  }
  // Bajo muy suave de vez en cuando.
  if (Math.random() < 0.6) {
    fuenteMusica(m)(tono({
      tipo: 'sine', f: midiHz(acorde.n[0] - 12), at, dur: 5, vol: 0.025, ataque: 0.8,
      destino: m.bus,
    }));
  }

  // Variaciones: silencios de melodía y cambios de registro.
  if (Math.random() < 0.22) m.silencioHasta = m.finAcorde;
  if (--m.cambioRegistro <= 0) {
    m.registro = elegir([0, 12, 12, 24]);
    m.cambioRegistro = 2 + Math.floor(Math.random() * 4);
  }
  m.idx = (m.idx + 1) % m.prog.length;
  if (m.idx === 0) m.vueltas++;
}

// Una nota tipo marimba/campanita: fundamental + parcial ~4x que se apaga antes.
function notaMarimba(m, f, at, vol) {
  const registrar = fuenteMusica(m);
  const salida = ctx.createGain();
  salida.gain.value = 1;
  salida.connect(m.bus);
  salida.connect(m.envio);
  const fin = () => { try { salida.disconnect(); } catch { /* ya estaba */ } };
  registrar(tono({ tipo: 'sine', f, at, dur: 1.1, vol, ataque: 0.008, destino: salida, fin }));
  registrar(tono({ tipo: 'sine', f: f * 3.98, at, dur: 0.18, vol: vol * 0.18, ataque: 0.004, destino: salida }));
  registrar(tono({ tipo: 'triangle', f: f * 2, at, dur: 0.5, vol: vol * 0.15, ataque: 0.006, destino: salida }));
}

function programarNota(m, at) {
  if (at >= m.silencioHasta && m.acordeActual) {
    const escala = m.acordeActual.e;
    // Paseo por la escala: pasos cortos, sin grandes saltos.
    const paso = elegir([-2, -1, -1, 0, 1, 1, 2]);
    m.ultimoGrado = Math.max(0, Math.min(9, m.ultimoGrado + paso));
    const g = m.ultimoGrado;
    const midi = 60 + m.registro + escala[g % 5] + 12 * Math.floor(g / 5) - 12;
    notaMarimba(m, midiHz(midi), at, azar(0.022, 0.034));
  }
  // Siguiente nota a un intervalo irregular: sueltas, frasecitas y pausas.
  const r = Math.random();
  let hueco;
  if (r < 0.3) hueco = azar(0.28, 0.5);       // frasecita
  else if (r < 0.88) hueco = azar(0.9, 2.6);  // nota suelta
  else hueco = azar(3.5, 7);                  // pausa larga
  m.proxNota = at + hueco;
}

function tickMusica(ahora) {
  const m = musica;
  if (!m) return;
  // Si el contexto estuvo parado y nos quedamos atrás, recolocar.
  if (m.proxAcorde < ahora - 1) m.proxAcorde = ahora + 0.1;
  if (m.proxNota < ahora - 1) m.proxNota = ahora + 0.5;
  const limite = ahora + ANTICIPACION;
  while (m.proxAcorde < limite) {
    programarAcorde(m, m.proxAcorde);
    m.proxAcorde += DUR_ACORDE;
  }
  while (m.proxNota < limite) programarNota(m, m.proxNota);
}

// =====================================================================
// Sonido de máquinas según la actividad
// =====================================================================
// Rumor grave (ruido marrón filtrado, sin LFO) cuyo volumen sigue al nivel, y
// golpes mecánicos sueltos (pistón, engranaje, vapor, clanc) a intervalos
// aleatorios, panoramizados un poco a izquierda y derecha.

function arrancarMaquinas() {
  if (maquinas || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(maestro);
    const src = ctx.createBufferSource();
    src.buffer = ruidoMarron;
    src.loop = true;
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = 280;
    fl.Q.value = 0.5;
    const gRumor = ctx.createGain();
    gRumor.gain.setValueAtTime(0, t0);
    src.connect(fl); fl.connect(gRumor); gRumor.connect(bus);
    src.start(t0, azar(0, 6));
    maquinas = {
      bus, src, gRumor,
      nodos: [bus, src, fl, gRumor],
      proxClanc: t0 + azar(0.3, 1.5),
      ceroDesde: null,
      ultimoTipo: null,
    };
  } catch { maquinas = null; }
}

function pararMaquinas(rapido) {
  if (!maquinas) return;
  const q = maquinas;
  maquinas = null;
  try {
    const t0 = ctx.currentTime;
    const fundido = rapido ? 0.3 : 1;
    q.bus.gain.cancelScheduledValues(t0);
    q.bus.gain.setValueAtTime(q.bus.gain.value, t0);
    q.bus.gain.linearRampToValueAtTime(0, t0 + fundido);
    alAcabar(q.src, q.nodos);
    q.src.stop(t0 + fundido + 0.05);
  } catch { /* nada */ }
}

// Golpes mecánicos. k = factor de tono, v = volumen, d = destino (panner).
const CLANCS = {
  piston(at, k, v, d, fin) {
    rafaga({ at, dur: 0.08, vol: v, f: 700 * k, q: 1.5, destino: d });
    tono({ at, tipo: 'triangle', f: 130 * k, f2: 65 * k, dur: 0.14, vol: v * 1.3, destino: d, fin });
  },
  engranaje(at, k, v, d, fin) {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const t = at + i * azar(0.06, 0.09);
      tono({ at: t, tipo: 'sine', f: 2100 * k, dur: 0.03, vol: v * 0.5, destino: d });
      tono({ at: t, tipo: 'sine', f: 3170 * k, dur: 0.02, vol: v * 0.25, destino: d, fin: i === n - 1 ? fin : null });
    }
  },
  vapor(at, k, v, d, fin) {
    rafaga({ at, dur: 0.3, vol: v * 0.7, f: 2400 * k, f2: 1300 * k, q: 0.8, ataque: 0.05, destino: d, fin });
  },
  clanc(at, k, v, d, fin) {
    tono({ at, tipo: 'sine', f: 420 * k, dur: 0.4, vol: v * 0.55, destino: d, fin });
    tono({ at, tipo: 'sine', f: 1090 * k, dur: 0.22, vol: v * 0.28, destino: d });
    tono({ at, tipo: 'sine', f: 1870 * k, dur: 0.12, vol: v * 0.18, destino: d });
    rafaga({ at, dur: 0.03, vol: v * 0.4, f: 3000 * k, q: 2, destino: d });
  },
};
const TIPOS_CLANC = ['piston', 'piston', 'engranaje', 'vapor', 'clanc'];

function programarClanc(q, at) {
  let tipo = elegir(TIPOS_CLANC);
  if (tipo === q.ultimoTipo) tipo = elegir(TIPOS_CLANC);
  q.ultimoTipo = tipo;
  // Salida propia con panorama; se desconecta cuando acaba su voz más larga.
  const g = ctx.createGain();
  g.gain.value = 1;
  let ultimoNodo = g;
  const nodos = [g];
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = azar(-0.6, 0.6);
    g.connect(p);
    ultimoNodo = p;
    nodos.push(p);
  }
  ultimoNodo.connect(q.bus);
  const fin = () => { for (const nd of nodos) { try { nd.disconnect(); } catch { /* ya estaba */ } } };
  const v = VOLUMEN_CLANC * azar(0.6, 1) * (0.6 + 0.4 * nivel);
  CLANCS[tipo](at, azar(0.85, 1.15), v, g, fin);
}

function tickMaquinas(ahora) {
  const q = maquinas;
  if (!q) return;
  if (nivel <= 0.01) {
    // Sin actividad: tras el fundido se apaga del todo.
    if (q.ceroDesde !== null && ahora - q.ceroDesde > 4) pararMaquinas(true);
    return;
  }
  if (q.proxClanc < ahora) q.proxClanc = ahora + azar(0.05, 0.4);
  const limite = ahora + ANTICIPACION;
  while (q.proxClanc < limite) {
    programarClanc(q, q.proxClanc);
    // Intervalo exponencial: de media 2*nivel golpes por segundo, nunca < 0,35 s.
    const media = 1 / (2 * nivel);
    q.proxClanc += Math.max(0.35, -Math.log(1 - Math.random()) * media);
  }
}

// =====================================================================
// Coordinación del fondo
// =====================================================================

function fondoPermitido() { return !!ctx && quiereAmbiente && !muted; }

// Pone música y máquinas en el estado que toca según las preferencias.
function actualizarFondo() {
  try {
    if (fondoPermitido() && musicaOn) arrancarMusica();
    else pararMusica();

    if (!fondoPermitido()) {
      pararMaquinas(true);
    } else if (nivel > 0.01) {
      arrancarMaquinas();
      const q = maquinas;
      if (q) {
        q.ceroDesde = null;
        q.gRumor.gain.setTargetAtTime(VOLUMEN_RUMOR * nivel, ctx.currentTime, 0.8);
      }
    } else if (maquinas) {
      if (maquinas.ceroDesde === null) maquinas.ceroDesde = ctx.currentTime;
      maquinas.gRumor.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    }
  } catch { /* nada */ }
  asegurarTick();
}

// Programador: cada CADA_TICK ms programa lo que cae en los próximos
// ANTICIPACION segundos usando el reloj del contexto (preciso aunque el
// temporizador vaya con retraso). Se detiene solo cuando no hay nada.
function asegurarTick() {
  if (timer === null && (musica || maquinas)) timer = setTimeout(tick, 0);
}

function tick() {
  timer = null;
  if (!ctx || (!musica && !maquinas)) return;
  try {
    const ahora = ctx.currentTime;
    tickMusica(ahora);
    tickMaquinas(ahora);
  } catch { /* nada */ }
  if (musica || maquinas) timer = setTimeout(tick, CADA_TICK);
}

// Con la pestaña oculta se suspende el contexto (ahorra batería en el móvil).
try {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      try {
        if (!ctx) return;
        const p = document.hidden ? ctx.suspend() : ctx.resume();
        if (p && p.catch) p.catch(() => {});
      } catch { /* nada */ }
    });
  }
} catch { /* nada */ }

export const sfx = {
  // Crear o reanudar el contexto. Llamar desde un gesto del usuario.
  unlock() {
    try {
      if (!ctx && !crearContexto()) return;
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') reanudar();
      actualizarFondo();
    } catch { /* sin audio, el juego sigue */ }
  },

  play(nombre) {
    try {
      if (muted || !ctx || !ruido) return;
      const receta = SONIDOS[nombre];
      if (!receta) return;
      if (ctx.state !== 'running') {
        // iOS puede dejarlo suspendido tras una interrupción.
        reanudar();
        return;
      }
      const sep = SEPARACION[nombre];
      if (sep) {
        const ahora = ctx.currentTime;
        if (ultimo[nombre] !== undefined && ahora - ultimo[nombre] < sep) return;
        ultimo[nombre] = ahora;
      }
      contador = (contador + 1) % 1000000;
      receta();
    } catch { /* un sonido fallido no debe romper nada */ }
  },

  // Silencia TODO (efectos, música y máquinas).
  setMuted(v) {
    muted = !!v;
    guardarBool(CLAVE_MUTE, muted);
    try {
      if (!ctx) return;
      const t0 = ctx.currentTime;
      maestro.gain.cancelScheduledValues(t0);
      maestro.gain.setValueAtTime(maestro.gain.value, t0);
      maestro.gain.linearRampToValueAtTime(muted ? 0 : VOLUMEN_MAESTRO, t0 + 0.08);
    } catch { /* nada */ }
    actualizarFondo();
  },

  get muted() { return muted; },

  // Activa o desactiva el fondo (música + máquinas).
  setAmbient(v) {
    quiereAmbiente = !!v;
    actualizarFondo();
  },

  // Solo la música; las máquinas siguen sonando si no está silenciado.
  setMusic(v) {
    musicaOn = !!v;
    guardarBool(CLAVE_MUSICA, musicaOn);
    actualizarFondo();
  },

  get music() { return musicaOn; },

  // Fracción de fábrica trabajando (0..1). Con 0, silencio de máquinas.
  setActivity(v) {
    const n = Number(v);
    nivel = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    actualizarFondo();
  },
};
