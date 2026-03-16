<?php
/**
 * API - Gerenciamento de Usuários e Permissões
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
require_once '../config/middleware.php';

// Proteção centralizada via middleware
checkRole('admin');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT u.id, u.nome, u.email, u.papel_id, u.created_at, p.nome as papel_nome, p.slug as papel_slug
            FROM usuarios u
            LEFT JOIN papeis p ON u.papel_id = p.id
        ");
        sendJson($stmt->fetchAll());
    } elseif ($action === 'papeis') {
        $stmt = $pdo->query("SELECT * FROM papeis");
        sendJson($stmt->fetchAll());
    } elseif ($action === 'permissoes') {
        $papel_id = $_GET['papel_id'] ?? null;
        if (!$papel_id) {
            sendError("ID do papel é obrigatório");
        }
        $stmt = $pdo->prepare("SELECT modulo, pode_acessar FROM permissoes WHERE papel_id = ?");
        $stmt->execute([$papel_id]);
        sendJson($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $_GET['action'] ?? 'save';

    if ($action === 'save') {
        $id = $data['id'] ?? null;
        $nome = $data['nome'] ?? '';
        $email = $data['email'] ?? '';
        $senha = $data['senha'] ?? null;
        $papel_id = $data['papel_id'] ?? null;

        if ($id) {
            // Update
            $sql = "UPDATE usuarios SET nome = ?, email = ?, papel_id = ? WHERE id = ?";
            $params = [$nome, $email, $papel_id, $id];

            if ($senha) {
                $sql = "UPDATE usuarios SET nome = ?, email = ?, papel_id = ?, senha = ? WHERE id = ?";
                $params = [$nome, $email, $papel_id, password_hash($senha, PASSWORD_DEFAULT), $id];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            sendSuccess("Usuário atualizado com sucesso");
        } else {
            // Create
            if (!$senha) {
                sendError("Senha é obrigatória para novos usuários");
            }
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, papel_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $papel_id]);
            sendSuccess("Usuário criado com sucesso", ["id" => $pdo->lastInsertId()]);
        }
    } elseif ($action === 'update_permissoes') {
        $papel_id = $data['papel_id'] ?? null;
        $permissoes = $data['permissoes'] ?? [];

        if (!$papel_id) {
            sendError("Papel ID é obrigatório");
        }

        $pdo->beginTransaction();
        try {
            foreach ($permissoes as $perm) {
                $stmt = $pdo->prepare("
                    UPDATE permissoes SET pode_acessar = ? 
                    WHERE papel_id = ? AND modulo = ?
                ");
                $stmt->execute([$perm['pode_acessar'], $papel_id, $perm['modulo']]);
            }
            $pdo->commit();
            sendSuccess("Permissões atualizadas com sucesso");
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        sendSuccess("Usuário excluído com sucesso");
    } else {
        sendError("ID é obrigatório");
    }
}
