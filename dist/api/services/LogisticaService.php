<?php
/**
 * LogisticaService - Lógica de negócio para Logística (Check-in / Check-out)
 */

class LogisticaService
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Lista eventos aprovados que iniciam ou terminam hoje.
     */
    public function listToday()
    {
        $stmt = $this->pdo->query("
            SELECT o.*, c.nome as cliente_nome 
            FROM orcamentos o 
            JOIN clientes c ON o.cliente_id = c.id 
            WHERE o.status = 'Aprovado' 
            AND (DATE(o.data_inicio) = CURDATE() OR DATE(o.data_fim) = CURDATE())
        ");
        return $stmt->fetchAll();
    }

    public function listUpcoming()
    {
        $stmt = $this->pdo->query("
            SELECT o.*, c.nome as cliente_nome 
            FROM orcamentos o 
            JOIN clientes c ON o.cliente_id = c.id 
            WHERE o.status = 'Aprovado' 
            AND DATE(o.data_inicio) > CURDATE()
            ORDER BY o.data_inicio ASC
        ");
        return $stmt->fetchAll();
    }

    public function listAwaiting()
    {
        return [
            'hoje' => $this->listToday(),
            'proximas' => $this->listUpcoming()
        ];
    }

    public function listReservasByOrcamento($orcamentoId)
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                r.*, 
                e.nome as equipamento_nome,
                (SELECT COALESCE(SUM(m.quantidade), 0) FROM movimentacoes_logistica m WHERE m.orcamento_id = r.orcamento_id AND m.equipamento_id = r.equipamento_id AND m.tipo = 'SAIDA') as qtd_saida,
                (SELECT COALESCE(SUM(m.quantidade), 0) FROM movimentacoes_logistica m WHERE m.orcamento_id = r.orcamento_id AND m.equipamento_id = r.equipamento_id AND m.tipo = 'ENTRADA') as qtd_entrada
            FROM reservas r 
            JOIN equipamentos e ON r.equipamento_id = e.id 
            WHERE r.orcamento_id = ? AND r.status = 'ATIVA'
        ");
        $stmt->execute([$orcamentoId]);
        return $stmt->fetchAll();
    }

    /**
     * Registra o Check-out (saída) de equipamentos para um orçamento.
     * Decrementa fisicamente o saldo disponível do estoque principal.
     */
    public function checkout($data)
    {
        $orcamentoId = $data['orcamento_id'] ?? null;
        $itens = $data['itens'] ?? [];

        if (empty($orcamentoId)) {
            throw new Exception("ID do orçamento é obrigatório");
        }

        try {
            $this->pdo->beginTransaction();

            $usuarioId = $_SESSION['user']['id'] ?? null;
            foreach ($itens as $item) {
                // Diminuir o estoque_disponivel fisicamente
                $stmtEquip = $this->pdo->prepare("UPDATE equipamentos SET estoque_disponivel = estoque_disponivel - ? WHERE id = ?");
                $stmtEquip->execute([$item['quantidade'], $item['equipamento_id']]);

                $stmtMov = $this->pdo->prepare("INSERT INTO movimentacoes_logistica (orcamento_id, equipamento_id, tipo, quantidade, usuario_id) VALUES (?, ?, 'SAIDA', ?, ?)");
                $stmtMov->execute([$orcamentoId, $item['equipamento_id'], $item['quantidade'], $usuarioId]);
            }

            $this->pdo->commit();
            return "Saída registrada com sucesso.";
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Registra o Check-in (retorno) de equipamentos de um evento.
     * Dependendo da condição informada (OK, Manutenção ou Defeito),
     * incrementa o saldo na coluna correspondente do banco de dados.
     */
    public function checkin($data)
    {
        $orcamentoId = $data['orcamento_id'] ?? null;
        $itens = $data['itens'] ?? [];

        if (empty($itens)) {
            throw new Exception("Lista de itens é obrigatória para check-in");
        }

        try {
            $this->pdo->beginTransaction();

            foreach ($itens as $item) {
                $quantidade = $item['quantidade'] ?? 1;
                $statusRetorno = $item['status_retorno'] ?? 'Disponível';

                // Atualizar o estoque físico dependendo de como o item retornou
                if ($statusRetorno === 'Defeito') {
                    $stmtEquip = $this->pdo->prepare("UPDATE equipamentos SET estoque_defeito = estoque_defeito + ? WHERE id = ?");
                    $stmtEquip->execute([$quantidade, $item['equipamento_id']]);
                } else if ($statusRetorno === 'Manutenção') {
                    $stmtEquip = $this->pdo->prepare("UPDATE equipamentos SET estoque_manutencao = estoque_manutencao + ? WHERE id = ?");
                    $stmtEquip->execute([$quantidade, $item['equipamento_id']]);
                } else {
                    $stmtEquip = $this->pdo->prepare("UPDATE equipamentos SET estoque_disponivel = estoque_disponivel + ? WHERE id = ?");
                    $stmtEquip->execute([$quantidade, $item['equipamento_id']]);
                }

                // Registrar movimentação de ENTRADA
                $stmtMov = $this->pdo->prepare("INSERT INTO movimentacoes_logistica (orcamento_id, equipamento_id, tipo, quantidade, usuario_id) VALUES (?, ?, 'ENTRADA', ?, ?)");
                $usuarioId = $_SESSION['user']['id'] ?? null;
                $stmtMov->execute([$orcamentoId, $item['equipamento_id'], $quantidade, $usuarioId]);

                // Cancelar/Finalizar reserva se tudo foi devolvido? 
                // Por simplicidade, liberamos a reserva associada se informada
                if (isset($item['reserva_id'])) {
                    $stmtRes = $this->pdo->prepare("UPDATE reservas SET status = 'CANCELADA' WHERE id = ?");
                    $stmtRes->execute([$item['reserva_id']]);
                }
            }

            $this->pdo->commit();
            return "Check-in registrado com sucesso.";
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function finalizeEvent($data)
    {
        $orcamentoId = $data['orcamento_id'] ?? null;
        if (empty($orcamentoId)) {
            throw new Exception("ID do orçamento é obrigatório");
        }

        try {
            $this->pdo->beginTransaction();
            
            // 1. Mudar status do orçamento
            $stmt = $this->pdo->prepare("UPDATE orcamentos SET status = 'Finalizado' WHERE id = ?");
            $stmt->execute([$orcamentoId]);

            // 2. Cancelar as reservas (liberar estoque permanentemente)
            $stmtRes = $this->pdo->prepare("UPDATE reservas SET status = 'CANCELADA' WHERE orcamento_id = ?");
            $stmtRes->execute([$orcamentoId]);

            // 3. Registrar no histórico
            $stmtHist = $this->pdo->prepare("INSERT INTO orcamento_historico (orcamento_id, status_anterior, status_novo, usuario_id) VALUES (?, 'Aprovado', 'Finalizado', ?)");
            $usuarioId = $_SESSION['user']['id'] ?? null;
            $stmtHist->execute([$orcamentoId, $usuarioId]);

            $this->pdo->commit();
            return "Evento finalizado com sucesso.";
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
