<?php
declare(strict_types=1);

function sanitize_html(string $html): string
{
    $html = trim($html);
    if ($html === '') {
        return '';
    }
    $allowed = [
        'p' => [],
        'br' => [],
        'strong' => [],
        'b' => [],
        'em' => [],
        'i' => [],
        'u' => [],
        'h2' => [],
        'ul' => [],
        'ol' => [],
        'li' => [],
        'a' => ['href'],
    ];
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $wrapped = '<div id="cms-root">' . $html . '</div>';
    $dom->loadHTML('<?xml encoding="UTF-8">' . $wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    $root = $dom->getElementById('cms-root');
    if (!$root) {
        return strip_tags($html, '<p><br><strong><b><em><i><u><h2><ul><ol><li><a>');
    }
    sanitize_dom_node($root, $allowed);
    $out = '';
    foreach (iterator_to_array($root->childNodes) as $child) {
        $out .= $dom->saveHTML($child);
    }
    return $out;
}

function sanitize_dom_node(DOMNode $node, array $allowed): void
{
    $remove = [];
    foreach (iterator_to_array($node->childNodes) as $child) {
        if ($child instanceof DOMComment) {
            $remove[] = $child;
            continue;
        }
        if ($child instanceof DOMText) {
            continue;
        }
        if (!$child instanceof DOMElement) {
            $remove[] = $child;
            continue;
        }
        $tag = strtolower($child->tagName);
        if ($tag === 'h1' || $tag === 'h3') {
            $doc = $child->ownerDocument;
            if (!$doc) {
                $remove[] = $child;
                continue;
            }
            $repl = $doc->createElement($tag === 'h1' ? 'p' : 'h2');
            while ($child->firstChild) {
                $repl->appendChild($child->firstChild);
            }
            $child->parentNode?->replaceChild($repl, $child);
            sanitize_dom_node($repl, $allowed);
            continue;
        }
        if ($tag === 'script' || $tag === 'style' || $tag === 'iframe' || !isset($allowed[$tag])) {
            $remove[] = $child;
            continue;
        }
        $keep = $allowed[$tag];
        foreach (iterator_to_array($child->attributes ?? []) as $attr) {
            $name = strtolower($attr->name);
            if (str_starts_with($name, 'on') || !in_array($name, $keep, true)) {
                $child->removeAttribute($attr->name);
                continue;
            }
            if ($name === 'href') {
                $href = trim($attr->value);
                if ($href === '' || preg_match('#^\s*javascript:#i', $href) || preg_match('#^\s*data:#i', $href)) {
                    $child->removeAttribute('href');
                }
            }
        }
        sanitize_dom_node($child, $allowed);
    }
    foreach ($remove as $dead) {
        $node->removeChild($dead);
    }
}

function looks_like_html(string $value): bool
{
    return (bool) preg_match('/<[a-z][\s\S]*>/i', $value);
}

function sanitize_cms_tree(mixed $value, string $path = ''): mixed
{
    if (is_array($value)) {
        $out = [];
        foreach ($value as $key => $nested) {
            $next = $path === '' ? (string) $key : $path . '.' . $key;
            $out[$key] = sanitize_cms_tree($nested, $next);
        }
        return $out;
    }
    if (!is_string($value)) {
        return $value;
    }
    $leaf = strtolower((string) preg_replace('/^.*\./', '', $path));
    if ($leaf === 'body' || looks_like_html($value)) {
        return sanitize_html($value);
    }
    return $value;
}
