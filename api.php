<?php
declare(strict_types=1);

/**
 * Frontal alternativo del API para cPanel.
 *
 * Responde a /api.php/<ruta> sin depender del .htaccess de la raíz
 * (algunos hostings lo regeneran sin las reglas de /api/, y entonces
 * /api/* devuelve el index.html de la SPA con 200 en vez de JSON).
 * Como api.php es un archivo real, los fallbacks de SPA (!-f) lo dejan
 * pasar en cualquier caso. Delega toda la lógica a api/index.php.
 *
 * Si algo falta en el servidor, responde JSON (nunca HTML) para que el
 * error se entienda sin acceso al servidor.
 */

header('Content-Type: application/json; charset=UTF-8');

if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    echo json_encode(['message' => 'Se requiere PHP 8.1 o superior en el servidor.']);
    exit;
}

$target = __DIR__ . '/api/index.php';
if (!is_file($target)) {
    http_response_code(500);
    echo json_encode(['message' => 'Falta la carpeta api/ en el servidor. Sube api/ junto a este archivo.']);
    exit;
}

$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$qPos = strpos($uri, '?');
$query = $qPos === false ? '' : substr($uri, $qPos);
$path = $qPos === false ? $uri : substr($uri, 0, $qPos);

if ($path === '/api.php' || $path === '/api.php/') {
    $path = '/';
} elseif (str_starts_with($path, '/api.php/')) {
    $path = substr($path, strlen('/api.php'));
}

// Reescribe a la forma que entiende API/index.php (route_path maneja /api/*).
$_SERVER['REQUEST_URI'] = '/api' . ($path === '/' ? '/' : $path) . $query;
$_SERVER['SCRIPT_NAME'] = '/api.php';

try {
    require $target;
} catch (Throwable $e) {
    error_log('[Matt Innova] API entrypoint: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'El API no pudo responder. Revisa api/.env y la base de datos.']);
    exit;
}
