import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const PropostaCliente: React.FC = () => {
    const { id } = useParams();

    const { data: orcamento, isLoading: loadingOrcamento } = useQuery({
        queryKey: ['proposta-publica', id],
        queryFn: async () => (await api.get(`/orcamentos.php?id=${id}`)).data,
        enabled: !!id,
    });

    const { data: config, isLoading: loadingConfig } = useQuery({
        queryKey: ['configuracoes-publicas'],
        queryFn: async () => (await api.get('/configuracoes.php')).data,
    });

    React.useEffect(() => {
        if (config?.cor_primaria) {
            document.documentElement.style.setProperty('--color-primary', config.cor_primaria);
        }
        if (orcamento) {
            const date = new Date(orcamento.data_inicio).getFullYear();
            const num = String(orcamento.numero_sequencial || orcamento.id).padStart(3, '0');
            document.title = `Proposta_${orcamento.cliente_nome}_${date}_${num}`;
        }
        if (config?.logo_path) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = config.logo_path;
        }
    }, [config, orcamento]);

    const isLoading = loadingOrcamento || loadingConfig;

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center font-bold text-primary animate-pulse">PREPARANDO PROPOSTA CRM EVENTOS...</div>;
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

    const handleDownloadPDF = () => {
        const element = document.getElementById('proposta-content');
        const html2pdf = (window as any).html2pdf;
        if (!element || !html2pdf) return;

        const date = new Date(orcamento.data_inicio).getFullYear();
        const num = String(orcamento.numero_sequencial || orcamento.id).padStart(3, '0');
        const filename = `Proposta_${orcamento.cliente_nome}_${date}_${num}.pdf`;

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary selection:text-white pb-20">
            {/* Print Controls (Hidden on print) */}
            <div className="fixed top-6 right-6 z-50 flex gap-2 print:hidden">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all"
                >
                    {Icons.Add && <Icons.Add size={18} />}
                    Gerar PDF (Download)
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary transition-all"
                >
                    {Icons.Printer && <Icons.Printer size={18} />}
                    Imprimir
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        margin: 0; 
                        size: a4 portrait;
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        background: white !important;
                        font-size: 10pt;
                    }
                    .print-compact { 
                         padding: 0.5cm !important;
                         margin: 0 !important;
                    }
                    .print-no-break { break-inside: avoid; }
                    .print-hidden { display: none !important; }
                    
                    .hero-print { 
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 20px !important;
                        padding: 10px 0 !important;
                        border-bottom: 2px solid #000 !important;
                    }
                    .hero-box-print {
                        background: #000 !important;
                        color: #fff !important;
                        padding: 15px !important;
                        border-radius: 15px !important;
                        min-width: 250px !important;
                    }
                    .items-grid-print {
                        grid-template-cols: 1fr !important;
                        gap: 5px !important;
                    }
                    .item-row-print {
                        padding: 8px 12px !important;
                        border-radius: 10px !important;
                        margin-bottom: 4px !important;
                    }
                    /* Reduzir tamanhos de fonte */
                    h1 { font-size: 1.5rem !important; }
                    h2 { font-size: 0.8rem !important; }
                    h3 { font-size: 1.2rem !important; }
                    h4 { font-size: 2rem !important; }
                }
            `}} />

            <div id="proposta-content" className="print-compact">
                {/* Header / Brand */}
                <header className="max-w-5xl mx-auto px-6 py-12 flex justify-between items-center print:py-2 print:px-0">
                    <div className="flex items-center gap-4 text-left">
                        <div className="size-16 rounded-2xl bg-white flex items-center justify-center text-primary shadow-2xl shadow-primary/10 overflow-hidden border border-slate-100">
                            {config?.logo_path ? (
                                <img src={config.logo_path} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Icons.Dashboard size={40} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{config?.nome_empresa || 'CRM Eventos'}</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1 italic">Locação & Engenharia</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato / Orçamento</p>
                        <p className="text-2xl font-black text-black">
                            {orcamento.numero_sequencial ? `ORC-${new Date(orcamento.data_inicio).getFullYear()}-${String(orcamento.numero_sequencial).padStart(3, '0')}` : `#${orcamento.id.toString().padStart(4, '0')}`}
                        </p>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-t border-slate-100 items-center print:grid-cols-2 print:gap-4 print:py-4 print:px-0 hero-print">
                    <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4 print:mb-1">Investimento Técnico</h2>
                        <h3 className="text-5xl font-black text-black leading-tight tracking-tighter uppercase print:text-2xl">
                            {orcamento.nome_evento || "Equipamentos de"}<br />{orcamento.nome_evento ? "" : "Alta Performance"}
                        </h3>
                        <p className="mt-8 text-slate-500 font-medium leading-relaxed max-w-sm print:text-[10px] print:mt-1">
                            Olá <span className="text-black font-black uppercase">{orcamento.cliente_nome}</span>, selecionamos o melhor do nosso estoque para atender à engenharia de <span className="text-black font-black uppercase">{orcamento.nome_evento || "seu evento"}</span>.
                        </p>

                        <div className="mt-12 flex flex-wrap gap-12 print:mt-2 print:gap-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none print:text-[8px]">Data Ativação</p>
                                <p className="font-black pt-1 print:text-[10px]">{new Date(orcamento.data_inicio).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none print:text-[8px]">Locação</p>
                                <p className="font-black pt-1 print:text-[10px]">{orcamento.tipo_cobranca}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black rounded-[3rem] p-12 flex flex-col justify-between text-left shadow-2xl shadow-primary/10 print:rounded-2xl print:p-6 hero-box-print">
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total do Projeto</p>
                            <h4 className="text-6xl font-black text-white mt-4 tracking-tighter print:text-4xl">
                                <span className="text-3xl font-bold text-primary mr-1 print:text-xl">R$</span>
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
                <section className="max-w-5xl mx-auto px-6 py-24 text-left print:py-4 print:px-0">
                    <h3 className="text-xl font-black text-black uppercase tracking-tight mb-12 flex items-center gap-3 print:mb-2 print:text-sm">
                        {Icons.Layout && <Icons.Layout size={24} className="text-primary print:size-4" />}
                        Detalhamento por Seções
                    </h3>

                    <div className="space-y-12 print:space-y-2">
                        {Object.keys(sectionsGrouped).map(secao => (
                            <div key={secao} className="group print-no-break">
                                <div className="flex items-center gap-4 mb-6 print:mb-1">
                                    <span className="text-xs font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-full print:text-[8px] print:px-2 print:py-0.5">{secao}</span>
                                    <div className="flex-1 h-px bg-slate-100"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 print:gap-1">
                                    {sectionsGrouped[secao].map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 hover:border-slate-200 hover:shadow-sm transition-all break-inside-avoid print:p-2 print:rounded-xl item-row-print">
                                            <div className="flex items-center gap-6 print:gap-2">
                                                <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black print:size-8 print:text-[10px]">
                                                    x{item.quantidade}
                                                </div>
                                                <div>
                                                    <p className="font-black text-black uppercase tracking-tight leading-none print:text-[10px]">{item.equipamento_nome}</p>
                                                    {item.descricao_snapshot && <p className="text-[10px] font-medium text-slate-500 mt-2 italic print:hidden">{item.descricao_snapshot}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-black print:text-[10px]">R$ {(item.quantidade * parseFloat(item.valor_unitario_snapshot)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Conditions Tables */}
                <section className="max-w-5xl mx-auto px-6 py-12 text-left grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100 print:gap-4 print:py-2 print:px-0 print:border-none">
                    <div className="print-no-break">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 print:mb-1 print:text-[8px]">Pagamento</p>
                        <div className="bg-slate-50 p-8 rounded-[2rem] text-sm font-medium leading-relaxed whitespace-pre-wrap print:p-4 print:rounded-xl print:text-[9px]">
                            {orcamento.condicoes_pagamento || "A combinar com o setor financeiro."}
                        </div>
                    </div>
                    <div className="print-no-break">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 print:mb-1 print:text-[8px]">Fornecimento</p>
                        <div className="bg-slate-50 p-8 rounded-[2rem] text-sm font-medium leading-relaxed whitespace-pre-wrap print:p-4 print:rounded-xl print:text-[9px]">
                            {orcamento.condicoes_fornecimento || `Padrão ${config?.nome_empresa || 'CRM Eventos'} de qualidade técnica.`}
                        </div>
                    </div>
                </section>

                {/* Footer Info */}
                <footer className="max-w-5xl mx-auto px-6 py-24 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-12 text-slate-400 text-left">
                    <div className="max-w-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-6">Nota Jurídica</p>
                        <p className="text-[11px] leading-relaxed font-medium">
                            {config?.razao_social || config?.nome_empresa || 'Documento Comercial'} - {config?.cnpj ? `CNPJ: ${config.cnpj}` : 'Contrato de Locação Técnica'}
                            <br /><br />
                            A contratação engloba locação técnica sob normas de segurança. Equipamentos segurados pela empresa. Eventuais danos decorrentes de mau uso por terceiros são de responsabilidade do contratante.
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black mb-6">Canais Corporativos</p>
                        <p className="text-sm font-bold text-black uppercase">{config?.site || 'www.waproducoes.com.br'}</p>
                        <p className="text-xs font-black text-primary mt-2 uppercase italic tracking-widest">{config?.email_contato || 'tecnologia em eventos'}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PropostaCliente;
