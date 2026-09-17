<?php
declare(strict_types=1);

function cms_dispatch_webhooks(string $event, array $payload): void
{
    try {
        $rows = db()->query('SELECT id, url, secret, events, active FROM webhooks WHERE active = 1')->fetchAll();
    } catch (Throwable) {
        return;
    }
    $body = json_encode(['event' => $event, 'at' => gmdate('c'), 'data' => $payload], JSON_UNESCAPED_UNICODE);
    foreach ($rows as $hook) {
        $events = array_filter(array_map('trim', explode(',', (string) ($hook['events'] ?? 'publish'))));
        if ($events && !in_array($event, $events, true) && !in_array('*', $events, true)) {
            continue;
        }
        cms_webhook_deliver((int) $hook['id'], $event, (string) $body, (string) $hook['url'], (string) $hook['secret'], 2);
    }
}

function cms_webhook_deliver(int $id, string $event, string $body, string $url, string $secret, int $tries = 1): array
{
    $lastError = '';
    $status = 'failed';
    $attempts = 0;
    for ($i = 0; $i < max(1, $tries); $i++) {
        $attempts++;
        $result = cms_webhook_http($url, $body, $secret);
        if ($result['ok']) {
            $status = 'ok';
            $lastError = '';
            break;
        }
        $lastError = $result['error'];
        if ($i + 1 < $tries) {
            usleep(150000);
        }
    }
    try {
        db()->prepare('INSERT INTO webhook_deliveries (webhook_id, event, payload, status, attempts, last_error) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$id, $event, $body, $status, $attempts, substr($lastError, 0, 255)]);
    } catch (Throwable) {
        /* log table may not exist yet */
    }
    return ['ok' => $status === 'ok', 'error' => $lastError, 'attempts' => $attempts];
}

function cms_webhook_http(string $url, string $body, string $secret): array
{
    if (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $url)) {
        return ['ok' => false, 'error' => 'URL inválida'];
    }
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'error' => 'curl no disponible'];
    }
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'User-Agent: MattInnova-CMS'];
    if ($secret !== '') {
        $headers[] = 'X-Matt-Signature: ' . cms_hmac_signature($body, $secret);
    }
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        return ['ok' => false, 'error' => $err !== '' ? $err : 'sin respuesta'];
    }
    if ($code < 200 || $code >= 300) {
        return ['ok' => false, 'error' => 'HTTP ' . $code];
    }
    return ['ok' => true, 'error' => ''];
}

function handle_webhooks(string $path, string $method): void
{
    if ($path === '/webhooks' && $method === 'GET') {
        require_role('admin');
        $rows = db()->query('SELECT id, url, events, active, created_at FROM webhooks ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['active'] = (int) $row['active'] === 1;
        }
        json_out(['items' => $rows]);
    }

    if ($path === '/webhooks' && $method === 'POST') {
        require_role('admin');
        require_csrf();
        $input = json_input();
        $url = trim((string) ($input['url'] ?? ''));
        if (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $url)) {
            json_out(['field' => 'url', 'message' => 'Indica una URL https://'], 400);
        }
        $secret = (string) ($input['secret'] ?? bin2hex(random_bytes(16)));
        $events = trim((string) ($input['events'] ?? 'publish'));
        $ins = db()->prepare('INSERT INTO webhooks (url, secret, events, active) VALUES (?, ?, ?, 1)');
        $ins->execute([$url, $secret, $events]);
        json_out(['ok' => true, 'id' => (int) db()->lastInsertId(), 'secret' => $secret], 201);
    }

    if (preg_match('#^/webhooks/(\d+)/test$#', $path, $m) && $method === 'POST') {
        require_role('admin');
        require_csrf();
        $id = (int) $m[1];
        $stmt = db()->prepare('SELECT id, url, secret FROM webhooks WHERE id = ?');
        $stmt->execute([$id]);
        $hook = $stmt->fetch();
        if (!$hook) {
            json_out(['message' => 'Webhook no encontrado'], 404);
        }
        $body = json_encode(['event' => 'test', 'at' => gmdate('c'), 'data' => ['ok' => true]], JSON_UNESCAPED_UNICODE);
        $result = cms_webhook_deliver((int) $hook['id'], 'test', (string) $body, (string) $hook['url'], (string) $hook['secret'], 1);
        json_out($result);
    }

    if (preg_match('#^/webhooks/(\d+)/deliveries$#', $path, $m) && $method === 'GET') {
        require_role('admin');
        $stmt = db()->prepare('SELECT id, event, status, attempts, last_error, created_at FROM webhook_deliveries WHERE webhook_id = ? ORDER BY id DESC LIMIT 40');
        $stmt->execute([(int) $m[1]]);
        json_out(['items' => $stmt->fetchAll()]);
    }

    if (preg_match('#^/webhooks/(\d+)$#', $path, $m) && $method === 'PATCH') {
        require_role('admin');
        require_csrf();
        $id = (int) $m[1];
        $stmt = db()->prepare('SELECT id FROM webhooks WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            json_out(['message' => 'Webhook no encontrado'], 404);
        }
        $input = json_input();
        $fields = [];
        $params = [];
        if (array_key_exists('url', $input)) {
            $url = trim((string) $input['url']);
            if (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $url)) {
                json_out(['field' => 'url', 'message' => 'Indica una URL https://'], 400);
            }
            $fields[] = 'url = ?';
            $params[] = $url;
        }
        if (array_key_exists('secret', $input) && (string) $input['secret'] !== '') {
            $fields[] = 'secret = ?';
            $params[] = (string) $input['secret'];
        }
        if (array_key_exists('events', $input)) {
            $fields[] = 'events = ?';
            $params[] = trim((string) $input['events']);
        }
        if (array_key_exists('active', $input)) {
            $fields[] = 'active = ?';
            $params[] = !empty($input['active']) ? 1 : 0;
        }
        if ($fields) {
            $params[] = $id;
            db()->prepare('UPDATE webhooks SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }
        json_out(['ok' => true]);
    }

    if (preg_match('#^/webhooks/(\d+)$#', $path, $m) && $method === 'DELETE') {
        require_role('admin');
        require_csrf();
        db()->prepare('DELETE FROM webhook_deliveries WHERE webhook_id = ?')->execute([(int) $m[1]]);
        db()->prepare('DELETE FROM webhooks WHERE id = ?')->execute([(int) $m[1]]);
        json_out(['ok' => true]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}
