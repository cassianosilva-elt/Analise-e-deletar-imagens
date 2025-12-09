import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import FiscalizacaoPage from './components/FiscalizacaoPage';
import RelatoriosPage from './components/RelatoriosPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';
import AjudaPage from './components/AjudaPage';
import { AppProvider } from './AppContext';

const App = () => {
  return (
    <AppProvider>
      <Router>
        <div className="flex h-screen bg-[#F8F9FA] text-gray-900 font-sans overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/fiscalizacao" element={<FiscalizacaoPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/ajuda" element={<AjudaPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;