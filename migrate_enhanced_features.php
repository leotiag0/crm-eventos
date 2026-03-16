require_once 'api/config/database.php';

try {
    // A conexão PDO já está disponível em $pdo via require_once
    $db = $pdo;

    echo "Iniciando migração de novos campos...\n";

    // 1. Atualizar Clientes (Campos de Endereço Granulares)
    $db->exec("ALTER TABLE clientes 
        ADD COLUMN IF NOT EXISTS cep VARCHAR(10) AFTER cpf_cnpj,
        ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255) AFTER cep,
        ADD COLUMN IF NOT EXISTS numero VARCHAR(20) AFTER logradouro,
        ADD COLUMN IF NOT EXISTS complemento VARCHAR(100) AFTER numero,
        ADD COLUMN IF NOT EXISTS bairro VARCHAR(100) AFTER complemento,
        ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) AFTER bairro,
        ADD COLUMN IF NOT EXISTS uf VARCHAR(2) AFTER cidade;");
    echo "Tabela 'clientes' atualizada.\n";

    // 2. Atualizar Equipamentos (Campos de Controle Interno)
    $db->exec("ALTER TABLE equipamentos 
        ADD COLUMN IF NOT EXISTS fabricante VARCHAR(100) AFTER estoque_total,
        ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100) AFTER fabricante;");
    echo "Tabela 'equipamentos' atualizada.\n";

    // 3. Atualizar Orçamentos (Dados do Evento e Numeração)
    $db->exec("ALTER TABLE orcamentos 
        ADD COLUMN IF NOT EXISTS nome_evento VARCHAR(255) AFTER tipo_cobranca,
        ADD COLUMN IF NOT EXISTS endereco_evento TEXT AFTER nome_evento,
        ADD COLUMN IF NOT EXISTS numero_sequencial INT AFTER endereco_evento;");

    // Adicionar índice para busca rápida de numeração se necessário
    $db->exec("CREATE INDEX IF NOT EXISTS idx_numero_sequencial ON orcamentos(numero_sequencial);");
    echo "Tabela 'orcamentos' atualizada.\n";

    echo "Migração concluída com sucesso!\n";

} catch (PDOException $e) {
    echo "ERRO NA MIGRAÇÃO: " . $e->getMessage() . "\n";
}
