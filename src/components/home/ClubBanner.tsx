import React from 'react';
import { Gift, Zap, ChevronRight } from 'lucide-react';

export function TrustBox() {
  return (
    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden bg-[#050505] border border-white/5 group shadow-2xl flex flex-col justify-center p-8 lg:p-10 transition-all duration-500 hover:border-white/10">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] to-[#111111] z-0" />
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full z-0 group-hover:bg-emerald-500/20 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Gift className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1 block">New Customer Exclusive</span>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">
              Extra 5% Off<br />On First Order
            </h3>
            <p className="text-sm font-medium text-gray-400">Use code <strong className="text-white">WELCOME5</strong> at checkout</p>
          </div>
        </div>
        
        <button className="bg-white text-black font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2">
          Claim Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ClubBanner() {
  return (
    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden bg-[#050505] border border-white/5 group shadow-2xl flex flex-col justify-center p-8 lg:p-10 transition-all duration-500 hover:border-[#E50914]/30">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505] via-[#0a0202] to-[#050505] z-0" />
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#E50914]/20 blur-[100px] rounded-full z-0 group-hover:bg-[#E50914]/30 transition-colors duration-700 pointer-events-none" />
      <div className="absolute right-0 bottom-0 opacity-50 mix-blend-screen pointer-events-none z-0">
        <img src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=400" alt="Hardware" className="w-64 h-64 object-cover mask-image-linear-left" style={{ maskImage: 'linear-gradient(to right, transparent, black)', WebkitMaskImage: 'linear-gradient(to right, transparent, black)' }} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 h-full">
        <div className="flex flex-col h-full justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#E50914]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E50914]">Level Up</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3 italic">
            Power Up<br />Your Game
          </h3>
          <p className="text-sm font-medium text-gray-400 max-w-xs">Premium components engineered for maximum performance.</p>
        </div>
        
        <button className="bg-[#E50914] text-white font-black uppercase tracking-widest text-xs px-8 py-3.5 rounded-lg hover:bg-red-700 transition-colors shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:shadow-[0_0_30px_rgba(229,9,20,0.5)] flex items-center gap-2 self-start md:self-center mt-auto md:mt-0">
          Shop Gear <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
