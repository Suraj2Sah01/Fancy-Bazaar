import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Phone, MessageCircle, Heart, Package, ArrowLeft, Sun, Moon, Menu, X, ChevronRight, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useMembership } from '../context/MembershipContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { motion, AnimatePresence } from 'motion/react';

import { PWAInstallButton } from './PWAInstallButton';
import ProductSearchAutoSuggest from './ProductSearchAutoSuggest';
import CustomerProfileDrawer from './CustomerProfileDrawer';

const categories = [
  'Sarees', 'Kurtis & Suits', 'Beauty', 'Home Decor', 
  'MEN Fashion', 'Kids', 'Kitchen', 'Jewellery', 'Bag & Accessories', 
  'Innerwear', 'Footwear', 'Healthcare', 'Lehengas & Blouses', 
  'Case & Cover', 'Furniture', 'Sports & Fitness'
];

export default function Header({ onOpenWishlist }: { onOpenWishlist: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { isMember, daysRemaining } = useMembership();
  const { customer, isAuthenticated, openAuthModal, openProfileDrawer, logout } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data.general));
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl mr-1 text-gray-500 dark:text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
                <ShoppingBag className="text-white w-4 h-4" />
              </div>
              <span className="font-black text-xl tracking-tighter text-gray-900 dark:text-white italic">
                {settings?.websiteName || 'Fancy Bazaar'}
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
            <PWAInstallButton />
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* WhatsApp Support Button */}
            <a 
              href={`https://wa.me/${settings?.whatsappSupportNumber || '918870472700'}?text=Hello, I need help with my order. Please assist me.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-black hover:bg-green-600 transition-all shadow-md shadow-green-100 dark:shadow-none"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Support
            </a>

            {/* Corner Profile Hub Button (Right Corner) */}
            <button
              onClick={openProfileDrawer}
              className={`flex items-center gap-2 p-1 pl-1.5 sm:pr-3 rounded-full border transition-all shadow-sm ${
                isAuthenticated && customer
                  ? isMember
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70'
                    : 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-gray-800 hover:bg-indigo-100/60'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Customer Profile & Account Hub"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-inner">
                  {isAuthenticated && customer?.avatar ? (
                    <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                  ) : isAuthenticated && customer?.name ? (
                    <span>{customer.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                {isMember && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <Crown className="w-2.5 h-2.5 text-gray-950" />
                  </span>
                )}
              </div>

              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-black text-gray-900 dark:text-white max-w-[95px] truncate">
                  {isAuthenticated && customer ? customer.name.split(' ')[0] : 'Profile'}
                </span>
                <span className={`text-[9px] font-bold ${isMember ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                  {isAuthenticated ? (isMember ? '👑 VIP Member' : 'My Account') : 'Log In'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 z-[101] shadow-2xl overflow-y-auto transition-colors"
            >
              <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="text-white w-4 h-4" />
                  </div>
                  <span className="font-black text-lg tracking-tighter dark:text-white italic">Menu</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                {/* Customer Account Box in Drawer */}
                <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800">
                  {isAuthenticated && customer ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            {customer.name}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium">+91 {customer.mobile}</p>
                        </div>
                        {isMember ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" /> VIP
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <Link
                          to="/my-orders"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Welcome to Fancy Bazaar</p>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          openAuthModal('signup');
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm"
                      >
                        Sign Up / Log In
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3">Main Navigation</p>
                  <div className="space-y-1">
                    <Link to="/" className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 group transition-all">
                      <span className="font-bold">Home</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link to="/my-orders" className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 group transition-all">
                      <span className="font-bold">My Orders</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link to="/track" className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 group transition-all">
                      <span className="font-bold">Track Order</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link to="/premium" className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 group transition-all">
                      <span className="font-black flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        {isMember ? 'VIP Premium Active' : 'Join VIP Premium (₹299)'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3">Shop by Category</p>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => {
                          navigate(`/?category=${cat}`);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 group transition-all text-left"
                      >
                        <span className="font-bold">{cat}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t dark:border-gray-800 mt-4 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Need Help?</p>
                    <a 
                      href={`https://wa.me/${settings?.whatsappSupportNumber || '918870472700'}`}
                      className="text-sm font-black text-gray-900 dark:text-white hover:text-green-600 transition-colors"
                    >
                      WhatsApp Support
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Quick Search Modal with Auto-Suggest */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Search Products
                </span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ProductSearchAutoSuggest
                value={headerSearchQuery}
                onChange={setHeaderSearchQuery}
                placeholder="Type product name, category..."
                onSearchSubmit={(val) => {
                  setIsSearchOpen(false);
                  navigate(`/?search=${encodeURIComponent(val)}`);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Customer Profile Hub Drawer */}
      <CustomerProfileDrawer onOpenWishlist={onOpenWishlist} />
    </>
  );
}
