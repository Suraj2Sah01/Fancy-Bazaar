import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import ImageSlider from '../components/ImageSlider';
import CustomerAwardsSlider from '../components/CustomerAwardsSlider';
import ProductCard from '../components/ProductCard';
import ProductSearchAutoSuggest from '../components/ProductSearchAutoSuggest';
import { Filter, X, ChevronDown, Star, IndianRupee, CheckCircle2, Search, ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const location = useLocation();

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'lowToHigh' | 'highToLow' | 'rating'>('newest');
  const [isVisible, setIsVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Optimization: Defer search query to keep typing smooth
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const handleScroll = () => {
      // Only apply on mobile screens
      if (window.innerWidth >= 1024) {
        setIsVisible(true);
        return;
      }
      
      const currentScrollY = window.scrollY;
      
      setLastScrollY(prev => {
        if (currentScrollY > prev && currentScrollY > 50) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        return currentScrollY;
      });

      if (currentScrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location.search]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
    
    const stored = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    setRecentlyViewed(stored);
  }, []);

  // Optimization: Use useMemo for filtered results
  const filteredProducts = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);

    const filtered = products.filter(p => {
      const price = parseFloat(p.sellingPrice);
      const rating = parseFloat(p.averageRating || '0');
      
      const categoryMatch = (!query && selectedCategory !== 'All') ? p.category === selectedCategory : true;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];
      const ratingMatch = rating >= minRating;
      
      if (!priceMatch || !ratingMatch) return false;
      if (!query && !categoryMatch) return false;

      if (!query) return true;

      const targetText = `${p.name} ${p.description || ''} ${p.category || ''}`.toLowerCase();
      return queryWords.some(word => targetText.includes(word)) || targetText.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const priceA = parseFloat(a.sellingPrice);
      const priceB = parseFloat(b.sellingPrice);
      const ratingA = parseFloat(a.averageRating || '0');
      const ratingB = parseFloat(b.averageRating || '0');

      if (sortBy === 'lowToHigh') return priceA - priceB;
      if (sortBy === 'highToLow') return priceB - priceA;
      if (sortBy === 'rating') return ratingB - ratingA;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [products, priceRange, selectedCategory, minRating, deferredSearchQuery, sortBy]);

  const categories = [
    'All', 'Sarees', 'Kurtis & Suits', 'Beauty', 'Home Decor', 
    'MEN Fashion', 'Kids', 'Kitchen', 'Jewellery', 'Bag & Accessories', 
    'Innerwear', 'Footwear', 'Healthcare', 'Lehengas & Blouses', 
    'Case & Cover', 'Furniture', 'Sports & Fitness'
  ];

  return (
    <div className="pb-12 bg-gray-50/50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      {/* Sticky Search Bar Header */}
      <div className="sticky top-0 z-[60] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-3 shadow-sm transition-colors">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <ProductSearchAutoSuggest
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            products={products}
            placeholder="Search products by name, category, brand..."
            onSearchSubmit={(val) => setSearchQuery(val)}
          />
          <div className="relative shrink-0 hidden sm:block">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer"
            >
              <option value="newest" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Newest</option>
              <option value="lowToHigh" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Price: Low</option>
              <option value="highToLow" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Price: High</option>
              <option value="rating" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Rating</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <ImageSlider />

      {/* Customer of the Month & Customer of the Year Auto-Slider */}
      <CustomerAwardsSlider />

      {recentlyViewed.length > 0 && (
        <div className="container mx-auto px-4 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Recently Viewed</h2>
            <div className="h-0.5 flex-grow bg-gray-100 dark:bg-gray-800" />
            <button 
              onClick={() => {
                localStorage.removeItem('recently_viewed');
                setRecentlyViewed([]);
              }}
              className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-6 -mx-4 px-4 snap-x">
            {recentlyViewed.map((product: any) => (
              <div key={product.id} className="w-[160px] md:w-[240px] shrink-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Drawer */}
          <aside className={`
            fixed inset-0 z-[100] lg:relative lg:z-0 lg:block lg:w-64 shrink-0
            ${isFilterOpen ? 'block' : 'hidden'}
          `}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setIsFilterOpen(false)} />
            
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-[280px] bg-white dark:bg-gray-900 lg:bg-transparent lg:static lg:max-w-none p-6 lg:p-0 overflow-y-auto">
              <div className="flex items-center justify-between lg:hidden mb-6">
                <h3 className="font-black text-xl dark:text-white">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>

              <div className="space-y-8 sticky top-24">
                {/* Category Filter */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                          selectedCategory === cat 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Price Range</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                      <span>₹0</span>
                      <span>₹{priceRange[1]}+</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="10000" 
                      step="500"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-indigo-600"
                    />
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Max Budget</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Customer Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                          minRating === rating 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="flex text-yellow-400">
                            {[...Array(rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                          </span>
                          <span className="text-xs">& Up</span>
                        </div>
                        {minRating === rating && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                    <button
                      onClick={() => setMinRating(0)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                        minRating === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      All Ratings
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setSelectedCategory('All');
                    setMinRating(0);
                    setSearchQuery('');
                  }}
                  className="w-full py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors border-t border-dashed"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {selectedCategory === 'All' ? 'Featured Products' : selectedCategory}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                  Exclusive Collection
                </p>
              </div>
              <div className="h-0.5 flex-grow mx-4 bg-gray-100 dark:bg-gray-800 hidden sm:block" />
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full whitespace-nowrap">
                  {priceRange[1] < 10000 ? `Under ₹${priceRange[1]}` : 'Best Sellers'}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl h-64 animate-pulse border border-gray-100 dark:border-gray-800 shadow-sm" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 transition-colors">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">No products match your filters</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your budget or category selection.</p>
                <button 
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setSelectedCategory('All');
                    setMinRating(0);
                    setSearchQuery('');
                  }}
                  className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter & Sort Float */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 lg:hidden transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="bg-indigo-600 text-white w-20 h-9 rounded-full font-black shadow-2xl flex items-center justify-center gap-1 border-2 border-white dark:border-gray-900 transition-transform active:scale-95"
        >
          <Filter className="w-3 h-3" />
          <span className="text-[9px] uppercase tracking-tighter">Filter</span>
        </button>
        <div className="bg-white dark:bg-gray-800 w-20 h-9 rounded-full shadow-2xl border-2 border-white dark:border-gray-900 flex items-center justify-center transition-transform active:scale-95 overflow-hidden">
          <select 
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-transparent text-[9px] font-black uppercase tracking-tighter px-1 py-2 outline-none text-gray-900 dark:text-white w-full text-center appearance-none"
          >
            <option value="newest" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">New</option>
            <option value="lowToHigh" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">₹ Low</option>
            <option value="highToLow" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">₹ High</option>
            <option value="rating" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Best</option>
          </select>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-50 pointer-events-none'}`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
