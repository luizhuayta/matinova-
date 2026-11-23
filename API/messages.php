<?php
declare(strict_types=1);

function handle_messages(string $method): void
{
    require_admin();
    if ($method !== 'GET') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    $kind = trim((string) ($_GET['kind'] ?? ''));
    $status = trim((string) ($_GET['status'] ?? ''));
    $q = trim((string) ($_GET['q'] ?? ''));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = (int) ($_GET['limit'] ?? 50);
    if ($limit < 1) {
        $limit = 50;
    }
    if ($limit > 200) {
        $limit = 200;
    }
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];
    if (in_array($kind, ['contacto', 'reclamacion', 'accesibilidad'], true)) {
        $where[] = 'kind = ?';
        $params[] = $kind;
    }
    if (in_array($status, ['pendiente', 'atendido'], true)) {
        $where[] = 'status = ?';
        $params[] = $status;
    }
    if ($q !== '') {
        $where[] = '(ticket LIKE ? OR subject LIKE ? OR payload LIKE ?)';
        $like = '%' . $q . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }
    $sqlWhere = $where !== [] ? (' WHERE ' . implode(' AND ', $where)) : '';
    $countStmt = db()->prepare('SELECT COUNT(*) FROM messages' . $sqlWhere);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $stmt = db()->prepare(
        'SELECT id, kind, subject, payload, ticket, status, mail_sent, created_at
         FROM messages' . $sqlWhere . ' ORDER BY id DESC LIMIT ' . $limit . ' OFFSET ' . $offset
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['payload'] = json_decode((string) $row['payload'], true);
        $row['mail_sent'] = (int) ($row['mail_sent'] ?? 0);
    }
    unset($row);
    json_out(['items' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
}

function handle_message_item(int $id, string $method): void
{
    require_admin();
    if ($method !== 'PATCH') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    require_csrf();
    $input = json_input();
    $status = trim((string) ($input['status'] ?? ''));
    if (!in_array($status, ['pendiente', 'atendido'], true)) {
        json_out(['field' => 'status', 'message' => 'Estado no válido.'], 400);
    }
    $stmt = db()->prepare('UPDATE messages SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    if ($stmt->rowCount() === 0) {
        $check = db()->prepare('SELECT id FROM messages WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) {
            json_out(['message' => 'Mensaje no encontrado'], 404);
        }
    }
    $row = db()->prepare('SELECT id, kind, subject, payload, ticket, status, mail_sent, created_at FROM messages WHERE id = ?');
    $row->execute([$id]);
    $item = $row->fetch();
    if (!$item) {
        json_out(['message' => 'Mensaje no encontrado'], 404);
    }
    $item['payload'] = json_decode((string) $item['payload'], true);
    $item['mail_sent'] = (int) ($item['mail_sent'] ?? 0);
    json_out(['item' => $item]);
}

function cms_block_email(array $content): string
{
    foreach (($content['blocks'] ?? []) as $block) {
        if (!is_array($block)) {
            continue;
        }
        $props = is_array($block['props'] ?? null) ? $block['props'] : [];
        $email = trim((string) ($props['destinationEmail'] ?? ''));
        if ($email !== '') {
            return $email;
        }
    }
    return '';
}

function destination_email(string $pageSlug, string $fallback): string
{
    $envKey = match ($pageSlug) {
        'contacto' => 'CONTACT_DEST_EMAIL',
        'libro-reclamaciones' => 'CLAIMS_DEST_EMAIL',
        default => '',
    };
    $env = $envKey !== '' ? trim(cfg($envKey)) : '';
    if ($pageSlug !== 'sitio') {
        $stmt = db()->prepare('SELECT content FROM pages WHERE slug = ? AND locale = ?');
        $stmt->execute([$pageSlug, 'es']);
        $row = $stmt->fetch();
        if ($row) {
            $content = json_decode((string) $row['content'], true) ?: [];
            $cms = trim((string) ($content['destinationEmail'] ?? ''));
            if ($cms === '') {
                $cms = cms_block_email($content);
            }
            if ($cms !== '') {
                // Solo se acepta si es email válido; si no, se sigue al fallback (misma regla que el validador CMS).
                if (filter_var($cms, FILTER_VALIDATE_EMAIL)) {
                    return $cms;
                }
                error_log('destinationEmail CMS inválido en ' . $pageSlug . ', se usa fallback.');
            }
        }
    }
    return $env !== '' ? $env : $fallback;
}

function mail_html_card(string $title, string $inner, string $accent = '#00aaff'): string
{
    return '<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">'
        . '<h2 style="color: ' . htmlspecialchars($accent) . '; text-align: center;">' . htmlspecialchars($title) . '</h2>'
        . '<hr style="border: 0; border-top: 1px solid #eee;" />'
        . $inner
        . '</div>';
}

function str_clean(string $value, int $max = 500, bool $multiline = false): string
{
    $value = trim(strip_tags($value));
    if ($multiline) {
        $value = preg_replace("/[^\S\n]+/u", ' ', $value) ?? $value;
        $value = preg_replace("/\n{3,}/", "\n\n", $value) ?? $value;
    } else {
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    }
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max);
    }
    return substr($value, 0, $max);
}

