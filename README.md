# Matt Innova Solution

> **Propiedad privada.** Código y contenido de titularidad de Matt Innova Solution.
> Todos los derechos reservados — ver [Licencia y propiedad](#licencia-y-propiedad).

Sitio público en Angular, panel CMS y API PHP + MariaDB. El chatbot clásico (respuestas predefinidas y enlaces a páginas) está activo por defecto; la IA se enciende desde el panel cuando hay una clave.

## Si recibiste este zip

Trae el código, el frontend, la API y `API/.env`. No trae `node_modules`, la caché de Angular ni el paquete de cPanel. Para levantarlo en local:

```bash
docker compose up --build
cd frontend
npm install
npm start
```

- Web: http://127.0.0.1:4200
- API: http://127.0.0.1:8000
- Admin local: http://127.0.0.1:4200/admin — `admin` / `admin123`

Docker usa su propia base (MariaDB del compose). `API/.env` solo completa lo que el contenedor no define; en local no sustituye usuario, base ni origen. Necesitas Docker, Node.js 20+ y npm. PHPMailer se instala solo la primera vez que arranca la API.

**¿No tienes Docker?** El proyecto también corre con **Podman** (`podman-compose up --build` / `podman compose up --build`) o **sin contenedores** (PHP + MariaDB + Node nativos, en Linux, macOS o Windows/XAMPP). Guía completa con verificación y consejos para agentes de IA: [docs/LEVANTAR-EN-OTRO-EQUIPO.md](docs/LEVANTAR-EN-OTRO-EQUIPO.md).

## Requisitos

- Node.js 20+
- PHP 8.1+ con `pdo_mysql`, `gd`, `curl`, `openssl`, `mbstring`, `iconv`
- MariaDB / MySQL
- Composer (solo para instalar PHPMailer)

## Desarrollo local

La API corre en Docker y el frontend con el CLI de Angular.

```bash
docker compose up --build
cd frontend
npm install
npm start
```

- Web: http://127.0.0.1:4200
- API: http://127.0.0.1:8000 (el proxy de Angular reescribe `/api` hacia ahí)
- Admin: http://127.0.0.1:4200/admin — usuario `admin` / `admin123` (solo local)
- Editor (si corre el seed de Docker): `editor` / `editor123`

El `docker-compose.yml` define la base y el admin local. No hace falta copiar `API/.env` para desarrollar.

Tests:

```bash
docker compose exec api php tests/verify-cms.php
cd frontend && npm run test:cms
cd frontend && npm run test:e2e
```

La primera vez: `cd frontend && npx playwright install chromium`.

La contraseña SMTP **no** debe vivir en git. Si rotas el buzón, actualiza solo `API/.env` (local) y `public_html/api/.env` (servidor). Para borrar la clave antigua del historial, en un clon limpio: `./tools/purge-smtp-history.sh` y luego force-push coordinado.

Migración / seed a mano (cPanel o CLI):

```bash
php API/migrate.php
```

## Chatbot híbrido

- **Clásico** (por defecto): `POST /api/bot` devuelve texto y links clicables (`/servicios`, `/contacto`, `/libro-reclamaciones`, etc.).
- **IA** (opcional): `POST /api/bot-ai` hace de proxy OpenAI-compatible (OpenRouter, DeepSeek o URL propia). La clave se guarda en `app_secrets` y **nunca** sale en un GET. Si no hay clave, está apagada o el proveedor falla, el widget usa el bot clásico.
- Panel único: `/admin/chatbot` (modo clásico o híbrido, proveedor, modelo, prueba de conexión). El inspector del sitio solo controla si el widget se muestra.

## Correos

El remitente por defecto es `notificaciones@mattinnovasolution.com`. El destino de contacto y del libro de reclamaciones sale del CMS (`destinationEmail` del bloque), o de `CONTACT_DEST_EMAIL` / `CLAIMS_DEST_EMAIL` en `.env`, o de los buzones `contacto@` y `libroreclamaciones@`. El interesado recibe copia si el SMTP responde bien. Si el correo falla, el formulario se guarda igual y el panel muestra que no se envió.

SMTP en cPanel:

- `SMTP_ENCRYPTION=ssl` y puerto `465`, o
- `SMTP_ENCRYPTION=tls` y puerto `587`

Los mensajes y reclamos se ven en `/admin/mensajes` (filtro, ticket, estado, CSV).

## Publicar en cPanel

Para recuperar una web vacía, subir sin perder datos y verificar el hosting:
[guía de recuperación de cPanel](docs/CPANEL-RECUPERACION.md).
El endpoint `/api.php/health` comprueba PHP, base, esquema y permisos sin ejecutar
migraciones ni mostrar credenciales.

El zip **no incluye** `.env`. Créalo en el servidor para no pisar credenciales al subir.

1. En cPanel, crea la base MariaDB y el usuario. Anota host (casi siempre `localhost`), nombre, usuario y clave.
2. Genera el paquete:

```bash
chmod +x tools/build-cpanel.sh
./tools/build-cpanel.sh
```

3. Sube **el contenido** de `dist-upload/` a `public_html/` (queda `public_html/index.html`, `public_html/api/`, `public_html/api.php`, etc.). No subas `node_modules/`, Docker ni tests. El `api.php` de la raíz es un frontal alternativo: el frontend lo usa (`/api.php/...`) para que el API funcione aunque el hosting regenere el `.htaccess` sin las reglas de `/api/`.
4. Crea `public_html/api/.env` con los valores reales (sin comillas, una variable por línea):

```
APP_ORIGIN=https://mattinnovasolution.com
APP_DEBUG=0
APP_SETUP=0
ADMIN_USER=admin
ADMIN_PASSWORD=una-clave-fuerte
EDITOR_USER=editor
EDITOR_PASSWORD=una-clave-fuerte
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_real_de_la_base
DB_USER=usuario_real
DB_PASSWORD=clave_real
SMTP_HOST=mail.mattinnovasolution.com
SMTP_PORT=465
SMTP_ENCRYPTION=ssl
SMTP_USER=notificaciones@mattinnovasolution.com
SMTP_PASSWORD=clave_del_buzon
SMTP_FROM=notificaciones@mattinnovasolution.com
SMTP_FROM_NAME=Matt Innova Solution
CONTACT_DEST_EMAIL=contacto@mattinnovasolution.com
CLAIMS_DEST_EMAIL=libroreclamaciones@mattinnovasolution.com
```

Si el sitio se abre con `www`, usa ese mismo origen en `APP_ORIGIN` (también se acepta el par con/sin www). Para forzar una migración, pon `APP_SETUP=1` un momento, recarga `/api/site` y vuelve a `0`.

5. Importa `mattinnova-cpanel.sql` con phpMyAdmin **o** deja que el primer request a `/api/site` cree tablas y el contenido inicial.
6. PHP 8.1+ y las extensiones de arriba (Select PHP Version). Escritura en `public_html/api/uploads` y `public_html/api/tmp`.
7. `public_html/.htaccess` reescribe la SPA y deja pasar `api/` y `sitemap.xml`. `public_html/api/.htaccess` reescribe a `index.php` y bloquea `.env`, tests, `tmp/` y `vendor/`.
8. Entra a `https://mattinnovasolution.com/admin`, cambia la contraseña del admin y, si vas a usar IA, carga la clave en **Chatbot**.

## Estructura

- `frontend/` — Angular (páginas dinámicas, CMS, admin)
- `API/` — PHP (CMS, correos, chatbot, media)
- `deploy/mattinnova-cpanel.sql` — esquema vacío para phpMyAdmin
- `tools/build-cpanel.sh` — build + zip de subida
- `docs/LEVANTAR-EN-OTRO-EQUIPO.md` — transferencia a otro equipo (Docker, Podman, sin contenedores, agentes)

## Licencia y propiedad

**Copyright © 2026 Matt Innova Solution. Todos los derechos reservados.**

Este repositorio es **propiedad privada** de Matt Innova Solution. El código fuente, el diseño, los textos, las imágenes y el contenido del CMS son obra protegida por la legislación peruana de derechos de autor (Ley N.° 13714, modificada por el Decreto Legislativo N.° 822) y por los tratados internacionales aplicables.

- **No** se otorga licencia MIT ni ninguna otra licencia de código abierto o libre.
- Queda prohibida la reproducción, distribución, comunicación pública, modificación, reutilización o comercialización total o parcial de este proyecto sin autorización escrita del titular.
- El plagio, la copia o el uso no autorizado serán sancionados conforme a la ley, incluidas las acciones administrativas ante INDECOPI y las acciones civiles y penales que correspondan.
- El acceso a este repositorio (por invitación o por entrega del paquete zip) se concede únicamente para fines de desarrollo, integración u operación autorizados por Matt Innova Solution, y no transfiere derecho alguno de propiedad intelectual.

Texto legal completo en el archivo [LICENSE](LICENSE).
