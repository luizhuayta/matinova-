<?php
declare(strict_types=1);

/**
 * Regenera API/cms/blocks.json desde cms/blocks.json si el repo raíz está montado.
 * El catálogo TypeScript se genera con tools/gen-blocks.py en el host.
 */
$api = __DIR__;
if (basename($api) === 'tools') {
    $api = dirname($api) . '/API';
}
$repo = dirname($api);
$src = is_file($repo . '/cms/blocks.json') ? $repo . '/cms/blocks.json' : $api . '/cms/blocks.json';
$dest = $api . '/cms/blocks.json';
if (!is_file($src)) {
    fwrite(STDERR, "No está cms/blocks.json\n");
    exit(1);
}
if (!is_dir(dirname($dest))) {
    mkdir(dirname($dest), 0775, true);
}
copy($src, $dest);
fwrite(STDOUT, "OK $dest\n");
