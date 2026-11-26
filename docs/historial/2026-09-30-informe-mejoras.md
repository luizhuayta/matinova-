# Informe de mejoras — Matt Innova Solution

Fecha: 30 de septiembre de 2026
Rama: `panel-cms-y-back` (cambios sin commitear)
Paquete listo: `subir/dist-upload.zip` (4.6 MB, 324 archivos)

## 1. Resumen ejecutivo

- Auditoría inicial: **11/20 (Acceptable)** → tras fixes: **16/20 (Good)**.
- Tests frontend: **45/45** (`npm run test:cms`). Contratos API: **99 OK** (`php tests/verify-cms.php`).
- E2E Playwright: **9 passed / 0 failed** (5 skips por diseño, según proyecto).
- Build producción Angular: limpio, sin exceder budgets.
- Contenido corregido y **publicado en la BD local**: datos de Cañete, 6 cards de servicios, RUC **20612286745**, héroes ES/EN.
- Servicios locales **apagados** al cierre de la sesión (ver §7).

## 2. Problemas del documento original (5/5 arreglados)

1. **Botón flotante de accesibilidad**: restaurado el diseño AudioEye (circular 52 px, hover navy, activo naranja, cabecera del panel en gradiente + animación). `frontend/src/app/components/accessibility/accessibility.scss`.
2. **Chatbot ilegible**: reglas `forced-colors` + alto contraste; en modo oscuro las burbujas usan variables del tema. `chatbot.scss`. Además: foco al abrir/cerrar, tecla Esc, `aria-modal`, iconos ocultos.
3. **Equipo descentrado/fotos descolocadas**: cabecera centrada (`about-style-block.html`), encuadre uniforme 3/4 con `object-position 50% 20%`, labels sociales con nombre, `alt` coherentes.
4. **Mapa parpadea**: dimensiones fijas + `aspect-ratio 16/9` + skeleton; además fachada **click-to-load** ("Cargar mapa") que evita descargar ~1 MB de Google Maps hasta que el visitante lo pide.
5. **Título "Lo que cambió…" invisible**: `h2` en `--ink-900` sobre fondo claro + fallback `forced-colors`.

## 3. Accesibilidad y contraste (AA)

- Nuevo token `--cta-gradient` (`#c24e15→#a8430f`, 4.78/6.04:1 con blanco) aplicado a todos los CTA con texto blanco; textos naranja pequeños a `--accent-700`; placeholder del chat a `#64748b` (4.55:1).
- Tarjeta del libro, stats y chips legibles en modo oscuro; `DESIGN.md` actualizado.
- Formularios: libro con `h1`, `autocomplete`/`inputmode`, resumen de errores con `role=alert` + foco; reporte de accesibilidad con `role=alert/status`; menús y cookies con Esc y `aria-haspopup/controls`; filtros de clientes `tablist`→`group` + `aria-pressed`; héroe con botón público pausar/reanudar banners.

## 4. Seguridad backend (sin tocar `.env`, por indicación)

- `API/.env` **intacto en disco** (636 bytes, ni una línea tocada, sin `.env.example`); solo se quitó del índice git para que futuros commits no lo incluyan.
- `API/router.php` (dev): ya no sirve `.env`, `*.log/*.sql/*.md`, `tmp/`, `tests/`, `vendor/`.
- `API/.htaccess`: solo `index.php` atiende PHP directo (cierra el bypass de `chatbot.php`, verificado 403); `Options -Indexes` en ambos `.htaccess`.
- `APP_SETUP=1` ahora es one-shot (antes re-sembraba en cada request).
- `Http/Router.php` sin rutas duplicadas (tabla exacta + un bloque `match`); comportamiento idéntico verificado (405/401/404 donde corresponde).
- Validaciones: monto de reclamo 0–99 999 999, `destinationEmail` con formato, `/bot` truncado a 2000, ticket único (índice + reintento; aplicado en local).
- 404 real con cuerpo SPA para slugs inexistentes (SEO correcto).

## 5. Performance y deploy

