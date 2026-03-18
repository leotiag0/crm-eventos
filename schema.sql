-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS crm_eventos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE crm_eventos;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_diaria DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estoque_total INT NOT NULL DEFAULT 0,
    fabricante VARCHAR(255),
    numero_serie VARCHAR(100),
    status ENUM(
        'Disponível',
        'Necessita Manutenção Preventiva',
        'Defeito Técnico'
    ) DEFAULT 'Disponível',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    validade_proposta INT DEFAULT 0,
    tipo_cobranca ENUM('DIARIA', 'EVENTO') DEFAULT 'DIARIA',
    status ENUM(
        'Rascunho',
        'Enviado',
        'Aprovado',
        'Recusado',
        'Cancelado',
        'Finalizado'
    ) DEFAULT 'Rascunho',
    nome_evento VARCHAR(255),
    endereco_evento TEXT,
    numero_sequencial INT,
    condicoes_pagamento TEXT,
    condicoes_fornecimento TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Tabela de Itens do Orçamento (Snapshot Rule)
CREATE TABLE IF NOT EXISTS itens_orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario_snapshot DECIMAL(10, 2) NOT NULL,
    descricao_snapshot TEXT,
    secao VARCHAR(100) DEFAULT 'Geral',
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- Tabela de Reservas (Módulo C)
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    qtd INT NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    status ENUM('ATIVA', 'CANCELADA') DEFAULT 'ATIVA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_disponibilidade (
        equipamento_id,
        status,
        inicio,
        fim
    ),
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Tabela de Papéis (RBAC)
CREATE TABLE IF NOT EXISTS papeis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
) ENGINE = InnoDB;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    papel_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (papel_id) REFERENCES papeis (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    papel_id INT NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    pode_acessar BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (papel_id) REFERENCES papeis (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT PRIMARY KEY DEFAULT 1,
    nome_empresa VARCHAR(255),
    razao_social VARCHAR(255),
    cnpj VARCHAR(20),
    logo_path TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#3b82f6',
    cor_secundaria VARCHAR(7) DEFAULT '#1e40af',
    endereco TEXT,
    telefone VARCHAR(20),
    email_contato VARCHAR(100),
    site VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;