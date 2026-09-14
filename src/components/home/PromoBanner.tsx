import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function PromoBanner() {
  const promos = [
    {
      id: 1,
      title: 'LEVEL UP YOUR GAME',
      subtitle: 'Next Gen Accessories',
      cta: 'Shop Gaming',
      link: '/#gaming',
      image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800',
      gradient: 'from-black via-[#1a0505] to-[#330000]',
      glow: 'bg-red-500/20'
    },
    {
      id: 2,
      title: 'SMART TECH',
      subtitle: 'Premium Laptops',
      cta: 'Explore',
      link: '/#laptops',
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800',
      gradient: 'from-black via-[#05101a] to-[#002233]',
      glow: 'bg-blue-500/20'
    },
    {
      id: 3,
      title: 'BUILD YOUR SETUP',
      subtitle: 'High-End Components',
      cta: 'Upgrade Now',
      link: '/#components',
      image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=800',
      gradient: 'from-black via-[#15051a] to-[#2a0033]',
      glow: 'bg-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
      {promos.map((promo) => (
        <Link key={promo.id} to={promo.link}>
          <motion.div 
            whileHover={{ y: -5 }}
            className={`relative h-[220px] md:h-[260px] rounded-2xl overflow-hidden bg-gradient-to-br ${promo.gradient} shadow-lg hover:shadow-2xl transition-all duration-300 group`}
          >
            {/* Image Background */}
            <div className="absolute inset-0 right-0 w-2/3 ml-auto opacity-50 group-hover:opacity-70 transition-opacity duration-500">
              <img 
                src={promo.image} 
                alt={promo.title} 
                className="w-full h-full object-cover mix-blend-screen"
                style={{ maskImage: 'linear-gradient(to right, transparent, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}
              />
            </div>
            
            {/* Colored Glow */}
            <div className={`absolute bottom-0 right-0 w-32 h-32 blur-[50px] ${promo.glow} pointer-events-none`} />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8 w-2/3">
              <span className="text-gray-300 font-bold text-[10px] tracking-widest uppercase mb-1 block">
                {promo.subtitle}
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-4 tracking-tight">
                {promo.title}
              </h3>
              <div className="inline-flex items-center text-xs font-bold text-white uppercase tracking-wider group/btn">
                <span className="border-b-2 border-[#E50914] pb-0.5">{promo.cta}</span>
                <svg className="w-3.5 h-3.5 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
