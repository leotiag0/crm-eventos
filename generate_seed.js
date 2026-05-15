const fs = require('fs');

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

let sql = `
-- Configurações de conexão (usar database)
USE crm_eventos;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE movimentacoes_logistica;
TRUNCATE TABLE reservas;
TRUNCATE TABLE itens_orcamento;
TRUNCATE TABLE orcamento_historico;
TRUNCATE TABLE orcamentos;
TRUNCATE TABLE equipamentos;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

`;

// Nomes e Empresas reais
const pessoas = [
    'Mariana Oliveira', 'Carlos Eduardo Silva', 'Fernando Souza', 'Amanda Costa',
    'Roberto Almeida', 'Juliana Santos', 'Felipe Martins', 'Beatriz Lima',
    'Ricardo Pereira', 'Camila Rodrigues', 'Lucas Carvalho', 'Patricia Gomes',
    'Gustavo Henrique', 'Larissa Mendes', 'Thiago Ribeiro'
];

const empresas = [
    'TechCorp Solutions', 'Agência Criativa LTDA', 'Grupo Alfa', 
    'Mega Produções', 'Nexos Consultoria'
];

const todosClientes = [...pessoas, ...empresas];

// 1. Clientes
for (let i = 0; i < 20; i++) {
    const nome = todosClientes[i];
    const dominio = nome.toLowerCase().replace(/ /g, '').replace('ltda', '') + '.com.br';
    const email = `contato@${dominio}`;
    sql += `INSERT INTO clientes (id, nome, email, telefone) VALUES (${i+1}, '${nome}', '${email}', '1199999${(i+1).toString().padStart(4, '0')}');\n`;
}

// 2. Equipamentos
const equipamentos = [
    { id: 1, nome: 'Caixa de Som Ativa 1000W', valor: 150, estoque: 20 },
    { id: 2, nome: 'Microfone sem Fio Duplo', valor: 80, estoque: 15 },
    { id: 3, nome: 'Mesa de Som 16 Canais', valor: 200, estoque: 5 },
    { id: 4, nome: 'Painel de LED 3x2m', valor: 1200, estoque: 3 },
    { id: 5, nome: 'Moving Head Beam 230W', valor: 90, estoque: 30 },
    { id: 6, nome: 'Máquina de Fumaça 1500W', valor: 60, estoque: 10 },
    { id: 7, nome: 'Estrutura Box Truss Q30 (Metro)', valor: 25, estoque: 100 }
];
for (const eq of equipamentos) {
    sql += `INSERT INTO equipamentos (id, nome, valor_diaria, estoque_total, estoque_disponivel) VALUES (${eq.id}, '${eq.nome}', ${eq.valor}, ${eq.estoque}, ${eq.estoque});\n`;
}

// 3. Orçamentos & related
let orcamentoId = 1;
let itemId = 1;
let reservaId = 1;
let movId = 1;
let histId = 1;

const saturdays = [
    '2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25',
    '2026-05-02', '2026-05-09', '2026-05-16', '2026-05-23', '2026-05-30'
];

const corporateDates = ['2026-04-09', '2026-05-12'];
const variedDates = ['2026-04-10', '2026-04-26', '2026-05-15'];

const eventosSociais = [
    'Casamento de Mariana e Pedro', '15 Anos da Sofia', 'Bodas de Ouro da Família Silva',
    'Casamento Carlos e Ana', 'Festa de Formatura Medicina USP', 'Aniversário 50 Anos do Roberto',
    'Casamento Juliana e Lucas', 'Festa de Noivado Camila e João', 'Casamento Felipe e Beatriz',
    'Formatura Direito Mackenzie'
];

const eventosCorporativos = [
    'Conferência Anual InovaTech', 'Lançamento de Produto TechCorp'
];

const eventosVariados = [
    'Festival Cultural de Inverno', 'Feira Gastronômica de SP', 'Exposição de Arte Moderna'
];

const approvedEvents = [];
// 10 Social (Saturdays)
for (let i = 0; i < 10; i++) {
    const d = new Date(saturdays[i % saturdays.length]);
    const created = new Date(d.getTime() - 215 * 24 * 60 * 60 * 1000);
    approvedEvents.push({ type: 'social', date: d, created, name: eventosSociais[i] });
}
// 2 Corporate
for (let i = 0; i < 2; i++) {
    const d = new Date(corporateDates[i]);
    const created = new Date(d.getTime() - 23 * 24 * 60 * 60 * 1000);
    approvedEvents.push({ type: 'corporate', date: d, created, name: eventosCorporativos[i] });
}
// 3 Varied
for (let i = 0; i < 3; i++) {
    const d = new Date(variedDates[i]);
    const created = new Date(d.getTime() - 60 * 24 * 60 * 60 * 1000);
    approvedEvents.push({ type: 'varied', date: d, created, name: eventosVariados[i] });
}

// Client mapping for retention (15 events, 6 from recurring)
// Usamos clientes das posições mais realistas
// Empresa 1 (pos 15): 4 eventos
// Empresa 2 (pos 16): 3 eventos
// Pessoa 1 (pos 0): 2 eventos
// Pessoas 2-7 (pos 1-6): 1 evento cada
// Total: 4+3+2+6 = 15 eventos
const clientAssignments = [16, 16, 16, 16, 17, 17, 17, 1, 1, 2, 3, 4, 5, 6, 7];

