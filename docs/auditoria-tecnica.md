# Auditoría técnica CMS Matt Innova

Fecha: 2026-09-15. Lectura del código actual (tras el trabajo S0–S6e). No propone soluciones.

Fuente JSON: `API/seed.php` más migraciones en `API/cms-schema.php` / `frontend/src/app/cms/cms-schema.ts` (`schemaVersion` 1 = objeto `seo`, 2 = `sections` en inicio). Inspector: schema explícito para `inicio` y `sitio`; resto `describeObject()` en `cms-fields.ts`.

Leyenda: **V** = directiva en plantilla (`cmsText` / `cmsImage` / `cmsRich`). **I** = aparece en el inspector (schema o inferencia). `cmsList` existe como directiva de registro pero **no se usa en ninguna plantilla**.

---

## 1. Inventario de campos

### 1.1 `sitio` (`site_settings.content`)

Schema: `SITE_SCHEMA` en `frontend/src/app/cms/cms-schema.ts`. Migración añade `seo` y `schemaVersion`.

| path | tipo JSON | V | I | notas |
|------|-----------|---|---|--------|
| logo | imagen | cmsImage | sí | header, footer, splash |
| logoAlt | string | no (`[alt]`) | sí | |
| showSplash, splashSeconds | bool / number | no (`app.ts`) | sí | |
| founderName / founderRole / founderImage / splashTagline | string/imagen | cmsText / cmsImage | sí | splash |
| showCtaBanner | bool | no (`app.ts`) | sí | |
| ctaText / ctaEmail / ctaButton | string | cmsText | sí | |
| showWhatsapp | bool | no (`app.ts`) | sí | |
| whatsappNumber / whatsappMessage / whatsappTooltip | string | no (WhatsApp lee el JSON) | sí | sin overlay |
| showChatbot | bool | no (`app.ts`) | sí | |
| cookieText / cookieAccept / cookieReject | string | cmsText | sí | |
| showClientsToggle | bool | no (`header.ts`) | sí | |
| clientsLabel | string | cmsText | sí | |
| animateCarousels | bool | no (`home.ts`) | sí | |
| nav.* textos | string | cmsText | sí | `academyUrl` es `[href]`, no cmsText |
| navServices[].label | string | cmsText | sí | |
| navServices[].path | string | no (`[routerLink]`) | sí | |
| footer textos | string | cmsText | sí | |
| footer.libroImage | imagen | cmsImage | sí | |
| footer.youtube/facebook/linkedin/instagram | string | no (`[href]` en footer si existen) | sí | |
| seo.title / description / image | string | no (CmsSeoService) | sí | |
| schemaVersion | number | no | no (filtrado) | |

### 1.2 `inicio`

Schema: `INICIO_SCHEMA`. Home pinta secciones según `sections` (`home.ts` `visibleSections`).

| path | tipo | V | I |
|------|------|---|---|
| sections[].type / hidden | select / bool | no (controla qué se pinta) | sí |
| slides[].badge / title | string | cmsText | sí |
| slides[].image | imagen | cmsImage solo en `editMode` | sí |
| heroCta | string | cmsText | sí |
| heroCtaLink | string | `[routerLink]`/`[href]` vía `heroCtaLink()` | sí |
| about.* | string/imagen | cmsText / cmsImage | sí |
| about.imageAlt | string | `[alt]` | sí |
| contactCards[] | list | cmsText por índice | sí |
| services.tag / title | string | cmsText | sí |
| services.cards[] | list | cmsText / cmsImage | sí |
| services.cards[].alt | string | `[alt]` | sí |
| innovative.* / items[] | | cmsText / cmsImage | sí |
| testimonials.* / items[] | | cmsText / cmsImage | sí |
| seo.* | | CmsSeoService | sí |

### 1.3 `acerca-de` (sin schema; inferencia)

Hero, stats, about*, features (strings con cmsText por índice, **sin lista arrastrable en vista**), team, contactCards, videos. `videos[].embed` en inspector; la vista mete el URL en iframe (`embed()`), no cmsText. `aboutImage` alt fijo en HTML: «Equipo MIS trabajando», no el JSON.

### 1.4 `servicios` y páginas de servicio

Servicios: hero + cards + CTA. `cards[].path` alimenta `[routerLink]`. Software/hardware/saas/consultoría/soluciones-ti: heroImage, image, label, title, text, cta, reasons. `heroAlt` / `imageAlt` en inspector y `[alt]`, no overlay de texto.

### 1.5 `contacto`

badge, title, cards[].title/text: cmsText. `submitLabel`, `fields`, `placeholders`, `destinationEmail`: **solo inspector** (el formulario sí usa `show()`, placeholders y submitLabel; destinationEmail no se ve en la página).

### 1.6 `privacidad` / `terminos`

