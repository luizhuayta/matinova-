<?php
declare(strict_types=1);

const CMS_SCHEMA_VERSION = 6;

// Fondo de sección por defecto (textura navy del rediseño); se cambia por bloque en el CMS.
const CMS_DEFAULT_BG_IMAGE = '/images/redesign/section-bg.webp';

function cms_known_bools(): array
{
    return [
        'showSplash', 'showCtaBanner', 'showWhatsapp', 'showChatbot',
        'showClientsToggle', 'animateCarousels',
    ];
}

function cms_known_numbers(): array
{
    return ['splashSeconds'];
}

function cms_default_splash_images(): array
{
    return [
        ['image' => 'splash/mis-academy.webp', 'alt' => 'MIS Academy'],
        ['image' => 'splash/matt-innova.webp', 'alt' => 'Matt Innova Solution'],
    ];
}

function cms_apply_splash_defaults(array $content, string $locale = 'es'): array
{
    if (!array_key_exists('splashImages', $content)) {
        $content['splashImages'] = cms_default_splash_images();
    }
    if (!isset($content['splashLabel']) || $content['splashLabel'] === '') {
        $content['splashLabel'] = $locale === 'en' ? 'LOADING…' : 'CARGANDO…';
    }
    return $content;
}

function cms_known_links(): array
{
    return [
        'path', 'link', 'url', 'href', 'heroctalink', 'academyurl',
        'youtube', 'facebook', 'instagram', 'linkedin', 'github', 'embed',
    ];
}

/**
 * Comprueba optimistic concurrency sin tocar la base.
 * @return array{status:int, body:array}|null  null = la versión encaja
 */
function cms_version_guard(int $current, mixed $given): ?array
{
    if (!is_int($given) && !is_numeric($given)) {
        return ['status' => 400, 'body' => ['field' => 'version', 'message' => 'Falta la versión del documento']];
    }
    if ((int) $given !== $current) {
        return ['status' => 409, 'body' => ['version' => $current]];
    }
    return null;
}

function validate_cms_payload(mixed $content): ?array
{
    if (!is_array($content) || array_is_list($content)) {
        return ['field' => 'content', 'message' => 'El contenido debe ser un objeto JSON'];
    }
    $encoded = json_encode($content);
    if ($encoded === false || strlen($encoded) > 1_500_000) {
        return ['field' => 'content', 'message' => 'El documento es demasiado grande'];
    }
    return validate_cms_tree($content, '');
}

function validate_cms_tree(mixed $value, string $path): ?array
{
    if (is_array($value)) {
        foreach ($value as $key => $nested) {
            $next = $path === '' ? (string) $key : $path . '.' . $key;
            $err = validate_cms_tree($nested, $next);
            if ($err) {
                return $err;
            }
        }
        return null;
    }
    $leaf = strtolower((string) preg_replace('/^.*\./', '', $path));
    if (in_array($leaf, array_map('strtolower', cms_known_bools()), true) && !is_bool($value)) {
        return ['field' => $path, 'message' => 'Debe ser verdadero o falso'];
    }
    if (in_array($leaf, array_map('strtolower', cms_known_numbers()), true) && !is_int($value) && !is_float($value)) {
        return ['field' => $path, 'message' => 'Debe ser un número'];
    }
    if (is_string($value) && in_array($leaf, cms_known_links(), true)) {
        // 'link' es etiqueta visible en serviceCards ("Ver consultoría"); las URL reales
        // nunca llevan espacios, así que solo se validan valores sin espacios.
        if (!preg_match('/\s/', $value)) {
            $linkErr = validate_link_value($value);
            if ($linkErr) {
                return ['field' => $path, 'message' => $linkErr];
            }
        }
    }
    if (is_string($value) && strlen($value) > 200_000) {
        return ['field' => $path, 'message' => 'El texto es demasiado largo'];
    }
    return null;
}

function validate_link_value(string $value): ?string
{
    $value = trim($value);
    if ($value === '' || $value === '#' || str_starts_with($value, '/') || str_starts_with($value, 'mailto:')) {
        return null;
    }
    if (filter_var($value, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $value)) {
        return null;
    }
    return 'Usa una ruta interna (/contacto) o un enlace https://';
}

