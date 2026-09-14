import React from 'react';
import { Heart, ShoppingCart, Star, Scale, Settings, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { motion } from 'motion/react';
import { useUIStore } from '../../store/useUIStore';
import { getBrandLogo, getQualityTag, getProductFeatures } from '../../utils/productCardHelpers';

interface ProductCardProps {
  featured?: boolean;
  product: Product;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  const { toggleWishlist, wishlist, addToCompare, compareList, categories } = useStorefrontStore();
  
  const isWished = wishlist.some(item => item.id === product.id);
  const isInCompare = compareList.some(item => item.id === product.id);

  const productUrl = `/product/${product.slug || product.id}`;
  const category = categories.find(c => c.id === product.categoryId);
  const categoryName = category?.name || '';

  const imageSrc =
    (Array.isArray((product as any).images) && (product as any).images.length > 0 && (product as any).images[0])
      ? (product as any).images[0]
      : (product.imageUrl || '/placeholder.png');

  const brandLogoUrl = getBrandLogo(product.name);
  const qualityTag = getQualityTag(product.name, categoryName);
  const features = getProductFeatures(product.name, categoryName);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      title: product.name,
      price: product.price,
      image: imageSrc,
      slug: product.slug || product.id
    });
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare({
      id: product.id,
      title: product.name,
      price: product.price,
      image: imageSrc,
      slug: product.slug || product.id
    });
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-[#0a0a0c] rounded-2xl md:rounded-3xl border border-[#E5EAF1] dark:border-white/5 p-3 md:p-4 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(255,255,255,0.03)] transition-all duration-300 relative group flex flex-col h-full"
    >
      {/* Top Image Area */}
      <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-white/5 dark:to-transparent mb-3 md:mb-4">
        <Link to={productUrl} className={`w-full flex items-center justify-center p-3 md:p-6 ${featured ? 'aspect-[4/3]' : 'aspect-square'}`}>
          <img 
            src={imageSrc} 
            alt={product.name} 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
            }}
            className="max-w-full max-h-full object-contain group-hover:scale-[1.03] transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal drop-shadow-md"
          />
        </Link>

        {/* Discount Badge */}
        {product.discount ? (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#E50914] text-white text-[9px] md:text-[11px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full z-10 tracking-wide shadow-sm">
            -{product.discount}%
          </div>
        ) : (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#E50914] text-white text-[9px] md:text-[11px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full z-10 tracking-wide shadow-sm">
            NEW
          </div>
        )}

        {/* Floating Actions (Right) */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col gap-1.5 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistToggle}
            className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-sm border border-gray-100 dark:border-white/10 p-1.5 md:p-2 rounded-full text-gray-400 hover:text-[#E50914] hover:border-red-100 dark:hover:text-[#E50914] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] tap-target"
          >
            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWished ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCompareToggle}
            className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-sm border border-gray-100 dark:border-white/10 p-1.5 md:p-2 rounded-full text-gray-400 hover:text-blue-600 hover:border-blue-100 dark:hover:text-blue-400 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] tap-target"
          >
            <Scale className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isInCompare ? 'text-blue-600 dark:text-blue-400' : ''}`} />
          </motion.button>
        </div>

        {/* Brand Logo inside Image Area */}
        {brandLogoUrl && (
          <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white/80 dark:bg-black/40 backdrop-blur-sm px-1.5 py-1 md:px-2 md:py-1.5 rounded-md md:rounded-lg border border-white/40 dark:border-white/10">
            <img src={brandLogoUrl} alt="Brand" className="h-3 md:h-4 w-auto object-contain" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        
        {/* Quality Tag */}
        <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-2">
          <Settings className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-500" />
          <span className="text-[9px] md:text-[11px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 px-1.5 md:px-2 py-0.5 rounded-full line-clamp-1">
            {qualityTag}
          </span>
        </div>

        {/* Title */}
        <Link to={productUrl} className="mb-1 md:mb-1.5 block">
          <h3 className="text-xs md:text-[15px] font-bold text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-[#E50914] dark:hover:text-[#E50914] transition-colors leading-snug md:leading-tight">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2 md:mb-4">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 ${i < Math.floor(product.rating || 5) ? 'fill-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`} 
              />
            ))}
          </div>
          <span className="text-[9px] md:text-[11px] text-gray-500 dark:text-gray-400 font-medium ml-1">({product.reviewCount || 0})</span>
        </div>

        {/* Dynamic Highlights */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-3 md:mb-4 text-[9px] sm:text-[10px] md:text-[11px] font-medium text-[#64748B] dark:text-gray-400">
          {features.slice(0, 3).map((feat, idx) => {
            const Icon = feat.Icon;
            return (
              <div key={idx} className={`flex flex-col items-center gap-0.5 md:gap-1 flex-1 text-center ${idx === 2 ? 'hidden sm:flex' : 'flex'}`}>
                <Icon className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
                <span className="leading-none md:leading-tight truncate w-full px-0.5">{feat.text}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-3 md:pt-4 border-t border-gray-100 dark:border-white/5">
          {/* Price & Stock */}
          <div className="flex items-end justify-between mb-3 md:mb-4 gap-2">
            <div className="flex flex-col min-w-0">
              <div className="text-[15px] md:text-lg font-black text-[#E50914] tracking-tight truncate">
                Rs. {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {product.originalPrice && (
                <div className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 line-through truncate">
                  Rs. {product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
            
            <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md flex items-center gap-1 md:gap-1.5 shrink-0">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              In Stock
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
              }}
              className="flex-1 bg-[#E50914] hover:bg-red-700 text-white py-2 md:py-2.5 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold transition-all shadow-[0_4px_12px_rgba(229,9,20,0.2)] hover:shadow-[0_6px_16px_rgba(229,9,20,0.3)] flex items-center justify-center gap-1.5 md:gap-2 px-1 tap-target"
            >
              <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">Add <span className="hidden sm:inline">to Cart</span></span>
            </button>
            <Link 
              to={productUrl}
              className="px-2 md:px-4 py-2 md:py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex items-center justify-center gap-1.5 md:gap-2 group/btn font-semibold text-[11px] md:text-sm shrink-0 tap-target"
            >
              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 group-hover/btn:text-gray-700 dark:group-hover/btn:text-white" />
              <span className="hidden lg:inline">Quick View</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
