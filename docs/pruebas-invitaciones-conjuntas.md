# Pruebas de invitaciones conjuntas

Guía manual para validar en el front y mediante Excel la gestión de invitaciones individuales y conjuntas.

## Preparación

1. Aplicar las migraciones locales si hay pendientes:

   ```bash
   pnpm db:migrate
   ```

2. Arrancar la aplicación:

   ```bash
   pnpm dev
   ```

3. Abrir `http://localhost:3000/app/invitados` y acceder al panel de invitados.
4. Usar datos de prueba identificables, por ejemplo el prefijo `QA-2026-07`, para no confundirlos con invitados reales.

## Reglas que se deben validar

- `Grupo` o `Grupo interno` solo organiza el panel de los novios. No aparece en el mensaje enviado.
- `Clave invitación conjunta` une las filas que compartirán una invitación. La clave puede ser `F1`, `P1`, etc.
- `Nombre invitación conjunta` es opcional y sí aparece en el mensaje y en la invitación pública.
- Si no hay `Nombre invitación conjunta`, se muestran únicamente los nombres de pila de las personas unidas.
- Una invitación conjunta admite entre 1 y 5 personas. La sexta debe rechazarse.
- Una invitación para más de una persona utiliza `invitaros`; una individual utiliza `invitarte`.
- El destinatario es la única persona marcada para recibir el enlace y debe tener teléfono o email.

## Pruebas del front

### F-01 — Invitación individual

- Crear una invitación con `Ana QA` y apellido `Santos`.
- Grupo interno: `QA Familia`.
- Nombre de invitación conjunta: vacío.
- Marcar a Ana como destinataria.
- Añadir un teléfono local: `600 111 222`.

Resultado esperado:

- La invitación se guarda como individual.
- El mensaje saluda con `Ana`, no con `Ana Santos` ni con `QA Familia`.
- El texto utiliza `invitarte`.

### F-02 — Dos personas sin nombre conjunto

- Crear una invitación con `Ana QA` y `Luis QA`.
- Añadir apellidos distintos para comprobar que no se envían.
- Grupo interno: `QA Familia`.
- Nombre de invitación conjunta: vacío.

Resultado esperado:

- El saludo contiene `Ana y Luis`.
- No aparece `QA Familia` ni ningún apellido.
- El texto utiliza `invitaros`.

### F-03 — Nombre visible independiente del Grupo

- Crear una invitación conjunta con dos o más personas.
- Grupo interno: `QA Organización`.
- Nombre de invitación conjunta: `Familia García`.

Resultado esperado:

- El mensaje utiliza `Familia García`.
- `QA Organización` solo aparece como información del panel y no en el mensaje.
- Editar la invitación conserva ambos valores por separado.

### F-04 — Límite de cinco personas

- Crear una invitación conjunta.
- Añadir personas hasta llegar a cinco.
- Intentar añadir una sexta desde el botón `Añadir otra persona`.
- Repetir la comprobación editando una invitación que ya tiene cinco.

Resultado esperado:

- Se pueden guardar exactamente cinco personas.
- No aparece una sexta fila o el guardado muestra un error claro de máximo cinco.
- La respuesta pública permite responder por las cinco personas.

### F-05 — Vincular dos invitados separados

- Crear dos invitaciones individuales: `QA Uno` y `QA Dos`.
- Editar una de ellas.
- En `Vincular invitado existente`, seleccionar la otra invitación.
- Guardar.

Resultado esperado:

- Queda una única invitación con las dos personas.
- La invitación individual de origen desaparece del listado.
- La persona seleccionada pasa a ser acompañante y la otra conserva el destinatario.
- No se permite seleccionar invitaciones ya enviadas, respondidas o que ya tengan varias personas.

### F-06 — Teléfonos y WhatsApp

Probar los siguientes valores en el teléfono del destinatario:

| Entrada | Resultado esperado para WhatsApp |
| --- | --- |
| `+44 20 7946 0958` | `442079460958` |
| `+34 600 111 222` | `34600111222` |
| `600 111 222` | `34600111222` |
| `700 123 456` | `34700123456` |
| `0044 20 7946 0958` | `442079460958` |

Resultado esperado:

- El formulario acepta los cinco formatos.
- El enlace generado utiliza `https://wa.me/` seguido del número normalizado.
- El prefijo español se añade solo cuando el número tiene nueve dígitos y no lleva prefijo.

### F-07 — Invitación pública y RSVP

