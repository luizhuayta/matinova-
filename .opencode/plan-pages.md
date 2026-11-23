# Plan multipágina — Cyber UI por lotes

## Estado

- Lote 1 (Home): completo; el Home ya está rediseñado. La migración opcional de CTAs/tarjetas a primitivos queda pendiente y no bloquea.
- Lote 2 (Nosotros + Contacto + legales + libro): completo. `PageHeader` center/left, `CyberCard` en stats/team/contactCards/formulario, `HudDivider`, `GlowButton` con `label`. Acentos de `pageHero` agregados en seeds/DB (`Cañete`, `problema`).
- Lote 3 (Servicios + detalle + Clientes): completo. `PageHeader` center/left con grid o dot-grid, `CyberCard` en services/reasons/clientes, `HudDivider`, `GlowButton` y banner `cta-banner-bg.webp`. Acentos por defecto (`puesta en marcha`, `empresas`) y `titleAccent` editable.
- Verificación: `npm run test:cms` 51/51, build de producción limpio, capturas de las rutas de ambos lotes y suite e2e completa **69 passed / 5 skipped / 0 failed** (7.0 min, tras todos los ajustes finales). Los 5 skipped son por diseño: 4 pruebas mobile-only en el proyecto chromium y el snapshot visual en mobile.
- Ajuste final 1: los 8 fallos iniciales de la suite eran tests viejos que buscaban `.page-hero` y fondos anteriores; se actualizaron a `.cyber-page-header`, al fondo Cyber UI `rgb(3,11,26)` y al chip claro `.client-tile-mark`.
- Ajuste final 2: las tarjetas de `serviceCards` usan `routerLink` para rutas internas y `href` + `target="_blank"` para externas; el test de esa vista pasa en escritorio y móvil.
- Ajuste final 3: contactCards en grid compacto de 3 columnas (icono arriba), mapa como fachada en marco cian con botón, y videos con miniatura de YouTube + botón de play (el iframe carga solo al hacer clic).

Sistema de diseño: `.opencode/skills/matt-innova-cyber-ui.md`.
Primitivos: `frontend/src/app/components/ui/` (`PageHeader`, `CyberCard`, `HudDivider`, `GlowButton`).
Assets: `/images/redesign/subpage-grid-bg.webp`, `/images/redesign/cta-banner-bg.webp`.

**Regla de oro:** no editar páginas internas hasta aprobar este plan. Cada lote se implementa, se verifica y se revisa antes del siguiente. Ponytail: el cambio más pequeño que logra variedad con cohesión; sin dependencias nuevas.

## Rutas reales del frontend

| Ruta | Slug CMS | Bloques principales | Lote |
|---|---|---|---|
| `/`, `/en` | `inicio` | hero, about, contactCards, services, innovative, faq | 1 |
| `/acerca-de` | `acerca-de` | pageHero, stats, about, team, videos | 2 |
| `/contacto` | `contacto` | pageHero, contactCards, contactForm | 2 |
| `/privacidad`, `/terminos` | `privacidad`, `terminos` | richText | 2 |
| `/libro-reclamaciones` | `libro-reclamaciones` | claimsBook | 2 |
| `/servicios` | `servicios` | listingHero, serviceCards, cta | 3 |
| `/servicios/software` | `servicios-software` | serviceHero, reasons | 3 |
| `/servicios/hardware` | `servicios-hardware` | serviceHero, reasons | 3 |
| `/servicios/saas` | `servicios-saas` | serviceHero, reasons | 3 |
| `/servicios/consultoria` | `servicios-consultoria` | serviceHero, reasons | 3 |
| `/servicios/soluciones-ti` | `servicios-soluciones-ti` | serviceHero, reasons | 3 |
| `/clientes` | `clientes` | listingHero, clients, cta | 3 |
| MIS Academy | — | enlace externo `https://misacademyonline.com/` | 3 (nota) |

Notas:
- **Proyectos** no existe como ruta; el equivalente actual es `/clientes`. Renombrar la etiqueta es una decisión de contenido/CMS, no de este refactor.
- **MIS Academy** es un enlace externo del nav; no tiene página interna. Si se quiere una landing, es una ruta nueva y sigue las mismas reglas; no se crea en este plan.
- Las versiones `/en` comparten layout y primitivos; solo cambia el contenido CMS.

