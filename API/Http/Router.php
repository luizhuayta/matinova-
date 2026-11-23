<?php
declare(strict_types=1);

function api_dispatch(string $method, string $path): void
{
    $exact = [
        'GET /sitemap.xml' => static fn () => handle_sitemap(),
        'POST /site/publish' => static function (): void {
            cms_write_guard(true);
            cms_doc_publish('sitio');
        },
        'GET /site' => static fn () => handle_site('GET'),
        'PUT /site' => static fn () => handle_site('PUT'),
        'GET /blocks' => static fn () => handle_blocks('GET'),
        'GET /messages' => static fn () => handle_messages('GET'),
        'POST /contacto' => static function (): void {
            rate_limit('contacto', 8, 600);
            handle_contacto();
        },
        'POST /accesibilidad' => static function (): void {
            rate_limit('accesibilidad', 8, 600);
            handle_accesibilidad();
        },
        'POST /reclamaciones' => static function (): void {
            rate_limit('reclamaciones', 6, 600);
            handle_reclamaciones();
        },
        'POST /bot' => static function (): void {
            rate_limit('bot', 20, 60);
            if (!defined('CHATBOT_AS_LIBRARY')) {
                define('CHATBOT_AS_LIBRARY', true);
            }
            require_once __DIR__ . '/../chatbot.php';
            handle_bot();
        },
        'POST /bot-ai' => static function (): void {
            rate_limit('bot-ai', 12, 60);
            handle_bot_ai();
        },
        'POST /admin/ai-config/test' => static fn () => handle_ai_test(),
        'GET /admin/ai-config' => static fn () => handle_ai_config('GET'),
        'PUT /admin/ai-config' => static fn () => handle_ai_config('PUT'),
    ];

    $key = $method . ' ' . $path;
    if (isset($exact[$key])) {
        $exact[$key]();
        return;
    }

    if (str_starts_with($path, '/auth')) {
        handle_auth($path, $method);
        return;
    }
    if (str_starts_with($path, '/pages')) {
        handle_pages($path, $method);
        return;
    }
    if (str_starts_with($path, '/redirects')) {
        handle_redirects($path, $method);
        return;
    }
    if (str_starts_with($path, '/webhooks')) {
        handle_webhooks($path, $method);
        return;
    }
    if (str_starts_with($path, '/media')) {
        handle_media($path, $method);
        return;
    }
    if (str_starts_with($path, '/uploads/')) {
        handle_upload_asset(substr($path, strlen('/uploads/')));
        return;
    }
    if (preg_match('#^/messages/(\d+)$#', $path, $messageMatch)) {
        handle_message_item((int) $messageMatch[1], $method);
        return;
    }
    // Rutas agregadoras con otros métodos (p. ej. POST /site, POST /admin/ai-config):
    // el propio handler responde 405 si el método no aplica. Sin duplicar entradas.
    $aggregate = match ($path) {
        // PHP 8.1 no permite el return implícito de una arrow function :never.
        '/site' => static function (string $m): never { handle_site($m); },
        '/blocks' => static function (string $m): void { handle_blocks($m); },
        '/admin/ai-config' => static function (string $m): void { handle_ai_config($m); },
        '/messages' => static function (string $m): void { handle_messages($m); },
        default => null,
    };
    if ($aggregate !== null) {
        $aggregate($method);
        return;
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}
