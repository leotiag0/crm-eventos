<?php
/**
 * Script de Teste: Validação das Melhorias Processuais (DEBUG MODE)
 */

// Mock globais para CLI
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

// Definir sessão fake
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION['user'] = ['id' => 1, 'nome' => 'Admin Teste'];

require_once 'api/config/database.php';

if (!function_exists('sendError')) {
    function sendError($m)
    {
        echo "[ERRO API] $m\n";
    }
}
if (!function_exists('sendSuccess')) {
    function sendSuccess($m)
    {
        echo "[OK API] $m\n";
    }
}
if (!function_exists('getDbConnection')) {
    function getDbConnection()
    {
        global $pdo;
        return $pdo;
    }
}

require_once 'api/services/OrcamentoService.php';
require_once 'api/services/LogisticaService.php';

$orcamentoService = new OrcamentoService($pdo);

try {
    echo "1. Testando Unicidade de CPF/CNPJ...\n";
    $testCpf = "12345678901";
    $stmt = $pdo->prepare("DELETE FROM clientes WHERE cpf_cnpj = ?");
    $stmt->execute([$testCpf]);
    $stmt = $pdo->prepare("INSERT INTO clientes (nome, cpf_cnpj) VALUES ('Teste 1', ?)");
    $stmt->execute([$testCpf]);
    echo "   - Cliente 1 criado.\n";

    echo "\n2. Testando Histórico de Orçamentos...\n";
    $data = [
        'cliente_id' => 1,
        'data_inicio' => date('Y-m-d H:i:s'),
        'data_fim' => date('Y-m-d H:i:s', strtotime('+1 day')),
        'valor_total' => 1000,
        'validade_proposta' => date('Y-m-d', strtotime('+7 days')),
        'itens' => [
            ['equipamento_id' => 1, 'quantidade' => 1, 'valor_unitario' => 1000]
        ]
    ];

    echo "   - Chamando process()...\n";
    $id = $orcamentoService->process($data);
    echo "   - Orçamento #$id criado.\n";

} catch (Throwable $e) {
    echo "\n!!! ERRO CAPTURADO !!!\n";
    echo "Mensagem: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . "\n";
    echo "Linha: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nFim do teste de debug.\n";