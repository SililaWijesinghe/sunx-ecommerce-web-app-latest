import { Search, Heart, ShoppingCart, User, Hexagon, ChevronDown, LogOut } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function TopHeader() {
  const cartItems = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const wishlistItems = useWishlistStore((state) => state.items);
  
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  return (
    <header className="bg-white py-5 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-8">
        
        {/* Logo */}
        <a href="/" className="flex flex-col flex-shrink-0 w-[240px] justify-center">
          <img src="/primary-logo.png" alt="SUNX Technologies" className="h-[48px] object-contain object-left" />
        </a>

        {/* Search Bar */}
        <div className="flex-1 max-w-3xl flex">
          <div className="flex w-full border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-red-600 transition-colors">
            {/* Category Dropdown */}
            <button className="flex items-center gap-2 px-4 bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              All
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Input */}
            <input 
              type="text" 
              placeholder="Search for products, brands and more..." 
              className="flex-1 px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
            />
            
            {/* Search Button */}
            <button className="bg-red-600 hover:bg-red-700 transition-colors px-6 flex items-center justify-center text-white">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <button className="flex flex-col items-center gap-1 group">
            <div className="text-gray-600 group-hover:text-red-600 transition-colors">
              <Hexagon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">Compare</span>
          </button>

          <button className="flex flex-col items-center gap-1 group relative">
            <div className="text-gray-600 group-hover:text-red-600 transition-colors relative">
              <Heart className="w-6 h-6 stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">Wishlist</span>
          </button>

          <button onClick={openCart} className="flex flex-col items-center gap-1 group relative">
            <div className="text-gray-600 group-hover:text-red-600 transition-colors relative">
              <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">Cart</span>
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/account')} className="flex flex-col items-center gap-1 group">
                <div className="text-gray-600 group-hover:text-red-600 transition-colors">
                  <User className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">My Account</span>
              </button>
              <button onClick={handleLogout} className="flex flex-col items-center gap-1 group">
                <div className="text-gray-600 group-hover:text-red-600 transition-colors">
                  <LogOut className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">Log Out</span>
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="flex flex-col items-center gap-1 group">
              <div className="text-gray-600 group-hover:text-red-600 transition-colors">
                <User className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-red-600">Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
