<?php
/**
 * Utilitário para criar um usuário inicial no banco de dados
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

require_once __DIR__ . '/config/database.php';

// CONFIGURAÇÃO DO NOVO USUÁRIO
$nome = "Administrador";
$email = "admin@admin.com"; // Troque pelo seu e-mail
$senha = "admin123";      // Troque por uma senha forte
$papel_slug = "admin";    // Slug do papel (geralmente 'admin')

echo "--- Criador de Usuário CRM ---\n";

try {
    // 1. Verificar se o papel existe
    $stmt = $pdo->prepare("SELECT id FROM papeis WHERE slug = ?");
    $stmt->execute([$papel_slug]);
    $papel = $stmt->fetch();

    if (!$papel) {
        // Se não existir, listar papéis disponíveis
        echo "ERRO: Papel '$papel_slug' não encontrado.\n";
        echo "Papéis disponíveis no banco:\n";
        $papeis = $pdo->query("SELECT slug FROM papeis")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($papeis as $p)
            echo "- $p\n";
        exit;
    }

    $papel_id = $papel['id'];

    // 2. Verificar se usuário já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "AVISO: Usuário com e-mail '$email' já existe.\n";
        exit;
    }

    // 3. Criar hash da senha
    $hash = password_hash($senha, PASSWORD_DEFAULT);

    // 4. Inserir usuário
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, papel_id, status) VALUES (?, ?, ?, ?, 'ativo')");
    $success = $stmt->execute([$nome, $email, $hash, $papel_id]);

    if ($success) {
        echo "SUCESSO: Usuário '$nome' ($email) criado com sucesso!\n";
        echo "Senha utilizada: $senha\n";
        echo "\nIMPORTANTE: APAGUE ESTE ARQUIVO (create_user.php) APÓS O USO POR SEGURANÇA.\n";
    }

} catch (Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
