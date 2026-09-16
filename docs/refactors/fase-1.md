# Fase 1 — Hardening residual

## ANTES

Archivos: `API/contacto.php`, `API/reclamaciones.php`, `API/pages.php` (`publish_document`, `restore_revision`), `API/media.php` (`compress_image`), `API/index.php` / handlers PUT, `frontend/src/app/cms/cms-content.service.ts` (publish sin `version`).

Hoy (antes de esta fase):
- `contacto.php` / `reclamaciones.php` no están en el router de `index.php`, pero en cPanel Apache puede ejecutarlos y exponían SMTP en claro.
- PUT de draft ya hace `UPDATE … WHERE version = ?` y 409. Publish y restore incrementaban `version` **sin** ese WHERE.
- `compress_image` llamaba a `imagecreatefrom*` tras un tope de 10 MB; un JPEG de pocos MB con decenas de miles de píxeles podía agotar RAM.
- `rate_limit()` existía para login/formularios; PUT CMS y POST `/media` no tenían cupo.

## DESPUÉS

- `API/contacto.php` y `API/reclamaciones.php`: stubs 410 sin secretos. Los formularios públicos siguen en `messages.php` vía `POST /api/contacto` y `/api/reclamaciones`.
- `API/.htaccess`: niega esos dos archivos si Apache sirve el directorio.
- `publish_document` / `restore_revision`: exigen `version` en el JSON, `UPDATE … WHERE version = ?`, 409 si no coincide. El cliente envía la versión leída.
- `compress_image`: 400 si lado > 8000 o `width*height` > 40e6, **antes** de GD.
- `rate_limit('cms_write', 40, 60)` en PUT/publish/restore; `rate_limit('cms_media', 20, 60)` en POST `/media`.

Patrón: el mismo CAS del PUT de borrador, ahora también en publicar/restaurar.

Descartado: borrar los scripts del disco sin stub (cPanel devolvería 404 HTML). Rotar SMTP en el proveedor (fuera de código; anotado en `docs/pendientes.md`).

Pendiente: la contraseña vieja sigue en el historial de git.

## CÓMO PROBARLO

1. `curl -sS http://127.0.0.1:8000/contacto.php` → 410 JSON o 403 Apache. Sin SMTP.
2. Login admin. Publicar Inicio con `version` correcta → 200. Repetir el mismo POST con la versión anterior → 409.
3. POST `/api/media` con un JPEG de cabecera enorme (>8000 px) y peso < 10 MB → 400, mensaje de tamaño.
4. Más de 40 PUT/min o 20 subidas/min → 429.

## Anti-humo a/b/c/d

- **(a)** GET `/api/pages/inicio` sin cookie sigue siendo el publicado. `POST /api/contacto` (ruta enrutada) no se tocó.
- **(b)** No hay migración JSON. Documentos viejos igual.
- **(c)** PUT draft no cambió el documento; solo publish/restore ahora piden versión.
- **(d)** Sin cambios de chunks Angular de edición.
