# CRM Eventos - Inteligência Logística e BI

Este projeto é uma plataforma avançada de gestão para locação de equipamentos de eventos, focada em rastreabilidade logística e inteligência de dados (BI).

## 🚀 Principais Funcionalidades

### 📊 Painel de Business Intelligence (BI)
- **Visão Geral Financeira:** Acompanhamento de faturamento aprovado vs. pendente e taxa de conversão comercial.
- **Ranking de ROI:** Identificação automática dos 10 equipamentos com maior rentabilidade.
- **Alertas Técnicos:** Monitoramento em tempo real de ativos em manutenção ou com defeito.
- **Calendário Operacional:** Visualização estratégica de saídas e retornos programados.

### 📦 Controle de Estoque Quádruplo
O sistema abandona a visão simples de "estoque total" para uma gestão de quatro estados lógicos:
1. **Total:** Quantidade física global no inventário.
2. **Disponível:** Quantidade pronta para novas locações.
3. **Manutenção:** Itens em processo de revisão preventiva.
4. **Defeito:** Itens avariados aguardando conserto ou descarte.

### 🚛 Logística Avançada
- **Check-out Digital:** Registro rápido de saída de equipamentos para eventos.
- **Check-in Inteligente:** Fluxo de retorno que permite classificar o estado do item na chegada (Disponível, Manutenção ou Defeito), atualizando o BI instantaneamente.
- **Romaneio de Conferência:** Geração de documentos prontos para impressão para conferência física no galpão.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React (Vite) + Tailwind CSS + React Query (TanStack)
- **Backend:** PHP 8.x (Arquitetura orientada a serviços)
- **Banco de Dados:** MySQL/MariaDB com indexação otimizada para BI
- **Segurança:** PDO Prepared Statements e isolamento de credenciais via `.env`

## 📦 Como Instalar

1. Clone o repositório.
2. Configure o arquivo `api/.env` com as credenciais do seu banco de dados MySQL.
3. Importe o esquema do banco de dados (disponível em `database/schema.sql`).
4. Execute `npm install` na raiz para as dependências do frontend.
5. Para desenvolvimento: `npm run dev`
6. Para produção: `node build-prod.js` (isso consolidará o build do React com a API PHP na pasta `dist`).

## 🛡️ Segurança e Publicação

Este repositório está configurado para publicação segura no GitHub:
- O arquivo `.env` está no `.gitignore`.
- Credenciais sensíveis nunca são versionadas.
- Comentários técnicos em português (PT-BR) para facilitar a auditoria.

---
*Desenvolvido como solução final de Inteligência Logística para CRM Eventos.*
