import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ProductCard } from './ProductCard';
import { Product } from '../../types';

export function RelatedProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
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
        console.error('Error fetching related products:', err);
      }
    }
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="w-full mt-12 border-t border-gray-100 dark:border-gray-900 pt-12">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
