// Sonido de Scrap Factory: todo sintetizado con Web Audio, sin archivos.
// Estilo "chatarra simpática": clacs metálicos amables, notas suaves y un
// zumbido de fábrica de fondo muy bajo. Nada de esto toca el estado de la
// partida: es solo presentación.
//
// Uso:
//   sfx.unlock()          en el primer toque (crea o reanuda el AudioContext)
//   sfx.play('place')     efectos cortos
//   sfx.setMuted(true)    silencia y lo recuerda en localStorage
//   sfx.setAmbient(true)  zumbido de fábrica en bucle

const CLAVE_MUTE = 'scrapfactory.muted';
const VOLUMEN_MAESTRO = 0.55;
const VOLUMEN_AMBIENTE = 0.05;

let ctx = null;          // AudioContext (no se crea hasta unlock)
let maestro = null;      // GainNode general
let compresor = null;    // DynamicsCompressor para que no sature
let ruido = null;        // AudioBuffer de ruido blanco reutilizable
let muted = leerMute();
let quiereAmbiente = false;
let ambiente = null;     // nodos del zumbido mientras suena
let contador = 0;        // para variar un poco el tono sin Math.random

// Limitadores: última vez (en segundos del contexto) que sonó cada efecto
// frecuente, y separación mínima entre dos seguidos.
const ultimo = {};
const SEPARACION = { deliver: 1 / 6, belt: 1 / 25, tap: 1 / 30, rotate: 1 / 20 };

function leerMute() {
  try { return localStorage.getItem(CLAVE_MUTE) === '1'; } catch { return false; }
}

function guardarMute(v) {
  try { localStorage.setItem(CLAVE_MUTE, v ? '1' : '0'); } catch { /* sin almacenamiento */ }
}

function claseContexto() {
  try {
    if (typeof window === 'undefined') return null;
    return window.AudioContext || window.webkitAudioContext || null;
  } catch { return null; }
}

// Crea el contexto, la cadena maestra y el buffer de ruido (una sola vez).
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

  // 1 s de ruido blanco con un generador pseudoaleatorio fijo (LCG).
  const n = ctx.sampleRate;
  ruido = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = ruido.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    d[i] = (s / 4294967296) * 2 - 1;
  }
  return true;
}

// Al acabar un nodo fuente, desconecta toda su cadena para no acumular.
function alAcabar(fuente, nodos) {
  fuente.onended = () => {
    for (const nd of nodos) { try { nd.disconnect(); } catch { /* ya estaba */ } }
  };
}

