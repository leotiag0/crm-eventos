<?php
/**
 * Configuração de conexão com o banco de dados
 */

if (file_exists(__DIR__ . '/config.php')) {
    $config = require __DIR__ . '/config.php';
} else {
    // Fallback para variáveis de ambiente diretamente se o config.php estiver no .gitignore
    require_once __DIR__ . '/env.php';

    // Tenta carregar o .env se estiver na raiz do public_html
    Env::load(__DIR__ . '/../../.env');

    $config = [
        'host' => Env::get('DB_HOST', 'localhost'),
        'db' => Env::get('DB_NAME'),
        'user' => Env::get('DB_USER'),
        'pass' => Env::get('DB_PASS') ?? Env::get('DB_PASSWORD'),
        'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    ];
}

$host = $config['host'];
$db = $config['db'];
$user = $config['user'];
$pass = $config['pass'];
$charset = $config['charset'];

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Em produção, não exibir detalhes do erro
    error_log("Erro na conexão DB: " . $e->getMessage());
    die("Erro na conexão com o banco de dados. Por favor, tente novamente mais tarde.");
}
