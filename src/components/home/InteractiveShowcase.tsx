import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Eye, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const TABS = ['Trending', 'Staff Picks'];

const TAB_DATA: Record<string, any[]> = {
  'Trending': [
    {
      id: 't1',
      name: 'Razer DeathAdder V3',
      price: 14900,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 't2',
      name: 'Keychron K8 Pro',
      price: 24500,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400',
    }
  ],
  'Staff Picks': [
    {
      id: 's1',
      name: 'Logitech G Pro X',
      price: 32000,
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 's2',
      name: 'SteelSeries Apex Pro',
      price: 45000,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400',
    }
  ]
};

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Upper Card - Flagship Tech Spotlight */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-white dark:bg-[#121215] dark:from-[#121215] dark:to-[#121215] border border-red-100 dark:border-white/10 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] dark:shadow-neu-dark p-6 flex flex-col items-center text-center group transition-all duration-300 hover:shadow-[0_6px_20px_-3px_rgba(220,38,38,0.12)] hover:border-red-500/40">
        <div className="absolute top-4 left-4">
          <div className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-500/20 text-[#E50914] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            SUNX Exclusive
          </div>
        </div>

        <motion.div 
          className="w-full max-w-[200px] aspect-square mt-8 mb-6 relative"
          whileHover={{ scale: 1.05, y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=600" 
            alt="SUNX Pro Custom Desktop" 
            className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal"
          />
        </motion.div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
          SUNX Pro Liquid Series
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
          Custom hard-tube liquid cooling with RTX 4090.
        </p>

        <Link 
          to="/#customizer" 
          className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-transform active:scale-95 hover:bg-[#E50914] dark:hover:bg-[#E50914] hover:text-white dark:hover:text-white shadow-md"
        >
          Build Yours <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Lower Card - Tabbed Mini-Feed */}
      <div className="flex-1 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] dark:shadow-neu-dark p-5 transition-all duration-300 hover:shadow-[0_6px_20px_-3px_rgba(220,38,38,0.12)] hover:border-red-500/40">
        <div className="flex items-center gap-6 border-b border-gray-100 dark:border-gray-800 mb-4 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeDealsTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-t-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 absolute inset-0"
            >
              {TAB_DATA[activeTab].map((item) => (
                <div key={item.id} className="flex gap-4 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                    <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#E50914] transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-1 my-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Rs. {item.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
