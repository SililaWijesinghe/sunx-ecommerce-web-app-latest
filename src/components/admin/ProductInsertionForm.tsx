import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { Check, Plus, Trash2, X, Tag, Box, Star, AlertCircle, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

interface Spec {
  id: string;
  key: string;
  value: string;
}

export function ProductInsertionForm() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      setIsEditing(true);
      fetchProduct(editId);
    }
  }, [editId]);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const orderedCategories = useMemo(() => {
    const mainCats = categories.filter(c => !c.parent_id);
    const result: any[] = [];
    mainCats.forEach(main => {
      result.push({ ...main, level: 0 });
      const subs = categories.filter(c => c.parent_id === main.id);
      subs.forEach(sub => {
        result.push({ ...sub, level: 1 });
      });
    });
    const addedIds = new Set(result.map(c => c.id));
    categories.forEach(c => {
      if (!addedIds.has(c.id)) {
        result.push({ ...c, level: c.parent_id ? 1 : 0 });
      }
    });
    return result;
  }, [categories]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      const [catsRes, brandsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('brands').select('*')
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    };
    fetchDropdowns();
  }, []);

  const fetchProduct = async (id: string) => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setTitle(data.name || data.title || '');
        setBrandId(data.brand_id || '');
        setSku(data.sku || '');
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setUploadMode('url');
          setImageUrls(data.images);
        } else if (data.base_image_url || data.image_url) {
          setUploadMode('url');
          setImageUrls([data.base_image_url || data.image_url].filter(Boolean));
        }
        setBasePrice(data.price?.toString() || data.original_price?.toString() || '');
        setDiscountPercent(data.discount?.toString() || data.discount_percent?.toString() || '');
        setPromoBadge(data.promo_badge || '');
        setCategoryId(data.category_id || '');
        setStockQuantity(data.stock_quantity?.toString() || data.stock?.toString() || '');
        setDescription(data.description || '');
        if (data.specifications) {
           const parsedSpecs = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications;
           if (typeof parsedSpecs === 'object' && !Array.isArray(parsedSpecs) && parsedSpecs !== null) {
             setSpecs(Object.entries(parsedSpecs).map(([k, v], i) => ({ id: i.toString(), key: k, value: String(v) })));
           }
        }
      }
    } catch (err: any) {
      toast.error('Failed to load product details');
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const [title, setTitle] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  
  const [basePrice, setBasePrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  
  const [specs, setSpecs] = useState<Spec[]>([{ id: '1', key: '', value: '' }]);
  const [promoBadge, setPromoBadge] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculations
  const parsedBasePrice = parseFloat(basePrice) || 0;
  const parsedDiscount = parseFloat(discountPercent) || 0;
  
  const salePrice = parsedDiscount > 0 
    ? parsedBasePrice - (parsedBasePrice * (parsedDiscount / 100))
    : parsedBasePrice;
    
  const savings = parsedBasePrice - salePrice;

  // Listing Strength Calculation
  const listingStrength = useMemo(() => {
    let score = 0;
    if (title.length > 3) score += 15;
    if (brandId.length > 1) score += 10;
    if (sku.length > 2) score += 5;
    if (imageUrls.length > 0 || imageFiles.length > 0 || urlInput.length > 10) score += 20;
    if (parsedBasePrice > 0) score += 20;
    
    const validSpecs = specs.filter(s => s.key.trim() && s.value.trim());
    if (validSpecs.length >= 1) score += 15;
    if (validSpecs.length >= 3) score += 15;
    
    return Math.min(100, score);
  }, [title, brandId, sku, imageUrls, imageFiles, urlInput, uploadMode, parsedBasePrice, specs]);

  const handleAddSpec = () => {
    setSpecs([...specs, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const handleRemoveSpec = (id: string) => {
    if (specs.length > 1) {
      setSpecs(specs.filter(s => s.id !== id));
    }
  };

  const handleSpecChange = (id: string, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleSubmit = async () => {
    if (listingStrength < 70) return;
    
    setIsSubmitting(true);
    
    try {
      // Build the final metadata/specs object
      const metadata = specs
        .filter(s => s.key.trim() && s.value.trim())
        .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});

      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
        .replace(/(^-|-$)+/g, '');   // Remove leading or trailing hyphens

      const categoryName = categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
      const sanitizedCategoryName = categoryName.replace(/\s+/g, '-');

      let finalImageUrls = [...imageUrls];

      if (urlInput.trim()) {
        finalImageUrls.push(urlInput.trim());
      }

      // Local Multer API Upload for selected image files
      if (imageFiles.length > 0) {
        const selectedCategory = categories.find(c => c.id === categoryId);
        const categorySlug = (selectedCategory?.slug || categoryName || 'uncategorized')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'uncategorized';

        const selectedBrand = brands.find(b => b.id === brandId);
        const brandSlug = (selectedBrand?.slug || selectedBrand?.name || brandId || 'generic')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'generic';

        // 1. Create standard FormData and append selected files, categorySlug, and brandSlug
        const formData = new FormData();
        formData.append('categorySlug', categorySlug);
        formData.append('brandSlug', brandSlug);
        for (const file of imageFiles) {
          formData.append('images', file);
        }

        // 2. Standard FormData POST request to /api/upload
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload images to local server');
        }

        // 3. Extract returned relative URL paths and merge into images payload
        const uploadData = await uploadRes.json();
        const newPaths: string[] = uploadData.paths || uploadData.urls || [];
        if (Array.isArray(newPaths) && newPaths.length > 0) {
          finalImageUrls = [...finalImageUrls, ...newPaths];
        }
      }

      const payload = {
        title: title.trim(),
        slug: generatedSlug,
        price: salePrice,
        original_price: parsedBasePrice,
        discount_percent: parsedDiscount,
        images: finalImageUrls.length > 0 ? finalImageUrls : (isEditing ? undefined : []),
        sku: sku.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        stock_quantity: stockQuantity ? parseInt(stockQuantity) : 0,
        specifications: Object.keys(metadata).length > 0 ? metadata : null,
        promo_badge: promoBadge,
        brand_id: brandId || null
      };
      
      // Remove images array from payload if it's undefined (meaning we don't want to update it if no new image was provided while editing)
      if (isEditing && finalImageUrls.length === 0) {
        delete payload.images;
      }

      if (isEditing && editId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }
      
      setShowSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        if (!isEditing) {
          setTitle('');
          setBrandId('');
          setSku('');
          setCategoryId('');
          setStockQuantity('');
          setDescription('');
          setImageUrls([]);
          setImageFiles([]);
          setUrlInput('');
          setBasePrice('');
          setDiscountPercent('');
          setSpecs([{ id: Date.now().toString(), key: '', value: '' }]);
          setPromoBadge('');
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('Insert error:', err);
      toast.error('Failed to publish product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0C] text-slate-900 dark:text-slate-200 p-6 md:p-8 rounded-2xl relative overflow-hidden font-sans transition-colors duration-500">
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-white dark:bg-[#111827] border border-[#10B981]/30 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="w-24 h-24 bg-[#10B981]/10 dark:bg-[#10B981]/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] dark:shadow-[0_0_30px_rgba(16,185,129,0.4)] relative">
                <div className="absolute inset-0 rounded-full border-2 border-[#10B981] animate-ping opacity-20"></div>
                <Check className="w-12 h-12 text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-widest text-center">
                {isEditing ? 'Product Updated' : 'Product Published'}
              </h2>
              <p className="text-[#10B981] font-medium">Successfully {isEditing ? 'updated in' : 'synced to'} storefront</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
            <Box className="w-6 h-6 text-[#E50914]" />
            {isEditing ? 'Edit Hardware Product' : 'New Hardware Product'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{isEditing ? 'Update existing item details' : 'Add a new item to the SUNX catalog'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* Left Column: Form Wizard */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Section: Basic Details */}
          <div className="bg-slate-50 dark:bg-[#121215] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span> Core Details
            </h3>
            <div className="space-y-5">
              <div className="relative group">
                <input 
                  type="text" 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] peer placeholder-transparent transition-all shadow-inner dark:shadow-none"
                  placeholder="Product Title"
                />
                <label htmlFor="title" className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-focus:bg-slate-50 dark:peer-focus:bg-[#121215] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-slate-50 dark:peer-valid:bg-[#121215] peer-valid:px-2 pointer-events-none">
                  Product Title
                </label>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="relative group">
                  <select
                    id="brand"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] transition-all shadow-inner dark:shadow-none appearance-none"
                  >
                    <option value="" disabled className="text-slate-400 bg-white dark:bg-[#121215]">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-[#121215]">{b.name}</option>
                    ))}
                  </select>
                  <label htmlFor="brand" className="absolute left-4 -top-2.5 text-xs text-[#E50914] bg-slate-50 dark:bg-[#121215] px-2 pointer-events-none transition-all">
                    Brand
                  </label>
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] peer placeholder-transparent transition-all shadow-inner dark:shadow-none"
                    placeholder="SKU"
                  />
                  <label htmlFor="sku" className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-focus:bg-slate-50 dark:peer-focus:bg-[#121215] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-slate-50 dark:peer-valid:bg-[#121215] peer-valid:px-2 pointer-events-none">
                    SKU Number
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="relative group">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] transition-all shadow-inner dark:shadow-none appearance-none"
                  >
                    <option value="" disabled className="text-slate-400 bg-white dark:bg-[#121215]">Select Category</option>
                    {orderedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className={cat.level === 0 ? "font-bold bg-slate-100 dark:bg-[#1a1a1f]" : "bg-white dark:bg-[#121215]"}>
                        {cat.level === 1 ? '\u00A0\u00A0\u00A0↳ ' : ''}{cat.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="category" className="absolute left-4 -top-2.5 text-xs text-[#E50914] bg-slate-50 dark:bg-[#121215] px-2 pointer-events-none transition-all">
                    Category
                  </label>
                </div>
                <div className="relative group">
                  <input 
                    type="number" 
                    id="stock"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] peer placeholder-transparent transition-all shadow-inner dark:shadow-none"
                    placeholder="Inventory Count"
                  />
                  <label htmlFor="stock" className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-focus:bg-slate-50 dark:peer-focus:bg-[#121215] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-slate-50 dark:peer-valid:bg-[#121215] peer-valid:px-2 pointer-events-none">
                    Inventory Count
                  </label>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] peer placeholder-transparent transition-all shadow-inner dark:shadow-none resize-none"
                  placeholder="Product Description"
                />
                <label htmlFor="description" className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-focus:bg-slate-50 dark:peer-focus:bg-[#121215] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-slate-50 dark:peer-valid:bg-[#121215] peer-valid:px-2 pointer-events-none">
                  Product Description
                </label>
              </div>

              <div className="flex flex-col gap-4">
                <div className="relative flex p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full w-max shadow-inner">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${uploadMode === 'file' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                  >
                    {uploadMode === 'file' && (
                      <motion.div
                        layoutId="mediaMode"
                        className="absolute inset-0 bg-[#E50914] rounded-full z-[-1] shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                      />
                    )}
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${uploadMode === 'url' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
                  >
                    {uploadMode === 'url' && (
                      <motion.div
                        layoutId="mediaMode"
                        className="absolute inset-0 bg-[#E50914] rounded-full z-[-1] shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                      />
                    )}
                    Paste URL
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {uploadMode === 'url' ? (
                    <motion.div
                      key="url-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative mt-2"
                    >
                      <div className="flex gap-2">
                        <div className="relative group flex-1">
                          <input 
                            type="text" 
                            id="image"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (urlInput.trim()) {
                                  setImageUrls([...imageUrls, urlInput.trim()]);
                                  setUrlInput('');
                                }
                              }
                            }}
                            className="w-full bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] peer placeholder-transparent transition-all shadow-inner dark:shadow-none"
                            placeholder="https://... or /uploads/..."
                          />
                          <label htmlFor="image" className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-focus:bg-slate-50 dark:peer-focus:bg-[#121215] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-slate-50 dark:peer-valid:bg-[#121215] peer-valid:px-2 pointer-events-none">
                            Image URL (e.g. /uploads/... or http)
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (urlInput.trim()) {
                              setImageUrls([...imageUrls, urlInput.trim()]);
                              setUrlInput('');
                            }
                          }}
                          className="bg-[#E50914] text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      
                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-6">
                          {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group bg-slate-100 dark:bg-[#050505]">
                              <img 
                                src={url} 
                                alt={`Preview ${idx}`} 
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                                }}
                                className="w-full h-full object-cover" 
                              />
                              <button
                                type="button"
                                onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-[#E50914] text-white p-1.5 rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-mode"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative mt-2"
                    >
                      <div className="relative w-full aspect-[4/2] rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#E50914] dark:hover:border-[#E50914] bg-slate-50 dark:bg-white/5 transition-colors flex items-center justify-center cursor-pointer group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setImageFiles(prev => [...prev, ...filesArray]);
                              // Reset the input value so the same file can be selected again if needed
                              e.target.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-[#E50914] transition-colors pointer-events-none">
                          <UploadCloud className="w-10 h-10" />
                          <span className="font-bold text-sm tracking-wide">Drop Images or Click to Browse</span>
                        </div>
                      </div>

                      {imageFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-6">
                          {imageFiles.map((file, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group bg-slate-100 dark:bg-[#050505]">
                              <img src={URL.createObjectURL(file)} alt={`File Preview ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-[#E50914] text-white p-1.5 rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Section: Auto-Discount Calculator */}
          <div className="bg-slate-50 dark:bg-[#121215] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span> Pricing Engine
            </h3>
            
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input 
                  type="number" 
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] transition-all shadow-inner dark:shadow-none"
                  placeholder="Base Price"
                />
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] transition-all shadow-inner dark:shadow-none"
                  placeholder="Discount %"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex items-center justify-between shadow-sm dark:shadow-none">
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Final Sale Price</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">${salePrice.toFixed(2)}</span>
                  {parsedDiscount > 0 && (
                    <span className="text-slate-400 dark:text-slate-500 line-through text-lg mb-1">${parsedBasePrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
              {savings > 0 && (
                <div className="bg-[#E50914]/10 border border-[#E50914]/30 px-4 py-2 rounded-lg">
                  <p className="text-[#E50914] font-bold text-sm">Customer saves ${savings.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Hardware Specs */}
          <div className="bg-slate-50 dark:bg-[#121215] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span> Hardware Specs
            </h3>
            
            <div className="space-y-3 mb-5">
              <AnimatePresence>
                {specs.map((spec, index) => (
                  <motion.div 
                    key={spec.id}
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9, marginTop: 0 }}
                    className="flex gap-3 items-start"
                  >
                    <input 
                      type="text" 
                      value={spec.key}
                      onChange={(e) => handleSpecChange(spec.id, 'key', e.target.value)}
                      placeholder="e.g. Refresh Rate"
                      className="w-1/3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] shadow-inner dark:shadow-none"
                    />
                    <input 
                      type="text" 
                      value={spec.value}
                      onChange={(e) => handleSpecChange(spec.id, 'value', e.target.value)}
                      placeholder="e.g. 165Hz"
                      className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] shadow-inner dark:shadow-none"
                    />
                    <button 
                      onClick={() => handleRemoveSpec(spec.id)}
                      disabled={specs.length === 1}
                      className="p-3 mt-0.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={handleAddSpec}
              className="flex items-center gap-2 text-sm font-bold text-[#E50914] hover:text-red-600 dark:hover:text-red-400 transition-colors bg-[#E50914]/10 hover:bg-[#E50914]/20 px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> ADD SPEC ROW
            </button>
          </div>

          {/* Section: Psychological Triggers */}
          <div className="bg-slate-50 dark:bg-[#121215] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner transition-colors duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span> Promo Badge
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {['None', 'Hot Deal', 'Best Seller', 'Limited Drop'].map(badge => (
                <button
                  key={badge}
                  onClick={() => setPromoBadge(badge === 'None' ? '' : badge)}
                  className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
                    (badge === 'None' && promoBadge === '') || promoBadge === badge
                      ? 'border-[#E50914] bg-[#E50914]/10 text-[#E50914]'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#050505] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/30 shadow-sm dark:shadow-none'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Storefront Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Live Preview
              </h3>
            </div>

            {/* Simulated Product Card */}
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-[20px_20px_60px_#d9d9d9,-20px_-20px_60px_#ffffff] dark:shadow-[10px_10px_30px_#050505,-10px_-10px_30px_#1f1f1f] group transition-all duration-500">
              <div className="relative aspect-square bg-slate-50 dark:bg-[#050505] p-6 flex items-center justify-center overflow-hidden transition-colors duration-500">
                {promoBadge && (
                  <div className="absolute top-4 left-4 z-10 bg-[#E50914] text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                    {promoBadge}
                  </div>
                )}
                
                {imageUrls.length > 0 || imageFiles.length > 0 || urlInput.length > 0 ? (
                  <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory custom-scrollbar items-center">
                    {(uploadMode === 'url' ? [...imageUrls, urlInput].filter(Boolean) : imageFiles.map(f => URL.createObjectURL(f))).map((src, idx) => (
                      <motion.img 
                        key={idx}
                        src={src} 
                        alt={`Preview ${idx}`} 
                        className="w-full h-full shrink-0 object-contain snap-center p-4 group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => e.currentTarget.style.opacity = '0'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center border border-slate-300 dark:border-white/10 border-dashed transition-colors duration-500">
                    <Tag className="w-8 h-8 text-slate-400 dark:text-white/20" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <p className="text-[#E50914] text-xs font-bold uppercase tracking-widest mb-2">
                  {brands.find(b => b.id === brandId)?.name || 'Brand'}
                </p>
                <h4 className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-4 line-clamp-2 min-h-[3rem]">
                  {title || 'Product Title Appears Here'}
                </h4>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    {parsedDiscount > 0 && (
                      <span className="text-slate-400 dark:text-slate-500 line-through text-xs">${parsedBasePrice.toFixed(2)}</span>
                    )}
                    <span className="text-slate-900 dark:text-white font-black text-xl">${salePrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-200 dark:bg-white/10 mb-4 transition-colors duration-500" />
                
                <div className="flex flex-wrap gap-2">
                  {specs.slice(0, 3).map((s, i) => s.key && s.value ? (
                    <span key={i} className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-slate-600 dark:text-slate-400 transition-colors duration-500">
                      {s.value}
                    </span>
                  ) : null)}
                </div>
              </div>
            </div>

            {/* Submission & Circular Strength Gauge */}
            <div className="bg-slate-50 dark:bg-[#121215] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner mt-4 transition-colors duration-500">
              
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="stroke-slate-200 dark:stroke-white/10 transition-colors duration-500"
                      strokeWidth="8"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <motion.circle
                      className={`transition-colors duration-500 ${listingStrength === 100 ? 'stroke-[#10B981]' : 'stroke-[#E50914]'}`}
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      initial={{ strokeDasharray: 251.2, strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * listingStrength) / 100 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-black ${listingStrength === 100 ? 'text-[#10B981]' : 'text-slate-900 dark:text-slate-300'}`}>
                      {listingStrength}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1">Listing Strength</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                    {listingStrength < 70 ? 'Fill out more details to unlock publishing capabilities.' : 'Listing is optimized and ready to publish!'}
                  </p>
                </div>
              </div>

              {listingStrength < 70 && (
                <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-500/80 text-xs transition-colors duration-500">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Strength must be at least 70% to publish. Fill out more core details or specs.</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={listingStrength < 70 || isSubmitting}
                className="w-full relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-900 disabled:dark:hover:bg-white disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update Product' : 'Publish Product')}
                {listingStrength >= 70 && !isSubmitting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
