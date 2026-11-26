<?php
declare(strict_types=1);

const APP_SCHEMA_VERSION = 15;
const APP_V15_DATA_MIGRATIONS = [
    'fix_en_untranslated_v15' => 'cms_fix_en_untranslated_v15',
    'fix_duplicate_video_v15' => 'cms_fix_duplicate_video_v15',
    'merge_consulting_cards_v15' => 'cms_merge_consulting_cards_v15',
];

function db_migrate_schema(): void
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
        "ALTER TABLE revisions ADD COLUMN locale VARCHAR(8) NOT NULL DEFAULT 'es'",
        "ALTER TABLE media ADD COLUMN parent_id INT UNSIGNED NULL",
        "ALTER TABLE media ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'upload'",
        "ALTER TABLE media ADD COLUMN original_stored VARCHAR(255) NULL",
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
    // Tickets únicos (trazabilidad del libro): solo si no hay duplicados previos.
    try {
        $dupes = (int) $pdo->query("SELECT COUNT(*) - COUNT(DISTINCT ticket) FROM messages WHERE ticket IS NOT NULL")->fetchColumn();
        if ($dupes === 0) {
            $pdo->exec("ALTER TABLE messages ADD UNIQUE KEY uq_messages_ticket (ticket)");
        } else {
            error_log("messages.ticket tiene $dupes duplicados: no se creó el índice único.");
        }
    } catch (PDOException $e) {
        $msg = strtolower($e->getMessage());
        if (!str_contains($msg, 'duplicate')) {
            throw $e;
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
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS media_versions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            media_id INT UNSIGNED NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            url VARCHAR(400) NOT NULL,
            mime VARCHAR(80) NOT NULL,
            size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
            width INT UNSIGNED NULL,
            height INT UNSIGNED NULL,
            reason VARCHAR(20) NOT NULL DEFAULT 'crop',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_media_versions_media (media_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    cms_migrate_composite_keys();
}

function db_migrate_content(int $previousVersion, bool $fresh): void
{
    require_once __DIR__ . '/Domain/CmsContentMigrate.php';
    require_once __DIR__ . '/Domain/CmsImagePaths.php';
    require_once __DIR__ . '/Domain/CmsPlaceholderContact.php';
    $legacy = [
        'page_meta' => 'cms_backfill_page_meta',
        'stored_documents' => 'cms_migrate_stored_documents',
        'site_chatbot' => 'cms_backfill_site_chatbot',
        'splash_defaults' => 'cms_migrate_splash_defaults',
        'clients_page' => 'cms_backfill_clients_page',
        'public_redesign' => 'cms_public_redesign_migrate',
        'home_editorial_copy' => 'cms_home_editorial_copy_migrate',
        'studio_polish' => 'cms_studio_polish_migrate',
        'social_proof_hide' => 'cms_social_proof_hide_migrate',
        'studio_sitewide' => static function (): void {
            if (cms_content_overwrite_enabled()) {
                cms_studio_sitewide_migrate();
            }
        },
        'stored_public_images' => 'cms_rewrite_stored_public_images',
    ];
    foreach ($legacy as $name => $migration) {
        // Las instalaciones de v14 ya tienen sus propias ediciones. Una base
        // nueva parte de los seeds actuales y tampoco necesita las copias antiguas.
        cms_run_migration_once($name, $previousVersion >= 14 || $fresh ? null : $migration);
    }
    cms_run_migration_once('fix_placeholder_contact', 'cms_fix_placeholder_contact');
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

function cms_migrate_splash_defaults(): void
{
    $sites = db()->query('SELECT locale, content, draft FROM site_settings')->fetchAll();
    $upd = db()->prepare('UPDATE site_settings SET content = ?, draft = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $draft = decode_json_col($site['draft'] ?? '');
        $next = cms_apply_splash_defaults($content, $locale);
        $draftNext = $draft === [] ? [] : cms_apply_splash_defaults($draft, $locale);
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

function cms_emoji_icon_map(): array
{
    return [
        '🎯' => 'bi-calendar3',
        '👥' => 'bi-people',
        '🏆' => 'bi-award',
        '💼' => 'bi-briefcase',
        '💡' => 'bi-lightbulb',
        '💊' => 'bi-capsule',
        '🏥' => 'bi-hospital',
        '🚗' => 'bi-car-front',
        '🛠️' => 'bi-tools',
        '💻' => 'bi-laptop',
        '🌡️' => 'bi-thermometer',
        '⚡' => 'bi-lightning',
        '🌐' => 'bi-globe',
        '🖥️' => 'bi-display',
        '🔬' => 'bi-intersect',
        '🦌' => '',
        '👔' => 'bi-bag',
        '🪑' => 'bi-house',
        '👗' => 'bi-bag',
        '👟' => 'bi-bag',
        '🎨' => 'bi-palette',
        '🌾' => 'bi-flower1',
        '🔧' => 'bi-wrench',
        '🔨' => 'bi-hammer',
        '🍜' => 'bi-cup-hot',
        '🎓' => 'bi-mortarboard',
        '⚖️' => 'bi-bank',
        '🏢' => 'bi-building',
        '🏛️' => 'bi-bank',
        '🏠' => 'bi-house',
        '🎬' => 'bi-camera-reels',
        '✈️' => 'bi-airplane',
        '🏫' => 'bi-building',
        '🏨' => 'bi-building',
    ];
}

function cms_default_copy_replacements(): array
{
    return [
        'SOLUCIONES TI QUE TRANSFORMAN' => 'Soluciones TI que transforman',
        'INNOVACIÓN EN TECNOLOGÍA' => '',
        'NUESTRO EQUIPO' => '',
        'CLIENTES SATISFECHOS' => '',
        'QUIENES SOMOS' => '',
        'QUÉ HACEMOS' => '',
        'SERVICIOS INNOVADORES' => '',
        'ACERCA DE NOSOTROS' => '',
        'NOVEDADES' => '',
        'CONOCE NUESTROS' => '',
        'SERVICIO' => 'Servicio',
        'RAZONES POR LAS CUALES' => '',
        'PONERSE EN CONTACTO' => '',
        'Enlaces Rápidos' => 'Enlaces rápidos',
        'Enlaces Populares' => 'Enlaces populares',
        'Ponerse en Contacto' => 'Contacto',
        '¡Escríbenos ahora!' => 'Escríbenos ahora',
        'Debes Elegirnos' => 'Por qué elegirnos',
    ];
}

function cms_scrub_public_value(mixed &$value, string $key = ''): void
{
    if (is_array($value)) {
        foreach ($value as $childKey => &$child) {
            cms_scrub_public_value($child, is_string($childKey) ? $childKey : $key);
        }
        unset($child);
        return;
    }
    if (!is_string($value)) {
        return;
    }
    $replacements = cms_default_copy_replacements();
    if (isset($replacements[$value])) {
        $value = $replacements[$value];
    }
    $lower = strtolower($key);
    if ($lower === 'icon') {
        $map = cms_emoji_icon_map();
        if (isset($map[$value])) {
            $value = $map[$value];
            return;
        }
        if (preg_match('/[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]/u', $value)) {
            $value = '';
        }
        return;
    }
    if (in_array($lower, ['url', 'href', 'link', 'linkedin', 'github', 'ctalink', 'heroctalink', 'academyurl'], true)) {
        if (function_exists('cms_public_href')) {
            $value = cms_public_href($value);
        } elseif ($value === '#' || preg_match('/\.(xyz|website)(\/|$|\?)/i', $value) || stripos($value, 'makitoolsporu') !== false) {
            $value = '';
        }
    }
}

function cms_ensure_contacto_support(array $content, string $locale): array
{
    $blocks = $content['blocks'] ?? [];
    if (!is_array($blocks)) {
        return $content;
    }
    $types = [];
    foreach ($blocks as $block) {
        if (is_array($block) && isset($block['type'])) {
            $types[] = $block['type'];
        }
    }
    $extras = cms_contacto_support_blocks($locale);
    foreach ($extras as $extra) {
        if (!in_array($extra['type'] ?? '', $types, true)) {
            $blocks[] = $extra;
        }
    }
    $content['blocks'] = $blocks;
    return $content;
}

function cms_public_redesign_migrate(): void
{
    if (!function_exists('cms_public_href')) {
        require_once __DIR__ . '/clients-catalog.php';
    }
    if (!function_exists('seed_english_locale')) {
        require_once __DIR__ . '/seed.php';
    }
    $pdo = db();
    $pages = $pdo->query('SELECT slug, locale, content, draft FROM pages')->fetchAll();
    $upd = $pdo->prepare('UPDATE pages SET content = ?, draft = ? WHERE slug = ? AND locale = ?');
    foreach ($pages as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $content = decode_json_col($row['content'] ?? '{}');
        $draft = decode_json_col($row['draft'] ?? '');
        cms_scrub_public_value($content);
        if ($draft !== []) {
            cms_scrub_public_value($draft);
        }
        if ($slug === 'contacto') {
            $content = cms_ensure_contacto_support($content, $locale);
            if ($draft !== []) {
                $draft = cms_ensure_contacto_support($draft, $locale);
            }
        }
        $draftJson = $row['draft'] ?? null;
        if ($draft !== []) {
            $draftJson = json_encode($draft, JSON_UNESCAPED_UNICODE);
        }
        $upd->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $slug, $locale]);
    }
    $sites = $pdo->query('SELECT locale, content, draft FROM site_settings')->fetchAll();
    $updSite = $pdo->prepare('UPDATE site_settings SET content = ?, draft = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $draft = decode_json_col($site['draft'] ?? '');
        cms_scrub_public_value($content);
        if ($draft !== []) {
            cms_scrub_public_value($draft);
        }
        $draftJson = $site['draft'] ?? null;
        if ($draft !== []) {
            $draftJson = json_encode($draft, JSON_UNESCAPED_UNICODE);
        }
        $updSite->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $locale]);
    }
    seed_english_locale();
}

function cms_home_editorial_copy_migrate(): void
{
    if (!function_exists('pages_seed')) {
        require_once __DIR__ . '/seed.php';
    }
    if (!function_exists('migrate_cms_document')) {
        require_once __DIR__ . '/cms-schema.php';
    }
    $pdo = db();
    $stmt = $pdo->prepare("SELECT content FROM pages WHERE slug = 'inicio' AND locale = 'es'");
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row) {
        return;
    }
    $content = decode_json_col($row['content'] ?? '{}');
    $firstTitle = '';
    foreach (($content['blocks'] ?? []) as $block) {
        if (!is_array($block) || ($block['type'] ?? '') !== 'hero') {
            continue;
        }
        $slides = $block['props']['slides'] ?? [];
        $firstTitle = (string) ($slides[0]['title'] ?? '');
        break;
    }
    $legacy = [
        'Soluciones TI que Transforman para tu empresa',
        'Soluciones TI que Transforman para tu empresa.',
    ];
    if (!in_array($firstTitle, $legacy, true)) {
        return;
    }
    $pages = pages_seed();
    $fresh = migrate_cms_document($pages['inicio']['content'] ?? [], 'inicio');
    $upd = $pdo->prepare('UPDATE pages SET content = ? WHERE slug = ? AND locale = ?');
    $upd->execute([json_encode($fresh, JSON_UNESCAPED_UNICODE), 'inicio', 'es']);
}