title, lastUpdated: cmsText. `body`: cmsRich. Inspector: rich. SEO por migración.

### 1.7 `libro-reclamaciones`

title, company, ruc, subtitle, disclaimer1/2, logo: cms*. `destinationEmail`, `submitLabel`: inspector. El formulario legal no es CMS.

### 1.8 Desajustes (ambos sentidos)

1. `sitio.whatsapp*` — I sí, sin overlay en vista.
2. `sitio.nav.academyUrl` y redes del pie — I sí, href sin cmsText.
3. `sitio` toggles (splash, CTA, chatbot, clientes, carrusel) — I sí, sin ancla visual.
4. `inicio.sections` — I sí, la vista no muestra cajas de “tipo/ocultar”; solo el resultado.
5. `inicio.slides[].image` — overlay solo con `editMode` (ok en admin; en público no hay ancla).
6. `acerca-de.features` / `contacto.cards` — editables por índice, sin reordenar en preview.
7. `contacto.destinationEmail` — I sí, V no.
8. Alts de imagen (`logoAlt`, `imageAlt`, `cards[].alt`) — I sí, no overlay de texto.
9. `seo.*` — I sí, no hay bloque SEO en la plantilla pública (sí en `<title>` / JSON-LD).
10. Vista con overlay pero panel más rico: clic en preview **ya no edita inline** (`cms-text` hace scroll al panel, no `contentEditable`).

---

## 2. Endpoints PHP

Prefijo `/api` recortado en `route_path()` (`API/helpers.php:35`). Entrada: `API/index.php`. Docker usa `php -S` + `API/router.php`.

| Método | Ruta | Auth | Validación / errores |
|--------|------|------|----------------------|
| OPTIONS | * | no | 204 `index.php:19` |
| POST | /auth/login | público + rate 8/300s | user/pass vacíos 400; mal 401 `auth.php:9-20` |
| POST | /auth/logout | sesión, **sin CSRF** | 200 `auth.php:35` |
| GET | /auth/me | opcional | `{authenticated, username, role, csrfToken}` `auth.php:45-54` |
| GET | /pages | **público** | lista + sitio sintético `pages.php:37` |
| GET | /pages/{slug} | público; draft si admin o `?preview=` | 404 `pages.php:82` |
| PUT | /pages/{slug} | `require_admin` + CSRF | payload, version, secciones inicio; 400/401/403/404/409 |
| POST | /pages/{slug}/publish | `require_role('admin')` + CSRF | 404 `pages.php:285` |
| POST | /pages/{slug}/preview-token | admin + CSRF | token 2 h `pages.php:334` |
| GET | /pages/{slug}/revisions | admin, sin CSRF | `pages.php:67` |
| POST | /pages/{slug}/revisions/{id}/restore | admin + CSRF | restaura **draft**; 404 `pages.php:317` |
| GET/PUT | /site y /pages/sitio | igual que páginas | PUT 409 `pages.php:246` |
| POST | /site/publish | admin role + CSRF | `index.php:49` / `pages.php:119` |
| GET | /media | admin | `media.php:6` |
| POST | /media | admin + CSRF | 10 MB, getimagesize, GD `media.php:19-30,113` |
| DELETE | /media/{id} | **solo admin** + CSRF | 404 `media.php:62` |
| GET | /messages | admin | 405 si no GET `messages.php:7` |
| POST | /contacto | público + rate 8/600s | name o email `messages.php:42`; 429 `index.php:67` |
| POST | /reclamaciones | público + rate 6/600s | email+fullname `messages.php:67` |
| POST | /bot | rate 20/60s | `index.php:74` |
| GET | /sitemap.xml | público | XML `pages.php:360` |
| * | * | — | 404 `index.php:79`; 500 sin `detail` salvo `APP_DEBUG` `index.php:81-85` |

401: `helpers.php:66-71`. 403 CSRF: `security.php:13-20`. 403 rol: `security.php:74-79`.

Scripts huérfanos **no** enrutados por `index.php`: `API/contacto.php`, `API/reclamaciones.php` (SMTP en claro, CORS `*`).

---

## 3. Subida de imágenes

`handle_media` POST → `compress_image()` (`API/media.php:107`).

- Auth + CSRF.
- 10 MB (`media.php:29`).
- Tipo real: `getimagesize` JPEG/PNG/WEBP/GIF, re-encode WebP o JPEG calidad 80, máximo 1920 px (`media.php:113-134`).
- Nombre `bin2hex(random_bytes(8))` + extensión del tipo re-encodificado (`media.php:129-132`).
- Variantes 480 y 960 si la fuente es más grande (`media.php:137-145`); `width`/`height` en tabla `media`.
- Disco: `API/uploads/`. URL `/api/uploads/…`.
- **Apache/cPanel:** `API/uploads/.htaccess` apaga PHP (`php_flag engine off`, `RemoveHandler`, `FilesMatch` deny).
- **php -S:** `router.php:10-17` niega `.php`/`.phtml`/`.phar` en uploads.
- Hueco: no hay tope de píxeles **antes** de `imagecreatefrom*` (`media.php:118`); un JPEG enorme cabe en 10 MB y puede tumbar memoria.

