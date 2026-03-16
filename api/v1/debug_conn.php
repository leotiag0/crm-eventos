<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "--- Diagnóstico de Conexão CRM ---\n";

$envPath = __DIR__ . '/../../.env';
echo "Verificando .env em: " . realpath($envPath) . "\n";

if (file_exists($envPath)) {
    echo ".env encontrado.\n";
    $content = file_get_contents($envPath);
    // Mascara a senha por segurança no log visual
    echo "Conteúdo do .env (resumo):\n";
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        if (trim($line) && strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            if (stripos($key, 'PASS') !== false) {
                echo "$key=********\n";
            } else {
                echo "$key=$val\n";
            }
        }
    }
} else {
    echo ".env NÃO ENCONTRADO!\n";
}

echo "\nTentando carregar configuração...\n";
try {
    $config = require_once __DIR__ . '/../config/database.php';
    echo "Conexão estabelecida com sucesso!\n";
} catch (Exception $e) {
    echo "ERRO NA CONEXÃO:\n";
    echo $e->getMessage() . "\n";
}
?>