import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteMaterial, selectAllMaterials, setEditingMaterial, clearDeleteError } from '../store/inventorySlice';

const InventoryDashboard = () => {
  const rawMaterials = useSelector(selectAllMaterials);
  const deleteErrorId = useSelector(state => state.inventory.deleteErrorId);
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Limpa erros de delete ao pesquisar ou mudar de ideia
  useEffect(() => {
    if (deleteErrorId) {
      const timer = setTimeout(() => dispatch(clearDeleteError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteErrorId, dispatch]);

  const filteredMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      <div className="relative group mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">🔍</span>
        <input 
          type="text" 
          placeholder="Search material..." 
          className="w-full bg-slate-900/40 border border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500 text-sm">No results found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-700/50">
          {filteredMaterials.map((material) => (
            <li key={material.id} className="py-4 flex justify-between items-center group relative">
              
              {/* FEEDBACK DE ERRO (SOBE E DESCE) */}
              {deleteErrorId === material.id && (
                <div className="absolute -top-2 left-0 right-0 flex justify-center animate-bounce">
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-tighter">
                    Linked in a product
                  </span>
                </div>
              )}

              <div>
                <p className="text-slate-200 font-semibold tracking-tight">{material.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">ID: {material.id}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-black text-blue-400">{material.stockQuantity ?? 0}</span>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Units</p>
                </div>
                
                <div className="flex items-center border-l border-slate-700/50 ml-2 pl-2 gap-1 min-w-[80px] justify-end">
                  {confirmDeleteId === material.id ? (
                    /* UI DE CONFIRMAÇÃO IN-SITE */
                    <div className="flex items-center gap-1 animate-in zoom-in duration-200">
                      <button 
                        onClick={() => {
                          dispatch(deleteMaterial(material.id));
                          setConfirmDeleteId(null);
                        }}
                        className="text-[10px] bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1 rounded cursor-pointer"
                      > YES </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded cursor-pointer"
                      > NO </button>
                    </div>
                  ) : (
                    /* BOTÕES NORMAIS */
                    <>
                      <button 
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                        onClick={() => {
                          dispatch(setEditingMaterial(material));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button 
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                        onClick={() => {
                          dispatch(clearDeleteError());
                          setConfirmDeleteId(material.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InventoryDashboard;