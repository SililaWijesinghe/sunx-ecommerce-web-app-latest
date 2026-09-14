import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Search, ChevronDown, ChevronUp, Package, MapPin, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products?: {
    title?: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  user_id: string;
  shipping_address: any;
  status: string;
  total_amount: number;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  order_items?: OrderItem[];
}

const ORDER_STATUSES = [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, email, avatar_url),
          order_items (
            id, quantity, unit_price,
            products (id, title, images, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-200 dark:border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">Pending</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Processing</span>;
      case 'shipped':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">Shipped</span>;
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Delivered</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-500/30">{status}</span>;
    }
  };

  const getProductImage = (product: any) => {
    if (!product) return 'https://via.placeholder.com/100';
    if (product.images && product.images.length > 0) return product.images[0];
    return 'https://via.placeholder.com/100';
  };

  const formatAddress = (addr: any) => {
    if (!addr) return 'No address provided';
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch (e) { return addr; }
    }
    return [addr.address_line_1, addr.address_line_2, addr.city, addr.postal_code, addr.country].filter(Boolean).join(', ');
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) || 
           (o.profiles?.email?.toLowerCase() || '').includes(q) ||
           (o.profiles?.full_name?.toLowerCase() || '').includes(q);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
            Orders Pipeline
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Track, manage, and process customer orders.</p>
        </div>
        <div className="w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-transparent text-sm dark:text-white transition-all shadow-sm dark:shadow-neu-dark"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c] rounded-2xl p-12 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800/50 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-[#111111] rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Orders Found</h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchQuery ? "No orders match your search." : "When customers place orders, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0a0c] rounded-none md:rounded-2xl border-0 md:border md:border-gray-100 dark:md:border-gray-800/50 shadow-none md:shadow-sm dark:md:shadow-neu-dark overflow-hidden flex flex-col space-y-4 md:space-y-0">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 pl-6 bg-gray-50 dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-widest text-gray-500 font-bold items-center">
            <div className="col-span-3">Order ID</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2 text-right flex justify-between md:block mt-2 md:mt-0 pt-2 md:pt-0 border-t border-white/5 md:border-none"><span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">Status</span>Status</div>
          </div>

          <div className="flex flex-col md:divide-y divide-gray-100 dark:divide-gray-800/50 gap-4 md:gap-0">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  key={order.id}
                  className="group flex flex-col hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors bg-[#121215] md:bg-transparent border border-white/10 md:border-none p-4 md:p-0 rounded-none relative"
                >
                  {/* Clickable Row */}
                  <div 
                    onClick={() => toggleRow(order.id)}
                    className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:p-4 md:pl-6 cursor-pointer md:items-center relative"
                  >
                    <div className="col-span-3 font-mono text-sm md:text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between md:block border-b border-white/5 md:border-none pb-2 md:pb-0">
                      <span className="md:hidden text-xs text-gray-500 font-sans mr-2">ID:</span>
                      #{order.id.slice(0, 8)}...
                    </div>
                    
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-center">
                        {order.profiles?.avatar_url ? (
                          <img src={order.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {order.profiles?.full_name || 'Guest User'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {order.profiles?.email || 'No email'}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <span className="md:hidden text-xs text-gray-400 mr-2 uppercase tracking-wider">Date:</span>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>

                    <div className="col-span-2 text-sm font-bold text-gray-900 dark:text-white">
                      <span className="md:hidden text-xs text-gray-400 mr-2 uppercase tracking-wider">Total:</span>
                      Rs. {order.total_amount.toLocaleString()}
                    </div>

                    <div className="col-span-2 flex items-center justify-between md:justify-end gap-4">
                      {getStatusBadge(order.status)}
                      <div className="text-gray-400 dark:text-gray-500 transition-transform duration-300">
                        {expandedRow === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedRow === order.id && (
                      <motion.div
                        layout
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-gray-800/50"
                      >
                        <div className="p-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Left: Items */}
                          <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                              <Package className="w-4 h-4" /> Order Items
                            </h3>
                            <div className="space-y-3">
                              {order.order_items?.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 dark:bg-[#0a0a0c] rounded-xl border border-gray-100 dark:border-gray-800/50 items-center">
                                  <img 
                                    src={getProductImage(item.products)} 
                                    className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
                                    alt="Product"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                      {item.products?.title || 'Unknown Product'}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      Qty: {item.quantity} × Rs. {item.unit_price.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-sm font-bold text-[#E50914] shrink-0">
                                    Rs. {(item.quantity * item.unit_price).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Shipping & Controls */}
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Shipping Address
                              </h3>
                              <div className="p-4 bg-gray-50 dark:bg-[#0a0a0c] rounded-xl border border-gray-100 dark:border-gray-800/50">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                  {formatAddress(order.shipping_address)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" /> Update Status
                              </h3>
                              <div className="relative">
                                {updatingStatus === order.id && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                  </div>
                                )}
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                  disabled={updatingStatus === order.id}
                                  className="w-full appearance-none bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#E50914] shadow-sm transition-all disabled:opacity-50"
                                >
                                  {ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
