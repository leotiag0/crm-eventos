<?php
/**
 * Script de diagnóstico COMPLETO e RESILIENTE
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico de Ambiente Hostinger ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . __DIR__ . "\n";

require_once __DIR__ . '/config/env.php';

echo "\n--- Verificação de Arquivos ---\n";
$envPathRoot = dirname(__DIR__) . '/.env'; // public_html/.env
$envPathSafe = dirname(dirname(__DIR__)) . '/.env'; // dominio/.env (Fora do deploy)

echo "Tentando .env em (Raiz): $envPathRoot\n";
echo ".env existe? " . (file_exists($envPathRoot) ? "SIM" : "NÃO") . "\n";

echo "Tentando .env em (Seguro/Pai): $envPathSafe\n";
echo ".env existe? " . (file_exists($envPathSafe) ? "SIM" : "NÃO") . "\n";

$envPath = file_exists($envPathSafe) ? $envPathSafe : $envPathRoot;

if (file_exists($envPath)) {
    echo "Lendo .env sem carregar (primeiras 2 linhas para teste de leitura):\n";
    $lines = file($envPath);
    echo "Linha 1: " . (isset($lines[0]) ? substr($lines[0], 0, 10) . "..." : "VAZIA") . "\n";

    echo "Carregando .env...\n";
    Env::load($envPath);
}

echo "\n--- Variáveis de Ambiente (após carregar) ---\n";
$envVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PASSWORD', 'DB_CHARSET', 'API_URL', 'APP_ENV'];
foreach ($envVars as $v) {
    $val = Env::get($v);
    if ($val === null) {
        echo "Env::get('$v'): NULL\n";
    } else {
        // Mostrar primeiros 3 caracteres para confirmar que mudou, mas manter o resto em asteriscos
        $display = substr((string) $val, 0, 3) . str_repeat('*', max(0, strlen((string) $val) - 3));
        echo "Env::get('$v'): $display\n";
    }
}

echo "\n--- Testando Conexão Manual (sem usar database.php para não dar die) ---\n";
try {
    $host = Env::get('DB_HOST', 'localhost');
    $db = Env::get('DB_NAME');
    $user = Env::get('DB_USER');
    $pass = Env::get('DB_PASS') ?? Env::get('DB_PASSWORD');
    $charset = Env::get('DB_CHARSET', 'utf8mb4');

    if (!$db || !$user) {
        throw new Exception("Configurações insuficientes para conectar (DB_NAME ou DB_USER vazios)");
    }

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    echo "DSN: $dsn\n";
    echo "USER: $user\n";

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ];
    $pdo_test = new PDO($dsn, $user, $pass, $options);
    echo "CONEXÃO REALIZADA COM SUCESSO!\n";
} catch (Exception $e) {
    echo "ERRO NA CONEXÃO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim do Diagnóstico ---\n";
