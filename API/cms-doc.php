<?php
declare(strict_types=1);

if (!function_exists('cms_revisions_insert')) {
    require_once __DIR__ . '/Repos/RevisionsRepository.php';
}
if (!function_exists('cms_pages_delete_locale')) {
    require_once __DIR__ . '/Repos/PagesRepository.php';
}

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

function cms_doc_is_site(string $slug): bool
{
    return $slug === 'sitio';
}

function cms_doc_not_found_message(string $slug): string
{
    return cms_doc_is_site($slug) ? 'Sitio no encontrado' : 'Página no encontrada';
}

function cms_doc_save_conflict_message(string $slug): string
{
    return cms_doc_is_site($slug)
        ? 'Alguien guardó el sitio antes. Recarga para no pisar cambios.'
        : 'Alguien guardó esta página antes. Recarga para no pisar cambios.';
}

function cms_doc_publish_conflict_message(): string
{
    return 'Alguien publicó o guardó antes. Recarga para no pisar cambios.';
}

function cms_doc_read(string $slug, bool $allowFallback = true): ?array
{
    $locale = cms_request_locale();
    if (cms_doc_is_site($slug)) {
        $stmt = db()->prepare('SELECT content, draft, version, updated_at, locale FROM site_settings WHERE locale = ?');
        $stmt->execute([$locale]);
        $row = $stmt->fetch() ?: null;
        if (!$row && $allowFallback && $locale !== 'es') {
            $stmt->execute(['es']);
            $row = $stmt->fetch() ?: null;
        }
        if (!$row) {
            return null;
        }
        $row['slug'] = 'sitio';
        $row['title'] = 'Apariencia del sitio';
        $row['locale'] = cms_normalize_locale((string) ($row['locale'] ?? $locale));
        return $row;
    }
    $stmt = db()->prepare('SELECT slug, locale, title, content, draft, version, updated_at, path, show_in_menu, menu_order FROM pages WHERE slug = ? AND locale = ?');
    $stmt->execute([$slug, $locale]);
    $row = $stmt->fetch();
    if (!$row && $allowFallback && $locale !== 'es') {
        $stmt->execute([$slug, 'es']);
        $row = $stmt->fetch();
    }
    return $row ?: null;
}

