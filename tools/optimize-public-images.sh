#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/frontend/public"

convert_pair() {
  local src="$1"
  local max="${2:-1920}"
  local base stem ext webp jpg
  base="$(basename "$src")"
  stem="${base%.*}"
  ext="${base##*.}"
  webp="$PUB/${stem}.webp"
  jpg="$PUB/${stem}.jpg"
  if [[ ! -f "$src" ]]; then
    echo "skip missing $base"
    return 0
  fi
  magick "$src" -strip -resize "${max}x${max}>" -quality 82 "$webp"
  magick "$src" -strip -resize "${max}x${max}>" -quality 82 "$jpg"
  echo "ok $base -> $(du -h "$webp" | cut -f1) webp / $(du -h "$jpg" | cut -f1) jpg"
}

recompress_jpg() {
  local src="$1"
  local max="${2:-1600}"
  local tmp
  if [[ ! -f "$src" ]]; then
    echo "skip missing $(basename "$src")"
    return 0
  fi
  tmp="$(mktemp --suffix=.jpg)"
  magick "$src" -strip -resize "${max}x${max}>" -quality 82 "$tmp"
  magick "$src" -strip -resize "${max}x${max}>" -quality 82 "${src%.*}.webp"
  mv "$tmp" "$src"
  echo "ok $(basename "$src") recompressed $(du -h "$src" | cut -f1)"
}

# Fotos grandes de servicios y héroes (se muestran hasta ~640px).
for f in imas.jpg imat.jpg imac.jpg software.jpg erp.jpg about-image.jpg carousel.jpg; do
  recompress_jpg "$PUB/$f" 1280
done

# Etapas de fichas de servicio (se muestran ~400px).
for f in microsoft3651.jpg dspace.jpg ecommerce.jpeg windows-server-azure-arc.png creacion.jpg infreaestructura.jpg modulos.jpg transformacion_digital.jpg adaptabilidad.jpg personalizado.jpg resultados.jpg expertos.jpg saas.jpg sol_ti.jpg INFRAESTRUCTURAIT.jpg integridad.jpg saas2026.jpg; do
  recompress_jpg "$PUB/$f" 800
done

# Logos de clientes y libro (se muestran <=160px).
for f in tecnocom.jpg sanluis.jpg worldnet.jpg ServidoresHPE.png libro.jpg; do
  recompress_jpg "$PUB/$f" 400
done

# PNG fotográficos: recompresión máxima sin cambiar el nombre (los seeds los referencian).
for f in windows.png ServidoresHPE.png windows-server-azure-arc.png; do
  if [[ -f "$PUB/$f" ]]; then
    magick "$PUB/$f" -strip -resize "1200x1200>" -define png:compression-level=9 "$PUB/$f"
    magick "$PUB/$f" -strip -resize "1200x1200>" -quality 82 "$PUB/${f%.*}.webp"
    echo "ok $f png optimizado $(du -h "$PUB/$f" | cut -f1)"
  fi
done

recompress_jpg "$PUB/giovani.jpg" 1400
recompress_jpg "$PUB/taya.jpg" 1400

rm -f "$PUB/software.png" "$PUB/hardware2026.png" "$PUB/consultoria.png" \
  "$PUB/software-banner.png" "$PUB/saas2026.png" "$PUB/soluciones.png" \
  "$PUB/microsoft3651.png" "$PUB/hard.avif" "$PUB/imagen.jpg" \
  "$PUB/windows-server-azure.jpg"

echo "listo"
