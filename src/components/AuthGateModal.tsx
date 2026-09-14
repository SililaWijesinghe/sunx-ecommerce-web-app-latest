import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';

export function AuthGateModal() {
  const { isAuthGateOpen, authGateMessage, closeAuthGate } = useUIStore();
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    closeAuthGate();
    navigate('/auth');
  };

  return (
    <AnimatePresence>
      {isAuthGateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeAuthGate}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gray-950 border border-red-600/30 shadow-[0_0_40px_rgba(229,9,20,0.15)] rounded-xl p-8 max-w-md w-full mx-4 flex flex-col items-center text-center"
          >
            <button
              onClick={closeAuthGate}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-red-950/50 border border-red-900/50 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-[#E50914]" />
            </div>

            <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-3">
              {authGateMessage}
            </h3>
            
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Unlock your personalized experience to track price drops and save selections.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-3 uppercase tracking-widest transition-colors rounded-sm shadow-lg shadow-red-900/20"
              >
                Log In / Register
              </button>
              <button
                onClick={closeAuthGate}
                className="w-full text-gray-500 hover:text-white font-bold py-3 uppercase tracking-widest transition-colors text-sm"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
