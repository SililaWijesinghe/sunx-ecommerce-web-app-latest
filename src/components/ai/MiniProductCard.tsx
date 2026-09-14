import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Product } from '../../types';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface MiniProductCardProps {
  key?: React.Key;
  sku: string;
}

export function MiniProductCard({ sku }: MiniProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    async function fetchProduct() {
      const cleanSku = sku.replace('SNX-', '');
      // Try to find the product by ID or title
      let query = supabase.from('products').select('*').or(`id.ilike.%${cleanSku}%,title.ilike.%${cleanSku}%`).limit(1);
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        setProduct(data[0]);
      }
    }
    fetchProduct();
  }, [sku]);

  if (!product) return null;

  const mappedProduct: Product = {
    id: product.id,
    name: product.title || product.name,
    price: product.price,
    imageUrl: (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ? product.images[0] : (product.base_image_url || product.image_url || '/placeholder.png'),
    slug: product.slug,
    description: '',
    categoryId: '',
    brandId: '',
    stock: 10,
    createdAt: new Date().toISOString()
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-[#0A0A0C] border border-white/10 p-3 rounded-none my-3 max-w-[95%] shadow-lg shadow-black/50 overflow-hidden"
    >
      <Link to={`/product/${product.slug}`} className="w-16 h-16 bg-white/5 border border-white/5 shrink-0 flex items-center justify-center p-1 relative group overflow-hidden">
        <img 
          src={mappedProduct.imageUrl || '/placeholder.png'} 
          alt={mappedProduct.name} 
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
          }}
          className="w-full h-full object-contain mix-blend-normal group-hover:scale-110 transition-transform" 
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product.slug}`}>
          <h4 className="text-xs font-bold text-white line-clamp-2 hover:text-[#E50914] transition-colors leading-snug">{mappedProduct.name}</h4>
        </Link>
        <p className="text-xs text-green-400 font-mono font-bold mt-1">Rs. {mappedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>

      <button
        onClick={() => addItem(mappedProduct)}
        className="w-10 h-10 shrink-0 bg-[#E50914] text-white flex items-center justify-center hover:bg-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all rounded-none border border-[#E50914]"
      >
        <ShoppingCart className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
