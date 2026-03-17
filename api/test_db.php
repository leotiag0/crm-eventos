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
$paths = [
    $root . '/.env',
    dirname($root) . '/.env',
    dirname(__DIR__, 2) . '/.env'
];

foreach ($paths as $p) {
    if (file_exists($p)) {
        echo "ENCONTRADO: $p\n";
        Env::load($p);
    }
}

echo "\n--- Configurações Ativas ---\n";
echo "DB_USER: " . Env::get('DB_USER') . "\n";
echo "DB_NAME: " . Env::get('DB_NAME') . "\n";
echo "DB_HOST: " . Env::get('DB_HOST') . "\n";

echo "\n--- Testando database.php (Integração Real) ---\n";
try {
    require __DIR__ . '/config/database.php';
    if (isset($pdo)) {
        echo "PDO: SUCESSO!\n";
        $pdo->query("SELECT 1");
        echo "QUERY: SUCESSO!\n";
    }
} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim ---\n";
