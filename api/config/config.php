<?php
require_once __DIR__ . '/env.php';

// Tenta carregar o .env de forma robusta procurando em várias possibilidades
$root = $_SERVER['DOCUMENT_ROOT']; // Geralmente /home/user/public_html
$curDir = __DIR__;

$paths = [
    $root . '/.env',                 // public_html/.env
    dirname($root) . '/.env',        // /home/user/.env (Recomendado na Hostinger)
    dirname($curDir, 2) . '/.env',   // crm-eventos/.env (se api está 2 níveis abaixo)
    dirname($curDir, 3) . '/.env',   // Mais um nível acima
    $curDir . '/../../.env'          // Caminho relativo a partir de api/config
];

foreach ($paths as $path) {
    if (Env::load($path)) {
        break; // Para no primeiro que encontrar e carregar com sucesso
    }
}

return [
    'host' => Env::get('DB_HOST', 'localhost'),
    'db' => Env::get('DB_NAME'),
    'user' => Env::get('DB_USER'),
    'pass' => Env::get('DB_PASS') ?? Env::get('DB_PASSWORD'),
    'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    'debug' => Env::get('APP_DEBUG', false),
];