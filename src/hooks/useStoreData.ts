import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product, Category, Brand } from '../types';

export function useStoreData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        setError('Supabase client is not initialized.');
        return;
      }

      try {
        setLoading(true);

        const [catRes, dealsRes, brandsRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('products').select('*').eq('is_deal_of_day', true).limit(5),
          supabase.from('brands').select('*').limit(10)
        ]);

        if (catRes.error) throw catRes.error;
        if (dealsRes.error) console.error("Error fetching deals:", dealsRes.error);
        if (brandsRes.error) console.error("Error fetching brands:", brandsRes.error);

        const fetchedCategories = (catRes.data || []) as any[];
        const fetchedDeals = (dealsRes.data || []) as any[];
        const fetchedBrands = (brandsRes.data || []) as any[];

        // Map data from DB
        const mappedCategories = fetchedCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          iconName: c.icon_name,
          createdAt: c.created_at
        })) as Category[];

        const mappedDeals = fetchedDeals.map((d) => {
          // Calculate a rough discount percentage if original_price exists
          let calculatedDiscount = d.discount;
          if (!calculatedDiscount && d.original_price && d.price < d.original_price) {
            calculatedDiscount = Math.round(((d.original_price - d.price) / d.original_price) * 100);
          }

          return {
            id: d.id,
            name: d.title || d.name, // Support 'title' from actual DB
            slug: d.slug,
            description: d.description,
            basePrice: d.price, 
            price: d.price, 
            originalPrice: d.original_price,
            discount: calculatedDiscount,
            rating: d.rating,
            reviewCount: d.review_count,
            // Fallback to array if it's an array, otherwise try direct URL
            imageUrl: (Array.isArray(d.images) && d.images.length > 0) ? d.images[0] : (d.base_image_url || d.image_url),
            baseImageUrl: (Array.isArray(d.images) && d.images.length > 0) ? d.images[0] : (d.base_image_url || d.image_url),
            categoryId: d.category_id,
            brandId: d.brand_id,
            stock: d.stock_quantity || d.stock,
            createdAt: d.created_at
          };
        }) as Product[];

        const mappedBrands = fetchedBrands.map((b) => ({
          id: b.id,
          name: b.name,
          logoUrl: b.logo_url,
          createdAt: b.created_at
        })) as Brand[];

        setCategories(mappedCategories);
        setDeals(mappedDeals);
        setBrands(mappedBrands);

      } catch (err: any) {
        console.error('Error fetching store data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { categories, deals, brands, loading, error };
}
