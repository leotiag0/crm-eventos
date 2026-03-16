<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $full_schema = [];
    foreach ($tables as $table) {
        $stmt = $pdo->query("DESCRIBE $table");
        $full_schema[$table] = $stmt->fetchAll();
    }
    echo json_encode($full_schema);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
