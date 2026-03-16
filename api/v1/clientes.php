<?php
/**
 * API - Gerenciamento de Clientes
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
require_once '../config/middleware.php';

checkAuth(); // Proteção global via middleware

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch();
        } else {
            $stmt = $pdo->query("SELECT * FROM clientes ORDER BY nome");
            $result = $stmt->fetchAll();
        }
        sendJson($result);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['nome'])) {
            // Sanitização de CPF/CNPJ (remover tudo que não for dígito)
            $documento = isset($data['cpf_cnpj']) ? preg_replace('/\D/', '', $data['cpf_cnpj']) : null;

            if ($documento) {
                // Verificar unicidade
                $stmtCheck = $pdo->prepare("SELECT id FROM clientes WHERE cpf_cnpj = ?");
                $stmtCheck->execute([$documento]);
                if ($stmtCheck->fetch()) {
                    sendError("CPF/CNPJ já cadastrado para outro cliente");
                }
            }

            $stmt = $pdo->prepare("INSERT INTO clientes (nome, email, telefone, cpf_cnpj, cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['nome'],
                $data['email'] ?? null,
                $data['telefone'] ?? null,
                $documento,
                $data['cep'] ?? null,
                $data['logradouro'] ?? null,
                $data['numero'] ?? null,
                $data['complemento'] ?? null,
                $data['bairro'] ?? null,
                $data['cidade'] ?? null,
                $data['uf'] ?? null
            ]);
            sendSuccess("Cliente criado com sucesso", ["id" => $pdo->lastInsertId()]);
        } else {
            sendError("Nome é obrigatório");
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id']) && !empty($data['nome'])) {
            // Sanitização de CPF/CNPJ
            $documento = isset($data['cpf_cnpj']) ? preg_replace('/\D/', '', $data['cpf_cnpj']) : null;

            if ($documento) {
                // Verificar unicidade (ignorando o próprio ID)
                $stmtCheck = $pdo->prepare("SELECT id FROM clientes WHERE cpf_cnpj = ? AND id <> ?");
                $stmtCheck->execute([$documento, $data['id']]);
                if ($stmtCheck->fetch()) {
                    sendError("CPF/CNPJ já cadastrado para outro cliente");
                }
            }

            $stmt = $pdo->prepare("UPDATE clientes SET nome = ?, email = ?, telefone = ?, cpf_cnpj = ?, cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ? WHERE id = ?");
            $stmt->execute([
                $data['nome'],
                $data['email'] ?? null,
                $data['telefone'] ?? null,
                $documento,
                $data['cep'] ?? null,
                $data['logradouro'] ?? null,
                $data['numero'] ?? null,
                $data['complemento'] ?? null,
                $data['bairro'] ?? null,
                $data['cidade'] ?? null,
                $data['uf'] ?? null,
                $data['id']
            ]);
            sendSuccess("Cliente atualizado com sucesso");
        } else {
            sendError("ID e Nome são obrigatórios");
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("DELETE FROM clientes WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendSuccess("Cliente removido com sucesso");
        } else {
            sendError("ID é obrigatório");
        }
        break;

    default:
        sendError("Método não permitido", 405);
        break;
}