function valid_email_addr(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function valid_phone_num(string $phone): bool
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    $len = strlen($digits);
    return $len >= 7 && $len <= 15;
}

function handle_contacto(): void
{
    $input = json_input();
    $name = str_clean((string) ($input['name'] ?? ''), 160);
    $email = str_clean((string) ($input['email'] ?? ''), 160);
    $phone = str_clean((string) ($input['phone'] ?? ''), 30);
    $subject = str_clean((string) ($input['subject'] ?? 'Consulta web'), 180);
    $message = str_clean((string) ($input['message'] ?? ''), 4000, true);
    if ($name === '') {
        json_out(['field' => 'name', 'message' => 'El nombre es obligatorio.'], 400);
    }
    if ($email === '' || !valid_email_addr($email)) {
        json_out(['field' => 'email', 'message' => 'Indica un correo válido.'], 400);
    }
    if ($message === '') {
        json_out(['field' => 'message', 'message' => 'El mensaje es obligatorio.'], 400);
    }
    if ($phone !== '' && !valid_phone_num($phone)) {
        json_out(['field' => 'phone', 'message' => 'El teléfono no es válido.'], 400);
    }

    $payload = ['name' => $name, 'email' => $email, 'phone' => $phone, 'subject' => $subject, 'message' => $message];
    $stmt = db()->prepare('INSERT INTO messages (kind, subject, payload, status, mail_sent) VALUES (?, ?, ?, ?, 0)');
    $stmt->execute(['contacto', $subject, json_encode($payload, JSON_UNESCAPED_UNICODE), 'pendiente']);
    $id = (int) db()->lastInsertId();

    $to = destination_email('contacto', 'contacto@mattinnovasolution.com');
    $html = mail_html_card('Nuevo mensaje de contacto',
        '<p><strong>Nombre del interesado:</strong> ' . htmlspecialchars($name) . '</p>'
        . '<p><strong>Correo de contacto:</strong> ' . htmlspecialchars($email) . '</p>'
        . '<p><strong>Teléfono:</strong> ' . htmlspecialchars($phone) . '</p>'
        . '<p><strong>Asunto:</strong> ' . htmlspecialchars($subject) . '</p>'
        . '<h3>Mensaje:</h3>'
        . '<p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #00aaff;">'
        . nl2br(htmlspecialchars($message)) . '</p>'
    );
    $mailOk = send_mail($to, 'Contacto web: ' . $subject, $html);
    if ($mailOk) {
        send_mail($email, 'Copia de tu mensaje a Matt Innova Solution', $html, $name);
        db()->prepare('UPDATE messages SET mail_sent = 1 WHERE id = ?')->execute([$id]);
    }

    json_out([
        'status' => 'success',
        'message' => $mailOk ? 'Mensaje enviado' : 'Mensaje registrado. El correo no se pudo enviar; lo veremos en el panel.',
        'mailSent' => $mailOk,
    ]);
}

