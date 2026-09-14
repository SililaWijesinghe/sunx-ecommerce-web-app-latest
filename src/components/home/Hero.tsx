import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const SLIDES = [
  {
    id: 1,
    title: 'Premium Laptops',
    subtitle: 'Next-Gen Performance',
    ctaText: 'Shop Laptops',
    image: '/heroLaptops.webp'
  },
  {
    id: 2,
    title: 'Pro Accessories',
    subtitle: 'Elevate Your Setup',
    ctaText: 'View Accessories',
    image: '/heroLaptopaccessories.webp'
  },
  {
    id: 3,
    title: 'Reliable Storage',
    subtitle: 'Expand Your World',
    ctaText: 'Shop Storage',
    image: '/heroExternalStorages.webp'
  },
  {
    id: 4,
    title: 'Premium Prints',
    subtitle: 'High Quality Ink',
    ctaText: 'Shop Cartridges',
    image: '/heroInkCartridges.webp'
  }
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideProducts, setSlideProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHeroProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, price, images, category_id')
          .limit(50);
          
        if (data && data.length >= 4) {
          const laptops = data.find((p: any) => p.slug?.toLowerCase().includes('laptop') || p.category_id === 'laptops') || data[0];
          const accessories = data.find((p: any) => p.slug?.toLowerCase().includes('keyboard') || p.slug?.toLowerCase().includes('mouse') || p.slug?.toLowerCase().includes('adapter') || p.slug?.toLowerCase().includes('hub')) || data[1];
          const storage = data.find((p: any) => p.slug?.toLowerCase().includes('ssd') || p.slug?.toLowerCase().includes('hdd') || p.slug?.toLowerCase().includes('drive')) || data[2];
          const ink = data.find((p: any) => p.slug?.toLowerCase().includes('ink') || p.slug?.toLowerCase().includes('cartridge')) || data[3];
          
          setSlideProducts([laptops, accessories, storage, ink]);
        }
      } catch (err) {
        console.error("Error fetching hero products", err);
      }
    }
    fetchHeroProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const activeSlide = SLIDES[currentSlide];

  return (
    <section className="relative w-full h-full rounded-2xl overflow-hidden bg-[#050505] shadow-2xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover object-[85%_center] md:object-center opacity-70"
          />
          
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center justify-center bg-red-600 text-white font-bold px-3 py-1 text-[10px] md:text-xs mb-4 md:mb-6 tracking-widest uppercase rounded-sm shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                {activeSlide.subtitle}
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] md:leading-[1.05] mb-6 md:mb-8 tracking-tighter uppercase drop-shadow-2xl">
                {activeSlide.title.split(' ').map((word, i) => (
                  <span key={i} className={i === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-[#E50914] text-white font-bold py-3 md:py-4 px-8 md:px-10 rounded-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_35px_rgba(229,9,20,0.7)] hover:bg-red-600 transition-all duration-300 tracking-widest uppercase text-xs md:text-sm group/btn"
              >
                {activeSlide.ctaText}
                <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
          
          {/* Floating Mini Product Card (Right Side / Bottom Right on Mobile) */}
          {slideProducts[currentSlide] && (
            <div className="absolute bottom-16 right-4 sm:bottom-8 sm:right-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:right-12 lg:right-24 z-30">
              <motion.div
                key={`product-${currentSlide}`}
                initial={{ opacity: 0, x: 100, rotateY: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, rotateY: 20, scale: 0.9 }}
                transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
                className="w-36 h-36 sm:w-40 sm:h-40 md:w-64 md:h-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-[2rem] p-2 sm:p-3 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.1)] flex flex-col justify-between group cursor-pointer overflow-visible"
                onClick={() => navigate(`/product/${slideProducts[currentSlide].slug}`)}
                whileHover={{ y: -5, boxShadow: '0 30px 60px rgba(229,9,20,0.3), inset 0 0 20px rgba(255,255,255,0.2)' }}
              >
                <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-[#E50914] text-white text-[9px] md:text-xs font-black px-2 py-1 md:px-4 md:py-1.5 rounded-full shadow-[0_5px_15px_rgba(229,9,20,0.5)] tracking-widest uppercase">
                  Featured
                </div>
                
                <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 bg-white/20 backdrop-blur-md border border-white/30 w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full z-10 group-hover:bg-white/40 transition-colors">
                  <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <div className="flex-1 w-full flex items-center justify-center p-1 md:p-2 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 rounded-xl"></div>
                  {(() => {
                    const product = slideProducts[currentSlide];
                    const imageSrc = (product.images && product.images.length > 0) 
                                      ? product.images[0] : '/placeholder.png';
                    return (
                      <img 
                        src={imageSrc} 
                        alt={product.title || product.name} 
                        className="max-w-[85%] max-h-[85%] md:max-w-[90%] md:max-h-[90%] object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-10" 
                      />
                    );
                  })()}
                </div>
                
                <div className="mt-1 md:mt-3 bg-black/40 backdrop-blur-sm rounded-lg md:rounded-xl p-1.5 md:p-3 border border-white/10 group-hover:border-white/20 transition-colors">
                  <h4 className="text-white font-bold text-[10px] md:text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                    {slideProducts[currentSlide].title || slideProducts[currentSlide].name}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5 md:mt-1">
                    <p className="text-white font-black text-[10px] md:text-sm drop-shadow-md">
                      Rs. {slideProducts[currentSlide].price.toLocaleString()}
                    </p>
                    <span className="hidden md:inline text-[10px] text-white/50 font-bold uppercase tracking-wider group-hover:text-white/80 transition-colors">View →</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 md:bottom-8 left-6 md:left-16 lg:left-24 flex items-center gap-2 md:gap-3 z-20">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-500 rounded-sm ${
              currentSlide === index
                ? 'w-12 bg-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.8)]'
                : 'w-4 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
