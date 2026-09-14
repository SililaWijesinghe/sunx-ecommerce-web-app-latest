import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { ProductCard } from '../../components/shared/ProductCard';
import { StorefrontFilterSidebar } from '../../components/storefront/StorefrontFilterSidebar';
import { Product } from '../../types';
import { Filter, X, Check } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { useLocation } from 'react-router-dom';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const BRANDS = ['ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Intel', 'AMD', 'NVIDIA'];

export function Shop() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { categories, fetchCategories } = useStorefrontStore();

  // Filters
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categorySlug = params.get('category');
    
    if (categorySlug && categories.length > 0) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
         setSelectedCategories([category.id]);
      }
    }
  }, [location.search, categories]);

  const [inStockOnly, setInStockOnly] = useState(false);

  const debouncedPrice = useDebounce(priceRange, 300);
  const debouncedBrands = useDebounce(selectedBrands, 300);
  const debouncedCategories = useDebounce(selectedCategories, 300);
  const debouncedInStock = useDebounce(inStockOnly, 300);

  const [matchCount, setMatchCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');

        // Price Filter
        query = query.gte('price', debouncedPrice[0]).lte('price', debouncedPrice[1]);

        // Brand Filter (assuming brand_id or title contains the brand. Let's filter by brand name if we have a brands table, 
        // but for simplicity, if we don't know the schema perfectly, we'll try to match brand names via ilike or brand_id)
        // Since we don't know exact schema, let's assume 'brands' table isn't joined, we'll filter on JS side or skip if complex.
        // Actually we can do an ilike on title for brands if brand_id isn't resolved to string, but let's assume brand_id is just string or we can omit it for now if it breaks.
        // Let's implement brand filter via JS for safety since we don't know if brand_id is uuid.
        
        // Stock Filter
        if (debouncedInStock) {
           query = query.gt('stock', 0).or('stock_quantity.gt.0');
        }

        // Category Filter
        if (debouncedCategories.length > 0) {
           query = query.in('category_id', debouncedCategories);
        }

        const { data, error } = await query;

        if (error) throw error;

        let mappedProducts = (data || []).map(d => ({
            id: d.id,
            name: d.title || d.name,
            slug: d.slug,
            description: d.description,
            price: d.price,
            originalPrice: d.original_price,
            discount: d.discount,
            rating: d.rating,
            reviewCount: d.review_count,
            imageUrl: (Array.isArray(d.images) && d.images.length > 0) ? d.images[0] : (d.base_image_url || d.image_url),
            categoryId: d.category_id,
            brandId: d.brand_id,
            stock: d.stock_quantity || d.stock,
            createdAt: d.created_at
        })) as Product[];

        // JS side brand filter
        if (debouncedBrands.length > 0) {
           mappedProducts = mappedProducts.filter(p => 
              p.brandId && debouncedBrands.includes(p.brandId)
           );
        }

        setProducts(mappedProducts);
        useStorefrontStore.getState().setProducts(mappedProducts.map(p => ({
          id: String(p.id),
          title: p.name,
          price: p.price,
          image: p.imageUrl || '',
          slug: p.slug,
          categoryId: p.categoryId ? String(p.categoryId) : undefined,
          category_id: p.categoryId ? String(p.categoryId) : undefined,
          brandId: p.brandId ? String(p.brandId) : undefined,
          brand_id: p.brandId ? String(p.brandId) : undefined,
        })));
        setMatchCount(mappedProducts.length);
        
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 500);

      } catch (err) {
        console.error('Error fetching filtered products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredProducts();
  }, [debouncedPrice, debouncedBrands, debouncedCategories, debouncedInStock]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 500000]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setInStockOnly(false);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-[#050505] min-h-screen text-slate-900 dark:text-white pb-20">
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block sticky top-24 pr-4 border-r border-slate-200 dark:border-white/5 h-fit">
            <StorefrontFilterSidebar 
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Product Grid Area */}
          <div className="flex flex-col">
            
            {/* Top Bar matches */}
            <div className="hidden lg:flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
              <h1 className="text-3xl font-black uppercase tracking-wider">The Store</h1>
              <motion.div 
                animate={{ 
                  color: isFlashing ? '#4ade80' : '#64748b',
                  textShadow: isFlashing ? '0 0 10px rgba(74,222,128,0.5)' : 'none'
                }}
                className="text-sm font-mono tracking-widest uppercase flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${isFlashing ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                SYSTEM MATCH: {matchCount} HARDWARE UNITS FOUND
              </motion.div>
            </div>

            {/* Mobile Match Count */}
            <div className="lg:hidden mb-6 flex items-center justify-center">
               <motion.div 
                animate={{ 
                  color: isFlashing ? '#4ade80' : '#64748b',
                }}
                className="text-xs font-mono tracking-widest uppercase flex items-center gap-2"
              >
                SYSTEM MATCH: {matchCount} UNITS
              </motion.div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/5 h-[400px] p-4 flex flex-col animate-pulse">
                     <div className="h-48 bg-slate-200 dark:bg-white/5 mb-4 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                     </div>
                     <div className="h-4 w-1/3 bg-slate-200 dark:bg-white/5 mb-3" />
                     <div className="h-5 w-3/4 bg-slate-300 dark:bg-white/10 mb-auto" />
                     <div className="h-6 w-1/4 bg-slate-300 dark:bg-white/10 mb-4" />
                     <div className="h-10 w-full bg-slate-200 dark:bg-white/5" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5">
                <p className="text-slate-500 dark:text-gray-400 font-mono tracking-widest uppercase">No units match your parameters.</p>
                <button onClick={clearFilters} className="mt-4 text-[#E50914] font-bold hover:underline">RESET FILTERS</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Mobile Filter FAB */}
      <button 
        onClick={() => setIsMobileFiltersOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40 bg-[#E50914] text-white p-4 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.5)] flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* Swipe-Up Filter Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/80 backdrop-blur-sm lg:hidden"
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setIsMobileFiltersOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 w-full z-[70] h-[85vh] bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 rounded-t-3xl flex flex-col lg:hidden pb-safe"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center p-4 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full" />
              </div>
              
              <div className="px-6 pb-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                 <h2 className="text-xl font-black tracking-wider uppercase text-slate-900 dark:text-white">Filters & Sort</h2>
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <StorefrontFilterSidebar 
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedBrands={selectedBrands}
                  toggleBrand={toggleBrand}
                  selectedCategories={selectedCategories}
                  toggleCategory={toggleCategory}
                  inStockOnly={inStockOnly}
                  setInStockOnly={setInStockOnly}
                  clearFilters={clearFilters}
                />
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0A0C]">
                 <button
                   onClick={() => setIsMobileFiltersOpen(false)}
                   className="w-full bg-[#E50914] text-white font-black tracking-widest uppercase py-4 hover:bg-red-600 transition-colors rounded-none shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                 >
                   VIEW RESULTS ({matchCount})
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

