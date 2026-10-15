# Fotos de invitados en R2

La galería de la web de boda (`/w/[slug]`, sección Galería) deja subir fotos a
los invitados identificados por teléfono y a los fotógrafos de
`WEDDING_PHOTOGRAPHER_PHONES`. Se muestran al momento como polaroids con el
nombre de quien la subió.

## Cómo funciona

1. Si el selector entrega HEIC/HEIF, el navegador lo convierte a JPEG (calidad
   92) con `heic-to`, cargado bajo demanda y con decodificación en un worker.
   Las conversiones se hacen en serie; se muestra «Preparando…». Se comprueba
   el contenido para no reconvertir los JPEG que iOS entregue con nombre HEIC.
2. El navegador pide permiso (`requestGuestPhotoUploadAction`). El servidor
   valida el `guestId` guardado en el navegador (o el teléfono del fotógrafo)
   y devuelve una URL firmada de R2 válida 15 minutos.
3. El navegador sube el **original** (el JPEG convertido en el caso HEIC)
   directamente a R2 con `PUT`. No pasa por
   Vercel, así que no le afecta el límite de 4,5 MB por petición.
4. El navegador avisa (`completeGuestPhotoUploadAction`). El servidor descarga
   el original, y con `sharp` genera:
   - `optimized.webp`: lado largo máx. 2048 px, calidad 82, para el visor.
   - `thumbnail.webp`: cuadrada de 640 px, calidad 74, para la parrilla.

   Ambas se enderezan según el EXIF y no llevan metadatos (sin GPS). Después
   se guarda la fila en `guest_photos` (D1).

Claves en el bucket:

```
weddings/<weddingId>/guest-photos/<photoId>/original.<ext>
weddings/<weddingId>/guest-photos/<photoId>/optimized.webp
weddings/<weddingId>/guest-photos/<photoId>/thumbnail.webp
```

La parrilla se carga por páginas de 24 desde `GET /api/w/<slug>/photos`
(scroll infinito) y las miniaturas son `loading="lazy"`.

## Configuración

### Pruebas en local (sin credenciales de Cloudflare)

`pnpm dev` utiliza el bucket `MEDIA_BUCKET` y la base `DB` simulados por
Wrangler, con persistencia en `.wrangler/state/v3/`. Antes de probar:

```bash
pnpm db:migrate
# Solo si todavía no tienes datos de prueba:
pnpm db:seed
pnpm dev
```

Abre `/w/<slug>` de una boda publicada, identifícate con el teléfono de un
invitado de esa base local y sube una foto desde la galería. Para verla antes
del día de la boda, configura `WEDDING_SITE_ENABLED="true"` en `.env.local`.

En desarrollo el permiso devuelve una URL de la propia app
(`/api/media/local-upload`) con firma y caducidad. Su `PUT` guarda el original
en R2 local y después se ejecutan la misma optimización y escritura en D1 que
en producción. Las fotos locales se sirven por `/api/media/files/...`, incluso
si tienes `R2_PUBLIC_BASE_URL` configurada. No necesitas token S3 ni CORS.
Las credenciales S3 presentes en el entorno no se utilizan en `pnpm dev`.
La ruta de subida local responde 404 fuera de desarrollo.

`VERCEL=1` selecciona el acceso de D1 por API; no es un interruptor para
activar R2 local. Déjala sin definir para las pruebas locales.

La integración de subida, procesamiento, publicación y borrado se comprueba
contra ambos simuladores con `pnpm test:d1`. La prueba limpia su foto y sus
tres archivos al terminar.

### 1. Token de API de R2 (producción)

Cloudflare → R2 → **Manage R2 API Tokens** → *Create API token*, permiso
**Object Read & Write** limitado al bucket `nuptia-media`. Copia:

```
R2_ACCOUNT_ID="<id de la cuenta>"
R2_ACCESS_KEY_ID="<access key id>"
R2_SECRET_ACCESS_KEY="<secret access key>"
R2_BUCKET_NAME="nuptia-media"
```

Ponlas en Vercel (Production). En producción, sin ellas la subida responde
"no disponible". En `pnpm dev` se usa el simulador local sin estas claves.

### 2. CORS del bucket

La subida directa desde el navegador necesita CORS. En R2 → bucket →
*Settings* → *CORS policy*:

```json
[
  {
    "AllowedOrigins": [
      "https://<dominio de la web de boda>",
      "https://<dominio de la app>",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Dominio público (recomendado)

R2 → bucket → *Settings* → *Custom Domains* → conecta un subdominio, por
ejemplo `fotos.<tu dominio>`, y ponlo en `R2_PUBLIC_BASE_URL` (sin barra
final). Las imágenes se sirven desde la CDN de Cloudflare con caché de un año
(las claves no se reutilizan).

Sin dominio público las imágenes pasan por `/api/media/files/...` en la app:
funciona, pero cada imagen consume una función de Vercel.

### 4. Migración de la base de datos

`prisma/migrations_d1/0012_guest_photos_r2.sql` recrea `guest_photos` (la tabla
no se usaba). En remoto:

```bash
pnpm exec wrangler d1 migrations list DB --remote
pnpm db:migrate:remote
```

## Nombres en las polaroids

- Invitado: nombre y apellido. Si su invitación es de varias personas, al
  subir elige firmar solo o con el nombre de la invitación ("Ana y Juan").
  El nombre se guarda en `credit` al subir.
- Fotógrafo: no es invitado (`guestId` null, se guarda su teléfono). El nombre
  se calcula al mostrar la foto con `PHOTOGRAPHER_PHOTO_CREDIT` en
  `wedding-experience.dto.ts`: `"couple"` (nombres de los novios) o `"none"`.

## Formatos

JPG, PNG, WebP y AVIF hasta 25 MB. También se pueden elegir HEIC/HEIF: se
convierten automáticamente a JPEG en el dispositivo antes de subir a R2.
No se depende de la conversión del selector de iOS ni del soporte HEIC de
`sharp` en Vercel. El límite se aplica tanto al archivo elegido como al JPEG
resultante. La conversión no añade trabajo de Vercel; `sharp` sigue generando
las dos versiones WebP. En el caso HEIC, el original almacenado es el JPEG
convertido, sin los metadatos originales. Si falla una conversión, esa foto
se marca con un error y las demás se pueden enviar.


## Diagnóstico de producción

### `sharp` y la biblioteca `libvips` en Vercel

Si una petición falla con `Failed to load external module sharp` y
`libvips-cpp.so...: cannot open shared object file`, falta una biblioteca
nativa en el paquete desplegado. No es un rechazo del teléfono ni de R2.

`next.config.ts` incluye explícitamente las bibliotecas de los paquetes
`@img/sharp-libvips-*` en las funciones `/w/*`, que procesan las fotos. La
configuración de pnpm admite la plataforma actual y Linux. El procesador
carga el binario al procesar la foto, de forma que la validación y el tablón
pueden funcionar incluso si una instalación de sharp falla.

Tras este cambio hay que crear un nuevo despliegue en Vercel. Si el despliegue
reutiliza la instalación defectuosa, repetirlo con la caché de build desactivada.

### Respuestas y trazas de identificación

El formulario de acceso usa `POST /api/w/<slug>/guest-access`, con JSON:

```json
{ "phone": "<teléfono>" }
```

Una identificación de fotógrafo devuelve HTTP 200 y
`{ "status": "photographer", "requestId": "..." }`. Los fallos inesperados
responden HTTP 500, `Content-Type: application/json` y:

```json
{
  "error": {
    "code": "GUEST_ACCESS_VERIFICATION_FAILED",
    "message": "No se pudo comprobar el teléfono. Usa esta referencia para localizar el error en los logs del servidor.",
    "requestId": "..."
  }
}
```

La cabecera `X-Request-Id` coincide con la referencia del cuerpo y del formulario.
En **Vercel → proyecto → Logs**, busca ese identificador. La entrada JSON
`event: "api.error"` incluye `operation`, `requestId` y la excepción con
`name`, `message`, `stack` y `cause` cuando existe. No se registra el cuerpo
del formulario. La traza se conserva en el servidor; no se envía al navegador.
