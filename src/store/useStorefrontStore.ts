import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export interface StorefrontProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  categoryId?: string;
  category_id?: string;
  brandId?: string;
  brand_id?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  parent_id: string | null;
}

interface StorefrontState {
  wishlist: StorefrontProduct[];
  compareList: StorefrontProduct[];
  categories: Category[];
  brands: Brand[];
  products: StorefrontProduct[];
  allProducts: StorefrontProduct[];
  toggleWishlist: (product: StorefrontProduct) => void;
  addToCompare: (product: StorefrontProduct) => void;
  removeFromCompare: (id: string) => void;
  fetchCategories: () => Promise<void>;
  fetchBrands: () => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  setProducts: (products: StorefrontProduct[]) => void;
}

export const useStorefrontStore = create<StorefrontState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      compareList: [],
      categories: [],
      brands: [],
      products: [],
      allProducts: [],
      setProducts: (products) => set({ products }),
      toggleWishlist: (product) => {
        const { wishlist } = get();
        const exists = wishlist.some((item) => item.id === product.id);
        if (exists) {
          set({ wishlist: wishlist.filter((item) => item.id !== product.id) });
        } else {
          set({ wishlist: [...wishlist, product] });
        }
      },
      addToCompare: (product) => {
        const { compareList } = get();
        if (compareList.some((item) => item.id === product.id)) {
          return;
        }
        if (compareList.length >= 3) {
          toast.error('You can only compare up to 3 items at a time.');
          return;
        }
        set({ compareList: [...compareList, product] });
        toast.success('Added to compare');
      },
      removeFromCompare: (id) => {
        const { compareList } = get();
        set({ compareList: compareList.filter((item) => item.id !== id) });
      },
      fetchCategories: async () => {
        const { data, error } = await supabase.from('categories').select('id, name, slug, parent_id');
        if (data && !error) {
          set({ categories: data });
        }
      },
      fetchBrands: async () => {
        const { data, error } = await supabase.from('brands').select('id, name, slug');
        if (data && !error) {
          set({ brands: data });
        }
      },
      fetchAllProducts: async () => {
        // Only fetch valid columns for counting: id, category_id, brand_id, title, price, slug, images
        const { data, error } = await supabase
          .from('products')
          .select('id, category_id, brand_id, title, price, slug, images');
        if (error) {
          console.error('[useStorefrontStore] fetchAllProducts error:', error.message);
          return;
        }
        if (data) {
          set({
            allProducts: data.map(d => ({
              id: String(d.id),
              title: d.title || '',
              price: Number(d.price) || 0,
              image: (Array.isArray(d.images) && d.images.length > 0)
                ? d.images[0]
                : '',
              slug: d.slug || '',
              categoryId: d.category_id ? String(d.category_id) : undefined,
              category_id: d.category_id ? String(d.category_id) : undefined,
              brandId: d.brand_id ? String(d.brand_id) : undefined,
              brand_id: d.brand_id ? String(d.brand_id) : undefined,
            }))
          });
        }
      }
    }),
    {
      name: 'sunx-storefront',
      partialize: (state) => ({ wishlist: state.wishlist, compareList: state.compareList }),
    }
  )
);
