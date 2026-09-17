<?php
declare(strict_types=1);

const APP_SCHEMA_VERSION = 5;

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
        "ALTER TABLE pages ADD COLUMN path VARCHAR(200) NOT NULL DEFAULT ''",
        "ALTER TABLE pages ADD COLUMN show_in_menu TINYINT(1) NOT NULL DEFAULT 0",
        "ALTER TABLE pages ADD COLUMN menu_order INT NOT NULL DEFAULT 0",
        "ALTER TABLE messages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pendiente'",
        "ALTER TABLE messages ADD COLUMN mail_sent TINYINT(1) NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1",
        "ALTER TABLE pages ADD COLUMN locale VARCHAR(8) NOT NULL DEFAULT 'es'",
        "ALTER TABLE site_settings ADD COLUMN locale VARCHAR(8) NOT NULL DEFAULT 'es'",
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
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS app_secrets (
            k VARCHAR(80) PRIMARY KEY,
            v TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS redirects (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            from_path VARCHAR(200) NOT NULL UNIQUE,
            to_path VARCHAR(200) NOT NULL,
            status SMALLINT NOT NULL DEFAULT 301,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS webhooks (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            url VARCHAR(400) NOT NULL,
            secret VARCHAR(120) NOT NULL DEFAULT '',
            events VARCHAR(255) NOT NULL DEFAULT 'publish',
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS webhook_deliveries (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            webhook_id INT UNSIGNED NOT NULL,
            event VARCHAR(80) NOT NULL,
            payload LONGTEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            last_error VARCHAR(255) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_wh_hook (webhook_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    cms_migrate_composite_keys();
    cms_backfill_page_meta();
    cms_migrate_stored_documents();
    cms_backfill_site_chatbot();
    cms_backfill_clients_page();
}

function cms_migrate_composite_keys(): void
{
    $pdo = db();
    try {
        $keys = $pdo->query("SHOW KEYS FROM pages WHERE Key_name = 'PRIMARY'")->fetchAll();
        $cols = array_map(static fn ($row) => (string) $row['Column_name'], $keys);
        if ($cols === ['slug']) {
            $pdo->exec('ALTER TABLE pages DROP PRIMARY KEY, ADD PRIMARY KEY (slug, locale)');
        }
    } catch (Throwable) {
        /* already migrated or empty */
    }
    try {
        $fields = $pdo->query('SHOW COLUMNS FROM site_settings')->fetchAll();
        $names = array_column($fields, 'Field');
        if (in_array('id', $names, true)) {
            $pdo->exec("UPDATE site_settings SET locale = 'es' WHERE locale IS NULL OR locale = ''");
            try {
                $pdo->exec('ALTER TABLE site_settings DROP PRIMARY KEY');
            } catch (Throwable) {
            }
            try {
                $pdo->exec('ALTER TABLE site_settings ADD PRIMARY KEY (locale)');
            } catch (Throwable) {
            }
            try {
                $pdo->exec('ALTER TABLE site_settings DROP COLUMN id');
            } catch (Throwable) {
            }
        }
    } catch (Throwable) {
        /* already migrated */
    }
}

function cms_backfill_page_meta(): void
{
    $known = cms_known_page_paths();
    $rows = db()->query('SELECT slug, locale, path, menu_order FROM pages')->fetchAll();
    $upd = db()->prepare('UPDATE pages SET path = ?, menu_order = ? WHERE slug = ? AND locale = ?');
    $order = 10;
    foreach ($rows as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $path = (string) ($row['path'] ?? '');
        $menuOrder = (int) ($row['menu_order'] ?? 0);
        if ($path !== '' && $menuOrder > 0) {
            $order = max($order, $menuOrder + 10);
            continue;
        }
        $nextPath = $path !== '' ? $path : cms_page_path_for($slug, $known[$slug] ?? null);
        if ($menuOrder === 0) {
            $menuOrder = $order;
            $order += 10;
        }
        $upd->execute([$nextPath, $menuOrder, $slug, $locale]);
    }
}

function cms_migrate_stored_documents(): void
{
    $rows = db()->query('SELECT slug, locale, content, draft FROM pages')->fetchAll();
    $upd = db()->prepare('UPDATE pages SET content = ?, draft = ? WHERE slug = ? AND locale = ?');
    foreach ($rows as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $content = decode_json_col($row['content'] ?? '{}');
        $draft = decode_json_col($row['draft'] ?? '');
        $needsContent = (int) ($content['schemaVersion'] ?? 0) < CMS_SCHEMA_VERSION;
        $needsDraft = $draft !== [] && (int) ($draft['schemaVersion'] ?? 0) < CMS_SCHEMA_VERSION;
        if (!$needsContent && !$needsDraft) {
            continue;
        }
        if ($needsContent) {
            $content = migrate_cms_document($content, $slug);
        }
        $draftJson = $row['draft'] ?? null;
        if ($needsDraft) {
            $draftJson = json_encode(migrate_cms_document($draft, $slug), JSON_UNESCAPED_UNICODE);
        }
        $upd->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $slug, $locale]);
    }
    $sites = db()->query('SELECT locale, content, draft FROM site_settings')->fetchAll();
    $updSite = db()->prepare('UPDATE site_settings SET content = ?, draft = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $draft = decode_json_col($site['draft'] ?? '');
        $needsContent = (int) ($content['schemaVersion'] ?? 0) < CMS_SCHEMA_VERSION;
        $needsDraft = $draft !== [] && (int) ($draft['schemaVersion'] ?? 0) < CMS_SCHEMA_VERSION;
        if (!$needsContent && !$needsDraft) {
            continue;
        }
        if ($needsContent) {
            $content = migrate_cms_document($content, 'sitio');
        }
        $draftJson = $site['draft'] ?? null;
        if ($needsDraft) {
            $draftJson = json_encode(migrate_cms_document($draft, 'sitio'), JSON_UNESCAPED_UNICODE);
        }
        $updSite->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $locale]);
    }
}

