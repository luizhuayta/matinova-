<?php
declare(strict_types=1);

function handle_health(): never
{
    $extensions = [];
    foreach (['pdo_mysql', 'gd', 'curl', 'openssl', 'mbstring', 'iconv'] as $name) {
        $extensions[$name] = extension_loaded($name);
    }
    $checks = [
        'php' => PHP_VERSION_ID >= 80100,
        'extensions' => $extensions,
        'tmpWritable' => is_dir(__DIR__ . '/tmp') && is_writable(__DIR__ . '/tmp'),
        'uploadsWritable' => is_dir(__DIR__ . '/uploads') && is_writable(__DIR__ . '/uploads'),
        'mailerInstalled' => is_file(__DIR__ . '/vendor/autoload.php'),
        'database' => false,
        'schemaCurrent' => false,
    ];
    try {
        $checks['database'] = (int) db()->query('SELECT 1')->fetchColumn() === 1;
        $checks['schemaCurrent'] = app_schema_is_current();
    } catch (Throwable $e) {
        error_log('[Matt Innova] Health DB: ' . $e->getMessage());
    }
    $ok = $checks['php'] && !in_array(false, $extensions, true)
        && $checks['tmpWritable'] && $checks['uploadsWritable']
        && $checks['mailerInstalled'] && $checks['database'] && $checks['schemaCurrent'];
    json_out(['ok' => $ok, 'checks' => $checks], $ok ? 200 : 503);
}