function handle_accesibilidad(): void
{
    $input = json_input();
    $name = str_clean((string) ($input['name'] ?? ''), 160);
    $email = str_clean((string) ($input['email'] ?? ''), 160);
    $phone = str_clean((string) ($input['phone'] ?? ''), 30);
    $type = str_clean((string) ($input['assistanceType'] ?? 'accessibility'), 40);
    $description = str_clean((string) ($input['description'] ?? ''), 4000, true);
    if ($name === '') {
        json_out(['field' => 'name', 'message' => 'El nombre es obligatorio.'], 400);
    }
    if ($email === '' || !valid_email_addr($email)) {
        json_out(['field' => 'email', 'message' => 'Indica un correo válido.'], 400);
    }
    if ($description === '') {
        json_out(['field' => 'description', 'message' => 'La descripción es obligatoria.'], 400);
    }
    $allowed = ['accessibility', 'general', 'bug'];
    if (!in_array($type, $allowed, true)) {
        $type = 'accessibility';
    }
    $subject = 'Accesibilidad: ' . $type;
    $payload = ['name' => $name, 'email' => $email, 'phone' => $phone, 'assistanceType' => $type, 'description' => $description];
    $stmt = db()->prepare('INSERT INTO messages (kind, subject, payload, status, mail_sent) VALUES (?, ?, ?, ?, 0)');
    $stmt->execute(['accesibilidad', $subject, json_encode($payload, JSON_UNESCAPED_UNICODE), 'pendiente']);
    $id = (int) db()->lastInsertId();
    $to = destination_email('contacto', 'contacto@mattinnovasolution.com');
    $html = mail_html_card(
        'Reporte de accesibilidad',
        '<p><strong>Nombre:</strong> ' . htmlspecialchars($name) . '</p>'
        . '<p><strong>Correo:</strong> ' . htmlspecialchars($email) . '</p>'
        . '<p><strong>Teléfono:</strong> ' . htmlspecialchars($phone) . '</p>'
        . '<p><strong>Tipo:</strong> ' . htmlspecialchars($type) . '</p>'
        . '<p>' . nl2br(htmlspecialchars($description)) . '</p>'
    );
    $mailOk = send_mail($to, $subject, $html);
    if ($mailOk) {
        db()->prepare('UPDATE messages SET mail_sent = 1 WHERE id = ?')->execute([$id]);
    }
    json_out([
        'status' => 'success',
        'message' => $mailOk ? 'Reporte enviado' : 'Reporte registrado. Lo veremos en el panel.',
        'mailSent' => $mailOk,
    ]);
}

