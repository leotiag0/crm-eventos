import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Dashboard: React.FC = () => {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=overview');
            return res.data;
        },
        refetchInterval: 30000,
    });

    const { data: usoEquip, isLoading: usoLoading } = useQuery({
        queryKey: ['uso-equipamentos'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=uso_equipamentos');
            return res.data;
        },
    });

    const { data: alertas, isLoading: alertasLoading } = useQuery({
        queryKey: ['alertas-manutencao'],
        queryFn: async () => {
            const res = await api.get('/dashboards.php?type=manutencao');
            return res.data;
        },
    });

    const cards = [
        { label: 'Equipamentos no Catálogo', value: stats?.total_equipamentos || 0, icon: Icons.Equipamentos, color: 'bg-blue-500' },
        { label: 'Orçamentos Ativos', value: stats?.orcamentos_ativos || 0, icon: Icons.Orcamentos, color: 'bg-purple-500' },
        { label: 'Total de Clientes', value: stats?.total_clientes || 0, icon: Icons.Clientes, color: 'bg-emerald-500' },
        { label: 'Faturamento Total (R$)', value: stats?.faturamento_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00', icon: Icons.Dashboard, color: 'bg-amber-500' },
    ];

    if (statsLoading || usoLoading || alertasLoading) {
        return <div className="p-8 text-center animate-pulse">Carregando painel de comando...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Central de Comando</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Visão geral em tempo real da WA Produções.</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${card.color} text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{card.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Alerts Panel */}
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

                {/* Top Equipment Ranking */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white italic uppercase tracking-wider text-sm">Top 10 Equipamentos Populares</h3>
                    </div>
                    <div className="overflow-x-auto">
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
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
