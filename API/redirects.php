<?php
declare(strict_types=1);

function cms_normalize_redirect_path(string $path): string
{
    $path = '/' . trim($path, '/');
    return $path === '/' ? '/' : rtrim($path, '/');
}

function cms_save_redirect(string $from, string $to, int $status = 301): void
{
    $from = cms_normalize_redirect_path($from);
    $to = cms_normalize_redirect_path($to);
    if ($from === $to || $from === '') {
        return;
    }
    db()->prepare('INSERT INTO redirects (from_path, to_path, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE to_path = VALUES(to_path), status = VALUES(status)')
        ->execute([$from, $to, $status]);
    db()->prepare('UPDATE redirects SET to_path = ? WHERE to_path = ? AND from_path <> ?')
        ->execute([$to, $from, $to]);
}

function cms_lookup_redirect(string $path): ?array
{
    $path = cms_normalize_redirect_path($path);
    $stmt = db()->prepare('SELECT from_path, to_path, status FROM redirects WHERE from_path = ? LIMIT 1');
    $stmt->execute([$path]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function handle_redirects(string $path, string $method): void
{
    if ($path === '/redirects/lookup' && $method === 'GET') {
        $from = (string) ($_GET['path'] ?? '');
        $row = cms_lookup_redirect($from);
        if (!$row) {
            json_out(['redirect' => null]);
        }
        json_out(['redirect' => ['from' => $row['from_path'], 'to' => $row['to_path'], 'status' => (int) $row['status']]]);
    }

    if ($path === '/redirects' && $method === 'GET') {
        require_admin();
        $rows = db()->query('SELECT id, from_path, to_path, status, created_at FROM redirects ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['status'] = (int) $row['status'];
        }
        json_out(['items' => $rows]);
    }

    if ($path === '/redirects' && $method === 'POST') {
        require_role('admin');
        require_csrf();
        $input = json_input();
        $from = cms_normalize_redirect_path((string) ($input['from'] ?? $input['from_path'] ?? ''));
        $to = cms_normalize_redirect_path((string) ($input['to'] ?? $input['to_path'] ?? ''));
        if ($from === '/' || $to === '') {
            json_out(['message' => 'Indica origen y destino.'], 400);
        }
        cms_save_redirect($from, $to);
        json_out(['ok' => true]);
    }

    if (preg_match('#^/redirects/(\d+)$#', $path, $m) && $method === 'DELETE') {
        require_role('admin');
        require_csrf();
        db()->prepare('DELETE FROM redirects WHERE id = ?')->execute([(int) $m[1]]);
        json_out(['ok' => true]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}

function handle_spa_fallback(): void
{
    $raw = (string) ($_GET['cms_path'] ?? '');
    $path = cms_normalize_redirect_path($raw === '' ? '/' : $raw);
    $row = cms_lookup_redirect($path);
    if ($row) {
        $dest = (string) $row['to_path'];
        $status = (int) ($row['status'] ?? 301);
        header('Location: ' . $dest, true, $status >= 300 && $status < 400 ? $status : 301);
        exit;
    }
    $candidates = [
        dirname(__DIR__) . '/index.html',
        __DIR__ . '/../frontend/dist/frontend/browser/index.html',
        __DIR__ . '/../index.html',
    ];
    foreach ($candidates as $file) {
        if (is_file($file)) {
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: no-store');
            readfile($file);
            exit;
        }
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found';
    exit;
}
