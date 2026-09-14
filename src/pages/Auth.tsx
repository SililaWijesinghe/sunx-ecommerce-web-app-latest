import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, ShieldCheck, ArrowRight, Loader2, ArrowLeft, CheckCircle2, Check, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCartStore } from '../store/useCartStore';

const MARKETING_TAGLINES = [
  'Next Level Gaming.',
  'Premium Performance.',
  'Uncompromising Quality.',
  'Elevate Your Experience.'
];

export function Auth() {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>(location.state?.mode || 'signin');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Marketing Tagline State
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % MARKETING_TAGLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Validation
  const isValidEmail = email.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : true;
  const passwordsMatch = confirmPassword.length > 0 ? password === confirmPassword : true;
  const isStep1Valid = email.length > 0 && isValidEmail && password.length >= 6 && (mode === 'signup' ? password === confirmPassword : true);
  
  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 25;
    if (pw.length >= 10) score += 25;
    if (pw.match(/[A-Z]/)) score += 25;
    if (pw.match(/[0-9]/) || pw.match(/[^A-Za-z0-9]/)) score += 25;
    return score;
  };
  const strength = getPasswordStrength(password);

  const handleCustomerRedirect = () => {
    if (cartItems.length > 0) {
      navigate('/checkout');
    } else {
      navigate('/');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        setAccessGranted(true);
        setTimeout(() => handleCustomerRedirect(), 1500);
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        
        if (signInData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', signInData.user.id)
            .single();

          setAccessGranted(true);
          setTimeout(() => {
            if (profile?.role === 'super_admin') {
              navigate('/admin');
            } else {
              if (cartItems.length > 0) {
                navigate('/checkout');
              } else {
                navigate('/account');
              }
            }
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setStep(1);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#030303] flex font-sans relative">

      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex items-center justify-between pointer-events-auto">
        <motion.button 
          onClick={() => navigate(-1)}
          whileHover={{ x: -3 }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </motion.button>

        <motion.button 
          onClick={() => navigate('/')}
          whileHover={{ scale: 0.95 }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold tracking-wider"
        >
          <Home className="w-4 h-4" />
          STORE
        </motion.button>
      </div>

      {/* Left Panel: Branding & Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 flex-col justify-between p-12">
        <motion.div 
          className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2042&auto=format&fit=crop')] bg-cover bg-center opacity-20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-red-900/30 z-0" />
        
        <div className="relative z-10">
          <img src="/white-logo.png" alt="SUNX Technologies" className="h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-white text-3xl font-bold uppercase tracking-widest mt-4">SUNX</h1>
        </div>

        <div className="relative z-10 mb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-5xl font-bold text-white uppercase tracking-wider leading-tight mb-4">
                {MARKETING_TAGLINES[taglineIndex]}
              </h2>
              <div className="w-16 h-2 bg-[#E50914] rounded-full" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel: Interactive Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-white dark:bg-[#0a0a0c]">
        {/* Mobile Logo fallback */}
        <div className="absolute top-8 left-8 lg:hidden">
           <span className="text-gray-900 dark:text-white text-2xl font-bold uppercase tracking-widest">SUNX</span>
        </div>

        <div className="w-full max-w-md relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold uppercase tracking-widest text-gray-900 dark:text-white">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium tracking-wider uppercase">
              {mode === 'signin' ? 'Sign in to access your dashboard' : 'Join the revolution in high-end tech'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-8 relative border border-gray-200 dark:border-gray-800 shadow-inner">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest z-10 transition-colors ${mode === 'signin' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest z-10 transition-colors ${mode === 'signup' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
            >
              Register
            </button>
            
            <motion.div 
              layoutId="auth-mode-pill"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#E50914] rounded-lg shadow-md"
              initial={false}
              animate={{ left: mode === 'signin' ? '4px' : 'calc(50%)' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-start gap-3 shadow-sm"
              >
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signin' || (mode === 'signup' && step === 1) ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  {/* Email Input */}
                  <div className="relative group z-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      required
                      className={`block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-[#111111] border ${email.length > 0 && !isValidEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:ring-[#E50914] focus:border-transparent'} rounded-xl focus:ring-2 outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset`}
                    />
                    <label className={`absolute text-xs font-bold uppercase tracking-widest duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 ${email.length > 0 && !isValidEmail ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-[#E50914]'}`}>
                      Email Address
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="relative group z-0">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      required
                      minLength={6}
                      className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                    />
                    <label className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                      Password
                    </label>
                  </div>

                  {mode === 'signup' && (
                    <>
                      {/* Password Strength Meter */}
                      {password && (
                        <div className="space-y-2 px-1">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Strength</span>
                            <span className={strength >= 75 ? 'text-green-500' : strength >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                              {strength >= 75 ? 'Strong' : strength >= 50 ? 'Good' : 'Weak'}
                            </span>
                          </div>
                          <div className="flex gap-1 h-1.5 w-full">
                            {[25, 50, 75, 100].map((threshold) => (
                              <div 
                                key={threshold} 
                                className={`flex-1 rounded-full transition-colors ${
                                  strength >= threshold 
                                    ? strength >= 75 ? 'bg-green-500' : strength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    : 'bg-gray-200 dark:bg-gray-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confirm Password Input */}
                      <div className="relative group z-0">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder=" "
                          required
                          className={`block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-[#111111] border ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:ring-[#E50914] focus:border-transparent'} rounded-xl focus:ring-2 outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset`}
                        />
                        <label className={`absolute text-xs font-bold uppercase tracking-widest duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 ${confirmPassword.length > 0 && !passwordsMatch ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-[#E50914]'}`}>
                          Confirm Password
                        </label>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to credentials
                  </button>

                  <div className="relative group z-0">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder=" "
                      required
                      className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                    />
                    <label className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                      Full Name
                    </label>
                  </div>

                  <div className="relative group z-0">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=" "
                      required
                      className="block w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#E50914] focus:border-transparent outline-none transition-all peer shadow-sm dark:shadow-neu-dark-inset"
                    />
                    <label className="absolute text-xs font-bold uppercase tracking-widest text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#E50914]">
                      Phone Number
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || accessGranted || (mode === 'signup' && step === 1 && !isStep1Valid)}
              whileTap={{ scale: 0.98 }}
              className={`w-full font-bold py-4 mt-6 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
                accessGranted 
                  ? 'bg-green-600 text-white shadow-green-500/20 border-green-500' 
                  : 'bg-[#E50914] hover:bg-red-700 hover:shadow-red-900/30 text-white disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'
              }`}
            >
              {accessGranted ? (
                <><CheckCircle2 className="w-5 h-5" /> Access Granted</>
              ) : loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {mode === 'signin' ? 'Authenticating...' : 'Processing...'}</>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : step === 1 ? 'Next Step' : 'Create Account'}
                  {mode === 'signup' && step === 1 && <ArrowRight className="w-5 h-5" />}
                  {(mode === 'signin' || (mode === 'signup' && step === 2)) && <Check className="w-5 h-5 hidden" />}
                </>
              )}
            </motion.button>
          </form>

        </div>
      </div>
    </div>
  );
}
