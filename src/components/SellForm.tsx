import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, CATEGORY_TREE, UserProfile, Condition } from '../types';
import { X, Loader2, AlertTriangle, CheckCircle, Upload, Camera, Package, Calendar, Smartphone } from 'lucide-react';

// LISTA DE PROVÍNCIAS
const MOZ_PROVINCES = [
  "Maputo Cidade", "Maputo Província", "Gaza", "Inhambane",
  "Sofala", "Manica", "Tete", "Zambézia", "Nampula",
  "Niassa", "Cabo Delgado"
];

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
  
  const ADMIN_WHATSAPP = '853691613';

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
    location: initialData?.location || '',
    province: initialData?.province || '', // NOVO CAMPO
    condition: initialData?.condition || Condition.GOOD
  });

  // --- VERIFICAÇÃO DE LIMITES ---
  useEffect(() => {
    const checkLimit = async () => {
      if (initialData) {
        setStep('FORM');
        setLoading(false);
        return;
      }
      try {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'sold');
        const currentCount = count || 0;
        setProductCount(currentCount);

        const now = new Date();
        const unlimitedUntil = userProfile?.premium_until ? new Date(userProfile.premium_until) : null;
        const isVipTime = unlimitedUntil && unlimitedUntil > now;
        const limit = userProfile?.posts_limit || 6;

        if (!isVipTime && currentCount >= limit && userProfile?.role !== 'admin') {
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

  const handlePayPlan = (planName: string, price: number) => {
    const msg = `Olá Admin! Atingi meu limite de vendas no DesapegAi.\n\nQuero contratar o plano: *${planName}* (${price}MT).\n\nMeu Email: ${user.email}\n\nAguardo instruções.`;
    window.open(`https://wa.me/258${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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
    if (!formData.province) { alert("Selecione a província!"); return; }

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

  if (loading || step === 'CHECK') return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-white" size={40}/></div>;

  if (step === 'BLOCKED') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl w-full max-w-lg text-center animate-scale-up max-h-[90vh] overflow-y-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-600" size={32} /></div>
          <h2 className="text-2xl font-black dark:text-white mb-2">Limite Atingido!</h2>
          <p className="text-gray-500 text-sm mb-6">Você atingiu o limite gratuito de <strong>{productCount} anúncios</strong>.</p>
          
          <div className="space-y-3 mb-6">
            <button onClick={() => handlePayPlan('Pacote +6 Posts', 20)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500 border-2 border-transparent">
              <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Package size={20}/></div><div className="text-left"><p className="font-bold dark:text-white">+6 Publicações</p><p className="text-xs text-gray-500">Acumulativo</p></div></div>
              <span className="font-black text-xl dark:text-white">20 MT</span>
            </button>
            <button onClick={() => handlePayPlan('1 Semana Ilimitado', 50)} className="w-full bg-gray-50 dark:bg-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-green-500 border-2 border-transparent">
              <div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-full text-green-600"><Calendar size={20}/></div><div className="text-left"><p className="font-bold dark:text-white">1 Semana VIP</p><p className="text-xs text-gray-500">Ilimitado</p></div></div>
              <span className="font-black text-xl dark:text-white">50 MT</span>
            </button>
            <button onClick={() => handlePayPlan('1 Mês Ilimitado', 180)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-full"><Smartphone size={20}/></div><div className="text-left"><p className="font-bold">1 Mês Pro</p><p className="text-xs text-indigo-100">Ilimitado</p></div></div>
              <span className="font-black text-2xl">180 MT</span>
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 font-bold hover:text-gray-700">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800 rounded-t-3xl">
          <h2 className="text-xl font-black dark:text-white">{initialData ? 'Editar' : 'Vender'}</h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-5">
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

            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label><input required name="title" value={formData.title} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white font-bold" placeholder="Ex: Samsung A50" /></div>

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

            {/* PROVÍNCIA E LOCALIZAÇÃO (NOVO) */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Província</label>
                  <select name="province" value={formData.province} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white" required>
                     <option value="">Selecione...</option>
                     {MOZ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bairro/Cidade</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white" placeholder="Ex: Alto Maé" required />
               </div>
            </div>

            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição</label><textarea required rows={3} name="description" value={formData.description} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-none rounded-xl dark:text-white" /></div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
          <button type="submit" form="sell-form" disabled={isUploading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
            {isUploading ? <Loader2 className="animate-spin" /> : (initialData ? <CheckCircle size={24} /> : <Upload size={24} />)}
            {isUploading ? 'Publicando...' : 'Publicar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellForm;
