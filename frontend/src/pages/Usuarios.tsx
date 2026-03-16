import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

interface User {
    id: number;
    nome: string;
    email: string;
    papel_id: number;
    papel_nome: string;
    papel_slug: string;
    created_at: string;
}

const Usuarios: React.FC = () => {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        papel_id: ''
    });

    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => (await api.get('/usuarios.php?action=list')).data
    });

    const { data: papeis } = useQuery({
        queryKey: ['papeis'],
        queryFn: async () => (await api.get('/usuarios.php?action=papeis')).data
    });

    const saveMutation = useMutation({
        mutationFn: (data: any) => api.post('/usuarios.php?action=save', data),
        onSuccess: () => {
            alert('Usuário salvo com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            handleCloseModal();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/usuarios.php?id=${id}`),
        onSuccess: () => {
            alert('Usuário excluído!');
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
        }
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            nome: user.nome,
            email: user.email,
            senha: '',
            papel_id: String(user.papel_id)
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nome: '', email: '', senha: '', papel_id: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({ ...formData, id: editingUser?.id });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 text-left pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {Icons.Clientes && <Icons.Clientes size={28} className="text-primary" />}
                        Gerenciamento de Usuários
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Controle de acesso e atribuição de papéis</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    {Icons.Add && <Icons.Add size={18} />}
                    Novo Usuário
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome / E-mail</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Papel</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Criado em</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users?.map((user: User) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">{user.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.papel_slug === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                        {user.papel_nome}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] font-bold text-slate-500">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-xl"
                                        >
                                            {Icons.Settings && <Icons.Settings size={16} />}
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Excluir usuário?')) deleteMutation.mutate(user.id); }}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl"
                                        >
                                            {Icons.Close && <Icons.Close size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-primary transition-colors">
                                <Icons.Close size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                                    Senha {editingUser && '(deixe em branco para manter)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.senha}
                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Papel / Nível</label>
                                <select
                                    required
                                    value={formData.papel_id}
                                    onChange={(e) => setFormData({ ...formData, papel_id: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    {papeis?.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                            >
                                {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
