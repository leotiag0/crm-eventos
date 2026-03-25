import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const Omnibox = ({ isMobile, onClose }: { isMobile?: boolean, onClose?: () => void }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: clientes } = useQuery({ queryKey: ['clientes-list'], queryFn: async () => (await api.get('/clientes.php')).data });
    const { data: equipamentos } = useQuery({ queryKey: ['equipamentos-list'], queryFn: async () => (await api.get('/equipamentos.php')).data });
    const { data: orcamentos } = useQuery({ queryKey: ['orcamentos-list'], queryFn: async () => (await api.get('/orcamentos.php')).data });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const results: any[] = [];
    if (query.length > 1) {
        const q = query.toLowerCase();

        clientes?.forEach((c: any) => {
            if (c.nome.toLowerCase().includes(q) || c.cpf_cnpj?.includes(q)) {
                results.push({ type: 'Cliente', title: c.nome, subtitle: c.cpf_cnpj || 'Sem documento', icon: Icons.Clientes, path: '/clientes' });
            }
        });

        equipamentos?.forEach((e: any) => {
            if (e.nome.toLowerCase().includes(q)) {
                results.push({ type: 'Equipamento', title: e.nome, subtitle: `Estoque: ${e.estoque_total}`, icon: Icons.Equipamentos, path: '/equipamentos' });
            }
        });

        orcamentos?.forEach((o: any) => {
            if (o.cliente_nome?.toLowerCase().includes(q) || o.nome_evento?.toLowerCase().includes(q) || String(o.id) === q || String(o.numero_sequencial) === q) {
                results.push({ type: 'Orçamento', title: `ORC ${o.id} - ${o.cliente_nome}`, subtitle: o.nome_evento || 'Sem nome de evento', icon: Icons.Orcamentos, path: '/orcamentos' });
            }
        });
    }

    const displayedResults = results.slice(0, 8);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                autoFocus={isMobile}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full pl-10 pr-4 py-2 h-[44px] bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary border rounded-xl focus:ring-0 text-sm transition-all focus:bg-white dark:focus:bg-slate-700 dark:text-white shadow-sm"
                placeholder={isMobile ? "Busca inteligente..." : "Busca Omnibox (Clientes, Orçamentos...)"}
                type="text"
            />
            {isOpen && query.length > 1 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
                    {displayedResults.length > 0 ? (
                        displayedResults.map((res, idx) => {
                            const IconCmp = res.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        navigate(res.path);
                                        setIsOpen(false);
                                        setQuery('');
                                        if (onClose) onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                                >
                                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                                        <IconCmp size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{res.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{res.type}</span>
                                            <span className="text-xs font-bold text-slate-400 truncate">{res.subtitle}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                            <Icons.Search size={32} className="opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhum resultado encontrado</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
