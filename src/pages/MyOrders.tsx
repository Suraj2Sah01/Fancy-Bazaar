import { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, ArrowLeft, Truck, KeyRound, Copy, LogIn, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import ReplacementModal from '../components/ReplacementModal';

export default function MyOrders() {
  const { customer, isAuthenticated, loading: authLoading, openAuthModal } = useCustomerAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedOrderForReplacement, setSelectedOrderForReplacement] = useState<any | null>(null);
  const navigate = useNavigate();

  // Active mobile from customer context or localStorage cache
  const activeMobile = customer?.mobile || 
    localStorage.getItem('customer_mobile') || 
    localStorage.getItem('fancybazaar_member_mobile') || 
    '';

  const fetchOrders = async (targetMobile: string) => {
    if (!targetMobile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/my-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: targetMobile })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(Array.isArray(data) ? data : []);
        setHasFetched(true);
      } else {
        toast.error(data.error || 'Failed to fetch orders');
      }
    } catch {
      toast.error('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  // Direct auto-fetch as soon as activeMobile is available
  useEffect(() => {
    if (activeMobile) {
      fetchOrders(activeMobile);
    }
  }, [activeMobile]);

  const handleTrack = (orderNumber: string) => {
    navigate('/track', { state: { orderNumber, mobile: activeMobile } });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white transition-colors">My Orders</h1>
            {activeMobile && (
              <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                Orders linked to +91 {activeMobile}
              </p>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Log In
          </button>
        )}
      </div>

      {/* Initial Auth Checking Loader */}
      {authLoading && !activeMobile && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Verifying session...</p>
        </div>
      )}

      {/* If Not Logged In: Show Direct Login Screen (No Phone Number Input Form) */}
      {!authLoading && !activeMobile && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-800 shadow-sm mb-6 transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Log In to View Your Orders</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Please log in with your registered mobile number. All your previous and current orders will open directly.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => openAuthModal('login')}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Log In to View Orders
            </button>
          </div>
        </div>
      )}

      {/* Order Loading Spinner */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading your orders...</p>
        </div>
      )}

      {/* Orders List for Logged-In User */}
      {!loading && activeMobile && hasFetched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-sm text-gray-900 dark:text-white">
              {orders.length} Order{orders.length !== 1 ? 's' : ''} Placed
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Synced with +91 {activeMobile}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
              <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white">No orders found</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You haven't placed any orders with +91 {activeMobile} yet.
              </p>
              <Link
                to="/"
                className="mt-5 inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Top Bar with Order Number & ONLY Clean Current Status */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-850">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {order.orderNumber}
                      </p>
                    </div>

                    {/* ONLY Current Status is displayed clearly */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' :
                        order.orderStatus === 'Out for Delivery' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400 dark:border-amber-600' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200' :
                        order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300' :
                        'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                      }`}>
                        Current Status: {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
                      <img src={order.productSnapshot?.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{order.productSnapshot?.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-black text-gray-900 dark:text-white">₹{parseFloat(order.finalAmount || '0').toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Qty: {order.quantity || 1}</p>
                        {order.selectedColor && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 border-l border-gray-100 dark:border-gray-800 pl-2">Color: {order.selectedColor}</p>
                        )}
                        {order.selectedSize && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 border-l border-gray-100 dark:border-gray-800 pl-2">Size: {order.selectedSize}</p>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Ordered on {format(new Date(order.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Out for Delivery - Clean Delivery OTP Card */}
                  {order.orderStatus === 'Out for Delivery' && order.deliveryOtp && (
                    <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400 dark:border-amber-500/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-black shrink-0">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300">
                            Delivery OTP: <span className="font-mono text-xs font-black">{order.deliveryOtp}</span>
                          </p>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            Share with courier upon receiving package
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(order.deliveryOtp);
                          toast.success('Delivery OTP copied!');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-200 border border-amber-300 rounded-lg flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  )}

                  {/* Delivered Notes / Reason */}
                  {order.orderStatus === 'Delivered' && order.deliveryReason && (
                    <div className="mx-4 mb-3 p-2.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-orange-900 dark:text-orange-300 uppercase">Delivery Note:</span>
                      <p className="italic text-gray-900 dark:text-gray-200 mt-0.5">{order.deliveryReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <button
                      onClick={() => handleTrack(order.orderNumber)}
                      className="flex-grow flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Track Order
                    </button>
                    {order.orderStatus === 'Delivered' && (
                      <button
                        onClick={() => setSelectedOrderForReplacement(order)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Replace
                      </button>
                    )}
                    {order.productSnapshot?.id && (
                      <Link
                        to={`/product/${order.productSnapshot.id}`}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      >
                        Buy Again
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Replacement Request Modal */}
      {selectedOrderForReplacement && (
        <ReplacementModal
          isOpen={Boolean(selectedOrderForReplacement)}
          onClose={() => setSelectedOrderForReplacement(null)}
          order={selectedOrderForReplacement}
          onSuccess={() => fetchOrders(activeMobile)}
        />
      )}
    </div>
  );
}
