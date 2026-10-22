import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, MapPin, Phone, User, Building, Home, CheckSquare, Zap, Ban, RotateCcw, Crown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useMembership } from '../context/MembershipContext';
import toast from 'react-hot-toast';

export default function AddressForm() {
  const navigate = useNavigate();
  const { customer, isAuthenticated, openAuthModal } = useCustomerAuth();
  const { isMember, checkStatus } = useMembership();

  // Strict check: User must be logged in to access address details!
  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (!isAuthenticated && !token) {
      toast('Please log in with your mobile number to enter delivery address', { icon: '🔐' });
      openAuthModal('login');
      navigate('/');
    }
  }, [isAuthenticated, navigate, openAuthModal]);

  const [product, setProduct] = useState<any>(null);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{
    checking: boolean;
    checkedMobile: string;
    isMember: boolean;
    message: string;
  }>({
    checking: false,
    checkedMobile: '',
    isMember: false,
    message: ''
  });

  const [formData, setFormData] = useState(() => {
    let saved: any = {};
    const local = localStorage.getItem('checkout_address');
    if (local) {
      try { saved = JSON.parse(local); } catch {}
    }
    const addr = customer?.address || saved;
    return {
      name: customer?.name || saved.name || '',
      mobile: customer?.mobile || saved.mobile || localStorage.getItem('fancybazaar_member_mobile') || '',
      house: addr?.house || '',
      street: addr?.street || '',
      city: addr?.city || '',
      state: addr?.state || '',
      pincode: addr?.pincode || '',
      landmark: addr?.landmark || '',
      acceptPolicies: false
    };
  });

  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        name: customer.name || prev.name,
        mobile: customer.mobile || prev.mobile,
        house: customer.address?.house || prev.house,
        street: customer.address?.street || prev.street,
        city: customer.address?.city || prev.city,
        state: customer.address?.state || prev.state,
        pincode: customer.address?.pincode || prev.pincode,
        landmark: customer.address?.landmark || prev.landmark
      }));
    }
  }, [customer]);

  // Verify mobile number whenever it is 10 digits
  const verifyMobile = useCallback(async (num: string) => {
    const clean = num.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setVerificationStatus({ checking: false, checkedMobile: clean, isMember: false, message: '' });
      return;
    }

    setVerificationStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch(`/api/subscriptions/status?mobile=${clean}`);
      const data = await res.json();
      const memberActive = Boolean(data.isMember);
      setVerificationStatus({
        checking: false,
        checkedMobile: clean,
        isMember: memberActive,
        message: memberActive 
          ? `👑 Active VIP Member (+91 ${clean}) — VIP Special Discount & Free Delivery Active!` 
          : `Standard Customer (+91 ${clean}) — Regular pricing applies.`
      });

      // Update storage and notify app
      localStorage.setItem('fancybazaar_member_mobile', clean);
      window.dispatchEvent(new Event('membership-updated'));
    } catch {
      setVerificationStatus(prev => ({ ...prev, checking: false }));
    }
  }, []);

  useEffect(() => {
    if (formData.mobile && formData.mobile.length === 10) {
      verifyMobile(formData.mobile);
    }
  }, [formData.mobile, verifyMobile]);

  useEffect(() => {
    // If saved address exists, load it
    const savedAddr = localStorage.getItem('checkout_address');
    if (savedAddr) {
      try {
        const parsed = JSON.parse(savedAddr);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          name: parsed.name || customer?.name || prev.name,
          mobile: parsed.mobile || customer?.mobile || prev.mobile
        }));
      } catch {}
    } else if (customer) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || customer.name,
        mobile: prev.mobile || customer.mobile
      }));
    }
  }, [customer]);

  useEffect(() => {
    const savedItems = localStorage.getItem('checkout_items');
    const savedProduct = localStorage.getItem('checkout_product');

    if (!savedItems && !savedProduct) {
      navigate('/');
      return;
    }

    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        if (Array.isArray(items) && items.length > 0) {
          setCheckoutItems(items);
          setProduct(items[0]);
          return;
        }
      } catch {}
    }

    if (savedProduct) {
      try {
        const prod = JSON.parse(savedProduct);
        setProduct(prod);
        setCheckoutItems([prod]);
      } catch {}
    }
  }, [navigate]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (!formData.acceptPolicies) {
      toast.error('Please accept Terms & Privacy Policy');
      return;
    }

    // Validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      toast.error('Enter a valid 6-digit Indian PIN code');
      return;
    }

    localStorage.setItem('checkout_address', JSON.stringify(formData));
    navigate('/checkout/payment');
  };

  if (!product && checkoutItems.length === 0) return null;

  const totalAmount = checkoutItems.reduce((acc, item) => {
    const sp = parseFloat(item.sellingPrice) || 0;
    const qty = item.quantity || 1;
    const ship = parseFloat(item.shippingCharges || '0') || 0;
    const add = parseFloat(item.additionalCharges || '0') || 0;
    const plat = parseFloat(item.platformFee || '0') || 0;
    return acc + (sp * qty) + ship + add + plat;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8 pb-28 sm:pb-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        
        {/* Order Header / Multi-Item Wishlist Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700 transition-colors">
          {checkoutItems.length > 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Wishlist All-Items Checkout
                  </span>
                  <h3 className="font-black text-gray-900 dark:text-white text-base">
                    Ordering {checkoutItems.length} Products Together
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Total Payable</p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Items row */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
                {checkoutItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0 max-w-[200px]">
                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-800" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">₹{parseFloat(item.sellingPrice).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-gray-700" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Checkout</p>
                    {product.isReturnable === false ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                        <Ban className="w-2.5 h-2.5" /> Non-Returnable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-200 dark:border-green-900/40">
                        <RotateCcw className="w-2.5 h-2.5" /> 7 Days Return
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</p>
                  {product.selectedColor && (
                    <p className="text-[11px] text-gray-500 font-medium">Color: {product.selectedColor}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Total Amount</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <form id="checkout-address-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                name="name"
                required
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Mobile Number (WhatsApp & Delivery Updates)
                </label>
                {formData.mobile.length === 10 && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {verificationStatus.checking ? 'Checking...' : verificationStatus.isMember ? 'VIP Active' : 'Regular Customer'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-sm text-gray-400 dark:text-gray-500">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  required
                  maxLength={10}
                  placeholder="10-digit Indian Mobile Number"
                  value={formData.mobile}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, mobile: clean }));
                  }}
                  className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all font-mono tracking-wider font-semibold text-base"
                />
              </div>

              {/* Real-time verification notice */}
              {formData.mobile.length === 10 && verificationStatus.message && (
                <div className={`mt-2 p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  verificationStatus.isMember 
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {verificationStatus.isMember ? (
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  )}
                  <span>{verificationStatus.message}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-400 px-1 mt-1">
                Changing this number will immediately recheck whether it has an active VIP subscription.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="house"
                  required
                  placeholder="House / Bldg No."
                  value={formData.house}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
                />
              </div>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="Street / Area"
                  value={formData.street}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                required
                placeholder="City / District"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
              <input
                type="text"
                name="state"
                required
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="pincode"
                required
                placeholder="PIN Code"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
              <input
                type="text"
                name="landmark"
                placeholder="Landmark (Optional)"
                value={formData.landmark}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl transition-colors">
            <input
              type="checkbox"
              id="acceptPolicies"
              name="acceptPolicies"
              checked={formData.acceptPolicies}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded"
            />
            <label htmlFor="acceptPolicies" className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
              I agree to the <Link to="/policy/terms" className="font-bold underline hover:text-indigo-600 dark:hover:text-indigo-400">Terms & Conditions</Link> and <Link to="/policy/privacy" className="font-bold underline hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4.5 px-6 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>Continue to Payment</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Action Bar for Mobile: Only Continue to Payment button (No Wishlist) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 sm:hidden shadow-2xl">
        <button
          type="submit"
          form="checkout-address-form"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Continue to Payment</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
