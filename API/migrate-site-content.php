<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$dry = in_array('--dry-run', $argv ?? [], true);
$pdo = db();
$total = 0;

function merge_missing(array $seed, array $existing): array
{
    foreach ($seed as $key => $value) {
        if (!array_key_exists($key, $existing)) {
            $existing[$key] = $value;
        } elseif (is_array($value) && is_array($existing[$key])) {
            $existing[$key] = merge_missing($value, $existing[$key]);
        }
    }
    return $existing;
}

foreach (['es' => site_seed(), 'en' => site_seed_en()] as $locale => $seed) {
    $stmt = $pdo->prepare('SELECT content FROM site_settings WHERE locale = ?');
    $stmt->execute([$locale]);
    $row = $stmt->fetch();
    $existing = $row ? (json_decode((string) $row['content'], true) ?: []) : [];
    $merged = merge_missing($seed, $existing);
    if ($merged === $existing) {
        continue;
    }
    $total++;
    echo $locale . ": site content\n";
    if (!$dry) {
        $json = json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($row) {
            $pdo->prepare('UPDATE site_settings SET content = ?, version = version + 1 WHERE locale = ?')->execute([$json, $locale]);
        } else {
            $pdo->prepare('INSERT INTO site_settings (locale, content) VALUES (?, ?)')->execute([$locale, $json]);
        }
    }
}

$imageFixes = [
    'about' => ['assets/illustrations/why-us.svg' => 'about-image.webp'],
    'pageHero' => ['' => 'expertos.webp', 'assets/illustrations/why-us.svg' => 'expertos.webp'],
    'listingHero' => ['assets/illustrations/hero.svg' => 'INFRAESTRUCTURAIT.webp'],
    'serviceHero' => ['assets/illustrations/hero.svg' => 'INFRAESTRUCTURAIT.webp'],
];

$seedPages = ['es' => pages_seed(), 'en' => pages_seed_en()];
$pages = $pdo->query('SELECT slug, locale, content FROM pages')->fetchAll();
foreach ($pages as $page) {
    $content = json_decode((string) $page['content'], true);
    if (!is_array($content) || !is_array($content['blocks'] ?? null)) {
        continue;
    }
    $changed = 0;
    foreach ($content['blocks'] as &$block) {
        $type = (string) ($block['type'] ?? '');
        if ($type === 'contactCards' && $page['slug'] === 'inicio') {
            $items = $block['props']['items'] ?? [];
            if (preg_match('/San Isidro|mattinnova\.pe|987 654 321/i', json_encode($items, JSON_UNESCAPED_UNICODE) ?: '')) {
                $block['props']['items'] = $seedPages[$page['locale']]['inicio']['content']['contactCards'] ?? $items;
                $changed++;
            }
        }
        if ($type === 'pageHero' && in_array($page['slug'], ['acerca-de', 'contacto'], true) && empty($block['props']['titleAccent'])) {
            $accent = $seedPages[$page['locale']][$page['slug']]['content']['heroTitleAccent'] ?? '';
            if ($accent !== '') {
                $block['props']['titleAccent'] = $accent;
                $changed++;
            }
        }
        if ($page['slug'] === 'inicio' && $page['locale'] === 'en') {
            if ($type === 'hero') {
                $stats = $block['props']['stats'] ?? [];
                if (($stats[0]['label'] ?? '') === 'Años de experiencia') {
                    $block['props']['stats'] = $seedPages['en']['inicio']['content']['heroStats'];
                    $changed++;
                }
                if (($block['props']['secondaryCta'] ?? '') === 'Ver presentación') {
                    $block['props']['secondaryCta'] = 'View presentation';
                    $changed++;
                }
            }
            if ($type === 'services' && ($block['props']['titleAccent'] ?? '') === 'servicio') {
                $block['props']['titleAccent'] = 'service';
                $changed++;
            }
        }
        if (!isset($imageFixes[$type])) {
            continue;
        }
        $image = (string) ($block['props']['image'] ?? '');
        if (array_key_exists($image, $imageFixes[$type])) {
            $block['props']['image'] = $imageFixes[$type][$image];
            if ($type === 'about') {
                $block['props']['imageAlt'] = $page['locale'] === 'en'
                    ? 'Professional working in a data center'
                    : 'Profesional trabajando en un centro de datos';
            }
            $changed++;
        }
    }
    unset($block);
    if ($changed === 0) {
        continue;
    }
    $total++;
    echo $page['slug'] . '/' . $page['locale'] . ': ' . $changed . " imágenes\n";
    if (!$dry) {
        $json = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $pdo->prepare('UPDATE pages SET content = ?, version = version + 1 WHERE slug = ? AND locale = ?')
            ->execute([$json, $page['slug'], $page['locale']]);
    }
}

echo ($dry ? 'Dry-run: ' : 'Actualizados: ') . $total . " documentos\n";
