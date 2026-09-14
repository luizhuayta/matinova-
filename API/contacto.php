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

if (!isset($input['email']) || !isset($input['name']) || !isset($input['subject'])) {
    http_response_code(400);
    echo json_encode(["message" => "Datos incompletos"], JSON_UNESCAPED_UNICODE);
    exit();
}

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

    $mail->setFrom('notificaciones@mattinnovasolution.com', 'Web Matt Innova');
    
    $mail->addAddress('contacto@mattinnovasolution.com', 'MattInnovaSolution'); 
    $mail->addAddress($input['email'], $input['name']);

    $mail->isHTML(true);
    $mail->Subject = 'Contacto Web: ' . $input['subject'];
    
    $mail->Body    = '
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #00aaff; text-align: center;">Nuevo Mensaje de Contacto</h2>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Nombre del interesado:</strong> ' . htmlspecialchars($input['name']) . '</p>
        <p><strong>Correo de contacto:</strong> ' . htmlspecialchars($input['email']) . '</p>
        <p><strong>Asunto:</strong> ' . htmlspecialchars($input['subject']) . '</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>Mensaje:</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #00aaff;">
            ' . nl2br(htmlspecialchars($input['message'])) . '
        </p>
    </div>';

    $mail->send();

    echo json_encode(["status" => "success", "message" => "Mensaje de contacto enviado correctamente"], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error al entregar el mensaje: {$mail->ErrorInfo}"], JSON_UNESCAPED_UNICODE);
}
exit();