# Auditoría CMS Matt Innova

> **Desfasada.** Describe el código **antes** de S0–S6e (sin CSRF, sin sanitize, sin draft). Estado actual: `docs/auditoria-tecnica.md` y `docs/auditoria-ux.md`. Plan: `docs/plan.md`.

Fecha: 2026-09-15. Solo lectura del código y del seed. No se proponen soluciones en este documento.

Fuente de verdad del JSON: `API/seed.php` (`site_seed`, `pages_seed`). El inspector infiere tipos con `describeObject()` en `frontend/src/app/cms/cms-fields.ts`. No hay schema tipado ni `schemaVersion`.

Leyenda: **V** = directiva en plantilla pública (`cmsText` / `cmsImage` / `cmsRich` / `cmsList`). **I** = aparece en el inspector porque está en el JSON. Desajuste si V≠I o si la vista no usa el valor.

---

## 1. Inventario de campos

### 1.1 `sitio` (`site_settings.content`)

| path | tipo JSON | V | I | notas |
|------|-----------|---|---|--------|
| logo | string (imagen) | cmsImage | sí | header, footer, splash |
| logoAlt | string | no (solo `[alt]`) | sí | |
| showSplash | bool | no (app.ts) | sí | |
| splashSeconds | number | no (app.ts) | sí | |
| founderName | string | cmsText | sí | |
| founderRole | string | cmsText | sí | |
| founderImage | string | cmsImage | sí | |
| splashTagline | string | cmsText | sí | |
| showCtaBanner | bool | no (app.ts) | sí | |
| ctaText | string | cmsText | sí | |
| ctaEmail | string | cmsText | sí | |
| ctaButton | string | cmsText | sí | |
| showWhatsapp | bool | no (app.ts) | sí | |
| whatsappNumber | string | no (whatsapp.ts) | sí | |
| whatsappMessage | string | no | sí | |
| whatsappTooltip | string | no | sí | |
| showChatbot | bool | no (app.ts) | sí | |
| cookieText / cookieAccept / cookieReject | string | cmsText | sí | |
| showClientsToggle | bool | no (header.ts) | sí | |
| clientsLabel | string | cmsText | sí | |
| animateCarousels | bool | no (home.ts) | sí | |
| nav.* | string | cmsText | sí | academyUrl no es cmsText; es `[href]` |
| navServices[].label | string | cmsText | sí | |
| navServices[].path | string | no (`[routerLink]`) | sí | |
| footer.* textos | string | cmsText | sí | youtube/facebook/linkedin/instagram: `[href]` sin cmsText |
| footer.libroImage | string | cmsImage | sí | |

**Desajustes sitio:** WhatsApp, toggles y URLs de redes se editan en panel pero no tienen overlay en la vista. `navServices.path` y `heroCtaLink` (inicio) están en JSON/inspector y la plantilla de home ignora el enlace (`routerLink` fijo a soluciones-ti).

### 1.2 `inicio`

| path | tipo | V | I |
|------|------|---|---|
| slides[].badge/title | string | cmsText | sí |
| slides[].image | string | cmsImage (solo editMode) | sí |
| heroCta | string | cmsText | sí |
| heroCtaLink | string | **no** (routerLink fijo) | sí |
| about.* | string/imagen | cmsText/cmsImage | sí |
| contactCards[] | list | cmsList + cmsText | sí |
| services.tag/title | string | cmsText | sí |
| services.cards[] | list | cmsList + cmsText/cmsImage | sí |
| services.cards[].alt | string | no (solo `[alt]`) | sí |
| innovative.* | | cmsText/cmsList | sí |
| testimonials.* | | cmsText/cmsList | sí |

**Desajuste:** `heroCtaLink` en inspector, no en vista.

### 1.3 `acerca-de`

Hero, stats (`cmsList`), about*, features (strings, **sin cmsList**), team (`cmsList`), contactCards (**sin cmsList**; sí cmsText por índice si existiera — las tarjetas de contacto en acerca **no** tienen cmsText en el HTML revisado: son datos pintados aparte), videos (`cmsList`). `videos[].embed` está en inspector, la vista usa el embed en iframe, no cmsText.

**Desajuste:** `features` y `contactCards` de acerca no tienen `cmsList` (no se reordenan en preview).

### 1.4 `servicios` y páginas de servicio

Servicios: hero + cards (`cmsList`) + CTA. `cards[].path` en JSON/inspector; la tarjeta puede usar routerLink. Páginas software/hardware/saas/consultoria/soluciones-ti: heroImage, image, label, title, text, cta, reasons (`cmsList`). `heroAlt`/`imageAlt` en inspector, no cmsText.

### 1.5 `contacto`

badge, title: cmsText. `cards` **sin cmsList**. `submitLabel`, `fields`, `placeholders`, `destinationEmail`: **solo inspector** (el formulario Angular no está cableado a todos esos keys).

### 1.6 `privacidad` / `terminos`

