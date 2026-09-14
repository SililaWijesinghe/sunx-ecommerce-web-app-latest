import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Trophy, TrendingUp, DollarSign, Package, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

const COLORS = ['#E50914', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

export function CatalogAnalytics() {
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [brandStats, setBrandStats] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalValue: 0, totalProducts: 0, totalRevenue: 0 });
  const [activeTab, setActiveTab] = useState('categories');
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        
        // 1. Fetch Categories, Brands, and Products
        const [catRes, brandRes, prodRes] = await Promise.all([
          supabase.from('categories').select('id, name'),
          supabase.from('brands').select('id, name'),
          supabase.from('products').select('id, title, price, stock_quantity, stock, category_id, brand_id')
        ]);

        const categories = catRes.data || [];
        const brands = brandRes.data || [];
        const products = prodRes.data || [];

        let gTotalValue = 0;
        let gTotalRevenue = 0;

        // 2. Aggregate Category Stats
        const cStats = categories.map(cat => {
          const catProducts = products.filter(p => p.category_id === cat.id);
          let inStock = 0;
          let outOfStock = 0;
          let totalValue = 0;
          let totalSales = 0;

          catProducts.forEach(p => {
            const stock = p.stock_quantity ?? p.stock ?? 0;
            const price = Number(p.price) || 0;
            
            if (stock > 0) inStock++; else outOfStock++;
            totalValue += (price * stock);
            
            // Mocking sales data realistically based on price (lower price = higher volume)
            const simulatedSold = Math.floor(Math.random() * (price > 100000 ? 50 : 200));
            const revenue = price * simulatedSold;
            totalSales += revenue;
          });

          gTotalValue += totalValue;
          gTotalRevenue += totalSales;

          return {
            id: cat.id,
            name: cat.name,
            productCount: catProducts.length,
            inStock,
            outOfStock,
            totalValue,
            totalSales
          };
        }).sort((a, b) => b.totalSales - a.totalSales);

        // 3. Aggregate Brand Stats
        const bStats = brands.map(brand => {
          const brandProducts = products.filter(p => p.brand_id === brand.id);
          let inStock = 0;
          let outOfStock = 0;
          let totalValue = 0;
          let totalSales = 0;

          brandProducts.forEach(p => {
            const stock = p.stock_quantity ?? p.stock ?? 0;
            const price = Number(p.price) || 0;
            
            if (stock > 0) inStock++; else outOfStock++;
            totalValue += (price * stock);
            
            // Mocking sales identically for consistency
            const simulatedSold = Math.floor(Math.random() * (price > 100000 ? 50 : 200));
            totalSales += (price * simulatedSold);
          });

          return {
            id: brand.id,
            name: brand.name,
            productCount: brandProducts.length,
            inStock,
            outOfStock,
            totalValue,
            totalSales
          };
        }).sort((a, b) => b.totalValue - a.totalValue);

        setCategoryStats(cStats);
        setBrandStats(bStats);
        setGlobalStats({
          totalValue: gTotalValue,
          totalProducts: products.length,
          totalRevenue: gTotalRevenue
        });

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const topCategory = categoryStats[0] || null;
  const topBrand = brandStats[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 dark:text-white">Catalog Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep dive into category and brand performance metrics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-[#E50914]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Top Category (Sales)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{topCategory ? topCategory.name : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Top Brand (Value)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{topBrand ? topBrand.name : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Products</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{globalStats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Inventory Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">Rs. {(globalStats.totalValue / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Bar Chart */}
        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-sm h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-6">Revenue by Category (Mocked)</h3>
          {loading ? (
             <div className="h-full flex items-center justify-center text-gray-400"><TrendingUp className="w-8 h-8 animate-pulse" /></div>
          ) : (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={categoryStats.slice(0, 5)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#333' : '#eee'} vertical={false} />
                 <XAxis dataKey="name" stroke={isDarkMode ? '#888' : '#666'} fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke={isDarkMode ? '#888' : '#666'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${(val/1000000).toFixed(1)}M`} />
                 <RechartsTooltip 
                   cursor={{ fill: isDarkMode ? '#1a1a1c' : '#f8f9fa' }} 
                   contentStyle={{ backgroundColor: isDarkMode ? '#111' : '#fff', borderColor: isDarkMode ? '#333' : '#eee', borderRadius: '8px' }} 
                   formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                 />
                 <Bar dataKey="totalSales" fill="#E50914" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          )}
        </div>

        {/* Brand Product Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-sm h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-6">Product Distribution by Brand</h3>
          {loading ? (
             <div className="h-full flex items-center justify-center text-gray-400"><Package className="w-8 h-8 animate-pulse" /></div>
          ) : (
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={brandStats.slice(0, 6)}
                   cx="50%"
                   cy="50%"
                   innerRadius={80}
                   outerRadius={120}
                   paddingAngle={5}
                   dataKey="productCount"
                   stroke="none"
                 >
                   {brandStats.slice(0, 6).map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: isDarkMode ? '#111' : '#fff', borderColor: isDarkMode ? '#333' : '#eee', borderRadius: '8px' }} 
                   formatter={(value: number) => [value, 'Products']}
                 />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabs & Data Tables */}
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'categories' ? 'border-[#E50914] text-[#E50914]' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
          >
            Category Performance
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'brands' ? 'border-[#E50914] text-[#E50914]' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
          >
            Brand Performance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400 text-right">Products</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400 text-right">In Stock</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400 text-right">Out of Stock</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400 text-right">Inventory Value</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400 text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
              ) : (
                <AnimatePresence mode="wait">
                  {(activeTab === 'categories' ? categoryStats : brandStats).map((item, idx) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activeTab === 'brands' ? (
                            <div className="w-10 h-10 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                              <img 
                                src={`https://logo.clearbit.com/${item.name.toLowerCase().replace(/\s+/g, '')}.com`}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.classList.add('fallback-icon');
                                }}
                              />
                              <ImageIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 hidden group-[.fallback-icon]:block" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0 text-gray-400 font-bold uppercase">
                              {item.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-300">{item.productCount}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {item.inStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.outOfStock > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {item.outOfStock}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-gray-300">
                        Rs. {item.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#E50914]">
                        Rs. {item.totalSales.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
