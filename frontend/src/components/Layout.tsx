import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Icons } from './Icons';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
                setIsMobileSearchOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data: config } = useQuery({
        queryKey: ['configuracoes-publicas'],
        queryFn: async () => (await api.get('/configuracoes.php')).data,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Dynamic Colors from Config
        if (config?.cor_primaria) {
            root.style.setProperty('--color-primary', config.cor_primaria);
            // Use secondary if defined for dark variants or darker shade of primary
            root.style.setProperty('--color-primary-dark', config.cor_secundaria || config.cor_primaria);
        }

        if (config?.nome_empresa) {
            document.title = config.nome_empresa + " - Gestão Operacional";
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

        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode, config]);

    const navItems = [
        { name: 'Painel', path: '/', icon: Icons.Dashboard, modulo: 'dashboard' },
        { name: 'Clientes', path: '/clientes', icon: Icons.Clientes, modulo: 'clientes' },
        { name: 'Equipamentos', path: '/equipamentos', icon: Icons.Equipamentos, modulo: 'equipamentos' },
        { name: 'Orçamentos', path: '/orcamentos', icon: Icons.Orcamentos, modulo: 'orcamentos' },
        { name: 'Logística', path: '/logistica', icon: Icons.Logistica, modulo: 'logistica' },
        { name: 'Usuários', path: '/usuarios', icon: Icons.Clientes, modulo: 'usuarios' },
        { name: 'Configurações', path: '/configuracoes', icon: Icons.Settings, modulo: 'configuracoes' },
    ];

    const filteredItems = navItems.filter(item => hasPermission(item.modulo));

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar Desktop */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 lg:static transition-all duration-300 ease-in-out
                ${isMobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
                border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col
            `}>
                <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0 rounded-lg bg-white dark:bg-white flex items-center justify-center text-white overflow-hidden shadow-sm border border-slate-200 dark:border-white/20">
                            {config?.logo_path ? (
                                <img src={config.logo_path} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <Icons.Dashboard size={24} className="text-primary" />
                            )}
                        </div>
                        {(isSidebarOpen || (isMobileMenuOpen && window.innerWidth <= 1024)) && (
                            <div className="flex flex-col">
                                <h1 className="text-slate-900 dark:text-white text-base font-black leading-none uppercase tracking-tighter text-left">
                                    {config?.nome_empresa || 'CRM Eventos'}
                                </h1>
                                <p className="text-primary text-[8px] mt-1 font-black tracking-[0.2em] text-left uppercase italic">Gestão Operacional</p>
                            </div>
                        )}
                    </div>
                    {isMobileMenuOpen && (
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-primary">
                            <Icons.Close size={20} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
                    {filteredItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary'
                                    }
                                `}
                            >
                                <item.icon size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                                {(isSidebarOpen || (isMobileMenuOpen && window.innerWidth <= 1024)) && <span className="text-sm font-medium tracking-tight leading-none">{item.name}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
                        {(isSidebarOpen || (isMobileMenuOpen && window.innerWidth <= 1024)) && <span className="text-sm font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <Icons.Logout size={20} />
                        {(isSidebarOpen || (isMobileMenuOpen && window.innerWidth <= 1024)) && <span className="text-sm font-medium">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Overlay Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 lg:px-8 shrink-0 relative transition-all duration-200">

                    {/* Expanded Mobile Search Overlay */}
                    {isMobileSearchOpen && (
                        <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 flex items-center px-4 animate-in fade-in slide-in-from-top-2 duration-200 gap-3">
                            <button
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                <Icons.Close size={20} />
                            </button>
                            <div className="relative flex-1">
                                <Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-2 h-[44px] bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary border rounded-xl focus:ring-0 text-sm transition-all focus:bg-white dark:focus:bg-slate-700 dark:text-white"
                                    placeholder="Busca Omnibox..."
                                    type="text"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 md:gap-4 flex-1">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <Icons.Menu size={24} />
                        </button>

                        {/* Desktop Sidebar Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icons.Menu size={20} />
                        </button>

                        {(window.innerWidth <= 1024 || !isSidebarOpen) && (
                            <div className="size-8 md:size-10 overflow-hidden rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                                {config?.logo_path ? (
                                    <img src={config.logo_path} alt="Logo" className="w-[80%] h-[80%] object-contain" />
                                ) : (
                                    <Icons.Dashboard size={18} className="text-primary" />
                                )}
                            </div>
                        )}
                        <div className="relative max-w-md w-full hidden sm:block">
                            <Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary border rounded-xl focus:ring-0 text-sm transition-all focus:bg-white dark:focus:bg-slate-700 dark:text-white"
                                placeholder="Busca Omnibox..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 lg:gap-4">
                        {/* Mobile Search Icon Toggle */}
                        <button
                            onClick={() => setIsMobileSearchOpen(true)}
                            className="sm:hidden relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icons.Search size={22} />
                        </button>

                        <button className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent transition-colors">
                            <Icons.Notif size={22} />
                            <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                        </button>
                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 lg:mx-1"></div>
                        <div className="flex items-center gap-3 pl-1 md:pl-2">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-xs font-bold leading-none">{user?.nome || 'Usuário'}</p>
                                <p className="text-[10px] text-green-500 font-bold uppercase mt-0.5">{user?.papel_nome || 'Acesso'}</p>
                            </div>
                            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                {user?.nome?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
