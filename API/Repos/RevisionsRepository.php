<?php
declare(strict_types=1);

function cms_revisions_insert(string $slug, string $locale, string $author, array $snapshot): void
{
    $json = json_encode($snapshot, JSON_UNESCAPED_UNICODE);
    try {
        db()->prepare('INSERT INTO revisions (slug, locale, author, snapshot) VALUES (?, ?, ?, ?)')
            ->execute([$slug, $locale, $author, $json]);
    } catch (PDOException) {
        db()->prepare('INSERT INTO revisions (slug, author, snapshot) VALUES (?, ?, ?)')
            ->execute([$slug, $author, $json]);
    }
}

function cms_revisions_list(string $slug, string $locale): array
{
    try {
        $stmt = db()->prepare('SELECT id, author, created_at, snapshot FROM revisions WHERE slug = ? AND locale = ? ORDER BY id DESC LIMIT 40');
        $stmt->execute([$slug, $locale]);
    } catch (PDOException) {
        $stmt = db()->prepare('SELECT id, author, created_at, snapshot FROM revisions WHERE slug = ? ORDER BY id DESC LIMIT 40');
        $stmt->execute([$slug]);
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['snapshot'] = decode_json_col($row['snapshot']);
        $row['id'] = (int) $row['id'];
    }
    unset($row);
    return $rows;
}

function cms_revisions_get(string $slug, int $id, string $locale): ?array
{
    try {
        $stmt = db()->prepare('SELECT snapshot FROM revisions WHERE id = ? AND slug = ? AND locale = ?');
        $stmt->execute([$id, $slug, $locale]);
    } catch (PDOException) {
        $stmt = db()->prepare('SELECT snapshot FROM revisions WHERE id = ? AND slug = ?');
        $stmt->execute([$id, $slug]);
    }
    $row = $stmt->fetch();
    return $row ?: null;
}

function cms_revisions_delete_slug(string $slug, string $locale): void
{
    try {
        db()->prepare('DELETE FROM revisions WHERE slug = ? AND locale = ?')->execute([$slug, $locale]);
    } catch (PDOException) {
        db()->prepare('DELETE FROM revisions WHERE slug = ?')->execute([$slug]);
    }
}
