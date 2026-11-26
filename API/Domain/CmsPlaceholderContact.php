<?php
declare(strict_types=1);

/** Solo los valores de relleno conocidos. Una dirección real en otro distrito se conserva. */
function cms_placeholder_contact_kind(string $value): ?string
{
    $value = trim($value);
    if (preg_match('/\A(?:mailto:)?contacto@mattinnova\.pe\z/i', $value)) {
        return 'email';
    }
    if (preg_match('/\A(?:tel:)?[+\d\s().-]+\z/i', $value)
        && in_array(preg_replace('/\D/', '', $value), ['987654321', '51987654321'], true)) {
        return 'phone';
    }
    if (preg_match('/\Arepública de panamá 3591\b/iu', preg_replace('/\Aav\.?\s*/iu', '', $value))
        && preg_match('/\bsan isidro\b/iu', $value)) {
        return 'address';
    }
    return null;
}

function cms_document_contact_items(stdClass $doc, string $slug): array
{
    $items = [];
    foreach (is_array($doc->blocks ?? null) ? $doc->blocks : [] as $block) {
        if (is_object($block) && ($block->type ?? '') === 'contactCards' && is_array($block->props->items ?? null)) {
            array_push($items, ...$block->props->items);
        }
    }
    foreach (cms_legacy_contact_fields($slug) as $field) {
        if (is_array($doc->{$field} ?? null)) {
            array_push($items, ...$doc->{$field});
        }
    }
    return $items;
}

function cms_legacy_contact_fields(string $slug): array
{
    return $slug === 'contacto' ? ['contactCards', 'cards'] : ['contactCards'];
}

function cms_contact_item_kind(stdClass $item): ?string
{
    $text = trim(is_string($item->text ?? null) ? $item->text : '');
    if (filter_var($text, FILTER_VALIDATE_EMAIL)) {
        return 'email';
    }
    if (preg_match('/\A[+\d\s().-]+\z/', $text) && strlen((string) preg_replace('/\D/', '', $text)) >= 7) {
        return 'phone';
    }
    $title = is_string($item->title ?? null) ? $item->title : '';
    $icon = is_string($item->icon ?? null) ? $item->icon : '';
    $label = $title . ' ' . $icon;
    if (preg_match('/correo|email|envelope/i', $label)) {
        return 'email';
    }
    if (preg_match('/whatsapp|teléfono|phone|telephone/iu', $label)) {
        return 'phone';
    }
    return preg_match('/domicilio|dirección|address|matriz|ubicación|geo-alt|map-pin/iu', $label)
        ? 'address'
        : null;
}

function cms_contact_values(array $items): array
{
    $values = [];
    foreach ($items as $item) {
        if (!$item instanceof stdClass || !is_string($item->text ?? null)) {
            continue;
        }
        $kind = cms_contact_item_kind($item);
        if ($kind !== null && !isset($values[$kind]) && trim($item->text) !== ''
            && cms_placeholder_contact_kind($item->text) === null) {
            $values[$kind] = $item->text;
        }
    }
    return $values;
}

function cms_fill_english_contact_items(array $items, array $spanish): array
{
    $titles = ['address' => 'Legal address', 'email' => 'Email', 'phone' => 'WhatsApp'];
    $values = cms_contact_values($spanish);
    if ($items === []) {
        foreach ($values as $kind => $text) {
            $items[] = ['title' => $titles[$kind], 'text' => $text];
        }
        return $items;
    }
    foreach ($items as $index => $item) {
        if (!is_array($item) || trim(is_string($item['text'] ?? null) ? $item['text'] : '') !== '') {
            continue;
        }
        $kind = cms_contact_item_kind((object) $item);
        if ($kind !== null && isset($values[$kind])) {
            $items[$index]['text'] = $values[$kind];
            if (empty($item['title'])) {
                $items[$index]['title'] = $titles[$kind];
            }
        }
    }
    return $items;
}

