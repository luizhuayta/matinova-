<?php
declare(strict_types=1);

function handle_media(string $path, string $method): void
{
    if ($path === '/media/resolve' && $method === 'GET') {
        rate_limit('cms_media_resolve', 60, 60);
        cms_media_resolve_request();
    }

    if ($path === '/media/crop' && $method === 'POST') {
        require_admin();
        require_csrf();
        rate_limit('cms_media', 20, 60);
        json_out(cms_media_crop(json_input()));
    }

    if (preg_match('#^/media/(\d+)/versions$#', $path, $m) && $method === 'GET') {
        require_admin();
        json_out(['items' => cms_media_versions((int) $m[1])]);
    }

    if (preg_match('#^/media/(\d+)/restore$#', $path, $m) && $method === 'POST') {
        require_admin();
        require_csrf();
        json_out(cms_media_restore((int) $m[1], json_input()));
    }

    if ($path === '/media' && $method === 'GET') {
        require_admin();
        $rows = db()->query(
            'SELECT id, original_name, stored_name, url, mime, size_bytes, width, height, variants, parent_id, kind, original_stored, created_at
             FROM media ORDER BY id DESC'
        )->fetchAll();
        $items = [];
        foreach ($rows as $row) {
            $items[] = cms_media_public_row($row);
        }
        json_out(['items' => $items]);
    }

    if ($path === '/media' && $method === 'POST') {
        require_admin();
        require_csrf();
        rate_limit('cms_media', 20, 60);
        if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            json_out(['message' => 'No se recibió ninguna imagen'], 400);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            json_out(['message' => 'No se pudo subir el archivo'], 400);
        }
        if (($file['size'] ?? 0) > 20 * 1024 * 1024) {
            json_out(['message' => 'La foto pesa más de 20 MB'], 400);
        }
        $saved = compress_image($file['tmp_name'], $file['name']);
        $id = cms_media_insert($saved, (string) $file['name'], 'upload', null);
        cms_media_snapshot($id, $saved, 'upload');
        json_out([
            'id' => $id,
            'url' => $saved['url'],
            'original_name' => $file['name'],
            'original_url' => $saved['original_url'] ?? null,
            'width' => $saved['width'],
            'height' => $saved['height'],
            'variants' => $saved['variants'],
            'kind' => 'upload',
        ]);
    }

    if (preg_match('#^/media/(\d+)$#', $path, $m) && $method === 'DELETE') {
        require_role('admin');
        require_csrf();
        cms_media_delete((int) $m[1]);
        json_out(['ok' => true]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}

function cms_uploads_dir(): string
{
    $dir = __DIR__ . '/uploads';
    foreach ([$dir, "$dir/originals", "$dir/history"] as $path) {
        if (!is_dir($path)) {
            mkdir($path, 0775, true);
        }
    }
    return $dir;
}

function cms_media_public_row(array $row): array
{
    $original = (string) ($row['original_stored'] ?? '');
    return [
        'id' => (int) $row['id'],
        'original_name' => $row['original_name'],
        'url' => $row['url'],
        'mime' => $row['mime'],
        'size_bytes' => (int) $row['size_bytes'],
        'width' => $row['width'] !== null ? (int) $row['width'] : null,
        'height' => $row['height'] !== null ? (int) $row['height'] : null,
        'variants' => $row['variants'] ? json_decode((string) $row['variants'], true) : [],
        'parent_id' => isset($row['parent_id']) && $row['parent_id'] !== null ? (int) $row['parent_id'] : null,
        'kind' => (string) ($row['kind'] ?? 'upload'),
        'original_url' => $original !== '' ? '/api/uploads/' . ltrim($original, '/') : null,
        'created_at' => $row['created_at'],
    ];
}

function cms_media_insert(array $saved, string $originalName, string $kind, ?int $parentId): int
{
    $stmt = db()->prepare(
        'INSERT INTO media (original_name, stored_name, url, mime, size_bytes, width, height, variants, parent_id, kind, original_stored)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $originalName,
        $saved['stored'],
        $saved['url'],
        $saved['mime'],
        $saved['size'],
        $saved['width'],
        $saved['height'],
        json_encode($saved['variants']),
        $parentId,
        $kind,
        $saved['original_stored'] ?? null,
    ]);
    return (int) db()->lastInsertId();
}

