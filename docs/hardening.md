# Hardening CMS (cPanel)

> Checklist de lo que **ya** rechaza la API. Huecos residuales y el plan de cierre: `docs/auditoria-tecnica.md` §8 y `docs/plan.md` Fase 1.

Qué rechaza la API después de la sesión 1–4:

- PUT/POST/DELETE de CMS y media **sin sesión** → 401
- Escritura **sin header `X-CSRF-Token`** (el de `GET /api/auth/me`) → 403
- Login / contacto / reclamaciones / bot por encima del cupo → 429
- Archivo que `getimagesize` no reconoce como JPEG/PNG/WEBP/GIF → 400
- HTML rich con `<script>`, `on*`, `javascript:` en `href` → se guarda ya limpio
- `version` distinta a la del servidor → 409
- `sections[].type` que no esté en hero/about/contactCards/services/innovative/testimonials → se descarta o 400
- DELETE `/media` y POST publish si el usuario es `editor` → 403
- Errores 500 **sin** `detail` salvo `APP_DEBUG=1`

Checklist Apache/cPanel:

1. `API/uploads/.htaccess` desplegado (php engine off).
2. DocumentRoot del API no debe permitir ejecutar lo que haya en `uploads/`.
3. HTTPS: la cookie de sesión sale con `Secure`.
4. Probar a mano:
   - `curl -X PUT http://127.0.0.1:8000/api/pages/inicio -H 'Content-Type: application/json' -d '{"content":{}}'` → 401
   - Tras login, PUT sin `X-CSRF-Token` → 403
   - PUT privacidad con `"body":"<script>alert(1)</script>"` → en BD no hay script
   - `php API/tests/verify-cms.php` → todo OK
