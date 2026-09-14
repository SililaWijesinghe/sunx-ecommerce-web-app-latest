import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabaseClient';
import { 
  Loader2, ArrowRight, ShieldCheck, Lock, CreditCard, 
  Smartphone, Wallet, CheckCircle2, AlertCircle, Clock, Truck, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  // Auth Check
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Countdown Timer State (10 minutes)
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user) {
        setEmail(user.email || '');
        // Attempt to parse name
        const nameParts = (user.user_metadata?.full_name || '').split(' ');
        if (nameParts.length > 0) setFirstName(nameParts[0]);
        if (nameParts.length > 1) setLastName(nameParts.slice(1).join(' '));
      }
      setCheckingAuth(false);
    });
  }, []);

  // Timer Effect
  useEffect(() => {
    if (timeLeft <= 0 || items.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, items.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-[#E50914] rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto p-12 text-center border border-gray-200 dark:border-white/10 mt-12 bg-white dark:bg-[#0A0A0C] shadow-2xl rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E50914] to-red-900"></div>
        <ShieldCheck className="w-20 h-20 text-[#E50914] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(229,9,20,0.3)]" />
        <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-gray-900 dark:text-white">Authentication Required</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Please securely log in to your account to process your transaction and reserve your hardware.</p>
        <button onClick={() => navigate('/auth')} className="w-full bg-[#E50914] text-white font-bold py-4 px-6 rounded-xl hover:bg-red-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:shadow-[0_0_30px_rgba(229,9,20,0.5)] active:scale-95">
          Sign In to Continue <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto p-12 text-center border border-gray-200 dark:border-white/10 mt-12 bg-white dark:bg-[#0A0A0C] shadow-xl rounded-2xl"
      >
        <h2 className="text-2xl font-black uppercase tracking-wider mb-4 text-gray-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Add some high-performance gear before proceeding to secure checkout.</p>
        <Link to="/" className="w-full block bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all uppercase tracking-widest active:scale-95">
          Return to Store
        </Link>
      </motion.div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }
      
      const fullName = `${firstName} ${lastName}`.trim();

      // Ensure profile exists to satisfy foreign key constraint
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName || 'Customer'
      }, { onConflict: 'id' }).select().single();

      const shipping_address = { street, city, zip, phone, firstName, lastName };
      
      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          shipping_address,
          total_amount: total,
          payment_method: paymentMethod
        })
        .select()
        .single();
        
      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItemsToInsert = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
        
      if (itemsError) throw itemsError;

      clearCart();
      navigate('/order-success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = total > 50000 ? 0 : 1500;
  const tax = total * 0.18; // Mock 18% tax for visual realism
  const finalTotal = total + shippingCost + tax;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Progress Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
            SUNX <span className="text-[#E50914]">SECURE</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111] px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-white/5">
            <Lock className="w-4 h-4 text-green-500" /> 256-Bit SSL Encrypted
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Express Checkout */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0A0A0C] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">Express Checkout</h3>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 bg-[#000] dark:bg-white text-white dark:text-black py-3 px-4 rounded-xl font-bold transition-transform active:scale-95 hover:shadow-lg">
                  <Smartphone className="w-5 h-5" /> Apple Pay
                </button>
                <button type="button" className="flex items-center justify-center gap-2 bg-white dark:bg-[#1A1A1A] text-black dark:text-white border border-gray-200 dark:border-white/20 py-3 px-4 rounded-xl font-bold transition-transform active:scale-95 hover:shadow-lg">
                  <Wallet className="w-5 h-5" /> Google Pay
                </button>
              </div>
              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-white dark:bg-[#0A0A0C] px-4 text-gray-400">Or continue with email</span>
                </div>
              </div>
            </motion.div>

            {/* Main Form */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleCheckout} 
              className="bg-white dark:bg-[#0A0A0C] rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-white/10 shadow-sm space-y-8 relative overflow-hidden"
            >
              {/* Form Error */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contact Info */}
              <div className="space-y-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs">1</span>
                  Contact Information
                </h2>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] dark:focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all peer"
                    placeholder=" "
                  />
                  <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                    Email Address
                  </label>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs">2</span>
                  Shipping Details
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                      placeholder=" "
                    />
                    <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                      First Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                      placeholder=" "
                    />
                    <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                      Last Name
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                    placeholder=" "
                  />
                  <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                    Street Address
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                      placeholder=" "
                    />
                    <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                      City
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                      placeholder=" "
                    />
                    <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                      Postal Code
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white outline-none focus:border-[#E50914] transition-all peer"
                    placeholder=" "
                  />
                  <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#E50914] peer-valid:top-1.5 peer-valid:text-xs">
                    Phone Number
                  </label>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs">3</span>
                  Payment Method
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-[#E50914] bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                    <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="hidden" />
                    <CreditCard className={`w-6 h-6 mr-3 ${paymentMethod === 'credit_card' ? 'text-[#E50914]' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-bold ${paymentMethod === 'credit_card' ? 'text-[#E50914]' : 'text-gray-900 dark:text-white'}`}>Credit Card</div>
                      <div className="text-xs text-gray-500">Stripe Secure</div>
                    </div>
                    {paymentMethod === 'credit_card' && <CheckCircle2 className="w-5 h-5 text-[#E50914] absolute right-4" />}
                  </label>
                  
                  <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-[#E50914] bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                    <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} className="hidden" />
                    <Wallet className={`w-6 h-6 mr-3 ${paymentMethod === 'bank_transfer' ? 'text-[#E50914]' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-bold ${paymentMethod === 'bank_transfer' ? 'text-[#E50914]' : 'text-gray-900 dark:text-white'}`}>Bank Transfer</div>
                      <div className="text-xs text-gray-500">Direct Deposit</div>
                    </div>
                    {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-[#E50914] absolute right-4" />}
                  </label>
                </div>
              </div>

              {/* Submit Button (Hidden on Mobile, shown in Summary on Desktop) */}
              <div className="hidden lg:block pt-6 border-t border-gray-100 dark:border-white/5">
                 {/* Trust Badges */}
                <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">
                  <div className="flex flex-col items-center gap-1 text-center"><Shield className="w-6 h-6 mb-1 text-green-500" /> Secure Payment</div>
                  <div className="flex flex-col items-center gap-1 text-center"><Truck className="w-6 h-6 mb-1 text-blue-500" /> Tracked Shipping</div>
                  <div className="flex flex-col items-center gap-1 text-center"><CheckCircle2 className="w-6 h-6 mb-1 text-purple-500" /> Quality Checked</div>
                </div>
              </div>

            </motion.form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-white dark:bg-[#0A0A0C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl"
            >
              {/* Urgency Banner */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E50914]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#E50914] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-400">High Demand Alert</h4>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">Your cart is reserved for <span className="font-black text-[#E50914]">{formatTime(timeLeft)}</span> minutes.</p>
                </div>
              </div>

              <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-white/5 pb-4">Order Summary</h3>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-white/5 p-2 shrink-0 relative overflow-hidden">
                      <img 
                        src={item.imageUrl || '/placeholder.png'} 
                        alt={item.name} 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                        }}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute -top-1.5 -right-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0A0A0C] z-10">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-sm font-black text-[#E50914]">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="mt-6 space-y-3 pt-6 border-t border-gray-100 dark:border-white/5 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-bold">Rs. {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <span>Estimated Tax (18%)</span>
                  <span className="text-gray-900 dark:text-white font-bold">Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                  <span>Shipping</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-500 font-black uppercase tracking-wider text-xs bg-green-500/10 px-2 py-0.5 rounded">Free</span>
                  ) : (
                    <span className="text-gray-900 dark:text-white font-bold">Rs. {shippingCost.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-end mb-8">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Rs. {finalTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full group relative bg-[#E50914] text-white font-black py-4 px-6 rounded-xl hover:bg-red-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden shadow-[0_10px_30px_rgba(229,9,20,0.3)] hover:shadow-[0_15px_40px_rgba(229,9,20,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Place Secure Order
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
                By placing this order, you agree to the Terms of Service.
              </p>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
