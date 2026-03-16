<?php
/**
 * API - Configurações do Sistema
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

session_start();

// Proteção básica: apenas admin pode acessar
if (!isset($_SESSION['user']) || $_SESSION['user']['papel_slug'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Acesso negado"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM configuracoes WHERE id = 1");
    $config = $stmt->fetch();
    echo json_encode($config ?: []);
} elseif ($method === 'POST') {
    // 1. Verificar se é upload de arquivo
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['logo'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

        if (!in_array($file['type'], $allowed)) {
            http_response_code(400);
            echo json_encode(["error" => "Formato de arquivo não permitido"]);
            exit;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'logo_' . time() . '.' . $ext;
        $uploadDir = '../uploads/logos/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Caminho público (considerando que o server root é a raiz do projeto)
            $publicPath = '/api/uploads/logos/' . $filename;

            $stmt = $pdo->prepare("UPDATE configuracoes SET logo_path = ? WHERE id = 1");
            $stmt->execute([$publicPath]);

            echo json_encode(["status" => "success", "logo_path" => $publicPath, "message" => "Logo atualizada com sucesso"]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Falha ao mover arquivo"]);
            exit;
        }
    }

    // 2. Senão, processar como JSON normal
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        // Se não for JSON, pode ser POST convencional (FormData sem arquivo)
        $data = $_POST;
    }

    // Preparar campos para atualização
    $fields = [
        'nome_empresa',
        'razao_social',
        'cnpj',
        'logo_path',
        'cor_primaria',
        'cor_secundaria',
        'endereco',
        'telefone',
        'email_contato',
        'site'
    ];

    $sets = [];
    $params = [];
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $sets[] = "$field = ?";
            $params[] = $data[$field];
        }
    }

    if (empty($sets)) {
        http_response_code(400);
        echo json_encode(["error" => "Nenhum dado fornecido para atualização"]);
        exit;
    }

    try {
        $sql = "UPDATE configuracoes SET " . implode(", ", $sets) . " WHERE id = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(["message" => "Configurações atualizadas com sucesso"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
