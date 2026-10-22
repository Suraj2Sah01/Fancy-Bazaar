import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, RotateCcw, ChevronRight, ChevronLeft, Star, Heart, 
  ArrowLeft, Plus, Minus, Share2, ZoomIn, X, Package, MessageCircle, ArrowUp, Ban, Zap, Images, Palette, Check, Sparkles, Crown, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWishlist } from '../context/WishlistContext';
import { useMembership } from '../context/MembershipContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useBogo } from '../context/BogoContext';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import ProductCard from '../components/ProductCard';
import ProductSpecifications from '../components/ProductSpecifications';
import { getTopHighlights } from '../data/smartwatchSpecs';

export default function ProductOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMember } = useMembership();
  const { isAuthenticated, openAuthModal } = useCustomerAuth();
  const { isBogoActive, missedOfferNotice, dismissMissedNotice, formattedRemainingTime, campaign } = useBogo();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const imagesList: string[] = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((s: string) => typeof s === 'string' ? s.trim() : '').filter(Boolean);
    }
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  const nextImage = () => {
    if (imagesList.length <= 1) return;
    setSlideDirection(1);
    setActiveImageIndex(prev => (prev + 1) % imagesList.length);
  };

  const prevImage = () => {
    if (imagesList.length <= 1) return;
    setSlideDirection(-1);
    setActiveImageIndex(prev => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const selectImage = (index: number) => {
    if (index === activeImageIndex) return;
    setSlideDirection(index > activeImageIndex ? 1 : -1);
    setActiveImageIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      nextImage();
    } else if (distance < -45) {
      prevImage();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imagesList.length <= 1) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagesList.length, activeImageIndex]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/product/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: shareUrl,
        });
      } catch (err) {
        const success = await copyToClipboard(shareUrl);
        if (success) toast.success('Link copied to clipboard');
      }
    } else {
      const success = await copyToClipboard(shareUrl);
      if (success) toast.success('Link copied to clipboard');
    }
  };

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch public settings for WhatsApp number
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data.general))
      .catch(err => console.error('Failed to fetch settings:', err));

    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
        
        if (data.colors && data.colors.length > 0) {
          if (data.colors.length === 1) {
            setSelectedColor(data.colors[0]);
          } else {
            // Require explicit color selection when more than 1 color option exists
            setSelectedColor(null);
          }
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        
        if (data && data.id) {
          const recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
          const updated = [data, ...recentlyViewed.filter((p: any) => p.id !== data.id)].slice(0, 5);
          localStorage.setItem('recently_viewed', JSON.stringify(updated));
        }

        setActiveImageIndex(0);
      })
      .catch(err => {
        if (err.message === 'Product not found') {
          const recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
          const updated = recentlyViewed.filter((p: any) => p.id !== parseInt(id || '0'));
          localStorage.setItem('recently_viewed', JSON.stringify(updated));
        }
        console.error('Fetch error:', err);
        setLoading(false);
        setProduct(null);
      });

    fetch(`/api/products/${id}/similar`)
      .then(res => res.json())
      .then(data => setSimilarProducts(data))
      .catch(err => console.error('Failed to fetch similar products:', err));
  }, [id]);

  if (isBogoActive) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
          <Zap className="w-4 h-4 fill-amber-500" /> BUY 1 GET 1 FREE FLASH DEAL IS LIVE!
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {campaign?.bannerText || 'BUY 1 GET 1 FREE FLASH DEAL'}
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          Loading flash deal benefits and securing promotion slot... Product page is temporarily locked during the active flash window and will automatically unlock once this offer ends!
        </p>

        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border border-amber-400/40 dark:border-amber-500/30 rounded-2xl p-4 w-full max-w-xs shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300 mb-1">
            Flash Deal Ends In
          </p>
          <div className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400 tracking-wider">
            {formattedRemainingTime}
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-8 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          ← Return to Store Home
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
      />
      <p className="font-bold text-gray-500">Loading product details...</p>
    </div>
  );

  if (!product) return (
    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-300">
        <Package className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Product Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
        The product you are looking for might have been removed or is temporarily unavailable.
      </p>
      <Link 
        to="/" 
        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        Back to Shopping
      </Link>
    </div>
  );

  const isFavorite = isInWishlist(product.id);
  const regularPrice = parseFloat(product.sellingPrice);
  const premiumPrice = product.premiumPrice ? parseFloat(product.premiumPrice) : Math.round(regularPrice * 0.75);
  const unitPrice = isMember ? premiumPrice : regularPrice;
  const originalPrice = parseFloat(product.originalPrice);
  const shipping = isMember ? 0 : parseFloat(product.shippingCharges || '0');
  const additional = parseFloat(product.additionalCharges || '0');
  const platformFee = parseFloat(product.platformFee || '0');
  
  // Exact discount calculation
  const discountPercentage = isMember
    ? (product.premiumDiscountPercent || Math.round(((regularPrice - premiumPrice) / regularPrice) * 100))
    : Math.round(((originalPrice - regularPrice) / originalPrice) * 100);
  const subtotal = unitPrice * quantity;
  const total = subtotal + shipping + additional + platformFee;

  const handleContinue = () => {
    if (product.colors && product.colors.length > 1 && !selectedColor) {
      toast.error('Please select your colour first');
      const el = document.getElementById('color-selection-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Save selected checkout product
    localStorage.removeItem('checkout_items');
    localStorage.setItem('checkout_product', JSON.stringify({ 
      ...product, 
      sellingPrice: unitPrice.toString(),
      regularPrice: regularPrice.toString(),
      premiumPrice: premiumPrice.toString(),
      quantity, 
      selectedColor, 
      selectedSize 
    }));

    // Auto-check if customer is logged in
    if (!isAuthenticated) {
      toast('Please log in with your mobile number to complete your order', { icon: '🔐' });
      openAuthModal('login');
      return;
    }

    navigate('/checkout/address');
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-28 sm:pb-8 max-w-5xl">
      {missedOfferNotice && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white p-4 rounded-2xl mb-6 shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <p className="font-black text-sm">You missed the Buy 1 Get 1 Free offer!</p>
              <p className="text-xs text-white/90">The limited-time flash deal has ended. Regular pricing now applies.</p>
            </div>
          </div>
          <button 
            onClick={dismissMissedNotice} 
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors font-bold text-sm bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative select-none"
        >
          {/* Main Image Slider Viewport */}
          <div 
            className="aspect-square bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 relative group"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Sliding Image Container */}
            <div 
              className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-zoom-in p-4"
              onClick={() => setIsZoomed(true)}
            >
              <AnimatePresence initial={false} custom={slideDirection}>
                <motion.img 
                  key={activeImageIndex}
                  src={imagesList[activeImageIndex] || product.imageUrl} 
                  alt={`${product.name} - image ${activeImageIndex + 1}`} 
                  custom={slideDirection}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 250 : -250,
                      opacity: 0,
                      scale: 0.95
                    }),
                    center: {
                      zIndex: 1,
                      x: 0,
                      opacity: 1,
                      scale: 1
                    },
                    exit: (dir: number) => ({
                      zIndex: 0,
                      x: dir > 0 ? -250 : 250,
                      opacity: 0,
                      scale: 0.95
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 350, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute inset-0 m-auto max-w-full max-h-full object-contain p-4 select-none" 
                  draggable={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Left / Right Slide Arrows (when 2 or more images) */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous Image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white shadow-xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-gray-100 dark:border-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next Image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white shadow-xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-gray-100 dark:border-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter Badge (when 2 or more images) */}
            {imagesList.length > 1 && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-black shadow-md pointer-events-none">
                <Images className="w-3.5 h-3.5 text-indigo-300" />
                <span>{activeImageIndex + 1} / {imagesList.length}</span>
              </div>
            )}
            
            {/* Zoom hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <ZoomIn className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tap to Expand</span>
            </div>

            {/* Top Right: Wishlist & Share buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                className={`p-3.5 rounded-2xl shadow-xl transition-all ${
                  isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 backdrop-blur-md'
                }`}
                title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="p-3.5 rounded-2xl shadow-xl bg-white/90 dark:bg-gray-800/90 text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 backdrop-blur-md transition-all"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Pagination Bullet Dots (when 2 or more images) */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/35 dark:bg-black/60 backdrop-blur-sm">
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectImage(idx);
                    }}
                    className={`transition-all duration-300 h-2 rounded-full ${
                      idx === activeImageIndex 
                        ? 'w-6 bg-indigo-500 shadow-sm' 
                        : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Swipe Hint on Mobile */}
          {imagesList.length > 1 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2 flex items-center justify-center gap-1 font-medium sm:hidden">
              <span>← Swipe left/right to slide ({imagesList.length} photos) →</span>
            </p>
          )}

          {/* Image Gallery Thumbnails Carousel */}
          {imagesList.length > 1 && (
            <div className="flex gap-2.5 mt-3.5 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {imagesList.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectImage(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all snap-start relative ${
                    activeImageIndex === idx 
                      ? 'border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-800 shadow-md scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  {activeImageIndex === idx && (
                    <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6">
            {/* Ratings and Reviews hidden as per request */}
            
            {/* Purchase count hidden as per request */}

            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] italic">Fancy Bazaar</p>
              <div className="flex items-center gap-2">
                {product.isReturnable === false ? (
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1">
                    <Ban className="w-3 h-3 text-red-600" /> Non-Returnable
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-green-600" /> 7 Days Return
                  </div>
                )}
                {product.stock !== null && (
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    product.stock > 10 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                  }`}>
                    {product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? `Only ${product.stock} Left!` : `${product.stock} Left in Stock`}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{product.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{product.description}</p>
            
            {/* Quick Spec Highlights if entered by Admin */}
            {product.specifications && getTopHighlights(product.specifications).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {getTopHighlights(product.specifications).map((item, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-100/60 dark:border-indigo-800/40"
                  >
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{item.label}:</span>
                    <span>{item.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {product.colors && product.colors.length > 0 && (
            <div id="color-selection-section" className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 transition-colors scroll-mt-24">
              
              {/* HIGHLIGHT: Please select your colour (when more than 1 color exists) */}
              {product.colors.length > 1 && (
                <div 
                  className={`mb-4 p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 shadow-md ${
                    selectedColor 
                      ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-500/60 dark:border-emerald-500/60' 
                      : 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/15 border-amber-500 dark:border-amber-400 animate-pulse'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                      selectedColor ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    }`}>
                      {selectedColor ? <Check className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          Please select your colour
                        </span>
                        {!selectedColor && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-bounce shadow-sm">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
                        {selectedColor ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            Selected Colour: <strong className="underline text-sm">{selectedColor}</strong>
                          </span>
                        ) : (
                          'Please choose your preferred colour from the options below'
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedColor ? (
                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  ) : (
                    <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-md animate-bounce shrink-0">
                      Select
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Choose Color {product.colors.length > 1 ? `(${product.colors.length} Available)` : ''}
                </h3>
                {selectedColor && (
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    Selected: {selectedColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 flex items-center gap-2 cursor-pointer ${
                      selectedColor === color 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-md scale-105 ring-2 ring-indigo-300 dark:ring-indigo-800' 
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {selectedColor === color && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    <span>{color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 transition-colors">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Choose Size</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-[48px] flex items-center justify-center rounded-xl text-sm font-bold transition-all border-2 ${
                      selectedSize === size 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-md scale-105' 
                        : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 transition-colors">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Select Quantity</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                >
                  <span className="sr-only">Decrease</span>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-black text-gray-900 dark:text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(prev => Math.min(Math.min(10, product.stock || 10), prev + 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                >
                  <span className="sr-only">Increase</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                {product.stock !== null && product.stock < 10 ? `Max ${product.stock} units available` : 'Max 10 units per order'}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl mb-8 border border-indigo-100/50 dark:border-indigo-900/30 transition-colors">
            {isMember ? (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-black text-amber-900 dark:text-amber-300">VIP Member Price Applied</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">Special Discount applied + Free Delivery</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded-full">
                  ↓{discountPercentage}% OFF
                </span>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Total Payable Amount</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">₹{total.toLocaleString()}</span>
                    {originalPrice > unitPrice && (
                      <span className="text-lg text-gray-400 dark:text-gray-500 line-through">₹{(originalPrice * quantity).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {discountPercentage > 0 && !isMember && (
                    <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      ↓{discountPercentage}% OFF
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="font-bold dark:text-white">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Shipping Charges</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{shipping === 0 ? 'FREE' : `+ ₹${shipping}`}</span>
                </div>
                {additional > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Handling Fee</span>
                    <span className="font-bold dark:text-white">+ ₹{additional}</span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Platform Fee</span>
                    <span className="font-bold dark:text-white">+ ₹{platformFee}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Return Policy Notice Banner */}
          {product.isReturnable === false ? (
            <div className="p-4 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 mb-6 transition-colors shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300">
                    Non-Returnable Product
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                    No Return
                  </span>
                </div>
                <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-1 leading-relaxed">
                  This product is non-returnable (No Return Policy). Returns and refunds will not be available after delivery.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50/80 dark:bg-green-950/30 border border-green-200/80 dark:border-green-900/40 rounded-2xl flex items-center gap-2.5 mb-6 transition-colors">
              <RotateCcw className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs font-bold text-green-800 dark:text-green-300">
                7 Days Easy Return Policy: You can request return or replacement within 7 days of delivery.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-center transition-colors">
              <ShieldCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="text-[10px] font-bold text-gray-900 dark:text-white">Secure Payment</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-center transition-colors">
              <Truck className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-[10px] font-bold text-gray-900 dark:text-white">Fast Shipping</p>
            </div>
            {product.isReturnable === false ? (
              <div className="bg-red-50/80 dark:bg-red-950/40 p-3 rounded-2xl border border-red-200 dark:border-red-900/40 text-center transition-colors">
                <Ban className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400">Non-Returnable</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-center transition-colors">
                <RotateCcw className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <p className="text-[10px] font-bold text-gray-900 dark:text-white">7 Days Return</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`px-5 sm:px-6 py-4.5 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm shrink-0 ${
                isFavorite 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-5 h-5 transition-transform active:scale-125 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              <span className="font-bold">{isFavorite ? 'Wishlisted' : 'Wishlist'}</span>
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={product.stock !== null && product.stock <= 0}
              className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-4.5 px-6 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock !== null && product.stock <= 0 ? 'Out of Stock' : (
                <>
                  <Zap className="w-5 h-5 fill-current text-amber-300" />
                  <span>Buy Now</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Product Specifications & Technical Details (Only shows details filled by Admin) */}
      <ProductSpecifications specifications={product.specifications} productName={product.name} />

      {/* Zoom Modal with Slider */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 select-none"
            onClick={() => setIsZoomed(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
              {imagesList.length > 1 && (
                <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-black flex items-center gap-1.5 border border-white/10">
                  <Images className="w-4 h-4 text-indigo-400" />
                  <span>{activeImageIndex + 1} / {imagesList.length}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-30"
              aria-label="Close zoom"
            >
              <X className="w-6 h-6" />
            </button>

            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-30 hover:scale-110 active:scale-90"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-30 hover:scale-110 active:scale-90"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence initial={false} custom={slideDirection}>
                <motion.img
                  key={activeImageIndex}
                  src={imagesList[activeImageIndex] || product.imageUrl}
                  alt={product.name}
                  custom={slideDirection}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 300 : -300,
                      opacity: 0,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                    },
                    exit: (dir: number) => ({
                      x: dir > 0 ? -300 : 300,
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl select-none"
                  draggable={false}
                />
              </AnimatePresence>

              <div className="mt-4 text-center text-white">
                <h2 className="text-lg font-black">{product.name}</h2>
                {imagesList.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {imagesList.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectImage(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === activeImageIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 pt-16 border-t dark:border-gray-800 transition-colors"
      >
        {similarProducts.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Similar Products</h2>
              <div className="h-0.5 flex-grow bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border dark:border-gray-800">You might also like</span>
            </div>
            
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {similarProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${settings?.whatsappSupportNumber || '918870472700'}?text=${encodeURIComponent(`Hi! I have a question about this product: ${product.name}\n${window.location.origin}/product/${product.id}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-40 group flex items-center gap-3"
      >
        <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 hidden sm:block pointer-events-none">
          <p className="text-xs font-black text-gray-900 dark:text-white whitespace-nowrap">Ask about sizing?</p>
        </div>
        <div className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-600 hover:scale-110 active:scale-95 transition-all">
          <MessageCircle className="w-7 h-7 fill-current" />
        </div>
      </a>

      {/* Scroll to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 sm:bottom-8 left-6 sm:left-auto sm:right-6 z-30 p-3.5 sm:p-4 bg-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-50 pointer-events-none'}`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Sticky Bottom Action Bar for Mobile: Wishlist on Left, Buy Now on Right */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 sm:hidden shadow-2xl flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 font-bold text-xs shrink-0 ${
            isFavorite 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
          title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          <span>{isFavorite ? 'Wishlisted' : 'Wishlist'}</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={product.stock !== null && product.stock <= 0}
          className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock !== null && product.stock <= 0 ? 'Out of Stock' : (
            <>
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>Buy Now</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
