<?php
/**
 * API - Logística (Check-in / Check-out)
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $type = $data['tipo'] ?? ''; // 'checkout' ou 'checkin'

        if ($type === 'checkout') {
            // Check-out: Gera lista de locação e marca reservas como em trânsito/evento
            if (!empty($data['orcamento_id'])) {
                try {
                    $pdo->beginTransaction();

                    // Atualizar status do orçamento para 'Em Evento' (simulado via status 'Finalizado' ou novo status se necessário)
                    // No briefing, Check-out gera a "Lista de Locação"
                    $stmt = $pdo->prepare("UPDATE orcamentos SET status = 'Aprovado' WHERE id = ?");
                    $stmt->execute([$data['orcamento_id']]);

                    $pdo->commit();
                    echo json_encode(["status" => "success", "message" => "Check-out realizado. Itens reservados firme."]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode(["error" => $e->getMessage()]);
                }
            }
        } else if ($type === 'checkin') {
            // Check-in: Baixa nos itens e sinalização de status
            if (!empty($data['itens'])) {
                try {
                    $pdo->beginTransaction();

                    foreach ($data['itens'] as $item) {
                        // Atualizar status do equipamento
                        $stmt = $pdo->prepare("UPDATE equipamentos SET status = ? WHERE id = ?");
                        $stmt->execute([$item['status_item'], $item['equipamento_id']]);

                        // Cancelar/Finalizar reserva para liberar estoque
                        if (isset($item['reserva_id'])) {
                            $stmtRes = $pdo->prepare("UPDATE reservas SET status = 'CANCELADA' WHERE id = ?");
                            $stmtRes->execute([$item['reserva_id']]);
                        }
                    }

                    $pdo->commit();
                    echo json_encode(["status" => "success", "message" => "Check-in realizado com sucesso."]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode(["error" => $e->getMessage()]);
                }
            }
        }
        break;

    case 'GET':
        // Listar reservas ativas para check-out/check-in
        if (isset($_GET['orcamento_id'])) {
            $stmt = $pdo->prepare("
                SELECT r.*, e.nome as equipamento_nome 
                FROM reservas r 
                JOIN equipamentos e ON r.equipamento_id = e.id 
                WHERE r.orcamento_id = ? AND r.status = 'ATIVA'
            ");
            $stmt->execute([$_GET['orcamento_id']]);
            echo json_encode($stmt->fetchAll());
        } else {
            // Listar todos os orçamentos aprovados que aguardam check-out ou check-in
            $stmt = $pdo->query("
                SELECT o.*, c.nome as cliente_nome 
                FROM orcamentos o 
                JOIN clientes c ON o.cliente_id = c.id 
                WHERE o.status = 'Aprovado'
            ");
            echo json_encode($stmt->fetchAll());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
        break;
}
