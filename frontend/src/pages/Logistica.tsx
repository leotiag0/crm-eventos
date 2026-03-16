import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Logistica: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
    const [movingQuantities, setMovingQuantities] = useState<Record<number, number>>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

    const movementMutation = useMutation({
        mutationFn: (payload: any) => api.post('/logistica.php', payload),
        onSuccess: (res: any) => {
            setSuccessMsg(res.data.message || 'Operação realizada com sucesso!');
            setErrorMsg(null);
            refetchReservas();
            queryClient.invalidateQueries({ queryKey: ['logistica-pendentes'] });
            // Limpar mensagem após 5 segundos
            setTimeout(() => setSuccessMsg(null), 5000);
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || 'Erro ao processar movimentação';
            setErrorMsg(message);
            setSuccessMsg(null);
        }
    });

    const handleBatchCheckout = () => {
        const itens = Object.entries(movingQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({
                equipamento_id: reservas.find((r: any) => r.id === Number(id)).equipamento_id,
                reserva_id: Number(id),
                quantidade: qty
            }));

        if (itens.length === 0) return alert('Selecione quantidades para saída');

        movementMutation.mutate({
            tipo: 'checkout',
            orcamento_id: selectedOrcamento.id,
            itens
        });
    };

    const handleSingleAction = (reserva: any, tipo: 'SAIDA' | 'ENTRADA', statusItem: string = 'Disponível') => {
        const qty = movingQuantities[reserva.id] || 0;
        if (qty <= 0) return alert('Informe a quantidade');

        movementMutation.mutate({
            tipo: tipo === 'SAIDA' ? 'checkout' : 'checkin',
            orcamento_id: selectedOrcamento.id,
            itens: [{
                equipamento_id: reserva.equipamento_id,
                reserva_id: reserva.id,
                quantidade: qty,
                status_item: statusItem
            }]
        });
    };

    const updateQty = (id: number, max: number, val: number) => {
        setMovingQuantities({ ...movingQuantities, [id]: Math.max(0, Math.min(max, val)) });
    };

    if (isLoading) return <div className="p-8">Carregando painel logístico...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Icons.Logistica size={28} className="text-primary" />
                    Logística & Galpão
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs uppercase tracking-tight">Rastreabilidade de movimentação.</p>
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
                                <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded">
                                    {o.numero_sequencial ? `ORC-${new Date(o.data_inicio).getFullYear()}-${String(o.numero_sequencial).padStart(3, '0')}` : `#${o.id}`}
                                </span>
                                <Icons.Chevron className="text-slate-300 group-hover:translate-x-1 transition-transform" size={18} />
                            </div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{o.cliente_nome}</p>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase">{new Date(o.data_inicio).toLocaleDateString()} - {o.nome_evento || 'Sem Nome'}</p>
                            <div className="mt-6 flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500"></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Disponível para Expedição</p>
                            </div>
                        </div>
                    ))}
                    {orcamentos?.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Icons.Success className="mx-auto text-slate-200" size={48} />
                            <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Tudo em dia! Sem pendências de movimentação.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-right-8 duration-300">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <button
                                onClick={() => { setSelectedOrcamento(null); setMovingQuantities({}); }}
                                className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline mb-2"
                            >
                                <Icons.Chevron size={14} className="rotate-180" /> Voltar para lista
                            </button>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Painel de Movimentação: {selectedOrcamento.cliente_nome}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase">{selectedOrcamento.nome_evento}</p>
                        </div>
                        <button
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                            onClick={() => window.open(`/romaneio/${selectedOrcamento.id}`, '_blank')}
                        >
                            <Icons.Printer size={16} /> Romaneio de Conferência
                        </button>
                    </div>

                    <div className="p-8">
                        {errorMsg && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="size-8 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                                    <Icons.Close size={16} />
                                </div>
                                <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-tight">{errorMsg}</p>
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="size-8 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
                                    <Icons.Menu size={16} />
                                </div>
                                <p className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-tight">{successMsg}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {reservas?.map((r: any) => (
                                <div
                                    key={r.id}
                                    className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border-2 transition-all ${(movingQuantities[r.id] || 0) > 0 ? 'bg-primary/5 border-primary/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                                >
                                    <div className="flex-1 w-full">
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.equipamento_nome}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reserva total: {r.qtd}</p>
                                            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Status: Ativa</p>
                                        </div>
                                    </div>

                                    {/* Quantity Picker */}
                                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl w-full md:w-auto justify-between">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Movimentar:</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQty(r.id, r.qtd, (movingQuantities[r.id] || 0) - 1)} className="size-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary shadow-sm border border-slate-200 dark:border-slate-700">-</button>
                                            <input
                                                type="number"
                                                className="w-12 bg-transparent border-none text-center font-black text-sm p-0 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={movingQuantities[r.id] || 0}
                                                onChange={(e) => updateQty(r.id, r.qtd, parseInt(e.target.value) || 0)}
                                            />
                                            <button onClick={() => updateQty(r.id, r.qtd, (movingQuantities[r.id] || 0) + 1)} className="size-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary shadow-sm border border-slate-200 dark:border-slate-700">+</button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => handleSingleAction(r, 'SAIDA')}
                                            disabled={(movingQuantities[r.id] || 0) <= 0}
                                            className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                        >
                                            <Icons.Logistica size={14} /> Saída
                                        </button>
                                        <div className="flex gap-1 h-full">
                                            <button
                                                onClick={() => handleSingleAction(r, 'ENTRADA', 'Disponível')}
                                                disabled={(movingQuantities[r.id] || 0) <= 0}
                                                className="size-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 disabled:opacity-30 transition-all"
                                                title="Entrada OK"
                                            >
                                                <Icons.Success size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleSingleAction(r, 'ENTRADA', 'Defeito Técnico')}
                                                disabled={(movingQuantities[r.id] || 0) <= 0}
                                                className="size-11 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 hover:scale-105 disabled:opacity-30 transition-all"
                                                title="Entrada com Defeito"
                                            >
                                                <Icons.Error size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">* Utilize os botões laterais para registrar cada item individualmente.</p>
                            <button
                                onClick={handleBatchCheckout}
                                disabled={Object.values(movingQuantities).every(v => v === 0)}
                                className="px-12 py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all"
                            >
                                Registrar Saída em Lote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logistica;
