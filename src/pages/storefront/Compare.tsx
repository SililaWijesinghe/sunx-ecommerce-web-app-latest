import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, ShoppingCart, Scale, Check, Zap, Cpu, HardDrive, Maximize, ShieldCheck } from 'lucide-react';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { useCartStore } from '../../store/useCartStore';
import { Product } from '../../types';

// Dynamic Spec Generator based on product name
const getSpecs = (name: string) => {
  const n = name.toLowerCase();
  
  if (n.includes('laptop') || n.includes('macbook')) {
    return {
      performance: n.includes('m5') || n.includes('pro') || n.includes('i7') || n.includes('i9') ? 'Flagship Processor' : 'High-Performance Core',
      capacity: n.includes('1tb') ? '1TB NVMe SSD' : (n.includes('512') ? '512GB SSD' : '256GB SSD'),
      interface: n.includes('16"') ? '16-inch Retina/OLED' : '14-inch FHD+',
      build: 'Premium Aluminum'
    };
  }
  if (n.includes('ram') || n.includes('memory')) {
    return {
      performance: n.includes('ddr5') ? 'DDR5 (Low Latency)' : 'DDR4 Standard',
      capacity: n.includes('32gb') ? '32GB Kit' : (n.includes('16gb') ? '16GB' : '8GB'),
      interface: 'DIMM / SO-DIMM',
      build: 'Heat Spreader Included'
    };
  }
  if (n.includes('ssd') || n.includes('drive') || n.includes('hdd')) {
    return {
      performance: n.includes('nvme') ? 'Up to 7300MB/s Read' : 'Standard Speed',
      capacity: n.includes('2tb') ? '2TB' : (n.includes('1tb') ? '1TB' : '500GB'),
      interface: n.includes('nvme') || n.includes('m.2') ? 'M.2 PCIe Gen4' : 'SATA III / USB 3.0',
      build: 'Shock Resistant'
    };
  }
  if (n.includes('keyboard')) {
    return {
      performance: n.includes('mechanical') ? 'Tactile Switches' : 'Quiet Membrane',
      capacity: 'Full Size Layout',
      interface: 'USB / Bluetooth',
      build: 'Spill-Resistant'
    };
  }
  if (n.includes('screen') || n.includes('display')) {
    return {
      performance: '60Hz - 144Hz Refresh',
      capacity: '100% sRGB Color',
      interface: 'eDP 30/40 Pin',
      build: 'Grade A+ Panel'
    };
  }
  
  return {
    performance: 'Optimized Output',
    capacity: 'Standard Specification',
    interface: 'Universal Fit',
    build: 'Tested & Certified'
  };
};

// Helper components for clean, strict geometric cells
const LabelCell = ({ children }: { children: React.ReactNode, key?: React.Key }) => (
  <div className="bg-gray-100 dark:bg-[#050505] p-3 sm:p-6 flex items-center justify-start text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold h-full">
    {children}
  </div>
);

const ValueCell = ({ children, className = '' }: { children: React.ReactNode, className?: string, key?: React.Key }) => (
  <div className={`p-3 sm:p-6 flex flex-col justify-center bg-white dark:bg-[#0A0A0C] h-full ${className}`}>
    {children}
  </div>
);

