# Desplegar Nuptia en Vercel con Cloudflare D1

Esta guía parte de la situación actual:

- La base de datos D1 `nuptia-wedding-planner` ya existe, pero está vacía y no tiene tablas.
- El bucket R2 `nuptia-media` ya existe, pero las fotos se configurarán en una segunda fase.
- La aplicación web se desplegará en Vercel.
- Cloudflare seguirá gestionando el DNS de `fenrig.dev`.
- El desarrollo local seguirá usando los simuladores de D1 y R2 de Wrangler.

No necesitas desplegar la aplicación Next.js en Cloudflare ni crear un Worker intermedio. En Vercel, Prisma usa la API HTTP oficial de D1. En local, Prisma sigue usando el binding `DB` simulado por Wrangler.

## 1. Qué vas a conseguir

El resultado será este:

```text
Desarrollo local
Next.js → Wrangler local → D1 y R2 simulados

Producción
Usuario → Cloudflare DNS → Vercel → API HTTP de D1
```

La variable automática `VERCEL=1` permite que la aplicación elija la conexión correcta. No tienes que crearla manualmente:

- Si `VERCEL=1`, usa las credenciales HTTP de D1.
- Si no existe, usa el binding local `DB` de `wrangler.jsonc`.

## 2. Requisitos previos

Necesitas:

1. Una cuenta de Cloudflare que tenga la base D1 y el dominio `fenrig.dev`.
2. Una cuenta de Vercel conectada al proveedor Git donde está este repositorio.
3. Node.js 20 o posterior.
4. `pnpm` instalado.
5. Acceso al terminal en la raíz del proyecto.

Instala las dependencias:

```bash
pnpm install
```

## 3. Comprobar la cuenta y la base D1

Inicia sesión en Cloudflare desde el terminal:

```bash
pnpm exec wrangler login
pnpm exec wrangler whoami
```

Lista las bases existentes:

```bash
pnpm exec wrangler d1 list
```

Debes encontrar `nuptia-wedding-planner`. Comprueba también que su identificador coincide con `database_id` en `wrangler.jsonc`.

No vuelvas a ejecutar `wrangler d1 create`, porque la base ya existe y crearías otra diferente.

## 4. Crear todas las tablas de producción

La base remota está vacía. Las tablas se crean aplicando las migraciones que ya están en `prisma/migrations_d1`.

Primero puedes ver qué migraciones están pendientes:

```bash
pnpm exec wrangler d1 migrations list DB --remote
```

Después aplica todas las migraciones remotas:

```bash
pnpm db:migrate:remote
```

Este comando trabaja sobre Cloudflare, no sobre el simulador local. En una base vacía debería aplicar desde `0001_init.sql` hasta la migración más reciente.

Comprueba que las tablas existen:

```bash
pnpm exec wrangler d1 execute DB --remote --command="SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name"
```

Deberías ver tablas como `user`, `app_users`, `weddings`, `guest_parties`, `guests` y `d1_migrations`.

### Datos iniciales opcionales

Si quieres cargar la boda de María Daniela y Nacho y la cuenta de demostración definida en el proyecto:

```bash
pnpm db:seed:remote
```

El seed crea usuarios de acceso además de datos de ejemplo. Antes de publicar la aplicación, revisa y cambia las contraseñas de desarrollo definidas en `prisma/seed.ts`. No publiques una aplicación con credenciales conocidas incluidas en el código.

No ejecutes el seed remoto si prefieres comenzar con la base completamente vacía y crear los usuarios desde la aplicación.

## 5. Crear el token que Vercel usará para D1

Vercel necesita tres valores para acceder a D1:

- El identificador de la cuenta de Cloudflare.
- El identificador de la base D1.
- Un API Token con permiso para leer y escribir en D1.

En Cloudflare:

1. Abre tu perfil.
2. Entra en **API Tokens**.
3. Pulsa **Create Token**.
4. Elige **Create Custom Token**.
5. Ponle un nombre reconocible, por ejemplo `nuptia-vercel-d1`.
6. En permisos de cuenta, selecciona `D1: Edit`.
7. Limita los recursos a la cuenta que contiene Nuptia.
8. Crea el token y cópialo en un gestor de contraseñas.

Cloudflare solo muestra el token completo una vez. No lo escribas en `.env.example`, no lo subas a Git y no lo pegues en capturas de pantalla.

Puedes encontrar:

- `CLOUDFLARE_ACCOUNT_ID` en la página principal de la cuenta de Cloudflare o con `wrangler whoami`.
- `CLOUDFLARE_DATABASE_ID` en la ficha de D1 y en `wrangler.jsonc`.
- `CLOUDFLARE_D1_TOKEN` es el token recién creado.

