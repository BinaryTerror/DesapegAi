import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import SellForm from './components/SellForm';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import { Product, CartItem, ViewState, UserProfile } from './types';
import DOMPurify from 'dompurify'; 

import { 
  MessageCircle, Trash2, ShoppingBag, ArrowRight, Sparkles, MapPin, Heart, 
  CheckCircle, Loader2, Smartphone, Info, XCircle, Save, PlusCircle, ChevronLeft, Package, Star, Send, Globe, Code, Linkedin, User, LogIn, Lock
} from 'lucide-react';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Defina aqui a URL do seu backend no Render
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// --- SUAS FRASES CRIATIVAS ---
const HERO_PHRASES = [
  "Roupas com história? Compra, vende, repete!",
  "Dá tchau ao velho, olá ao novo estilo!",
  "Moda circular: roda, gira, brilha!",
  "Transforma teu guarda-roupa em aventuras fashion!",
  "Compra, vende, arrasa — e ainda recicla estilo!",
  "Roupas que mudam de dono, mas não de charme.",
  "Do teu armário para o mundo — estilo que gira!",
  "Renova teu look sem esvaziar a carteira.",
  "Vira, troca, brilha: moda circular à moçambicana!",
  "Estilo que roda: compra, vende, repete!"
];

// --- 1. MODAL "QUEM SOMOS" ---
const AboutModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative text-center animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10">
          <XCircle size={24} className="text-gray-400" />
        </button>

        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 mt-2">
          Quem Somos
        </h2>

        <div className="space-y-8">
          
          {/* PERFIL 1: LINO ALFREDO */}
          <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <img src="https://ui-avatars.com/api/?name=Lino+Alfredo&background=0077b5&color=fff&size=128" alt="Lino Alfredo" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-md" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lino Alfredo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Software Engineer</p>
            <a href="https://linkedin.com/in/lino-alfredo-07335237a" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-[#0077b5] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-blue-900/20">
              <Linkedin size={18} /> Conectar no LinkedIn
            </a>
          </div>

          {/* PERFIL 2: ALEX NHABINDE */}
          <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <img src="https://cdn.icon-icons.com/icons2/2643/PNG/512/male_boy_person_people_avatar_icon_159358.png" alt="Alex Nhabinde" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-md" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Alex Nhabinde</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Creator & Dev</p>
            <a href="https://piripiri.chat" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-black dark:bg-white dark:text-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
              <Globe size={18} /> Ver mais tarde
            </a>
          </div>

        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700"><p className="text-xs text-gray-400">© 2025 DesapegAi Team</p></div>
      </div>
    </div>
  );
};

// --- 2. MENU LATERAL ---
const MenuDrawer = ({ isOpen, onClose, onOpenAbout }: { isOpen: boolean; onClose: () => void; onOpenAbout: () => void }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-[75%] max-w-xs bg-white dark:bg-slate-900 shadow-2xl z-[100] transform transition-transform duration-300 animate-slide-right p-6">
        <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black text-indigo-600">Menu</h2><button onClick={onClose}><XCircle size={24} className="text-gray-400" /></button></div>
        <div className="space-y-2">
          <button onClick={() => { onClose(); onOpenAbout(); }} className="w-full text-left p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold flex items-center gap-3"><Info size={20} /> Quem Somos</button>
        </div>
      </div>
    </>
  );
};

// --- FOOTER LIMPO ---
const Footer = () => (
  <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-8 mt-12">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h4 className="font-black text-lg text-gray-900 dark:text-white">DesapegAi Moçambique</h4>
    </div>
  </footer>
);

const AuthCallback = () => {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/'); 
    });
  }, [navigate]);
  return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
};

