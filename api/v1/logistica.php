<?php
/**
 * API - Logística (Check-in / Check-out)
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
require_once '../config/middleware.php';
require_once '../services/LogisticaService.php';

$method = $_SERVER['REQUEST_METHOD'];
$service = new LogisticaService($pdo);

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $type = $data['tipo'] ?? ''; // 'checkout' ou 'checkin'

        try {
            if ($type === 'checkout') {
                $message = $service->checkout($data);
                sendSuccess($message);
            } else if ($type === 'checkin') {
                $message = $service->checkin($data);
                sendSuccess($message);
            } else if ($type === 'finalize') {
                $message = $service->finalizeEvent($data);
                sendSuccess($message);
            } else {
                sendError("Tipo de operação inválida", 400);
            }
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    case 'GET':
        if (isset($_GET['orcamento_id'])) {
            $result = $service->listReservasByOrcamento($_GET['orcamento_id']);
            sendJson($result);
        } else {
            $result = $service->listAwaiting();
            sendJson($result);
        }
        break;

    default:
        http_response_code(405);
        sendError("Método não permitido", 405);
        break;
}
