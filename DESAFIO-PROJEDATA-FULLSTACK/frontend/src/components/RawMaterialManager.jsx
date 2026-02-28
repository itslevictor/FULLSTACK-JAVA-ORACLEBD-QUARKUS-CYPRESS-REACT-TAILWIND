import React from 'react';
import MaterialForm from './MaterialForm';
import InventoryList from './InventoryDashboard'; // Reutilizando sua lista

const RawMaterialManager = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-blue-400 flex items-center gap-2">
          <span>🏗️</span> Manage Materials
        </h2>
        <MaterialForm />
      </div>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Materials in Stock
        </h3>
        <InventoryList />
      </div>
    </div>
  );
};

export default RawMaterialManager;