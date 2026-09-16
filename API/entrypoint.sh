#!/bin/sh
set -e
cd /app
mkdir -p uploads
if [ ! -d vendor ]; then
  composer install --no-interaction --no-dev >/tmp/composer.log 2>&1 || true
fi
exec php -S 0.0.0.0:8000 -t /app /app/router.php