function cms_fix_placeholder_contact(): void
{
    $pdo = db();
    // El migrador mantiene esta transacción abierta hasta guardar su marcador.
    $pages = $pdo->query('SELECT slug, locale, content, draft FROM pages FOR UPDATE')->fetchAll();
    $sites = $pdo->query('SELECT locale, content, draft FROM site_settings FOR UPDATE')->fetchAll();
    $spanish = [];
    foreach ($pages as $row) {
        if ($row['locale'] === 'es') {
            foreach (['content', 'draft'] as $column) {
                $doc = json_decode((string) $row[$column]);
                if ($doc instanceof stdClass) {
                    $spanish[$row['slug']][$column] = cms_contact_values(cms_document_contact_items($doc, $row['slug']));
                }
            }
        }
    }

    $seedValues = [];
    foreach (pages_seed() as $slug => $page) {
        $doc = json_decode(json_encode($page['content'], JSON_THROW_ON_ERROR));
        $seedValues[$slug] = cms_contact_values(cms_document_contact_items($doc, $slug));
    }
    foreach ($pages as $row) {
        $slug = $row['slug'];
        $published = ($spanish[$slug]['content'] ?? []) + ($seedValues[$slug] ?? [])
            + ($spanish['inicio']['content'] ?? []) + ($seedValues['inicio'] ?? []);
        $draft = ($spanish[$slug]['draft'] ?? []) + $published;
        cms_update_contact_columns('pages', $row, [
            'content' => $published,
            'draft' => $draft,
        ]);
    }

    $siteSeed = json_decode(json_encode(site_seed(), JSON_THROW_ON_ERROR));
    $siteValues = ['content' => $siteSeed, 'draft' => $siteSeed];
    foreach ($sites as $row) {
        if ($row['locale'] === 'es') {
            $published = json_decode((string) $row['content']);
            $draft = json_decode((string) $row['draft']);
            $publishedValues = cms_site_contact_values($published, $siteSeed);
            $siteValues = [
                'content' => $publishedValues,
                'draft' => cms_site_contact_values($draft, $publishedValues),
            ];
            break;
        }
    }
    foreach ($sites as $row) {
        cms_update_contact_columns('site_settings', $row, $siteValues);
    }
}

function cms_site_contact_values(mixed $source, stdClass $fallback): stdClass
{
    $values = (object) ['footer' => new stdClass()];
    foreach (['ctaEmail', 'whatsappNumber'] as $field) {
        $value = $source->{$field} ?? null;
        $values->{$field} = cms_valid_contact_source($value) ? $value : $fallback->{$field};
    }
    foreach (['address', 'email', 'phone'] as $field) {
        $value = $source->footer->{$field} ?? null;
        $values->footer->{$field} = cms_valid_contact_source($value) ? $value : $fallback->footer->{$field};
    }
    return $values;
}

function cms_valid_contact_source(mixed $value): bool
{
    return is_string($value) && trim($value) !== '' && cms_placeholder_contact_kind($value) === null;
}

function cms_update_contact_columns(string $table, array $row, array $sources): void
{
    $updates = [];
    foreach ($sources as $column => $source) {
        $doc = json_decode((string) $row[$column]);
        if (!$doc instanceof stdClass) {
            continue;
        }
        $changed = $table === 'pages'
            ? cms_replace_page_contact_placeholders($doc, $row['slug'], $source)
            : cms_replace_site_contact_placeholders($doc, $source);
        if ($changed) {
            $updates[$column] = json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        }
    }
    if ($updates === []) {
        return;
    }
    $fields = implode(', ', array_map(static fn (string $column): string => "$column = ?", array_keys($updates)));
    $stmt = db()->prepare("UPDATE $table SET $fields, version = version + 1 WHERE locale = ?"
        . ($table === 'pages' ? ' AND slug = ?' : ''));
    $stmt->execute(array_merge(array_values($updates), [$row['locale']], $table === 'pages' ? [$row['slug']] : []));
}

function cms_replace_page_contact_placeholders(stdClass $doc, string $slug, array $values): bool
{
    $changed = false;
    foreach (cms_document_contact_items($doc, $slug) as $item) {
        if (!$item instanceof stdClass || !is_string($item->text ?? null)) {
            continue;
        }
        $kind = cms_placeholder_contact_kind($item->text);
        if ($kind !== null && isset($values[$kind])) {
            $item->text = $values[$kind];
            $changed = true;
        }
    }
    return $changed;
}

function cms_replace_site_contact_placeholders(stdClass $doc, stdClass $values): bool
{
    $changed = false;
    foreach (['ctaEmail' => 'email', 'whatsappNumber' => 'phone'] as $field => $kind) {
        if (is_string($doc->{$field} ?? null) && cms_placeholder_contact_kind($doc->{$field}) === $kind) {
            $doc->{$field} = $values->{$field};
            $changed = true;
        }
    }
    foreach (['address' => 'address', 'email' => 'email', 'phone' => 'phone'] as $field => $kind) {
        if (is_string($doc->footer->{$field} ?? null) && cms_placeholder_contact_kind($doc->footer->{$field}) === $kind) {
            $doc->footer->{$field} = $values->footer->{$field};
            $changed = true;
        }
    }
    return $changed;
}