function cms_studio_polish_migrate(): void
{
    if (!function_exists('cms_studio_faq_items')) {
        require_once __DIR__ . '/cms-schema.php';
    }
    if (!function_exists('cms_make_block')) {
        require_once __DIR__ . '/blocks.php';
    }
    $pdo = db();
    $upd = $pdo->prepare('UPDATE pages SET content = ? WHERE slug = ? AND locale = ?');
    $rows = $pdo->query("SELECT slug, locale, content FROM pages WHERE slug IN ('inicio','contacto')")->fetchAll();
    $serviceSeeds = [
        'es' => pages_seed()['inicio']['content']['services'],
        'en' => pages_seed_en()['inicio']['content']['services'],
    ];
    $spanishContacts = [];
    foreach ($rows as $row) {
        if ($row['locale'] === 'es') {
            $doc = json_decode((string) $row['content']);
            $spanishContacts[$row['slug']] = $doc instanceof stdClass
                ? cms_document_contact_items($doc, (string) $row['slug'])
                : [];
        }
    }
    foreach ($rows as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $content = decode_json_col($row['content'] ?? '{}');
        $blocks = $content['blocks'] ?? [];
        if (!is_array($blocks)) {
            continue;
        }
        $faq = cms_studio_faq_items($locale);
        $hasFaq = false;
        foreach ($blocks as $i => $block) {
            if (!is_array($block)) {
                continue;
            }
            $type = (string) ($block['type'] ?? '');
            $props = is_array($block['props'] ?? null) ? $block['props'] : [];
            if ($type === 'hero' && $slug === 'inicio') {
                $title = $locale === 'en'
                    ? 'IT implementations with real follow-through, not promises.'
                    : 'Implementaciones TI con seguimiento real, no promesas.';
                $subtitle = $locale === 'en'
                    ? '30 years integrating software, hardware and operations for companies and schools in Peru. Migrations, ERPs, networks and 24/7 support.'
                    : '30 años integrando software, hardware y operación para empresas y entidades educativas en Perú. Migraciones, ERPs, redes y soporte 24/7.';
                $slides = $props['slides'] ?? [];
                if (!is_array($slides) || $slides === []) {
                    $slides = [['badge' => '', 'title' => $title, 'image' => 'assets/illustrations/hero.svg']];
                }
                foreach ($slides as $s => $slide) {
                    if (!is_array($slide)) {
                        continue;
                    }
                    $slides[$s]['title'] = $title;
                    $slides[$s]['image'] = 'assets/illustrations/hero.svg';
                }
                $props['slides'] = $slides;
                $props['subtitle'] = $subtitle;
                $props['cta'] = $locale === 'en' ? 'View services' : 'Ver servicios';
                $props['ctaLink'] = '/servicios';
            }
            if ($type === 'about' && $slug === 'inicio') {
                $img = (string) ($props['image'] ?? '');
                if ($img === '' || str_contains($img, 'about-image') || str_contains($img, 'carousel')) {
                    $props['image'] = 'assets/illustrations/why-us.svg';
                    $props['imageAlt'] = $locale === 'en'
                        ? 'Isometric illustration of IT operations between sites'
                        : 'Operación TI entre sedes, ilustración isométrica';
                }
            }
            if ($type === 'contactCards' && $locale === 'en') {
                $items = is_array($props['items'] ?? null) ? $props['items'] : [];
                $props['items'] = cms_fill_english_contact_items($items, $spanishContacts[$slug] ?? []);
            }
            if ($type === 'services' && $slug === 'inicio') {
                $props['title'] = $serviceSeeds[$locale]['title'];
                $props['cards'] = $serviceSeeds[$locale]['cards'];
            }
            if ($type === 'innovative') {
                $items = $props['items'] ?? [];
                if (is_array($items)) {
                    foreach ($items as $n => $item) {
                        if (!is_array($item)) {
                            continue;
                        }
                        $img = (string) ($item['img'] ?? '');
                        if ($img === 'hard.avif' || str_contains($img, 'hard.avif') || $img === 'hardware2026.png') {
                            $items[$n]['img'] = 'hardware2026.webp';
                        }
                    }
                    $props['items'] = $items;
                }
            }
            if ($type === 'faq') {
                $hasFaq = true;
                $props['title'] = $faq['title'];
                $props['items'] = $faq['items'];
            }
            $blocks[$i]['props'] = $props;
        }
        if ($slug === 'inicio' && !$hasFaq) {
            $blocks[] = cms_make_block('faq', $faq);
        }
        $content['blocks'] = $blocks;
        $upd->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $slug, $locale]);
    }

    $sites = $pdo->query('SELECT locale, content FROM site_settings')->fetchAll();
    $updSite = $pdo->prepare('UPDATE site_settings SET content = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $footer = is_array($content['footer'] ?? null) ? $content['footer'] : [];
        $footer['desc'] = $locale === 'en'
            ? '30 years implementing software, hardware and IT operations for companies and schools in Peru.'
            : '30 años implementando software, hardware y operación TI para empresas y entidades educativas en Perú.';
        $footer['tagline'] = $locale === 'en'
            ? 'Head office in San Vicente de Cañete'
            : 'Casa matriz en San Vicente de Cañete';
        $content['footer'] = $footer;
        $updSite->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $locale]);
    }
}

