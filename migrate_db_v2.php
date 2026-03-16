<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    // Adicionando tipo_cobranca em orcamentos
    $pdo->exec("ALTER TABLE orcamentos ADD COLUMN tipo_cobranca ENUM('DIARIA', 'EVENTO') DEFAULT 'DIARIA' AFTER valor_total");

    // Adicionando colunas de snapshot e secao em itens_orcamento
    $pdo->exec("ALTER TABLE itens_orcamento ADD COLUMN valor_unitario_snapshot DECIMAL(10, 2) NOT NULL AFTER quantidade");
    $pdo->exec("ALTER TABLE itens_orcamento ADD COLUMN descricao_snapshot TEXT AFTER valor_unitario_snapshot");
    $pdo->exec("ALTER TABLE itens_orcamento ADD COLUMN secao VARCHAR(100) DEFAULT 'Geral' AFTER descricao_snapshot");

    echo json_encode(["status" => "success", "message" => "Banco de dados atualizado com sucesso."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
