# Scrap Factory

Juego web de construir fábricas, tranquilo y sin combate. Eres un colono solo en el planeta SC-7 y Chatarrex S.A., una megacorporación bastante cutre, te va mandando pedidos: de chatarra a placas, alambre, engranajes, motores y robots de limpieza. Montas extractores, cintas y máquinas, y lo llevas todo hasta tu nave. Chatarrex te paga lo que pide en cada pedido (cada pieza y un extra al completarlo), y con ese dinero compras máquinas nuevas y mejoras. Al terminar un planeta, despegas a otro con un recurso nuevo (ver `docs/planetas.md`).

Inspirado en Builderment, pero en el navegador: funciona igual en el móvil que en el ordenador.

## Cómo se juega

- **Mover**: arrastra para mover el mapa.
- **Tocar un edificio** lo gira (con cualquier herramienta menos Quitar). **Mantenerlo pulsado** lo copia (el siguiente toque pone otro igual, con la misma orientación) y abre su ficha para girarlo o quitarlo.
- **Cinta**: arrastra el dedo desde donde empieza hasta donde acaba; se traza sola en forma de L.
- **Edificios**: tócalos sobre el mapa, o arrastra para colocar varios seguidos. Encima de una cinta, la sustituyen. Al soltar el dedo vuelves a la mano; lo elegido sigue en la barra para repetir.
- **Quitar**: toca un edificio, o arrastra para marcar un rectángulo y quitar todo lo que haya dentro.
- **Deshacer**: revierte lo último que construiste, giraste o quitaste (hasta 50 pasos; también `Ctrl+Z`). Las compras no se deshacen.
- **Dos dedos**: mover y hacer zoom con cualquier herramienta. En ordenador, rueda del ratón para el zoom y `R` para cambiar la orientación de lo que vas a colocar.
- **Tutorial**: sale solo en partidas nuevas (moverse, extraer, girar, cintas y los dos primeros pedidos). Se puede repetir desde el catálogo.
- **Nave**: 2×2 casillas, fija. Recibe por los cuatro lados (dos entradas por lado). Tocarla muestra lo enviado.
- **Más** (o tocar el dinero): catálogo. Ahí se eligen, se **compran** y se **mejoran** los edificios. Lo que eliges pasa a la barra de abajo.

## Ritmos

Al mismo nivel, dos extractores llenan una cinta y una cinta llena alimenta justo una prensa; una prensa saca justo las placas que necesita una ensambladora. Las mejoras de nivel (×1,5 y ×2) se compran y se aplican a todos los edificios de ese tipo. La cadena completa, con precios, está en `docs/planetas.md`.

| Nivel | Cinta | Extractor | Prensa (entra → sale) | Ensambladora (entra → sale) |
| --- | --- | --- | --- | --- |
| 1 | 5 obj/s | 2,5 chatarra/s | 5 chatarra → 2,5 placas/s | 2,5 placas + 1,25 chatarra → 1,25 engranajes/s |
| 2 | 7,5 obj/s | 3,75 chatarra/s | 7,5 → 3,75 | 3,75 + 1,875 → 1,875 |
| 3 | 10 obj/s | 5 chatarra/s | 10 → 5 | 5 + 2,5 → 2,5 |

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
| `src/defs.js` | Objetos (y lo que pagan), edificios (recetas y precios), planetas y pedidos. Aquí se ajusta el equilibrio. |
| `src/state.js` | Estado de la partida y las **acciones** (único punto que lo modifica). |
| `src/sim.js` | Simulación de cintas y máquinas, paso fijo y determinista. |
| `src/world.js` | Generación del mapa a partir de una semilla. |
| `src/textures.js` | Reúne todos los gráficos. |
| `src/sprites/` | Un archivo por grupo de gráficos: `belts.js` (cintas, curvas y uniones), `machines.js` (máquinas y la nave), `terrain.js`, `items.js`, y `common.js` con la paleta. |
| `dev/sprites.html` | Muestrario de todos los sprites para revisar el arte sin jugar (`?filter=^(nave\|robotica)_&scale=3`; el filtro es una expresión regular). |
| `src/beltShapes.js` | Decide qué forma lleva cada cinta (recta, curva, unión) y por dónde pasan los objetos. |
| `src/render.js` | Pintado con PixiJS y cámara. |
| `src/input.js` | Gestos táctiles y de ratón. |
| `src/ui.js`, `src/messages.js` | Interfaz (pedido, dinero, catálogo con tienda) y comunicados de Chatarrex S.A. |
| `docs/planetas.md` | Diseño de la progresión: planetas, nave, economía y recetas. |