function cms_media_snapshot(int $mediaId, array $saved, string $reason): void
{
    try {
        db()->prepare(
            'INSERT INTO media_versions (media_id, stored_name, url, mime, size_bytes, width, height, reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $mediaId,
            $saved['stored'],
            $saved['url'],
            $saved['mime'],
            $saved['size'],
            $saved['width'],
            $saved['height'],
            $reason,
        ]);
    } catch (Throwable) {
        /* tabla nueva; el próximo request de migrate la crea */
    }
}

function cms_media_archive_current(int $mediaId): void
{
    $stmt = db()->prepare('SELECT stored_name, url, mime, size_bytes, width, height FROM media WHERE id = ?');
    $stmt->execute([$mediaId]);
    $row = $stmt->fetch();
    if (!$row) {
        return;
    }
    $dir = cms_uploads_dir();
    $name = (string) $row['stored_name'];
    $src = $dir . '/' . $name;
    if (!is_file($src)) {
        return;
    }
    $hist = 'history/' . $mediaId . '-' . time() . '-' . basename($name);
    if (!@copy($src, $dir . '/' . $hist)) {
        return;
    }
    cms_media_snapshot($mediaId, [
        'stored' => $hist,
        'url' => '/api/uploads/' . $hist,
        'mime' => $row['mime'],
        'size' => is_file($dir . '/' . $hist) ? (filesize($dir . '/' . $hist) ?: 0) : (int) $row['size_bytes'],
        'width' => $row['width'],
        'height' => $row['height'],
    ], 'crop');
}

function cms_media_versions(int $id): array
{
    $stmt = db()->prepare('SELECT id FROM media WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_out(['message' => 'Archivo no encontrado'], 404);
    }
    $rows = db()->prepare(
        'SELECT id, stored_name, url, mime, size_bytes, width, height, reason, created_at
         FROM media_versions WHERE media_id = ? ORDER BY id DESC LIMIT 40'
    );
    $rows->execute([$id]);
    $items = [];
    foreach ($rows->fetchAll() as $row) {
        $items[] = [
            'id' => (int) $row['id'],
            'url' => $row['url'],
            'mime' => $row['mime'],
            'size_bytes' => (int) $row['size_bytes'],
            'width' => $row['width'] !== null ? (int) $row['width'] : null,
            'height' => $row['height'] !== null ? (int) $row['height'] : null,
            'reason' => $row['reason'],
            'created_at' => $row['created_at'],
        ];
    }
    $parent = db()->prepare('SELECT id, url, kind, created_at FROM media WHERE id = (SELECT parent_id FROM media WHERE id = ?)');
    $parent->execute([$id]);
    $parentRow = $parent->fetch();
    if ($parentRow) {
        array_unshift($items, [
            'id' => 0,
            'url' => $parentRow['url'],
            'mime' => '',
            'size_bytes' => 0,
            'width' => null,
            'height' => null,
            'reason' => 'parent',
            'created_at' => $parentRow['created_at'],
        ]);
    }
    return $items;
}