- Copiar el enlace de una invitación conjunta de cinco personas.
- Abrirlo en una ventana privada o en otro navegador.
- Comprobar que el saludo usa el nombre conjunto, o los cinco nombres si está vacío.
- Responder por las cinco personas.

Resultado esperado:

- Se muestran las cinco personas.
- El formulario no limita la respuesta a dos personas.
- Se guarda una respuesta exacta para cada invitado.

## Pruebas de Excel

### E-01 — Descargar y revisar la plantilla

- Desde `Invitados`, descargar la plantilla Excel.
- Confirmar que contiene estas columnas:

  1. `Grupo (opcional)`
  2. `Clave invitación conjunta (opcional)`
  3. `Nombre invitación conjunta (opcional)`
  4. `Nombre *`
  5. `Apellidos`
  6. `Teléfono`
  7. `Email`
  8. `Destinatario (Sí/No)`

Resultado esperado:

- La hoja de instrucciones explica que Grupo no combina personas.
- La clave une filas y el nombre conjunto es el texto visible.
- Se indica el máximo de cinco personas.

### E-02 — Pareja con nombre visible

Crear estas filas:

| Grupo | Clave | Nombre invitación conjunta | Nombre | Apellidos | Teléfono | Destinatario |
| --- | --- | --- | --- | --- | --- | --- |
| QA Familia | F1 | Ana y Luis | Ana | Santos | `600111222` | Sí |
| QA Familia | F1 | Ana y Luis | Luis | Gómez |  | No |

Resultado esperado:

- Se crea una sola invitación con dos personas.
- El mensaje utiliza `Ana y Luis` como nombre conjunto.
- Se conserva `QA Familia` únicamente como Grupo del panel.

### E-03 — Invitación conjunta sin nombre visible

Crear cinco filas con la misma clave `F2` y dejar vacío `Nombre invitación conjunta`.

Resultado esperado:

- Se crea una única invitación con cinco personas.
- El mensaje utiliza los cinco nombres de pila unidos por `y`.
- No aparecen apellidos ni el texto del Grupo.

### E-04 — Sexta persona

- Añadir una sexta fila con la clave `F2`.
- Volver a cargar el archivo.

Resultado esperado:

- La sexta fila aparece como error.
- El mensaje indica que la invitación ya tiene cinco personas.
- Las cinco primeras filas siguen listas para importar.

### E-05 — Grupo repetido sin clave

Crear tres filas con el mismo Grupo `QA Amigos`, pero dejar vacía la clave conjunta.

Resultado esperado:

- Se crean tres invitaciones individuales.
- Repetir Grupo no combina personas.

### E-06 — Grupos distintos con la misma clave

Crear dos filas con la clave `F3`, pero con Grupos distintos.

Resultado esperado:

- Se crea una única invitación conjunta.
- El importador muestra un aviso de Grupo distinto.
- Se utiliza el Grupo de la primera fila solo para organizar el panel.
- El mensaje no utiliza ninguno de los Grupos como saludo.

### E-07 — Compatibilidad con archivos antiguos

- Usar un archivo antiguo que tenga la columna `Invitación conjunta (opcional)`.
- Repetir el mismo valor en las filas que deban compartir invitación.
- No añadir la nueva columna de nombre conjunto.

Resultado esperado:

- El archivo se importa sin error.
- La columna antigua se interpreta como clave de unión.
- Al no existir nombre conjunto, el mensaje utiliza los nombres de pila.

### E-08 — Teléfonos en Excel

Probar en distintas filas estos valores y marcar como destinatario solo a quien corresponda:

- `+44 20 7946 0958`
- `+34 600 111 222`
- `600 111 222`
- `700 123 456`
- `0044 20 7946 0958`

Resultado esperado:

- Excel conserva los teléfonos como texto.
- La importación no elimina el `+` ni los ceros de `00`.
- Los teléfonos se normalizan correctamente al generar WhatsApp.

### E-09 — Destinatario inválido

Probar dos errores:

- Dos personas de la misma invitación marcadas con `Sí`.
- Una invitación cuyo destinatario no tiene teléfono ni email.

Resultado esperado:

- La primera invitación da error por no tener un único destinatario.
- La segunda no se importa porque no tiene un contacto válido.

## Validación automatizada

Desde la raíz del proyecto:

```bash
pnpm test
pnpm test:d1
pnpm typecheck
pnpm lint
pnpm build
```

La prueba se considera completa cuando todos los comandos terminan correctamente y los casos manuales anteriores cumplen sus resultados esperados.
