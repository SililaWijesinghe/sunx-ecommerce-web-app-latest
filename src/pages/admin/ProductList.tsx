import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Trash2, Plus, Edit, Copy, MoreVertical, Search, PackageSearch, DollarSign, AlertTriangle, Layers, Tag, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ProductQuickViewModal } from '../../components/admin/ProductQuickViewModal';

interface DbProduct {
  id: string;
  title?: string;
  name?: string;
  sku?: string;
  price: number;
  stock_quantity?: number;
  stock?: number;
  category_id?: string;
  brand_id?: string;
  images?: string[];
  base_image_url?: string;
  created_at: string;
  categories?: { name: string } | null;
  brands?: { name: string } | null;
  specifications?: any;
  discount_percent?: number;
  original_price?: number;
  promo_badge?: string;
}

const DUMMY_CHART_DATA = [
  { value: 200 }, { value: 300 }, { value: 250 }, { value: 400 }, 
  { value: 350 }, { value: 500 }, { value: 600 }
];

export function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, categories(name), brands(name)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  
  const handleDuplicate = async (product: DbProduct) => {
    try {
      const { id, created_at, updated_at, ...productData } = product as any;
      const newTitle = `${product.title || product.name || 'Untitled'} (Copy)`;
      
      const newProduct = {
        ...productData,
        title: productData.title ? newTitle : undefined,
        name: productData.name ? newTitle : undefined,
        sku: productData.sku ? `${productData.sku}-COPY` : undefined
      };

      // clean undefined values
      Object.keys(newProduct).forEach(key => {
        if (newProduct[key] === undefined) {
          delete newProduct[key];
        }
      });

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setProducts([data, ...products]);
        toast.success('Product duplicated successfully');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to duplicate product');
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = products.filter(p => 
        (p.title?.toLowerCase() || '').includes(q) || 
        (p.name?.toLowerCase() || '').includes(q)
      );
    }
    return result;
  }, [products, searchQuery]);

  // Reset to first page if search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getImageUrl = (product: DbProduct) => {
    if (product.images && product.images.length > 0 && product.images[0]) return product.images[0];
    if (product.base_image_url) return product.base_image_url;
    return '/placeholder.png';
  };

  const getStock = (product: DbProduct) => {
    return product.stock_quantity ?? product.stock ?? 0;
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-500/20">Out of Stock</span>;
    }
    if (stock <= 20) {
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">Low Stock ({stock})</span>;
    }
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">In Stock ({stock})</span>;
  };

  // Analytics Calculations
  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price * getStock(p)), 0);
  }, [products]);

  
  const chartData = useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
      ];
    }

    const sorted = [...products].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let cumulativeValue = 0;
    const dataPoints = [];
    
    sorted.forEach(p => {
      const stock = p.stock_quantity ?? p.stock ?? 0;
      cumulativeValue += (p.price || 0) * stock;
      dataPoints.push({
         name: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
         value: cumulativeValue
      });
    });

    if (dataPoints.length === 1) {
      return [{ name: 'Start', value: 0 }, dataPoints[0]];
    }

    if (dataPoints.length > 14) {
      const step = Math.ceil(dataPoints.length / 14);
      return dataPoints.filter((_, i) => i % step === 0 || i === dataPoints.length - 1);
    }
    
    return dataPoints;
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => getStock(p) <= 20).length;
  }, [products]);

  const activeListings = products.length;

  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.categories?.name || p.category_id || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'N/A';
  }, [products]);

  return (
    <div className="space-y-8 pb-12">
      {/* Task 1: The 'Story-First' Analytics Header */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="col-span-2 md:col-span-1 bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-shadow duration-500"
        >
          <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Total Inventory</span>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-emerald-400 transition-colors duration-500">
              $${totalInventoryValue.toLocaleString()}
            </p>
          </div>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Low Stock Warning</span>
            <AlertTriangle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-[#E50914] animate-pulse' : 'text-slate-600'}`} />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {lowStockCount} <span className="text-sm font-medium text-slate-500">items &le; 20</span>
          </p>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Active Listings</span>
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {activeListings}
          </p>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Top Category</span>
            <Tag className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white truncate" title={topCategory}>
            {topCategory}
          </p>
        </motion.div>
      </motion.div>

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage inventory and product catalog.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-sm dark:text-white transition-all shadow-sm"
            />
          </div>
          <Link
            to="/admin/add-product"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E50914] hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-red-900/20 transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#0B0F19] rounded-2xl p-12 flex flex-col items-center justify-center border border-gray-100 dark:border-white/5 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#111827] rounded-full flex items-center justify-center mb-4">
            <PackageSearch className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Products Found</h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchQuery ? "No products match your search." : "Start building your catalog by adding a new product."}
          </p>
        </div>
      ) : (
        <>
        {/* Desktop Table */}
        <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-100 dark:border-white/5 text-xs uppercase tracking-widest text-gray-500 font-bold">
                  <th className="p-4 pl-6 font-bold w-20">Image</th>
                  <th className="p-4 font-bold">Title</th>
                  <th className="p-4 font-bold">Price</th>
                  <th className="p-4 font-bold">Stock Level</th>
                  <th className="p-4 pr-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {currentItems.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ delay: deletingId === product.id ? 0 : Math.min(index, 10) * 0.05, duration: 0.2 }}
                      className="group border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors relative"
                    >
                      {deletingId === product.id ? (
                        <td colSpan={5} className="p-0">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-10 flex items-center justify-end gap-4 bg-red-900/90 backdrop-blur-md px-6 rounded-lg"
                          >
                            <span className="text-white font-bold tracking-widest text-sm uppercase">Are you sure?</span>
                            <button 
                              onClick={() => confirmDelete(product.id)}
                              className="px-4 py-1.5 bg-white text-red-900 font-black uppercase text-xs tracking-widest rounded-md hover:bg-red-100 transition-colors"
                            >
                              Yes, Delete
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)}
                              className="px-4 py-1.5 bg-black/50 text-white font-bold uppercase text-xs tracking-widest rounded-md hover:bg-black/70 transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </motion.div>
                        </td>
                      ) : (
                        <>
                          <td className="p-4 pl-6">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/5">
                              <img
                                src={getImageUrl(product)}
                                alt={product.title || product.name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900 dark:text-white line-clamp-2 max-w-xs">
                              {product.title || product.name || 'Untitled'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest truncate max-w-xs">
                              ID: {product.id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                              $${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="p-4">
                            {getStockBadge(getStock(product))}
                          </td>
                          <td className="p-4 pr-6 text-right align-middle">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
                                title="Quick View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/add-product?edit=${product.id}`)}
                                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(product)}
                                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingId(product.id)}
                                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="group-hover:hidden text-gray-400 dark:text-slate-600 px-2 inline-block">
                              <MoreVertical className="w-5 h-5" />
                            </div>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Product Cards */}
        <div className="md:hidden block">
          <AnimatePresence>
            {currentItems.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: deletingId === product.id ? 0 : Math.min(index, 10) * 0.05, duration: 0.2 }}
                className="bg-[#121215] border border-white/10 rounded-none p-4 mb-4 flex flex-col gap-3 relative"
              >
                {deletingId === product.id ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-red-900/95 backdrop-blur-md px-6 p-4">
                    <span className="text-white font-bold tracking-widest text-sm uppercase text-center">Delete product?</span>
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="flex-1 py-2 bg-black/50 text-white font-bold uppercase text-xs tracking-widest rounded-none hover:bg-black/70 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => confirmDelete(product.id)}
                        className="flex-1 py-2 bg-white text-red-900 font-black uppercase text-xs tracking-widest rounded-none hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Top: Image & Title */}
                    <div className="flex gap-4">
                      <div className="w-16 h-16 shrink-0 rounded-none overflow-hidden bg-black/50 border border-white/5">
                        <img
                          src={getImageUrl(product)}
                          alt={product.title || product.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <h4 className="font-bold text-white line-clamp-2 text-sm leading-snug">
                          {product.title || product.name || 'Untitled'}
                        </h4>
                        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest truncate">
                          ID: {product.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Middle: Price & Stock */}
                    <div className="flex items-center justify-between mt-1 px-1">
                      <div className="font-black text-white text-lg tracking-tight">
                        ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div>
                        {getStockBadge(getStock(product))}
                      </div>
                    </div>

                    {/* Bottom: Actions */}
                    <div className="flex justify-between mt-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">View</span>
                      </button>
                      <div className="w-px bg-white/5 mx-2" />
                      <button
                        onClick={() => navigate(`/admin/add-product?edit=${product.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">Edit</span>
                      </button>
                      <div className="w-px bg-white/5 mx-2" />
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-emerald-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">Copy</span>
                      </button>
                      <div className="w-px bg-white/5 mx-2" />
                      <button
                        onClick={() => setDeletingId(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">Del</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-6 mt-6">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                  // Only show a few pages around the current page to avoid clutter
                  if (num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1)) {
                    return (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                          currentPage === num 
                            ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/20' 
                            : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  }
                  if (num === currentPage - 2 || num === currentPage + 2) {
                    return <span key={num} className="text-gray-400 dark:text-slate-600 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
