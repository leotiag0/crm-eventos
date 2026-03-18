<?php
/**
 * Script de diagnóstico SIMPLIFICADO E ROBUSTO
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico Definitivo Hostinger ---\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";

require_once __DIR__ . '/config/env.php';

echo "\n--- Localizando .env ---\n";
$root = $_SERVER['DOCUMENT_ROOT'];
$curDir = __DIR__;
$paths = [
    $root . '/.env',
    dirname($root) . '/.env',
    dirname($curDir, 1) . '/.env',
    dirname($curDir, 2) . '/.env',
    $curDir . '/../.env'
];

foreach ($paths as $p) {
    if (file_exists($p)) {
        $status = is_readable($p) ? "OK (Lindo)" : "FALHA (Sem permissão de leitura)";
        echo "TESTANDO: $p -> $status\n";
        if (Env::load($p)) {
            echo "CARREGADO COM SUCESSO!\n";
        }
    } else {
        echo "NÃO EXISTE: $p\n";
    }
}

echo "Arquivo .env efetivamente usado: " . (Env::getLoadedPath() ?: "NENHUM") . "\n";

echo "\n--- Configurações Ativas ---\n";
echo "DB_USER: " . Env::get('DB_USER') . "\n";
echo "DB_NAME: " . Env::get('DB_NAME') . "\n";
echo "DB_HOST: " . Env::get('DB_HOST') . "\n";

echo "\n--- Ambiente PHP ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "PDO MySQL: " . (extension_loaded('pdo_mysql') ? "OK" : "FALHA") . "\n";
echo "Session Status: " . (session_status() == PHP_SESSION_ACTIVE ? "Ativa" : "Inativa") . "\n";

echo "\n--- Testando database.php (Integração Real) ---\n";
try {
    // Capturar output do database.php se ele der die ou echo
    ob_start();
    require __DIR__ . '/config/database.php';
    $output = ob_get_clean();

    if (isset($pdo)) {
        echo "PDO: CONECTADO COM SUCESSO!\n";
        $stmt = $pdo->query("SELECT 1");
        if ($stmt) {
            echo "QUERY TESTE: SUCESSO!\n";
        }
    } else {
        echo "PDO: NÃO DEFINIDO (Verifique o arquivo database.php)\n";
        echo "Output capturado: " . $output . "\n";
    }
} catch (Exception $e) {
    echo "ERRO CAPTURADO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim ---\n";
