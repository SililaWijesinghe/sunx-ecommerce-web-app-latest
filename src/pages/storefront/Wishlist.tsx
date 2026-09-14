import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Vault, Sparkles, ShoppingCart, Trash2 } from 'lucide-react';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { useCartStore } from '../../store/useCartStore';
import { Product } from '../../types';

export function WishlistPage() {
  const { wishlist, toggleWishlist } = useStorefrontStore();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#F5F5F7] dark:bg-[#0B0B0E] transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cinematic Header */}
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-4 flex items-center gap-3"
          >
            <Vault className="w-8 h-8 md:w-10 md:h-10 text-[#E50914]" />
            Your Hardware Vault
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 max-w-2xl text-lg"
          >
            The ultimate collection of hardware you are tracking for your next major upgrade.
          </motion.p>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center py-32 px-6 rounded-none bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 relative overflow-hidden group shadow-sm dark:shadow-none"
          >
            {/* Subtle glowing aura */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(229,9,20,0.05)_0%,transparent_50%)] pointer-events-none group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-none flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10">
                <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight uppercase">
                Your vault is empty.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                Let's find your next upgrade and start building your ultimate rig.
              </p>
              
              <Link 
                to="/"
                className="relative inline-flex items-center gap-2 px-8 py-4 bg-[#E50914] text-white font-bold rounded-none overflow-hidden group transition-transform hover:scale-105 active:scale-95 border border-[#E50914]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative uppercase tracking-wider">Explore Hardware</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Populated List View */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="flex flex-col gap-4"
          >
            {wishlist.map((item) => {
              // Map StorefrontProduct to Product
              const product: Product = {
                id: item.id,
                name: item.title,
                price: item.price,                
                imageUrl: item.image,
                slug: item.slug,
                description: '',
                categoryId: '',
                brandId: '',
                stock: 10,
                createdAt: new Date().toISOString()
              };

              return (
                <div key={item.id} className="relative overflow-hidden group">
                  {/* Mobile Swipe-to-Delete Background */}
                  <div className="absolute inset-0 bg-red-600 flex items-center justify-end px-6 sm:hidden rounded-none z-0">
                     <Trash2 className="w-6 h-6 text-white" />
                     <span className="text-white font-bold ml-2 text-xs uppercase tracking-widest">Delete</span>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0.5, right: 0 }}
                    onDragEnd={(e, { offset }) => {
                      if (offset.x < -80) {
                        toggleWishlist(item);
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-6 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-none shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all relative z-10 w-full"
                  >
                     {/* Light glow in dark mode */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <Link to={`/product/${item.slug}`} className="w-full sm:w-40 aspect-square sm:aspect-auto sm:h-32 bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-none flex items-center justify-center p-4 relative overflow-hidden shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500 drop-shadow-md pointer-events-none" 
                      />
                    </Link>
                    
                    <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2 w-full">
                      <Link to={`/product/${item.slug}`}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight hover:text-[#E50914] transition-colors">{item.title}</h3>
                      </Link>
                      <p className="font-mono text-xl text-gray-900 dark:text-gray-100 font-bold">
                        Rs. {item.price.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center justify-center gap-3 mt-4 sm:mt-0 shrink-0">
                      <button 
                        onClick={() => addItem(product)} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E50914] text-white px-6 py-3 rounded-none font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors border border-[#E50914] tap-target"
                      >
                        <ShoppingCart className="w-4 h-4" /> Add
                      </button>
                      <button 
                        onClick={() => toggleWishlist(item)} 
                        className="hidden sm:flex p-3 justify-center items-center text-gray-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-500 border border-gray-200 dark:border-white/10 hover:border-red-500 rounded-none transition-all tap-target"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