---

## 4. Sanitización HTML rich

**Servidor:** `API/sanitize.php`. Whitelist `p, br, strong, b, em, i, u, h2, h3, ul, ol, li, a[href]`. Quita `script`/`style`/`iframe`, `on*`, `javascript:`/`data:` en href. Se aplica a hojas `body` o strings que parecen HTML (`sanitize_cms_tree`). Llamado desde `cms_prepare_document` (`pages.php:16-22`) en GET, PUT draft, publish y restore.

**Cliente:** Quill en `cms-rich.directive.ts` y `cms-rich-field.ts` (import dinámico). Toolbar: negrita, cursiva, subrayado, h2/h3, listas, enlace. Público: `innerHTML`. No hay limpieza de pegado Word en el cliente. El servidor sí recorta lo que no está en la whitelist al guardar.

---

## 5. Guardado y concurrencia

- Columnas `version` + `draft` en `pages` y `site_settings` (`API/schema.sql`, `API/migrate.php`).
- GET anónimo: solo publicado. Admin o `?preview=`: borrador si existe (`pages.php:139-148`). `hasDraft` / `published` **solo si hay sesión admin**.
- PUT: exige `version`; `UPDATE … WHERE version = ?`; 409 si no coincide (`pages.php:187-216`, `236-256`). El documento se guarda **entero** en `draft` (no parche JSON en servidor).
- Publish: copia draft→content, borra draft, inserta revisión, **UPDATE sin WHERE version** (`pages.php:276-277`, `294-295`).
- Restore: escribe snapshot en draft, **sin CAS** (`pages.php:322-330`).
- Angular: PUT con version; 409 muestra aviso + Recargar (`cms-content.service.ts:326`, `page-editor.html:47`).

Dos personas: PUT concurrente al mismo draft → 409. Publish concurrente puede pisarse.

---

## 6. Undo

Ya **no** son 30 snapshots del documento. `CmsContentService` guarda parches `{path, before, after}` (tope 80) + redo (`cms-content.service.ts:83-97`, `139-163`). `replaceContent` / restaurar revisión puede empujar un documento entero (`path: ''`). `dirtyFields` existe y **no se muestra** en UI. Coste: proporcional a valores cambiados, no a 30 copias de legales.

---

## 7. Entrega, caché, SEO

- Angular tiene `@angular/ssr` y `RenderMode.Prerender` en `app.routes.server.ts`; el flujo local documentado es `ng serve` (CSR). No hay invalidación de caché al publicar.
- GET JSON público: sin `Cache-Control` explícito en `json_out` (`helpers.php:28`).
- Sitemap: `GET /sitemap.xml` (`pages.php:360`); proxy Angular `/sitemap.xml` → API.
- JSON-LD + meta: `cms-seo.service.ts` (salta en `editMode`).
- Chunk edición: `page-editor` lazy en `app.routes.ts`; Quill `import()` solo con `editMode`. CDK drag **no** está en plantillas públicas.

---

## 8. Riesgos (gravedad, archivo:línea)

1. **Crítico — SMTP en claro en scripts legacy.** `API/contacto.php:40`, `API/reclamaciones.php` (mismo patrón). Si Apache sirve esos archivos fuera del router, filtran contraseña y aceptan CORS `*`.
2. **Alto — publish/restore sin CAS.** `API/pages.php:276-277`, `294-295`, `322-330`. Dos admins publican a la vez: último gana.
3. **Medio — bomba de imagen.** `API/media.php:113-134`. 10 MB de JPEG descomprimido puede agotar RAM.
4. **Medio — credenciales por defecto.** `docker-compose.yml` / `seed.php` `admin`/`admin123`.
5. **Medio — GET `/pages` público** lista slugs y versiones (`pages.php:37`).
6. **Bajo — logout sin CSRF.** `API/auth.php:35`.
7. **Bajo — sin rate limit en PUT/media.** Writes CMS ilimitados por IP.
8. **Bajo — HTML `href` http** tras sanitize (`sanitize.php:69-73`); campos link son más estrictos (`cms-schema.php` `validate_link_value`).
9. **Info — HTML crudo en el panel** no hay; el rich pasa por whitelist al PUT.

`docs/auditoria.md` (sesión 0 anterior) describe un estado viejo (sin CSRF, sin sanitize, sin draft). Esta auditoría lo sustituye.
