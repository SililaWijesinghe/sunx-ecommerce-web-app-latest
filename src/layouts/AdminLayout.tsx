import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Hexagon, Users, RefreshCw, BarChart2 } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandLogo } from '../components/BrandLogo';
import { SmartNav } from '../components/SmartNav';
import { AdminDailyTour } from '../components/admin/AdminDailyTour';
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary';

export function AdminLayout() {
  const navigate = useNavigate();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Catalog Analytics', path: '/admin/analytics', icon: BarChart2 },
    { name: 'Add New Product', path: '/admin/add-product', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Migrator', path: '/admin/migrator', icon: RefreshCw },
  ];

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] dark:bg-gray-950 font-sans flex flex-col md:flex-row text-gray-900 dark:text-white overflow-hidden transition-colors duration-500 ease-in-out z-0">
      {/* Left Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/80 dark:bg-[#0a0a0c] backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex-col shrink-0 transition-colors duration-500 ease-in-out relative z-10">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 transition-colors duration-500 ease-in-out">
          <BrandLogo className="h-14 md:h-16 w-auto mr-2" />
          <span className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-sm border-l border-gray-200 dark:border-gray-700 pl-2">
            ADMIN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-4 ${
                  isActive
                    ? 'border-[#E50914] text-[#E50914] bg-red-50 dark:bg-gray-900/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/20'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AdminDailyTour />
        {/* Top Header */}
        
        {/* Top Header */}
        <header className="h-16 bg-white/90 dark:bg-[#050505]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0 gap-4 transition-colors duration-500 ease-in-out z-20">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center">
             <BrandLogo className="h-10 w-auto mr-2" />
             <span className="text-gray-900 dark:text-white font-bold uppercase tracking-wider text-xs border-l border-gray-200 dark:border-gray-700 pl-2">ADMIN</span>
          </div>
          <div className="flex-1 md:hidden"></div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <ThemeToggle />
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-[#E50914] dark:hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>


        <SmartNav />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-28 md:p-8 md:pb-8 bg-transparent transition-colors duration-500 ease-in-out relative z-10 overscroll-y-contain webkit-overflow-scrolling-touch">
          <div className="max-w-6xl mx-auto">
             <GlobalErrorBoundary>
               <Outlet />
             </GlobalErrorBoundary>
          </div>
        
        </main>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 w-full flex items-center justify-around h-[68px] bg-white/90 dark:bg-[#050505]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive
                    ? 'text-[#E50914]'
                    : 'text-gray-400 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(229,9,20,0.8)]' : 'stroke-[1.5]'}`} />
                  <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

