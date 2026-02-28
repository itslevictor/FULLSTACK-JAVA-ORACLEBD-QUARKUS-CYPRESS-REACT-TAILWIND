// ProductionSuggester.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllMaterials, 
  selectAllProducts, 
  fetchProductionSuggestion, 
  selectSuggestion 
} from '../store/inventorySlice';

const ProductionSuggester = () => {
  const dispatch = useDispatch();
  const rawMaterials = useSelector(selectAllMaterials);
  const products = useSelector(selectAllProducts);
  const backendSuggestion = useSelector(selectSuggestion);

  // Sincroniza com o backend quando os dados base mudam
  useEffect(() => {
    dispatch(fetchProductionSuggestion());
  }, [dispatch, rawMaterials, products]);

  // Extração segura dos dados vindos do Backend
  const suggestion = backendSuggestion?.products || [];
  const totalValue = backendSuggestion?.totalValue || backendSuggestion?.totalEstimatedValue || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
          <span className="text-blue-500 animate-pulse">⚡</span> Production Suggestion
        </h2>
        <div className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em] mb-1">Estimated Total Profit</p>
          <p className="text-3xl font-black text-emerald-400 leading-none">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="p-6 text-center border border-slate-800 rounded-2xl bg-slate-950/30">
          <p className="text-slate-500 text-sm italic">Register products and recipes to calculate optimized production..</p>
        </div>
      ) : (suggestion.length === 0) ? (
        <div className="p-5 rounded-2xl border border-red-900/30 bg-red-900/10">
          <p className="text-red-400 text-sm font-medium flex items-center gap-2">
            ⚠️ Insufficient stock to begin any production..
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {suggestion.map((item, idx) => (
            <div 
              key={item.id || item.productId || `prod-${idx}`} 
              className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center group hover:border-blue-500/30 transition-all"
            >
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-slate-200 text-sm md:text-base truncate">{item.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Unitary Price: {(item.price || item.unitPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-500 tracking-tighter">{item.suggestedQty || item.quantity}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">unidades</span>
                </div>
                <p className="text-[9px] text-emerald-500/70 font-mono mt-1">
                    +{(item.totalValue || item.subtotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionSuggester;