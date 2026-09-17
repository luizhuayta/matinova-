<?php
declare(strict_types=1);

function allowed_origins(): array
{
    $primary = app_origin();
    $list = [$primary, 'http://localhost:4200', 'http://127.0.0.1:4200'];
    $parts = parse_url($primary);
    if (!empty($parts['scheme']) && !empty($parts['host'])) {
        $host = (string) $parts['host'];
        $scheme = (string) $parts['scheme'];
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $altHost = str_starts_with($host, 'www.') ? substr($host, 4) : 'www.' . $host;
        $list[] = $scheme . '://' . $altHost . $port;
    }
    return array_values(array_unique(array_filter($list)));
}

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, allowed_origins(), true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-CMS-Locale');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=UTF-8');
}

function json_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_out(mixed $data, int $code = 200, array $headers = []): never
{
    http_response_code($code);
    $cache = $headers['Cache-Control'] ?? 'no-store';
    header('Cache-Control: ' . $cache);
    unset($headers['Cache-Control']);
    foreach ($headers as $name => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        header($name . ': ' . $value);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_out_public(mixed $data, ?string $updatedAt = null): never
{
    if (function_exists('admin_logged_in') && admin_logged_in()) {
        json_out($data);
    }
    $body = json_encode($data, JSON_UNESCAPED_UNICODE);
    $etag = '"' . sha1((string) $body) . '"';
    $ifNone = trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    $ifNone = preg_replace('/^W\//i', '', $ifNone) ?? $ifNone;
    $ifNone = trim($ifNone, " \t\"");
    $headers = [
        'Cache-Control' => 'public, max-age=30, must-revalidate',
        'ETag' => $etag,
    ];
    if (is_string($updatedAt) && $updatedAt !== '') {
        $headers['Last-Modified'] = gmdate('D, d M Y H:i:s', strtotime($updatedAt) ?: time()) . ' GMT';
    }
    if ($ifNone !== '' && hash_equals(trim($etag, '"'), $ifNone)) {
        http_response_code(304);
        header('Cache-Control: ' . $headers['Cache-Control']);
        header('ETag: ' . $etag);
        if (!empty($headers['Last-Modified'])) {
            header('Last-Modified: ' . $headers['Last-Modified']);
        }
        exit;
    }
    json_out($data, 200, $headers);
}

function cms_locales(): array
{
    return ['es', 'en'];
}

function cms_normalize_locale(?string $locale): string
{
    $value = strtolower(trim((string) $locale));
    return in_array($value, cms_locales(), true) ? $value : 'es';
}

function cms_request_locale(): string
{
    $fromQuery = cms_normalize_locale((string) ($_GET['locale'] ?? ''));
    if ((string) ($_GET['locale'] ?? '') !== '') {
        return $fromQuery;
    }
    $fromHeader = strtolower((string) ($_SERVER['HTTP_X_CMS_LOCALE'] ?? ''));
    if (in_array($fromHeader, cms_locales(), true)) {
        return $fromHeader;
    }
    return 'es';
}

function cms_public_path(string $path, string $locale = 'es'): string
{
    $normalized = $path === '' ? '/' : $path;
    if ($normalized !== '/' && !str_starts_with($normalized, '/')) {
        $normalized = '/' . $normalized;
    }
    $locale = cms_normalize_locale($locale);
    if ($locale === 'es') {
        return $normalized;
    }
    return $normalized === '/' ? '/en' : '/en' . $normalized;
}

function route_path(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $uri = rawurldecode($uri);
    if (str_starts_with($uri, '/api/index.php')) {
        $uri = substr($uri, strlen('/api/index.php')) ?: '/';
    } elseif (str_starts_with($uri, '/index.php')) {
        $uri = substr($uri, strlen('/index.php')) ?: '/';
    }
    if (str_starts_with($uri, '/api/')) {
        $uri = substr($uri, 4);
    } elseif ($uri === '/api') {
        $uri = '/';
    }
    if (str_starts_with($uri, '/index.php')) {
        $uri = substr($uri, strlen('/index.php')) ?: '/';
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

function cms_reserved_slugs(): array
{
    return ['admin', 'api', 'sitio', 'login', 'auth', 'media', 'messages', 'blocks', 'site', 'uploads', 'sitemap', 'pages', 'bot', 'bot-ai', 'en', 'es', 'redirects', 'webhooks'];
}

function cms_protected_slugs(): array
{
    return ['inicio', 'contacto', 'libro-reclamaciones', 'privacidad', 'terminos'];
}

function cms_valid_slug(string $slug): bool
{
    return (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) && strlen($slug) >= 2 && strlen($slug) <= 80;
}

function cms_slugify_title(string $title): string
{
    $slug = trim($title);
    $converted = function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) : false;
    $slug = strtolower((string) ($converted !== false && $converted !== '' ? $converted : $slug));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'pagina';
    }
    return substr($slug, 0, 80);
}

function cms_page_path_for(string $slug, ?string $path = null): string
{
    if (is_string($path) && $path !== '' && preg_match('#^/[a-z0-9\-/]*$#', $path)) {
        $trimmed = rtrim($path, '/');
        return $trimmed === '' ? '/' : $trimmed;
    }
    if ($slug === 'inicio') {
        return '/';
    }
    if (str_starts_with($slug, 'servicios-')) {
        return '/servicios/' . substr($slug, strlen('servicios-'));
    }
    return '/' . $slug;
}

function cms_known_page_paths(): array
{
    return [
        'inicio' => '/',
        'acerca-de' => '/acerca-de',
        'servicios' => '/servicios',
        'servicios-software' => '/servicios/software',
        'servicios-hardware' => '/servicios/hardware',
        'servicios-saas' => '/servicios/saas',
        'servicios-consultoria' => '/servicios/consultoria',
        'servicios-soluciones-ti' => '/servicios/soluciones-ti',
        'contacto' => '/contacto',
        'privacidad' => '/privacidad',
        'terminos' => '/terminos',
        'libro-reclamaciones' => '/libro-reclamaciones',
        'clientes' => '/clientes',
        'sitio' => '/',
    ];
}

function cms_hmac_signature(string $body, string $secret): string
{
    return 'sha256=' . hash_hmac('sha256', $body, $secret);
}
