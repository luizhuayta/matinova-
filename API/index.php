<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = '/' . trim(route_path(), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Diagnóstico de solo lectura: no dispara seed ni migraciones.
if ($method === 'GET' && $path === '/health') {
    require_once __DIR__ . '/health.php';
    handle_health();
}

try {
    app_bootstrap_db();
} catch (Throwable $e) {
    error_log('[Matt Innova] DB bootstrap: ' . $e->getMessage());
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

if (cms_should_serve_spa($method)) {
    handle_spa_fallback();
}

try {
    api_dispatch($method, $path);
} catch (Throwable $e) {
    error_log('[Matt Innova] API ' . $method . ' ' . $path . ': ' . $e->getMessage());
    $payload = ['message' => 'Error interno'];
    if (app_debug()) {
        $payload['detail'] = $e->getMessage();
    }
    json_out($payload, 500);
}
