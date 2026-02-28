import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import IconButton from './IconButton';
import { 
  deleteProduct, 
  selectAllProducts, 
  setEditingProduct, 
  selectAllMaterials,
  setEditingMaterial,
  removeIngredientFromProduct,
  clearDeleteError
} from '../store/inventorySlice';

const ProductList = () => {
  const products = useSelector(selectAllProducts);
  const materials = useSelector(selectAllMaterials);
  const deleteProductErrorId = useSelector(state => state.inventory.deleteProductErrorId);
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Limpa erros após 3 segundos
  useEffect(() => {
    if (deleteProductErrorId) {
      const timer = setTimeout(() => dispatch(clearDeleteError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteProductErrorId, dispatch]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMaterialDetails = (ing) => {
    const mId = ing.rawMaterial ? ing.rawMaterial.id : ing.materialId;
    const found = materials.find(m => m.id === mId);
    if (found) return found;
    if (ing.rawMaterial && ing.rawMaterial.name) {
      return { name: ing.rawMaterial.name, id: mId };
    }
    return { name: 'Unknown', id: mId };
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400">🔍</span>
        <input 
          type="text" 
          placeholder="Search product..." 
          className="w-full bg-slate-950/50 border border-slate-800 pl-10 pr-4 py-3 rounded-2xl text-sm text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-600 text-sm italic">No products found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredProducts.map((product) => (
            <li key={`prod-${product.id}`} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all group relative shadow-sm">
              
              {/* MENSAGEM DE ERRO (BOUNCE) */}
              {deleteProductErrorId === product.id && (
                <div className="absolute -top-2 left-0 right-0 flex justify-center animate-bounce z-10">
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase">
                    Error deleting product
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start gap-2 mb-4">
                <div className="min-w-0">
                  <p className="text-slate-100 font-bold text-base md:text-lg truncate leading-tight">
                    {product.name}
                  </p>
                  <p className="text-xs text-emerald-500 font-mono font-black uppercase tracking-widest mt-1">
                    {(product.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 min-w-[90px] justify-end">
                  {confirmDeleteId === product.id ? (
                    <div className="flex items-center gap-1 animate-in zoom-in duration-200">
                      <button 
                        onClick={() => {
                          dispatch(deleteProduct(product.id));
                          setConfirmDeleteId(null);
                        }}
                        className="text-[10px] bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1.5 rounded-lg cursor-pointer transition-transform active:scale-95"
                      > YES </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1.5 rounded-lg cursor-pointer"
                      > NO </button>
                    </div>
                  ) : (
                    <>
                      <IconButton 
                        onClick={() => dispatch(setEditingProduct(product))}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </IconButton>

                      <IconButton 
                        onClick={() => {
                          dispatch(clearDeleteError());
                          setConfirmDeleteId(product.id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </IconButton>
                    </>
                  )}
                </div>
              </div>

              {/* MANTENDO TODA A LOGICA DE INGREDIENTES QUE VOCÊ JÁ TINHA */}
              <div className="flex flex-wrap gap-2">
                {product.ingredients?.map((ing, index) => {
                  const mat = getMaterialDetails(ing);
                  const uniqueKey = `ing-${product.id}-${mat.id || 'idx'}-${index}`;
                  
                  return (
                    <div key={uniqueKey} className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 py-1.5 px-3 rounded-full hover:border-slate-600 transition-all group/tag">
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        <span className="text-blue-500">{ing.quantityNeeded}x</span> {mat.name}
                      </span>
                      
                      <div className="flex items-center border-l border-slate-800 ml-1 pl-2 gap-2">
                        <IconButton
                          onClick={() => {
                            const materialCompleto = materials.find(m => m.id === (mat.id));
                            if(materialCompleto) dispatch(setEditingMaterial(materialCompleto));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-slate-600 hover:text-orange-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </IconButton>

                        <IconButton
                          onClick={() => dispatch(removeIngredientFromProduct({ productId: product.id, materialId: mat.id }))}
                          className="text-slate-600 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </IconButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductList;