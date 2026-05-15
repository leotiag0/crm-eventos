-- Migração para adicionar o campo validade_proposta na tabela orcamentos
ALTER TABLE orcamentos
ADD COLUMN validade_proposta INT DEFAULT 0 AFTER valor_total;