// MaterialForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMaterial, updateMaterial, setEditingMaterial } from '../store/inventorySlice';

const MaterialForm = () => {
  const dispatch = useDispatch();
  
  const editingMaterial = useSelector(state => state.inventory?.editingMaterial || state.editingMaterial || null);
  
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // NOVO: Estado para capturar e exibir erros do Backend ou validação
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (editingMaterial) {
      setName(editingMaterial.name || '');
      setQuantity(editingMaterial.stockQuantity || '');
      setFormError(null); // Limpa erro ao carregar para edição
    } else {
      setName('');
      setQuantity('');
    }
  }, [editingMaterial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null); // Reseta erro antes de tentar submeter

    if (!name || quantity === '') {
      setFormError("Please, fill the name and quantity.");
      return;
    }

    try {
      if (editingMaterial) {
        await dispatch(updateMaterial({ 
          id: editingMaterial.id, 
          name, 
          stockQuantity: Number(quantity) 
        })).unwrap();
      } else {
        await dispatch(addMaterial({ 
          name, 
          stockQuantity: Number(quantity) 
        })).unwrap();
      }
      handleCancel();
    } catch (error) {
      // CORREÇÃO: Extrai a string de erro (ex: "The material '...' is already saved")
      const errorMessage = typeof error === 'string' ? error : (error.message || "Material save error");
      setFormError(errorMessage);
    }
  };

  const handleCancel = () => {
    setName('');
    setQuantity('');
    setFormError(null); // Limpa erro ao cancelar
    dispatch(setEditingMaterial(null));
  };

  return (
    <div className={`p-6 border transition-all duration-300 rounded-3xl shadow-xl ${editingMaterial ? 'bg-slate-800 border-blue-500 shadow-blue-900/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
      <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${editingMaterial ? 'text-blue-400' : 'text-slate-300'}`}>
        <span className="bg-blue-500/20 px-3 py-1 rounded-lg text-sm font-mono">01</span>
        {editingMaterial ? 'Edit Material' : 'Material Registration'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Material Name</label>
          <input 
            type="text" 
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Chapas de Aço"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Quantity in Stock</label>
            <input 
              type="number" 
              min="0" 
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
              value={quantity} 
              onKeyDown={(e) => ["-", "e", "E", "+"].includes(e.key) && e.preventDefault()} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setQuantity(val);
                }
              }}
              placeholder="0"
            />
        </div>

        {/* ÁREA DE ERRO: Exibe a mensagem do Java em um box vermelho discreto */}
        {formError && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <p className="text-red-500 text-[11px] font-bold text-center italic">
              ⚠️ {formError}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/20 uppercase text-xs tracking-widest active:scale-95"
          >
            {editingMaterial ? '💾 Save' : '+ Add'}
          </button>
          
          {editingMaterial && (
            <button 
              type="button"
              onClick={handleCancel}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase active:scale-95"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MaterialForm;