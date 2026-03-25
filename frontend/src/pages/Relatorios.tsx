import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Relatorios: React.FC = () => {
    // Busca dados para consolidar
    const { data: orcamentos, isLoading } = useQuery({
        queryKey: ['orcamentos-list'],
        queryFn: async () => (await api.get('/orcamentos.php')).data
    });

    const { data: clientes } = useQuery({
        queryKey: ['clientes-list'],
        queryFn: async () => (await api.get('/clientes.php')).data,
    });

    const metrics = useMemo(() => {
        if (!orcamentos) return null;

        const aprovados = orcamentos.filter((o: any) => o.status === 'Aprovado' || o.status === 'Finalizado');
        const aguardando = orcamentos.filter((o: any) => o.status === 'Aguardando Aprovação');
        const cancelados = orcamentos.filter((o: any) => o.status === 'Cancelado');

        const faturamentoTotal = aprovados.reduce((acc: number, o: any) => acc + parseFloat(o.valor_total), 0);
        const ticketMedio = aprovados.length > 0 ? faturamentoTotal / aprovados.length : 0;

        // Top Clientes
        const faturamentoPorCliente: Record<string, number> = {};
        aprovados.forEach((o: any) => {
            faturamentoPorCliente[o.cliente_nome] = (faturamentoPorCliente[o.cliente_nome] || 0) + parseFloat(o.valor_total);
        });

        const topClientes = Object.entries(faturamentoPorCliente)
            .map(([nome, valor]) => ({ nome, valor }))
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 5);

        // Faturamento Mensal (Últimos 6 meses)

        return {
            totalAprovados: aprovados.length,
            totalAguardando: aguardando.length,
            totalCancelados: cancelados.length,
            faturamentoTotal,
            ticketMedio,
            topClientes,
            taxaConversao: orcamentos.length > 0 ? (aprovados.length / orcamentos.length) * 100 : 0
        };
    }, [orcamentos]);

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 text-left px-4 md:px-0 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {Icons.Relatorios && <Icons.Relatorios size={28} className="text-primary" />}
                    Relatórios & BI
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs uppercase tracking-tight">
                    Inteligência de Vendas e Operação
                </p>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Faturamento Global</p>
                    <h3 className="text-lg md:text-2xl font-black text-primary truncate">
                        <span className="text-xs md:text-sm mr-1">R$</span>
                        {metrics?.faturamentoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Ticket Médio</p>
                    <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white truncate">
                        <span className="text-xs md:text-sm mr-1 text-slate-400">R$</span>
                        {metrics?.ticketMedio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] border border-emerald-200 dark:border-emerald-900/50 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-emerald-500/10">
                        <Icons.Success size={80} />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest">Conversão</p>
                    <h3 className="text-lg md:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                        {metrics?.taxaConversao?.toFixed(1)}%
                    </h3>
                    <p className="text-[9px] tracking-tight font-bold text-emerald-600/70 uppercase">
                        {metrics?.totalAprovados} aprovados
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] border border-amber-200 dark:border-amber-900/50 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-amber-500/10">
                        <Icons.Warning size={80} />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">Pipeline</p>
                    <h3 className="text-lg md:text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
                        {metrics?.totalAguardando}
                    </h3>
                    <p className="text-[9px] tracking-tight font-bold text-amber-600/70 uppercase">
                        Aguardando Aprovação
                    </p>
                </div>
            </div>

            {/* Top Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">

                {/* Top Clientes */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Top Clientes</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Maior Volume de Negócios</p>
                        </div>
                        <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Icons.Clientes size={20} />
                        </div>
                    </div>
                    <div className="p-2">
                        {metrics?.topClientes.map((cliente, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-2xl transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`text-sm font-black w-6 text-center ${idx === 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                        #{idx + 1}
                                    </div>
                                    <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[150px] md:max-w-[250px]">
                                        {cliente.nome}
                                    </p>
                                </div>
                                <p className="text-sm font-black text-primary">
                                    R$ {cliente.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resumo da Base */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Volume Operacional</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estatísticas Gerais</p>
                        </div>
                        <div className="size-10 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                            <Icons.Settings size={20} />
                        </div>
                    </div>
                    <div className="p-4 md:p-6 grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2">
                            <Icons.Clientes className="text-slate-400 mb-1" size={24} />
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">{clientes?.length || 0}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clientes Ativos</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2">
                            <Icons.Orcamentos className="text-slate-400 mb-1" size={24} />
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white">{orcamentos?.length || 0}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Propostas</p>
                        </div>
                        <div className="col-span-2 bg-red-50 dark:bg-red-900/10 rounded-3xl p-4 flex items-center justify-between border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-red-100 dark:bg-red-900/40 text-red-500 rounded-xl flex items-center justify-center">
                                    <Icons.Close size={20} />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-red-600 dark:text-red-400">{metrics?.totalCancelados}</h4>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500/70">Orçamentos Perdidos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Relatorios;
