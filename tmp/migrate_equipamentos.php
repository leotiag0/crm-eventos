<?php
require_once __DIR__ . '/../api/config/database.php';

try {
    $sql = "ALTER TABLE equipamentos 
            ADD COLUMN estoque_disponivel INT NOT NULL DEFAULT 0 AFTER estoque_total,
            ADD COLUMN estoque_manutencao INT NOT NULL DEFAULT 0 AFTER estoque_disponivel,
            ADD COLUMN estoque_defeito INT NOT NULL DEFAULT 0 AFTER estoque_manutencao";
    
    $pdo->exec($sql);
    echo "Colunas adicionadas com sucesso.\n";

    // Migrar dados atuais
    $pdo->exec("UPDATE equipamentos SET estoque_disponivel = estoque_total WHERE status = 'Disponível'");
    $pdo->exec("UPDATE equipamentos SET estoque_manutencao = estoque_total WHERE status = 'Necessita Manutenção Preventiva'");
    $pdo->exec("UPDATE equipamentos SET estoque_defeito = estoque_total WHERE status = 'Defeito Técnico'");
    echo "Dados migrados com sucesso.\n";

} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "As colunas já existem.\n";
    } else {
        echo "Erro: " . $e->getMessage() . "\n";
    }
}
