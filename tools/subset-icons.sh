#!/usr/bin/env bash
# Regenera el subset de bootstrap-icons (solo glifos usados en código + seeds).
# Uso: ./tools/subset-icons.sh
# Si agregas una clase bi-* nueva en código o CMS, re-ejecuta este script.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/frontend"
CSS="$FRONT/node_modules/bootstrap-icons/font/bootstrap-icons.css"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> Recolectando clases bi-* usadas"
grep -rhoE "bi-[a-z0-9-]+" "$FRONT/src" "$ROOT/API"/*.php "$FRONT/e2e" 2>/dev/null | sort -u > "$WORK/used.txt"

echo "==> Mapeando a codepoints"
python3 - "$CSS" "$WORK/used.txt" "$WORK/codes.json" << 'PY'
import json, re, sys
css = open(sys.argv[1], encoding='utf-8').read()
m = dict(re.findall(r'\.(bi-[a-z0-9-]+)::before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)"', css))
used = set(x.strip() for x in open(sys.argv[2]) if x.strip().startswith('bi-'))
missing = sorted(u for u in used if u not in m)
if missing:
    print(f"ADVERTENCIA: sin glifo en bootstrap-icons: {missing}", file=sys.stderr)
codes = {u: m[u] for u in used if u in m}
json.dump(codes, open(sys.argv[3], 'w'))
print(f"glifos: {len(codes)}")
PY

echo "==> Subseteando fuente (subset-font)"
cd "$WORK" && npm init -y >/dev/null 2>&1 && npm install --no-audit --no-fund subset-font >/dev/null 2>&1
cat > "$WORK/run.mjs" << 'JS'
import { readFileSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';
const codes = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const text = Object.values(codes).map(h => String.fromCodePoint(parseInt(h, 16))).join('');
const buf = readFileSync(process.argv[3]);
for (const fmt of ['woff2', 'woff']) {
  const out = await subsetFont(buf, text, { targetFormat: fmt });
  writeFileSync(`${process.argv[4]}.${fmt}`, out);
  console.log(fmt, out.length, 'bytes');
}
JS
node "$WORK/run.mjs" "$WORK/codes.json" "$FRONT/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2" "$WORK/bootstrap-icons-subset"

echo "==> Generando SCSS recortado"
python3 - "$CSS" "$WORK/codes.json" "$FRONT/src/styles/_bootstrap-icons-subset.scss" << 'PY'
import json, re, sys
css = open(sys.argv[1], encoding='utf-8').read()
codes = json.load(open(sys.argv[2]))
rules = []
for chunk in re.split(r'(?=@font-face|\.bi-[a-z0-9-]+::before)', css):
    mm = re.match(r'\.(bi-[a-z0-9-]+)::before', chunk)
    if mm and mm.group(1) in codes:
        rules.append(chunk)
head = """/* bootstrap-icons SUBSET (%d glifos) — generado por tools/subset-icons.sh. No editar a mano. */
@font-face {
  font-display: block;
  font-family: "bootstrap-icons";
  src: url("/fonts/bootstrap-icons-subset.woff2") format("woff2"),
    url("/fonts/bootstrap-icons-subset.woff") format("woff");
}

.bi::before,
[class^="bi-"]::before,
[class*=" bi-"]::before {
  display: inline-block;
  font-family: "bootstrap-icons" !important;
  font-style: normal;
  font-weight: normal !important;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: -0.125em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
""" % len(codes)
open(sys.argv[3], 'w').write(head + ''.join(rules))
print(f"clases: {len(rules)}")
PY

mkdir -p "$FRONT/public/fonts"
cp "$WORK/bootstrap-icons-subset.woff2" "$WORK/bootstrap-icons-subset.woff" "$FRONT/public/fonts/"
echo "listo: $FRONT/public/fonts/ + src/styles/_bootstrap-icons-subset.scss"
