# Auditoría UX CMS Matt Innova

Fecha: 2026-09-15. Lectura de plantillas y servicios actuales. Persona de referencia: alguien que no sabe qué es JSON, un path ni un “campo”.

---

## 1. Estado del panel

**Cómo salen los nombres**

- `inicio` y `sitio`: labels del schema (`cms-schema.ts`), en español (“Título”, “Quiénes somos”).
- Resto de páginas: `FIELD_LABELS` + fallback que parte camelCase (`fieldLabel()` en `cms-fields.ts`). Casi siempre humano; keys raras (`destinationEmail`, `disclaimer1`) se leen como “Destination Email” / “Disclaimer1”.
- Revisiones: `Campos distintos: slides.0.title, …` (`page-editor.html:111`) — paths técnicos.
- Barra del editor: «Clic en la página para saltar al **campo** del panel» (`page-editor.html:9`) — palabra prohibida por las reglas de producto.

**Orden**

- Inspector de Inicio: orden del array `INICIO_SCHEMA` (Orden de secciones → Banners → botón → Quiénes somos → … → SEO). No se reordena cuando el editor mueve `sections` en la home.
- Sitio: logo y toggles primero, menú y pie después, SEO al final. No sigue el scroll real (splash → cabecera → aviso → pie).
- Otras páginas: orden de claves del JSON (seed), no el de la plantilla.
- Hay buscador en la raíz del inspector (`cms-inspector.html`).

**Copy permanente**

- Párrafos de ayuda fijos en el panel (“Cada caja es una parte…”). No hay icono `?` desplegable ni tour.

---

## 2. Recorridos críticos (clic a clic)

Supuesto: sesión admin, `/admin/paginas/inicio`. Autosave a 2 s. La web pública **no** cambia hasta Publicar.

### 2.1 Cambiar un titular

1. Abrir Páginas → Inicio.
2. Ver dos botones azules iguales: Guardar borrador y Publicar.
3. Clic en el H1 del banner: el panel hace scroll a “Título” del banner **activo**. No se edita sobre la letra (ya no hay `contentEditable`).
4. Escribir en el recuadro del panel.
5. Esperar el aviso «Hay cambios sin guardar. Se guardan solos a los 2 segundos» o pulsar Guardar borrador.
6. Dudaría: ¿ya se ve en la web? El banner de borrador lo dice, pero hay dos CTAs primarios y ningún estado fijo “Cambios sin publicar”.
7. Publicar no pide confirmación de qué va a salir.

**Bloqueos:** no hay modo Ver vs Editar; outlines siempre en el preview del admin. Titular vacío muestra “Añadir titular” (bien).

### 2.2 Añadir un ítem a una lista (p. ej. opinión)

1. Bajar el panel hasta “Opiniones” → “Opiniones” (lista `items`). El duplicado de nombre confunde.
2. Abrir un ítem: miniatura + título si hay `client`; si no, “Ítem N” (`itemTitle` en `cms-fields.ts`).
3. “Añadir” clona defaults del schema (inicio) o un clon vacío del primero.
4. Reordenar: flechas arriba/abajo. **No hay manija de arrastre** (CDK se quitó de las páginas).
5. Quitar: basura **inmediata**, sin “Eliminado — Deshacer” (el Deshacer de la barra sí puede recuperar si no se recargó).

**Bloqueos:** no hay “Duplicar”. Borrar el último testimonio no está prohibido. En páginas sin schema, el botón dice “Añadir” genérico.

### 2.3 Sustituir una imagen

1. Clic en la foto del preview: salta al panel (no abre el selector de archivo).
2. En el panel: Subir / Elegir / Quitar (`cms-image-field.ts`). En Imágenes del admin sí hay soltar archivo.
3. Subir: el servidor comprime y saca variantes; el usuario no elige formato.
4. No hay recorte, ni aviso de “muy pequeña”, ni alt obligatorio (el alt es otro recuadro opcional).

**Bloqueos:** quien espera “soltar la foto encima del banner” no encuentra el gesto. Quitar deja `src` viejo en el `<img>` hasta el siguiente valor.

### 2.4 Guardar y ver publicado

1. Autosave → borrador. Pública sigue igual.
2. Vista previa: pide token y abre `/?preview=…` (2 h). Copy poco explícita de caducidad.
3. Publicar (solo rol admin): POST sin diálogo “esto verá todo el mundo”.
4. Recargar `/` sin sesión para comprobar.

**Bloqueos:** editor no ve Publicar y no entiende por qué la web no cambia. Dos pestañas: 409 + Recargar (texto humano, bien). Cerrar pestaña con dirty: aviso del navegador (sin copy propia).

---

## 3. Inventario backlog A–M

