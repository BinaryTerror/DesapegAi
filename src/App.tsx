import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import SellForm from './components/SellForm';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { PlansModal } from './components/PlansModal'; // ✅ NOVO IMPORT
import { supabase } from './lib/supabaseClient';
import { Product, CartItem, UserProfile, Category, ViewState, Review } from './types';

import { 
  ShoppingBag, Trash2, Loader2, Save, CheckCircle, 
  PlusCircle, XCircle, Heart, Edit, 
  MapPin, MessageCircle, Star, Send, Sparkles, AlertTriangle, 
  Linkedin, Globe, Filter, ChevronDown, ChevronUp, X, Copy, Share2, Flag, PenLine, CreditCard
} from 'lucide-react';
import DOMPurify from 'dompurify'; 

// --- CONSTANTES ---
const HERO_PHRASES = ["Roupas com história?", "Moda circular!", "Estilo que roda!"];

const HERO_SLIDES = [
  { id: 1, image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1920&auto=format&fit=crop', title: 'Moda que conta história', subtitle: 'Encontre peças únicas em Moçambique' },
  { id: 2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1920&auto=format&fit=crop', title: 'Seu Estilo, Sua Regra', subtitle: 'Preços incríveis' },
  { id: 3, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop', title: 'Economia Circular', subtitle: 'Sustentabilidade em primeiro lugar' }
];

const formatMoney = (amount: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);

// --- COMPONENTES AUXILIARES ---
const Footer = ({ onOpenAbout }: { onOpenAbout: () => void }) => (
  <footer className="py-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <span>Powered by</span>
        <a href="http://piripiri.chat" target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline">Otseven</a>
      </div>
      <div className="flex gap-6">
        <span>© 2025 DesapegAi</span>
        <button onClick={onOpenAbout} className="hover:text-indigo-600 transition-colors font-medium hover:underline">Sobre nós</button>
      </div>
    </div>
  </footer>
);

const AboutModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative text-center animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"><XCircle size={24} className="text-gray-400" /></button>
        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 mt-2">Quem Somos</h2>
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lino Alfredo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider font-bold">Software Engineer</p>
            <a href="https://linkedin.com/in/lino-alfredo-07335237a" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-[#0077b5] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110"><Linkedin size={18} /> Conectar</a>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Alex Nhabinde</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider font-bold">Creator & Dev</p>
            <a href="http://piripiri.chat" target="_blank" rel="noreferrer" className="w-full py-2.5 bg-black dark:bg-white dark:text-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-105"><Globe size={18} /> Ver Portfolio</a>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryFilterBar = ({ activeCat, onSelect }: { activeCat: string | null, onSelect: (c: string | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative w-full mb-6 z-30">
      <div className="flex items-center justify-between">
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all shadow-sm ${isOpen || activeCat ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700'}`}>
          <Filter size={18} /> {activeCat ? activeCat : 'Filtrar por Categoria'} {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {activeCat && <button onClick={() => onSelect(null)} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"><X size={14} /> Limpar</button>}
      </div>
      {isOpen && (
        <div className="absolute top-14 left-0 w-full md:w-[600px] bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-2xl z-40 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { onSelect(null); setIsOpen(false); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${!activeCat ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}>Todas</button>
            {Object.values(Category).map(cat => (
              <button key={cat} onClick={() => { onSelect(cat); setIsOpen(false); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${activeCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600'}`}>{cat}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session?.user) navigate('/'); else navigate('/?login_error=1'); });
  }, [navigate]);
  return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
};

// --- APP CONTENT ---
function AppContent() {
  const navigate = useNavigate();
  const productsSectionRef = useRef<HTMLDivElement>(null);

  const [newRating, setNewRating] = useState(5);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const saved = localStorage.getItem('desapegai_selected_product'); return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('desapegai_cart') || '[]'));
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('desapegai_favorites'); return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // ✅ NOVO ESTADO: MODAL DE PLANOS
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [currentSlide, setCurrentSlide] = useState(0);

  // EFEITOS
  useEffect(() => { const savedTheme = localStorage.getItem('desapegai_theme'); if (savedTheme === 'dark') setIsDarkMode(true); }, []);
  useEffect(() => { 
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('desapegai_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('desapegai_theme', 'light'); } 
  }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('desapegai_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('desapegai_favorites', JSON.stringify(Array.from(favorites))); }, [favorites]);

  useEffect(() => {
    const initializeApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) refreshUserProfile(session.user.id);
      
      supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) { setUser(session.user); refreshUserProfile(session.user.id); } 
        else { setUser(null); setUserProfile(null); }
      });
      await fetchProducts();
    };
    initializeApp();
  }, []);

  useEffect(() => { const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length), 5000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const handleType = () => {
      const i = loopNum % HERO_PHRASES.length;
      const fullText = HERO_PHRASES[i];
      setDisplayedText(isDeleting ? fullText.substring(0, displayedText.length - 1) : fullText.substring(0, displayedText.length + 1));
      setTypingSpeed(isDeleting ? 40 : 100);
      if (!isDeleting && displayedText === fullText) { setTimeout(() => setIsDeleting(true), 2000); }
      else if (isDeleting && displayedText === '') { setIsDeleting(false); setLoopNum(loopNum + 1); setTypingSpeed(500); }
    };
    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, typingSpeed]);

  // ✅ FUNÇÃO CRÍTICA: ATUALIZAR PERFIL (Para ver o novo limite)
  const refreshUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
      setUser({ ...user, id: userId }); // Garante user setado
      if (!data.whatsapp) setShowPhoneModal(true);
      setTempName(data.full_name || '');
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products')
        .select(`id, title, description, price, originalPrice:original_price, imageUrl:image_url, images, category, subcategory, condition, location, sellerName:seller_name, sellerPhone:seller_phone, sellerRating:seller_rating, likes, status, sellerId:user_id, createdAt:created_at`)
        .neq('status', 'sold').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProducts(data as any);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  
  const handleSavePhone = async () => {
    if (!/^8\d{8}$/.test(tempPhone)) return showToast('Número inválido.', 'error');
    await supabase.from('profiles').update({ whatsapp: tempPhone }).eq('id', user.id);
    refreshUserProfile(user.id);
    setShowPhoneModal(false);
    showToast('Salvo!');
  };

  const handleUpdateName = async () => {
    if (!tempName.trim()) return showToast('Nome inválido', 'error');
    await supabase.from('profiles').update({ full_name: tempName }).eq('id', user.id);
    refreshUserProfile(user.id);
    setIsEditingName(false);
    showToast('Nome atualizado!');
  };

  const toggleFavorite = (productId: string) => {
    if (!user) return setShowAuthModal(true);
    setFavorites(prev => { const s = new Set(prev); s.has(productId) ? s.delete(productId) : s.add(productId); return s; });
    showToast('Favoritos atualizados', 'info');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return showToast('Erro', 'error');
    try {
        await supabase.from('reviews').insert([{ product_id: selectedProduct.id, user_id: user.id, user_name: userProfile?.full_name || 'Usuário', rating: newRating, comment: "" }]);
        const newReview: Review = { id: Date.now().toString(), userName: userProfile?.full_name || 'Eu', comment: "", rating: newRating, date: new Date().toLocaleDateString('pt-MZ') };
        setReviews([newReview, ...reviews]);
        setNewRating(5);
        showToast('Avaliação enviada!');
    } catch { showToast('Erro ao avaliar', 'error'); }
  };

  const handleNavigate = (newView: ViewState | 'ADMIN') => {
    // Ao navegar para certas áreas, atualiza o perfil para garantir dados frescos
    if (user && (newView === 'SELL' || newView === 'PROFILE')) refreshUserProfile(user.id);

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
  };

  const handleFloatingSell = () => {
    if (!user) { showToast('Login necessário', 'info'); setShowAuthModal(true); } 
    else { 
      refreshUserProfile(user.id); // Garante limite atualizado
      setEditingProduct(null); 
      setShowSellForm(true); 
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
    if (editingProduct) ({ error } = await supabase.from('products').update(payload).eq('id', editingProduct.id));
    else ({ error } = await supabase.from('products').insert([payload]));

    if (!error) {
        showToast('Sucesso!', 'success');
        fetchProducts();
        setShowSellForm(false);
        setEditingProduct(null);
        navigate('/');
    } else showToast('Erro ao salvar.', 'error');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Apagar?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if(!error) { setProducts(prev => prev.filter(p => p.id !== productId)); showToast('Apagado.', 'success'); }
  };
  const handleMarkAsSold = async (productId: string) => {
    if (!window.confirm("Vendido?")) return;
    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', productId);
    if(!error) { setProducts(prev => prev.map(p => p.id === productId ? {...p, status: 'sold'} : p)); showToast('Vendido!', 'success'); }
  };
  const handleEditProduct = (product: Product) => { setEditingProduct(product); setShowSellForm(true); };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.some(item => String(item.id) === String(product.id));
      return exists ? prev.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item) : [...prev, { ...product, quantity: 1 }];
    });
    showToast('Adicionado!', 'success');
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => String(i.id) !== String(id)));

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    localStorage.setItem('desapegai_selected_product', JSON.stringify(product));
    const { data } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
    setReviews(data ? data.map((r: any) => ({ id: r.id, userName: r.user_name, comment: "", rating: r.rating, date: new Date(r.created_at).toLocaleDateString('pt-MZ') })) : []);
    navigate('/product');
  };

  const handleWhatsAppCheckout = () => {
    const item = cart[0]; if(!item) return;
    const phone = String(item.sellerPhone || '841234567').replace(/\D/g, '').replace(/^258/, '');
    window.open(`https://wa.me/258${phone}?text=Ola! Tenho interesse no ${item.title}`, '_blank');
    setCart([]); setShowPaymentModal(false);
  };
  const handleCopyPhone = () => { navigator.clipboard.writeText(String(cart[0]?.sellerPhone || '')); showToast('Copiado!'); };
  const handleShareProduct = async () => { if(selectedProduct) { const url = window.location.href; if(navigator.share) await navigator.share({title: selectedProduct.title, url}); else { await navigator.clipboard.writeText(url); showToast('Link copiado!'); }}};
  const handleReportProduct = () => { if(selectedProduct) window.open(`https://wa.me/258853691613?text=Denuncia produto ID: ${selectedProduct.id}`, '_blank'); };

  const filteredProducts = products.filter(p => (selectedCategory ? p.category === selectedCategory : true) && (search ? p.title.toLowerCase().includes(search.toLowerCase()) : true));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col relative">
      <Navbar cartCount={cart.reduce((a,b)=>a+b.quantity,0)} onNavigate={handleNavigate} currentView="HOME" isDarkMode={isDarkMode} toggleDarkMode={()=>setIsDarkMode(!isDarkMode)} onSearch={setSearch} user={user} userProfile={userProfile} onOpenAuth={()=>setShowAuthModal(true)} />
      {toast && (<div className={`fixed top-24 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg font-bold animate-slide-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.msg}</div>)}
      
      {showPhoneModal && (<div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm"><h2 className="text-xl font-bold mb-4">Atualizar WhatsApp</h2><input type="tel" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="841234567" className="w-full p-3 border rounded-xl mb-4 dark:bg-slate-900"/><button onClick={handleSavePhone} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Salvar</button></div></div>)}

      <button onClick={handleFloatingSell} className="lg:hidden fixed bottom-6 right-6 z-[1000] bg-indigo-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white dark:border-slate-800 font-bold"><PlusCircle size={24}/><span>Vender</span></button>

      <main className="pt-24 px-4 max-w-7xl mx-auto w-full min-h-screen">
        <Routes>
          <Route path="/" element={<><div ref={productsSectionRef} className="pt-4"><CategoryFilterBar activeCat={selectedCategory} onSelect={setSelectedCategory} /><div className="flex-1"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{selectedCategory || 'Tudo'} ({filteredProducts.length})</h2></div>{isLoading ? <Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{filteredProducts.map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart} onClick={handleProductClick} isLiked={favorites.has(p.id)} onToggleLike={(prod) => toggleFavorite(prod.id)} currentUserId={user?.id} onMarkAsSold={handleMarkAsSold} onDelete={handleDeleteProduct} onEdit={handleEditProduct} />))}</div>}</div></div></>} />
          <Route path="/cart" element={<div className="max-w-2xl mx-auto"><button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft /> Voltar</button><h2 className="text-2xl font-bold mb-6">Carrinho ({cart.length})</h2>{cart.length === 0 ? <p className="text-center text-gray-500">Vazio.</p> : (<div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><img src={item.imageUrl} className="w-20 h-20 rounded-lg object-cover" /><div className="flex-1"><h3 className="font-bold">{item.title}</h3><p className="text-indigo-600 font-bold">{formatMoney(item.price)}</p><p className="text-xs text-gray-500">Qtd: {item.quantity}</p></div><button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={18}/></button></div>))}<div className="pt-6 border-t dark:border-slate-700"><button onClick={() => { if(cart.length > 0) setShowPaymentModal(true); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2">Finalizar <ArrowRight /></button></div></div>)}</div>} />
          <Route path="/product" element={selectedProduct ? (<div className="max-w-4xl mx-auto animate-fade-in"><button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft /> Voltar</button><div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 mb-8"><div className="h-[500px] bg-gray-100 relative"><img src={selectedProduct.imageUrl} className="w-full h-full object-cover" /><button onClick={() => toggleFavorite(selectedProduct.id)} className="absolute top-4 right-4 p-3 bg-white/90 rounded-full shadow-lg"><Heart size={24} className={favorites.has(selectedProduct.id) ? "fill-red-500 text-red-500" : "text-gray-600"} /></button></div><div className="p-8 flex flex-col"><h1 className="text-3xl font-black mb-2">{selectedProduct.title}</h1><p className="text-3xl font-black mb-6">{formatMoney(selectedProduct.price)}</p><div className="text-gray-600 dark:text-gray-300 mb-8 prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedProduct.description) }} /><div className="mt-auto space-y-3">{user?.id === selectedProduct.sellerId ? (<div className="flex flex-col gap-2"><button onClick={() => { setEditingProduct(selectedProduct); setShowSellForm(true); }} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold">Editar Anúncio</button><button onClick={() => handleDeleteProduct(selectedProduct.id)} className="w-full bg-red-500 text-white py-4 rounded-xl font-bold">Apagar Anúncio</button></div>) : (<button onClick={() => { addToCart(selectedProduct); navigate('/cart'); }} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2"><ShoppingBag /> Comprar</button>)}<div className="flex gap-2 mt-4"><button onClick={handleShareProduct} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold flex justify-center items-center gap-2"><Share2 size={18}/> Partilhar</button><button onClick={handleReportProduct} className="py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-bold" title="Denunciar"><Flag size={18} /></button></div></div></div></div><div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 mb-24"><h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Star className="text-yellow-400" /> Avaliações</h3><div className="space-y-6 mb-8">{reviews.length === 0 ? <p className="text-gray-500">Sem avaliações ainda.</p> : reviews.map(r => (<div key={r.id} className="border-b dark:border-slate-700 pb-4"><div className="flex justify-between items-center mb-1"><span className="font-bold text-gray-900 dark:text-white">{r.userName}</span><div className="flex text-yellow-400">{[...Array(5)].map((_,i) => <Star key={i} size={14} className={i < r.rating ? "fill-yellow-400" : "text-gray-300"} />)}</div></div><p className="text-xs text-gray-400">{r.date}</p></div>))}</div>{user ? (<form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-xl text-center"><p className="mb-4 font-bold text-gray-700 dark:text-gray-200">Deixe sua avaliação:</p><div className="flex justify-center gap-2 mb-6">{[1,2,3,4,5].map(s => (<button type="button" key={s} onClick={() => setNewRating(s)} className="transform hover:scale-110 transition-transform"><Star size={32} className={s <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>))}</div><button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">Enviar Avaliação</button></form>) : (<div className="text-center p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl"><p className="mb-3">Faça login para avaliar.</p><button onClick={() => setShowAuthModal(true)} className="text-indigo-600 font-bold">Entrar</button></div>)}</div></div>) : <div className="text-center py-20"><p>Produto não encontrado.</p><button onClick={() => navigate('/')} className="text-indigo-600 font-bold mt-4">Voltar</button></div>} />
          
          <Route path="/favorites" element={<div className="max-w-4xl mx-auto"><button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-500"><ChevronLeft /> Voltar</button><h2 className="text-2xl font-bold mb-6">Meus Favoritos</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{products.filter(p => favorites.has(p.id)).map(p => (<ProductCard key={p.id} product={p} onAddToCart={addToCart} onClick={handleProductClick} isLiked={true} onToggleLike={(prod) => toggleFavorite(prod.id)} currentUserId={user?.id} />))}</div>{favorites.size === 0 && <p className="text-center py-10 text-gray-500">Nenhum favorito.</p>}</div>} />
          
          <Route path="/profile" element={<div className="max-w-2xl mx-auto"><div className="text-center mb-10 bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8"><img src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}&size=100`} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" /><div className="flex items-center justify-center gap-2 mb-1">{isEditingName ? (<div className="flex items-center gap-2"><input value={tempName} onChange={e => setTempName(e.target.value)} className="border rounded p-1 text-black dark:text-white bg-transparent"/><button onClick={handleUpdateName} className="text-green-600"><CheckCircle size={18}/></button><button onClick={() => setIsEditingName(false)} className="text-red-500"><X size={18}/></button></div>) : (<><h2 className="text-2xl font-bold dark:text-white">{userProfile?.full_name || 'Usuário'}</h2><button onClick={() => { setTempName(userProfile?.full_name || ''); setIsEditingName(true); }} className="text-gray-400 hover:text-indigo-500"><PenLine size={16}/></button></>)}</div><p className="text-gray-500 mb-4">{userProfile?.whatsapp || 'Sem contato'}</p><button onClick={() => setShowPhoneModal(true)} className="px-6 py-2 border rounded-full font-bold text-sm">Editar Contato</button>
           {/* ✅ BOTÃO NOVO: ADICIONAR CRÉDITOS */}
           <button onClick={() => setShowPlansModal(true)} className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-sm flex items-center gap-2 mx-auto shadow-lg hover:scale-105 transition-transform"><CreditCard size={16}/> Planos & Créditos</button>
          </div><div className="mb-10"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Heart className="text-red-500" size={20}/> Meus Favoritos</h3>{products.filter(p => favorites.has(p.id)).length === 0 ? <p className="text-gray-500 text-sm">Nenhum favorito.</p> : (<div className="grid grid-cols-2 gap-3">{products.filter(p => favorites.has(p.id)).map(p => (<div key={p.id} onClick={() => handleProductClick(p)} className="bg-white dark:bg-slate-800 p-2 rounded-lg flex gap-3 cursor-pointer border border-transparent hover:border-indigo-500 transition-all"><img src={p.imageUrl} className="w-12 h-12 rounded object-cover" /><div className="overflow-hidden"><p className="font-bold text-sm truncate">{p.title}</p><p className="text-xs text-indigo-600 font-bold">{formatMoney(p.price)}</p></div></div>))}</div>)}</div><h3 className="text-xl font-bold mb-4">Meus Anúncios</h3>{products.filter(p => p.sellerId === user?.id).length === 0 ? <p className="text-center text-gray-500">Sem anúncios.</p> : <div className="space-y-4">{products.filter(p => p.sellerId === user?.id).map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4"><img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover" /><div className="flex-1"><h4 className="font-bold">{p.title}</h4><span className={`text-xs px-2 py-1 rounded-full ${p.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.status === 'sold' ? 'Vendido' : 'Disponível'}</span></div><div className="flex gap-2">{p.status !== 'sold' && <button onClick={() => handleMarkAsSold(p.id)} className="p-2 text-green-600"><CheckCircle size={20}/></button>}<button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500"><Trash2 size={20}/></button></div></div>))}</div>}</div>} />
          <Route path="/admin" element={userProfile?.role === 'admin' ? <AdminPanel /> : <div className="text-center py-20 text-red-500 font-bold"><AlertTriangle className="mx-auto mb-2" size={40}/>Acesso Restrito</div>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>

      <Footer onOpenAbout={() => setShowAboutModal(true)} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      {showSellForm && <SellForm onClose={() => { setShowSellForm(false); setEditingProduct(null); }} onSubmit={handleSellSubmit} initialData={editingProduct} user={user} userProfile={userProfile} />}
      {showAboutModal && <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />}
      {/* ✅ MODAL DE PLANOS CHAMADO AQUI */}
      {showPlansModal && user && <PlansModal onClose={() => setShowPlansModal(false)} userEmail={user.email} userId={user.id} />}

      {showPaymentModal && (<div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-sm"><h3 className="text-xl font-bold mb-4">Finalizar no WhatsApp</h3><div className="flex flex-col gap-3"><button onClick={handleWhatsAppCheckout} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"><MessageCircle /> Iniciar Conversa</button><button onClick={handleCopyPhone} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2"><Copy size={18}/> Copiar Número</button></div><button onClick={() => setShowPaymentModal(false)} className="w-full mt-4 text-gray-500 font-bold">Cancelar</button></div></div>)}
    </div>
  );
}

const App: React.FC = () => <Router><AppContent /></Router>;
export default App;
