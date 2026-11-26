# Publicar y comprobar en cPanel

El paquete se genera con `bash tools/build-cpanel.sh`. No incluye contraseñas,
`.env` ni los archivos de usuarios de `api/uploads/`.

## Antes de subir

1. Haz una copia de `public_html/` y exporta la base desde phpMyAdmin.
2. Conserva `public_html/api/.env` y `public_html/api/uploads/`.
3. Selecciona PHP 8.1+ con `pdo_mysql`, `gd`, `curl`, `openssl`, `mbstring`, `iconv`.
4. Cambia las claves que hayas compartido en conversaciones. Los usuarios que ya
   existen en el CMS conservan su contraseña: cambiar `ADMIN_PASSWORD` en `.env`
   no equivale a cambiar la contraseña de un usuario existente; usa el panel.

## Subida

Sube **el contenido de `dist-upload/`**, no la carpeta contenedora, a `public_html/`.
Incluye los archivos ocultos `.htaccess` de la raíz, `api/`, `api/tmp/` y
`api/uploads/`. Conserva `api/tmp/`, `api/uploads/` y el `.env` existente.
Después de subir el paquete, deja `APP_SETUP=0` en el `.env`.

**Conserva también el bloque PHP propio del hosting** si cPanel lo añadió al
`.htaccess` anterior (`cPanel-generated handler` / `AddHandler` / `SetHandler`).
No copies un handler de otro servidor. Tras sustituir `.htaccess`, entra en
**MultiPHP Manager / Select PHP Version**, selecciona el dominio y aplica PHP
8.1+ de nuevo para que cPanel regenere su configuración correcta. Si ni un PHP
independiente responde, revisar/restablecer ese handler y el servicio PHP-FPM
con el hosting tiene prioridad sobre modificar Angular o la base de datos.

El `.env` debe estar exactamente en `public_html/api/.env`. Utiliza el origen
`https://mattinnovasolution.com`, `APP_DEBUG=0`, `APP_SETUP=0`, host de base
`localhost`, puerto `3306`, y los nombres reales de base/usuario de cPanel.
Escribe una variable por línea, sin comillas. El lector conserva `$`, `#`, `;`
y otros caracteres dentro de los valores; no ejecutes este archivo con `source`.

Asigna el usuario a la base en **MySQL Databases** con los permisos necesarios
para crear tablas, alterar el esquema y leer/escribir datos. `api/tmp/` y
`api/uploads/` deben ser escribibles por PHP. No utilices permisos `777`.

## Diagnóstico sin migraciones

Abre `https://mattinnovasolution.com/api.php/health`.

- `database: false`: comprueba host, usuario, clave y asignación a la base.
- `schemaCurrent: false`: falta el esquema o una migración no se ha completado.
- `tmpWritable: false` / `uploadsWritable: false`: corrige propiedad y permisos.
- `mailerInstalled: false`: falta `api/vendor/` del paquete.
- Extensión `false`: actívala en el selector PHP.

Este endpoint es de solo lectura y no muestra claves. Devuelve 503 si alguna
comprobación falla. Si también se queda esperando, revisa **Errors**, los logs
de PHP y los recursos/procesos del hosting: desde el código no se puede reparar
un servicio PHP/MySQL detenido o saturado.

### Si health tampoco responde

Usa temporalmente `tools/cpanel-diagnostico.php`, subiéndolo como
`public_html/diagnostico.php`:

1. `/diagnostico.php`: comprueba PHP y los archivos instalados sin cargar el CMS
   ni abrir la base. Si no responde, revisar PHP/handler/FPM/recursos con el hosting.
2. `/diagnostico.php?db=1`: conexión de solo lectura con el `.env` real; no ejecuta
   seed ni migraciones. Devuelve un motivo genérico, nunca contraseñas.
3. Solo si la conexión con `localhost` falla por socket, comparar con
   `/diagnostico.php?db=1&tcp=1`. No cambiar el host sin ver el resultado y confirmar
   que MySQL está en el mismo servidor.

Los indicadores `healthCodeUpdated` y `migrationCodeUpdated` ayudan a detectar
si se actualizó el frontend pero quedaron archivos antiguos en `api/`.
Elimina `diagnostico.php` cuando termines la revisión.

## Esquema y migraciones

Las peticiones normales a `/api.php/site?locale=es` aplican las migraciones
pendientes con `APP_SETUP=0`. MariaDB registra cada migración de contenido y la
versión de instalación completada. Si otro proceso está migrando, la API devuelve
503 con `Retry-After`. Si necesitas importar SQL sobre una base existente, haz una
copia de seguridad y revisa su estado antes de importarlo.

## Verificación final

1. `/api.php/health`: `ok: true`.
2. `/api.php/site?locale=es` y `/api.php/pages?locale=es`: JSON, no HTML.
3. `/`, `/contacto`, `/servicios`, `/en`: contenido y enlaces correctos.
4. `/admin`: iniciar sesión, editar y publicar una modificación controlada.
5. Chatbot: consultar servicios y contacto.
6. Formulario de contacto: enviar una prueba identificada y comprobar registro
   en el CMS, recepción y copia al remitente. Revisar SMTP si el registro existe
   pero el correo no llega. No enviar reclamos ficticios para probar.

Si ves una versión anterior, prueba una ventana privada. Si funciona allí,
elimina los datos del sitio/service worker del navegador antiguo y recarga.
El empaquetado actualiza el hash de `index.html` en `ngsw.json` después de
configurar `/api.php`, para que el service worker acepte el paquete nuevo.
