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
cp -f "$ROOT/deploy/mattinnova-cpanel.sql" "$OUT/mattinnova-cpanel.sql"

rm -rf "$OUT/api/tests"
find "$OUT/api" -name '*.md' -delete 2>/dev/null || true
find "$OUT" -name '.env.example' -delete 2>/dev/null || true
rm -f "$OUT/api/.env" "$OUT/.env"

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
echo "Crea public_html/api/.env en el servidor (no va en el zip). Ver README."
echo
echo "PHP 8.1+ con extensiones: pdo_mysql, gd, curl, openssl, mbstring, iconv."
echo "Permisos de escritura: public_html/api/uploads y public_html/api/tmp."
