<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$dry = in_array('--dry-run', $argv ?? [], true);
$pdo = db();
$rows = $pdo->query("SELECT slug, locale, content FROM pages WHERE slug = 'inicio' AND locale IN ('es', 'en')")->fetchAll();
$total = 0;

foreach ($rows as $row) {
    $content = json_decode((string) $row['content'], true);
    if (!is_array($content) || !isset($content['blocks']) || !is_array($content['blocks'])) {
        continue;
    }
    $accent = $row['locale'] === 'en' ? 'follow-through' : 'seguimiento';
    $servicesText = $row['locale'] === 'en'
        ? 'Technology solutions designed to grow your business'
        : 'Soluciones tecnológicas diseñadas para hacer crecer tu empresa';
    $serviceIcons = ['bi-briefcase', 'bi-hdd-network', 'bi-graph-up', 'bi-cloud', 'bi-pc-display', 'bi-code-slash'];
    $serviceLinks = ['/servicios/consultoria', '/servicios/soluciones-ti', '/servicios/consultoria', '/servicios/saas', '/servicios/hardware', '/servicios/software'];
    $changed = 0;
    foreach ($content['blocks'] as &$block) {
        if (!is_array($block)) {
            continue;
        }
        if (($block['type'] ?? '') === 'hero' && is_array($block['props']['slides'] ?? null)) {
            foreach ($block['props']['slides'] as &$slide) {
                if (!is_array($slide)) {
                    continue;
                }
                if (($slide['image'] ?? '') === 'assets/illustrations/hero.svg') {
                    $slide['image'] = 'INFRAESTRUCTURAIT.webp';
                    $changed++;
                }
                $title = (string) ($slide['title'] ?? '');
                if (empty($slide['titleAccent']) && $title !== '' && stripos($title, $accent) !== false) {
                    $slide['titleAccent'] = $accent;
                    $changed++;
                }
            }
            unset($slide);
        }
        if (($block['type'] ?? '') === 'services' && is_array($block['props']['cards'] ?? null)) {
            if (empty($block['props']['text'])) {
                $block['props']['text'] = $servicesText;
                $changed++;
            }
            if (empty($block['props']['titleAccent']) || ($row['locale'] === 'en' && $block['props']['titleAccent'] === 'servicio')) {
                $block['props']['titleAccent'] = $row['locale'] === 'en' ? 'service' : 'servicio';
                $changed++;
            }
            foreach ($block['props']['cards'] as $i => &$card) {
                if (!is_array($card)) {
                    continue;
                }
                if (empty($card['icon'])) {
                    $card['icon'] = $serviceIcons[$i] ?? 'bi-grid';
                    $changed++;
                }
                if (empty($card['link'])) {
                    $card['link'] = $serviceLinks[$i] ?? '/servicios';
                    $changed++;
                }
            }
            unset($card);
        }
    }
    unset($block);
    if ($changed === 0) {
        continue;
    }
    $total += $changed;
    echo $row['slug'] . '/' . $row['locale'] . ': ' . $changed . " campos\n";
    if (!$dry) {
        $json = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $update = $pdo->prepare('UPDATE pages SET content = ?, version = version + 1 WHERE slug = ? AND locale = ?');
        $update->execute([$json, $row['slug'], $row['locale']]);
    }
}

echo ($dry ? 'Dry-run: ' : 'Actualizados: ') . $total . " campos\n";
