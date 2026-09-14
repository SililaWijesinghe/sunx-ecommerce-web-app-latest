import React from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center w-14 h-7 rounded-full p-1 transition-colors duration-500 ease-in-out focus:outline-none shadow-inner ${
        isDarkMode 
          ? 'bg-[#1a1a1f] border border-gray-800' 
          : 'bg-gray-200 border border-gray-300'
      }`}
      aria-label="Toggle Dark Mode"
    >
      <motion.div
        className={`w-5 h-5 rounded-full flex items-center justify-center relative shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        animate={{ x: isDarkMode ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {isDarkMode ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              <Moon className="w-3 h-3 text-blue-400 stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              <Sun className="w-3 h-3 text-yellow-500 stroke-[2.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
