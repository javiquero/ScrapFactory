# Progresión: planetas, nave, pedidos y desbloqueos

## La idea

Montar una cadena y esperar aburre. El reto está en **volver a resolver la logística**, no en la paciencia:

- **Planeta 1 (SC-7, "El Vertedero")**: solo hay chatarra, pero tiene **toda la cadena larga**: 10 máquinas y 25 pedidos, hasta llegar a robots de limpieza.
- **Cada planeta nuevo = un recurso nuevo** que se mezcla con lo de antes. Mapa nuevo y vacío: la fábrica se queda atrás.
- **La nave** es el único sitio donde se entrega. Una sola, fija, de 2×2 casillas, aparece sola al llegar y no se puede mover ni quitar. Recibe por los cuatro lados, dos entradas por lado (8 bocas). Así no vale poner un punto de entrega al lado de cada montón: hay que traer las cintas hasta ella.
- **Sin dinero**: cada pedido cumplido desbloquea maquinaria (`unlocks`). Los pedidos grandes piden un **ritmo mínimo** de piezas por segundo en la nave; lo que llega más despacio no cuenta. Así una línea no basta y hay que montar varias en paralelo. No hay mejoras de velocidad (de momento).

## Pedidos: cantidad, ritmo y desbloqueos

- Cada pedido: `item`, `amount`, `rate` (piezas/s mínimas, medidas en los últimos 10 s; 0 = sin mínimo) y `unlocks`.
- El ritmo se expresa en **líneas**: `lines × lineRate(item)`, donde una línea es lo que saca una máquina (o un extractor, si es en bruto). La cantidad suele ser ritmo × 1–4 minutos.
- El mínimo que se exige y se enseña es `minRate`: las líneas pedidas con un 10 % de margen (por los saltos de las cintas), redondeado hacia abajo a 0,1. Lo que pone la etiqueta es exactamente lo que cuenta, y con una línea menos nunca se llega (lo comprueba una prueba).
- Si no llegas al ritmo, la etiqueta del pedido lo dice en rojo y Chatarrex avisa una vez.
- Prueba: todos los pedidos de los 8 planetas se pueden hacer con lo desbloqueado hasta ese momento, y todos los ritmos caben por las 8 bocas de la nave.
- Idea para más adelante: **modo difícil** al terminar el último planeta, con recursos que se agotan.

## Planeta 1: la cadena larga de la chatarra

| Máquina | Se desbloquea en | Entra | Sale | Tiempo |
| --- | --- | --- | --- | --- |
| Prensa | pedido 1 | 2 chatarra | placa | 0,4 s |
| Divisor | pedido 2 | — | reparte | — |
| Ensambladora | pedido 3 | 2 placas + 1 chatarra | engranaje | 0,8 s |
| Trefiladora | pedido 4 | 2 chatarra | alambre | 0,4 s |
| Cortadora | pedido 6 | 1 placa | tornillos | 0,4 s |
| Bobinadora | pedido 7 | 2 alambre | muelle | 0,8 s |
| Montadora | pedido 8 | 1 engranaje + 1 tornillos | mecanismo | 0,8 s |
| Soldadora | pedido 10 | 1 placa + 1 alambre | carcasa | 0,8 s |
| Motorera | pedido 12 | 1 mecanismo + 1 muelle | motor | 1,6 s |
| Línea de robots | pedido 14 | 1 motor + 1 carcasa | robot de limpieza | 1,6 s |

```
chatarra ─prensa──────▶ placa ─cortadora──▶ tornillos ┐
   │                      │                           ├─montadora─▶ mecanismo ┐
   │                      └─(+chatarra) ensambladora─▶ engranaje ┘            ├─motorera─▶ motor ┐
   └──trefiladora───────▶ alambre ─bobinadora────────▶ muelle ───────────────┘                  ├─robots─▶ robot
                    placa + alambre ─soldadora───────▶ carcasa ─────────────────────────────────┘
```

Ritmos cuadrados (nivel 1): una cinta llena (5/s) alimenta una prensa o una trefiladora; una prensa alimenta una cortadora; una trefiladora, una bobinadora; una ensambladora, una montadora; una montadora, dos motoreras; una motorera, una línea de robots.

21 pedidos, de 40 chatarra a cientos de robots a 1,25/s. El último abre el despegue. Después hay pedidos extra sin fin para quien no quiera irse todavía.

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

| Máquina | Se desbloquea en | Entra | Sale |
| --- | --- | --- | --- |
| Horno | pedido 1 | 2 cristal | vidrio |
| Cristalería | pedido 4 | 1 placa + 1 vidrio | ventana |
| Montadora solar | pedido 6 | 1 ventana + 1 engranaje | panel solar |

15 pedidos. Mezclan lo nuevo con la cadena del planeta 1 (también piden motores y robots).

## Planetas 3 a 8 (hechos)

Mismo patrón en todos: una máquina básica (2 de recurso → 1, 0,4 s), una de mezcla (básico + algo de antes, 0,8 s) y una final (mezcla + algo complejo de antes, 1,6 s). 16 pedidos por planeta (`laterOrders` en `src/defs.js`): el 1 desbloquea la básica, el 4 la de mezcla y el 8 la final; cuanto más lejos, más líneas en paralelo. Cada planeta tiene su color de suelo (`PLANET_LOOK`).

| Planeta | Suelo | Recurso | Básica | Mezcla | Final |
| --- | --- | --- | --- | --- | --- |
| 3 SC-21 "La Gomera" | ocre | caucho | trituradora → goma | vulcanizadora: goma + engranaje → correa | taller de patinetes: correa + motor → patinete |
| 4 SC-34 "Silicon Barranco" | gris violeta | circuitos viejos | desguazadora → chip | grabadora: chip + vidrio → placa base | línea de consolas: placa base + carcasa → consola retro |
| 5 SC-55 "El Musgal" | verde azulado oscuro | musgo luminoso | fermentador → biocombustible | envasadora: biocombustible + carcasa → batería | hangar de drones: batería + motor → dron |
| 6 SC-89 "La Ciénaga" | mostaza | lodo tóxico | destilería → ácido | grabado al ácido: ácido + chip → circuito impreso | fábrica de androides: circuito + robot → androide |
| 7 SC-144 "Las Dunas Raras" | arena rosada | arena magnética | imantador → imán | bobinadora magnética: imán + alambre → electroimán | hangar de aerodeslizadores: electroimán + panel → aerodeslizador |
| 8 SC-233 "El Congelador" | nieve | hielo azul | congelador → refrigerante | montadora de neveras: refrigerante + carcasa → nevera | laboratorio criogénico: nevera + circuito → criocápsula |

Dibujos: máquinas en `src/sprites/machines2.js`, objetos en `items2.js`, piezas del suelo en `terrain2.js` (muestrario propio en `dev/sprites2.html`).

## Planetas 9 y 10 (por hacer)

Esporas (telar → fibra) y chatarrexium (forja → núcleo). El último producto será la "Estatua del Director General", hecha de todo lo anterior.

## El salto de planeta

1. Al completar el último pedido, Chatarrex manda un comunicado y aparece **Despegar al planeta N** en la etiqueta del pedido.
2. Al pulsarlo (con confirmación), se genera un mapa nuevo con los recursos de ese planeta y la nave aterriza en el centro.
3. Se conserva: la maquinaria desbloqueada y el total enviado. Se reinicia: mapa, fábrica y pedidos.
4. Despegar es una acción (`nextPlanet`) determinista: la semilla nueva sale de la anterior.
5. Cada planeta tiene su tono de suelo.
