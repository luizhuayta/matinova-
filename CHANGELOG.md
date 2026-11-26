# Changelog

## 2026-11-26 — Corrección de errores, rediseño y bilingüe automático

Esquema de base: **v15** (las migraciones se aplican solas en la primera visita tras subir el paquete).

### Errores corregidos
- **CMS que "volvía atrás" al dejar el editor inactivo.**
  - *Causa:* la API pública tenía caché de 1 h sin `Vary`, y el editor recibía esa copia vieja.
  - *Arreglo:* ahora la API usa `no-cache` + ETag, y el editor lee siempre sin caché.
  - *Sesión:* se renueva con la actividad. Si caduca, el borrador queda en el navegador y se restaura tras volver a entrar.
- **Contenido que se reseteaba al actualizar.**
  - *Causa:* las migraciones de contenido se re-ejecutaban en cada cambio de esquema y pisaban lo editado.
  - *Arreglo:* ahora corren una sola vez por base, y `APP_SETUP=1` no re-instala si el esquema está al día.
- **Inglés que no se veía o no traducía según el navegador.** La URL es la única fuente del idioma. Al cambiar de idioma se recarga todo. Las páginas creadas en el CMS cargan en `/<slug>`, `/es/<slug>` y `/en/<slug>`.
- **Página colgada en "cargando" hasta borrar los datos del sitio.** Se retira el Service Worker de Angular. Un safety worker limpia los navegadores afectados, y la página se recarga una vez si un archivo `.js` no carga.
- **Franja blanca** al final de la página y con el aviso de cookies abierto.
- **Botones flotantes** que tapaban el aviso de cookies o el menú móvil.
- **Datos de relleno** (dirección de San Isidro, `mattinnova.pe`, `987 654 321`) reemplazados por los datos reales. Además, textos en español que aparecían dentro de la versión EN quedaron traducidos.
- **Errores menores:**
  - El mapa de Contacto desbordaba a 390 px.
  - El header desbordaba a 905 px.
  - El desplegable del nav no se cerraba con Escape ni al hacer scroll.
  - Un 409 llegaba sin `version`/`content`.
  - Una subida de imagen podía aplicarse a otra página.

### Diseño
- **Header:** mega-menú de Servicios/Proyectos y un solo botón "Contacto".
- **Fondo:** marco fijo simétrico, sin cortes entre secciones.
- **Componentes:** botones píldora unificados, banda de cifras con íconos y **contador animado**, y tarjetas HUD con foto.
- **Layout:** más ancho (`--layout-max: 1360px`, margen fluido), con zoom 0.85 solo entre 1024 y 1439 px.
- **Hero:** la imagen queda alineada al contenedor.
- **Contenido:** 5 líneas de servicio (se unieron las dos consultorías), foto nueva del CEO, banners sin texto incrustado y un video institucional en lugar del duplicado.

### CMS
- Crear una página en ES crea su versión EN con los mismos bloques.
- Las imágenes cambiadas en ES se sincronizan en EN si EN no estaba personalizada.

### Caché
- Las imágenes fijas se revalidan (`304`) y las subidas del CMS son inmutables.

### Pruebas
- `verify-cms.php`: 145 comprobaciones.
- Vitest: 79 pruebas.
- Playwright: 106 pruebas (escritorio y móvil), verificadas contra el paquete de cPanel servido en local.

Entregas anteriores: [docs/historial/](docs/historial/).
