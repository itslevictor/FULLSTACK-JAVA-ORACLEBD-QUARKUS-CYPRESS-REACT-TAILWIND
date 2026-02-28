import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, updateProduct, setEditingProduct, selectAllMaterials } from '../store/inventorySlice';

const ProductManager = () => {
  const dispatch = useDispatch();
  const rawMaterials = useSelector(selectAllMaterials);
  
  // Seletor resiliente para detectar edição
  const editingProduct = useSelector(state => state.inventory?.editingProduct || state.editingProduct);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [recipe, setRecipe] = useState([]);

  // Sincroniza o form ao clicar no lápis da lista
  useEffect(() => {
    if (editingProduct) {
      console.log("Detectado produto para edição:", editingProduct.name);
      setName(editingProduct.name || '');
      setPrice(editingProduct.price || '');
      setRecipe(editingProduct.ingredients || editingProduct.recipe || []);
    } else {
      setName('');
      setPrice('');
      setRecipe([]);
    }
  }, [editingProduct]);

  const addIngredientToRecipe = (materialId) => {
    if (!materialId) return;
    const id = Number(materialId);
    if (recipe.find(ing => ing.materialId === id)) return;
    setRecipe([...recipe, { materialId: id, quantityNeeded: 1 }]);
  };

  const removeIngredient = (id) => {
    setRecipe(recipe.filter(ing => ing.materialId !== id));
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!name || recipe.length === 0) return alert("Fill the name and materials!");

    const productData = {
      name,
      price: Number(price),
      ingredients: recipe
    };

    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, ...productData }));
    } else {
      dispatch(addProduct(productData));
    }

    clearForm();
  };

  const clearForm = () => {
    setName(''); 
    setPrice(''); 
    setRecipe([]);
    dispatch(setEditingProduct(null));
  };

  return (
    <div className="space-y-4">
      {/* HEADER DE STATUS - Janela de edição */}
      {editingProduct && (
        <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/30 px-4 py-3 rounded-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
              Editando: {editingProduct.name}
            </span>
          </div>
          <button 
            type="button"
            onClick={clearForm} 
            className="text-[10px] font-black text-slate-400 hover:text-white uppercase transition-colors cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            [ Cancelar Edição ]
          </button>
        </div>
      )}

      <div className={`p-6 rounded-3xl border transition-all duration-500 ${editingProduct ? 'bg-slate-800/80 border-orange-500 shadow-2xl shadow-orange-900/20' : 'bg-slate-800/40 border-slate-700/50 shadow-xl'}`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${editingProduct ? 'text-orange-400' : 'text-emerald-400'}`}>
          <span className={`px-3 py-1 rounded-lg text-sm font-mono ${editingProduct ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
            {editingProduct ? 'EDIT' : '02'}
          </span> 
          {editingProduct ? 'Change Product Details' : 'Products & Recipes (Products)'}
        </h2>
        
        <form onSubmit={handleSaveProduct} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Product Name</label>
              <input 
                type="text" placeholder="Ex: Gaming Chair" 
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white focus:border-emerald-500 outline-none transition-all"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Unit Price (BRL)</label>
              <input 
                type="number" placeholder="0.00" 
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white focus:border-emerald-500 outline-none transition-all"
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
            <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-tighter">Bill of Materials (BOM):</p>
            <select 
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-300 mb-4 outline-none focus:border-blue-500 cursor-pointer"
              style={{ cursor: 'pointer' }} 
              onChange={(e) => addIngredientToRecipe(e.target.value)}
              value=""
            >
              <option value="">+ Selecionar Insumo para a Receita...</option>
              {rawMaterials.map(m => (
                <option key={m.id} value={m.id} className="cursor-pointer">{m.name} (Available: {m.quantity})</option>
              ))}
            </select>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {recipe.length === 0 && <p className="text-center py-4 text-xs text-slate-600 italic">No materials added to this product yet.</p>}
              {recipe.map(ing => {
                const mat = rawMaterials.find(m => m.id === ing.materialId);
                return (
                  <div key={ing.materialId} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700/50 group">
                    <span className="text-sm font-medium text-slate-300">{mat?.name}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 font-bold">QTY:</span>
                        <input 
                          type="number" className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-center text-sm py-1"
                          value={ing.quantityNeeded}
                          onChange={(e) => setRecipe(recipe.map(r => r.materialId === ing.materialId ? {...r, quantityNeeded: Number(e.target.value)} : r))}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeIngredient(ing.materialId)} 
                        className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-lg active:scale-[0.98] cursor-pointer"
            style={{ 
              cursor: 'pointer',
              backgroundColor: editingProduct ? '#ea580c' : '#059669', 
              color: 'white'
            }}
          >
            {editingProduct ? 'SALVAR ALTERAÇÕES' : 'SAVE FINAL PRODUCT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductManager;