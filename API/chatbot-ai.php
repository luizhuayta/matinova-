<?php
declare(strict_types=1);

function ai_default_config(): array
{
    return [
        'enabled' => false,
        'provider' => 'openrouter',
        'model' => 'openai/gpt-4o-mini',
        'baseUrl' => 'https://openrouter.ai/api/v1',
        'apiKey' => '',
    ];
}

function ai_provider_base_url(string $provider, string $custom = ''): string
{
    return match ($provider) {
        'deepseek' => 'https://api.deepseek.com/v1',
        'openrouter' => 'https://openrouter.ai/api/v1',
        default => rtrim($custom !== '' ? $custom : 'https://openrouter.ai/api/v1', '/'),
    };
}

function ai_public_config(array $cfg): array
{
    return [
        'enabled' => !empty($cfg['enabled']),
        'provider' => (string) ($cfg['provider'] ?? 'openrouter'),
        'model' => (string) ($cfg['model'] ?? ''),
        'baseUrl' => (string) ($cfg['baseUrl'] ?? ''),
        'keyConfigured' => trim((string) ($cfg['apiKey'] ?? '')) !== '',
    ];
}

function ai_is_ready(array $cfg): bool
{
    return !empty($cfg['enabled']) && trim((string) ($cfg['apiKey'] ?? '')) !== '';
}

function app_secret_get(string $key, string $default = ''): string
{
    $stmt = db()->prepare('SELECT v FROM app_secrets WHERE k = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if (!$row) {
        return $default;
    }
    return (string) $row['v'];
}

function app_secret_set(string $key, string $value): void
{
    $stmt = db()->prepare('INSERT INTO app_secrets (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    $stmt->execute([$key, $value]);
}

function ai_config_load(): array
{
    $cfg = ai_default_config();
    $cfg['enabled'] = app_secret_get('ai_enabled', '0') === '1';
    $provider = app_secret_get('ai_provider', $cfg['provider']);
    $cfg['provider'] = in_array($provider, ['openrouter', 'deepseek', 'custom'], true) ? $provider : 'openrouter';
    $cfg['model'] = app_secret_get('ai_model', $cfg['model']);
    $storedUrl = app_secret_get('ai_base_url', '');
    $cfg['baseUrl'] = $cfg['provider'] === 'custom'
        ? ai_provider_base_url('custom', $storedUrl)
        : ai_provider_base_url($cfg['provider']);
    $cfg['apiKey'] = app_secret_get('ai_api_key', '');
    return $cfg;
}

function ai_config_save(array $input): array
{
    $current = ai_config_load();
    $enabled = array_key_exists('enabled', $input) ? !empty($input['enabled']) : $current['enabled'];
    $provider = (string) ($input['provider'] ?? $current['provider']);
    if (!in_array($provider, ['openrouter', 'deepseek', 'custom'], true)) {
        json_out(['field' => 'provider', 'message' => 'Proveedor no válido.'], 400);
    }
    $model = trim((string) ($input['model'] ?? $current['model']));
    if ($model === '') {
        $model = $provider === 'deepseek' ? 'deepseek-chat' : 'openai/gpt-4o-mini';
    }
    $baseUrl = trim((string) ($input['baseUrl'] ?? $current['baseUrl']));
    if ($provider === 'custom' && $baseUrl === '') {
        json_out(['field' => 'baseUrl', 'message' => 'Indica la URL base del proveedor.'], 400);
    }
    $key = isset($input['apiKey']) ? trim((string) $input['apiKey']) : $current['apiKey'];
    if ($key === '********') {
        $key = $current['apiKey'];
    }
    app_secret_set('ai_enabled', $enabled ? '1' : '0');
    app_secret_set('ai_provider', $provider);
    app_secret_set('ai_model', $model);
    app_secret_set('ai_base_url', $baseUrl);
    if ($key !== '') {
        app_secret_set('ai_api_key', $key);
    }
    ai_sync_site_mode($enabled);
    return ai_config_load();
}

function ai_sync_site_mode(bool $enabled): void
{
    $row = db()->prepare('SELECT content, version FROM site_settings WHERE locale = ?');
    $row->execute(['es']);
    $row = $row->fetch();
    if (!$row) {
        return;
    }
    $content = json_decode((string) $row['content'], true);
    if (!is_array($content)) {
        $content = [];
    }
    $content['chatbotMode'] = $enabled ? 'ia' : 'clasico';
    $content['aiProvider'] = app_secret_get('ai_provider', 'openrouter');
    $content['aiModel'] = app_secret_get('ai_model', 'openai/gpt-4o-mini');
    $content['aiBaseUrl'] = app_secret_get('ai_base_url', 'https://openrouter.ai/api/v1');
    db()->prepare('UPDATE site_settings SET content = ?, version = version + 1 WHERE locale = ?')
        ->execute([json_encode($content, JSON_UNESCAPED_UNICODE), 'es']);
}

function chatbot_ai_context(): string
{
    $lines = [
        'Eres el asistente de Matt Innova Solution (MIS), empresa de soluciones TI en San Vicente de Cañete, Lima, Perú.',
        'Responde en español, breve, útil y claro. No inventes precios cerrados: da rangos orientativos y deriva a /contacto o WhatsApp +51 992 422 219.',
        'Cuando corresponda, incluye exactamente estas rutas internas (no inventes otras): /servicios, /servicios/software, /servicios/saas, /servicios/consultoria, /servicios/hardware, /servicios/soluciones-ti, /acerca-de, /clientes, /contacto, /libro-reclamaciones, /privacidad, /terminos.',
        'Clientes: la página /clientes muestra tres paneles (empresas y e-commerce, instituciones educativas y alianzas).',
        'Para reclamos, indica /libro-reclamaciones y libroreclamaciones@mattinnovasolution.com.',
        'Para contacto: contacto@mattinnovasolution.com y /contacto.',
        'Servicios: software a medida, SaaS, hardware, consultoría TI, soluciones TI, DSpace, ERP, hosting, MIS Academy.',
        'Hosting orientativo: Plan Start 2GB RAM; Business 8GB; Enterprise a medida.',
        'ERP MIS: módulos de ventas, inventario, financiero, RRHH y BI. Cotización según módulos y usuarios.',
        'Formato: puedes usar *negrita*. No uses HTML.',
    ];
    try {
        $rows = db()->query('SELECT slug, title, path, content FROM pages WHERE locale = \'es\'')->fetchAll();
        foreach ($rows as $row) {
            $slug = (string) $row['slug'];
            if ($slug === 'sitio' || $slug === 'privacidad' || $slug === 'terminos') {
                continue;
            }
            $content = json_decode((string) $row['content'], true);
            if (!is_array($content)) {
                continue;
            }
            $path = (string) ($row['path'] ?: '/' . $slug);
            $title = (string) ($row['title'] ?? $slug);
            $bits = ["Página {$title} ({$path})"];
            foreach (($content['blocks'] ?? []) as $block) {
                if (!is_array($block) || !empty($block['hidden'])) {
                    continue;
                }
                $props = is_array($block['props'] ?? null) ? $block['props'] : [];
                foreach (['title', 'text', 'label'] as $field) {
                    $value = trim((string) ($props[$field] ?? ''));
                    if ($value !== '') {
                        $bits[] = $value;
                    }
                }
            }
            $lines[] = implode('. ', array_slice($bits, 0, 6));
        }
    } catch (Throwable) {
        // El contexto CMS es opcional.
    }
    return implode("\n", array_slice($lines, 0, 40));
}

function chatbot_ai_call(array $cfg, string $message): array
{
    $url = rtrim((string) $cfg['baseUrl'], '/') . '/chat/completions';
    $payload = json_encode([
        'model' => $cfg['model'],
        'temperature' => 0.4,
        'max_tokens' => 500,
        'messages' => [
            ['role' => 'system', 'content' => chatbot_ai_context()],
            ['role' => 'user', 'content' => $message],
        ],
    ], JSON_UNESCAPED_UNICODE);
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $cfg['apiKey'],
        'HTTP-Referer: https://mattinnovasolution.com',
        'X-Title: Matt Innova Solution',
    ];
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'reply' => ''];
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($raw) || $code < 200 || $code >= 300) {
        return ['ok' => false, 'reply' => ''];
    }
    $data = json_decode($raw, true);
    $text = trim((string) ($data['choices'][0]['message']['content'] ?? ''));
    $text = trim(strip_tags($text));
    if ($text === '') {
        return ['ok' => false, 'reply' => ''];
    }
    if (strlen($text) > 4000) {
        $text = substr($text, 0, 4000) . '…';
    }
    return ['ok' => true, 'reply' => $text];
}

