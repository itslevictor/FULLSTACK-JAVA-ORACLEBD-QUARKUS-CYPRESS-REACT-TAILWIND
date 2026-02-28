// ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProduct, updateProduct, setEditingProduct, selectAllMaterials } from '../store/inventorySlice';

const ProductForm = () => {
  const dispatch = useDispatch();
  const materialsInStock = useSelector(selectAllMaterials);
  
  const editingProduct = useSelector(state => state.inventory.editingProduct);

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [neededQuantity, setNeededQuantity] = useState('');
  const [recipe, setRecipe] = useState([]);
  
  // NOVO: Estado para erro visual
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setProductName(editingProduct.name || '');
      setProductPrice(editingProduct.price || '');
      const formattedRecipe = (editingProduct.ingredients || []).map(ing => {
        const mId = ing.rawMaterial ? ing.rawMaterial.id : ing.materialId;
        const mat = materialsInStock.find(m => m.id === mId);
        return {
          materialId: mId,
          name: mat ? mat.name : (ing.rawMaterial?.name || 'Unknown Material'),
          quantityNeeded: ing.quantityNeeded
        };
      });
      setRecipe(formattedRecipe);
    } else {
      clearForm();
    }
  }, [editingProduct, materialsInStock]);

  const clearForm = () => {
    setProductName('');
    setProductPrice('');
    setRecipe([]);
    setSelectedMaterialId('');
    setNeededQuantity('');
    setFormError(null); // Limpa erro ao resetar
  };

  const handleCancelEdit = () => {
    dispatch(setEditingProduct(null));
  };

  const handleAddMaterialToRecipe = () => {
    if (!selectedMaterialId || !neededQuantity || neededQuantity <= 0) return;
    
    const material = materialsInStock.find(m => m.id === parseInt(selectedMaterialId));
    
    if (!material) return;

    const alreadyInRecipe = recipe.find(item => item.materialId === material.id);
    
    if (alreadyInRecipe) {
      setFormError("Este material já está na receita!");
      return;
    }

    const newEntry = {
      materialId: material.id,
      name: material.name,
      quantityNeeded: parseFloat(neededQuantity)
    };

    setRecipe([...recipe, newEntry]);
    setSelectedMaterialId('');
    setNeededQuantity('');
    setFormError(null);
  };

  const updateRecipeQuantity = (materialId, newQty) => {
    const qty = parseFloat(newQty) || 0;
    setRecipe(recipe.map(item => 
      item.materialId === materialId ? { ...item, quantityNeeded: qty } : item
    ));
  };

  const removeMaterialFromRecipe = (id) => {
    setRecipe(recipe.filter(item => item.materialId !== id));
  };

  const handleSaveProduct = async () => {
    setFormError(null); // Reseta erro antes de tentar salvar

    if (!productName || !productPrice || recipe.length === 0) {
        setFormError("Fill out the entire form and add at least one material.");
        return;
    }

    const productData = {
      name: productName,
      price: parseFloat(productPrice),
      ingredients: recipe.map(r => ({ 
        materialId: r.materialId,
        quantityNeeded: r.quantityNeeded 
      }))
    };

    try {
      if (editingProduct) {
        await dispatch(updateProduct({ 
          id: editingProduct.id, 
          ...productData 
        })).unwrap();
      } else {
        await dispatch(addProduct(productData)).unwrap();
      }
      
      clearForm();
      dispatch(setEditingProduct(null));
    } catch (error) {
      console.log("DEBUG ERROR:", error);
      // CORREÇÃO: Pega a string de erro do backend ou uma mensagem padrão
      const errorMessage = typeof error === 'string' ? error : (error.message || "The product already exists");
      setFormError(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {editingProduct && (
        <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
              Editing: {editingProduct.name}
            </span>
          </div>
          <button 
            onClick={handleCancelEdit}
            className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black px-3 py-1 rounded-lg transition-all border border-red-500/30 uppercase"
            style={{ cursor: 'pointer' }}
          >
            Cancel Edit
          </button>
        </div>
      )}

      <div className={`p-6 rounded-3xl border transition-all duration-500 ${editingProduct ? 'bg-slate-800 border-orange-500/50 shadow-2xl shadow-orange-950/20' : 'bg-slate-800/50 border-slate-700 shadow-xl'}`}>
        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${editingProduct ? 'text-orange-400' : 'text-emerald-400'}`}>
          <span className={`p-2 rounded-lg ${editingProduct ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
            {editingProduct ? '✏️' : '📦'}
          </span> 
          {editingProduct ? 'Update Product' : 'Product Registration'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Product Name</label>
            <input 
              type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              placeholder="Ex: Gaming Chair"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Unit Price (BRL)</label>
            <input 
              type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 space-y-4 mt-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bill of Materials (BOM)</p>
          
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] text-slate-500 uppercase ml-1">Material</label>
              <select 
                value={selectedMaterialId} 
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm mt-1 text-slate-200 outline-none"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select Material...</option>
                {materialsInStock.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Stock: {m.stockQuantity ?? 0})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-24">
              <label className="text-[10px] text-slate-500 uppercase ml-1">Qty</label>
              <input 
                type="number" value={neededQuantity} onChange={(e) => setNeededQuantity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm mt-1 text-white outline-none"
                placeholder="0"
              />
            </div>

            <button 
              onClick={handleAddMaterialToRecipe}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
              style={{ cursor: 'pointer' }}
            >
              Add
            </button>
          </div>

          <div className="space-y-2 mt-4 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
            {recipe.map((item) => (
              <div key={item.materialId} className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700 group hover:border-blue-500/50 transition-all">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Material ID: {item.materialId}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold">QTY:</span>
                    <input 
                      type="number"
                      value={item.quantityNeeded}
                      onChange={(e) => updateRecipeQuantity(item.materialId, e.target.value)}
                      className="w-14 bg-transparent text-white text-sm font-bold text-center outline-none focus:text-blue-400 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => removeMaterialFromRecipe(item.materialId)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors bg-slate-900/50 rounded-lg hover:bg-red-500/10"
                    style={{ cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {recipe.length === 0 && (
              <p className="text-[10px] text-slate-600 text-center italic py-4">No materials added to this product yet.</p>
            )}
          </div>
        </div>

        {/* ÁREA DE ERRO: Pequeno aviso em vermelho antes do botão */}
        {formError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <p className="text-red-500 text-xs font-bold text-center">⚠️ {formError}</p>
          </div>
        )}

        <button 
          onClick={handleSaveProduct}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl mt-6 ${editingProduct ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-950/40' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'}`}
          style={{ cursor: 'pointer' }}
        >
          {editingProduct ? 'Update Product Details' : 'Save Final Product'}
        </button>
      </div>
    </div>
  );
};

export default ProductForm;