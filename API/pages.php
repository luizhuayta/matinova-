<?php
declare(strict_types=1);

function cms_write_guard(bool $needAdminRole = false): void
{
    if ($needAdminRole) {
        require_role('admin');
    } else {
        require_admin();
    }
    require_csrf();
    rate_limit('cms_write', 40, 60);
}

function handle_pages(string $path, string $method): void
{
    if ($path === '/pages' && $method === 'GET') {
        cms_pages_list();
    }

    if ($path === '/pages' && $method === 'POST') {
        cms_write_guard(true);
        cms_pages_create();
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/publish$#', $path, $m) && $method === 'POST') {
        cms_write_guard(true);
        cms_doc_publish($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/preview-token$#', $path, $m) && $method === 'POST') {
        require_admin();
        require_csrf();
        json_out(create_preview_token($m[1]));
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions/(\d+)/restore$#', $path, $m) && $method === 'POST') {
        cms_write_guard(true);
        cms_doc_restore($m[1], (int) $m[2]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions$#', $path, $m) && $method === 'GET') {
        require_admin();
        json_out(['items' => list_revisions($m[1])]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/meta$#', $path, $m) && $method === 'PATCH') {
        cms_write_guard(true);
        cms_pages_update_meta($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)$#', $path, $m) && $method === 'DELETE') {
        cms_write_guard(true);
        cms_pages_delete($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/translate$#', $path, $m) && $method === 'POST') {
        cms_write_guard(true);
        cms_pages_translate($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)$#', $path, $m)) {
        $slug = $m[1];
        if ($slug === 'sitio') {
            handle_site($method);
        }
        if ($method === 'GET') {
            $payload = cms_doc_payload($slug);
            json_out_public($payload, $payload['updated_at'] ?? null);
        }
        if ($method === 'PUT') {
            cms_write_guard(false);
            cms_doc_save_draft($slug);
        }
        if ($method === 'PATCH') {
            cms_write_guard(true);
            cms_pages_update_meta($slug);
        }
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}

function cms_pages_list(): never
{
    $locale = cms_request_locale();
    $rows = db()->prepare('SELECT slug, locale, title, updated_at, version, path, show_in_menu, menu_order FROM pages WHERE locale = ? ORDER BY menu_order ASC, title');
    $rows->execute([$locale]);
    $pages = [];
    $menu = [];
    foreach ($rows->fetchAll() as $row) {
        $item = cms_page_summary_row($row);
        $pages[] = $item;
        if (!empty($item['show_in_menu'])) {
            $menu[] = [
                'slug' => $item['slug'],
                'title' => $item['title'],
                'path' => cms_public_path($item['path'], $locale),
                'menu_order' => $item['menu_order'],
                'locale' => $item['locale'],
            ];
        }
    }
    $siteStmt = db()->prepare('SELECT updated_at, version FROM site_settings WHERE locale = ?');
    $siteStmt->execute([$locale]);
    $site = $siteStmt->fetch() ?: [];
    if (!$site && $locale !== 'es') {
        $siteStmt->execute(['es']);
        $site = $siteStmt->fetch() ?: [];
    }
    $pages[] = [
        'slug' => 'sitio',
        'title' => 'Apariencia del sitio',
        'updated_at' => $site['updated_at'] ?? null,
        'version' => (int) ($site['version'] ?? 1),
        'path' => '/',
        'show_in_menu' => false,
        'menu_order' => 0,
        'protected' => true,
        'locale' => $locale,
    ];
    $updated = $site['updated_at'] ?? null;
    json_out_public(['pages' => $pages, 'menu' => $menu, 'locale' => $locale], is_string($updated) ? $updated : null);
}

function cms_page_summary_row(array $row): array
{
    $slug = (string) ($row['slug'] ?? '');
    $locale = cms_normalize_locale((string) ($row['locale'] ?? cms_request_locale()));
    $path = cms_page_path_for($slug, (string) ($row['path'] ?? '') ?: (cms_known_page_paths()[$slug] ?? null));
    return [
        'slug' => $slug,
        'title' => (string) ($row['title'] ?? $slug),
        'updated_at' => $row['updated_at'] ?? null,
        'version' => (int) ($row['version'] ?? 1),
        'path' => $path,
        'show_in_menu' => (int) ($row['show_in_menu'] ?? 0) === 1,
        'menu_order' => (int) ($row['menu_order'] ?? 0),
        'protected' => in_array($slug, cms_protected_slugs(), true),
        'locale' => $locale,
    ];
}

function cms_pages_create(): never
{
    $input = json_input();
    $title = trim((string) ($input['title'] ?? ''));
    if ($title === '' || mb_strlen($title) > 160) {
        json_out(['field' => 'title', 'message' => 'Escribe un título de hasta 160 caracteres.'], 400);
    }
    $slug = trim((string) ($input['slug'] ?? ''));
    if ($slug === '') {
        $slug = cms_slugify_title($title);
    }
    $slug = strtolower($slug);
    if (!cms_valid_slug($slug)) {
        json_out(['field' => 'slug', 'message' => 'Usa solo letras minúsculas, números y guiones.'], 400);
    }
    if (in_array($slug, cms_reserved_slugs(), true) || $slug === 'sitio') {
        json_out(['field' => 'slug', 'message' => 'Ese nombre está reservado.'], 400);
    }
    $exists = db()->prepare('SELECT slug FROM pages WHERE slug = ? AND locale = ?');
    $exists->execute([$slug, cms_request_locale()]);
    if ($exists->fetch()) {
        json_out(['field' => 'slug', 'message' => 'Ya existe una página con esa ruta.'], 409);
    }
    $template = (string) ($input['template'] ?? 'blank');
    $ids = array_column(cms_page_templates(), 'id');
    if (!in_array($template, $ids, true)) {
        $template = 'blank';
    }
    $show = !empty($input['showInMenu']);
    $path = cms_page_path_for($slug, isset($input['path']) ? (string) $input['path'] : null);
    $order = (int) ($input['menuOrder'] ?? cms_next_menu_order());
    $locale = cms_request_locale();
    $doc = cms_blank_page_document($title, $template);
    $ins = db()->prepare('INSERT INTO pages (slug, locale, title, content, path, show_in_menu, menu_order, version) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
    $ins->execute([$slug, $locale, $title, json_encode($doc, JSON_UNESCAPED_UNICODE), $path, $show ? 1 : 0, $order]);
    json_out([
        'ok' => true,
        'page' => [
            'slug' => $slug,
            'title' => $title,
            'path' => $path,
            'show_in_menu' => $show,
            'menu_order' => $order,
            'version' => 1,
            'protected' => false,
            'locale' => $locale,
        ],
        'content' => $doc,
        'version' => 1,
    ], 201);
}

function cms_next_menu_order(): int
{
    $max = (int) db()->query('SELECT COALESCE(MAX(menu_order), 0) FROM pages')->fetchColumn();
    return $max + 10;
}

function cms_pages_delete(string $slug): never
{
    if ($slug === 'sitio' || in_array($slug, cms_protected_slugs(), true)) {
        json_out(['message' => 'Esta página no se puede eliminar.'], 403);
    }
    $row = cms_doc_read($slug);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $locale = cms_request_locale();
    cms_pages_delete_locale($slug, $locale);
    json_out(['ok' => true]);
}

function cms_pages_update_meta(string $slug): never
{
    if ($slug === 'sitio') {
        json_out(['message' => 'La apariencia del sitio no tiene esa opción.'], 400);
    }
    $row = cms_doc_read($slug);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $locale = cms_normalize_locale((string) ($row['locale'] ?? cms_request_locale()));
    $input = json_input();
    $title = array_key_exists('title', $input) ? trim((string) $input['title']) : (string) ($row['title'] ?? $slug);
    if ($title === '' || mb_strlen($title) > 160) {
        json_out(['field' => 'title', 'message' => 'Escribe un título de hasta 160 caracteres.'], 400);
    }
    $nextSlug = array_key_exists('slug', $input) ? strtolower(trim((string) $input['slug'])) : $slug;
    if ($nextSlug !== $slug) {
        if (in_array($slug, cms_protected_slugs(), true)) {
            json_out(['field' => 'slug', 'message' => 'No puedes cambiar la ruta de esta página.'], 403);
        }
        if (!cms_valid_slug($nextSlug) || in_array($nextSlug, cms_reserved_slugs(), true)) {
            json_out(['field' => 'slug', 'message' => 'Usa solo letras minúsculas, números y guiones.'], 400);
        }
        $exists = db()->prepare('SELECT slug FROM pages WHERE slug = ? AND locale = ?');
        $exists->execute([$nextSlug, $locale]);
        if ($exists->fetch()) {
            json_out(['field' => 'slug', 'message' => 'Ya existe una página con esa ruta.'], 409);
        }
    }
    $show = array_key_exists('showInMenu', $input) ? (!empty($input['showInMenu']) ? 1 : 0) : (int) ($row['show_in_menu'] ?? 0);
    $order = array_key_exists('menuOrder', $input) ? (int) $input['menuOrder'] : (int) ($row['menu_order'] ?? 0);
    $pathInput = array_key_exists('path', $input) ? (string) $input['path'] : (string) ($row['path'] ?? '');
    $path = cms_page_path_for($nextSlug, $pathInput !== '' ? $pathInput : null);
    $oldPath = cms_page_path_for($slug, (string) ($row['path'] ?? '') ?: null);

    if ($nextSlug !== $slug) {
        db()->prepare('UPDATE pages SET slug = ?, title = ?, path = ?, show_in_menu = ?, menu_order = ? WHERE slug = ? AND locale = ?')
            ->execute([$nextSlug, $title, $path, $show, $order, $slug, $locale]);
        db()->prepare('UPDATE revisions SET slug = ? WHERE slug = ?')->execute([$nextSlug, $slug]);
        db()->prepare('UPDATE preview_tokens SET slug = ? WHERE slug = ?')->execute([$nextSlug, $slug]);
    } else {
        db()->prepare('UPDATE pages SET title = ?, path = ?, show_in_menu = ?, menu_order = ? WHERE slug = ? AND locale = ?')
            ->execute([$title, $path, $show, $order, $slug, $locale]);
    }
    if ($oldPath !== $path) {
        cms_save_redirect($oldPath, $path);
        foreach (cms_locales() as $loc) {
            if ($loc === 'es') {
                continue;
            }
            $from = cms_public_path($oldPath, $loc);
            $to = cms_public_path($path, $loc);
            if ($from !== $to) {
                cms_save_redirect($from, $to);
            }
        }
    }
    json_out([
        'ok' => true,
        'page' => [
            'slug' => $nextSlug,
            'title' => $title,
            'path' => $path,
            'show_in_menu' => $show === 1,
            'menu_order' => $order,
            'protected' => in_array($nextSlug, cms_protected_slugs(), true),
            'locale' => $locale,
        ],
    ]);
}

function cms_pages_translate(string $slug): never
{
    $target = cms_normalize_locale((string) (json_input()['locale'] ?? 'en'));
    if ($target === 'es') {
        json_out(['message' => 'El idioma original ya es español.'], 400);
    }
    if ($slug === 'sitio') {
        cms_ensure_site_locale($target);
        json_out(['ok' => true, 'slug' => 'sitio', 'locale' => $target]);
    }
    $src = db()->prepare('SELECT slug, title, content, draft, path, show_in_menu, menu_order FROM pages WHERE slug = ? AND locale = ?');
    $src->execute([$slug, 'es']);
    $row = $src->fetch();
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $exists = db()->prepare('SELECT slug FROM pages WHERE slug = ? AND locale = ?');
    $exists->execute([$slug, $target]);
    if ($exists->fetch()) {
        json_out(['ok' => true, 'slug' => $slug, 'locale' => $target, 'existed' => true]);
    }
    $ins = db()->prepare('INSERT INTO pages (slug, locale, title, content, draft, path, show_in_menu, menu_order, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
    $ins->execute([
        $slug,
        $target,
        $row['title'],
        $row['content'],
        $row['draft'],
        $row['path'],
        $row['show_in_menu'],
        $row['menu_order'],
    ]);
    json_out(['ok' => true, 'slug' => $slug, 'locale' => $target], 201);
}

function handle_site(string $method): never
{
    if ($method === 'GET') {
        $payload = cms_doc_payload('sitio');
        json_out_public($payload, $payload['updated_at'] ?? null);
    }
    if ($method === 'PUT') {
        cms_write_guard(false);
        cms_doc_save_draft('sitio');
    }
    if ($method === 'POST' && (route_path() === '/site/publish' || str_ends_with($_SERVER['REQUEST_URI'] ?? '', '/publish'))) {
        cms_write_guard(true);
        cms_doc_publish('sitio');
    }
    json_out(['message' => 'Método no permitido'], 405);
}

function create_preview_token(string $slug): array
{
    $token = bin2hex(random_bytes(16));
    $expires = (new DateTimeImmutable('+2 hours'))->format('Y-m-d H:i:s');
    db()->prepare('INSERT INTO preview_tokens (token, slug, expires_at) VALUES (?, ?, ?)')
        ->execute([$token, $slug, $expires]);
    db()->exec('DELETE FROM preview_tokens WHERE expires_at < NOW()');
    $loc = cms_public_path(cms_lookup_page_path($slug), cms_request_locale());
    return ['token' => $token, 'expires_at' => $expires, 'url' => $loc . '?preview=' . $token];
}

function cms_lookup_page_path(string $slug): string
{
    if ($slug === 'sitio') {
        return '/';
    }
    $locale = cms_request_locale();
    $stmt = db()->prepare('SELECT path FROM pages WHERE slug = ? AND locale = ?');
    $stmt->execute([$slug, $locale]);
    $row = $stmt->fetch();
    if (!$row && $locale !== 'es') {
        $stmt->execute([$slug, 'es']);
        $row = $stmt->fetch();
    }
    return cms_page_path_for($slug, (string) ($row['path'] ?? '') ?: (cms_known_page_paths()[$slug] ?? null));
}

function handle_sitemap(): never
{
    $origin = app_origin();
    $rows = db()->query('SELECT slug, locale, updated_at, path FROM pages')->fetchAll();
    $bySlug = [];
    foreach ($rows as $row) {
        $slug = (string) $row['slug'];
        $locale = cms_normalize_locale((string) ($row['locale'] ?? 'es'));
        $bySlug[$slug][$locale] = $row;
    }
    header('Content-Type: application/xml; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
    foreach ($bySlug as $slug => $locales) {
        foreach ($locales as $locale => $row) {
            $base = cms_page_path_for($slug, (string) ($row['path'] ?? '') ?: null);
            $loc = cms_public_path($base, $locale);
            $last = substr((string) ($row['updated_at'] ?? ''), 0, 10) ?: gmdate('Y-m-d');
            echo '<url><loc>' . htmlspecialchars($origin . $loc, ENT_XML1) . '</loc><lastmod>' . $last . '</lastmod>';
            foreach (cms_locales() as $alt) {
                $href = $origin . cms_public_path($base, $alt);
                echo '<xhtml:link rel="alternate" hreflang="' . $alt . '" href="' . htmlspecialchars($href, ENT_XML1) . '"/>';
            }
            echo '</url>' . "\n";
        }
    }
    echo '</urlset>';
    exit;
}
