-- Migração Inicial: Criação da tabela de testes ou logs futuros
-- Este é um exemplo de como as migrações serão estruturadas.

CREATE TABLE IF NOT EXISTS logs_operacionais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    contexto JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;