export function ComparePage() {
  const { compareList, removeFromCompare } = useStorefrontStore();
  const addItem = useCartStore(state => state.addItem);

  // Psychological Logic Engine (The 'Winning' Specs)
  const lowestPrice = compareList.length > 0
    ? Math.min(...compareList.map(p => p.price))
    : null;

  // Assuming discount might be added to Storefront product later, default 0
  const highestDiscount = compareList.length > 0
    ? Math.max(...compareList.map(p => (p as any).discount || 0))
    : 0;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Cinematic Header */}
        <div className="mb-12 px-2 sm:px-0">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-4 flex items-center gap-3"
          >
            <Scale className="w-8 h-8 md:w-10 md:h-10 text-[#E50914]" />
            Head-to-Head Spec Engine
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl text-base sm:text-lg"
          >
            Compare hardware side-by-side to find the ultimate upgrade for your rig.
          </motion.p>
        </div>

        {/* Empty State */}
        {compareList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center py-32 px-6 rounded-none bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,204,0.05)_0%,transparent_50%)] pointer-events-none group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-none flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                <Scale className="w-8 h-8 text-[#00ffcc]" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight uppercase">
                The engine is empty.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                Add up to 3 hardware pieces to the engine to compare their specs head-to-head.
              </p>
              
              <Link 
                to="/"
                className="relative inline-flex items-center gap-2 px-8 py-4 bg-[#E50914] text-white font-bold rounded-none overflow-hidden group transition-transform hover:scale-105 active:scale-95 border border-[#E50914]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative uppercase tracking-wider">Explore Hardware</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Spec Table Engine */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full pb-8 "
          >
            {/* 1px Gap trick creates the sharp single-pixel internal borders globally */}
            <div 
              className="grid gap-[1px] bg-gray-200 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-none"
              style={{ gridTemplateColumns: `minmax(100px, 150px) repeat(${compareList.length}, minmax(0, 1fr))` }}
            >
              
              {/* ROW 1: Product Header & Image */}
              <LabelCell>Product</LabelCell>
              {compareList.map((product) => (
                <div key={`header-${product.id}`} className="relative overflow-hidden bg-white dark:bg-[#0A0A0C] p-4 sm:p-8 flex flex-col items-center justify-between group min-h-[220px] sm:min-h-[320px]">
                  {/* Cinematic Spotlight Effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-100 dark:from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 hover:bg-[#E50914] dark:bg-black/60 dark:hover:bg-[#E50914] text-gray-500 hover:text-white border border-gray-200 hover:border-[#E50914] dark:border-white/10 dark:hover:border-[#E50914] transition-all duration-300 rounded-none shadow-sm"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  
                  {/* Image with extreme drop-shadow */}
                  <Link to={`/product/${product.slug}`} className="w-full flex-1 flex items-center justify-center mb-3 sm:mb-6 relative z-10">
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="max-h-24 sm:max-h-48 object-contain drop-shadow-md dark:drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                  </Link>
                  
                  {/* Title */}
                  <Link to={`/product/${product.slug}`} className="relative z-10 w-full mt-auto">
                    <h3 className="text-xs sm:text-base font-bold text-gray-900 dark:text-white text-center hover:text-[#E50914] transition-colors line-clamp-2 uppercase tracking-wide">
                      {product.title}
                    </h3>
                  </Link>
                </div>
              ))}

              {/* ROW 2: Pricing & Action */}
              <LabelCell>Pricing & Action</LabelCell>
              {compareList.map((product) => {
                const isLowest = product.price === lowestPrice;
                
                const mappedProduct: Product = {
                  id: product.id,
                  name: product.title,
                  price: product.price,
                  imageUrl: product.image,
                  slug: product.slug,
                  description: '',
                  categoryId: '',
                  brandId: '',
                  stock: 10,
                  createdAt: new Date().toISOString()
                };

                return (
                  <ValueCell key={`price-${product.id}`} className="gap-3 sm:gap-5">
                    <div className="flex items-center gap-1 sm:gap-3 flex-wrap justify-center sm:justify-start">
                      <span className={`font-mono font-bold text-sm sm:text-2xl transition-all duration-500 text-center sm:text-left w-full sm:w-auto ${
                        isLowest 
                          ? 'text-green-600 dark:text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.2)] dark:drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        Rs. {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      {/* Visual Anchor for Winner */}
                      {isLowest && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="hidden sm:block">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)] dark:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Tactile Red Action Button */}
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addItem(mappedProduct)}
                      className="w-full py-2 sm:py-4 rounded-none bg-[#E50914] text-white font-bold text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] hover:bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] dark:hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border border-[#E50914]"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </motion.button>
                  </ValueCell>
                );
              })}
              
              {/* SPEC ROW 1: Performance */}
              <LabelCell>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Performance</span>
                </div>
              </LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`perf-${product.id}`}>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center sm:text-left">
                    {getSpecs(product.title).performance}
                  </span>
                </ValueCell>
              ))}

              {/* SPEC ROW 2: Capacity / Size */}
              <LabelCell>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Capacity</span>
                </div>
              </LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`cap-${product.id}`}>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center sm:text-left">
                    {getSpecs(product.title).capacity}
                  </span>
                </ValueCell>
              ))}

              {/* SPEC ROW 3: Interface */}
              <LabelCell>
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Interface</span>
                </div>
              </LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`int-${product.id}`}>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center sm:text-left">
                    {getSpecs(product.title).interface}
                  </span>
                </ValueCell>
              ))}

              {/* SPEC ROW 4: Build & Quality */}
              <LabelCell>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Build</span>
                </div>
              </LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`build-${product.id}`}>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center sm:text-left">
                    {getSpecs(product.title).build}
                  </span>
                </ValueCell>
              ))}
              
              {/* ROW 3: Brand */}
              <LabelCell>Brand</LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`brand-${product.id}`}>
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest text-center sm:text-left">SUNX Certified</span>
                </ValueCell>
              ))}
              
              {/* ROW 4: SKU */}
              <LabelCell>SKU</LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`sku-${product.id}`}>
                  <span className="text-[10px] sm:text-sm font-mono text-gray-500 dark:text-gray-400 uppercase text-center sm:text-left">SNX-{product.id.split('-')[0] || product.id.slice(0, 6)}</span>
                </ValueCell>
              ))}
              
              {/* ROW 5: Stock Status */}
              <LabelCell>Stock Status</LabelCell>
              {compareList.map((product) => (
                <ValueCell key={`stock-${product.id}`}>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] dark:shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-[10px] sm:text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">In Stock</span>
                  </div>
                </ValueCell>
              ))}
              
              {/* ROW 6: Discount */}
              <LabelCell>Discount</LabelCell>
              {compareList.map((product) => {
                const discount = (product as any).discount || 0;
                const isHighest = discount === highestDiscount && highestDiscount > 0;

                return (
                  <ValueCell key={`discount-${product.id}`}>
                    {discount > 0 ? (
                      <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
                        <span className={`font-bold uppercase tracking-wider transition-all duration-500 ${
                          isHighest 
                            ? 'text-yellow-600 dark:text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)] dark:drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] text-sm sm:text-lg' 
                            : 'text-gray-600 dark:text-gray-300 text-[10px] sm:text-sm'
                        }`}>
                          {discount}% OFF
                        </span>
                        {/* Visual Anchor for Winner */}
                        {isHighest && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="hidden sm:block">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 dark:text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] dark:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] fill-yellow-500 dark:fill-yellow-400" />
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 font-medium text-[10px] sm:text-sm tracking-wider uppercase text-center sm:text-left">N/A</span>
                    )}
                  </ValueCell>
                );
              })}

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
