import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Category, Brand } from '../../types';
import { Upload, X, Plus, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';

interface SpecInput {
  id: string;
  key: string;
  value: string;
}

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const orderedCategories = React.useMemo(() => {
    const mainCats = categories.filter((c: any) => !c.parent_id);
    const result: any[] = [];
    mainCats.forEach((main: any) => {
      result.push({ ...main, level: 0 });
      const subs = categories.filter((c: any) => c.parent_id === main.id);
      subs.forEach((sub: any) => {
        result.push({ ...sub, level: 1 });
      });
    });
    const addedIds = new Set(result.map((c: any) => c.id));
    categories.forEach((c: any) => {
      if (!addedIds.has(c.id)) {
        result.push({ ...c, level: c.parent_id ? 1 : 0 });
      }
    });
    return result;
  }, [categories]);
  
  const [specs, setSpecs] = useState<SpecInput[]>([{ id: Date.now().toString(), key: '', value: '' }]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      const [catsRes, brandsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('brands').select('*')
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);

      if (isEditMode) {
        setIsLoading(true);
        try {
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (fetchError) throw fetchError;
          if (product) {
            setTitle(product.title || product.name || '');
            setDescription(product.description || '');
            setPrice(product.price ? product.price.toString() : '');
            setStock(product.stock_quantity !== undefined ? product.stock_quantity.toString() : (product.stock !== undefined ? product.stock.toString() : ''));
            setCategoryId(product.category_id || '');
            setBrandId(product.brand_id || '');
            
            if (product.specs && typeof product.specs === 'object') {
              const parsedSpecs = Object.entries(product.specs).map(([k, v]) => ({
                id: Math.random().toString(),
                key: k,
                value: String(v)
              }));
              if (parsedSpecs.length > 0) setSpecs(parsedSpecs);
            }

            const images = Array.isArray(product.images) ? product.images : (product.base_image_url ? [product.base_image_url] : []);
            if (images.length > 0) {
              setExistingImageUrl(images[0]);
              setImagePreview(images[0]);
            }
          }
        } catch (err: any) {
          console.error('Error fetching product for edit:', err);
          setError(err.message || 'Failed to load product details.');
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [id, isEditMode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const handleRemoveSpec = (id: string) => {
    setSpecs(specs.filter(s => s.id !== id));
  };

  const handleSpecChange = (id: string, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Validate inputs
      if (!title || !price || !stock || !categoryId || !brandId) {
        throw new Error('Please fill out all required fields.');
      }
      
      if (!isEditMode && !imageFile) {
        throw new Error('Please select an image for the new product.');
      }

      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }

      let finalImageUrl = existingImageUrl;

      // 2. Upload Image to local storage endpoint if a new one is selected
      if (imageFile) {
        const cat = categories.find(c => c.id === categoryId)?.name || 'uncategorized';
        const sanitizedCat = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const brandObj = brands.find(b => b.id === brandId);
        const sanitizedBrand = (brandObj?.slug || brandObj?.name || 'generic').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const formData = new FormData();
        formData.append('categorySlug', sanitizedCat);
        formData.append('brandSlug', sanitizedBrand);
        formData.append('images', imageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload image to local server');
        }

        const uploadData = await uploadRes.json();
        if (uploadData.paths && uploadData.paths.length > 0) {
          finalImageUrl = uploadData.paths[0];
        }
      }

      // 3. Format data for Supabase
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const specsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);
      
      const payload = {
        title,
        slug,
        description,
        price: parseFloat(price),
        stock_quantity: parseInt(stock, 10),
        category_id: categoryId,
        brand_id: brandId,
        images: finalImageUrl ? [finalImageUrl] : [],
        specs: specsObject,
        is_featured: false,
        is_deal_of_day: false
      };

      // 4. Insert or Update into Supabase
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);

        if (updateError) throw updateError;
        setSuccess('Product successfully updated!');
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([payload]);

        if (insertError) throw insertError;
        setSuccess('Product successfully created!');
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
      
    } catch (err: any) {
      console.error('Product Save Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 border border-gray-800 text-white rounded-none">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isEditMode ? 'Update existing product listing.' : 'Create a new product listing in the catalog.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 text-green-500 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column - Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none"
                placeholder="e.g. SUNX Pro Gaming Motherboard"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none"
                  placeholder="299.99"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none"
                  placeholder="50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none appearance-none"
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {orderedCategories.map(c => (
                    <option key={c.id} value={c.id} className={c.level === 0 ? "font-bold bg-gray-900" : "bg-gray-950"}>
                      {c.level === 1 ? '\u00A0\u00A0\u00A0↳ ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand *</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none appearance-none"
                  required
                >
                  <option value="" disabled>Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-gray-950 border border-gray-800 text-white px-4 py-3 focus:outline-none focus:border-red-500 transition-colors rounded-none resize-none"
                placeholder="Product description..."
              />
            </div>
          </div>

          {/* Right Column - Image & Specs */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Product Image (1:1 Ratio) {isEditMode ? '' : '*'}
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full sm:w-64 max-w-full bg-gray-950 border-2 border-dashed border-gray-800 hover:border-red-500/50 transition-colors cursor-pointer relative group flex flex-col items-center justify-center overflow-hidden"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-red-500 transition-colors">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-50" />
                    <span className="text-sm font-medium">Click to upload image</span>
                    <span className="text-xs mt-1 opacity-60">Requires 1:1 Square aspect ratio</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Tech Specs</label>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1 uppercase tracking-wide"
                >
                  <Plus className="w-3 h-3" /> Add Spec
                </button>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {specs.map((spec) => (
                    <motion.div 
                      key={spec.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(spec.id, 'key', e.target.value)}
                        placeholder="e.g. Socket"
                        className="w-1/3 bg-gray-950 border border-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors rounded-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(spec.id, 'value', e.target.value)}
                        placeholder="e.g. AM5"
                        className="flex-1 bg-gray-950 border border-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors rounded-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(spec.id)}
                        className="w-9 h-9 bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {specs.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No specs added. Click 'Add Spec' to include details.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white px-8 py-3 font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none`}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-5 h-5" /> {isEditMode ? 'Update Product' : 'Publish Product'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
