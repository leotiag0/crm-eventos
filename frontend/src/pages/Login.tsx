import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const { data: config } = useQuery({
        queryKey: ['configuracoes-publicas'],
        queryFn: async () => (await api.get('/configuracoes.php')).data,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    useEffect(() => {
        if (config?.cor_primaria) {
            const root = window.document.documentElement;
            root.style.setProperty('--color-primary', config.cor_primaria);
            root.style.setProperty('--color-primary-dark', config.cor_secundaria || config.cor_primaria);
        }
    }, [config]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, senha);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-black p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-primary/10 rounded-3xl">
                        <div className="size-24 rounded-2xl bg-white flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden border border-slate-100 dark:border-white/10">
                            {config?.logo_path ? (
                                <img src={config.logo_path} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="bg-primary w-full h-full flex items-center justify-center">
                                    <Icons.Dashboard size={40} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {config?.nome_empresa || 'Bem-vindo ao CRM'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Gestão Operacional WA Produções</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                            <Icons.Close size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Icons.Search size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary focus:border-transparent dark:text-white transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Icons.Close size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary focus:border-transparent dark:text-white transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? 'Entrando...' : 'Acessar Sistema'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    © {new Date().getFullYear()} {config?.nome_empresa || 'WA Produções'} - Todos os direitos reservados
                </p>
            </div>
        </div>
    );
};

export default Login;