/**
 * Oculta las secciones de prueba social del inicio (testimonios y logos de
 * clientes, es/en) sin borrar su contenido: los bloques siguen existiendo y
 * pueden reactivarse desde el CMS (switch de visibilidad). Solo marca
 * hidden=true; no toca nada más del documento.
 */
function cms_social_proof_hide_migrate(): void
{
    $pdo = db();
    $rows = $pdo->query("SELECT slug, locale, content, draft FROM pages WHERE slug = 'inicio'")->fetchAll();
    $upd = $pdo->prepare('UPDATE pages SET content = ?, draft = ? WHERE slug = ? AND locale = ?');
    $targets = ['testimonials', 'clients'];
    foreach ($rows as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $content = decode_json_col($row['content'] ?? '{}');
        $draft = decode_json_col($row['draft'] ?? '');
        $changed = false;
        foreach (['content', 'draft'] as $key) {
            $doc = $key === 'content' ? $content : $draft;
            if (!is_array($doc) || $doc === []) {
                continue;
            }
            if (isset($doc['blocks']) && is_array($doc['blocks'])) {
                foreach ($doc['blocks'] as $i => $block) {
                    if (!is_array($block) || !in_array($block['type'] ?? '', $targets, true) || !empty($block['hidden'])) {
                        continue;
                    }
                    $doc['blocks'][$i]['hidden'] = true;
                    $changed = true;
                }
            }
            if (isset($doc['sections']) && is_array($doc['sections'])) {
                foreach ($doc['sections'] as $i => $section) {
                    if (!is_array($section) || !in_array($section['type'] ?? '', $targets, true) || !empty($section['hidden'])) {
                        continue;
                    }
                    $doc['sections'][$i]['hidden'] = true;
                    $changed = true;
                }
            }
            if ($key === 'content') {
                $content = $doc;
            } else {
                $draft = $doc;
            }
        }
        if (!$changed) {
            continue;
        }
        $draftJson = $row['draft'] ?? null;
        if ($draft !== []) {
            $draftJson = json_encode($draft, JSON_UNESCAPED_UNICODE);
        }
        $upd->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $slug, $locale]);
    }
}

