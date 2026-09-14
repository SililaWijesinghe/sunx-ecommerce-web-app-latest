import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle geometric background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-gray-900/90 backdrop-blur-md border border-gray-800 p-12 text-center shadow-2xl relative z-10"
      >
        <div className="w-20 h-20 bg-gray-950 border border-gray-800 rounded-sm flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle className="w-10 h-10 text-[#E50914]" />
        </div>
        
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-4 text-white">
          Order Secured
        </h1>
        <p className="text-gray-400 mb-10 font-medium tracking-wider text-sm">
          Thank you for your order! Your payment has been securely processed and your high-performance gear is being prepared for shipment.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/account')} 
            className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-4 px-6 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" /> View My Orders
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-transparent hover:bg-gray-800/50 border border-gray-800 hover:border-gray-600 text-white font-bold py-4 px-6 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