## 6. Crear el proyecto en Vercel

1. Sube la rama que quieras desplegar a GitHub, GitLab o Bitbucket.
2. En Vercel, pulsa **Add New → Project**.
3. Importa el repositorio de Nuptia.
4. Vercel debería detectar automáticamente **Next.js**.
5. La raíz del proyecto debe ser `.`.
6. Usa `pnpm install` como comando de instalación si Vercel no lo detecta.
7. Usa `pnpm build` como comando de build.
8. No cambies el directorio de salida; Vercel conoce el formato de Next.js.

Todavía no pulses el despliegue definitivo: configura antes las variables.

## 7. Variables de entorno de Vercel

Abre **Project → Settings → Environment Variables**. Añade inicialmente las variables al entorno **Production**.

### Variables obligatorias para D1

| Variable | Valor | Secreta |
| --- | --- | --- |
| `CLOUDFLARE_D1_TOKEN` | API Token creado en el paso anterior | Sí |
| `CLOUDFLARE_ACCOUNT_ID` | ID de la cuenta de Cloudflare | No |
| `CLOUDFLARE_DATABASE_ID` | ID de `nuptia-wedding-planner` | No |

No añadas `VERCEL`. Vercel la crea automáticamente con el valor `1`.

Tampoco necesitas `DATABASE_URL` en producción. Esa variable solo se conserva para herramientas locales de Prisma; el runtime usa D1.

### Variables obligatorias de la aplicación

| Variable | Valor recomendado para producción | Secreta |
| --- | --- | --- |
| `APP_URL` | `https://nuptia.fenrig.dev` | No |
| `AUTH_PROVIDER` | `better-auth` | No |
| `AUTH_ENFORCE` | `true` | No |
| `BETTER_AUTH_URL` | `https://nuptia.fenrig.dev` | No |
| `BETTER_AUTH_SECRET` | Cadena aleatoria de al menos 32 caracteres | Sí |
| `BETTER_AUTH_DATABASE_PROVIDER` | `sqlite` | No |

Puedes generar `BETTER_AUTH_SECRET` en tu ordenador:

```bash
openssl rand -base64 32
```

Guarda el resultado directamente en Vercel. No lo guardes en Git.

### Variables opcionales

Configúralas solamente cuando uses esas funciones:

| Variable | Cuándo hace falta |
| --- | --- |
| `RESEND_API_KEY` | Envío real de correos |
| `EMAIL_FROM` | Remitente de los correos |
| `SPOTIFY_CLIENT_ID` | Integración con Spotify |
| `SPOTIFY_CLIENT_SECRET` | Integración con Spotify |
| `SPOTIFY_REDIRECT_URI` | Callback de Spotify; usa `https://nuptia.fenrig.dev/api/integrations/spotify/callback` |
| Variables de Supabase | Solo si activas Supabase |

El bucket R2 queda fuera de esta fase. No pruebes todavía las rutas de subida o lectura de fotografías en producción.

## 8. Primer despliegue

Pulsa **Deploy** en Vercel. También puedes provocar un despliegue haciendo `push` a la rama de producción.

Durante el build deberían ejecutarse:

1. `pnpm install`.
2. `prisma generate` mediante `postinstall` y `prebuild`.
3. `next build`.

Cuando termine, abre la URL temporal `*.vercel.app` y revisa los logs si aparece un error.

Pruebas mínimas:

1. Abre la landing.
2. Inicia sesión.
3. Abre `/app`.
4. Comprueba una pantalla que lea datos de D1.
5. Crea o modifica un dato pequeño y confirma que aparece en Cloudflare D1.

Si aparece `no such table`, vuelve al paso 4: las migraciones remotas no se aplicaron a la base correcta.

Si aparece `not authorized`, revisa el token, el Account ID, el Database ID y el permiso `D1: Edit`.

## 9. Configurar `nuptia.fenrig.dev`

Primero añade el dominio en Vercel:

1. Abre **Project → Settings → Domains**.
2. Añade `nuptia.fenrig.dev`.
3. Vercel mostrará el CNAME exacto que necesita el proyecto.

Después abre **Cloudflare → fenrig.dev → DNS** y crea:

| Campo | Valor |
| --- | --- |
| Tipo | `CNAME` |
| Nombre | `nuptia` |
| Destino | El CNAME exacto indicado por Vercel |
| Proxy | `DNS only` al principio |
| TTL | Auto |

Espera hasta que Vercel muestre el dominio como válido y haya emitido el certificado HTTPS. Después puedes activar el proxy naranja de Cloudflare para que sus Redirect Rules procesen las peticiones.

