import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, X } from 'lucide-react';

interface ScrollMatchTriggerProps {
  onOpenMatch: () => void;
}

export function ScrollMatchTrigger({ onOpenMatch }: ScrollMatchTriggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show popup after scrolling down 400px, but only if not dismissed
      if (window.scrollY > 400 && !hasDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDismissed]);

  const handleOpen = () => {
    setIsVisible(false);
    setHasDismissed(true); // Don't show again after clicking
    onOpenMatch();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setHasDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-[90px] right-6 z-40 bg-[#0A0A0C] border border-[#E50914]/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(229,9,20,0.2)] flex flex-col gap-3 max-w-sm"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 rounded-full bg-[#E50914]/10 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Need Help Choosing?</h4>
              <p className="text-slate-400 text-xs">Let our AI find your perfect rig.</p>
            </div>
          </div>

          <button
            onClick={handleOpen}
            className="w-full py-2.5 bg-[#E50914] hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-colors shadow-[0_0_15px_rgba(229,9,20,0.3)]"
          >
            Find My Match
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
