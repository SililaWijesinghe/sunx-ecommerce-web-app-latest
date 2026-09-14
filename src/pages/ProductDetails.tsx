import { RelatedProducts } from "../components/shared/RelatedProducts";
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCartStore } from '../store/useCartStore';
import { Product } from '../types';
import { 
  Loader2, ShoppingCart, Star, ArrowLeft, ChevronLeft, Heart, Share2,
  Play, RotateCcw, Box,
  ShieldCheck, Truck, RotateCw, CreditCard, Zap, Minus, Plus
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useMediaQuery } from 'usehooks-ts';

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [dbProduct, setDbProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const addItem = useCartStore((state) => state.addItem);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    async function fetchProduct() {
      if (!supabase) {
        setError('Supabase client is not initialized.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        let query = supabase.from('products').select('*');
        // Handle case where slug might be ID or slug string
        if (slug?.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
          query = query.eq('id', slug);
        } else {
          query = query.eq('slug', slug);
        }
        
        const { data, error: fetchError } = await query.single();
        
        if (fetchError) throw fetchError;
        setDbProduct(data);

        // Fetch variants if applicable
        if (data?.id) {
          const { data: variantsData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', data.id);
          
          if (variantsData && variantsData.length > 0) {
            setVariants(variantsData);
            setSelectedVariant(variantsData[0]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#E50914]" />
      </div>
    );
  }

  if (error || !dbProduct) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">Error Loading Product</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-8">{error || 'Product could not be found.'}</p>
        <Link to="/" className="flex items-center gap-2 text-[#E50914] font-bold hover:text-red-700 transition-colors uppercase tracking-wider text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>
    );
  }

  const images = Array.isArray(dbProduct.images) && dbProduct.images.length > 0 
    ? dbProduct.images 
    : (dbProduct.base_image_url ? [dbProduct.base_image_url] : ['/placeholder.png']);
    
  const displayImage = images[activeImageIndex] || images[0] || '/placeholder.png';
  
  let calculatedDiscount = dbProduct.discount;
  if (!calculatedDiscount && dbProduct.original_price && dbProduct.price < dbProduct.original_price) {
    calculatedDiscount = Math.round(((dbProduct.original_price - dbProduct.price) / dbProduct.original_price) * 100);
  }

  const mappedProduct: Product = {
    id: dbProduct.id,
    name: dbProduct.title || dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price,
    discount: calculatedDiscount,
    rating: dbProduct.rating || 0,
    reviewCount: dbProduct.review_count || 0,
    imageUrl: images[0] || displayImage || '/placeholder.png',
    categoryId: dbProduct.category_id,
    brandId: dbProduct.brand_id,
    stock: dbProduct.stock_quantity ?? dbProduct.stock ?? 0,
    createdAt: dbProduct.created_at
  };

  const handleAddToCart = () => {
    addItem(mappedProduct, quantity);
  };
  
  const handleBuyNow = () => {
    addItem(mappedProduct, quantity);
    navigate('/checkout');
  };

  const incrementQty = () => setQuantity(prev => (prev < mappedProduct.stock ? prev + 1 : prev));
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="bg-transparent min-h-screen pb-20 lg:pb-12">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-900 lg:hidden sticky top-0 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-md z-20">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2"><Heart className="w-5 h-5 text-gray-900 dark:text-gray-100" /></button>
          <button className="p-2"><Share2 className="w-5 h-5 text-gray-900 dark:text-gray-100" /></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:px-4 lg:py-8 lg:grid lg:grid-cols-2 lg:gap-12">
        {/* LEFT COLUMN: Images & Interactions */}
        <div className="flex flex-col mb-8 lg:mb-0">
          {/* Main Image Container */}
          {isMobile ? (
            <div className="w-full relative bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 pb-8">
              {calculatedDiscount > 0 && (
                <div className="absolute top-4 left-4 bg-[#E50914] text-white px-2 py-1 text-xs font-bold rounded-sm z-10">
                  -{calculatedDiscount}%
                </div>
              )}
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={0}
                slidesPerView={1}
                onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
                className="w-full aspect-square"
              >
                {images.map((img: string, idx: number) => (
                  <SwiperSlide key={idx} className="flex items-center justify-center p-6">
                    <img 
                      src={img} 
                      alt={mappedProduct.name} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                      }}
                      className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <>
              <div className="relative aspect-square w-full bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-gray-800 flex items-center justify-center lg:rounded-2xl shadow-sm dark:shadow-none overflow-hidden p-6 mb-4">
                {calculatedDiscount > 0 && (
                  <div className="absolute top-4 left-4 bg-[#E50914] text-white px-2 py-1 text-xs font-bold rounded-sm z-10">
                    -{calculatedDiscount}%
                  </div>
                )}
                
                <div className="absolute top-4 right-4 bg-gray-900/40 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 backdrop-blur-sm">
                  {activeImageIndex + 1}/{images.length}
                </div>

                <img 
                  src={displayImage} 
                  alt={mappedProduct.name} 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                  }}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
              
              {/* Thumbnails */}
              <div className="px-4 lg:px-0 flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md bg-gray-50 dark:bg-[#111111] border flex items-center justify-center p-1 transition-colors ${
                      activeImageIndex === idx ? 'border-[#E50914]' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumb ${idx}`} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                      }}
                      className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                    />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Interactions */}
          <div className="px-4 lg:px-0 flex gap-3 mt-4">
            <button className="flex-1 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-[#1a1a1c] transition-colors text-sm font-semibold">
              <Play className="w-4 h-4" /> Video
            </button>
            <button className="flex-1 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-[#1a1a1c] transition-colors text-sm font-semibold">
              <RotateCcw className="w-4 h-4" /> 360° View
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Info & Actions */}
        <div className="px-4 lg:px-0 flex flex-col">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
            {mappedProduct.name}
          </h1>
          
          {/* Rating */}
          {(mappedProduct.reviewCount ?? 0) > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(mappedProduct.rating || 5) ? 'fill-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">({mappedProduct.reviewCount} Reviews)</span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-end gap-3 border-b border-gray-100 dark:border-gray-900 pb-6 mb-6">
            <div className="text-3xl font-bold text-[#E50914] tracking-tight">
              Rs. {mappedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {mappedProduct.originalPrice && mappedProduct.originalPrice > mappedProduct.price && (
              <div className="text-sm font-medium text-gray-400 dark:text-gray-500 line-through mb-1.5">
                Rs. {mappedProduct.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mb-6">
             <div className={`text-sm font-semibold ${mappedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
               {mappedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
             </div>
          </div>

          {/* Highlights */}
          {dbProduct.specifications && Object.keys(dbProduct.specifications).length > 0 && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Highlights</h3>
              <ul className="space-y-3">
                {Object.entries(dbProduct.specifications).map(([key, value], idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Box className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      <strong>{key}:</strong> {String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Configuration / Variants */}
          {variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Select Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variants.map((variant) => (
                  <button 
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left flex justify-between items-center ${
                      selectedVariant?.id === variant.id 
                      ? 'border-[#E50914] bg-red-50 dark:bg-red-500/10 text-gray-900 dark:text-white' 
                      : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <span>{variant.name || (variant.options && variant.options.name) || `Variant ${variant.id.substring(0,4)}`}</span>
                    {selectedVariant?.id === variant.id && (
                      <div className="w-2 h-2 rounded-full bg-[#E50914]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Quantity</h3>
            <div className="flex items-center w-[120px] border border-gray-200 dark:border-gray-800 rounded-lg">
              <button onClick={decrementQty} className="p-3 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-gray-100 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {quantity}
              </div>
              <button onClick={incrementQty} className="p-3 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-gray-100 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-8 hidden md:block">
            <button 
              onClick={handleAddToCart}
              className="w-full bg-[#E50914] hover:bg-red-700 text-white py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 tap-target"
            >
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="w-full bg-white dark:bg-[#0a0a0c] dark:bg-[#111111] border border-gray-900 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:bg-[#111111] dark:hover:bg-[#1a1a1c] py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 tap-target"
            >
              <Zap className="w-5 h-5" /> Buy Now
            </button>
          </div>

          {/* Mobile Sticky Add to Cart */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] pb-safe">
              <button 
                onClick={handleAddToCart} 
                className="flex-[2] bg-[#E50914] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 tap-target"
              >
                <ShoppingCart className="w-5 h-5" /> Add
              </button>
              <button 
                onClick={handleBuyNow} 
                className="flex-[3] bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl tap-target"
              >
                Buy Now
              </button>
            </div>
          )}

          {/* Trust Signals Stack */}
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-900">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111111] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Free Delivery</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">For all orders over Rs. 10,000</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111111] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">1 Year Warranty</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Official warranty included</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111111] flex items-center justify-center shrink-0">
                <RotateCw className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">7 Days Easy Returns</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Change your mind? No problem.</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-[#111111] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Secure Payments</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">100% secure checkout</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
