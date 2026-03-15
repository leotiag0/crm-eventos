<?php
/**
 * API - Gerenciamento de Orçamentos
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar orçamentos com dados básicos do cliente
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("
                SELECT o.*, c.nome as cliente_nome 
                FROM orcamentos o 
                JOIN clientes c ON o.cliente_id = c.id 
                WHERE o.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $orcamento = $stmt->fetch();

            if ($orcamento) {
                $stmtItens = $pdo->prepare("
                    SELECT i.*, e.nome as equipamento_nome 
                    FROM itens_orcamento i 
                    JOIN equipamentos e ON i.equipamento_id = e.id 
                    WHERE i.orcamento_id = ?
                ");
                $stmtItens->execute([$_GET['id']]);
                $orcamento['itens'] = $stmtItens->fetchAll();
            }
            $result = $orcamento;
        } else {
            $stmt = $pdo->query("
                SELECT o.*, c.nome as cliente_nome 
                FROM orcamentos o 
                JOIN clientes c ON o.cliente_id = c.id 
                ORDER BY o.created_at DESC
            ");
            $result = $stmt->fetchAll();
        }
        echo json_encode($result);
        break;

    case 'POST':
        // Criar novo orçamento ou Aprovar existente
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'save'; // 'save' ou 'approve'

        if (!empty($data['cliente_id']) && !empty($data['itens'])) {
            try {
                $pdo->beginTransaction();

                // 1. Validar disponibilidade se for Aprovação
                if ($action === 'approve') {
                    foreach ($data['itens'] as $item) {
                        $stmtDisp = $pdo->prepare("
                            SELECT 
                                e.estoque_total - COALESCE(SUM(r.qtd), 0) AS disponivel 
                            FROM equipamentos e 
                            LEFT JOIN reservas r ON r.equipamento_id = e.id 
                                AND r.status = 'ATIVA' 
                                AND r.inicio < ? 
                                AND r.fim > ? 
                            WHERE e.id = ? 
                            GROUP BY e.estoque_total
                            FOR UPDATE
                        ");
                        $stmtDisp->execute([$data['data_fim'], $data['data_inicio'], $item['equipamento_id']]);
                        $res = $stmtDisp->fetch();

                        if (!$res || $res['disponivel'] < $item['quantidade']) {
                            throw new Exception("Estoque insuficiente para o item ID: " . $item['equipamento_id']);
                        }
                    }
                }

                // 2. Inserir/Atualizar Orçamento
                $status = ($action === 'approve') ? 'Aprovado' : ($data['status'] ?? 'Rascunho');

                if (isset($data['id'])) {
                    $stmt = $pdo->prepare("
                        UPDATE orcamentos SET cliente_id = ?, data_inicio = ?, data_fim = ?, valor_total = ?, status = ?, tipo_cobranca = ?, condicoes_pagamento = ?, condicoes_fornecimento = ? 
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['cliente_id'],
                        $data['data_inicio'],
                        $data['data_fim'],
                        $data['valor_total'],
                        $status,
                        $data['tipo_cobranca'] ?? 'DIARIA',
                        $data['condicoes_pagamento'] ?? null,
                        $data['condicoes_fornecimento'] ?? null,
                        $data['id']
                    ]);
                    $orcamentoId = $data['id'];

                    // Limpar itens antigos para reinserir com snapshot atualizado se for edição de rascunho
                    $pdo->prepare("DELETE FROM itens_orcamento WHERE orcamento_id = ?")->execute([$orcamentoId]);
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO orcamentos (cliente_id, data_inicio, data_fim, valor_total, status, tipo_cobranca, condicoes_pagamento, condicoes_fornecimento) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['cliente_id'],
                        $data['data_inicio'],
                        $data['data_fim'],
                        $data['valor_total'],
                        $status,
                        $data['tipo_cobranca'] ?? 'DIARIA',
                        $data['condicoes_pagamento'] ?? null,
                        $data['condicoes_fornecimento'] ?? null
                    ]);
                    $orcamentoId = $pdo->lastInsertId();
                }

                // 3. Inserir Itens com Snapshot Rule
                $stmtItem = $pdo->prepare("
                    INSERT INTO itens_orcamento (orcamento_id, equipamento_id, quantidade, valor_unitario_snapshot, descricao_snapshot, secao) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");

                foreach ($data['itens'] as $item) {
                    // Buscar dados atuais para o Snapshot
                    $stmtEquip = $pdo->prepare("SELECT nome, valor_diaria FROM equipamentos WHERE id = ?");
                    $stmtEquip->execute([$item['equipamento_id']]);
                    $equip = $stmtEquip->fetch();

                    $stmtItem->execute([
                        $orcamentoId,
                        $item['equipamento_id'],
                        $item['quantidade'],
                        $equip['valor_diaria'], // Snapshot do preço
                        $equip['nome'], // Snapshot da descrição/nome
                        $item['secao'] ?? 'Geral' // Seção
                    ]);

                    // 4. Se aprovado, criar Reserva Firme
                    if ($action === 'approve') {
                        $stmtReserva = $pdo->prepare("
                            INSERT INTO reservas (orcamento_id, equipamento_id, qtd, inicio, fim, status) 
                            VALUES (?, ?, ?, ?, ?, 'ATIVA')
                        ");
                        $stmtReserva->execute([
                            $orcamentoId,
                            $item['equipamento_id'],
                            $item['quantidade'],
                            $data['data_inicio'],
                            $data['data_fim']
                        ]);
                    }
                }

                $pdo->commit();
                echo json_encode(["status" => "success", "id" => $orcamentoId, "message" => "Orçamento processado com sucesso"]);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dados insuficientes para gerar orçamento"]);
        }
        break;


    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
        break;
}
