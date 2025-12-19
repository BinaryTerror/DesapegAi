import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Loader2, Chrome, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redireciona de volta para o site (home) após o login
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
      
      // O redirecionamento acontece automaticamente, não precisa fechar manual
    } catch (err: any) {
      setError(`Erro no login: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative p-8" onClick={e => e.stopPropagation()}>
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Entrar no DesapegAí
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Faça login para anunciar, comprar e gerenciar seus desapegos com segurança.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-center gap-3 shadow-sm group"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Chrome size={22} className="text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Continuar com Google</span>
            </>
          )}
        </button>

        <p className="text-center mt-6 text-xs text-gray-400">
          Ao continuar, você aceita nossos termos de uso.
        </p>
      </div>
    </div>
  );
};
