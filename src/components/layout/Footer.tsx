import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Truck, ShieldCheck, Headphones, Facebook, Twitter, Instagram, Youtube, ArrowUp } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const trustBadges = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Island-wide shipping' },
    { icon: ShieldCheck, title: 'Secure Checkout', desc: '100% protected payments' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated technical team' },
  ];

  return (
    <footer className="relative z-10 bg-[#050505] border-t border-white/10 pt-12 text-gray-400 font-sans transition-colors duration-500 overflow-hidden">
      
      {/* Pre-Footer Trust & Newsletter */}
      <div className="border-b border-white/5 py-10 mb-12 relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-[#E50914]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-12 w-full lg:w-auto">
            {trustBadges.map((badge, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 group cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#E50914]/50 group-hover:bg-[#E50914]/10 transition-colors">
                  <badge.icon className="w-5 h-5 text-slate-300 group-hover:text-[#E50914] transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{badge.title}</h4>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-center lg:text-right">
              Subscribe to Newsletter
            </h4>
            <div className="flex w-full max-w-sm">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-5 py-3 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#E50914]/50 transition-all placeholder:text-gray-500"
              />
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="bg-[#E50914] text-white px-8 py-3 rounded-r-lg font-black text-sm uppercase tracking-wider hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(229,9,20,0.3)]"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Main 4-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col">
            <Link to="/" className="mb-6 block w-fit">
              <img src="/white-logo.png" alt="SUNX Technologies" className="h-14 md:h-20 w-auto object-contain" />
            </Link>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-sm">
              Elevating the standard of premium tech. Your ultimate destination for bespoke rigs, flagship laptops, and elite accessories.
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, idx) => (
                <motion.a 
                  key={idx} 
                  href="#"
                  whileHover={{ y: -3, color: '#E50914' }}
                  className="text-slate-400 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6 text-sm">Shop</h4>
            <ul className="space-y-4">
              {['Gaming Laptops', 'Custom Rigs', 'Components', 'Audio', 'Accessories'].map((link) => (
                <li key={link}>
                  <Link to={`/shop`} className="block w-fit">
                    <motion.span 
                      className="inline-block text-sm text-slate-400"
                      whileHover={{ x: 4, color: '#ffffff' }}
                      transition={{ duration: 0.2 }}
                    >
                      {link}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6 text-sm">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Track Order', 'Warranty Info', 'Returns', 'Contact Us'].map((link) => {
                const path = link === 'Contact Us' ? '/contact' : '/';
                return (
                  <li key={link}>
                    <Link to={path} className="block w-fit">
                      <motion.span 
                        className="inline-block text-sm text-slate-400"
                        whileHover={{ x: 4, color: '#ffffff' }}
                        transition={{ duration: 0.2 }}
                      >
                        {link}
                      </motion.span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6 text-sm">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map((link) => (
                <li key={link}>
                  <Link to={`/`} className="block w-fit">
                    <motion.span 
                      className="inline-block text-sm text-slate-400"
                      whileHover={{ x: 4, color: '#ffffff' }}
                      transition={{ duration: 0.2 }}
                    >
                      {link}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar & Back to Top */}
      <div className="border-t border-white/5 py-8 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-500 font-medium text-center md:text-left leading-relaxed">
            &copy; {currentYear} SUNX Technologies. All rights reserved. <br className="md:hidden" />
            Designed and developed by <a href="https://premierdigital.lk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-4">Premier Digital Pvt Ltd</a>.
          </p>
          
          <motion.button 
            onClick={scrollToTop}
            whileHover={{ y: -3, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-full transition-colors"
          >
            Back to Top
            <ArrowUp className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

    </footer>
  );
}
