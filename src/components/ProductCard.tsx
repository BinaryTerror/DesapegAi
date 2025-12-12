
import React from 'react';
import { Heart, MapPin, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
  isLiked?: boolean;
  onToggleLike?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick, isLiked, onToggleLike }) => {
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);
  };

  return (
    <div 
      onClick={() => onClick(product)}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ring-1 ring-gray-100 dark:ring-slate-700 hover:ring-indigo-100 dark:hover:ring-indigo-900/30 flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-slate-700">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1.5">
            {discount > 0 && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                -{discount}%
            </div>
            )}
            {product.isPromoted && (
            <div className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                Destaque
            </div>
            )}
        </div>

        {/* Like Button */}
        <button 
          className={`absolute top-2 right-2 md:top-3 md:right-3 p-2 rounded-full transition-all shadow-sm z-20 ${
            isLiked 
              ? 'bg-white text-red-500 scale-110' 
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-600 dark:text-gray-300 backdrop-blur-md hover:bg-white hover:text-red-500'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike && onToggleLike(product);
          }}
        >
          <Heart size={16} className={`transition-colors ${isLiked ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <div className="mb-auto">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-1">
            {product.title}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.category} • {product.condition}</p>
        </div>

        <div className="mt-2 mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base md:text-lg font-black text-gray-900 dark:text-white">{formatMoney(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through decoration-red-500/50 hidden md:inline">{formatMoney(product.originalPrice)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700/50 mt-1">
           <div className="flex items-center gap-1.5">
             <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden ring-1 ring-white dark:ring-slate-700">
                <img src={`https://ui-avatars.com/api/?name=${product.sellerName}&background=random`} alt="" className="w-full h-full object-cover" />
             </div>
             <span className="text-[10px] md:text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate max-w-[60px] md:max-w-[80px]">{product.sellerName}</span>
           </div>
           <button
            onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
            }}
            className="p-1.5 md:p-2 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-md hover:scale-110 transition-transform active:scale-95"
           >
            <ShoppingCart size={14} className="md:w-4 md:h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
