import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Search, 
  Users, 
  MoreVertical, 
  Copy, 
  History, 
  User, 
  Loader2,
  Calendar,
  Filter,
  X,
  MapPin,
  Phone,
  Mail,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  created_at: string;
  role: string;
  address_line_1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export function Customers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [showOrders, setShowOrders] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

      if (error) throw error;
      setCustomers(data as CustomerProfile[]);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (userId: string) => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total_amount')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string | null) => {
    e.stopPropagation();
    if (!email) {
      toast.error('No email address available');
      return;
    }
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard!');
  };

  const toggleOrders = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOrders && selectedCustomer) {
      fetchCustomerOrders(selectedCustomer.id);
    }
    setShowOrders(!showOrders);
  };

  const closeCustomerModal = () => {
    setSelectedCustomer(null);
    setShowOrders(false);
  };

  // Stats calculation
  const totalCustomers = customers.length;
  const newCustomersThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return customers.filter(c => new Date(c.created_at) > oneWeekAgo).length;
  }, [customers]);

  // Search & Sort
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c => c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'az') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }
      return 0;
    });

    return result;
  }, [customers, searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
            Customers
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage and view registered store users.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-[#0a0a0c] px-6 py-4 rounded-xl border border-gray-100 dark:border-gray-800/50 shadow-sm flex items-center gap-4 dark:shadow-neu-dark"
          >
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#E50914]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-[#0a0a0c] px-6 py-4 rounded-xl border border-gray-100 dark:border-gray-800/50 shadow-sm flex items-center gap-4 dark:shadow-neu-dark"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+{newCustomersThisWeek}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0a0a0c] p-4 rounded-xl border border-gray-100 dark:border-gray-800/50 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-sm dark:text-white transition-all shadow-sm dark:shadow-neu-dark-inset"
          />
        </div>

        <div className="relative flex items-center w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-48 pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E50914] text-sm dark:text-white appearance-none cursor-pointer shadow-sm dark:shadow-neu-dark-inset font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
        </div>
      ) : filteredAndSortedCustomers.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c] rounded-2xl p-12 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800/50 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#111111] rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Customers Found</h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchQuery ? 'Try adjusting your search filters.' : 'There are currently no customers registered in the system.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredAndSortedCustomers.map((customer) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.02)" }}
                transition={{ duration: 0.2 }}
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowOrders(false);
                }}
                className="bg-white dark:bg-[#0a0a0c] cursor-pointer rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm hover:shadow-md dark:shadow-neu-dark transition-all relative group overflow-hidden flex flex-col"
              >
                {/* Action Menu (Hover) */}
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative group/menu">
                    <button 
                      onClick={(e) => e.stopPropagation()} 
                      className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#121215] rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all origin-top-right z-20">
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setShowOrders(true);
                            fetchCustomerOrders(customer.id);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                          <History className="w-4 h-4" />
                          View Order History
                        </button>
                        <button 
                          onClick={(e) => handleCopyEmail(e, customer.email)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 mb-4 shadow-sm relative">
                    {customer.avatar_url ? (
                      <img src={customer.avatar_url} alt={customer.full_name || 'Customer'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-400">
                          {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate w-full">
                    {customer.full_name || 'Unnamed Customer'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full mt-1">
                    {customer.email || 'No email provided'}
                  </p>
                  
                  {customer.phone && (
                    <span className="mt-3 inline-flex px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                      {customer.phone}
                    </span>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800/50 flex justify-between items-center text-xs text-gray-500 font-medium group-hover:bg-transparent transition-colors">
                  <span>Joined</span>
                  <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Animated Customer Details Popup */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCustomerModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />
            
            {/* Content Card */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[calc(100%-2rem)] max-w-md mx-auto bg-white dark:bg-[#121215] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800/50 flex flex-col z-10 mt-12 mb-12"
            >
              {/* Top Accent Line */}
              <div className="h-2 w-full bg-gradient-to-r from-red-600 via-[#E50914] to-red-600 rounded-t-3xl" />
              
              <button 
                onClick={closeCustomerModal}
                className="absolute top-4 right-4 p-2 bg-gray-100/50 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors text-gray-500 dark:text-gray-300 z-30"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Overlapping Avatar */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white dark:border-[#121215] z-20 shadow-lg bg-white dark:bg-[#121215] overflow-hidden flex items-center justify-center">
                {selectedCustomer.avatar_url ? (
                  <img src={selectedCustomer.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-400">
                    {selectedCustomer.full_name ? selectedCustomer.full_name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </span>
                )}
              </div>
              
              <div className="px-8 pt-14 pb-6 flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {selectedCustomer.full_name || 'Unnamed Customer'}
                </h2>
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedCustomer.email || 'No email provided'}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedCustomer.phone}</span>
                  </div>
                )}
              </div>

              {/* Details Body */}
              <div className="px-8 py-6 bg-gray-50 dark:bg-[#0a0a0c] border-t border-gray-100 dark:border-gray-800/50 flex-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Joined Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                      {new Date(selectedCustomer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {(selectedCustomer.address_line_1 || selectedCustomer.city) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Shipping Address
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-300 leading-relaxed">
                        {selectedCustomer.address_line_1 && <>{selectedCustomer.address_line_1}<br/></>}
                        {[selectedCustomer.city, selectedCustomer.postal_code, selectedCustomer.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order History Expansion */}
              <AnimatePresence>
                {showOrders && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] border-t border-gray-100 dark:border-gray-800/50"
                  >
                    <div className="px-8 py-6 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Recent Orders
                      </h4>
                      
                      {ordersLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 text-[#E50914] animate-spin" />
                        </div>
                      ) : customerOrders.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No previous orders found.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {customerOrders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-[#111111] p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                  {order.status}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#E50914]">
                                  Rs. {order.total_amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="p-6 bg-white dark:bg-[#121215] flex gap-3 rounded-b-3xl">
                <button 
                  onClick={closeCustomerModal}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-[#0a0a0c] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={toggleOrders}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    showOrders 
                      ? 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-gray-900/20' 
                      : 'bg-[#E50914] hover:bg-red-700 text-white shadow-red-900/20'
                  }`}
                >
                  <History className="w-4 h-4" />
                  {showOrders ? 'Hide Orders' : 'Orders'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
