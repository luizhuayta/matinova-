<?php
declare(strict_types=1);

http_response_code(410);
header('Content-Type: application/json; charset=UTF-8');
echo json_encode(['message' => 'Este script ya no se usa. Envía el formulario a POST /api/reclamaciones.'], JSON_UNESCAPED_UNICODE);
