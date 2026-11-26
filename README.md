# Matt Innova Solution

> **Propiedad privada.** Código y contenido de titularidad de Matt Innova Solution.
> Todos los derechos reservados — ver [Licencia y propiedad](#licencia-y-propiedad).

Sitio web corporativo bilingüe (ES/EN) con CMS por bloques, panel de administración y API propia.

- **Frontend:** Angular 21 (`frontend/`), tema público "Cyber UI" y panel `/admin`.
- **API:** PHP 8.1+ sin framework (`API/`), MariaDB/MySQL, PHPMailer.
- **Hosting:** cPanel compartido (Apache + PHP). No requiere Node en el servidor.

Novedades de cada entrega: [CHANGELOG.md](CHANGELOG.md).

## Funciones principales

- **CMS por bloques** con edición en línea, borrador/publicado, historial de revisiones, bloqueo optimista (`409` si alguien guardó antes) y autoguardado.
  - Si la sesión caduca, el borrador se guarda en el navegador y se recupera al volver a entrar.
- **Bilingüe ES/EN.** La URL manda: `/en/...` es inglés y sin prefijo es español. Si a una página le falta la versión EN, se muestra la ES.
  - Al **crear una página en ES** se crea su versión EN con los mismos bloques. El texto se traduce a mano.
  - Al **cambiar una imagen en ES** se actualiza en EN, salvo que en EN se haya puesto otra a propósito.
- **Medios:** subidas en WebP con JPG hermano y variantes `-480`/`-960`, recorte e historial.
- **Formularios** de contacto y **Libro de Reclamaciones** (INDECOPI) con correo SMTP y bandeja en `/admin/mensajes`.
- **Chatbot híbrido:** clásico por defecto; IA opcional desde `/admin/chatbot`.
- **Accesibilidad AA:** panel de herramientas, foco visible, `prefers-reduced-motion` y alto contraste.

## Requisitos

| Uso | Necesitas |
|---|---|
| Desarrollo | Docker o Podman, Node.js 20+ y npm |
| Servidor | PHP 8.1+ con `pdo_mysql`, `gd`, `curl`, `openssl`, `mbstring`, `iconv`; MariaDB/MySQL |

El código se mantiene compatible con **PHP 8.1** aunque Docker use 8.3. No subas versiones de dependencias sin probar en el hosting.

## Desarrollo local

```bash
docker compose up --build              # API en :8000 + MariaDB en :3307
cd frontend && npm install && npm start # web en http://localhost:4200
```

- Web: **http://localhost:4200**. Usa `localhost`: en algunos equipos `ng serve` no responde en `127.0.0.1`.
- API: http://127.0.0.1:8000. El proxy de Angular reescribe `/api` hacia ahí.
- Admin local: http://localhost:4200/admin — `admin` / `admin123` (editor: `editor` / `editor123`).

`docker-compose.yml` define la base y las credenciales locales; `API/.env` es opcional en local.

Sin Docker: Podman (`podman compose up --build`) o PHP + MariaDB + Node nativos. Ver [docs/LEVANTAR-EN-OTRO-EQUIPO.md](docs/LEVANTAR-EN-OTRO-EQUIPO.md).

## Pruebas

```bash
docker compose exec api php tests/verify-cms.php      # sanitizado, migraciones, contratos
cd frontend && npm run test:cms                       # Vitest
cd frontend && npm run test:e2e                       # Playwright (API arriba)
./tools/check-contracts.sh                            # verify + fixtures + SCSS + build prod
```

- **Primera vez:** `cd frontend && npx playwright install chromium`.
- **Otra URL:** para probar contra otra dirección, por ejemplo el paquete de cPanel servido en local, usa `E2E_BASE_URL=http://localhost:8090 npm run test:e2e`.
- **Idioma de las pruebas:** Playwright corre en `es-ES`. Las pruebas de idioma fijan el suyo.
- **Límite de login:** la API limita los intentos de login por IP (`API/tmp/ratelimit/`). Si corres la suite muchas veces seguidas y aparece un `429`, espera un minuto o vacía esa carpeta.

## Publicar en cPanel

```bash
./tools/build-cpanel.sh      # genera dist-upload/ y dist-upload.zip
```

1. Sube y **descomprime el contenido** de `dist-upload.zip` en `public_html/`.
   - **No borres** `public_html/api/uploads/` (imágenes del CMS), `public_html/api/tmp/` ni `public_html/api/.env`.
   - El zip no trae `.env` ni subidas.
2. Primera instalación: crea `public_html/api/.env` (ver plantilla abajo) y deja que la primera visita a `/api/site` cree tablas y contenido. También puedes importar `deploy/mattinnova-cpanel.sql`.
3. Entra una vez al sitio. Si hay migraciones pendientes, se aplican solas en esa visita.
4. `public_html/api/uploads` y `public_html/api/tmp` deben tener permiso de escritura.
5. Diagnóstico sin credenciales: `/api.php/health`.

Guía detallada y recuperación: [docs/CPANEL-RECUPERACION.md](docs/CPANEL-RECUPERACION.md).

Plantilla de `public_html/api/.env` (sin comillas, una variable por línea):

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

`APP_SETUP` debe quedar en `0`. Aunque alguien lo ponga en `1`, no se re-instala nada si el esquema ya está al día: la marca se guarda en la base (`setup_done_version`).

### Base de datos y migraciones

- `API/migrate.php` (`APP_SCHEMA_VERSION`, hoy **15**) define el DDL y las migraciones de datos. `API/cms-schema.php` (`CMS_SCHEMA_VERSION`) define la forma del JSON.
- **Las migraciones de contenido corren una sola vez por base.** Quedan registradas en `app_secrets` (`migration_done:<nombre>`) y nunca vuelven a pisar lo editado en el CMS.
- Las correcciones de datos son **condicionales**: solo cambian un valor si sigue siendo exactamente el de origen. Si ya se editó en el CMS, se respeta.
- Migración manual por CLI: `php API/migrate.php`.

### Caché y actualizaciones

El sitio **no usa Service Worker**. El paquete trae el `safety-worker` de Angular como `ngsw-worker.js`, para que los navegadores que tenían el antiguo se limpien solos. Tras subir una versión, nadie tiene que borrar caché.

| Recurso | Cabecera | Resultado |
|---|---|---|
| `index.html` | `no-cache` | Detecta la versión nueva en cada visita |
| `.js` / `.css` (nombre con hash) | `max-age=1 año, immutable` | Solo se descarga lo que cambió |
| Imágenes fijas del sitio | `no-cache` + ETag | `304` sin cuerpo si no cambiaron |
| Subidas del CMS (`api/uploads`) | `max-age=1 año, immutable` | Cada subida tiene nombre único |
| API pública | `no-cache` + ETag + `Vary` | Lo publicado se ve en la siguiente carga |
| API con sesión de admin | `private, no-store` | El editor siempre lee datos frescos |

## Estructura

```
frontend/                Angular: páginas públicas, CMS (cms/), panel (admin/), widgets (components/)
  src/styles/            tokens (_tokens.scss), Cyber UI (_cyber.scss), marco/fondo (_shared.scss)
  e2e/                   pruebas Playwright
API/                     PHP: index.php + Http/Router.php, handlers por dominio, Domain/, Repos/
  migrate.php            esquema y migraciones run-once
  seed.php, seed-en.php  contenido inicial ES/EN
cms/blocks.json          catálogo de bloques → python3 tools/gen-blocks.py
docs/                    contratos-cms.md, CPANEL-RECUPERACION.md, LEVANTAR-EN-OTRO-EQUIPO.md, historial/
deploy/                  esquema SQL vacío para phpMyAdmin
tools/                   build-cpanel.sh, check-contracts.sh, gen-blocks.py
api.php                  frontal /api.php/... para hostings que regeneran el .htaccess
```

El contrato JSON entre Angular y PHP está en [docs/contratos-cms.md](docs/contratos-cms.md). Los campos no se renombran; los nuevos son aditivos y opcionales. Notas para agentes y desarrolladores: [AGENTS.md](AGENTS.md).

## Correos y chatbot

- **Remitente:** `notificaciones@mattinnovasolution.com`.
- **Destino:** se toma del CMS (`destinationEmail`); si no está, de `CONTACT_DEST_EMAIL` / `CLAIMS_DEST_EMAIL`. Si el SMTP falla, el mensaje se guarda igual y el panel lo marca.
- **Puertos SMTP:** `ssl`/465 o `tls`/587.
- **Chatbot:**
  - El modo clásico (`POST /api/bot`) responde con enlaces internos.
  - El modo IA (`POST /api/bot-ai`) es opcional y usa un proveedor compatible con OpenAI. Su clave vive en `app_secrets` y nunca sale por GET.
  - Si la IA falla, responde el modo clásico.
- **Contraseñas:** nunca se commitean. Para rotar el SMTP, actualiza `API/.env` en local y `public_html/api/.env` en el servidor.

## Licencia y propiedad

**Copyright © 2026 Matt Innova Solution. Todos los derechos reservados.**

Este repositorio es **propiedad privada** de Matt Innova Solution. El código fuente, el diseño, los textos, las imágenes y el contenido del CMS son obra protegida por la legislación peruana de derechos de autor (Ley N.° 13714, modificada por el Decreto Legislativo N.° 822) y por los tratados internacionales aplicables.

- **No** se otorga licencia MIT ni ninguna otra licencia de código abierto o libre.
- Queda prohibida la reproducción, distribución, comunicación pública, modificación, reutilización o comercialización total o parcial de este proyecto sin autorización escrita del titular.
- El plagio, la copia o el uso no autorizado serán sancionados conforme a la ley, incluidas las acciones administrativas ante INDECOPI y las acciones civiles y penales que correspondan.
- El acceso a este repositorio (por invitación o por entrega del paquete zip) se concede únicamente para fines de desarrollo, integración u operación autorizados por Matt Innova Solution, y no transfiere derecho alguno de propiedad intelectual.

Texto legal completo en el archivo [LICENSE](LICENSE).
