import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain } from 'lucide-react';
import { GuidedMatchModal } from './GuidedMatchModal';

export function MatchBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#050505] border border-white/5 group shadow-2xl cursor-pointer hover:shadow-[0_10px_30px_rgba(229,9,20,0.15)] transition-all duration-300" onClick={() => setIsModalOpen(true)}>

        {/* Background glows */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#E50914]/20 blur-[100px] rounded-full pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-900/20 blur-[100px] rounded-full pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-60" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

        {/* Animated corner accents */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#E50914]/60 rounded-tl-md" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#E50914]/60 rounded-tr-md" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#E50914]/60 rounded-bl-md" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#E50914]/60 rounded-br-md" />

        <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center z-10">

          {/* Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#E50914] blur-2xl opacity-30 rounded-full animate-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center bg-[#E50914]/10 border border-[#E50914]/30 rounded-2xl">
              <Brain className="w-8 h-8 text-[#E50914]" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E50914] block mb-2">AI-Powered</span>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
              AI Product
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#E50914] to-red-400 drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                Advisor
              </span>
            </h3>
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#E50914]/60 to-transparent my-5" />

          {/* Subtitle */}
          <p className="text-slate-400 text-sm font-medium mb-10 max-w-[210px] leading-relaxed">
            Answer 3 quick questions. We'll recommend the exact laptop, upgrade, or replacement part from our live catalog.
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            className="relative px-8 py-4 bg-[#E50914] text-white font-black uppercase tracking-widest text-sm rounded-xl overflow-hidden z-20 group/btn w-full max-w-[200px]"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(229,9,20,0.4)',
                '0 0 0 15px rgba(229,9,20,0)',
                '0 0 0 0 rgba(229,9,20,0)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Start Match</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out" />
          </motion.button>

        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && <GuidedMatchModal onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
