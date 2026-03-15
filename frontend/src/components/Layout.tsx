import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icons } from './Icons';

const Layout: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const navItems = [
        { name: 'Painel', path: '/', icon: Icons.Dashboard },
        { name: 'Clientes', path: '/clientes', icon: Icons.Clientes },
        { name: 'Equipamentos', path: '/equipamentos', icon: Icons.Equipamentos },
        { name: 'Orçamentos', path: '/orcamentos', icon: Icons.Orcamentos },
        { name: 'Logística', path: '/logistica', icon: Icons.Logistica },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 ease-in-out`}>
                <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
                    <div className="size-10 shrink-0 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <Icons.Dashboard size={24} />
                    </div>
                    {isSidebarOpen && (
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none uppercase tracking-wider">WA Produções</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 font-semibold">GESTAO OPERACIONAL</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary'
                                }
              `}
                        >
                            <item.icon size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                            {isSidebarOpen && <span className="text-sm font-medium tracking-tight">{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
                        {isSidebarOpen && <span className="text-sm font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icons.Menu size={20} />
                        </button>
                        <div className="relative max-w-md w-full">
                            <Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-primary border rounded-xl focus:ring-0 text-sm transition-all focus:bg-white dark:focus:bg-slate-700"
                                placeholder="Busca Omnibox..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative size-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent transition-colors">
                            <Icons.Notif size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end">
                                <p className="text-xs font-bold leading-none">Administrador</p>
                                <p className="text-[10px] text-green-500 font-bold uppercase mt-0.5">Disponível</p>
                            </div>
                            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                AD
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