function cms_valid_chatbot_mode(mixed $mode): ?string
{
    return ($mode === 'ia' || $mode === 'clasico') ? $mode : null;
}

function cms_infer_chatbot_mode(): string
{
    if (!function_exists('db')) {
        return 'clasico';
    }
    try {
        $stmt = db()->prepare("SELECT v FROM app_secrets WHERE k = 'ai_enabled'");
        $stmt->execute();
        $value = $stmt->fetchColumn();
        return $value === '1' ? 'ia' : 'clasico';
    } catch (Throwable) {
        return 'clasico';
    }
}

function cms_resolve_chatbot_mode(array $content, array $stored = []): string
{
    $incoming = cms_valid_chatbot_mode($content['chatbotMode'] ?? null);
    if ($incoming !== null) {
        return $incoming;
    }
    $kept = cms_valid_chatbot_mode($stored['chatbotMode'] ?? null);
    if ($kept !== null) {
        return $kept;
    }
    return cms_infer_chatbot_mode();
}

function migrate_cms_document(array $content, string $slug): array
{
    $version = (int) ($content['schemaVersion'] ?? 0);
    if ($version < 1) {
        if (!isset($content['seo']) || !is_array($content['seo'])) {
            $content['seo'] = [
                'title' => (string) ($content['title'] ?? ($slug === 'sitio' ? 'Matt Innova Solution' : '')),
                'description' => '',
                'image' => (string) ($content['logo'] ?? $content['heroImage'] ?? ''),
            ];
        }
        $content['schemaVersion'] = 1;
        $version = 1;
    }
    if ($version < 2 && $slug === 'inicio') {
        if (!isset($content['sections']) || !is_array($content['sections']) || $content['sections'] === []) {
            $content['sections'] = [
                ['type' => 'hero', 'hidden' => false],
                ['type' => 'about', 'hidden' => false],
                ['type' => 'contactCards', 'hidden' => false],
                ['type' => 'services', 'hidden' => false],
                ['type' => 'innovative', 'hidden' => false],
                ['type' => 'testimonials', 'hidden' => true],
            ];
        }
        $content['schemaVersion'] = 2;
    } elseif ($version < 2) {
        $content['schemaVersion'] = 2;
        $version = 2;
    }
    if ($version < 3) {
        if (!isset($content['decorativeImagePaths']) || !is_array($content['decorativeImagePaths'])) {
            $content['decorativeImagePaths'] = [];
        }
        $content['schemaVersion'] = 3;
        $version = 3;
    }
    if ($version < 4) {
        if ($slug !== 'sitio') {
            $content = cms_migrate_to_blocks($content, $slug);
        }
        $content['schemaVersion'] = 4;
    }
    if ($version < 5) {
        if ($slug !== 'sitio' && isset($content['blocks']) && is_array($content['blocks'])) {
            foreach ($content['blocks'] as $i => $block) {
                if (!is_array($block)) {
                    continue;
                }
                $layout = is_array($block['layout'] ?? null) ? $block['layout'] : [];
                $content['blocks'][$i]['layout'] = array_merge(cms_default_layout(), $layout);
            }
        }
        if ($slug === 'sitio') {
            $content['defaultLocale'] = $content['defaultLocale'] ?? 'es';
            $content['locales'] = $content['locales'] ?? ['es', 'en'];
        }
        $content['schemaVersion'] = 5;
    }
    if ($version < 6) {
        if ($slug !== 'sitio' && isset($content['blocks']) && is_array($content['blocks'])) {
            foreach ($content['blocks'] as $i => $block) {
                if (!is_array($block)) {
                    continue;
                }
                $layout = is_array($block['layout'] ?? null) ? $block['layout'] : [];
                $merged = array_merge(cms_default_layout(), $layout);
                if (trim((string) ($merged['backgroundImage'] ?? '')) === '') {
                    $merged['backgroundImage'] = CMS_DEFAULT_BG_IMAGE;
                }
                $content['blocks'][$i]['layout'] = $merged;
            }
        }
        $content['schemaVersion'] = 6;
    }
    if ($slug === 'sitio') {
        $content['chatbotMode'] = cms_resolve_chatbot_mode($content);
        if (!isset($content['aiProvider'])) {
            $content['aiProvider'] = 'openrouter';
        }
        if (!isset($content['aiModel'])) {
            $content['aiModel'] = 'openai/gpt-4o-mini';
        }
        if (!isset($content['aiBaseUrl'])) {
            $content['aiBaseUrl'] = 'https://openrouter.ai/api/v1';
        }
        if (!array_key_exists('splashImages', $content)) {
            $content['splashImages'] = cms_default_splash_images();
        }
    }
    if ($slug !== 'sitio') {
        $content = cms_normalize_blocks($content);
    }
    return $content;
}

