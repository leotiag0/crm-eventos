<?php
/**
 * Script de diagnóstico para Hostinger
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico de Ambiente ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . __DIR__ . "\n";

echo "\n--- Verificando Arquivos ---\n";
$envPath = __DIR__ . '/../.env';
echo ".env existe? " . (file_exists($envPath) ? "SIM" : "NÃO") . "\n";
if (file_exists($envPath)) {
    echo ".env legível? " . (is_readable($envPath) ? "SIM" : "NÃO") . "\n";
}

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/config.php';

echo "\n--- Configurações de Banco de Dados (de config.php) ---\n";
$config = require __DIR__ . '/config/config.php';
echo "Host: " . $config['host'] . "\n";
echo "Database: " . $config['db'] . "\n";
echo "User: " . $config['user'] . "\n";
echo "Charset: " . $config['charset'] . "\n";

echo "\n--- Testando Conexão PDO ---\n";
try {
    $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ];
    $test_pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
    echo "CONEXÃO REALIZADA COM SUCESSO!\n";
} catch (Exception $e) {
    echo "ERRO NA CONEXÃO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim do Diagnóstico ---\n";
