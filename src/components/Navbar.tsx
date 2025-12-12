import React, { useState } from 'react';
import { ShoppingBag, Search, Sun, Moon, LogIn, User, LogOut, PlusCircle } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface NavbarProps {
  cartCount: number;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onSearch: (term: string) => void;
  // Auth props
  user: any | null; 
  userProfile: UserProfile | null;
  onOpenAuth: () => void; // <--- A função que abre o Modal de Login
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div 
          onClick={() => onNavigate('HOME')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl transform group-hover:rotate-12 transition-transform">
            D
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white hidden md:block">
            Desapeg<span className="text-indigo-600">Ai</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="O que procura hoje?" 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" size={20} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* BOTÃO VENDER (Desktop) */}
          <button 
            onClick={() => onNavigate('SELL')}
            className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5"
          >
            <PlusCircle size={18} />
            <span>Vender</span>
          </button>

          <button onClick={toggleDarkMode} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-300">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => onNavigate('CART')}
            className={`p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors relative ${currentView === 'CART' ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-800' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                {cartCount}
              </span>
            )}
          </button>

          {/* --- LOGIN / PERFIL --- */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pr-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 border border-gray-200 dark:border-slate-700 rounded-full transition-all"
              >
                <img 
                  src={userProfile?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[80px] truncate hidden md:block">
                  {userProfile?.full_name || 'Usuário'}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                     <p className="text-xs text-gray-500 dark:text-gray-400">Logado como</p>
                     <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { onNavigate('PROFILE'); setIsMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2"
                  >
                    <User size={16} /> Meu Perfil
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold text-red-500 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
            >
              <LogIn size={18} />
              <span className="hidden md:inline">Entrar</span>
            </button>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;