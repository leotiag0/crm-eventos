import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Configuracoes: React.FC = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        nome_empresa: '',
        razao_social: '',
        cnpj: '',
        logo_path: '',
        cor_primaria: '#3b82f6',
        cor_secundaria: '#1e40af',
        endereco: '',
        telefone: '',
        email_contato: '',
        site: ''
    });

    const { data: config, isLoading } = useQuery({
        queryKey: ['configuracoes'],
        queryFn: async () => (await api.get('/configuracoes.php')).data
    });

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.post('/configuracoes.php', data),
        onSuccess: () => {
            alert('Configurações atualizadas com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
        },
        onError: (err: any) => {
            alert(`Erro: ${err.response?.data?.error || 'Falha ao atualizar'} `);
        }
    });

    const uploadLogoMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await api.post('/configuracoes.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (data) => {
            setFormData(prev => ({ ...prev, logo_path: data.logo_path }));
            alert('Logo enviada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
        },
        onError: (err: any) => {
            alert(`Erro no upload: ${err.response?.data?.error || 'Falha ao enviar arquivo'} `);
        }
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadLogoMutation.mutate(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-8 text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">Carregando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 text-left pb-20 px-4 md:px-0">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {Icons.Settings && <Icons.Settings size={28} className="text-primary" />}
                    Configurações
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs uppercase tracking-tight">Dados da empresa e identidade visual</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Dados Governamentais & Contato</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Fantasia</label>
                                <input
                                    type="text"
                                    value={formData.nome_empresa}
                                    onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Razão Social</label>
                                <input
                                    type="text"
                                    value={formData.razao_social}
                                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CNPJ</label>
                                <input
                                    type="text"
                                    value={formData.cnpj}
                                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail de Contato</label>
                                <input
                                    type="email"
                                    value={formData.email_contato}
                                    onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Telefone</label>
                                <input
                                    type="text"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Site (URL)</label>
                                <input
                                    type="text"
                                    value={formData.site}
                                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Endereço Completo</label>
                            <textarea
                                value={formData.endereco}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white min-h-[100px]"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Cores do Sistema (Identidade)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.cor_primaria}
                                    onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                                    className="size-12 rounded-xl border-none cursor-pointer"
                                />
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cor Primária</label>
                                    <p className="text-[10px] text-slate-400 font-bold">{formData.cor_primaria}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={formData.cor_secundaria}
                                    onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                                    className="size-12 rounded-xl border-none cursor-pointer"
                                />
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cor Secundária</label>
                                    <p className="text-[10px] text-slate-400 font-bold">{formData.cor_secundaria}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold italic">Nota: Algumas cores exigem build do projeto para refletir globalmente via Tailwind.</p>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-3xl text-white shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Logo da Empresa</h3>
                            <div className="size-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden mx-auto">
                                {formData.logo_path ? (
                                    <img src={formData.logo_path} alt="Logo" className="w-full h-full object-contain p-4" />
                                ) : (
                                    <Icons.Logo size={48} className="text-white/20" />
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">URL do Logo</label>
                                    <input
                                        type="text"
                                        value={formData.logo_path}
                                        onChange={(e) => setFormData({ ...formData, logo_path: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold focus:ring-primary text-white"
                                        placeholder="https://sua-url-aqui.png"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Fazer Upload</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all"
                                    >
                                        {uploadLogoMutation.isPending ? 'Enviando...' : (
                                            <>
                                                <Icons.Dashboard size={14} />
                                                Selecionar Arquivo
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Configuracoes;
