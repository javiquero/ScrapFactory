# Notas para trabajar en Scrap Factory

Responder y comentar en español. Los textos del juego, en español con humor corporativo (Chatarrex S.A.).

## Decisiones tomadas

- Factory-builder cozy visto desde arriba, inspirado en Builderment (descontinuado). Sin combate ni enemigos.
- Lore tipo Satisfactory con un poco de humor: el jugador es un colono solo, sin acompañante. Chatarrex S.A. le manda pedidos.
- Aquí NO van plátanos ni monos: esa directiva del proyecto es para los otros juegos. De momento solo se extrae chatarra. Idea a futuro: algún gas o líquido para tratar la chatarra.
- Controles: tocar un edificio lo gira; mantenerlo pulsado lo copia (pasa a ser la herramienta, con su orientación; el siguiente toque pone otro igual) y abre la ficha de girar/quitar. Al soltar el dedo tras construir o quitar, la herramienta vuelve a la mano (lo elegido sigue en la barra). Una máquina puesta encima de una cinta la sustituye. Quitar arrastrando borra un rectángulo. Para cruzar cintas está el Puente (dos carriles, horizontal por debajo y vertical por encima; no se gira); si está comprado, `placeMany` de cinta lo pone solo al atravesar en recto una cinta perpendicular. No hay botón de girar en la barra (se gira tocando); en su sitio va Deshacer: cada acción de construcción devuelve en `res.undo` una acción plana `setCells` que la revierte. Tutorial inicial en `src/tutorial.js` (solo lee el estado; su progreso va en localStorage).
- Web, móvil primero, desplegado en Vercel desde `main`. Sin paso de compilación.
- Sprites 2D con PixiJS v8 (vendorizado en `vendor/pixi.min.mjs`), dibujados con código en `src/textures.js`.
- TODO se ve en planta pura, desde arriba del todo, igual que las cintas (Javi lo pidió: nada de perspectiva con cara frontal). Las máquinas ocupan la casilla de borde a borde para que las cintas lleguen hasta ellas, se animan al trabajar (4 fotogramas) y NO se giran: la salida es una rampa aparte que gira. Tienen que parecer máquinas de fábrica de verdad, no cajas con icono.
- Las texturas de máquina miden 64×88 por compatibilidad, pero el dibujo va dentro de la casilla (64×64 de abajo). El suelo se hornea en trozos de 16×16 casillas; no volver a pintar miles de formas por fotograma.
- Para revisar arte: `dev/sprites.html`.
- Hay arte en PNG en `assets/art/` (generado con Gemini, en perspectiva) pero está DESACTIVADO: a Javi le gustaba más el dibujo por código. Se puede ver con `dev/sprites.html?art=1`.
- Estilo visual propio "trastos remendados": redondeado (no pixel art), contorno marrón oscuro, pastel sobre el verde del planeta, parches atornillados. Inspirarse en packs de itch.io pero sin copiar su aspecto ni los recursos típicos de Factorio (nada de carbón/hierro/cobre).
- Interfaz táctil: barra rápida abajo + catálogo que se despliega desde la derecha. La orientación (vertical/horizontal) no está decidida: el diseño tiene que aguantar ambas.
- Un jugador primero. El multijugador colaborativo vendrá después (WebSockets).

- Ritmos cuadrados (ver tabla del README y `docs/planetas.md`): al mismo nivel, 2 extractores llenan 1 cinta, 1 cinta llena alimenta 1 prensa y 1 prensa alimenta 1 ensambladora; lo mismo para la cadena larga. Las mejoras son por tipo de edificio y globales (×1 / ×1,5 / ×2). Si se cambia un número, mantener esa proporción y pasar `tests/sim.test.mjs`, que la comprueba.
- Progresión (`docs/planetas.md`): el planeta 1 tiene toda la cadena larga de la chatarra (hasta robots). Cada planeta nuevo = un recurso nuevo, mapa vacío. Hay 8 planetas hechos (hasta 10 previstos), cada uno con su color de suelo (`PLANET_LOOK`), no todos verdes.
- Entrega: UNA nave fija de 2×2 (`state.ship`, no es una entidad), aparece sola, no se construye ni se quita, recibe por los 4 lados con 2 entradas por lado. Ya no existe el teletransportador.
- Dinero: Chatarrex SOLO paga lo del pedido actual: cada pieza que cuenta (`value`) y el pedido completo (`pay`). Lo que no se pidió entra en la nave pero no se paga. Las máquinas y las mejoras se compran en el catálogo (acciones `buy` y `upgrade`). Dinero, compras y mejoras viajan entre planetas. La prueba de economía comprueba que nunca hay atasco. Si el jugador gasta mal y se queda sin poder pagar lo que pide el pedido, salta un pedido de rescate (`src/rescue.js`) que se hace con lo ya desbloqueado, pide un ritmo y paga lo justo.

## Regla de arquitectura

Todo cambio de la partida pasa por `applyAction(state, action)` con acciones planas y serializables. La simulación (`step`) es determinista y no usa `Math.random` ni el reloj. Así, para el multijugador bastará con enviar las acciones por la red. No mutar `state` desde la interfaz ni desde el pintado.

## Comprobar antes de subir

`node tests/sim.test.mjs` y abrir el juego en un navegador con tamaño de móvil.
