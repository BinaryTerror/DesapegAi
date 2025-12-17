import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import SellForm from './components/SellForm';
import FilterBar from './components/FilterBar';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { PlansModal } from './components/PlansModal';
import { supabase } from './lib/supabaseClient';
import { Product, CartItem, UserProfile, ViewState } from './types';

// Icons
import { 
  ShoppingBag, Trash2, ArrowRight, Loader2, CheckCircle, 
  PlusCircle, XCircle, Heart, Share2, Flag, PenLine, CreditCard, 
  MapPin, AlertTriangle, Lock, ChevronLeft, Globe, MessageCircle, Copy, Crown, ShieldAlert, Unlock
} from 'lucide-react';
import DOMPurify from 'dompurify'; 

// --- UTILS ---
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
};

// --- HOOKS ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// 🔐 HOOK DE SEGURANÇA (Backend Validation)
function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setIsAdmin(false); setLoading(false); return; }

        // Pergunta ao banco se é admin (Impossível de burlar)
        const { data, error } = await supabase.rpc('am_i_admin');
        if (error) throw error;
        setIsAdmin(data || false);
      } catch (err) {
        console.error('Falha de segurança:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, []);

  return { isAdmin, loading };
}

// 🔐 COMPONENTE GATE (Segurança Visual)
const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState(false);
  
  // A chave secreta definida no .env ou fallback
  const SECRET_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY || "admin123";

  if (isUnlocked) return <>{children}</>;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey === SECRET_KEY) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInputKey('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-gray-700">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Área Restrita</h2>
        <p className="text-gray-400 text-sm mb-6">Confirmação de identidade necessária.</p>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input type="password" placeholder="Senha Mestra..." value={inputKey} onChange={e => setInputKey(e.target.value)} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center tracking-widest outline-none focus:border-red-500 transition-colors" autoFocus />
          {error && <p className="text-red-500 text-xs font-bold animate-pulse">Senha Incorreta</p>}
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"><Unlock size={18} /> Acessar Painel</button>
        </form>
      </div>
    </div>
  );
};

// 🔐 ROTA PROTEGIDA
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900 text-white"><Loader2 className="animate-spin mr-2"/> Verificando credenciais...</div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-slate-900 text-center px-4">
         <ShieldAlert size={64} className="text-red-500 mb-4" />
         <h1 className="text-3xl font-black text-gray-900 dark:text-white">Acesso Negado</h1>
         <p className="text-gray-500 mt-2">O servidor recusou sua credencial de administrador.</p>
      </div>
    );
  }

  return <AdminGate>{children}</AdminGate>;
};

// --- COMPONENTES AUXILIARES ---
const Footer = React.memo(({ onOpenAbout }: { onOpenAbout: () => void }) => (
  <footer className="py-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <p className="text-xs text-gray-500">© 2025 DesapegAí - Moçambique</p>
      <button onClick={onOpenAbout} className="text-xs text-indigo-500 font-bold mt-2 hover:underline">Sobre nós</button>
    </div>
  </footer>
));

const AboutModal = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-black mb-4 dark:text-white">DesapegAí</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">A melhor plataforma de compra e venda de Moçambique.</p>
        <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold">Fechar</button>
      </div>
    </div>
  );
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/'); 
      else navigate('/?login_error=1');
    });
  }, [navigate]);
  return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
};

// --- APP CONTENT ---

