# Plan CMS Matt Innova (post Fase 0)

Fecha: 2026-09-15. **Fases 0–8 cerradas** (ejecución continua 1–8). Fuente de verdad del estado actual: `docs/auditoria-tecnica.md` y `docs/auditoria-ux.md`.

Objetivo de las fases 1–8: las tres condiciones de terminado.

1. Una persona no técnica edita y publica sola.
2. No puede romper el diseño ni dejar la web vacía.
3. Tú cambias estructura desde schema/migraciones, no editando JSON a mano en producción.

**No se reabre** CSRF, sanitize, draft/publish, schema `inicio`/`sitio`, sync vista↔panel, lazy Quill, roles PHP, sitemap/JSON-LD ni secciones tipadas de Inicio. Eso ya existe. Rehacerlo es ruido.

Ninguna fase 2–7 cambia la forma del JSON (no renames, no nuevas claves de contrato). Fase 6 puede exigir `*Alt` **ya presentes**. Fase 8 solo añade validación. Migraciones `schemaVersion` 1 y 2 ya corren.

```
Hecho A–E / L / parte M
        ↓
Fase 1  hardening residual (sin UX)
        ↓
Fases 2–4  UX núcleo (Ver/Editar, panel humano, cambios y errores)
        ↓
Fase 5 listas   Fase 6 imágenes   Fase 7 rich
        ↓
Fase 8  barreras editoriales
```

---

## Protocolo: «ejecuta la fase N»

Una fase = una sesión = una rama. No mezclar la siguiente. Completar 1–8 en un solo turno rompe la regla.

1. Rama `cms/fase-N-<slug-corto>` desde el HEAD acordado (no trabajar Fase N+1 en la misma rama).
2. **Antes de tocar producto:** crear `docs/refactors/fase-N.md` con la sección **ANTES**: qué archivos intervienen, cómo funciona hoy ese flujo, y qué problema concreto (técnico o de UX) tiene.
3. Implementar **solo** esa fase. Prohibido: restyles, renames, “ya que estoy”, otras páginas, otras fases. Lo que quede fuera va a `docs/pendientes.md`.
4. Añadir **DESPUÉS**: qué cambió archivo por archivo, qué patrón se introdujo y por qué, qué alternativas se descartaron, y qué quedó pendiente.
5. Añadir **CÓMO PROBARLO**: pasos numerados del criterio de aceptación de la fase, más estas comprobaciones de no-regresión en **todas** las fases:
   - **(a)** La vista pública carga correctamente **sin** sesión de admin. `/` y una página interior leen el JSON publicado.
   - **(b)** Una página con contenido **antiguo** de la base de datos renderiza completa, sin campos perdidos. Si hace falta dato nuevo: migración `schemaVersion`, nunca editar la BD a mano.
   - **(c)** Guardar desde el admin **no pierde** ningún dato existente.
   - **(d)** Un visitante anónimo no descarga código del modo edición: Quill/CDK no van en el chunk de home; no hay `contentEditable` en público.
6. Resumen del diff en el chat: archivos creados, modificados y borrados, **una línea por archivo**.
7. Marcar la fase como hecha en este `docs/plan.md` (fecha + rama) y anotar cualquier ajuste al resto del plan. No borrar el alcance original.
8. UI en español. Cero paths, “campo”, JSON o jerga en copy visible. Authz y validación en PHP; el cliente no es la frontera.
9. Local: `ng serve` en `http://127.0.0.1:4200`, API Docker `:8000`, MariaDB `:3307`. No asumir cPanel salvo que se pida.
10. No commit salvo que Luis lo pida. No push a `main`.

Plantilla mínima de `docs/refactors/fase-N.md`:

```
# Fase N — <título>

## ANTES
## DESPUÉS
## CÓMO PROBARLO
## Anti-humo a/b/c/d
```

---

## Fase 1 — Hardening residual (sin UX)

Estado: **hecha** (2026-09-15, misma sesión de ejecución continua).

**Alcance**

- Invalidar o aislar `API/contacto.php` y `API/reclamaciones.php` para que Apache/cPanel no los ejecute. El correo público ya pasa por `messages.php` + `mailer.php`. Secretos fuera del repo (rotar la contraseña SMTP que hoy está en claro).
- `publish_document` y `restore_revision`: `UPDATE … WHERE version = ?`; si `rowCount === 0` → 409 (mismo copy que el PUT). El cliente de publish debe enviar `version`.
- Tope de píxeles **antes** de `imagecreatefrom*` en `compress_image` (p. ej. lado mayor > 8000 o `width*height` absurdo → 400).
- Rate limit suave en PUT de páginas/sitio y POST `/media` (reusar `rate_limit()` de `security.php`).

