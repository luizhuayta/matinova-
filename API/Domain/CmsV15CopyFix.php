<?php
declare(strict_types=1);

const CMS_V15_SERVICE_HERO_ALTS = [
    'servicios-software' => ['Software Banner', 'Banner de Software'],
    'servicios-saas' => ['Saas Banner', 'Banner de SaaS'],
    'servicios-hardware' => ['Hardware Banner', 'Banner de Hardware'],
    'servicios-consultoria' => ['consultoria Banner', 'Banner de Consultoría'],
    'servicios-soluciones-ti' => ['soluciones Banner', 'Banner de Soluciones TI'],
];

function cms_fix_en_untranslated_v15(): void
{
    $pdo = db();
    $pages = $pdo->query(
        "SELECT slug, locale, content, draft FROM pages
         WHERE (locale = 'en' AND slug IN (
             'inicio', 'acerca-de', 'contacto', 'servicios', 'servicios-software',
             'servicios-saas', 'servicios-hardware', 'servicios-consultoria', 'servicios-soluciones-ti'
         )) OR (locale = 'es' AND slug IN (
             'servicios-software', 'servicios-saas', 'servicios-hardware', 'servicios-consultoria', 'servicios-soluciones-ti'
         ))
         FOR UPDATE"
    )->fetchAll();
    $update = $pdo->prepare('UPDATE pages SET content = ?, draft = ?, version = version + 1 WHERE slug = ? AND locale = ?');
    foreach ($pages as $row) {
        $next = [];
        foreach (['content', 'draft'] as $column) {
            $doc = json_decode((string) $row[$column]);
            if ($doc instanceof stdClass && cms_v15_repair_copy($doc, $row['slug'], $row['locale'])) {
                $next[$column] = json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            }
        }
        if ($next !== []) {
            $update->execute([$next['content'] ?? $row['content'], $next['draft'] ?? $row['draft'], $row['slug'], $row['locale']]);
        }
    }
}

function cms_v15_repair_copy(stdClass $doc, string $slug, string $locale): bool
{
    $blocks = is_array($doc->blocks ?? null) ? $doc->blocks : [];
    if ($slug === 'servicios' && $locale === 'en') {
        return cms_v15_insert_it_service($blocks);
    }
    $changed = false;
    foreach ($blocks as $block) {
        if (!$block instanceof stdClass || !(($block->props ?? null) instanceof stdClass)
            || !is_string($block->type ?? null)) {
            continue;
        }
        $props = $block->props;
        $type = $block->type ?? '';
        if (isset(CMS_V15_SERVICE_HERO_ALTS[$slug])) {
            $changed = cms_v15_repair_service_block($props, $type, $slug, $locale) || $changed;
            continue;
        }
        if ($locale !== 'en') {
            continue;
        }
        if ($slug === 'inicio' && $type === 'services') {
            $translations = [
                'Consultoría informática' => 'IT consulting',
                'Tecnología de la información' => 'Information technology',
                'Consultoría de gestión' => 'Management consulting',
                'Soluciones SaaS' => 'SaaS solutions',
                'Hardware e infraestructura' => 'Hardware and infrastructure',
                'Desarrollo de software a medida' => 'Custom software development',
            ];
            foreach (is_array($props->cards ?? null) ? $props->cards : [] as $card) {
                $alt = $card instanceof stdClass ? ($card->alt ?? null) : null;
                if (is_string($alt) && isset($translations[$alt])) {
                    $card->alt = $translations[$alt];
                    $changed = true;
                }
            }
        } elseif ($slug === 'contacto' && $type === 'faq') {
            $spanish = cms_studio_faq_items('es');
            $english = cms_studio_faq_items('en');
            $changed = cms_v15_replace_exact($props, 'title', 'Preguntas de finanzas y TI', $english['title']) || $changed;
            if (cms_v15_faq_matches($props->items ?? null, $spanish['items'])) {
                $props->items = $english['items'];
                $changed = true;
            }
        } elseif ($slug === 'contacto' && $type === 'map') {
            $changed = cms_v15_replace_exact($props, 'title', 'Dónde estamos', 'Where we are') || $changed;
            $address = 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, ';
            $changed = cms_v15_replace_exact($props, 'text', $address . 'Perú.', $address . 'Peru.') || $changed;
        } elseif ($slug === 'acerca-de' && $type === 'contactCards') {
            foreach (is_array($props->items ?? null) ? $props->items : [] as $item) {
                if ($item instanceof stdClass) {
                    $changed = cms_v15_replace_exact($item, 'text', '(+51) 992 422 219', '+51 992 422 219') || $changed;
                }
            }
        }
    }
    return $changed;
}

function cms_v15_repair_service_block(stdClass $props, string $type, string $slug, string $locale): bool
{
    if ($locale === 'en') {
        return match ($type) {
            'serviceHero' => cms_v15_replace_exact($props, 'cta', 'Hablar con un experto', 'Talk to an expert'),
            'reasons' => cms_v15_replace_exact($props, 'title', 'Qué queda instalado', 'What gets installed'),
            default => false,
        };
    }
    if ($locale !== 'es') {
        return false;
    }
    if ($type === 'serviceHero') {
        [$before, $after] = CMS_V15_SERVICE_HERO_ALTS[$slug];
        return cms_v15_replace_exact($props, 'heroAlt', $before, $after);
    }
    if ($type !== 'reasons' || !is_array($props->items ?? null)) {
        return false;
    }
    $changed = false;
    foreach ($props->items as $item) {
        if (!$item instanceof stdClass) {
            continue;
        }
        if ($slug === 'servicios-software') {
            foreach (['title', 'alt'] as $field) {
                $changed = cms_v15_replace_exact($item, $field, 'Pagina Ecommerce para tu negocio', 'Página Ecommerce para tu negocio') || $changed;
            }
        } elseif ($slug === 'servicios-saas' && is_string($item->text ?? null) && str_contains($item->text, 'multi sucursales')) {
            $item->text = str_replace('multi sucursales', 'multisucursales', $item->text);
            $changed = true;
        }
    }
    return $changed;
}

function cms_v15_replace_exact(stdClass $props, string $field, string $before, string $after): bool
{
    if (($props->{$field} ?? null) !== $before) {
        return false;
    }
    $props->{$field} = $after;
    return true;
}

function cms_v15_faq_matches(mixed $items, array $original): bool
{
    if (!is_array($items) || count($items) !== count($original)) {
        return false;
    }
    foreach ($original as $index => $expected) {
        $item = $items[$index] ?? null;
        if (!$item instanceof stdClass || count((array) $item) !== count($expected)
            || ($item->question ?? null) !== $expected['question']
            || ($item->answer ?? null) !== $expected['answer']) {
            return false;
        }
    }
    return true;
}

function cms_v15_insert_it_service(array $blocks): bool
{
    $path = '/servicios/soluciones-ti';
    $target = null;
    foreach ($blocks as $block) {
        if (!$block instanceof stdClass || ($block->type ?? '') !== 'serviceCards' || !is_array($block->props->cards ?? null)) {
            continue;
        }
        foreach ($block->props->cards as $card) {
            if ($card instanceof stdClass && ($card->path ?? null) === $path) {
                return false;
            }
        }
        if ($target === null && count($block->props->cards) === 5) {
            $target = $block->props;
        }
    }
    if ($target === null) {
        return false;
    }
    array_splice($target->cards, 2, 0, [(object) [
        'path' => $path,
        'img' => 'imas.jpg',
        'title' => 'Information technology',
        'text' => 'Networks, servers, backups and monitoring so Lima and the provinces keep running.',
        'link' => 'View IT solutions',
    ]]);
    return true;
}
