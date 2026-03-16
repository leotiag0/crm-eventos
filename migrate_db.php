<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    $sql = "ALTER TABLE equipamentos 
            ADD COLUMN status ENUM(
                'Disponível',
                'Necessita Manutenção Preventiva',
                'Defeito Técnico'
            ) DEFAULT 'Disponível' AFTER estoque_total";

    $pdo->exec($sql);
    echo json_encode(["status" => "success", "message" => "Coluna 'status' adicionada com sucesso."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
