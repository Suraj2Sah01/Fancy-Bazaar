import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, ChevronRight } from 'lucide-react';

export default function BrandIntroScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; size: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Check if customer is on checkout, payment, or admin dashboard
    const currentPath = window.location.pathname;
    if (
      currentPath.startsWith('/checkout') || 
      currentPath.startsWith('/order') || 
      currentPath.startsWith('/dashboard') || 
      currentPath.startsWith('/secure-payments')
    ) {
      return;
    }

    // Check if intro has already been shown in this browser session
    const hasSeenIntro = sessionStorage.getItem('fb_brand_intro_played');
    if (hasSeenIntro) {
      return;
    }

    // Check accessibility: prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      sessionStorage.setItem('fb_brand_intro_played', 'true');
      return;
    }

    // Generate random ambient golden particles (lightweight)
    const newParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: Math.random() * 95 + 2.5,
      top: Math.random() * 90 + 5,
      size: Math.random() * 3 + 1.5,
      delay: Math.random() * 1.5,
      duration: Math.random() * 2 + 2,
    }));
    setParticles(newParticles);
    setIsVisible(true);

    // Auto-dismiss after 3 seconds with smooth transition
    const timer = setTimeout(() => {
      dismissIntro();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismissIntro = () => {
    sessionStorage.setItem('fb_brand_intro_played', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="brand-intro-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } 
          }}
          className="fixed inset-0 z-[9999] bg-[#050506] flex flex-col items-center justify-center select-none overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 48%, rgba(212, 160, 23, 0.15) 0%, rgba(138, 92, 10, 0.05) 45%, rgba(5, 5, 6, 1) 75%)'
          }}
        >
          {/* Ambient Golden Light Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.85, 0],
                  scale: [0.5, 1.3, 0.8],
                  y: [-10, -50],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-full"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: 'radial-gradient(circle, #FFE494 0%, #D4A017 60%, rgba(212, 160, 23, 0) 100%)',
                  boxShadow: `0 0 ${p.size * 3}px rgba(245, 197, 66, 0.8)`,
                }}
              />
            ))}

            {/* Glowing Golden Ambient Center Rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.25, 1.1],
                opacity: [0, 0.35, 0.15]
              }}
              transition={{ duration: 2.8, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full border border-amber-500/20 pointer-events-none blur-sm"
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ 
                scale: [0.6, 1.05, 0.95],
                opacity: [0, 0.5, 0.25]
              }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[360px] h-[240px] sm:h-[360px] rounded-full border border-amber-400/30 pointer-events-none"
            />
          </div>

          {/* Quick Skip Button in Top Right */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={dismissIntro}
            className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-amber-500/20 text-amber-200/70 hover:text-amber-200 text-xs font-medium flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
          >
            <span>Skip</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>

          {/* Center Brand Identity */}
          <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-lg">
            
            {/* Golden Logo Emblem */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {/* Outer Golden Glow Shadow */}
              <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
              
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#996515] via-[#FFD700] to-[#FFF3B0] p-[2px] shadow-2xl shadow-amber-500/30">
                <div className="w-full h-full bg-[#0d0d10] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                  {/* Subtle Shimmer highlight sweep */}
                  <motion.div
                    initial={{ x: '-150%' }}
                    animate={{ x: '150%' }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', repeatDelay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[#FFD700] filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.5)]" />
                </div>
              </div>

              {/* Sparkle Accent */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0] }}
                transition={{ delay: 0.6, duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute -top-1 -right-1 text-amber-300"
              >
                <Sparkles className="w-5 h-5 fill-amber-300" />
              </motion.div>
            </motion.div>

            {/* Brand Title: "FANCY BAZAAR" */}
            <motion.div
              initial={{ opacity: 0, y: 15, letterSpacing: '0.15em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F5D061] via-[#FFF3B0] to-[#E5A823] tracking-[0.25em] sm:tracking-[0.32em] drop-shadow-[0_4px_16px_rgba(245,208,97,0.35)]">
                FANCY BAZAAR
              </h1>
            </motion.div>

            {/* Decorative Separator Line */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '140px', opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
              className="h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent my-3.5 sm:my-4"
            />

            {/* Tagline: "Your Style, Your Choice" */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7, ease: 'easeOut' }}
            >
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#E8C882]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Your Style, Your Choice
              </p>
            </motion.div>

          </div>

          {/* 3-Second Golden Progress Bar at bottom */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]"
            />
          </div>

          {/* Bottom subtle copyright / boutique note */}
          <div className="absolute bottom-4 text-[10px] uppercase font-bold tracking-[0.25em] text-amber-500/40">
            Exclusive Collection • Premium Shopping
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
