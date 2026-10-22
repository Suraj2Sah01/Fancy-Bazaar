import { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';

import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { MembershipProvider } from './context/MembershipContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import CustomerAuthModal from './components/CustomerAuthModal';
import WishlistSidebar from './components/WishlistSidebar';
import BrandIntroScreen from './components/BrandIntroScreen';
import PullToRefresh from './components/PullToRefresh';
import { BogoProvider } from './context/BogoContext';
import BogoBanner from './components/BogoBanner';
import { motion, AnimatePresence } from 'motion/react';

import ErrorBoundary from './components/ErrorBoundary';

// Direct imports for essential and small static pages to prevent dynamic import failures
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Robust lazy loader with auto-retry on network or module fetch errors
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Initial dynamic import failed, retrying once...', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return await componentImport();
      } catch (retryError) {
        console.error('Dynamic import retry failed:', retryError);
        throw retryError;
      }
    }
  });
}

// Lazy load larger pages with retry
const Home = lazyWithRetry(() => import('./pages/Home'));
const ProductOrder = lazyWithRetry(() => import('./pages/ProductOrder'));
const AddressForm = lazyWithRetry(() => import('./pages/AddressForm'));
const Payment = lazyWithRetry(() => import('./pages/Payment'));
const OrderConfirmation = lazyWithRetry(() => import('./pages/OrderConfirmation'));
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const MyOrders = lazyWithRetry(() => import('./pages/MyOrders'));
const Policies = lazyWithRetry(() => import('./pages/Policies'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Premium = lazyWithRetry(() => import('./pages/Premium'));

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Fancy Bazaar...</p>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductOrder /></PageWrapper>} />
          <Route path="/checkout/address" element={<PageWrapper><AddressForm /></PageWrapper>} />
          <Route path="/checkout/payment" element={<PageWrapper><Payment /></PageWrapper>} />
          <Route path="/order/confirmation" element={<PageWrapper><OrderConfirmation /></PageWrapper>} />
          <Route path="/track" element={<PageWrapper><TrackOrder /></PageWrapper>} />
          <Route path="/my-orders" element={<PageWrapper><MyOrders /></PageWrapper>} />
          <Route path="/policy/:type" element={<PageWrapper><Policies /></PageWrapper>} />
          <Route path="/premium" element={<PageWrapper><Premium /></PageWrapper>} />
          <Route path="/secure-payments" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/dashboard/*" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <MembershipProvider>
          <WishlistProvider>
            <Router>
              <BogoProvider>
                <PullToRefresh>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
                    <BogoBanner />
                    <BrandIntroScreen />
                    <Header onOpenWishlist={() => setIsWishlistOpen(true)} />
                    <main className="flex-grow">
                      <ErrorBoundary>
                        <AnimatedRoutes />
                      </ErrorBoundary>
                    </main>
                    <Footer />
                    <WishlistSidebar isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
                    <CustomerAuthModal />
                    <Toaster position="top-center" />
                  </div>
                </PullToRefresh>
              </BogoProvider>
            </Router>
          </WishlistProvider>
        </MembershipProvider>
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
