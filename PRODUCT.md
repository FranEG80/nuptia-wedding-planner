# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Parejas que organizan su propia boda en España. Trabajan desde el panel privado (`/app`) en ordenador, en ratos sueltos durante los meses previos y con más intensidad la última semana, cuando toca imprimir la papelería del banquete. Escriben y leen en español, tratados de "vosotros".

## Product Purpose

Nuptia sustituye hojas de cálculo, chats de grupo y papelería suelta por un único estudio: invitación digital, web de la boda, gestión de invitados y mesas, y cartelería imprimible generada desde esos mismos datos. Éxito: lo que se imprime sale correcto y bonito a la primera, sin rehacer nada a mano.

## Positioning

Los datos de invitados y mesas que la pareja ya mantiene se convierten directamente en piezas impresas con el diseño de su plantilla (acuarelas de la plantilla María Daniela), sin pasar por un diseñador ni maquetar a mano.

## Operating Context

- Cartelería: seating, marcasitios, mesario, carteles varios (texto + flecha) y minuta, exportados a PDF (y Word para carteles varios) en formatos A4/A5/A6 e imposiciones (A5×2, A6×4) para imprenta o impresora doméstica.
- Solo se imprimen invitados confirmados que ya tienen mesa.
- La plantilla María Daniela es el caso principal de uso real; bodas sin plantilla solo tienen el listado tabular de seating.

## Capabilities and Constraints

- Next.js 16 App Router, Tailwind CSS v4, Base UI, lucide-react.
- Los PDF se generan en cliente al pulsar exportar; abrir la pantalla de cartelería no carga datos ni acuarelas (decisión de rendimiento confirmada: sin miniaturas renderizadas).
- Carteles varios y minuta escrita viven en estado local mientras la pantalla está abierta.

## Brand Commitments

Nombre "Nuptia · Estudio de Bodas". Tono cercano y elegante, en español de España, segunda persona plural.

## Evidence on Hand

Datos de demo (`demo@nuptia.local`, pareja "Lucía y Mateo"). Sin testimonios ni métricas reales; no inventarlos.

## Product Principles

- Los datos ya introducidos trabajan para la pareja: nada se teclea dos veces.
- Lo impreso debe ser correcto antes que vistoso: decir siempre qué entra y qué no.
- Elegancia sin fricción: menos decisiones visibles, mejores valores por defecto.
