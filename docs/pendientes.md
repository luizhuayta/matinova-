# Pendientes (fuera del plan de fases 1–8 y del refactor R1–R5)

Aplazado a propósito. No mezclar con “ejecuta la fase N” ni con el refactor interno.

- **Rotar la contraseña SMTP** que estuvo en `API/contacto.php` / `API/reclamaciones.php` (ya no están en el árbol; sigue en el historial de git).

- **Edición de slug + redirecciones.** Hoy el slug es la clave de `pages` y no hay UI. Hace falta decisión de producto (quién puede cambiar una URL) y una tabla de 301. Sin eso, no se toca.
- **Page builder libre.** Fuera de alcance: el CMS es acoplado a plantillas Angular. Secciones tipadas de Inicio ya cubren el caso cerrado.
- **Multiidioma.** Ni schema ni rutas `/es`/`/en`.
- **Webhooks** al publicar (CMS, indexación, Slack, etc.).
- **Invalidación de caché** al publicar (`Cache-Control` de GET JSON, prerender Angular, CDN). Hoy no hay cabecera explícita en `json_out`.

## Schema y datos

- **Schema explícito de todas las páginas** (acerca-de, servicios/*, contacto, legales, libro). El plan 1–8 solo permite labels puntuales. Inferencia `describeObject` se queda hasta una fase futura con migraciones.
- **Seed de usuario `editor`** y **UI de usuarios** (crear/desactivar, cambiar rol). El rol PHP y ocultar Publicar ya existen; no hay pantalla ni usuario de ejemplo distinto de `admin`.

## UX que no entra en 1–8

- Recorte de imagen tipo page-builder (Fase 6 lo aplazó: el recorte con ratio del hueco no cabe sin un editor nuevo).
- Overlay de edición en WhatsApp / hrefs (`academyUrl`, redes) — no son texto de página.
- Usar `cmsList` en plantillas públicas (hoy la directiva solo registra el nodo; reordenar es cosa del inspector).

## Tras el refactor interno (R1–R5)

No se hizo a propósito (el refactor era puro: mismas rutas, mismo panel, diseño público intacto):

- Unificar el mapa de rutas PHP (`create_preview_token` / sitemap) con `SLUG_PATHS` del frontend.
- Quitar reglas `.box.field` que quedaron en `cms-inspector.scss` (el control ya vive en `cms-field-row`).
- Tests e2e / comparación visual automática del panel.
- Cambiar quién puede restaurar revisiones (hoy basta con sesión; publicar sigue exigiendo rol `admin`).
