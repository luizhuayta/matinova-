# CMS Matt Innova — qué se construyó

Documentación del panel de administración y de la API, con el estado **actual** del código (CMS acoplado Angular + PHP, fases 0–8 y refactor interno R1–R5). No es un page builder: las plantillas Angular son fijas; el editor cambia textos, fotos y listas dentro de esas plantillas.

Local: frontend `http://127.0.0.1:4200`, API `http://127.0.0.1:8000`, MariaDB en el puerto `3307`. Login de desarrollo: `admin` / `admin123` (cambiar en producción).

La web pública **no** necesita sesión. Un visitante no descarga Quill ni el arrastre del panel.

---

## Idea en una frase

Hay un JSON por página (`pages.content`) y otro del sitio (`site_settings.content`). El visitante lee la versión **publicada**. El panel edita un **borrador**, lo guarda solo y solo al pulsar **Publicar** (rol administrador) la web cambia.

```
Visitante  →  GET JSON publicado  →  mismas páginas Angular
Admin      →  login cookie       →  preview + panel  →  PUT borrador  →  POST publicar
```

---

## Cómo se usa el panel

Entrada: `/admin/login` → `/admin`.

| Ruta | Qué es |
|------|--------|
| `/admin` | Inicio del panel |
| `/admin/paginas` | Lista de páginas + apariencia del sitio |
| `/admin/paginas/:slug` | **Editor visual** (preview + panel) |
| `/admin/mensajes` | Contacto y reclamaciones recibidos |
| `/admin/archivos` | Biblioteca de imágenes |

Roles:

- **Administrador:** puede publicar, borrar imágenes y restaurar revisiones.
- **Editor:** puede editar y guardar borrador; no ve **Publicar** ni borra media.

### Editor de una página (`/admin/paginas/inicio`, etc.)

1. **Ver / Editar** — En Ver la preview se ve limpia. En Editar, un clic en un texto o foto abre esa parte en el panel.
2. Estado siempre visible: **Guardado** / **Guardando…** / **Cambios sin publicar**.
3. Los cambios se guardan solos en el **borrador** (unos 2 s). **Guardar** es secundario.
4. **Publicar** (solo admin) pide confirmación: “esto lo verá todo el mundo”.
5. Vista previa: enlace temporal (~2 h) para ver el borrador como la web real, con `?preview=…`.
6. Deshacer / Rehacer en la barra. Quitar un ítem de lista o una imagen: aviso **Eliminado — Deshacer** (5 s).
7. Un solo aviso a la vez (error > conflicto > deshacer > estado). Si publicar falla, el error es clicable y lleva al hueco.
8. **Tour de primera visita** (4 pasos) al abrir un editor. Se puede saltar; **Cómo funciona** lo vuelve a abrir.

Páginas con schema explícito (labels y orden del panel): **Inicio** y **Apariencia del sitio**. El resto del sitio se edita igual, con nombres inferidos del JSON.

En Inicio se puede reordenar u ocultar secciones (Banner, Quiénes somos, tarjetas, servicios, innovadores, opiniones), pero no inventar tipos nuevos ni dejar la home sin ninguna sección visible.

---

## Diseño del panel

El panel es una herramienta (modo Operate). La web pública no comparte su tipografía ni su paleta.

Tokens en `frontend/src/app/admin/admin-theme.scss`, solo bajo `.admin-root` y `.login-host`:

| Token | Uso |
|-------|-----|
| `--admin-font` | Stack del sistema (`ui-sans-serif`, Segoe UI, Roboto). No Poppins. |
| `--admin-ink` `#14181f` | Texto, menú, acción primaria (Entrar / Publicar) |
| `--admin-paper` `#f3f1ee` | Fondo |
| `--admin-mark` `#ff6600` | Marcador de selección (ítem activo, campo enfocado en el inspector) |
| `--admin-mark-ink` `#7a3200` | Texto sobre tinte naranja |
| Radios | `6px` controles, `10px` paneles |

La preview de una página fija `--admin-public-font` (Poppins) en `.preview-frame` para no heredar la fuente del panel.

Iconos solo cuando sustituyen texto (deshacer, dispositivos, arrastrar, borrar). El menú y las listas de páginas van sin iconos.

---

## Frontend (Angular)

