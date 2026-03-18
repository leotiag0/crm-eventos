<?php
/**
 * API - Configurações do Sistema
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/middleware.php';
require_once __DIR__ . '/../services/ConfigService.php';

$method = $_SERVER['REQUEST_METHOD'];
$service = new ConfigService($pdo);

switch ($method) {
    case 'GET':
        sendJson($service->get());
        break;

    case 'POST':
        checkRole('admin');
        try {
            // 1. Verificar upload de arquivo
            if (isset($_FILES['logo'])) {
                $publicPath = $service->updateLogo($_FILES['logo']);
                sendSuccess("Logo atualizada com sucesso", ["logo_path" => $publicPath]);
            }

            // 2. Senão, processar atualização de campos
            $data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
            $service->update($data);
            sendSuccess("Configurações atualizadas com sucesso");
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError("Método não permitido", 405);
        break;
}
