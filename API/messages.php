<?php
declare(strict_types=1);

function handle_messages(string $method): void
{
    require_admin();
    if ($method !== 'GET') {
        json_out(['message' => 'Método no permitido'], 405);
    }
    $rows = db()->query('SELECT id, kind, subject, payload, ticket, created_at FROM messages ORDER BY id DESC LIMIT 200')->fetchAll();
    foreach ($rows as &$row) {
        $row['payload'] = json_decode($row['payload'], true);
    }
    json_out(['items' => $rows]);
}

function destination_email(string $pageSlug, string $fallback): string
{
    if ($pageSlug === 'sitio') {
        return $fallback;
    }
    $stmt = db()->prepare('SELECT content FROM pages WHERE slug = ?');
    $stmt->execute([$pageSlug]);
    $row = $stmt->fetch();
    if (!$row) {
        return $fallback;
    }
    $content = json_decode($row['content'], true) ?: [];
    $email = trim((string) ($content['destinationEmail'] ?? ''));
    return $email !== '' ? $email : $fallback;
}

function handle_contacto(): void
{
    $input = json_input();
    $name = trim((string) ($input['name'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));
    $subject = trim((string) ($input['subject'] ?? 'Consulta web'));
    $message = trim((string) ($input['message'] ?? ''));
    if ($email === '' && $name === '') {
        json_out(['message' => 'Datos incompletos'], 400);
    }

    $stmt = db()->prepare('INSERT INTO messages (kind, subject, payload) VALUES (?, ?, ?)');
    $payload = ['name' => $name, 'email' => $email, 'phone' => $phone, 'subject' => $subject, 'message' => $message];
    $stmt->execute(['contacto', $subject, json_encode($payload, JSON_UNESCAPED_UNICODE)]);

    $to = destination_email('contacto', 'contacto@mattinnovasolution.com');
    $html = '<h2>Nuevo mensaje de contacto</h2>'
        . '<p><strong>Nombre:</strong> ' . htmlspecialchars($name) . '</p>'
        . '<p><strong>Correo:</strong> ' . htmlspecialchars($email) . '</p>'
        . '<p><strong>Teléfono:</strong> ' . htmlspecialchars($phone) . '</p>'
        . '<p><strong>Asunto:</strong> ' . htmlspecialchars($subject) . '</p>'
        . '<p>' . nl2br(htmlspecialchars($message)) . '</p>';
    send_mail($to, 'Contacto web: ' . $subject, $html);

    json_out(['status' => 'success', 'message' => 'Mensaje enviado']);
}

function handle_reclamaciones(): void
{
    $input = json_input();
    $email = trim((string) ($input['email'] ?? ''));
    $fullname = trim((string) ($input['fullname'] ?? ''));
    if ($email === '' || $fullname === '') {
        json_out(['message' => 'Datos incompletos'], 400);
    }

    $ticket = 'REC-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
    $payload = $input;
    $stmt = db()->prepare('INSERT INTO messages (kind, subject, payload, ticket) VALUES (?, ?, ?, ?)');
    $stmt->execute(['reclamacion', 'Libro de reclamaciones ' . $ticket, json_encode($payload, JSON_UNESCAPED_UNICODE), $ticket]);

    $to = destination_email('libro-reclamaciones', 'libroreclamaciones@mattinnovasolution.com');
    $amount = !empty($input['claimedAmount']) ? 'S/ ' . $input['claimedAmount'] : 'No especificado';
    $html = '<h2>Hoja de reclamación virtual</h2><p>Ticket: <strong>' . htmlspecialchars($ticket) . '</strong></p>'
        . '<p><strong>Nombre:</strong> ' . htmlspecialchars($fullname) . '</p>'
        . '<p><strong>Documento:</strong> ' . htmlspecialchars((string) ($input['documentType'] ?? '')) . ' ' . htmlspecialchars((string) ($input['documentNumber'] ?? '')) . '</p>'
        . '<p><strong>Teléfono:</strong> ' . htmlspecialchars((string) ($input['phone'] ?? '')) . '</p>'
        . '<p><strong>Email:</strong> ' . htmlspecialchars($email) . '</p>'
        . '<p><strong>Domicilio:</strong> ' . htmlspecialchars((string) ($input['address'] ?? '')) . '</p>'
        . '<p><strong>Bien:</strong> ' . htmlspecialchars((string) ($input['typeOfBien'] ?? '')) . ' / ' . htmlspecialchars($amount) . '</p>'
        . '<p><strong>Detalle:</strong> ' . nl2br(htmlspecialchars((string) ($input['details'] ?? ''))) . '</p>'
        . '<p><strong>Pedido:</strong> ' . nl2br(htmlspecialchars((string) ($input['consumerPedido'] ?? ''))) . '</p>';
    send_mail($to, 'Libro de reclamaciones ' . $ticket, $html);
    if ($email !== '') {
        send_mail($email, 'Copia de su reclamación ' . $ticket, $html, $fullname);
    }

    json_out(['status' => 'success', 'message' => 'Reclamación registrada', 'ticket' => $ticket]);
}