Carpeta: `frontend/src/app/admin/` (pantallas) y `frontend/src/app/cms/` (motor).

El admin se carga **lazy** (`app.routes.ts`). Quill (textos legales) y el arrastre de listas (CDK) van en el chunk del editor, no en la home.

### Pantallas del admin

| Archivo | Función |
|---------|---------|
| `login.ts` | Inicio de sesión |
| `admin-shell.ts` | Menú lateral: Páginas, Mensajes, Imágenes |
| `admin-pages.ts` | Listado |
| `page-editor.ts` / `.html` | Preview (escritorio / tablet / celular) + inspector |
| `admin-tour.ts` | Tour de 4 pasos en la primera visita al editor |
| `cms-inspector.ts` | Panel automático a partir del schema o del JSON |
| `cms-field-row.ts` | Envoltorio repetido del inspector (label, ayuda `?`, aviso de largo) |
| `cms-image-field.ts` | Subir / elegir / quitar foto, alt, “es decorativa” |
| `cms-rich-field.ts` | Texto con formato (privacidad / términos) |
| `admin-messages.ts` | Bandeja |
| `admin-media.ts` | Archivos |

### Motor CMS (`frontend/src/app/cms/`)

| Pieza | Función |
|-------|---------|
| `auth.service.ts` + `auth.guard.ts` | Sesión y rutas `/admin` |
| `credentials.interceptor.ts` | Cookie + cabecera `X-CSRF-Token` |
| `cms-content.service.ts` | Estado (signals), autosave, guards editoriales, toasts |
| `cms-api.service.ts` | HTTP: páginas, sitio, media, mensajes, preview |
| `cms-history.service.ts` | Pilas deshacer / rehacer (`FieldPatch`) |
| `cms-editor.service.ts` | Modo Ver/Editar y tamaño de preview |
| `cms-selection.service.ts` | Clic en la página ↔ scroll en el panel |
| `cms-schema.ts` | Schema de `inicio` y `sitio`, migraciones `schemaVersion`, labels |
| `cms-fields.ts` | Inferencia y etiquetas solo para páginas **sin** schema |
| `cms-editable-host.ts` | Base de las directivas editables (registro, hover, clic) |
| `cms-seo.service.ts` | `<title>`, Open Graph, JSON-LD (no corre en modo edición) |
| `cms-text` / `cms-image` / `cms-rich` / `cms-list` | Anclas en las plantillas públicas (las mismas que el preview) |

Las páginas (`home`, `contacto`, etc.) se pintan igual en la web y dentro del preview (`NgComponentOutlet`). No hay un HTML distinto “de admin”.

### Edición de contenido (qué puede hacer alguien no técnico)

- Cambiar titulares y textos en el panel (no se escribe JSON).
- Listas: tarjetas con miniatura/título, flechas, **arrastre** (solo en el panel), **duplicar**.
- Fotos: subir, elegir de la biblioteca, o **soltar el archivo encima de la foto** en la preview.
- Texto de la imagen obligatorio, o marcar **es decorativa**.
- Aviso si la foto es más chica de ~800 px de ancho.
- Rich text: negrita, cursiva, enlace, listas y un subtítulo. Pegar desde Word no trae colores ni fuentes.

---

## Backend (PHP + MariaDB)

### Archivos PHP

`index.php` enruta. `pages.php` solo despacha HTTP (`cms_write_guard`: sesión + CSRF + rate limit; publicar exige rol `admin`). Leer/guardar/publicar/restaurar está en `cms-doc.php` (página y `sitio` son el mismo documento con distinta tabla). Validación y `schemaVersion` viven en `cms-schema.php`.

En Docker: `php -S` + `router.php`. En cPanel el DocumentRoot no debe ejecutar PHP dentro de `uploads/`.

Contrato de tests (deben seguir pasando tras cambios internos): `frontend` → `npm run test:cms`; API → `php tests/verify-cms.php`.

### Tablas

| Tabla | Uso |
|-------|-----|
| `users` | Usuario, hash, rol `admin` / `editor` |
| `pages` | `content` publicado, `draft`, `version` |
| `site_settings` | Igual, una sola fila (apariencia: logo, menú, WhatsApp, pie…) |
| `media` | Imágenes, ancho/alto, variantes 480 y 960 |
| `messages` | Formularios de contacto y libro de reclamaciones |
| `revisions` | Snapshot inmutable cada vez que se publica |
| `preview_tokens` | Enlaces de vista previa con caducidad |

