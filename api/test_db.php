<?php
/**
 * Script de diagnóstico FINAL
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico Final Hostinger ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . __DIR__ . "\n";

require_once __DIR__ . '/config/env.php';

echo "\n--- Verificação de Arquivos .env ---\n";
$publicHtml = dirname(__DIR__); // /public_html
$envPathRoot = $publicHtml . '/.env';
$envPathSafe = $publicHtml . '/../.env';

echo "Local 1 (Raiz): $envPathRoot -> " . (file_exists($envPathRoot) ? "EXISTE" : "NÃO") . "\n";
echo "Local 2 (Pai/Seguro): $envPathSafe -> " . (file_exists($envPathSafe) ? "EXISTE" : "NÃO") . "\n";

echo "\n--- Carregando Configurações ---\n";
Env::load($envPathRoot);
Env::load($envPathSafe);

$envVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'API_URL'];
foreach ($envVars as $v) {
    if (Env::get($v)) {
        echo "$v: DEFINIDO (" . substr(Env::get($v), 0, 3) . "...)\n";
    } else {
        echo "$v: NÃO DEFINIDO\n";
    }
}

echo "\n--- Testando Integração com database.php ---\n";
try {
    require __DIR__ . '/config/database.php';
    if (isset($pdo)) {
        echo "CONEXÃO PDO INICIALIZADA COM SUCESSO!\n";
        $stmt = $pdo->query("SELECT 1");
        echo "QUERY DE TESTE: SUCESSO!\n";
    }
} catch (Exception $e) {
    echo "ERRO NA INTEGRAÇÃO: " . $e->getMessage() . "\n";
}

echo "\n--- Fim do Diagnóstico ---\n";
