<?php
/**
 * Configuração de conexão com o banco de dados
 */

if (file_exists(__DIR__ . '/config.php')) {
    $config = require __DIR__ . '/config.php';
} else {
    // Fallback para variáveis de ambiente diretamente se o config.php estiver no .gitignore
    require_once __DIR__ . '/env.php';

    // Tenta carregar o .env de forma robusta
    $root = $_SERVER['DOCUMENT_ROOT']; // Geralmente /.../public_html
    Env::load($root . '/.env');        // Root (public_html)
    Env::load(dirname($root) . '/.env'); // Um nível acima (Onde está o nosso arquivo seguro)
    Env::load(dirname(__DIR__, 2) . '/.env'); // Fallback manual

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
    // Em produção, não exibir detalhes sensíveis, mas retornar JSON para o frontend
    error_log("Erro na conexão DB: " . $e->getMessage());

    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);

    $errorMsg = "Erro na conexão com o banco de dados. Por favor, tente novamente mais tarde.";

    // Se estiver em ambiente de desenvolvimento ou se for um erro específico que ajuda o usuário sem expor senhas
    if (Env::get('APP_DEBUG') || strpos($e->getMessage(), 'Access denied') !== false) {
        $errorMsg .= " Detalhes: " . $e->getMessage();
    }

    echo json_encode([
        "error" => $errorMsg,
        "debug_info" => [
            "host" => $host,
            "db" => $db,
            "user" => $user
        ]
    ]);
    exit;
}
