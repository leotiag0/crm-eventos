<?php
/**
 * API - Gerenciamento de Usuários e Permissões
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

session_start();

// Proteção básica: admin
if (!isset($_SESSION['user']) || $_SESSION['user']['papel_slug'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Acesso negado"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT u.id, u.nome, u.email, u.papel_id, u.created_at, p.nome as papel_nome, p.slug as papel_slug
            FROM usuarios u
            LEFT JOIN papeis p ON u.papel_id = p.id
        ");
        echo json_encode($stmt->fetchAll());
    } elseif ($action === 'papeis') {
        $stmt = $pdo->query("SELECT * FROM papeis");
        echo json_encode($stmt->fetchAll());
    } elseif ($action === 'permissoes') {
        $papel_id = $_GET['papel_id'] ?? null;
        if (!$papel_id) {
            http_response_code(400);
            echo json_encode(["error" => "ID do papel é obrigatório"]);
            exit;
        }
        $stmt = $pdo->prepare("SELECT modulo, pode_acessar FROM permissoes WHERE papel_id = ?");
        $stmt->execute([$papel_id]);
        echo json_encode($stmt->fetchAll());
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
            echo json_encode(["message" => "Usuário atualizado com sucesso"]);
        } else {
            // Create
            if (!$senha) {
                http_response_code(400);
                echo json_encode(["error" => "Senha é obrigatória para novos usuários"]);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, papel_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT), $papel_id]);
            echo json_encode(["message" => "Usuário criado com sucesso", "id" => $pdo->lastInsertId()]);
        }
    } elseif ($action === 'update_permissoes') {
        $papel_id = $data['papel_id'] ?? null;
        $permissoes = $data['permissoes'] ?? []; // Array de ['modulo' => '...', 'pode_acessar' => 1/0]

        if (!$papel_id) {
            http_response_code(400);
            echo json_encode(["error" => "Papel ID é obrigatório"]);
            exit;
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
            echo json_encode(["message" => "Permissões atualizadas com sucesso"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["message" => "Usuário excluído com sucesso"]);
    }
}
