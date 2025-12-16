import React, { useState } from 'react';
import { ShoppingBag, Search, Sun, Moon, LogIn, User, LogOut, PlusCircle, ShieldAlert } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface NavbarProps {
  cartCount: number;
  onNavigate: (view: any) => void;
  currentView: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onSearch: (term: string) => void;
  user: any | null; 
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onNavigate, 
  currentView, 
  isDarkMode, 
  toggleDarkMode, 
  onSearch,
  user,
  userProfile,
  onOpenAuth
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    window.location.reload();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-[50] border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-2 md:gap-4">
          
          {/* ESQUERDA: Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              onClick={() => onNavigate('HOME')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl transform group-hover:rotate-12 transition-transform shadow-lg">
                D
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white hidden md:block">
                Desapeg<span className="text-indigo-600">Aí</span>
              </span>
            </div>
          </div>

          {/* CENTRO: Barra de Busca (Desktop) */}
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="O que procura hoje?" 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm"
              />
              <Search className="absolute left-4 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" size={18} />
            </div>
          </div>

          {/* DIREITA: Ações */}
          <div className="flex items-center gap-2 md:gap-3">
            
            <button 
              onClick={() => onNavigate('SELL')}
              className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 text-sm"
            >
              <PlusCircle size={18} />
              <span>Vender</span>
            </button>

            <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-300">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={() => onNavigate('CART')}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors relative ${currentView === 'CART' ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-800' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* --- LOGIN / PERFIL --- */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pr-1 md:pr-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 border border-gray-200 dark:border-slate-700 rounded-full transition-all"
                >
                  <img 
                    src={userProfile?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}`} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[80px] truncate hidden md:block">
                    {userProfile?.full_name?.split(' ')[0] || 'Eu'}
                  </span>
                </button>

                {isProfileOpen && (
                  <>
                    {/* CAMADA INVISÍVEL PARA FECHAR AO CLICAR FORA */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsProfileOpen(false)}
                    />
                    
                    {/* O MENU DE PERFIL */}
                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 animate-fade-in z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Conta</p>
                        <p className="font-medium text-xs text-gray-900 dark:text-white truncate">{user.email}</p>
                      </div>
                      
                      <button 
                        onClick={() => { onNavigate('PROFILE'); setIsProfileOpen(false); }} 
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2"
                      >
                        <User size={16} /> Meu Perfil
                      </button>

                      {userProfile?.role === 'admin' && (
                        <button 
                          onClick={() => { onNavigate('ADMIN'); setIsProfileOpen(false); }} 
                          className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold text-red-600 flex items-center gap-2"
                        >
                          <ShieldAlert size={16} /> Admin Panel
                        </button>
                      )}

                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-red-500 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700"
                      >
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
              >
                <LogIn size={18} />
                <span className="hidden md:inline">Entrar</span>
              </button>
            )}

          </div>
        </div>

        {/* BUSCA MOBILE */}
        <div className="lg:hidden px-4 pb-3">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
