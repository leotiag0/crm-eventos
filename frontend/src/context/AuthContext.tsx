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

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (modulo: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth.php?action=check');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, senha: string) => {
        const response = await api.post('/auth.php?action=login', { email, senha });
        setUser(response.data.user);
    };

    const logout = async () => {
        await api.post('/auth.php?action=logout');
        setUser(null);
    };

    const hasPermission = (modulo: string) => {
        if (!user) return false;
        if (user.papel_slug === 'admin') return true;
        return user.permissoes.includes(modulo);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
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
