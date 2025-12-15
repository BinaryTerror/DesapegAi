import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, CATEGORY_TREE, UserProfile, Condition } from '../types';
import { X, Loader2, Copy, AlertTriangle, CheckCircle, Upload, Camera, Trash2, DollarSign } from 'lucide-react';

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
  const [paymentInfo, setPaymentInfo] = useState({ whatsapp: '841234567', amount: 20 });

  // Estado da Imagem (Arquivo local)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    location: initialData?.location || 'Maputo',
    condition: initialData?.condition || Condition.GOOD
  });

  // Verifica Limites
  useEffect(() => {
    const checkLimit = async () => {
      if (initialData) {
        setStep('FORM');
        setLoading(false);
        return;
      }
      try {
        const { data: settings } = await supabase.rpc('get_sell_limits').maybeSingle();
        if (settings) {
          setPaymentInfo({
            whatsapp: (settings as any).payment_whatsapp || '841234567',
            amount: (settings as any).payment_amount || 20
          });
        }
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        const currentCount = count || 0;
        setProductCount(currentCount);

        if (currentCount >= 20 && !userProfile?.is_unlimited) {
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

  // Manipulação de Imagem
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !imageFile) { alert("A foto é obrigatória!"); return; }
    
    setIsUploading(true);

    try {
      let publicUrl = initialData?.imageUrl || "";

      // 1. Faz Upload se tiver novo arquivo
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      // 2. Envia para o App.tsx salvar no banco
      onSubmit({
        ...initialData,
        ...formData,
        price: Number(formData.price),
        imageUrl: publicUrl,
        sellerPhone: userProfile?.whatsapp || '841234567',
        sellerName: userProfile?.full_name || 'Vendedor',
      });

    } catch (error: any) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar imagem. Tente novamente.");
      setIsUploading(false);
    }
  };

  if (loading || step === 'CHECK') return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={40}/></div>;

  if (step === 'BLOCKED') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md text-center animate-scale-up">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold dark:text-white mb-2">Limite Atingido ({productCount}/20)</h2>
          <p className="text-gray-500 mb-6">Pague a taxa única para vender ilimitado.</p>
          <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl mb-6">
            <p className="text-xs uppercase font-bold text-gray-500">M-Pesa / e-Mola</p>
            <div className="flex justify-center items-center gap-2">
              <span className="text-xl font-mono font-bold dark:text-white">{paymentInfo.whatsapp}</span>
              <button onClick={() => navigator.clipboard.writeText(paymentInfo.whatsapp)}><Copy size={18}/></button>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-gray-200 rounded-xl font-bold">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header Fixo */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white">{initialData ? 'Editar Anúncio' : 'Vender Item'}</h2>
          <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>
        
        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="sell-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload de Imagem */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Foto do Produto</label>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500 font-bold">Toque para adicionar foto</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              ) : (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden group border dark:border-slate-600">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={removeImage} className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition">
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label>
              <input required name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Tênis Nike Air Force" className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoria</label>
                <select name="category" value={formData.category} onChange={e => { handleInputChange(e); setFormData(prev => ({...prev, subcategory: ''}))}} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-white">
                  <option value="">Selecione...</option>
                  {Object.keys(CATEGORY_TREE).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subcategoria</label>
                <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} disabled={!formData.category} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-white disabled:opacity-50">
                  <option value="">Selecione...</option>
                  {(formData.category ? CATEGORY_TREE[formData.category as keyof typeof CATEGORY_TREE] || [] : []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço (MT)</label>
                <input required type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="0.00" className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Condição</label>
                <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-white">
                   {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição</label>
              <textarea required name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Detalhes do produto..." className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-white resize-none" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Localização</label>
              <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Maputo, Matola" className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-white" />
            </div>

          </form>
        </div>

        {/* Footer Fixo do Modal */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
          <button 
            type="submit" 
            form="sell-form"
            disabled={isUploading} 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : (initialData ? <CheckCircle size={24} /> : <Upload size={24} />)}
            {isUploading ? 'Enviando foto...' : (initialData ? 'Salvar Alterações' : 'Publicar Agora')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SellForm;