import React from 'react';
import { ShoppingBag, Heart, Trash2, CheckCircle, Edit, Image as ImageIcon } from 'lucide-react';
import { Product, UserProfile } from '../types';
import DOMPurify from 'dompurify';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
  isLiked?: boolean;
  onToggleLike?: (product: Product) => void;
  currentUserId?: string;
  userProfile?: UserProfile | null;
  onMarkAsSold?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onEdit?: (product: Product) => void;
}

// OTIMIZAÇÃO: React.memo para evitar re-render se as props não mudarem
const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  product, 
  onAddToCart, 
  onClick, 
  isLiked, 
  onToggleLike, 
  currentUserId, 
  userProfile, 
  onMarkAsSold, 
  onDelete, 
  onEdit 
}) => {
  
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString('pt-MZ');
  
  // Lógica de Permissão
  const isOwner = currentUserId === product.sellerId;
  const isAdmin = userProfile?.role === 'admin';
  const canManage = isOwner || isAdmin;

  // CORREÇÃO: Lógica do Badge +X Fotos
  const extraImagesCount = product.images && product.images.length > 1 ? product.images.length - 1 : 0;

  return (
    <div 
      className={`group relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ring-1 ring-gray-100 dark:ring-slate-700 hover:ring-indigo-100 dark:hover:ring-indigo-900/30 flex flex-col h-full ${product.status === 'sold' ? 'opacity-70 grayscale' : ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-slate-700" onClick={() => onClick(product)}>
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges Superiores */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                -{discount}%
            </div>
            )}
        </div>

        {/* CORREÇÃO: Badge de Fotos Extras */}
        {extraImagesCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10 pointer-events-none">
            <ImageIcon size={10} />
            +{extraImagesCount}
          </div>
        )}

        {product.status === 'sold' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 border-2 border-white">VENDIDO</span>
          </div>
        )}

        {onToggleLike && (
          <button 
            className={`absolute top-2 right-2 md:top-3 md:right-3 p-2 rounded-full transition-all shadow-sm z-20 ${
              isLiked 
                ? 'bg-white text-red-500 scale-110' 
                : 'bg-white/60 dark:bg-slate-900/60 text-gray-600 dark:text-gray-300 backdrop-blur-md hover:bg-white hover:text-red-500'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(product);
            }}
          >
            <Heart size={16} className={`transition-colors ${isLiked ? 'fill-red-500' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-1" onClick={() => onClick(product)}>
        <div className="mb-auto">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-1">
            {product.title}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {product.category} • {product.condition}
          </p>
        </div>

        <div className="mt-2 mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">{formatMoney(product.price)}</span>
            {product.originalPrice && product.status !== 'sold' && (
              <span className="text-[10px] text-gray-400 line-through decoration-red-500/50 hidden md:inline">{formatMoney(product.originalPrice)}</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Publicado em: {formattedDate}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700/50 mt-1">
           <div className="flex items-center gap-1.5">
             <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden ring-1 ring-white dark:ring-slate-700">
                <img src={`https://ui-avatars.com/api/?name=${product.sellerName || 'User'}&background=random`} alt="" className="w-full h-full object-cover" loading="lazy" />
             </div>
             <span className="text-[10px] md:text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate max-w-[60px] md:max-w-[80px]">{product.sellerName || 'Vendedor'}</span>
           </div>

           {/* Botões de Ação */}
           {canManage ? (
             <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                {product.status !== 'sold' && onMarkAsSold && isOwner && (
                  <button 
                    onClick={() => onMarkAsSold(product.id)}
                    className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg text-xs font-bold hover:bg-green-200"
                    title="Marcar como Vendido"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                {onEdit && isOwner && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(product.id)}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200"
                    title="Apagar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
             </div>
           ) : (
             <button
               onClick={(e) => {
                   e.stopPropagation();
                   onAddToCart(product);
               }}
               className="p-1.5 md:p-2 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-md hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
               disabled={product.status === 'sold'}
              >
               <ShoppingBag size={14} className="md:w-4 md:h-4" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
