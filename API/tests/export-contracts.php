<?php
declare(strict_types=1);

/**
 * Congela el contrato CMS (catálogo de bloques, plantillas, slugs y campos de sitio).
 * Uso:
 *   php API/tests/export-contracts.php           # escribe fixtures
 *   php API/tests/export-contracts.php --check   # compara con fixtures
 */

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../sanitize.php';
require __DIR__ . '/../cms-schema.php';

$apiRoot = dirname(__DIR__);
$repoRoot = dirname($apiRoot);
if (!is_dir($repoRoot . '/frontend') || !is_dir($repoRoot . '/API')) {
    $repoRoot = $apiRoot;
}
$fixturesDir = __DIR__ . '/fixtures';
$fullCatalogPath = (is_dir($repoRoot . '/frontend') ? $repoRoot : $apiRoot) . '/cms/blocks.json';
$apiCatalogPath = $apiRoot . '/cms/blocks.json';

function contract_schema_paths(array $fields, string $prefix = ''): array
{
    $out = [];
    foreach ($fields as $field) {
        if (!is_array($field)) {
            continue;
        }
        $path = $prefix === '' ? (string) ($field['path'] ?? '') : $prefix . '.' . ($field['path'] ?? '');
        $out[] = [
            'path' => $path,
            'type' => (string) ($field['type'] ?? ''),
        ];
        if (!empty($field['item']) && is_array($field['item'])) {
            $out = array_merge($out, contract_schema_paths($field['item'], $path . '[]'));
        }
        if (!empty($field['children']) && is_array($field['children'])) {
            $out = array_merge($out, contract_schema_paths($field['children'], $path));
        }
    }
    return $out;
}

function contract_write_json(string $path, mixed $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        fwrite(STDERR, "No se pudo crear $dir\n");
        exit(1);
    }
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    if (file_put_contents($path, $json) === false) {
        fwrite(STDERR, "No se pudo escribir $path\n");
        exit(1);
    }
}

$catalog = cms_block_catalog();
$templates = cms_page_templates();
$stableBlocks = [];
foreach ($catalog as $type => $def) {
    $stableBlocks[] = [
        'type' => $type,
        'label' => $def['label'] ?? '',
        'icon' => $def['icon'] ?? '',
        'category' => $def['category'] ?? '',
        'schema' => contract_schema_paths(is_array($def['schema'] ?? null) ? $def['schema'] : []),
    ];
}

$stable = [
    'blockTypes' => array_keys($catalog),
    'blocks' => $stableBlocks,
    'templates' => array_map(static fn ($row) => [
        'id' => $row['id'] ?? '',
        'label' => $row['label'] ?? '',
        'description' => $row['description'] ?? '',
    ], $templates),
    'slugs' => cms_known_page_paths(),
    'siteBools' => cms_known_bools(),
    'siteNumbers' => cms_known_numbers(),
    'publicPosts' => [
        'contacto' => ['request' => ['name', 'email', 'phone', 'subject', 'message'], 'response' => ['status', 'message', 'mailSent']],
        'reclamaciones' => ['response' => ['ticket', 'mailSent', 'message']],
        'accesibilidad' => ['request' => ['name', 'email', 'phone', 'assistanceType', 'description']],
        'bot' => ['request' => ['message'], 'response' => ['reply', 'links', 'source']],
    ],
    'docKeys' => ['content', 'version', 'updated_at', 'schemaVersion'],
    'blockShape' => ['id', 'type', 'hidden', 'layout', 'props'],
];

$full = [
    'templates' => $templates,
    'blocks' => $catalog,
];

$check = in_array('--check', $argv ?? [], true);
$stablePath = $fixturesDir . '/blocks.catalog.json';
$contractsPath = $fixturesDir . '/contracts.json';

if ($check) {
    $failed = 0;
    if (!is_file($stablePath)) {
        fwrite(STDERR, "Falta fixture $stablePath\n");
        $failed++;
    } else {
        $got = json_decode((string) file_get_contents($stablePath), true);
        if ($got != $stable) {
            fwrite(STDERR, "Drift de contrato en $stablePath\n");
            $failed++;
        }
    }
    if (!is_file($contractsPath)) {
        fwrite(STDERR, "Falta fixture $contractsPath\n");
        $failed++;
    } else {
        $got = json_decode((string) file_get_contents($contractsPath), true);
        if (($got['blockTypes'] ?? null) !== $stable['blockTypes']
            || ($got['templates'] ?? null) !== $stable['templates']
            || ($got['slugs'] ?? null) !== $stable['slugs']
            || ($got['publicPosts'] ?? null) !== $stable['publicPosts']) {
            fwrite(STDERR, "Drift de contrato en $contractsPath\n");
            $failed++;
        }
    }
    $catalogOk = is_file($apiCatalogPath) || is_file($fullCatalogPath);
    if (!$catalogOk) {
        fwrite(STDERR, "Falta cms/blocks.json\n");
        $failed++;
    }
    exit($failed > 0 ? 1 : 0);
}

contract_write_json($stablePath, $stable);
contract_write_json($contractsPath, [
    'blockTypes' => $stable['blockTypes'],
    'templates' => $stable['templates'],
    'slugs' => $stable['slugs'],
    'siteBools' => $stable['siteBools'],
    'siteNumbers' => $stable['siteNumbers'],
    'publicPosts' => $stable['publicPosts'],
    'docKeys' => $stable['docKeys'],
    'blockShape' => $stable['blockShape'],
]);
contract_write_json($fullCatalogPath, $full);
contract_write_json($apiCatalogPath, $full);

$liveDir = $fixturesDir . '/live';
if (!is_dir($liveDir)) {
    mkdir($liveDir, 0775, true);
}
$origin = getenv('CMS_API_ORIGIN') ?: 'http://127.0.0.1:8000';
$liveOk = false;
$ctx = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
$sample = @file_get_contents($origin . '/blocks', false, $ctx);
if (is_string($sample) && str_starts_with(trim($sample), '{')) {
    $liveOk = true;
    contract_write_json($liveDir . '/blocks.json', json_decode($sample, true));
    foreach (['/site?locale=es', '/pages?locale=es', '/pages/inicio?locale=es', '/pages/inicio?locale=en'] as $rel) {
        $name = preg_replace('/[^a-z0-9]+/i', '_', $rel) . '.json';
        $body = @file_get_contents($origin . $rel, false, $ctx);
        if (is_string($body) && $body !== '') {
            $decoded = json_decode($body, true);
            file_put_contents($liveDir . '/' . $name, $decoded ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n" : $body);
        }
    }
}

fwrite(STDOUT, "Contratos escritos en API/tests/fixtures y cms/blocks.json" . ($liveOk ? " (API live OK)\n" : " (API live no disponible)\n"));
