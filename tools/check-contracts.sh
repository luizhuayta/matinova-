#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v php >/dev/null 2>&1; then
  PHP=(php)
  VERIFY="$ROOT/API/tests/verify-cms.php"
  EXPORT="$ROOT/API/tests/export-contracts.php"
else
  PHP=(docker compose exec -T api php)
  VERIFY=/app/tests/verify-cms.php
  EXPORT=/app/tests/export-contracts.php
fi

fail=0

echo "==> verify-cms.php"
if "${PHP[@]}" "$VERIFY"; then
  echo "OK verify-cms"
else
  echo "FAIL verify-cms" >&2
  fail=1
fi

echo "==> contratos PHP"
if "${PHP[@]}" "$EXPORT" --check; then
  echo "OK fixtures"
else
  echo "FAIL fixtures" >&2
  fail=1
fi

echo "==> clases SCSS vs templates"
PYTHON_BIN=python3
command -v python3 >/dev/null 2>&1 || PYTHON_BIN=python
"$PYTHON_BIN" - "$ROOT" << 'PY'
import re, sys
from pathlib import Path
root = Path(sys.argv[1])
blocks = root / "frontend/src/app/cms/blocks"
scss = "\n".join(p.read_text(encoding="utf-8") for p in blocks.rglob("*.scss"))
used = set()
for path in (root / "frontend/src").rglob("*"):
    if path.suffix not in {".html", ".ts"}:
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    used.update(re.findall(r"class=\"([^\"]+)\"", text))
    used.update(re.findall(r"class='([^']+)'", text))
flat = set()
for chunk in used:
    for part in chunk.split():
        part = part.split(":")[0]
        if part:
            flat.add(part)
legacy = [
    "rack-hero", "editorial-hero", "split-block", "home-band", "home-band--paper",
    "home-band--mist", "home-heading", "home-chip", "navy-split", "mini-card",
]
dead = [name for name in legacy if name in scss and name not in flat]
if dead:
    print("FAIL CSS legacy aún presente:", ", ".join(dead), file=sys.stderr)
    sys.exit(1)
print("OK CSS legacy ausente de SCSS o usado en templates")
PY

echo "==> ng build production"
if (cd "$ROOT/frontend" && npx ng build --configuration production); then
  echo "OK ng build"
else
  echo "FAIL ng build" >&2
  fail=1
fi

exit "$fail"
