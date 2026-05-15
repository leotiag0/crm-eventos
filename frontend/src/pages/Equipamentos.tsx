import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Equipamentos: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Busca a lista completa de equipamentos com detalhes de estoque quádruplo
    const { data: equipamentos, isLoading } = useQuery({
        queryKey: ['equipamentos-list-full'],
        queryFn: async () => (await api.get('/equipamentos.php')).data,
    });

    // Mutação para criação ou edição de equipamentos
    const mutation = useMutation({
        mutationFn: (data: any) => editingItem ? api.put('/equipamentos.php', data) : api.post('/equipamentos.php', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipamentos-list-full'] });
            setIsModalOpen(false);
            setEditingItem(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/equipamentos.php?id=${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipamentos-list-full'] }),
    });

    /**
     * Processa o envio do formulário de equipamento.
     * Mapeia os quatro estados de estoque: Total, Disponível, Manutenção e Defeito.
     */
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: editingItem?.id,
            nome: formData.get('nome'),
            descricao: formData.get('descricao'),
            valor_diaria: formData.get('valor_diaria'),
            estoque_total: formData.get('estoque_total'),
            estoque_disponivel: formData.get('estoque_disponivel'),
            estoque_manutencao: formData.get('estoque_manutencao'),
            estoque_defeito: formData.get('estoque_defeito'),
            fabricante: formData.get('fabricante'),
            numero_serie: formData.get('numero_serie'),
            status: formData.get('status'),
        };
        mutation.mutate(data);
    };

    if (isLoading) return <div className="p-8">Carregando catálogo...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Equipamentos size={28} className="text-primary" />
                        Catálogo Técnico
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão de inventário e preços base.</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Icons.Add size={18} />
                    Novo Item
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Equipamento</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fabricante</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Preço/Diária</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status do Estoque</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {equipamentos?.map((e: any) => (
                            <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{e.nome}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{e.descricao}</p>
                                    {e.numero_serie && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">S/N: {e.numero_serie}</p>}
                                </td>
                                <td className="px-8 py-5 text-center text-[10px] font-black text-slate-500 uppercase">
                                    {e.fabricante || '---'}
                                </td>
                                <td className="px-8 py-5 text-center text-sm font-black text-primary italic">
                                    R$ {parseFloat(e.valor_diaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{e.estoque_total} un</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <div className="size-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold text-emerald-600">{e.estoque_disponivel}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="size-1.5 rounded-full bg-amber-500" />
                                                <span className="text-[10px] font-bold text-amber-600">{e.estoque_manutencao}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="size-1.5 rounded-full bg-red-500" />
                                                <span className="text-[10px] font-bold text-red-600">{e.estoque_defeito}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right space-x-2">
                                    <button onClick={() => { setEditingItem(e); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors"><Icons.Chevron size={20} /></button>
                                    <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(e.id); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Icons.Close size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal - Simplificado */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{editingItem ? 'Editar Item' : 'Novo Equipamento'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><Icons.Close size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Nome</label>
                                    <input name="nome" defaultValue={editingItem?.nome} required className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Diária (R$)</label>
                                    <input name="valor_diaria" type="number" step="0.01" defaultValue={editingItem?.valor_diaria} required className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Fabricante</label>
                                    <input name="fabricante" defaultValue={editingItem?.fabricante} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Nº de Série</label>
                                    <input name="numero_serie" defaultValue={editingItem?.numero_serie} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white" />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Separação de Estoque</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400">Total</label>
                                        <input name="estoque_total" type="number" defaultValue={editingItem?.estoque_total || 0} required className="w-full bg-white dark:bg-slate-900 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-emerald-500">Disponível</label>
                                        <input name="estoque_disponivel" type="number" defaultValue={editingItem?.estoque_disponivel || 0} required className="w-full bg-white dark:bg-slate-900 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-amber-500">Manutenção</label>
                                        <input name="estoque_manutencao" type="number" defaultValue={editingItem?.estoque_manutencao || 0} required className="w-full bg-white dark:bg-slate-900 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-red-500">Defeito</label>
                                        <input name="estoque_defeito" type="number" defaultValue={editingItem?.estoque_defeito || 0} required className="w-full bg-white dark:bg-slate-900 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Status Geral (Exibição)</label>
                                <select name="status" defaultValue={editingItem?.status || 'Disponível'} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white transition-all">
                                    <option>Disponível</option>
                                    <option>Parcialmente Disponível</option>
                                    <option>Em Manutenção</option>
                                    <option>Defeito Técnico</option>
                                    <option>Indisponível</option>
                                </select>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/30 transition-all">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipamentos;