function cms_media_restore(int $id, array $input): array
{
    $stmt = db()->prepare('SELECT * FROM media WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Archivo no encontrado'], 404);
    }
    $use = (string) ($input['use'] ?? 'previous');
    if ($use === 'original' && !empty($row['original_stored'])) {
        $url = '/api/uploads/' . ltrim((string) $row['original_stored'], '/');
        return ['url' => $url, 'id' => $id, 'kind' => 'original'];
    }
    if (!empty($input['versionId'])) {
        $ver = db()->prepare('SELECT url FROM media_versions WHERE id = ? AND media_id = ?');
        $ver->execute([(int) $input['versionId'], $id]);
        $found = $ver->fetch();
        if (!$found) {
            json_out(['message' => 'Esa versión no existe'], 404);
        }
        return ['url' => $found['url'], 'id' => $id, 'kind' => 'version'];
    }
    if (!empty($row['parent_id'])) {
        $parent = db()->prepare('SELECT id, url FROM media WHERE id = ?');
        $parent->execute([(int) $row['parent_id']]);
        $found = $parent->fetch();
        if ($found) {
            return ['url' => $found['url'], 'id' => (int) $found['id'], 'kind' => 'parent'];
        }
    }
    json_out(['message' => 'No hay una versión anterior para restaurar'], 400);
}

function cms_media_delete(int $id): void
{
    $stmt = db()->prepare('SELECT stored_name, variants, original_stored FROM media WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        json_out(['message' => 'Archivo no encontrado'], 404);
    }
    $dir = cms_uploads_dir();
    $disk = $dir . '/' . $row['stored_name'];
    if (is_file($disk)) {
        unlink($disk);
    }
    $raster = preg_replace('/\.webp$/i', '.jpg', (string) $row['stored_name']);
    if (is_string($raster) && $raster !== $row['stored_name'] && is_file($dir . '/' . $raster)) {
        unlink($dir . '/' . $raster);
    }
    if (!empty($row['original_stored']) && is_file($dir . '/' . $row['original_stored'])) {
        unlink($dir . '/' . $row['original_stored']);
    }
    $variants = json_decode((string) ($row['variants'] ?? ''), true) ?: [];
    foreach ($variants as $item) {
        $name = is_array($item) ? ($item['file'] ?? '') : '';
        if ($name && is_file($dir . '/' . $name)) {
            unlink($dir . '/' . $name);
        }
    }
    try {
        $hist = db()->prepare('SELECT stored_name FROM media_versions WHERE media_id = ?');
        $hist->execute([$id]);
        foreach ($hist->fetchAll() as $ver) {
            $name = (string) ($ver['stored_name'] ?? '');
            if ($name !== '' && str_starts_with($name, 'history/') && is_file($dir . '/' . $name)) {
                unlink($dir . '/' . $name);
            }
        }
        db()->prepare('DELETE FROM media_versions WHERE media_id = ?')->execute([$id]);
    } catch (Throwable) {
        /* sin tabla todavía */
    }
    db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
}

function write_resized_image(GdImage $src, int $srcW, int $srcH, int $max, string $path, bool $webp): void
{
    $newW = $srcW;
    $newH = $srcH;
    if ($srcW > $max || $srcH > $max) {
        if ($srcW >= $srcH) {
            $newW = $max;
            $newH = (int) round($srcH * ($max / $srcW));
        } else {
            $newH = $max;
            $newW = (int) round($srcW * ($max / $srcH));
        }
    }
    $dst = imagecreatetruecolor($newW, $newH);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);
    if ($webp) {
        imagewebp($dst, $path, 80);
    } else {
        imagejpeg($dst, $path, 82);
    }
    imagedestroy($dst);
}

