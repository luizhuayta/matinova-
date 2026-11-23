<?php
declare(strict_types=1);

// Subir temporalmente como public_html/diagnostico.php. No usa el bootstrap CMS.
// No publica credenciales ni realiza escrituras/migraciones en la base de datos.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$api = __DIR__ . '/api';
$extensions = [];
foreach (['pdo_mysql', 'gd', 'curl', 'openssl', 'mbstring', 'iconv'] as $name) {
    $extensions[$name] = extension_loaded($name);
}
$files = [];
foreach (['index.php', 'config.php', 'db.php', 'bootstrap.php', 'health.php',
    'Domain/CmsContentMigrate.php', 'Domain/CmsImagePaths.php',
    'Repos/PagesRepository.php', 'Repos/RevisionsRepository.php',
    'Http/Router.php', 'vendor/autoload.php'] as $name) {
    $files[$name] = is_file($api . '/' . $name);
}
$index = @file_get_contents($api . '/index.php');
$migration = @file_get_contents($api . '/migrate.php');
$report = [
    'phpRunning' => true,
    'phpSupported' => PHP_VERSION_ID >= 80100,
    'extensions' => $extensions,
    'apiFiles' => $files,
    'envExists' => is_file($api . '/.env'),
    'envReadable' => is_readable($api . '/.env'),
    'tmpWritable' => is_dir($api . '/tmp') && is_writable($api . '/tmp'),
    'uploadsWritable' => is_dir($api . '/uploads') && is_writable($api . '/uploads'),
    'healthCodeUpdated' => is_string($index) && strpos($index, 'handle_health();') !== false,
    'migrationCodeUpdated' => is_string($migration) && strpos($migration, 'LOCK_NB') !== false,
];

if (($_GET['db'] ?? '') === '1') {
    $started = microtime(true);
    $report['database'] = ['ok' => false];
    try {
        if (!is_file($api . '/config.php')) {
            throw new RuntimeException('configuration_missing');
        }
        require_once $api . '/config.php';
        if (!extension_loaded('pdo_mysql')) {
            throw new RuntimeException('pdo_mysql_missing');
        }
        if (cfg('DB_NAME') === '' || cfg('DB_USER') === '' || cfg('DB_PASSWORD') === '') {
            throw new RuntimeException('database_configuration_missing');
        }
        // Comparar TCP con el socket de localhost solo cuando se pide expresamente.
        $host = ($_GET['tcp'] ?? '') === '1' ? '127.0.0.1' : cfg('DB_HOST', 'localhost');
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $host, cfg('DB_PORT', '3306'), cfg('DB_NAME'));
        $pdo = new PDO($dsn, cfg('DB_USER'), cfg('DB_PASSWORD'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $report['database']['ok'] = (int) $pdo->query('SELECT 1')->fetchColumn() === 1;
        $report['database']['connection'] = ($_GET['tcp'] ?? '') === '1' ? 'tcp' : 'configured_host';
    } catch (PDOException $e) {
        $code = (int) ($e->errorInfo[1] ?? 0);
        $reasons = [
            1044 => 'database_permission_denied',
            1045 => 'database_login_denied',
            1049 => 'database_not_found',
            2002 => 'database_unreachable_or_socket_missing',
            2003 => 'database_unreachable_or_socket_missing',
        ];
        $report['database']['reason'] = $reasons[$code] ?? 'database_connection_failed';
        $report['database']['code'] = $code;
        error_log('[Matt Innova] Standalone DB diagnostic: ' . $e->getMessage());
    } catch (Throwable $e) {
        $known = ['configuration_missing', 'pdo_mysql_missing', 'database_configuration_missing'];
        $report['database']['reason'] = in_array($e->getMessage(), $known, true)
            ? $e->getMessage() : 'diagnostic_failed';
        error_log('[Matt Innova] Standalone diagnostic: ' . $e->getMessage());
    }
    $report['database']['seconds'] = round(microtime(true) - $started, 3);
}

echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