function cms_studio_sitewide_migrate(): void
{
    if (!function_exists('cms_content_overwrite_enabled')) {
        require_once __DIR__ . '/Domain/CmsContentMigrate.php';
    }
    if (!function_exists('pages_seed')) {
        require_once __DIR__ . '/seed.php';
    }
    if (!function_exists('pages_seed_en')) {
        require_once __DIR__ . '/seed-en.php';
    }
    $pdo = db();
    $upd = $pdo->prepare('UPDATE pages SET content = ? WHERE slug = ? AND locale = ?');
    $slugs = [
        'acerca-de',
        'servicios',
        'servicios-software',
        'servicios-hardware',
        'servicios-consultoria',
        'servicios-saas',
        'servicios-soluciones-ti',
        'contacto',
        'clientes',
        'libro-reclamaciones',
        'privacidad',
        'terminos',
    ];
    $sets = [
        'es' => pages_seed(),
        'en' => pages_seed_en(),
    ];
    foreach ($sets as $locale => $pages) {
        foreach ($slugs as $slug) {
            if (!isset($pages[$slug]['content'])) {
                continue;
            }
            $fresh = migrate_cms_document($pages[$slug]['content'], $slug);
            $upd->execute([json_encode($fresh, JSON_UNESCAPED_UNICODE), $slug, $locale]);
        }
    }

    $sites = $pdo->query('SELECT locale, content FROM site_settings')->fetchAll();
    $updSite = $pdo->prepare('UPDATE site_settings SET content = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $locale = cms_normalize_locale((string) ($site['locale'] ?? 'es'));
        $content = decode_json_col($site['content'] ?? '{}');
        $content['splashTagline'] = $locale === 'en'
            ? 'IT implementations with real follow-through'
            : 'Implementaciones TI con seguimiento real';
        $content['founderRole'] = $locale === 'en' ? 'CEO and founder' : 'CEO y fundador';
        $updSite->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $locale]);
    }
}

