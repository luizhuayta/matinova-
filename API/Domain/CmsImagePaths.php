<?php
declare(strict_types=1);

/**
 * Rutas públicas de fotos pesadas: el CMS guarda WebP y el <picture> usa JPG de respaldo.
 * Idempotente: correr dos veces no cambia un documento ya reescrito.
 */
function cms_public_image_rewrites(): array
{
    return [
        'software-banner.png' => 'software-banner.webp',
        'microsoft3651.png' => 'microsoft3651.webp',
        'hardware2026.png' => 'hardware2026.webp',
        'consultoria.png' => 'consultoria.webp',
        'saas2026.png' => 'saas2026.webp',
        'soluciones.png' => 'soluciones.webp',
        'software.png' => 'software.webp',
        'hard.avif' => 'hardware2026.webp',
    ];
}

function cms_rewrite_public_image_string(string $value): string
{
    foreach (cms_public_image_rewrites() as $from => $to) {
        if ($from !== '' && str_contains($value, $from)) {
            $value = str_replace($from, $to, $value);
        }
    }
    return $value;
}

function cms_rewrite_public_image_tree(mixed &$value): bool
{
    $changed = false;
    if (is_string($value)) {
        $next = cms_rewrite_public_image_string($value);
        if ($next !== $value) {
            $value = $next;
            return true;
        }
        return false;
    }
    if (!is_array($value)) {
        return false;
    }
    foreach ($value as &$item) {
        if (cms_rewrite_public_image_tree($item)) {
            $changed = true;
        }
    }
    unset($item);
    return $changed;
}

function cms_rewrite_stored_public_images(): void
{
    $pdo = db();
    $pages = $pdo->query('SELECT slug, locale, content, draft FROM pages')->fetchAll();
    $upd = $pdo->prepare('UPDATE pages SET content = ?, draft = ? WHERE slug = ? AND locale = ?');
    foreach ($pages as $row) {
        $content = decode_json_col($row['content'] ?? '{}');
        $draft = decode_json_col($row['draft'] ?? '');
        $changed = cms_rewrite_public_image_tree($content);
        $draftChanged = $draft !== [] && cms_rewrite_public_image_tree($draft);
        if (!$changed && !$draftChanged) {
            continue;
        }
        $draftJson = $row['draft'] ?? null;
        if ($draftChanged) {
            $draftJson = json_encode($draft, JSON_UNESCAPED_UNICODE);
        }
        $upd->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $row['slug'], $row['locale']]);
    }

    $sites = $pdo->query('SELECT locale, content, draft FROM site_settings')->fetchAll();
    $updSite = $pdo->prepare('UPDATE site_settings SET content = ?, draft = ? WHERE locale = ?');
    foreach ($sites as $site) {
        $content = decode_json_col($site['content'] ?? '{}');
        $draft = decode_json_col($site['draft'] ?? '');
        $changed = cms_rewrite_public_image_tree($content);
        $draftChanged = $draft !== [] && cms_rewrite_public_image_tree($draft);
        if (!$changed && !$draftChanged) {
            continue;
        }
        $draftJson = $site['draft'] ?? null;
        if ($draftChanged) {
            $draftJson = json_encode($draft, JSON_UNESCAPED_UNICODE);
        }
        $updSite->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $draftJson, $site['locale']]);
    }
}
