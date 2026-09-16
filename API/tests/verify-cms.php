<?php
declare(strict_types=1);

require __DIR__ . '/../sanitize.php';
require __DIR__ . '/../cms-schema.php';
require __DIR__ . '/../cms-doc.php';

$failed = 0;
function expect(bool $ok, string $label): void
{
    global $failed;
    echo ($ok ? 'OK  ' : 'FAIL') . " $label\n";
    if (!$ok) {
        $failed++;
    }
}

$clean = sanitize_html('<p>Hola <script>alert(1)</script><strong>mundo</strong></p><img src=x onerror=alert(1)>');
expect(!str_contains($clean, 'script'), 'quita script');
expect(!str_contains($clean, 'onerror'), 'quita onerror');
expect(str_contains($clean, 'strong') || str_contains($clean, 'mundo'), 'conserva texto');

$headings = sanitize_html('<h1>Portada</h1><h3>Sub</h3>');
expect(str_contains($headings, '<p>') && str_contains($headings, 'Portada') && !str_contains($headings, '<h1'), 'h1 pasa a p');
expect(str_contains($headings, '<h2>') && str_contains($headings, 'Sub') && !str_contains($headings, '<h3'), 'h3 pasa a h2');

$tree = sanitize_cms_tree(['body' => '<p>x<script>y</script></p>', 'title' => 'Hola']);
expect(!str_contains((string) $tree['body'], 'script'), 'limpia body en JSON');
expect($tree['title'] === 'Hola', 'no toca título plano');

$migrated = migrate_cms_document(['title' => 'Inicio'], 'inicio');
expect(($migrated['schemaVersion'] ?? 0) >= 2, 'migración schemaVersion');
expect(isset($migrated['sections'][0]['type']), 'migración sections en inicio');
expect(isset($migrated['decorativeImagePaths']) && is_array($migrated['decorativeImagePaths']), 'migración decorativeImagePaths');

$bad = validate_cms_payload(['showSplash' => 'si']);
expect($bad !== null && ($bad['field'] ?? '') === 'showSplash', 'bool inválido');

expect(validate_link_value('/contacto') === null, 'ruta interna ok');
expect(validate_link_value('javascript:alert(1)') !== null, 'javascript rechazado');

$magic = normalize_inicio_sections(['sections' => [['type' => 'magic'], ['type' => 'hero']]]);
$types = array_column($magic['sections'], 'type');
expect(!in_array('magic', $types, true) && in_array('hero', $types, true), 'rechaza sección magic');

$inicioOk = [
    'sections' => [
        ['type' => 'hero', 'hidden' => false],
        ['type' => 'about', 'hidden' => true],
    ],
    'slides' => [['title' => 'Uno', 'image' => '']],
    'contactCards' => [['title' => 'Card']],
    'testimonials' => ['items' => [['text' => 'Bien']]],
    'services' => ['cards' => [['title' => 'SaaS', 'img' => '']]],
    'about' => ['image' => '', 'imageAlt' => ''],
    'decorativeImagePaths' => [],
];
expect(validate_cms_guards($inicioOk, 'inicio') === null, 'inicio válido pasa guards');

$hiddenAll = $inicioOk;
$hiddenAll['sections'] = [
    ['type' => 'hero', 'hidden' => true],
    ['type' => 'about', 'hidden' => true],
];
$hiddenErr = validate_cms_guards($hiddenAll, 'inicio');
expect(($hiddenErr['field'] ?? '') === 'sections', 'no se pueden ocultar todas las secciones');

$noSlides = $inicioOk;
$noSlides['slides'] = [];
$slidesErr = validate_cms_guards($noSlides, 'inicio');
expect(($slidesErr['field'] ?? '') === 'slides', 'mínimo un banner');

$needsAlt = $inicioOk;
$needsAlt['about'] = ['image' => '/api/uploads/foto.jpg', 'imageAlt' => ''];
$altErr = validate_cms_guards($needsAlt, 'inicio');
expect(($altErr['field'] ?? '') === 'about.imageAlt', 'alt obligatorio si hay imagen');

$decorative = $needsAlt;
$decorative['decorativeImagePaths'] = ['about.image'];
expect(validate_cms_guards($decorative, 'inicio') === null, 'imagen decorativa no exige alt');

$missing = cms_version_guard(4, null);
expect(($missing['status'] ?? 0) === 400 && ($missing['body']['field'] ?? '') === 'version', 'versión ausente es 400');
$stale = cms_version_guard(4, 3);
expect(($stale['status'] ?? 0) === 409 && ($stale['body']['version'] ?? 0) === 4, 'versión vieja es 409');
expect(cms_version_guard(4, 4) === null, 'versión igual es ok');
expect(cms_version_guard(4, '4') === null, 'versión numérica en string es ok');

expect(cms_doc_not_found_message('sitio') === 'Sitio no encontrado', '404 sitio');
expect(cms_doc_not_found_message('inicio') === 'Página no encontrada', '404 página');
expect(cms_doc_save_conflict_message('sitio') === 'Alguien guardó el sitio antes. Recarga para no pisar cambios.', '409 save sitio');
expect(cms_doc_save_conflict_message('inicio') === 'Alguien guardó esta página antes. Recarga para no pisar cambios.', '409 save página');
expect(cms_doc_publish_conflict_message() === 'Alguien publicó o guardó antes. Recarga para no pisar cambios.', '409 publish');

exit($failed > 0 ? 1 : 0);