function app_db_version(string $key): int
{
    return app_db_versions($key)[$key] ?? 0;
}

function app_db_versions(string ...$keys): array
{
    try {
        $placeholders = implode(', ', array_fill(0, count($keys), '?'));
        $stmt = db()->prepare("SELECT k, v FROM app_secrets WHERE k IN ($placeholders)");
        $stmt->execute($keys);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_KEY_PAIR));
    } catch (PDOException $err) {
        if ($err->getCode() !== '42S02') {
            throw $err;
        }
        return [];
    }
}

function app_schema_is_current(): bool
{
    try {
        return app_db_version('schema_version') >= APP_SCHEMA_VERSION;
    } catch (Throwable) {
        return false;
    }
}

function app_bootstrap_db(): void
{
    $force = cfg('APP_SETUP', '0') === '1';
    $markers = array_map(static fn (string $name): string => 'migration_done:' . $name, array_keys(APP_V15_DATA_MIGRATIONS));
    $versions = app_db_versions('schema_version', 'setup_done_version', ...$markers);
    $version = $versions['schema_version'] ?? 0;
    $dataPending = $version === 15 && array_diff($markers, array_keys(array_filter($versions))) !== [];
    if ($version >= APP_SCHEMA_VERSION && !$dataPending
        && (!$force || ($versions['setup_done_version'] ?? 0) >= APP_SCHEMA_VERSION)) {
        return;
    }

    // El bloqueo vive en MariaDB y lo comparten el arranque web y el comando CLI.
    $pdo = db();
    $lockName = 'matt-cms-setup:' . sha1((string) $pdo->query('SELECT DATABASE()')->fetchColumn());
    $lock = $pdo->prepare('SELECT GET_LOCK(?, 0)');
    $lock->execute([$lockName]);
    if ((int) $lock->fetchColumn() !== 1) {
        if (PHP_SAPI === 'cli') {
            throw new RuntimeException('Hay otra migración en curso.');
        }
        json_out(['message' => 'Preparando la base de datos. Reintenta en unos segundos.'], 503, ['Retry-After' => '5']);
    }
    try {
        $previousVersion = app_db_version('schema_version');
        if ($previousVersion < APP_SCHEMA_VERSION) {
            // v15 solo cambia datos. Las bases en v14 ya tienen todo el DDL.
            if ($previousVersion < 14) {
                db_init();
                db_migrate_schema();
            }

            // Seed solo al inicializar. El marcador permite reintentar la
            // instalación sin volver a insertar datos tras un fallo posterior.
            $fresh = false;
            if ($previousVersion === 0) {
                require_once __DIR__ . '/Domain/CmsContentMigrate.php';
                cms_run_migration_once('initial_seed', static function () use ($pdo): void {
                    $empty = !(int) $pdo->query('SELECT EXISTS (SELECT 1 FROM pages)')->fetchColumn()
                        && !(int) $pdo->query('SELECT EXISTS (SELECT 1 FROM site_settings)')->fetchColumn();
                    seed_database();
                    if ($empty) {
                        $pdo->exec("INSERT INTO app_secrets (k, v) VALUES ('initial_seed_fresh', '1')");
                    }
                });
                $fresh = app_db_version('initial_seed_fresh') !== 0;
            }
            db_migrate_content($previousVersion, $fresh);
        }
        if ($previousVersion <= 15) {
            require_once __DIR__ . '/Domain/CmsContentMigrate.php';
            require_once __DIR__ . '/Domain/CmsV15CopyFix.php';
            foreach (APP_V15_DATA_MIGRATIONS as $name => $migration) {
                cms_run_migration_once($name, $migration);
            }
        }
        $version = max($previousVersion, APP_SCHEMA_VERSION);
        $done = max(app_db_version('setup_done_version'), $version);
        $stmt = $pdo->prepare('INSERT INTO app_secrets (k, v) VALUES (?, ?), (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
        $stmt->execute(['schema_version', (string) $version, 'setup_done_version', (string) $done]);
    } finally {
        $unlock = $pdo->prepare('SELECT RELEASE_LOCK(?)');
        $unlock->execute([$lockName]);
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
    app_bootstrap_db();
    fwrite(STDOUT, "Migración lista (schema " . APP_SCHEMA_VERSION . ").\n");
}
