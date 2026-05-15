import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [viewDate, setViewDate] = useState(new Date());

    /**
     * BUSCA DE DADOS (React Query)
     * Centralizamos as chamadas de API para aproveitar o cache e estados de loading.
     */
    const { data: config } = useQuery({
        queryKey: ['configuracoes-publicas'],
        queryFn: async () => (await api.get('/configuracoes.php')).data,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=overview');
            return res.data;
        },
        refetchInterval: 30000,
    });

    const { data: usoEquip, isLoading: usoLoading, isError: usoError } = useQuery({
        queryKey: ['uso-equipamentos'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=uso_equipamentos');
            return res.data;
        },
    });

    const { data: alertas, isLoading: alertasLoading, isError: alertasError } = useQuery({
        queryKey: ['alertas-manutencao'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=manutencao');
            return res.data;
        },
    });

    const { data: calendario, isLoading: calendarioLoading, isError: calendarioError } = useQuery({
        queryKey: ['calendario-full', format(viewDate, 'yyyy-MM')],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=calendario_semanal');
            return res.data;
        },
    });

    const today = new Date();

    // Days to display based on viewMode
    const displayDays = viewMode === 'week'
        ? Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(viewDate, { weekStartsOn: 0 }), i))
        : eachDayOfInterval({
            start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
            end: addDays(startOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 }), 6)
        });

    const conversionRate = stats?.total_orcamentos ? ((stats?.orcamentos_fechados / stats?.total_orcamentos) * 100).toFixed(1) : '0.0';
    const revenueApproved = Number(stats?.faturamento_total || 0);
    const revenuePending = Number(stats?.faturamento_pendente || 0);

    const cards = [
        { label: 'Faturamento Aprovado', value: `R$ ${revenueApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, subtext: `+ R$ ${revenuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes`, icon: Icons.Dashboard, color: 'bg-emerald-500' },
        { label: 'Taxa de Conversão', value: `${conversionRate}%`, subtext: `${stats?.orcamentos_fechados || 0} fechados / ${stats?.orcamentos_perdidos || 0} perdidos`, icon: Icons.Orcamentos, color: 'bg-blue-500' },
        { label: 'Volume de Vendas', value: `${stats?.total_orcamentos || 0} Orçamentos`, subtext: `${stats?.orcamentos_ativos || 0} ativos no momento`, icon: Icons.List, color: 'bg-purple-500' },
        { label: 'Base de Clientes', value: stats?.total_clientes || 0, subtext: `Catálogo: ${stats?.total_equipamentos || 0} equipamentos`, icon: Icons.Clientes, color: 'bg-amber-500' },
    ];

    const isError = statsError || usoError || alertasError || calendarioError;

    if (statsLoading || usoLoading || alertasLoading || calendarioLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 animate-pulse">
                <Icons.Dashboard size={48} className="text-primary/20" />
                <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Sincronizando painel tático...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 text-center">
                <div className="size-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                    <Icons.Warning size={40} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Falha na Sincronização</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 max-w-xs mx-auto uppercase leading-relaxed">Não foi possível conectar ao servidor de dados. Verifique sua conexão ou tente novamente.</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg"
                >
                    Recarregar Painel
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="px-4 md:px-0">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                    {config?.nome_empresa ? `${config.nome_empresa} - CRM` : 'CRM EVENTOS'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold italic uppercase text-[9px] md:text-[10px] tracking-widest leading-relaxed">Painel Operacional Estratégico</p>
            </div>

            {/* SEÇÃO 1: Calendário Operacional (Semanal/Mensal) */}
            <div className="mx-4 md:mx-0 bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-base md:text-lg">
                            {viewMode === 'week' ? 'Eventos da Semana' : 'Eventos do Mês'}
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Mês
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 p-1">
                            <button
                                onClick={() => setViewDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : addDays(startOfMonth(prev), -1))}
                                className="p-2 hover:text-primary transition-colors"
                            >
                                <Icons.Chevron size={14} className="rotate-180" />
                            </button>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={format(viewDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setViewDate(new Date(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="px-3 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap">
                                    {format(viewDate, viewMode === 'week' ? "dd 'de' MMM" : "MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                            </div>
                            <button
                                onClick={() => setViewDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addDays(endOfMonth(prev), 1))}
                                className="p-2 hover:text-primary transition-colors"
                            >
                                <Icons.Chevron size={14} />
                            </button>
                        </div>
                        <button
                            onClick={() => setViewDate(new Date())}
                            className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm group"
                            title="Hoje"
                        >
                            <Icons.Dashboard size={16} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>
                </div>
                <div className={`flex flex-nowrap overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-7 md:block hide-scrollbar divide-x divide-slate-100 dark:divide-slate-800 ${viewMode === 'month' ? 'md:grid-rows-auto md:divide-y' : ''}`}>
                    {displayDays.map((date, idx) => {
                        const dayEvents = calendario?.filter((e: any) => isSameDay(new Date(e.data_inicio), date));
                        const isToday = isSameDay(date, today);
                        const isCurrentMonth = isSameDay(startOfMonth(date), startOfMonth(viewDate));

                        return (
                            <div key={idx} className={`min-w-[85vw] sm:min-w-[15rem] md:min-w-0 shrink-0 snap-center p-5 md:p-6 min-h-[240px] md:min-h-[180px] space-y-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors border-r border-slate-100 dark:border-slate-800 ${isToday ? 'bg-primary/[0.03]' : ''} ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40 grayscale' : ''}`}>
                                <div className="flex justify-between md:justify-start md:flex-col items-center gap-3 md:gap-1 border-b md:border-none border-slate-50 dark:border-slate-800 pb-3 md:pb-0">
                                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                                        {format(date, 'eee', { locale: ptBR })}
                                    </span>
                                    <span className={`text-base md:text-xl font-black ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                        {format(date, 'dd')}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {dayEvents && dayEvents.length > 0 ? dayEvents.map((evt: any) => (
                                        <div key={evt.id} className="p-2 md:p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group cursor-pointer hover:border-primary transition-all">
                                            <p className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-tight truncate">
                                                {evt.numero_sequencial ? `ORC-${new Date(evt.data_inicio).getFullYear()}-${String(evt.numero_sequencial).padStart(3, '0')}` : `#${evt.id}`}
                                            </p>
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-800 dark:text-slate-200 leading-tight mt-1 truncate">
                                                {evt.nome_evento || evt.cliente_nome}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate">
                                                {format(new Date(evt.data_inicio), 'HH:mm')}h
                                            </p>
                                        </div>
                                    )) : (
                                        <div className="h-full flex items-center justify-center opacity-10 py-4 md:py-10">
                                            <Icons.Orcamentos size={viewMode === 'month' ? 16 : 24} className="grayscale" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEÇÃO 2: Cards de Métricas e KPIs Financeiros */}
            <div className="px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${card.color} text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{card.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{card.value}</p>
                        {card.subtext && <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{card.subtext}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SEÇÃO 3: Painel de Alertas Operacionais (Manutenção Crítica) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Icons.Warning size={18} className="text-amber-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white italic uppercase tracking-wider text-sm">Alertas de Manutenção</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {alertas?.length > 0 ? alertas.map((alerta: any) => (
                            <div key={alerta.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <div className={`mt-1 size-2 rounded-full shrink-0 ${alerta.status === 'Defeito Técnico' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{alerta.nome}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{alerta.status}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-4">
                                <Icons.Success size={32} className="mx-auto text-emerald-500 opacity-20" />
                                <p className="text-xs font-bold text-slate-400 mt-2">Nenhum alerta crítico no momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SEÇÃO 4: Ranking de Equipamentos (Inteligência de Inventário) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white italic uppercase tracking-wider text-sm">Top 10 Equipamentos Populares</h3>
                    </div>
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Locações</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qtd Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {usoEquip?.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-slate-300 dark:text-slate-700 w-4">#{idx + 1}</span>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nome}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {item.total_locacoes}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-primary italic">
                                            {item.qtd_total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile List View */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {usoEquip?.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-300 dark:text-slate-700 w-4">#{idx + 1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.nome}</p>
                                        <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">Locações: <span className="font-bold text-slate-700 dark:text-slate-300">{item.total_locacoes}</span></p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end justify-center">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total</p>
                                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-black shadow-sm">
                                        {item.qtd_total}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!usoEquip || usoEquip.length === 0) && (
                            <div className="p-8 text-center text-sm font-bold text-slate-400">Nenhum dado disponível</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
