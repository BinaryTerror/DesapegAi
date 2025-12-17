import React, { useState } from 'react';
import { ChevronDown, MapPin, X, Grid } from 'lucide-react';
import { Category } from '../types';

// Lista de províncias para o filtro
const MOZ_PROVINCES = [
  "Maputo Cidade", "Maputo Província", "Gaza", "Inhambane",
  "Sofala", "Manica", "Tete", "Zambézia", "Nampula",
  "Niassa", "Cabo Delgado"
];

interface FilterBarProps {
  activeCat: string | null;
  activeProv: string | null;
  onSelectCat: (c: string | null) => void;
  onSelectProv: (p: string | null) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeCat, activeProv, onSelectCat, onSelectProv }) => {
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showProvMenu, setShowProvMenu] = useState(false);

  return (
    <div className="w-full mb-6 z-30 flex flex-wrap gap-3">
      
      {/* BOTÃO CATEGORIA */}
      <div className="relative">
        <button 
          onClick={() => { setShowCatMenu(!showCatMenu); setShowProvMenu(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all shadow-sm ${activeCat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700'}`}
        >
          <Grid size={16} />
          {activeCat || 'Categorias'}
          <ChevronDown size={14} />
        </button>

        {showCatMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowCatMenu(false)}/>
            <div className="absolute top-12 left-0 w-64 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-40 animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
               <button onClick={() => { onSelectCat(null); setShowCatMenu(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold dark:text-white">Todas as Categorias</button>
               {Object.values(Category).map(cat => (
                 <button key={cat} onClick={() => { onSelectCat(cat); setShowCatMenu(false); }} className={`w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm ${activeCat === cat ? 'text-indigo-600 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                   {cat}
                 </button>
               ))}
            </div>
          </>
        )}
      </div>

      {/* BOTÃO PROVÍNCIA */}
      <div className="relative">
        <button 
          onClick={() => { setShowProvMenu(!showProvMenu); setShowCatMenu(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-all shadow-sm ${activeProv ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700'}`}
        >
          <MapPin size={16} />
          {activeProv || 'Província'}
          <ChevronDown size={14} />
        </button>

        {showProvMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowProvMenu(false)}/>
            <div className="absolute top-12 left-0 w-56 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-40 animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
               <button onClick={() => { onSelectProv(null); setShowProvMenu(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold dark:text-white">Todo Moçambique</button>
               {MOZ_PROVINCES.map(prov => (
                 <button key={prov} onClick={() => { onSelectProv(prov); setShowProvMenu(false); }} className={`w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm ${activeProv === prov ? 'text-indigo-600 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                   {prov}
                 </button>
               ))}
            </div>
          </>
        )}
      </div>

      {/* BOTÃO LIMPAR */}
      {(activeCat || activeProv) && (
        <button onClick={() => { onSelectCat(null); onSelectProv(null); }} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 px-2">
          <X size={14} /> Limpar
        </button>
      )}
    </div>
  );
};

export default React.memo(FilterBar);
