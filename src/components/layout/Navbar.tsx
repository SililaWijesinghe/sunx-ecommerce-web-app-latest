
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Heart, ShoppingBag, User, Menu, X,
  Phone, Mail, MapPin, Truck, ShieldCheck, HelpCircle, ChevronDown, ChevronRight,
  Home, Grid, Scale, LogOut, Sun, Moon, LayoutDashboard,
  HardDrive, Printer, BatteryCharging, Fan, Keyboard, Plug, Cpu, Monitor, Laptop, Database, Box
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useStorefrontStore } from '../../store/useStorefrontStore';
import { useUIStore } from '../../store/useUIStore';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store/useThemeStore';
import { BrandLogo } from '../BrandLogo';
import { useDebounce } from '../../hooks/useDebounce';
import { useCategoryStore } from '../../store/useCategoryStore';
import { DynamicIcon } from '../DynamicIcon';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Laptops', href: '/#laptops' },
  { label: 'Gaming', href: '/#gaming' },
  { label: 'Computers', href: '/#computers' },
  { label: 'Accessories', href: '/#accessories' },
  { label: 'Components', href: '/#components' },
  { label: 'Networking', href: '/#networking' },
  { label: 'Deals', href: '/#deals', isHot: true },
];

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('hdd')) return HardDrive;
  if (n.includes('ink')) return Printer;
  if (n.includes('battery')) return BatteryCharging;
  if (n.includes('fan')) return Fan;
  if (n.includes('keyboard')) return Keyboard;
  if (n.includes('adapter') || n.includes('power')) return Plug;
  if (n.includes('ram')) return Cpu;
  if (n.includes('screen')) return Monitor;
  if (n.includes('laptop')) return Laptop;
  if (n.includes('ssd')) return Database;
  return Box;
};