function cms_backfill_site_chatbot(): void
{
    $sites = db()->query('SELECT locale, content, draft FROM site_settings')->fetchAll();
    $upd = db()->prepare('UPDATE site_settings SET content = ?, draft = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $draft = decode_json_col($site['draft'] ?? '');
        $next = migrate_cms_document($content, 'sitio');
        $draftNext = $draft === [] ? [] : migrate_cms_document($draft, 'sitio');
        if ($next === $content && $draftNext === $draft) {
            continue;
        }
        $draftJson = $site['draft'] ?? null;
        if ($draft !== [] && $draftNext !== $draft) {
            $draftJson = json_encode($draftNext, JSON_UNESCAPED_UNICODE);
        }
        $upd->execute([json_encode($next, JSON_UNESCAPED_UNICODE), $draftJson, $locale]);
    }
}

function cms_backfill_clients_page(): void
{
    if (!function_exists('cms_clients_page_document')) {
        require_once __DIR__ . '/clients-catalog.php';
    }
    $pdo = db();
    $doc = cms_clients_page_document();
    $payload = json_encode($doc, JSON_UNESCAPED_UNICODE);
    $path = cms_page_path_for('clientes');
    $check = $pdo->prepare('SELECT content FROM pages WHERE slug = ? AND locale = ?');
    $upd = $pdo->prepare('UPDATE pages SET title = ?, content = ?, path = ?, show_in_menu = 0 WHERE slug = ? AND locale = ?');
    $ins = $pdo->prepare('INSERT INTO pages (slug, locale, title, content, path, show_in_menu, menu_order) VALUES (?, ?, ?, ?, ?, 0, 80)');
    foreach (['es', 'en'] as $locale) {
        $check->execute(['clientes', $locale]);
        $row = $check->fetch();
        if (!$row) {
            if ($locale === 'es') {
                $ins->execute(['clientes', $locale, 'Clientes', $payload, $path]);
            }
            continue;
        }
        if ($locale !== 'es') {
            continue;
        }
        $content = decode_json_col($row['content'] ?? '{}');
        if (!cms_clients_content_is_placeholder($content)) {
            continue;
        }
        $upd->execute(['Clientes', $payload, $path, 'clientes', $locale]);
    }
}

function app_schema_is_current(): bool
{
    try {
        $stmt = db()->prepare("SELECT v FROM app_secrets WHERE k = 'schema_version'");
        $stmt->execute();
        $value = $stmt->fetchColumn();
        return $value !== false && (int) $value >= APP_SCHEMA_VERSION;
    } catch (Throwable) {
        return false;
    }
}

function app_set_schema_version(int $version): void
{
    $stmt = db()->prepare('INSERT INTO app_secrets (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    $stmt->execute(['schema_version', (string) $version]);
}

function app_bootstrap_db(): void
{
    $force = cfg('APP_SETUP', '0') === '1';
    if (!$force && app_schema_is_current()) {
        return;
    }
    $dir = __DIR__ . '/tmp';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $lockPath = $dir . '/setup.lock';
    $lock = @fopen($lockPath, 'c');
    if ($lock && !flock($lock, LOCK_EX)) {
        json_out(['message' => 'Preparando la base de datos. Reintenta en unos segundos.'], 503);
    }
    try {
        if (!$force && app_schema_is_current()) {
            return;
        }
        seed_database();
        db_migrate();
        app_set_schema_version(APP_SCHEMA_VERSION);
    } finally {
        if (is_resource($lock)) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

if (PHP_SAPI === 'cli' && isset($_SERVER['argv'][0]) && basename((string) $_SERVER['argv'][0]) === 'migrate.php') {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/helpers.php';
    require_once __DIR__ . '/sanitize.php';
    require_once __DIR__ . '/cms-schema.php';
    require_once __DIR__ . '/cms-doc.php';
    require_once __DIR__ . '/db.php';
    require_once __DIR__ . '/seed.php';
    seed_database();
    db_migrate();
    app_set_schema_version(APP_SCHEMA_VERSION);
    fwrite(STDOUT, "Migración lista (schema " . APP_SCHEMA_VERSION . ").\n");
}
