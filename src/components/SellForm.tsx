import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, CATEGORY_TREE, UserProfile, Condition } from '../types';
import { X, Loader2, Copy, AlertTriangle, CheckCircle, Upload, Camera, Trash2, Smartphone, Calendar, Package } from 'lucide-react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [productCount, setProductCount] = useState(0);
  // O número do admin para receber o dinheiro
  const adminPhone = '841234567';

  // Imagens
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images || (initialData?.imageUrl ? [initialData.imageUrl] : [])
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    location: initialData?.location || 'Maputo',
    condition: initialData?.condition || Condition.GOOD
  });

  // --- VERIFICAÇÃO DE LIMITES E PLANOS ---
  useEffect(() => {
    const checkLimit = async () => {
      if (initialData) {
        setStep('FORM');
        setLoading(false);
        return;
      }
      try {
        // 1. Conta quantos produtos o usuário tem
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        const currentCount = count || 0;
        setProductCount(currentCount);

        // 2. Verifica se é Ilimitado por Data
        const now = new Date();
        const unlimitedUntil = userProfile?.unlimited_until ? new Date(userProfile.unlimited_until) : null;
        const isVip = unlimitedUntil && unlimitedUntil > now;

        // 3. Verifica Limite Numérico (Padrão 6)
        const limit = userProfile?.post_limit || 6;

        if (!isVip && currentCount >= limit) {
          setStep('BLOCKED');
        } else {
          setStep('FORM');
        }
      } catch (err) {
        setStep('FORM');
      } finally {
        setLoading(false);
      }
    };
    if (user) checkLimit();
  }, [user, userProfile, initialData]);

  // ... (Funções de Imagem e Input iguais ao anterior) ...
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 5 - imagePreviews.length;
      if (remainingSlots <= 0) { alert("Máximo de 5 fotos."); return; }
      const filesToAdd = filesArray.slice(0, remainingSlots);
      const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...filesToAdd]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) { alert("Adicione pelo menos 1 foto."); return; }
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      const existingUrls = imagePreviews.filter(url => url.startsWith('http'));
      uploadedUrls.push(...existingUrls);

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      onSubmit({
        ...initialData,
        ...formData,
        price: Number(formData.price),
        imageUrl: uploadedUrls[0],
        images: uploadedUrls,
        sellerPhone: userProfile?.whatsapp || '',
        sellerName: userProfile?.full_name || 'Vendedor',
      });
    } catch (error) { alert("Erro ao publicar."); setIsUploading(false); }
  };

  // Função para abrir WhatsApp com o plano escolhido
  const handlePayPlan = (planName: string, price: number) => {
    const msg = `Olá Admin! Quero contratar o plano: *${planName}* por ${price}MT. Meu email de usuário é: ${user.email}`;
    window.open(`https://wa.me/258${adminPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading || step === 'CHECK') return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-white" size={40}/></div>;

  // --- TELA DE PLANOS ---
  if (step === 'BLOCKED') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-lg text-center animate-scale-up max-h-[90vh] overflow-y-auto">
          <AlertTriangle className="text-orange-500 mx-auto mb-2" size={40} />
          <h2 className="text-2xl font-black dark:text-white mb-1">Limite Atingido!</h2>
          <p className="text-gray-500 text-sm mb-6">Você já publicou {productCount} produtos gratuitos. Escolha um pacote para continuar vendendo:</p>
          
          <div className="space-y-3 mb-6">
            
            {/* Opção 1: +6 Posts */}
            <button onClick={() => handlePayPlan('Pacote +6 Posts', 20)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full text-indigo-600 dark:text-indigo-300"><Package size={20}/></div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600">+6 Publicações</p>
                  <p className="text-xs text-gray-500">Acumulativo</p>
                </div>
              </div>
              <span className="font-black text-xl text-gray-900 dark:text-white">20 MT</span>
            </button>

            {/* Opção 2: 1 Semana VIP */}
            <button onClick={() => handlePayPlan('1 Semana Ilimitado', 50)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border-2 border-transparent hover:border-green-500 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full text-green-600 dark:text-green-300"><Calendar size={20}/></div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-green-600">1 Semana VIP</p>
                  <p className="text-xs text-gray-500">Posts Ilimitados</p>
                </div>
              </div>
              <span className="font-black text-xl text-gray-900 dark:text-white">50 MT</span>
            </button>

            {/* Opção 3: 1 Mês VIP */}
            <button onClick={() => handlePayPlan('1 Mês Ilimitado', 180)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl text-white shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-full"><Smartphone size={20}/></div>
                <div className="text-left">
                  <p className="font-bold">1 Mês Pro</p>
                  <p className="text-xs text-indigo-100">Posts Ilimitados + Destaque</p>
                </div>
              </div>
              <span className="font-black text-2xl relative z-10">180 MT</span>
            </button>

          </div>

          <p className="text-xs text-gray-400 mb-4">O pagamento é feito via M-Pesa/e-Mola. O Admin liberará sua conta após o envio do comprovativo.</p>

          <button onClick={onClose} className="text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300">Voltar</button>
        </div>
      </div>
    );
  }

  // FORMULÁRIO DE VENDA NORMAL
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black dark:text-white">{initialData ? 'Editar' : 'Vender'}</h2>
            <p className="text-xs text-gray-500">Limite atual: {productCount}/{userProfile?.is_unlimited ? '∞' : (userProfile?.post_limit || 6)}</p>
          </div>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fotos ({imagePreviews.length}/5)</label>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                   <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border dark:border-slate-600">
                      <img src={src} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X size={12} /></button>
                   </div>
                ))}
                {imagePreviews.length < 5 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-700">
                    <Camera className="w-6 h-6 text-indigo-500" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label><input required name="title" value={formData.title} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white font-bold" /></div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoria</label>
                <select name="category" value={formData.category} onChange={e => { handleInputChange(e); setFormData(prev => ({...prev, subcategory: ''}))}} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white">
                  <option value="">Escolha...</option>
                  {Object.keys(CATEGORY_TREE).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subcategoria</label>
                <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} disabled={!formData.category} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white disabled:opacity-50">
                  <option value="">Escolha...</option>
                  {(formData.category ? CATEGORY_TREE[formData.category as keyof typeof CATEGORY_TREE] || [] : []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço (MT)</label><input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl font-bold dark:text-white" /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Condição</label>
                <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white">
                   {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição</label><textarea required rows={3} name="description" value={formData.description} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white" /></div>
            
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Localização</label><input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white" /></div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
          <button type="submit" form="sell-form" disabled={isUploading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
            {isUploading ? 'Publicando...' : 'Publicar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellForm;
