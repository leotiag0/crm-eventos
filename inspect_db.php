<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    $stmt = $pdo->query("DESCRIBE equipamentos");
    $columns = $stmt->fetchAll();
    echo json_encode(array_column($columns, 'Field'));
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
