import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types';
import { ProductCard } from '../shared/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useMediaQuery } from 'usehooks-ts';

export function TopDeals() {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    async function fetchTopDeals() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .not('original_price', 'is', null)
          .order('original_price', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        if (data) {
          const mappedDeals = data.map(d => {
            let calculatedDiscount = d.discount_percent || d.discount;
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
              rating: d.rating || 0,
              reviewCount: d.review_count || 0,
              imageUrl: (Array.isArray(d.images) && d.images.length > 0) ? d.images[0] : (d.base_image_url || d.image_url),
              categoryId: d.category_id,
              brandId: d.brand_id,
              stock: d.stock_quantity || d.stock || 10,
              createdAt: d.created_at
            } as Product;
          });
          setDeals(mappedDeals);
        }
      } catch (err) {
        console.error('Error fetching top deals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopDeals();
  }, []);

  const itemsPerPage = 2;
  const totalPages = Math.ceil(deals.length / itemsPerPage);

  const nextPage = () => setPage(p => (p + 1) % totalPages);
  const prevPage = () => setPage(p => (p - 1 + totalPages) % totalPages);

  const visibleDeals = deals.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col bg-white dark:bg-[#0a0a0c] p-6 rounded-2xl border border-slate-200/90 dark:border-gray-900 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] dark:shadow-neu-dark flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-400 font-mono text-sm">Loading top deals...</p>
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return null; // hide if no deals
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] p-6 rounded-2xl border border-white/5 shadow-2xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.03)] transition-all duration-300 relative group overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-black text-white tracking-tight uppercase italic">Top Deals</h2>
        <div className="flex gap-2 hidden md:flex">
          <button onClick={prevPage} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#E50914] hover:border-[#E50914] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextPage} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#E50914] hover:border-[#E50914] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isMobile ? (
        <div className="flex-1 relative z-10 overflow-hidden w-full">
          <Swiper
            spaceBetween={16}
            slidesPerView={1.2}
            className="w-full !pb-4"
          >
            {deals.map((deal) => (
              <SwiperSlide key={deal.id}>
                <div className="h-full">
                  <ProductCard product={deal} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 overflow-hidden">
          {visibleDeals.map((deal) => (
            <div key={deal.id} className="h-full">
              <ProductCard product={deal} />
            </div>
          ))}
        </div>
      )}
      
      
      <button 
        onClick={() => navigate('/shop')}
        className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:border-white/20 relative z-10"
      >
        View All Deals
      </button>
    </div>
  );
}
