# Notas para trabajar en Scrap Factory

Responder y comentar en español. Los textos del juego, en español con humor corporativo (Chatarrex S.A.).

## Decisiones tomadas

- Factory-builder cozy visto desde arriba, inspirado en Builderment (descontinuado). Sin combate ni enemigos.
- Lore tipo Satisfactory con un poco de humor: el jugador es un colono solo, sin acompañante. Chatarrex S.A. le manda pedidos.
- Aquí NO van plátanos ni monos: esa directiva del proyecto es para los otros juegos. De momento solo se extrae chatarra. Idea a futuro: algún gas o líquido para tratar la chatarra.
- Controles: tocar un edificio lo gira; mantenerlo pulsado abre la ficha de girar/quitar.
- Web, móvil primero, desplegado en Vercel desde `main`. Sin paso de compilación.
- Sprites 2D con PixiJS v8 (vendorizado en `vendor/pixi.min.mjs`), dibujados con código en `src/textures.js`.
- Máquinas: vista cenital con algo de perspectiva (techo + cara frontal), animadas al trabajar (4 fotogramas), y NO se giran: la salida es una rampa aparte que gira. Javi quiere que parezcan máquinas de fábrica de verdad, no cajas con icono.
- Las máquinas miden 64×88 (sobresalen por arriba) y se ordenan por profundidad con los árboles. El suelo se hornea en trozos de 16×16 casillas; no volver a pintar miles de formas por fotograma.
- Para revisar arte: `dev/sprites.html`.
- Estilo visual propio "trastos remendados": redondeado (no pixel art), contorno marrón oscuro, pastel sobre el verde del planeta, parches atornillados. Inspirarse en packs de itch.io pero sin copiar su aspecto ni los recursos típicos de Factorio (nada de carbón/hierro/cobre).
- Interfaz táctil: barra rápida abajo + catálogo que se despliega desde la derecha. La orientación (vertical/horizontal) no está decidida: el diseño tiene que aguantar ambas.
- Un jugador primero. El multijugador colaborativo vendrá después (WebSockets).

- Ritmos cuadrados (ver tabla del README): al mismo nivel, 2 extractores llenan 1 cinta, 1 cinta llena alimenta 1 prensa y 1 prensa alimenta 1 ensambladora. Las mejoras son por tipo de edificio y globales, se ganan con pedidos (×1 / ×1,5 / ×2). Si se cambia un número, mantener esa proporción y pasar `tests/sim.test.mjs`, que la comprueba.

## Regla de arquitectura

Todo cambio de la partida pasa por `applyAction(state, action)` con acciones planas y serializables. La simulación (`step`) es determinista y no usa `Math.random` ni el reloj. Así, para el multijugador bastará con enviar las acciones por la red. No mutar `state` desde la interfaz ni desde el pintado.

## Comprobar antes de subir

`node tests/sim.test.mjs` y abrir el juego en un navegador con tamaño de móvil.
