import React, { useState, useRef } from 'react';
import { Loader2, UploadCloud, AlertCircle, Database, CheckCircle2, Box, FileText, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import Papa from 'papaparse';

interface ParsedProduct {
  id: string;
  name: string;
  regular_price: string;
  stock_quantity: number | null;
  images: string[];
  description: string;
  sku: string;
}

export function WooCommerceMigrator() {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateSuccess, setMigrateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data as any[];
          const mappedProducts: ParsedProduct[] = parsedData.map((row, index) => {
            const name = row['Name'] || row['name'] || row['Title'] || 'Untitled Product';
            const price = row['Regular price'] || row['Sale price'] || row['Price'] || '0';
            const stockStr = row['Stock'] || row['stock'] || row['Stock quantity'] || row['In stock?'] || '';
            const stock = (stockStr !== '' && !isNaN(parseInt(stockStr, 10))) ? parseInt(stockStr, 10) : null;
            
            const imageStr = row['Images'] || row['images'] || '';
            const images = imageStr ? imageStr.split(',').map((u: string) => u.trim()).filter(Boolean) : [];
            
            const description = row['Description'] || row['Short description'] || '';
            const sku = row['SKU'] || row['sku'] || `WP-CSV-${index}`;

            return {
              id: `csv-${Date.now()}-${index}`,
              name,
              regular_price: price,
              stock_quantity: stock,
              images,
              description,
              sku
            };
          }).filter(p => p.name !== 'Untitled Product');

          setProducts(mappedProducts);
        } catch (err: any) {
          setError(err.message || 'Failed to parse CSV fields');
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        setError(err.message || 'Failed to read CSV file');
        setIsParsing(false);
      }
    });
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      const mappedProducts = products.map((p, i) => {
        const safeSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return {
          title: p.name,
          slug: `${safeSlug}-csv-${Date.now().toString().slice(-4)}${i}`,
          price: parseFloat(p.regular_price || '0'),
          original_price: parseFloat(p.regular_price || '0'),
          stock_quantity: p.stock_quantity || 0,
          images: p.images,
          sku: p.sku,
          description: p.description
        };
      });

      const chunkSize = 100;
      for (let i = 0; i < mappedProducts.length; i += chunkSize) {
        const chunk = mappedProducts.slice(i, i + chunkSize);
        const { error: dbError } = await supabase.from('products').insert(chunk);
        if (dbError) throw dbError;
      }
      
      setMigrateSuccess(true);
      setTimeout(() => setMigrateSuccess(false), 4000);
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Failed to migrate products to Supabase');
    } finally {
      setIsMigrating(false);
    }
  };

  const resetForm = () => {
    setProducts([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#E50914]" />
            CSV WooCommerce Migrator
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Upload a WooCommerce products CSV export to map and migrate inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {products.length > 0 && (
            <div className="bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
              Parsed: <span className="text-[#E50914] ml-1">{products.length} items</span>
            </div>
          )}
          
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />

          {products.length === 0 ? (
            <label
              htmlFor="csv-upload"
              className={`cursor-pointer bg-[#E50914] text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-red-700 transition-colors ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Upload CSV Export
            </label>
          ) : (
            <>
              <button
                onClick={resetForm}
                disabled={isMigrating}
                className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating || products.length === 0}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isMigrating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : migrateSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {migrateSuccess ? 'Migrated!' : `Migrate to DB (${products.length})`}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min((idx % 20) * 0.05, 0.5) }}
              key={product.id}
              className="bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="aspect-square bg-slate-50 dark:bg-[#121215] relative p-4 flex items-center justify-center border-b border-slate-100 dark:border-white/5">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <Box className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs uppercase tracking-widest font-bold">No Image</span>
                  </div>
                )}
                
                {product.stock_quantity !== null && (
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    product.stock_quantity > 0 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {product.stock_quantity > 0 ? `${product.stock_quantity} IN STOCK` : 'OUT OF STOCK'}
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-3 flex-1">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">CSV ROW</div>
                  <div className="font-black text-[#E50914]">
                    {product.regular_price ? `Rs. ${Number(product.regular_price).toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !isParsing && !error && (
          <div className="bg-white dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#121215] rounded-2xl flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2">Ready for CSV</h3>
            <p className="text-slate-500 max-w-sm">
              Click the upload button to parse your WooCommerce CSV export. Make sure it contains Name, Regular price, Stock, and Images columns.
            </p>
          </div>
        )
      )}
    </div>
  );
}