function handle_bot_ai(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    if (!defined('CHATBOT_AS_LIBRARY')) {
        define('CHATBOT_AS_LIBRARY', true);
    }
    require_once __DIR__ . '/chatbot.php';
    $input = json_input();
    $message = trim((string) ($input['message'] ?? $input['mensaje'] ?? ''));
    $cfg = ai_config_load();
    if (!ai_is_ready($cfg)) {
        $classic = chatbot_classic_result($message);
        json_out([
            'status' => 'success',
            'reply' => $classic['reply'],
            'links' => $classic['links'],
            'source' => 'classic',
            'fallback' => true,
        ]);
    }
    $ai = chatbot_ai_call($cfg, $message);
    if (empty($ai['ok'])) {
        json_out(['message' => 'IA no disponible', 'source' => 'ia'], 502);
    }
    $reply = (string) $ai['reply'];
    $links = chatbot_links_from_text($reply);
    if ($links === []) {
        $links = [chatbot_link('Contacto', '/contacto'), chatbot_link('Servicios', '/servicios')];
    }
    json_out([
        'status' => 'success',
        'reply' => $reply,
        'links' => $links,
        'source' => 'ia',
    ]);
}

function handle_ai_test(): void
{
    require_role('admin');
    require_csrf();
    if (!defined('CHATBOT_AS_LIBRARY')) {
        define('CHATBOT_AS_LIBRARY', true);
    }
    require_once __DIR__ . '/chatbot.php';
    $cfg = ai_config_load();
    if (!ai_is_ready($cfg)) {
        json_out(['ok' => false, 'message' => 'Activa la IA y guarda una clave antes de probar.'], 400);
    }
    $ai = chatbot_ai_call($cfg, 'Responde exactamente con la palabra ok.');
    if (empty($ai['ok'])) {
        json_out(['ok' => false, 'message' => 'No se pudo contactar al proveedor. Revisa clave, modelo y URL.'], 502);
    }
    json_out(['ok' => true, 'message' => 'Conexión correcta con el proveedor.']);
}

function handle_ai_config(string $method): void
{
    require_role('admin');
    if ($method === 'GET') {
        json_out(ai_public_config(ai_config_load()));
    }
    if ($method === 'PUT' || $method === 'POST') {
        require_csrf();
        $saved = ai_config_save(json_input());
        json_out(ai_public_config($saved));
    }
    json_out(['message' => 'Método no permitido'], 405);
}
