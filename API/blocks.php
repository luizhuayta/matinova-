<?php
declare(strict_types=1);

function cms_new_block_id(): string
{
    return bin2hex(random_bytes(8));
}

function cms_field(string $path, string $type, string $label, array $extra = []): array
{
    return array_merge(['path' => $path, 'type' => $type, 'label' => $label], $extra);
}

function cms_seo_fields(): array
{
    return [
        cms_field('title', 'text', 'Título SEO', ['maxLength' => 70]),
        cms_field('description', 'area', 'Descripción SEO', ['maxLength' => 160]),
        cms_field('image', 'image', 'Imagen para compartir'),
    ];
}

function cms_blocks_json_path(): string
{
    foreach ([__DIR__ . '/cms/blocks.json', dirname(__DIR__) . '/cms/blocks.json'] as $path) {
        if (is_file($path)) {
            return $path;
        }
    }
    return __DIR__ . '/cms/blocks.json';
}

function cms_blocks_source(): array
{
    static $data = null;
    if ($data !== null) {
        return $data;
    }
    $path = cms_blocks_json_path();
    if (!is_file($path)) {
        $data = ['templates' => [], 'blocks' => []];
        return $data;
    }
    $decoded = json_decode((string) file_get_contents($path), true);
    $data = is_array($decoded) ? $decoded : ['templates' => [], 'blocks' => []];
    return $data;
}

function cms_block_catalog(): array
{
    static $catalog = null;
    if ($catalog !== null) {
        return $catalog;
    }
    $blocks = cms_blocks_source()['blocks'] ?? [];
    $catalog = [];
    if (is_array($blocks) && $blocks && array_is_list($blocks)) {
        foreach ($blocks as $item) {
            if (is_array($item) && isset($item['type'])) {
                $catalog[(string) $item['type']] = $item;
            }
        }
        return $catalog;
    }
    foreach (is_array($blocks) ? $blocks : [] as $type => $item) {
        if (is_array($item)) {
            $catalog[(string) ($item['type'] ?? $type)] = $item;
        }
    }
    return $catalog;
}

function cms_block_type(string $type): ?array
{
    $catalog = cms_block_catalog();
    return $catalog[$type] ?? null;
}

function cms_allowed_block_types(): array
{
    return array_keys(cms_block_catalog());
}

function cms_block_defaults(string $type): array
{
    $def = cms_block_type($type);
    return is_array($def) ? ($def['defaults'] ?? []) : [];
}

function cms_make_block(string $type, ?array $props = null, bool $hidden = false, ?string $id = null, ?array $layout = null): array
{
    $base = cms_block_defaults($type);
    $props = is_array($props) ? $props : [];
    $merged = array_replace_recursive($base, $props);
    foreach ($props as $key => $value) {
        if (is_array($value) && array_is_list($value) && isset($merged[$key]) && is_array($merged[$key])) {
            $merged[$key] = array_slice($merged[$key], 0, count($value));
        }
    }
    return [
        'id' => $id ?: cms_new_block_id(),
        'type' => $type,
        'hidden' => $hidden,
        'layout' => array_merge(cms_default_layout(), is_array($layout) ? $layout : []),
        'props' => $merged,
    ];
}

function cms_public_block_catalog(): array
{
    $out = [];
    foreach (cms_block_catalog() as $item) {
        $out[] = [
            'type' => $item['type'],
            'label' => $item['label'],
            'icon' => $item['icon'],
            'category' => $item['category'],
            'description' => $item['description'],
            'schema' => $item['schema'],
            'defaults' => $item['defaults'],
        ];
    }
    return $out;
}

function handle_blocks(string $method): void
{
    if ($method !== 'GET') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    json_out(['blocks' => cms_public_block_catalog(), 'templates' => cms_page_templates()]);
}

function cms_page_templates(): array
{
    $templates = cms_blocks_source()['templates'] ?? [];
    return is_array($templates) ? $templates : [];
}

function cms_template_blocks(string $template): array
{
    return match ($template) {
        'home' => [
            cms_make_block('hero'),
            cms_make_block('about'),
            cms_make_block('cta'),
        ],
        'service' => [
            cms_make_block('serviceHero'),
            cms_make_block('reasons'),
        ],
        'legal' => [
            cms_make_block('richText'),
        ],
        'clients' => [
            cms_make_block('listingHero', [
                'image' => '/carousel.jpg',
                'title' => 'Nuestros clientes',
                'text' => 'Empresas e instituciones que confían en nosotros para transformar su futuro tecnológico',
            ]),
            cms_make_block('clients', ['layout' => 'paneles']),
            cms_make_block('cta', [
                'title' => '¿Quieres ser parte de nuestros clientes satisfechos?',
                'text' => 'Cuéntanos tu proyecto y te mostramos casos similares.',
                'button' => 'Contáctanos',
                'link' => '/contacto',
            ]),
        ],
        'contact' => [
            cms_make_block('pageHero', [
                'badge' => 'CONTACTO',
                'title' => 'Hablemos',
                'text' => '',
                'cta' => '',
            ]),
            cms_make_block('contactCards'),
            cms_make_block('contactForm'),
        ],
        default => [
            cms_make_block('richText', ['title' => 'Nueva página', 'body' => '<p>Empieza a escribir o añade más secciones.</p>']),
        ],
    };
}

function cms_blank_page_document(string $title, string $template = 'blank'): array
{
    return [
        'schemaVersion' => CMS_SCHEMA_VERSION,
        'seo' => ['title' => $title, 'description' => '', 'image' => ''],
        'decorativeImagePaths' => [],
        'blocks' => cms_template_blocks($template),
    ];
}