function compress_image(string $tmp, string $originalName): array
{
    $dir = cms_uploads_dir();
    $info = @getimagesize($tmp);
    if ($info === false) {
        json_out(['message' => 'Ese archivo no parece una imagen'], 400);
    }
    [$width, $height, $type] = $info;
    $width = (int) $width;
    $height = (int) $height;
    if ($width < 1 || $height < 1 || $width > 8000 || $height > 8000 || ($width * $height) > 40000000) {
        json_out(['message' => 'La imagen es demasiado grande. Usa una de 8000 px o menos por lado.'], 400);
    }
    $src = match ($type) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($tmp),
        IMAGETYPE_PNG => imagecreatefrompng($tmp),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($tmp) : null,
        IMAGETYPE_GIF => imagecreatefromgif($tmp),
        default => null,
    };
    if (!$src) {
        json_out(['message' => 'No se pudo leer la imagen'], 400);
    }

    $id = bin2hex(random_bytes(8));
    $origExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION) ?: '');
    $origExt = match ($origExt) {
        'jpeg' => 'jpg',
        'jpg', 'png', 'webp', 'gif' => $origExt,
        default => match ($type) {
            IMAGETYPE_JPEG => 'jpg',
            IMAGETYPE_PNG => 'png',
            IMAGETYPE_WEBP => 'webp',
            IMAGETYPE_GIF => 'gif',
            default => 'bin',
        },
    };
    $originalStored = 'originals/' . $id . '-orig.' . $origExt;
    @copy($tmp, $dir . '/' . $originalStored);

    $supportsWebp = function_exists('imagewebp');
    $ext = $supportsWebp ? 'webp' : 'jpg';
    $stored = "$id.$ext";
    $mainPath = "$dir/$stored";
    write_resized_image($src, $width, $height, 1920, $mainPath, $supportsWebp);
    $mainInfo = getimagesize($mainPath) ?: [$width, $height];

    $variants = cms_media_write_responsive_variants(
        $src,
        $width,
        $height,
        $id,
        $dir,
        $supportsWebp,
        (int) $mainInfo[0]
    );

    imagedestroy($src);

    return [
        'stored' => $stored,
        'url' => '/api/uploads/' . $stored,
        'mime' => $supportsWebp ? 'image/webp' : 'image/jpeg',
        'size' => filesize($mainPath) ?: 0,
        'original' => $originalName,
        'original_stored' => is_file($dir . '/' . $originalStored) ? $originalStored : null,
        'original_url' => is_file($dir . '/' . $originalStored) ? '/api/uploads/' . $originalStored : null,
        'width' => (int) $mainInfo[0],
        'height' => (int) $mainInfo[1],
        'variants' => $variants,
    ];
}

function cms_media_basename(string $url): string
{
    $name = basename(parse_url($url, PHP_URL_PATH) ?: $url);
    $name = preg_replace('/-(?:480|960)(?=\.(?:webp|jpe?g)$)/i', '', $name) ?? $name;
    return $name;
}

/**
 * Genera bajo demanda una variante faltante `<id>-480|960.(webp|jpg)` desde el
 * archivo base (`<id>.webp`, `<id>.jpg` u original registrado) y la guarda en
 * disco. Cura los 404 de medias subidas antes de las variantes, sin tocar el
 * frontend. Devuelve la ruta o null.
 */
function cms_media_ensure_variant(string $id, int $max, string $ext): ?string
{
    if (!preg_match('/^[a-f0-9]{16}$/i', $id) || ($max !== 480 && $max !== 960)) {
        return null;
    }
    $ext = strtolower($ext) === 'jpeg' ? 'jpg' : strtolower($ext);
    if ($ext !== 'webp' && $ext !== 'jpg') {
        return null;
    }
    $dir = cms_uploads_dir();
    $target = "$dir/$id-$max.$ext";
    if (is_file($target)) {
        return $target;
    }
    $base = null;
    foreach (["$dir/$id.webp", "$dir/$id.jpg"] as $candidate) {
        if (is_file($candidate)) {
            $base = $candidate;
            break;
        }
    }
    if ($base === null) {
        try {
            $stmt = db()->prepare('SELECT original_stored FROM media WHERE stored_name LIKE ? LIMIT 1');
            $stmt->execute([$id . '%']);
            $row = $stmt->fetch();
            $original = is_array($row) ? (string) ($row['original_stored'] ?? '') : '';
            if ($original !== '' && is_file("$dir/$original")) {
                $base = "$dir/$original";
            }
        } catch (Throwable) {
            return null;
        }
    }
    if ($base === null) {
        return null;
    }
    $data = @file_get_contents($base);
    $src = $data !== false ? @imagecreatefromstring($data) : false;
    if ($src === false) {
        return null;
    }
    $size = @getimagesize($base);
    if (!is_array($size)) {
        return null;
    }
    try {
        write_resized_image($src, (int) $size[0], (int) $size[1], $max, $target, $ext === 'webp');
    } catch (Throwable) {
        return null;
    }
    return is_file($target) ? $target : null;
}

