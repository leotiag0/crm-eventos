import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from '../components/Icons';

const Romaneio: React.FC = () => {
    const { id } = useParams();

    const { data: orcamento, isLoading: loadingOrcamento } = useQuery({
        queryKey: ['romaneio-documento', id],
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
            document.title = `Romaneio_${orcamento.cliente_nome}_${date}_${num}`;
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

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('romaneio-content');
        const html2pdf = (window as any).html2pdf;
        if (!element || !html2pdf) return;

        const date = new Date(orcamento.data_inicio).getFullYear();
        const num = String(orcamento.numero_sequencial || orcamento.id).padStart(3, '0');
        const filename = `Romaneio_${orcamento.cliente_nome}_${date}_${num}.pdf`;

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse">GERANDO ROMANEIO...</div>;
    if (!orcamento) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">ORÇAMENTO NÃO ENCONTRADO para o romaneio.</div>;

    // Group items by section
    const sectionsGrouped = orcamento.itens.reduce((acc: any, item: any) => {
        const secao = item.secao || 'Geral';
        if (!acc[secao]) acc[secao] = [];
        acc[secao].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
            <div id="romaneio-content" className="p-8 md:p-12 max-w-5xl mx-auto border-x border-slate-50 shadow-sm print:shadow-none print:p-0 print:border-none print:max-w-none print-compact">
                {/* Header */}
                <header className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8 print:mb-4 print:pb-2">
                    <div className="flex gap-4 items-center">
                        <div className="size-16 rounded-xl bg-black flex items-center justify-center text-white overflow-hidden shrink-0">
                            {config?.logo_path ? (
                                <img src={config.logo_path} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Icons.Dashboard size={32} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight">{config?.nome_empresa || 'CRM Eventos'}</h1>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Engenharia de Eventos & Logística</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Romaneio de Carga</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Ref: {orcamento.numero_sequencial ? `ORC-${new Date(orcamento.data_inicio).getFullYear()}-${String(orcamento.numero_sequencial).padStart(3, '0')}` : `#${orcamento.id}`}
                        </p>
                    </div>
                </header>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-12 text-sm print:mb-4 print:gap-2 info-grid-print">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dados do Envento</h3>
                        <p className="font-black uppercase">{orcamento.nome_evento || 'Evento sem nome'}</p>
                        <p className="text-slate-500 mt-1 uppercase text-xs">{orcamento.endereco_evento}</p>
                    </div>
                    <div className="text-right border-l border-slate-100 pl-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente / Solicitante</h3>
                        <p className="font-black uppercase">{orcamento.cliente_nome}</p>
                        <p className="text-slate-500 mt-1 uppercase text-xs">Ativação: {new Date(orcamento.data_inicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                {/* Checklist Table */}
                <div className="space-y-8 print:space-y-4">
                    {Object.keys(sectionsGrouped).map(secao => (
                        <div key={secao} className="break-inside-avoid">
                            <div className="bg-slate-50 px-4 py-2 border-l-4 border-black mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest">{secao}</span>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="py-2 text-[10px] font-black uppercase tracking-widest w-12 text-center">OK</th>
                                        <th className="py-2 text-[10px] font-black uppercase tracking-widest w-16 text-center">QTD</th>
                                        <th className="py-2 text-[10px] font-black uppercase tracking-widest pl-4">Equipamento / Descrição</th>
                                        <th className="py-2 text-[10px] font-black uppercase tracking-widest w-24 text-right">Observação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sectionsGrouped[secao].map((item: any) => (
                                        <tr key={item.id} className="border-b border-slate-50 item-row-print">
                                            <td className="py-4 flex justify-center print:py-1">
                                                <div className="size-5 border-2 border-slate-200 rounded-md print:size-4"></div>
                                            </td>
                                            <td className="py-4 text-center font-black text-lg print:py-1 print:text-sm">
                                                {item.quantidade}
                                            </td>
                                            <td className="py-4 pl-4 font-bold uppercase text-xs italic print:py-1 print:text-[10px]">
                                                {item.equipamento_nome}
                                            </td>
                                            <td className="py-4 border-b border-dotted border-slate-200 print:py-1"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* Signatures */}
                <div className="mt-24 grid grid-cols-2 gap-12 border-t border-slate-100 pt-12 print:mt-10 print:pt-4 print:gap-8">
                    <div className="text-center">
                        <div className="border-b border-slate-900 pb-1 mb-2 print:mb-1"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest print:text-[8px]">Responsável {config?.nome_empresa || 'CRM Eventos'}</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-1 print:hidden">Conferência de Saída</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-slate-900 pb-1 mb-2 print:mb-1"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest print:text-[8px]">Responsável pela Obra / Evento</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-1 print:hidden">Declaração de Recebimento</p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-[8px] text-slate-400 uppercase font-black tracking-[0.3em] text-center border-t border-slate-50 pt-6">
                    Gerado em {new Date().toLocaleString('pt-BR')} • Sistema CRM Eventos • {config?.nome_empresa || 'CRM Eventos'}
                </footer>

                <style dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page { 
                        margin: 0.5cm; 
                        size: a4 portrait;
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        background: white !important;
                        font-size: 9pt;
                    }
                    .print-compact { 
                         padding: 0 !important;
                         margin: 0 !important;
                    }
                    .print-no-break { break-inside: avoid; }
                    .print-hidden { display: none !important; }
                    
                    /* Ajustar Header */
                    header { 
                        margin-bottom: 15px !important; 
                        padding-bottom: 10px !important;
                    }
                    .info-grid-print {
                        gap: 10px !important;
                        margin-bottom: 15px !important;
                    }
                    /* Reduzir tabelas */
                    td, th { padding: 4px 8px !important; }
                    .item-row-print { height: 35px !important; }
                    
                    h1 { font-size: 1.2rem !important; }
                    h2 { font-size: 1.5rem !important; }
                }
            `}} />

                {/* Floating Buttons for Desktop */}
                <div className="fixed bottom-8 right-8 flex gap-3 print:hidden">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all"
                    >
                        {Icons.Add && <Icons.Add size={20} />}
                        Gerar PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="size-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-primary transition-all scale-110 active:scale-95"
                    >
                        <Icons.Printer size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Romaneio;
