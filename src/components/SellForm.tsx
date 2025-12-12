import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Product, Category, Condition } from '../types';
import { generateProductListing } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';

interface SellFormProps {
  onClose: () => void;
  onSubmit: (product: Product) => void;
}

const SellForm: React.FC<SellFormProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>(Category.WOMEN);
  const [condition, setCondition] = useState<Condition>(Condition.GOOD);
  const [location, setLocation] = useState('Maputo');
  const [phone, setPhone] = useState('853691613');
  
  // Novos estados para Imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Estados de carregamento
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estado para o usuário logado
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Buscar usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // 1. Função que lida com a escolha do arquivo
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Cria uma URL temporária só para mostrar o preview na tela
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // 2. Função para usar a IA do Gemini
  const handleAIGenerate = async () => {
    if (!title && !imageFile) return;
    setIsGenerating(true);
    
    // Se tiver imagem mas não titulo, usamos um texto genérico para a IA
    const promptText = title || "Uma peça de roupa usada";
    
    const result = await generateProductListing(promptText, condition);
    
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      setPrice(result.suggestedPrice.toString());
      // Tenta encontrar a categoria correspondente ou mantém a atual
      const aiCategory = Object.values(Category).find(c => c === result.category);
      if (aiCategory) setCategory(aiCategory);
    }
    setIsGenerating(false);
  };

  // 3. Função de envio (Upload + Banco de Dados)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Por favor, adicione uma foto do produto.");
      return;
    }

    setIsUploading(true);

    try {
      // A. Fazer Upload da Imagem para o Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`; // Nome único: timestamp.jpg
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images') // Nome do bucket que criamos
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // B. Pegar a URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // C. Criar o objeto do produto COMPLETO
      const newProduct: Product = {
        id: '', // O banco gera isso
        title,
        description,
        price: Number(price),
        imageUrl: publicUrl, // Agora usamos a URL real do Supabase!
        category,
        condition,
        sellerName: currentUser?.user_metadata?.full_name || 'Anônimo',
        sellerRating: 5,
        location,
        sellerPhone: phone,
        likes: 0,
        reviews: [],
        sizes: ['M'], // Hardcoded por enquanto
        
        // NOVOS CAMPOS OBRIGATÓRIOS
        status: 'available',
        sellerId: currentUser?.id || '',
        createdAt: new Date().toISOString(),
        
        // Campo adicional para controle (opcional)
        updatedAt: new Date().toISOString(),
      };

      // D. Enviar para o App (que vai salvar no banco)
      onSubmit(newProduct);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar imagem. Verifique sua conexão.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vender item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* --- ÁREA DE UPLOAD DE FOTO --- */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Foto do Produto</label>
            
            {!imagePreview ? (
              // Botão de Upload
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Toque para adicionar foto</p>
                  <p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
                </div>
                {/* Input Invisível que aceita arquivos */}
                <input 
                  type="file" 
                  accept="image/*" // Aceita qualquer imagem
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              // Preview da Imagem Selecionada
              <div className="relative w-full h-48 rounded-2xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Mágico da IA */}
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={isGenerating || (!title && !imageFile)}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isGenerating ? "Criando anúncio mágico..." : "Preencher com Inteligência Artificial"}
          </button>

          {/* Campos de Texto */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
            <input
              required
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Vestido Floral Zara"
              className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (MT)</label>
              <input
                required
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condição</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as Condition)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white appearance-none"
              >
                {Object.values(Condition).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
               {Object.values(Category).map((cat) => (
                 <button
                   key={cat}
                   type="button"
                   onClick={() => setCategory(cat)}
                   className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                     category === cat 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva detalhes, motivo da venda, etc..."
              className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
            />
          </div>

          {/* Indicador de quem está publicando (opcional, mas útil) */}
          {currentUser && (
            <div className="text-xs text-gray-500 border-t border-gray-100 dark:border-slate-700 pt-4">
              Publicando como: <span className="font-bold">{currentUser.user_metadata?.full_name || currentUser.email}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={isUploading || !currentUser} 
               className="flex-[2] py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
               {isUploading ? "Publicando..." : "Publicar Agora"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellForm;