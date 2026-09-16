<?php
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = cfg('DB_HOST', '127.0.0.1');
    $port = cfg('DB_PORT', '3306');
    $name = cfg('DB_NAME', 'mattinnova_cms');
    $user = cfg('DB_USER', 'matt');
    $pass = cfg('DB_PASSWORD', 'mattlocal');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $last = null;
    for ($i = 0; $i < 30; $i++) {
        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $pdo;
        } catch (PDOException $e) {
            $last = $e;
            sleep(1);
        }
    }
    throw $last ?? new RuntimeException('No se pudo conectar a MariaDB');
}

function db_init(): void
{
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    if ($sql === false) {
        return;
    }
    $pdo = db();
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        if ($stmt !== '') {
            $pdo->exec($stmt);
        }
    }
}
