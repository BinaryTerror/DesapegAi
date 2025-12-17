import React, { useState } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

export const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const { isAdminMode, unlockAdmin } = useSecurity();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState(false);

  if (isAdminMode) {
    return <>{children}</>;
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(inputKey)) {
      setError(false);
    } else {
      setError(true);
      setInputKey('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-700">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShieldAlert size={40} className="text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Área Restrita</h2>
        <p className="text-gray-400 text-sm mb-6">Digite a palavra-chave de segurança.</p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password" 
            placeholder="Palavra-chave..." 
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center tracking-widest outline-none focus:border-red-500 transition-colors"
            autoFocus
          />
          
          {error && <p className="text-red-500 text-xs font-bold animate-pulse">Acesso Negado</p>}

          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
            <Unlock size={18} /> Desbloquear Painel
          </button>
        </form>
      </div>
    </div>
  );
};