import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Phone, Crown, Package, Truck, Heart, Moon, Sun, 
  MapPin, Camera, Edit2, Check, LogOut, ChevronRight, AlertCircle, 
  CheckCircle2, Shield, Plus, Building, Sparkles, Ticket, Copy 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth, CustomerAddress } from '../context/CustomerAuthContext';
import { useMembership } from '../context/MembershipContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function CustomerProfileDrawer({ onOpenWishlist }: { onOpenWishlist: () => void }) {
  const { 
    customer, 
    isAuthenticated, 
    isProfileDrawerOpen, 
    closeProfileDrawer, 
    openAuthModal, 
    updateProfile, 
    uploadAvatar, 
    logout 
  } = useCustomerAuth();
  
  const { isMember, daysRemaining } = useMembership();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Edit Name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Edit Address state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<CustomerAddress>({
    house: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Coupons modal state
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  const handleOpenCoupons = async () => {
    setShowCouponsModal(true);
    setLoadingCoupons(true);
    try {
      const mobileParam = customer?.mobile ? `?mobile=${encodeURIComponent(customer.mobile)}` : '';
      const res = await fetch(`/api/coupons${mobileParam}`);
      const data = await res.json();
      if (res.ok) {
        setCouponsList(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load coupons');
      }
    } catch {
      toast.error('Failed to connect to coupon server');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCouponCode(code);
      toast.success(`Coupon code "${code}" copied!`);
      setTimeout(() => setCopiedCouponCode(null), 2500);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  if (!isProfileDrawerOpen) return null;

  const handleStartEditName = () => {
    setEditedName(customer?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSavingName(true);
    const res = await updateProfile({ name: editedName.trim() });
    setSavingName(false);
    if (res.success) {
      toast.success('Name updated successfully!');
      setIsEditingName(false);
    } else {
      toast.error(res.error || 'Failed to update name');
    }
  };

  const handleStartEditAddress = () => {
    setAddressForm(customer?.address || {
      house: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.house || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill in House, City, State, and Pincode');
      return;
    }

    setSavingAddress(true);
    const res = await updateProfile({ address: addressForm });
    setSavingAddress(false);
    if (res.success) {
      toast.success('Address saved successfully!');
      setIsEditingAddress(false);
    } else {
      toast.error(res.error || 'Failed to save address');
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    setUploadingAvatar(true);
    const res = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (res.success) {
      toast.success('Profile photo updated!');
    } else {
      toast.error(res.error || 'Failed to upload photo');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeProfileDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Slide-out Drawer from Right */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-10 flex flex-col overflow-hidden border-l dark:border-gray-800"
        >
          {/* Header */}
          <div className="p-5 border-b dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">Customer Profile</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account & Preferences</p>
              </div>
            </div>
            <button
              onClick={closeProfileDrawer}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isAuthenticated && customer ? (
              <>
                {/* 1. Profile Avatar & Name Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white dark:from-gray-850 dark:via-gray-800 dark:to-gray-900 border border-indigo-100/70 dark:border-gray-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    {/* Avatar with Camera Upload Icon */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white dark:border-gray-700">
                        {customer.avatar ? (
                          <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                        title="Change Profile Photo"
                      >
                        {uploadingAvatar ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Name & Mobile Info */}
                    <div className="flex-1 min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-2.5 py-1 text-sm font-bold rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shrink-0"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 shrink-0"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
                            {customer.name}
                          </h3>
                          <button
                            onClick={handleStartEditName}
                            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Edit Name"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Locked Mobile Number */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">
                          +91 {customer.mobile}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-400 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. VIP Membership Card / Upgrade Section */}
                {isMember ? (
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center shadow-sm">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            VIP Member Active 👑
                          </p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            {daysRemaining > 0 ? `${daysRemaining} days left in membership` : 'Active subscription'}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/premium"
                        onClick={closeProfileDrawer}
                        className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
                      >
                        View Pass →
                      </Link>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      <span>✓ Wholesale Special Discount</span>
                      <span>✓ 100% Free Delivery</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 font-black">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-black text-amber-300">Fancy Bazaar VIP Club</h4>
                      </div>
                      <span className="text-xs font-black text-amber-400">₹299 / Year</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
                      Unlock wholesale rates (Special Discount) on all products & free delivery with your number (+91 {customer.mobile}).
                    </p>
                    <Link
                      to="/premium"
                      onClick={closeProfileDrawer}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-gray-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all block text-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get VIP Subscription with this Mobile
                    </Link>
                  </div>
                )}

                {/* 3. Saved Delivery Address Section */}
                <div className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Saved Delivery Address
                      </h4>
                    </div>
                    <button
                      onClick={handleStartEditAddress}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      {customer.address ? 'Edit' : 'Add'}
                    </button>
                  </div>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        placeholder="House / Flat / Building No. *"
                        value={addressForm.house || ''}
                        onChange={(e) => setAddressForm({ ...addressForm, house: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Street / Area / Colony"
                        value={addressForm.street || ''}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="City *"
                          value={addressForm.city || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          required
                          placeholder="State *"
                          value={addressForm.state || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Pincode (6 digits) *"
                          value={addressForm.pincode || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Landmark (Optional)"
                          value={addressForm.landmark || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-60"
                        >
                          {savingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : customer.address && customer.address.house ? (
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-900 dark:text-white">{customer.address.house}</p>
                      {customer.address.street && <p>{customer.address.street}</p>}
                      <p>{customer.address.city}, {customer.address.state} - <span className="font-mono font-bold">{customer.address.pincode}</span></p>
                      {customer.address.landmark && <p className="text-[11px] text-gray-400 mt-0.5">Near: {customer.address.landmark}</p>}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">No delivery address saved yet.</p>
                      <button
                        onClick={handleStartEditAddress}
                        className="px-3 py-1 bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100"
                      >
                        + Add Default Address
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest state inside profile */
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-850 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Welcome to Fancy Bazaar</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sign in with your mobile number to access orders, saved address & VIP pricing!
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      closeProfileDrawer();
                      openAuthModal('signup');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => {
                      closeProfileDrawer();
                      openAuthModal('login');
                    }}
                    className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Customer Log In
                  </button>
                </div>
              </div>
            )}

            {/* 4. Unified Navigation Hub (Orders, Track, Wishlist, Dark Mode) */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                Quick Shortcuts & Controls
              </h4>

              {/* My Orders */}
              <Link
                to="/my-orders"
                onClick={closeProfileDrawer}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">My Orders</p>
                    <p className="text-[10px] text-gray-400">View past orders, invoices & returns</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              {/* Track Order */}
              <Link
                to="/track"
                onClick={closeProfileDrawer}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Track Order</p>
                    <p className="text-[10px] text-gray-400">Live courier tracking via Order ID</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              {/* Wishlist */}
              <button
                onClick={() => {
                  closeProfileDrawer();
                  onOpenWishlist();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-gray-800 text-red-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-red-500/20" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Wishlist</p>
                    <p className="text-[10px] text-gray-400">{wishlist.length} items saved</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {wishlist.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                      {wishlist.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>

              {/* Coupons & Offers */}
              <button
                type="button"
                onClick={handleOpenCoupons}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-gray-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Coupons & Offers</p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Discounts
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">View active promo codes & VIP discounts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* VIP Membership Direct Link */}
              <Link
                to="/premium"
                onClick={closeProfileDrawer}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-gray-800 text-amber-500 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">VIP Club ₹299</p>
                    <p className="text-[10px] text-gray-400">{isMember ? 'Active VIP Membership' : 'Zero delivery + Special wholesale prices'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              {/* Dark Mode Toggle Item */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-gray-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-[10px] text-gray-400">{theme === 'light' ? 'Light Theme Active' : 'Dark Theme Active'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    theme === 'dark' ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                  aria-label="Toggle theme"
                >
                  <motion.div
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Logout (if logged in) */}
          {isAuthenticated && (
            <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
              <button
                onClick={logout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </motion.div>

        {/* Coupons Modal */}
        <AnimatePresence>
          {showCouponsModal && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCouponsModal(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white">Available Coupons</h3>
                      <p className="text-[10px] text-gray-400">
                        {isMember ? '👑 VIP Member: All Exclusive Coupons Unlocked!' : 'Active discount codes for your cart'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCouponsModal(false)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {loadingCoupons ? (
                    <div className="py-12 text-center">
                      <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Loading coupons...</p>
                    </div>
                  ) : couponsList.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto" />
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No active coupons right now</h4>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        New coupons and seasonal offers will appear here. Check back soon!
                      </p>
                    </div>
                  ) : (
                    couponsList.map((coupon) => {
                      const isVipCoupon = coupon.targetAudience === 'vip';
                      const isCopied = copiedCouponCode === coupon.code;
                      return (
                        <div
                          key={coupon.id}
                          className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                            isVipCoupon
                              ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-amber-300 dark:border-amber-700/60'
                              : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm tracking-wider px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm">
                                  {coupon.code}
                                </span>
                                {isVipCoupon ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                                    <Crown className="w-3 h-3 text-amber-600" /> Only VIP
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200">
                                    All Users
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-black text-gray-900 dark:text-white pt-1">
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}% OFF`
                                  : `₹${parseFloat(coupon.discountValue).toLocaleString()} OFF`}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {parseFloat(coupon.minPurchase) > 0
                                  ? `Valid on orders above ₹${parseFloat(coupon.minPurchase).toLocaleString()}`
                                  : 'No minimum purchase required'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyCoupon(coupon.code)}
                              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                isCopied
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {!isMember && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          Join VIP Club to unlock exclusive VIP-only discount coupons!
                        </p>
                      </div>
                      <Link
                        to="/premium"
                        onClick={() => {
                          setShowCouponsModal(false);
                          closeProfileDrawer();
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-lg text-[10px] font-black uppercase shrink-0"
                      >
                        Join VIP
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-[10px] text-gray-400">
                    Apply copied coupon code at checkout on the Payment screen.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