En **SSL/TLS** de Cloudflare usa `Full (strict)` cuando el certificado de Vercel ya esté activo.

Actualiza o vuelve a comprobar estas variables de Vercel:

```text
APP_URL=https://nuptia.fenrig.dev
BETTER_AUTH_URL=https://nuptia.fenrig.dev
SPOTIFY_REDIRECT_URI=https://nuptia.fenrig.dev/api/integrations/spotify/callback
```

Después de cambiar variables en Vercel debes hacer un nuevo despliegue.

## 10. Redirigir `/i/[slug]` al dominio de la boda

Esta regla se configura en Cloudflare, no en Next.js. Así no afecta al desarrollo local ni a la URL temporal de Vercel.

En **Cloudflare → fenrig.dev → Rules → Redirect Rules**:

1. Crea una regla de tipo **Single Redirect**.
2. Elige un redirect con comodín.
3. Configura:

```text
Request URL:
https://nuptia.fenrig.dev/i/*

Target URL:
https://bodamariadanielaynacho.es/i/${1}

Status code:
302

Preserve query string:
Activado
```

Ejemplo:

```text
https://nuptia.fenrig.dev/i/token-ana-santos
→ https://bodamariadanielaynacho.es/i/token-ana-santos
```

Usa `302` mientras haces pruebas. Cuando confirmes que funciona y que no hay bucles, puedes cambiarlo a `301`.

Para que la URL de destino muestre la misma aplicación, `bodamariadanielaynacho.es` también debe estar añadido al proyecto de Vercel y apuntar mediante DNS al valor indicado por Vercel. La regla no crea ni configura el dominio de destino; únicamente redirige hacia él.

La regla solo debe coincidir cuando el host sea `nuptia.fenrig.dev`. No crees la misma regla sobre `bodamariadanielaynacho.es`, porque provocarías un bucle.

## 11. El flujo local no cambia

Tu `.env.local` debe conservar los valores locales:

```text
APP_URL=http://localhost:3000
DATABASE_URL=file:./prisma/dev.db
BETTER_AUTH_URL=http://localhost:3000
```

No copies las tres variables `CLOUDFLARE_*` de producción a `.env.local`. Aunque estuvieran presentes, la aplicación solo selecciona HTTP cuando Vercel proporciona `VERCEL=1`; mantenerlas fuera reduce errores y exposición accidental.

Comandos locales habituales:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- `pnpm db:migrate` aplica migraciones al D1 simulado.
- `pnpm db:seed` carga datos en el D1 simulado.
- `pnpm dev` usa Next.js con los bindings locales inicializados por OpenNext/Cloudflare.

Nunca añadas `--remote` a un comando local salvo que quieras modificar deliberadamente la base de producción.

## 12. Cambios futuros de base de datos

Cuando añadas una migración nueva:

1. Aplícala y pruébala localmente:

   ```bash
   pnpm db:migrate
   pnpm test
   pnpm test:d1
   ```

2. Haz una copia de seguridad o revisa el impacto si contiene cambios destructivos.
3. Aplica la migración remota antes de desplegar código que dependa de las columnas nuevas:

   ```bash
   pnpm db:migrate:remote
   ```

4. Despliega la nueva versión en Vercel.

No ejecutes migraciones automáticamente durante `next build`. El build puede repetirse y una migración debe ser una operación consciente y controlada.

## 13. Lista final de comprobación

- [ ] `wrangler whoami` muestra la cuenta correcta.
- [ ] El `database_id` de `wrangler.jsonc` coincide con la base existente.
- [ ] `pnpm db:migrate:remote` ha creado todas las tablas.
- [ ] El token de Cloudflare tiene `D1: Edit` y está guardado solo en Vercel.
- [ ] Las tres variables `CLOUDFLARE_*` están en Vercel Production.
- [ ] Better Auth tiene una clave segura y las URLs de producción.
- [ ] El build de Vercel termina correctamente.
- [ ] `nuptia.fenrig.dev` está validado en Vercel.
- [ ] El CNAME de Cloudflare apunta al destino exacto indicado por Vercel.
- [ ] La regla `/i/*` preserva el valor capturado y la query string.
- [ ] El desarrollo local sigue funcionando sin credenciales HTTP de D1.

## 14. Sobre el coste cero

Esta arquitectura no necesita un Worker intermedio y evita consumir invocaciones de Workers. D1 mantiene sus límites del plan gratuito y Vercel puede funcionar en Hobby mientras se respeten sus límites y condiciones de uso. Ten presente que Vercel declara Hobby como plan personal y no comercial; si Nuptia pasa a explotación comercial, revisa el plan aplicable.