export function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  
  const { wishlist, compareList } = useStorefrontStore();
  const wishlistCount = wishlist.length;
  const compareCount = compareList.length;

  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'customer' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debouncedTerm = useDebounce(searchTerm, 300);
  
  const [isCategoriesHovered, setIsCategoriesHovered] = useState(false);
  const { categories, fetchCategories } = useCategoryStore();

  const [wishlistBump, setWishlistBump] = useState(false);
  const [compareBump, setCompareBump] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryTree = useMemo(() => {
    const nodes: Record<string, any> = {};
    categories.forEach(item => {
      nodes[item.id] = { ...item, children: [] };
    });

    const rootNodes: any[] = [];
    Object.values(nodes).forEach(node => {
      if (node.parent_id && nodes[node.parent_id]) {
        nodes[node.parent_id].children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (ns: any[]) => {
      ns.sort((a, b) => a.name.localeCompare(b.name));
      ns.forEach(n => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [categories]);

  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);

  useEffect(() => {
    if (wishlistCount > 0) {
      setWishlistBump(true);
      const timer = setTimeout(() => setWishlistBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wishlistCount]);

  useEffect(() => {
    if (compareCount > 0) {
      setCompareBump(true);
      const timer = setTimeout(() => setCompareBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [compareCount]);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, images, price, discount_percent')
          .ilike('title', `%${debouncedTerm}%`)
          .limit(5);
          
        if (data && !error) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
    performSearch();
  }, [debouncedTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setUserRole(data.role);
      setUserProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      useUIStore.getState().openAuthGate('Log in to unlock this feature.');
    } else {
      action();
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      <header className="w-full flex flex-col z-40 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/10">
        {/* Top Utility Bar (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-between bg-[#050505] text-gray-400 text-xs py-2 px-4 lg:px-8 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-[#E50914] cursor-pointer transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span>076 760 7600 (Hotline)</span>
            </div>
            <div className="flex items-center gap-2 hover:text-[#E50914] cursor-pointer transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span>info@sunxtech.lk</span>
            </div>
            <div className="flex items-center gap-2 hover:text-[#E50914] cursor-pointer transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              <span>123, Main Street, Colombo 11, Sri Lanka</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-medium">
            <Link to="/track-order" className="flex items-center gap-1.5 hover:text-[#E50914] transition-colors">
              <Truck className="w-3.5 h-3.5" />
              Track Order
            </Link>
            <Link to="/warranty" className="flex items-center gap-1.5 hover:text-[#E50914] transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              Warranty
            </Link>
            <Link to="/help" className="flex items-center gap-1.5 hover:text-[#E50914] transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help Center
            </Link>
            <div className="flex items-center gap-1.5 hover:text-[#E50914] transition-colors cursor-pointer" onClick={() => user ? handleLogout() : navigate('/auth')}>
              <User className="w-3.5 h-3.5" />
              {user ? 'Sign Out' : 'Sign In / Register'}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-gray-100 shadow-sm relative z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 lg:gap-8">
            
            <div className="flex items-center justify-between w-full lg:w-auto">
              {/* Mobile Left: Hamburger & Logo */}
              <div className="flex items-center gap-3 lg:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-gray-900 dark:text-white p-1 -ml-1 hover:text-[#E50914] transition-colors"
                >
                  <Menu className="w-7 h-7 tap-target" />
                </button>
                <Link to="/" className="flex-shrink-0">
                  <BrandLogo className="h-10 w-auto" />
                </Link>
              </div>

              {/* Desktop Logo */}
              <Link to="/" className="hidden lg:flex flex-shrink-0">
                <BrandLogo className="h-16 md:h-24 w-auto" />
              </Link>
              
              <div className="flex lg:hidden items-center gap-2 sm:gap-4">
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 tap-target"
                  aria-label="Toggle Theme"
                >
                  <AnimatePresence mode="wait">
                    {isDarkMode ? (
                      <motion.div
                        key="dark"
                        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="w-5 h-5 stroke-[1.5]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="light"
                        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="w-5 h-5 stroke-[1.5]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {user ? (
                  <button 
                    onClick={() => userRole === 'super_admin' ? navigate('/admin') : navigate('/account')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 tap-target overflow-hidden"
                  >
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 stroke-[1.5]" />
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 tap-target"
                  >
                    <User className="w-6 h-6 stroke-[1.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Bar Only (Removed bulky Browse Shop) */}
            <div className="flex lg:hidden w-full order-last lg:order-none mt-2">
              <div className="flex w-full relative shadow-sm">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..." 
                  className="flex-1 bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-l-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-red-500 dark:focus:border-[#E50914] transition-colors dark:text-white"
                />
                <button className="bg-[#E50914] hover:bg-red-700 transition-colors px-5 flex items-center justify-center text-white rounded-r-xl">
                  {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
                
                {/* Cinematic Search Dropdown for Mobile */}
                <AnimatePresence>
                  {(searchTerm.trim() !== '') && (searchResults.length > 0 || isSearching) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0C] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-none overflow-hidden z-50"
                    >
                      {isSearching ? (
                        <div className="p-6 text-center text-gray-400 text-sm">Searching...</div>
                      ) : (
                        <div className="flex flex-col">
                          {searchResults.map(result => (
                            <Link 
                              key={result.id} 
                              to={`/product/${result.slug}`}
                              onClick={() => setSearchTerm('')}
                              className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                            >
                              <div className="w-12 h-12 bg-white/5 rounded shrink-0 flex items-center justify-center p-1">
                                {result.images && result.images[0] && (
                                  <img src={result.images[0]} alt={result.title} className="max-w-full max-h-full object-contain" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-bold truncate">{result.title}</h4>
                                <p className="text-[#E50914] text-xs font-bold mt-1">Rs. {result.price.toLocaleString()}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl relative z-[60]">
              <div className="flex w-full shadow-sm rounded-md overflow-visible border border-slate-200 dark:border-gray-800 focus-within:border-red-500 dark:focus-within:border-[#E50914] focus-within:ring-1 focus-within:ring-red-500 dark:focus-within:ring-[#E50914] transition-all bg-white dark:bg-[#111111]">
                <div 
                  className="flex items-center gap-2 px-4 bg-gray-50 dark:bg-[#0a0a0c] border-r border-gray-300 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors shrink-0 relative"
                  onMouseEnter={() => setIsCategoriesHovered(true)}
                  onMouseLeave={() => setIsCategoriesHovered(false)}
                >
                  All Categories
                  <ChevronDown className="w-4 h-4" />
                  
                  {/* Categories Mega Menu */}
                  <AnimatePresence>
                    {isCategoriesHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A0C] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-none z-50 flex flex-col py-2"
                      >
                        {categoryTree.map(cat => (
                          <div 
                            key={cat.id} 
                            className="relative group/nav-item"
                            onMouseEnter={() => setActiveSubcat(cat.id)}
                            onMouseLeave={() => setActiveSubcat(null)}
                          >
                            <Link 
                              to={`/shop?category=${cat.slug}`}
                              className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors w-full"
                            >
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const Icon = getCategoryIcon(cat.name);
                                  return <Icon className="w-4 h-4 text-gray-400 group-hover/nav-item:text-[#E50914] transition-colors" />;
                                })()}
                                <span className="text-sm text-gray-300 group-hover/nav-item:text-white transition-colors">{cat.name}</span>
                              </div>
                              {cat.children && cat.children.length > 0 && (
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover/nav-item:text-white transition-colors" />
                              )}
                            </Link>
                            
                            {/* Submenu */}
                            {cat.children && cat.children.length > 0 && activeSubcat === cat.id && (
                              <div className="absolute top-0 left-full ml-0 min-w-[200px] bg-[#0A0A0C] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col py-2">
                                {cat.children.map((child: any) => (
                                  <Link
                                    key={child.id}
                                    to={`/shop?category=${child.slug}`}
                                    className="px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#E50914] transition-colors whitespace-nowrap"
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for products..." 
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none dark:text-white placeholder:text-slate-400 font-medium"
                />
                <button className="bg-[#E50914] hover:bg-red-700 transition-colors px-6 flex items-center justify-center text-white">
                  {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* Cinematic Search Dropdown */}
              <AnimatePresence>
                {(searchTerm.trim() !== '') && (searchResults.length > 0 || isSearching) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0C] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-none overflow-hidden z-[60]"
                  >
                    {isSearching ? (
                      <div className="p-6 text-center text-gray-400 text-sm">Searching...</div>
                    ) : (
                      <div className="flex flex-col">
                        {searchResults.map(result => (
                          <Link 
                            key={result.id} 
                            to={`/product/${result.slug}`}
                            onClick={() => setSearchTerm('')}
                            className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="w-12 h-12 bg-white/5 rounded shrink-0 flex items-center justify-center p-1">
                              {result.images && result.images[0] && (
                                <img src={result.images[0]} alt={result.title} className="max-w-full max-h-full object-contain" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-bold truncate">{result.title}</h4>
                              <p className="text-[#E50914] text-xs font-bold mt-1">Rs. {result.price.toLocaleString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
              {userRole === 'super_admin' && (
                <Link to="/admin" className="text-sm font-bold bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                  Admin Panel
                </Link>
              )}
              
              <Link 
                to="/compare"
                className="flex flex-col items-center gap-1 group relative"
              >
                <motion.div 
                  animate={compareBump ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="text-gray-700 dark:text-gray-300 group-hover:text-[#E50914] dark:group-hover:text-[#E50914] transition-colors relative"
                >
                  <Scale className="w-6 h-6 stroke-[1.5]" />
                  {compareCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E50914] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">
                      {compareCount}
                    </span>
                  )}
                </motion.div>
              </Link>

              <Link 
                to="/wishlist"
                className="flex flex-col items-center gap-1 group relative"
              >
                <motion.div 
                  animate={wishlistBump ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="text-gray-700 dark:text-gray-300 group-hover:text-[#E50914] dark:group-hover:text-[#E50914] transition-colors relative"
                >
                  <Heart className="w-6 h-6 stroke-[1.5]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E50914] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </motion.div>
              </Link>

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300"
                aria-label="Toggle Theme"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="dark"
                      initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5 stroke-[1.5]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="light"
                      initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5 stroke-[1.5]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <button onClick={openCart} className="flex items-center gap-3 group relative">
                <div className="text-gray-700 dark:text-gray-300 group-hover:text-[#E50914] dark:group-hover:text-[#E50914] transition-colors relative">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E50914] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Cart</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Rs. {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </button>

              {user ? (
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-[#E50914] ring-2 ring-transparent hover:ring-[#E50914] ring-offset-1 dark:ring-offset-[#0a0a0c] transition-all duration-300 flex items-center justify-center shadow-sm">
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-64 bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden z-[70] py-2"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {userProfile?.full_name || 'My Account'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              navigate('/account');
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-3 font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            My Dashboard
                          </button>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-800/60 pt-2">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-3 font-medium"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/auth')}
                    className="flex flex-col items-center gap-1 group relative ml-2"
                  >
                    <div className="text-gray-700 dark:text-gray-300 group-hover:text-[#E50914] dark:group-hover:text-[#E50914] transition-colors">
                      <User className="w-6 h-6 stroke-[1.5]" />
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:block bg-white dark:bg-[#0a0a0c] border-b border-gray-100 dark:border-gray-900 shadow-sm relative z-10">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-8">
            <Link to="/shop" className="group bg-[#E50914] hover:bg-[#ff0f1f] text-white flex items-center justify-between px-6 py-3.5 font-black text-sm w-[260px] transition-all relative overflow-hidden shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:shadow-[0_0_25px_rgba(229,9,20,0.6)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              <div className="flex items-center gap-3 relative z-10">
                <Grid className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                <span className="tracking-widest uppercase">Browse Shop</span>
              </div>
              <div className="relative z-10 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
            </Link>
            <ul className="flex items-center gap-8 flex-1">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className={`text-sm font-semibold transition-colors flex items-center gap-1 hover:text-[#E50914] ${
                      location.pathname === link.href ? 'text-[#E50914]' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {link.label}
                    {link.isHot && (
                      <span className="bg-[#E50914] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
                        Hot
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[80] lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-[#0A0A0C] z-[90] lg:hidden flex flex-col shadow-2xl border-r border-gray-200 dark:border-white/10"
            >
              <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                <BrandLogo className="h-8 w-auto" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Quick Links
                </div>
                <div className="flex flex-col mb-8">
                  {NAV_LINKS.map(link => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#E50914] dark:hover:text-[#E50914] transition-colors flex items-center gap-2"
                    >
                      {link.label}
                      {link.isHot && (
                        <span className="bg-[#E50914] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          Hot
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                <div className="px-4 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Categories
                </div>
                <div className="flex flex-col">
                  {categoryTree.map(cat => {
                    const Icon = getCategoryIcon(cat.name);
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#E50914] transition-colors" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </>
  );
}
