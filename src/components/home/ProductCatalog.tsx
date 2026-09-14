import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ProductCard } from '../shared/ProductCard';
import { Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { Link } from 'react-router-dom';

const TABS = ['New Arrivals', 'Featured', 'Best Sellers', 'Top Rated'];

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('New Arrivals');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');
        
        // Simulating different data for different tabs
        if (activeTab === 'New Arrivals') {
          query = query.order('created_at', { ascending: false });
        } else if (activeTab === 'Best Sellers') {
          query = query.order('rating', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const mappedProducts = (data || []).map(d => {
          let calculatedDiscount = d.discount;
          if (!calculatedDiscount && d.original_price && d.price < d.original_price) {
            calculatedDiscount = Math.round(((d.original_price - d.price) / d.original_price) * 100);
          }
          return {
            id: d.id,
            name: d.title || d.name,
            slug: d.slug,
            description: d.description,
            price: d.price,
            originalPrice: d.original_price,
            discount: calculatedDiscount,
            rating: d.rating,
            reviewCount: d.review_count,
            imageUrl: (Array.isArray(d.images) && d.images.length > 0) ? d.images[0] : (d.base_image_url || d.image_url),
            categoryId: d.category_id,
            brandId: d.brand_id,
            stock: d.stock_quantity || d.stock,
            createdAt: d.created_at
          };
        }) as Product[];
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [activeTab]);

  return (
    <section className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-white/10 mb-8 gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-4 text-sm transition-all border-b-2 relative top-[1px] ${
                activeTab === tab 
                  ? 'border-[#E50914] text-gray-900 dark:text-white font-bold' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* View All */}
        <button className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-2.5 rounded-full hover:border-gray-300 dark:hover:bg-white/10 transition-colors mb-2">
          View All
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#0a0a0c] rounded-xl border border-slate-200/60 dark:border-gray-900 p-4 shadow-sm flex flex-col h-full animate-pulse">
              {/* Image Skeleton */}
              <div className="h-48 mb-4 rounded-lg bg-gray-200 dark:bg-gray-800" />
              
              {/* Category / Brand Skeleton */}
              <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded mb-3" />

              {/* Title Skeleton */}
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded mb-4" />

              {/* Rating Skeleton */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                ))}
              </div>

              {/* Footer (Price & Button) */}
              <div className="mt-auto flex items-end justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-6">
          {products.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      <button className="w-full sm:hidden mt-8 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        View All
      </button>
    </section>
  );
}
