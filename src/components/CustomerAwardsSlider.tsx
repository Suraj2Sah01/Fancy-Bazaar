import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, ChevronLeft, ChevronRight, Award, Star, Gift, MapPin } from 'lucide-react';

interface CustomerProfile {
  title: string;
  name: string;
  location?: string;
  reward?: string;
  avatar?: string;
}

interface CustomerAwardsData {
  enabled: boolean;
  monthCustomer: CustomerProfile;
  yearCustomer: CustomerProfile;
}

const DEFAULT_AWARDS: CustomerAwardsData = {
  enabled: true,
  monthCustomer: {
    title: 'Customer of the Month',
    name: 'Rohan Verma',
    location: 'Patna, Bihar',
    reward: 'Top Shopper of the Month • ₹1,000 Gift Voucher',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
  },
  yearCustomer: {
    title: 'Customer of the Year',
    name: 'Pooja Sharma',
    location: 'Jaipur, Rajasthan',
    reward: 'VIP Diamond Member • Annual Gold Trophy & Gift Hamper',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400'
  }
};

export default function CustomerAwardsSlider() {
  const [awards, setAwards] = useState<CustomerAwardsData>(DEFAULT_AWARDS);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = Month, 1 = Year
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/customer-awards')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setAwards({
            enabled: data.enabled !== false,
            monthCustomer: {
              ...DEFAULT_AWARDS.monthCustomer,
              ...(data.monthCustomer || {})
            },
            yearCustomer: {
              ...DEFAULT_AWARDS.yearCustomer,
              ...(data.yearCustomer || {})
            }
          });
        }
      })
      .catch(() => {});
  }, []);

  // Auto-slide effect every 4 seconds
  useEffect(() => {
    if (!awards.enabled || isPaused) return;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev === 0 ? 1 : 0));
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [awards.enabled, isPaused]);

  if (!awards.enabled) return null;

  const slides = [
    {
      key: 'month',
      badge: 'CUSTOMER OF THE MONTH',
      badgeSubtitle: 'Top Shopper of the Month',
      icon: Trophy,
      data: awards.monthCustomer,
      theme: {
        wrapperBg: 'from-amber-500/10 via-orange-500/5 to-indigo-500/10 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-indigo-950/40',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30',
        ringBorder: 'border-amber-400 dark:border-amber-500',
        pillActive: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
        accentText: 'text-amber-600 dark:text-amber-400',
        glowColor: 'bg-amber-400/20',
        sparkle: 'text-amber-400'
      }
    },
    {
      key: 'year',
      badge: 'CUSTOMER OF THE YEAR',
      badgeSubtitle: 'Top Shopper of the Year',
      icon: Crown,
      data: awards.yearCustomer,
      theme: {
        wrapperBg: 'from-purple-500/10 via-pink-500/5 to-amber-500/10 dark:from-purple-950/40 dark:via-pink-950/20 dark:to-amber-950/40',
        badgeBg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-purple-500/30',
        ringBorder: 'border-purple-400 dark:border-pink-500',
        pillActive: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30',
        accentText: 'text-purple-600 dark:text-pink-400',
        glowColor: 'bg-pink-400/20',
        sparkle: 'text-pink-400'
      }
    }
  ];

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.icon;

  const goToSlide = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev === 0 ? 1 : 0));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev === 0 ? 1 : 0));
  };

  return (
    <div className="container mx-auto px-4 mt-3 sm:mt-4">
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900 shadow-md hover:shadow-lg transition-all"
      >
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-400/10 blur-3xl pointer-events-none" />

        {/* Header Tabs / Quick Switchers */}
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
              Fancy Bazaar Hall of Fame
            </span>
          </div>

          {/* 1 & 2 Auto-Slide Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => goToSlide(0)}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentIndex === 0 
                  ? slides[0].theme.pillActive 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Click to view Customer of the Month"
            >
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>1. Customer of Month</span>
            </button>

            <button
              onClick={() => goToSlide(1)}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentIndex === 1 
                  ? slides[1].theme.pillActive 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Click to view Customer of the Year"
            >
              <Crown className="w-3 h-3 text-pink-300" />
              <span>2. Customer of Year</span>
            </button>
          </div>
        </div>

        {/* Main Animated Slide Container */}
        <div className="relative min-h-[110px] sm:min-h-[120px] flex items-center p-3.5 sm:p-5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide.key}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full flex items-center justify-between gap-3 sm:gap-6"
            >
              {/* Left Side: Avatar with Award Badge */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl overflow-hidden p-0.5 border-2 shadow-md relative bg-gradient-to-br from-amber-300 to-orange-500">
                  <img
                    src={currentSlide.data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'}
                    alt={currentSlide.data.name}
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';
                    }}
                  />
                </div>
                {/* Floating Award Icon */}
                <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white shadow-lg ${
                  currentIndex === 0 ? 'bg-amber-500' : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                }`}>
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Center: Award Title & Customer Name */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Top Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 ${currentSlide.theme.badgeBg}`}>
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {currentSlide.badge}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
                    • {currentSlide.badgeSubtitle}
                  </span>
                </div>

                {/* Main Customer Name (admin configured) */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                    {currentSlide.data.name || 'Honored Shopper'}
                  </h3>
                  {currentSlide.data.location && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {currentSlide.data.location}
                    </span>
                  )}
                </div>

                {/* Reward / Perk Text */}
                {currentSlide.data.reward && (
                  <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1.5 truncate">
                    <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{currentSlide.data.reward}</span>
                  </p>
                )}
              </div>

              {/* Right Side: Subtle Navigation Arrows */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom subtle auto-slide progress line */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ width: '0%' }}
            animate={{ width: isPaused ? '50%' : '100%' }}
            transition={{ duration: isPaused ? 0 : 4, ease: 'linear' }}
            className={`h-full ${
              currentIndex === 0 
                ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
