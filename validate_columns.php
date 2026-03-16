<?php
require_once 'api/config/database.php';

$tables_to_check = [
    'clientes' => ['id', 'nome', 'email', 'telefone', 'cpf_cnpj', 'endereco', 'created_at'],
    'equipamentos' => ['id', 'nome', 'descricao', 'valor_diaria', 'estoque_total', 'status', 'created_at'],
    'orcamentos' => ['id', 'cliente_id', 'data_inicio', 'data_fim', 'valor_total', 'tipo_cobranca', 'status', 'created_at'],
    'itens_orcamento' => ['id', 'orcamento_id', 'equipamento_id', 'quantidade', 'valor_unitario_snapshot', 'descricao_snapshot', 'secao'],
    'reservas' => ['id', 'orcamento_id', 'equipamento_id', 'qtd', 'inicio', 'fim', 'status', 'created_at']
];

foreach ($tables_to_check as $table => $expected_columns) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = array_column($stmt->fetchAll(), 'Field');
        $missing = array_diff($expected_columns, $columns);

        if (!empty($missing)) {
            echo "Table $table is missing columns: " . implode(', ', $missing) . PHP_EOL;
        } else {
            echo "Table $table is COMPLETE." . PHP_EOL;
        }
    } catch (Exception $e) {
        echo "Error checking $table: " . $e->getMessage() . PHP_EOL;
    }
}
