<?php
require_once __DIR__ . '/env.php';
// Carrega .env se existir, mas não trava se não existir (variáveis podem vir do servidor)
if (file_exists(__DIR__ . '/../../.env')) {
    Env::load(__DIR__ . '/../../.env');
}

return [
    'host' => Env::get('DB_HOST', 'localhost'),
    'db' => Env::get('DB_NAME', 'u229417291_crm_eventos'),
    'user' => Env::get('DB_USER', 'root'),
    'pass' => Env::get('DB_PASS', ''),
    'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
];