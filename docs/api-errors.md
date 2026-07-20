# Errores de la API

Este documento describe los errores públicos que puede devolver la API de Nuptia.
Está basado en la implementación y en comprobaciones locales realizadas con Next.js
16.2.9, Better Auth 1.6.19 y tRPC 11.18.0.

## Alcance

Se consideran endpoints API:

- `/api/auth/*`
- `/api/trpc/*`
- `/api/media/upload`
- `/api/media/files/*`
- `/api` y cualquier ruta `/api/*` no reconocida

En autenticación se documentan como API soportada las rutas que Nuptia consume o
configura explícitamente: login, consulta de sesión, logout y registro
deshabilitado. El catch-all de Better Auth y el plugin `admin` pueden exponer rutas
adicionales del proveedor; no forman parte del contrato público de producto.

Las páginas del App Router, como `/login`, no son endpoints API. Durante una
navegación interna pueden responder con `Content-Type: text/x-component` y un
payload React Flight. Esa respuesta es parte del protocolo de Next.js y no debe
interpretarse ni registrarse como un error JSON.

Las Server Actions tampoco son una API pública. Los errores esperables del login
se devuelven como estado de la acción y React los transporta mediante Flight.

## Contratos de error

### Route Handlers propios

Los endpoints propios devuelven:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje seguro para el usuario",
    "requestId": "uuid"
  }
}
```

Cabeceras comunes:

```http
Cache-Control: no-store
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Request-Id: <mismo requestId del cuerpo>
```

El cliente debe tomar decisiones mediante `error.code`, no comparando el texto de
`error.message`.

### Better Auth

Los errores JSON esperables conservan el contrato del proveedor para no romper sus
clientes:

```json
{
  "message": "Invalid email or password",
  "code": "INVALID_EMAIL_OR_PASSWORD"
}
```

Nuptia añade `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` y
`X-Request-Id`. Los errores no JSON y todos los errores 500 se sustituyen por el
contrato propio.

### tRPC

tRPC conserva su protocolo:

```json
{
  "error": {
    "message": "Authentication required",
    "code": -32001,
    "data": {
      "code": "UNAUTHORIZED",
      "httpStatus": 401,
      "path": "guests.list"
    }
  }
}
```

El campo estable para el cliente es `error.data.code`. Las excepciones internas
usan el mensaje genérico `No se pudo completar la solicitud.`, incluyen
`error.data.requestId` y nunca incluyen `stack`.

## Resumen de endpoints

| Método | Endpoint | Tipo de respuesta |
| --- | --- | --- |
| GET, POST | `/api/auth/[...all]` | Protocolo Better Auth protegido por el wrapper de Nuptia |
| GET, POST | `/api/trpc/[trpc]` | Protocolo tRPC |
| POST | `/api/media/upload` | JSON propio |
| GET, HEAD | `/api/media/files/[...key]` | Binario o respuesta vacía |
| GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS | `/api` | JSON 404 propio |
| GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS | `/api/[...path]` no reconocida | JSON 404 propio |

## Autenticación

### Errores comunes de `/api/auth/*`

| HTTP | Código | Cuándo ocurre | Respuesta pública |
| --- | --- | --- | --- |
| 400 | `BAD_REQUEST` | El cuerpo contiene JSON inválido | Contrato Better Auth |
| 400 | `VALIDATION_ERROR` | Faltan campos o no cumplen el esquema | Contrato Better Auth con detalle de campos |
| 404 | `AUTH_ROUTE_NOT_FOUND` | La ruta de auth no existe y el proveedor respondió sin JSON | Contrato propio |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Un POST no usa un `Content-Type` admitido | Contrato Better Auth |
| 429 | `AUTH_REQUEST_REJECTED` | Se supera el rate limit de Better Auth, activo por defecto en producción | Contrato propio |
| 4xx | `AUTH_REQUEST_REJECTED` | Better Auth devolvió otro 4xx sin cuerpo JSON | Contrato propio |
| 500 | `AUTH_SERVICE_ERROR` | Fallo de configuración, base de datos, inicialización o error 5xx de Better Auth | Contrato propio; detalle sólo en servidor |

Better Auth puede incorporar otros códigos 4xx al añadir plugins o cambiar su
configuración. Nuptia conserva esos cuerpos JSON y refuerza sus cabeceras.
Los errores comunes de esta tabla pueden producirse en cualquiera de las rutas
soportadas que se detallan a continuación.

### `POST /api/auth/sign-in/email`

Cuerpo esperado:

```json
{
  "email": "pareja@example.com",
  "password": "contraseña",
  "rememberMe": true
}
```

| HTTP | Código | Cuándo ocurre |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | JSON no parseable |
| 400 | `VALIDATION_ERROR` | `email` o `password` ausentes o inválidos |
| 401 | `INVALID_EMAIL_OR_PASSWORD` | Usuario inexistente o contraseña incorrecta |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Falta `Content-Type: application/json` o no está admitido |
| 500 | `AUTH_SERVICE_ERROR` | Error interno inesperado |

Por seguridad, usuario inexistente y contraseña incorrecta comparten el mismo
código y mensaje.

### `GET /api/auth/get-session`

La ausencia de una sesión no es un error: devuelve `200` con cuerpo `null`.

| HTTP | Código | Cuándo ocurre |
| --- | --- | --- |
| 500 | `AUTH_SERVICE_ERROR` | No se puede inicializar o consultar el servicio de autenticación |

### `POST /api/auth/sign-out`

El cuerpo puede ser `{}`. Incluso sin una sesión activa, una solicitud válida
devuelve `200` con `{ "success": true }` y limpia las cookies conocidas.

| HTTP | Código | Cuándo ocurre |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | JSON no parseable |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Falta `Content-Type: application/json` |
| 500 | `AUTH_SERVICE_ERROR` | Error interno inesperado |

### `POST /api/auth/sign-up/email`

El alta pública está deshabilitada mediante `disableSignUp: true`.

| HTTP | Código | Cuándo ocurre |
| --- | --- | --- |
| 400 | `EMAIL_PASSWORD_SIGN_UP_DISABLED` | Cualquier intento de registro por email y contraseña |
| 400 | `BAD_REQUEST` | JSON no parseable |
| 400 | `VALIDATION_ERROR` | Faltan campos o no cumplen el esquema |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo de contenido no admitido |
| 500 | `AUTH_SERVICE_ERROR` | Error interno inesperado |

Las cuentas se crean por el flujo privado de administración, no desde este
endpoint.

## Media

### `POST /api/media/upload`

Requiere sesión, una boda asociada y un formulario `multipart/form-data` con un
campo `file`. Se aceptan AVIF, GIF, JPEG, PNG y WebP. El límite predeterminado es
10 MiB, pero puede cambiar mediante `R2_MAX_UPLOAD_BYTES`.

| HTTP | Código | Cuándo ocurre | Respuesta |
| --- | --- | --- | --- |
| 400 | `INVALID_UPLOAD_FORM` | El cuerpo no puede parsearse como `FormData` | JSON propio |
| 400 | `FILE_REQUIRED` | Falta `file` o no es un fichero | JSON propio |
| 401 | `AUTHENTICATION_REQUIRED` | No existe sesión válida | JSON propio |
| 403 | `ORIGIN_NOT_ALLOWED` | La cabecera `Origin` no coincide con el origen de la petición | JSON propio |
| 404 | `WEDDING_NOT_FOUND` | El usuario no tiene una boda asociada | JSON propio |
| 413 | `INVALID_IMAGE_SIZE` | El archivo está vacío o supera `R2_MAX_UPLOAD_BYTES` | JSON propio |
| 415 | `UNSUPPORTED_IMAGE_FORMAT` | El MIME no es uno de los formatos admitidos | JSON propio |
| 500 | `MEDIA_UPLOAD_FAILED` | Falla R2, la persistencia del recurso o cualquier dependencia previa | JSON propio; detalle sólo en servidor |

Si el objeto se sube a almacenamiento pero falla la persistencia del recurso,
Nuptia intenta borrar el objeto antes de devolver `MEDIA_UPLOAD_FAILED`.

### `GET /api/media/files/[...key]`

### `HEAD /api/media/files/[...key]`

Este endpoint sirve un recurso binario, por lo que sus errores no usan el contrato
JSON.

| HTTP | Cuerpo | Cuándo ocurre |
| --- | --- | --- |
| 304 | Vacío | `If-None-Match` coincide con el ETag |
| 404 | Vacío | La clave no comienza por `weddings/`, contiene `..` o el objeto no existe |
| 500 | Vacío | Falla el almacenamiento o la lectura |

El 500 incluye `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` y
`X-Request-Id`. El detalle completo sólo se registra en servidor.

## tRPC

Todos los procedimientos se exponen a través de:

```text
GET|POST /api/trpc/<router>.<procedure>
```

Las consultas individuales usan normalmente GET. tRPC también puede transportarlas
por POST o agrupar varias llamadas; en un batch el estado HTTP global no siempre
representa por sí solo el resultado de cada procedimiento, por lo que debe
inspeccionarse cada elemento.

### Errores comunes

| HTTP | `error.data.code` | Cuándo ocurre |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Entrada inválida según Zod o formato tRPC incorrecto |
| 401 | `UNAUTHORIZED` | Un procedimiento protegido no recibe sesión, usuario o sesión de aplicación |
| 404 | `NOT_FOUND` | No existe el procedimiento solicitado |
| 500 | `INTERNAL_SERVER_ERROR` | Excepción inesperada de repositorio, base de datos o lógica |

Los errores `BAD_REQUEST` pueden contener el detalle de validación de Zod en
`error.message`. No deben usarse como texto estable ni mostrarse sin procesar al
usuario final.

### Procedimientos

| Procedimiento | Acceso | Entrada | Ausencia de datos | Errores propios |
| --- | --- | --- | --- | --- |
| `guests.list` | Protegido | Ninguna | Devuelve `[]` si no hay boda | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `guests.byId` | Protegido | `string` con ID | Devuelve `null` si no existe | `BAD_REQUEST`, `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `invitations.currentDesign` | Protegido | Ninguna | Devuelve `null` si no hay boda o diseño | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `media.list` | Protegido | Ninguna | Devuelve `[]` si no hay boda | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `weddingSite.modules` | Protegido | Ninguna | Devuelve `[]` si no hay boda | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `weddingSite.publicBySlug` | Público | `string` no vacío; por defecto `demo` | Devuelve `null` si no existe un sitio público | `BAD_REQUEST`, `INTERNAL_SERVER_ERROR` |
| `weddings.current` | Protegido | Ninguna | Devuelve `null` si no hay boda | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |
| `weddings.dashboardSummary` | Protegido | Ninguna | Devuelve contadores a cero si no hay boda | `UNAUTHORIZED`, `INTERNAL_SERVER_ERROR` |

La ausencia de una entidad se representa actualmente mediante `null`, `[]` o un
resumen vacío según el procedimiento. No se transforma en `NOT_FOUND`.

## Rutas API inexistentes

### `/api`

### `/api/[...path]`

Para GET, POST, PUT, PATCH, DELETE, HEAD y OPTIONS:

| HTTP | Código | Mensaje |
| --- | --- | --- |
| 404 | `API_ROUTE_NOT_FOUND` | `Endpoint no encontrado` |

En una petición HEAD se conservan el estado y las cabeceras, pero HTTP omite el
cuerpo.

Los métodos HTTP no implementados por un Route Handler específico pueden recibir
un 405 generado directamente por Next.js. Ese 405 no contiene información interna,
pero no está normalizado aún con el contrato JSON propio.

## Registro en servidor

Los errores esperables 4xx no se registran como excepciones.

Una excepción inesperada se registra con:

- `operation`: operación interna, por ejemplo `media.upload`, `auth.post` o `trpc`.
- `requestId`: identificador que también se devuelve al cliente.
- `error`: excepción completa, disponible sólo en el log del servidor.

Nunca debe enviarse al cliente el objeto `Error`, su `stack`, rutas del sistema,
consultas SQL, credenciales ni variables de entorno.

## Reglas para clientes

1. Comprobar primero `response.ok` y `Content-Type`.
2. Para endpoints propios, usar `error.code`.
3. Para Better Auth, usar el `code` superior.
4. Para tRPC, usar `error.data.code`.
5. Mostrar un mensaje de producto traducido; no mostrar directamente errores de
   validación o mensajes internos.
6. Incluir `X-Request-Id` al reportar una incidencia.
7. No registrar cuerpos React Flight ni tratar rutas de página como endpoints API.

## Observaciones actuales

- `guests.byId` exige autenticación, pero actualmente consulta por ID sin comprobar
  en el router que el invitado pertenezca a la boda del usuario. Antes de exponer
  ese procedimiento a clientes no confiables debe añadirse autorización por
  tenant.
- Better Auth conserva mensajes en inglés y puede añadir códigos con nuevas
  versiones o plugins. El frontend debe depender del código, no del mensaje.
- El rate limit de Better Auth devuelve originalmente `X-Retry-After`, pero el
  wrapper actual transforma su respuesta no JSON en `AUTH_REQUEST_REJECTED` y no
  conserva esa cabecera. Conviene normalizarlo como un código específico antes de
  implementar reintentos automáticos en el cliente.
- Las rutas adicionales aportadas por el plugin `admin` dependen del contrato de
  Better Auth y no se consideran una API pública soportada por Nuptia.
- Los 405 generados automáticamente por Next.js no usan todavía el contrato JSON
  común.

## Fuentes de implementación

- `src/shared/http/api-errors.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/media/upload/route.ts`
- `src/app/api/media/files/[...key]/route.ts`
- `src/app/api/route.ts`
- `src/app/api/[...path]/route.ts`
- `src/core/trpc/init.ts`
- `src/composition/trpc/app-router.ts`
