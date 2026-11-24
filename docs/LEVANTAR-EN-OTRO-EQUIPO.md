# Levantar el proyecto en otro equipo

Guía para quien recibe el zip del proyecto. Hay tres caminos: **Docker**, **Podman** o **sin contenedores** (PHP + MariaDB + Node nativos). Cualquiera de los tres deja el mismo resultado:

- Web: `http://127.0.0.1:4200`
- API: `http://127.0.0.1:8000`
- Admin: `http://127.0.0.1:4200/admin` — `admin` / `admin123` (solo local)

El zip trae el código completo (`API/`, `frontend/`, `cms/`, `deploy/`, `docs/`, `tools/`), `API/.env` de desarrollo, `API/vendor/` (PHPMailer ya instalado), `API/uploads/` (media real del CMS) y `dist-upload.zip` (paquete listo para cPanel). No trae `node_modules` ni la caché de Angular: se regeneran con `npm install`.

---

## Opción A — Docker (la más simple)

Requisitos: Docker Engine/Desktop + `docker compose` (v2).

```bash
docker compose up --build        # API en :8000 + MariaDB en :3307 (datos persistentes)
cd frontend && npm install && npm start
```

Listo. El compose crea la base, corre la migración y el seed (ES/EN) solo la primera vez, e instala PHPMailer.

## Opción B — Podman (Linux sin Docker)

Podman es compatible casi 1:1 con Docker; solo cambia el orquestador. Tres variantes según lo que tengas instalado:

```bash
# B1 · podman-compose (paquete python, el más común)
podman-compose up --build

# B2 · Podman 4+ con subcomando compose (usa un provider externo igualmente)
podman compose up --build

# B3 · alias del CLI: si `docker` en tu máquina ya apunta a podman
# (como en esta máquina, donde docker emula a podman), el comando de siempre:
docker compose up --build
```

Si ninguna funciona: `sudo dnf install podman-compose` (Fedora/Nobara), `sudo apt install podman-compose` (Debian/Ubuntu) o `pip3 install podman-compose`.

Todo lo demás es idéntico a Docker: mismos puertos (API :8000, MariaDB :3307), mismo `docker-compose.yml`, misma persistencia.

> Ojo: con Podman **rootless**, el mapeo `8000:8000` puede chocar con otro servicio que ya use el 8000 del host. Ver "Puertos ocupados" más abajo.

## Opción C — Sin contenedores (PHP + MariaDB + Node nativos)

Cuando el equipo no tiene ni puede instalar Docker/Podman (p. ej. Windows sin WSL2, hosting de desarrollo, máquina restringida).

Requisitos:

- **PHP 8.1+** con `pdo_mysql`, `gd`, `curl`, `openssl`, `mbstring`, `iconv`
- **MariaDB 10.6+ / MySQL 8+** corriendo
- **Node.js 20+** y npm
- Composer (opcional: solo reinstala `API/vendor/`; el zip ya lo trae)

Pasos:

```bash
# 1. Crea la base y el usuario (cliente mysql / phpMyAdmin / DBeaver)
mysql -u root -e "CREATE DATABASE mattinnova_cms; \
  CREATE USER 'matt'@'127.0.0.1' IDENTIFIED BY 'mattlocal'; \
  GRANT ALL ON mattinnova_cms.* TO 'matt'@'127.0.0.1';"

# 2. Configura el entorno: el zip ya trae API/.env; solo revisa que apunte
#    a TU base (DB_HOST / DB_PORT / DB_USER / DB_PASSWORD).
#    Para una MariaDB local en el puerto estándar: DB_HOST=127.0.0.1 DB_PORT=3306

# 3. Crea el esquema y el contenido inicial (ES/EN)
php API/migrate.php        # → "Migración lista (schema 14)."

# 4. Levanta la API con el servidor embebido de PHP
php -S 127.0.0.1:8000 -t API API/router.php

# 5. En otra terminal, el frontend
cd frontend && npm install && npm start
```

En **Windows** lo más cómodo es XAMPP (PHP + MariaDB + phpMyAdmin en un instalador) o Laragon; habilita `extension=pdo_mysql`, `gd`, `curl`, `mbstring` en `php.ini` y corre los mismos comandos en PowerShell/CMD. En **macOS**: `brew install php mariadb && brew services start mariadb`.

> Sin `API/vendor/` la web funciona igual; solo el envío de correos queda desactivado (`composer install` dentro de `API/` lo restaura).

## Puertos ocupados

El compose publica API→8000 y MariaDB→3307 del host. Si algo ya usa esos puertos:

- Cambia solo el puerto del host en `docker-compose.yml`: `"8010:8000"` y/o `"3310:3306"`.
- Si moviste la API a otro puerto, sirve el frontend con `frontend/proxy.local.conf.json` (ya apunta a :8010): `npx ng serve --proxy-config proxy.local.conf.json`, o edita `proxy.conf.json` al nuevo puerto.
- Si moviste MariaDB, ajusta `DB_PORT` en `API/.env` (solo para la API nativa; dentro de Compose la red interna siempre es `db:3306`).

## Verificación rápida

```bash
curl http://127.0.0.1:8000/health    # database/schemaCurrent/tmpWritable/mailerInstalled en true
```

Tests completos (con la API arriba):

```bash
docker compose exec api php tests/verify-cms.php   # o: php API/tests/verify-cms.php con .env nativo
cd frontend && npm run test:cms
./tools/check-contracts.sh                         # contratos + SCSS + build producción
./tools/build-cpanel.sh                            # regenera dist-upload.zip para cPanel
```

## Pro: hazlo con un agente de IA

Este repo está preparado para que un agente lo levante **autónomamente**:

- `AGENTS.md` en la raíz resume arranque, comandos, mapa del código e invariantes — es lo primero que lee cualquier agente (Devin, Cursor, Aider, opencode…).
- `.opencode/skills/` trae skills del proyecto (bloques CMS, release a cPanel, a11y, sistema de diseño).
- `docs/contratos-cms.md` documenta el contrato JSON Angular↔PHP.

Prompt sugerido para el agente del otro equipo:

> "Lee AGENTS.md y docs/LEVANTAR-EN-OTRO-EQUIPO.md. Levanta el proyecto: API + base + frontend. Si el 8000 u otro puerto está ocupado, resuélvelo con proxy.local.conf.json o remapeando puertos en compose. Verifica /health y déjalo listo en :4200."

El agente detecta por sí solo si hay Docker, Podman o ninguno, elige la vía, crea la base con `php API/migrate.php` si no hay contenedores y deja el sitio corriendo.
