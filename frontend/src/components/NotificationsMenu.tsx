import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const NotificationsMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data: orcamentos } = useQuery({ queryKey: ['orcamentos-list'], queryFn: async () => (await api.get('/orcamentos.php')).data });
    const { data: equipamentos } = useQuery({ queryKey: ['equipamentos-list'], queryFn: async () => (await api.get('/equipamentos.php')).data });

    const aguardandoAprovacao = orcamentos?.filter((o: any) => o.status === 'Aguardando Aprovação') || [];
    const equipamentosDefeito = equipamentos?.filter((e: any) => e.status === 'Defeito Técnico') || [];

    // Verifica logística aguardando separação
    const logisticaPendente = orcamentos?.filter((o: any) => o.status === 'Aprovado') || [];

    const totalNotifications = aguardandoAprovacao.length + equipamentosDefeito.length + (logisticaPendente.length > 0 ? 1 : 0);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
                <Icons.Notif size={22} />
                {totalNotifications > 0 && (
                    <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 size-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Notificações</h3>
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-lg">{totalNotifications} pendentes</span>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto hidden-scrollbar flex flex-col">
                        {aguardandoAprovacao.length > 0 && (
                            <button onClick={() => { navigate('/orcamentos'); setIsOpen(false); }} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800 text-left">
                                <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0">
                                    <Icons.Orcamentos size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{aguardandoAprovacao.length} Orçamentos Aguardando</p>
                                    <p className="text-xs font-medium text-slate-500">Existem propostas aguardando aprovação pelo cliente.</p>
                                </div>
                            </button>
                        )}
                        {logisticaPendente.length > 0 && (
                            <button onClick={() => { navigate('/logistica'); setIsOpen(false); }} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800 text-left">
                                <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
                                    <Icons.Logistica size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{logisticaPendente.length} Eventos Aprovados</p>
                                    <p className="text-xs font-medium text-slate-500">Equipamentos precisam ser preparados ou retornados no galpão.</p>
                                </div>
                            </button>
                        )}
                        {equipamentosDefeito.length > 0 && (
                            <button onClick={() => { navigate('/equipamentos'); setIsOpen(false); }} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800 text-left">
                                <div className="size-10 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0">
                                    <Icons.Settings size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{equipamentosDefeito.length} Equipamentos Retidos</p>
                                    <p className="text-xs font-medium text-slate-500">Itens com defeito técnico aguardando manutenção.</p>
                                </div>
                            </button>
                        )}
                        {totalNotifications === 0 && (
                            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                                <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                    <Icons.Success size={32} />
                                </div>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sua mesa está limpa!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
