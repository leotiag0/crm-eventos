import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orcamentos from './pages/Orcamentos';
import Logistica from './pages/Logistica';
import Equipamentos from './pages/Equipamentos';
import Clientes from './pages/Clientes';
import PropostaCliente from './pages/PropostaCliente';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="equipamentos" element={<Equipamentos />} />
            <Route path="orcamentos" element={<Orcamentos />} />
            <Route path="logistica" element={<Logistica />} />
          </Route>

          {/* Public Routes */}
          <Route path="/proposta/:id" element={<PropostaCliente />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
