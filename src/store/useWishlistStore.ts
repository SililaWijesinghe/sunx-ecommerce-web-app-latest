import { create } from 'zustand';
import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  fetchUserWishlist: () => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  toggleWishlist: async (product: Product) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const exists = get().items.some((item) => item.id === product.id);

    if (exists) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .match({ user_id: session.user.id, product_id: product.id });

      if (!error) {
        set((state) => ({
          items: state.items.filter((item) => item.id !== product.id),
        }));
      } else {
        console.error('Error removing from wishlist:', error);
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: session.user.id, product_id: product.id });

      if (!error) {
        set((state) => ({
          items: [...state.items, product],
        }));
      } else {
        console.error('Error adding to wishlist:', error);
      }
    }
  },
  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.id === productId);
  },
  fetchUserWishlist: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ items: [] });
      return;
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('*, products(*)')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching wishlist:', error);
      return;
    }

    if (data) {
      const mappedProducts = data
        .filter((d: any) => d.products) // Ensure product exists
        .map((d: any) => {
          const p = d.products;
          let calculatedDiscount = p.discount;
          if (!calculatedDiscount && p.original_price && p.price < p.original_price) {
            calculatedDiscount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
          }
          return {
            id: p.id,
            name: p.title || p.name,
            slug: p.slug,
            description: p.description,
            basePrice: p.price,
            price: p.price,
            originalPrice: p.original_price,
            discount: calculatedDiscount,
            rating: p.rating,
            reviewCount: p.review_count,
            imageUrl: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.base_image_url || p.image_url),
            baseImageUrl: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.base_image_url || p.image_url),
            categoryId: p.category_id,
            brandId: p.brand_id,
            stock: p.stock_quantity || p.stock,
            createdAt: p.created_at
          };
        }) as Product[];
      
      set({ items: mappedProducts });
    }
  },
  clearWishlist: () => set({ items: [] }),
}));
