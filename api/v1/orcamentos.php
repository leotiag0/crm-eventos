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
        $clienteId = isset($data['cliente_id']) ? intval($data['cliente_id']) : 0;
        $itens = $data['itens'] ?? [];

        if ($clienteId > 0 && !empty($itens)) {
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
                $numero_sequencial = null;
                $nomeEvento = $data['nome_evento'] ?? null;
                $enderecoEvento = $data['endereco_evento'] ?? null;
                $condicoesPagamento = $data['condicoes_pagamento'] ?? null;
                $condicoesFornecimento = $data['condicoes_fornecimento'] ?? null;

                if (isset($data['id'])) {
                    $orcamentoId = $data['id'];

                    // Se estiver aprovando, verificar se já tem número sequencial
                    if ($status === 'Aprovado') {
                        $stmtCheck = $pdo->prepare("SELECT numero_sequencial, data_inicio FROM orcamentos WHERE id = ?");
                        $stmtCheck->execute([$orcamentoId]);
                        $currentOrc = $stmtCheck->fetch();

                        if ($currentOrc && !$currentOrc['numero_sequencial']) {
                            $year = date('Y', strtotime($data['data_inicio'] ?? $currentOrc['data_inicio']));
                            $stmtSeq = $pdo->prepare("SELECT MAX(numero_sequencial) as max_seq FROM orcamentos WHERE YEAR(data_inicio) = ?");
                            $stmtSeq->execute([$year]);
                            $rowSeq = $stmtSeq->fetch();
                            $numero_sequencial = ($rowSeq['max_seq'] ?? 0) + 1;
                        } else {
                            $numero_sequencial = $currentOrc['numero_sequencial'];
                        }
                    }

                    $stmt = $pdo->prepare("
                        UPDATE orcamentos SET cliente_id = ?, data_inicio = ?, data_fim = ?, valor_total = ?, status = ?, tipo_cobranca = ?, nome_evento = ?, endereco_evento = ?, condicoes_pagamento = ?, condicoes_fornecimento = ?, numero_sequencial = ? 
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $clienteId,
                        $data['data_inicio'],
                        $data['data_fim'],
                        $data['valor_total'],
                        $status,
                        $data['tipo_cobranca'] ?? 'DIARIA',
                        $nomeEvento,
                        $enderecoEvento,
                        $condicoesPagamento,
                        $condicoesFornecimento,
                        $numero_sequencial,
                        $orcamentoId
                    ]);

                    // Limpar itens antigos
                    $pdo->prepare("DELETE FROM itens_orcamento WHERE orcamento_id = ?")->execute([$orcamentoId]);
                } else {
                    // Novo Orçamento
                    if ($status === 'Aprovado') {
                        $year = date('Y', strtotime($data['data_inicio']));
                        $stmtSeq = $pdo->prepare("SELECT MAX(numero_sequencial) as max_seq FROM orcamentos WHERE YEAR(data_inicio) = ?");
                        $stmtSeq->execute([$year]);
                        $rowSeq = $stmtSeq->fetch();
                        $numero_sequencial = ($rowSeq['max_seq'] ?? 0) + 1;
                    }

                    $stmt = $pdo->prepare("
                        INSERT INTO orcamentos (cliente_id, data_inicio, data_fim, valor_total, status, tipo_cobranca, nome_evento, endereco_evento, numero_sequencial, condicoes_pagamento, condicoes_fornecimento) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $clienteId,
                        $data['data_inicio'],
                        $data['data_fim'],
                        $data['valor_total'],
                        $status,
                        $data['tipo_cobranca'] ?? 'DIARIA',
                        $nomeEvento,
                        $enderecoEvento,
                        $numero_sequencial,
                        $condicoesPagamento,
                        $condicoesFornecimento
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
