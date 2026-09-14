import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, Heart, ShoppingBag, Search, X, LogIn, UserPlus, ShieldCheck, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../../store/useCartStore';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { supabase } from '../../lib/supabaseClient';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { wishlist } = useStorefrontStore();
  const wishlistCount = wishlist.length;

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'customer' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (data) {
      setUserRole(data.role);
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Shop', path: '/shop', icon: Grid },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Wish', path: '/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'Cart', path: '#cart', icon: ShoppingBag, badge: cartCount, onClick: () => useCartStore.getState().openCart() },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-[68px] px-1">
          {navItems.map((item) => {
            const isActive = item.path === '#cart' ? isCartOpen : location.pathname === item.path;
            const Icon = item.icon;

            const Content = (
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center justify-center w-full h-full relative space-y-1 transition-colors tap-target ${
                  isActive ? 'text-[#E50914]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]' : 'stroke-[1.5]'}`} />
                  {item.badge ? (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 bg-[#E50914] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                    >
                      {item.badge}
                    </motion.span>
                  ) : null}
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-indicator"
                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,1)]"
                  />
                )}
              </motion.div>
            );

            if (item.onClick) {
              return (
                <button key={item.label} onClick={item.onClick} className="flex-1 h-full focus:outline-none">
                  {Content}
                </button>
              );
            }

            return (
              <Link key={item.label} to={item.path} className="flex-1 h-full focus:outline-none">
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
