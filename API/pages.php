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
        cms_write_guard(true);
        cms_doc_publish($m[1]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/preview-token$#', $path, $m) && $method === 'POST') {
        require_admin();
        require_csrf();
        json_out(create_preview_token($m[1]));
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions/(\d+)/restore$#', $path, $m) && $method === 'POST') {
        cms_write_guard(false);
        cms_doc_restore($m[1], (int) $m[2]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)/revisions$#', $path, $m) && $method === 'GET') {
        require_admin();
        json_out(['items' => list_revisions($m[1])]);
    }

    if (preg_match('#^/pages/([a-z0-9\-]+)$#', $path, $m)) {
        $slug = $m[1];
        if ($slug === 'sitio') {
            handle_site($method);
        }
        if ($method === 'GET') {
            json_out(cms_doc_payload($slug));
        }
        if ($method === 'PUT') {
            cms_write_guard(false);
            cms_doc_save_draft($slug);
        }
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}

function handle_site(string $method): never
{
    if ($method === 'GET') {
        json_out(cms_doc_payload('sitio'));
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
