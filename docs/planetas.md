# Progresión: planetas, nave y dinero

## La idea

Montar una cadena y esperar aburre. El reto está en **volver a resolver la logística**, no en la paciencia:

- **Planeta 1 (SC-7, "El Vertedero")**: solo hay chatarra, pero tiene **toda la cadena larga**: 10 máquinas y 25 pedidos, hasta llegar a robots de limpieza.
- **Cada planeta nuevo = un recurso nuevo** que se mezcla con lo de antes. Mapa nuevo y vacío: la fábrica se queda atrás.
- **La nave** es el único sitio donde se entrega. Una sola, fija, de 2×2 casillas, aparece sola al llegar y no se puede mover ni quitar. Recibe por los cuatro lados, dos entradas por lado (8 bocas). Así no vale poner un punto de entrega al lado de cada montón: hay que traer las cintas hasta ella.
- **Dinero (créditos ₡)**: Chatarrex paga por cada cosa que llega a la nave (su `value`) y bastante más por cada pedido completado (`pay`). Con el dinero se **compran máquinas** y **mejoras de nivel** en el catálogo.

## Economía

- Se empieza con 0 ₡, la cinta y el extractor.
- Todo lo enviado se paga, sea o no del pedido. El pedido paga mucho más que las piezas sueltas.
- Comprar (`{type:'buy', kind}`) y mejorar (`{type:'upgrade', kind}`) son acciones serializables, como todo.
- Las mejoras suben de nivel **todos** los edificios de un tipo (×1 / ×1,5 / ×2). Precio: cinta 300 / 900, extractor 250 / 750, máquinas 2× y 6× su precio (mínimo 200).
- Al despegar se conservan el dinero, lo comprado y las mejoras. Se pierde la fábrica.
- Una prueba (`tests/sim.test.mjs`, nº 19) comprueba que, contando solo lo que pagan los pedidos y sus piezas, nunca hace falta una máquina que aún no se puede pagar.

## Planeta 1: la cadena larga de la chatarra

| Máquina | Precio | Entra | Sale | Tiempo |
| --- | --- | --- | --- | --- |
| Prensa | 50 | 2 chatarra | placa | 0,4 s |
| Divisor | 80 | — | reparte | — |
| Ensambladora | 150 | 2 placas + 1 chatarra | engranaje | 0,8 s |
| Trefiladora | 200 | 2 chatarra | alambre | 0,4 s |
| Cortadora | 250 | 1 placa | tornillos | 0,4 s |
| Bobinadora | 350 | 2 alambre | muelle | 0,8 s |
| Montadora | 500 | 1 engranaje + 1 tornillos | mecanismo | 0,8 s |
| Soldadora | 600 | 1 placa + 1 alambre | carcasa | 0,8 s |
| Motorera | 900 | 1 mecanismo + 1 muelle | motor | 1,6 s |
| Línea de robots | 1400 | 1 motor + 1 carcasa | robot de limpieza | 1,6 s |

```
chatarra ─prensa──────▶ placa ─cortadora──▶ tornillos ┐
   │                      │                           ├─montadora─▶ mecanismo ┐
   │                      └─(+chatarra) ensambladora─▶ engranaje ┘            ├─motorera─▶ motor ┐
   └──trefiladora───────▶ alambre ─bobinadora────────▶ muelle ───────────────┘                  ├─robots─▶ robot
                    placa + alambre ─soldadora───────▶ carcasa ─────────────────────────────────┘
```

Ritmos cuadrados (nivel 1): una cinta llena (5/s) alimenta una prensa o una trefiladora; una prensa alimenta una cortadora; una trefiladora, una bobinadora; una ensambladora, una montadora; una montadora, dos motoreras; una motorera, una línea de robots.

25 pedidos, de 40 chatarra (paga 60 ₡) a 100 robots (paga 4.000 ₡). El último abre el despegue. Después hay pedidos extra sin fin para quien no quiera irse todavía.

## Los 10 recursos (un planeta cada uno)

Todo sale de planetas que la corporación usa de vertedero. Nada de carbón, hierro ni cobre.

| Planeta | Recurso nuevo | Dónde aparece | Máquina básica | Producto básico |
| --- | --- | --- | --- | --- |
| 1 | Chatarra | Vertedero | Prensa / Trefiladora | Placa / Alambre |
| 2 | Cristal roto | Cráter de cristales | Horno | Vidrio |
| 3 | Caucho | Montaña de neumáticos | Trituradora | Goma |
| 4 | Circuitos viejos | Montón de electrónica | Desguazadora | Chip |
| 5 | Musgo luminoso | Pradera de musgo | Fermentador | Biocombustible |
| 6 | Lodo tóxico | Charca de lodo | Destilería | Ácido |
| 7 | Arena magnética | Duna magnética | Imantador | Imán |
| 8 | Hielo azul | Glaciar | Congelador | Refrigerante |
| 9 | Esporas | Bosque de hongos | Telar | Fibra |
| 10 | Chatarrexium | Meteorito | Forja | Núcleo |

Regla de las máquinas básicas: **2 de recurso → 1 de producto básico**, al ritmo de la prensa.

## Planeta 2 (hecho)

| Máquina | Precio | Entra | Sale |
| --- | --- | --- | --- |
| Horno | 400 | 2 cristal | vidrio |
| Cristalería | 800 | 1 placa + 1 vidrio | ventana |
| Montadora solar | 1500 | 1 ventana + 1 engranaje | panel solar |

15 pedidos. Mezclan lo nuevo con la cadena del planeta 1 (también piden motores y robots).

## Del 3 al 10 (por hacer)

Mismo patrón: el producto básico nuevo se mezcla con algo de antes, y luego se junta con un producto ya complejo. Ideas: goma + engranaje → correa; chip + vidrio → placa base; placa base + robot → dron; biocombustible + carcasa → batería. El último producto del planeta 10 es la "Estatua del Director General", hecha de todo lo anterior. Cada planeta: 15 a 20 pedidos, 3 o 4 máquinas nuevas a la venta.

## El salto de planeta

1. Al completar el último pedido, Chatarrex manda un comunicado y aparece **Despegar al planeta N** en la etiqueta del pedido.
2. Al pulsarlo (con confirmación), se genera un mapa nuevo con los recursos de ese planeta y la nave aterriza en el centro.
3. Se conserva: dinero, máquinas compradas, mejoras y el total enviado. Se reinicia: mapa, fábrica y pedidos.
4. Despegar es una acción (`nextPlanet`) determinista: la semilla nueva sale de la anterior.
5. Cada planeta tiene su tono de suelo.
