# AGENTS.md

Sitio público + CMS de Matt Innova Solution. Angular 21 (SSR) en `frontend/`, API PHP sin framework en `API/`, MariaDB. El contenido de las páginas vive en la base de datos y el frontend lo renderiza por bloques.

## Arranque local

```bash
docker compose up --build                  # API en :8000 + MariaDB en :3307
cd frontend && npm install && npm start    # web en :4200
```

- Admin: http://127.0.0.1:4200/admin — `admin` / `admin123` (solo local; `editor` / `editor123`).
- El proxy de Angular reescribe `/api` hacia `http://127.0.0.1:8000`.
- `API/.env` es opcional en local; el compose define base y credenciales.

## Comandos

```bash
docker compose exec api php tests/verify-cms.php   # sanitizado, migración, contratos
cd frontend && npm run test:cms                    # vitest
cd frontend && npm run test:e2e                    # Playwright (API arriba)
./tools/check-contracts.sh                         # verify + fixtures + SCSS + build prod
./tools/build-cpanel.sh                            # paquete dist-upload/ para cPanel
python3 tools/gen-blocks.py                        # regenera catálogo JSON y TS desde cms/blocks.json
```

`php API/tests/export-contracts.php` reescribe los fixtures cuando el contrato cambia a propósito; `--check` solo compara.

## Skills del proyecto

En `.opencode/skills/`: `cms-blocks` (flujo completo de bloques), `cpanel-release` (build y subida), `a11y-qa` (accesibilidad AA) y `matt-innova-cyber-ui` (sistema de diseño Cyber UI).

Cyber UI: tokens y utilidades en `frontend/src/styles/_cyber.scss`; primitivos en `frontend/src/app/components/ui/` (`PageHeader`, `CyberCard`, `HudDivider`, `GlowButton`); plan por lotes en `.opencode/plan-pages.md`.

## Mapa del código

- `frontend/src/app/pages/` — páginas públicas; `dynamic-page` renderiza los bloques del CMS.
- `frontend/src/app/cms/` — registro y presentadores de bloques, schema, `cms-content.service`, cliente API, directivas de edición, auth.
- `frontend/src/app/admin/` — panel: shell, editor de páginas, media, mensajes, usuarios, webhooks, chatbot.
- `frontend/src/app/components/` — widgets públicos (chatbot, accesibilidad, libro de reclamaciones).
- `API/index.php` + `API/Http/Router.php` — despacho; handlers por dominio en `pages.php`, `media.php`, `messages.php`, `auth.php`, `chatbot*.php`, `redirects.php`, `webhooks.php`.
- `API/Domain/`, `API/Repos/` — migración de contenido e persistencia.
- `API/migrate.php` (`APP_SCHEMA_VERSION`) y `API/cms-schema.php` (`CMS_SCHEMA_VERSION`) — versiones de DDL y de forma JSON.
- `API/seed.php`, `API/seed-en.php` — contenido inicial ES/EN.
- `cms/blocks.json` — fuente del catálogo de bloques.
- `docs/contratos-cms.md` — frontera JSON entre Angular y PHP.

## Invariantes

- No renombrar campos del contrato JSON (`docs/contratos-cms.md`). Un refactor mueve archivos, no campos.
- Toda lectura CMS lleva `?locale=es|en` (o header `X-CMS-Locale`); ES es el fallback.
- Edición con optimistic locking: `PUT` / `publish` envían `version`; conflicto = 409 con `version` y `content`.
- Imagen CMS = un string. Subidas en WebP con JPG hermano; variantes `-480` / `-960` por convención de nombre. No tocar `API/uploads/` ni el contenido de la base sin pedido explícito.
- `.env` nunca se commitea; secretos de IA viven en `app_secrets` y no salen por GET.
- Auth por sesión PHP + CSRF (`X-CSRF-Token`); roles `admin` y `editor`.
- Mantener sintaxis compatible con PHP 8.1 aunque el Docker use 8.3.
- La API es PHP plano: funciones cargadas desde `API/bootstrap.php`, sin autoloader salvo PHPMailer.
- Base de API en el frontend: `/api` en dev; en producción `window.__API_URL__` (por defecto `/api.php`).
- Tema público: `.public-theme` envuelve el shell en `app.html`; los tokens `--dt-*` viven en `frontend/src/styles/_tokens.scss`. El admin fija sus tokens claros en `admin/styles/_tokens.scss` y no debe heredar el navy público.
- Campos CMS aditivos del rediseño: `hero.stats`, `slides[].titleAccent`, `secondaryCta`/`secondaryLink`, `services.text`/`titleAccent`, tarjetas de servicios con `icon`/`link`, `serviceCards.cards[].icon` y `titleAccent` en `pageHero`/`listingHero`/`serviceHero`. Son opcionales; el contenido viejo usa fallbacks.
- `layout.backgroundImage`: imagen de fondo por sección (inspector, campo de imagen); tapa `layout.background` y lleva velo oscuro; los fondos opacos de cada bloque se neutralizan con `.has-bg-image` en `styles/_shared.scss`. Por defecto `CMS_DEFAULT_BG_IMAGE` (`/images/redesign/section-bg.webp`); schema 6 la rellena donde está vacía.

## Gotchas

- `API/router.php` (dev) bloquea `.env`, `.sql`, `.log`, `.md`, `tmp/`, `tests/` y `vendor/`; `.htaccess` solo deja atender directo a `index.php`. No agregar endpoints PHP sueltos.
- `build-cpanel.sh` inyecta `__API_URL__` en `index.html` y corrige el hash de `ngsw.json`; no editar archivos de `dist-upload/` después del build.
- `APP_SETUP=1` es one-shot: aplica el setup una vez y se ignora si el schema ya está al día.
- Los límites de rate limit se guardan en `API/tmp/ratelimit/` (ignorado por git).
- El directorio puede no tener `.git` (viene de un zip); verificar antes de usar comandos git.
