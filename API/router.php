<?php
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$uri = rawurldecode($uri);
if (str_starts_with($uri, '/api/')) {
    $uri = substr($uri, 4);
}

if (preg_match('#^/uploads/([A-Za-z0-9._-]+)$#', $uri, $m)) {
    $file = __DIR__ . '/uploads/' . $m[1];
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
    return false;
}

require __DIR__ . '/index.php';