function AppContent() {
  const navigate = useNavigate();

  // Estados Globais
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProductCount, setUserProductCount] = useState(0);

  // Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => { try { return JSON.parse(localStorage.getItem('desapegai_cart') || '[]'); } catch { return []; } });
  const [favorites, setFavorites] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem('desapegai_favorites') || '[]')); } catch { return new Set(); } });
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    try { return JSON.parse(localStorage.getItem('desapegai_selected_product') || 'null'); } catch { return null; }
  });
  const [activeImage, setActiveImage] = useState<string>('');

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Modais e Forms
  const [showSellForm, setShowSellForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // --- EFEITOS ---

  useEffect(() => { if (selectedProduct) setActiveImage(selectedProduct.imageUrl); }, [selectedProduct?.id]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('desapegai_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('desapegai_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('desapegai_theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem('desapegai_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('desapegai_favorites', JSON.stringify(Array.from(favorites))); }, [favorites]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').neq('status', 'sold').order('created_at', { ascending: false });
      if (error) throw error;
      const formattedData = (data || []).map((p: any) => ({
        ...p, originalPrice: p.original_price, imageUrl: p.image_url, sellerName: p.seller_name, sellerPhone: p.seller_phone, sellerId: p.user_id, createdAt: p.created_at
      }));
      setProducts(formattedData);
    } catch (error: any) { console.error("Erro buscar produtos:", error.message); } finally { setIsLoading(false); }
  }, []);

  const handleUserLogin = useCallback(async (authUser: any) => {
    setUser(authUser);
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (data) {
      setUserProfile(data);
      if (!data.whatsapp) setShowPhoneModal(true);
      setTempName(data.full_name || '');
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).neq('status', 'sold');
      setUserProductCount(count || 0);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) handleUserLogin(session.user);
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) handleUserLogin(session.user); else { setUser(null); setUserProfile(null); setUserProductCount(0); }
      });
      fetchProducts();
      return () => subscription.unsubscribe();
    };
    initializeApp();
  }, [fetchProducts, handleUserLogin]);

  // --- FILTROS & LÓGICA ---

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesProvince = selectedProvince ? p.province === selectedProvince : true;
      const matchesSearch = debouncedSearch ? p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) : true;
      return matchesCategory && matchesProvince && matchesSearch;
    });
  }, [products, selectedCategory, selectedProvince, debouncedSearch]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) { setUserProfile(data); showToast('Plano atualizado com sucesso!', 'success'); }
  }, [user, showToast]);

  const canUserSell = useCallback(() => {
    if (!user) return false;
    if (userProfile?.role === 'admin') return true;
    const isVip = userProfile?.plan === 'vip' && new Date(userProfile.premium_until || '') > new Date();
    if (isVip) return true;
    const limit = userProfile?.posts_limit || 6;
    return userProductCount < limit;
  }, [user, userProfile, userProductCount]);

  // --- HANDLERS ---

  const handleNavigate = useCallback((newView: ViewState | 'ADMIN') => {
    if (newView === 'SELL') { 
      if (!user) { showToast('Login necessário', 'info'); setShowAuthModal(true); return; }
      if (canUserSell()) { setEditingProduct(null); setShowSellForm(true); } 
      else { showToast(`Limite de ${userProfile?.posts_limit || 6} desapegos atingido!`, 'error'); setShowPlansModal(true); }
    } else if (newView === 'ADMIN') {
      if (userProfile?.role === 'admin') navigate('/admin'); else showToast('Acesso negado', 'error');
    } else {
      const map: Record<string, string> = { 'HOME': '/', 'CART': '/cart', 'PROFILE': '/profile', 'PRODUCT_DETAIL': '/product', 'FAVORITES': '/favorites' };
      if (map[newView]) navigate(map[newView]);
    }
  }, [user, userProfile, canUserSell, navigate, showToast]);

  const handleAddToCart = useCallback((product: Product) => {
    setCart(prev => {
      const isItemInCart = prev.some(item => String(item.id) === String(product.id));
      if (isItemInCart) return prev.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast('Adicionado ao carrinho!');
  }, [showToast]);

  const handleRemoveFromCart = (id: string) => setCart(prev => prev.filter(i => String(i.id) !== String(id)));

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    localStorage.setItem('desapegai_selected_product', JSON.stringify(product));
    navigate('/product');
  }, [navigate]);

  const handleToggleFavorite = useCallback((productId: string) => {
    if (!user) { setShowAuthModal(true); return; }
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId); else newSet.add(productId);
      return newSet;
    });
  }, [user]);

  const handleSellSubmit = async (productData: any) => {
    if (!user) return;
    const payload = {
       title: productData.title, description: productData.description, price: productData.price,
       image_url: productData.imageUrl, images: productData.images, category: productData.category,
       subcategory: productData.subcategory, condition: productData.condition, location: productData.location,
       province: productData.province, user_id: user.id, seller_name: productData.sellerName, seller_phone: productData.sellerPhone, status: 'available'
    };
    
    let error;
    if (editingProduct) {
        const { error: err } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        error = err;
    } else {
        const { error: err } = await supabase.from('products').insert([payload]);
        error = err;
    }

    if (!error) {
        showToast('Sucesso!', 'success');
        fetchProducts();
        setShowSellForm(false);
        setEditingProduct(null);
        navigate('/');
    } else {
        showToast('Erro ao salvar.', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Apagar?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if(!error) { setProducts(prev => prev.filter(p => p.id !== productId)); showToast('Apagado.', 'success'); }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!window.confirm("Confirmar venda?")) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', productId);
    if(!error) { setProducts(prev => prev.map(p => p.id === productId ? {...p, status: 'sold'} : p)); showToast('Vendido!', 'success'); }
  };

  const handleUpdateName = async () => {
    if (!tempName.trim()) return showToast('Nome inválido', 'error');
    const { error } = await supabase.from('profiles').update({ full_name: tempName }).eq('id', user.id);
    if (!error) { setUserProfile((prev: any) => prev ? { ...prev, full_name: tempName } : null); setIsEditingName(false); showToast('Nome atualizado!', 'success'); }
  };

  const handleSavePhone = async () => {
    const phoneRegex = /^8\d{8}$/;
    if (!phoneRegex.test(tempPhone)) return showToast('Número inválido', 'error');
    const { error } = await supabase.from('profiles').update({ whatsapp: tempPhone }).eq('id', user.id);
    if (!error) { setUserProfile((prev: any) => prev ? { ...prev, whatsapp: tempPhone } : null); setShowPhoneModal(false); showToast('Salvo!'); }
  };

  const handleWhatsAppCheckout = () => {
    const item = cart[0];
    if (!item) return;
    const cleanedPhone = String(item.sellerPhone || '841234567').replace(/\D/g, '').replace(/^258/, '');
    const message = `Olá! Tenho interesse no produto: "${item.title}" (${formatMoney(item.price)}) que vi no DesapegAí. Ainda está disponível?`;
    window.open(`https://wa.me/258${cleanedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowPaymentModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col relative">
      <Navbar 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onNavigate={handleNavigate} currentView="HOME"
        isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} onSearch={setSearch} 
        user={user} userProfile={userProfile} userProductCount={userProductCount}
        onOpenAuth={() => setShowAuthModal(true)} onOpenPlans={() => setShowPlansModal(true)}
      />

      {toast && <div className="fixed top-24 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold animate-slide-up bg-green-500 text-white">{toast.msg}</div>}

      {showPhoneModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm relative shadow-2xl">
             <button onClick={() => setShowPhoneModal(false)} className="absolute top-4 right-4"><XCircle /></button>
             <h2 className="text-xl font-bold mb-4 dark:text-white">Atualizar WhatsApp</h2>
             <input type="tel" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="841234567" className="w-full p-3 border rounded-xl mb-4 dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
             <button onClick={handleSavePhone} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Salvar</button>
          </div>
        </div>
      )}

      <button onClick={() => handleNavigate('SELL')} className={`fixed bottom-6 right-6 z-[90] px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white dark:border-slate-800 font-bold transition-transform hover:scale-105 active:scale-95 ${(!user || canUserSell()) ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-gray-500 text-gray-200 cursor-not-allowed shadow-gray-500/30'}`}>
        {(!user || canUserSell()) ? <PlusCircle size={24} /> : <Lock size={24} />} <span>Vender</span>
      </button>

      <main className="pt-24 px-4 max-w-7xl mx-auto w-full min-h-screen">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600"/></div>}>
        <Routes>
          <Route path="/" element={
            <div className="pt-4">
              <FilterBar activeCat={selectedCategory} activeProv={selectedProvince} onSelectCat={setSelectedCategory} onSelectProv={setSelectedProvince} />
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{selectedCategory || 'Tudo'} {selectedProvince && <span className="text-indigo-600 text-lg ml-1">em {selectedProvince}</span>} <span className="text-gray-400 text-sm ml-2">({filteredProducts.length})</span></h2>
                 </div>
                 {isLoading ? <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /> : 
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                      {filteredProducts.map(p => (
                        <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} isLiked={favorites.has(p.id)} onToggleLike={(prod) => handleToggleFavorite(prod.id)} currentUserId={user?.id} onMarkAsSold={handleMarkAsSold} onDelete={handleDeleteProduct} onEdit={(prod) => { setEditingProduct(prod); setShowSellForm(true); }} userProfile={userProfile} />
                      ))}
                   </div>
                 }
              </div>
            </div>
          } />

          <Route path="/cart" element={
            <div className="max-w-2xl mx-auto animate-fade-in">
               <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"><ChevronLeft size={20}/> Voltar</button>
               <h2 className="text-2xl font-bold mb-6 dark:text-white">Carrinho ({cart.length})</h2>
               {cart.length === 0 ? <p className="text-center text-gray-500 py-10">Seu carrinho está vazio.</p> : (
                 <div className="space-y-4">
                    {cart.map(item => (
                       <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                          <img src={item.imageUrl} loading="lazy" className="w-20 h-20 rounded-lg object-cover bg-gray-100" alt={item.title} />
                          <div className="flex-1">
                             <h3 className="font-bold line-clamp-1 dark:text-white">{item.title}</h3>
                             <p className="text-indigo-600 font-bold">{formatMoney(item.price)}</p>
                             <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                          </div>
                          <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 size={18} /></button>
                       </div>
                    ))}
                    <div className="pt-6 border-t dark:border-slate-700 mt-6">
                        <div className="flex justify-between text-xl font-bold mb-4 dark:text-white"><span>Total</span><span>{formatMoney(cart.reduce((a,b) => a + (b.price * b.quantity), 0))}</span></div>
                        <button onClick={() => { if(cart.length > 0) setShowPaymentModal(true); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg">Finalizar <ArrowRight /></button>
                    </div>
                 </div>
               )}
            </div>
          } />

          <Route path="/product" element={selectedProduct ? (
            <div className="max-w-4xl mx-auto animate-fade-in pb-20">
               <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600"><ChevronLeft size={20}/> Voltar</button>
               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 mb-10">
                  <div className="h-[400px] md:h-[500px] bg-gray-100 relative">
                     <img src={activeImage || selectedProduct.imageUrl} className="w-full h-full object-cover transition-opacity duration-300" alt={selectedProduct.title} decoding="async" />
                     <button onClick={() => handleToggleFavorite(selectedProduct.id)} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg hover:scale-110 transition-transform"><Heart size={24} className={favorites.has(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-600"} /></button>
                     {selectedProduct.images && selectedProduct.images.length > 1 && (
                       <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto p-1 scrollbar-hide">
                          {selectedProduct.images.map((img, idx) => (
                             <button key={idx} onClick={() => setActiveImage(img)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-indigo-500 scale-105' : 'border-white opacity-80'}`}><img src={img} className="w-full h-full object-cover" loading="lazy" /></button>
                          ))}
                       </div>
                     )}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col">
                     <span className="text-indigo-600 font-bold text-xs uppercase mb-2 tracking-wide">{selectedProduct.category}</span>
                     <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight dark:text-white">{selectedProduct.title}</h1>
                     <div className="flex items-center gap-2 text-gray-500 mb-4 text-sm"><MapPin size={14} /> {selectedProduct.location}, {selectedProduct.province || 'Moçambique'}</div>
                     <p className="text-3xl font-black mb-6 text-gray-900 dark:text-white">{formatMoney(selectedProduct.price)}</p>
                     
                     <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${selectedProduct.sellerName}`} className="w-12 h-12 rounded-full" />
                        <div><p className="font-bold text-sm dark:text-white">{selectedProduct.sellerName}</p><p className="text-xs text-gray-500">Vendedor</p></div>
                     </div>

                     <div className="text-gray-600 dark:text-gray-300 mb-8 prose dark:prose-invert text-sm md:text-base custom-scrollbar overflow-y-auto max-h-[200px]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedProduct.description) }} />
                     
                     <div className="mt-auto space-y-3">
                       {(user?.id === selectedProduct.sellerId || userProfile?.role === 'admin') ? (
                          <div className="flex flex-col gap-2">
                             {user?.id === selectedProduct.sellerId && <button onClick={() => { setEditingProduct(selectedProduct); setShowSellForm(true); }} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">Editar Anúncio</button>}
                             <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">Apagar Anúncio</button>
                          </div>
                       ) : (
                          <button onClick={() => { handleAddToCart(selectedProduct); navigate('/cart'); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"><ShoppingBag /> Comprar</button>
                       )}
                       <div className="flex gap-2 mt-4">
                          <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copiado!'); }} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-200"><Share2 size={18}/> Partilhar</button>
                          <button onClick={() => window.open(`https://wa.me/258853691613?text=${encodeURIComponent(`Denúncia: ${selectedProduct.title}`)}`)} className="py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-bold hover:bg-red-100" title="Denunciar"><Flag size={18} /></button>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : <div className="text-center py-20"><p>Produto não encontrado.</p><button onClick={() => navigate('/')} className="text-indigo-600 font-bold mt-4">Voltar</button></div>} />

          <Route path="/favorites" element={
             <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
                <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600"><ChevronLeft size={20}/> Voltar</button>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Meus Favoritos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {products.filter(p => favorites.has(p.id)).map(p => (
                      <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} isLiked={true} onToggleLike={(prod) => handleToggleFavorite(prod.id)} currentUserId={user?.id} />
                   ))}
                </div>
                {favorites.size === 0 && <p className="text-center py-10 text-gray-500">Nenhum favorito ainda.</p>}
             </div>
          } />

          <Route path="/profile" element={
            <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
              <div className="text-center mb-10 bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 border border-gray-100 dark:border-slate-700">
                <div className="relative inline-block">
                   <img src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}`} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white dark:border-slate-700 shadow-md" loading="lazy" />
                   {userProfile?.plan === 'vip' && <div className="absolute bottom-4 right-0 bg-orange-500 text-white p-1.5 rounded-full shadow-lg"><Crown size={14} className="fill-white"/></div>}
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                       <input value={tempName} onChange={e => setTempName(e.target.value)} className="border rounded p-1 text-black dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-indigo-500" />
                       <button onClick={handleUpdateName} className="text-green-600"><CheckCircle size={18}/></button>
                       <button onClick={() => setIsEditingName(false)} className="text-red-500"><X size={18}/></button>
                    </div>
                  ) : (
                    <>
                       <h2 className="text-2xl font-bold dark:text-white">{userProfile?.full_name || 'Usuário'}</h2>
                       <button onClick={() => { setTempName(userProfile?.full_name || ''); setIsEditingName(true); }} className="text-gray-400 hover:text-indigo-500"><PenLine size={16}/></button>
                    </>
                  )}
                </div>
                
                <div className="flex justify-center items-center gap-2 mb-6">
                   <span className="text-sm text-gray-500">{userProfile?.whatsapp || 'Sem contato'}</span>
                   <button onClick={() => { setTempPhone(userProfile?.whatsapp || ''); setShowPhoneModal(true); }} className="text-indigo-500 text-xs font-bold hover:underline">Editar</button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                   <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Plano</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">{userProfile?.plan === 'vip' ? 'VIP Ilimitado' : 'Gratuito'}</p>
                   </div>
                   <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Limite</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">{userProductCount} / {userProfile?.posts_limit || 6}</p>
                   </div>
                </div>

                <button onClick={() => setShowPlansModal(true)} className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"><CreditCard size={16}/> Ver Planos</button>
              </div>
              
              <h3 className="text-xl font-bold mb-4 dark:text-white">Meus Anúncios</h3>
              <div className="space-y-4">
                  {products.filter(p => p.sellerId === user?.id).length === 0 ? <p className="text-center text-gray-500 py-10">Você ainda não tem anúncios.</p> : products.filter(p => p.sellerId === user?.id).map(p => (
                     <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm border border-gray-100 dark:border-slate-700">
                        <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover" loading="lazy" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm dark:text-white line-clamp-1">{p.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.status === 'sold' ? 'Vendido' : 'Disponível'}</span>
                          <p className="text-xs text-indigo-600 font-bold mt-1">{formatMoney(p.price)}</p>
                        </div>
                        <div className="flex gap-2">
                           {p.status !== 'sold' && <button onClick={() => handleMarkAsSold(p.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Marcar Vendido"><CheckCircle size={18}/></button>}
                           <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100" title="Apagar"><Trash2 size={18}/></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          } />

          <Route path="/admin" element={<ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
        </Suspense>
      </main>

      <Footer onOpenAbout={() => setShowAboutModal(true)} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      {showSellForm && <SellForm onClose={() => { setShowSellForm(false); setEditingProduct(null); }} onSubmit={handleSellSubmit} initialData={editingProduct} user={user} userProfile={userProfile} />}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      {showPlansModal && user && <PlansModal onClose={() => setShowPlansModal(false)} userEmail={user.email} userId={user.id} onSuccess={refreshUserProfile} />}
      
      {showPaymentModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
               <h3 className="text-xl font-bold mb-4 dark:text-white">Finalizar no WhatsApp</h3>
               <div className="flex flex-col gap-3">
                 <button onClick={handleWhatsAppCheckout} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"><MessageCircle /> Iniciar Conversa</button>
                 <button onClick={() => { 
                    const item = cart[0]; 
                    if(item) navigator.clipboard.writeText(item.sellerPhone || ''); 
                    showToast('Número copiado!');
                 }} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"><Copy size={18}/> Copiar Número</button>
               </div>
               <button onClick={() => setShowPaymentModal(false)} className="w-full mt-4 text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
            </div>
         </div>
      )}
    </div>
  );
}

const App: React.FC = () => <Router><AppContent /></Router>;
export default App;
