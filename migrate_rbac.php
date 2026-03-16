<?php
header("Content-Type: application/json");
require_once 'api/config/database.php';

try {
    // 1. Papeis
    $pdo->exec("CREATE TABLE IF NOT EXISTS papeis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL
    ) ENGINE=InnoDB");

    // 2. Usuarios
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        papel_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (papel_id) REFERENCES papeis(id) ON DELETE SET NULL
    ) ENGINE=InnoDB");

    // 3. Permissoes
    $pdo->exec("CREATE TABLE IF NOT EXISTS permissoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        papel_id INT NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        pode_acessar BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (papel_id) REFERENCES papeis(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");

    // 4. Configuracoes
    $pdo->exec("CREATE TABLE IF NOT EXISTS configuracoes (
        id INT PRIMARY KEY DEFAULT 1,
        nome_empresa VARCHAR(255),
        logo_path TEXT,
        cor_primaria VARCHAR(7) DEFAULT '#3b82f6',
        cor_secundaria VARCHAR(7) DEFAULT '#1e40af',
        endereco TEXT,
        telefone VARCHAR(20),
        email_contato VARCHAR(100),
        site VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // Initial Data
    // Roles
    $pdo->exec("INSERT IGNORE INTO papeis (nome, slug) VALUES 
        ('Administrador', 'admin'),
        ('Gerente', 'gerente'),
        ('Operador', 'operador')
    ");

    $admin_role_id = $pdo->query("SELECT id FROM papeis WHERE slug = 'admin'")->fetchColumn();
    $operador_role_id = $pdo->query("SELECT id FROM papeis WHERE slug = 'operador'")->fetchColumn();

    // Default User: admin / admin123
    $senha_hash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuarios (nome, email, senha, papel_id) VALUES (?, ?, ?, ?)");
    $stmt->execute(['Administrador', 'admin@exemplo.com', $senha_hash, $admin_role_id]);

    // Initial permissions for Admin
    $modulos = ['dashboard', 'clientes', 'equipamentos', 'orcamentos', 'logistica', 'usuarios', 'configuracoes'];
    foreach ($modulos as $modulo) {
        $pdo->exec("INSERT IGNORE INTO permissoes (papel_id, modulo, pode_acessar) VALUES ($admin_role_id, '$modulo', 1)");
    }

    // Initial permissions for Operador
    $modulos_op = ['dashboard', 'equipamentos', 'orcamentos'];
    foreach ($modulos_op as $modulo) {
        $pdo->exec("INSERT IGNORE INTO permissoes (papel_id, modulo, pode_acessar) VALUES ($operador_role_id, '$modulo', 1)");
    }

    // Default Settings
    $pdo->exec("INSERT IGNORE INTO configuracoes (id, nome_empresa) VALUES (1, 'Minha Empresa de Eventos')");

    echo json_encode(["status" => "success", "message" => "Tabelas de autenticação e configurações criadas com sucesso."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
