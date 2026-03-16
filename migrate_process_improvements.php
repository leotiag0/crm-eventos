<?php
require_once 'api/config/database.php';

try {
    // A conexão PDO já está disponível em $pdo via require_once
    $db = $pdo;

    echo "Iniciando migração para melhorias de processos...\n";

    // 1. Tabela de Orçamentos - Validade da Proposta
    $db->exec("ALTER TABLE orcamentos 
        ADD COLUMN IF NOT EXISTS validade_proposta DATE AFTER valor_total;");
    echo "Campo 'validade_proposta' adicionado na tabela 'orcamentos'.\n";

    // 2. Tabela de Histórico de Orçamentos
    $db->exec("CREATE TABLE IF NOT EXISTS orcamento_historico (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orcamento_id INT NOT NULL,
        status_anterior VARCHAR(50),
        status_novo VARCHAR(50) NOT NULL,
        data_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_id INT,
        observacao TEXT,
        FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;");
    echo "Tabela 'orcamento_historico' criada.\n";

    // 3. Tabela de Movimentações de Logística
    $db->exec("CREATE TABLE IF NOT EXISTS movimentacoes_logistica (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orcamento_id INT NOT NULL,
        equipamento_id INT NOT NULL,
        tipo ENUM('SAIDA', 'ENTRADA') NOT NULL,
        quantidade INT NOT NULL,
        data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_id INT,
        FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE,
        FOREIGN KEY (equipamento_id) REFERENCES equipamentos (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;");
    echo "Tabela 'movimentacoes_logistica' criada.\n";

    // 4. Índices para performance
    $db->exec("CREATE INDEX IF NOT EXISTS idx_hist_orc ON orcamento_historico(orcamento_id);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_mov_orc ON movimentacoes_logistica(orcamento_id);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_mov_equip ON movimentacoes_logistica(equipamento_id);");

    echo "Migração de processos concluída com sucesso!\n";

} catch (PDOException $e) {
    echo "ERRO NA MIGRAÇÃO: " . $e->getMessage() . "\n";
}
