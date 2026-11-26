# Contratos CMS (no romper)

Estos nombres y formas JSON son la frontera entre Angular y la API PHP. Un refactor puede mover archivos, no puede renombrar estos campos.

## Documento de página (`GET /pages/{slug}`)

Claves de respuesta: `content`, `version`, `updated_at`, `schemaVersion`. En admin también `hasDraft`, `published`.

`content.blocks[]`:

- `id` (string)
- `type` (string, uno de los 23 tipos del catálogo)
- `hidden` (bool)
- `layout`: `{ width, padding, background, backgroundImage }`
- `props` (objeto; las claves dependen del tipo)

Optimistic locking: `PUT` / `publish` envían `version`. Conflicto = **409** con `version` y `content`.

## Documento de sitio (`GET /site`)

Campos planos que el shell público lee:

- `logo`, `logoAlt`
- `nav`, `navServices`
- `showClientsToggle`, `clientsLabel`
- `showSplash`, `splashSeconds`, `splashImages[]` (`image`, `alt`), `splashTagline`, `splashLabel`, `founderImage`, `founderName`, `founderRole`
- `showCtaBanner`, `ctaText`, `ctaEmail`, `ctaButton`
- `showWhatsapp`, `whatsappNumber`, `whatsappMessage`, `whatsappTooltip`
- `showChatbot`, `chatbotMode` (`ia` | `clasico`)
- `animateCarousels`
- `cookieText`, `cookieAccept`, `cookieReject`
- `footer.*`
- `defaultLocale`

## Query locale

Todas las lecturas CMS llevan `?locale=es|en` (o header `X-CMS-Locale`). ES es el fallback.

## Formularios públicos

- `POST /contacto` body: `name`, `email`, `phone`, `subject`, `message`. Respuesta: `status`, `message`, **`mailSent`**.
- `POST /reclamaciones` respuesta: **`ticket`**, **`mailSent`**, `message`.
- `POST /accesibilidad` body: `name`, `email`, `phone`, `assistanceType`, `description`.
- Errores 400: `{ field, message }`.

## Chat

`POST /bot` y `/bot-ai`: `{ message }` → `{ reply, links: [{ label, path }], source }`. `path` empieza por `/`.

## Catálogo

`GET /blocks` → `{ blocks, templates }`. Fuente: `cms/blocks.json` (copiada a `API/cms/blocks.json`). Regenerar con `php tools/gen-blocks.php`.

## Imágenes públicas

Convención `webpSource()`: `.jpg` / `.png` → `.webp`. Si el CMS guarda `.webp`, el fallback raster es `.jpg`. Las subidas van a `/api/uploads/` en WebP, con JPG hermano y copia en `uploads/originals/`. Un recorte deja historial en `uploads/history/`. El schema 11 solo reescribe nombres de foto pesada (software/consultoría/hardware); no pisa textos editoriales.

El campo CMS de imagen sigue siendo **un string**. Las variantes responsive (`{id}-480.webp`, `{id}-960.webp` y JPG hermano) son una mejora progresiva: el frontend arma `srcset` por convención de nombre. `GET /media/resolve?url=` (público, solo lectura) devuelve `{ url, width, height, variants }` sin cambiar `/pages` ni `/site`. Regenerar archivos faltantes: `php media-backfill.php`.

## Campos aditivos del rediseño

Opcionales; no cambian las claves existentes. El contenido viejo sigue funcionando con defaults/fallbacks.

- `hero.props.stats[]`: `{ icon, number, label }` (iconos `users`, `handshake`, `laptop`, `calendar`).
- `hero.props.slides[].titleAccent`: palabra/frase del título que se pinta en cian.
- `hero.props.secondaryCta`, `hero.props.secondaryLink`.
- `services.props.text`, `services.props.titleAccent`; `services.props.cards[].icon`, `.link`.
- `serviceCards.props.cards[].icon`.
- `pageHero.props.titleAccent`, `listingHero.props.titleAccent`, `serviceHero.props.titleAccent`.
- `layout.backgroundImage`: URL de imagen para el fondo de la sección; tapa `layout.background` y aplica un velo oscuro. Por defecto `/images/redesign/section-bg.webp` (`CMS_DEFAULT_BG_IMAGE`); vacío = sin imagen. `schemaVersion` 6 la rellena en bloques existentes.

## Versiones de schema

- `APP_SCHEMA_VERSION` (migrate.php / `app_secrets.schema_version`): DDL y migraciones de datos de la app.
- `CMS_SCHEMA_VERSION` (cms-schema.php / `document.schemaVersion`): forma JSON de cada documento.
- En bases que ya estaban en v14, las migraciones de datos anteriores se marcan como aplicadas. La v15 corrige datos de contacto de relleno y textos concretos en contenido publicado y borradores. Cada corrección tiene su propia marca de ejecución.

## Qué no tocar en este refactor

`API/.env`, `.env.example`, SMTP, `DB_*`, `APP_ORIGIN`, contenido CMS en MariaDB, `API/uploads`.
