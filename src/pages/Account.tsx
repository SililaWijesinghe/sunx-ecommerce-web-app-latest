import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, User, Heart, ShieldCheck, LogOut, Loader2, ShoppingBag, CreditCard, CheckCircle2, Truck, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useWishlistStore } from '../store/useWishlistStore';

import { ThemeToggle } from '../components/ThemeToggle';

// We'll bring in the tabs here
import { OrdersTab, Order } from '../components/account/OrdersTab';
import { ProfileTab } from '../components/account/ProfileTab';
import { WishlistTab } from '../components/account/WishlistTab';
import { SecurityTab } from '../components/account/SecurityTab';

const TABS = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'profile', label: 'Profile & Addresses', icon: User },
  { id: 'wishlist', label: 'Live Wishlist', icon: Heart },
  { id: 'security', label: 'Security & Sessions', icon: ShieldCheck },
];

export function Account() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const wishlistItems = useWishlistStore((state) => state.items);
  const fetchWishlist = useWishlistStore((state) => state.fetchUserWishlist);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile({
          ...profileData,
          email: session.user.email || '',
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || 'Customer'
        });

        // Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, 
            created_at, 
            status, 
            total_amount, 
            payment_method, 
            order_items (
              id,
              quantity,
              unit_price,
              products (
                title,
                images
              )
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders((ordersData as any) || []);

      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-[#E50914] animate-spin mb-4" />
        <p className="text-gray-900 dark:text-gray-400 font-bold uppercase tracking-widest text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  // Calculate completion percentage
  let completionCount = 0;
  if (profile?.full_name) completionCount += 25;
  if (profile?.phone) completionCount += 25;
  if (profile?.address_line_1) completionCount += 25;
  if (profile?.city) completionCount += 25;
  const completionPercentage = completionCount;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const rewardPoints = Math.floor(totalSpent / 100);

  return (
    <div className="w-full max-w-7xl mx-auto py-2 md:py-4 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-28 md:pb-12">

      {/* Super Navigation Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => navigate(-1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ x: -2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        <motion.button
          onClick={() => navigate(1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ x: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
        >
          Forward
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      
      {/* 1. Header Banner & Progressive Onboarding Bar */}
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-gray-900 rounded-2xl p-4 md:p-8 flex flex-col gap-6 md:gap-8 shadow-sm dark:shadow-neu-dark relative overflow-hidden">
        {/* Background glow for dark mode */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 blur-[100px] rounded-full pointer-events-none hidden dark:block"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 md:gap-6 relative z-10 w-full">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'Customer'} className="w-full h-full object-cover" />
              ) : profile?.full_name ? (
                <span className="text-3xl font-bold text-gray-700 dark:text-gray-300 uppercase">
                  {profile.full_name.charAt(0)}
                </span>
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  {profile?.full_name || 'Customer'}
                </h1>
                <span className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-[#E50914] text-xs font-bold uppercase tracking-widest rounded-full border border-red-100 dark:border-red-500/20">
                  Tier 1 Member
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wider">{profile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-[#E50914] dark:hover:border-[#E50914] hover:bg-red-50 dark:hover:bg-red-600/10 transition-colors uppercase tracking-widest text-sm font-bold shrink-0"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>

        {/* Gamified Profile Completion Meter */}
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 relative z-10">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Profile {completionPercentage}% complete</span>
              {completionPercentage < 100 && (
                <span className="hidden md:block text-xs text-gray-500">Add a default delivery address to unlock instant 1-click checkout</span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[#E50914] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-[#E50914]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Wishlist Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{wishlistItems.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Reward Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rewardPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Animated Sliding Tab Navigation */}
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-gray-900 rounded-2xl shadow-sm dark:shadow-neu-dark p-2 flex overflow-x-auto hide-scrollbar webkit-overflow-scrolling-touch snap-x snap-mandatory">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{ scrollSnapAlign: "start" }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors z-10 justify-center shrink-0 min-w-max
                ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[#E50914] rounded-xl -z-10 shadow-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Implementation */}
      <div className="bg-white dark:bg-[#0a0a0c] border border-gray-100 dark:border-gray-900 rounded-2xl p-4 md:p-8 shadow-sm dark:shadow-neu-dark min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'orders' && <OrdersTab orders={orders} />}
            {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} />}
            {activeTab === 'wishlist' && <WishlistTab items={wishlistItems} />}
            {activeTab === 'security' && <SecurityTab />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