const HERO_SLIDES = [
  { id: 1, image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1920&auto=format&fit=crop', title: 'Moda que conta história', subtitle: 'Encontre peças únicas em Moçambique' },
  { id: 2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1920&auto=format&fit=crop', title: 'Seu Estilo, Sua Regra', subtitle: 'Preços incríveis' },
  { id: 3, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop', title: 'Economia Circular', subtitle: 'Sustentabilidade em primeiro lugar' }
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const productsSectionRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [tempPhone, setTempPhone] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('desapegai_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
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
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // --- EFEITO DE DIGITAÇÃO (TYPEWRITER) ---
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Lógica de Scroll
  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => { localStorage.setItem('desapegai_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (selectedProduct) {
      localStorage.setItem('desapegai_selected_product', JSON.stringify(selectedProduct));
      fetchReviews(selectedProduct.id); 
    }
  }, [selectedProduct]);

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
  useEffect(() => { const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length), 5000); return () => clearInterval(timer); }, []);

  // --- LÓGICA DE DIGITAR/APAGAR ---
  useEffect(() => {
    const handleType = () => {
      const i = loopNum % HERO_PHRASES.length;
      const fullText = HERO_PHRASES[i];

      setDisplayedText(isDeleting 
        ? fullText.substring(0, displayedText.length - 1) 
        : fullText.substring(0, displayedText.length + 1)
      );

      // Velocidade
      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && displayedText === fullText) {
        // Terminou de digitar, espera um pouco e começa a apagar
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayedText === '') {
        // Terminou de apagar, passa para a próxima frase
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const getCurrentView = (): ViewState => 'HOME';
  const handleNavigate = (newView: ViewState) => {
    const map: Record<string, string> = { 'HOME': '/', 'CART': '/cart', 'PROFILE': '/profile', 'SELL': '/sell', 'PRODUCT_DETAIL': '/product', 'FAVORITES': '/favorites', 'SETTINGS': '/settings' };
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
    if (tempPhone.length < 9) { showToast('Digite um número válido.', 'error'); return; }
    const { error } = await supabase.from('profiles').update({ whatsapp: tempPhone }).eq('id', user.id);
    if (!error) { showToast('Número salvo!', 'success'); setShowPhoneModal(false); if (userProfile) setUserProfile({ ...userProfile, whatsapp: tempPhone }); } else { showToast('Erro ao salvar.', 'error'); }
  };

  async function fetchProducts() {
    setIsLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) {
      const mapped: Product[] = data.map((item: any) => ({
        id: item.id, title: item.title, description: item.description, price: item.price, originalPrice: item.original_price, imageUrl: item.image_url, category: item.category, condition: item.condition, sellerName: item.seller_name || 'Vendedor', sellerRating: item.seller_rating || 5.0, location: item.location || 'Maputo', sellerPhone: item.seller_phone, likes: item.likes || 0, reviews: [], sizes: item.sizes || [], sellerId: item.user_id, status: item.status || 'available', createdAt: item.created_at, updatedAt: item.updated_at
      }));
      setProducts(mapped);
    }
    setIsLoading(false);
  }

  async function fetchReviews(productId: string) {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
    if (data) setReviews(data); else setReviews([]);
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) { showToast('Faça login para comentar.', 'info'); setShowAuthModal(true); return; }
    const { error } = await supabase.from('reviews').insert([{ product_id: selectedProduct.id, user_id: user.id, user_name: userProfile?.full_name || user.email?.split('@')[0] || 'Usuário', rating: newRating, comment: newComment }]);
    if (!error) { showToast('Comentário enviado!', 'success'); setNewComment(''); setNewRating(5); fetchReviews(selectedProduct.id); } else { showToast('Erro ao enviar.', 'error'); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Apagar anúncio?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', user.id);
    if (!error) { setProducts(prev => prev.filter(p => p.id !== productId)); showToast('Removido!', 'success'); } else { showToast('Erro ao remover.', 'error'); }
  };

  const handleSellSubmit = async (newProduct: Product) => {
    if (!user) { showToast('Faça login!', 'info'); setShowAuthModal(true); return; }
    const dbProduct = { title: newProduct.title, description: newProduct.description, price: newProduct.price, image_url: newProduct.imageUrl, category: newProduct.category, condition: newProduct.condition, seller_name: userProfile?.full_name || user.user_metadata.full_name, seller_phone: userProfile?.whatsapp || newProduct.sellerPhone, user_id: user.id, status: 'available' };
    const { error } = await supabase.from('products').insert([dbProduct]);
    if (!error) { showToast('Anúncio publicado!', 'success'); fetchProducts(); navigate('/'); } else { showToast('Erro ao publicar.', 'error'); }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      return exists ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, quantity: 1 }];
    });
    showToast('Adicionado ao carrinho!', 'success');
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const totalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const toggleLike = (product: Product) => {
    setLikedProductIds(prev => {
      const newSet = new Set(prev); newSet.has(product.id) ? newSet.delete(product.id) : newSet.add(product.id); return newSet;
    });
    showToast(likedProductIds.has(product.id) ? 'Removido' : 'Favoritado', 'info');
  };

  const handleProductClick = (product: Product) => { setSelectedProduct(product); localStorage.setItem('desapegai_selected_product', JSON.stringify(product)); navigate('/product'); };
  const formatMoney = (amount: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory ? p.category === selectedCategory : true;
    const matchSearch = searchTerm ? p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchCat && matchSearch && p.status !== 'sold';
  });

  const handleWhatsAppCheckout = async () => {
    const item = cart[0]; if (!item) return;
    setPaymentProcessing(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/secure-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id })
      });
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
        setCart([]); setShowPaymentModal(false);
      } else {
        const phone = item.sellerPhone || '865916062';
        const text = `Olá! Vi seu anúncio no DesapegAi: ${item.title} (${formatMoney(item.price)}). Ainda disponível?`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '').replace(/^258/, '')}?text=${encodeURIComponent(text)}`, '_blank');
        setCart([]); setShowPaymentModal(false);
      }
    } catch (error) {
      console.error(error);
      const phone = item.sellerPhone || '865916062';
      const text = `Olá! Vi seu anúncio no DesapegAi: ${item.title} (${formatMoney(item.price)}). Ainda disponível?`;
      window.open(`https://wa.me/${phone.replace(/\D/g, '').replace(/^258/, '')}?text=${encodeURIComponent(text)}`, '_blank');
      setCart([]); setShowPaymentModal(false);
    } finally { setPaymentProcessing(false); }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!user) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', productId).eq('user_id', user.id);
    if (!error) { setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'sold' } : p)); showToast('Vendido!', 'success'); }
  };

  const handlePayment = () => {
    setPaymentProcessing(true);
    setTimeout(() => { setPaymentProcessing(false); setPaymentSuccess(true); setTimeout(() => { setCart([]); setPaymentSuccess(false); setShowPaymentModal(false); navigate('/'); showToast('Confirmado!', 'success'); }, 2000); }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col">
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
        onOpenMenu={() => setShowMenuDrawer(true)} 
      />
      
      <MenuDrawer isOpen={showMenuDrawer} onClose={() => setShowMenuDrawer(false)} onOpenAbout={() => setShowAboutModal(true)} />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />

      {toast && (
        <div className="fixed top-20 right-4 z-[110] animate-slide-up">
            <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
                {toast.type === 'success' && <CheckCircle size={18} />} {toast.type === 'info' && <Info size={18} />} <span className="font-bold text-sm">{toast.msg}</span>
            </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl text-center">
             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><Smartphone className="text-green-600" size={32} /></div>
             <h2 className="text-2xl font-black mb-2">Quase lá!</h2>
             <p className="text-gray-500 mb-6">WhatsApp para contato:</p>
             <input type="tel" placeholder="84 123 4567" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="w-full mb-4 px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-xl dark:text-white" />
             <button onClick={handleSavePhone} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2"><Save size={20} /> Salvar</button>
          </div>
        </div>
      )}
      
      <main className="pt-24 px-4 max-w-7xl mx-auto flex-grow w-full">
        <Routes>
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
                                  
                                  {/* --- TEXTO QUE DIGITA E APAGA SOZINHO --- */}
                                  <div className="text-indigo-300 font-mono text-xs md:text-sm flex items-center gap-2 mb-6 h-6">
                                    <Sparkles size={14} /> 
                                    <span>{displayedText}</span>
                                    <span className={`w-0.5 h-4 bg-indigo-300 ${isDeleting ? '' : 'animate-pulse'}`}></span>
                                  </div>

                                  <button onClick={scrollToProducts} className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">Explorar <ArrowRight size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}
              
              <div ref={productsSectionRef}>
                <h3 className="text-2xl font-bold mb-6">{searchTerm ? 'Resultados' : 'Recentes'} <span className="text-gray-400 text-sm font-normal">({filteredProducts.length})</span></h3>
                {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div> : filteredProducts.length === 0 ? (<div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl"><ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Nada encontrado.</p></div>) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart} onClick={handleProductClick} isLiked={likedProductIds.has(p.id)} onToggleLike={toggleLike} currentUserId={user?.id} onMarkAsSold={handleMarkAsSold} />))}
                  </div>
                )}
              </div>
            </>
          } />
          <Route path="/cart" element={
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8"><button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><ChevronLeft /></button><h2 className="text-2xl font-bold">Carrinho</h2></div>
                {cart.length === 0 ? <p className="text-center py-10 text-gray-500">Vazio.</p> : (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">{cart.map(item => (<div key={item.id} className="flex items-center p-4 border-b dark:border-slate-700"><img src={item.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt={item.title} /><div className="ml-4 flex-1"><h3 className="font-bold">{item.title}</h3><div className="text-indigo-600 font-bold">{formatMoney(item.price)}</div></div><button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={18} /></button></div>))}</div>
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6"><div className="flex justify-between mb-6 font-bold text-xl"><span>Total</span><span>{formatMoney(totalCart)}</span></div><button onClick={() => setShowPaymentModal(true)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2">Finalizar <ArrowRight /></button></div>
                    </div>
                )}
            </div>
          } />
          <Route path="/product" element={selectedProduct ? (
            <div>
              <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ChevronLeft size={24} /> Voltar
              </button>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 mb-8">
                <div className="h-[50vh] md:h-[600px] bg-gray-100 dark:bg-slate-700 relative">
                  <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt={selectedProduct.title} />
                  <button onClick={() => toggleLike(selectedProduct)} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg"><Heart size={24} className={likedProductIds.has(selectedProduct.id) ? "fill-red-500" : "text-gray-600"} /></button>
                </div>
                <div className="p-8 flex flex-col">
                  <span className="text-indigo-600 font-bold text-xs uppercase mb-2">{selectedProduct.category}</span>
                  <h1 className="text-3xl font-black mb-2">{selectedProduct.title}</h1>
                  <div className="flex items-center gap-2 text-gray-500 mb-6"><MapPin size={14} /> {selectedProduct.location}</div>
                  <p className="text-3xl font-black mb-6">{formatMoney(selectedProduct.price)}</p>
                  <div className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedProduct.description) }} />
                  
                  {user && user.id === selectedProduct.sellerId ? (<button onClick={() => { handleDeleteProduct(selectedProduct.id); navigate('/'); }} className="bg-red-500 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Trash2 size={20} /> Excluir</button>) : (<button onClick={() => { addToCart(selectedProduct); navigate('/cart'); }} className="mt-auto bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2"><ShoppingBag size={20} /> Comprar</button>)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6"><h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MessageCircle /> Comentários</h3><div className="space-y-6 mb-10">{reviews.length === 0 ? (<p className="text-gray-500">Sem comentários.</p>) : (reviews.map(review => (<div key={review.id} className="border-b dark:border-slate-700 pb-4"><div className="flex items-center justify-between mb-2"><span className="font-bold text-sm">{review.user_name}</span><div className="flex text-yellow-400">{[...Array(5)].map((_, i) => (<Star key={i} size={14} className={i < review.rating ? "fill-yellow-400" : "text-gray-300"} />))}</div></div><p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p></div>)))}</div>
              
              {user ? (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl"><div className="flex gap-2 mb-4">{[1, 2, 3, 4, 5].map((star) => (<button type="button" key={star} onClick={() => setNewRating(star)}><Star size={24} className={star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>))}</div><div className="flex gap-2"><input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Comente..." className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" required /><button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl"><Send size={20} /></button></div></form>
              ) : (
                <div className="text-center p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl">
                  <p className="mb-3 text-gray-500 dark:text-gray-300 font-medium">Faça login para comentar e avaliar.</p>
                  <button onClick={() => setShowAuthModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-2 mx-auto"><LogIn size={16} /> Fazer Login</button>
                </div>
              )}
              </div>
            </div>
          ) : (<div className="text-center py-20"><p>Produto não encontrado.</p><button onClick={() => navigate('/')} className="text-indigo-600 font-bold mt-4">Voltar</button></div>)} />
          <Route path="/sell" element={<SellForm onClose={() => navigate('/')} onSubmit={handleSellSubmit} />} />
          <Route path="/profile" element={
            <div className="max-w-2xl mx-auto"><div className="text-center mb-10"><div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 inline-block w-full"><img src={userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" alt="Perfil" /><h2 className="text-2xl font-bold">{userProfile?.full_name || 'Usuário'}</h2><p className="text-gray-500 mb-4">{userProfile?.whatsapp || 'Sem contato'}</p><button onClick={() => setShowPhoneModal(true)} className="px-6 py-2 border rounded-full font-bold text-sm">Editar Contato</button></div></div><div><h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Package size={24} /> Meus Anúncios</h3>{products.filter(p => p.sellerId === user?.id).length === 0 ? (<div className="text-center py-10 bg-gray-100 dark:bg-slate-800 rounded-2xl"><p className="text-gray-500 mb-4">Nada por aqui.</p><button onClick={() => navigate('/sell')} className="text-indigo-600 font-bold">Começar a Vender</button></div>) : (<div className="space-y-4">{products.filter(p => p.sellerId === user?.id).map(myProd => (<div key={myProd.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4"><img src={myProd.imageUrl} alt={myProd.title} className="w-16 h-16 rounded-lg object-cover bg-gray-200" /><div className="flex-1"><h4 className="font-bold line-clamp-1">{myProd.title}</h4><p className="text-indigo-600 font-bold text-sm">{formatMoney(myProd.price)}</p><span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${myProd.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{myProd.status === 'sold' ? 'Vendido' : 'Disponível'}</span></div><div className="flex items-center gap-2">{myProd.status !== 'sold' && (<button onClick={() => handleMarkAsSold(myProd.id)} title="Marcar Vendido" className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={20} /></button>)}<button onClick={() => handleDeleteProduct(myProd.id)} title="Apagar" className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={20} /></button></div></div>))}</div>)}</div><div className="mt-10 text-center"><button onClick={() => navigate('/')} className="text-gray-500 font-bold">Voltar</button></div></div>
          } />
          <Route path="/favorites" element={<div><button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft size={20} /> Voltar</button><h2 className="text-2xl font-bold mb-6">Meus Favoritos</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{products.filter(p => likedProductIds.has(p.id)).map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart} onClick={handleProductClick} isLiked={true} onToggleLike={toggleLike} currentUserId={user?.id} onMarkAsSold={handleMarkAsSold} />))}{likedProductIds.size === 0 && <p className="text-gray-500">Sem favoritos.</p>}</div></div>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>

      <Footer />
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
                   <button 
                     onClick={handleWhatsAppCheckout} 
                     className="w-full py-5 bg-[#25D366] text-white rounded-xl font-bold flex justify-center items-center gap-3 text-lg hover:brightness-105 shadow-xl shadow-green-500/20"
                   >
                     <MessageCircle size={28} /> Negociar via WhatsApp
                   </button>
                   
                   <p className="text-center text-gray-400 text-sm mt-4">
                     O vendedor receberá sua mensagem imediatamente.
                   </p>
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

const App: React.FC = () => { return <Router><AppContent /></Router>; };

export default App;