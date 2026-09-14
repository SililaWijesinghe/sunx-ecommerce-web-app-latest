import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../store/useThemeStore';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-10 md:h-16 w-auto" }: BrandLogoProps) {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`relative flex items-center justify-start ${className}`}>
      {/* Invisible placeholder for layout sizing */}
      <img 
        src="/primary-logo.png" 
        className="h-full w-auto opacity-0 pointer-events-none" 
        aria-hidden="true" 
      />
      <AnimatePresence mode="wait">
        {isDarkMode ? (
          <motion.div
            key="white-logo"
            className="absolute inset-0 flex items-center justify-start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <img src="/white-logo.png" alt="SUNX Technologies" className="h-full w-auto object-contain" />
          </motion.div>
        ) : (
          <motion.div
            key="black-logo"
            className="absolute inset-0 flex items-center justify-start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <img src="/primary-logo.png" alt="SUNX Technologies" className="h-full w-auto object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
