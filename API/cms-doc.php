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

function cms_doc_read(string $slug): ?array
{
    if (cms_doc_is_site($slug)) {
        $row = db()->query('SELECT content, draft, version, updated_at FROM site_settings WHERE id = 1')->fetch() ?: null;
        if (!$row) {
            return null;
        }
        $row['slug'] = 'sitio';
        $row['title'] = 'Apariencia del sitio';
        return $row;
    }
    $stmt = db()->prepare('SELECT slug, title, content, draft, version, updated_at FROM pages WHERE slug = ?');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
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
    if (cms_doc_is_site($slug)) {
        $upd = db()->prepare('UPDATE site_settings SET draft = ?, version = ? WHERE id = 1 AND version = ?');
        $upd->execute([$json, $next, $current]);
        return $upd->rowCount();
    }
    $upd = db()->prepare('UPDATE pages SET draft = ?, version = ? WHERE slug = ? AND version = ?');
    $upd->execute([$json, $next, $slug, $current]);
    return $upd->rowCount();
}

function cms_doc_write_publish(string $slug, array $prepared, int $ver, int $current): int
{
    $json = json_encode($prepared, JSON_UNESCAPED_UNICODE);
    if (cms_doc_is_site($slug)) {
        $upd = db()->prepare('UPDATE site_settings SET content = ?, draft = NULL, version = ? WHERE id = 1 AND version = ?');
        $upd->execute([$json, $ver, $current]);
        return $upd->rowCount();
    }
    $upd = db()->prepare('UPDATE pages SET content = ?, draft = NULL, version = ? WHERE slug = ? AND version = ?');
    $upd->execute([$json, $ver, $slug, $current]);
    return $upd->rowCount();
}

function cms_doc_read_meta(string $slug): array
{
    if (cms_doc_is_site($slug)) {
        return db()->query('SELECT updated_at, version FROM site_settings WHERE id = 1')->fetch() ?: [];
    }
    $fresh = db()->prepare('SELECT updated_at, version FROM pages WHERE slug = ?');
    $fresh->execute([$slug]);
    return $fresh->fetch() ?: [];
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
    if (cms_doc_is_site($slug)) {
        $guard = validate_cms_guards($content, 'sitio');
        if ($guard) {
            json_out($guard, 400);
        }
    }

    if (cms_doc_is_site($slug)) {
        $row = db()->query('SELECT version, content, draft, updated_at FROM site_settings WHERE id = 1')->fetch();
    } else {
        $stmt = db()->prepare('SELECT version, content, draft FROM pages WHERE slug = ?');
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
    }
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $current = (int) $row['version'];
    $verErr = cms_version_guard($current, $input['version'] ?? null);
    if ($verErr) {
        if ($verErr['status'] === 400) {
            json_out($verErr['body'], 400);
        }
        $draft = decode_json_col($row['draft'] ?? '');
        $shown = $draft !== [] ? $draft : decode_json_col($row['content']);
        json_out([
            'message' => cms_doc_save_conflict_message($slug),
            'version' => $current,
            'updated_at' => $row['updated_at'] ?? null,
            'content' => cms_prepare_document($shown, $slug),
        ], 409);
    }
    if ($slug === 'inicio') {
        cms_doc_reject_bad_inicio_sections($content);
        $content = normalize_inicio_sections($content);
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
        json_out(['message' => cms_doc_save_conflict_message($slug)], 409);
    }
    $meta = cms_doc_read_meta($slug);
    json_out(['ok' => true, 'version' => (int) ($meta['version'] ?? $next), 'updated_at' => $meta['updated_at'] ?? null, 'content' => $prepared]);
}

function cms_doc_require_version(int $current): int
{
    $input = json_input();
    $err = cms_version_guard($current, $input['version'] ?? null);
    if ($err) {
        $body = $err['body'];
        if ($err['status'] === 409) {
            $body['message'] = cms_doc_publish_conflict_message();
        }
        json_out($body, $err['status']);
    }
    return $current;
}

function cms_read_expected_version(int $current): int
{
    return cms_doc_require_version($current);
}

function cms_doc_publish(string $slug): never
{
    $row = cms_doc_read($slug);
    if (!$row) {
        json_out(['message' => cms_doc_not_found_message($slug)], 404);
    }
    $current = cms_doc_require_version((int) $row['version']);
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
    if (cms_doc_write_publish($slug, $next, $ver, $current) === 0) {
        json_out(['message' => cms_doc_publish_conflict_message()], 409);
    }
    json_out(['ok' => true, 'version' => $ver, 'content' => $next]);
}

function cms_doc_restore(string $slug, int $id): never
{
    $stmt = db()->prepare('SELECT snapshot FROM revisions WHERE id = ? AND slug = ?');
    $stmt->execute([$id, $slug]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Revisión no encontrada'], 404);
    }
    $snapshot = cms_prepare_document(decode_json_col($row['snapshot']), $slug);
    $curRow = cms_doc_read($slug) ?? [];
    $current = cms_doc_require_version((int) ($curRow['version'] ?? 1));
    $ver = $current + 1;
    if (cms_doc_write_draft($slug, $snapshot, $ver, $current) === 0) {
        json_out(['message' => cms_doc_publish_conflict_message()], 409);
    }
    json_out(['ok' => true, 'version' => $ver, 'content' => $snapshot]);
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

function publish_document(string $slug): never
{
    cms_doc_publish($slug);
}

function restore_revision(string $slug, int $id): never
{
    cms_doc_restore($slug, $id);
}
