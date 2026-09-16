<?php
declare(strict_types=1);

require __DIR__ . '/config.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/security.php';
require __DIR__ . '/sanitize.php';
require __DIR__ . '/cms-schema.php';
require __DIR__ . '/db.php';
require __DIR__ . '/migrate.php';
require __DIR__ . '/mailer.php';
require __DIR__ . '/seed.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/pages.php';
require __DIR__ . '/media.php';
require __DIR__ . '/messages.php';

cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    seed_database();
    db_migrate();
} catch (Throwable $e) {
    $payload = ['message' => 'No se pudo preparar la base de datos'];
    if (app_debug()) {
        $payload['detail'] = $e->getMessage();
    }
    json_out($payload, 500);
}

$path = route_path();
if ($path === '/') {
    $path = '';
}
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($path === '/sitemap.xml' && $method === 'GET') {
        handle_sitemap();
    }
    if (str_starts_with($path, '/auth')) {
        handle_auth($path, $method);
    }
    if ($path === '/site/publish' && $method === 'POST') {
        require_role('admin');
        require_csrf();
        rate_limit('cms_write', 40, 60);
        publish_document('sitio');
    }
    if ($path === '/site') {
        handle_site($method);
    }
    if (str_starts_with($path, '/pages')) {
        handle_pages($path, $method);
    }
    if (str_starts_with($path, '/media')) {
        handle_media($path, $method);
    }
    if ($path === '/messages') {
        handle_messages($method);
    }
    if ($path === '/contacto' && $method === 'POST') {
        rate_limit('contacto', 8, 600);
        handle_contacto();
    }
    if ($path === '/reclamaciones' && $method === 'POST') {
        rate_limit('reclamaciones', 6, 600);
        handle_reclamaciones();
    }
    if ($path === '/bot' && $method === 'POST') {
        rate_limit('bot', 20, 60);
        require __DIR__ . '/chatbot.php';
        exit;
    }
    json_out(['message' => 'Ruta no encontrada'], 404);
} catch (Throwable $e) {
    $payload = ['message' => 'Error interno'];
    if (app_debug()) {
        $payload['detail'] = $e->getMessage();
    }
    json_out($payload, 500);
}
