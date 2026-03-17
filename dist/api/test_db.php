<?php
/**
 * Script de diagnóstico RESILIENTE para Hostinger
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico de Estrutura de Arquivos (Resiliente) ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . __DIR__ . "\n";

function listFiles($dir, $depth = 0)
{
    if (!is_dir($dir)) {
        echo str_repeat("  ", $depth) . "!! DIRETÓRIO NÃO ENCONTRADO: $dir\n";
        return;
    }
    $files = scandir($dir);
    echo str_repeat("  ", $depth) . "[DIR] " . basename($dir) . "/\n";
    foreach ($files as $file) {
        if ($file === '.' || $file === '..')
            continue;
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            listFiles($path, $depth + 1);
        } else {
            echo str_repeat("  ", $depth + 1) . $file . "\n";
        }
    }
}

echo "\n--- Listando pasta /api (recursivo) ---\n";
listFiles(__DIR__);

echo "\n--- Listando pasta raiz (public_html) ---\n";
listFiles(dirname(__DIR__));

echo "\n--- Verificando variáveis de ambiente (getenv) ---\n";
$vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'API_URL', 'APP_ENV'];
foreach ($vars as $v) {
    $val = getenv($v);
    echo "$v: " . ($val === false ? "NÃO DEFINIDA" : "DEFINIDA") . "\n"; // Não exibir valores por segurança
}

echo "\n--- Fim do Diagnóstico ---\n";
