---
version: 1
slug: "adapters-next-components-signage-view-tsx-d473b5f6"
primary_target: "src/domains/guests/adapters/next/components/signage-view.tsx"
related_targets: []
---

# Cartelería

Scope: pantalla `/app/carteleria` del panel privado. Mode: Operate.
Audience: pareja con plantilla María Daniela (caso principal); sin plantilla solo hay seating tabular, digno pero secundario.
Task: descargar cada pieza impresa del banquete en el formato adecuado; escribir carteles varios y minuta.
Constraints: abrir la pantalla no carga datos ni acuarelas; sin miniaturas renderizadas (confirmado). Mismo sistema visual del panel.
User rejected: muro de botones de formato, rejilla de tarjetas genérica, editores metidos en tarjetas, estructuras complejas.

## Direction contract

THESIS: Cinco piezas, cinco botones. Cada pieza es una ficha limpia con una sola acción principal; el formato es un selector compacto, nunca un muro de botones. Rechaza los editores incrustados y los subtítulos repetidos por botón.
OWN-WORLD: Sistema del panel Nuptia: fondo slate muy claro, fichas blancas con borde fino, títulos Playfair, cuerpo Inter, botón primario slate profundo, acento rosa empolvado solo en foco/selección. Detalle propio: un pliego dibujado a escala que muestra el formato elegido (A4, A5, A6, A5×2, A6×4, apaisado) y cambia con el selector.
STORY: La pareja entiende de un vistazo qué puede imprimir, elige tamaño si quiere y descarga; lo que se escribe (carteles varios, minuta) se abre en su propio diálogo con espacio.
FIRST VIEWPORT: Título Cartelería y una línea de nota; rejilla 3+2 (lg), 2 (md), 1 (móvil) de fichas de igual altura: pliego a escala arriba a la izquierda, nombre, una línea; pie con selector de formato a la izquierda y botón primario Descargar/Escribir a la derecha.
FORM: Fichas de una acción, candidato 5 de la segunda tirada; seed eb3a473a (reroll 1).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
