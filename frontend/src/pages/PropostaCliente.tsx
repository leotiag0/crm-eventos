import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const PropostaCliente: React.FC = () => {
    const { id } = useParams();

    const { data: orcamento, isLoading } = useQuery({
        queryKey: ['proposta-publica', id],
        queryFn: async () => (await api.get(`/orcamentos.php?id=${id}`)).data,
        enabled: !!id,
    });

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center font-bold text-primary animate-pulse">PREPARANDO PROPOSTA WA PRODUÇÕES...</div>;
    if (!orcamento) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">ORÇAMENTO NÃO ENCONTRADO.</div>;

    // Group items by section
    const sectionsGrouped = orcamento.itens.reduce((acc: any, item: any) => {
        const secao = item.secao || 'Geral';
        if (!acc[secao]) acc[secao] = [];
        acc[secao].push(item);
        return acc;
    }, {});

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary selection:text-white pb-20">
            {/* Print Controls (Hidden on print) */}
            <div className="fixed top-6 right-6 z-50 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary transition-all"
                >
                    {Icons.Orcamentos && <Icons.Orcamentos size={18} />}
                    Imprimir PDF
                </button>
            </div>

            {/* Header / Brand */}
            <header className="max-w-5xl mx-auto px-6 py-12 flex justify-between items-center">
                <div className="flex items-center gap-4 text-left">
                    <div className="size-16 rounded-2xl bg-black flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                        {Icons.Dashboard && <Icons.Dashboard size={40} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">WA Produções</h1>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1 italic">Locação & Engenharia</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato / Orçamento</p>
                    <p className="text-2xl font-black text-black">#{orcamento.id.toString().padStart(4, '0')}</p>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-t border-slate-100 items-center">
                <div className="text-left">
                    <h2 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4">Investimento Técnico</h2>
                    <h3 className="text-5xl font-black text-black leading-tight tracking-tighter uppercase">Equipamentos de<br />Alta Performance</h3>
                    <p className="mt-8 text-slate-500 font-medium leading-relaxed max-w-sm">
                        Olá <span className="text-black font-black uppercase">{orcamento.cliente_nome}</span>, selecionamos o melhor do nosso estoque para atender à engenharia do seu evento.
                    </p>

                    <div className="mt-12 flex flex-wrap gap-12">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Ativação</p>
                            <p className="font-black pt-1">{new Date(orcamento.data_inicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobrança</p>
                            <p className="font-black pt-1">{orcamento.tipo_cobranca}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-black rounded-[3rem] p-12 flex flex-col justify-between text-left shadow-2xl shadow-primary/10">
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total do Projeto</p>
                        <h4 className="text-6xl font-black text-white mt-4 tracking-tighter">
                            <span className="text-3xl font-bold text-primary mr-1">R$</span>
                            {parseFloat(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                    </div>

                    <div className="space-y-4 mt-16 print:hidden">
                        <button className="w-full py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Aceitar Orçamento Online
                        </button>
                        <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">Aprovação válida por 72 horas</p>
                    </div>
                </div>
            </section>

            {/* Sections & Items List */}
            <section className="max-w-5xl mx-auto px-6 py-24 text-left">
                <h3 className="text-xl font-black text-black uppercase tracking-tight mb-12 flex items-center gap-3">
                    {Icons.Layout && <Icons.Layout size={24} className="text-primary" />}
                    Detalhamento por Seções
                </h3>

                <div className="space-y-12">
                    {Object.keys(sectionsGrouped).map(secao => (
                        <div key={secao} className="group">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-xs font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{secao}</span>
                                <div className="flex-1 h-px bg-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {sectionsGrouped[secao].map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 hover:border-slate-200 hover:shadow-sm transition-all break-inside-avoid">
                                        <div className="flex items-center gap-6">
                                            <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black">
                                                x{item.quantidade}
                                            </div>
                                            <div>
                                                <p className="font-black text-black uppercase tracking-tight leading-none">{item.equipamento_nome}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Standard WA Produções</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-black">R$ {(item.quantidade * parseFloat(item.valor_unitario_snapshot)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Conditions Tables */}
            <section className="max-w-5xl mx-auto px-6 py-12 text-left grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Condições de Pagamento</p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {orcamento.condicoes_pagamento || "A combinar com o setor financeiro."}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Condições de Fornecimento</p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {orcamento.condicoes_fornecimento || "Padrão WA Produções de qualidade técnica."}
                    </div>
                </div>
            </section>

            {/* Footer Info */}
            <footer className="max-w-5xl mx-auto px-6 py-24 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-12 text-slate-400 text-left">
                <div className="max-w-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black mb-6">Nota Jurídica</p>
                    <p className="text-[11px] leading-relaxed font-medium">
                        A contratação engloba locação técnica sob normas de segurança. Equipamentos segurados pela WA Produções. Eventuais danos decorrentes de mau uso por terceiros são de responsabilidade do contratante.
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black mb-6">Canais WA</p>
                    <p className="text-sm font-bold text-black uppercase">www.waproducoes.com.br</p>
                    <p className="text-xs font-black text-primary mt-2 uppercase italic tracking-widest">tecnologia em eventos</p>
                </div>
            </footer>
        </div>
    );
};

export default PropostaCliente;