approvedEvents.forEach((ev, idx) => {
    const cId = clientAssignments[idx];
    const evDateStr = ev.date.toISOString().slice(0, 10);
    const dtInicio = evDateStr + ' 18:00:00';
    const dtFim = evDateStr + ' 23:59:59';
    
    const validade = new Date(ev.created.getTime() + 15 * 24 * 60 * 60 * 1000);
    
    sql += `INSERT INTO orcamentos (id, cliente_id, data_inicio, data_fim, valor_total, validade_proposta, status, nome_evento, created_at) VALUES (${orcamentoId}, ${cId}, '${dtInicio}', '${dtFim}', 0, '${formatDate(validade).slice(0,10)}', 'Finalizado', '${ev.name}', '${formatDate(ev.created)}');\n`;
    
    sql += `INSERT INTO orcamento_historico (id, orcamento_id, status_anterior, status_novo, data_mudanca) VALUES (${histId++}, ${orcamentoId}, 'Rascunho', 'Enviado', '${formatDate(ev.created)}');\n`;
    sql += `INSERT INTO orcamento_historico (id, orcamento_id, status_anterior, status_novo, data_mudanca) VALUES (${histId++}, ${orcamentoId}, 'Enviado', 'Aprovado', '${formatDate(validade)}');\n`;
    
    let totalValor = 0;
    
    const eqLoad = [
        { eqId: 1, qtd: 4 },
        { eqId: 2, qtd: 2 },
        { eqId: 5, qtd: 12 }, // moving head
        { eqId: 7, qtd: 30 } // box truss
    ];
    
    eqLoad.forEach(load => {
        const eq = equipamentos.find(e => e.id === load.eqId);
        const itemVal = eq.valor * load.qtd;
        totalValor += itemVal;
        
        sql += `INSERT INTO itens_orcamento (id, orcamento_id, equipamento_id, quantidade, valor_unitario_snapshot) VALUES (${itemId++}, ${orcamentoId}, ${eq.id}, ${load.qtd}, ${eq.valor});\n`;
        
        sql += `INSERT INTO reservas (id, orcamento_id, equipamento_id, qtd, inicio, fim, status) VALUES (${reservaId++}, ${orcamentoId}, ${eq.id}, ${load.qtd}, '${dtInicio}', '${dtFim}', 'ATIVA');\n`;
        
        // Movimentação SAIDA - Sábado 16:00
        const saidaDt = evDateStr + ' 16:00:00';
        const nextDay = new Date(ev.date.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const entradaDt = nextDay + ' 02:00:00';
        
        sql += `INSERT INTO movimentacoes_logistica (id, orcamento_id, equipamento_id, tipo, quantidade, data_movimentacao) VALUES (${movId++}, ${orcamentoId}, ${eq.id}, 'SAIDA', ${load.qtd}, '${saidaDt}');\n`;
        sql += `INSERT INTO movimentacoes_logistica (id, orcamento_id, equipamento_id, tipo, quantidade, data_movimentacao) VALUES (${movId++}, ${orcamentoId}, ${eq.id}, 'ENTRADA', ${load.qtd}, '${entradaDt}');\n`;
    });
    
    sql += `UPDATE orcamentos SET valor_total = ${totalValor} WHERE id = ${orcamentoId};\n`;
    
    orcamentoId++;
});

// The other 60 quotes (making 75 total)
const outrosEventos = [
    'Confraternização Fim de Ano', 'Lançamento Livro Maria', 'Workshop Fotografia',
    'Palestra Empreendedorismo', 'Feira Agropecuária', 'Casamento Ana e Rafael',
    '15 Anos Gabriela', 'Evento Startup SP'
];

for (let i = 0; i < 60; i++) {
    const cId = randomInt(8, 20);
    const evDate = randomDate(new Date('2025-01-01'), new Date('2026-06-01'));
    const created = new Date(evDate.getTime() - randomInt(10, 100) * 24 * 60 * 60 * 1000);
    const dtInicio = evDate.toISOString().slice(0, 10) + ' 10:00:00';
    const dtFim = evDate.toISOString().slice(0, 10) + ' 18:00:00';
    
    const statuses = ['Rascunho', 'Enviado', 'Recusado', 'Cancelado'];
    const status = statuses[randomInt(0, statuses.length - 1)];
    const nomeEventoBase = outrosEventos[randomInt(0, outrosEventos.length - 1)];
    const nomeEventoFinal = `${nomeEventoBase} (Não Aprovado - Proposta ${i+1})`;
    
    sql += `INSERT INTO orcamentos (id, cliente_id, data_inicio, data_fim, valor_total, status, nome_evento, created_at) VALUES (${orcamentoId}, ${cId}, '${dtInicio}', '${dtFim}', 0, '${status}', '${nomeEventoFinal}', '${formatDate(created)}');\n`;
    
    const eq = equipamentos[randomInt(0, equipamentos.length - 1)];
    sql += `INSERT INTO itens_orcamento (id, orcamento_id, equipamento_id, quantidade, valor_unitario_snapshot) VALUES (${itemId++}, ${orcamentoId}, ${eq.id}, 1, ${eq.valor});\n`;
    
    sql += `UPDATE orcamentos SET valor_total = ${eq.valor} WHERE id = ${orcamentoId};\n`;
    
    orcamentoId++;
}

// Maintenance updates on Monday mornings
sql += `UPDATE equipamentos SET status = 'Necessita Manutenção Preventiva' WHERE id = 5;\n`;

fs.writeFileSync('simulation_seed.sql', sql);
console.log('Seed SQL generated successfully with realistic names.');