function allowed_inicio_sections(): array
{
    return ['hero', 'about', 'contactCards', 'services', 'innovative', 'testimonials', 'faq'];
}

function cms_studio_faq_items(string $locale = 'es'): array
{
    if ($locale === 'en') {
        return [
            'title' => 'Questions we get from finance and IT',
            'items' => [
                [
                    'question' => 'Do you apply SUNAT detraction on IT services?',
                    'answer' => 'When the contract falls under SPOT, we apply the current detraction rate on the electronic invoice. We confirm the CIIU and the percentage in the quote before starting.',
                ],
                [
                    'question' => 'Do you issue electronic invoices and report them in SIRE?',
                    'answer' => 'Yes. We issue electronic receipts and register operations in SUNAT SIRE. The RUC is printed on every invoice; we do not close a job without a valid voucher.',
                ],
                [
                    'question' => 'What are support response times?',
                    'answer' => 'Critical server incidents: we answer in under 15 minutes during operating hours. The rest is scheduled the same business day. The SLA is written into the contract, not left as a chat promise.',
                ],
                [
                    'question' => 'Can you work under a government framework agreement?',
                    'answer' => 'We work with schools and public entities. Each convocatoria or acuerdo marco is reviewed against the expediente. Send the procedure number and we confirm whether we fit before bidding.',
                ],
            ],
        ];
    }
    return [
        'title' => 'Preguntas de finanzas y TI',
        'items' => [
            [
                'question' => '¿Aplican detracción SUNAT a los servicios de TI?',
                'answer' => 'Si el contrato califica en el SPOT, aplicamos la tasa vigente sobre el comprobante electrónico. El CIIU y el porcentaje se confirman en la cotización, antes de iniciar el trabajo.',
            ],
            [
                'question' => '¿Emiten factura electrónica y registran en SIRE?',
                'answer' => 'Sí. Emitimos comprobantes electrónicos y declaramos las operaciones en el SIRE de SUNAT. El RUC va en cada factura; no cerramos un trabajo sin voucher válido.',
            ],
            [
                'question' => '¿Cuáles son los tiempos de soporte?',
                'answer' => 'Incidencias críticas de servidores: respuesta en menos de 15 minutos en horario de operación. El resto se agenda el mismo día hábil. El SLA queda escrito en el contrato, no en el chat.',
            ],
            [
                'question' => '¿Pueden contratar con el Estado en un acuerdo marco?',
                'answer' => 'Trabajamos con entidades educativas y públicas. Cada convocatoria o acuerdo marco se revisa contra el expediente. Envíenos el número de procedimiento y confirmamos si calzamos antes de postular.',
            ],
        ],
    ];
}

function normalize_inicio_sections(array $content): array
{
    if (!isset($content['sections']) || !is_array($content['sections'])) {
        return $content;
    }
    $allowed = allowed_inicio_sections();
    $clean = [];
    foreach ($content['sections'] as $row) {
        if (!is_array($row)) {
            continue;
        }
        $type = (string) ($row['type'] ?? '');
        if (!in_array($type, $allowed, true)) {
            continue;
        }
        $clean[] = ['type' => $type, 'hidden' => !empty($row['hidden'])];
    }
    $content['sections'] = $clean;
    return $content;
}

function cms_get_by_path(array $content, string $path): mixed
{
    $cur = $content;
    foreach (explode('.', $path) as $part) {
        if (!is_array($cur) || !array_key_exists($part, $cur)) {
            return null;
        }
        $cur = $cur[$part];
    }
    return $cur;
}

