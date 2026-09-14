import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Laptop, HardDrive, Wrench, Apple, Star, DollarSign,
  Sparkles, Check, ShoppingCart, RotateCcw, ExternalLink, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useCartStore } from '../../store/useCartStore';

// ─── Types ──────────────────────────────────────────────────────────────────
interface MatchedProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  rating: number | null;
  images: string[];
  base_image_url: string | null;
  specifications: Record<string, string> | null;
  stock_quantity: number;
  brand_id: string | null;
  category_id: string | null;
}

// ─── Step Definitions ────────────────────────────────────────────────────────
const STEP_1 = {
  id: 'objective',
  title: 'What is your primary objective?',
  options: [
    {
      id: 'laptop',
      label: 'Laptop & Workstation',
      icon: Laptop,
      desc: 'Laptops for business, creative work, or daily productivity.',
      slugMatches: ['laptop', 'macbook'],
    },
    {
      id: 'storage',
      label: 'Speed & Storage Upgrade',
      icon: HardDrive,
      desc: 'High-speed NVMe/SATA SSDs and RAM modules.',
      slugMatches: ['ssd', 'ram'],
    },
    {
      id: 'parts',
      label: 'Replacement Hardware',
      icon: Wrench,
      desc: 'Genuine replacement batteries, keyboards, power adapters, or screens.',
      slugMatches: ['battery', 'keyboard', 'adapter', 'fan', 'screen'],
    },
  ],
};

const STEP_2 = {
  id: 'brand',
  title: 'Preferred brand or ecosystem?',
  options: [
    { id: 'apple',   label: 'Apple',              icon: Apple,      desc: 'MacBook / MagSafe ecosystem',           keywords: ['apple', 'macbook', 'magsafe', 'mac'] },
    { id: 'dell',    label: 'Dell',                icon: Laptop,     desc: 'Dell Inspiron, XPS & Latitude',         keywords: ['dell'] },
    { id: 'hp',      label: 'HP',                  icon: Laptop,     desc: 'HP Pavilion, EliteBook & Spectre',      keywords: ['hp', 'hewlett'] },
    { id: 'lenovo',  label: 'Lenovo / ASUS / Acer',icon: Laptop,     desc: 'ThinkPad, VivoBook, Aspire & more',    keywords: ['lenovo', 'asus', 'acer'] },
    { id: 'any',     label: 'Any / Top Value',     icon: Star,       desc: 'Show me the best bang for my buck.',    keywords: [] },
  ],
};

const STEP_3 = {
  id: 'budget',
  title: 'What is your budget range?',
  options: [
    { id: 'budget', label: 'Budget Friendly',       icon: DollarSign, desc: 'Under Rs. 20,000 — batteries, RAM, chargers, accessories', min: 0,      max: 20000 },
    { id: 'mid',    label: 'Mid-Range Performance', icon: ChevronRight,desc: 'Rs. 20,000 – 100,000 — SSDs, enterprise laptops',          min: 20000,  max: 100000 },
    { id: 'pro',    label: 'Pro & Flagship',        icon: Star,        desc: 'Rs. 100,000+ — MacBooks, high-end laptops',               min: 100000, max: 99999999 },
  ],
};

const STEPS = [STEP_1, STEP_2, STEP_3];

