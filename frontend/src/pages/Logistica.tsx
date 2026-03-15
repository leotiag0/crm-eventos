import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Logistica: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    // Query: Orçamentos Aprovados para Logística
    const { data: orcamentos, isLoading } = useQuery({
        queryKey: ['logistica-pendentes'],
        queryFn: async () => (await api.get('/logistica.php')).data,
    });

    // Query: Itens de um orçamento específico (Reservas)
    const { data: reservas, refetch: refetchReservas } = useQuery({
        queryKey: ['logistica-reservas', selectedOrcamento?.id],
        queryFn: async () => (await api.get(`/logistica.php?orcamento_id=${selectedOrcamento.id}`)).data,
        enabled: !!selectedOrcamento,
    });

    const checkOutMutation = useMutation({
        mutationFn: (id: number) => api.post('/logistica.php', { tipo: 'checkout', orcamento_id: id }),
        onSuccess: () => {
            alert('Check-out concluído! Lista de locação gerada.');
            setSelectedOrcamento(null);
            queryClient.invalidateQueries({ queryKey: ['logistica-pendentes'] });
        }
    });

    const checkInMutation = useMutation({
        mutationFn: (payload: any) => api.post('/logistica.php', payload),
        onSuccess: () => {
            alert('Check-in processado. Inventário atualizado.');
            setSelectedOrcamento(null);
            queryClient.invalidateQueries({ queryKey: ['logistica-pendentes'] });
        }
    });

    const handleCheckInItem = (reserva: any, status: string) => {
        const payload = {
            tipo: 'checkin',
            itens: [{
                equipamento_id: reserva.equipamento_id,
                reserva_id: reserva.id,
                status_item: status
            }]
        };
        checkInMutation.mutate(payload);
    };

    if (isLoading) return <div className="p-8">Carregando painel logístico...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Icons.Logistica size={28} className="text-primary" />
                    Logística & Galpão
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Controle de entrada e saída de equipamentos.</p>
            </div>

            {!selectedOrcamento ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orcamentos?.map((o: any) => (
                        <div
                            key={o.id}
                            onClick={() => setSelectedOrcamento(o)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary cursor-pointer transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded">ID #{o.id}</span>
                                <Icons.Chevron className="text-slate-300 group-hover:translate-x-1 transition-transform" size={18} />
                            </div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{o.cliente_nome}</p>
                            <p className="text-xs text-slate-500 font-bold mt-1">{o.data_inicio} até {o.data_fim}</p>
                            <div className="mt-6 flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500"></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aguardando Expedição</p>
                            </div>
                        </div>
                    ))}
                    {orcamentos?.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Icons.Success className="mx-auto text-slate-200" size={48} />
                            <p className="text-slate-400 font-bold mt-4 uppercase text-xs tracking-widest">Tudo em dia! Sem pendências logísticas.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-right-8 duration-300">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <div>
                            <button
                                onClick={() => setSelectedOrcamento(null)}
                                className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline mb-2"
                            >
                                ← Voltar para lista
                            </button>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Checkout: {selectedOrcamento.cliente_nome}</h3>
                            <p className="text-xs text-slate-500 font-bold">Verifique os itens antes do carregamento.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Progresso</p>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(Object.values(checkedItems).filter(Boolean).length / (reservas?.length || 1)) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {Object.values(checkedItems).filter(Boolean).length}/{reservas?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reservas?.map((r: any) => (
                                <div
                                    key={r.id}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${checkedItems[r.id] ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-500/10' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                                    onClick={() => setCheckedItems({ ...checkedItems, [r.id]: !checkedItems[r.id] })}
                                >
                                    <div className={`size-8 rounded-lg flex items-center justify-center border-2 transition-all ${checkedItems[r.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-600'}`}>
                                        {checkedItems[r.id] && <Icons.Success size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-black uppercase tracking-tight ${checkedItems[r.id] ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{r.equipamento_nome}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">Qtd: {r.qtd}</p>
                                    </div>

                                    {/* Health Status Buttons (Visible after checkout or for individual check-in) */}
                                    <div className="flex gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleCheckInItem(r, 'Disponível')}
                                            className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
                                            title="OK - Disponível"
                                        >
                                            <Icons.Success size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleCheckInItem(r, 'Necessita Manutenção Preventiva')}
                                            className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all"
                                            title="Desgaste/Revisão"
                                        >
                                            <Icons.Warning size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleCheckInItem(r, 'Defeito Técnico')}
                                            className="size-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 hover:scale-110 active:scale-95 transition-all"
                                            title="Defeito - Bloquear"
                                        >
                                            <Icons.Error size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={() => checkOutMutation.mutate(selectedOrcamento.id)}
                                disabled={Object.values(checkedItems).filter(Boolean).length < (reservas?.length || 0)}
                                className="px-12 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all"
                            >
                                Finalizar Expedição Completa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logistica;