function cms_path_exists(array $content, string $path): bool
{
    $cur = $content;
    foreach (explode('.', $path) as $part) {
        if (!is_array($cur) || !array_key_exists($part, $cur)) {
            return false;
        }
        $cur = $cur[$part];
    }
    return true;
}

function cms_alt_path(string $path): ?string
{
    if ($path === 'logo' || $path === 'props.logo' || preg_match('/(?:^|\.)logo$/', $path)) {
        if ($path === 'logo') {
            return 'logoAlt';
        }
        if (str_ends_with($path, '.logo')) {
            $alt = preg_replace('/\.logo$/', '.alt', $path);
            return is_string($alt) ? $alt : null;
        }
    }
    if (str_ends_with($path, '.image')) {
        return $path . 'Alt';
    }
    if (str_ends_with($path, '.img')) {
        return (string) preg_replace('/\.img$/', '.alt', $path);
    }
    if (str_ends_with($path, '.heroImage')) {
        return (string) preg_replace('/\.heroImage$/', '.heroAlt', $path);
    }
    return null;
}

function validate_cms_guards(array $content, string $slug): ?array
{
    if ($slug !== 'sitio') {
        $blockErr = validate_cms_blocks($content);
        if ($blockErr) {
            return $blockErr;
        }
    }
    return validate_image_alts($content);
}

function validate_cms_blocks(array $content): ?array
{
    $blocks = $content['blocks'] ?? null;
    if (!is_array($blocks)) {
        return ['field' => 'blocks', 'message' => 'La página debe tener una lista de secciones.'];
    }
    $visible = 0;
    $allowed = cms_allowed_block_types();
    foreach ($blocks as $i => $row) {
        if (!is_array($row)) {
            return ['field' => "blocks.$i", 'message' => 'Sección inválida.'];
        }
        $type = (string) ($row['type'] ?? '');
        if ($type === '' || !in_array($type, $allowed, true)) {
            return ['field' => "blocks.$i.type", 'message' => 'Tipo de sección no permitido: ' . $type];
        }
        if (empty($row['hidden'])) {
            $visible++;
        }
        $def = cms_block_type($type);
        $props = is_array($row['props'] ?? null) ? $row['props'] : [];
        $minErr = validate_block_mins($def['schema'] ?? [], $props, "blocks.$i.props");
        if ($minErr) {
            return $minErr;
        }
    }
    if ($visible < 1) {
        return ['field' => 'blocks', 'message' => 'Deja al menos una parte de la página visible.'];
    }
    return null;
}

function validate_block_mins(array $schema, array $props, string $prefix): ?array
{
    foreach ($schema as $field) {
        if (!is_array($field)) {
            continue;
        }
        $path = (string) ($field['path'] ?? '');
        $min = (int) ($field['min'] ?? 0);
        if ($min < 1 || ($field['type'] ?? '') !== 'list') {
            continue;
        }
        $value = $props[$path] ?? null;
        if (!is_array($value) || count($value) < $min) {
            return [
                'field' => $prefix . '.' . $path,
                'message' => 'Debe quedar al menos un elemento en ' . (string) ($field['label'] ?? $path) . '.',
            ];
        }
    }
    return null;
}

function validate_image_alts(array $content): ?array
{
    $decorative = $content['decorativeImagePaths'] ?? [];
    if (!is_array($decorative)) {
        $decorative = [];
    }
    return validate_image_alts_walk($content, $content, $decorative, '');
}

function validate_image_alts_walk(array $root, mixed $value, array $decorative, string $path): ?array
{
    if (!is_array($value)) {
        return null;
    }
    foreach ($value as $key => $nested) {
        $next = $path === '' ? (string) $key : $path . '.' . $key;
        if (is_string($nested) && $nested !== '') {
            $altPath = cms_alt_path($next);
            if ($altPath && cms_path_exists($root, $altPath) && !in_array($next, $decorative, true)) {
                $alt = cms_get_by_path($root, $altPath);
                if (!is_string($alt) || trim($alt) === '') {
                    return ['field' => $altPath, 'message' => 'Describe la imagen o márcala como decorativa.'];
                }
            }
        }
        $err = validate_image_alts_walk($root, $nested, $decorative, $next);
        if ($err) {
            return $err;
        }
    }
    return null;
}

