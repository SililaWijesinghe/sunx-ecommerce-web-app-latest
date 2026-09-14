import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../types';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useMediaQuery } from 'usehooks-ts';

export function BestSellersHorizontal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch best selling products, using rating/created_at as a proxy for best sellers
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('rating', { ascending: false })
          .limit(4);

        if (error) throw error;
        
        const mappedProducts = (data || []).map(d => ({
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
        
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching best sellers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <section className="w-full my-8">
      <div className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/10 mb-8 gap-4 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">
          Best Sellers
        </h2>
        <button className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-2.5 rounded-full hover:border-gray-300 dark:hover:bg-white/10 transition-colors">
          View All
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-row items-center gap-4 bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-gray-900 rounded-lg p-3 animate-pulse">
              {/* Image Skeleton */}
              <div className="shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-md" />
              
              {/* Details Skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                  ))}
                </div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <Swiper
          spaceBetween={16}
          slidesPerView={1.2}
          className="w-full !pb-4"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <div className="flex flex-row items-center gap-4 bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/5 rounded-2xl p-4 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(255,255,255,0.03)] transition-all duration-300 group h-full">
                <Link to={`/product/${product.slug || product.id}`} className="shrink-0 w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.imageUrl || '/placeholder.png'} 
                    alt={product.name} 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                    }}
                    className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  />
                </Link>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <Link to={`/product/${product.slug || product.id}`}>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate hover:text-[#E50914] transition-colors mb-1">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'fill-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-1">({product.reviewCount || 0})</span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <div className="text-sm font-black text-[#E50914] tracking-tight">
                        Rs. {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {product.originalPrice && (
                        <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 line-through">
                          Rs. {product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addItem(product);
                      }}
                      className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#E50914] hover:text-white dark:hover:bg-[#E50914] dark:hover:text-white w-8 h-8 rounded-full transition-colors flex items-center justify-center shrink-0 tap-target"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product) => (
            <div key={product.id} className="flex flex-row items-center gap-4 bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-white/5 rounded-2xl p-4 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1 transition-all duration-300 group">
              <Link to={`/product/${product.slug || product.id}`} className="shrink-0 w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.imageUrl || '/placeholder.png'} 
                  alt={product.name} 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                  }}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal"
                />
              </Link>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <Link to={`/product/${product.slug || product.id}`}>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate hover:text-[#E50914] transition-colors mb-1">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'fill-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-1">({product.reviewCount || 0})</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <div className="text-sm font-black text-[#E50914] tracking-tight">
                      Rs. {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    {product.originalPrice && (
                      <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 line-through">
                        Rs. {product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(product);
                    }}
                    className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#E50914] hover:text-white dark:hover:bg-[#E50914] dark:hover:text-white w-8 h-8 rounded-full transition-colors flex items-center justify-center shrink-0"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
