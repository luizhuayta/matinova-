<?php
declare(strict_types=1);

function decode_json_col(mixed $raw): array
{
    if (is_array($raw)) {
        return $raw;
    }
    if (!is_string($raw) || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function cms_prepare_document(array $content, string $slug): array
{
    $content = migrate_cms_document($content, $slug);
    if ($slug === 'inicio') {
        $content = normalize_inicio_sections($content);
    }
    return sanitize_cms_tree($content);
}

function cms_row_public(array $published, int $version, ?string $updatedAt, string $slug): array
{
    return [
        'content' => cms_prepare_document($published, $slug),
        'version' => $version,
        'updated_at' => $updatedAt,
        'schemaVersion' => CMS_SCHEMA_VERSION,
    ];
}

function handle_pages(string $path, string $method): void
{
    if ($path === '/pages' && $method === 'GET') {
        $rows = db()->query('SELECT slug, title, updated_at, version FROM pages ORDER BY title')->fetchAll();
        $site = db()->query('SELECT updated_at, version FROM site_settings WHERE id = 1')->fetch() ?: [];
        $rows[] = [
            'slug' => 'sitio',
            'title' => 'Apariencia del sitio',
            'updated_at' => $site['updated_at'] ?? null,
            'version' => (int) ($site['version'] ?? 1),
        ];
        json_out(['pages' => $rows]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/publish$#', $path, $m) && $method === 'POST') {
        require_role('admin');
        require_csrf();
        rate_limit('cms_write', 40, 60);
        publish_document($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/preview-token$#', $path, $m) && $method === 'POST') {
        require_admin();
        require_csrf();
        json_out(create_preview_token($m[1]));
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions/(\d+)/restore$#', $path, $m) && $method === 'POST') {
        require_admin();
        require_csrf();
        rate_limit('cms_write', 40, 60);
        restore_revision($m[1], (int) $m[2]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions$#', $path, $m) && $method === 'GET') {
        require_admin();
        json_out(['items' => list_revisions($m[1])]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)$#', $path, $m)) {
        $slug = $m[1];
        if ($slug === 'sitio') {
            handle_site_as_page($method);
        }
        if ($method === 'GET') {
            $stmt = db()->prepare('SELECT slug, title, content, draft, version, updated_at FROM pages WHERE slug = ?');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row) {
                json_out(['message' => 'Página no encontrada'], 404);
            }
            json_out(page_get_payload($row, $slug));
        }
        if ($method === 'PUT') {
            require_admin();
            require_csrf();
            rate_limit('cms_write', 40, 60);
            save_page_draft($slug);
        }
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}

function handle_site_as_page(string $method): never
{
    if ($method === 'GET') {
        json_out(site_get_payload());
    }
    if ($method === 'PUT') {
        require_admin();
        require_csrf();
        rate_limit('cms_write', 40, 60);
        save_site_draft();
    }
    json_out(['message' => 'Método no permitido'], 405);
}

function handle_site(string $method): void
{
    if ($method === 'GET') {
        json_out(site_get_payload());
    }
    if ($method === 'PUT') {
        require_admin();
        require_csrf();
        rate_limit('cms_write', 40, 60);
        save_site_draft();
    }
    if ($method === 'POST' && (route_path() === '/site/publish' || str_ends_with($_SERVER['REQUEST_URI'] ?? '', '/publish'))) {
        require_role('admin');
        require_csrf();
        rate_limit('cms_write', 40, 60);
        publish_document('sitio');
    }
    json_out(['message' => 'Método no permitido'], 405);
}

function preview_slug_from_request(): ?string
{
    $token = (string) ($_GET['preview'] ?? '');
    if ($token === '') {
        return null;
    }
    $stmt = db()->prepare('SELECT slug FROM preview_tokens WHERE token = ? AND expires_at > NOW()');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ? (string) $row['slug'] : null;
}

function page_get_payload(array $row, string $slug): array
{
    $published = decode_json_col($row['content'] ?? '{}');
    $draft = decode_json_col($row['draft'] ?? '');
    $version = (int) ($row['version'] ?? 1);
    $wantDraft = admin_logged_in() || preview_slug_from_request() === $slug;
    $content = $wantDraft && $draft !== [] ? $draft : $published;
    $payload = cms_row_public($content, $version, $row['updated_at'] ?? null, $slug);
    $payload['slug'] = $row['slug'];
    $payload['title'] = $row['title'];
    if (admin_logged_in()) {
        $payload['hasDraft'] = $draft !== [];
        $payload['published'] = cms_prepare_document($published, $slug);
    }
    return $payload;
}

function site_get_payload(): array
{
    $row = db()->query('SELECT content, draft, version, updated_at FROM site_settings WHERE id = 1')->fetch() ?: [];
    $published = decode_json_col($row['content'] ?? '{}');
    $draft = decode_json_col($row['draft'] ?? '');
    $version = (int) ($row['version'] ?? 1);
    $wantDraft = admin_logged_in() || preview_slug_from_request() === 'sitio';
    $content = $wantDraft && $draft !== [] ? $draft : $published;
    $payload = cms_row_public($content, $version, $row['updated_at'] ?? null, 'sitio');
    if (admin_logged_in()) {
        $payload['hasDraft'] = $draft !== [];
        $payload['published'] = cms_prepare_document($published, 'sitio');
    }
    return $payload;
}

function save_page_draft(string $slug): never
{
    $input = json_input();
    $content = $input['content'] ?? null;
    $err = validate_cms_payload($content);
    if ($err) {
        json_out($err, 400);
    }
    /** @var array $content */
    $stmt = db()->prepare('SELECT version, content, draft FROM pages WHERE slug = ?');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Página no encontrada'], 404);
    }
    $current = (int) $row['version'];
    $given = $input['version'] ?? null;
    if (!is_int($given) && !is_numeric($given)) {
        json_out(['field' => 'version', 'message' => 'Falta la versión del documento'], 400);
    }
    if ((int) $given !== $current) {
        $draft = decode_json_col($row['draft'] ?? '');
        $shown = $draft !== [] ? $draft : decode_json_col($row['content']);
        json_out([
            'message' => 'Alguien guardó esta página antes. Recarga para no pisar cambios.',
            'version' => $current,
            'updated_at' => $row['updated_at'] ?? null,
            'content' => cms_prepare_document($shown, $slug),
        ], 409);
    }
    if ($slug === 'inicio') {
        foreach (($content['sections'] ?? []) as $rowSection) {
            $type = is_array($rowSection) ? (string) ($rowSection['type'] ?? '') : '';
            if ($type !== '' && !in_array($type, allowed_inicio_sections(), true)) {
                json_out(['field' => 'sections', 'message' => 'Tipo de sección no permitido: ' . $type], 400);
            }
        }
        $content = normalize_inicio_sections($content);
    }
    $guard = validate_cms_guards($content, $slug);
    if ($guard) {
        json_out($guard, 400);
    }
    $prepared = cms_prepare_document($content, $slug);
    $next = $current + 1;
    $upd = db()->prepare('UPDATE pages SET draft = ?, version = ? WHERE slug = ? AND version = ?');
    $upd->execute([json_encode($prepared, JSON_UNESCAPED_UNICODE), $next, $slug, $current]);
    if ($upd->rowCount() === 0) {
        json_out(['message' => 'Alguien guardó esta página antes. Recarga para no pisar cambios.'], 409);
    }
    $fresh = db()->prepare('SELECT updated_at, version FROM pages WHERE slug = ?');
    $fresh->execute([$slug]);
    $meta = $fresh->fetch() ?: [];
    json_out(['ok' => true, 'version' => (int) ($meta['version'] ?? $next), 'updated_at' => $meta['updated_at'] ?? null, 'content' => $prepared]);
}

function save_site_draft(): never
{
    $input = json_input();
    $content = $input['content'] ?? null;
    $err = validate_cms_payload($content);
    if ($err) {
        json_out($err, 400);
    }
    $guard = validate_cms_guards($content, 'sitio');
    if ($guard) {
        json_out($guard, 400);
    }
    $row = db()->query('SELECT version, content, draft, updated_at FROM site_settings WHERE id = 1')->fetch();
    if (!$row) {
        json_out(['message' => 'Sitio no encontrado'], 404);
    }
    $current = (int) $row['version'];
    $given = $input['version'] ?? null;
    if (!is_int($given) && !is_numeric($given)) {
        json_out(['field' => 'version', 'message' => 'Falta la versión del documento'], 400);
    }
    if ((int) $given !== $current) {
        $draft = decode_json_col($row['draft'] ?? '');
        $shown = $draft !== [] ? $draft : decode_json_col($row['content']);
        json_out([
            'message' => 'Alguien guardó el sitio antes. Recarga para no pisar cambios.',
            'version' => $current,
            'updated_at' => $row['updated_at'] ?? null,
            'content' => cms_prepare_document($shown, 'sitio'),
        ], 409);
    }
    $prepared = cms_prepare_document($content, 'sitio');
    $next = $current + 1;
    $upd = db()->prepare('UPDATE site_settings SET draft = ?, version = ? WHERE id = 1 AND version = ?');
    $upd->execute([json_encode($prepared, JSON_UNESCAPED_UNICODE), $next, $current]);
    if ($upd->rowCount() === 0) {
        json_out(['message' => 'Alguien guardó el sitio antes. Recarga para no pisar cambios.'], 409);
    }
    $meta = db()->query('SELECT updated_at, version FROM site_settings WHERE id = 1')->fetch() ?: [];
    json_out(['ok' => true, 'version' => (int) ($meta['version'] ?? $next), 'updated_at' => $meta['updated_at'] ?? null, 'content' => $prepared]);
}

function cms_read_expected_version(int $current): int
{
    $input = json_input();
    $given = $input['version'] ?? null;
    if (!is_int($given) && !is_numeric($given)) {
        json_out(['field' => 'version', 'message' => 'Falta la versión del documento'], 400);
    }
    if ((int) $given !== $current) {
        json_out([
            'message' => 'Alguien publicó o guardó antes. Recarga para no pisar cambios.',
            'version' => $current,
        ], 409);
    }
    return $current;
}

function publish_document(string $slug): never
{
    if ($slug === 'sitio') {
        $row = db()->query('SELECT content, draft, version FROM site_settings WHERE id = 1')->fetch();
        if (!$row) {
            json_out(['message' => 'Sitio no encontrado'], 404);
        }
        $current = cms_read_expected_version((int) $row['version']);
        $draft = decode_json_col($row['draft'] ?? '');
        $published = decode_json_col($row['content'] ?? '{}');
        $next = $draft !== [] ? $draft : $published;
        $next = cms_prepare_document($next, 'sitio');
        $guard = validate_cms_guards($next, 'sitio');
        if ($guard) {
            json_out($guard, 400);
        }
        db()->prepare('INSERT INTO revisions (slug, author, snapshot) VALUES (?, ?, ?)')
            ->execute(['sitio', $_SESSION['admin_username'] ?? 'admin', json_encode($next, JSON_UNESCAPED_UNICODE)]);
        $ver = $current + 1;
        $upd = db()->prepare('UPDATE site_settings SET content = ?, draft = NULL, version = ? WHERE id = 1 AND version = ?');
        $upd->execute([json_encode($next, JSON_UNESCAPED_UNICODE), $ver, $current]);
        if ($upd->rowCount() === 0) {
            json_out(['message' => 'Alguien publicó o guardó antes. Recarga para no pisar cambios.'], 409);
        }
        json_out(['ok' => true, 'version' => $ver, 'content' => $next]);
    }

    $stmt = db()->prepare('SELECT content, draft, version FROM pages WHERE slug = ?');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Página no encontrada'], 404);
    }
    $current = cms_read_expected_version((int) $row['version']);
    $draft = decode_json_col($row['draft'] ?? '');
    $published = decode_json_col($row['content'] ?? '{}');
    $next = $draft !== [] ? $draft : $published;
    $next = cms_prepare_document($next, $slug);
    $guard = validate_cms_guards($next, $slug);
    if ($guard) {
        json_out($guard, 400);
    }
    db()->prepare('INSERT INTO revisions (slug, author, snapshot) VALUES (?, ?, ?)')
        ->execute([$slug, $_SESSION['admin_username'] ?? 'admin', json_encode($next, JSON_UNESCAPED_UNICODE)]);
    $ver = $current + 1;
    $upd = db()->prepare('UPDATE pages SET content = ?, draft = NULL, version = ? WHERE slug = ? AND version = ?');
    $upd->execute([json_encode($next, JSON_UNESCAPED_UNICODE), $ver, $slug, $current]);
    if ($upd->rowCount() === 0) {
        json_out(['message' => 'Alguien publicó o guardó antes. Recarga para no pisar cambios.'], 409);
    }
    json_out(['ok' => true, 'version' => $ver, 'content' => $next]);
}

function list_revisions(string $slug): array
{
    $stmt = db()->prepare('SELECT id, author, created_at, snapshot FROM revisions WHERE slug = ? ORDER BY id DESC LIMIT 40');
    $stmt->execute([$slug]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['snapshot'] = decode_json_col($row['snapshot']);
        $row['id'] = (int) $row['id'];
    }
    return $rows;
}

function restore_revision(string $slug, int $id): never
{
    $stmt = db()->prepare('SELECT snapshot FROM revisions WHERE id = ? AND slug = ?');
    $stmt->execute([$id, $slug]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Revisión no encontrada'], 404);
    }
    $snapshot = cms_prepare_document(decode_json_col($row['snapshot']), $slug);
    if ($slug === 'sitio') {
        $curRow = db()->query('SELECT version FROM site_settings WHERE id = 1')->fetch();
        $current = cms_read_expected_version((int) ($curRow['version'] ?? 1));
        $ver = $current + 1;
        $upd = db()->prepare('UPDATE site_settings SET draft = ?, version = ? WHERE id = 1 AND version = ?');
        $upd->execute([json_encode($snapshot, JSON_UNESCAPED_UNICODE), $ver, $current]);
        if ($upd->rowCount() === 0) {
            json_out(['message' => 'Alguien publicó o guardó antes. Recarga para no pisar cambios.'], 409);
        }
        json_out(['ok' => true, 'version' => $ver, 'content' => $snapshot]);
    }
    $cur = db()->prepare('SELECT version FROM pages WHERE slug = ?');
    $cur->execute([$slug]);
    $current = cms_read_expected_version((int) ($cur->fetch()['version'] ?? 1));
    $ver = $current + 1;
    $upd = db()->prepare('UPDATE pages SET draft = ?, version = ? WHERE slug = ? AND version = ?');
    $upd->execute([json_encode($snapshot, JSON_UNESCAPED_UNICODE), $ver, $slug, $current]);
    if ($upd->rowCount() === 0) {
        json_out(['message' => 'Alguien publicó o guardó antes. Recarga para no pisar cambios.'], 409);
    }
    json_out(['ok' => true, 'version' => $ver, 'content' => $snapshot]);
}

function create_preview_token(string $slug): array
{
    $token = bin2hex(random_bytes(16));
    $expires = (new DateTimeImmutable('+2 hours'))->format('Y-m-d H:i:s');
    db()->prepare('INSERT INTO preview_tokens (token, slug, expires_at) VALUES (?, ?, ?)')
        ->execute([$token, $slug, $expires]);
    db()->exec('DELETE FROM preview_tokens WHERE expires_at < NOW()');
    $paths = [
        'inicio' => '/',
        'acerca-de' => '/acerca-de',
        'servicios' => '/servicios',
        'servicios-software' => '/servicios/software',
        'servicios-hardware' => '/servicios/hardware',
        'servicios-saas' => '/servicios/saas',
        'servicios-consultoria' => '/servicios/consultoria',
        'servicios-soluciones-ti' => '/servicios/soluciones-ti',
        'contacto' => '/contacto',
        'privacidad' => '/privacidad',
        'terminos' => '/terminos',
        'libro-reclamaciones' => '/libro-reclamaciones',
        'sitio' => '/',
    ];
    $loc = $paths[$slug] ?? '/';
    return ['token' => $token, 'expires_at' => $expires, 'url' => $loc . '?preview=' . $token];
}

function handle_sitemap(): never
{
    $origin = app_origin();
    $rows = db()->query('SELECT slug, updated_at FROM pages')->fetchAll();
    $paths = [
        'inicio' => '/',
        'acerca-de' => '/acerca-de',
        'servicios' => '/servicios',
        'servicios-software' => '/servicios/software',
        'servicios-hardware' => '/servicios/hardware',
        'servicios-saas' => '/servicios/saas',
        'servicios-consultoria' => '/servicios/consultoria',
        'servicios-soluciones-ti' => '/servicios/soluciones-ti',
        'contacto' => '/contacto',
        'privacidad' => '/privacidad',
        'terminos' => '/terminos',
        'libro-reclamaciones' => '/libro-reclamaciones',
    ];
    header('Content-Type: application/xml; charset=UTF-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($rows as $row) {
        $loc = $paths[$row['slug']] ?? null;
        if (!$loc) {
            continue;
        }
        $last = substr((string) ($row['updated_at'] ?? ''), 0, 10) ?: gmdate('Y-m-d');
        echo '<url><loc>' . htmlspecialchars($origin . $loc, ENT_XML1) . '</loc><lastmod>' . $last . '</lastmod></url>' . "\n";
    }
    echo '</urlset>';
    exit;
}
