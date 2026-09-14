import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { useNavigate } from 'react-router-dom';

export function WishlistTab({ items }: { items: any[] }) {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const navigate = useNavigate();

  const handleAddToCart = (item: any) => {
    addItem({ ...item, quantity: 1 });
    openCart();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center">
        <Heart className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" />
        <h3 className="text-2xl font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-2">Your wishlist is empty</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Save your favorite items here to purchase them later.</p>
        <button 
          onClick={() => navigate('/shop')}
          className="bg-[#E50914] hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-colors uppercase tracking-widest inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
          Saved Items
        </h2>
        <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-gray-200 dark:border-gray-800">
          {items.length} Items
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md dark:shadow-neu-dark transition-all duration-300 flex flex-col"
            >
              <div 
                className="relative aspect-square bg-gray-50 dark:bg-[#111111] p-6 cursor-pointer"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-[#E50914] shadow-sm hover:scale-110 transition-transform border border-gray-100 dark:border-gray-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 flex-1">
                  {item.name}
                </h3>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-900">
                  <div className="flex flex-col">
                    {item.discount ? (
                      <>
                        <span className="text-[#E50914] font-bold text-sm">Rs. {item.price.toLocaleString()}</span>
                        <span className="text-gray-400 text-[10px] line-through">Rs. {item.originalPrice?.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-[#E50914] font-bold text-sm">Rs. {item.price.toLocaleString()}</span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-gray-900 hover:bg-[#E50914] dark:hover:bg-[#E50914] hover:text-white transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
