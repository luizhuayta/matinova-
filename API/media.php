<?php
declare(strict_types=1);

function handle_media(string $path, string $method): void
{
    if ($path === '/media/crop' && $method === 'POST') {
        require_admin();
        require_csrf();
        rate_limit('cms_media', 20, 60);
        json_out(cms_media_crop(json_input()));
    }

    if ($path === '/media' && $method === 'GET') {
        require_admin();
        $rows = db()->query('SELECT id, original_name, url, mime, size_bytes, width, height, variants, created_at FROM media ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['size_bytes'] = (int) $row['size_bytes'];
            $row['width'] = $row['width'] !== null ? (int) $row['width'] : null;
            $row['height'] = $row['height'] !== null ? (int) $row['height'] : null;
            $row['variants'] = $row['variants'] ? json_decode($row['variants'], true) : [];
        }
        json_out(['items' => $rows]);
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
        if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
            json_out(['message' => 'La foto pesa más de 10 MB'], 400);
        }
        $saved = compress_image($file['tmp_name'], $file['name']);
        $stmt = db()->prepare('INSERT INTO media (original_name, stored_name, url, mime, size_bytes, width, height, variants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $file['name'],
            $saved['stored'],
            $saved['url'],
            $saved['mime'],
            $saved['size'],
            $saved['width'],
            $saved['height'],
            json_encode($saved['variants']),
        ]);
        json_out([
            'id' => (int) db()->lastInsertId(),
            'url' => $saved['url'],
            'original_name' => $file['name'],
            'width' => $saved['width'],
            'height' => $saved['height'],
            'variants' => $saved['variants'],
        ]);
    }

    if (preg_match('#^/media/(\d+)$#', $path, $m) && $method === 'DELETE') {
        require_role('admin');
        require_csrf();
        $id = (int) $m[1];
        $stmt = db()->prepare('SELECT stored_name, variants FROM media WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            json_out(['message' => 'Archivo no encontrado'], 404);
        }
        $disk = __DIR__ . '/uploads/' . $row['stored_name'];
        if (is_file($disk)) {
            unlink($disk);
        }
        $variants = json_decode((string) ($row['variants'] ?? ''), true) ?: [];
        foreach ($variants as $item) {
            $name = is_array($item) ? ($item['file'] ?? '') : '';
            if ($name && is_file(__DIR__ . '/uploads/' . $name)) {
                unlink(__DIR__ . '/uploads/' . $name);
            }
        }
        db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
        json_out(['ok' => true]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
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
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);
    if ($webp) {
        imagewebp($dst, $path, 80);
    } else {
        imagejpeg($dst, $path, 80);
    }
    imagedestroy($dst);
}

function compress_image(string $tmp, string $originalName): array
{
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
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
    $supportsWebp = function_exists('imagewebp');
    $ext = $supportsWebp ? 'webp' : 'jpg';
    $stored = "$id.$ext";
    $mainPath = "$dir/$stored";
    write_resized_image($src, $width, $height, 1920, $mainPath, $supportsWebp);
    $mainInfo = getimagesize($mainPath) ?: [$width, $height];

    $variants = [];
    foreach ([480, 960] as $max) {
        if (max($width, $height) <= $max) {
            continue;
        }
        $name = $id . '-' . $max . '.' . $ext;
        write_resized_image($src, $width, $height, $max, "$dir/$name", $supportsWebp);
        $variants[] = ['width' => $max, 'file' => $name, 'url' => '/api/uploads/' . $name];
    }

    imagedestroy($src);

    return [
        'stored' => $stored,
        'url' => '/api/uploads/' . $stored,
        'mime' => $supportsWebp ? 'image/webp' : 'image/jpeg',
        'size' => filesize($mainPath) ?: 0,
        'original' => $originalName,
        'width' => (int) $mainInfo[0],
        'height' => (int) $mainInfo[1],
        'variants' => $variants,
    ];
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
    $srcPath = __DIR__ . '/uploads/' . $name;
    if ($name === '' || !is_file($srcPath) || str_contains($name, '..')) {
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
    $saved = compress_image($tmp, 'crop-' . $name);
    @unlink($tmp);
    $stmt = db()->prepare('INSERT INTO media (original_name, stored_name, url, mime, size_bytes, width, height, variants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        'crop-' . $name,
        $saved['stored'],
        $saved['url'],
        $saved['mime'],
        $saved['size'],
        $saved['width'],
        $saved['height'],
        json_encode($saved['variants']),
    ]);
    return [
        'id' => (int) db()->lastInsertId(),
        'url' => $saved['url'],
        'width' => $saved['width'],
        'height' => $saved['height'],
        'variants' => $saved['variants'],
    ];
}
