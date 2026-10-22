import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Share2, ChevronLeft, ChevronRight, Crown, Sparkles } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useMembership } from '../context/MembershipContext';
import { useBogo } from '../context/BogoContext';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import { motion } from 'motion/react';

interface Product {
  id: number;
  name: string;
  description?: string;
  originalPrice: string;
  sellingPrice: string;
  premiumPrice?: string;
  premiumDiscountPercent?: number;
  imageUrl?: string;
  images?: string[];
  discountValue?: string;
  discountType?: string;
  shippingCharges?: string;
  category?: string;
  averageRating?: string;
  badge?: string;
  isReturnable?: boolean;
}

const ProductCard = memo(({ product }: { product: Product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isMember } = useMembership();
  const { isBogoActive } = useBogo();
  const isFavorite = isInWishlist(product.id);
  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images.filter(Boolean) 
    : [product.imageUrl];
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${product.id}`;
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

  const discountPercentage = Math.round(
    ((parseFloat(product.originalPrice) - parseFloat(product.sellingPrice)) / parseFloat(product.originalPrice)) * 100
  );

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Trending': return 'bg-amber-500';
      case 'Bestseller': return 'bg-indigo-600';
      case 'Fancy Choice': return 'bg-rose-500';
      case 'Recommended': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group relative flex flex-col h-full"
    >
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isFavorite 
              ? 'bg-red-50 dark:bg-red-900/30 text-red-500' 
              : 'bg-white/70 dark:bg-black/40 text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleShare}
          className="p-1.5 rounded-full backdrop-blur-md bg-white/70 dark:bg-black/40 text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <img
          src={images[currentIdx] || product.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
          }}
        />

        {/* Carousel arrows when multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/85 dark:bg-black/70 text-gray-800 dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/85 dark:bg-black/70 text-gray-800 dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow"
              aria-label="Next image"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[8px] font-black text-white">
              {currentIdx + 1}/{images.length}
            </div>
            <div className="absolute bottom-1.5 right-2 z-10 flex gap-1">
              {images.map((_, i) => (
                <span 
                  key={i} 
                  className={`h-1 rounded-full transition-all ${i === currentIdx ? 'w-3 bg-indigo-600' : 'w-1 bg-gray-400/60'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Dynamic Badges */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {isBogoActive && (
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md animate-pulse border border-yellow-300/40 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> BUY 1 GET 1 FREE
            </span>
          )}
          {product.badge && (
            <span className={`${getBadgeColor(product.badge)} text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm`}>
              {product.badge}
            </span>
          )}
          {product.isReturnable === false && (
            <span className="bg-red-600/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
              No Return
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <div className="mb-1">
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest italic">Fancy Bazaar</p>
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-bold text-gray-800 dark:text-white text-xs line-clamp-2 leading-tight min-h-[2.5em]">
              {product.name}
            </h3>
          </Link>
        </div>



        <div className="mt-auto">
          {isMember ? (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black flex items-center gap-1 border border-amber-500/20">
                  <Crown className="w-2.5 h-2.5 text-amber-500" /> VIP PRICE
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-[11px] font-black">
                  ↓{product.premiumDiscountPercent ? `${product.premiumDiscountPercent}%` : `${Math.round(((parseFloat(product.sellingPrice) - (parseFloat(product.premiumPrice || product.sellingPrice))) / parseFloat(product.sellingPrice)) * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                  ₹{(product.premiumPrice ? parseFloat(product.premiumPrice) : Math.round(parseFloat(product.sellingPrice) * 0.75)).toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 line-through">
                  ₹{parseFloat(product.sellingPrice).toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">
                Saved ₹{Math.round(parseFloat(product.sellingPrice) - (product.premiumPrice ? parseFloat(product.premiumPrice) : Math.round(parseFloat(product.sellingPrice) * 0.75))).toLocaleString()} (Special Discount)
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-green-600 dark:text-green-400 text-xs font-bold">↓{discountPercentage}%</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through">₹{parseFloat(product.originalPrice).toLocaleString()}</span>
                <span className="text-sm font-black text-gray-900 dark:text-white">₹{parseFloat(product.sellingPrice).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;
