import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, CATEGORY_TREE, UserProfile, Condition } from '../types';
import { X, Loader2, Copy, AlertTriangle, CheckCircle, Save } from 'lucide-react';

interface SellFormProps {
  onClose: () => void;
  onSubmit: (product: any) => void;
  initialData?: Product | null;
  user: any;
  userProfile: UserProfile | null;
}

const SellForm: React.FC<SellFormProps> = ({ onClose, onSubmit, initialData, user, userProfile }) => {
  const [step, setStep] = useState<'CHECK' | 'FORM' | 'BLOCKED'>('CHECK');
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  
  // CORREÇÃO: Inicialização segura do paymentInfo
  const [paymentInfo, setPaymentInfo] = useState<{ whatsapp: string, amount: number }>({ 
    whatsapp: '841234567', 
    amount: 20 
  });

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    location: initialData?.location || 'Maputo',
    imageUrl: initialData?.imageUrl || '',
    condition: initialData?.condition || Condition.GOOD
  });

  useEffect(() => {
    const checkLimit = async () => {
      if (initialData) {
        setStep('FORM');
        setLoading(false);
        return;
      }

      try {
        // CORREÇÃO: Tipagem explicita do retorno RPC para evitar erro de "any" ou "undefined"
        const { data: settings } = await supabase.rpc('get_sell_limits').maybeSingle();
        
        if (settings) {
          // O TypeScript agora aceita se o RPC retornar um objeto com essas chaves
          // Se o RPC não existir no banco, ele usa o padrão definido no useState acima
          setPaymentInfo({
            whatsapp: (settings as any).payment_whatsapp || '841234567',
            amount: (settings as any).payment_amount || 20
          });
        }

        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const currentCount = count || 0;
        setProductCount(currentCount);

        // Verifica unlimited
        if (currentCount >= 20 && !userProfile?.is_unlimited) {
          setStep('BLOCKED');
        } else {
          setStep('FORM');
        }
      } catch (err) {
        console.error(err);
        setStep('FORM'); // Fallback de segurança
      } finally {
        setLoading(false);
      }
    };

    if (user) checkLimit();
  }, [user, userProfile, initialData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) { alert("Adicione uma URL de imagem."); return; }
    
    onSubmit({
      ...initialData,
      ...formData,
      price: Number(formData.price),
      sellerPhone: userProfile?.whatsapp || '841234567',
      sellerName: userProfile?.full_name || 'Vendedor',
    });
  };

  // Helper para pegar subcategorias sem erro de tipo
  // CORREÇÃO: "as keyof typeof CATEGORY_TREE" resolve o erro vermelho do array
  const currentSubcategories = formData.category 
    ? CATEGORY_TREE[formData.category as keyof typeof CATEGORY_TREE] || []
    : [];

  if (loading || step === 'CHECK') return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-white" /></div>;

  if (step === 'BLOCKED') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold dark:text-white mb-2">Limite Atingido ({productCount}/20)</h2>
          <p className="text-gray-500 mb-6">Pague a taxa única para vender ilimitado.</p>
          <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl mb-4">
            <p className="text-xs uppercase font-bold text-gray-500">M-Pesa / e-Mola</p>
            <div className="flex justify-center items-center gap-2">
              <span className="text-xl font-mono font-bold dark:text-white">{paymentInfo.whatsapp}</span>
              <button onClick={() => navigator.clipboard.writeText(paymentInfo.whatsapp)}><Copy size={18}/></button>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-gray-200 rounded-xl font-bold">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X /></button>
        <h2 className="text-2xl font-bold mb-6 dark:text-white">{initialData ? 'Editar' : 'Vender'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required name="title" value={formData.title} onChange={handleInputChange} placeholder="Título" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" />
          
          <div className="grid grid-cols-2 gap-4">
            <select name="category" value={formData.category} onChange={e => { handleInputChange(e); setFormData(prev => ({...prev, subcategory: ''}))}} className="p-3 border rounded-xl dark:bg-slate-900 dark:text-white">
              <option value="">Categoria</option>
              {Object.keys(CATEGORY_TREE).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} className="p-3 border rounded-xl dark:bg-slate-900 dark:text-white">
              <option value="">Subcategoria</option>
              {/* Aqui usamos a variável corrigida */}
              {currentSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input required type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Preço" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" />
            <select name="condition" value={formData.condition} onChange={handleInputChange} className="p-3 border rounded-xl dark:bg-slate-900 dark:text-white">
               {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <input required type="url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="Link da Imagem (https://...)" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" />
          
          <textarea required name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Descrição..." className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" />
          
          <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Localização" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" />

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center gap-2">
            <Save size={20} /> {initialData ? 'Salvar' : 'Publicar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellForm;