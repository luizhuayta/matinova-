<?php
declare(strict_types=1);

function db_migrate(): void
{
    $pdo = db();
    $statements = [
        "ALTER TABLE pages ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1",
        "ALTER TABLE pages ADD COLUMN draft LONGTEXT NULL",
        "ALTER TABLE site_settings ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1",
        "ALTER TABLE site_settings ADD COLUMN draft LONGTEXT NULL",
        "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'",
        "ALTER TABLE media ADD COLUMN width INT UNSIGNED NULL",
        "ALTER TABLE media ADD COLUMN height INT UNSIGNED NULL",
        "ALTER TABLE media ADD COLUMN variants TEXT NULL",
    ];
    foreach ($statements as $sql) {
        try {
            $pdo->exec($sql);
        } catch (PDOException $e) {
            $msg = strtolower($e->getMessage());
            if (!str_contains($msg, 'duplicate column')) {
                throw $e;
            }
        }
    }
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS revisions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(80) NOT NULL,
            author VARCHAR(80) NOT NULL DEFAULT '',
            snapshot LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_rev_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS preview_tokens (
            token VARCHAR(64) PRIMARY KEY,
            slug VARCHAR(80) NOT NULL,
            expires_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}
