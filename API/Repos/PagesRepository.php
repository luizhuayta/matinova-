<?php
declare(strict_types=1);

function cms_pages_insert_locale(string $slug, string $locale, array $source): bool
{
    $stmt = db()->prepare(
        'INSERT INTO pages (slug, locale, title, content, draft, path, show_in_menu, menu_order, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
    );
    try {
        $stmt->execute([
            $slug, $locale, $source['title'], $source['content'], $source['draft'],
            $source['path'], $source['show_in_menu'], $source['menu_order'],
        ]);
        return true;
    } catch (PDOException $err) {
        if ((int) ($err->errorInfo[1] ?? 0) !== 1062) {
            throw $err;
        }
        return false;
    }
}

function cms_pages_create_locales(string $slug, string $locale, array $source): ?array
{
    $conn = db();
    $conn->beginTransaction();
    try {
        if (!cms_pages_insert_locale($slug, $locale, $source)) {
            $conn->rollBack();
            return null;
        }
        $translations = $locale === 'es' && cms_pages_insert_locale($slug, 'en', $source) ? ['en'] : [];
        $conn->commit();
        return $translations;
    } catch (Throwable $err) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $err;
    }
}

function cms_pages_delete_locale(string $slug, string $locale): void
{
    cms_revisions_delete_slug($slug, $locale);
    db()->prepare('DELETE FROM preview_tokens WHERE slug = ?')->execute([$slug]);
    db()->prepare('DELETE FROM pages WHERE slug = ? AND locale = ?')->execute([$slug, $locale]);
}
