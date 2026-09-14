import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, ShieldCheck, Truck, Cpu, Monitor } from 'lucide-react';

const MARQUEE_ITEMS = [
  { text: "SRI LANKA'S #1 TECH DESTINATION", icon: Sparkles, color: "text-yellow-400" },
  { text: "ISLAND-WIDE EXPRESS DELIVERY", icon: Truck, color: "text-white" },
  { text: "100% GENUINE PRODUCTS", icon: ShieldCheck, color: "text-[#E50914]" },
  { text: "UNBEATABLE GAMING DEALS", icon: Zap, color: "text-yellow-400" },
  { text: "PREMIUM LAPTOPS & ACCESSORIES", icon: Monitor, color: "text-white" },
  { text: "BUILD YOUR DREAM SETUP", icon: Cpu, color: "text-[#E50914]" }
];

// Duplicate multiple times to ensure it covers ultra-wide screens
const EXTENDED_ITEMS = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

export function StoreMarquee() {
  return (
    <div className="w-full bg-[#050505] border-y border-[#E50914]/20 py-3 overflow-hidden relative mb-8 shadow-[0_0_30px_rgba(229,9,20,0.15)] flex items-center">
      {/* Gradients for smooth fade effect on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>
      
      <motion.div 
        className="flex whitespace-nowrap items-center gap-8 md:gap-12 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 60,
          ease: "linear",
        }}
      >
        {EXTENDED_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3">
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color} drop-shadow-[0_0_8px_currentColor]`} />
              <span className={`text-xs md:text-sm font-black tracking-widest uppercase ${item.color} drop-shadow-md`}>
                {item.text}
              </span>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-600 ml-5 md:ml-9 shadow-[0_0_10px_rgba(229,9,20,0.8)]"></div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
