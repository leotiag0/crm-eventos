import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';
import { format, addDays } from 'date-fns';

interface ItemBudget {
    equipamento_id: number;
    nome: string;
    quantidade: number;
    valor_unitario: number;
    secao: string;
}

interface Orcamento {
    id: number;
    cliente_id: number;
    cliente_nome: string;
    data_inicio: string;
    data_fim: string;
    valor_total: string;
    status: string;
    tipo_cobranca: 'DIARIA' | 'EVENTO';
    nome_evento: string;
    endereco_evento: string;
    numero_sequencial: number;
    created_at: string;
    itens?: any[];
}

const Orcamentos: React.FC = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Form States
    const [items, setItems] = useState<ItemBudget[]>([]);
    const [sections, setSections] = useState<string[]>(['Geral', 'Palco', 'Cabine']);
    const [activeSection, setActiveSection] = useState('Geral');
    const [newSectionName, setNewSectionName] = useState('');
    const [clienteId, setClienteId] = useState<number | ''>('');
    const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd HH:mm'));
    const [dataFim, setDataFim] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd HH:mm'));
    const [tipoCobranca, setTipoCobranca] = useState<'DIARIA' | 'EVENTO'>('DIARIA');
    const [nomeEvento, setNomeEvento] = useState('');
    const [enderecoEvento, setEnderecoEvento] = useState('');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [quickClientForm, setQuickClientForm] = useState({ nome: '', cpf_cnpj: '', email: '', telefone: '' });
    const [condicoesPagamento, setCondicoesPagamento] = useState('À vista no fechamento ou 50% ato e 50% na montagem.');
    const [condicoesFornecimento, setCondicoesFornecimento] = useState('Incluso transporte e montagem padrão. Diária de 12 horas.');
    const [validadeProposta, setValidadeProposta] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const [history, setHistory] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [clientErrorMsg, setClientErrorMsg] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Queries
    const { data: orcamentos } = useQuery({
        queryKey: ['orcamentos-list'],
        queryFn: async () => (await api.get('/orcamentos.php')).data,
        enabled: view === 'list'
    });

    const { data: clientes } = useQuery({
        queryKey: ['clientes-list'],
        queryFn: async () => (await api.get('/clientes.php')).data,
    });

    const { data: equipamentos } = useQuery({
        queryKey: ['equipamentos-search', searchTerm],
        queryFn: async () => (await api.get(`/equipamentos.php`)).data,
        enabled: searchTerm.length > 0,
    });

    const { data: config } = useQuery({
        queryKey: ['configuracoes-publicas'],
        queryFn: async () => (await api.get('/configuracoes.php')).data,
    });

    const filteredEquip = equipamentos?.filter((e: any) =>
        e.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    // Actions
    const resetForm = () => {
        setItems([]);
        setClienteId('');
        setSelectedId(null);
        setDataInicio(format(new Date(), 'yyyy-MM-dd HH:mm'));
        setDataFim(format(addDays(new Date(), 1), 'yyyy-MM-dd HH:mm'));
    };

    const handleEdit = async (orc: Orcamento) => {
        const fullOrc = (await api.get(`/orcamentos.php?id=${orc.id}`)).data;
        setSelectedId(fullOrc.id);
        setClienteId(fullOrc.cliente_id);
        setDataInicio(format(new Date(fullOrc.data_inicio), 'yyyy-MM-dd HH:mm'));
        setDataFim(format(new Date(fullOrc.data_fim), 'yyyy-MM-dd HH:mm'));
        setTipoCobranca(fullOrc.tipo_cobranca);
        setNomeEvento(fullOrc.nome_evento || '');
        setEnderecoEvento(fullOrc.endereco_evento || '');
        setCondicoesPagamento(fullOrc.condicoes_pagamento || '');
        setCondicoesFornecimento(fullOrc.condicoes_fornecimento || '');
        setValidadeProposta(fullOrc.validade_proposta || format(addDays(new Date(), 7), 'yyyy-MM-dd'));
        setHistory(fullOrc.historico || []);

        const loadedItems = fullOrc.itens.map((i: any) => ({
            equipamento_id: i.equipamento_id,
            nome: i.equipamento_nome || i.descricao_snapshot,
            quantidade: i.quantidade,
            valor_unitario: parseFloat(i.valor_unitario_snapshot),
            secao: i.secao
        }));
        setItems(loadedItems);

        // Ensure sections exist
        const uniqueSections = Array.from(new Set([...sections, ...loadedItems.map((i: any) => i.secao)]));
        setSections(uniqueSections);

        setView('edit');
    };

    const calculateTotals = () => {
        let subtotal = 0;
        const diffTime = Math.abs(new Date(dataFim).getTime() - new Date(dataInicio).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        items.forEach(item => {
            if (tipoCobranca === 'DIARIA') {
                subtotal += item.quantidade * item.valor_unitario * diffDays;
            } else {
                subtotal += item.quantidade * item.valor_unitario;
            }
        });

        return subtotal;
    };

    const addItem = (equip: any) => {
        const existing = items.find(i => i.equipamento_id === equip.id && i.secao === activeSection);
        if (existing) {
            updateQtd(equip.id, activeSection, existing.quantidade + 1);
        } else {
            setItems([...items, {
                equipamento_id: equip.id,
                nome: equip.nome,
                quantidade: 1,
                valor_unitario: parseFloat(equip.valor_diaria),
                secao: activeSection
            }]);
        }
        setSearchTerm('');
        setShowResults(false);
    };

    const updateQtd = (id: number, secao: string, val: number) => {
        setItems(items.map(i => (i.equipamento_id === id && i.secao === secao) ? { ...i, quantidade: Math.max(1, val) } : i));
    };

    const submitMutation = useMutation({
        mutationFn: (payload: any) => api.post('/orcamentos.php', payload),
        onSuccess: (res) => {
            setSuccessMsg(`Sucesso! Orçamento ${res.data.id} processado.`);
            setErrorMsg(null);
            if (res.data.id) window.open(`/proposta/${res.data.id}`, '_blank');
            queryClient.invalidateQueries({ queryKey: ['orcamentos-list'] });

            setTimeout(() => {
                setView('list');
                resetForm();
                setSuccessMsg(null);
            }, 3000);
        },
        onError: (err: any) => {
            console.error('Erro na mutation de orçamentos:', err);
            setErrorMsg(err.response?.data?.error || 'Falha ao processar orçamento');
            setSuccessMsg(null);
        }
    });

    const handleAction = (action: 'save' | 'approve') => {
        if (!clienteId) return alert('Selecione um cliente');
        if (items.length === 0) return alert('Adicione itens ao orçamento');


        const payload: any = {
            action,
            cliente_id: Number(clienteId),
            data_inicio: dataInicio.replace('T', ' ') + ':00',
            data_fim: dataFim.replace('T', ' ') + ':00',
            tipo_cobranca: tipoCobranca,
            nome_evento: nomeEvento,
            endereco_evento: enderecoEvento,
            valor_total: calculateTotals(),
            condicoes_pagamento: condicoesPagamento,
            condicoes_fornecimento: condicoesFornecimento,
            validade_proposta: validadeProposta,
            itens: items,
            status: action === 'approve' ? 'Aprovado' : 'Rascunho'
        };
        if (selectedId) payload.id = selectedId;

        submitMutation.mutate(payload);
    };

    const handleQuickClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setClientErrorMsg(null);
        try {
            const res = await api.post('/clientes.php', quickClientForm);
            if (res.data.status === 'success') {
                await queryClient.invalidateQueries({ queryKey: ['clientes-list'] });
                setClienteId(res.data.id);
                setIsClientModalOpen(false);
                setQuickClientForm({ nome: '', cpf_cnpj: '', email: '', telefone: '' });
                setClientErrorMsg(null);
            }
        } catch (error: any) {
            console.error('Erro no cadastro rápido de cliente:', error);
            const message = error.response?.data?.error || 'Erro ao cadastrar cliente';
            setClientErrorMsg(message);
        }
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 text-left px-4 md:px-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {Icons.Orcamentos && <Icons.Orcamentos size={28} className="text-primary" />}
                            Orçamentos
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs uppercase tracking-tight">Gestão de propostas e reservas</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setView('edit'); }}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {Icons.Add && <Icons.Add size={18} />}
                        Novo Orçamento
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[24px] md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">ID / Data</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Período</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Valor Total</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {orcamentos?.map((orc: Orcamento) => (
                                <tr key={orc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {orc.numero_sequencial ? `ORC-${new Date(orc.data_inicio).getFullYear()}-${String(orc.numero_sequencial).padStart(3, '0')}` : `#${orc.id}`}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold">{format(new Date(orc.created_at), 'dd/MM/yyyy')}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-primary uppercase">{orc.cliente_nome}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] font-bold dark:text-slate-300">
                                            {format(new Date(orc.data_inicio), 'dd/MM')} até {format(new Date(orc.data_fim), 'dd/MM')}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                            R$ {parseFloat(orc.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${orc.status === 'Aprovado' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                                            orc.status === 'Cancelado' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                                'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                                            }`}>
                                            {orc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(orc)}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-xl"
                                                title="Editar"
                                            >
                                                <Icons.Settings size={16} />
                                            </button>
                                            <button
                                                onClick={() => window.open(`/proposta/${orc.id}`, '_blank')}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-xl"
                                                title="Imprimir / PDF"
                                            >
                                                <Icons.Printer size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orcamentos?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200">
                                                <Icons.Orcamentos size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum orçamento encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Editor View
    return (
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 pb-32 animate-in fade-in slide-in-from-right-4 duration-500 text-left px-4 md:px-0">
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => setView('list')} className="text-slate-400 hover:text-primary transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <Icons.Chevron className="rotate-180" size={18} />
                        </button>
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="size-10 md:size-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-slate-200 dark:border-white/10 shrink-0">
                                {config?.logo_path ? (
                                    <img src={config.logo_path} alt="Logo" className="w-full h-full object-contain p-1.5 md:p-2" />
                                ) : (
                                    <Icons.Dashboard size={20} className="text-primary" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white leading-none">
                                    {selectedId ? `Orçamento #${selectedId}` : 'Novo Orçamento'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-tight">
                                    {config?.nome_empresa || 'WA Produções'} - Montagem Técnica
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="size-8 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                            <Icons.Close size={16} />
                        </div>
                        <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-tight">{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="size-8 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
                            <Icons.Add size={16} />
                        </div>
                        <p className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-tight">{successMsg}</p>
                    </div>
                )}

                {/* Setup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-1.5 lg:col-span-2">
                        <div className="flex justify-between items-center pr-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cliente</label>
                            <button
                                onClick={() => setIsClientModalOpen(true)}
                                className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                                + Novo Cliente
                            </button>
                        </div>
                        <select
                            value={clienteId}
                            onChange={(e) => setClienteId(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        >
                            <option value="">Selecione...</option>
                            {clientes?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Início</label>
                        <input
                            type="datetime-local"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Fim</label>
                        <input
                            type="datetime-local"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Validade da Proposta</label>
                        <input
                            type="date"
                            value={validadeProposta}
                            onChange={(e) => setValidadeProposta(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome do Evento</label>
                        <input
                            placeholder="Ex: Casamento Marina & João"
                            value={nomeEvento}
                            onChange={(e) => setNomeEvento(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cobrança</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setTipoCobranca('DIARIA')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${tipoCobranca === 'DIARIA' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'}`}
                            >
                                DIÁRIA
                            </button>
                            <button
                                onClick={() => setTipoCobranca('EVENTO')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${tipoCobranca === 'EVENTO' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'}`}
                            >
                                EVENTO
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Local do Evento</label>
                        <input
                            placeholder="Endereço completo da montagem"
                            value={enderecoEvento}
                            onChange={(e) => setEnderecoEvento(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:ring-primary dark:text-white"
                        />
                    </div>
                </div>

                {/* Conditions Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Condições de Pagamento</label>
                        <textarea
                            value={condicoesPagamento}
                            onChange={(e) => setCondicoesPagamento(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white min-h-[80px]"
                            placeholder="Ex: 50% ato, 50% entrega..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Condições de Fornecimento</label>
                        <textarea
                            value={condicoesFornecimento}
                            onChange={(e) => setCondicoesFornecimento(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-xs font-bold focus:ring-primary dark:text-white min-h-[80px]"
                            placeholder="Ex: Incluso transporte, montagem..."
                        />
                    </div>
                </div>

                {/* Sections Management */}
                <div className="flex flex-wrap gap-2 items-center">
                    {sections.map(s => (
                        <button
                            key={s}
                            onClick={() => setActiveSection(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${activeSection === s ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                        >
                            {s}
                        </button>
                    ))}
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 ml-2">
                        <input
                            type="text"
                            placeholder="Nova seção..."
                            className="bg-transparent border-none text-xs font-bold w-24 focus:ring-0 dark:text-white pl-2"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                if (!newSectionName) return;
                                if (sections.includes(newSectionName)) return alert('Seção já existe');
                                setSections([...sections, newSectionName]);
                                setActiveSection(newSectionName);
                                setNewSectionName('');
                            }}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"
                        >
                            {Icons.Add && <Icons.Add size={14} />}
                        </button>
                    </div>
                </div>

                {/* Omnibox Search */}
                <div className="relative mx-1" ref={searchRef}>
                    <div className="group relative">
                        {Icons.Search && <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />}
                        <input
                            type="text"
                            placeholder={`Na seção ${activeSection.toUpperCase()}...`}
                            className="w-full pl-12 pr-4 py-3 md:py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:border-primary focus:ring-0 text-base md:text-lg font-bold placeholder:font-medium transition-all dark:text-white"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                            onFocus={() => setShowResults(true)}
                        />
                    </div>

                    {showResults && filteredEquip && filteredEquip.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredEquip.map((e: any) => (
                                <button
                                    key={e.id}
                                    onClick={() => addItem(e)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 text-left transition-colors group"
                                >
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{e.nome}</p>
                                        <p className="text-xs text-slate-500 font-bold">R$ {parseFloat(e.valor_diaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    {Icons.Add && <Icons.Add size={20} className="text-slate-300 group-hover:text-primary group-hover:scale-125 transition-all" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grouped Table */}
                <div className="space-y-4">
                    {sections.filter(s => items.some(i => i.secao === s)).map(secao => (
                        <div key={secao} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{secao}</span>
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                    {items.filter(i => i.secao === secao).length} itens
                                </span>
                            </div>
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.filter(i => i.secao === secao).map(item => (
                                        <tr key={`${item.equipamento_id}-${item.secao}`} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.nome}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateQtd(item.equipamento_id, item.secao, item.quantidade - 1)} className="size-6 rounded border dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary">-</button>
                                                    <span className="text-xs font-black dark:text-white w-4 text-center">{item.quantidade}</span>
                                                    <button onClick={() => updateQtd(item.equipamento_id, item.secao, item.quantidade + 1)} className="size-6 rounded border dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary">+</button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setItems(items.filter(i => !(i.equipamento_id === item.equipamento_id && i.secao === item.secao)))} className="p-1 text-slate-300 hover:text-primary transition-colors">
                                                    {Icons.Close && <Icons.Close size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            {Icons.Orcamentos && <Icons.Orcamentos className="mx-auto text-slate-100 dark:text-slate-800" size={64} />}
                            <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Adicione equipamentos ao orçamento.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Summary Panel */}
            <div className="w-full lg:w-80 shrink-0 px-4 lg:px-0">
                <div className="lg:sticky lg:top-24 space-y-4">
                    <div className="bg-black p-6 md:p-8 rounded-[2rem] text-white shadow-xl shadow-black/20 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Valor Investimento</p>
                        <h3 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter">
                            <span className="text-xl font-bold text-primary mr-1">R$</span>
                            {calculateTotals().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <div className="mt-8 space-y-3">
                            <button
                                onClick={() => handleAction('approve')}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                            >
                                Gerar & Aprovar
                            </button>
                            <button
                                onClick={() => handleAction('save')}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Apenas Rascunho
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className="w-full py-4 bg-transparent text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                            >
                                Voltar para Lista
                            </button>
                        </div>
                    </div>

                    {/* Timeline de Status */}
                    {selectedId && history.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Histórico de Status</p>
                            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                {history.map((h, idx) => (
                                    <div key={h.id} className="relative pl-8">
                                        <div className={`absolute left-0 top-1 size-6 rounded-full border-4 border-white dark:border-slate-900 z-10 ${idx === 0 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{h.status_novo}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(h.data_mudanca), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Quick-Add Client Modal */}
            {isClientModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Cadastro Rápido</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Adicione o cliente sem sair do orçamento</p>
                        </div>

                        {clientErrorMsg && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="size-8 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                                    <Icons.Close size={16} />
                                </div>
                                <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-tight">{clientErrorMsg}</p>
                            </div>
                        )}
                        <form onSubmit={handleQuickClientSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Nome / Razão Social</label>
                                <input required className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold h-12" value={quickClientForm.nome} onChange={e => setQuickClientForm({ ...quickClientForm, nome: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">CPF / CNPJ</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold h-12" value={quickClientForm.cpf_cnpj} onChange={e => setQuickClientForm({ ...quickClientForm, cpf_cnpj: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold h-12" value={quickClientForm.telefone} onChange={e => setQuickClientForm({ ...quickClientForm, telefone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">E-mail</label>
                                <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold h-12" value={quickClientForm.email} onChange={e => setQuickClientForm({ ...quickClientForm, email: e.target.value })} />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                                <button type="submit" className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Cadastrar Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orcamentos;
