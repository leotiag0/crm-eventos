<?php
/**
 * API - Gerenciamento de Orçamentos
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
require_once '../config/middleware.php';
require_once '../services/OrcamentoService.php';

$method = $_SERVER['REQUEST_METHOD'];
$service = new OrcamentoService($pdo);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $result = $service->getById($_GET['id']);
        } else {
            $result = $service->listAll();
        }
        sendJson($result);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        try {
            $orcamentoId = $service->process($data);
            sendSuccess("Orçamento processado com sucesso", ["id" => $orcamentoId]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 400);
        }
        break;

    default:
        sendError("Método não permitido", 405);
        break;
}