**Archivos**

- `API/contacto.php`, `API/reclamaciones.php` (y `.htaccess` de `API/` si hace falta negar esos scripts)
- `API/pages.php` (`publish_document` ~262–297, `restore_revision` ~311–332)
- `API/media.php` (`compress_image` ~107–124)
- `API/index.php` o los handlers PUT/POST
- `frontend/src/app/cms/cms-content.service.ts` / `page-editor.ts` solo si publish debe mandar `version`

**Dependencias:** ninguna de UX. CSRF y 409 de PUT ya existen.

**Aceptación manual**

1. Pedir `API/contacto.php` o `reclamaciones.php` por HTTP → no ejecuta (404/403/stub sin SMTP).
2. Dos publish con la misma `version` → el segundo 409.
3. JPEG dentro de 10 MB pero con dimensiones enormes → 400, sin fatal de memoria.
4. PUT/media por encima del cupo → 429.

**Regresión:** no tocar copy del inspector ni el flujo Ver/Editar (aún no existe). Formularios `/api/contacto` y `/api/reclamaciones` **enrutados** deben seguir iguales.

---

## Fase 2 — Modo Ver / Editar + cromo de estado (F núcleo)

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- Toggle evidente **Ver** / **Editar** en la barra de `page-editor`. En Ver: preview sin outlines/placeholders de hueco vacío; el panel puede quedarse o plegarse, pero no se edita al clic.
- Indicador **permanente** (no solo banners que aparecen y desaparecen): Guardado / Guardando… / Cambios sin publicar.
- Un solo CTA primario **Publicar** (rol admin) con confirmación en español (“Esto lo verá todo el mundo”). Guardar borrador secundario; el autosave de 2 s se mantiene.
- Quitar la palabra “campo” de la barra (`page-editor.html:9`).

**Archivos**

- `frontend/src/app/admin/page-editor.html`, `page-editor.ts`, `page-editor.scss`
- `frontend/src/app/cms/cms-editor.service.ts` (ya tiene `editMode`; falta el toggle de usuario)
- Directivas solo si el outline debe respetar Ver (`cms-text`, `cms-image`, `styles.scss`)

**Dependencias:** draft/publish y `editMode` ya existen. No hace falta schema nuevo.

**Aceptación manual**

1. Alguien nuevo entiende Ver vs Editar en menos de 10 s (el control se lee sin tooltip).
2. En Ver, clic en el H1 de Inicio no pinta outlines de edición.
3. El estado (Guardado / Guardando / sin publicar) se ve siempre, también con el panel abajo del fold.
4. Publicar pide confirmación; Guardar borrador no compite visualmente.

**Regresión:** autosave, 409+Recargar, preview token, rol editor (sin Publicar). Público sin sesión intacto.

---

## Fase 3 — Panel por secciones visuales + copy humano (F + C ligero)

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- Inspector de **Inicio** ordenado como el scroll: primero lo que manda `sections` (hero, about, …), no el array plano `INICIO_SCHEMA` (hoy empiezan “Orden de secciones” y luego banners fijos).
- Sitio: orden más cercano a splash → cabecera → aviso → pie. SEO al final.
- Labels y descripciones en español. Cero paths visibles. Quitar “campo” / “campos” del inspector (`cms-inspector.html:3`, `:16`).
- Ayuda `?` desplegable; retirar los párrafos fijos de relleno.
- Extender schema **solo** para labels que hoy salen mal (`destinationEmail`, `disclaimer1`, etc.) si se tocan esas pantallas. **Sin** migrar JSON de otras páginas. **Sin** schema completo de servicios/acerca.

**Archivos**

- `frontend/src/app/admin/cms-inspector.html`, `cms-inspector.ts`, `cms-inspector.scss`
- `frontend/src/app/cms/cms-schema.ts` (orden/grupos/labels; no cambiar paths)
- `frontend/src/app/cms/cms-fields.ts` (`fieldLabel` / `FIELD_LABELS`)

**Dependencias:** `INICIO_SCHEMA` / `SITE_SCHEMA` ya existen. `sections` ya pintan la home.

**Aceptación manual**

