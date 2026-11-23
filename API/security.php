<?php
declare(strict_types=1);

function csrf_token(): string
{
    start_admin_session(false);
    if (!admin_session_ready()) {
        return '';
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf'];
}

function require_csrf(): void
{
    start_admin_session(false);
    $sent = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $expected = admin_session_ready() ? (string) ($_SESSION['csrf'] ?? '') : '';
    if ($expected === '' || $sent === '' || !hash_equals($expected, $sent)) {
        json_out(['message' => 'Token CSRF inválido'], 403);
    }
}

function client_ip(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    return preg_replace('/[^0-9a-fA-F:.]/', '', $ip) ?: '0.0.0.0';
}

function rate_limit(string $bucket, int $max, int $windowSeconds): void
{
    $dir = __DIR__ . '/tmp/ratelimit';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $key = preg_replace('/[^a-z0-9._-]/i', '_', $bucket . '_' . client_ip()) ?: 'ip';
    $file = $dir . '/' . $key . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string) file_get_contents($file), true) ?: [];
    }
    $hits = array_values(array_filter($hits, static fn ($t) => is_int($t) && $t > $now - $windowSeconds));
    if (count($hits) >= $max) {
        json_out(['message' => 'Demasiados intentos. Espera un momento.'], 429);
    }
    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
}

function admin_logged_in(): bool
{
    start_admin_session(false);
    return admin_session_ready() && !empty($_SESSION['admin_id']);
}

function admin_role(): string
{
    start_admin_session(false);
    if (!admin_session_ready()) {
        return '';
    }
    $role = (string) ($_SESSION['admin_role'] ?? '');
    if ($role !== '') {
        return $role;
    }
    if (empty($_SESSION['admin_id'])) {
        return '';
    }
    $stmt = db()->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([(int) $_SESSION['admin_id']]);
    $row = $stmt->fetch();
    $role = (string) ($row['role'] ?? 'admin');
    $_SESSION['admin_role'] = $role;
    return $role;
}

function require_role(string $need): void
{
    require_admin();
    if ($need === 'admin' && admin_role() !== 'admin') {
        json_out(['message' => 'No tienes permiso para esta acción'], 403);
    }
}

function app_debug(): bool
{
    return cfg('APP_DEBUG', '') === '1' || cfg('APP_DEBUG', '') === 'true';
}
