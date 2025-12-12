import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, User, Loader2, Chrome } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // ✅ CORRIGIDO: Login com Google com redirecionamento dinâmico
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
    // Pega a URL base do Supabase das variáveis de ambiente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // O redirect DEVE ser para o endpoint do Supabase, não seu site
    const redirectUrl = `${supabaseUrl}/auth/v1/callback`;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Redirect URL:', 'https://dhqqpentqbifpxqzkadz.supabase.co/auth/v1/callback');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl, // ⬅️ AGORA CORRETO: URL do Supabase
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      setError(`Erro no login Google: ${error.message}`);
      console.error('Erro Supabase:', error);
    } else {
      // Fecha o modal - o redirecionamento para Google acontece automaticamente
      onClose();
    }
  } catch (err: any) {
    setError(`Erro inesperado: ${err.message}`);
    console.error('Erro catch:', err);
  } finally {
    setLoading(false);
  }
  };

  // Login/Cadastro com Email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      } else {
        // --- CADASTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, avatar_url: '' },
            emailRedirectTo: window.location.origin // Redireciona após confirmação
          }
        });
        if (error) throw error;
        alert('Conta criada! Verifique seu email para confirmar.');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isLogin ? 'Entre para gerenciar suas vendas' : 'Junte-se ao maior marketplace de moda'}
            </p>
          </div>

          {/* Botão Google */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 mb-6 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Chrome size={20} className="text-blue-500" />
                Continuar com Google
              </>
            )}
          </button>

          <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
            </div>
            <span className="relative bg-white dark:bg-slate-800 px-4 text-xs text-gray-400 uppercase font-bold">
              OU USE EMAIL
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-bold rounded-lg">
                {error}
              </div>
            )}

            {/* Campo Nome (Só aparece no cadastro) */}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Seu Nome Completo"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
              type="button"
            >
              {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};