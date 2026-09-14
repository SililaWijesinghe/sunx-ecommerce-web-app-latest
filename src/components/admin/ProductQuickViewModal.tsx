import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Box, Tag, Layers, Fingerprint, DollarSign, PackageOpen } from 'lucide-react';

interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null; // Accepting any to accommodate joined queries (e.g. categories.name)
}

export function ProductQuickViewModal({ isOpen, onClose, product }: ProductQuickViewProps) {
  if (!product) return null;

  // Resolve Image directly from database images[0] array
  const imageUrl = (Array.isArray(product.images) && product.images.length > 0 && product.images[0])
    ? product.images[0]
    : (product.image_url || product.base_image_url || '/placeholder.png');

  // Parse Specifications
  let specs: Record<string, string> = {};
  if (product.specifications) {
    try {
      specs = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications) 
        : product.specifications;
    } catch (e) {
      console.error("Failed to parse specifications", e);
    }
  }

  // Resolve Stock status
  const stock = product.stock_quantity ?? product.stock ?? 0;
  let stockColor = 'bg-red-500/10 text-red-500 border-red-500/20';
  let stockText = 'Out of Stock';
  
  if (stock > 5) {
    stockColor = 'bg-green-500/10 text-green-500 border-green-500/20';
    stockText = `${stock} in Stock`;
  } else if (stock > 0) {
    stockColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    stockText = `Low Stock (${stock})`;
  }

  // Resolve Brand and Category names (if joined from Supabase)
  const categoryName = product.categories?.name || product.category_id || 'Uncategorized';
  const brandName = product.brands?.name || product.brand_id || 'No Brand';

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-white/90 dark:bg-[#0A0A0C]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Left Column: Image */}
            <div className="w-full md:w-2/5 bg-slate-100/50 dark:bg-black/40 p-8 flex items-center justify-center min-h-[300px] border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 relative">
              {product.promo_badge && (
                <div className="absolute top-6 left-6 bg-[#E50914] text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                  {product.promo_badge}
                </div>
              )}
              <img
                src={imageUrl || '/placeholder.png'}
                alt={product.title || product.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                }}
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-xl"
              />
            </div>

            {/* Right Column: Details */}
            <div className="w-full md:w-3/5 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              
              {/* Header Info */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${stockColor}`}>
                    {stockText}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> {brandName}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> {categoryName}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                  {product.title || product.name}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Fingerprint className="w-4 h-4" />
                  <span>SKU: {product.sku || 'N/A'}</span>
                  <span className="opacity-50">•</span>
                  <span>ID: {product.id}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Price Output
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-[#E50914]">
                      Rs. {Number(product.price).toLocaleString()}
                    </span>
                    {product.original_price > product.price && (
                      <span className="text-lg font-medium text-slate-400 line-through mb-1">
                        Rs. {Number(product.original_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {product.discount_percent > 0 && (
                  <div className="bg-[#E50914] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20">
                    -{product.discount_percent}%
                  </div>
                )}
              </div>

              {/* Specifications */}
              {Object.keys(specs).length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <PackageOpen className="w-4 h-4 text-[#E50914]" /> Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 truncate">{key}</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate" title={String(value)}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <PackageOpen className="w-4 h-4 text-[#E50914]" /> Technical Specifications
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-500">No specifications found for this product.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
