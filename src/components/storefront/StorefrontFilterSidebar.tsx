import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useStorefrontStore } from '../../store/useStorefrontStore';

interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  count: number;
  children: CategoryNode[];
}

interface FilterSidebarProps {
  priceRange: number[];
  setPriceRange: (val: number[]) => void;
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  selectedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  clearFilters: () => void;
}


export function StorefrontFilterSidebar({
  priceRange,
  setPriceRange,
  selectedBrands,
  toggleBrand,
  inStockOnly,
  setInStockOnly,
  selectedCategories,
  toggleCategory,
  clearFilters
}: FilterSidebarProps) {
  const { categories, allProducts, products: storeProducts, brands, fetchCategories, fetchBrands, fetchAllProducts } = useStorefrontStore();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Ensure total products array from useStorefrontStore is retrieved
  const products = (allProducts && allProducts.length > 0) ? allProducts : (storeProducts || []);

  // Temporary console.log to verify data reaches the sidebar
  console.log('Total Products Loaded:', products.length);

  // Always re-fetch the master catalog on mount so counts are never stale
  useEffect(() => {
    fetchAllProducts();
    if (categories.length === 0) fetchCategories();
    if (brands.length === 0) fetchBrands();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryTree = useMemo(() => {
    // Count against the full master catalog — completely ignoring stock_quantity
    const getCount = (catId: string): number => {
      // Fallback to return 0 only if products.length === 0
      if (!products || products.length === 0) {
        return 0;
      }

      // Fix any UUID comparison issues: strictly evaluating matching string types
      const targetCatId = String(catId).trim().toLowerCase();

      // Absolute total: count all products where product.category_id matches category.id
      let count = products.filter(product => {
        const prodCatId = product.category_id ?? product.categoryId;
        if (!prodCatId) return false;
        return String(prodCatId).trim().toLowerCase() === targetCatId;
      }).length;

      // Add subcategories belonging to this category
      const children = categories.filter(c => {
        if (!c.parent_id) return false;
        return String(c.parent_id).trim().toLowerCase() === targetCatId;
      });

      children.forEach(child => {
        count += getCount(child.id);
      });

      return count;
    };

    const nodes: Map<string, CategoryNode> = new Map();
    categories.forEach(item => {
      const normalizedId = String(item.id).trim().toLowerCase();
      nodes.set(normalizedId, {
        id: String(item.id),
        name: item.name,
        parent_id: item.parent_id ? String(item.parent_id).trim().toLowerCase() : null,
        count: getCount(item.id),
        children: []
      });
    });

    const rootNodes: CategoryNode[] = [];
    Array.from(nodes.values()).forEach(node => {
      if (node.parent_id && nodes.has(node.parent_id)) {
        nodes.get(node.parent_id)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });
    
    // Sort alphabetically
    const sortNodes = (ns: CategoryNode[]) => {
      ns.sort((a, b) => a.name.localeCompare(b.name));
      ns.forEach(n => sortNodes(n.children));
    };
    sortNodes(rootNodes);
    
    return rootNodes;
  }, [categories, products]);

  const renderCategory = (node: CategoryNode, depth = 0) => {
    const isExpanded = !!expandedCats[node.id];
    const isSelected = selectedCategories.includes(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`flex items-center justify-between py-1.5 cursor-pointer group rounded-lg px-2 -mx-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${depth > 0 ? 'ml-6' : ''}`}
          onClick={() => hasChildren ? setExpandedCats(prev => ({...prev, [node.id]: !prev[node.id]})) : toggleCategory(node.id)}
        >
          <div className="flex items-center gap-3">
            {!hasChildren && (
              <div className={`w-4 h-4 flex-shrink-0 flex items-center justify-center border transition-all ${isSelected ? 'bg-[#E50914] border-[#E50914]' : 'bg-white dark:bg-transparent border-slate-300 dark:border-white/20 group-hover:border-[#E50914] dark:group-hover:border-[#E50914]'}`}>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <span className={`text-sm transition-colors ${isSelected ? 'text-[#E50914] font-bold' : 'text-slate-800 font-medium dark:text-gray-200 group-hover:text-[#E50914] dark:group-hover:text-white'}`}>
              {node.name} <span className="text-slate-400 dark:text-gray-500 text-xs ml-1 font-mono tracking-wider">({node.count})</span>
            </span>
          </div>
          {hasChildren && (
            <div className="text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-2">
                {node.children.map(child => renderCategory(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Filters</h2>
         <button onClick={clearFilters} className="text-xs text-slate-400 dark:text-gray-500 hover:text-[#E50914] dark:hover:text-white transition-colors font-mono">CLEAR ALL</button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-2">Categories</h3>
        <div className="flex flex-col space-y-1">
          {categoryTree.map(node => renderCategory(node))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-2">Price Range</h3>
        <div className="pt-2">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={priceRange}
            max={500000}
            step={1000}
            onValueChange={setPriceRange}
          >
            <Slider.Track className="bg-slate-200 dark:bg-white/10 relative grow rounded-none h-1">
              <Slider.Range className="absolute bg-[#E50914] rounded-none h-full drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-white border-2 border-[#E50914] rounded-none hover:bg-gray-100 focus:outline-none shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-transform hover:scale-110"
              aria-label="Min Price"
            />
            <Slider.Thumb
              className="block w-4 h-4 bg-white border-2 border-[#E50914] rounded-none hover:bg-gray-100 focus:outline-none shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-transform hover:scale-110"
              aria-label="Max Price"
            />
          </Slider.Root>
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-gray-400 mt-4">
            <span>Rs. {priceRange[0].toLocaleString()}</span>
            <span>Rs. {priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Brands Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-2">Brands</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-2">
          {brands.map(brand => {
            const isSelected = selectedBrands.includes(brand.id);
            return (
              <label key={brand.id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => {
                e.preventDefault();
                toggleBrand(brand.id);
              }}>
                <div className={`w-4 h-4 flex items-center justify-center border transition-all ${isSelected ? 'bg-[#E50914] border-[#E50914]' : 'bg-white dark:bg-transparent border-slate-300 dark:border-white/20 group-hover:border-[#E50914] dark:group-hover:border-[#E50914]'}`}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`text-sm transition-colors ${isSelected ? 'text-[#E50914] dark:text-white font-bold' : 'text-slate-800 font-medium dark:text-gray-300 group-hover:text-[#E50914] dark:group-hover:text-white'}`}>{brand.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Stock Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-gray-300 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 pb-2">Availability</h3>
        <div className="pt-2">
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-full py-3 px-4 text-sm font-bold tracking-wide uppercase transition-all border ${
              inStockOnly 
                ? 'border-green-400 text-green-400 bg-green-400/10 shadow-[0_0_15px_rgba(74,222,128,0.15)]' 
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 bg-slate-50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {inStockOnly ? '✓ In Stock Only' : 'In Stock Only'}
          </button>
        </div>
      </div>
    </div>
  );
}
