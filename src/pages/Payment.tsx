import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, Lock, ChevronDown, ChevronUp, ThumbsUp, 
  Wallet, Banknote, CreditCard, Calendar, PieChart, 
  Clock, Copy, Check, Download, QrCode, ExternalLink, AlertCircle, Ban,
  Truck, ShieldCheck, Package, Receipt, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import { useMembership } from '../context/MembershipContext';

export default function Payment() {
  const navigate = useNavigate();
  const { isMember, daysRemaining } = useMembership();
  const [product, setProduct] = useState<any>(null);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  // Active expanded section: 'UPI_APP' | 'QR_CODE' | 'COD' | null
  const [expandedSection, setExpandedSection] = useState<'UPI_APP' | 'QR_CODE' | 'COD' | null>('UPI_APP');
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(true);
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    const savedItems = localStorage.getItem('checkout_items');
    const savedProduct = localStorage.getItem('checkout_product');
    const savedAddress = localStorage.getItem('checkout_address');

    if ((!savedProduct && !savedItems) || !savedAddress) {
      navigate('/');
      return;
    }

    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        if (Array.isArray(items) && items.length > 0) {
          setCheckoutItems(items);
          setProduct(items[0]);
        }
      } catch {}
    }

    if (savedProduct) {
      try {
        const prod = JSON.parse(savedProduct);
        if (!savedItems || savedItems === '[]') {
          setProduct(prod);
          setCheckoutItems([prod]);
        }
      } catch {}
    }

    try {
      setAddress(JSON.parse(savedAddress));
    } catch {}

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, [navigate]);

  if ((!product && checkoutItems.length === 0) || !address || !settings) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading payments...</p>
      </div>
    );
  }

  const regularSubtotal = checkoutItems.reduce((acc, item) => {
    const reg = parseFloat(item.regularPrice || item.sellingPrice) || 0;
    return acc + (reg * (item.quantity || 1));
  }, 0);

  const payableSubtotal = checkoutItems.reduce((acc, item) => {
    const reg = parseFloat(item.regularPrice || item.sellingPrice) || 0;
    const prem = parseFloat(item.premiumPrice) || (reg * 0.75);
    const unit = isMember ? prem : reg;
    return acc + (unit * (item.quantity || 1));
  }, 0);

  const subtotal = regularSubtotal;
  // Formula: Discount percentage = ((Regular Price - Premium Price) / Regular Price) * 100
  const memberDiscount = isMember ? Math.max(0, regularSubtotal - payableSubtotal) : 0;
  const actualDiscountPercent = regularSubtotal > 0 && memberDiscount > 0
    ? (((memberDiscount) / regularSubtotal) * 100).toFixed(1)
    : '0';

  const shipping = isMember ? 0 : checkoutItems.reduce((acc, item) => acc + (parseFloat(item.shippingCharges || '0') || 0), 0);
  const additional = checkoutItems.reduce((acc, item) => acc + (parseFloat(item.additionalCharges || '0') || 0), 0);
  const platformFee = checkoutItems.reduce((acc, item) => acc + (parseFloat(item.platformFee || '0') || 0), 0) || parseFloat(product?.platformFee || '0');
  const totalBeforeDiscount = (subtotal - memberDiscount) + shipping + additional + platformFee;
  const total = Math.max(0, totalBeforeDiscount - couponDiscount);
  const totalFixed = total.toFixed(2);

  const upiId = settings?.upi?.upiId || 'surajk40531@okicici';
  const merchantName = settings?.upi?.merchantName || 'Fancy Bazaar';

  const txnRef = `FB${Date.now()}`;
  // Standard clean UPI URI for deep linking
  const genericUpiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&mc=5411&tid=${txnRef}&tr=${txnRef}&tn=${encodeURIComponent('Fancy Bazaar Order')}&am=${totalFixed}&cu=INR&mode=02&purpose=00`;

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldName);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopiedField(null), 2500);
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleOpenUpiApp = () => {
    toast.success('Opening UPI App...');
    window.location.href = genericUpiLink;
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('upi-qr-svg') as SVGSVGElement | null;
    if (!svgElement) {
      toast.error('QR code not found');
      return;
    }

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = 300 * scale;
      canvas.height = 370 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(merchantName, canvas.width / 2, 45);

        ctx.fillStyle = '#2563EB';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(`₹${total.toLocaleString('en-IN')}`, canvas.width / 2, 85);

        const qrSize = 210 * scale;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(img, qrX, 105, qrSize, qrSize);

        ctx.fillStyle = '#4B5563';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`UPI: ${upiId}`, canvas.width / 2, canvas.height - 25);

        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `FancyBazaar-QR-₹${total}.png`;
        downloadLink.href = pngUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast.success('QR Code downloaded!');
      };
      img.src = url;
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const userMobile = address?.mobile || localStorage.getItem('fancybazaar_member_mobile') || '';
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode, 
          amount: totalBeforeDiscount,
          mobile: userMobile 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data);
        let discount = 0;
        if (data.discountType === 'fixed') {
          discount = parseFloat(data.discountValue);
        } else {
          discount = (totalBeforeDiscount * parseFloat(data.discountValue)) / 100;
        }
        setCouponDiscount(discount);
        toast.success(`Coupon ${data.code} applied!`);
      } else {
        toast.error(data.error || 'Invalid coupon');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePaymentSubmit = async (method: 'UPI' | 'COD') => {
    // Mandatory UTR check - UPI order cannot be placed without entering UTR number
    if (method === 'UPI') {
      const cleanedUtr = utr.trim();
      if (!cleanedUtr) {
        setUtrError('Order cannot be placed without entering a UTR number. Please enter your 12-digit UTR number.');
        toast.error('Please enter your UTR number!');
        return;
      }
      if (cleanedUtr.length < 6) {
        setUtrError('Please enter a valid 12-digit UTR number.');
        toast.error('Invalid UTR number!');
        return;
      }
    }

    setUtrError(null);
    setIsSubmitting(true);
    try {
      const paymentStatus = method === 'UPI' ? 'Payment Verification Pending' : 'Pending';
      const utrRef = method === 'UPI' ? utr.trim() : null;

      const orderBody = checkoutItems.length > 1 ? {
        items: checkoutItems.map(item => ({
          productId: item.id,
          quantity: item.quantity || 1,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          name: item.name
        })),
        customerName: address.name,
        customerMobile: address.mobile,
        address,
        paymentMethod: method,
        paymentStatus,
        utrReference: utrRef,
        couponCode: appliedCoupon?.code,
        userId: localStorage.getItem('fancybazaar_user_id') || undefined
      } : {
        productId: product.id,
        customerName: address.name,
        customerMobile: address.mobile,
        address,
        paymentMethod: method,
        paymentStatus,
        utrReference: utrRef,
        quantity: product.quantity || 1,
        couponCode: appliedCoupon?.code,
        selectedColor: product.selectedColor,
        selectedSize: product.selectedSize,
        userId: localStorage.getItem('fancybazaar_user_id') || undefined
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
      });

      const order = await res.json();
      if (!res.ok) {
        toast.error(order.error || 'Failed to place order');
        setIsSubmitting(false);
        return;
      }

      // If this was a wishlist multi-item order, clear wishlist
      if (checkoutItems.length > 1) {
        const uid = localStorage.getItem('fancybazaar_user_id');
        if (uid) {
          fetch(`/api/wishlist/${uid}`, { method: 'DELETE' }).catch(() => {});
        }
        localStorage.removeItem('checkout_items');
      }

      localStorage.setItem('last_order', JSON.stringify(order));
      if (method === 'UPI') {
        toast.success('UTR submitted! Your order has been placed successfully.');
      } else {
        toast.success('Order Placed Successfully!');
      }
      navigate('/order/confirmation');
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 pb-16 transition-colors">
      
      {/* Top Header matching Screenshot */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 transition-colors">
        <div className="container mx-auto px-4 max-w-xl py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tight">Step 3 of 3</p>
              <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Payments</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-gray-500" />
            <span>100% Secure</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-xl space-y-3">
        
        {/* Total Amount & Price Breakdown Card */}
        <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm transition-all">
          <div 
            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Price Details</span>
                {showPriceBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {checkoutItems.length > 1 ? `${checkoutItems.length} items (Wishlist)` : `${product.quantity || 1} item`} • Includes delivery, platform & handling fees
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">Total Amount</span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400 font-sans tracking-tight">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick summary line when collapsed */}
          {!showPriceBreakdown && (
            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                <Truck className="w-3 h-3 text-indigo-500" /> Shipping: {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-amber-500" /> Platform Fee: ₹{platformFee}
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                <Package className="w-3 h-3 text-blue-500" /> Handling Fee: ₹{additional}
              </span>
            </div>
          )}

          {/* Price Breakdown Details */}
          {showPriceBreakdown && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5 text-xs">
              {/* Item Total */}
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span>Item Total ({checkoutItems.length > 1 ? `${checkoutItems.length} products` : `${product.quantity || 1} item`})</span>
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
              </div>

              {checkoutItems.length > 1 && (
                <div className="py-2 px-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1.5 border border-gray-100 dark:border-gray-700/60">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Wishlist Items Breakdown:</p>
                  {checkoutItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-gray-700 dark:text-gray-300">
                      <span className="truncate max-w-[200px]">• {it.name} (x{it.quantity || 1})</span>
                      <span className="font-medium">₹{(parseFloat(it.sellingPrice) * (it.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipping Charges */}
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Shipping Charge</span>
                </span>
                {shipping > 0 ? (
                  <span className="font-semibold text-gray-900 dark:text-white">+ ₹{shipping.toLocaleString()}</span>
                ) : (
                  <span className="font-bold text-green-600 dark:text-green-400 text-[11px] bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md">
                    FREE Delivery
                  </span>
                )}
              </div>

              {/* Platform Fee */}
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Platform Fee</span>
                </span>
                {platformFee > 0 ? (
                  <span className="font-semibold text-gray-900 dark:text-white">+ ₹{platformFee.toLocaleString()}</span>
                ) : (
                  <span className="font-semibold text-gray-400 dark:text-gray-500 text-[11px]">₹0 (Free)</span>
                )}
              </div>

              {/* Handling Fee */}
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Handling Fee</span>
                </span>
                {additional > 0 ? (
                  <span className="font-semibold text-gray-900 dark:text-white">+ ₹{additional.toLocaleString()}</span>
                ) : (
                  <span className="font-semibold text-gray-400 dark:text-gray-500 text-[11px]">₹0 (Free)</span>
                )}
              </div>

              {/* VIP Member Special Discount */}
              {memberDiscount > 0 && isMember && (
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>VIP Member Discount ({actualDiscountPercent}% - Special Discount)</span>
                  </span>
                  <span>- ₹{memberDiscount.toLocaleString()}</span>
                </div>
              )}

              {/* Coupon Discount */}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600 dark:text-green-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold">🏷️ Coupon Discount ({appliedCoupon?.code})</span>
                  </span>
                  <span className="font-bold">- ₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              {/* Total Amount Row */}
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
                <div>
                  <span className="font-black text-gray-900 dark:text-white">Total Amount</span>
                  <p className="text-[10px] text-gray-400">All fees & charges included</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400 font-sans">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Verified Contact and Delivery Info */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Delivering To:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{address.name}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>Confirmed Mobile:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    +91 {address.mobile}
                    {isMember ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black border border-amber-300 dark:border-amber-700 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> VIP ACTIVE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[9px] font-bold">
                        REGULAR
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Non-Returnable Warning Banner if applicable */}
        {product?.isReturnable === false && (
          <div className="p-3 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
            <Ban className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider text-[10px]">Non-Returnable Product: </span>
              <span>Returns and refunds are not available for this product (No Return Policy).</span>
            </div>
          </div>
        )}

        {/* 1. Option 1: Pay via Any UPI App (Direct Button + Mandatory UTR) */}
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden transition-all ${
          expandedSection === 'UPI_APP' ? 'border-amber-400 dark:border-amber-500' : 'border-gray-200/80 dark:border-gray-800'
        }`}>
          <div 
            onClick={() => setExpandedSection(expandedSection === 'UPI_APP' ? null : 'UPI_APP')}
            className="p-4 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Recommended: Pay via UPI App</span>
                <p className="text-[11px] text-gray-400">Google Pay, PhonePe, Paytm, BHIM</p>
              </div>
            </div>
            {expandedSection === 'UPI_APP' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSection === 'UPI_APP' && (
            <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-1 space-y-4">
              
              {/* Button: Pay Any UPI App */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleOpenUpiApp}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.99]"
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay via Any UPI App (₹{total.toLocaleString('en-IN')})
                </button>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-2">
                  Click the button to pay via your UPI app, then enter the 12-digit UTR number below.
                </p>
              </div>

              {/* UPI ID Copy Box */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                <div className="truncate mr-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Official UPI ID:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(upiId, 'appUpi')}
                  className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedField === 'appUpi' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  Copy
                </button>
              </div>

              {/* MANDATORY UTR INPUT */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    Enter 12-Digit UPI UTR No. <span className="text-red-500 font-black">* (Required)</span>
                  </label>
                  {utr.trim().length >= 6 && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Entered
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR / Ref number here"
                  value={utr}
                  onChange={(e) => {
                    setUtr(e.target.value);
                    if (utrError) setUtrError(null);
                  }}
                  className={`w-full px-3.5 py-3 bg-white dark:bg-gray-800 border rounded-xl text-xs font-mono outline-none text-gray-900 dark:text-white transition-all ${
                    utrError 
                      ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-950' 
                      : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-400'
                  }`}
                />
                {utrError ? (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {utrError}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400">
                    Note: Your order will be confirmed only after entering the 12-digit UTR number received after payment.
                  </p>
                )}
              </div>

              {/* Yellow Pay Button matching Screenshot */}
              <button
                type="button"
                onClick={() => handlePaymentSubmit('UPI')}
                disabled={isSubmitting}
                className="w-full bg-[#FFC200] hover:bg-[#F5B800] active:scale-[0.99] text-gray-950 font-black py-4 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  `Pay ₹${total.toLocaleString('en-IN')}`
                )}
              </button>

            </div>
          )}
        </div>

        {/* 2. Option 2: QR Code Payment (SEPARATE Option Card) */}
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden transition-all ${
          expandedSection === 'QR_CODE' ? 'border-amber-400 dark:border-amber-500' : 'border-gray-200/80 dark:border-gray-800'
        }`}>
          <div 
            onClick={() => setExpandedSection(expandedSection === 'QR_CODE' ? null : 'QR_CODE')}
            className="p-4 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">QR Code Payment</p>
                <p className="text-[11px] text-gray-400">Scan & Pay using any QR Scanner</p>
              </div>
            </div>
            {expandedSection === 'QR_CODE' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSection === 'QR_CODE' && (
            <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-1 space-y-4">
              
              {/* Separate QR Canvas Card */}
              <div className="pt-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <QRCodeSVG 
                    id="upi-qr-svg"
                    value={genericUpiLink} 
                    size={170} 
                    level="M" 
                  />
                </div>

                <div className="flex gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="flex-1 py-2 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-50 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    Download QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiId, 'qrUpi')}
                    className="flex-1 py-2 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-50 shadow-sm"
                  >
                    {copiedField === 'qrUpi' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                    Copy UPI ID
                  </button>
                </div>

                <p className="text-[11px] text-gray-400">
                  Official UPI ID: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{upiId}</span>
                </p>
              </div>

              {/* MANDATORY UTR INPUT FOR QR */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                    Enter 12-Digit UPI UTR No. <span className="text-red-500 font-black">* (Required)</span>
                  </label>
                  {utr.trim().length >= 6 && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Entered
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR number after scanning QR"
                  value={utr}
                  onChange={(e) => {
                    setUtr(e.target.value);
                    if (utrError) setUtrError(null);
                  }}
                  className={`w-full px-3.5 py-3 bg-white dark:bg-gray-800 border rounded-xl text-xs font-mono outline-none text-gray-900 dark:text-white transition-all ${
                    utrError 
                      ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-950' 
                      : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-400'
                  }`}
                />
                {utrError ? (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {utrError}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400">
                    Scan the QR code to pay ₹{total.toLocaleString()} and enter the 12-digit UTR number to confirm your order.
                  </p>
                )}
              </div>

              {/* Yellow Pay Button matching Screenshot */}
              <button
                type="button"
                onClick={() => handlePaymentSubmit('UPI')}
                disabled={isSubmitting}
                className="w-full bg-[#FFC200] hover:bg-[#F5B800] active:scale-[0.99] text-gray-950 font-black py-4 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  `Pay ₹${total.toLocaleString('en-IN')}`
                )}
              </button>

            </div>
          )}
        </div>

        {/* 3. Cash on Delivery (COD) - Unlocked for VIP Members / Coming Soon for non-members */}
        <div 
          className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 shadow-sm transition-all ${
            isMember 
              ? expandedSection === 'COD' 
                ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' 
                : 'border-gray-200/80 dark:border-gray-800 hover:border-amber-400 cursor-pointer'
              : 'border-gray-200/80 dark:border-gray-800 opacity-85 cursor-pointer hover:border-amber-400 dark:hover:border-amber-500/50'
          }`}
          onClick={() => {
            if (isMember) {
              setExpandedSection(expandedSection === 'COD' ? null : 'COD');
            } else {
              toast('Cash on Delivery (COD) is coming soon for regular orders. Join Fancy Bazaar Premium (₹299) to unlock COD now!', { icon: 'ℹ️' });
            }
          }}
        >
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                isMember 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                  {isMember && (
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  {isMember 
                    ? 'Pay cash upon delivery • VIP Privilege Active'
                    : 'Pay cash upon delivery • Available soon'}
                </p>
              </div>
            </div>

            {isMember ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-sm shrink-0">
                  VIP Unlocked
                </span>
                {expandedSection === 'COD' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 shadow-sm shrink-0">
                Coming Soon
              </span>
            )}
          </div>

          {/* COD Expanded Confirmation for Verified Members */}
          {isMember && expandedSection === 'COD' && (
            <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-900/40 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium VIP Member Privilege:
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  As an active Fancy Bazaar Premium member, you can pay in cash when the delivery agent delivers your package to <strong>{address?.house}, {address?.city}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePaymentSubmit('COD')}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-[0.99] text-gray-950 font-black py-4 rounded-xl text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Confirm COD Order (Pay ₹{total.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 4. Pay Later - Coming Soon */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 opacity-75 shadow-sm flex items-center justify-between cursor-not-allowed select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Pay Later</p>
              <p className="text-[11px] text-gray-400">Buy now and pay next month</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            Coming Soon
          </span>
        </div>

        {/* 5. Pay In 3 - Coming Soon */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 opacity-75 shadow-sm flex items-center justify-between cursor-not-allowed select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Pay In 3</p>
              <p className="text-[11px] text-gray-400">Split into 3 interest-free payments</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            Coming Soon
          </span>
        </div>

        {/* 6. Credit / Debit / ATM Card - Coming Soon */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 opacity-75 shadow-sm flex items-center justify-between cursor-not-allowed select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Credit / Debit / ATM Card</p>
              <p className="text-[11px] text-gray-400">Add and secure cards as per RBI guidelines</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            Coming Soon
          </span>
        </div>

        {/* 7. EMI - Coming Soon */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 opacity-75 shadow-sm flex items-center justify-between cursor-not-allowed select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">EMI</p>
              <p className="text-[11px] text-gray-400">Easy Monthly Installments</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            Coming Soon
          </span>
        </div>

        {/* Coupon Code Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-4 transition-colors">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Have a coupon code?</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Code (e.g. WELCOME100)" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={appliedCoupon}
              className="flex-grow px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 uppercase font-bold font-mono text-xs text-gray-900 dark:text-white"
            />
            {appliedCoupon ? (
              <button 
                type="button"
                onClick={() => { setAppliedCoupon(null); setCouponDiscount(0); setCouponCode(''); }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100"
              >
                Remove
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponCode || isValidatingCoupon}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                {isValidatingCoupon ? '...' : 'Apply'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