// ─── Matching logic ──────────────────────────────────────────────────────────
async function findBestMatch(answers: Record<string, string>): Promise<MatchedProduct | null> {
  const objectiveOption = STEP_1.options.find(o => o.id === answers.objective);
  const brandOption     = STEP_2.options.find(o => o.id === answers.brand);
  const budgetOption    = STEP_3.options.find(o => o.id === answers.budget);

  if (!objectiveOption || !brandOption || !budgetOption) return null;

  // 1. Fetch all categories
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, slug, name, parent_id');

  // Match categories by slug substring
  const matchedCatIds = (allCats || [])
    .filter(c => c.slug && objectiveOption.slugMatches.some(match => c.slug.toLowerCase().includes(match)))
    .map(c => c.id);

  // Also include child categories of matched parents
  const childIds = (allCats || [])
    .filter(c => c.parent_id && matchedCatIds.includes(c.parent_id))
    .map(c => c.id);

  const finalCatIds = [...new Set([...matchedCatIds, ...childIds])];

  // 2. Fetch products by budget (No stock > 0 filter!)
  let query = supabase
    .from('products')
    .select('id, title, slug, description, price, original_price, discount_percent, rating, images, base_image_url, specifications, stock_quantity, brand_id, category_id')
    .gte('price', budgetOption.min)
    .lte('price', budgetOption.max)
    .order('rating', { ascending: false });

  if (finalCatIds.length > 0) {
    query = query.in('category_id', finalCatIds);
  }

  const { data: products } = await query;
  if (!products || products.length === 0) {
    return null;
  }

  // 3. Filter by brand strictly
  let filteredProducts = products;
  if (brandOption.id !== 'any' && brandOption.keywords.length > 0) {
    filteredProducts = products.filter(p => {
      const titleLower = (p.title || '').toLowerCase();
      return brandOption.keywords.some(kw => titleLower.includes(kw));
    });
  }

  if (filteredProducts.length === 0) {
    return null;
  }

  // Best match is the first one (already sorted by rating desc from query)
  return filteredProducts[0] as MatchedProduct;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function GuidedMatchModal({ onClose }: { onClose: () => void }) {
  const navigate   = useNavigate();
  const addItem    = useCartStore(s => s.addItem);

  const [step,        setStep]        = useState(0);
  const [answers,     setAnswers]     = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result,      setResult]      = useState<MatchedProduct | null>(null);
  const [noMatch,     setNoMatch]     = useState(false);
  const [added,       setAdded]       = useState(false);
  const [showRipple,  setShowRipple]  = useState(false);

  const currentStepData = STEPS[step];

  const handleOption = useCallback(async (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step — run match
      setIsAnalyzing(true);
      const matched = await findBestMatch(newAnswers);
      setTimeout(() => {
        setIsAnalyzing(false);
        if (matched) {
          setResult(matched);
        } else {
          setNoMatch(true);
        }
      }, 2400);
    }
  }, [answers, step]);

  const handleRetake = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setNoMatch(false);
    setAdded(false);
  };

  const handleAddToCart = () => {
    if (!result || added) return;
    setShowRipple(true);
    const imgUrl = (Array.isArray(result.images) && result.images.length > 0)
      ? result.images[0]
      : (result.base_image_url || '');
    addItem({
      id: result.id,
      name: result.title,
      price: result.price,
      imageUrl: imgUrl,
      description: result.description,
      categoryId: result.category_id || '',
      brandId: result.brand_id || '',
      stock: result.stock_quantity,
      createdAt: new Date().toISOString(),
      slug: result.slug,
    });
    setTimeout(() => {
      setAdded(true);
      setTimeout(() => setShowRipple(false), 800);
    }, 150);
  };

  const handleViewProduct = () => {
    if (!result) return;
    navigate(`/product/${result.slug}`);
    onClose();
  };

  // Derived display values
  const productImage = result
    ? (Array.isArray(result.images) && result.images.length > 0
        ? result.images[0]
        : (result.base_image_url || ''))
    : '';

  const specBullets: string[] = result?.specifications
    ? Object.entries(result.specifications).slice(0, 4).map(([k, v]) => `${k}: ${v}`)
    : result?.description
      ? result.description.split(/[.،,\n]/).map(s => s.trim()).filter(s => s.length > 10).slice(0, 3)
      : [];

  const hasDiscount = result && result.original_price && result.original_price > result.price;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-[#0A0A0C] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(229,9,20,0.12)] flex flex-col min-h-[500px]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col p-7 md:p-10">
          <AnimatePresence mode="wait">

            {/* ── Analyzing ── */}
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-1 py-16"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#E50914] animate-spin" />
                  <div className="absolute inset-2 rounded-full border-r-2 border-[#E50914]/50 animate-[spin_1.5s_reverse_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#E50914] animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 text-center">
                  Matching Your Gear
                </h3>
                <p className="text-slate-400 font-medium text-center animate-pulse">
                  Scanning live catalog for the perfect match…
                </p>
              </motion.div>
            )}

            {/* ── Questions ── */}
            {!isAnalyzing && !result && !noMatch && (
              <motion.div
                key={`step-${step}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="flex flex-col flex-1"
              >
                <div className="mb-8">
                  <span className="text-[#E50914] font-bold uppercase tracking-widest text-xs mb-2 block">
                    Step {step + 1} of {STEPS.length}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                    {currentStepData.title}
                  </h2>
                </div>

                <div className={`grid gap-4 ${currentStepData.options.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {currentStepData.options.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOption(currentStepData.id, opt.id)}
                        className="group relative bg-[#121215] border border-white/10 p-5 rounded-2xl text-left flex flex-col items-start gap-3 hover:bg-[#E50914]/5 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/0 to-[#E50914]/0 group-hover:from-[#E50914]/10 transition-colors duration-500" />
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#E50914]/50 rounded-2xl transition-colors duration-300" />
                        <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-[#E50914]/20 group-hover:text-[#E50914] transition-colors relative z-10 text-slate-300">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-base font-bold text-white mb-1 group-hover:text-[#E50914] transition-colors leading-tight">
                            {opt.label}
                          </h4>
                          <p className="text-xs text-slate-400 leading-snug">{opt.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── No Match Fallback ── */}
            {noMatch && (
              <motion.div
                key="no-match"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center flex-1 py-12 text-center"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-black text-white uppercase mb-2">No Exact Match</h3>
                <p className="text-slate-400 mb-8 max-w-sm">
                  We couldn't find an in-stock product matching all your criteria right now. Try adjusting your budget or browse the store.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake Quiz
                  </button>
                  <button
                    onClick={() => { navigate('/shop'); onClose(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#E50914] hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Browse Store <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Result ── */}
            {result && !isAnalyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, type: 'spring', damping: 20 }}
                className="flex flex-col flex-1"
              >
                {/* Match badge */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
                    <Check className="w-3.5 h-3.5" /> Best Match Found
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                    Your Ideal Gear
                  </h2>
                </div>

                {/* Product card */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-5 items-stretch shadow-2xl relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-[#E50914]/8 blur-[60px] rounded-full pointer-events-none" />

                  {/* Image */}
                  <div className="w-full md:w-[200px] flex-shrink-0 aspect-square md:aspect-auto md:h-auto rounded-xl overflow-hidden bg-[#050505] border border-white/5 relative z-10">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={result.title}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/0A0A0C/444?text=Product';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Image</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 relative z-10 min-w-0">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide mb-1 leading-tight">
                      {result.title}
                    </h3>

                    {/* Specs/description bullets */}
                    {specBullets.length > 0 && (
                      <ul className="mb-3 space-y-0.5">
                        {specBullets.map((b, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                            <span className="text-[#E50914] mt-0.5 flex-shrink-0">▸</span>
                            <span className="truncate">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-4 mt-auto">
                      <span className="text-2xl font-black text-white">
                        Rs. {result.price.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-sm text-slate-500 line-through">
                            Rs. {result.original_price!.toLocaleString()}
                          </span>
                          {result.discount_percent && (
                            <span className="text-xs font-bold text-[#E50914] bg-[#E50914]/10 px-2 py-0.5 rounded-full">
                              -{result.discount_percent}%
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* View Product */}
                      <button
                        onClick={handleViewProduct}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-bold uppercase tracking-wide rounded-xl transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> View Product
                      </button>

                      {/* Add to Cart */}
                      <div className="flex-1 relative">
                        <AnimatePresence>
                          {showRipple && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0.7 }}
                              animate={{ scale: 2, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.55, ease: 'easeOut' }}
                              className="absolute inset-0 bg-[#E50914] rounded-xl z-0 pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                        <motion.button
                          whileHover={!added ? { scale: 1.02 } : {}}
                          whileTap={!added ? { scale: 0.96 } : {}}
                          onClick={handleAddToCart}
                          disabled={added}
                          className={`relative z-10 w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-black uppercase tracking-wide rounded-xl transition-all ${
                            added
                              ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                              : 'bg-[#E50914] hover:bg-red-700 text-white shadow-[0_0_18px_rgba(229,9,20,0.3)]'
                          }`}
                        >
                          {added ? (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                              <Check className="w-4 h-4" /> Added!
                            </motion.span>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" /> Add to Cart
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Retake */}
                    <button
                      onClick={handleRetake}
                      className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mx-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
