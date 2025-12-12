import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import SellForm from './components/SellForm';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import { Product, CartItem, ViewState, UserProfile } from './types';

import { 
  MessageCircle, Trash2, ShoppingBag, ArrowRight, Sparkles, MapPin, Heart, 
  CheckCircle, Lock, Loader2, Smartphone, Info, XCircle, Save, PlusCircle, ChevronLeft
} from 'lucide-react';

// --- 1. COMPONENTE DE CALLBACK (Autenticação) ---
const AuthCallback = () => {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/'); // Redireciona para home após login
      }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="ml-4 text-gray-600 dark:text-gray-300">Autenticando...</p>
    </div>
  );
};

// --- DADOS UI ESTÁTICOS ---
const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1920&auto=format&fit=crop',
    title: 'Moda que conta história',
    subtitle: 'Encontre peças únicas e exclusivas em Moçambique'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1920&auto=format&fit=crop',
    title: 'Seu Estilo, Sua Regra',
    subtitle: 'Milhares de peças com preços incríveis'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop',
    title: 'Economia Circular',
    subtitle: 'Renove seu guarda-roupa de forma sustentável'
  }
];

// --- 2. COMPONENTE COM A LÓGICA DO APP ---
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATES ---
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // -- PERSISTÊNCIA DO CARRINHO (LocalStorage) --
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('desapegai_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // -- PERSISTÊNCIA DO PRODUTO SELECIONADO --
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const savedProduct = localStorage.getItem('desapegai_selected_product');
    return savedProduct ? JSON.parse(savedProduct) : null;
  });

  const [likedProductIds, setLikedProductIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // AI Typewriter
  const [aiDescription] = useState("O melhor da moda circular em Moçambique.");
  const [displayedText, setDisplayedText] = useState("");

  // --- EFFECTS ---

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('desapegai_cart', JSON.stringify(cart));
  }, [cart]);

  // Save Selected Product to LocalStorage
  useEffect(() => {
    if (selectedProduct) {
      localStorage.setItem('desapegai_selected_product', JSON.stringify(selectedProduct));
    }
  }, [selectedProduct]);

  // Auth & Data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  // Carousel
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter
  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (i < aiDescription.length) {
        setDisplayedText(prev => prev + aiDescription.charAt(i));
        i++;
      } else clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [aiDescription]);

  // Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- HELPERS ---
  const getCurrentView = (): ViewState => {
    switch (location.pathname) {
      case '/': return 'HOME';
      case '/cart': return 'CART';
      case '/profile': return 'PROFILE';
      case '/sell': return 'SELL';
      case '/product': return 'PRODUCT_DETAIL';
      case '/favorites': return 'FAVORITES';
      case '/settings': return 'SETTINGS';
      default: return 'HOME';
    }
  };

  const handleNavigate = (newView: ViewState) => {
    const map: Record<string, string> = {
      'HOME': '/',
      'CART': '/cart',
      'PROFILE': '/profile',
      'SELL': '/sell',
      'PRODUCT_DETAIL': '/product',
      'FAVORITES': '/favorites',
      'SETTINGS': '/settings'
    };
    if (map[newView]) navigate(map[newView]);
  };

  async function fetchUserProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
      if (!data.whatsapp) setShowPhoneModal(true);
    }
  }

  const handleSavePhone = async () => {
    if (tempPhone.length < 9) {
      showToast('Digite um número válido (ex: 841234567)', 'error');
      return;
    }
    const { error } = await supabase.from('profiles').update({ whatsapp: tempPhone }).eq('id', user.id);
    if (!error) {
      showToast('Número salvo!', 'success');
      setShowPhoneModal(false);
      if (userProfile) setUserProfile({ ...userProfile, whatsapp: tempPhone });
    } else {
      showToast('Erro ao salvar.', 'error');
    }
  };

  // App.tsx

  async function fetchProducts() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // O TypeScript precisa saber que isso é um array de Product
      const mapped: Product[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        // Conversão de snake_case (banco) para camelCase (types.ts)
        originalPrice: item.original_price, 
        imageUrl: item.image_url,
        category: item.category,
        condition: item.condition,
        sellerName: item.seller_name || 'Vendedor',
        sellerRating: item.seller_rating || 5.0,
        location: item.location || 'Maputo',
        sellerPhone: item.seller_phone,
        likes: item.likes || 0,
        reviews: [], // Supabase não retorna reviews nessa query simples
        sizes: item.sizes || [],
        
        // --- AQUI ESTÁ A CORREÇÃO DO ERRO "MAPPED" ---
        // Você precisa preencher os campos obrigatórios do types.ts:
        sellerId: item.user_id, // Mapeia user_id do banco para sellerId
        status: item.status || 'available',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setProducts(mapped);
    } else if (error) {
      console.error('Erro ao buscar produtos:', error);
    }
    setIsLoading(false);
  }

  const handleSellSubmit = async (newProduct: Product) => {
    if (!user) {
      showToast('Faça login para vender!', 'info');
      setShowAuthModal(true);
      return;
    }
    const dbProduct = {
      title: newProduct.title,
      description: newProduct.description,
      price: newProduct.price,
      image_url: newProduct.imageUrl,
      category: newProduct.category,
      condition: newProduct.condition,
      seller_name: userProfile?.full_name || user.user_metadata.full_name,
      seller_phone: userProfile?.whatsapp || newProduct.sellerPhone,
      user_id: user.id,
      status: 'available'
    };

    const { error } = await supabase.from('products').insert([dbProduct]);
    if (!error) {
      showToast('Anúncio publicado!', 'success');
      fetchProducts();
      navigate('/');
    } else {
      console.error(error);
      showToast('Erro ao publicar.', 'error');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      return exists 
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) 
        : [...prev, { ...product, quantity: 1 }];
    });
    showToast('Adicionado ao carrinho!', 'success');
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const totalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const toggleLike = (product: Product) => {
    setLikedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.has(product.id) ? newSet.delete(product.id) : newSet.add(product.id);
      return newSet;
    });
    showToast(likedProductIds.has(product.id) ? 'Removido dos favoritos' : 'Adicionado aos favoritos', 'info');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    // Salva imediatamente no storage para garantir persistência
    localStorage.setItem('desapegai_selected_product', JSON.stringify(product));
    navigate('/product');
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory ? p.category === selectedCategory : true;
    const matchSearch = searchTerm 
      ? p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  const handleWhatsAppCheckout = () => {
    const item = cart[0]; 
    if (!item) return;
    
    const phone = item.sellerPhone || '865916062';
    const text = `Olá! Vi seu anúncio no DesapegAi\n\nProduto: ${item.title}\nPreço: ${formatMoney(item.price)}\n\nAinda está disponível?`;
    
    const cleanedPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanedPhone.startsWith('258') ? cleanedPhone : `258${cleanedPhone}`;
    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    
    window.open(whatsappUrl, '_blank');
    setCart([]);
    setShowPaymentModal(false);
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!user) {
      showToast('Faça login para gerenciar seus anúncios', 'error');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', productId)
        .eq('user_id', user.id); // Garante que só o dono altera
      
      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'sold' } : p));
      showToast('Produto marcado como vendido!', 'success');
      
    } catch (error: any) {
      console.error('Erro:', error);
      showToast('Erro ao atualizar: ' + error.message, 'error');
    }
  };

  const handlePayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setCart([]);
        setPaymentSuccess(false);
        setShowPaymentModal(false);
        navigate('/');
        showToast('Pagamento confirmado!', 'success');
      }, 2000);
    }, 2000);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      <Navbar 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onNavigate={handleNavigate}
        currentView={getCurrentView()}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onSearch={setSearchTerm}
        user={user}
        userProfile={userProfile}
        onOpenAuth={() => setShowAuthModal(true)} 
      />
      
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
            <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-green-500 text-white' : 
                toast.type === 'error' ? 'bg-red-500 text-white' : 
                'bg-gray-800 text-white'
            }`}>
                {toast.type === 'success' && <CheckCircle size={18} />}
                {toast.type === 'info' && <Info size={18} />}
                <span className="font-bold text-sm">{toast.msg}</span>
            </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-scale-up text-center">
             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
               <Smartphone className="text-green-600 dark:text-green-400" size={32} />
             </div>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Quase lá!</h2>
             <p className="text-gray-500 dark:text-gray-300 mb-6">Precisamos do seu contacto para continuar.</p>
             <input type="tel" placeholder="84 123 4567" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="w-full mb-4 px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl dark:text-white" />
             <button onClick={handleSavePhone} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2"><Save size={20} /> Salvar</button>
          </div>
        </div>
      )}
      
      <main className="pt-20 pb-24 md:pb-8 px-4 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        <Routes>
          {/* --- HOME ROUTE --- */}
          <Route path="/" element={
            <>
              {!searchTerm && (
                <div className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px] mb-8 md:mb-12 shadow-2xl group">
                    {HERO_SLIDES.map((slide, index) => (
                        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center px-6 md:px-16">
                                <div className="max-w-2xl">
                                    <h2 className="text-3xl md:text-6xl font-black text-white mb-4">{slide.title}</h2>
                                    <div className="text-indigo-300 font-mono text-xs md:text-sm flex items-center gap-2 mb-6"><Sparkles size={14} /> {displayedText}</div>
                                    <button className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2">Explorar <ArrowRight size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}
              <h3 className="text-2xl font-bold mb-6">{searchTerm ? 'Resultados' : 'Recentes'} <span className="text-gray-400 text-sm font-normal">({filteredProducts.length})</span></h3>
              {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div> : 
               filteredProducts.length === 0 ? (
                 <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhum produto encontrado.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(p => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          onAddToCart={addToCart} 
                          onClick={handleProductClick} 
                          isLiked={likedProductIds.has(p.id)} 
                          onToggleLike={toggleLike}       
                          currentUserId={user?.id}
                          onMarkAsSold={handleMarkAsSold} 
                        />
                    ))}
                 </div>
               )}
            </>
          } />

          {/* --- CART ROUTE --- */}
          <Route path="/cart" element={
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><ChevronLeft /></button>
                    <h2 className="text-2xl font-bold">Seu Carrinho</h2>
                </div>
                {cart.length === 0 ? <p className="text-center py-10 text-gray-500">Carrinho vazio.</p> : (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center p-4 border-b dark:border-slate-700">
                                    <img src={item.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt={item.title} />
                                    <div className="ml-4 flex-1">
                                        <h3 className="font-bold">{item.title}</h3>
                                        <div className="text-indigo-600 font-bold">{formatMoney(item.price)}</div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                            <div className="flex justify-between mb-6 font-bold text-xl"><span>Total</span><span>{formatMoney(totalCart)}</span></div>
                            <button onClick={() => setShowPaymentModal(true)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2">Finalizar <ArrowRight /></button>
                        </div>
                    </div>
                )}
            </div>
          } />

          {/* --- PRODUCT DETAIL ROUTE --- */}
          <Route path="/product" element={
             selectedProduct ? (
                <div>
                    <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium"><ChevronLeft size={20} /> Voltar</button>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
                        <div className="h-[50vh] md:h-[600px] bg-gray-100 dark:bg-slate-700 relative">
                            <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt={selectedProduct.title} />
                            <button onClick={() => toggleLike(selectedProduct)} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg"><Heart size={24} className={likedProductIds.has(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-600"} /></button>
                        </div>
                        <div className="p-8 flex flex-col">
                            <span className="text-indigo-600 font-bold text-xs uppercase mb-2">{selectedProduct.category}</span>
                            <h1 className="text-3xl font-black mb-2">{selectedProduct.title}</h1>
                            <div className="flex items-center gap-2 text-gray-500 mb-6"><MapPin size={14} /> {selectedProduct.location}</div>
                            <p className="text-3xl font-black mb-6">{formatMoney(selectedProduct.price)}</p>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{selectedProduct.description}</p>
                            <button onClick={() => { addToCart(selectedProduct); navigate('/cart'); }} className="mt-auto bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2"><ShoppingBag size={20} /> Comprar Agora</button>
                        </div>
                    </div>
                </div>
             ) : (
                <div className="text-center py-20">
                  <p>Produto não encontrado.</p>
                  <button onClick={() => navigate('/')} className="text-indigo-600 font-bold mt-4">Voltar para Home</button>
                </div>
             )
          } />

          {/* --- SELL ROUTE --- */}
          <Route path="/sell" element={<SellForm onClose={() => navigate('/')} onSubmit={handleSellSubmit} />} />

          {/* --- PROFILE ROUTE --- */}
          <Route path="/profile" element={
            <div className="max-w-2xl mx-auto text-center">
                 <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 mb-6">
                     <img src={userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" alt="Perfil" />
                     <h2 className="text-2xl font-bold">{userProfile?.full_name || 'Usuário'}</h2>
                     <p className="text-gray-500">{userProfile?.whatsapp || 'Sem contato'}</p>
                     <button onClick={() => setShowPhoneModal(true)} className="mt-4 px-6 py-2 border rounded-full font-bold text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Editar Contato</button>
                 </div>
                 <button onClick={() => navigate('/')} className="text-gray-500 font-bold">Voltar para Loja</button>
            </div>
          } />

          {/* --- FAVORITES ROUTE --- */}
          <Route path="/favorites" element={
             <div>
                <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft size={20} /> Voltar</button>
                <h2 className="text-2xl font-bold mb-6">Meus Favoritos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.filter(p => likedProductIds.has(p.id)).map(p => (
                         <ProductCard 
                          key={p.id} 
                          product={p} 
                          onAddToCart={addToCart} 
                          onClick={handleProductClick} 
                          isLiked={true} 
                          onToggleLike={toggleLike}       
                          currentUserId={user?.id}
                          onMarkAsSold={handleMarkAsSold} 
                        />
                    ))}
                    {likedProductIds.size === 0 && <p className="text-gray-500">Sem favoritos.</p>}
                </div>
             </div>
          } />

          {/* --- AUTH CALLBACK ROUTE --- */}
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>

      <button onClick={() => navigate('/sell')} className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-40 flex items-center gap-2 hover:scale-105 transition-transform"><PlusCircle size={20} /> Vender</button>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); showToast('Logado!', 'success'); }} />}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
             {!paymentSuccess ? (
                <>
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Pagamento</h3>
                      <button onClick={() => setShowPaymentModal(false)}><XCircle className="text-gray-400" /></button>
                   </div>
                   <button onClick={handleWhatsAppCheckout} className="w-full mb-4 bg-[#25D366] text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"><MessageCircle size={24} /> Negociar no WhatsApp</button>
                   <button onClick={handlePayment} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2">{paymentProcessing ? <Loader2 className="animate-spin" /> : <Lock size={18} />} Pagar {formatMoney(totalCart)}</button>
                </>
             ) : (
                 <div className="text-center py-10"><CheckCircle size={60} className="text-green-500 mx-auto mb-4" /><h3 className="text-2xl font-bold">Sucesso!</h3></div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. COMPONENTE PRINCIPAL (WRAPPER) ---
const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;