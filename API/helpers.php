<?php
declare(strict_types=1);

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = [
        app_origin(),
        'http://localhost:4200',
        'http://127.0.0.1:4200',
    ];
    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=UTF-8');
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_out(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function route_path(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $uri = rawurldecode($uri);
    if (str_starts_with($uri, '/index.php')) {
        $uri = substr($uri, strlen('/index.php')) ?: '/';
    }
    if (str_starts_with($uri, '/api/')) {
        $uri = substr($uri, 4);
    } elseif ($uri === '/api') {
        $uri = '/';
    }
    return '/' . trim($uri, '/');
}

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('matt_admin');
    session_set_cookie_params([
        'lifetime' => 8 * 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => request_is_https(),
    ]);
    session_start();
}

function require_admin(): void
{
    start_admin_session();
    if (empty($_SESSION['admin_id'])) {
        json_out(['message' => 'Debes iniciar sesión'], 401);
    }
}

function public_base_url(): string
{
    return '/api';
}