title, lastUpdated: cmsText. `body`: **cmsRich**. Inspector: rich.

### 1.7 `libro-reclamaciones`

title, company, ruc, subtitle, disclaimer1/2, logo: cms*. `destinationEmail`, `submitLabel`: inspector. Labels `company`/`disclaimer*` no están en `FIELD_LABELS` (fallback).

### 1.8 Desajustes (mínimo exigido)

1. `inicio.heroCtaLink` — I sí, V no.
2. `sitio.whatsapp*` — I sí, overlay V no.
3. `sitio.footer.{youtube,facebook,linkedin,instagram}` — I sí, no cmsText.
4. `acerca-de.features` — I sí, sin cmsList.
5. `contacto.cards` — I sí, sin cmsList.
6. `contacto.destinationEmail` / `fields` / `placeholders` — I sí, formulario no usa todos.
7. `services.cards[].alt` / `heroAlt` — I sí, no editables en overlay de texto.
8. Directivas CMS viajan en el bundle **público** (Quill en legales; CDK drag en home).

---

## 2. Endpoints PHP

Prefijo `/api` normalizado en `route_path()` / `router.php`. Entrada: `API/index.php`.

| Método | Ruta | Auth | Payload |
|--------|------|------|---------|
| OPTIONS | * | no | 204 |
| POST | /auth/login | no | username/password no vacíos |
| POST | /auth/logout | sesión (no exige admin_id de forma estricta: vacía sesión) | — |
| GET | /auth/me | lee sesión | — |
| GET | /site | **público** | — |
| PUT | /site | `require_admin()` | `content` array |
| GET | /pages | **público** | lista + sitio sintético (`updated_at: null`) |
| GET | /pages/{slug} | **público** | slug `[a-z0-9-]+` |
| PUT | /pages/{slug} | `require_admin()` | `content` array |
| GET | /media | admin | — |
| POST | /media | admin | multipart `file` |
| DELETE | /media/{id} | admin | id numérico |
| GET | /messages | admin | solo GET |
| POST | /contacto | **público** | name o email |
| POST | /reclamaciones | **público** | email + fullname; **guarda `$input` entero** |
| POST | /bot | **público** | mensaje |

Sin CSRF. Sin rate limit. GET de site/pages expone `destinationEmail`, WhatsApp, etc.

---

## 3. Subida de imágenes

`handle_media` POST → `compress_image()` (`API/media.php`).

- Auth: `require_admin()`.
- Tamaño: 10 MB. Tipos: JPEG/PNG/WEBP/GIF vía `getimagesize` (no se confía en `$_FILES['type']`).
- Re-encode a WebP (o JPEG), máx. 1920 px, nombre `bin2hex(random_bytes(8))` + extensión nueva.
- Disco: `API/uploads/{stored}`. URL: `/api/uploads/{stored}`.
- Con `php -S` + `router.php`: `/uploads/...` se sirve con `readfile`, **no se ejecuta PHP**.
- **cPanel / Apache:** la carpeta `uploads/` solo tiene `.gitkeep`. No hay `.htaccess` que apague el motor PHP. Si el DocumentRoot o un alias apunta a `API/` o `uploads/`, un `.php` colado (si en el futuro se relajara la validación, o un archivo residual) **podría ejecutarse**. Hoy el re-encode reduce ese riesgo; la defensa no está en Apache.

---

## 4. HTML rich (sanitización)

- **Servidor:** no hay. PUT de `pages`/`site` persiste el JSON tal cual. `htmlspecialchars` solo en correos de contacto/reclamaciones.
- **Cliente:** Quill en `cms-rich.directive.ts` y `cms-rich-field.ts`. El público pinta `innerHTML` / `dangerouslyPasteHTML`. No hay DOMPurify ni whitelist.

---

## 5. Riesgos (gravedad)

1. **Alto — XSS almacenado:** HTML CMS sin filtro; `innerHTML` en privacidad/términos.
2. **Alto — cPanel uploads:** sin `.htaccess` anti-PHP; `router.php` no existirá en Apache.
3. **Alto — filtrado de secretos de negocio:** GET público de site/pages incluye correos destino y WhatsApp.
4. **Alto — credenciales por defecto** en seed/docker (`admin` / `admin123`).
5. **Medio — cookie `secure: false`** (`helpers.php`), insegura en HTTPS cPanel si se deja así.
6. **Medio — sin CSRF token** en escrituras (mitigado en parte por SameSite=Lax).
7. **Medio — sin rate limit** en login, contacto, reclamaciones, bot.
8. **Medio — 500 con `detail` => exception message** (`index.php`).
9. **Medio — last-write-wins:** sin `version`; undo por snapshots; sin autosave.
10. **Bajo — reclamaciones guardan el JSON crudo** del cliente.
11. **Bajo — bundle público** descarga Quill y CDK.

No hay `docs/` de hardening, tests de API ni tabla de revisiones/roles.
