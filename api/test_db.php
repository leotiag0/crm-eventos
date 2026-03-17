<?php
/**
 * Script de diagnóstico para verificar Header Injection
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Verificação de Headers de Ambiente ---\n";
echo "PHP Version: " . phpversion() . "\n";

$envVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_CHARSET', 'API_URL', 'APP_ENV'];

echo "\n--- Buscando Headers (X-App-*) ---\n";
foreach ($envVars as $v) {
    $headerKey = 'HTTP_X_APP_' . str_replace('-', '_', strtoupper($v));
    $val = isset($_SERVER[$headerKey]) ? "VALOR PRESENTE" : "NÃO ENCONTRADO";
    echo "Header $headerKey: $val\n";
}

echo "\n--- Testando Env::get (com fallback para headers) ---\n";
require_once __DIR__ . '/config/env.php';
foreach ($envVars as $v) {
    $val = Env::get($v);
    echo "Env::get('$v'): " . ($val !== null ? "DEFINIDO" : "NULL") . "\n";
}

echo "\n--- Testando Conexão com Fallback ---\n";
try {
    require __DIR__ . '/config/database.php';
    if (isset($pdo)) {
        echo "CONEXÃO PDO INICIALIZADA COM SUCESSO!\n";
    }
} catch (Exception $e) {
    echo "ERRO AO INICIALIZAR PDO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim do Diagnóstico ---\n";
