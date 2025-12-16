import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, CATEGORY_TREE, UserProfile, Condition } from '../types';
import { X, Loader2, Copy, AlertTriangle, CheckCircle, Upload, Camera, Trash2, Image as ImageIcon } from 'lucide-react';

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

  // Estado para múltiplas imagens
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

  // Manipulação de Múltiplas Imagens
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 5 - imagePreviews.length;
      
      if (remainingSlots <= 0) {
        alert("Máximo de 5 fotos permitido.");
        return;
      }

      const filesToAdd = filesArray.slice(0, remainingSlots);
      const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));

      setImageFiles(prev => [...prev, ...filesToAdd]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index)); // Nota: A lógica de remover arquivos novos vs existentes é simplificada aqui
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) { alert("Pelo menos 1 foto é obrigatória!"); return; }
    
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // 1. Mantém URLs que já eram strings (do banco)
      const existingUrls = imagePreviews.filter(url => url.startsWith('http'));
      uploadedUrls.push(...existingUrls);

      // 2. Faz Upload dos novos arquivos
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      // 3. Envia para o App.tsx salvar no banco
      onSubmit({
        ...initialData,
        ...formData,
        price: Number(formData.price),
        imageUrl: uploadedUrls[0], // A primeira foto é a capa
        images: uploadedUrls,      // Salva o array completo
        sellerPhone: userProfile?.whatsapp || '',
        sellerName: userProfile?.full_name || 'Vendedor',
      });

    } catch (error: any) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar imagens. Tente novamente.");
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
            
            {/* Upload de Múltiplas Imagens */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Fotos do Produto ({imagePreviews.length}/5)</label>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                   <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border dark:border-slate-600 group">
                      <img src={src} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)} 
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-bold">Capa</span>}
                   </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <Camera className="w-6 h-6 text-indigo-500 mb-1" />
                    <span className="text-[10px] font-bold text-gray-400">Adicionar</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
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
            {isUploading ? 'Enviando fotos...' : (initialData ? 'Salvar Alterações' : 'Publicar Agora')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SellForm;