function cms_default_layout(): array
{
    return [
        'width' => 'full',
        'padding' => '',
        'background' => '',
        'backgroundImage' => CMS_DEFAULT_BG_IMAGE,
    ];
}

function cms_schema_for_slug(string $slug): array
{
    if ($slug === 'sitio') {
        return ['kind' => 'site'];
    }
    $map = [
        'inicio' => 'home',
        'acerca-de' => 'about',
        'servicios' => 'listing',
        'contacto' => 'contact',
        'privacidad' => 'legal',
        'terminos' => 'legal',
        'libro-reclamaciones' => 'claims',
        'clientes' => 'blocks',
        'servicios-software' => 'service',
        'servicios-hardware' => 'service',
        'servicios-saas' => 'service',
        'servicios-consultoria' => 'service',
        'servicios-soluciones-ti' => 'service',
    ];
    $kind = $map[$slug] ?? (str_starts_with($slug, 'servicios-') ? 'service' : 'blocks');
    return ['kind' => $kind, 'fields' => ['blocks', 'seo']];
}

if (!function_exists('cms_block_catalog')) {
    require_once __DIR__ . '/blocks.php';
}

function cms_normalize_blocks(array $content): array
{
    if (!isset($content['blocks']) || !is_array($content['blocks'])) {
        return $content;
    }
    $clean = [];
    $allowed = cms_allowed_block_types();
    foreach ($content['blocks'] as $row) {
        if (!is_array($row)) {
            continue;
        }
        $type = (string) ($row['type'] ?? '');
        if ($type === '' || !in_array($type, $allowed, true)) {
            continue;
        }
        $props = is_array($row['props'] ?? null) ? $row['props'] : [];
        $id = (string) ($row['id'] ?? '');
        $clean[] = cms_make_block($type, $props, !empty($row['hidden']), $id !== '' ? $id : null, is_array($row['layout'] ?? null) ? $row['layout'] : null);
    }
    $content['blocks'] = $clean;
    return $content;
}

function cms_migrate_to_blocks(array $content, string $slug): array
{
    if (isset($content['blocks']) && is_array($content['blocks']) && $content['blocks'] !== []) {
        return $content;
    }

    $blocks = match ($slug) {
        'inicio' => cms_blocks_from_inicio($content),
        'acerca-de' => cms_blocks_from_acerca($content),
        'servicios' => cms_blocks_from_servicios($content),
        'contacto' => cms_blocks_from_contacto($content),
        'privacidad', 'terminos' => cms_blocks_from_legal($content),
        'libro-reclamaciones' => cms_blocks_from_libro($content),
        default => str_starts_with($slug, 'servicios-')
            ? cms_blocks_from_service_page($content)
            : cms_blocks_from_generic($content),
    };

    $keep = [
        'schemaVersion' => CMS_SCHEMA_VERSION,
        'seo' => is_array($content['seo'] ?? null) ? $content['seo'] : ['title' => '', 'description' => '', 'image' => ''],
        'decorativeImagePaths' => is_array($content['decorativeImagePaths'] ?? null) ? $content['decorativeImagePaths'] : [],
        'blocks' => $blocks,
    ];
    return $keep;
}

