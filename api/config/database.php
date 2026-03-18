<?php
/**
 * Configuração de conexão com o banco de dados
 */

if (file_exists(__DIR__ . '/config.php')) {
    $config = require __DIR__ . '/config.php';
} else {
    // Fallback para variáveis de ambiente diretamente se o config.php estiver no .gitignore
    require_once __DIR__ . '/env.php';

    // Tenta carregar o .env de forma robusta procurando em várias possibilidades
    $root = $_SERVER['DOCUMENT_ROOT']; // Geralmente /home/user/public_html
    $curDir = __DIR__;

    $paths = [
        $root . '/.env',                 // public_html/.env
        dirname($root) . '/.env',        // /home/user/.env (Recomendado)
        dirname($curDir, 2) . '/.env',   // crm-eventos/.env (se api está 2 níveis abaixo)
        dirname($curDir, 3) . '/.env',   // Mais um nível acima
        $curDir . '/../../.env'          // Caminho relativo a partir de api/config
    ];

    foreach ($paths as $path) {
        if (Env::load($path)) {
            break; // Para no primeiro que encontrar e carregar com sucesso
        }
    }

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
            "user" => $user,
            "env_loaded" => Env::getLoadedPath() ?: "Nenhum arquivo .env carregado"
        ]
    ]);
    exit;
}