// Tono con envolvente: ataque corto y caída exponencial.
// o: { tipo, f, f2 (deslizamiento), t (retardo), dur, vol, ataque, filtro, q, destino }
function tono(o) {
  const t0 = ctx.currentTime + (o.t || 0);
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
  alAcabar(osc, nodos);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Ráfaga de ruido filtrado (clacs, chasquidos, rumor de motor).
// o: { t, dur, vol, tipoFiltro, f, f2, q, ataque }
function rafaga(o) {
  const t0 = ctx.currentTime + (o.t || 0);
  const dur = o.dur || 0.05;
  const src = ctx.createBufferSource();
  src.buffer = ruido;
  src.loop = true; // por si la ráfaga dura más que el buffer (despegue)
  // Empieza en un punto distinto cada vez para que no suene idéntico.
  const desde = ((contador * 0.137) % 0.8);
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
  g.connect(maestro);
  alAcabar(src, [src, fl, g]);
  src.start(t0, desde, dur + 0.05);
  src.stop(t0 + dur + 0.05);
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
  // Tictac muy corto y bajo; alterna dos alturas.
  belt() {
    const f = contador % 2 ? 1100 : 950;
    tono({ tipo: 'triangle', f, dur: 0.025, vol: 0.05, ataque: 0.002 });
    rafaga({ dur: 0.015, vol: 0.04, f: 3500, q: 2 });
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
  // Pop muy suave; sube y baja por una escala corta para no aburrir.
  deliver() {
    const escala = [N.C5, N.D5, N.E5, N.G5, N.A5];
    const f = escala[contador % escala.length];
    tono({ tipo: 'sine', f: f * 0.8, f2: f * 1.25, dur: 0.06, vol: 0.06, ataque: 0.003 });
  },
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

// ---- Ambiente: zumbido de fábrica muy bajo ----

function arrancarAmbiente() {
  if (ambiente || !ctx || muted) return;
  try {
    const t0 = ctx.currentTime;
    const salida = ctx.createGain();
    salida.gain.setValueAtTime(0.0001, t0);
    salida.gain.linearRampToValueAtTime(VOLUMEN_AMBIENTE, t0 + 2.5);
    salida.connect(maestro);

    // Drone: dos osciladores ligeramente desafinados, oscurecidos.
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 320;
    filtro.Q.value = 0.6;
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = 55.4;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    o1.connect(filtro);
    o2.connect(g2); g2.connect(filtro);
    const gDrone = ctx.createGain();
    gDrone.gain.value = 0.7;
    filtro.connect(gDrone); gDrone.connect(salida);

    // Ruido grave de nave industrial.
    const r = ctx.createBufferSource();
    r.buffer = ruido;
    r.loop = true;
    const fr = ctx.createBiquadFilter();
    fr.type = 'lowpass';
    fr.frequency.value = 420;
    fr.Q.value = 0.5;
    const gr = ctx.createGain();
    gr.gain.value = 0.5;
    r.connect(fr); fr.connect(gr); gr.connect(salida);

    // LFO lento: respira el filtro del drone y el volumen del ruido.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    const lfoFiltro = ctx.createGain();
    lfoFiltro.gain.value = 90;
    const lfoRuido = ctx.createGain();
    lfoRuido.gain.value = 0.2;
    lfo.connect(lfoFiltro); lfoFiltro.connect(filtro.frequency);
    lfo.connect(lfoRuido); lfoRuido.connect(gr.gain);

    o1.start(t0); o2.start(t0); r.start(t0); lfo.start(t0);
    ambiente = {
      salida,
      fuentes: [o1, o2, r, lfo],
      nodos: [salida, filtro, o1, o2, g2, gDrone, r, fr, gr, lfo, lfoFiltro, lfoRuido],
    };
  } catch { ambiente = null; }
}

function pararAmbiente() {
  if (!ambiente || !ctx) { ambiente = null; return; }
  const a = ambiente;
  ambiente = null;
  try {
    const t0 = ctx.currentTime;
    a.salida.gain.cancelScheduledValues(t0);
    a.salida.gain.setValueAtTime(a.salida.gain.value, t0);
    a.salida.gain.linearRampToValueAtTime(0.0001, t0 + 0.6);
    for (const f of a.fuentes) f.stop(t0 + 0.65);
    a.fuentes[0].onended = () => {
      for (const nd of a.nodos) { try { nd.disconnect(); } catch { /* ya estaba */ } }
    };
  } catch { /* nada */ }
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
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
      }
      if (quiereAmbiente && !muted) arrancarAmbiente();
    } catch { /* sin audio, el juego sigue */ }
  },

  play(nombre) {
    try {
      if (muted || !ctx || !ruido) return;
      const receta = SONIDOS[nombre];
      if (!receta) return;
      if (ctx.state !== 'running') {
        // iOS puede dejarlo suspendido tras una interrupción.
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
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

  setMuted(v) {
    muted = !!v;
    guardarMute(muted);
    try {
      if (!ctx) return;
      const t0 = ctx.currentTime;
      maestro.gain.cancelScheduledValues(t0);
      maestro.gain.setValueAtTime(maestro.gain.value, t0);
      maestro.gain.linearRampToValueAtTime(muted ? 0 : VOLUMEN_MAESTRO, t0 + 0.08);
      if (muted) pararAmbiente();
      else if (quiereAmbiente) arrancarAmbiente();
    } catch { /* nada */ }
  },

  get muted() { return muted; },

  setAmbient(v) {
    quiereAmbiente = !!v;
    try {
      if (quiereAmbiente) arrancarAmbiente();
      else pararAmbiente();
    } catch { /* nada */ }
  },
};
