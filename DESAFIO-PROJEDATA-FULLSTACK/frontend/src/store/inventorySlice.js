import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:8081';

const fetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  return options;
};

// --- AÇÕES ASSÍNCRONAS ---

export const fetchMaterials = createAsyncThunk('inventory/fetchMaterials', async () => {
  const response = await fetch(`${API_URL}/materials`, fetchOptions());
  if (!response.ok) throw new Error('Erro ao buscar materiais');
  return response.json();
});

export const addMaterial = createAsyncThunk('inventory/addMaterial', async (material) => {
  const payload = {
    name: material.name,
    stockQuantity: Number(material.stockQuantity || material.quantity)
  };
  const response = await fetch(`${API_URL}/materials`, fetchOptions('POST', payload));
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Erro ao adicionar material');
  }
  return response.json();
});

export const updateMaterial = createAsyncThunk('inventory/updateMaterial', async (material) => {
  const payload = {
    id: material.id,
    name: material.name,
    stockQuantity: Number(material.stockQuantity || material.quantity)
  };
  const response = await fetch(`${API_URL}/materials/${material.id}`, fetchOptions('PUT', payload));
  if (!response.ok) throw new Error('Erro ao atualizar material');
  return response.json();
});

export const deleteMaterial = createAsyncThunk('inventory/deleteMaterial', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URL}/materials/${id}`, fetchOptions('DELETE'));
    if (!response.ok) throw new Error('Linked to a product');
    return id;
  } catch (error) {
    return rejectWithValue({ id, message: error.message });
  }
});

export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async () => {
  const response = await fetch(`${API_URL}/products`, fetchOptions());
  if (!response.ok) throw new Error('Erro ao buscar produtos');
  return response.json();
});

export const addProduct = createAsyncThunk(
  'inventory/addProduct', 
  async (product, { rejectWithValue }) => { 
    try {
      const response = await fetch(`${API_URL}/products`, fetchOptions('POST', {
        ...product,
        ingredients: product.ingredients.map(ing => ({
          quantityNeeded: ing.quantityNeeded,
          rawMaterial: { id: ing.materialId || ing.rawMaterial?.id }
        }))
      }));

      if (!response.ok) {
        let errorText = await response.text();
        // ESTA É A CHAVE: rejectWithValue envia a string pura do Java sem serializar
        // Se o texto vier entre aspas (ex: ""Mensagem""), isso remove
        errorText = errorText.replace(/^"|"$/g, '');
        return rejectWithValue(errorText); 
      }
      return response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Adicione o { rejectWithValue } como segundo argumento da função async
export const updateProduct = createAsyncThunk(
  'inventory/updateProduct', 
  async (product, { rejectWithValue }) => { 
    try {
      const payload = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        ingredients: product.ingredients.map(ing => ({
          rawMaterial: { id: ing.materialId || ing.rawMaterial?.id },
          quantityNeeded: parseFloat(ing.quantityNeeded)
        }))
      };

      const response = await fetch(`${API_URL}/products/${product.id}`, fetchOptions('PUT', payload));
      
      if (!response.ok) {
        // Capturamos a string exata do Quarkus (ex: "Já existe outro produto com o nome: X")
        let errorText = await response.text();
        // O rejectWithValue garante que o unwrap() entregue APENAS essa string ao catch
        errorText = errorText.replace(/^"|"$/g, '');
        return rejectWithValue(errorText);
      }

      return response.json();
    } catch (error) {
      // Caso ocorra um erro de rede (servidor offline, etc)
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk('inventory/deleteProduct', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, fetchOptions('DELETE'));
    if (!response.ok) throw new Error('Error deleting product');
    return id;
  } catch (error) {
    return rejectWithValue({ id, message: error.message });
  }
});

export const fetchProductionSuggestion = createAsyncThunk('inventory/fetchSuggestion', async () => {
  const response = await fetch(`${API_URL}/products/suggestion`, fetchOptions('GET'));
  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Erro ao calcular sugestão');
  }
  return response.json();
});

// --- SLICE ---

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    rawMaterials: [], 
    products: [],
    suggestion: { products: [], totalEstimatedValue: 0 },
    editingMaterial: null,
    editingProduct: null,
    status: 'idle',
    error: null,
    deleteErrorId: null,
    deleteProductErrorId: null
  },
  reducers: {
    setEditingMaterial: (state, action) => { state.editingMaterial = action.payload; },
    setEditingProduct: (state, action) => { state.editingProduct = action.payload; },
    clearDeleteError: (state) => { 
      state.deleteErrorId = null; 
      state.deleteProductErrorId = null; 
    },
    removeIngredientFromProduct: (state, action) => {
      const { productId, materialId } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.ingredients = product.ingredients.filter(ing => {
          const idExistente = ing.rawMaterial ? ing.rawMaterial.id : ing.materialId;
          return idExistente !== materialId;
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rawMaterials = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => { 
        state.products = action.payload; 
      })
      .addCase(fetchProductionSuggestion.fulfilled, (state, action) => { 
        state.suggestion = action.payload; 
      })
      .addCase(addMaterial.fulfilled, (state, action) => { 
        state.rawMaterials.push(action.payload); 
      })
      .addCase(addProduct.fulfilled, (state, action) => { 
        state.products.push(action.payload);
        state.editingProduct = null;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const index = state.rawMaterials.findIndex(m => m.id === action.payload.id);
        if (index !== -1) state.rawMaterials[index] = action.payload;
        state.editingMaterial = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.status = 'succeeded'; // Sucesso!
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.products[index] = action.payload;
        state.editingProduct = null;
        state.error = null; // Limpa erros anteriores
      })
      
      // O que acontece quando o Java retorna 409 CONFLICT (a duplicidade)
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = 'failed';
        // O payload aqui é a string que o rejectWithValue enviou
        state.error = action.payload || "Product update failed";
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.rawMaterials = state.rawMaterials.filter(m => m.id !== action.payload);
        state.deleteErrorId = null;
      })
      .addCase(deleteMaterial.rejected, (state, action) => {
        state.deleteErrorId = action.payload?.id;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload); 
        state.deleteProductErrorId = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteProductErrorId = action.payload?.id;
      })
      // O addMatcher entra aqui como um "ouvinte global" de sucessos
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state, action) => {
          // Se qualquer operação de escrita (add, update, delete) der certo,
          // resetamos o status para 'idle' para forçar o sistema a revalidar se necessário
          if (!action.type.includes('fetch')) {
            state.status = 'idle';
          }
        }
      );
  }
});

export const { setEditingMaterial, setEditingProduct, removeIngredientFromProduct, clearDeleteError } = inventorySlice.actions;
export const selectAllMaterials = (state) => state.inventory.rawMaterials;
export const selectAllProducts = (state) => state.inventory.products;
export const selectSuggestion = (state) => state.inventory.suggestion;
export const selectInventoryStatus = (state) => state.inventory.status;
export const selectInventoryError = (state) => state.inventory.error;

export default inventorySlice.reducer;