import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Clientes: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const { data: clientes, isLoading } = useQuery({
        queryKey: ['clientes-list-full'],
        queryFn: async () => (await api.get('/clientes.php')).data,
    });

    const mutation = useMutation({
        mutationFn: (data: any) => editingItem ? api.put('/clientes.php', data) : api.post('/clientes.php', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes-list-full'] });
            setIsModalOpen(false);
            setEditingItem(null);
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: editingItem?.id,
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            cpf_cnpj: formData.get('cpf_cnpj'),
            endereco: formData.get('endereco'),
        };
        mutation.mutate(data);
    };

    if (isLoading) return <div className="p-8">Carregando base de clientes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Clientes size={28} className="text-primary" />
                        Base de Clientes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão de contatos e faturamento.</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all font-sans"
                >
                    <Icons.Add size={18} />
                    Cadastrar Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientes?.map((c: any) => (
                    <div key={c.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                <Icons.Clientes size={24} />
                            </div>
                            <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="text-slate-400 hover:text-primary transition-colors">
                                <Icons.Settings size={18} />
                            </button>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.nome}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{c.email || 'Email não cadastrado'}</p>
                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="text-primary truncate">{c.telefone || '(00) 0000-0000'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>DOC: {c.cpf_cnpj || '---'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><Icons.Close size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] font-black uppercase text-slate-400">Nome Completo / Razão Social</label>
                                <input name="nome" defaultValue={editingItem?.nome} required className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">WhatsApp / Tel</label>
                                    <input name="telefone" defaultValue={editingItem?.telefone} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">CPF / CNPJ</label>
                                    <input name="cpf_cnpj" defaultValue={editingItem?.cpf_cnpj} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary" />
                                </div>
                            </div>
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] font-black uppercase text-slate-400">E-mail</label>
                                <input name="email" type="email" defaultValue={editingItem?.email} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary" />
                            </div>
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] font-black uppercase text-slate-400">Endereço Completo</label>
                                <textarea name="endereco" defaultValue={editingItem?.endereco} className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary h-20" />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Salvar Cadastro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;
