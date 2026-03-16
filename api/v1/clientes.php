<?php
/**
 * API - Gerenciamento de Clientes
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar clientes (ou um específico se ID for passado)
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch();
        } else {
            $stmt = $pdo->query("SELECT * FROM clientes ORDER BY nome");
            $result = $stmt->fetchAll();
        }
        echo json_encode($result);
        break;

    case 'POST':
        // Criar novo cliente
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['nome'])) {
            $stmt = $pdo->prepare("INSERT INTO clientes (nome, email, telefone, cpf_cnpj, cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['nome'],
                $data['email'] ?? null,
                $data['telefone'] ?? null,
                $data['cpf_cnpj'] ?? null,
                $data['cep'] ?? null,
                $data['logradouro'] ?? null,
                $data['numero'] ?? null,
                $data['complemento'] ?? null,
                $data['bairro'] ?? null,
                $data['cidade'] ?? null,
                $data['uf'] ?? null
            ]);
            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Nome é obrigatório"]);
        }
        break;

    case 'PUT':
        // Atualizar cliente
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id']) && !empty($data['nome'])) {
            $stmt = $pdo->prepare("UPDATE clientes SET nome = ?, email = ?, telefone = ?, cpf_cnpj = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ? WHERE id = ?");
            $stmt->execute([
                $data['nome'],
                $data['email'] ?? null,
                $data['telefone'] ?? null,
                $data['cpf_cnpj'] ?? null,
                $data['cep'] ?? null,
                $data['logradouro'] ?? null,
                $data['numero'] ?? null,
                $data['complemento'] ?? null,
                $data['bairro'] ?? null,
                $data['cidade'] ?? null,
                $data['uf'] ?? null,
                $data['id']
            ]);
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID e Nome são obrigatórios"]);
        }
        break;

    case 'DELETE':
        // Remover cliente
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM clientes WHERE id = ?");
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
