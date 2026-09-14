<?php
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$url = isset($_GET['url']) ? trim(rtrim($_GET['url'], '/')) : '';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Metodo no permitido"], JSON_UNESCAPED_UNICODE);
    exit();
}

switch ($url) {
    case 'contacto':
        if (file_exists(__DIR__ . '/contacto.php')) {
            include(__DIR__ . '/contacto.php');
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Archivo contacto.php no encontrado"]);
        }
        break;

    case 'reclamaciones':
        if (file_exists(__DIR__ . '/reclamaciones.php')) {
            include(__DIR__ . '/reclamaciones.php');
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Archivo reclamaciones.php no encontrado"]);
        }
        break;

    case 'bot':
        if (file_exists(__DIR__ . '/chatbot.php')) {
            require __DIR__ . '/chatbot.php';
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Archivo chatbot.php no encontrado"]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["message" => "Ruta no encontrada"], JSON_UNESCAPED_UNICODE);
        break;
}

exit();