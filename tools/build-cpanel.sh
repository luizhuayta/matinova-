#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-upload"
ZIP="$ROOT/dist-upload.zip"
FRONT="$ROOT/frontend"
API="$ROOT/API"

echo "==> Compilando Angular (producción)"
cd "$FRONT"
if [[ ! -d node_modules ]]; then
  npm ci
fi
npx ng build --configuration production

BROWSER=""
if [[ -d "$FRONT/dist/frontend/browser" ]]; then
  BROWSER="$FRONT/dist/frontend/browser"
else
  BROWSER="$(find "$FRONT/dist" -type d -name browser 2>/dev/null | head -n 1 || true)"
fi
if [[ -z "$BROWSER" || ! -d "$BROWSER" ]]; then
  echo "No se encontró la carpeta de build de Angular (dist/.../browser)." >&2
  exit 1
fi

echo "==> Instalando PHPMailer (vendor/)"
cd "$API"
if [[ ! -f vendor/autoload.php ]]; then
  if [[ ! -f composer.phar && ! -x "$(command -v composer || true)" ]]; then
    echo "Necesitas Composer para generar vendor/." >&2
    exit 1
  fi
  if command -v composer >/dev/null 2>&1; then
    composer install --no-dev --no-interaction --optimize-autoloader
  else
    php composer.phar install --no-dev --no-interaction --optimize-autoloader
  fi
fi

echo "==> Armando dist-upload/"
rm -rf "$OUT" "$ZIP"
mkdir -p "$OUT/api/uploads" "$OUT/api/tmp/ratelimit"
cp -a "$BROWSER"/. "$OUT/"
cp -f "$FRONT/public/.htaccess" "$OUT/.htaccess"

SAFETY_WORKER="$FRONT/node_modules/@angular/service-worker/safety-worker.js"
if [[ ! -f "$SAFETY_WORKER" ]]; then
  echo "No se encontró $SAFETY_WORKER." >&2
  exit 1
fi
cp -f "$SAFETY_WORKER" "$OUT/safety-worker.js"
cp -f "$SAFETY_WORKER" "$OUT/ngsw-worker.js"
rm -f "$OUT/ngsw.json"

# Frontal /api.php: el API también responde por /api.php/<ruta> sin depender
# del .htaccess de la raíz, y el frontend de producción lo usa por defecto.
cp -f "$ROOT/api.php" "$OUT/api.php"
if grep -q '</head>' "$OUT/index.html"; then
  sed -i 's|</head>|<script>window.__API_URL__="/api.php";</script></head>|' "$OUT/index.html"
else
  echo "AVISO: no se encontró </head> en index.html; __API_URL__ no inyectado." >&2
fi

# No modificar assets después del build: ngsw.json contiene sus hashes.
# Optimizar frontend/public/ antes de compilar, si hace falta.
# La inyección de __API_URL__ sí cambia index.html: actualizar su hash.
node - "$OUT" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const out = process.argv[2];
const manifest = path.join(out, 'ngsw.json');
if (fs.existsSync(manifest)) {
  const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  data.hashTable['/index.html'] = crypto.createHash('sha1')
    .update(fs.readFileSync(path.join(out, 'index.html'))).digest('hex');
  fs.writeFileSync(manifest, JSON.stringify(data));
}
JS

# Precomprimidos .br/.gz para las reglas del .htaccess (sirve cPanel sin depender de filtros dinámicos).
if command -v brotli >/dev/null 2>&1 || command -v gzip >/dev/null 2>&1; then
  echo "==> Precomprimiendo (.br/.gz)"
  while IFS= read -r -d '' f; do
    command -v brotli >/dev/null 2>&1 && brotli -q 11 -f -k "$f" 2>/dev/null || true
    command -v gzip >/dev/null 2>&1 && gzip -9 -k -f "$f" 2>/dev/null || true
  done < <(find "$OUT" -type f \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.html' -o -name '*.json' -o -name '*.xml' -o -name '*.webmanifest' -o -name '*.txt' \) ! -name '*.br' ! -name '*.gz' -size +1k -print0)
fi

# Copia la API sin basura de desarrollo ni secretos.
for item in "$API"/*; do
  name="$(basename "$item")"
  case "$name" in
    tests|Dockerfile|entrypoint.sh|router.php|.env|.env.example|tmp|uploads) continue ;;
  esac
  cp -a "$item" "$OUT/api/"
done
if [[ -f "$API/.htaccess" ]]; then
  cp -f "$API/.htaccess" "$OUT/api/.htaccess"
fi
if [[ -d "$API/vendor" ]]; then
  rm -rf "$OUT/api/vendor"
  cp -a "$API/vendor" "$OUT/api/vendor"
fi
mkdir -p "$OUT/api/uploads" "$OUT/api/tmp/ratelimit"
if [[ -f "$API/uploads/.htaccess" ]]; then
  cp -f "$API/uploads/.htaccess" "$OUT/api/uploads/.htaccess"
fi
cat > "$OUT/api/tmp/.htaccess" << 'HT'
Require all denied
HT
# El SQL de cPanel se genera desde API/schema.sql (fuente única, no editar deploy/ a mano).
{
  printf -- '-- Matt Innova Solution — esquema para phpMyAdmin (cPanel)\n-- GENERADO desde API/schema.sql por tools/build-cpanel.sh (no editar a mano).\n-- Importar en una base MariaDB/MySQL vacía si no quieres esperar al auto-seed\n-- del primer request. El contenido de páginas se crea solo al primer hit a /api.\n-- Requisitos: utf8mb4\n\n'
  cat "$ROOT/API/schema.sql"
} > "$ROOT/deploy/mattinnova-cpanel.sql"
cp -f "$ROOT/deploy/mattinnova-cpanel.sql" "$OUT/mattinnova-cpanel.sql"

rm -rf "$OUT/api/tests"
find "$OUT/api" -name '*.md' -delete 2>/dev/null || true
find "$OUT" -name '.env.example' -delete 2>/dev/null || true
rm -f "$OUT/.env" "$OUT/api/.env"
find "$OUT" -type d -exec chmod a+rx {} +
find "$OUT" -type f -exec chmod a+r {} +
find "$OUT/api/tmp" -type d -exec chmod u+w {} +
find "$OUT/api/uploads" -type d -exec chmod u+w {} +

echo "==> Empaquetando dist-upload.zip"
cd "$ROOT"
if command -v zip >/dev/null 2>&1; then
  zip -r -q dist-upload.zip dist-upload
else
  python - << 'PY'
import zipfile
from pathlib import Path
root = Path("dist-upload")
with zipfile.ZipFile("dist-upload.zip", "w", zipfile.ZIP_DEFLATED) as zf:
    for path in root.rglob("*"):
        if path.is_file():
            zf.write(path, path.as_posix())
PY
fi
echo "Listo: $ZIP"
echo "Sube el contenido de dist-upload/ a public_html/ (api/ queda en public_html/api/)."
echo "El zip no incluye .env. En cPanel deja el api/.env y uploads/ que ya están."
echo
echo "PHP 8.1+ con extensiones: pdo_mysql, gd, curl, openssl, mbstring, iconv."
echo "Permisos de escritura: public_html/api/uploads y public_html/api/tmp."
