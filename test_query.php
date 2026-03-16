<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    $stmt = $pdo->query("
        SELECT id, nome, status, descricao
        FROM equipamentos
        WHERE status != 'Disponível'
    ");
    echo json_encode($stmt->fetchAll());
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
