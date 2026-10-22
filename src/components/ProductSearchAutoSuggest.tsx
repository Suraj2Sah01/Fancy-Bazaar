import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Star, ChevronRight, Tag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductSearchAutoSuggestProps {
  value: string;
  onChange: (value: string) => void;
  products?: any[];
  placeholder?: string;
  className?: string;
  onSearchSubmit?: (query: string) => void;
}

// Highlight matching search term within product name or category
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-900/40 px-1 py-0.5 rounded"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

const POPULAR_SEARCHES = ['Smartwatch', 'Sarees', 'Kurtis', 'Earbuds', 'Fashion', 'Home Decor'];

export default function ProductSearchAutoSuggest({
  value,
  onChange,
  products: initialProducts,
  placeholder = 'Search products by name, category...',
  className = '',
  onSearchSubmit
}: ProductSearchAutoSuggestProps) {
  const navigate = useNavigate();
  const [internalProducts, setInternalProducts] = useState<any[]>(initialProducts || []);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If products were not supplied as props, fetch them lazily on focus
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setInternalProducts(initialProducts);
    } else if (internalProducts.length === 0) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setInternalProducts(data.filter((p: any) => p.isPublished && p.availability));
          }
        })
        .catch(() => {});
    }
  }, [initialProducts]);

  // Click outside detection to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter relevant suggestions
  const suggestions = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q) return [];

    const words = q.split(/\s+/).filter(Boolean);

    return internalProducts
      .filter((p: any) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return words.every((w: string) => name.includes(w) || desc.includes(w) || cat.includes(w));
      })
      .slice(0, 6); // Max 6 rich suggestions for fast scanning
  }, [internalProducts, value]);

  const handleSelectProduct = (product: any) => {
    setIsOpen(false);
    navigate(`/product/${product.id}`);
  };

  const handleApplySearch = (queryText: string) => {
    onChange(queryText);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(queryText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectProduct(suggestions[selectedIndex]);
      } else {
        handleApplySearch(value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative flex-grow ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Search className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500/30 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 dark:text-white transition-all outline-none shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Auto-Suggest Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] transition-colors"
          >
            {value.trim().length > 0 ? (
              // When user has typed query
              suggestions.length > 0 ? (
                <div>
                  <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Product Suggestions ({suggestions.length})
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Press ↑ ↓ to navigate, Enter to view
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[380px] overflow-y-auto">
                    {suggestions.map((product: any, idx: number) => {
                      const isSelected = selectedIndex === idx;
                      const originalPrice = parseFloat(product.originalPrice || '0');
                      const sellingPrice = parseFloat(product.sellingPrice || '0');
                      const discountPercentage = originalPrice > sellingPrice 
                        ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) 
                        : 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-3 sm:px-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-white' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                            <img
                              src={product.imageUrl || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop';
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                <HighlightMatch text={product.name} query={value} />
                              </h4>
                              {product.badge && (
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                  {product.badge}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              {product.category && (
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5 text-gray-400" />
                                  <HighlightMatch text={product.category} query={value} />
                                </span>
                              )}

                              {parseFloat(product.averageRating || '0') > 0 && (
                                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {product.averageRating}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                                ₹{sellingPrice.toLocaleString()}
                              </span>
                              {discountPercentage > 0 && (
                                <span className="hidden sm:inline-block text-[9px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1 py-0.5 rounded">
                                  ↓{discountPercentage}%
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center justify-end gap-0.5 group-hover:text-indigo-600">
                              View <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* View all results button */}
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleApplySearch(value)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200 dark:border-gray-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Show all products matching "{value}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                // No matches state
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    No matching products found for "{value}"
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                    Try searching with another keyword or explore popular categories below:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    {POPULAR_SEARCHES.slice(0, 4).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleApplySearch(term)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              // When input is focused but empty: Show Trending / Popular suggestions
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Popular Product Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleApplySearch(term)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Search className="w-3 h-3 opacity-50" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
