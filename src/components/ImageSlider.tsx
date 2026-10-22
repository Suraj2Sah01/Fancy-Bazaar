import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: number;
  imageUrl: string;
  title?: string;
  destinationUrl?: string;
}

export default function ImageSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => setBanners(data));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (banners.length === 0) {
    return (
      <div className="aspect-[21/9] bg-gray-200 animate-pulse flex items-center justify-center rounded-xl mx-4 mt-4">
        <span className="text-gray-400">Loading offers...</span>
      </div>
    );
  }

  const next = () => setCurrentIndex(prev => (prev + 1) % banners.length);
  const prev = () => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="relative aspect-[21/9] overflow-hidden bg-gray-100 mx-4 mt-4 rounded-2xl group shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="absolute inset-0"
        >
          <img
            src={banners[currentIndex].imageUrl}
            alt={banners[currentIndex].title || 'Banner'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop';
            }}
          />
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
