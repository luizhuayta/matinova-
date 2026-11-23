<?php
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$uri = rawurldecode($uri);
if (str_starts_with($uri, '/api/')) {
    $uri = substr($uri, 4);
}

if (!function_exists('cms_media_ensure_variant')) {
    require_once __DIR__ . '/bootstrap.php';
}

if (preg_match('#^/uploads/((?:originals|history)/)?([A-Za-z0-9._-]+)$#', $uri, $m)) {
    $file = __DIR__ . '/uploads/' . ($m[1] ?? '') . $m[2];
    if (!is_file($file) && ($m[1] ?? '') === '' && preg_match('#^([A-Za-z0-9]{16})-(480|960)\.(webp|jpe?g)$#i', $m[2], $v)) {
        $made = cms_media_ensure_variant(strtolower($v[1]), (int) $v[2], strtolower($v[3]));
        if (is_string($made)) {
            $file = $made;
        }
    }
    if (is_file($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, ['php', 'phtml', 'phar', 'cgi', 'pl'], true)) {
            http_response_code(403);
            exit;
        }
        $mime = match ($ext) {
            'webp' => 'image/webp',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            default => 'application/octet-stream',
        };
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($file);
        exit;
    }
}

$file = __DIR__ . $uri;
if ($uri !== '/' && is_file($file) && !str_ends_with($uri, '.php')) {
    // Nunca servir secretos ni internos del dev-server (Apache los bloquea en .htaccess).
    $base = strtolower(basename($uri));
    $blocked = $base === '.env' || str_starts_with($base, '.env.')
        || str_ends_with($uri, '.sql') || str_ends_with($uri, '.log') || str_ends_with($uri, '.md')
        || str_contains($uri, '/tmp/') || str_contains($uri, '/tests/') || str_contains($uri, '/vendor/');
    if ($blocked) {
        http_response_code(404);
        exit;
    }
    return false;
}

require __DIR__ . '/index.php';