function cms_blocks_from_inicio(array $content): array
{
    $order = $content['sections'] ?? [];
    if (!is_array($order) || $order === []) {
        $order = [
            ['type' => 'hero', 'hidden' => false],
            ['type' => 'about', 'hidden' => false],
            ['type' => 'contactCards', 'hidden' => false],
            ['type' => 'services', 'hidden' => false],
            ['type' => 'innovative', 'hidden' => false],
            ['type' => 'testimonials', 'hidden' => true],
            ['type' => 'faq', 'hidden' => false],
        ];
    }
    $blocks = [];
    foreach ($order as $row) {
        if (!is_array($row)) {
            continue;
        }
        $type = (string) ($row['type'] ?? '');
        $hidden = !empty($row['hidden']);
        $props = match ($type) {
            'hero' => array_filter([
                'slides' => $content['slides'] ?? [],
                'subtitle' => $content['heroSubtitle'] ?? ($content['subtitle'] ?? ''),
                'cta' => $content['heroCta'] ?? '',
                'ctaLink' => $content['heroCtaLink'] ?? '/servicios',
                'stats' => $content['heroStats'] ?? null,
                'secondaryCta' => $content['heroSecondaryCta'] ?? null,
                'secondaryLink' => $content['heroSecondaryLink'] ?? null,
            ], static fn ($value) => $value !== null),
            'about' => array_merge(
                is_array($content['about'] ?? null) ? $content['about'] : [],
                ['ctaLink' => $content['about']['ctaLink'] ?? '/acerca-de', 'features' => $content['about']['features'] ?? []]
            ),
            'contactCards' => ['items' => $content['contactCards'] ?? []],
            'services' => is_array($content['services'] ?? null) ? $content['services'] : [],
            'innovative' => array_merge(
                is_array($content['innovative'] ?? null) ? $content['innovative'] : [],
                ['ctaLink' => $content['innovative']['ctaLink'] ?? '/servicios']
            ),
            'testimonials' => array_merge(
                is_array($content['testimonials'] ?? null) ? $content['testimonials'] : [],
                ['ctaLink' => $content['testimonials']['ctaLink'] ?? '/contacto']
            ),
            'faq' => is_array($content['faq'] ?? null) ? $content['faq'] : cms_studio_faq_items(),
            default => null,
        };
        if ($props === null) {
            continue;
        }
        $blocks[] = cms_make_block($type, $props, $hidden);
    }
    return $blocks !== [] ? $blocks : [cms_make_block('hero')];
}

function cms_blocks_from_acerca(array $content): array
{
    $aboutFeatures = [];
    foreach (($content['features'] ?? []) as $feature) {
        $aboutFeatures[] = is_string($feature) ? ['text' => $feature] : (is_array($feature) ? $feature : ['text' => '']);
    }
    return [
        cms_make_block('pageHero', [
            'badge' => $content['heroBadge'] ?? '',
            'title' => $content['heroTitle'] ?? '',
            'titleAccent' => $content['heroTitleAccent'] ?? '',
            'text' => $content['heroText'] ?? '',
            'cta' => $content['heroCta'] ?? '',
            'ctaLink' => '/contacto',
            'image' => $content['heroImage'] ?? 'expertos.webp',
        ]),
        cms_make_block('stats', ['items' => $content['stats'] ?? []]),
        cms_make_block('about', [
            'tag' => $content['aboutTag'] ?? '',
            'title' => $content['aboutTitle'] ?? '',
            'text' => $content['aboutText'] ?? '',
            'image' => $content['aboutImage'] ?? '',
            'imageAlt' => $content['aboutImageAlt'] ?? '',
            'cta' => $content['aboutCta'] ?? '',
            'ctaLink' => '/contacto',
            'features' => $aboutFeatures,
        ]),
        cms_make_block('team', [
            'tag' => $content['teamTag'] ?? '',
            'title' => $content['teamTitle'] ?? '',
            'text' => $content['teamText'] ?? '',
            'items' => $content['team'] ?? [],
        ]),
        cms_make_block('contactCards', ['items' => $content['contactCards'] ?? []]),
        cms_make_block('videos', [
            'tag' => $content['videosTag'] ?? '',
            'title' => $content['videosTitle'] ?? '',
            'text' => $content['videosText'] ?? '',
            'items' => $content['videos'] ?? [],
        ]),
    ];
}

function cms_blocks_from_servicios(array $content): array
{
    return [
        cms_make_block('listingHero', [
            'image' => $content['heroImage'] ?? '',
            'title' => $content['heroTitle'] ?? '',
            'text' => $content['heroText'] ?? '',
        ]),
        cms_make_block('serviceCards', [
            'subtitle' => $content['subtitle'] ?? '',
            'title' => $content['title'] ?? '',
            'cards' => $content['cards'] ?? [],
        ]),
        cms_make_block('cta', [
            'title' => $content['ctaTitle'] ?? '',
            'text' => $content['ctaText'] ?? '',
            'button' => $content['ctaButton'] ?? '',
            'link' => '/contacto',
        ]),
    ];
}

