import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orcamentos = lazy(() => import('./pages/Orcamentos'));
const Logistica = lazy(() => import('./pages/Logistica'));
const Equipamentos = lazy(() => import('./pages/Equipamentos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const PropostaCliente = lazy(() => import('./pages/PropostaCliente'));
const Login = lazy(() => import('./pages/Login'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Romaneio = lazy(() => import('./pages/Romaneio'));
const Relatorios = lazy(() => import('./pages/Relatorios'));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, modulo }: { children: React.ReactNode, modulo?: string }) => {
  const { sessionUser, loading, hasPermission } = useAuth();

  if (loading) return null; // Or a loader
  if (!sessionUser) return <Navigate to="/login" />;
  if (modulo && !hasPermission(modulo)) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-primary font-bold animate-pulse">CARREGANDO...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/Dashboard" element={<Navigate to="/" replace />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<ProtectedRoute modulo="clientes"><Clientes /></ProtectedRoute>} />
              <Route path="equipamentos" element={<ProtectedRoute modulo="equipamentos"><Equipamentos /></ProtectedRoute>} />
              <Route path="orcamentos" element={<ProtectedRoute modulo="orcamentos"><Orcamentos /></ProtectedRoute>} />
              <Route path="logistica" element={<ProtectedRoute modulo="logistica"><Logistica /></ProtectedRoute>} />
              <Route path="relatorios" element={<ProtectedRoute modulo="orcamentos"><Relatorios /></ProtectedRoute>} />
              <Route path="usuarios" element={<ProtectedRoute modulo="usuarios"><Usuarios /></ProtectedRoute>} />
              <Route path="configuracoes" element={<ProtectedRoute modulo="configuracoes"><Configuracoes /></ProtectedRoute>} />
            </Route>

            <Route path="/proposta/:id" element={<PropostaCliente />} />
            <Route path="/romaneio/:id" element={<Romaneio />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
