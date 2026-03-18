<?php
/**
 * OrcamentoService - Lógica de negócio para Orçamentos
 */

class OrcamentoService
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function getById($id)
    {
        $stmt = $this->pdo->prepare("
            SELECT o.*, c.nome as cliente_nome 
            FROM orcamentos o 
            JOIN clientes c ON o.cliente_id = c.id 
            WHERE o.id = ?
        ");
        $stmt->execute([$id]);
        $orcamento = $stmt->fetch();

        if ($orcamento) {
            $stmtItens = $this->pdo->prepare("
                SELECT i.*, e.nome as equipamento_nome 
                FROM itens_orcamento i 
                JOIN equipamentos e ON i.equipamento_id = e.id 
                WHERE i.orcamento_id = ?
            ");
            $stmtItens->execute([$id]);
            $orcamento['itens'] = $stmtItens->fetchAll();

            $stmtHist = $this->pdo->prepare("
                SELECT * FROM orcamento_historico 
                WHERE orcamento_id = ? 
                ORDER BY data_mudanca DESC
            ");
            $stmtHist->execute([$id]);
            $orcamento['historico'] = $stmtHist->fetchAll();
        }
        return $orcamento;
    }

    public function listAll()
    {
        $stmt = $this->pdo->query("
            SELECT o.*, c.nome as cliente_nome 
            FROM orcamentos o 
            JOIN clientes c ON o.cliente_id = c.id 
            ORDER BY o.created_at DESC
        ");
        return $stmt->fetchAll();
    }

    public function process($data)
    {
        $action = $data['action'] ?? 'save'; // 'save' ou 'approve'
        $clienteId = isset($data['cliente_id']) ? intval($data['cliente_id']) : 0;
        $itens = $data['itens'] ?? [];
        $id = $data['id'] ?? null;

        if ($clienteId <= 0 || empty($itens)) {
            throw new Exception("Dados insuficientes para gerar orçamento");
        }

        // Bloquear edição se já estiver Finalizado ou Cancelado
        if ($id) {
            $stmtStatus = $this->pdo->prepare("SELECT status FROM orcamentos WHERE id = ?");
            $stmtStatus->execute([$id]);
            $currentStatus = $stmtStatus->fetchColumn();
            if (in_array($currentStatus, ['Finalizado', 'Cancelado'])) {
                throw new Exception("Orçamentos com status '$currentStatus' não podem ser editados.");
            }
        }

        $this->pdo->beginTransaction();
        try {
            $oldStatus = $id ? $this->getCurrentStatus($id) : null;

            // 1. Validar disponibilidade e validade se for Aprovação
            if ($action === 'approve') {
                $this->validateApproval($data);
            }

            // 2. Inserir/Atualizar Orçamento
            $orcamentoId = $this->saveOrcamento($data);

            // 3. Inserir Itens com Snapshot Rule
            $this->saveItens($orcamentoId, $data['itens']);

            // 4. Se aprovado, criar Reserva Firme
            if ($action === 'approve') {
                $this->createReservas($orcamentoId, $data);
            }

            // 5. Registrar Histórico se o status mudou
            $newStatus = $this->getCurrentStatus($orcamentoId);
            if ($oldStatus !== $newStatus) {
                $this->logStatusChange($orcamentoId, $oldStatus, $newStatus);
            }

            $this->pdo->commit();
            return $orcamentoId;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function getCurrentStatus($id)
    {
        $stmt = $this->pdo->prepare("SELECT status FROM orcamentos WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetchColumn();
    }

    private function logStatusChange($orcamentoId, $oldStatus, $newStatus)
    {
        $stmt = $this->pdo->prepare("INSERT INTO orcamento_historico (orcamento_id, status_anterior, status_novo, usuario_id) VALUES (?, ?, ?, ?)");
        // Em um sistema real, pegaríamos o ID do usuário da sessão. Como o service é isolado, por enquanto usuário_id nulo ou passado.
        $usuarioId = $_SESSION['user']['id'] ?? null;
        $stmt->execute([$orcamentoId, $oldStatus, $newStatus, $usuarioId]);
    }

    private function validateApproval($data)
    {
        $id = $data['id'] ?? null;
        if ($id) {
            $stmtVal = $this->pdo->prepare("SELECT validade_proposta FROM orcamentos WHERE id = ?");
            $stmtVal->execute([$id]);
            $validade = $stmtVal->fetchColumn();

            if ($validade && $validade !== '0000-00-00' && strtotime($validade) < strtotime(date('Y-m-d'))) {
                throw new Exception("A proposta expirou em " . date('d/m/Y', strtotime($validade)) . ". Não é possível aprovar.");
            }
        }

        $this->validateAvailability($data);
    }

    private function validateAvailability($data)
    {
        foreach ($data['itens'] as $item) {
            $stmtDisp = $this->pdo->prepare("
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

    private function saveOrcamento($data)
    {
        $status = ($data['action'] === 'approve') ? 'Aprovado' : ($data['status'] ?? 'Aguardando Aprovação');
        $numero_sequencial = null;
        $id = $data['id'] ?? null;

        if ($id) {
            // Se estiver aprovando, verificar se já tem número sequencial
            if ($status === 'Aprovado') {
                $stmtCheck = $this->pdo->prepare("SELECT numero_sequencial, data_inicio FROM orcamentos WHERE id = ?");
                $stmtCheck->execute([$id]);
                $currentOrc = $stmtCheck->fetch();

                if ($currentOrc && !$currentOrc['numero_sequencial']) {
                    $numero_sequencial = $this->generateSequentialNumber($data['data_inicio'] ?? $currentOrc['data_inicio']);
                } else {
                    $numero_sequencial = $currentOrc['numero_sequencial'];
                }
            }

            $stmt = $this->pdo->prepare("
                UPDATE orcamentos SET cliente_id = ?, data_inicio = ?, data_fim = ?, valor_total = ?, validade_proposta = ?, status = ?, tipo_cobranca = ?, nome_evento = ?, endereco_evento = ?, condicoes_pagamento = ?, condicoes_fornecimento = ?, numero_sequencial = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $data['cliente_id'],
                $data['data_inicio'],
                $data['data_fim'],
                $data['valor_total'],
                $data['validade_proposta'] ?? null,
                $status,
                $data['tipo_cobranca'] ?? 'DIARIA',
                $data['nome_evento'] ?? null,
                $data['endereco_evento'] ?? null,
                $data['condicoes_pagamento'] ?? null,
                $data['condicoes_fornecimento'] ?? null,
                $numero_sequencial,
                $id
            ]);

            // Limpar itens antigos
            $this->pdo->prepare("DELETE FROM itens_orcamento WHERE orcamento_id = ?")->execute([$id]);
            return $id;
        } else {
            if ($status === 'Aprovado') {
                $numero_sequencial = $this->generateSequentialNumber($data['data_inicio']);
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO orcamentos (cliente_id, data_inicio, data_fim, valor_total, validade_proposta, status, tipo_cobranca, nome_evento, endereco_evento, numero_sequencial, condicoes_pagamento, condicoes_fornecimento) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['cliente_id'],
                $data['data_inicio'],
                $data['data_fim'],
                $data['valor_total'],
                $data['validade_proposta'] ?? null,
                $status,
                $data['tipo_cobranca'] ?? 'DIARIA',
                $data['nome_evento'] ?? null,
                $data['endereco_evento'] ?? null,
                $numero_sequencial,
                $data['condicoes_pagamento'] ?? null,
                $data['condicoes_fornecimento'] ?? null
            ]);
            return $this->pdo->lastInsertId();
        }
    }

    private function generateSequentialNumber($date)
    {
        $year = date('Y', strtotime($date));
        $stmtSeq = $this->pdo->prepare("SELECT MAX(numero_sequencial) as max_seq FROM orcamentos WHERE YEAR(data_inicio) = ?");
        $stmtSeq->execute([$year]);
        $rowSeq = $stmtSeq->fetch();
        return ($rowSeq['max_seq'] ?? 0) + 1;
    }

    private function saveItens($orcamentoId, $itens)
    {
        $stmtItem = $this->pdo->prepare("
            INSERT INTO itens_orcamento (orcamento_id, equipamento_id, quantidade, valor_unitario_snapshot, descricao_snapshot, secao) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($itens as $item) {
            $stmtEquip = $this->pdo->prepare("SELECT nome, valor_diaria FROM equipamentos WHERE id = ?");
            $stmtEquip->execute([$item['equipamento_id']]);
            $equip = $stmtEquip->fetch();

            $stmtItem->execute([
                $orcamentoId,
                $item['equipamento_id'],
                $item['quantidade'],
                $equip['valor_diaria'],
                $equip['nome'],
                $item['secao'] ?? 'Geral'
            ]);
        }
    }

    private function createReservas($orcamentoId, $data)
    {
        $stmtReserva = $this->pdo->prepare("
            INSERT INTO reservas (orcamento_id, equipamento_id, qtd, inicio, fim, status) 
            VALUES (?, ?, ?, ?, ?, 'ATIVA')
        ");
        foreach ($data['itens'] as $item) {
            $stmtReserva->execute([
                $orcamentoId,
                $item['equipamento_id'],
                $item['quantidade'],
                $data['data_inicio'],
                $data['data_fim']
            ]);
        }
    }
}
