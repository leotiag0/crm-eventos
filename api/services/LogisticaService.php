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
            SELECT r.*, e.nome as equipamento_nome 
            FROM reservas r 
            JOIN equipamentos e ON r.equipamento_id = e.id 
            WHERE r.orcamento_id = ? AND r.status = 'ATIVA'
        ");
        $stmt->execute([$orcamentoId]);
        return $stmt->fetchAll();
    }

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
                // Atualizar status do equipamento (se necessário, ex: Defeito)
                $stmtEquip = $this->pdo->prepare("UPDATE equipamentos SET status = ? WHERE id = ?");
                $stmtEquip->execute([$item['status_item'] ?? 'Disponível', $item['equipamento_id']]);

                // Registrar movimentação de ENTRADA
                $stmtMov = $this->pdo->prepare("INSERT INTO movimentacoes_logistica (orcamento_id, equipamento_id, tipo, quantidade, usuario_id) VALUES (?, ?, 'ENTRADA', ?, ?)");
                $usuarioId = $_SESSION['user']['id'] ?? null;
                $stmtMov->execute([$orcamentoId, $item['equipamento_id'], $item['quantidade'], $usuarioId]);

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
}
