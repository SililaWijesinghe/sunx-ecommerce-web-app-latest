import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { supabase } from '../../lib/supabaseClient';

import { CartItem } from './CartItem';

export function CartDrawer() {
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();
  const navigate = useNavigate();

  const handleCheckoutClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    closeCart();
    if (session) {
      navigate('/checkout');
    } else {
      navigate('/auth');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-2xl border-l border-slate-200/60 dark:border-gray-900 z-50 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.08)] dark:shadow-2xl text-gray-900 dark:text-gray-100 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-900">
              <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                Your Cart
                <span className="bg-[#E50914] text-white text-xs px-2 py-0.5 rounded-full">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1c] rounded-full transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white dark:text-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-[#1a1a1c] rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="uppercase tracking-wider text-sm font-bold text-gray-500">Your cart is empty</p>
                  <button 
                    onClick={closeCart}
                    className="mt-4 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-50 dark:bg-[#1a1a1c] transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-200/60 dark:border-gray-900 bg-white/50 dark:bg-transparent">
                
                {/* Free Shipping Indicator */}
                <div className="flex items-center gap-3 mb-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg border border-green-100 dark:border-green-900/30 text-sm font-semibold">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  You qualify for Free Shipping!
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm">Subtotal</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-gray-100">Rs. {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <button 
                  onClick={handleCheckoutClick}
                  className="w-full bg-[#E50914] hover:bg-red-700 text-white py-4 rounded-lg font-bold uppercase tracking-widest transition-colors flex justify-center items-center shadow-lg shadow-red-900/20"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