function cms_media_resolve_request(): void
{
    $url = trim((string) ($_GET['url'] ?? ''));
    if ($url === '') {
        json_out(['message' => 'Falta url'], 400);
    }
    $name = cms_media_basename($url);
    if ($name === '' || str_contains($name, '..') || str_contains($name, '/')) {
        json_out(['message' => 'URL inválida'], 400);
    }
    $row = cms_media_find_by_url('/api/uploads/' . $name);
    if (!$row && preg_match('/\.jpe?g$/i', $name)) {
        $row = cms_media_find_by_url('/api/uploads/' . preg_replace('/\.jpe?g$/i', '.webp', $name));
    }
    if (!$row) {
        json_out(['message' => 'Imagen no encontrada'], 404);
    }
    json_out_public([
        'url' => $row['url'],
        'width' => $row['width'] !== null ? (int) $row['width'] : null,
        'height' => $row['height'] !== null ? (int) $row['height'] : null,
        'variants' => $row['variants'] ? json_decode((string) $row['variants'], true) : [],
    ], $row['created_at'] ?? null);
}

function cms_media_find_by_url(string $url): ?array
{
    $name = cms_media_basename($url);
    if ($name === '' || str_contains($name, '..')) {
        return null;
    }
    $stmt = db()->prepare('SELECT * FROM media WHERE stored_name = ? OR url = ? OR url = ? ORDER BY id DESC LIMIT 1');
    $canonical = '/api/uploads/' . $name;
    $stmt->execute([$name, $url, $canonical]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function cms_media_write_responsive_variants(
    GdImage $src,
    int $width,
    int $height,
    string $id,
    string $dir,
    bool $supportsWebp,
    int $mainWidth
): array {
    $variants = [];
    if ($supportsWebp) {
        $jpgName = $id . '.jpg';
        write_resized_image($src, $width, $height, 1920, "$dir/$jpgName", false);
        $variants[] = ['width' => $mainWidth, 'file' => $jpgName, 'url' => '/api/uploads/' . $jpgName, 'kind' => 'raster'];
    }
    foreach ([480, 960] as $max) {
        if ($supportsWebp) {
            $webpName = $id . '-' . $max . '.webp';
            write_resized_image($src, $width, $height, $max, "$dir/$webpName", true);
            $info = @getimagesize("$dir/$webpName");
            $outW = is_array($info) ? (int) $info[0] : min($max, $width);
            $variants[] = ['width' => $outW, 'file' => $webpName, 'url' => '/api/uploads/' . $webpName];
            $jpgName = $id . '-' . $max . '.jpg';
            write_resized_image($src, $width, $height, $max, "$dir/$jpgName", false);
            $variants[] = ['width' => $outW, 'file' => $jpgName, 'url' => '/api/uploads/' . $jpgName, 'kind' => 'raster'];
            continue;
        }
        $jpgName = $id . '-' . $max . '.jpg';
        write_resized_image($src, $width, $height, $max, "$dir/$jpgName", false);
        $info = @getimagesize("$dir/$jpgName");
        $outW = is_array($info) ? (int) $info[0] : min($max, $width);
        $variants[] = ['width' => $outW, 'file' => $jpgName, 'url' => '/api/uploads/' . $jpgName];
    }
    return $variants;
}

function cms_media_open_gd(string $path): ?array
{
    $info = @getimagesize($path);
    if ($info === false) {
        return null;
    }
    $src = match ($info[2]) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($path),
        IMAGETYPE_PNG => imagecreatefrompng($path),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : null,
        IMAGETYPE_GIF => imagecreatefromgif($path),
        default => null,
    };
    if (!$src) {
        return null;
    }
    return [$src, (int) $info[0], (int) $info[1]];
}

function cms_media_variant_index(array $variants): array
{
    $map = [];
    foreach ($variants as $item) {
        $file = is_array($item) ? (string) ($item['file'] ?? '') : '';
        if ($file !== '') {
            $map[$file] = true;
        }
    }
    return $map;
}

function cms_media_backfill_variants(): array
{
    $dir = cms_uploads_dir();
    $supportsWebp = function_exists('imagewebp');
    $rows = db()->query('SELECT id, stored_name, url, width, height, variants, original_stored FROM media')->fetchAll();
    $updated = 0;
    $skipped = 0;
    $failed = 0;
    foreach ($rows as $row) {
        $stored = (string) ($row['stored_name'] ?? '');
        if (!preg_match('/^([a-f0-9]{16})\.(webp|jpe?g)$/i', $stored, $match)) {
            $skipped++;
            continue;
        }
        $id = strtolower($match[1]);
        $orig = (string) ($row['original_stored'] ?? '');
        $srcPath = $orig !== '' && is_file($dir . '/' . $orig) ? $dir . '/' . $orig : $dir . '/' . $stored;
        if (!is_file($srcPath)) {
            $failed++;
            continue;
        }
        $opened = cms_media_open_gd($srcPath);
        if ($opened === null) {
            $failed++;
            continue;
        }
        [$src, $width, $height] = $opened;
        $variants = $row['variants'] ? (json_decode((string) $row['variants'], true) ?: []) : [];
        $have = cms_media_variant_index($variants);
        $needed = [];
        if ($supportsWebp) {
            $needed[] = [$id . '.jpg', 1920, false, 'raster'];
        }
        foreach ([480, 960] as $max) {
            if ($supportsWebp) {
                $needed[] = [$id . '-' . $max . '.webp', $max, true, null];
                $needed[] = [$id . '-' . $max . '.jpg', $max, false, 'raster'];
            } else {
                $needed[] = [$id . '-' . $max . '.jpg', $max, false, null];
            }
        }
        $changed = false;
        foreach ($needed as [$file, $max, $webp, $kind]) {
            $path = $dir . '/' . $file;
            if (!is_file($path)) {
                write_resized_image($src, $width, $height, $max, $path, $webp);
                $changed = true;
            }
            if (!isset($have[$file]) && is_file($path)) {
                $info = @getimagesize($path);
                $entry = [
                    'width' => is_array($info) ? (int) $info[0] : $max,
                    'file' => $file,
                    'url' => '/api/uploads/' . $file,
                ];
                if ($kind) {
                    $entry['kind'] = $kind;
                }
                $variants[] = $entry;
                $have[$file] = true;
                $changed = true;
            }
        }
        imagedestroy($src);
        if ($changed) {
            $stmt = db()->prepare('UPDATE media SET variants = ? WHERE id = ?');
            $stmt->execute([json_encode($variants), (int) $row['id']]);
            $updated++;
        } else {
            $skipped++;
        }
    }
    return ['updated' => $updated, 'skipped' => $skipped, 'failed' => $failed, 'total' => count($rows)];
}

function cms_media_crop(array $input): array
{
    $url = (string) ($input['url'] ?? '');
    $x = (int) ($input['x'] ?? 0);
    $y = (int) ($input['y'] ?? 0);
    $w = (int) ($input['w'] ?? 0);
    $h = (int) ($input['h'] ?? 0);
    if ($w < 8 || $h < 8) {
        json_out(['message' => 'El recorte es demasiado pequeño.'], 400);
    }
    $name = basename(parse_url($url, PHP_URL_PATH) ?: '');
    $dir = cms_uploads_dir();
    $srcPath = $dir . '/' . $name;
    if ($name === '' || str_contains($name, '..')) {
        json_out(['message' => 'No se encontró esa imagen en el servidor.'], 400);
    }
    if (!is_file($srcPath)) {
        $public = dirname(__DIR__) . '/' . $name;
        if (is_file($public)) {
            $srcPath = $public;
        }
    }
    if (!is_file($srcPath)) {
        json_out(['message' => 'No se encontró esa imagen en el servidor.'], 400);
    }
    $info = @getimagesize($srcPath);
    if ($info === false) {
        json_out(['message' => 'Ese archivo no parece una imagen'], 400);
    }
    $srcW = (int) $info[0];
    $srcH = (int) $info[1];
    $x = max(0, min($x, $srcW - 1));
    $y = max(0, min($y, $srcH - 1));
    $w = max(8, min($w, $srcW - $x));
    $h = max(8, min($h, $srcH - $y));
    $src = match ($info[2]) {
        IMAGETYPE_JPEG => imagecreatefromjpeg($srcPath),
        IMAGETYPE_PNG => imagecreatefrompng($srcPath),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($srcPath) : null,
        IMAGETYPE_GIF => imagecreatefromgif($srcPath),
        default => null,
    };
    if (!$src) {
        json_out(['message' => 'No se pudo leer la imagen'], 400);
    }
    $crop = imagecrop($src, ['x' => $x, 'y' => $y, 'width' => $w, 'height' => $h]);
    imagedestroy($src);
    if (!$crop) {
        json_out(['message' => 'No se pudo recortar la imagen'], 400);
    }
    $tmp = tempnam(sys_get_temp_dir(), 'cms-crop-');
    $webp = function_exists('imagewebp');
    if ($webp) {
        imagewebp($crop, $tmp, 82);
    } else {
        imagejpeg($crop, $tmp, 82);
    }
    imagedestroy($crop);
    $parent = cms_media_find_by_url($url);
    if ($parent) {
        cms_media_archive_current((int) $parent['id']);
    }
    $saved = compress_image($tmp, 'crop-' . $name);
    @unlink($tmp);
    $id = cms_media_insert($saved, 'crop-' . $name, 'crop', $parent ? (int) $parent['id'] : null);
    cms_media_snapshot($id, $saved, 'crop');
    return [
        'id' => $id,
        'url' => $saved['url'],
        'width' => $saved['width'],
        'height' => $saved['height'],
        'variants' => $saved['variants'],
        'parent_id' => $parent ? (int) $parent['id'] : null,
        'previous_url' => $parent['url'] ?? $url,
        'original_url' => $saved['original_url'] ?? ($parent['original_stored'] ? '/api/uploads/' . $parent['original_stored'] : null),
        'kind' => 'crop',
    ];
}

function handle_upload_asset(string $name): void
{
    $name = basename($name);
    if (!preg_match('/^[A-Za-z0-9._-]+$/', $name)) {
        json_out(['message' => 'No encontrado'], 404);
    }
    $dir = cms_uploads_dir();
    $file = $dir . '/' . $name;

    // Variante 480/960 ausente: se genera bajo demanda desde el archivo base.
    if (!is_file($file) && preg_match('/^([a-f0-9]{16})-(480|960)\.(webp|jpe?g)$/i', $name, $m)) {
        $made = cms_media_ensure_variant(strtolower($m[1]), (int) $m[2], strtolower($m[3]));
        if (is_string($made)) {
            $file = $made;
        }
    }
    if (!is_file($file)) {
        json_out(['message' => 'No encontrado'], 404);
    }
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, ['php', 'phtml', 'phar', 'cgi', 'pl'], true)) {
        http_response_code(403);
        exit;
    }
    header('Content-Type: ' . match ($ext) {
        'webp' => 'image/webp',
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        default => 'application/octet-stream',
    });
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($file);
    exit;
}
