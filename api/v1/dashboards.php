<?php
/**
 * API - Dashboards e Inteligência de Dados
 */

header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido"]);
    exit;
}

$type = $_GET['type'] ?? 'overview';

switch ($type) {
    case 'overview':
        // Métricas gerais
        $stats = [];

        $stats['total_clientes'] = $pdo->query("SELECT COUNT(*) FROM clientes")->fetchColumn();
        $stats['total_equipamentos'] = $pdo->query("SELECT COUNT(*) FROM equipamentos")->fetchColumn();
        $stats['orcamentos_ativos'] = $pdo->query("SELECT COUNT(*) FROM orcamentos WHERE status IN ('Aprovado', 'Enviado')")->fetchColumn();
        $stats['faturamento_total'] = $pdo->query("SELECT SUM(valor_total) FROM orcamentos WHERE status = 'Finalizado'")->fetchColumn() ?: 0;

        echo json_encode($stats);
        break;

    case 'uso_equipamentos':
        // Ranking de equipamentos mais locados
        $stmt = $pdo->query("
            SELECT e.nome, COUNT(i.id) as total_locacoes, SUM(i.quantidade) as qtd_total
            FROM equipamentos e
            JOIN itens_orcamento i ON e.id = i.equipamento_id
            JOIN orcamentos o ON i.orcamento_id = o.id
            WHERE o.status = 'Aprovado' OR o.status = 'Finalizado'
            GROUP BY e.id
            ORDER BY qtd_total DESC
            LIMIT 10
        ");
        echo json_encode($stmt->fetchAll());
        break;

    case 'manutencao':
        // Alertas de equipamentos que precisam de manutenção
        $stmt = $pdo->query("
            SELECT id, nome, status, descricao
            FROM equipamentos
            WHERE status != 'Disponível'
        ");
        echo json_encode($stmt->fetchAll());
        break;

    case 'calendario_semanal':
        // Eventos da semana (Domingo a Sábado)
        $startOfWeek = date('Y-m-d 00:00:00', strtotime('last sunday', strtotime('tomorrow')));
        $endOfWeek = date('Y-m-d 23:59:59', strtotime('next saturday', strtotime('yesterday')));

        $stmt = $pdo->prepare("
            SELECT o.id, o.data_inicio, o.data_fim, o.nome_evento, o.numero_sequencial, c.nome as cliente_nome, o.status
            FROM orcamentos o
            JOIN clientes c ON o.cliente_id = c.id
            WHERE o.data_inicio BETWEEN ? AND ?
            AND o.status NOT IN ('Cancelado')
            ORDER BY o.data_inicio ASC
        ");
        $stmt->execute([$startOfWeek, $endOfWeek]);
        echo json_encode($stmt->fetchAll());
        break;

    default:
        echo json_encode(["error" => "Tipo de dashboard inválido"]);
        break;
}