1. Ningún path (`slides.0.title`, `seo.title`) visible en UI de Inicio/Sitio.
2. Recorrer el panel de Inicio ≈ bajar la home (hero → about → tarjetas → servicios → …).
3. Palabra “campo” no aparece en editor ni inspector.

**Regresión:** no cambiar keys JSON. `describeObject` sigue para páginas sin schema. Buscador del panel sigue funcionando.

---

## Fase 4 — “Ver cambios sin publicar” + errores clicables (F + J + E)

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- Lista en español desde `dirtyFields` / parches de undo: “Cambiaste el titular de la portada”, no `slides.0.title`.
- Si publicar o validar falla: lista clicable → `cms-selection` selecciona y hace scroll al hueco (preview y panel).
- Contador suave cerca de `maxLength` del schema (SEO 70/160, titulares), no bloqueo agresivo en cada tecla.

**Archivos**

- `frontend/src/app/admin/page-editor.html`, `page-editor.ts`
- `frontend/src/app/cms/cms-content.service.ts` (`dirtyFields`, parches)
- `frontend/src/app/cms/cms-selection.service.ts` (reutilizar; no rehacer el mapa)
- `frontend/src/app/admin/cms-inspector.html` (contadores)
- PHP solo si publish debe devolver `{field, message}[]` en 400 (hoy gran parte de validación ya está en `cms-schema.php`)

**Dependencias:** schema de Inicio para labels; sync E ya existe.

**Aceptación manual**

1. Editar titular + una foto → la lista nombra esas dos cosas en español.
2. Forzar un error de publicar (p. ej. validación) → clic lleva al hueco, no a un toast genérico.
3. En Título SEO, se ve cuántos caracteres quedan.

**Regresión:** undo/redo y autosave. No filtrar `dirtyFields` al visitante (solo admin).

---

## Fase 5 — Listas usables (I)

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- Tarjeta de ítem: miniatura + título humano (nunca “Ítem N” si hay `client`/`title`/`label`).
- Manija de arrastre **solo** en el inspector admin (CDK no en chunks públicos).
- Flechas se quedan. Botón Duplicar.
- Quitar = soft-delete + toast “Eliminado — Deshacer” ~5 s. Sin modal salvo acción irreversible (no hay ninguna en listas de Inicio).
- No vaciar listas con mínimo 1 (testimonios, banners, tarjetas de contacto). Cliente + PHP. Puente a Fase 8.

**Archivos**

- `frontend/src/app/admin/cms-inspector.html`, `cms-inspector.ts`
- `frontend/src/app/cms/cms-fields.ts` (`itemTitle`)
- `frontend/src/app/cms/cms-content.service.ts` (undo toast / no vaciar)
- `API/cms-schema.php` (mínimo de ítems en `inicio`)
- CDK: importar solo en inspector/admin, no en `home.ts`

**Dependencias:** schema de listas de Inicio. `cmsList` en plantillas **no** es requisito (sigue sin usos).

**Aceptación manual**

1. Añadir y reordenar un testimonio sin dudar (manija o flechas).
2. Quitar uno → toast 5 s restaura. Recargar después de 5 s: el ítem no vuelve.
3. Intentar dejar 0 testimonios → se bloquea con mensaje humano; el PUT también rechaza.

**Regresión:** páginas sin schema no se rompen (Añadir sigue clonando el primer ítem). Público sin CDK.

---

## Fase 6 — Imágenes para no técnicos (G)

Estado: **hecha** (2026-09-15, ejecución continua). Recorte con ratio aplazado a `docs/pendientes.md`. `decorativeImagePaths` + `schemaVersion` 3 (sin rename de `*Alt`).

**Alcance**

- Arrastrar un archivo **sobre el hueco** en el preview (además de Subir/Elegir del panel).
- Alt obligatorio **o** marca “es decorativa”. Sin una de las dos, no se publica (PHP + UI). Usar keys `*Alt` ya existentes; no renombrar.
- Aviso si la imagen es más chica que el hueco (usar `width`/`height` que ya guarda media).
- Recorte con el ratio del hueco **solo si cabe sin page-builder** (un crop simple en el campo de imagen). Si el recorte implica un editor nuevo, recortar alcance y anotarlo en `docs/pendientes.md`.
- No rehacer compresión/variantes: ya están en `media.php`.

**Archivos**

