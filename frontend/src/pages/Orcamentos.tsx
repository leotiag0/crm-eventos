import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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

const Orcamentos: React.FC = () => {
    const [items, setItems] = useState<ItemBudget[]>([]);
    const [sections, setSections] = useState<string[]>(['Geral', 'Palco', 'Cabine']);
    const [activeSection, setActiveSection] = useState('Geral');
    const [newSectionName, setNewSectionName] = useState('');

    const [clienteId, setClienteId] = useState<number | ''>('');
    const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd HH:mm'));
    const [dataFim, setDataFim] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd HH:mm'));
    const [tipoCobranca, setTipoCobranca] = useState<'DIARIA' | 'EVENTO'>('DIARIA');
    const [condicoesPagamento, setCondicoesPagamento] = useState('À vista no fechamento ou 50% ato e 50% na montagem.');
    const [condicoesFornecimento, setCondicoesFornecimento] = useState('Incluso transporte e montagem padrão. Diária de 12 horas.');

    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data: clientes } = useQuery({
        queryKey: ['clientes-list'],
        queryFn: async () => (await api.get('/clientes.php')).data,
    });

    const { data: equipamentos } = useQuery({
        queryKey: ['equipamentos-search', searchTerm],
        queryFn: async () => (await api.get(`/equipamentos.php`)).data,
        enabled: searchTerm.length > 0,
    });

    const filteredEquip = equipamentos?.filter((e: any) =>
        e.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

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

    const addSection = () => {
        if (!newSectionName) return;
        if (sections.includes(newSectionName)) return alert('Seção já existe');
        setSections([...sections, newSectionName]);
        setActiveSection(newSectionName);
        setNewSectionName('');
    };

    const removeItem = (id: number, secao: string) => {
        setItems(items.filter(i => !(i.equipamento_id === id && i.secao === secao)));
    };

    const updateQtd = (id: number, secao: string, val: number) => {
        setItems(items.map(i => (i.equipamento_id === id && i.secao === secao) ? { ...i, quantidade: Math.max(1, val) } : i));
    };

    const submitMutation = useMutation({
        mutationFn: (payload: any) => api.post('/orcamentos.php', payload),
        onSuccess: (res) => {
            alert(`Sucesso! Orçamento ${res.data.id} criado.`);
            // Redirect to proposal page
            window.open(`/proposta/${res.data.id}`, '_blank');
            setItems([]);
            setClienteId('');
        },
        onError: (err: any) => {
            alert(`Erro: ${err.response?.data?.error || 'Falha ao processar'}`);
        }
    });

    const handleAction = (action: 'save' | 'approve') => {
        if (!clienteId) return alert('Selecione um cliente');
        if (items.length === 0) return alert('Adicione itens ao orçamento');

        const payload = {
            action,
            cliente_id: clienteId,
            data_inicio: dataInicio,
            data_fim: dataFim,
            tipo_cobranca: tipoCobranca,
            valor_total: calculateTotals(),
            condicoes_pagamento: condicoesPagamento,
            condicoes_fornecimento: condicoesFornecimento,
            itens: items,
            status: action === 'approve' ? 'Aprovado' : 'Rascunho'
        };
        submitMutation.mutate(payload);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 pb-32 animate-in fade-in duration-500 text-left">
            <div className="flex-1 space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {Icons.Orcamentos && <Icons.Orcamentos size={28} className="text-primary" />}
                        Motor de Orçamentos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">WA Produções - Excelência em Eventos</p>
                </div>

                {/* Setup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Cliente</label>
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
                    <div className="space-y-1.5">
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
                </div>

                {/* Conditions Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                        <button onClick={addSection} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            {Icons.Add && <Icons.Add size={14} />}
                        </button>
                    </div>
                </div>

                {/* Omnibox Search */}
                <div className="relative" ref={searchRef}>
                    <div className="group relative">
                        {Icons.Search && <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />}
                        <input
                            type="text"
                            placeholder={`Adicionar na seção ${activeSection.toUpperCase()}...`}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:border-primary focus:ring-0 text-lg font-bold placeholder:font-medium transition-all dark:text-white"
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
                                                <button onClick={() => removeItem(item.equipamento_id, item.secao)} className="p-1 text-slate-300 hover:text-primary transition-colors">
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
                            <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Crie uma seção e adicione equipamentos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Summary Panel */}
            <div className="w-full lg:w-80 shrink-0">
                <div className="sticky top-24 space-y-4">
                    <div className="bg-black p-8 rounded-3xl text-white shadow-xl shadow-black/20 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Valor Investimento</p>
                        <h3 className="text-4xl font-black mt-2 tracking-tighter">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orcamentos;
