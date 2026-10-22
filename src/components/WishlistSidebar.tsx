import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, Trash2, ChevronRight, ShoppingCart, Lock } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { Link, useNavigate } from 'react-router-dom';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistSidebar({ isOpen, onClose }: WishlistSidebarProps) {
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 z-[101] shadow-2xl flex flex-col transition-colors"
          >
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 dark:text-white leading-none">Wishlist</h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Private • {wishlist.length} Items Saved
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-200 dark:text-gray-700">
                    <Heart className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Your wishlist is empty</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[200px] mx-auto mt-1">
                      Save items you like to view them later.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {wishlist.map((product) => (
                    <div key={product.id} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                        <img
                          src={product.imageUrl || 'https://via.placeholder.com/200'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</h4>
                          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            ₹{parseFloat(product.sellingPrice).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              localStorage.setItem('checkout_product', JSON.stringify({ ...product, quantity: 1 }));
                              onClose();
                              navigate('/checkout/address');
                            }}
                            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Checkout
                          </button>
                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="text-xs font-bold text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {wishlist.length > 0 && (
              <div className="p-5 border-t dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-md transition-colors space-y-3">
                <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Total Products ({wishlist.length}):</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ₹{wishlist.reduce((acc, p: any) => acc + (parseFloat(p.sellingPrice) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Estimated Delivery:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">FREE Delivery</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Total Order Amount:
                    </span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      ₹{wishlist.reduce((acc, p: any) => acc + (parseFloat(p.sellingPrice) || 0) + (parseFloat(p.shippingCharges || '0') || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const itemsToOrder = wishlist.map((p: any) => ({
                      ...p,
                      quantity: 1,
                      selectedColor: p.colors && p.colors.length > 0 ? p.colors[0] : null,
                      selectedSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : null
                    }));
                    const totalSum = itemsToOrder.reduce((acc, p: any) => acc + (parseFloat(p.sellingPrice) || 0) + (parseFloat(p.shippingCharges || '0') || 0), 0);
                    localStorage.setItem('checkout_items', JSON.stringify(itemsToOrder));
                    localStorage.setItem('checkout_product', JSON.stringify({
                      ...wishlist[0],
                      isMultiOrder: true,
                      itemsCount: wishlist.length,
                      combinedTotal: totalSum
                    }));
                    onClose();
                    navigate('/checkout/address');
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white py-4 px-4 rounded-2xl font-black text-base shadow-xl shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5 text-amber-300 fill-current" />
                  <span>
                    {wishlist.length > 1 ? `Order All ${wishlist.length} Items Together` : 'Proceed to Checkout'}
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center uppercase font-bold tracking-widest">
                  ⚡ All wishlist products will be ordered together at once
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
