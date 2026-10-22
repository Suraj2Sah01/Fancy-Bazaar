import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Crown, Sparkles, CheckCircle2, ShieldCheck, Truck, Percent, Gift, 
  Clock, ArrowRight, Copy, Check, Download, AlertCircle, Phone, 
  ExternalLink, User, Mail, RefreshCw, Zap, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import { useMembership } from '../context/MembershipContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function Premium() {
  const { isMember, status, subscription, daysRemaining, loading, checkStatus } = useMembership();
  const { customer, isAuthenticated, openAuthModal } = useCustomerAuth();
  const [settings, setSettings] = useState<any>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'AWAITING'>('DETAILS');

  // Status lookup state
  const [lookupMobile, setLookupMobile] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});

    // Autofill from logged in customer first (locked)
    if (customer) {
      if (customer.name) setCustomerName(customer.name);
      if (customer.mobile) setCustomerMobile(customer.mobile);
    } else {
      // Otherwise fallback to local storage if available
      const savedAddr = localStorage.getItem('checkout_address');
      if (savedAddr) {
        try {
          const parsed = JSON.parse(savedAddr);
          if (parsed.name) setCustomerName(parsed.name);
          if (parsed.mobile) setCustomerMobile(parsed.mobile);
        } catch {}
      }
    }
  }, [customer]);

  const upiId = settings?.upi?.upiId || 'surajk40531@okicici';
  const merchantName = settings?.upi?.merchantName || 'Fancy Bazaar';
  const txnRef = `FBPREM${Date.now()}`;
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&mc=5411&tid=${txnRef}&tr=${txnRef}&tn=${encodeURIComponent('Fancy Bazaar Premium VIP')}&am=299.00&cu=INR&mode=02&purpose=00`;

  const handleCopy = async (text: string, field: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('prem-qr-svg') as SVGSVGElement | null;
    if (!svgElement) return;

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = 300 * scale;
      canvas.height = 360 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = '#0F0E17';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fancy Bazaar VIP Pass', canvas.width / 2, 45);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 32px sans-serif';
        ctx.fillText('₹299.00', canvas.width / 2, 85);

        const qrSize = 200 * scale;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(img, qrX, 105, qrSize, qrSize);

        ctx.fillStyle = '#A7A9BE';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`UPI: ${upiId}`, canvas.width / 2, canvas.height - 25);

        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'FancyBazaar-Premium-₹299.png';
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
      };
      img.src = url;
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const cleanMobile = customerMobile.trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setStep('PAYMENT');
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError(null);

    const cleanedUtr = utrNumber.trim().toUpperCase();
    if (!cleanedUtr) {
      setUtrError('UTR number is mandatory. Please enter your UPI transaction reference number.');
      toast.error('Please enter your UTR number!');
      return;
    }

    if (!/^[A-Z0-9]{6,24}$/.test(cleanedUtr)) {
      setUtrError('Invalid UTR format. Please enter a valid 6-24 character alphanumeric UPI UTR number.');
      toast.error('Invalid UTR format!');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('fancybazaar_user_id') || '';
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerMobile: customerMobile.trim(),
          customerEmail: customerEmail.trim() || null,
          utrNumber: cleanedUtr,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setUtrError(data.error || 'Failed to submit payment details');
        toast.error(data.error || 'Submission failed');
        return;
      }

      toast.success('Payment submitted! Awaiting admin verification.');
      localStorage.setItem('fancybazaar_member_mobile', customerMobile.trim());
      await checkStatus(customerMobile.trim());
      setStep('AWAITING');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupMobile.trim();
    if (!/^[6-9]\d{9}$/.test(clean)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLookingUp(true);
    try {
      await checkStatus(clean);
      toast.success('Status refreshed!');
    } catch {
      toast.error('Failed to lookup status');
    } finally {
      setIsLookingUp(false);
    }
  };

  const benefits = [
    {
      title: 'Extra 30% Discount on Every Product',
      desc: 'Exclusive VIP pricing applied instantly to your cart and checkout on all catalog items.',
      icon: Percent,
      highlight: 'Save 30%'
    },
    {
      title: 'Cash on Delivery (COD) Unlocked',
      desc: 'Get access to Cash on Delivery payment for all eligible orders across India.',
      icon: ShieldCheck,
      highlight: 'COD Enabled'
    },
    {
      title: 'Free Express Delivery Offers',
      desc: 'Enjoy free and priority shipping on all products with zero hidden platform charges.',
      icon: Truck,
      highlight: 'Zero Shipping'
    },
    {
      title: 'Exclusive VIP Coupons',
      desc: 'Access members-only special coupons and promotional codes every week.',
      icon: Gift,
      highlight: 'VIP Coupons'
    },
    {
      title: 'Member-Only Deals & Early Access',
      desc: 'Be the first to browse trending flash sales and limited edition collections before everyone else.',
      icon: Sparkles,
      highlight: 'Early Access'
    },
    {
      title: 'Premium Member Gold Badge',
      desc: 'Flaunt the verified Fancy Bazaar VIP badge on your orders and tracking records.',
      icon: Crown,
      highlight: 'VIP Badge'
    },
    {
      title: 'Priority 24/7 VIP Customer Support',
      desc: 'Direct line to our senior support specialists via priority WhatsApp and phone desk.',
      icon: Phone,
      highlight: 'Instant Support'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 pb-24 transition-colors">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#181308] via-[#0E0B05] to-[#070709] border-b border-amber-500/20 pt-12 pb-16 px-4">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>VIP Membership Pass</span>
            </div>

            {/* 15% to 30% Special Discount Prominent Banner in English */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-950 text-xs sm:text-sm font-black uppercase tracking-wide shadow-md shadow-amber-400/30">
              <Sparkles className="w-4 h-4 text-gray-950 shrink-0" />
              <span>Get 15% to 30% Special Discount on All Products!</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFE59E] via-[#FFD700] to-[#E5A823]">
            Fancy Bazaar Premium
          </h1>
          
          <p className="text-gray-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Get an instant <strong className="text-amber-300 font-black">15% to 30% Special Discount</strong> on every purchase, plus <strong className="text-amber-300 font-black">100% Free Delivery</strong> on all orders across India!
          </p>

          {/* Pricing Highlight Pill & CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="inline-flex items-baseline gap-2 bg-[#171410] border border-amber-500/40 px-6 py-3 rounded-2xl shadow-xl shadow-amber-950/40">
              <span className="text-2xl sm:text-4xl font-black text-amber-400 font-sans">₹299</span>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">/ 30 Days Validity</span>
            </div>
            {!isMember && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('premium-payment-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4 text-gray-950" />
                <span>Join Premium for ₹299</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-6 space-y-8 relative z-20">

        {/* Current Membership Status Cards */}
        {isMember && subscription && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-gray-950 font-black shadow-lg shadow-amber-500/30">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ✓ Active Member
                    </span>
                    <span className="text-xs font-mono text-gray-400">{subscription.subscriptionId}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{subscription.customerName}</h3>
                  <p className="text-xs text-gray-400">Mobile: {subscription.customerMobile}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-amber-500/30 rounded-2xl px-5 py-3 text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">Validity Remaining</p>
                <p className="text-2xl font-black text-amber-300">{daysRemaining} Days</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Expires on: <strong>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 days from start'}</strong></span>
              </div>
              <button
                onClick={() => setStep('PAYMENT')}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Renew Membership
              </button>
            </div>
          </div>
        )}

        {!isMember && status === 'Pending Verification' && subscription && (
          <div className="bg-[#1C1808] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Awaiting Admin Approval
                  </span>
                  <span className="text-xs font-mono text-gray-400">ID: {subscription.subscriptionId}</span>
                </div>
                <h3 className="text-lg font-bold text-white">Your payment is awaiting verification</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Your Premium Membership will activate after admin approval. Our team verifies UPI transactions within 15–30 minutes during business hours.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                  <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                    <span className="text-gray-500 block text-[10px]">Submitted UTR:</span>
                    <span className="font-bold text-amber-300">{subscription.utrNumber}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                    <span className="text-gray-500 block text-[10px]">Amount:</span>
                    <span className="font-bold text-white">₹{subscription.amount} (UPI)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => checkStatus(subscription.customerMobile)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isMember && status === 'Rejected' && subscription && (
          <div className="bg-[#1C0F0F] border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                    Payment Verification Rejected
                  </span>
                  <span className="text-xs font-mono text-gray-400">ID: {subscription.subscriptionId}</span>
                </div>
                <h3 className="text-lg font-bold text-white">Payment Verification Unsuccessful</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {subscription.adminNotes || 'Your payment verification was rejected by admin because the transaction could not be confirmed in bank records. Your membership remains inactive.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                  <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                    <span className="text-gray-500 block text-[10px]">Submitted UTR:</span>
                    <span className="font-bold text-red-300">{subscription.utrNumber}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                    <span className="text-gray-500 block text-[10px]">Amount:</span>
                    <span className="font-bold text-white">₹{subscription.amount} (UPI)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStep('DETAILS');
                      setUtrNumber('');
                      setUtrError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Retry Subscription Payment (₹299)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Payment Flow Card */}
        {(!isMember || step === 'PAYMENT') && (
          <div id="premium-payment-section" className="bg-[#121118] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Join Premium for ₹299</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">30-day VIP pass with mandatory UTR verification</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-black">
                ₹299 Only
              </span>
            </div>

            {/* Step 1: Customer Details */}
            {step === 'DETAILS' && (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Step 1: Enter Customer Information</p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1A1822] border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      required
                      readOnly={Boolean(customer?.mobile)}
                      placeholder="10-digit Indian Mobile Number"
                      value={customerMobile}
                      onChange={(e) => {
                        if (!customer?.mobile) {
                          setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                        }
                      }}
                      className={`w-full pl-11 pr-4 py-3 bg-[#1A1822] border rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition-colors ${
                        customer?.mobile
                          ? 'border-amber-500/40 bg-amber-950/25 text-amber-200 cursor-not-allowed font-mono font-semibold'
                          : 'border-gray-800 focus:border-amber-400'
                      }`}
                    />
                  </div>

                  {customer?.mobile ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Locked to your registered mobile (+91 {customer.mobile}). Your VIP pass will activate instantly on this account.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
                      <span>Have an account? Log in to lock VIP pass to your number.</span>
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="font-bold text-white hover:underline ml-2 shrink-0"
                      >
                        Log In
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#1A1822] border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Continue to UPI Payment (₹299)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2: UPI QR + Mandatory UTR */}
            {step === 'PAYMENT' && (
              <form onSubmit={handleSubscriptionSubmit} className="space-y-6">
                
                {/* Back to details button */}
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Edit details ({customerName || 'Customer'}, {customerMobile})
                </button>

                {/* QR Code Canvas Card */}
                <div className="p-6 bg-[#181622] rounded-2xl border border-gray-800 flex flex-col items-center gap-4 text-center">
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <QRCodeSVG 
                      id="prem-qr-svg"
                      value={upiLink}
                      size={180}
                      level="M"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-black text-white">Scan with Google Pay, PhonePe, Paytm, BHIM</p>
                    <p className="text-xs text-amber-300 font-bold">Exact Payment Amount: ₹299.00</p>
                  </div>

                  {/* Buttons for Direct UPI & Download */}
                  <div className="flex flex-wrap gap-2 w-full max-w-sm">
                    <a
                      href={upiLink}
                      className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open UPI App
                    </a>
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="flex-1 py-2.5 px-3 bg-[#242132] hover:bg-[#2e2a40] text-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download QR
                    </button>
                  </div>

                  {/* Copy UPI ID */}
                  <div className="flex items-center justify-between w-full max-w-sm p-2.5 bg-black/40 rounded-xl border border-gray-800 text-xs">
                    <span className="font-mono text-gray-300 truncate">{upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiId, 'upiId')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedField === 'upiId' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      Copy
                    </button>
                  </div>
                </div>

                {/* MANDATORY UTR INPUT */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-200 flex items-center gap-1">
                      Enter 12-Digit UPI UTR No. <span className="text-red-400 font-black">* (Mandatory)</span>
                    </label>
                    {utrNumber.trim().length >= 6 && (
                      <span className="text-[10px] text-green-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Entered
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UTR / Ref number from UPI app"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value);
                      if (utrError) setUtrError(null);
                    }}
                    className={`w-full px-4 py-3.5 bg-[#1A1822] border rounded-xl text-xs sm:text-sm font-mono text-white placeholder-gray-500 outline-none transition-all ${
                      utrError 
                        ? 'border-red-500 ring-2 ring-red-500/20' 
                        : 'border-gray-700 focus:border-amber-400'
                    }`}
                  />

                  {utrError ? (
                    <p className="text-xs text-red-400 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {utrError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Note: Your payment is verified by our admin against bank transaction records. The membership will activate only after verification.
                    </p>
                  )}
                </div>

                {/* Submit Payment Details Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-gray-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Submit Payment Details (UTR)</span>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* Step 3: Success Confirmation Box */}
            {step === 'AWAITING' && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Payment Details Received</h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                  Your payment is awaiting verification. Your Premium Membership will activate after admin approval.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setStep('DETAILS')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close or Subscribe Another
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Status Lookup Card for Returning Customers */}
        <div className="bg-[#121118] border border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SearchIcon className="w-4 h-4 text-amber-400" />
                <span>Check Your Subscription Status</span>
              </h3>
              <p className="text-xs text-gray-400">Enter your 10-digit mobile number to view activation status</p>
            </div>

            <form onSubmit={handleStatusLookup} className="flex gap-2 w-full sm:w-auto">
              <input
                type="tel"
                placeholder="Mobile number"
                value={lookupMobile}
                onChange={(e) => setLookupMobile(e.target.value)}
                className="px-3.5 py-2 bg-[#1A1822] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 w-full sm:w-44"
              />
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isLookingUp ? '...' : 'Check'}
              </button>
            </form>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black uppercase text-white tracking-tight">
              {benefits.length} Exclusive VIP Benefits
            </h2>
            <p className="text-xs text-gray-400">Everything you unlock with your ₹299 monthly pass</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div 
                  key={idx}
                  className="bg-[#121118] border border-gray-800/80 hover:border-amber-500/40 p-5 rounded-2xl flex items-start gap-4 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{b.title}</h4>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {b.highlight}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
