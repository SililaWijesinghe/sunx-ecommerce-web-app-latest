import React from 'react';
import { motion } from 'motion/react';
import { Package, ShoppingBag, CreditCard, CheckCircle2, Truck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface OrderProduct {
  title: string;
  images: string[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: OrderProduct;
}

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_method: string;
  order_items: OrderItem[];
}

export function OrdersTab({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/20';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20';
      case 'shipped': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-500 dark:border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-6" />
        <h3 className="text-2xl font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">You haven't placed any orders. Discover our high-performance gear and gear up for your next adventure.</p>
        <button 
          onClick={() => navigate('/shop')}
          className="bg-[#E50914] hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-colors uppercase tracking-widest inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <ShoppingBag className="w-5 h-5" /> Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-3">
        <div className="w-2 h-8 bg-[#E50914] rounded-full"></div>
        Order History
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {orders.map((order, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={order.id} 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Order Header */}
            <div className="bg-gray-50 dark:bg-gray-950 p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-start w-full">
                <div>
                  <span className="block text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Order ID</span>
                  <span className="text-gray-900 dark:text-white font-mono font-bold text-lg">#{order.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className={`px-3 py-1.5 border rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase ${getStatusColor(order.status)} shadow-sm`}>
                  {getStatusText(order.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-sm mt-2">
                <div>
                  <span className="block text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Date Placed</span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Total Amount</span>
                  <span className="text-[#E50914] font-bold text-base">Rs. {Number(order.total_amount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Payment</span>
                  <span className="text-gray-900 dark:text-white font-bold flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {order.payment_method ? order.payment_method.replace('_', ' ').toUpperCase() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Tracker (if not cancelled) */}
            {order.status !== 'cancelled' && (
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                <div className="flex items-center justify-between max-w-3xl mx-auto relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 -z-10 rounded-full"></div>
                  
                  {/* Progress Fill */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-[#E50914] -translate-y-1/2 -z-10 rounded-full transition-all duration-1000"
                    style={{ 
                      width: order.status === 'pending_payment' ? '0%' : 
                             order.status === 'processing' ? '33%' : 
                             order.status === 'shipped' ? '66%' : '100%' 
                    }}
                  ></div>

                  {/* Steps */}
                  {[
                    { label: 'Ordered', icon: ShoppingBag, active: true },
                    { label: 'Processing', icon: Clock, active: ['processing', 'shipped', 'delivered'].includes(order.status) },
                    { label: 'In Transit', icon: Truck, active: ['shipped', 'delivered'].includes(order.status) },
                    { label: 'Delivered', icon: CheckCircle2, active: order.status === 'delivered' }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step.active ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg shadow-red-500/20' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400'}`}>
                        <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center ${step.active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Items */}
            <div className="p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Items in this order</h4>
              <div className="space-y-4">
                {order.order_items?.map((item: OrderItem) => (
                  <div key={item.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-lg p-2 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800">
                      {item.products?.images?.[0] ? (
                        <img 
                          src={item.products.images[0] || '/fallback.png'} 
                          alt={item.products?.title} 
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.products?.title || 'Unknown Product'}</h5>
                      <p className="text-xs text-gray-500 font-medium mt-1">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-[#E50914] text-sm font-bold shrink-0">
                      Rs. {Number(item.unit_price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
