import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Activity, TrendingUp, PackagePlus } from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 1,
    headline: 'Command Center Online',
    text: 'Welcome back. Here is your daily operations briefing.',
    icon: Activity,
    visual: (
      <div className="w-full aspect-video bg-black rounded-lg border border-white/5 flex items-center justify-center overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-[#E50914]/20 to-transparent opacity-50"></div>
        <div className="flex items-end gap-2 h-32 relative z-10">
          {[40, 70, 45, 90, 65, 110].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 }}
              className="w-8 bg-gradient-to-t from-[#E50914] to-red-400 rounded-t-sm shadow-[0_0_15px_rgba(229,9,20,0.5)]"
            />
          ))}
        </div>
      </div>
    )
  },
  {
    id: 2,
    headline: 'Monitor the Pulse',
    text: 'Track your live inventory value and spot low-stock bottlenecks instantly.',
    icon: TrendingUp,
    visual: (
      <div className="w-full aspect-video bg-[#0a0a0c] rounded-lg border border-white/5 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[#E50914] animate-ping"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.1)_0%,transparent_70%)]"></div>
        <div className="relative z-10 text-center">
          <div className="text-4xl font-black text-white mb-2 tracking-tight">Rs. 4.2M</div>
          <div className="text-xs font-bold text-[#E50914] uppercase tracking-wider">Live Pipeline Value</div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    headline: 'Expand the Empire',
    text: 'Use the new dual-mode media engine and live preview to deploy high-converting hardware listings.',
    icon: PackagePlus,
    visual: (
      <div className="w-full aspect-video bg-[#0a0a0c] rounded-lg border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]"></div>
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 backdrop-blur-sm z-10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
           <PackagePlus className="w-8 h-8 text-[#E50914]" />
        </div>
        <div className="w-32 h-2 bg-white/10 rounded-full mb-2 z-10"></div>
        <div className="w-24 h-2 bg-white/5 rounded-full z-10"></div>
      </div>
    )
  }
];

export function AdminDailyTour() {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastTourDate = localStorage.getItem('lastAdminTourDate');
    
    // For debugging, you can comment this if condition to force show it
    if (lastTourDate !== today) {
      setIsTourActive(true);
    }
  }, []);

  const handleComplete = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('lastAdminTourDate', today);
    setIsTourActive(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!isTourActive) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      {isTourActive && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4 font-sans"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-[#121215] border-l-4 border-[#E50914] shadow-2xl relative overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E50914]/10 flex items-center justify-center rounded">
                  <StepIcon className="w-4 h-4 text-[#E50914]" />
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-widest">Initialization Sequence</span>
              </div>
              <button 
                onClick={handleComplete}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 min-h-[380px] flex flex-col justify-center relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight leading-none uppercase drop-shadow-md">
                    {step.headline}
                  </h2>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                    {step.text}
                  </p>
                  
                  {step.visual}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-[#0a0a0c] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {TOUR_STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.5)]' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleComplete}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Skip Briefing
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="bg-[#E50914] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Acknowledge & Start' : 'Next'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
