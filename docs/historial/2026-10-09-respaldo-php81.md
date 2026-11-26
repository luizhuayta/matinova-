# Matt Innova Solution — respaldo y versión PHP 8.1

**Versión:** `2026.10.09-php81` · **Fecha:** 9 de octubre de 2026.

## Las tres entregas

| Archivo | Contenido | Uso |
| --- | --- | --- |
| `mattinnova-proyecto-privado.zip` | Código del frontend, API, CMS, pruebas, herramientas, documentación y `API/.env` local | Restaurar el proyecto y continuar desarrollando. **Privado: contiene contraseñas.** |
| `mattinnova-cpanel-completo.zip` | Angular compilado, API PHP, PHPMailer y `.htaccess`, con rutas listas para `public_html/` | Publicar en cPanel. **No incluye `.env` ni imágenes subidas por usuarios.** |
| `DOCUMENTACION-RESPALDO.md` | Esta guía | Consultar el problema, cambios, instalación y límites del respaldo. |

Las entregas se guardan en `respaldos/2026-10-09/`. El ZIP privado no se publica
en GitHub ni se adjunta a releases. Guarda una copia cifrada fuera del equipo.

## Problema detectado y solución

1. La web servía HTML/CSS/JavaScript, pero PHP y la API quedaban esperando.
2. Incluso un diagnóstico PHP independiente, sin conexión a la base, no respondía.
3. Después de reaplicar PHP 8.1 en MultiPHP Manager, PHP comenzó a responder.
   No se confirmó el motivo exacto del bloqueo inicial del hosting.
4. Apareció un error fatal en `api/Http/Router.php`, línea 82:
   `A never-returning function must not return`.
5. El router utilizaba una arrow function con retorno `never`, incompatible con
   PHP 8.1. Se sustituyó por una función anónima con cuerpo sin retorno implícito.
6. El diagnóstico confirmó conexión a la base de datos, extensiones requeridas,
   lectura del `.env`, permisos y presencia de los archivos actualizados.

Las comprobaciones previas del router se habían ejecutado con PHP 8.5, que no
detectó esa incompatibilidad. Después de encontrar el error se validó la API
con un runtime PHP 8.1 y se añadieron pruebas aisladas del router.

También se incorporaron límites de espera para conexión y bloqueos MySQL,
migración no bloqueante, límites SMTP, diagnóstico `/api.php/health`, validación
de respuestas CMS y aviso/reintento en el frontend. El paquete actualiza el hash
de `index.html` en `ngsw.json` tras configurar `/api.php`.

## Qué incluye y qué omite el respaldo

El ZIP del proyecto incluye el `.env` **que está en este equipo**, sin mostrarlo
en esta documentación. Su presencia no garantiza que coincida con el archivo
actual del servidor si después se han cambiado las contraseñas en cPanel.

Se omiten dependencias reinstalables (`node_modules`, `API/vendor`), builds,
cachés, `.git`, sesiones de herramientas, grabaciones, reportes temporales y
otros ZIP para evitar duplicaciones. Se conservan fuentes, imágenes públicas,
archivos de dependencias, esquema SQL, pruebas y herramientas de despliegue.

**Este respaldo no contiene un volcado de la base de datos de producción.**
La configuración de la conexión no es una copia de la base. En la carpeta local
de uploads no había imágenes de usuarios; hay que descargar las reales desde
`public_html/api/uploads/` y exportar la base desde phpMyAdmin para tener un
respaldo completo del contenido CMS, mensajes, usuarios y archivos.

## Restaurar el proyecto

1. Extrae `mattinnova-proyecto-privado.zip` en una carpeta privada.
2. Revisa `API/.env` localmente; nunca lo publiques ni lo ejecutes con `source`.
3. En `frontend/`, ejecuta `npm ci` (Node 20+ compatible con Angular 21).
4. En `API/`, ejecuta `composer install --no-dev`.
5. Para desarrollo local: `docker compose up --build`, y en `frontend/`, `npm start`.
   Docker usa su base y credenciales locales, no la base de producción del `.env`.
6. Para un nuevo paquete: `bash tools/build-cpanel.sh`.

## Subir el paquete a cPanel

1. Haz una copia del sitio y exporta la base antes de reemplazar archivos.
2. Conserva `public_html/api/.env`, `public_html/api/uploads/` y el bloque PHP
   generado por cPanel en el `.htaccess` anterior.
3. Extrae el ZIP de cPanel **directamente en `public_html/`**, sin carpeta contenedora.
   Es preferible reemplazar los archivos a borrar todo; no borres otras aplicaciones.
4. Si has borrado el sitio, restaura el `.env` del servidor y todos sus uploads.
   El backend utiliza `public_html/api/.env`; la API está en `/api.php`.
5. Mantén `APP_DEBUG=0` y `APP_SETUP=0`. No importes el esquema SQL sobre la base
   existente ni actives inicializaciones forzadas a ciegas.
6. Usa PHP 8.1+ y `pdo_mysql`, `gd`, `curl`, `openssl`, `mbstring`, `iconv`.
   Si sustituyes el handler del `.htaccess`, vuelve a aplicar la versión del dominio
   en MultiPHP Manager. No elijas PHP 7.2 aunque aparezca seleccionado por defecto.
7. `api/tmp/` y `api/uploads/` deben ser escribibles por PHP, sin permisos `777`.
8. Comprueba `https://mattinnovasolution.com/api.php/health`, JSON del sitio,
   navegación, acceso al panel y una edición/publicación controlada.
9. Prueba contacto y correo con un mensaje identificado. No uses reclamos ficticios.
10. Elimina `diagnostico.php` del servidor cuando termine la revisión.

Más detalle: [recuperación de cPanel](docs/CPANEL-RECUPERACION.md).

## GitHub y seguridad

Repositorio solicitado: <https://github.com/marranokun/MATT-INNOVA-SOLUTION>.
La versión se publica en `release/php81-compatibilidad-2026-10-09`, basada en
`origin/main` y con el árbol actual del proyecto, sin importar los commits locales
que añadieron un `.env`. `main` y las ramas anteriores no se sobrescriben.

Solo se publica código y documentación: no `.env`, uploads privados, dependencias
ni ZIP. La eliminación de un archivo de la versión actual no elimina secretos
del historial antiguo de otros repositorios. Cambia las contraseñas compartidas
y trata el respaldo privado como información sensible.

## Verificaciones y límites

- Build de producción de Angular correcto.
- 50 pruebas de frontend CMS aprobadas.
- Comprobaciones PHP del CMS y rutas aisladas aprobadas.
- Sintaxis API comprobada en PHP 8.1; router corregido en ambos paquetes.
- Hashes del service worker comprobados en el paquete de cPanel.
- En el hosting: PHP y conexión MySQL respondieron después de reaplicar PHP 8.1.
- La edición/publicación del CMS y la entrega SMTP en producción todavía requieren
  una comprobación funcional después de subir la versión corregida.
