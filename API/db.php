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
    $pass = cfg('DB_PASSWORD', '');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $retries = in_array($host, ['db', 'mysql', 'mariadb'], true) ? 30 : 1;
    $last = null;
    for ($i = 0; $i < $retries; $i++) {
        try {
            $connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            // Evita que un ALTER o una fila bloqueada deje todas las peticiones esperando.
            $connection->exec('SET SESSION lock_wait_timeout = 10');
            $connection->exec('SET SESSION innodb_lock_wait_timeout = 10');
            $pdo = $connection;
            return $pdo;
        } catch (PDOException $e) {
            $last = $e;
            if ($i < $retries - 1) {
                sleep(1);
            }
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
