import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaterials, fetchProducts, selectInventoryStatus, selectInventoryError } from './store/inventorySlice';

import MaterialForm from './components/MaterialForm';
import ProductForm from './components/ProductForm';
import ProductionSuggester from './components/ProductionSuggester';
import InventoryDashboard from './components/InventoryDashboard';
import ProductList from './components/ProductList';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const dispatch = useDispatch();
  const status = useSelector(selectInventoryStatus);
  const error = useSelector(selectInventoryError);

  // CARGA INICIAL: Roda apenas 1 vez ao montar o componente
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMaterials());
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  // WEBSOCKET: Escuta atualizações do Quarkus em tempo real
  useEffect(() => {
    // Tenta conectar ao servidor Java
    const socket = new WebSocket('ws://localhost:8081/inventory-updates');

    socket.onmessage = (event) => {
      // Quando o Java enviar "REFRESH", o Redux recarrega os dados
      if (event.data === 'REFRESH') {
        console.log('🔄 Mudança detectada no servidor! Sincronizando dados...');
        dispatch(fetchMaterials());
        dispatch(fetchProducts());
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket desconectado. O sistema usará carga manual (F5).');
    };

    socket.onerror = (err) => {
      console.error('❌ Erro no WebSocket:', err);
    };

    return () => socket.close();
  }, [dispatch]);

  const navigateTo = (view) => {
    setActiveView(view);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* ALERTA DE ERRO DE CONEXÃO */}
      {status === 'failed' && (
        <div className="bg-red-500 text-white p-2 text-center text-xs font-bold animate-pulse">
          ⚠️ ERRO DE CONEXÃO: Verifique se o Backend Java na porta 8081 está rodando. ({error})
        </div>
      )}

      {/* CONTAINER PRINCIPAL - Ajustado para max-width maior e centralizado */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-16 py-6 md:py-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-800 pb-8 gap-6">
          <div className="flex-shrink-0">
            <h1 
              className="text-3xl md:text-4xl font-extrabold text-white tracking-tight cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => setActiveView('dashboard')}
            >
              Projedata <span className="text-blue-500">Inventory</span>
            </h1>
            <p className="text-slate-500 mt-2 text-xs md:text-sm uppercase tracking-wider font-semibold">
              Management & Production Optimizer
            </p>
          </div>

          {/* NAVEGAÇÃO MOBILE */}
          <nav className="flex lg:hidden gap-2 w-full md:w-auto">
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 p-3 rounded-xl transition-all border ${
                activeView === 'dashboard' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="text-[10px] font-bold uppercase">Dash</span>
            </button>

            <button 
              onClick={() => navigateTo('materials')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 p-3 rounded-xl transition-all border ${
                activeView === 'materials' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-lg">📦</span>
              <span className="text-[10px] font-bold uppercase">Materials</span>
            </button>

            <button 
              onClick={() => navigateTo('products')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 p-3 rounded-xl transition-all border ${
                activeView === 'products' 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-lg">🛠️</span>
              <span className="text-[10px] font-bold uppercase">Products</span>
            </button>
          </nav>

          <div className="hidden lg:block bg-blue-500/10 border border-blue-500/20 px-6 py-2 rounded-full">
            <span className="text-blue-400 font-mono text-sm tracking-widest uppercase">
              {status === 'loading' ? '🔄 Syncing...' : '🟢 System Online'}
            </span>
          </div>
        </header>
        
        {/* GRID PRINCIPAL: Ajustado lg:grid-cols-12 e gap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ASIDE CADASTROS (DESKTOP) - Proporção aumentada de 4 para 5 para evitar achatamento */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-8 sticky top-10">
            <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl min-w-[320px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400 uppercase tracking-tighter">
                <span className="bg-blue-500/20 p-2 rounded-lg text-blue-500 text-sm font-mono">01</span> Insumos
              </h2>
              <MaterialForm />
            </section>

            <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl min-w-[320px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-400 uppercase tracking-tighter">
                <span className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500 text-sm font-mono">02</span> Produtos
              </h2>
              <ProductForm />
            </section>
          </aside>

          {/* MAIN CONTENT - Proporção ajustada para ocupar o restante (7 de 12) */}
          <main className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {(activeView === 'dashboard' || window.innerWidth > 1024) && activeView !== 'materials' && activeView !== 'products' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                  <ProductionSuggester />
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-slate-500 flex justify-between items-center">
                      <span>Stock Summary</span>
                      <span className="h-1.5 w-8 bg-blue-600 rounded-full"></span>
                    </h2>
                    <InventoryDashboard />
                  </div>

                  <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-slate-500 flex justify-between items-center">
                      <span>Registered Products</span>
                      <span className="h-1.5 w-8 bg-emerald-600 rounded-full"></span>
                    </h2>
                    <ProductList />
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE VIEWS */}
            <div className="lg:hidden">
              {activeView === 'materials' && (
                <section className="bg-slate-900 p-6 rounded-3xl border border-blue-500/30">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">📦 New Material</h2>
                    <button onClick={() => setActiveView('dashboard')} className="p-2 px-4 text-[10px] bg-slate-800 text-slate-300 rounded-lg font-black">VOLTAR</button>
                  </div>
                  <MaterialForm />
                </section>
              )}

              {activeView === 'products' && (
                <section className="bg-slate-900 p-6 rounded-3xl border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-tighter">🛠️ New Product</h2>
                    <button onClick={() => setActiveView('dashboard')} className="p-2 px-4 text-[10px] bg-slate-800 text-slate-300 rounded-lg font-black">VOLTAR</button>
                  </div>
                  <ProductForm />
                </section>
              )}
            </div>
            
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;