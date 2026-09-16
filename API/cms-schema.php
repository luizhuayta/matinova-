<?php
declare(strict_types=1);

const CMS_SCHEMA_VERSION = 3;

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
        $linkErr = validate_link_value($value);
        if ($linkErr) {
            return ['field' => $path, 'message' => $linkErr];
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
                ['type' => 'testimonials', 'hidden' => false],
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
    }
    return $content;
}

function allowed_inicio_sections(): array
{
    return ['hero', 'about', 'contactCards', 'services', 'innovative', 'testimonials'];
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
    if ($path === 'logo') {
        return 'logoAlt';
    }
    if (str_ends_with($path, '.image')) {
        return $path . 'Alt';
    }
    if (str_ends_with($path, '.img')) {
        return (string) preg_replace('/\.img$/', '.alt', $path);
    }
    return null;
}

function validate_cms_guards(array $content, string $slug): ?array
{
    if ($slug === 'inicio') {
        $sections = $content['sections'] ?? [];
        $visible = 0;
        if (is_array($sections)) {
            foreach ($sections as $row) {
                if (is_array($row) && empty($row['hidden'])) {
                    $visible++;
                }
            }
        }
        if ($visible < 1) {
            return ['field' => 'sections', 'message' => 'Deja al menos una parte de la página visible.'];
        }
        $mins = [
            'slides' => 'Debe quedar al menos un banner.',
            'contactCards' => 'Debe quedar al menos una tarjeta de contacto.',
            'testimonials.items' => 'Debe quedar al menos una opinión.',
            'services.cards' => 'Debe quedar al menos una tarjeta de servicios.',
        ];
        foreach ($mins as $path => $message) {
            $value = cms_get_by_path($content, $path);
            if (!is_array($value) || count($value) < 1) {
                return ['field' => $path, 'message' => $message];
            }
        }
    }
    return validate_image_alts($content);
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