El JSON se migra al leer y al guardar (`schemaVersion` 1 = objeto `seo`, 2 = `sections` en Inicio, 3 = `decorativeImagePaths`). No hace falta editar la base a mano.

### API (prefijo `/api`)

| Método | Ruta | Quién | Qué hace |
|--------|------|--------|----------|
| POST | `/auth/login` | público (límite de intentos) | Sesión cookie `matt_admin` + CSRF |
| POST | `/auth/logout` | sesión | Cierra sesión |
| GET | `/auth/me` | opcional | Si hay sesión: usuario, rol, token CSRF |
| GET | `/pages`, `/pages/{slug}`, `/site` | **público** | Publicado. Borrador solo con sesión admin o `?preview=` |
| PUT | `/pages/{slug}`, `/site` | admin + CSRF | Guarda **borrador**; exige `version`; **409** si otro guardó antes |
| POST | `/pages/{slug}/publish`, `/site/publish` | **solo admin** + CSRF | Copia borrador → publicado, sube `version` (también 409) |
| GET | `/pages/{slug}/revisions` | admin | Historial |
| POST | `…/revisions/{id}/restore` | admin + CSRF | Restaura al **borrador** (con `version`) |
| POST | `/pages/{slug}/preview-token` | admin + CSRF | Token ~2 h |
| GET/POST/DELETE | `/media` | admin; DELETE solo rol admin | Subida re-encodificada (WebP/JPEG, máx. 1920 px) |
| GET | `/messages` | admin | Bandeja |
| POST | `/contacto`, `/reclamaciones` | público + rate limit | Formularios (no son los scripts viejos `.php`) |
| GET | `/sitemap.xml` | público | Sitemap |

Errores típicos: **401** sin sesión, **403** CSRF o rol insuficiente, **409** conflicto de versión, **429** demasiados intentos, **400** con `{ field, message }` en español.

### Seguridad que ya está

- Escritura con sesión y `X-CSRF-Token`.
- HTML rico limpio en servidor (`sanitize.php`): negrita, cursiva, listas, enlaces, `h2`. Un `h1` pegado se convierte en párrafo.
- Imágenes: tipo real (`getimagesize`), nombre aleatorio, PHP apagado en `uploads/.htaccess`. Tope de píxeles **antes** de GD (lado ≤ 8000).
- Rate limit en login, formularios, PUT CMS y subidas.
- `contacto.php` / `reclamaciones.php` legacy **no se usan** (410 + `.htaccess`). El correo va por `messages.php` + `mailer.php`.
- Barreras al guardar/publicar Inicio: al menos una sección visible, al menos un banner / opiniones / tarjetas; foto con alt o marcada decorativa.

---

## Archivos clave (mapa rápido)

**API:** `index.php`, `auth.php`, `pages.php` (rutas), `cms-doc.php` (documento), `cms-schema.php`, `media.php`, `messages.php`, `security.php`, `sanitize.php`, `migrate.php`, `schema.sql`.

**Admin:** `frontend/src/app/admin/page-editor.*`, `cms-inspector.*`, `cms-field-row.*`, `admin-shell.*`.

**Motor:** `frontend/src/app/cms/cms-content.service.ts`, `cms-api.service.ts`, `cms-history.service.ts`, `cms-schema.ts`, `cms-selection.service.ts`, `cms-editable-host.ts`.

---

## Qué no está (a propósito)

Ver `docs/pendientes.md`. Lo principal:

- No se editan URLs/slugs ni hay redirecciones 301.
- No hay constructor libre de páginas ni multiidioma.
- No hay pantalla para crear usuarios (el rol `editor` sí existe en PHP).
- Schema explícito solo en Inicio y Sitio; el resto se infiere.
- Recorte de fotos con proporción del hueco: no se hizo.
- Rotar la contraseña SMTP que llegó a estar en scripts viejos (historial de git).

Auditorías previas: `docs/auditoria-tecnica.md`, `docs/auditoria-ux.md`. Plan de fases: `docs/plan.md`.
