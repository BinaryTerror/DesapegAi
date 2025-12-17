import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import SellForm from './components/SellForm';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { PlansModal } from './components/PlansModal';
import { supabase } from './lib/supabaseClient';
import { Product, CartItem, UserProfile, Category, ViewState, Review } from './types';

// Imports de ícones
import { 
  ShoppingBag, Trash2, ArrowRight, Loader2, Save, CheckCircle, 
  PlusCircle, XCircle, Heart, Linkedin, Globe, Filter, ChevronDown, ChevronUp, X, Copy, Share2, Flag, PenLine, CreditCard, MapPin, Star, AlertTriangle
} from 'lucide-react';
import DOMPurify from 'dompurify'; 

// --- OTIMIZAÇÃO 1: Utilitários fora do componente (evita recriação) ---
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
};

// --- OTIMIZAÇÃO 2: Hook de Debounce (Para a busca não travar a digitação) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- COMPONENTES MEMOIZADOS (React.memo) ---
// Evita re-render se as props não mudarem

const Footer = React.memo(({ onOpenAbout }: { onOpenAbout: () => void }) => (
  <footer className="py-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <span>Powered by</span>
        <a href="http://piripiri.chat" target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline">Otseven</a>
      </div>
      <div className="flex gap-6">
        <span>© 2025 DesapegAí</span>
        <button onClick={onOpenAbout} className="hover:text-indigo-600 transition-colors font-medium hover:underline">Sobre nós</button>
      </div>
    </div>
  </footer>
));

const AboutModal = React.memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative text-center animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"><XCircle size={24} className="text-gray-400" /></button>
        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 mt-2">Quem Somos</h2>
        {/* Conteúdo estático simplificado para brevidade, mas mantido a estrutura */}
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Equipe DesapegAí</h3>
                <p className="text-xs text-gray-500 mt-2">Plataforma otimizada.</p>
            </div>
        </div>
      </div>
    </div>
  );
});

