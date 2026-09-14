import React from 'react';
import { Truck, ShieldCheck, HeadphonesIcon, CreditCard, RotateCcw } from 'lucide-react';

const SIGNALS = [
  {
    icon: Truck,
    title: 'Free Delivery',
    subtitle: 'For all orders over Rs. 10,000',
  },
  {
    icon: ShieldCheck,
    title: '1 Year Warranty',
    subtitle: 'Official warranty included',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    subtitle: 'We are here to help you',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    subtitle: '7 days return policy',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    subtitle: '100% secure checkout',
  },
];

export function TrustSignals() {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-r from-gray-900 via-[#0a0a0c] to-gray-900 border-y border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-white/10 relative z-10">
        {SIGNALS.map((signal, index) => {
          const Icon = signal.icon;
          return (
            <div 
              key={index} 
              className="p-6 md:p-8 flex flex-col items-center justify-center text-center gap-3 transition-colors hover:bg-white/5 cursor-pointer group"
            >
              <div className="text-gray-400 group-hover:text-[#E50914] transition-colors duration-300">
                <Icon className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-white font-bold text-sm tracking-wide uppercase">{signal.title}</h4>
                <span className="text-gray-400 text-xs mt-1 font-medium">{signal.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
