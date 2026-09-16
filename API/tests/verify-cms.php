<?php
declare(strict_types=1);

require __DIR__ . '/../sanitize.php';
require __DIR__ . '/../cms-schema.php';

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

$tree = sanitize_cms_tree(['body' => '<p>x<script>y</script></p>', 'title' => 'Hola']);
expect(!str_contains((string) $tree['body'], 'script'), 'limpia body en JSON');
expect($tree['title'] === 'Hola', 'no toca título plano');

$migrated = migrate_cms_document(['title' => 'Inicio'], 'inicio');
expect(($migrated['schemaVersion'] ?? 0) >= 2, 'migración schemaVersion');
expect(isset($migrated['sections'][0]['type']), 'migración sections en inicio');

$bad = validate_cms_payload(['showSplash' => 'si']);
expect($bad !== null && ($bad['field'] ?? '') === 'showSplash', 'bool inválido');

expect(validate_link_value('/contacto') === null, 'ruta interna ok');
expect(validate_link_value('javascript:alert(1)') !== null, 'javascript rechazado');

$magic = normalize_inicio_sections(['sections' => [['type' => 'magic'], ['type' => 'hero']]]);
$types = array_column($magic['sections'], 'type');
expect(!in_array('magic', $types, true) && in_array('hero', $types, true), 'rechaza sección magic');

exit($failed > 0 ? 1 : 0);
