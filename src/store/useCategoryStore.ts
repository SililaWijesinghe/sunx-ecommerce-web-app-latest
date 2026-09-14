import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  parent_id: string | null;
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  fetchCategories: async () => {
    // Prevent refetching if we already have categories
    if (get().categories.length > 0) return;
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon_name, parent_id')
        .order('name');
      
      if (error) throw error;
      
      set({ categories: data || [], isLoading: false });
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      set({ error: err.message, isLoading: false });
    }
  },
}));
