<?php
/**
 * API - Autenticação
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/middleware.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $action = $_GET['action'] ?? 'login';

    if ($action === 'login') {
        $email = $data['email'] ?? '';
        $senha = $data['senha'] ?? '';

        if (empty($email) || empty($senha)) {
            http_response_code(400);
            echo json_encode(["error" => "E-mail e senha são obrigatórios"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                SELECT u.*, p.slug as papel_slug, p.nome as papel_nome 
                FROM usuarios u 
                JOIN papeis p ON u.papel_id = p.id 
                WHERE u.email = ?
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($senha, $user['senha'])) {
                // Sucesso
                unset($user['senha']); // Remover hash da senha

                // Buscar permissões
                $stmtPerms = $pdo->prepare("SELECT modulo FROM permissoes WHERE papel_id = ? AND pode_acessar = 1");
                $stmtPerms->execute([$user['papel_id']]);
                $permissions = $stmtPerms->fetchAll(PDO::FETCH_COLUMN);

                $user['permissoes'] = $permissions;
                session_regenerate_id(true); // Prevenção contra fixação de sessão
                $_SESSION['user'] = $user;

                echo json_encode([
                    "message" => "Login realizado com sucesso",
                    "user" => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Credenciais inválidas. Verifique seu e-mail e senha."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            $errorMsg = "Erro no banco de dados ao tentar realizar login.";
            if (Env::get('APP_DEBUG')) {
                $errorMsg .= " Detalhes: " . $e->getMessage();
            }
            echo json_encode(["error" => $errorMsg]);
            error_log("Erro de login (DB): " . $e->getMessage());
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Ocorreu um erro inesperado ao realizar login."]);
            error_log("Erro inesperado de login: " . $e->getMessage());
        }
    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(["message" => "Logout realizado com sucesso"]);
    }
} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? 'check';

    if ($action === 'check') {
        if (isset($_SESSION['user'])) {
            echo json_encode(["user" => $_SESSION['user']]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Não autenticado"]);
        }
    }
}
