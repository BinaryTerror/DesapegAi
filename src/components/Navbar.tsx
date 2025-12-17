import React, { useState } from 'react';
import { ShoppingBag, Search, Sun, Moon, LogIn, User, LogOut, ShieldAlert, CreditCard, Menu, X, Crown, LayoutDashboard } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface NavbarProps {
  cartCount: number;
  onNavigate: (view: ViewState | 'ADMIN' | 'SELL') => void;
  currentView: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onSearch: (term: string) => void;
  user: any | null; 
  userProfile: UserProfile | null;
  userProductCount: number; // NOVO: Recebe a contagem
  onOpenAuth: () => void;
  onOpenPlans: () => void;
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
  userProductCount,
  onOpenAuth,
  onOpenPlans
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Para o menu hamburguer

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    window.location.reload();
  };

  const isAdmin = userProfile?.role === 'admin';
  // Verifica se é VIP com data válida
  const isVip = userProfile?.plan === 'vip' && new Date(userProfile.premium_until || '') > new Date();
  const limit = userProfile?.posts_limit || 6;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-[50] border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-2 md:gap-4">
        
        {/* ESQUERDA: Logo */}
        <div 
          onClick={() => onNavigate('HOME')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl transform group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/30">
            D
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white hidden md:block">
            Desapeg<span className="text-indigo-600">Aí</span>
          </span>
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
          
          {/* BOTÃO DE CRÉDITOS NO TOPO (Se logado) */}
          {user && (
             <button 
               onClick={onOpenPlans}
               className="hidden md:flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform border border-orange-100 dark:border-orange-800"
             >
               {isVip ? <Crown size={14} className="fill-orange-400"/> : <CreditCard size={14} />}
               <span>{isVip ? 'VIP' : `${userProductCount}/${limit}`}</span>
               {!isVip && <div className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center ml-1 text-[10px]">+</div>}
             </button>
          )}

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

          {/* --- LOGIN / PERFIL (Desktop) --- */}
          {user ? (
            <div className="relative hidden md:block">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pr-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 border border-gray-200 dark:border-slate-700 rounded-full transition-all"
              >
                <img 
                  src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                />
                <div className="text-left">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[80px] truncate">{userProfile?.full_name?.split(' ')[0] || 'User'}</p>
                    {isVip && <p className="text-[9px] text-orange-500 font-bold leading-none">VIP</p>}
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                       <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Logado como</p>
                       <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    
                    {isAdmin && (
                      <button onClick={() => { onNavigate('ADMIN'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-bold text-purple-600 flex items-center gap-2">
                        <ShieldAlert size={16} /> Painel Admin
                      </button>
                    )}

                    <button onClick={() => { onNavigate('PROFILE'); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <User size={16} /> Meu Perfil
                    </button>
                    
                    <button onClick={() => { onOpenPlans(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <CreditCard size={16} /> Meus Planos
                    </button>

                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-medium text-red-500 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700 mt-1">
                      <LogOut size={16} /> Sair da conta
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="hidden md:flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
            >
              <LogIn size={18} />
              <span>Entrar</span>
            </button>
          )}

          {/* MENU MOBILE TOGGLE */}
          <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden p-2 text-gray-600 dark:text-gray-300"
          >
             {isMobileMenuOpen ? <X/> : <Menu/>}
          </button>
        </div>
      </div>

      {/* MENU MOBILE EXPANDIDO */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-4 shadow-xl animate-slide-down z-40">
           {/* Busca */}
           <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-sm dark:text-white outline-none"
              />
           </div>

           <div className="grid grid-cols-2 gap-3">
              {user ? (
                <>
                   <button onClick={() => { onNavigate('PROFILE'); setIsMobileMenuOpen(false); }} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 font-bold dark:text-white border dark:border-slate-700">
                      <User className="text-indigo-600"/> Perfil
                   </button>
                   <button onClick={() => { onOpenPlans(); setIsMobileMenuOpen(false); }} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 font-bold dark:text-white border dark:border-slate-700 relative overflow-hidden">
                      {isVip && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg">VIP</div>}
                      <CreditCard className="text-orange-500"/> Planos
                   </button>
                   {isAdmin && (
                     <button onClick={() => { onNavigate('ADMIN'); setIsMobileMenuOpen(false); }} className="col-span-2 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl flex items-center justify-center gap-2 font-bold text-purple-600 border border-purple-100 dark:border-purple-800">
                        <ShieldAlert/> Painel Admin
                     </button>
                   )}
                   <button onClick={handleLogout} className="col-span-2 py-4 text-red-500 font-bold flex justify-center items-center gap-2 border-t dark:border-slate-800 mt-2">
                      <LogOut size={18}/> Sair
                   </button>
                </>
              ) : (
                <button onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }} className="col-span-2 bg-black dark:bg-white text-white dark:text-black p-4 rounded-xl font-bold flex justify-center items-center gap-2">
                   <LogIn/> Fazer Login
                </button>
              )}
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