| Punto | Estado | Dónde tocaría |
|-------|--------|----------------|
| **A** Authz escritura | **Existe** | `API/pages.php`, `media.php`, `helpers.php` |
| **A** CSRF + rate login/formularios | **Existe**; rate en PUT/media **falta** | `security.php`, interceptor |
| **A** Subida MIME/reencode/nombre/htaccess | **Existe**; tope de píxeles pre-GD **falta** | `media.php`, `uploads/.htaccess` |
| **A** Sanitize HTML servidor | **Existe** | `sanitize.php` |
| **A** Validación payload `{field,message}` | **A medias** (bools/números/tamaño/links conocidos) | `cms-schema.php` |
| **B** 409 + Recargar | **Existe** en PUT; publish **sin** 409 | `pages.php`, `page-editor.html` |
| **B** Undo parches + redo | **Existe** | `cms-content.service.ts` |
| **B** Autosave + beforeunload | **Existe** | mismo + `startEditingSession` |
| **C** Schema inicio/sitio + migraciones + test | **Existe** | `cms-schema.ts`, `cms-schema.php`, `cms-schema.spec.ts` |
| **C** Schema resto de páginas | **Falta** (fallback inferencia) | `cms-schema.ts` |
| **D** Draft/publish/revisiones/preview | **Existe** | `pages.php`, `page-editor.ts` |
| **E** Mapa path→elemento, hover, clic, focus, placeholder | **Existe** | `cms-selection.service.ts`, directivas, `styles.scss` |
| **F** Ver / Editar | **Falta** | `cms-editor.service.ts`, `page-editor` |
| **F** Panel como la página (secciones visuales) | **A medias** (schema plano + lista `sections`) | `cms-inspector`, schema |
| **F** Estado permanente Guardado/Guardando/sin publicar | **A medias** (banners sueltos) | `page-editor.html` |
| **F** Un Publicar protagonista + confirmación | **Falta** (dos primarios, sin confirm) | `page-editor.html` |
| **F** Lista humana de cambios | **Falta** (`dirtyFields` sin UI) | `cms-content.service.ts`, page-editor |
| **F** Tour 4 pasos | **Falta** | nuevo, page-editor |
| **F** Ayuda `?` no párrafos fijos | **Falta** | inspector |
| **F** Soft-delete toast | **Falta** | inspector, content service |
| **G** DnD en el hueco de la página | **Falta** (drop en admin/archivos) | `cms-image.directive.ts` |
| **G** Recorte con ratio | **Falta** | image-field |
| **G** Compresión/variantes/dims | **Existe** | `media.php` |
| **G** Aviso baja resolución | **Falta** | image-field |
| **G** Alt obligatorio / decorativa | **Falta** | schema + inspector + PHP |
| **H** Toolbar restringida | **A medias** (incluye underline y h2/h3) | `cms-rich-*.ts` |
| **H** Limpiar pegado Word | **Falta** en cliente (servidor sí recorta al guardar) | rich-field, sanitize |
| **I** Tarjeta con miniatura/título | **A medias** (hay thumb; “Ítem N” si vacío) | inspector, `itemTitle` |
| **I** Manija DnD + duplicar | **Falta** | inspector (CDK solo admin) |
| **I** Flechas | **Existe** | inspector |
| **J** Contadores suaves | **Falta** (`maxLength` no se pinta) | inspector |
| **J** Errores de publicar clicables | **Falta** | page-editor + selection |
| **J** Mensajes no genéricos | **A medias** (409 y CSRF en español; catch genérico en save) | page-editor.ts:149 |
| **K** No vaciar listas/secciones | **Falta** | content service + PHP |
| **K** Encabezados solo del componente | **A medias** (Quill permite h2/h3) | rich |
| **K** Slug + redirecciones | **Falta** (no hay UI de slug) | pendiente de producto |
| **K** Nada de HTML crudo | **Existe** en inspector (no textarea HTML) | — |
| **L** SEO por página | **Existe** (`seo` en JSON, no nombres metaTitle) | schema, `cms-seo.service.ts` |
| **L** Sitemap + JSON-LD | **Existe** | `pages.php`, seo service |
| **L** Invalidar caché al publicar | **Falta** | API / ops |
| **L** Chunk lazy edición | **Existe** | `app.routes.ts`, `import('quill')` |
| **M** Secciones tipadas Inicio | **Existe** | `home.html` `@switch`, PHP `normalize_inicio_sections` |
| **M** Roles editor/admin | **Existe** en PHP; UI mínima (ocultar Publicar/borrar media) | `security.php`, shell, page-editor |
| **M** select / color / embed en panel | **Existe** el control; color no usado en schema | inspector |
| **M** Buscador panel | **Existe** | inspector |
| **M** Multiidioma / webhooks | **Falta** | — |

---

## 4. Dependencias

**No se pueden hacer bien sin schema explícito**

- Panel ordenado como la página (F) para páginas que no son inicio/sitio.
- Contadores y validación “este titular es obligatorio” (J/K).
- Lista humana de cambios (hace falta label por path).
- Defaults al añadir ítem fuera de inicio/sitio.

Inicio/sitio **ya tienen** schema. El resto puede seguir con inferencia en las fases 2–4 si el trabajo se limita a Inicio (la home es el recorrido de aceptación).

**No se pueden hacer sin draft/publish** (ya existe)

- Indicador “cambios sin publicar”.
- Lista de cambios sin publicar vs publicado.
- Preview token.
- Publicar como único momento en que la web cambia.

**Infra que las fases UX reutilizan (no rehacer)**

- Mapa path→elemento (`cms-selection.service.ts`) para errores clicables, placeholders y resaltado.
- Parches de undo para la lista humana y el toast de deshacer.
