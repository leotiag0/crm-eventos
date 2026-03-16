import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orcamentos from './pages/Orcamentos';
import Logistica from './pages/Logistica';
import Equipamentos from './pages/Equipamentos';
import Clientes from './pages/Clientes';
import PropostaCliente from './pages/PropostaCliente';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';
import Romaneio from './pages/Romaneio';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, modulo }: { children: React.ReactNode, modulo?: string }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return null; // Or a loader
  if (!user) return <Navigate to="/login" />;
  if (modulo && !hasPermission(modulo)) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ProtectedRoute modulo="clientes"><Clientes /></ProtectedRoute>} />
            <Route path="equipamentos" element={<ProtectedRoute modulo="equipamentos"><Equipamentos /></ProtectedRoute>} />
            <Route path="orcamentos" element={<ProtectedRoute modulo="orcamentos"><Orcamentos /></ProtectedRoute>} />
            <Route path="logistica" element={<ProtectedRoute modulo="logistica"><Logistica /></ProtectedRoute>} />
            <Route path="usuarios" element={<ProtectedRoute modulo="usuarios"><Usuarios /></ProtectedRoute>} />
            <Route path="configuracoes" element={<ProtectedRoute modulo="configuracoes"><Configuracoes /></ProtectedRoute>} />
          </Route>

          <Route path="/proposta/:id" element={<PropostaCliente />} />
          <Route path="/romaneio/:id" element={<Romaneio />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