- `frontend/src/app/cms/cms-image.directive.ts`
- `frontend/src/app/admin/cms-image-field.ts`
- `frontend/src/app/cms/cms-schema.ts` / `API/cms-schema.php` (regla alt/decorativa)
- `API/media.php` solo lectura de dims; no cambiar pipeline salvo bug

**Dependencias:** Fase 1 (tope de píxeles). Overlay de imagen ya registra path.

**Aceptación manual**

1. En Editar, soltar un JPG sobre el banner de Inicio sustituye la foto.
2. Publicar con alt vacío y sin “decorativa” → error que lleva al hueco (Fase 4).
3. Una foto 200×200 en un hueco ancho muestra aviso; no bloquea si el usuario insiste (salvo alt).

**Regresión:** `editMode` false no acepta drop. Quitar imagen no deja el `src` anterior eterno. Variantes 480/960 siguen.

---

## Fase 7 — Rich text cerrado (H)

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- Toolbar: negrita, cursiva, enlace, lista. **Un** nivel de subtítulo (h2 **o** h3, no ambos). Quitar underline de la toolbar (el servidor aún puede aceptar `<u>` o alinearlo).
- Limpiar pegado Word en el cliente (matchers de Quill / clipboard).
- Alinear whitelist `API/sanitize.php` con esa toolbar. Rich **no** crea `h1` (cierre en Fase 8 si queda un resquicio).

**Archivos**

- `frontend/src/app/admin/cms-rich-field.ts`
- `frontend/src/app/cms/cms-rich.directive.ts` (toolbar idéntica si el overlay sigue montando Quill)
- `API/sanitize.php`

**Dependencias:** sanitize y lazy `import('quill')` ya existen.

**Aceptación manual**

1. Pegar un párrafo desde Word/Docs → sin color, fuente, márgenes ni `mso-`.
2. No hay botones de color, fuente ni alineación.
3. En público, privacidad/términos siguen leyendo el HTML guardado.

**Regresión:** chunk de home sin Quill. PUT sigue pasando por `sanitize_cms_tree`.

---

## Fase 8 — Barreras editoriales (K) — sin slugs

Estado: **hecha** (2026-09-15, ejecución continua).

**Alcance**

- No borrar la última sección tipada visible de Inicio. No dejar `sections` todas `hidden`.
- Listas requeridas: reforzar el mínimo de Fase 5 en publish, no solo en PUT draft.
- Encabezados de página solo del componente (el H1 de la plantilla). Rich no inserta `h1`; el servidor lo strippea.
- **No** edición de slug ni tabla de redirecciones (ver `docs/pendientes.md`).

**Archivos**

- `API/cms-schema.php`, `API/pages.php` (`publish_document`)
- `frontend/src/app/cms/cms-content.service.ts` / inspector de `sections`
- `API/sanitize.php` (quitar h1 si colara)

**Dependencias:** `normalize_inicio_sections` y tipos cerrados ya existen.

**Aceptación manual**

1. Ocultar todas las secciones de Inicio → se impide; queda al menos una visible.
2. No se puede dejar testimonios en 0.
3. En el rich de términos, no hay control H1; si se pega un h1, al guardar queda párrafo o h2.

**Regresión:** tipos de sección ilegales siguen 400. Rol editor sigue sin publicar.

---

## Fuera de este plan

Ver `docs/pendientes.md`. No implementar en las fases 1–8:

- Multiidioma, webhooks, page builder libre
- Edición de rutas/slugs y redirecciones 301
- Schema explícito de **todas** las páginas (salvo labels puntuales en Fase 3)
- Seed + UI de usuarios (`editor`)
- Invalidación de caché/CDN al publicar

---

## Orden (por qué así)

1. Hardening corto primero: secretos y 409 de publish son baratos y evitan sorpresas mientras se pulirá UX.
2. Ver/Editar y cromo (2) antes que el panel (3): si el preview siempre parece “modo edición”, el panel ordenado no se entiende.
3. Lista de cambios y errores (4) reusa labels (3) y el mapa de selección (ya hecho).
4. Listas / imágenes / rich (5–7) son verticales independientes entre sí; no mutan el modelo. Pueden serializarse en ese orden porque 8 las usa de guardrail.
5. Barreras (8) al final: si se ponen antes, pelean con listas que aún no tienen undo.

Criterio para revisar **solo el orden:** ninguna fase 2–7 exige migración de forma JSON. Fase 1 no toca el documento. Fase 6 no renombra `*Alt`.
