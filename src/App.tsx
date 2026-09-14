import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useThemeStore } from './store/useThemeStore';
import { Navbar } from './components/layout/Navbar';
import { SidebarCategories } from './components/layout/SidebarCategories';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { HomePage } from './pages/HomePage';
import { ProductDetails } from './pages/ProductDetails';
import { WishlistPage } from './pages/storefront/Wishlist';
import { ComparePage } from './pages/storefront/Compare';
import { Checkout } from './pages/Checkout';
import { SearchPage } from './pages/storefront/Search';
import { ContactPage } from './pages/storefront/Contact';
import { AdminLogin } from './components/auth/AdminLogin';
import { IdentityGuard } from './components/IdentityGuard';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthGateModal } from './components/AuthGateModal';
import { Auth } from './pages/Auth';
import { OrderSuccess } from './pages/OrderSuccess';
import { Account } from './pages/Account';

// Lazy loaded heavy route components
const Shop = React.lazy(() => import('./pages/storefront/Shop').then(m => ({ default: m.Shop })));
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const CatalogAnalytics = React.lazy(() => import('./pages/admin/CatalogAnalytics').then(m => ({ default: m.CatalogAnalytics })));
const ProductList = React.lazy(() => import('./pages/admin/ProductList').then(m => ({ default: m.ProductList })));
const OrderList = React.lazy(() => import('./pages/admin/OrderList').then(m => ({ default: m.OrderList })));
const Customers = React.lazy(() => import('./pages/admin/Customers').then(m => ({ default: m.Customers })));
const AdminProductForm = React.lazy(() => import('./components/admin/AdminProductForm').then(m => ({ default: m.AdminProductForm })));
const ProductInsertionForm = React.lazy(() => import('./components/admin/ProductInsertionForm').then(m => ({ default: m.ProductInsertionForm })));
const WooCommerceMigrator = React.lazy(() => import('./components/admin/WooCommerceMigrator').then(m => ({ default: m.WooCommerceMigrator })));
import { Toaster } from 'react-hot-toast';
import { SmartNav } from './components/SmartNav';
import { ScrollToTop } from './components/shared/ScrollToTop';

function StorefrontLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isShop = location.pathname === '/shop';
  
  // The home page and shop page handle their own max widths and sidebars
  const isFullWidth = isShop || isHome;

  return (
    <div className="min-h-[100dvh] w-full bg-[#F5F5F7] dark:bg-[#0B0B0E] text-[#1D1D1F] dark:text-gray-100 flex flex-col font-sans transition-colors duration-500 ease-in-out relative overflow-x-hidden">
      <Navbar />
      <SmartNav />
      
      <main className={`flex-1 w-full mx-auto flex ${isFullWidth ? '' : 'max-w-7xl px-4 py-6 gap-6'}`}>
        {/* Left Sidebar Layout (Hide on Shop and Home as they have their own) */}
        {!isFullWidth && (
          <div className="hidden lg:block flex-shrink-0 relative">
            <div className="sticky top-6">
               <SidebarCategories />
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', color: '#fff', border: '1px solid #374151' } }} />
      <AuthGateModal />
      <CartDrawer />
      {/* <AIShoppingAssistant /> */}
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-gray-500">Loading...</div>}>
        <Routes>
          {/* Public Storefront Routes */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout" element={
              <IdentityGuard allowedRole="customer">
                <Checkout />
              </IdentityGuard>
            } />
          </Route>

          <Route path="/auth" element={<Auth />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/account" element={
            <IdentityGuard allowedRole="customer">
              <Account />
            </IdentityGuard>
          } />

          {/* Public Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <IdentityGuard allowedRole="super_admin">
                <AdminLayout />
              </IdentityGuard>
            }
          >
            {/* Default admin route */}
            <Route index element={<ProductList />} />
            {/* Catalog Analytics route */}
            <Route path="analytics" element={<CatalogAnalytics />} />
            {/* Add Product route */}
            <Route path="add-product" element={<ProductInsertionForm />} />
            {/* Edit Product route */}
            <Route path="products/edit/:id" element={<AdminProductForm />} />
            {/* Orders route */}
            <Route path="orders" element={<OrderList />} />
            {/* Customers route */}
            <Route path="customers" element={<Customers />} />
            {/* WooCommerce Migrator route */}
            <Route path="migrator" element={<WooCommerceMigrator />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