function handle_reclamaciones(): void
{
    $input = json_input();
    $email = str_clean((string) ($input['email'] ?? ''), 160);
    $fullname = str_clean((string) ($input['fullname'] ?? ''), 160);
    $documentType = str_clean((string) ($input['documentType'] ?? ''), 20);
    $documentNumber = str_clean((string) ($input['documentNumber'] ?? ''), 30);
    $phone = str_clean((string) ($input['phone'] ?? ''), 30);
    $address = str_clean((string) ($input['address'] ?? ''), 250);
    $typeOfBien = str_clean((string) ($input['typeOfBien'] ?? ''), 40);
    $descriptionBien = str_clean((string) ($input['descriptionBien'] ?? ''), 2000, true);
    $typeOfAccion = str_clean((string) ($input['typeOfAccion'] ?? ''), 40);
    $details = str_clean((string) ($input['details'] ?? ''), 4000, true);
    $consumerPedido = str_clean((string) ($input['consumerPedido'] ?? ''), 2000, true);
    $isMinor = !empty($input['isMinor']);
    $guardianName = str_clean((string) ($input['guardianName'] ?? ''), 160);
    $amountNotApplicable = !empty($input['amountNotApplicable']);
    $claimedAmount = $input['claimedAmount'] ?? null;

    if ($fullname === '') {
        json_out(['field' => 'fullname', 'message' => 'El nombre es obligatorio.'], 400);
    }
    if ($email === '' || !valid_email_addr($email)) {
        json_out(['field' => 'email', 'message' => 'Indica un correo válido.'], 400);
    }
    if ($documentType === '' || $documentNumber === '') {
        json_out(['field' => 'documentNumber', 'message' => 'Completa el documento de identidad.'], 400);
    }
    if ($phone === '' || !valid_phone_num($phone)) {
        json_out(['field' => 'phone', 'message' => 'Indica un teléfono válido.'], 400);
    }
    if ($address === '') {
        json_out(['field' => 'address', 'message' => 'El domicilio es obligatorio.'], 400);
    }
    if (!in_array($typeOfBien, ['producto', 'servicio'], true)) {
        json_out(['field' => 'typeOfBien', 'message' => 'Indica si es producto o servicio.'], 400);
    }
    if ($descriptionBien === '') {
        json_out(['field' => 'descriptionBien', 'message' => 'Describe el bien contratado.'], 400);
    }
    if (!in_array($typeOfAccion, ['reclamo', 'queja'], true)) {
        json_out(['field' => 'typeOfAccion', 'message' => 'Indica si es reclamo o queja.'], 400);
    }
    if ($details === '') {
        json_out(['field' => 'details', 'message' => 'El detalle de la reclamación es obligatorio.'], 400);
    }
    if ($consumerPedido === '') {
        json_out(['field' => 'consumerPedido', 'message' => 'Indica tu pedido concreto.'], 400);
    }
    if ($isMinor && $guardianName === '') {
        json_out(['field' => 'guardianName', 'message' => 'Si es menor de edad, indica el apoderado.'], 400);
    }

    $amount = null;
    if (!$amountNotApplicable && $claimedAmount !== null && $claimedAmount !== '') {
        if (!is_numeric($claimedAmount) || (float) $claimedAmount < 0 || (float) $claimedAmount > 99999999) {
            json_out(['field' => 'claimedAmount', 'message' => 'Indica un monto válido entre 0 y 99 999 999.'], 400);
        }
        $amount = (float) $claimedAmount;
    }

    $payload = [
        'fullname' => $fullname,
        'documentType' => $documentType,
        'documentNumber' => $documentNumber,
        'phone' => $phone,
        'email' => $email,
        'address' => $address,
        'typeOfBien' => $typeOfBien,
        'claimedAmount' => $amount,
        'amountNotApplicable' => $amountNotApplicable,
        'descriptionBien' => $descriptionBien,
        'typeOfAccion' => $typeOfAccion,
        'details' => $details,
        'consumerPedido' => $consumerPedido,
        'isMinor' => $isMinor,
        'guardianName' => $guardianName,
    ];

    $ticket = '';
    $id = 0;
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $ticket = 'REC-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        try {
            $stmt = db()->prepare('INSERT INTO messages (kind, subject, payload, ticket, status, mail_sent) VALUES (?, ?, ?, ?, ?, 0)');
            $stmt->execute(['reclamacion', 'Libro de reclamaciones ' . $ticket, json_encode($payload, JSON_UNESCAPED_UNICODE), $ticket, 'pendiente']);
            $id = (int) db()->lastInsertId();
            break;
        } catch (PDOException $e) {
            // 23000 = ticket duplicado (índice único): reintenta con otro.
            if ($e->getCode() !== '23000' || $attempt === 4) {
                throw $e;
            }
        }
    }

    $to = destination_email('libro-reclamaciones', 'libroreclamaciones@mattinnovasolution.com');
    $amountLabel = $amount !== null ? 'S/ ' . $amount : 'No especificado (opcional)';
    $html = mail_html_card('Hoja de reclamación virtual',
        '<p style="text-align: center; font-size: 14px; color: #666;">Se ha registrado un nuevo caso con el ticket: <strong>'
        . htmlspecialchars($ticket) . '</strong></p>'
        . '<h3>1. Identificación del consumidor</h3>'
        . '<p><strong>Nombre:</strong> ' . htmlspecialchars($fullname) . '</p>'
        . '<p><strong>Documento:</strong> ' . htmlspecialchars($documentType) . ' - '
        . htmlspecialchars($documentNumber) . '</p>'
        . '<p><strong>Teléfono:</strong> ' . htmlspecialchars($phone) . ' | <strong>Email:</strong> '
        . htmlspecialchars($email) . '</p>'
        . '<p><strong>Domicilio:</strong> ' . htmlspecialchars($address) . '</p>'
        . ($isMinor ? '<p><strong>Apoderado:</strong> ' . htmlspecialchars($guardianName) . '</p>' : '')
        . '<h3>2. Detalle del bien contratado</h3>'
        . '<p><strong>Tipo:</strong> ' . htmlspecialchars($typeOfBien) . '</p>'
        . '<p><strong>Monto:</strong> ' . htmlspecialchars($amountLabel) . '</p>'
        . '<p><strong>Descripción:</strong> ' . htmlspecialchars($descriptionBien) . '</p>'
        . '<h3>3. Detalle de la reclamación</h3>'
        . '<p><strong>Acción:</strong> ' . htmlspecialchars($typeOfAccion) . '</p>'
        . '<p><strong>Detalle:</strong> ' . nl2br(htmlspecialchars($details)) . '</p>'
        . '<p><strong>Pedido concreto:</strong> ' . nl2br(htmlspecialchars($consumerPedido)) . '</p>'
        . '<p style="font-size: 11px; color: #999; text-align: center;">Correo automático conforme a las normativas de Indecopi por Matt Innova Solution.</p>',
        '#0c2340'
    );
    $mailOk = send_mail($to, 'Libro de reclamaciones ' . $ticket, $html);
    if ($mailOk) {
        send_mail($email, 'Copia de su reclamación ' . $ticket, $html, $fullname);
        db()->prepare('UPDATE messages SET mail_sent = 1 WHERE id = ?')->execute([$id]);
    }

    json_out([
        'status' => 'success',
        'message' => $mailOk ? 'Reclamación registrada' : 'Reclamación registrada. El correo no se pudo enviar; el equipo lo verá en el panel.',
        'ticket' => $ticket,
        'mailSent' => $mailOk,
    ]);
}
