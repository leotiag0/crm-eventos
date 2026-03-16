import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';
import axios from 'axios';

interface ClientFormData {
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
}

const Clientes: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [form, setForm] = useState<ClientFormData>({
        nome: '', email: '', telefone: '', cpf_cnpj: '',
        cep: '', logradouro: '', numero: '', complemento: '',
        bairro: '', cidade: '', uf: ''
    });

    const { data: clientes, isLoading } = useQuery({
        queryKey: ['clientes-list-full'],
        queryFn: async () => (await api.get('/clientes.php')).data,
    });

    useEffect(() => {
        if (editingItem) {
            setForm({
                nome: editingItem.nome || '',
                email: editingItem.email || '',
                telefone: editingItem.telefone || '',
                cpf_cnpj: editingItem.cpf_cnpj || '',
                cep: editingItem.cep || '',
                logradouro: editingItem.logradouro || '',
                numero: editingItem.numero || '',
                complemento: editingItem.complemento || '',
                bairro: editingItem.bairro || '',
                cidade: editingItem.cidade || '',
                uf: editingItem.uf || ''
            });
        } else {
            setForm({ nome: '', email: '', telefone: '', cpf_cnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' });
        }
    }, [editingItem]);

    const mutation = useMutation({
        mutationFn: (data: any) => editingItem ? api.put('/clientes.php', data) : api.post('/clientes.php', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes-list-full'] });
            setIsModalOpen(false);
            setEditingItem(null);
            setErrorMsg(null);
        },
        onError: (error: any) => {
            console.error('Erro na mutation de clientes:', error);
            const serverError = error.response?.data?.error;
            setErrorMsg(serverError || 'Erro ao salvar cliente');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        mutation.mutate({ ...form, id: editingItem?.id });
    };

    const formatDocument = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
        }
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").substring(0, 18);
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
    };

    const handleCnpjLookup = async () => {
        const cnpj = form.cpf_cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) {
            alert('Por favor, insira um CNPJ válido com 14 dígitos.');
            return;
        }

        setIsSearchingCnpj(true);
        try {
            const response = await axios.get(`https://api.opencnpj.org/${cnpj}`);
            const data = response.data;

            if (data && data.razao_social) {
                setForm(prev => ({
                    ...prev,
                    nome: data.razao_social,
                    cep: data.cep || prev.cep,
                    logradouro: data.logradouro || prev.logradouro,
                    numero: data.numero || prev.numero,
                    complemento: data.complemento || prev.complemento,
                    bairro: data.bairro || prev.bairro,
                    cidade: data.municipio || prev.cidade,
                    uf: data.uf || prev.uf,
                    telefone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : prev.telefone,
                    email: data.email || prev.email,
                    cpf_cnpj: formatDocument(cnpj)
                }));
            }
        } catch (error) {
            console.error('Erro ao consultar CNPJ:', error);
            alert('Erro ao consultar CNPJ. Verifique se o número está correto ou tente mais tarde.');
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const handleCepLookup = async () => {
        const cepValue = form.cep.replace(/\D/g, '');
        if (cepValue.length !== 8) return;

        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cepValue}/json/`);
            const data = response.data;

            if (data && !data.erro) {
                setForm(prev => ({
                    ...prev,
                    logradouro: data.logradouro || prev.logradouro,
                    bairro: data.bairro || prev.bairro,
                    cidade: data.localidade || prev.cidade,
                    uf: data.uf || prev.uf
                }));
            }
        } catch (error) {
            console.error('Erro ao consultar CEP:', error);
        }
    };

    if (isLoading) return <div className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Carregando base de clientes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4 md:px-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Clientes size={28} className="text-primary" />
                        Base de Clientes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs uppercase tracking-tight">Gestão de contatos e faturamento.</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all font-sans hover:scale-105"
                >
                    <Icons.Add size={18} />
                    Cadastrar Cliente
                </button>
            </div>

            <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientes?.map((c: any) => (
                    <div key={c.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Icons.Clientes size={28} />
                            </div>
                            <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <Icons.Settings size={18} />
                            </button>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg leading-tight mb-2">{c.nome}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest truncate">{c.email || 'Email não cadastrado'}</p>

                        <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="size-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Icons.Menu size={12} />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.1em]">{c.telefone || 'Sem Telefone'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-[8px]">DOC</div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{c.cpf_cnpj || 'Não Informado'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-xl sm:rounded-[40px] rounded-t-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Preencha os dados abaixo</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary shadow-sm transition-all"><Icons.Close size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto">
                                {errorMsg && (
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="size-8 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                                            <Icons.Close size={16} />
                                        </div>
                                        <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-tight">{errorMsg}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CPF / CNPJ</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={form.cpf_cnpj}
                                                onChange={(e) => setForm({ ...form, cpf_cnpj: formatDocument(e.target.value) })}
                                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCnpjLookup}
                                                disabled={isSearchingCnpj}
                                                className="px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                                            >
                                                {isSearchingCnpj ? '...' : 'Consultar'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo / Razão Social</label>
                                        <input
                                            required
                                            value={form.nome}
                                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">WhatsApp / Tel</label>
                                        <input
                                            value={form.telefone}
                                            onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest pl-1">Informações de Endereço</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">CEP</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={form.cep}
                                                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                                                    onBlur={handleCepLookup}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Logradouro</label>
                                            <input
                                                value={form.logradouro}
                                                onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Número</label>
                                            <input
                                                value={form.numero}
                                                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Complemento</label>
                                            <input
                                                value={form.complemento}
                                                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Bairro</label>
                                            <input
                                                value={form.bairro}
                                                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cidade</label>
                                            <input
                                                value={form.cidade}
                                                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">UF</label>
                                            <input
                                                value={form.uf}
                                                onChange={(e) => setForm({ ...form, uf: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-primary dark:text-white h-12 text-center uppercase"
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={mutation.isPending} className="w-full py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                        {mutation.isPending ? 'PROCESSANDO...' : 'Salvar Cadastro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Clientes;
