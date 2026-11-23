<?php
declare(strict_types=1);

function cms_pages_delete_locale(string $slug, string $locale): void
{
    cms_revisions_delete_slug($slug, $locale);
    db()->prepare('DELETE FROM preview_tokens WHERE slug = ?')->execute([$slug]);
    db()->prepare('DELETE FROM pages WHERE slug = ? AND locale = ?')->execute([$slug, $locale]);
}
