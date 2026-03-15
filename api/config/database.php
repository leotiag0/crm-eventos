<?php
/**
 * Configuração de conexão com o banco de dados
 */

$config = require_once 'config.php';

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
    die("Erro na conexão com o banco de dados: " . $e->getMessage());
}
