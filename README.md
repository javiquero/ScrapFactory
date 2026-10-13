# Scrap Factory

Juego web de construir fábricas, tranquilo y sin combate. Eres un colono solo en el planeta SC-7 y Chatarrex S.A., una megacorporación bastante cutre, te va mandando pedidos: de chatarra a placas, alambre, engranajes, motores y robots de limpieza. Montas extractores, cintas y máquinas, y lo llevas todo hasta tu nave. Cada pedido cumplido te desbloquea maquinaria nueva, y los pedidos grandes piden un ritmo mínimo de piezas por segundo: una sola línea no basta, hay que montar varias en paralelo. Al terminar un planeta, despegas a otro con un recurso nuevo (ver `docs/planetas.md`).

Inspirado en Builderment, pero en el navegador: funciona igual en el móvil que en el ordenador.

## Cómo se juega

- **Mover**: arrastra para mover el mapa.
- **Tocar un edificio** lo gira (con cualquier herramienta menos Quitar). **Mantenerlo pulsado** lo copia (el siguiente toque pone otro igual, con la misma orientación) y abre su ficha para girarlo o quitarlo.
- **Cinta**: arrastra el dedo desde donde empieza hasta donde acaba; se traza sola en forma de L.
- **Edificios**: tócalos sobre el mapa, o arrastra para colocar varios seguidos. Encima de una cinta, la sustituyen. Al soltar el dedo vuelves a la mano; lo elegido sigue en la barra para repetir.
- **Cruzar cintas**: el Puente (se desbloquea en el pedido 2). Con él, si trazas una cinta que atraviesa otra en perpendicular, el puente se pone solo; una pasa por encima de la otra sin mezclarse. También se puede colocar a mano en el cruce.
- **Copiar / Pegar**: con Copiar arrastra para marcar un trozo de fábrica; el botón pasa a Pegar y el siguiente toque (o arrastre y soltar) lo estampa con su esquina ahí. Lo que no quepa se salta. Tocar Pegar otra vez vuelve a Copiar.
- **Divisor**: mantenlo pulsado y en su ficha abre o cierra cada salida (izquierda, frente, derecha).
- **Quitar**: toca un edificio, o arrastra para marcar un rectángulo y quitar todo lo que haya dentro.
- **Deshacer**: revierte lo último que construiste, giraste o quitaste (hasta 50 pasos; también `Ctrl+Z`).
- **Dos dedos**: mover y hacer zoom con cualquier herramienta. En ordenador, rueda del ratón para el zoom y `R` para cambiar la orientación de lo que vas a colocar.
- **Pantalla principal**: Continuar o Partida nueva; la partida espera en pausa detrás. Arriba a la derecha: sonido y estadísticas de producción (qué llega a la nave por segundo y cuántas máquinas trabajan).
- **Mapa**: obstáculos (rocas, charcas, montañas de neumáticos…) por los que no se puede construir; más cuanto más lejos el planeta. Nunca encierran un recurso.
- **Tutorial**: sale solo en partidas nuevas (moverse, extraer, girar, cintas y los dos primeros pedidos). Se puede repetir desde el catálogo.
- **Nave**: 2×2 casillas, fija. Recibe por los cuatro lados (dos entradas por lado). Tocarla muestra lo enviado.
- **Más**: catálogo con la maquinaria que ya tienes (lo demás aparece al desbloquearlo). Lo que eliges pasa a la barra de abajo.

## Ritmos

Al mismo nivel, dos extractores llenan una cinta y una cinta llena alimenta justo una prensa; una prensa saca justo las placas que necesita una ensambladora. De momento no hay mejoras de velocidad: el ritmo se consigue poniendo más líneas. La cadena completa está en `docs/planetas.md`.

| Cinta | Extractor | Prensa (entra → sale) | Ensambladora (entra → sale) |
| --- | --- | --- | --- |
| 5 obj/s | 2,5 chatarra/s | 5 chatarra → 2,5 placas/s | 2,5 placas + 1,25 chatarra → 1,25 engranajes/s |

La partida se guarda sola en el navegador.

## Desarrollo

Sin compilación: HTML, CSS y módulos de JavaScript. PixiJS va incluido en `vendor/`.

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
node tests/sim.test.mjs       # pruebas de la simulación
```

Cada push a `main` se despliega solo en Vercel.

| Archivo | Qué hace |
| --- | --- |
| `src/defs.js` | Objetos, edificios y recetas, planetas y pedidos (cantidad, ritmo mínimo y qué desbloquean). Aquí se ajusta el equilibrio. |
| `src/state.js` | Estado de la partida y las **acciones** (único punto que lo modifica). |
| `src/sim.js` | Simulación de cintas y máquinas, paso fijo y determinista. |
| `src/world.js` | Generación del mapa a partir de una semilla. |
| `src/textures.js` | Reúne todos los gráficos. |
| `src/sprites/` | Un archivo por grupo de gráficos: `belts.js` (cintas, curvas y uniones), `machines.js` (máquinas y la nave), `terrain.js`, `items.js`, y `common.js` con la paleta. |
| `dev/sprites.html` | Muestrario de todos los sprites para revisar el arte sin jugar (`?filter=^(nave\|robotica)_&scale=3`; el filtro es una expresión regular). |
| `src/beltShapes.js` | Decide qué forma lleva cada cinta (recta, curva, unión) y por dónde pasan los objetos. |
| `src/render.js` | Pintado con PixiJS y cámara. |
| `src/input.js` | Gestos táctiles y de ratón. |
| `src/ui.js`, `src/messages.js` | Interfaz (pedido con su ritmo, catálogo) y comunicados de Chatarrex S.A. |
| `docs/planetas.md` | Diseño de la progresión: planetas, nave, economía y recetas. |
