import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, Loader2, Trash2, Smartphone, DollarSign, CheckCircle } from 'lucide-react';
import { Product, Category, Condition } from '../types';
import { supabase } from '../lib/supabaseClient';

interface SellFormProps {
  onClose: () => void;
  onSubmit: (product: Product) => void;
  initialData?: Product | null;
}

const SellForm: React.FC<SellFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>(Category.WOMEN);
  const [condition, setCondition] = useState<Condition>(Condition.GOOD);
  const [location, setLocation] = useState('Maputo');
  
  // CORREÇÃO AQUI: Inicializa com valor seguro
  const [phone, setPhone] = useState('853691613');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPaymentWall, setShowPaymentWall] = useState(false);

  // Carregar dados se for EDIÇÃO
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setPrice(initialData.price.toString());
      setCategory(initialData.category as Category);
      setCondition(initialData.condition as Condition);
      setLocation(initialData.location);
      
      // CORREÇÃO: Garante que não quebra se vier nulo
      setPhone(initialData.sellerPhone || ''); 
      
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Modo Edição: Pula verificação de taxa
    if (initialData) {
      await finalizePublish();
      return;
    }

    // Modo Criação: Exige foto
    if (!imageFile) { alert("Foto obrigatória para novos anúncios!"); return; }
    if (!currentUser) return;

    setIsUploading(true);

    try {
      const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
      if (error) throw error;

      if (count && count >= 1) {
        setIsUploading(false);
        setShowPaymentWall(true);
      } else {
        await finalizePublish();
      }
    } catch (err) { console.error(err); setIsUploading(false); }
  };

  const finalizePublish = async () => {
    setIsUploading(true);
    try {
      let publicUrl = initialData?.imageUrl || "";

      // 1. Upload da imagem (se houver nova)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      // 2. Objeto para o Supabase (snake_case)
      const dbPayload = {
        title,
        description,
        price: Number(price),
        image_url: publicUrl,
        category,
        condition,
        location,
        seller_phone: phone, // Vai para o banco como seller_phone
        updated_at: new Date().toISOString(),
      };

      if (initialData) {
        // --- UPDATE ---
        const { error } = await supabase
          .from('products')
          .update(dbPayload)
          .eq('id', initialData.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        
        // Objeto para o App (camelCase)
        const updatedProduct: Product = {
            ...initialData,
            title,
            description,
            price: Number(price),
            imageUrl: publicUrl,
            category,
            condition,
            location,
            sellerPhone: phone, // CORREÇÃO: Garante camelCase no frontend
            updatedAt: new Date().toISOString()
        };
        
        onSubmit(updatedProduct);

      } else {
        // --- INSERT ---
        const newProductDb = {
          ...dbPayload,
          user_id: currentUser?.id,
          seller_name: currentUser?.user_metadata?.full_name || 'Anônimo',
          status: 'available',
          likes: 0
        };

        const { error } = await supabase.from('products').insert([newProductDb]);
        if (error) throw error;
        
        // Para novos produtos, o App geralmente recarrega a lista do zero via fetchProducts
        // Então passamos um objeto placeholder só para fechar o modal
        onSubmit({ 
            id: 'temp', 
            ...newProductDb, 
            imageUrl: publicUrl, 
            sellerPhone: phone 
        } as unknown as Product);
      }

    } catch (error) { 
      console.error(error); 
      alert('Erro ao salvar. Tente novamente.'); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleWhatsAppPayment = () => {
    const adminPhone = "258841234567"; 
    const message = `Olá! Quero pagar a taxa de 5MT para publicar: "${title}" (${price}MT).`;
    const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Editar Anúncio' : 'Vender Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        {showPaymentWall ? (
          <div className="p-8 text-center animate-slide-up">
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600"><DollarSign size={40} /></div>
             <h3 className="text-2xl font-black mb-2">Segunda Venda!</h3>
             <p className="text-gray-600 dark:text-gray-300 mb-6">Taxa simbólica de <strong>5,00 MT</strong>.</p>
             <div className="space-y-3">
               <button onClick={handleWhatsAppPayment} className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-105 transition"><Smartphone size={20} /> Pagar 5MT via WhatsApp</button>
               <p className="text-xs text-gray-400 my-2">Depois de pagar, confirme abaixo.</p>
               <button onClick={finalizePublish} disabled={isUploading} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2">{isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} Já fiz o pagamento</button>
             </div>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Foto</label>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"><div className="flex flex-col items-center justify-center pt-5 pb-6"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3 group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-indigo-500" /></div><p className="mb-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Adicionar foto</p></div><input type="file" accept="image/*" className="hidden" onChange={handleImageChange} /></label>
              ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={removeImage} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"><Trash2 size={20} /></button>
                  </div>
                </div>
              )}
            </div>
            
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Vestido Floral Zara" className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (MT)</label><input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condição</label><select value={condition} onChange={e => setCondition(e.target.value as Condition)} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white appearance-none">{Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label><div className="grid grid-cols-2 gap-2">{Object.values(Category).map((cat) => (<button key={cat} type="button" onClick={() => setCategory(cat)} className={`p-2 rounded-lg text-xs font-medium border transition-all ${category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300'}`}>{cat}</button>))}</div></div>
            
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label><textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes..." className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none" /></div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" disabled={isUploading || !currentUser} className="flex-[2] py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isUploading ? <Loader2 className="animate-spin" /> : (initialData ? <CheckCircle size={20} /> : <Upload size={20} />)}
                {isUploading ? "Processando..." : (initialData ? "Salvar Alterações" : "Publicar")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellForm;