import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Calendar, Clock, ChevronRight, AlertCircle, CheckCircle2, Truck, X, Phone, Home, RefreshCcw, Ban, KeyRound, Copy, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReplacementModal from '../components/ReplacementModal';

export default function TrackOrder() {
  const location = useLocation();
  const [orderNumber, setOrderNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeType, setChangeType] = useState<'cancel' | 'address' | 'mobile' | 'return' | null>(null);
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState<any>({
    house: '', street: '', city: '', state: '', pincode: '', landmark: ''
  });
  const [submittingChange, setSubmittingChange] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  const isNonReturnable = result?.order?.isReturnable === false || result?.order?.productSnapshot?.isReturnable === false;

  useEffect(() => {
    if (location.state?.orderNumber && location.state?.mobile) {
      setOrderNumber(location.state.orderNumber);
      setMobile(location.state.mobile);
      // Auto trigger track
      handleTrack(null, location.state.orderNumber, location.state.mobile);
    }
  }, [location.state]);

  const handleTrack = async (e: any, forcedOrder?: string, forcedMobile?: string) => {
    if (e) e.preventDefault();
    const targetOrder = forcedOrder || orderNumber;
    const targetMobile = forcedMobile || mobile;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: targetOrder, mobile: targetMobile })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.order.customerMobile) {
          setNewMobile(data.order.customerMobile);
        }
      } else if (e) {
        toast.error(data.error || 'Order not found');
      }
    } catch (err) {
      if (e) toast.error('Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const isWithin24Hours = (date: string) => {
    const createdAt = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const handleSubmitRequest = async () => {
    if (!changeType) return;
    if (changeType === 'return' && isNonReturnable) {
      toast.error('This product is non-returnable (No Return Policy). Return option is blocked.');
      setShowChangeModal(false);
      return;
    }
    
    setSubmittingChange(true);
    try {
      const res = await fetch(`/api/orders/${result.order.id}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: changeType,
          mobile,
          requestedValue: changeType === 'address' ? newAddress : changeType === 'mobile' ? { mobile: newMobile } : changeType === 'return' ? { reason: returnReason } : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowChangeModal(false);
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSubmittingChange(false);
    }
  };

  const OrderStatusTracker = ({ status }: { status: string }) => {
    const stages = ['Placed', 'Processing', 'Shipped', 'Delivered'];
    
    const getStatusIndex = (s: string) => {
      if (s === 'Order Placed') return 0;
      if (s === 'Payment Verification Pending' || s === 'Payment Verified' || s === 'Processing') return 1;
      if (s === 'Shipped' || s === 'Out for Delivery') return 2;
      if (s === 'Delivered') return 3;
      return -1;
    };

    const currentIndex = getStatusIndex(status);
    const isCancelled = status === 'Cancelled';
    const isReturned = status === 'Returned';

    if (isCancelled || isReturned) {
      return (
        <div className="my-6 p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
          <p className={`text-xs font-bold text-center ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            Order {status}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-8 mb-12 px-2">
        <div className="relative flex justify-between">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -translate-y-1/2" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 -translate-y-1/2 transition-all duration-500" 
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
          
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentIndex;
            const isActive = idx === currentIndex;
            
            return (
              <div key={stage} className="relative flex flex-col items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 z-10 transition-all ${
                  isActive ? 'bg-indigo-600 border-white dark:border-gray-900 ring-4 ring-indigo-100 dark:ring-indigo-900/30 shadow-lg shadow-indigo-200 dark:shadow-none' :
                  isCompleted ? 'bg-indigo-600 border-indigo-600' :
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' :
                  isCompleted ? 'text-gray-900 dark:text-white' :
                  'text-gray-400'
                }`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 transition-colors">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Track My Order</h1>
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Order ID</label>
              <input
                type="text"
                placeholder="e.g. ORD-12345"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none font-mono text-gray-900 dark:text-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="10-digit number"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Track My Order</>}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6">

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Current Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2.5 h-2.5 ${result.order.orderStatus === 'Cancelled' ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`} />
                  <p className="text-xl font-black text-gray-900 dark:text-white">{result.order.orderStatus}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                result.order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' :
                result.order.orderStatus === 'Out for Delivery' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400 dark:border-amber-600' :
                result.order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700' :
                result.order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-700' :
                'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
              }`}>
                {result.order.orderStatus}
              </span>
            </div>

            <OrderStatusTracker status={result.order.orderStatus} />

            {/* Out for Delivery - Customer Delivery OTP Card */}
            {result.order.orderStatus === 'Out for Delivery' && result.order.deliveryOtp && (
              <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-400 dark:border-amber-500 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-gray-950 flex items-center justify-center font-black shadow-sm shrink-0">
                      <Truck className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                          Package Out For Delivery
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white mt-1">Delivery OTP</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Share this OTP with your delivery agent upon receiving your package.
                      </p>
                    </div>
                  </div>
                  <div className="text-center bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-amber-300 dark:border-amber-700/60 shadow-sm shrink-0 flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Your Delivery OTP</p>
                      <p className="text-2xl font-black font-mono tracking-widest text-amber-600 dark:text-amber-400">
                        {result.order.deliveryOtp}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(result.order.deliveryOtp);
                        toast.success('Delivery OTP copied!');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delivered Status Details */}
            {result.order.orderStatus === 'Delivered' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-tight">Delivery Confirmation</p>
                    {result.order.deliveryVerifiedWithOtp ? (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-bold">
                        ✓ Package delivered successfully (Verified with OTP: {result.order.deliveryOtp}).
                      </p>
                    ) : result.order.deliveryReason ? (
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 space-y-1">
                        <span className="font-bold">Delivered without OTP. Delivery note / reason:</span>
                        <p className="italic bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-medium text-gray-900 dark:text-white">
                          {result.order.deliveryReason}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Package delivered successfully.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.order.orderStatus === 'Cancelled' && result.order.cancellationReason && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-2xl flex gap-3 transition-colors">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-tight">Reason for Cancellation</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">{result.order.cancellationReason}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-8 transition-colors">
              <img src={result.order.productSnapshot.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-700" />
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{result.order.productSnapshot.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Qty: {result.order.quantity || 1} 
                  {result.order.selectedColor && ` • Color: ${result.order.selectedColor}`} 
                  {result.order.selectedSize && ` • Size: ${result.order.selectedSize}`} 
                  • Total: ₹{parseFloat(result.order.finalAmount).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Ordered on {format(new Date(result.order.createdAt), 'dd MMM yyyy')}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isNonReturnable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                      <Ban className="w-3 h-3 text-red-600" /> Non-Returnable Product
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40">
                      <CheckCircle2 className="w-3 h-3 text-green-600" /> 7 Days Return Available
                    </span>
                  )}
                  {result.order.orderStatus === 'Out for Delivery' && result.order.deliveryOtp && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      Delivery OTP: <span className="font-mono text-xs">{result.order.deliveryOtp}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Change Requests Section */}
            {(result.order.orderStatus !== 'Cancelled' && result.order.orderStatus !== 'Delivered') && (
              <div className="mb-8 border-t dark:border-gray-800 pt-6">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Need to change something?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {isWithin24Hours(result.order.createdAt) && (
                    <button
                      onClick={() => { setChangeType('cancel'); setShowChangeModal(true); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => { setChangeType('address'); setShowChangeModal(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" /> Edit Address
                  </button>
                  <button
                    onClick={() => { setChangeType('mobile'); setShowChangeModal(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Edit Mobile
                  </button>
                </div>
              </div>
            )}

            {result.order.orderStatus === 'Delivered' && (
              <div className="mb-8 border-t dark:border-gray-800 pt-6">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Post Delivery Options</p>
                
                <div className="space-y-4">
                  {/* Universal Product Replacement Button (Available on all products) */}
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-indigo-600" /> Universal Replacement Guarantee
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          All Products
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        Replacement allowed if product is Damaged, Defective/Not Working, Wrong Item, or Empty Box (Box MT).
                      </p>
                    </div>

                    <button
                      onClick={() => setShowReplacementModal(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Request Replacement
                    </button>
                  </div>

                  {/* Return / Refund Status */}
                  {isNonReturnable ? (
                    <div className="p-4 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3.5 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300">
                            Return / Refund Blocked (No Return Policy)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                            Non-Returnable
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">
                          Standard refund/return is blocked for this item. However, <strong>Replacement</strong> is supported above in case of damage or defects.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setChangeType('return'); setShowChangeModal(true); }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl text-sm font-bold border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all w-full sm:w-auto"
                    >
                      <RefreshCcw className="w-4 h-4" /> Request Return / Refund
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800 transition-colors">
              {result.history.map((item: any, idx: number) => (
                <div key={item.id} className="relative pl-8">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {idx === 0 ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${idx === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{item.status}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(item.updatedAt), 'dd MMM, hh:mm a')}</span>
                    </div>
                    {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl transition-colors">
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  {changeType === 'cancel' ? 'Cancel Order' : changeType === 'address' ? 'Update Address' : changeType === 'return' ? 'Request Return' : 'Update Mobile'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Request will be processed for approval</p>
              </div>
              <button onClick={() => setShowChangeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {changeType === 'cancel' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">Are you sure you want to cancel this order? This action cannot be undone once approved.</p>
                </div>
              )}

              {changeType === 'mobile' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">New Mobile Number</label>
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
                    placeholder="Enter 10-digit number"
                  />
                </div>
              )}

              {changeType === 'return' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Reason for Return</label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all min-h-[100px]"
                    placeholder="Please explain why you want to return this product..."
                  />
                </div>
              )}

              {changeType === 'address' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">House/Flat No.</label>
                    <input
                      type="text"
                      value={newAddress.house}
                      onChange={(e) => setNewAddress({...newAddress, house: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Street/Area</label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Pincode</label>
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex gap-3 transition-colors">
              <button
                onClick={() => setShowChangeModal(false)}
                className="flex-1 px-4 py-3 border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submittingChange}
                className="flex-1 px-4 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingChange ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Request Modal */}
      {result?.order && (
        <ReplacementModal
          isOpen={showReplacementModal}
          onClose={() => setShowReplacementModal(false)}
          order={result.order}
          onSuccess={() => handleTrack(null)}
        />
      )}
    </div>
  );
}
