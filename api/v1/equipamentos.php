<?php
/**
 * API - Gerenciamento de Equipamentos
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar equipamentos
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM equipamentos WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch();
        } else {
            $stmt = $pdo->query("SELECT * FROM equipamentos ORDER BY nome");
            $result = $stmt->fetchAll();
        }
        echo json_encode($result);
        break;

    case 'POST':
        // Criar novo equipamento
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['nome']) && isset($data['valor_diaria'])) {
            $stmt = $pdo->prepare("INSERT INTO equipamentos (nome, descricao, valor_diaria, estoque_total, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['nome'],
                $data['descricao'] ?? null,
                $data['valor_diaria'],
                $data['estoque_total'] ?? 0,
                $data['status'] ?? 'Disponível'
            ]);
            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Nome e Valor da Diária são obrigatórios"]);
        }
        break;

    case 'PUT':
        // Atualizar equipamento
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id']) && !empty($data['nome'])) {
            $stmt = $pdo->prepare("UPDATE equipamentos SET nome = ?, descricao = ?, valor_diaria = ?, estoque_total = ?, status = ? WHERE id = ?");
            $stmt->execute([
                $data['nome'],
                $data['descricao'] ?? null,
                $data['valor_diaria'],
                $data['estoque_total'] ?? 0,
                $data['status'] ?? 'Disponível',
                $data['id']
            ]);
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID e Nome são obrigatórios"]);
        }
        break;

    case 'DELETE':
        // Remover equipamento
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM equipamentos WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID é obrigatório"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
        break;
}
