import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Calendar, MapPin, MessageCircle, ChevronRight, Truck, Wallet, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isUpdatingUtr, setIsUpdatingUtr] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('last_order');
    if (!saved) {
      navigate('/');
      return;
    }
    const parsedOrder = JSON.parse(saved);
    setOrder(parsedOrder);
    if (parsedOrder.utrReference) {
      setUtrSubmitted(true);
    }

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, [navigate]);

  const handleUpdateUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim()) return;

    setIsUpdatingUtr(true);
    try {
      const res = await fetch('/api/orders/upi-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, utr: utrInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('UTR submitted successfully! Verification in progress.');
        setUtrSubmitted(true);
        const updated = { ...order, utrReference: utrInput.trim() };
        setOrder(updated);
        localStorage.setItem('last_order', JSON.stringify(updated));
      } else {
        toast.error(data.error || 'Failed to update UTR');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsUpdatingUtr(false);
    }
  };

  if (!order) return null;

  const product = order.productSnapshot;
  const whatsappNumber = settings?.general?.whatsappSupportNumber || '918870472700';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce transition-colors">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 transition-colors">Order Confirmed!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto transition-colors">
          {order.paymentMethod === 'UPI' 
            ? (order.paymentStatus === 'Verified'
                ? `Payment of ₹${parseFloat(order.finalAmount).toLocaleString()} deducted from your UPI account. Your order is confirmed!`
                : "Your order has been booked! Your UPI payment is being verified and your order will be packed shortly.")
            : "Your order has been placed successfully. Payment will be collected on delivery."}
        </p>
      </div>

      <div className="space-y-6">
        
        {/* UPI Verification Box */}
        {order.paymentMethod === 'UPI' && (
          <div className={`p-5 rounded-3xl border space-y-3 ${
            order.paymentStatus === 'Verified'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border-green-200 dark:border-green-900/40'
              : 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border-indigo-100 dark:border-indigo-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className={`w-5 h-5 ${order.paymentStatus === 'Verified' ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {order.paymentStatus === 'Verified' ? 'UPI Payment Deducted & Verified' : 'UPI Payment Verification'}
                </span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                order.paymentStatus === 'Verified'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
              }`}>
                {order.paymentStatus === 'Verified' ? '✓ Paid & Deducted' : 'Verification Pending'}
              </span>
            </div>

            {order.paymentStatus === 'Verified' ? (
              <div className="flex items-center justify-between p-3.5 bg-white/90 dark:bg-gray-900/90 rounded-2xl text-xs font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Amount Deducted: <strong>₹{parseFloat(order.finalAmount).toLocaleString()}</strong></span>
                </div>
                {order.utrReference && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                    Ref: {order.utrReference}
                  </span>
                )}
              </div>
            ) : (utrSubmitted || order.utrReference) ? (
              <div className="flex items-center gap-2 p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200">
                <Check className="w-4 h-4 text-green-600" />
                <span>UTR Submitted: <strong>{order.utrReference || utrInput}</strong></span>
              </div>
            ) : (
              <form onSubmit={handleUpdateUtr} className="space-y-2 pt-1">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Already paid? Enter your 12-digit UPI UTR / Reference No. to speed up verification:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingUtr || !utrInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isUpdatingUtr ? 'Saving...' : 'Submit UTR'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors">

          <div className="flex justify-between items-center pb-4 border-b dark:border-gray-800 transition-colors">
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Order ID</p>
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date & Time</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{format(new Date(order.createdAt), 'dd-MM-yyyy hh:mm a')}</p>
            </div>
          </div>

          {order.orders && Array.isArray(order.orders) && order.orders.length > 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b dark:border-gray-800">
                <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Wishlist Bundle: {order.orders.length} Items Ordered Together
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-white">
                  Total: ₹{parseFloat(order.finalAmount || order.totalAmount).toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {order.orders.map((subOrder: any, idx: number) => {
                  const p = subOrder.productSnapshot;
                  return (
                    <div key={idx} className="flex gap-3.5 p-3 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <img src={p?.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{p?.name}</h4>
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
                            {subOrder.orderNumber}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-sm font-black text-gray-900 dark:text-white">₹{parseFloat(subOrder.finalAmount).toLocaleString()}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            Qty: {subOrder.quantity || 1}
                          </span>
                          {subOrder.selectedColor && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              Color: {subOrder.selectedColor}
                            </span>
                          )}
                          {subOrder.selectedSize && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              Size: {subOrder.selectedSize}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <img src={product?.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border border-gray-100 dark:border-gray-800 transition-colors" />
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 dark:text-white transition-colors">{product?.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1 transition-colors">{product?.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-gray-900 dark:text-white transition-colors">₹{parseFloat(order.finalAmount).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentMethod === 'COD' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    {order.paymentMethod}
                  </span>
                  {order.selectedColor && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors">
                      Color: {order.selectedColor}
                    </span>
                  )}
                  {order.selectedSize && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors">
                      Size: {order.selectedSize}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t dark:border-gray-800 space-y-4 transition-colors">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Delivery Address</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                  {order.address.name}, {order.address.house}, {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/track"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-4 rounded-2xl font-bold text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Track Order
          </Link>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I placed order ${order.orderNumber} for ₹${parseFloat(order.finalAmount).toLocaleString()}. Please confirm my payment and shipment.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-2xl font-bold text-sm hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Support
          </a>
        </div>

        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          Continue Shopping
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
