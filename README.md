# Scrap Factory

Juego web de construir fábricas, tranquilo y sin combate. Eres un colono solo en el planeta SC-7 y Chatarrex S.A., una megacorporación bastante cutre, te va mandando pedidos: chatarra, placas prensadas y engranajes. Montas extractores, cintas y máquinas, y lo envías todo por el teletransportador.

Inspirado en Builderment, pero en el navegador: funciona igual en el móvil que en el ordenador.

## Cómo se juega

- **Mover**: arrastra para mover el mapa.
- **Tocar un edificio** lo gira (con cualquier herramienta menos Quitar). **Mantenerlo pulsado** abre su ficha para girarlo o quitarlo.
- **Cinta**: arrastra el dedo desde donde empieza hasta donde acaba; se traza sola en forma de L.
- **Edificios**: tócalos sobre el mapa, o arrastra para colocar varios seguidos.
- **Dos dedos**: mover y hacer zoom con cualquier herramienta. En ordenador, rueda del ratón para el zoom y `R` para girar.
- **Más**: catálogo completo. Lo que eliges ahí pasa a la barra de abajo.

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
| `src/defs.js` | Objetos, edificios, recetas y pedidos. Aquí se ajusta el equilibrio. |
| `src/state.js` | Estado de la partida y las **acciones** (único punto que lo modifica). |
| `src/sim.js` | Simulación de cintas y máquinas, paso fijo y determinista. |
| `src/world.js` | Generación del mapa a partir de una semilla. |
| `src/textures.js` | Gráficos provisionales dibujados con código. Se cambiarán por sprites de verdad. |
| `src/render.js` | Pintado con PixiJS y cámara. |
| `src/input.js` | Gestos táctiles y de ratón. |
| `src/ui.js`, `src/messages.js` | Interfaz y comunicados de Chatarrex S.A. |
