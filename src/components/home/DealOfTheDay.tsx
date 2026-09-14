import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';

export function DealOfTheDay() {
  const [timeLeft, setTimeLeft] = useState({ hrs: 12, mins: 45, secs: 30 });
  const [deals, setDeals] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const addItem = useCartStore(state => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .not('original_price', 'is', null)
          .order('original_price', { ascending: false })
          .limit(10);
          
        if (data && data.length > 0) {
          setDeals(data.map(mapProduct));
        }
      } catch (err) {
        console.error('Error fetching deal of the day:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  const mapProduct = (d: any): Product => {
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
    };
  };

  useEffect(() => {
    if (deals.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        
        // Timer reached 0, cycle to next deal!
        setCurrentIndex(c => (c + 1) % deals.length);
        return { hrs: 24, mins: 0, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deals.length]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl bg-gradient-to-br from-[#1a0505] via-[#2a0808] to-[#0a0202] p-6 shadow-xl flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-400 font-mono text-sm">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (deals.length === 0) return null;
  
  const product = deals[currentIndex];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-[#050505] border border-white/5 text-white p-6 shadow-2xl flex flex-col transition-all duration-300 hover:shadow-[0_10px_30px_rgba(229,9,20,0.15)] group">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-red-600/20 transition-colors"></div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Deal of the Day</h2>
        {product.discount && (
          <span className="bg-[#E50914] text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-wider shadow-[0_0_10px_rgba(229,9,20,0.5)]">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mb-8 bg-white/5 py-3 rounded-lg border border-white/5">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black">{timeLeft.hrs.toString().padStart(2, '0')}</span>
          <span className="text-[9px] uppercase tracking-wider text-red-500 font-bold">Hrs</span>
        </div>
        <span className="text-gray-600 font-black text-2xl mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black">{timeLeft.mins.toString().padStart(2, '0')}</span>
          <span className="text-[9px] uppercase tracking-wider text-red-500 font-bold">Mins</span>
        </div>
        <span className="text-gray-600 font-black text-2xl mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black">{timeLeft.secs.toString().padStart(2, '0')}</span>
          <span className="text-[9px] uppercase tracking-wider text-red-500 font-bold">Secs</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
        <Link to={`/product/${product.id}`} className="hover:text-[#E50914] transition-colors mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-[#E50914] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className={`w-3 h-3 ${i <= (product.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-gray-400 text-[10px] ml-1">({product.reviewCount || 0})</span>
        </div>

        <Link to={`/product/${product.id}`} className="relative w-full aspect-video mb-4 flex items-center justify-center">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400"} 
            alt={product.name} 
            className="w-[90%] h-auto object-contain drop-shadow-2xl mix-blend-screen"
          />
        </Link>

        <div className="mt-auto">
          <div className="flex flex-col mb-4">
            <span className="text-2xl font-black text-white">Rs. {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm font-semibold text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1.5">
              <span>Sold: 45</span>
              <span>Available: {product.stock}</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#E50914] h-full w-[80%] rounded-full"></div>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className="w-full bg-[#E50914] hover:bg-red-700 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