- Imágenes: `frontend/public` 5.7 MB → 3.4 MB (recompresión con magick + WebP); 3 PNG fotográficos convertidos a JPG/WebP con seeds y BD actualizados; `logo.svg` 97 KB → 24 KB (idéntico visualmente).
- Subset bootstrap-icons: 131 KB → 9.3 KB (`tools/subset-icons.sh` para regenerar; `⚖️→bi-scale` inexistente remapeado a `bi-bank`).
- `build-cpanel.sh`: optimiza imágenes, genera 38 `.br` + 38 `.gz`, regenera el SQL de cPanel desde `schema.sql` (fin de la deriva); `.htaccess` sirve precomprimidos, `ngsw.json/worker` en `no-cache`.
- Frontend `/en`: una sola pasada de API (antes 6 peticiones con locale wrong) + `<html lang>` dinámico + caché en `lookupRedirect`.
- Variantes `-480/-960` faltantes: se generan bajo demanda (`cms_media_ensure_variant` + ruta `/uploads/` en el Router; probado 200 + cacheo).
- SweetAlert en import dinámico ×2; lazy/dimensiones en logos de clientes; `tsc` limpio; budgets del build OK.

## 6. Contenido publicado (BD local) y seeds

- `inicio` ES/EN: contactCards de Cañete (`contacto@mattinnovasolution.com`, `+51 992 422 219`).
- `contacto` ES/EN: cards de Casa matriz (estaban stale en BD aunque el seed estaba bien).
- `servicios` ES/EN: 6 cards (gestión → `/contacto`) + héroe "Seis líneas", publicados.
- `libro-reclamaciones` ES/EN: **RUC 20612286745** publicado.
- Barrido total: cero restos de San Isidro / `mattinnova.pe` / `987 654` en las 17 páginas × 2 locales.
- Seeds ES/EN alineados (contacto, 6ª card, `ctaLink`/`features`/`aboutImageAlt` en EN).

## 7. Servicios locales

Apagados al cierre: `docker compose down` (api + db eliminados, volúmenes de datos intactos) y `ng serve` detenido. Para retomar: `docker compose up -d` y `cd frontend && npm start` (http://localhost:4200, API :8000).

## 8. Pendiente manual (requiere tu cPanel)

1. Subir el contenido de `subir/dist-upload.zip` a `public_html/` (sin tocar `api/.env` ni `api/uploads/`).
2. `php api/media-backfill.php` en prod (confirmar `imagewebp` disponible).
3. Borrar en prod: `chunk-3VODV6RJ.js`, `chunk-MZ2VUGLS.js`, `chunk-PF3BZRRJ.js`, `chunk-YFS3IJXO.js`, `main-F4SMHW2A.js`, `styles-ZR7YJU63.css` y la carpeta `media/` vieja.
4. Verificar: `api/pages.php → 403`, `/media/ → 403`, variante `-960 → 200`, `logo.svg → 200/24892`, subset `→ 200/9312`, `br → content-encoding: br`, `ngsw.json → no-cache`; home con 3 llamadas `/api`, ~420 KB.
5. Opcional: `ALTER TABLE messages ADD UNIQUE KEY uq_messages_ticket (ticket);` en phpMyAdmin (BDs frescas ya lo traen).
6. No commiteado: todo el trabajo sigue sin commit en `panel-cms-y-back` (incluida la protección del `.env`).

## 9. Archivos nuevos de esta sesión

- `subir/dist-upload.zip` — paquete de despliegue.
- `frontend/src/styles/_bootstrap-icons-subset.scss`, `frontend/public/fonts/` — subset de iconos.
- `frontend/playwright.local.config.ts` — correr e2e con el Chrome del sistema (evita descargar 170 MB).
- `tools/subset-icons.sh` — regenerar el subset si se agregan iconos.
- `API/media-backfill.php`, `API/tests/contratos-cms.md`, `API/tests/export-contracts.php`, `tools/check-contracts.sh` — respaldo de backfill y contratos (venían del trabajo previo sin commitear).