// Componente FilterBar Otimizado
const CategoryFilterBar = React.memo(({ activeCat, onSelect }: { activeCat: string | null, onSelect: (c: string | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // UseCallback para evitar recriação da função
  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);
  const handleSelect = useCallback((cat: string | null) => {
    onSelect(cat);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div className="relative w-full mb-6 z-30">
      <div className="flex items-center justify-between">
        <button onClick={handleToggle} className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${isOpen || activeCat ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700'}`}>
          <Filter size={18} />
          {activeCat ? activeCat : 'Filtrar por Categoria'}
          {isOpen ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
        </button>
        {activeCat && (
          <button onClick={() => handleSelect(null)} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"><X size={14} /> Limpar filtro</button>
        )}
      </div>
      {isOpen && (
        <div className="absolute top-14 left-0 w-full md:w-[600px] bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-2xl z-40 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleSelect(null)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!activeCat ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}>Todas</button>
            {Object.values(Category).map(cat => (
              <button key={cat} onClick={() => handleSelect(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${activeCat === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'}`}>{cat}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

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

  // Estados
  const [newRating, setNewRating] = useState(5);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [userProductCount, setUserProductCount] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  
  // Lazy init state (evita parse JSON a cada render, só na montagem inicial)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    try {
      const saved = localStorage.getItem('desapegai_selected_product');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeImage, setActiveImage] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('desapegai_cart') || '[]');
    } catch { return []; }
  });

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const savedFavs = localStorage.getItem('desapegai_favorites');
      return savedFavs ? new Set(JSON.parse(savedFavs)) : new Set();
    } catch { return new Set(); }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // OTIMIZAÇÃO 3: Estado de busca separado para debounce
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400); // Espera 400ms após parar de digitar

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // --- EFEITOS E CALLBACKS OTIMIZADOS ---

  // OTIMIZAÇÃO 4: useCallback para evitar recriação de funções passadas como props
  const handleToggleFavorite = useCallback((productId: string) => {
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  }, [user]); // Removeu 'showToast' da dependência se não for mudar

  // Otimização: Atualizar imagem ativa apenas se produto mudar
  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.imageUrl);
    }
  }, [selectedProduct?.id]); // Dependência específica

  // Tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('desapegai_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('desapegai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('desapegai_theme', 'light');
    }
  }, [isDarkMode]);

  // Persistência
  useEffect(() => { localStorage.setItem('desapegai_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('desapegai_favorites', JSON.stringify(Array.from(favorites))); }, [favorites]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products')
        .select(`
          id, title, description, price, original_price, image_url, images, category, subcategory, condition, 
          location, seller_name, seller_phone, seller_rating, likes, status, user_id, created_at
        `)
        .neq('status', 'sold')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map para corrigir nomes de campos camelCase
      const formattedData = (data || []).map((p: any) => ({
        ...p,
        originalPrice: p.original_price,
        imageUrl: p.image_url,
        sellerName: p.seller_name,
        sellerPhone: p.seller_phone,
        sellerRating: p.seller_rating,
        sellerId: p.user_id,
        createdAt: p.created_at
      }));
      
      setProducts(formattedData);
    } catch (error: any) { 
      console.error("Erro buscar produtos:", error.message);
    } finally { setIsLoading(false); }
  }, []); // Sem dependências, função estável

  const handleUserLogin = useCallback(async (authUser: any) => {
    setUser(authUser);
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (data) {
      setUserProfile(data);
      if (!data.whatsapp) setShowPhoneModal(true);
      setTempName(data.full_name || '');
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id);
      setUserProductCount(count || 0);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) handleUserLogin(session.user);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) handleUserLogin(session.user);
        else { 
          setUser(null); 
          setUserProfile(null);
          setUserProductCount(0);
        }
      });

      fetchProducts();
      return () => subscription.unsubscribe();
    };
    initializeApp();
  }, [fetchProducts, handleUserLogin]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // OTIMIZAÇÃO 5: useMemo para Filtragem Pesada
  // Só roda o filtro quando debouncedSearch, products ou category mudam.
  // Não roda a cada tecla digitada (apenas após o debounce).
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesSearch = debouncedSearch ? p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) : true;
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, debouncedSearch]);

  // Handler functions memoized
  const handleAddToCart = useCallback((product: Product) => {
    setCart(prev => {
      const isItemInCart = prev.some(item => String(item.id) === String(product.id));
      if (isItemInCart) {
        return prev.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast('Adicionado ao carrinho!', 'success');
  }, [showToast]);

  const handleRemoveFromCart = useCallback((id: string) => setCart(prev => prev.filter(i => String(i.id) !== String(id))), []);

  const handleProductClick = useCallback(async (product: Product) => {
    setSelectedProduct(product);
    localStorage.setItem('desapegai_selected_product', JSON.stringify(product));
    
    // Optimistic Update: Limpa reviews antigas antes de carregar novas
    setReviews([]); 
    
    const { data } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
    if (data) {
        setReviews(data.map((r: any) => ({
            id: r.id,
            userName: r.user_name,
            comment: r.comment,
            rating: r.rating,
            date: new Date(r.created_at).toLocaleDateString('pt-MZ')
        })));
    }
    navigate('/product');
  }, [navigate]);

  const handleNavigate = useCallback((newView: ViewState | 'ADMIN') => {
    if (newView === 'SELL') { 
      if (!user) { showToast('Login necessário', 'info'); setShowAuthModal(true); } 
      else { setEditingProduct(null); setShowSellForm(true); }
    } else if (newView === 'ADMIN') {
      if (userProfile?.role === 'admin') navigate('/admin');
      else showToast('Acesso negado', 'error');
    } else {
      const map: Record<string, string> = { 'HOME': '/', 'CART': '/cart', 'PROFILE': '/profile', 'PRODUCT_DETAIL': '/product', 'FAVORITES': '/favorites' };
      if (map[newView]) navigate(map[newView]);
    }
  }, [user, userProfile, navigate, showToast]);

  // Actions
  const handleSavePhone = async () => {
    const phoneRegex = /^8\d{8}$/;
    if (!phoneRegex.test(tempPhone)) return showToast('Número inválido', 'error');
    const { error } = await supabase.from('profiles').update({ whatsapp: tempPhone }).eq('id', user.id);
    if (!error) {
      setUserProfile((prev: any) => prev ? { ...prev, whatsapp: tempPhone } : null);
      setShowPhoneModal(false);
      showToast('Salvo!');
    } else {
      showToast('Erro ao salvar.', 'error');
    }
  };

  const handleUpdateName = async () => {
    if (!tempName.trim()) return showToast('Nome inválido', 'error');
    const { error } = await supabase.from('profiles').update({ full_name: tempName }).eq('id', user.id);
    if (!error) {
        setUserProfile((prev: any) => prev ? { ...prev, full_name: tempName } : null);
        setIsEditingName(false);
        showToast('Nome atualizado!', 'success');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return showToast('Erro', 'error');
    const { error } = await supabase.from('reviews').insert([{
        product_id: selectedProduct.id, user_id: user.id, user_name: userProfile?.full_name || 'Usuário',
        rating: newRating, comment: ""
    }]);
    if (!error) {
        setReviews(prev => [{ id: Date.now().toString(), userName: userProfile?.full_name || 'Eu', comment: "", rating: newRating, date: new Date().toLocaleDateString('pt-MZ') }, ...prev]);
        setNewRating(5);
        showToast('Avaliação enviada!', 'success');
    }
  };

  const handleSellSubmit = async (productData: any) => {
    if (!user) return;
    const payload = {
       title: productData.title, description: productData.description, price: productData.price,
       image_url: productData.imageUrl, images: productData.images, category: productData.category,
       subcategory: productData.subcategory, condition: productData.condition, location: productData.location,
       user_id: user.id, seller_name: productData.sellerName, seller_phone: productData.sellerPhone, status: 'available'
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
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Apagar?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if(!error) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('Apagado.', 'success');
    }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!window.confirm("Confirmar venda?")) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', productId);
    if(!error) {
        setProducts(prev => prev.map(p => p.id === productId ? {...p, status: 'sold'} : p));
        showToast('Vendido!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col relative">
      <Navbar 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onNavigate={handleNavigate}
        currentView="HOME"
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onSearch={setSearch} // Passa o setter, mas o App usa o debouncedValue
        user={user}
        userProfile={userProfile}
        userProductCount={userProductCount}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPlans={() => setShowPlansModal(true)}
      />

      {toast && (
          <div className={`fixed top-24 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold animate-slide-up ${toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
             {toast.msg}
          </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm relative shadow-2xl">
             <button onClick={() => setShowPhoneModal(false)} className="absolute top-4 right-4"><XCircle /></button>
             <h2 className="text-xl font-bold mb-4">Atualizar WhatsApp</h2>
             <input type="tel" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="841234567" className="w-full p-3 border rounded-xl mb-4 dark:bg-slate-900" />
             <button onClick={handleSavePhone} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Salvar</button>
          </div>
        </div>
      )}

      <button onClick={() => handleNavigate('SELL')} className="lg:hidden fixed bottom-6 right-6 z-[1000] bg-indigo-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white dark:border-slate-800 font-bold shadow-indigo-500/30 active:scale-95 transition-transform">
        <PlusCircle size={24} /> <span>Vender</span>
      </button>

      <main className="pt-24 px-4 max-w-7xl mx-auto w-full min-h-screen">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600"/></div>}>
        <Routes>
          <Route path="/" element={
            <div className="pt-4">
              <CategoryFilterBar activeCat={selectedCategory} onSelect={setSelectedCategory} />
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{selectedCategory || 'Tudo'} ({filteredProducts.length})</h2>
                 </div>
                 {isLoading ? <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /> : 
                   // OTIMIZAÇÃO 6: Grid é renderizado, mas ProductCard deve ser React.memo (externo)
                   // Passamos callbacks estáveis (handleAddToCart, handleProductClick)
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                      {filteredProducts.map(p => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          onAddToCart={handleAddToCart} 
                          onClick={handleProductClick} 
                          isLiked={favorites.has(p.id)} 
                          onToggleLike={(prod) => handleToggleFavorite(prod.id)} 
                          currentUserId={user?.id}
                          onMarkAsSold={handleMarkAsSold}
                          onDelete={handleDeleteProduct}
                          onEdit={(prod) => { setEditingProduct(prod); setShowSellForm(true); }}
                          userProfile={userProfile}
                        />
                      ))}
                   </div>
                 }
              </div>
            </div>
          } />

          <Route path="/cart" element={
            <div className="max-w-2xl mx-auto animate-fade-in">
               <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"><X size={16}/> Voltar</button>
               <h2 className="text-2xl font-bold mb-6">Carrinho ({cart.length})</h2>
               {cart.length === 0 ? <p className="text-center text-gray-500 py-10">Seu carrinho está vazio.</p> : (
                 <div className="space-y-4">
                    {cart.map(item => (
                       <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                          {/* Imagem pequena com lazy loading */}
                          <img src={item.imageUrl} loading="lazy" width="80" height="80" className="w-20 h-20 rounded-lg object-cover bg-gray-100" alt={item.title} />
                          <div className="flex-1">
                             <h3 className="font-bold line-clamp-1">{item.title}</h3>
                             <p className="text-indigo-600 font-bold">{formatMoney(item.price)}</p>
                             <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                          </div>
                          <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                       </div>
                    ))}
                    <div className="pt-6 border-t dark:border-slate-700">
                        <div className="flex justify-between text-xl font-bold mb-4"><span>Total</span><span>{formatMoney(cart.reduce((a,b) => a + (b.price * b.quantity), 0))}</span></div>
                        <button onClick={() => { if(cart.length > 0) setShowPaymentModal(true); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform">Finalizar <ArrowRight /></button>
                    </div>
                 </div>
               )}
            </div>
          } />

          <Route path="/product" element={selectedProduct ? (
            <div className="max-w-4xl mx-auto animate-fade-in pb-20">
               <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600"><X size={16} /> Fechar</button>
               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 mb-8">
                  <div className="h-[400px] md:h-[500px] bg-gray-100 relative">
                     {/* OTIMIZAÇÃO 7: Imagem principal com decoding async e priority se for LCP */}
                     <img src={activeImage || selectedProduct.imageUrl} className="w-full h-full object-cover transition-opacity duration-300" alt={selectedProduct.title} decoding="async" />
                     <button onClick={() => handleToggleFavorite(selectedProduct.id)} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg hover:scale-110 transition-transform"><Heart size={24} className={favorites.has(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-600"} /></button>
                     
                     {selectedProduct.images && selectedProduct.images.length > 1 && (
                       <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto p-1 scrollbar-hide">
                          {selectedProduct.images.map((img, idx) => (
                             <button key={idx} onClick={() => setActiveImage(img)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-indigo-500 scale-105' : 'border-white opacity-80'}`}>
                                <img src={img} className="w-full h-full object-cover" loading="lazy" />
                             </button>
                          ))}
                       </div>
                     )}
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col">
                     <span className="text-indigo-600 font-bold text-xs uppercase mb-2 tracking-wide">{selectedProduct.category}</span>
                     <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight">{selectedProduct.title}</h1>
                     <div className="flex items-center gap-2 text-gray-500 mb-4 text-sm"><MapPin size={14} /> {selectedProduct.location}</div>
                     <p className="text-3xl font-black mb-6 text-gray-900 dark:text-white">{formatMoney(selectedProduct.price)}</p>
                     <div className="text-gray-600 dark:text-gray-300 mb-8 prose dark:prose-invert text-sm md:text-base custom-scrollbar overflow-y-auto max-h-[200px]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedProduct.description) }} />
                     
                     <div className="mt-auto space-y-3">
                       {(user?.id === selectedProduct.sellerId || userProfile?.role === 'admin') ? (
                          <div className="flex flex-col gap-2">
                             {user?.id === selectedProduct.sellerId && (
                               <button onClick={() => { setEditingProduct(selectedProduct); setShowSellForm(true); }} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold">Editar Anúncio</button>
                             )}
                             <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold">Apagar Anúncio</button>
                          </div>
                       ) : (
                          <button onClick={() => { handleAddToCart(selectedProduct); navigate('/cart'); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2 hover:opacity-90 transition-opacity"><ShoppingBag /> Comprar</button>
                       )}
                       <div className="flex gap-2 mt-4">
                          <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copiado!'); }} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold flex justify-center items-center gap-2"><Share2 size={18}/> Partilhar</button>
                          <button onClick={() => window.open(`https://wa.me/258853691613?text=${encodeURIComponent(`Denúncia: ${selectedProduct.title}`)}`)} className="py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-bold" title="Denunciar"><Flag size={18} /></button>
                       </div>
                     </div>
                  </div>
               </div>
               
               {/* Avaliações mantidas simplificadas */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 mb-10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Star className="text-yellow-400" /> Avaliações</h3>
                  <div className="space-y-6 mb-8">
                     {reviews.length === 0 ? <p className="text-gray-500 text-sm">Sem avaliações ainda.</p> : reviews.map(r => (
                        <div key={r.id} className="border-b dark:border-slate-700 pb-4">
                           <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm">{r.userName}</span>
                              <div className="flex text-yellow-400">{[...Array(5)].map((_,i) => <Star key={i} size={12} className={i < r.rating ? "fill-yellow-400" : "text-gray-300"} />)}</div>
                           </div>
                           <p className="text-xs text-gray-400">{r.date}</p>
                        </div>
                     ))}
                  </div>
                  {user && (
                     <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl text-center">
                        <div className="flex justify-center gap-2 mb-4">
                           {[1,2,3,4,5].map(s => (<button type="button" key={s} onClick={() => setNewRating(s)}><Star size={24} className={s <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>))}
                        </div>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Enviar</button>
                     </form>
                  )}
               </div>
            </div>
          ) : <div className="text-center py-20"><p>Produto não encontrado.</p><button onClick={() => navigate('/')} className="text-indigo-600 font-bold mt-4">Voltar</button></div>} />

          <Route path="/favorites" element={
             <div className="max-w-4xl mx-auto pb-20">
                <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><X size={16}/> Voltar</button>
                <h2 className="text-2xl font-bold mb-6">Meus Favoritos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {/* Otimização: Filtro direto sem state intermediário complexo */}
                   {products.filter(p => favorites.has(p.id)).map(p => (
                      <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={handleProductClick} isLiked={true} onToggleLike={(prod) => handleToggleFavorite(prod.id)} currentUserId={user?.id} />
                   ))}
                </div>
                {favorites.size === 0 && <p className="text-center py-10 text-gray-500">Nenhum favorito.</p>}
             </div>
          } />

          <Route path="/profile" element={
            <div className="max-w-2xl mx-auto pb-20 animate-fade-in">
              {/* Profile content simplificado para foco */}
              <div className="text-center mb-10 bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                <img src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}`} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" loading="lazy" />
                <h2 className="text-2xl font-bold dark:text-white">{userProfile?.full_name || 'Usuário'}</h2>
                <button onClick={() => setShowPlansModal(true)} className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-sm shadow-lg"><CreditCard size={16} className="inline mr-2"/> Planos</button>
              </div>
              
              <h3 className="text-xl font-bold mb-4">Meus Anúncios</h3>
              <div className="space-y-4">
                  {products.filter(p => p.sellerId === user?.id).map(p => (
                     <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                        <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover" loading="lazy" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{p.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.status === 'sold' ? 'Vendido' : 'Disponível'}</span>
                        </div>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500"><Trash2 size={20}/></button>
                     </div>
                  ))}
               </div>
            </div>
          } />

          <Route path="/admin" element={userProfile?.role === 'admin' ? <AdminPanel /> : <div className="text-center py-20 text-red-500 font-bold"><AlertTriangle className="mx-auto mb-2" size={40}/>Acesso Restrito</div>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
        </Suspense>
      </main>

      <Footer onOpenAbout={() => setShowAboutModal(true)} />
      
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      
      {/* SellForm com Suspense implícito se fosse lazy, aqui é condicional simples */}
      {showSellForm && <SellForm onClose={() => { setShowSellForm(false); setEditingProduct(null); }} onSubmit={handleSellSubmit} initialData={editingProduct} user={user} userProfile={userProfile} />}
      
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      {showPlansModal && user && <PlansModal onClose={() => setShowPlansModal(false)} userEmail={user.email} userId={user.id} />}
      
      {/* Payment Modal Simplificado */}
      {showPaymentModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm">
               <h3 className="text-xl font-bold mb-4">Finalizar no WhatsApp</h3>
               <button onClick={() => window.open(`https://wa.me/258${cart[0]?.sellerPhone || '841234567'}?text=Interesse no produto ${cart[0]?.title}`)} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 mb-3"><Globe /> WhatsApp</button>
               <button onClick={() => setShowPaymentModal(false)} className="w-full text-gray-500 font-bold">Cancelar</button>
            </div>
         </div>
      )}
    </div>
  );
}

const App: React.FC = () => <Router><AppContent /></Router>;
export default App;