function cms_blocks_from_service_page(array $content): array
{
    return [
        cms_make_block('serviceHero', [
            'heroImage' => $content['heroImage'] ?? '',
            'heroAlt' => $content['heroAlt'] ?? '',
            'image' => $content['image'] ?? '',
            'imageAlt' => $content['imageAlt'] ?? '',
            'label' => $content['label'] ?? '',
            'title' => $content['title'] ?? '',
            'text' => $content['text'] ?? '',
            'cta' => $content['cta'] ?? '',
            'ctaLink' => '/contacto',
        ]),
        cms_make_block('reasons', [
            'subtitle' => $content['reasonsSubtitle'] ?? '',
            'title' => $content['reasonsTitle'] ?? '',
            'items' => $content['reasons'] ?? [],
        ]),
    ];
}

function cms_contacto_map_embed(): string
{
    return 'https://maps.google.com/maps?q=Urb.+Libertad+Calle+Las+Moras+San+Vicente+de+Ca%C3%B1ete&output=embed';
}

function cms_contacto_support_blocks(string $locale = 'es'): array
{
    if ($locale === 'en') {
        $faq = cms_studio_faq_items('en');
        return [
            cms_make_block('faq', $faq),
            cms_make_block('map', [
                'title' => 'Where we are',
                'text' => 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Peru.',
                'embed' => cms_contacto_map_embed(),
            ]),
        ];
    }
    $faq = cms_studio_faq_items('es');
    return [
        cms_make_block('faq', $faq),
        cms_make_block('map', [
            'title' => 'Dónde estamos',
            'text' => 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Perú.',
            'embed' => cms_contacto_map_embed(),
        ]),
    ];
}

function cms_blocks_from_contacto(array $content, string $locale = 'es'): array
{
    $isEn = $locale === 'en';
    $defaultHeroText = $isEn
        ? 'Head office in San Vicente de Cañete. WhatsApp and email answered the same business day.'
        : 'Casa matriz en San Vicente de Cañete. WhatsApp y correo con respuesta el mismo día hábil.';
    return array_merge([
        cms_make_block('pageHero', [
            'badge' => $content['badge'] ?? '',
            'title' => $content['title'] ?? '',
            'titleAccent' => $content['heroTitleAccent'] ?? '',
            'text' => $content['text'] ?? $content['heroText'] ?? $defaultHeroText,
            'cta' => '',
            'ctaLink' => '',
            'image' => $content['heroImage'] ?? 'expertos.webp',
        ]),
        cms_make_block('contactCards', ['items' => $content['cards'] ?? []]),
        cms_make_block('contactForm', [
            'submitLabel' => $content['submitLabel'] ?? ($isEn ? 'Send message' : 'Enviar mensaje'),
            'destinationEmail' => $content['destinationEmail'] ?? '',
            'fields' => $content['fields'] ?? [],
            'placeholders' => $content['placeholders'] ?? [],
        ]),
    ], cms_contacto_support_blocks($locale));
}

function cms_blocks_from_legal(array $content): array
{
    return [
        cms_make_block('richText', [
            'title' => $content['title'] ?? '',
            'lastUpdated' => $content['lastUpdated'] ?? '',
            'body' => $content['body'] ?? '',
        ]),
    ];
}

function cms_blocks_from_libro(array $content): array
{
    return [
        cms_make_block('claimsBook', [
            'title' => $content['title'] ?? '',
            'company' => $content['company'] ?? '',
            'subtitle' => $content['subtitle'] ?? '',
            'logo' => $content['logo'] ?? 'logo.svg',
            'ruc' => $content['ruc'] ?? '',
            'destinationEmail' => $content['destinationEmail'] ?? '',
            'disclaimer1' => $content['disclaimer1'] ?? '',
            'disclaimer2' => $content['disclaimer2'] ?? '',
            'submitLabel' => $content['submitLabel'] ?? '',
        ]),
    ];
}

function cms_blocks_from_generic(array $content): array
{
    if (isset($content['body']) || isset($content['title'])) {
        return cms_blocks_from_legal($content);
    }
    if (isset($content['heroImage']) && isset($content['reasons'])) {
        return cms_blocks_from_service_page($content);
    }
    return [cms_make_block('richText', ['title' => (string) ($content['title'] ?? 'Página'), 'body' => '<p></p>'])];
}
