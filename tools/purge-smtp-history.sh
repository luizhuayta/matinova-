#!/usr/bin/env bash
# Reescribe el historial para quitar la contraseña SMTP que estuvo
# hardcodeada en API/contacto.php y API/reclamaciones.php.
# Ejecutar en un clon limpio, luego force-push coordinado.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "El árbol de trabajo no está limpio. Haz commit o usa un clon fresco." >&2
  exit 1
fi

REPLACEMENTS="$(mktemp)"
trap 'rm -f "$REPLACEMENTS"' EXIT
cat > "$REPLACEMENTS" <<'EOF'
$mail->Password   = 'mattinnovasolution'==>$mail->Password   = 'ROTATED_USE_ENV'
$mail->Password = 'mattinnovasolution'==>$mail->Password = 'ROTATED_USE_ENV'
EOF

if command -v git-filter-repo >/dev/null 2>&1; then
  git filter-repo --replace-text "$REPLACEMENTS" --force
elif python3 -c 'import git_filter_repo' 2>/dev/null; then
  python3 -m git_filter_repo --replace-text "$REPLACEMENTS" --force
else
  echo "Instala git-filter-repo (https://github.com/newren/git-filter-repo) y vuelve a ejecutar." >&2
  echo "Después verifica: git log -p -S\"mattinnovasolution\" -- API/contacto.php API/reclamaciones.php" >&2
  exit 2
fi

echo "Historial reescrito. Verifica con:"
echo "  git log -p -S\"Password   = 'mattinnovasolution'\""
echo "Luego force-push coordinado: git push --force-with-lease"
