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
    cms_v15_update_pages(
        "(locale = 'en' AND slug IN (
            'inicio', 'acerca-de', 'contacto', 'servicios-software',
            'servicios-saas', 'servicios-hardware', 'servicios-consultoria', 'servicios-soluciones-ti'
        )) OR (locale = 'es' AND slug IN (
            'servicios-software', 'servicios-saas', 'servicios-hardware', 'servicios-consultoria', 'servicios-soluciones-ti'
        ))",
        'cms_v15_repair_copy'
    );
}

function cms_fix_duplicate_video_v15(): void
{
    cms_v15_update_pages("slug = 'acerca-de'", 'cms_v15_repair_duplicate_video');
}

/** El predicado y la función de reparación son internos al registro de migraciones. */
function cms_v15_update_pages(string $where, callable $repair): void
{
    $pdo = db();
    $pages = $pdo->query("SELECT slug, locale, content, draft FROM pages WHERE $where FOR UPDATE")->fetchAll();
    $update = $pdo->prepare('UPDATE pages SET content = ?, draft = ?, version = version + 1 WHERE slug = ? AND locale = ?');
    foreach ($pages as $row) {
        $next = [];
        foreach (['content', 'draft'] as $column) {
            $doc = json_decode((string) $row[$column]);
            if ($doc instanceof stdClass && $repair($doc, $row['slug'], $row['locale'], $column)) {
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

function cms_v15_repair_duplicate_video(stdClass $doc, string $slug, string $locale): bool
{
    if ($slug !== 'acerca-de') {
        return false;
    }
    $originalEmbed = 'https://www.youtube.com/embed/RtNdTuCxWoI';
    $originalTitle = $locale === 'en'
        ? 'Local Microsoft partner relationship and Microsoft 365 tenant'
        : 'Relacionamiento con Partner Microsoft Local y Tenant Microsoft 365';
    $channel = '@mattinnovasolution';
    $changed = false;
    foreach (is_array($doc->blocks ?? null) ? $doc->blocks : [] as $block) {
        if (!$block instanceof stdClass || ($block->type ?? '') !== 'videos') {
            continue;
        }
        $items = $block->props->items ?? null;
        if (!is_array($items) || count($items) !== 2) {
            continue;
        }
        foreach ($items as $item) {
            if (!$item instanceof stdClass || ($item->embed ?? null) !== $originalEmbed
                || (property_exists($item, 'title') && $item->title !== $originalTitle)
                || (property_exists($item, 'user') && $item->user !== $channel)) {
                continue 2;
            }
        }
        $block->props->items[1]->embed = 'https://www.youtube.com/embed/zAW2X2805Qw';
        $block->props->items[1]->user = $channel;
        $block->props->items[1]->title = 'Matt Innova Solution';
        $changed = true;
    }
    return $changed;
}

function cms_merge_consulting_cards_v15(): void
{
    $spanish = [];
    $rows = db()->query("SELECT slug, content, draft FROM pages WHERE locale = 'es' AND slug IN ('inicio', 'servicios') FOR UPDATE");
    foreach ($rows->fetchAll() as $row) {
        $slug = $row['slug'];
        $type = $slug === 'inicio' ? 'services' : 'serviceCards';
        foreach (['content', 'draft'] as $column) {
            $doc = json_decode((string) $row[$column]);
            if (!$doc instanceof stdClass) {
                continue;
            }
            // La posición se toma de la rejilla ES tras quitar su consultoría duplicada.
            cms_v15_repair_consulting($doc, $slug, 'es');
            foreach (is_array($doc->blocks ?? null) ? $doc->blocks : [] as $block) {
                if (($block->type ?? null) === $type && is_array($block->props->cards ?? null)) {
                    $source = cms_v15_it_card($block->props->cards);
                    if ($source !== null) {
                        $spanish[$slug][$column] = $source;
                        break;
                    }
                }
            }
        }
    }
    $seeds = ['es' => pages_seed(), 'en' => pages_seed_en()];
    cms_v15_update_pages(
        "slug IN ('inicio', 'servicios') AND locale IN ('es', 'en')",
        static function (stdClass $doc, string $slug, string $locale, string $column) use ($spanish, $seeds): bool {
            $source = $spanish[$slug][$column] ?? $spanish[$slug]['content'] ?? null;
            if ($source === null) {
                $seed = $seeds[$locale][$slug]['content'];
                $cards = $slug === 'inicio' ? $seed['services']['cards'] : $seed['cards'];
                $source = cms_v15_it_card(array_map(static fn (array $card): stdClass => (object) $card, $cards));
            }
            return cms_v15_repair_consulting($doc, $slug, $locale, $source);
        }
    );
}

function cms_v15_repair_consulting(stdClass $doc, string $slug, string $locale, ?array $itSource = null): bool
{
    if (!in_array($slug, ['inicio', 'servicios'], true) || !in_array($locale, ['es', 'en'], true)) {
        return false;
    }
    $english = $locale === 'en';
    $before = $english ? 'Six IT service lines' : 'Seis líneas de servicio TI';
    $after = $english ? 'Five IT service lines' : 'Cinco líneas de servicio TI';
    $titles = [$before => $after];
    if ($slug === 'servicios') {
        $titles += $english
            ? [
                'Six lines, each one through go-live.' => 'Five lines, each one through go-live.',
                'Software, hardware, SaaS, consulting, management and infrastructure. We quote with owners and dates, not a license catalog.'
                    => 'Software, hardware, SaaS, consulting and infrastructure. We quote with owners and dates, not a license catalog.',
            ]
            : [
                'Seis líneas, cada una hasta la puesta en marcha.' => 'Cinco líneas, cada una hasta la puesta en marcha.',
                'Software, hardware, SaaS, consultoría, gestión e infraestructura. Cotizamos con responsables y fechas, no con un catálogo de licencias.'
                    => 'Software, hardware, SaaS, consultoría e infraestructura. Cotizamos con responsables y fechas, no con un catálogo de licencias.',
            ];
    }
    $accents = $english ? ['Six' => 'Five', 'six' => 'five', 'Six lines' => 'Five lines']
        : ['Seis' => 'Cinco', 'seis' => 'cinco', 'Seis líneas' => 'Cinco líneas'];
    $type = $slug === 'inicio' ? 'services' : 'serviceCards';
    $changed = false;
    foreach (is_array($doc->blocks ?? null) ? $doc->blocks : [] as $block) {
        $props = $block->props ?? null;
        if (!$props instanceof stdClass || !in_array(($block->type ?? null), [$type, 'listingHero'], true)) {
            continue;
        }
        foreach (['title' => $titles, 'text' => $titles, 'titleAccent' => $titles + $accents] as $field => $copy) {
            $value = $props->{$field} ?? null;
            if (is_string($value) && isset($copy[$value])) {
                $props->{$field} = $copy[$value];
                $changed = true;
            }
        }
        if ($block->type === $type && is_array($props->cards ?? null)) {
            $changed = cms_v15_merge_consulting_grid($props->cards, $english, $type, $itSource) || $changed;
        }
    }
    return $changed;
}

function cms_v15_it_card(array $cards): ?array
{
    foreach ($cards as $index => $card) {
        foreach ([$card->path ?? null, $card->link ?? null] as $route) {
            if (is_string($route) && preg_match('~\A/(?:es/|en/)?servicios/soluciones-ti/?(?:[?#].*)?\z~', $route)) {
                return ['card' => $card, 'index' => $index];
            }
        }
    }
    return null;
}

function cms_v15_merge_consulting_grid(array &$cards, bool $english, string $type, ?array $itSource = null): bool
{
    $count = count($cards);
    $restoreIt = $count === 5 && $itSource !== null && cms_v15_it_card($cards) === null;
    if ($count !== 6 && !$restoreIt) {
        return false;
    }
    $main = $english ? 'IT consulting' : 'Consultoría informática';
    $duplicate = $english ? 'Management consulting' : 'Consultoría de gestión';
    $mainIndex = null;
    $duplicateIndex = null;
    foreach ($cards as $index => $card) {
        $title = $card->title ?? null;
        if ($title === $main) {
            if ($mainIndex !== null) {
                return false;
            }
            $mainIndex = $index;
        } elseif ($title === $duplicate) {
            if ($duplicateIndex !== null) {
                return false;
            }
            $duplicateIndex = $index;
        }
    }
    if ($mainIndex === null || $duplicateIndex === null) {
        return false;
    }
    $card = $cards[$mainIndex];
    $card->title = $english ? 'Consulting' : 'Consultoría';
    $card->text = $english
        ? 'Diagnosis, architecture and an implementation plan, with processes and indicators aligned so leadership sees the operation.'
        : 'Diagnóstico, arquitectura y plan de implementación, con procesos e indicadores alineados para que gerencia vea la operación.';
    if ($type === 'services' || property_exists($card, 'alt')) {
        $card->alt = $card->title;
    }
    $route = $type === 'services' ? 'link' : 'path';
    $card->{$route} = '/servicios/consultoria';
    array_splice($cards, $duplicateIndex, 1);
    if ($restoreIt) {
        array_splice($cards, $itSource['index'], 0, [clone $itSource['card']]);
    }
    return true;
}