## Lote 1 — Home

Estado: ya rediseñado con el tema oscuro actual. No se rehace.

- Opcional y mínimo: migrar los CTAs del hero a `app-glow-button` y las tarjetas de servicios a `app-cyber-card` **sin cambiar el layout ni la imagen del hero**.
- El Home es el **único** lugar con `hero-cyber-bg.webp` / foto del hero y la barra de cifras.
- Verificación: `npm run test:cms`, build, captura de `/` y `/en`.

## Lote 2 — Nosotros + Contacto (+ legales y libro)

Variedad: headers centrados vs izquierdos, tarjetas en grid vs lista, lectura larga sin grid.

- **Nosotros (`/acerca-de`)**
  - `app-page-header` `align="center"` `background="grid"` con eyebrow y acento.
  - `app-cyber-card` en grid para stats y team; `app-hud-divider` entre secciones.
  - `app-glow-button` para CTAs; videos en panel con tokens cyber.
- **Contacto (`/contacto`)**
  - `app-page-header` `align="left"` `background="grid"`.
  - `app-cyber-card` en lista para contactCards; formulario en panel elevado.
  - `app-glow-button` `type="submit"`; `app-hud-divider` antes del formulario.
- **Legales (`/privacidad`, `/terminos`)**
  - `app-page-header` `align="left"` `background="none"` + dot-grid en esquinas.
  - richText en panel de lectura con tokens cyber; sin grid de tarjetas.
  - `app-hud-divider` entre secciones largas.
- **Libro (`/libro-reclamaciones`)**
  - `app-page-header` `align="left"` `background="grid"`.
  - Formulario en `app-cyber-card` `tone="elevated"`; `app-glow-button` submit.
- Verificación: rutas ES/EN, edición CMS de un texto y un icono, build, capturas.

## Lote 3 — Servicios + Proyectos (Clientes) + MIS Academy

Variedad: tarjetas con imagen vs paneles de logos; detalle en lista.

- **Servicios (`/servicios`)**
  - `app-page-header` `align="center"` `background="grid"`.
  - `app-cyber-card` con `image` + `icon` en grid para serviceCards; `app-hud-divider`.
  - Banner de cierre con `cta-banner-bg.webp` y `app-glow-button`.
- **Detalle de servicio (`/servicios/*`)**
  - `app-page-header` `align="left"` `background="grid"`.
  - `app-cyber-card` en lista para reasons; `app-hud-divider`; `app-glow-button` CTA.
- **Clientes / Proyectos (`/clientes`)**
  - `app-page-header` `align="center"` `background="none"` + dot-grid.
  - `app-cyber-card` en paneles para logos/casos con chip claro; no repetir el grid de servicios.
  - `app-hud-divider` y `app-glow-button`.
- **MIS Academy**
  - Sin página interna; el nav sigue apuntando al sitio externo.
  - Si se aprueba una landing futura: ruta nueva + `app-page-header` + `app-cyber-card`; no se crea ahora.
- Verificación: todas las subrutas ES/EN, edición CMS, build, capturas.

## Reglas transversales

- **Anti-repetición:** prohibido `hero-cyber-bg.webp` fuera del Home. Headers internos usan `subpage-grid-bg.webp` o dot-grid; banners de cierre usan `cta-banner-bg.webp`.
- **Cohesión:** mismos tokens (`_cyber.scss`) y primitivos en todas las páginas.
- **CMS:** los primitivos reciben valores ya resueltos; no cambian contratos ni `cms/blocks.json`. Mantener `cmsText`/`cmsImage`/`cmsLink`/`cmsList` donde exista edición inline.
- **Accesibilidad:** contraste AA, foco visible, `prefers-reduced-motion`, `forced-colors`, alto contraste.
- **Ponytail:** un lote a la vez; reutilizar primitivos; sin dependencias nuevas; el cambio más pequeño que logra la variedad.

## Verificación por lote

1. `cd frontend && npm run test:cms`
2. `cd frontend && npm run build -- --configuration production`
3. `php API/tests/export-contracts.php --check` (si se tocó el catálogo)
4. Capturas de las rutas del lote en escritorio y móvil.
5. Edición CMS de un texto/icono/enlace y publicación; confirmar que el cambio se ve.