function cms_doc_payload(string $slug): array
{
    $row = cms_doc_read($slug);
    if (!$row) {
        if (cms_doc_is_site($slug)) {
            $row = [
                'content' => '{}',
                'draft' => '',
                'version' => 1,
                'updated_at' => null,
                'slug' => 'sitio',
                'title' => 'Apariencia del sitio',
            ];
        } else {
            json_out(['message' => cms_doc_not_found_message($slug)], 404);
        }
    }
    $published = decode_json_col($row['content'] ?? '{}');
    $draft = decode_json_col($row['draft'] ?? '');
    $version = (int) ($row['version'] ?? 1);
    $wantDraft = admin_logged_in() || preview_slug_from_request() === $slug;
    $content = $wantDraft && $draft !== [] ? $draft : $published;
    $payload = cms_row_public($content, $version, $row['updated_at'] ?? null, $slug);
    if (!cms_doc_is_site($slug)) {
        $payload['slug'] = $row['slug'];
        $payload['title'] = $row['title'];
        $payload['path'] = cms_page_path_for((string) $row['slug'], isset($row['path']) ? (string) $row['path'] : null);
        $payload['show_in_menu'] = (int) ($row['show_in_menu'] ?? 0) === 1;
        $payload['menu_order'] = (int) ($row['menu_order'] ?? 0);
        $payload['locale'] = cms_normalize_locale((string) ($row['locale'] ?? cms_request_locale()));
    } else {
        $payload['locale'] = cms_normalize_locale((string) ($row['locale'] ?? cms_request_locale()));
    }
    if (admin_logged_in()) {
        $payload['hasDraft'] = $draft !== [];
        $payload['published'] = cms_prepare_document($published, $slug);
    }
    return $payload;
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

function cms_doc_reject_bad_inicio_sections(array $content): void
{
    foreach (($content['sections'] ?? []) as $rowSection) {
        $type = is_array($rowSection) ? (string) ($rowSection['type'] ?? '') : '';
        if ($type !== '' && !in_array($type, allowed_inicio_sections(), true)) {
            json_out(['field' => 'sections', 'message' => 'Tipo de sección no permitido: ' . $type], 400);
        }
    }
}

function cms_doc_write_draft(string $slug, array $prepared, int $next, int $current): int
{
    $json = json_encode($prepared, JSON_UNESCAPED_UNICODE);
    $locale = cms_request_locale();
    if (cms_doc_is_site($slug)) {
        cms_ensure_site_locale($locale);
        $upd = db()->prepare('UPDATE site_settings SET draft = ?, version = ? WHERE locale = ? AND version = ?');
        $upd->execute([$json, $next, $locale, $current]);
        return $upd->rowCount();
    }
    $upd = db()->prepare('UPDATE pages SET draft = ?, version = ? WHERE slug = ? AND locale = ? AND version = ?');
    $upd->execute([$json, $next, $slug, $locale, $current]);
    return $upd->rowCount();
}

function cms_doc_write_publish(string $slug, array $prepared, int $ver, int $current): int
{
    $json = json_encode($prepared, JSON_UNESCAPED_UNICODE);
    $locale = cms_request_locale();
    if (cms_doc_is_site($slug)) {
        cms_ensure_site_locale($locale);
        $upd = db()->prepare('UPDATE site_settings SET content = ?, draft = NULL, version = ? WHERE locale = ? AND version = ?');
        $upd->execute([$json, $ver, $locale, $current]);
        return $upd->rowCount();
    }
    $upd = db()->prepare('UPDATE pages SET content = ?, draft = NULL, version = ? WHERE slug = ? AND locale = ? AND version = ?');
    $upd->execute([$json, $ver, $slug, $locale, $current]);
    return $upd->rowCount();
}

function cms_ensure_site_locale(string $locale): void
{
    $locale = cms_normalize_locale($locale);
    $stmt = db()->prepare('SELECT locale FROM site_settings WHERE locale = ?');
    $stmt->execute([$locale]);
    if ($stmt->fetch()) {
        return;
    }
    $src = db()->prepare('SELECT content, draft, version FROM site_settings WHERE locale = ?');
    $src->execute(['es']);
    $row = $src->fetch();
    $content = $row['content'] ?? json_encode(new stdClass(), JSON_UNESCAPED_UNICODE);
    $draft = $row['draft'] ?? null;
    $ins = db()->prepare('INSERT INTO site_settings (locale, content, draft, version) VALUES (?, ?, ?, 1)');
    $ins->execute([$locale, $content, $draft]);
}

function cms_doc_read_meta(string $slug): array
{
    $locale = cms_request_locale();
    if (cms_doc_is_site($slug)) {
        $stmt = db()->prepare('SELECT updated_at, version FROM site_settings WHERE locale = ?');
        $stmt->execute([$locale]);
        return $stmt->fetch() ?: [];
    }
    $fresh = db()->prepare('SELECT updated_at, version FROM pages WHERE slug = ? AND locale = ?');
    $fresh->execute([$slug, $locale]);
    return $fresh->fetch() ?: [];
}

function cms_doc_conflict(string $slug, string $message): never
{
    $row = cms_doc_read($slug, false);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $draft = decode_json_col($row['draft'] ?? '');
    json_out([
        'message' => $message,
        'version' => (int) $row['version'],
        'updated_at' => $row['updated_at'] ?? null,
        'content' => cms_prepare_document($draft !== [] ? $draft : decode_json_col($row['content']), $slug),
    ], 409);
}

function cms_doc_save_draft(string $slug): never
{
    $input = json_input();
    $content = $input['content'] ?? null;
    $err = validate_cms_payload($content);
    if ($err) {
        json_out($err, 400);
    }
    /** @var array $content */
    /** @var array $content */
    $content = migrate_cms_document($content, $slug);
    if (cms_doc_is_site($slug)) {
        $guard = validate_cms_guards($content, 'sitio');
        if ($guard) {
            json_out($guard, 400);
        }
    }

    $row = cms_doc_read($slug, false);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $message = cms_doc_save_conflict_message($slug);
    $current = cms_doc_require_version($slug, $row, $input['version'] ?? null, $message);
    if (cms_doc_is_site($slug)) {
        $stored = decode_json_col($row['draft'] ?? '');
        if ($stored === []) {
            $stored = decode_json_col($row['content']);
        }
        $raw = is_array($input['content'] ?? null) ? $input['content'] : [];
        $content['chatbotMode'] = cms_resolve_chatbot_mode($raw, is_array($stored) ? $stored : []);
    }
    if (!cms_doc_is_site($slug)) {
        $guard = validate_cms_guards($content, $slug);
        if ($guard) {
            json_out($guard, 400);
        }
    }
    $prepared = cms_prepare_document($content, $slug);
    $next = $current + 1;
    if (cms_doc_write_draft($slug, $prepared, $next, $current) === 0) {
        cms_doc_conflict($slug, $message);
    }
    $meta = cms_doc_read_meta($slug);
    $updatedAt = (int) ($meta['version'] ?? 0) === $next ? ($meta['updated_at'] ?? null) : null;
    json_out(['ok' => true, 'version' => $next, 'updated_at' => $updatedAt, 'content' => $prepared]);
}

function cms_doc_require_version(string $slug, array $row, mixed $given, string $message): int
{
    $current = (int) $row['version'];
    $err = cms_version_guard($current, $given);
    if ($err) {
        if ($err['status'] === 409) {
            cms_doc_conflict($slug, $message);
        }
        json_out($err['body'], $err['status']);
    }
    return $current;
}

function cms_doc_publish(string $slug): never
{
    $row = cms_doc_read($slug, false);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $message = cms_doc_publish_conflict_message();
    $current = cms_doc_require_version($slug, $row, json_input()['version'] ?? null, $message);
    $draft = decode_json_col($row['draft'] ?? '');
    $published = decode_json_col($row['content'] ?? '{}');
    $next = $draft !== [] ? $draft : $published;
    $next = cms_prepare_document($next, $slug);
    $guard = validate_cms_guards($next, $slug);
    if ($guard) {
        json_out($guard, 400);
    }
    $ver = $current + 1;
    $conn = db();
    $conn->beginTransaction();
    try {
        if (cms_doc_write_publish($slug, $next, $ver, $current) === 0) {
            $conn->rollBack();
            cms_doc_conflict($slug, $message);
        }
        cms_revisions_insert($slug, cms_request_locale(), (string) ($_SESSION['admin_username'] ?? 'admin'), $next);
        $conn->commit();
    } catch (Throwable $err) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $err;
    }
    cms_dispatch_webhooks('publish', [
        'slug' => $slug,
        'locale' => cms_request_locale(),
        'version' => $ver,
        'path' => cms_lookup_page_path($slug),
    ]);
    json_out(['ok' => true, 'version' => $ver, 'content' => $next]);
}

function cms_doc_restore(string $slug, int $id): never
{
    $row = cms_revisions_get($slug, $id, cms_request_locale());
    if (!$row) {
        json_out(['message' => 'Revisión no encontrada'], 404);
    }
    $snapshot = cms_prepare_document(decode_json_col($row['snapshot']), $slug);
    $curRow = cms_doc_read($slug, false);
    if (!$curRow) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $message = cms_doc_publish_conflict_message();
    $current = cms_doc_require_version($slug, $curRow, json_input()['version'] ?? null, $message);
    $ver = $current + 1;
    if (cms_doc_write_draft($slug, $snapshot, $ver, $current) === 0) {
        cms_doc_conflict($slug, $message);
    }
    json_out(['ok' => true, 'version' => $ver, 'content' => $snapshot]);
}

function list_revisions(string $slug): array
{
    return cms_revisions_list($slug, cms_request_locale());
}

function publish_document(string $slug): never
{
    cms_doc_publish($slug);
}

function restore_revision(string $slug, int $id): never
{
    cms_doc_restore($slug, $id);
}
