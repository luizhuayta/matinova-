<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Metodo no permitido"], JSON_UNESCAPED_UNICODE);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['fullname'])) {
    http_response_code(400);
    echo json_encode(["message" => "Datos incompletos"], JSON_UNESCAPED_UNICODE);
    exit();
}

$ticketNumber = "REC-" . rand(1000, 9999);
$subject = "Libro de Reclamaciones - Ticket " . $ticketNumber;
$claimedAmountStr = isset($input['claimedAmount']) && $input['claimedAmount'] ? "S/ " . $input['claimedAmount'] : 'No especificado (Opcional)';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'mail.mattinnovasolution.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'notificaciones@mattinnovasolution.com';
    $mail->Password   = 'mattinnovasolution';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            
    $mail->Port       = 465;                                    
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom('notificaciones@mattinnovasolution.com', 'Libro Reclamaciones Matt Innova');
    
    $mail->addAddress($input['email'], $input['fullname']);
    $mail->addAddress('libroreclamaciones@mattinnovasolution.com', 'Administrador MIS'); 

    $mail->isHTML(true);
    $mail->Subject = $subject;
    
    $mail->Body = '
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0c2340; text-align: center;">Hoja de Reclamacion Virtual</h2>
        <p style="text-align: center; font-size: 14px; color: #666;">Se ha registrado un nuevo caso con el ticket: <strong>' . $ticketNumber . '</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>1. Identificacion del Consumidor</h3>
        <p><strong>Nombre:</strong> ' . htmlspecialchars($input['fullname']) . '</p>
        <p><strong>Documento:</strong> ' . htmlspecialchars($input['documentType']) . ' - ' . htmlspecialchars($input['documentNumber']) . '</p>
        <p><strong>Telefono:</strong> ' . htmlspecialchars($input['phone']) . ' | <strong>Email:</strong> ' . htmlspecialchars($input['email']) . '</p>
        <p><strong>Domicilio:</strong> ' . htmlspecialchars($input['address']) . '</p>
        <h3>2. Detalle del Bien Contratado</h3>
        <p><strong>Tipo:</strong> ' . htmlspecialchars($input['typeOfBien']) . '</p>
        <p><strong>Monto:</strong> ' . htmlspecialchars($claimedAmountStr) . '</p>
        <p><strong>Descripcion:</strong> ' . htmlspecialchars($input['descriptionBien']) . '</p>
        <h3>3. Detalle de la Reclamacion</h3>
        <p><strong>Accion:</strong> ' . htmlspecialchars($input['typeOfAccion']) . '</p>
        <p><strong>Detalle:</strong> ' . htmlspecialchars($input['details']) . '</p>
        <p><strong>Pedido Concreto:</strong> ' . htmlspecialchars($input['consumerPedido']) . '</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Este es un correo automatico enviado conforme a las normativas de Indecopi por Matt Innova Solution.</p>
    </div>';

    $mail->send();

    echo json_encode(["status" => "success", "message" => "Reclamacion registrada exitosamente", "ticket" => $ticketNumber], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error al procesar la entrega: {$mail->ErrorInfo}"], JSON_UNESCAPED_UNICODE);
}
exit();