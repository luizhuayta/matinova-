<?php
declare(strict_types=1);

function cms_image_sync_site_fields(): array
{
    // Campos de imagen del SITE_SCHEMA del inspector.
    return [
        ['type' => 'image', 'path' => 'logo'],
        ['type' => 'image', 'path' => 'founderImage'],
        ['type' => 'group', 'path' => 'footer', 'children' => [['type' => 'image', 'path' => 'libroImage']]],
        ['type' => 'list', 'path' => 'splashImages', 'item' => [['type' => 'image', 'path' => 'image']]],
    ];
}

function cms_image_sync_fields(mixed $old, mixed $next, mixed $english, array $fields): int
{
    if (!$old instanceof stdClass || !$next instanceof stdClass || !$english instanceof stdClass) {
        return 0;
    }
    $count = 0;
    foreach ($fields as $field) {
        $key = $field['path'];
        $previous = $old->$key ?? null;
        $updated = $next->$key ?? null;
        $translated = $english->$key ?? null;
        switch ($field['type']) {
            case 'image':
                if (is_string($updated) && $updated !== $previous && $translated === $previous) {
                    $english->$key = $updated;
                    $count++;
                }
                break;
            case 'group':
                $count += cms_image_sync_fields($previous, $updated, $translated, $field['children']);
                break;
            case 'list':
                if (is_array($previous) && is_array($updated) && is_array($translated)
                    && count($previous) === count($updated) && count($previous) === count($translated)) {
                    foreach ($previous as $index => $item) {
                        $count += cms_image_sync_fields($item, $updated[$index], $translated[$index], $field['item']);
                    }
                }
                break;
        }
    }
    return $count;
}

/** Devuelve los pares de índices, o null cuando no hay un emparejamiento seguro. */
function cms_image_sync_block_pairs(array $old, array $other): ?array
{
    $byId = [];
    foreach ($other as $index => $block) {
        if (is_string($block->id ?? null) && $block->id !== '') {
            $byId[$block->id] = array_key_exists($block->id, $byId) ? null : $index;
        }
    }
    $pairs = [];
    $shared = [];
    foreach ($old as $index => $block) {
        $id = $block->id ?? null;
        if (!is_string($id) || !array_key_exists($id, $byId)) {
            continue;
        }
        $match = $byId[$id];
        if ($match === null || isset($shared[$id])) {
            return null;
        }
        $shared[$id] = true;
        if (is_string($block->type ?? null) && $block->type === ($other[$match]->type ?? null)) {
            $pairs[$index] = $match;
        }
    }
    if ($pairs !== []) {
        return $pairs;
    }
    if ($shared !== []) {
        return null;
    }
    $type = static fn (mixed $block): ?string => is_string($block->type ?? null) ? $block->type : null;
    return array_map($type, $old) === array_map($type, $other)
        ? array_keys($old)
        : null;
}

/** Modifica únicamente los valores de imagen. Devuelve null si la estructura es incompatible. */
function cms_image_sync_document(string $slug, stdClass $old, stdClass $next, stdClass $english): ?int
{
    $seo = ['type' => 'group', 'path' => 'seo', 'children' => cms_seo_fields()];
    if ($slug === 'sitio') {
        return cms_image_sync_fields($old, $next, $english, [$seo, ...cms_image_sync_site_fields()]);
    }
    if (!is_array($old->blocks ?? null) || !is_array($next->blocks ?? null) || !is_array($english->blocks ?? null)) {
        return null;
    }
    $nextPairs = cms_image_sync_block_pairs($old->blocks, $next->blocks);
    $englishPairs = cms_image_sync_block_pairs($old->blocks, $english->blocks);
    if ($nextPairs === null || $englishPairs === null) {
        return null;
    }
    $count = cms_image_sync_fields($old, $next, $english, [$seo]);
    foreach (array_intersect_key($nextPairs, $englishPairs) as $oldIndex => $nextIndex) {
        $oldBlock = $old->blocks[$oldIndex];
        $nextBlock = $next->blocks[$nextIndex];
        $englishBlock = $english->blocks[$englishPairs[$oldIndex]];
        $schema = cms_block_type($oldBlock->type ?? '')['schema'] ?? [];
        $count += cms_image_sync_fields($oldBlock, $nextBlock, $englishBlock, [
            ['type' => 'group', 'path' => 'props', 'children' => $schema],
            ['type' => 'group', 'path' => 'layout', 'children' => [['type' => 'image', 'path' => 'backgroundImage']]],
        ]);
    }
    return $count;
}
