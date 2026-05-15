import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface User {
    id: number;
    nome: string;
    email: string;
    papel_slug: string;
    papel_nome: string;
    permissoes: string[];
}

interface Config {
    nome_empresa?: string;
    logo_path?: string;
    cor_primaria?: string;
    cor_secundaria?: string;
}

interface AuthContextType {
    user: User | null;
    config: Config | null;
    loading: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (modulo: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Fetch both in parallel to avoid sequential network chains
            const [authRes, configRes] = await Promise.all([
                api.get('/auth.php?action=check').catch(() => ({ data: { user: null } })),
                api.get('/configuracoes.php').catch(() => ({ data: null }))
            ]);

            setAuthUser(authRes.data.user);
            setConfig(configRes.data);

            // Apply theme globally if config exists
            if (configRes.data) {
                applyTheme(configRes.data);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (data: Config) => {
        const root = window.document.documentElement;
        if (data.cor_primaria) {
            root.style.setProperty('--color-primary', data.cor_primaria);
            root.style.setProperty('--color-primary-dark', data.cor_secundaria || data.cor_primaria);
        }
        if (data.nome_empresa) {
            document.title = data.nome_empresa + " - Sistema";
        }
    };

    const login = async (email: string, senha: string) => {
        const response = await api.post('/auth.php?action=login', { email, senha });
        setAuthUser(response.data.user);
    };

    const logout = async () => {
        await api.post('/auth.php?action=logout');
        setAuthUser(null);
    };

    const hasPermission = (modulo: string) => {
        if (!authUser) return false;
        if (authUser.papel_slug === 'admin') return true;
        return authUser.permissoes.includes(modulo);
    };

    return (
        <AuthContext.Provider value={{ user: authUser, config, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
