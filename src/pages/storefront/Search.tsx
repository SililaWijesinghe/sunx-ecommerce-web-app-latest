import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search as SearchIcon, ArrowLeft, Loader2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ProductCard } from '../../components/shared/ProductCard';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    async function searchProducts() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${debouncedQuery}%`)
          .limit(20);
        
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }
    searchProducts();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0B0E] pt-4 pb-20 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6 sticky top-4 z-20">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Search hardware, components..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-full py-3.5 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E50914] shadow-sm text-sm tap-target"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
          </div>
        ) : query && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
             <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">No Results Found</h3>
             <p className="text-gray-500 max-w-sm">We couldn't find any products matching "{query}". Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => {
              const p = {
                id: product.id,
                name: product.title,
                price: product.price,
                originalPrice: product.original_price,
                imageUrl: product.base_image_url || (product.images && product.images[0]) || '/placeholder.png',
                slug: product.slug,
                stock: product.stock_quantity ?? product.stock ?? 0,
                rating: product.rating || 0,
                reviewCount: product.review_count || 0
              };
              return (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <ProductCard product={p as any} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
